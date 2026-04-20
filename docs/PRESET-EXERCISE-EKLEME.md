# Yeni Preset Hareket Ekleme Reçetesi

<!-- SON GÜNCELLEME: 2026-04-20 — DOC-1 -->

Bu belge, LogWise'a yeni bir hazır hareket (preset exercise) nasıl eklenir adım adım anlatır.

> **Not:** Şu anda hareketler isim (name) ile tanımlanır. İleride (Faz EX-ID) ID sistemi eklenecek; bu belge o zaman güncellenecektir.

---

## Etkilenen Dosyalar

Bir hareket eklerken 1 zorunlu + 2 opsiyonel dosya vardır:

| Dosya | Zorunlu? | Amaç |
|---|---|---|
| `data/presets-exercises.js` | ✅ Zorunlu | Hareketin kendisi (isim + kategori) |
| `data/ex-descriptions.js` | Opsiyonel ama önerilir | Kısa açıklama (tek satır, TR+EN) |
| `data/ex-preview.js` | Opsiyonel ama önerilir | Uzun açıklama + ipuçları + (varsa) gif |

Bu üçü arasındaki **anahtar** hareketin `name` alanıdır. Üç dosyada da aynı `name` string'i kullanılır (büyük/küçük harf ve Türkçe karakterler dahil).

---

## 1. `data/presets-exercises.js` — Zorunlu Giriş

Format:

```js
{
  name: "Türkçe İsim",         // zorunlu
  nameEN: "English Name",      // opsiyonel — yoksa name kullanılır
  categories: ["Göğüs"]        // zorunlu — 1 veya daha fazla kategori
}
```

### Kategori Listesi (Sabit)

Kategori isimleri Türkçe kalır; UI'da İngilizceye `CAT_LABELS_EN` ile çevrilir (`index.html` içinde).

`Göğüs`, `Sırt`, `Omuz`, `Biceps`, `Triceps`, `Bacak`, `Trapez`, `Kalça`, `Kalf`, `Boyun`, `Bilek`, `Karın`, `Kardiyo`, `Diğer`

**Yeni kategori ekleme yasak.** UI renkleri, kategori etiketleri ve başka yerlerde dağıtılmış liste var; yeni kategori isterse ayrı bir iş.

### Birden Fazla Kategori

Eğer hareket birden fazla grup çalıştırıyorsa:

```js
{ name: "Şınav", categories: ["Göğüs", "Triceps"] }
```

### Ekleme Yeri

Dosyada benzer kategori hareketlerinin arasına ekle (aynı grup hareketleri bloklar halinde duruyor). Sıralama kullanıcıya görünen preset listeyi etkiler.

---

## 2. `data/ex-descriptions.js` — Kısa Açıklama (Önerilir)

Anahtar olarak hareket ismi, değer olarak `[TR, EN]` dizisi:

```js
"Bench Press": ["Düz bankta barbell press. Temel bileşik hareket.", "Barbell bench press. Fundamental compound."]
```

Kısa tutmak önemli — UI'da tek satır görünür. Tipik uzunluk: 40-80 karakter. Mutlaka TR **ve** EN yazılmalı; eksik olursa `getExDesc()` `null` döner.

---

## 3. `data/ex-preview.js` — Uzun Önizleme (Önerilir)

Hareket önizleme modal'ında (ExPreviewModal) görünür. Format:

```js
"Bench Press": {
  gif: null,                         // veya "https://..." URL
  desc: [
    "TR uzun açıklama. 2-4 cümle.",
    "EN uzun açıklama. 2-4 cümle."
  ],
  tips: [
    ["TR ipucu 1.", "EN tip 1."],
    ["TR ipucu 2.", "EN tip 2."],
    ["TR ipucu 3.", "EN tip 3."]
  ]
}
```

**Alanlar:**
- `gif` — string URL veya `null`. GIF yoksa `null` yaz; component placeholder gösterir.
- `desc` — iki elemanlı dizi: `[TR, EN]`. 2-4 cümlelik uzun açıklama; hareketin hangi kasları çalıştırdığını, neden önemli olduğunu anlatır.
- `tips` — ipuçları dizisi; her ipucu `[TR, EN]` iki elemanlı. Tipik 3-5 ipucu; form, nefes, hata-engelleme notları.

---

