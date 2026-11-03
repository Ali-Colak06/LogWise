# Yeni Preset Hareket Ekleme Reçetesi

<!-- SON GÜNCELLEME: 2026-06-26 — Preset hareket kaynağı kanonik JSON + Web/Mobil codegen hattına taşındı. -->

Bu belge, LogWise'a yeni bir hazır hareket (preset exercise) nasıl eklenir adım adım anlatır.

> **Faz EX-ID sonrası (2026-04-20):** Hareketler artık `id` (slug) ile anahtarlanır. `ex-descriptions.js`, `ex-preview.js` ve `presets-programs.js` slug üzerinden referans verir. `name` (Türkçe ad) sadece kullanıcıya gösterilen başlıktır ve kullanıcı verisinde (Supabase workouts) hâlâ kaydedilir — backward compat için.

---

## Etkilenen Dosyalar

Bir hareket eklerken 2 zorunlu kaynak + migration boyunca 2 önerilen kaynak vardır. Web/Mobil preset çıktıları generator ile üretilir; generated dosyalar elle düzenlenmez.

| Dosya | Zorunlu? | Amaç |
|---|---|---|
| `data/presets-exercises.json` | ✅ Zorunlu | Kanonik hareket kaynağı (id + name + kategori); Web ve mobil buradan üretilir |
| `data/ex-guides.json` | ✅ Zorunlu | Ortak web/mobile guide kaydı ve readiness durumu |
| `data/ex-descriptions.js` | Önerilir | Kısa açıklama (tek satır, TR+EN) |
| `data/ex-preview.js` | Migration boyunca önerilir | Legacy web preview fallback'i |
| `data/presets-exercises.js` | Üretilmiş | Web runtime çıktısı; `scripts/build-presets-exercises.js` üretir |
| `logwise-mobile/data/generated/presets-exercises.ts` | Üretilmiş | Mobil runtime çıktısı; `scripts/build-presets-exercises.js` üretir |

Bu içerik dosyalarının ortak anahtarı hareketin `id` alanıdır (slug). Hepsinde aynı slug kullanılır. `name` alanı kanonik `presets-exercises.json` içindedir ve UI başlığı içindir.

`scripts/build-ex-guides.js`, her preset için kanonik guide kaydı bulunmasını zorunlu kılar. Yeni hareketin tam içeriği hazır değilse bile `data/ex-guides.json` içine `publish: false`, `mediaReady: false` ve uygun readiness değerleriyle draft kayıt eklenir. Tam alan sözleşmesi için `docs/EXERCISE-GUIDE-SCHEMA.md` belgesine bak.

**Faz 4 / D1:** `scripts/build-ex-meta.js` her preset için `data/ex-meta.json` → `exercises.<slug>` kaydı ister: `equipment` (barbell, dumbbell, ez-bar, kettlebell, cable, machine, smith, band, bodyweight), `difficulty` (1–3) ve gerekiyorsa `loadType` (`bodyweight` / `assisted`). Guide'daki her kas adı `ex-meta.json` → `muscles` (veya `aliases`) içinde olmalı; yeni bir kas adı kullanıyorsan oraya bölgesiyle ekle. Sonra `node scripts/build-ex-meta.js` ile `data/ex-meta.js`'i üret.

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

## 1. `data/presets-exercises.json` — Zorunlu Kanonik Giriş

Format:

```json
{
  "id": "slug",
  "name": "Türkçe İsim",
  "nameEN": "English Name",
  "categories": ["Göğüs"]
}
```

`nameEN` opsiyoneldir; yoksa alanı hiç yazma. Anahtar sırası `id` → `name` → `nameEN` → `categories` olmalı. Değişiklikten sonra:

```bash
node scripts/build-presets-exercises.js
node scripts/build-presets-exercises.js --check
```

komutları Web `data/presets-exercises.js` ve mobil `logwise-mobile/data/generated/presets-exercises.ts` çıktılarını deterministik üretir/doğrular.

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

### Adım A — `data/presets-exercises.json`

Omuz bloğunun içinde uygun yere ekle:

