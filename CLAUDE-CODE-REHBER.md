# LOG WISE — Tam Proje Rehberi (Claude Code İçin)

Bu doküman, LOG WISE projesinin kuruluşundan güncel haline kadar her şeyi açıklar. Claude Code'a bu dosyayı okutarak projeye hakim olması sağlanır.

---

## 1. PROJE NEDİR?

LOG WISE, tek sayfalık (SPA) bir antrenman takip web uygulamasıdır. Kullanıcılar hareketlerini tanımlar, haftalık veya günlük programlar oluşturur, takvim üzerinden günlere hareket ekler ve her set için ağırlık/tekrar/RIR kaydı tutar. Dashboard ile ilerleme takibi yapılır.

- **Canlı URL**: https://logwise.fit/ (Netlify deploy, custom domain)
- **Eski URL**: https://incomparable-starburst-f7802c.netlify.app/
- **Teknoloji**: React 18 + Babel Standalone (tarayıcıda JSX derleme, build step yok), Supabase (auth + veritabanı), Chart.js 4.4.4
- **Ana dosya**: `index.html` (~2274 satır, tüm CSS/JS/React inline tek dosyada)
- **Font**: Google Fonts — Space Mono (body), Archivo Black (logo)

---

## 2. DOSYA YAPISI

```
LogWise/
├── index.html              ← Ana uygulama (tüm CSS + JS + React)
├── profile.html            ← Profil sayfası (ayrı sayfa, sosyal özellikler dahil)
├── share.html              ← Paylaşılan antrenman görüntüleme sayfası (public)
├── 404.html                ← 404 sayfası
├── _redirects              ← Cloudflare Pages redirect & rewrite kuralları
├── _headers                ← Cloudflare Pages HTTP header kuralları
├── netlify.toml            ← Eski Netlify deploy ayarları (artık kullanılmıyor, silinebilir)
├── sw.js                   ← Service Worker (PWA offline desteği)
├── manifest.json           ← PWA manifest
├── supabase_setup.sql      ← Supabase tablo şemaları + RLS politikaları
├── favicon.ico             ← Favicon
├── icon-192.png            ← PWA ikon (192x192)
├── icon-512.png            ← PWA ikon (512x512)
├── apple-touch-icon.png    ← iOS ikon
├── logo_küçük.png          ← Küçük logo
├── local-server.bat        ← Yerel sunucu başlatma scripti
├── local-server-mobile.bat ← Mobil test için yerel sunucu
├── .gitignore              ← Git ignore kuralları
├── compile.js              ← JSX önceden derleme scripti (git'e gitmez, sadece yerel)
├── package.json            ← Babel bağımlılıkları (git'e gitmez, sadece yerel)
├── index.html.babel-backup ← index.html kaynak JSX (git'e gitmez, sadece yerel)
├── profile.html.babel-backup ← profile.html kaynak JSX (git'e gitmez, sadece yerel)
├── share.html.babel-backup ← share.html kaynak JSX (git'e gitmez, sadece yerel)
└── CLAUDE-CODE-REHBER.md   ← Bu dosya
```

---

## 3. TEKNİK MİMARİ

### 3.1 Tek Dosya Uygulaması

Tüm uygulama `index.html` içinde. Build tool yok. `<script type="text/babel">` bloğunda React + JSX yazılıyor, Babel Standalone tarayıcıda derliyor. CDN'lerden yüklenen kütüphaneler:

- React 18.3.1 (production)
- ReactDOM 18.3.1
- Babel Standalone 7.24.7
- Supabase JS v2
- **Chart.js 4.4.4** (dashboard grafikleri için)

### 3.2 Supabase Backend

- **URL**: `https://czbxujioufhmvoajqwzp.supabase.co`
- **Tablolar**:
  - `user_data` — JSONB blob, kullanıcı başına tek satır (tüm egzersiz/antrenman/program verisi)
  - `feedback` — Geri bildirim satırları
  - `profiles` — Kullanıcı profilleri (username, display_name, bio, avatar, is_public, show_profile_info). Kayıt sırasında username ile oluşturulur. Username unique + case-insensitive index. `show_profile_info` (boolean, default true) — programlar/rozetler/ölçümlerin başkalarına görünüp görünmeyeceğini kontrol eder.
  - `shared_workouts` — Paylaşılan antrenmanlar (id, user_id, workout_date, workout_data JSONB, exercise_names JSONB, caption)
  - `user_prs` — Kullanıcı PR'ları liderlik tablosu için denormalize (user_id+exercise_name PK, max_weight, estimated_1rm). Veri yüklendiğinde otomatik senkronize edilir.
  - `follows` — Takip sistemi (follower_id, following_id PK). Tek yönlü, Instagram tarzı.
- **Auth**: Email/password + Google OAuth
- **RLS** (Row Level Security) aktif — her kullanıcı sadece kendi verisini görür
- **Hesap silme**: `delete_own_account()` SQL fonksiyonu ile

### 3.3 Kayıt Stratejisi (Çok Önemli)

Üç farklı kayıt fonksiyonu var:

- `save(newData)` → Anında kayıt. Misafirse localStorage'a, kullanıcıysa Supabase'e upsert.
- `debouncedSave(newData)` → 1 saniyelik debounce ile kayıt. Gün görünümündeki set düzenleme gibi sık CRUD işlemlerinde kullanılır.
- `localUpdate(newData)` → Sadece React state günceller, hiçbir yere kaydetmez.
- `flushSave()` → Bekleyen debounced kayıtları anında flush eder (gün görünümünden çıkınca çağrılır).

**Gün görünümünden çıkınca**: Boş setler temizlenir. Standart hareketlerde weight/reps ikisi de 0 olan setler, kardiyoda ise duration değeri 0 olan setler silinir; ardından `flushSave()` çağrılır.

### 3.4 Misafir (Guest) Modu

- Siteye giriş yapmadan kullanılabilir
- `isGuest = !user` — user null ise misafir
- Misafir verisi localStorage'da saklanır (`gym-log-v3` anahtarı)
- Ekranın altında sabit uyarı banner'ı gösterilir
- Feedback gönderme misafir modda engelli

### 3.5 Tema ve Dil

- **Dark/Light tema**: CSS custom properties ile. `data-theme="light"` attribute'u ile geçiş. Tercih localStorage'da (`gym-log-theme`).
- **TR/EN dil desteği**: `TR` ve `EN` constant objeleri (~150+ anahtar). `lang` state: "tr" veya "en", localStorage'da (`gym-log-lang`).

### 3.6 URL Routing (Client-Side)

React tarafında pushState/replaceState ile URL yönetimi:

- `/` → Takvim
- `/dashboard` → Dashboard / Panel
- `/exercises` → Hareketler
- `/programs` → Programlar
- `/feedback` → Geri Bildirim
- `/data` → Veri Yönetimi
- `/?date=2026-04-01` → Gün görünümü
- `/social` → Sosyal (Liderlik Tablosu, Akış, Kullanıcı Arama)
- `/profile` → Profil sayfası (ayrı HTML dosyası)
- `/profile?id=xxx` → Başka kullanıcının profili (ayrı HTML dosyası)
- `/share?id=xxx` → Paylaşılan antrenman görüntüleme (ayrı HTML dosyası, public)

Tarayıcı geri/ileri tuşları `popstate` event'i ile desteklenir.

---

## 4. VERİ YAPISI

localStorage key: `gym-log-v3` veya Supabase `user_data.data` JSONB:

```json
{
  "exercises": [
    {
      "id": "1711234567890",
      "name": "Bench Press",
      "categories": ["Göğüs"]
    }
  ],
  "workouts": {
    "2026-04-01": [
      {
        "exerciseId": "1711234567890",
        "sets": [
          { "weight": 80, "reps": 8, "rir": "2", "type": "working" },
          { "weight": 85, "reps": 6, "rir": "1", "type": "working" },
          { "weight": 60, "reps": 12, "rir": "-", "type": "warmup" }
        ],
        "supersetGroup": "1711234567999"
      }
    ]
  },
  "programs": {
    "1711234567900": {
      "name": "Push Pull Legs",
      "days": {
        "0": ["exId1", "exId2"],
        "1": ["exId3"],
        "2": [],
        "3": ["exId1", "exId2"],
        "4": ["exId3"],
        "5": [],
        "6": []
      }
    }
  },
  "dailyPrograms": {
    "1711234567950": {
      "name": "Göğüs Günü",
      "exercises": ["exId1", "exId2", "exId3"]
    }
  },
  "activeProgram": "1711234567900",
  "durations": {
    "2026-04-01": [1800, 600]
  },
  "measurements": {},
  "badges": [
    { "id": "first_workout", "unlockedAt": "2026-04-01" }
  ],
  "dayNotes": {
    "2026-04-01": "Omuz ağrısı var, dikkat et"
  },
  "exerciseNotes": {
    "exId1": "Grip genişliğini artırdım"
  }
}
```

### Veri Alanları Açıklaması

