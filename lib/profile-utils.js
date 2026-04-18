// LogWise — Profile/User yardımcı fonksiyonları
// Refactor Aşama 2, Faz 2A — index.html ve profile.html arasında paylaşılan saf yardımcılar.
// Sıfır bağımlılık. window.LOGWISE_PROFILE_UTILS namespace'i altında 5 fonksiyon.
(function () {
  const normalizeUsername = v => String(v || "").trim().toLowerCase();

  const isValidUsername = v => /^[a-z0-9_]{3,20}$/.test(v);

  const defaultDisplayName = user =>
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  const defaultAvatar = user => user?.user_metadata?.avatar || "";

  const buildProfileRow = (user, existing = {}, overrides = {}) => {
    const metaUsername = normalizeUsername(user?.user_metadata?.username);
    const nextUsername = overrides.username !== undefined
      ? normalizeUsername(overrides.username)
      : existing.username || (isValidUsername(metaUsername) ? metaUsername : "");
    return {
      user_id: user.id,
      username: nextUsername || null,
      display_name: overrides.display_name ?? existing.display_name ?? defaultDisplayName(user),
      bio: overrides.bio ?? existing.bio ?? "",
      avatar: overrides.avatar ?? existing.avatar ?? defaultAvatar(user),
      is_public: overrides.is_public ?? existing.is_public ?? true
    };
  };

  window.LOGWISE_PROFILE_UTILS = {
    normalizeUsername,
    isValidUsername,
    defaultDisplayName,
    defaultAvatar,
    buildProfileRow
  };
})();
