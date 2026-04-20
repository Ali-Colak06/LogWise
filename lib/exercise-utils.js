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

  // Türkçe karakter normalize + kebab-case slug üretici.
  // Preset listesinde eşleşmeyen kullanıcı hareketi için on-the-fly slug üretir.
  function _toSlug(s) {
    if (!s) return "";
    return String(s)
      .toLowerCase()
      .replace(/i̇/g, "i")
      .replace(/ı/g, "i")
      .replace(/ş/g, "s")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // resolveKey: verilen girdiyi (id VEYA name) EX_DESCS/EX_PREVIEW lookup'ı için
  // uygun id'ye çevirir. Sırayla dener:
  //   1. Zaten slug mı (id Map'inde var mı)?
  //   2. name Map'inde tam eşleşme (case-sensitive)
  //   3. name Map'inde case-insensitive eşleşme
  //   4. on-the-fly slug üret + id Map'inde dene
  //   5. Hiçbiri olmazsa orijinali döndür (passthrough — legacy/custom adlar için)
  function resolveKey(nameOrId) {
    if (!nameOrId) return null;
    _ensureIndex();
    // 1
    if (_byId.has(nameOrId)) return nameOrId;
    // 2
    const exact = _byName.get(nameOrId);
    if (exact) return exact.id;
    // 3 — case-insensitive
    const lower = String(nameOrId).toLowerCase();
    for (const [k, v] of _byName) {
      if (k.toLowerCase() === lower) return v.id;
    }
    // 4 — slug normalize
    const slug = _toSlug(nameOrId);
    if (slug && _byId.has(slug)) return slug;
    // 5 — passthrough
    return nameOrId;
  }

  window.LOGWISE_EX_UTILS = {
    getExerciseById,
    getExerciseByName,
    nameToId,
    resolveKey
  };
})();
