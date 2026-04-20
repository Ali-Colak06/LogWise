# Yeni Preset Program Ekleme Reçetesi

<!-- SON GÜNCELLEME: 2026-04-20 — DOC-1 -->

Bu belge, LogWise'a yeni bir hazır antrenman programı (preset program) nasıl eklenir anlatır.

---

## Etkilenen Dosya

Tek bir dosya: `data/presets-programs.js`.

Her program, hareket isimlerine **isim-bazlı** referans verir. Yani programda `"Bench Press"` yazdığında, `data/presets-exercises.js`'te `name: "Bench Press"` olan bir giriş olmak **zorundadır**. Aksi halde kullanıcı programı seçtiğinde o gün boş görünür (hata değil, sessiz eksik).

---

## Program Objesinin Formatı

```js
{
  name: "Türkçe Program Adı",         // zorunlu
  nameEN: "English Program Name",     // zorunlu
  desc: "TR kısa açıklama.",          // zorunlu
  descEN: "EN short description.",    // zorunlu
  days: {
    "0": ["Hareket 1", "Hareket 2"],  // Pazartesi
    "1": ["Hareket 3"],               // Salı
    "2": [],                          // Çarşamba — dinlenme
    "3": [...],                       // Perşembe
    "4": [...],                       // Cuma
    "5": [...],                       // Cumartesi
    "6": []                           // Pazar
  }
}
```

### Gün Anahtarları (Sabit)

Haftanın günleri string olarak anahtarlanır, Pazartesi = `"0"`. **Kilit: string olmalı, sayı değil.**

| Anahtar | Gün TR | Gün EN |
|---|---|---|
| `"0"` | Pazartesi | Monday |
| `"1"` | Salı | Tuesday |
| `"2"` | Çarşamba | Wednesday |
| `"3"` | Perşembe | Thursday |
| `"4"` | Cuma | Friday |
| `"5"` | Cumartesi | Saturday |
| `"6"` | Pazar | Sunday |

Her yedi günün de `days` içinde olması gerekmez — boş günler için ya `[]` yaz ya da anahtarı tamamen atla (hepsini yazmak daha net).

### Hareket İsimleri

`days["0"]` gibi bir dizi içindeki her string, `data/presets-exercises.js`'te `name` olarak bulunmalıdır.

**Türkçe karakter + büyük/küçük harf birebir eşleşmeli.** Örnek:
- ✅ `"İncline Dumbell Press"` — dosyada aynen böyle
- ❌ `"Incline Dumbell Press"` — `İ` yerine `I` = eşleşmez
- ❌ `"incline dumbell press"` — küçük harf = eşleşmez

---

## Tam Örnek: "5/3/1 Basic" Programı Eklemek

`data/presets-programs.js` sonuna ekle (son programın `}` sonrasındaki `]`'dan önce):

```js
}, {
  name: "5/3/1 Basic",
  nameEN: "5/3/1 Basic",
  desc: "4 gün; her gün bir ana kaldırma + yardımcı hareketler. Orta-ileri.",
  descEN: "4 days; one main lift per day plus accessories. Intermediate-advanced.",
  days: {
    "0": ["Overhead Press", "Dips", "Rear Delt Fly", "Biceps Curl"],
    "1": ["Deadlift", "Leg Curl", "Calf Raise"],
    "2": [],
    "3": ["Bench Press", "Dumbell Press", "Triceps Pushdown", "Lateral Raise"],
    "4": ["Squat", "Leg Press", "Hip Thrust", "Calf Raise"],
    "5": [],
    "6": []
  }
}];
```

---

## Bitirme Kontrol Listesi

- [ ] Yeni program objesi `data/presets-programs.js`'te
- [ ] `name`, `nameEN`, `desc`, `descEN` dördü de dolu (i18n zorunluluğu)
- [ ] `days` anahtarları **string** (`"0"` değil `0`)
- [ ] Tüm hareket isimleri `presets-exercises.js`'te var (isim+karakter birebir)
- [ ] Son obje sonrası virgül hatası yok
- [ ] `node --check data/presets-programs.js` ✅
- [ ] **`sw.js` bump GEREKLI DEĞİL** — dosya zaten PRECACHE'te.
- [ ] Tarayıcıda "Program Seç" → yeni program listede görünüyor mu?
- [ ] Programı bir güne kopyala; hareketler dolu geliyor mu?

---

## Hareket İsmi Doğrulama (Manuel)

Yeni program eklerken referans verdiğin tüm isimlerin `presets-exercises.js`'te olduğunu doğrulamak için şu grep'i yap:

```bash
# Programda geçen her hareket için
grep -c "name: \"Bench Press\"" data/presets-exercises.js
# Beklenen: 1 — 0 dönerse o hareket yok, ekleme gerekli.
```

Veya toplu olarak:

```bash
# Tüm programlarda geçen hareketleri topla, presets-exercises'te olmayanları bul
node -e "
  const p = require('./data/presets-programs.js');  // global tanımlı olduğu için çalışmaz
  // ...
"
```

En pratik yöntem: gözle kontrol. 5-6 hareketten fazla değilse hızlıdır.

---

## Sık Yapılan Hatalar

- **Türkçe karakter kopyalama:** `"İncline"` yerine `"Incline"` yazmak → program o günü boş gösterir.
- **Gün anahtarını sayı yazmak:** `0: [...]` yerine `"0": [...]` olmalı.
- **Olmayan harekete referans:** Programda yeni bir hareket ismi varsa, önce `presets-exercises.js`'e eklemeyi unutma — hareket-ekleme reçetesi: [`PRESET-EXERCISE-EKLEME.md`](PRESET-EXERCISE-EKLEME.md).
- **Açıklama EN atlamak:** `desc` TR varsa `descEN` de olmalı.
- **Virgül:** Son program `}]` ile kapanır; yeni program eklemede `}, { ... }]` olduğuna dikkat.

---

## Yeni Hareket + Yeni Program Aynı Seansta

Sıralama önemli:

1. Önce `PRESET-EXERCISE-EKLEME.md`'ye göre gerekli yeni hareketleri ekle.
2. Sonra bu programı ekle.
3. Hareketler olmadan program eklersen, referanslar boş günlere dönüşür.

---

## İlgili Dokümanlar

- [AGENTS.md](../AGENTS.md) — genel kurallar
- [docs/PRESET-EXERCISE-EKLEME.md](PRESET-EXERCISE-EKLEME.md) — hareket ekleme (ön-gereksinim)
- [REFACTOR-GECMISI.md](../REFACTOR-GECMISI.md) Bölüm 31 — preset programs'ın dosyaya ayrıştırılması
- `PRESET_PROGRAM_ONERILERI.md` (kök) — yeni program fikirleri, etiketler, haftalık taslaklar
