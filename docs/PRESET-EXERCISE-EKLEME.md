# Yeni Preset Hareket Ekleme Reçetesi

<!-- SON GÜNCELLEME: 2026-04-20 — Faz EX-ID -->

Bu belge, LogWise'a yeni bir hazır hareket (preset exercise) nasıl eklenir adım adım anlatır.

> **Faz EX-ID sonrası (2026-04-20):** Hareketler artık `id` (slug) ile anahtarlanır. `ex-descriptions.js`, `ex-preview.js` ve `presets-programs.js` slug üzerinden referans verir. `name` (Türkçe ad) sadece kullanıcıya gösterilen başlıktır ve kullanıcı verisinde (Supabase workouts) hâlâ kaydedilir — backward compat için.

---

## Etkilenen Dosyalar

Bir hareket eklerken 1 zorunlu + 2 önerilen dosya vardır:

| Dosya | Zorunlu? | Amaç |
|---|---|---|
| `data/presets-exercises.js` | ✅ Zorunlu | Hareketin kendisi (id + name + kategori) |
| `data/ex-descriptions.js` | Önerilir | Kısa açıklama (tek satır, TR+EN) |
| `data/ex-preview.js` | Önerilir | Uzun açıklama + ipuçları + (varsa) gif |

Üç dosyanın anahtarı: hareketin `id` alanıdır (slug). Üçünde de aynı slug kullanılır. `name` alanı sadece `presets-exercises.js`'tedir ve UI başlığı içindir.

---

## Slug (`id`) Üretme Kuralları

