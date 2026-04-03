# LOG WISE — Tam Proje Rehberi (Claude Code İçin)

Bu doküman, LOG WISE projesinin kuruluşundan güncel haline kadar her şeyi açıklar. Claude Code'a bu dosyayı okutarak projeye hakim olması sağlanır.

---

## 1. PROJE NEDİR?

LOG WISE, tek sayfalık (SPA) bir antrenman takip web uygulamasıdır. Kullanıcılar hareketlerini tanımlar, haftalık veya günlük programlar oluşturur, takvim üzerinden günlere hareket ekler ve her set için ağırlık/tekrar/RIR kaydı tutar. Dashboard ile ilerleme takibi yapılır.

- **Canlı URL**: https://logwise.fit/ (Netlify deploy, custom domain)
- **Eski URL**: https://incomparable-starburst-f7802c.netlify.app/
- **Teknoloji**: React 18 + Babel Standalone (tarayıcıda JSX derleme, build step yok), Supabase (auth + veritabanı), Chart.js 4.4.4
- **Ana dosya**: `index.html` (~1650 satır, tüm CSS/JS/React inline tek dosyada)
- **Font**: Google Fonts — Space Mono (body), Archivo Black (logo)

---

## 2. DOSYA YAPISI

```
LogWise/
├── index.html              ← Ana uygulama (tüm CSS + JS + React)
├── profile.html            ← Profil sayfası (ayrı sayfa)
├── 404.html                ← 404 sayfası
├── netlify.toml            ← Deploy ayarları, redirect kuralları, header'lar
├── manifest.json           ← PWA manifest
├── supabase_setup.sql      ← Supabase tablo şemaları + RLS politikaları
├── favicon.ico             ← Favicon
├── icon-192.png            ← PWA ikon (192x192)
├── icon-512.png            ← PWA ikon (512x512)
├── apple-touch-icon.png    ← iOS ikon
├── logo_küçük.png          ← Küçük logo
├── logo-concepts.html      ← Logo konseptleri (geliştirme amaçlı)
├── logo-calendar.html      ← Takvim logosu (geliştirme amaçlı)
├── local-server.bat        ← Yerel sunucu başlatma scripti
├── local-server-mobile.bat ← Mobil test için yerel sunucu
├── index.html.backup       ← Yedek (76KB, eski versiyon)
├── index.html.backup2      ← Yedek (99KB, ara versiyon)
├── .gitignore              ← Git ignore kuralları
├── PROJE-OZETI.md          ← Eski proje özeti (güncel değil)
├── DEVAM_PROMPT.md         ← Eski devam promptu (güncel değil)
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
- **Auth**: Email/password + Google OAuth
- **RLS** (Row Level Security) aktif — her kullanıcı sadece kendi verisini görür
- **Hesap silme**: `delete_own_account()` SQL fonksiyonu ile

### 3.3 Kayıt Stratejisi (Çok Önemli)

Üç farklı kayıt fonksiyonu var:

- `save(newData)` → Anında kayıt. Misafirse localStorage'a, kullanıcıysa Supabase'e upsert.
- `debouncedSave(newData)` → 1 saniyelik debounce ile kayıt. Gün görünümündeki set düzenleme gibi sık CRUD işlemlerinde kullanılır.
- `localUpdate(newData)` → Sadece React state günceller, hiçbir yere kaydetmez.
- `flushSave()` → Bekleyen debounced kayıtları anında flush eder (gün görünümünden çıkınca çağrılır).

**Gün görünümünden çıkınca**: 0×0 setler temizlenir (weight ve reps ikisi de 0 olan setler silinir) ve `flushSave()` çağrılır.

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
- `/profile` → Profil sayfası (ayrı HTML dosyası)

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
- `workouts[].sets[].type` — **YENİ**: `"working"` (varsayılan), `"warmup"`, `"drop"`, `"failure"`.
- `workouts[].supersetGroup` — **YENİ**: Aynı superset grubundaki hareketler aynı ID'yi paylaşır.
- `programs[].days` — Key'ler string olmalı ("0"–"6", Pazartesi=0, Pazar=6). `savePg` fonksiyonunda normalize edilir.
- `dailyPrograms` — Haftanın günlerinden bağımsız, sadece hareket listesi içeren programlar.
- `activeProgram` — Aktif haftalık program ID'si veya null. Aynı anda sadece bir program aktif olabilir.
- `durations` — Timer kayıtları, gün bazında saniye cinsinden dizi.
- `badges` — **YENİ**: Kazanılan rozetler dizisi. Her eleman `{id, unlockedAt}` formatında. `checkBadges()` fonksiyonu ile otomatik kontrol edilir.
- `measurements` — Vücut ölçüleri. Key = tarih string, value = ölçüm dizisi. Her ölçüm: `{id, date, weight, bodyFat, chest, waist, hips, bicepL, bicepR, thighL, thighR, neck, shoulders}`. Sadece doldurulan alanlar kaydedilir.
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

- O gün eklenen hareketler kart olarak listelenir. Her kartta set tablosu (# | TİP | KG | TEKRAR | RIR | Sil).
- **Set Tipleri**: Her set için Working/Warm-up/Drop/Failure seçimi. Renk kodlu (#, border).
- **Önceki Antrenman Referansı**: Her hareketin üstünde son seanstaki set verileri gösterilir (tarih + ağırlık×tekrar pill'leri).
- **Hareket Sıralama**: ▲/▼ butonları ile hareket sırası değiştirilebilir.
- **Gün Notu**: 📝 butonu ile o güne not eklenebilir (textarea, debouncedSave).
- **Hareket Notu**: Her hareketin 📝 butonuyla o harekete özel not eklenebilir.
- **Süper Set / Giant Set**: 🔗 butonu ile ardışık hareketler gruplandırılabilir. 2 hareket = Superset, 3+ = Giant Set. Mor border ile görsel ayrım.
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
- Tüm kayıtlı günler ters kronolojik sırayla: tarih, max ağırlık, hacim, set detayları
- PR (personal record) sağ üstte gösterilir
- **1RM Gösterimi**: Epley ve Brzycki tahmini 1RM değerleri mor ve teal kartlarda gösterilir
- Her seans için ayrı 1RM tahmini de listelenir

### 6.8 Veri Yönetimi (YENİ)

Sidebar'da `📦 Veri Yönetimi` linki ile erişilir. `/data` URL'i. 2 sekmeli yapı:

**Veriler Sekmesi:**
- JSON Dışa Aktarma: Tüm veriyi JSON olarak indirme (yedekleme için)
- CSV Dışa Aktarma: Antrenman kayıtlarını CSV tablo olarak indirme
- JSON İçe Aktarma: Dosya seçici ile önceden dışa aktarılmış JSON yükleme, mevcut veriyi üzerine yazar
- Veri Özeti: Hareket, antrenman günü, toplam set, program, ölçüm sayıları

**Ölçüler Sekmesi:**
- Vücut ölçüleri: Kilo, vücut yağı %, göğüs, bel, kalça, biceps (L/R), bacak (L/R), boyun, omuz
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
Satır 1-88      HTML head, CSS (değişkenler, animasyonlar, dark/light tema, dashboard animasyonları)
Satır 89-97     Noscript fallback, root div
Satır 98-107    Supabase client, React hooks, sabitler (D, DF, MO, CATS, CC)
Satır 108-182   PRESET_EXERCISES dizisi (~56 hazır hareket, yorum bloğu ile açıklanmış)
Satır 183-232   EX_DESCS (hareket açıklamaları), getExDesc helper, presetName helper
Satır 233-241   PRESET_PROGRAMS dizisi (4 hazır program şablonu: PPL, Upper/Lower, Full Body, Bro Split)
Satır 242-245   RIRS, yardımcı fonksiyonlar (fmt, pD, gdow, storage keys, eDays)
Satır 246-250   SET_TYPES, ST_LABELS_TR/EN, ST_COLORS, REST_PRESETS sabitleri
Satır 251-252   init() fonksiyonu (programMeta dahil), migrateData() fonksiyonu
Satır 253-260   Dashboard + program yardımcı fonksiyonları (calc1RM, calcBrzycki, calcStreak, calcWeekFreq, calcMonthFreq, getAllPRs, calcCompliance)
Satır 261-268   BADGES sabiti (30 rozet), getBadgeName, getBadgeCatLabel, calcBadgeStats, checkBadges, getNextBadge fonksiyonları
Satır 269-270   TR ve EN çeviri objeleri (~185+ anahtar, badge/notif keys dahil)
Satır 264-284   DashChart bileşeni (Chart.js canvas yönetimi)
Satır 286-366   AuthScreen bileşeni (login/register/forgot modal, Google OAuth)
Satır 368-~1500 App bileşeni (ana uygulama):
  States       view, calendar, sidebar, mobile, dashboard, chart, rest timer, drag, note, superset, program modal, edit exercise, cycle, dataTab, measureForm, badgeToast, notifPerm states
  Timer        Timer + rest timer countdown, localStorage persist
  Auth/Save    save/debouncedSave/flushSave/localUpdate
  Routing      URL routing, page title, view transitions, 0×0 temizlik, beforeunload
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
  JSX:Guest    Guest banner
Satır ~1500-1510 S style objesi (inline style sabitleri)
Satır ~1515-1550 Root bileşeni (auth state, lang, theme), ReactDOM render
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

Netlify'da deploy ediliyor. `netlify.toml` içeriği:

- `publish = "."` — kök dizin publish edilir
- SPA redirect'leri: `/dashboard`, `/exercises`, `/programs`, `/feedback`, `/data` → `/index.html` (status 200)
- `/profile` → `/profile.html` (status 200)
- Pretty URL redirect'leri: `/index.html` → `/`, `/profile.html` → `/profile`
- 404 catch-all: `/*` → `/404.html`
- Güvenlik header'ları: X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- Cache: public, max-age=3600

---

## 11. GEÇMİŞTE YAŞANAN SORUNLAR VE ÇÖZÜMLER

1. **Dosya kesintisi (3+ kez)**: Edit işlemlerinde dosyanın sonu kesildi → beyaz ekran. `Root` fonksiyonu ve `</script></body></html>` kapanış etiketleri kayboldu. **Çözüm**: Her edit sonrası `tail -5 index.html` ile kontrol, bracket balance check yapılmalı.

2. **Stale closure bug**: `savePg`, `togPgEx` fonksiyonlarında eski state okunuyordu. **Çözüm**: useRef pattern (yukarıda açıklandı).

3. **Program days key normalizasyonu**: `pgDays` objesinde key'lerin number yerine string olması gerekiyordu. **Çözüm**: `savePg` içinde `for(let i=0;i<7;i++){nd[String(i)]=[...]}`.

4. **Babel SyntaxError**: Dosya kesintisinden kaynaklı eksik JSX. **Çözüm**: Eksik satırlar eklendi.

5. **Session persistence**: Auth state race condition. **Çözüm**: `onAuthStateChange` + `getSession()` fallback, `ready` flag.

---

## 12. ÖNEMLİ KURALLAR (Claude Code İçin)

1. **Chrome'da test etme** — Claude in Chrome eklentisi ile siteyi açıp kontrol etmeye çalışma.

2. **Tek dosya uygulaması** — Tüm CSS, JS, React tek `index.html` içinde. Ayrı dosyalara bölme.

3. **Babel standalone** — `<script type="text/babel">` kullanılıyor, import/export yok, build step yok.

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

---

## 13. SUPABASE SETUP

Supabase Dashboard → SQL Editor'da `supabase_setup.sql` çalıştırılarak tablolar ve RLS politikaları oluşturulur. Önemli detaylar:

- `user_data` tablosu: JSONB blob, `user_id` UUID primary key
- `feedback` tablosu: `id` text PK, `user_id`, `msg`, `cat`, `rating`, `created_at`
- RLS politikaları: SELECT/INSERT/UPDATE/DELETE — `auth.uid() = user_id`
- `delete_own_account()` fonksiyonu: Kullanıcının kendi hesabını silmesi için

---

## 14. TAMAMLANAN ÖZELLİKLER (Son Güncelleme: 2026-04-03)

### Kategori 1: Veri & İlerleme Takibi ✅ TAMAMLANDI
- ✅ **Grafik/Chart sistemi** — Chart.js ile ağırlık/hacim/1RM ilerleme grafiği
- ✅ **Dashboard / Özet Ekranı** — 3 sekmeli (Overview, Progress, Frequency)
- ✅ **1RM Tahmini** — Epley + Brzycki formülleri, history modal ve dashboard'da gösterim
- ✅ **Kas grubu ısı haritası** — Haftalık/aylık frekans, renk kodlu kartlar
- ✅ **Streak takibi** — Gün üst üste sayacı, 3+ günde animasyon
- ✅ **PR tablosu** — Top 10, tahmini 1RM ile sıralı

### Kategori 2: Gün Görünümü / Antrenman Deneyimi ✅ TAMAMLANDI
- ✅ **Set tipleri** — Working / Warm-up / Drop / Failure, renk kodlu
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
- ✅ **Vücut ölçüleri takibi** — Kilo, vücut yağı, göğüs, bel, kalça, biceps, bacak, boyun, omuz ölçümleri
- ✅ **Veri özeti** — Hareket, antrenman günü, set, program, ölçüm sayıları

### Kategori 6: Bildirimler & Motivasyon ✅ TAMAMLANDI
- ✅ **Başarımlar / Rozetler** — 30 rozet, 6 kategori (Antrenman, Seri, PR, Hacim, Set, Çeşitlilik), BADGES sabiti, checkBadges() ile otomatik kontrol, kutlama toast animasyonu, ilerleme çubukları, kilitli/açık görsel fark
- ✅ **Streak görsel iyileştirme** — pulseGlow animasyonu (3+ gün), rozetler sekmesinde seri göstergesi
- ✅ **Bildirim hatırlatıcı** — Notification API, antrenman günü tespiti (aktif program + bugünün günü), izin yönetimi, günlük tekrar engeli (localStorage key)

### Diğer Düzeltmeler
- ✅ **Profil sayfası local fix** — `/profile` → `/profile.html` yönlendirmesi (Python HTTP server uyumu)

---

## 15. HENÜZ YAPILMAMIŞ / GELİŞTİRİLEBİLECEK ŞEYLER

### Kategori 4: UX / UI İyileştirmeleri
- Onboarding akışı
- Boş state'ler iyileştirme
- Swipe ile gün değiştirme (mobil)
- Arama (global)
- Konfeti / animasyon (PR kırıldığında)

### Kategori 5: Veri Yönetimi ✅ TAMAMLANDI (Fotoğraf hariç)
- ✅ Export/Import (JSON/CSV)
- ✅ Vücut ölçüleri takibi
- Fotoğraf ilerleme (Supabase Storage gerekli, henüz yapılmadı)

### Kategori 6: Bildirimler & Motivasyon ✅ TAMAMLANDI
- ✅ **Başarımlar / Rozetler** — 30 rozet, 6 kategori (Antrenman, Seri, Ağırlık PR, Hacim, Set, Çeşitlilik), otomatik kontrol, kutlama toast'u, ilerleme çubukları
- ✅ **Streak görsel iyileştirme** — Dashboard'da pulseGlow animasyonu, rozetler sekmesinde seri göstergesi
- ✅ **Hatırlatma bildirimleri** — Notification API ile antrenman günü hatırlatması, izin yönetimi, günlük tekrar kontrolü

### Kategori 7: Teknik / Altyapı
- PWA offline desteği (Service Worker)
- Performans iyileştirmeleri
- Erişilebilirlik (a11y)
- Error boundary

### Kategori 8: Sosyal Özellikler
- Profil sayfası geliştirme
- Antrenman paylaşma
- Liderlik tablosu
- Arkadaş sistemi