- `exercises[].categories` — Dizi! Eski veride `category` (string) olabilir, `migrateData()` fonksiyonu otomatik dönüştürür.
- `workouts[].sets[].type` — **YENİ**: `"working"` (varsayılan), `"warmup"`, `"drop"`, `"superset"`.
- `workouts[].sets[].duration` — Kardiyo hareketlerinde ağırlık/tekrar yerine dakika bazlı süre saklanır.
- `workouts[].supersetGroup` — **YENİ**: Aynı superset grubundaki hareketler aynı ID'yi paylaşır.
- `programs[].days` — Key'ler string olmalı ("0"–"6", Pazartesi=0, Pazar=6). `savePg` fonksiyonunda normalize edilir.
- `dailyPrograms` — Haftanın günlerinden bağımsız, sadece hareket listesi içeren programlar.
- `activeProgram` — Aktif haftalık program ID'si veya null. Aynı anda sadece bir program aktif olabilir.
- `durations` — Timer kayıtları, gün bazında saniye cinsinden dizi.
- `badges` — **YENİ**: Kazanılan rozetler dizisi. Her eleman `{id, unlockedAt}` formatında. `checkBadges()` fonksiyonu ile otomatik kontrol edilir.
- `measurements` — Vücut ölçüleri. Key = tarih string, value = ölçüm dizisi. Her ölçüm: `{id, date, weight, height, bodyFat, chest, waist, hips, bicepL, bicepR, thighL, thighR, neck, shoulders}`. Sadece doldurulan alanlar kaydedilir.
- `dayNotes` — Gün bazında not. Key = tarih string, value = not metni.
- `exerciseNotes` — Hareket bazında not. Key = exercise ID, value = not metni.
- `programMeta` — **YENİ**: Program metadata. Key = program ID, value = `{activatedAt, cycleType, deloadEvery}`. Aktifleştirildiğinde otomatik oluşturulur.

---

## 5. BÖLGELER (KATEGORILER) VE RENKLERİ

Hareketler birden fazla bölgeye etiketlenebilir. Her bölgenin iki CSS değişkeni var: ana renk ve açık arka plan.

```
Bölge       CSS Renk Key   Dark Ana Renk    Light Ana Renk
─────────   ────────────   ──────────────   ──────────────
Göğüs       blue           #f0c040          #c8960a
Sırt        ngreen         #39ff14          #1db805
Omuz        orange         #ffa040          #e37400
Biceps      purple         #d7aefb          #9334e6
Triceps     pink           #ff69b4          #c2185b
Bacak       teal           #78d9ec          #007b83
Trapez      amber          #ffb300          #ff8f00
Kalça       indigo         #7c4dff          #5c6bc0
Kalf        coral          #ff7043          #e64a19
Boyun       violet         #ce93d8          #8e24aa
Bilek       lime           #aeea00          #827717
Karın       red            #ff6060          #d44040
Kardiyo     sky            #4dabf7          #1971c2
Diğer       green          #8fbc8f          #2d7a2d
```

CSS değişken kullanımı: `var(--blue)` (ana renk), `var(--blueL)` (açık arka plan).

Çoklu bölge renklendirmesi: Bir hareket birden fazla bölgeye aitse, sol border gradient olarak gösterilir. Pill ve kart bileşenlerinde `borderImage` ile `linear-gradient` kullanılır.

---

## 6. ANA ÖZELLİKLER

### 6.1 Takvim (Ay/Hafta görünümü)

- Aylık grid: 7 sütun, hücreler tıklanınca gün görünümüne geçer. Hareketler renkli Pill bileşeni olarak gösterilir.
- Haftalık grid: 7 gün yan yana, her günün hareketleri detaylı gösterilir.
- Bugün mavi/altın daire ile vurgulanır.

### 6.2 Dashboard / Panel (YENİ)

Sidebar'da `📊 Panel` linki ile erişilir. `/dashboard` URL'i. 3 sekmeli yapı:

**Overview Sekmesi:**
- İstatistik kartları: Toplam Antrenman, Toplam Set, Toplam Hacim, Streak (🔥 animasyonlu)
- PR Tablosu: Top 10 kişisel rekor, tahmini 1RM ile sıralı
- Antrenman verisi yoksa boş state gösterilir

**Progress (İlerleme) Sekmesi:**
- Chart.js ile çizgi grafik — Ağırlık / Set Başı Hacim / Tahmini 1RM modları
- Hareket seçici dropdown
- En İyi Set, Ortalama Ağırlık, Seans sayısı istatistikleri
- Minimum 2 veri noktası gerekli

**Frequency (Sıklık) Sekmesi:**
- Kas grubu ısı haritası — Haftalık veya Aylık periyod seçimi
- Her kas grubu kendi rengiyle kart olarak gösterilir
- Doluluk oranına göre arka plan fill efekti

**Yardımcı Fonksiyonlar:**
- `calc1RM(w,r)` — Epley formülü: `w * (1 + r/30)`
- `calcBrzycki(w,r)` — Brzycki formülü: `w * (36 / (37-r))`
- `calcStreak(workouts)` — Art arda antrenman günü sayısı
- `calcWeekFreq(workouts,exercises)` — Son 7 günlük kas grubu frekansı
- `calcMonthFreq(workouts,exercises)` — Son 30 günlük kas grubu frekansı
- `getAllPRs(workouts,exercises)` — Tüm hareketlerin max ağırlık, max hacim, tahmini 1RM
- `DashChart` bileşeni — Chart.js canvas yönetimi (destroy/create lifecycle)

### 6.3 Gün Görünümü

