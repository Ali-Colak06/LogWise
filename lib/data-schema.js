// LogWise — Veri Şeması ve Migration
// init()         → Boş/varsayılan kullanıcı verisi şablonu (11 anahtar).
// migrateData(d) → Eski şemadan yeni şemaya güvenli geçiş (idempotent).
// Kullanım: const { init, migrateData } = window.LOGWISE_SCHEMA;
// Bağımlılık yok — saf fonksiyonlar.
(function () {
  // Yeni kullanıcı / sıfır veri durumu için boş şablon.
  // Yeni anahtar eklerken migrateData'ya da default ekleme eklenmeli.
  const init = () => ({
    exercises: [],
    workouts: {},
    programs: {},
    dailyPrograms: {},
    activeProgram: null,
    durations: {},
    measurements: {},
    dayNotes: {},
    exerciseNotes: {},
    programMeta: {},
    badges: [],
    exerciseRest: {},
    settings: {}
  });

  // LocalStorage / Supabase'den gelen eski veriyi yeni şemaya uyarlar.
  // Kontrat: d null/undefined ise aynen döner; yoksa objeyi yerinde günceller ve döner.
  //   - Eski `category` string'ini yeni `categories: [category]` dizisine çevirir.
  //   - Sonradan eklenen anahtarları (dailyPrograms, measurements, dayNotes,
  //     exerciseNotes, programMeta, badges) eksikse {} veya [] ile doldurur.
  const migrateData = d => {
    if (!d) return d;
    if (d.exercises) {
      d.exercises = d.exercises.map(e => {
        if (e.category && !e.categories) {
          return {
            ...e,
            categories: [e.category]
          };
        }
        return e;
      });
    }
    if (!d.dailyPrograms) d.dailyPrograms = {};
    if (!d.measurements) d.measurements = {};
    if (!d.dayNotes) d.dayNotes = {};
    if (!d.exerciseNotes) d.exerciseNotes = {};
    if (!d.programMeta) d.programMeta = {};
    // Faz 2: hareket bazında dinlenme süresi (sn) ve kullanıcı ayarları (ör. includeWarmups).
    if (!d.exerciseRest || typeof d.exerciseRest !== "object") d.exerciseRest = {};
    if (!d.settings || typeof d.settings !== "object") d.settings = {};
    if (!d.badges) d.badges = [];
    return d;
  };

  window.LOGWISE_SCHEMA = {
    init,
    migrateData
  };
})();
