// LogWise — DB Layer
// Refactor Aşama 2, Faz 2D — Supabase istemcisi, profil senkron yardımcıları ve route helper'ı.
// Bağımlılıklar (runtime'da çözülür):
//   - window.supabase                — Supabase CDN UMD bundle
//   - window.LOGWISE_PROFILE_UTILS   — buildProfileRow yardımcısı
// Kullanım: window.LOGWISE_DB
// API yüzeyi:
//   sb                 — Supabase client (auth, from, channel, storage)
//   SUPABASE_URL       — URL sabiti (gerekirse dışarıda kullanılır)
//   profileRoute(id?)  — /profile veya /profile.html URL üretici
//   syncProfileRecord(user, overrides?) — profiles tablosunda upsert-benzeri senkron
(function () {
  const SUPABASE_URL = "https://czbxujioufhmvoajqwzp.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Ynh1amlvdWZobXZvYWpxd3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDYzNTgsImV4cCI6MjA5MDA4MjM1OH0._juhkh6W8p0iP3WVSooi1fFfZFXT50LugDszPBubOgk";

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const IS_LOCAL_STATIC = window.location.protocol === "file:" ||
    ["localhost", "127.0.0.1"].includes(window.location.hostname);

  const profileRoute = id =>
    `${IS_LOCAL_STATIC ? "/profile.html" : "/profile"}${id ? `?id=${encodeURIComponent(id)}` : ""}`;

  const syncProfileRecord = async (user, overrides = {}) => {
    if (!user?.id) return { data: null, error: new Error("Missing user") };
    const { buildProfileRow } = window.LOGWISE_PROFILE_UTILS;
    const {
      data: existing,
      error: existingError
    } = await sb.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
    if (existingError) return { data: null, error: existingError };
    const row = buildProfileRow(user, existing || {}, overrides);
    if (existing) {
      return await sb.from("profiles").update(row).eq("user_id", user.id).select("*").single();
    }
    return await sb.from("profiles").insert(row).select("*").single();
  };

  window.LOGWISE_DB = {
    sb,
    SUPABASE_URL,
    profileRoute,
    syncProfileRecord
  };
})();