- O gün eklenen hareketler kart olarak listelenir. Standart hareketlerde set tablosu `# | TİP | KG | TEKRAR | RIR | Sil`, kardiyo hareketlerinde ise sadeleştirilmiş `# | SÜRE | Sil` tablosu kullanılır.
- Bir hareket güne ilk eklendiğinde otomatik olarak tek boş set ile başlar. Standart hareketlerde başlangıç seti `0 kg / 0 tekrar`, kardiyoda ise `0 dakika` olarak oluşturulur.
- **Set Tipleri**: Working/Warm-up/Drop/Superset seçimi yalnızca standart hareketlerde gösterilir. Renk kodlu (#, border).
- **Kardiyo Süre Girişi**: Kardiyo kategorisindeki hareketlerde ağırlık/tekrar ve set tipi yerine dakika bazlı süre alanı ve tek bir “+ Süre” aksiyonu gösterilir. Geçmiş görünümü, haftalık görünüm ve CSV export bunu dikkate alır.
- **Önceki Antrenman Referansı**: Her hareketin üstünde son seanstaki veriler gösterilir; kardiyoda süre, standart hareketlerde ağırlık×tekrar pill'leri kullanılır.
- **Hareket Sıralama**: ▲/▼ butonları ile hareket sırası değiştirilebilir.
- **Gün Notu**: 📝 butonu ile o güne not eklenebilir (textarea, debouncedSave).
- **Hareket Notu**: Her hareketin 📝 butonuyla o harekete özel not eklenebilir.
- **Süper Set / Giant Set**: 🔗 butonu ile yalnızca standart ardışık hareketler gruplandırılabilir. 2 hareket = Superset, 3+ = Giant Set. Mor border ile görsel ayrım.
- **Dinlenme Zamanlayıcı (Rest Timer)**: Preset süreler (30s, 60s, 90s, 2m, 3m, 5m). Otomatik başlatma seçeneği. Geri sayım widget'ı (son 5 saniye kırmızı). Set eklenince otomatik başlayabilir.
- Aktif haftalık programda o günün başlanmamış hareketleri üstte pill butonlar olarak gösterilir.
- "Günlük Programı Ekle" butonu ile günlük programlardan biri seçilerek o güne eklenebilir.
- "Antrenman Kopyala" butonu ile geçmiş günlerden antrenman kopyalanabilir.
- Sağ altta FAB butonu ile hareket ekleme modalı açılır.

### 6.4 Hareketler

- Bölgelere göre gruplandırılmış hareket listesi. Çoklu bölgeli hareketler her bölgenin altında ayrı ayrı görünür.
- Her hareketin yanında son max ağırlık ve toplam kayıt sayısı gösterilir.
- **Hareket Düzenleme**: Kalem ikonu ile hareket adı ve bölgeleri değiştirilebilir. ID aynı kalır, geçmiş korunur. `openEditEx(id)` → modal → `editExercise()`.
- "Yeni Hareket" butonuna tıklanınca iki sekme açılır:
  - **Kendin Ekle**: İsim gir + birden fazla bölge seç (multi-select pill butonlar)
  - **Hazır Hareketler**: Bölgeye göre filtrelenebilen preset hareket listesinden çoklu seçim yapılır. **Her hareketin altında kısa açıklama** gösterilir.

### 6.5 Hazır Hareketler Sistemi (PRESET_EXERCISES + EX_DESCS)

Kodun başında `PRESET_EXERCISES` dizisi var (~56 hazır hareket). Developer yeni hareket eklemek için bu diziye satır ekler:

```js
{ name: "Türkçe Ad", nameEN: "English Name", categories: ["Bölge1", "Bölge2"] }
```

- `name` → Türkçe modda gösterilir ve bu isimle kaydedilir
- `nameEN` → İngilizce modda gösterilir ve bu isimle kaydedilir. Verilmezse `name` kullanılır.
- Zaten eklenmiş hareketler soluk gösterilir ve seçilemez (her iki dildeki isme de bakılır).

**Hareket Açıklamaları (EX_DESCS)**: Ayrı bir obje olarak tanımlı. Her hareketin kısa TR/EN açıklaması:
```js
const EX_DESCS = { "Bench Press": ["Düz bankta barbell press. Temel bileşik hareket.", "Barbell bench press. Fundamental compound."], ... };
const getExDesc = (name, lang) => ...;
```
Preset hareket seçme listesinde her hareketin altında açıklama gösterilir.

### 6.6 Programlar

İki program türü var, programlar sayfasında sekmelerle seçilir:

**Haftalık Program:**
- Haftanın 7 gününe ayrı ayrı hareket atanır (Pzt–Paz sekmeleri)
- "Aktif Et" ile aktifleştirilir → takvimde otomatik görünür, `activatedAt` tarihi kaydedilir
- Aynı anda sadece bir program aktif olabilir
- Aktif program sidebar'da özet olarak gösterilir (hafta numarası, uyum oranı, deload göstergesi dahil)

**Hazır Program Şablonları (PRESET_PROGRAMS — YENİ):**
- 4 hazır program: Push Pull Legs (PPL), Üst/Alt Bölünme, Full Body, Bro Split
- `📋 Hazır Program Ekle` butonu ile modal açılır
- Seçildiğinde eksik hareketler otomatik eklenir (`addPresetProgram` fonksiyonu)
- Her preset'te: name/nameEN, desc/descEN, days (hareket isimleri ile)

**Program Döngüsü (Cycle — YENİ):**
- Program oluşturma/düzenleme modalında "Döngü" ayarı: Standart veya Deload Döngüsü
- Deload seçildiğinde sıklık ayarlanır (3/4/5/6/8 hafta)
- `programMeta[pgId].cycleType` ve `programMeta[pgId].deloadEvery` olarak kaydedilir
- Deload haftasında program kartında ve sidebar'da ⚡ badge gösterilir

**Program İlerleme Takibi (YENİ):**
- `calcCompliance(pgId, workouts, programs, programMeta)` fonksiyonu
- Aktifleştirilme tarihinden itibaren hafta numarası hesaplanır
- Uyum oranı: program günlerinde antrenman yapılma yüzdesi (renk kodlu: yeşil ≥80%, turuncu ≥50%, kırmızı <50%)
- Progress bar program kartında ve sidebar'da gösterilir
- Detay: done/total gün sayısı

**Günlük Program:**
- Haftanın günlerinden bağımsız, sadece bir hareket listesi
- Takvimde gün görünümüne gidince "Günlük Programı Ekle" butonu ile o güne eklenir
- Ekleme işlemi hareketleri boş setlerle kopyalar

### 6.7 Hareket Geçmişi Modal

- Herhangi bir hareketin geçmiş butonuna basınca açılır
- Tüm kayıtlı günler ters kronolojik sırayla listelenir. Standart hareketlerde tarih, max ağırlık, hacim ve set detayları; kardiyoda ise tarih, toplam süre ve süre detayları gösterilir.
- PR (personal record) sağ üstte sadece standart hareketlerde gösterilir.
- **1RM Gösterimi**: Epley ve Brzycki tahmini 1RM değerleri sadece ağırlıklı hareketlerde mor ve teal kartlarda gösterilir.
- Her seans için ayrı 1RM tahmini sadece ağırlıklı hareketlerde listelenir.

### 6.8 Veri Yönetimi (YENİ)

Sidebar'da `📦 Veri Yönetimi` linki ile erişilir. `/data` URL'i. 2 sekmeli yapı:

**Veriler Sekmesi:**
- JSON Dışa Aktarma: Tüm veriyi JSON olarak indirme (yedekleme için)
- CSV Dışa Aktarma: Antrenman kayıtlarını CSV tablo olarak indirme
- JSON İçe Aktarma: Dosya seçici ile önceden dışa aktarılmış JSON yükleme, mevcut veriyi üzerine yazar
- Veri Özeti: Hareket, antrenman günü, toplam set, program, ölçüm sayıları

**Ölçüler Sekmesi:**
- Vücut ölçüleri: Kilo, boy, vücut yağı %, göğüs, bel, kalça, biceps (L/R), bacak (L/R), boyun, omuz
- Ölçüm ekleme formu: Grid layout, sayısal input'lar
- Ölçüm geçmişi: Tarih sıralı, her ölçüm kartında doldurulan alanlar gösterilir
- Ölçüm silme

**Yardımcı Fonksiyonlar:**
- `exportJSON()` — Blob + download link
- `exportCSV()` — Workout verilerini CSV formatına dönüştürme
- `importJSON(e)` — FileReader + JSON parse + migrateData + save
- `saveMeasurement()` — Ölçüm kaydetme (measurements[date] dizisine push)
- `delMeasurement(dk,mid)` — Ölçüm silme
- `getMeasureHistory()` — Tüm ölçümleri ters kronolojik sırayla döndürür
- `MEASURE_FIELDS` — Ölçüm alan isimleri sabiti

### 6.9 RIR (eski 6.8) (Reps in Reserve)

Her set için dropdown: "—" (yok), "F" (Failure/0), "1", "2", "3", "4+".

### 6.9 Timer (Kronometre)

- Sidebar'da start/stop/reset/save butonları
- localStorage ile persist (tarayıcı kapansa bile kalır, `gym-timer` key)
- Birden fazla kayıt/gün desteklenir (durations dizisi)
- Gün görünümünde toplam + detaylar gösterilir

### 6.10 Geri Bildirim

- Mesaj + kategori (Hata/Özellik İsteği/Genel/Diğer) + 5 yıldız puan
- Supabase `feedback` tablosuna kaydedilir
- Misafir modda engelli

---

## 7. BİLEŞEN HARİTASI (index.html satır yapısı)

```
Satır 1-110     HTML head, CSS (değişkenler, animasyonlar, dark/light tema, dashboard, badge, skip-link, skeleton animasyonları)
Satır 111-116   Skip-to-content link, noscript fallback, root div (loading skeleton)
Satır 117-145   Supabase client, React hooks, ErrorBoundary class component, sabitler (D, DF, MO, CATS, CC)
Satır 108-182   PRESET_EXERCISES dizisi (~56 hazır hareket, yorum bloğu ile açıklanmış)
Satır 183-232   EX_DESCS (hareket açıklamaları), getExDesc helper, presetName helper
Satır 233-241   PRESET_PROGRAMS dizisi (4 hazır program şablonu: PPL, Upper/Lower, Full Body, Bro Split)
Satır 242-245   RIRS, yardımcı fonksiyonlar (fmt, pD, gdow, storage keys, eDays)
Satır 246-250   SET_TYPES, ST_LABELS_TR/EN, ST_COLORS, REST_PRESETS sabitleri
Satır 251-252   init() fonksiyonu (programMeta dahil), migrateData() fonksiyonu
Satır 253-260   Dashboard + program yardımcı fonksiyonları (calc1RM, calcBrzycki, calcStreak, calcWeekFreq, calcMonthFreq, getAllPRs, calcCompliance)
Satır 261-268   BADGES sabiti (30 rozet), getBadgeName, getBadgeCatLabel, calcBadgeStats, checkBadges, getNextBadge fonksiyonları
Satır 269-270   TR ve EN çeviri objeleri (~200+ anahtar, badge/notif/social/username/onboard keys dahil)
Satır 264-284   DashChart bileşeni (Chart.js canvas yönetimi)
Satır 286-366   AuthScreen bileşeni (login/register/forgot modal, Google OAuth)
Satır 368-~1500 App bileşeni (ana uygulama):
  States       view, calendar, sidebar, mobile, dashboard, chart, rest timer, drag, note, superset, program modal, edit exercise, cycle, dataTab, measureForm, badgeToast, notifPerm, username modal, onboarding, search, pull-refresh, confetti, bottom tab states
  Timer        Timer + rest timer countdown, localStorage persist
  Auth/Save    save/debouncedSave/flushSave/localUpdate
Routing      URL routing, page title, view transitions, boş set temizliği, beforeunload, Escape key modal handler
  Ex CRUD      addExercise, addPresetExercises, openEditEx, editExercise, removeExercise
  Day CRUD     addExToDay, rmExDay, addSet, updSet, rmSet, startPgEx, getPrevSets, moveExInDay, saveDayNote, saveExNote, toggleSuperset
  Pg CRUD      savePg (cycle meta dahil), delPg, actPg (activatedAt dahil), resetPg, openEditPg, togPgEx, addPresetProgram
  DP CRUD      saveDp, delDp, resetDp, openEditDp, togDpEx, addDpToDay
  Badge/Notif  Badge checking useEffect (otomatik kontrol + kutlama toast), requestNotifPerm, checkWorkoutReminder
  Helpers      exN, exC, exCats, cl, clAll, getH, getEff, calDays, weekDays, exportJSON, exportCSV, importJSON, saveMeasurement, delMeasurement, getMeasureHistory
  Components   Pill, MiniCal, SVG ikonları
  JSX:Header   Header + Sidebar (navigasyon, timer, mini takvim, aktif program özeti + ilerleme, user/guest)
  JSX:Dash     Dashboard view (4 sekmeli: overview, progress, frequency, badges)
  JSX:Cal      Calendar view (month + week grid'leri)
  JSX:Day      Day view (rest timer, notes, set tabloları, set tipleri, prev reference, superset, sıralama)
  JSX:Ex       Exercises view (gruplandırılmış liste, düzenleme modalı, add exercise modal with tabs + açıklamalar)
  JSX:Pg       Programs view (weekly/daily tabs, preset programs modal, cycle settings, progress bar, modals)
  JSX:Data     Data management view (export/import + body measurements, 2 sekmeli)
  JSX:Fb       Feedback view
  JSX:Hist     History modal (1RM gösterimi ile)
  JSX:Social   Social view (Leaderboard, Feed, Search tabs, username display)
  JSX:Share    Share workout modal
  JSX:Username Username selection modal (for existing users without username)
  JSX:Onboard  Onboarding modal (first-time users)
  JSX:Confetti Confetti animation overlay (PR celebration)
  JSX:Search   Global search modal
  JSX:BottomTab Mobile bottom tab navigation bar
  JSX:Guest    Guest banner
Satır ~2100-2120 S style objesi (inline style sabitleri)
Satır ~2130-2160 Root bileşeni (auth state, lang, theme), ReactDOM render
```

---

## 8. STALE CLOSURE PATTERNİ (ÇOK ÖNEMLİ)

React'te `useCallback` veya event handler'lar içinde state değerlerinin eski kalması sorunu yaşanıyor. Çözüm olarak kritik state'ler için `useRef` kullanılıyor:

```js
const dRef = useRef(data);       dRef.current = data;
const pnRef = useRef(pgName);    pnRef.current = pgName;
const pdRef = useRef(pgDays);    pdRef.current = pgDays;
const peRef = useRef(pgEditId);  peRef.current = pgEditId;
const dpnRef = useRef(dpName);   dpnRef.current = dpName;
const dpeRef = useRef(dpExIds);  dpeRef.current = dpExIds;
const dpeiRef = useRef(dpEditId); dpeiRef.current = dpEditId;
```

**Kural**: Yeni state eklenirse ve bir callback/CRUD fonksiyonu içinde kullanılacaksa mutlaka ref pattern'i uygulanmalı. Aksi halde stale closure hatası oluşur ve veri kaybına yol açar.

---

## 9. VERİ MİGRASYONU

`migrateData()` fonksiyonu veri yüklendiğinde çağrılır ve eski formatı yeniye dönüştürür:

- `exercise.category` (string) → `exercise.categories` (array) dönüşümü
- `dailyPrograms` alanı yoksa eklenir
- `measurements` alanı yoksa eklenir
- `dayNotes` alanı yoksa eklenir
- `exerciseNotes` alanı yoksa eklenir
- `programMeta` alanı yoksa eklenir

Yeni alan eklenmesi gerekirse bu fonksiyona eklenmeli.

---

## 10. DEPLOY

**Cloudflare Pages** üzerinde deploy ediliyor. Canlı URL: https://logwise.fit/

### Cloudflare Pages Ayarları
- **Build command**: boş (build step yok)
- **Build output directory**: `/` (kök dizin)
- **Branch**: main

### `_redirects` dosyası (kök dizinde)
Tüm redirect ve rewrite kuralları bu dosyada tanımlı:
- `/index.html` ve `/index.php` → `/` (301) — temiz URL
- `/profile` → `/profile.html` (200 rewrite) — clean URL
- `/share` → `/share.html` (200 rewrite) — clean URL
- SPA route'ları: `/dashboard`, `/exercises`, `/programs`, `/feedback`, `/data`, `/social` → `/index.html` (200 rewrite)
- 404 sayfası için ayrı kural **gerekmez** — Cloudflare Pages kök dizindeki `404.html`'i otomatik kullanır

### `_headers` dosyası (kök dizinde)
- `sw.js`: `Cache-Control: no-cache` — tarayıcı her zaman güncel SW'yi kontrol eder
- Tüm sayfalar: güvenlik header'ları (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) + `Cache-Control: public, max-age=3600`

### Önemli Kurallar
- **ÖNEMLİ**: Kodda her zaman `/profile` ve `/share` kullanılmalı, asla `/profile.html` veya `/share.html` kullanılmamalı. Redirect döngüsüne sebep olur.
- `netlify.toml` artık kullanılmıyor; Cloudflare `_redirects` ve `_headers` dosyalarını kullanıyor.

### Deploy Akışı
- `main` branch'e her `git push` → otomatik deploy (limit yok)
- Manuel deploy: Cloudflare dashboard → Workers & Pages → logwise → Deployments → "Create deployment"
- Preview deploy: farklı bir branch'e push edilince `*-logwise.pages.dev` URL'iyle otomatik oluşur

### Eski Netlify Notu
Proje daha önce Netlify'da hostlanıyordu. Deploy limiti (ayda 500) ve depolama kısıtları nedeniyle Cloudflare Pages'e geçildi (2026-04-08). `netlify.toml` referans amaçlı bırakıldı, silinebilir.

---

## 11. GEÇMİŞTE YAŞANAN SORUNLAR VE ÇÖZÜMLER

1. **Dosya kesintisi (3+ kez)**: Edit işlemlerinde dosyanın sonu kesildi → beyaz ekran. `Root` fonksiyonu ve `</script></body></html>` kapanış etiketleri kayboldu. **Çözüm**: Her edit sonrası `tail -5 index.html` ile kontrol, bracket balance check yapılmalı.

2. **Stale closure bug**: `savePg`, `togPgEx` fonksiyonlarında eski state okunuyordu. **Çözüm**: useRef pattern (yukarıda açıklandı).

3. **Program days key normalizasyonu**: `pgDays` objesinde key'lerin number yerine string olması gerekiyordu. **Çözüm**: `savePg` içinde `for(let i=0;i<7;i++){nd[String(i)]=[...]}`.

4. **Babel SyntaxError**: Dosya kesintisinden kaynaklı eksik JSX. **Çözüm**: Eksik satırlar eklendi.

5. **Session persistence**: Auth state race condition. **Çözüm**: `onAuthStateChange` + `getSession()` fallback, `ready` flag.

6. **Netlify redirect döngüsü**: `/profile.html` → `/profile` (301, force) ve `/profile` → `/profile.html` (200) birlikte sonsuz döngü oluşturuyordu → "Bu sayfa çalışmıyor" hatası. **Çözüm**: Pretty URL redirect'leri (`.html` → clean URL) kaldırıldı, sadece clean URL → `.html` rewrite (200) bırakıldı. Tüm linklerde `/profile` kullanılmalı, `/profile.html` kullanılmamalı.

7. **Pull-to-refresh stale closure** (geçmiş not — özellik kaldırıldı): `handlePullRefresh` useCallback'inde `pullY` state değeri stale kalıyordu. `pullYRef` ile çözülmüştü. Özellik 2026-04-08 tarihinde tamamen kaldırıldı.

8. **Cloudflare Pages `_redirects` hataları** (2026-04-08): İki sorun yaşandı. (a) `301!` force syntax'ı Netlify'a özgüdür, Cloudflare tanımıyor — `!` kaldırıldı. (b) `404` status kodu `_redirects` dosyasında geçersiz — Cloudflare Pages sadece 200, 301, 302, 303, 307, 308 kabul eder. Catch-all satırı kaldırıldı; `404.html` kök dizinde olduğu için Cloudflare onu otomatik kullanır.

9. **Cloudflare custom domain "already in use" hatası** (2026-04-08): DNS'te Netlify'ı gösteren eski `A` kaydı (`75.2.60.5`) ve `www` CNAME'i (`logwise.netlify.app`) silinmeden custom domain eklenemiyordu. **Çözüm**: Cloudflare DNS panelinden her iki kayıt silindi, ardından custom domain ekleme başarılı oldu.

10. **Cloudflare "Asset too large" hatası — node_modules** (2026-04-10): Babel Standalone kaldırma işlemi sırasında `package.json` git'e commit edildi. Cloudflare, `package.json` görünce otomatik `npm install` çalıştırdı; üretilen `node_modules/workerd/bin/workerd` (118 MB) 25 MB asset limitini aştı → deploy başarısız. **Çözüm**: `compile.js` ve `package.json` `.gitignore`'a eklendi ve `git rm --cached` ile git takibinden çıkarıldı. Bu dosyalar artık sadece yerel derleme aracı olarak tutulur, git'e gitmez.

---

## 12. ÖNEMLİ KURALLAR (Claude Code İçin)

1. **Chrome'da test etme** — Claude in Chrome eklentisi ile siteyi açıp kontrol etmeye çalışma.

2. **Tek dosya uygulaması** — Tüm CSS, JS, React tek `index.html` içinde. Ayrı dosyalara bölme.

3. **JSX önceden derlenmiş** — Babel Standalone **kaldırıldı** (2026-04-10). `index.html`, `profile.html`, `share.html` artık `<script type="text/babel">` içermiyor; JSX önceden `@babel/preset-react` ile düz `React.createElement()` çağrılarına derlendi. Kaynak JSX dosyaları `*.babel-backup` uzantısıyla saklanıyor. Değişiklik yapmak için: `.babel-backup` dosyasını düzenle → `node compile.js` çalıştır → deploy. `compile.js` ve `package.json` git'te **takip edilmez** (.gitignore'da), sadece yerel araçtır.

