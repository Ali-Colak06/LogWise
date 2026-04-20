# Yeni Preset Program Ekleme Reçetesi

<!-- SON GÜNCELLEME: 2026-04-20 — Faz EX-ID -->

Bu belge, LogWise'a yeni bir hazır antrenman programı (preset program) nasıl eklenir anlatır.

> **Faz EX-ID sonrası (2026-04-20):** Programlar artık hareket **id**'lerine (slug) referans verir, isim değil. Örn. `"bench-press"`, `"squat"`. Slug üretme kuralları için bkz. [PRESET-EXERCISE-EKLEME.md](PRESET-EXERCISE-EKLEME.md) §Slug Üretme Kuralları.

---

## Etkilenen Dosya

Tek bir dosya: `data/presets-programs.js`.

Her program, hareket **id**'lerine (slug) referans verir. Yani programda `"bench-press"` yazdığında, `data/presets-exercises.js`'te `id: "bench-press"` olan bir giriş olmak **zorundadır**. Aksi halde kullanıcı programı seçtiğinde o gün boş görünür (hata değil, sessiz eksik).

---

## Program Objesinin Formatı

```js
{
  name: "Türkçe Program Adı",         // zorunlu
  nameEN: "English Program Name",     // zorunlu
  desc: "TR kısa açıklama.",          // zorunlu
  descEN: "EN short description.",    // zorunlu
  days: {
    "0": ["hareket-id-1", "hareket-id-2"],  // Pazartesi
    "1": ["hareket-id-3"],                  // Salı
    "2": [],                                 // Çarşamba — dinlenme
    "3": [...],                              // Perşembe
    "4": [...],                              // Cuma
    "5": [...],                              // Cumartesi
    "6": []                                  // Pazar
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

### Hareket Id'leri

`days["0"]` gibi bir dizi içindeki her string, `data/presets-exercises.js`'te `id` olarak bulunmalıdır.

**Slug birebir eşleşmeli — küçük harf, kebab-case.** Örnek:
- ✅ `"incline-dumbell-press"` — dosyada aynen böyle
- ❌ `"İncline Dumbell Press"` — Türkçe ad slug değil
- ❌ `"incline-dumbbell-press"` — fazladan b → eşleşmez (slug'lar repo'da `dumbell` tek b kullanılır)
- ❌ `"Bench Press"` — boşluk + büyük harf slug değil

Slug listesini görmek için `data/presets-exercises.js`'i aç; her objede `id:` alanı var.

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
    "0": ["overhead-press", "dips", "rear-delt-fly", "biceps-curl"],
    "1": ["deadlift", "leg-curl", "calf-raise"],
    "2": [],
    "3": ["bench-press", "dumbell-press", "triceps-pushdown", "lateral-raise"],
    "4": ["squat", "leg-press", "hip-thrust", "calf-raise"],
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
- [ ] Tüm hareket id'leri `presets-exercises.js`'te `id` olarak var
- [ ] Slug formatı: küçük harf + tire (`^[a-z0-9-]+$`)
- [ ] Son obje sonrası virgül hatası yok
- [ ] `node --check data/presets-programs.js` ✅
- [ ] **`sw.js` bump GEREKLI DEĞİL** — dosya zaten PRECACHE'te.
- [ ] Tarayıcıda "Program Seç" → yeni program listede görünüyor mu?
- [ ] Programı bir güne kopyala; hareketler dolu geliyor mu? (slug çözüm doğruysa Türkçe isimler görünür)

---

## Hareket Id Doğrulama (Manuel)

Yeni program eklerken referans verdiğin tüm slug'ların `presets-exercises.js`'te olduğunu doğrulamak için şu grep'i yap:

```bash
# Programda geçen her slug için
grep -c 'id: "bench-press"' data/presets-exercises.js
# Beklenen: 1 — 0 dönerse o slug yok, hareketi önce eklemen gerekli.
```

Veya programdaki tüm slug'ları toplu olarak doğrula (Node):

```bash
node -e "
const fs=require('fs');
const g={window:{}};
new Function('window', fs.readFileSync('data/presets-programs.js','utf8'))(g.window);
const gp={window:{}};
new Function('window', fs.readFileSync('data/presets-exercises.js','utf8'))(gp.window);
const ids=new Set(gp.window.LOGWISE_PRESET_EXERCISES.map(e=>e.id));
const bad=new Set();
for (const p of g.window.LOGWISE_PRESET_PROGRAMS)
  for (const arr of Object.values(p.days))
    for (const s of arr) if (!ids.has(s)) bad.add(s);
console.log(bad.size ? 'EKSİK: '+[...bad].join(', ') : 'OK');
"
```

---

## Sık Yapılan Hatalar

- **İsim kullanmak (eski format):** `"Bench Press"` yazmak → slug değil, boş gün gösterilir.
- **Türkçe karakter:** `"şınav"` slug olmaz; doğrusu `"push-up"` (Şınav'ın slug'ı).
- **Gün anahtarını sayı yazmak:** `0: [...]` yerine `"0": [...]` olmalı.
- **Olmayan slug'a referans:** Programda yeni bir hareket varsa, önce `presets-exercises.js`'e eklemeyi unutma — hareket-ekleme reçetesi: [`PRESET-EXERCISE-EKLEME.md`](PRESET-EXERCISE-EKLEME.md).
- **Açıklama EN atlamak:** `desc` TR varsa `descEN` de olmalı.
- **Virgül:** Son program `}]` ile kapanır; yeni program eklemede `}, { ... }]` olduğuna dikkat.

---

## Yeni Hareket + Yeni Program Aynı Seansta

Sıralama önemli:

1. Önce `PRESET-EXERCISE-EKLEME.md`'ye göre gerekli yeni hareketleri ekle (slug + name + categories + opsiyonel açıklama/preview).
2. Sonra bu programı ekle (yeni slug'lara referans vererek).
3. Hareketler olmadan program eklersen, referanslar boş günlere dönüşür.

---

## İlgili Dokümanlar

- [AGENTS.md](../AGENTS.md) — genel kurallar
- [docs/PRESET-EXERCISE-EKLEME.md](PRESET-EXERCISE-EKLEME.md) — hareket ekleme (ön-gereksinim)
- [REFACTOR-GECMISI.md](../REFACTOR-GECMISI.md) Bölüm 31 — preset programs'ın dosyaya ayrıştırılması
- [REFACTOR-GECMISI.md](../REFACTOR-GECMISI.md) Bölüm 43 — Faz EX-ID id sistemi
- `PRESET_PROGRAM_ONERILERI.md` (kök) — yeni program fikirleri, etiketler, haftalık taslaklar
