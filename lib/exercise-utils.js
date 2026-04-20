// LogWise — Exercise Lookup & Slug Utilities (Faz EX-ID)
// window.LOGWISE_EX_UTILS namespace.
//
// Bu modül, preset hareketleri hem id (slug) hem isim (TR/EN) ile bulmayı sağlar.
// Veri dosyaları (ex-descriptions.js, ex-preview.js) **id** ile anahtarlanıyor.
// Ancak kullanıcı verisi (eski kayıtlar) hâlâ **name** taşıyor — backward compat için
// `resolveKey(nameOrId)` her iki durumu da handle eder.
//
// Bağımlılıklar (runtime'da çözülür):
//   - window.LOGWISE_PRESET_EXERCISES — preset hareket listesi (id, name, nameEN, categories)
//
// Kullanım:
//   const ex = window.LOGWISE_EX_UTILS.getExerciseById("bench-press");
//   const ex = window.LOGWISE_EX_UTILS.getExerciseByName("Bench Press");
//   const id = window.LOGWISE_EX_UTILS.nameToId("İncline Dumbell Press"); // → "incline-dumbell-press"
//   const key = window.LOGWISE_EX_UTILS.resolveKey("Bench Press"); // → "bench-press" (lookup için)
(function () {
  // Dahili cache — tekrar tekrar aynı listeyi taramayalım.
  let _byId = null;
  let _byName = null;

  function _ensureIndex() {
    if (_byId && _byName) return;
    const list = window.LOGWISE_PRESET_EXERCISES || [];
    _byId = new Map();
    _byName = new Map();
    for (const ex of list) {
      if (ex.id) _byId.set(ex.id, ex);
      if (ex.name) _byName.set(ex.name, ex);
      if (ex.nameEN) _byName.set(ex.nameEN, ex);
    }
  }

  function getExerciseById(id) {
    if (!id) return null;
    _ensureIndex();
    return _byId.get(id) || null;
  }

  function getExerciseByName(name) {
    if (!name) return null;
    _ensureIndex();
    return _byName.get(name) || null;
  }

  // name → id çevirisi. İsim eşleşmezse null (kullanıcı özel hareket adı olabilir).
  function nameToId(name) {
    const ex = getExerciseByName(name);
    return ex ? ex.id : null;
  }

  // resolveKey: verilen girdiyi (id VEYA name) EX_DESCS/EX_PREVIEW lookup'ı için
  // uygun id'ye çevirir. Ne id ne de name eşleşirse orijinali döner (legacy key
  // ihtimaline karşı — eski kullanıcı dosyalarında Türkçe isim var olabilir).
  function resolveKey(nameOrId) {
    if (!nameOrId) return null;
    _ensureIndex();
    if (_byId.has(nameOrId)) return nameOrId;
    const ex = _byName.get(nameOrId);
    return ex ? ex.id : nameOrId;
  }

  window.LOGWISE_EX_UTILS = {
    getExerciseById,
    getExerciseByName,
    nameToId,
    resolveKey
  };
})();