4. **Edit çok dikkatli yapılmalı** — Dosya kesintisi beyaz ekrana sebep olur. Her edit sonrası:
   - `tail -5 index.html` ile dosya sonunu kontrol et
   - Bracket balance check yap (round, square, curly parantezler)
   - `ReactDOM.createRoot`, `function Root()`, `</html>` varlığını doğrula

5. **Stale closure** — Yeni state eklerken ref pattern'i unutma.

6. **Program days key'leri string olmalı** — `"0"`, `"1"`, ..., `"6"`.

7. **migrateData'yı güncelle** — Yeni veri alanı eklenirse `migrateData()` fonksiyonuna da eklenmeli.

8. **PRESET_EXERCISES** — Yeni hazır hareket eklemek için sadece diziye satır ekle, UI otomatik güncellenir. `nameEN` alanı İngilizce isim için.

9. **Çeviri anahtarları** — Yeni UI metni eklenirse hem `TR` hem `EN` objesine eklenmeli.

10. **Chart.js lifecycle** — DashChart bileşeninde `chartInstanceRef.current.destroy()` çağrılmalı, aksi halde canvas leak olur.

11. **ErrorBoundary** — İki katmanlı: dış (`<Root>` etrafında) ve iç (`<App>` etrafında). Class component olmalı (hooks desteklemez). `getDerivedStateFromError` + `componentDidCatch` pattern.

