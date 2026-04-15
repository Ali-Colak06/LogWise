/**
 * LogWise Image Worker
 * Cloudflare R2 üzerinden resim upload/serve/delete işlemleri.
 *
 * Routes:
 *   GET    /<key>              → Resmi public olarak serve et
 *   PUT    /avatars/<userId>/* → Profil fotoğrafı yükle (auth gerekli)
 *   PUT    /workouts/<userId>/* → Antrenman fotoğrafı yükle (auth gerekli)
 *   DELETE /<key>              → Resmi sil (auth gerekli, sadece kendi klasörü)
 *
 * Auth: Token, Supabase'in kendi /auth/v1/user endpoint'ine sorularak doğrulanır.
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

    const token = authHeader.slice(7);
    let userId;
    try {
      userId = await verifyWithSupabase(token, env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
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

// ── Supabase API ile token doğrulama ────────────────────────────────────────
// JWT algoritmasından (HS256/RS256) bağımsız çalışır.

async function verifyWithSupabase(token, supabaseUrl, anonKey) {
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': anonKey,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Supabase auth error: ${res.status}`);
  }

  const user = await res.json();
  if (!user?.id) throw new Error('No user id in response');
  return user.id;
}
