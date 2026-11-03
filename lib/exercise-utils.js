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

  // Faz 4 / D5: 902 KB'lık rehber verisi (data/ex-guides.js) açılışta değil, ilk önizlemede yüklenir.
  // Tekrarlanan çağrılar aynı Promise'i döndürür; zaten yüklüyse hemen çözülür. Hata olursa sonraki çağrı yeniden dener.
  let _guidesPromise = null;
  function loadGuides() {
    if (window.LOGWISE_EX_GUIDES) return Promise.resolve(window.LOGWISE_EX_GUIDES);
    if (_guidesPromise) return _guidesPromise;
    if (typeof document === "undefined") return Promise.resolve({});
    _guidesPromise = new Promise((resolve, reject) => {
      const sc = document.createElement("script");
      sc.src = "/data/ex-guides.js";
      sc.async = true;
      sc.onload = () => resolve(window.LOGWISE_EX_GUIDES || {});
      sc.onerror = () => { _guidesPromise = null; sc.remove(); reject(new Error("guides")); };
      document.head.appendChild(sc);
    });
    return _guidesPromise;
  }

  // Faz 5 / D6: hazır hareketlerin eski (yazım hatalı) görünen adları. Kullanıcı verisinde bu adlar kalmış olabilir;
  // id'ler değişmedi. Kullanıcı hareketi yeniden adlandırmadıysa ad, o anki dilde hazır listeden gösterilir.
  const LEGACY_PRESET_NAMES = {
    "dumbell-press": ["Dumbell Press"],
    "incline-dumbell-press": ["Incline Dumbell Press", "İncline Dumbell Press"],
    "dumbell-fly": ["Dumbell Fly"],
    "incline-dumbell-fly": ["Incline Dumbell Fly"],
    "incline-bench-press": ["İncline Bench Press"],
    "incline-dumbell-curl": ["Incline Dumbell Curl"],
    "dumbell-row": ["Dumbell Row"]
  };
  function isDefaultPresetName(presetId, name) {
    const p = getExerciseById(presetId);
    if (!p || !name) return false;
    const n = String(name).trim();
    return n === p.name || (!!p.nameEN && n === p.nameEN) || (LEGACY_PRESET_NAMES[presetId] || []).includes(n);
  }

  window.LOGWISE_EX_UTILS = {
    isDefaultPresetName,
    getExerciseById,
    getExerciseByName,
    nameToId,
    resolveKey,
    loadGuides
  };
})();