## 4. Tam Örnek: "Reverse Fly" Eklemek

### Adım A — `data/presets-exercises.js`

Omuz bloğunun içinde uygun yere ekle:

```js
}, {
  name: "Reverse Fly",
  nameEN: "Reverse Fly",
  categories: ["Omuz"]
}, {
```

### Adım B — `data/ex-descriptions.js`

```js
"Reverse Fly": ["Arka delt izolasyonu. Rear delt fly ile benzer.", "Rear delt isolation. Similar to rear delt fly."],
```

### Adım C — `data/ex-preview.js`

```js
"Reverse Fly": {
  gif: null,
  desc: [
    "Eğilerek veya yatarak dumbbell ile arka omuz açma hareketi. Arka deltoidleri izole eder; postür için önemli.",
    "Bent-over or lying dumbbell rear delt fly. Isolates rear deltoids; important for posture."
  ],
  tips: [
    ["Gövdeni 45° eğik tut; sırtın düz olsun.", "Keep torso bent at 45°; back flat."],
    ["Dirsekleri hafif bük; tamamen düz değil.", "Slight bend in elbows; not fully straight."],
    ["Kürek kemiklerini birleştir.", "Squeeze shoulder blades together."]
  ]
}
```

---

## 5. Bitirme Kontrol Listesi

Ekledikten sonra mutlaka:

- [ ] `presets-exercises.js` giriş eklenmiş (`name` + `categories`)
- [ ] `ex-descriptions.js` ve `ex-preview.js` key'leri `presets-exercises.js`'teki `name` ile **birebir** aynı (Türkçe karakter dahil)
- [ ] TR ve EN eşit miktarda — birini atlama
- [ ] `node --check data/presets-exercises.js` ✅
- [ ] `node --check data/ex-descriptions.js` ✅
- [ ] `node --check data/ex-preview.js` ✅
- [ ] JSON obje sırasında virgül hatası yok (özellikle son giriş ve yeni girişin virgülü)
- [ ] **`sw.js` bump GEREKLI DEĞİL** — bu dosyalar zaten PRECACHE'te. Sadece içerik değişti, URL yok.
- [ ] Tarayıcıda dashboard → "Hazır Hareketler" altında yeni hareket görünüyor mu?
- [ ] Hareketi seçip "?" düğmesine bas — preview modal açıyor mu? (preview eklediysen)

---

## 6. Sık Yapılan Hatalar

- **`name` tutarsızlığı:** `presets-exercises.js`'te "İncline Dumbell Press" yazıp `ex-preview.js`'te "Incline Dumbbell Press" yazmak — lookup fail olur. (Türkçe İ ve nokta farkı!)
- **Kategori yazımı:** "göğüs" (küçük) yerine "Göğüs" (büyük + noktalı g) yazmayı unutmak.
- **Virgül patlaması:** Son obje sonrası virgül unutmak → syntax error.
- **`desc` tek string:** `desc` dizi olmalı `[TR, EN]`; yanlışlıkla tek string yazılırsa render patlar.
- **EN atlamak:** i18n zorunlu; EN olmayınca İngilizce kullanıcı boş içerik görür.

---

## 7. Bir Seferde Çok Sayıda Hareket Eklemek (Codex Senaryosu)

Birden fazla hareket eklerken:

1. Önce `presets-exercises.js`'e tüm girişleri ekle (tek commit'e girsin).
2. Sonra `ex-descriptions.js`'e aynı isimlerle açıklamaları ekle.
3. Sonra `ex-preview.js`'e aynı isimlerle preview'ları ekle.
4. Tüm `node --check`'leri geç.
5. Tek commit: `"data: N yeni preset hareket ekle (kategori/grup)"`.

Bunu adım adım yapmak, Türkçe karakter tutarsızlıklarını yakalamak için kritik; toplu ekleme sırasında yazım hataları kolay gözden kaçar.

---

## İlgili Dokümanlar

- [AGENTS.md](../AGENTS.md) — genel kurallar
- [docs/PRESET-PROGRAM-EKLEME.md](PRESET-PROGRAM-EKLEME.md) — program ekleme (hareketleri kullanır)
- [REFACTOR-GECMISI.md](../REFACTOR-GECMISI.md) Bölüm 30 — preset exercises'ın dosyaya ayrıştırılması