12. **Service Worker** — `sw.js` dosyası root'ta, `CACHE_NAME` versiyonu güncellenmeli cache bust için. SW kaydı index.html sonunda plain `<script>` ile (Babel değil).

13. **A11y** — Yeni modal eklenirse `role="dialog" aria-modal="true" aria-label={L.xxx}` eklenmeli. Yeni icon button'a `aria-label` eklenmeli. Escape key handler'a yeni modal state eklenmeli.

14. **Profil/Share linkleri** — Kodda her zaman `/profile` ve `/share` kullanılmalı, asla `/profile.html` veya `/share.html` kullanılmamalı. Netlify redirect döngüsüne sebep olur.

---

## 13. SUPABASE SETUP

Supabase Dashboard → SQL Editor'da `supabase_setup.sql` çalıştırılarak tablolar ve RLS politikaları oluşturulur. Önemli detaylar:

- `user_data` tablosu: JSONB blob, `user_id` UUID primary key
- `feedback` tablosu: `id` text PK, `user_id`, `msg`, `cat`, `rating`, `created_at`
- RLS politikaları: SELECT/INSERT/UPDATE/DELETE — `auth.uid() = user_id`
- `delete_own_account()` fonksiyonu: Kullanıcının kendi hesabını silmesi için

---

## 14. TAMAMLANAN ÖZELLİKLER (Son Güncelleme: 2026-04-04, Kategori 4+8+Username dahil)

### Kategori 1: Veri & İlerleme Takibi ✅ TAMAMLANDI
- ✅ **Grafik/Chart sistemi** — Chart.js ile ağırlık/hacim/1RM ilerleme grafiği
- ✅ **Dashboard / Özet Ekranı** — 3 sekmeli (Overview, Progress, Frequency)
- ✅ **1RM Tahmini** — Epley + Brzycki formülleri, history modal ve dashboard'da gösterim
- ✅ **Kas grubu ısı haritası** — Haftalık/aylık frekans, renk kodlu kartlar
- ✅ **Streak takibi** — Gün üst üste sayacı, 3+ günde animasyon
- ✅ **PR tablosu** — Top 10, tahmini 1RM ile sıralı

### Kategori 2: Gün Görünümü / Antrenman Deneyimi ✅ TAMAMLANDI
- ✅ **Set tipleri** — Standart hareketlerde Working / Warm-up / Drop / Superset, kardiyoda yalnızca süre girişi
- ✅ **Dinlenme zamanlayıcı** — Preset süreler, otomatik başlatma, geri sayım widget
- ✅ **Önceki antrenman referansı** — Son seans verileri set yanında (placeholder olarak da)
- ✅ **Hareket sıralama** — ▲/▼ butonları
- ✅ **Notlar** — Gün notu + hareket notu
- ✅ **Süper set / Giant set** — 🔗 ile gruplandırma, mor border ile görsel ayrım

### Kategori 3: Hareketler & Programlar ✅ TAMAMLANDI
- ✅ **Hareket düzenleme** — İsim ve bölge değiştirme, geçmiş korunur (ID aynı kalır)
- ✅ **Hareket açıklamaları** — EX_DESCS objesi, preset listede açıklama gösterimi
- ✅ **Program şablonları** — 4 hazır program (PPL, Upper/Lower, Full Body, Bro Split), eksik hareketler otomatik eklenir
- ✅ **Program döngüsü** — Deload cycle desteği, ayarlanabilir sıklık (3-8 hafta)
- ✅ **Program ilerleme takibi** — Hafta numarası, uyum oranı (%), progress bar, deload haftası göstergesi

### Kategori 5: Veri Yönetimi ✅ TAMAMLANDI (Fotoğraf hariç)
- ✅ **Export JSON** — Tüm veriyi JSON olarak dışa aktarma (yedekleme)
- ✅ **Export CSV** — Antrenman kayıtlarını CSV tablo olarak dışa aktarma
- ✅ **Import JSON** — Daha önce dışa aktarılmış JSON dosyasından geri yükleme
- ✅ **Vücut ölçüleri takibi** — Kilo, boy, vücut yağı, göğüs, bel, kalça, biceps, bacak, boyun, omuz ölçümleri
- ✅ **Veri özeti** — Hareket, antrenman günü, set, program, ölçüm sayıları

### Kategori 6: Bildirimler & Motivasyon ✅ TAMAMLANDI
- ✅ **Başarımlar / Rozetler** — 30 rozet, 6 kategori (Antrenman, Seri, PR, Hacim, Set, Çeşitlilik), BADGES sabiti, checkBadges() ile otomatik kontrol, kutlama toast animasyonu, ilerleme çubukları, kilitli/açık görsel fark
- ✅ **Streak görsel iyileştirme** — pulseGlow animasyonu (3+ gün), rozetler sekmesinde seri göstergesi
- ✅ **Bildirim hatırlatıcı** — Notification API, antrenman günü tespiti (aktif program + bugünün günü), izin yönetimi, günlük tekrar engeli (localStorage key)

### Kategori 7: Teknik / Altyapı ✅ TAMAMLANDI
- ✅ **PWA offline desteği** — `sw.js` Service Worker: cache-first strateji, app shell precache (index.html, CDN libs, ikonlar), Supabase API için network-first, offline fallback. SW kaydı index.html'de plain JS ile. `netlify.toml`'da sw.js için no-cache header.
- ✅ **Performans iyileştirmeleri** — Preconnect/dns-prefetch (fonts.gstatic.com, cdnjs, jsdelivr, supabase), loading skeleton (LOG WISE logo + animasyonlu progress bar, React mount öncesi gösterilir)
- ✅ **Babel Standalone kaldırıldı** (2026-04-10) — ~1.4 MB CDN indirmesi ve runtime JSX derleme yükü ortadan kalktı. `index.html`, `profile.html`, `share.html` artık önceden derlenmiş düz JavaScript içeriyor. Derleme aracı: `compile.js` + `@babel/preset-react`. Kaynak JSX dosyaları `*.babel-backup` olarak yerel tutulur. Değişiklik akışı: `.babel-backup` düzenle → `node compile.js` → deploy.
- ✅ **Erişilebilirlik (a11y)** — Skip-to-content linki, `role="banner/navigation/main/dialog"`, `aria-label` tüm icon button'larda (menü, ay gezinme, tema, FAB), `aria-modal="true"` tüm modallarda, tüm input'lara `aria-label`, Escape tuşu ile tüm modalları kapatma (`useEffect` ile consolidated handler), TR/EN çeviri anahtarları (ariaMenu, ariaPrevMonth, ariaNextMonth, ariaToggleTheme, ariaAddExercise, ariaCloseModal, ariaNavigation, ariaMainContent)
- ✅ **Error boundary** — `ErrorBoundary` class component (React.Component), `getDerivedStateFromError` + `componentDidCatch`, iki katmanlı koruma (dış: Root etrafında, iç: App etrafında), tema-uyumlu kurtarma UI'ı (hata detayı, "Tekrar Dene" / "Sayfayı Yenile" butonları), TR/EN dil desteği (localStorage'dan lang okur)