```json
{
  "id": "reverse-fly",
  "name": "Reverse Fly",
  "nameEN": "Reverse Fly",
  "categories": ["Omuz"]
}
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

- [ ] Asıl değişiklik `data/presets-exercises.json` içine yapılmış (`id` + `name` + `categories`)
- [ ] `node scripts/build-presets-exercises.js` çalıştırılmış
- [ ] `node scripts/build-presets-exercises.js --check` ✅
- [ ] `ex-guides.json` draft veya hazır guide kaydı aynı slug ile eklenmiş
- [ ] `id` global benzersiz (mevcut listede çakışma yok)
- [ ] `id` slug formatına uygun: `^[a-z0-9-]+$`
- [ ] `ex-descriptions.js` ve `ex-preview.js` key'leri `presets-exercises.json` içindeki `id` ile **birebir** aynı
- [ ] TR ve EN eşit miktarda — birini atlama
- [ ] `node --check data/presets-exercises.js` ✅
- [ ] `node --check data/ex-descriptions.js` ✅
- [ ] `node --check data/ex-preview.js` ✅
- [ ] `node scripts/build-ex-guides.js --check` ✅
- [ ] `data/ex-meta.json` kaydı eklendi; `node scripts/build-ex-meta.js` + `--check` ✅
- [ ] `node scripts/build-ex-guides.js` ile `data/ex-guides.js` wrapper'ı yenilenmiş
- [ ] Generated dosyalar (`data/presets-exercises.js`, `logwise-mobile/data/generated/presets-exercises.ts`) elle düzenlenmemiş
- [ ] JSON obje sırasında virgül hatası yok (özellikle son giriş ve yeni girişin virgülü)
- [ ] **`sw.js` bump GEREKLI DEĞİL** — bu dosyalar zaten PRECACHE'te. Sadece içerik değişti, URL yok.
- [ ] Tarayıcıda dashboard → "Hazır Hareketler" altında yeni hareket görünüyor mu?
- [ ] Hareketi seçip "?" düğmesine bas — preview modal açıyor mu? (preview eklediysen)

---

## 6. Sık Yapılan Hatalar

- **Slug tutarsızlığı:** `presets-exercises.json` içinde `"id": "incline-dumbell-press"` yazıp `ex-preview.js`'te `"incline-dumbbell-press"` (çift b!) yazmak — lookup fail olur.
- **Türkçe karakteri slug'a koymak:** `"şınav"` slug olmaz; `İ` → `i`, `ş` → `s` çeviri yap.
- **Slug değil, isim kullanmak:** `ex-descriptions.js`'e `"Bench Press"` yazmak (eski format) → key bulunmaz; `"bench-press"` doğru.
- **Kategori yazımı:** "göğüs" (küçük) yerine "Göğüs" (büyük + noktalı g) yazmayı unutmak.
- **Virgül patlaması:** Son obje sonrası virgül unutmak → syntax error.
- **`desc` tek string:** `desc` dizi olmalı `[TR, EN]`; yanlışlıkla tek string yazılırsa render patlar.
- **EN atlamak:** i18n zorunlu; EN olmayınca İngilizce kullanıcı boş içerik görür.
- **Slug duplicate:** Listede zaten aynı slug varsa generator hata verir; ekleme öncesi `rg '"id": "slug-adayi"' data/presets-exercises.json` ile kontrol et.

---

## 7. Bir Seferde Çok Sayıda Hareket Eklemek (Codex Senaryosu)

Birden fazla hareket eklerken:

1. Önce slug listesi çıkar (yukarıdaki kurallara göre); kendi içinde benzersizliği kontrol et.
2. `data/presets-exercises.json` içine tüm girişleri ekle (id + name + nameEN + categories).
3. `ex-guides.json` içine aynı slug'larla en az draft guide kayıtlarını ekle.
4. Migration gerekiyorsa `ex-descriptions.js` ve `ex-preview.js` içine aynı slug'larla legacy fallback içeriğini ekle.
5. `node scripts/build-presets-exercises.js` ile Web/Mobil preset çıktılarını yeniden üret.
6. `node scripts/build-presets-exercises.js --check`, `node scripts/build-ex-guides.js --check` ve tüm `node --check` kontrollerini geç.
7. `node scripts/build-ex-guides.js` ile web guide wrapper'ını yeniden üret.
8. Çapraz referans testi: programlardan veya bu yeni hareketleri gerektiren bir yerden lookup başarısız oluyor mu?
9. Tek commit: `"data: N yeni preset hareket ekle (kategori/grup)"`.

Slug listesini önce hazırlamak, Türkçe karakter tutarsızlıklarını ve tekrar slug'larını yakalamak için kritik.

---

## 8. Eski Veriler ve Backward Compat

Kullanıcı verisi (Supabase `workouts` tablosu, localStorage) hâlâ `name` (Türkçe isim) saklıyor — Faz EX-ID kullanıcı verisine dokunmadı. Kullanıcı hareket objesinde de bir `id` alanı vardır ama bu slug **değil**, `Date.now().toString()` gibi numerik bir string'dir (kullanıcı kaydının tanımlayıcısı). Slug lookup'ı modalda `[ex.id, ex.name]` sırayla denenir — numerik id EX_PREVIEW/EX_DESCS'te bulunamadığı için name'e düşer, `resolveKey` onu slug'a çevirir.

`lib/exercise-utils.js → resolveKey(nameOrId)` 5 katmanlı fallback yapar:
1. Tam slug eşleşmesi (id Map'i)
2. Tam name eşleşmesi (case-sensitive)
3. Case-insensitive name eşleşmesi
4. On-the-fly Türkçe→slug normalize (İ→i, ş→s, …)
5. Passthrough (bilinmeyen custom ad için)

Bu sayede "Bench Press", "bench press", "BENCH PRESS", `bench-press` hepsi aynı slug'a düşer.

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