`id` global olarak benzersiz olmalı (3 dosyada lookup key'i olarak kullanılıyor).

**Kurallar:**
- Sadece `[a-z0-9-]` karakterler — küçük harf, rakam, tire
- İngilizce ad varsa onu kebab-case'le; yoksa Türkçe adı temizleyip kebab-case'le
- Türkçe karakter dönüşümü: `İ→i`, `ş→s`, `ü→u`, `ç→c`, `ğ→g`, `ı→i`, `ö→o`
- Boşluk → tire; mevcut tire korunur (`T-Bar` → `t-bar`)
- Apostrof, nokta, parantez yok

**Örnekler:**
| name | nameEN | id |
|---|---|---|
| Bench Press | — | `bench-press` |
| İncline Dumbell Press | Incline Dumbell Press | `incline-dumbell-press` |
| Şınav | Push Up | `push-up` |
| Yürüyüş Bandı | Treadmill | `treadmill` |
| T-Bar Row | — | `t-bar-row` |
| One Arm Cable Curl | — | `one-arm-cable-curl` |

**Yasak:** Mevcut bir slug'ı tekrar kullanma. Listede ara, çakışırsa farklı bir slug seç (örn. `dead-hang-weighted` gibi).

---

## 1. `data/presets-exercises.js` — Zorunlu Giriş

Format:

```js
{
  id: "slug",                  // zorunlu — slug, yukarıdaki kurallara göre
  name: "Türkçe İsim",         // zorunlu — UI başlığı
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
{ id: "push-up", name: "Şınav", nameEN: "Push Up", categories: ["Göğüs", "Omuz", "Triceps"] }
```

### Ekleme Yeri

Dosyada benzer kategori hareketlerinin arasına ekle (aynı grup hareketleri bloklar halinde duruyor). Sıralama kullanıcıya görünen preset listeyi etkiler.

---

## 2. `data/ex-descriptions.js` — Kısa Açıklama (Önerilir)

Anahtar olarak hareket **id**'si (slug), değer olarak `[TR, EN]` dizisi:

```js
"bench-press": ["Düz bankta barbell press. Temel bileşik hareket.", "Barbell bench press. Fundamental compound."]
```

Kısa tutmak önemli — UI'da tek satır görünür. Tipik uzunluk: 40-80 karakter. Mutlaka TR **ve** EN yazılmalı; eksik olursa `getExDesc()` `null` döner.

---

## 3. `data/ex-preview.js` — Uzun Önizleme (Önerilir)

Hareket önizleme modal'ında (ExPreviewModal) görünür. Anahtar yine slug. Format:

```js
"bench-press": {
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
  id: "reverse-fly",
  name: "Reverse Fly",
  nameEN: "Reverse Fly",
  categories: ["Omuz"]
}, {
```

### Adım B — `data/ex-descriptions.js`

```js
"reverse-fly": ["Arka delt izolasyonu. Rear delt fly ile benzer.", "Rear delt isolation. Similar to rear delt fly."],
```

### Adım C — `data/ex-preview.js`

```js
"reverse-fly": {
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

- [ ] `presets-exercises.js` giriş eklenmiş (`id` + `name` + `categories`)
- [ ] `id` global benzersiz (mevcut listede çakışma yok)
- [ ] `id` slug formatına uygun: `^[a-z0-9-]+$`
- [ ] `ex-descriptions.js` ve `ex-preview.js` key'leri `presets-exercises.js`'teki `id` ile **birebir** aynı
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

- **Slug tutarsızlığı:** `presets-exercises.js`'te `id: "incline-dumbell-press"` yazıp `ex-preview.js`'te `"incline-dumbbell-press"` (çift b!) yazmak — lookup fail olur.
- **Türkçe karakteri slug'a koymak:** `"şınav"` slug olmaz; `İ` → `i`, `ş` → `s` çeviri yap.
- **Slug değil, isim kullanmak:** `ex-descriptions.js`'e `"Bench Press"` yazmak (eski format) → key bulunmaz; `"bench-press"` doğru.
- **Kategori yazımı:** "göğüs" (küçük) yerine "Göğüs" (büyük + noktalı g) yazmayı unutmak.
- **Virgül patlaması:** Son obje sonrası virgül unutmak → syntax error.
- **`desc` tek string:** `desc` dizi olmalı `[TR, EN]`; yanlışlıkla tek string yazılırsa render patlar.
- **EN atlamak:** i18n zorunlu; EN olmayınca İngilizce kullanıcı boş içerik görür.
- **Slug duplicate:** Listede zaten aynı slug varsa ikincisi sessizce eziyor olabilir; ekleme öncesi `grep "id: \"slug-adayi\"" data/presets-exercises.js` ile kontrol et.

---

## 7. Bir Seferde Çok Sayıda Hareket Eklemek (Codex Senaryosu)

Birden fazla hareket eklerken:

1. Önce slug listesi çıkar (yukarıdaki kurallara göre); kendi içinde benzersizliği kontrol et.
2. `presets-exercises.js`'e tüm girişleri ekle (id + name + nameEN + categories).
3. `ex-descriptions.js`'e aynı slug'larla açıklamaları ekle.
4. `ex-preview.js`'e aynı slug'larla preview'ları ekle.
5. Tüm `node --check`'leri geç.
6. Çapraz referans testi: programlardan veya bu yeni hareketleri gerektiren bir yerden lookup başarısız oluyor mu?
7. Tek commit: `"data: N yeni preset hareket ekle (kategori/grup)"`.

Slug listesini önce hazırlamak, Türkçe karakter tutarsızlıklarını ve tekrar slug'larını yakalamak için kritik.

---

## 8. Eski Veriler ve Backward Compat

Kullanıcı verisi (Supabase `workouts` tablosu, localStorage) hâlâ `name` (Türkçe isim) saklıyor — Faz EX-ID kullanıcı verisine dokunmadı.

Yeni preset eklerken bunu unutma:
- Yeni hareket için **eski kullanıcılar zaten yok** (henüz seçemediler), o yüzden backward compat sorunu olmaz.
- Mevcut bir hareketin `name`'ini değiştirmek **YASAK** — kullanıcıların eski kayıtları display'de "İsmi Değişen" olarak kalır ve aramada bulunamaz.
- Bir hareket adının **slug'ını değiştirmek** mümkün ama tehlikeli: `ex-descriptions`/`ex-preview` ve programlar tüm slug'ları takip eder. Tek commit'te tüm 3 dosyayı + programları güncelle.

---

## İlgili Dokümanlar

- [AGENTS.md](../AGENTS.md) — genel kurallar
- [docs/PRESET-PROGRAM-EKLEME.md](PRESET-PROGRAM-EKLEME.md) — program ekleme (hareket id'lerini kullanır)
- [REFACTOR-GECMISI.md](../REFACTOR-GECMISI.md) Bölüm 30 — preset exercises'ın dosyaya ayrıştırılması
- [REFACTOR-GECMISI.md](../REFACTOR-GECMISI.md) Bölüm 43 — Faz EX-ID id sistemi