### Kategori 4: UX / UI İyileştirmeleri ✅ TAMAMLANDI
- ✅ **Onboarding akışı** — İlk ziyarette 4 adımlı hoş geldin modalı (localStorage "logwise-onboard-done" ile takip), emoji illüstrasyonlar, "Başlayalım" / "Geç" butonları
- ✅ **Boş state'ler iyileştirme** — Hareketler, programlar ve takvim gün görünümünde motive edici mesajlar + aksiyon butonları, emoji illüstrasyonlar
- ~~**Swipe ile gün değiştirme (mobil)**~~ — Kaldırıldı (2026-04-08). Kullanım deneyimini kötüleştirdiği için devre dışı bırakıldı. Gün değiştirme yalnızca ▲/▼ butonları ve takvim üzerinden yapılıyor.
- ~~**Pull-to-refresh (mobil)**~~ — Kaldırıldı (2026-04-08). Kullanım deneyimini kötüleştirdiği için devre dışı bırakıldı.
- ✅ **Global arama** — Header'da arama ikonu, hareket adı/program adı/antrenman tarihi arama, sonuçlar dropdown'da tıklanabilir, tip etiketleri
- ✅ **Mobil bottom tab bar** — 5 sekme (Takvim, Panel, Hareketler, Programlar, Sosyal), safe-area-inset desteği, aktif sekme vurgulama, sadece mobilde görünür
- ✅ **Konfeti / PR animasyonu** — Yeni PR kırıldığında 30 parçacıklı CSS konfeti animasyonu, rastgele renkler, 2 saniye süre, fade/rotation/blur efektleri
- ✅ **Haptic feedback** — `haptic(type)` helper fonksiyonu, set ekleme (50ms), PR kırma ([100,50,100]), navigator.vibrate API

### Kategori 8: Sosyal Özellikler ✅ TAMAMLANDI
- ✅ **Profil sayfası geliştirme** — Biyografi (bio), PR showcase (top 8 PR kartları), takipçi/takip sayıları, public/private toggle, sekmeli yapı (Profil/İstatistikler/Güvenlik), başka kullanıcıların profilini görüntüleme (`/profile?id=xxx`), paylaşılan antrenmanlar listesi, link kopyalama
- ✅ **Antrenman paylaşma** — Gün görünümünde 📤 paylaş butonu, caption ekleyebilme, `shared_workouts` Supabase tablosu, otomatik link kopyalama, bağımsız `share.html` sayfası (authentication gerektirmez), paylaşan kullanıcının profil bilgileri, set detayları tablosu, CTA butonu
- ✅ **Liderlik tablosu** — Sosyal sekmesinde hareket bazında topluluk PR sıralaması, `user_prs` Supabase tablosu (denormalize), otomatik PR senkronizasyonu (veri yüklendiğinde), profil avatarları, medya sıralaması (🥇🥈🥉), kendi sıranı vurgulama
- ✅ **Arkadaş sistemi** — Instagram tarzı tek yönlü takip, `follows` Supabase tablosu, kullanıcı arama (display_name + username ilike), takip et/takiptesin butonları, antrenman akışı (feed) — takip edilen kişilerin paylaşılan antrenmanları, profil kartları, boş state yönlendirmeleri
- ✅ **Username sistemi** — Kayıt sırasında zorunlu username (3-20 karakter, harf/rakam/alt çizgi), uniqueness kontrolü, mevcut kullanıcılar için username seçme modalı, sidebar/leaderboard/feed/search/profile'da @username gösterimi
- ✅ **Profil bilgileri görünürlüğü** — Başka kullanıcının profilinde programlar, rozetler ve vücut ölçüleri görüntülenebilir. `show_profile_info` toggle'ı ile kullanıcı bu bilgileri gizleyebilir (default: açık). Takipçi/takip sayılarına tıklayınca liste modalı açılır.

### Diğer Düzeltmeler
- ✅ **Profil sayfası local fix** — `/profile` → `/profile.html` yönlendirmesi (Python HTTP server uyumu)

---

## 15. HENÜZ YAPILMAMIŞ / GELİŞTİRİLEBİLECEK ŞEYLER

### Kategori 5: Veri Yönetimi ✅ TAMAMLANDI (Fotoğraf hariç)
- ✅ Export/Import (JSON/CSV)
- ✅ Vücut ölçüleri takibi
- Fotoğraf ilerleme (Supabase Storage gerekli, henüz yapılmadı)
## 16. 2026-04-04 Username Kalicilik Duzeltmesi

- Username artik sadece modal submit aninda `profiles` tablosuna yazilmaya calisilmiyor; auth metadata'ya da kaydediliyor.
- Email onayi sebebiyle session geciken kayitlarda `profiles` satiri ilk authenticated ziyarette otomatik bootstrap/senkronize ediliyor.
- Bu sync sayesinde sosyal arama (`display_name` + `username`) kayip kalan username yuzunden bos donmuyor.
> Not (2026-04-04): Profil ve share linkleri kodda hardcoded yazilmaz. `profileRoute()` / `shareRoute()` helper'lari production'da clean URL, lokal static server'da `.html` fallback kullanir.

## 17. 2026-04-04 Son Bakim Notlari

- Hareket ve gun notu alanlarinda space/blank karakter kaybi yapan yazma akisi duzeltildi; textarea icinde bosluk kullanimi normal calisir.
- Vucut olculeri formuna `height` / boy destegi eklendi; olcum kayitlari kilo ile birlikte boy snapshot'i da tutabilir.
- Day view UX guncellendi: set ust aksiyonlari ve superset basliklari buyutuldu, `failure` secenegi kaldirildi, yerine `superset` set tipi ve hizli ekleme aksiyonu kullanildi.
- Kardiyo hareketleri artik set tipi yerine yalnizca sure ile calisir. Tablo, gecmis, export ve bos set temizligi bu modele gore davranir.
- Bir hareket gune ilk eklendiginde otomatik tek bos set ile baslar. Standart hareketlerde `0 kg / 0 tekrar`, kardiyoda `0 dakika` olusur.
- Hareketler ekraninda isim ve aciklama bloklari sola yaslidir; kategori cevirilerinde EN etiketler tamamlandi.
- Ana sayfa ve mobil layout icin ortak alt bosluk / safe-area tamponu eklendi; alttaki sabit butonlar artik sistem gezinme alaniyla cakisma riskini azaltir.
- Profile avatar gostergesi ana sayfada duzeltildi; secilen emoji avatar veya uzaktaki `avatar_url` kullanilabilir.
- Username kaliciligi auth metadata + `profiles` senkronu ile saglanir; eksik profil kayitlari ilk authenticated ziyarette bootstrap edilir.
- Lokal static server uyumu icin profil/share linkleri route helper uzerinden `.html` fallback ile uretilir.
- Paylasilan antrenmanlar icin yeni tercih sistemi vardir: profil ekraninda kullanici boy ve/veya kilo bilgisini paylasmayi acip kapatabilir. Bu tercihler auth metadata icinde saklanir ve share payload'ina snapshot olarak gomulur.
- `share.html` eski array formatini ve yeni `{exercises, meta}` formatini birlikte okuyacak sekilde geriye donuk uyumludur. Izin verildiyse paylasilan workout sayfasinda boy/kilo rozetleri ve olcum tarihi gosterilir.
- Mobil takvimde saga/sola kaydirarak gun degistirme toleransi artirildi. Dikey sapma kontrolu, daha yuksek swipe threshold'u ve gun degisiminde gorunur bir yon/tarih animasyonu eklendi.
- `Today` / `Bugun` butonu artik takvimi resetlemek yerine dogrudan bugunun antrenman gunu ekranini acar.
- Onceki antrenman referansinda ve history modalinda sadece setler degil, ilgili gune ait `dayNotes` metni de gosterilir.

## 18. 2026-04-08 Mobil Özellik Kaldırmaları

