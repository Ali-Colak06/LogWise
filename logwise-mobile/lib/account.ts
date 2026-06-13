/**
 * Account bootstrap — authenticated katmanda çalışan tek seferlik hesap işleri.
 *
 * `ensureAppProfile`: email doğrulaması AÇIK iken signUp session döndürmediği için
 * `app_profiles` satırı kayıt anında oluşturulamaz (RLS: session gerekir). İlk
 * girişte (mode='auth') bu fonksiyon, satır YOKSA auth user metadata'sındaki
 * username + display_name ile satırı oluşturur. Var olan satırlara dokunmaz —
 * mevcut kullanıcılarda sürpriz değişiklik olmaz.
 *
 * `(app)/_layout.tsx` mode='auth' olunca çağırır.
 */
import { supabase } from './supabase';

export async function ensureAppProfile(): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) return;
  const userId = session.user.id;

  const { data: existing, error: selErr } = await supabase
    .from('app_profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (selErr) {
    console.warn('[ensureAppProfile] select fail', selErr);
    return;
  }
  if (existing) return; // satır zaten var → dokunma

  const meta = (session.user.user_metadata ?? {}) as {
    username?: unknown;
    display_name?: unknown;
  };
  const username =
    typeof meta.username === 'string' && meta.username.length > 0 ? meta.username : null;
  const displayName =
    typeof meta.display_name === 'string' && meta.display_name.length > 0
      ? meta.display_name
      : null;

  const base = {
    user_id: userId,
    display_name: displayName,
    updated_at: new Date().toISOString(),
  };
  const payload: typeof base & { username?: string } = { ...base };
  if (username) payload.username = username;

  const { error } = await supabase
    .from('app_profiles')
    .upsert(payload, { onConflict: 'user_id' });
  if (error) {
    // Nadir username yarışı (iki kişi onaydan önce aynı adı seçtiyse) → username
    // olmadan oluştur; kullanıcı sonradan belirleyebilir. Hesap girişi engellenmez.
    if (error.code === '23505') {
      await supabase.from('app_profiles').upsert(base, { onConflict: 'user_id' });
      console.warn('[ensureAppProfile] username çakıştı; username olmadan oluşturuldu');
    } else {
      console.warn('[ensureAppProfile] upsert fail', error);
    }
  }
}
