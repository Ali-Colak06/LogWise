/**
 * LogWise Image Worker
 * Cloudflare R2 üzerinden resim upload/serve/delete işlemleri.
 *
 * Routes:
 *   GET    /<key>              → Resmi public olarak serve et
 *   PUT    /avatars/<userId>/* → Profil fotoğrafı yükle (auth gerekli)
 *   PUT    /workouts/<userId>/* → Antrenman fotoğrafı yükle (auth gerekli)
 *   DELETE /<key>              → Resmi sil (auth gerekli, sadece kendi klasörü)
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || 'https://logwise.fit',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400',
    };

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // ── GET: Public resim serve ──────────────────────────────────────────────
    if (request.method === 'GET') {
      const key = path.slice(1);
      if (!key) {
        return new Response('Not Found', { status: 404, headers: corsHeaders });
      }

      const object = await env.LOGWISE_IMAGES.get(key);
      if (!object) {
        return new Response('Not Found', { status: 404, headers: corsHeaders });
      }

      const headers = new Headers(corsHeaders);
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      headers.set('cache-control', 'public, max-age=31536000, immutable');

      return new Response(object.body, { headers });
    }

    // ── Yazma işlemleri: Auth gerekli ────────────────────────────────────────
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let userId;
    try {
      const token = authHeader.slice(7);
      const payload = await verifyJWT(token, env.SUPABASE_JWT_SECRET);
      userId = payload.sub;
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Invalid token', detail: err.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const key = path.slice(1);

    // Güvenlik: Kullanıcı sadece kendi klasörüne yazabilir/silebilir
    const isOwned =
      key.startsWith(`avatars/${userId}/`) ||
      key.startsWith(`workouts/${userId}/`);

    if (!isOwned) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── PUT: Resim yükle ─────────────────────────────────────────────────────
    if (request.method === 'PUT') {
      const contentType = request.headers.get('Content-Type') || 'image/jpeg';

      // Boyut limiti: 5MB
      const MAX_SIZE = 5 * 1024 * 1024;
      const contentLength = parseInt(request.headers.get('Content-Length') || '0');
      if (contentLength > MAX_SIZE) {
        return new Response(
          JSON.stringify({ error: 'File too large. Max 5MB.' }),
          { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await env.LOGWISE_IMAGES.put(key, request.body, {
        httpMetadata: { contentType },
      });

      const publicUrl = `${env.WORKER_URL}/${key}`;
      return new Response(
        JSON.stringify({ url: publicUrl, key }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── DELETE: Resim sil ────────────────────────────────────────────────────
    if (request.method === 'DELETE') {
      await env.LOGWISE_IMAGES.delete(key);
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  },
};

// ── JWT Doğrulama (Web Crypto API) ──────────────────────────────────────────

async function verifyJWT(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed JWT');

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const data = encoder.encode(`${parts[0]}.${parts[1]}`);
  const signature = base64UrlToBuffer(parts[2]);

  const valid = await crypto.subtle.verify('HMAC', key, signature, data);
  if (!valid) throw new Error('Invalid signature');

  const payload = JSON.parse(
    new TextDecoder().decode(base64UrlToBuffer(parts[1]))
  );

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return payload;
}

function base64UrlToBuffer(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