- **Pull-to-refresh kaldırıldı**: Aşağı çekme ile yenileme özelliği (state'ler: `pullY`, `pullState`, `touchStartY`; ref'ler: `pullStartRef`, `pullRefreshRef`, `pullYRef`; handler'lar: `handlePullStart/Move/End`; CSS: `@keyframes pullSpin`) tamamen kaldırıldı. Kullanım deneyimini olumsuz etkiliyordu. İleride daha iyi bir implementasyonla yeniden eklenebilir.
- **Swipe ile gün değiştirme kaldırıldı**: Gün görünümünde sağa/sola kaydırarak gün geçişi özelliği (swipe useEffect, `daySwipeRef`) kaldırıldı. Gün değiştirme yalnızca ▲/▼ butonları ile yapılıyor. Not: `dayNavFx` animasyonu ve `triggerDayFx` fonksiyonu **korundu** — bunlar ok butonlarıyla da kullanılıyor.

---

## 19. 2026-04-10 Takvim Görünümü: Geçmiş / Gelecek Hareket Ayrımı

### Değişiklik 1: Geçmiş günlerde sadece tamamlanan hareketler gösterilir

**Etkilenen fonksiyon**: `getEff(ds)` (index.html.babel-backup)

`getEff` fonksiyonuna `if(ds<today)return m;` kontrolü eklendi. Artık tarih bugünden önceyse program hareket listesine hiç bakılmıyor; yalnızca `data.workouts[ds]` içinde gerçekten kayıtlı (set girilmiş) hareketler döndürülüyor. Boş set temizliği (`prevViewRef` effect'i) zaten gün görünümünden çıkınca 0 kg/0 tekrar setlerini siliyor; dolayısıyla geçmiş günlerde `data.workouts` içinde kalan her hareket en az bir geçerli setle tamamlanmış demektir.

**Etkilenen JSX**: Gün görünümünde "Programdaki Hareketler" mavi kutusu (`unstarted` listesi), koşula `dk>=today` eklenerek geçmiş günlerde gizlendi. Geçmiş bir güne girildiğinde o gün için program önerisi artık çıkmıyor.

### Değişiklik 2: Yapılmamış program hareketleri takvimde saydam görünür

**Etkilenen bileşen**: `Pill` (ay ve hafta takvim grid'i)

`_pg:true` bayrağı taşıyan (program tarafından eklenen, henüz başlanmamış) hareket pill'lerine `opacity: 0.45` uygulandı. Tamamlanmış hareketler (`_pg` yok veya false) mevcut görünümlerini koruyor — hiçbir renk ya da stil değişikliği yok.

- **Ay görünümü**: `<Pill>` çağrısına `planned={w._pg}` prop'u eklendi.
- **Hafta görünümü**: Kart `<div>`'ine `opacity: w._pg ? 0.45 : 1` eklendi.
- **Pill bileşeni**: `planned` prop alacak şekilde güncellendi; `opacity: planned ? 0.45 : 1` style'a eklendi.

**Sonuç davranış özeti**:
- Geçmiş günler → sadece tamamlananlar, tam renk
- Bugün → tamamlananlar tam renk, henüz başlanmamış program hareketleri %45 opaklık
- Gelecek günler → tüm hareketler program kaynaklı, hepsi %45 opaklık

---

## 20. 2026-04-11 Girdi Doğrulama, Anomali Uyarısı ve Rozet Geri Alma

### Değişiklik 1: Ağırlık ve Tekrar Üst Limitleri (Clamp)

**Etkilenen fonksiyon**: `updSet` (index.html.babel-backup)

`updSet` içinde `newVal` hesaplandıktan sonra clamp eklendi:
- `f==="weight"` → `Math.min(newVal, 500)` (max 500 kg)
- `f==="reps"` → `Math.min(newVal, 100)` (max 100 tekrar)

Değer `onChange`'de anında sınırlanır; 501 yazmaya çalışırsan 500'e düşer.

### Değişiklik 2: Anomali Uyarısı

**Yeni state**: `anomalyConfirm` — `{eid, si, exName, newVal, prevMax}` veya null

**Yeni fonksiyon**: `checkAnomaly(eid, si, v)` — `updSet`'in hemen altında tanımlı. Ağırlık inputundan çıkılınca (`onBlur`) tetiklenir. O egzersizin **bugün dışındaki** geçmiş kayıtlarındaki max ağırlığını hesaplar; girilen değer bu max'ın 2 katından büyükse `anomalyConfirm` state'ini set eder.

**Tetikleyici**: Weight input'una `onBlur={e=>checkAnomaly(ex.id,si,e.target.value)}` eklendi.

**UI**: Toast bölgesinde turuncu kenarlıklı onay kutusu. İki buton:
- **"Evet, devam et"** → uyarıyı kapat, değer kalır
- **"Düzelt (sil)"** → `updSet` ile değeri sıfırlar, uyarıyı kapat

İlk antrenman (prevMax=0) durumunda tetiklenmez.

### Değişiklik 3: Rozet Geri Alma (Badge Revocation)

**Etkilenen fonksiyon**: `checkBadges(data)` — dönüş formatı değişti.

Eski: `return fresh` (sadece yeni kazanılanlar dizisi)
Yeni: `return {fresh, revokeIds}` — `fresh`: yeni kazanılacak rozetler, `revokeIds`: artık koşulu sağlamayan mevcut rozetlerin id'leri (Set).

Her badge için hem "kazanılmalı mı?" hem "geri alınmalı mı?" kontrolü yapılır:
- `ok && !unlockedIds.has(b.id)` → `fresh`'e ekle
- `!ok && unlockedIds.has(b.id)` → `revokeIds`'e ekle

**Etkilenen useEffect'ler**:
- Workouts useEffect: `checkBadges` çağrısı `{fresh, revokeIds}` destructure edildi. `revokeIds.size > 0` durumunda da `save()` tetiklenir; mevcut badge listesi filtreden geçirilir.
- Loading useEffect: sadece `fresh` kullanıldığından değişiklik minimal.

**Davranış**: Kullanıcı kazara yüksek ağırlık girip rozet aldıktan sonra değeri düzeltirse, bir sonraki `debouncedSave` → `data.workouts` değişimi → useEffect tetiklenince haksız rozetler otomatik geri alınır.

**Not**: Streak, antrenman sayısı, çeşitlilik gibi kümülatif rozetler tek bir set düzeltmesinden nadiren etkilenir. Ağırlık (pr_xxx) ve hacim (volume_xxx) rozetleri en çok etkilenebilecek kategorilerdir.

### Değişiklik 4: Service Worker Cache Versiyonu

`sw.js` içindeki `CACHE_NAME` `logwise-v4` → `logwise-v5` olarak güncellendi. Bu sayede yeni SW deploy edildiğinde eski precache temizlenir ve güncel `index.html` offline fallback olarak da saklanır.

---

## 21. 2026-04-11 Takvimde Bugünün Hücresi Vurgulaması

### Yöntem: Köşe Braketleri + Hafif İç Glow

Animasyon kullanılmadı. Hücreye iki şey eklendi:

**1. Hafif iç glow (parent hücre):**
- `position: "relative"` (absolute child için gerekli)
- `boxShadow: isT ? "inset 0 0 14px rgba(240,192,64,.07)" : "none"` — arka planı değiştirmeden nazik bir altın derinlik hissi

**2. Köşe braket overlay (child `<div>`):**
```jsx
{isT && <div aria-hidden="true" style={{
  position:"absolute", inset:0, pointerEvents:"none", zIndex:3,
  backgroundImage: "linear-gradient(var(--blue),var(--blue)), ...", // 8 adet
  backgroundSize: "2px 12px, 12px 2px, ...",  // dikey + yatay, 4 köşe için
  backgroundPosition: "0 0, 0 0, 100% 0, 100% 0, 0 100%, 0 100%, 100% 100%, 100% 100%",
  backgroundRepeat: "no-repeat"
}} />}
```

Her köşe için 2 gradient (dikey 2×12px + yatay 12×2px = L şekli). Layout etkilenmez, tıklama geçer (`pointerEvents:"none"`), `overflow:hidden` ile kırpılmaz (inset:0 ile hücre sınırları içinde).

### Etkilenen Hücreler

- **Aylık grid** (`calDays.map`): parent'a `position:"relative"` + `boxShadow`, son child olarak köşe overlay eklendi. `onMouseEnter/Leave` bugün hücresinde hover efektini bypass eder.
- **Haftalık grid içerik** (`weekDays.map`, alt content grid): aynı yapı. `const isT=k===today` zaten mevcuttu.

### Notlar
- CSS'e yeni `@keyframes` eklenmedi.
- `zIndex:3` overlay'i, hareket pill'lerinin üstünde render eder ama tıklamayı engellemez.
- Hover `onMouseLeave` her iki görünümde de `var(--bg)`'ye döner (tint yok).

---

## Bölüm 22 — Off Day (Dinlenme Günü) Özelliği

### Genel Bakış

Program oluştururken her güne "Dinlenme Günü" işareti konulabilir. Bu günlerde egzersiz listesi görünmez, uyum hesabı bu günleri atlar, takvim hücrelerinde 💤 ibaresi çıkar ve gün görünümünde bir banner gösterilir.

### Veri Yapısı

```js
// Program nesnesi — yeni offDays dizisi eklendi
{ name: "PPL", days: { "0": [...], "1": [], ... }, offDays: ["1","3","5"] }
```

`offDays` gün indeksleri string olarak saklanır (0=Pzt … 6=Paz), `days` objesi ile ayrı tutulur.

### Yeni State ve Ref'ler

```js
const [pgOffDays, setPgOffDays] = useState([]);
const pgodRef = useRef(pgOffDays);
pgodRef.current = pgOffDays;  // stale closure koruması
```

### Temel Fonksiyonlar

**`togOffDay(i)`** — gün index'ini `pgOffDays`'e ekler/çıkarır; off day yapılırken o günün egzersizleri temizlenir:
```js
const togOffDay = i => {
  const k = String(i);
  const od = pgodRef.current;
  if (od.includes(k)) { setPgOffDays(od.filter(x => x !== k)) }
  else { setPgOffDays([...od, k]); setPgDays(prev => ({...prev, [k]: []})) }
};
```

**`calcCompliance`** — off day'leri atlar:
```js
const pgOff = pg.offDays || [];
if (pgOff.includes(String(di)) || pgExs.length === 0) continue;
```

**`savePg`** — `offDays` kaydedilir:
```js
{ name: nm, days: nd, offDays: [...pgodRef.current] }
```

**`openEditPg`** — düzenleme açılırken off day'ler yüklenir:
```js
setPgOffDays([...(p.offDays || [])]);
```

**`resetPg`** — modal kapanınca temizlenir:
```js
setPgOffDays([]);
```

### Program Modal UI

- **Gün sekmeleri**: Off day günleri teal renkli `💤` badge gösterir; aktif sekme `tealL` arka plan alır.
- **Gün başlığı**: "💤 Dinlenme Günü Yap / Dinlenmeyi Kaldır" toggle butonu eklendi.
- **Gün içeriği**: Off day ise teal 💤 panel; değilse normal egzersiz arama/listesi.

### Takvim Göstergeleri

**Aylık grid** (`calDays.map`, satır ~1464):
```jsx
{eff.length === 0 && (aProg?.offDays || []).includes(String(gdow(d))) &&
  <div style={{fontSize:10, color:"var(--teal)", textAlign:"center", marginTop:4, opacity:.8}}>
    💤 {L.offDay}
  </div>}
```

**Haftalık grid içerik** (`weekDays.map` alt grid, satır ~1490):
```jsx
{eff.length === 0 && (aProg?.offDays || []).includes(String(gdow(d))) &&
  <div style={{fontSize:11, color:"var(--teal)", textAlign:"center", padding:"8px 0", opacity:.8}}>
    💤 {L.offDay}
  </div>}
```

Her iki yerde de koşul: antrenman yoksa VE aktif programda o gün off day ise göster.

### Gün Görünümü Banner'ı

Day view header'ın hemen altına (Rest Timer Widget öncesi, satır ~1521):
```jsx
{(aProg?.offDays || []).includes(String(di)) && manual.length === 0 &&
  <div style={{background:"var(--tealL)", border:"1px solid var(--teal)", borderRadius:10,
               padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:10}}>
    <span style={{fontSize:20}}>💤</span>
    <div style={{fontSize:13, fontWeight:500, color:"var(--teal)"}}>{L.offDayBanner}</div>
  </div>}
```

Banner yalnızca o güne ait manual antrenman yokken gösterilir (kullanıcı yine de antrenman kaydedebilir).

### Çeviriler

TR: `offDay:"Dinlenme"`, `setOffDay:"Dinlenme Günü Yap"`, `removeOffDay:"Dinlenmeyi Kaldır"`, `offDayBanner:"Bu gün programında dinlenme günü."`

EN: `offDay:"Rest"`, `setOffDay:"Mark as Off Day"`, `removeOffDay:"Remove Off Day"`, `offDayBanner:"This day is a rest day in your program."`

### Sidebar Aktif Program

Sidebar program özeti (`L.days.map`, satır ~1158) off day günleri zaten filtreler çünkü `exs.length === 0` kontrolüyle sadece egzersiz olan günleri render eder. Off day işaretli ve egzersiz temizlenmiş günler otomatik olarak gizlenir.

### SW Versiyonu

Off day özelliği tamamlandıktan sonra `sw.js` içindeki `CACHE_NAME` gerekirse artırılmalıdır (şu an `logwise-v5`).

---

## Bölüm 23 — Profil Bilgileri Görünürlüğü ve Takipçi Listesi (2026-04-12)

### Genel Bakış

Başka kullanıcıların profilinde programlar, rozetler ve vücut ölçüleri görüntülenebilir. Kullanıcı kendi profilinden bu bilgilerin görünüp görünmeyeceğini toggle ile kontrol edebilir. Takipçi ve takip edilen sayılarına tıklanınca liste modalı açılır.

---

### Supabase Değişiklikleri

**1. `profiles` tablosuna yeni kolon:**
```sql
alter table profiles add column if not exists show_profile_info boolean default true;
```

**2. `user_data` için yeni SELECT politikası:**
```sql
create policy "user_data_select_public" on user_data
  for select using (
    exists (
      select 1 from profiles
      where profiles.user_id = user_data.user_id
      and profiles.is_public = true
      and profiles.show_profile_info = true
    )
  );
```
Mevcut `user_data_select` politikası (sadece kendi verisi) ile birlikte OR mantığıyla çalışır. Kullanıcı her zaman kendi verisini okuyabilir.

**3. `follows` SELECT politikası genişletildi:**
```sql
drop policy if exists "follows_select" on follows;
create policy "follows_select" on follows for select using (true);
```
Takipçi/takip listelerinin görüntülenebilmesi için herkese açık okuma izni verildi.

---

### profile.html Değişiklikleri

#### Yeni Global Sabitler (ProfileApp fonksiyonundan önce)

- `BADGES` — 30 rozet dizisi (index.html'den kopyalandı)
- `getBadgeName(b, lang)` — rozet adı lokalizasyonu
- `getBadgeCatLabel(cat, lang)` — rozet kategori etiketi
- `MEASURE_LABELS_TR / MEASURE_LABELS_EN` — ölçüm alan isimleri
- `MEASURE_UNITS` — ölçüm birimleri (kg, cm, %)

#### Yeni State'ler

```js
const[viewUserData,setViewUserData]=useState(null);       // başka kullanıcının antrenman verisi
const[showProfileInfo,setShowProfileInfo]=useState(true); // kendi gizlilik ayarı
const[followListModal,setFollowListModal]=useState(null); // "followers"|"following"|null
const[followList,setFollowList]=useState([]);             // listedeki profiller
const[followListLoading,setFollowListLoading]=useState(false);
```

#### Yeni Fonksiyonlar

**`toggleShowProfileInfo()`** — `profiles.show_profile_info` alanını toggle eder, anında Supabase'e yazar.

**`loadFollowList(type, targetUserId)`** — `follows` tablosundan kullanıcı ID'lerini çeker, ardından `profiles` tablosundan avatar/username/display_name bilgilerini getirir. `type`: `"followers"` veya `"following"`.

#### Viewed User Profili — Yeni İçerik

`viewUserData` yüklendikten sonra (RLS izin veriyorsa) profil sayfasında şunlar gösterilir:

- **📋 Programlar** — Haftalık programlar gün-hareket detayıyla, günlük programlar hareket listesiyle. Aktif program yeşil AKTİF badge'i ile vurgulanır.
- **🏅 Rozetler** — Kazanılmış rozetler ikon, isim, kategori ve kazanılma tarihi ile grid görünümde.
- **📏 Vücut Ölçüleri** — En son ölçüm: sadece dolu alanlar gösterilir (kilo, boy, göğüs, bel vb.).

`show_profile_info === false` ise yerine 🔒 "Bu kullanıcı profil bilgilerini gizli tutuyor." mesajı gösterilir.

#### Kendi Profili — Yeni İçerik

- **Takipçi / Takip sayıları tıklanabilir** oldu → `loadFollowList()` tetiklenir.
- **"Profil bilgilerini göster" toggle'ı** — Profil sekmesinde Paylaşım Tercihleri kartının altında. Programlar, rozetler ve ölçümlerin başkalarına görünüp görünmeyeceğini kontrol eder.

#### Follow List Modalı

Her iki view'da (kendi profil + başka kullanıcı profili) kullanılır. Avatar, display_name ve @username gösterir. Tıklanınca o kullanıcının profil sayfasına yönlendirir.

#### Yeni Çeviri Anahtarları (TR/EN)

`showProfileInfo`, `profileInfoDesc`, `profileInfoHidden`, `programsLabel`, `badgesLabel`, `measurementsLabel`, `noPrograms`, `noBadgesProfile`, `noMeasurementsProfile`, `followersList`, `followingList`, `weeklyProgram`, `dailyProgram`, `activeLabel`

---

### Davranış Özeti

| Durum | Ne gösterilir |
|-------|--------------|
| `is_public=true` + `show_profile_info=true` | Programlar, rozetler, ölçüler tam görünür |
| `is_public=true` + `show_profile_info=false` | 🔒 gizli mesajı |
| `is_public=false` | Profil hiç görünmez (mevcut davranış) |
