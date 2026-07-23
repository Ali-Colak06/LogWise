# LOG WISE — Refactor Geçmişi ve Tam Proje Rehberi

> ⚠️ **ÖNEMLİ — AI araçları için okuma sırası:**
> Bu dosya projenin **tarihsel refactor kaydı** ve kapsamlı referans kılavuzudur (40+ Bölüm). Büyük ve kapsamlıdır.
>
> **Aktif kurallar, seans check-list'i, dosya haritası ve "nereye bakayım?" yönlendirmeleri için ÖNCE [`AGENTS.md`](AGENTS.md) dosyasını oku.** Görev-tipi reçeteler için [`docs/`](docs/) klasörüne bak.
>
> Bu dosya, yalnızca bir refactor aşamasına veya tarihsel bir karara ihtiyacın olduğunda referans amacıyla okunmalıdır. Öncesinde dosya adı `CLAUDE-CODE-REHBER.md` idi; 2026-04-20 tarihinde DOC-1 altyapısıyla birlikte `REFACTOR-GECMISI.md`'ye yeniden adlandırıldı.

Bu doküman, LOG WISE projesinin kuruluşundan güncel haline kadar her şeyi açıklar. AI araçları bu dosyayı referans olarak kullanır.

```

---

## 1. PROJE NEDİR?

LOG WISE, tek sayfalık (SPA) bir antrenman takip web uygulamasıdır. Kullanıcılar hareketlerini tanımlar, haftalık veya günlük programlar oluşturur, takvim üzerinden günlere hareket ekler ve her set için ağırlık/tekrar/RIR kaydı tutar. Dashboard ile ilerleme takibi yapılır.

- **Canlı URL**: https://logwise.fit/ (Cloudflare Pages deploy, custom domain)
- **Eski URL**: https://incomparable-starburst-f7802c.netlify.app/
- **Teknoloji**: React 18, `React.createElement()` çağrıları doğrudan `.html` dosyalarında (derleme adımı yok — bkz. Bölüm 27), Supabase (auth + veritabanı), Cloudflare R2 (resim depolama), Cloudflare Workers (resim API), Chart.js 4.4.4
- **Ana dosya**: `index.html` (ana uygulama; tüm UI `React.createElement()` çağrılarıyla yazılır, JSX yok)
- **Font**: Google Fonts — Space Mono (body), Archivo Black (logo)

---

## 2. DOSYA YAPISI

```
LogWise/
├── data/                   ← Refactor Aşama 1 ile eklenen veri/sabit klasörü (bkz. Bölüm 28, 29, 30)
│   ├── i18n-tr.js          ← window.LOGWISE_TR — index.html için Türkçe çeviri anahtarları
│   ├── i18n-en.js          ← window.LOGWISE_EN — index.html için İngilizce çeviri anahtarları
│   ├── i18n-tr-profile.js  ← window.LOGWISE_TR_PROFILE — profile.html için Türkçe
│   ├── i18n-en-profile.js  ← window.LOGWISE_EN_PROFILE — profile.html için İngilizce
│   ├── badges.js           ← window.LOGWISE_BADGES — 30 rozet tanımı (Adım B)
│   ├── presets-exercises.js ← window.LOGWISE_PRESET_EXERCISES — 55 hazır hareket (Adım C)
│   ├── ex-descriptions.js  ← window.LOGWISE_EX_DESCS — hareket kısa açıklamaları (TR/EN) (Adım C)
│   ├── ex-preview.js       ← window.LOGWISE_EX_PREVIEW — hareket önizleme (gif/uzun desc/tips) (Adım C)
│   └── presets-programs.js ← window.LOGWISE_PRESET_PROGRAMS — 4 hazır program şablonu (Adım D)
├── lib/                    ← Refactor Aşama 1 — yardımcı fonksiyonlar klasörü (bkz. Bölüm 29)
│   ├── calc.js             ← window.LOGWISE_CALC — 11 saf hesaplama/tarih fonksiyonu (Adım E-1)
│   ├── badge-logic.js      ← window.LOGWISE_BADGE_LOGIC — rozet adı/etiket + calcBadgeStats/checkBadges/getNextBadge (Adım E-2)
│   ├── data-schema.js      ← window.LOGWISE_SCHEMA — init + migrateData (Adım F)
│   ├── profile-utils.js    ← window.LOGWISE_PROFILE_UTILS — normalizeUsername/isValidUsername/defaultDisplayName/defaultAvatar/buildProfileRow (Faz 2A, Bölüm 34)
│   └── db.js               ← window.LOGWISE_DB — Supabase client + profileRoute + syncProfileRecord (Faz 2D, Bölüm 41)
├── styles/                 ← Refactor Aşama 2 Faz 2B — paylaşılan CSS (Bölüm 35)
│   └── base.css            ← reset + scrollbar + :root (46 değişken superset) + [data-theme=light] + .sr-only + ortak @keyframes (fadeIn/scaleIn/toastIn/toastOut/countUp/shine)
├── components/             ← Refactor Aşama 2 Faz 2C — React bileşenleri (window.LOGWISE_COMPONENTS namespace)
│   ├── error-boundary.js   ← LOGWISE_COMPONENTS.ErrorBoundary — class component, en dış hata yakalayıcı (Faz 2C-1, Bölüm 36)
│   ├── brand-mark.js       ← LOGWISE_COMPONENTS.BrandMark — saf sunumsal logo bileşeni, props: size/pad/radius/style (Faz 2C-2, Bölüm 37)
│   ├── dash-chart.js       ← LOGWISE_COMPONENTS.DashChart — Chart.js line chart, canvas ref'leri dışarıdan alır (Faz 2C-3, Bölüm 38)
│   ├── ex-preview-modal.js ← LOGWISE_COMPONENTS.ExPreviewModal — egzersiz önizleme modalı (GIF/desc/tips), catLabel prop alır (Faz 2C-4, Bölüm 39)
│   └── auth-screen.js      ← LOGWISE_COMPONENTS.AuthScreen — login/register/forgot + Google OAuth, window.LOGWISE_DB'den sb/profileRoute/syncProfileRecord okur (Faz 2C-5/Bölüm 40; 2D'de bridge prop'lar kaldırıldı, Bölüm 41)
├── index.html              ← Ana uygulama (tüm CSS + JS + React; TR/EN + BADGES + presets artık data/ ve lib/'ten yükleniyor)
├── profile.html            ← Profil sayfası (ayrı sayfa, sosyal özellikler dahil; TR/EN + BADGES data/ ve lib/'ten)
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
├── program.html            ← Program paylaşım sayfası (public, base64 URL ile veri)
├── PRESET_PROGRAM_ONERILERI.md ← Yeni preset program fikirleri, etiketler ve haftalık taslaklar
├── PRESET_PROGRAM_ONERILERI_READABLE.html ← Program önerisi belgesinin okunabilir HTML versiyonu
├── PRESET_PROGRAM_ONERILERI.pdf ← Program önerisi belgesinin okunabilir PDF export'u
├── AGENTS.md               ← AI araçları için giriş noktası — kurallar, dosya haritası, seans check-list (DOC-1, Bölüm 42)
├── REFACTOR-GECMISI.md     ← Bu dosya — refactor tarihsel kaydı (eski ad: CLAUDE-CODE-REHBER.md)
├── docs/                   ← Görev-tipi reçeteler (DOC-1, Bölüm 42)
│   ├── PRESET-EXERCISE-EKLEME.md  ← Yeni hareket ekleme reçetesi
│   ├── PRESET-PROGRAM-EKLEME.md   ← Yeni program ekleme reçetesi
│   ├── YENI-COMPONENT.md          ← React bileşeni ekleme pattern'i
│   └── SW-VERSION-BUMP.md         ← Service Worker versiyon bump kuralları
└── logwise-worker/         ← Cloudflare Worker (resim upload/serve API)
    ├── src/
    │   └── worker.js       ← Worker kaynak kodu
    └── wrangler.toml       ← Wrangler deploy konfigürasyonu
```

---

## 3. TEKNİK MİMARİ

### 3.1 Tek Dosya Uygulaması

Tüm uygulama mantığı ağırlıklı olarak `index.html` içinde. Runtime'da Babel Standalone kullanılmıyor; kod doğrudan `React.createElement()` çağrılarıyla yazılır, derleme adımı yoktur. Kod değiştirirken `.html` dosyasında doğrudan çalışılır. JSX kullanılmaz. **Geçmişte** `*.babel-backup` kaynak JSX + `compile.js` derleyici kullanılıyordu; bu sistem 2026-04-17'de kaldırıldı (bkz. Bölüm 27). CDN'lerden yüklenen kütüphaneler:

- React 18.3.1 (production)
- ReactDOM 18.3.1
- Supabase JS v2
- **Chart.js 4.4.4** (dashboard grafikleri için)

### 3.2 Supabase Backend

- **URL**: `https://czbxujioufhmvoajqwzp.supabase.co`
- **Not**: Supabase artık JWT'leri RS256 (asimetrik) ile imzalıyor. Token doğrulama gerektiren Worker veya harici servisler HMAC/HS256 değil, Supabase'in `/auth/v1/user` endpoint'ini kullanmalı.
- **Tablolar**:
  - `user_data` — JSONB blob, kullanıcı başına tek satır (tüm egzersiz/antrenman/program verisi)
  - `feedback` — Geri bildirim satırları
  - `profiles` — Kullanıcı profilleri (username, display_name, bio, avatar, is_public, show_profile_info). Kayıt sırasında username ile oluşturulur. Username unique + case-insensitive index. E-posta onayı sonrası ilk girişte username auth metadata + `profiles` senkronu ile otomatik tanınır; username modalı yalnızca gerçekten username'i olmayan eski/eksik hesaplarda açılır. `show_profile_info` (boolean, default true) — programlar/rozetler/ölçümlerin başkalarına görünüp görünmeyeceğini kontrol eder.
  - `shared_workouts` — Paylaşılan antrenmanlar (id, user_id, workout_date, workout_data JSONB, exercise_names JSONB, caption)
  - `user_prs` — Kullanıcı PR'ları liderlik tablosu için denormalize (user_id+exercise_name PK, max_weight, estimated_1rm). Veri yüklendiğinde otomatik senkronize edilir.
  - `follows` — Takip sistemi (follower_id, following_id PK). Tek yönlü, Instagram tarzı.
- **Auth**: Email/password + Google OAuth
- **RLS** (Row Level Security) aktif — her kullanıcı sadece kendi verisini görür
- **Hesap silme**: `delete_own_account()` SQL fonksiyonu ile

### 3.3 Cloudflare R2 + Worker (Resim Depolama)

Resim dosyaları (profil fotoğrafları, ileride antrenman fotoğrafları) Supabase Storage yerine **Cloudflare R2**'de tutulur.

**Neden R2?**
- Supabase Storage'ın ücretsiz katmanı çok kısıtlı
- R2'nin 10 GB ücretsiz depolaması ve **sıfır egress ücreti** var
- Zaten Cloudflare Pages kullanıldığı için aynı ekosistem

**Mimari:**
- **Bucket adı**: `logwise-images`
- **Worker URL**: `https://logwise-images-worker.colak-ali1928.workers.dev`
- **Worker kaynak**: `logwise-worker/src/worker.js`

**Worker Endpoint'leri:**
- `GET /<key>` → Resmi herkese açık serve et (cache-control: 1 yıl)
- `PUT /avatars/<userId>/<dosya>` → Profil fotoğrafı yükle (auth gerekli)
- `PUT /workouts/<userId>/<dosya>` → Antrenman fotoğrafı yükle (auth gerekli)
- `DELETE /<key>` → Resim sil (auth gerekli, sadece kendi klasörü)

**Auth Yöntemi:**
Token doğrulama, Supabase'in kendi endpoint'ine sorarak yapılır (RS256 uyumlu):
```
GET https://czbxujioufhmvoajqwzp.supabase.co/auth/v1/user
Authorization: Bearer <token>
apikey: <anon_key>
```

**Worker Secret'ları** (`wrangler secret put` ile eklendi):
- `SUPABASE_URL` → `https://czbxujioufhmvoajqwzp.supabase.co`
- `SUPABASE_ANON_KEY` → Supabase anon public key
- `WORKER_URL` → `https://logwise-images-worker.colak-ali1928.workers.dev`
- `ALLOWED_ORIGIN` → `https://logwise.fit`

**Frontend Entegrasyonu (`profile.html`):**
- `WORKER_URL` sabiti eklendi
- `uploadingAvatar` state + `avatarFileRef` ref eklendi
- `uploadAvatarPhoto(e)` fonksiyonu: dosya seçilince Supabase session token'ını alır → Worker'a PUT isteği atar → dönen URL'i `saveAvatar(url)` ile kaydeder
- Avatar görüntüleme: `avatar.startsWith("http")` kontrolü ile URL avatarlar `<img>` tag'iyle, emoji avatarlar metin olarak render edilir
- Bu kontrol şu yerlerde uygulandı: kendi profil dairesi, başka kullanıcı profil dairesi, sosyal feed post kartları, liderlik tablosu, kullanıcı arama sonuçları, takipçi/takip listeleri

**Boyut Limiti:** 5 MB (Worker tarafında Content-Length kontrolü)

**Deploy:**
```bash
# logwise-worker klasöründe:
wrangler deploy
```

---

### 3.5 Kayıt Stratejisi (Çok Önemli)

Üç farklı kayıt fonksiyonu var:

- `save(newData)` → Anında kayıt. Misafirse localStorage'a, kullanıcıysa Supabase'e upsert.
- `debouncedSave(newData)` → 1 saniyelik debounce ile kayıt. Gün görünümündeki set düzenleme gibi sık CRUD işlemlerinde kullanılır.
- `localUpdate(newData)` → Sadece React state günceller, hiçbir yere kaydetmez.
- `flushSave()` → Bekleyen debounced kayıtları anında flush eder (gün görünümünden çıkınca çağrılır).

**Gün görünümünden çıkınca**: Boş setler temizlenir. Standart hareketlerde weight/reps ikisi de 0 olan setler, kardiyoda ise duration değeri 0 olan setler silinir; ardından `flushSave()` çağrılır.

### 3.6 Misafir (Guest) Modu

- Siteye giriş yapmadan kullanılabilir
- `isGuest = !user` — user null ise misafir
- Misafir verisi localStorage'da saklanır (`gym-log-v3` anahtarı)
- Ekranın altında sabit uyarı banner'ı gösterilir
- Feedback gönderme misafir modda engelli

### 3.7 Tema ve Dil

- **Dark/Light tema**: CSS custom properties ile. `data-theme="light"` attribute'u ile geçiş. Tercih localStorage'da (`gym-log-theme`).
- **TR/EN dil desteği**: `TR` ve `EN` constant objeleri (~150+ anahtar). `lang` state: "tr" veya "en", localStorage'da (`gym-log-lang`).
  - **Desktop**: Header'da `!isMobile` koşuluyla gösterilen buton (index.html ~satır 4500).
  - **Mobil**: Sol sidebar panelinde (index.html ~satır 4664), nav butonlarının altında, ince bir ayraçla ayrılmış 🌐 simgeli buton olarak gösterilir. `isMobile` koşuluyla render edilir. Sidebar kapanmaz, dil anında değişir.

### 3.8 URL Routing (Client-Side)

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
- `/program?d=xxx` → Paylaşılan program görüntüleme/kopyalama (ayrı HTML dosyası, public; `d` parametresi base64 JSON)

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
      "categories": ["Göğüs"],
      "presetKey": "bench-press"
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
      "presetKey": "ppl",
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
- `exercises[].presetKey` — Hazır hareketlerden gelen egzersizlerde kanonik preset kimliği. TR/EN isim farklarına rağmen aynı preset'i tekilleştirmek için kullanılır.
- `workouts[].sets[].type` — **YENİ**: `"working"` (varsayılan), `"warmup"`, `"drop"`, `"superset"`.
- `workouts[].sets[].duration` — Kardiyo hareketlerinde ağırlık/tekrar yerine dakika bazlı süre saklanır.
- `workouts[].supersetGroup` — **YENİ**: Aynı superset grubundaki hareketler aynı ID'yi paylaşır.
- `programs[].days` — Key'ler string olmalı ("0"–"6", Pazartesi=0, Pazar=6). `savePg` fonksiyonunda normalize edilir.
- `programs[].presetKey` — Hazır programlardan eklenen haftalık programlarda kanonik preset program kimliği. Aynı preset tekrar eklenirse overwrite kontrolünde kullanılır.
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
  - Hazır hareketlerde bölge filtresi artık birden fazla bölgeyi aynı anda destekler. Mantık `AND` çalışır; örneğin Göğüs + Omuz seçilirse yalnızca iki bölgeyi de içeren hareketler listelenir.
  - Hazır hareket filtresinin üstünde eşleşen hareket sayacı gösterilir. Filtre temizlenirse liste tekrar "Tümü" durumuna döner.

### 6.5 Hazır Hareketler Sistemi (PRESET_EXERCISES + EX_DESCS)

Kodun başında `PRESET_EXERCISES` dizisi var. Her preset hareket artık sadece görünen isimle değil, kanonik bir `key` ile tanımlanır. Yeni preset eklerken temel format:

```js
{
  key: "bench-press",
  name: "Türkçe Ad veya varsayılan ad",
  nameEN: "English Name",
  aliases: ["Eski ad / typo / alternatif yazım"],
  categories: ["Bölge1", "Bölge2"]
}
```

- `key` → Zorunlu. Preset'in değişmeyen kanonik kimliği. Program preset'leri bu anahtara referans verir.
- `name` → Türkçe modda gösterilen isim.
- `nameEN` → İngilizce modda gösterilen isim. Verilmezse `name` fallback olur.
- `aliases` → Eski typo, eski isim veya alternatif yazımlar. Migration/dedup için kullanılır.
- Zaten eklenmiş hareketler `presetKey` ve tüm alias/name varyasyonları üzerinden tespit edilir; farklı dilde eklenmiş olsalar bile tekrar seçilemezler.
- Hazır hareket kullanıcıya eklenince exercise kaydına `presetKey` de yazılır.
- Son eklenen preset hareketler: Assisted Pull-Up, Chest-Supported Row, Straight-Arm Pulldown, Pec Deck Fly, Reverse Pec Deck, Bulgarian Split Squat, Hack Squat, Seated Leg Curl, Leg Abduction, Leg Adduction, Glute Kickback, Hanging Leg Raise, Ab Wheel Rollout, Side Plank.
- Son eklenen ev tipi / calisthenics preset paketi: Diamond Push-Up, Pike Push-Up, Pseudo Planche Push-Up, Hindu Push-Up, Wall Handstand Hold, Wall Sit, Jump Squat, Cossack Squat, Assisted Pistol Squat, Pistol Squat, Single-Leg Glute Bridge, Dead Bug, Hollow Body Hold, Hollow Rock, Reverse Crunch, V-Up, Flutter Kicks, Bird Dog, Bear Crawl, Crab Walk, High Knees, Skater Jump, Inverted Row, Australian Pull-Up, Towel Row, Scapular Pull-Up, Commando Pull-Up, Archer Pull-Up, Bench Dips, Step-Up, Chair Bulgarian Split Squat, L-Sit Hold, Tuck L-Sit.

**Hareket Açıklamaları (EX_DESCS)**: Ayrı bir obje olarak tanımlı. Açıklama lookup'ı artık sadece görünen ada değil, `key` + `name` + `nameEN` + `aliases` kombinasyonuna bakar. En güvenlisi `EX_DESCS` içinde `key` ile entry tutmaktır:
```js
const EX_DESCS = {
  "bench-press": [
    "Düz bankta barbell press. Temel bileşik hareket.",
    "Barbell bench press. Fundamental compound."
  ]
};
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
- Mevcut preset seti: Push Pull Legs (PPL), Üst/Alt Bölünme, Güray's Hypertrophy No:1, Güray's Hypertrophy Max, Full Body, Bro Split
- Hazır programlar `PRESET_PROGRAMS` dizisinde tutulur. Her preset programın da sabit bir `key` alanı vardır.
- `📋 Hazır Program Ekle` butonu ile modal açılır
- Seçildiğinde eksik hareketler otomatik eklenir (`addPresetProgram` fonksiyonu)
- Her preset'te: `key`, `name/nameEN`, `desc/descEN`, `days`, `offDays`
- Her preset programda ayrıca `level` alanı tutulur (`beginner`, `intermediate`, `advanced`)
- `days` içindeki elemanlar artık serbest metin isimler değil, `PRESET_EXERCISES` içindeki `key` değerleridir.
- Aynı preset daha önce eklenmişse `program.presetKey` veya bilinen isim varyasyonları üzerinden bulunur; kullanıcıya overwrite onayı sorulur.
- Hazır program modalında seviye filtresi vardır; kullanıcı `Tüm Seviyeler / Başlangıç / Orta Seviye / İleri Seviye` chip'leri ile listeyi daraltabilir.
- Sonraki genişleme için düşünülen metadata/filtre alanları: `environment`, `goal`, `equipment`, `daysPerWeek`, `focus`.
- Bu alanlar henüz uygulamada aktif filtre olarak kullanılmıyor; ancak preset program planlaması ve dokümantasyon bu şema üzerinden hazırlanıyor.

**Preset Program Öneri Belgeleri (dokümantasyon, henüz uygulamaya eklenmedi):**
- `PRESET_PROGRAM_ONERILERI.md` içinde etiket tabloları, program özetleri ve 12 aday preset program için haftalık planlar bulunur.
- Aynı içeriğin daha okunabilir çıktıları olarak `PRESET_PROGRAM_ONERILERI_READABLE.html` ve `PRESET_PROGRAM_ONERILERI.pdf` dosyaları oluşturulmuştur.
- Belgede geçen aday program key'leri: `home-full-body-3-beginner`, `home-upper-lower-4-beginner`, `bodyweight-strength-3`, `calisthenics-beginner-3`, `push-up-focus-3`, `pull-up-focus-3`, `home-hypertrophy-4`, `calisthenics-upper-lower-4`, `core-conditioning-3`, `lower-body-home-3`, `advanced-calisthenics-4`, `fat-burn-home-4`.

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
Satır ~304     `const PRESET_EXERCISES = window.LOGWISE_PRESET_EXERCISES;` — 55 hazır hareket data/presets-exercises.js'ten yükleniyor (Refactor Aşama 1, Adım C — bkz. Bölüm 30). Eski 172 satırlık inline tanım kaldırıldı.
Satır ~305-310 `const EX_DESCS = window.LOGWISE_EX_DESCS;` + `getExDesc` helper (inline kaldı, 5 satır). Eski 56 satırlık EX_DESCS inline tanımı kaldırıldı.
Satır ~311     `const presetName = (p, lang) => lang === "en" && p.nameEN ? p.nameEN : p.name;` (helper inline kaldı)
Satır ~312-313 `const EX_PREVIEW = window.LOGWISE_EX_PREVIEW;` + `getExPreview` helper (inline kaldı). Eski 262 satırlık EX_PREVIEW inline tanımı kaldırıldı.
Satır ~315     `const PRESET_PROGRAMS = window.LOGWISE_PRESET_PROGRAMS;` — 4 hazır program şablonu (PPL, Upper/Lower, Full Body, Bro Split) data/presets-programs.js'ten yükleniyor (Refactor Aşama 1, Adım D — bkz. Bölüm 31). Eski 57 satırlık inline tanım kaldırıldı.
Satır ~318     `const { fmt, pD, gdow, eDays, calc1RM, calcBrzycki, calcStreak, calcWeekFreq, calcMonthFreq, getAllPRs, calcCompliance } = window.LOGWISE_CALC;` — 11 saf hesaplama/tarih fonksiyonu lib/calc.js'ten yükleniyor (Refactor Aşama 1, Adım E-1 — bkz. Bölüm 32). Eski ~180 satırlık inline tanım kaldırıldı. `calcWeekFreq`/`calcMonthFreq` artık `CATS` parametresi alıyor (API değişikliği).
Satır ~319-322 storage keys (SK, TK, LK, UK, FK), IS_LOCAL_STATIC, BRAND_LOGO_SRC, profileRoute, shareRoute
Satır ~323-330 SET_TYPES, ST_LABELS_TR/EN, ST_COLORS, REST_PRESETS sabitleri
Satır ~349     `const { init, migrateData } = window.LOGWISE_SCHEMA;` — init() ve migrateData() lib/data-schema.js'ten yükleniyor (Refactor Aşama 1, Adım F — bkz. Bölüm 33). Eski ~33 satırlık inline tanım kaldırıldı.
Satır ~382     `const BADGES = window.LOGWISE_BADGES;` — 30 rozet tanımı data/badges.js'ten (Adım B).
Satır ~383     `const { getBadgeName, getBadgeCatLabel, calcBadgeStats, checkBadges, getNextBadge } = window.LOGWISE_BADGE_LOGIC;` — 5 rozet fonksiyonu lib/badge-logic.js'ten yükleniyor (Refactor Aşama 1, Adım B + E-2 — bkz. Bölüm 29 ve 32). Eski ~60 satırlık inline badge fonksiyonları kaldırıldı (calcBadgeStats/checkBadges/getNextBadge artık lib/'de).
Satır ~1305-1306 `const TR = window.LOGWISE_TR; const EN = window.LOGWISE_EN;` — çeviriler data/i18n-tr.js ve data/i18n-en.js dosyalarından yükleniyor (Refactor Aşama 1, Adım A — bkz. Bölüm 28). Eski 538 satırlık inline tanım kaldırıldı.
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
- `/program` → `/program.html` (200 rewrite) — program paylaşım sayfası
- SPA route'ları: `/dashboard`, `/exercises`, `/programs`, `/feedback`, `/data`, `/social` → `/index.html` (200 rewrite)
- 404 sayfası için ayrı kural **gerekmez** — Cloudflare Pages kök dizindeki `404.html`'i otomatik kullanır

### `_headers` dosyası (kök dizinde)
- `sw.js`: `Cache-Control: no-cache` — tarayıcı her zaman güncel SW'yi kontrol eder
- Tüm sayfalar: güvenlik header'ları (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) + `Cache-Control: public, max-age=3600`

### Önemli Kurallar
- **ÖNEMLİ**: Kodda her zaman `/profile`, `/share`, `/program` kullanılmalı; asla `.html` uzantılı URL'ler kullanılmamalı. Redirect döngüsüne sebep olur.
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

3. **JSX yok, derleme adımı yok** — Kod doğrudan `.html` dosyalarında `React.createElement()` syntax'ıyla yazılır. `index.html`, `profile.html`, `share.html`, `program.html` — hepsi bu biçimde. `<script type="text/babel">` yok, `*.babel-backup` yok, `compile.js` yok. Değişiklik akışı: `.html` dosyasını doğrudan düzenle → yerel sunucuda test et → git push. (Geçmiş akış için bkz. Bölüm 27.)

4. **Edit çok dikkatli yapılmalı** — Dosya kesintisi beyaz ekrana sebep olur. Her edit sonrası:
   - `tail -5 index.html` ile dosya sonunu kontrol et
   - Bracket balance check yap (round, square, curly parantezler)
   - `ReactDOM.createRoot`, `function Root()`, `</html>` varlığını doğrula

5. **Stale closure** — Yeni state eklerken ref pattern'i unutma.

6. **Program days key'leri string olmalı** — `"0"`, `"1"`, ..., `"6"`.

7. **migrateData'yı güncelle** — Yeni veri alanı eklenirse `migrateData()` fonksiyonuna da eklenmeli.

8. **Preset veri modeli** — Yeni hazır hareket eklerken `PRESET_EXERCISES` içinde `key` zorunludur. Mümkünse `name`, `nameEN`, gerekiyorsa `aliases`, `categories` ve `EX_DESCS[key]` birlikte eklenmeli. Yeni hazır program eklerken `PRESET_PROGRAMS[].days` içinde hareket adı değil preset `key` kullanılmalı.

9. **Çeviri anahtarları** — Yeni UI metni eklenirse hem TR hem EN karşılığı eklenmeli. Hedef dosya kullanıldığı sayfaya göre değişir: `index.html` için `data/i18n-tr.js` + `data/i18n-en.js`, `profile.html` için `data/i18n-tr-profile.js` + `data/i18n-en-profile.js`. Eski inline `const TR = {...}` / `const EN = {...}` tanımları artık yok (Refactor Aşama 1, Adım A — bkz. Bölüm 28). `share.html` ve `program.html` inline `lang === "tr" ? "..." : "..."` patternini kullanmaya devam ediyor.

10. **Chart.js lifecycle** — DashChart bileşeninde `chartInstanceRef.current.destroy()` çağrılmalı, aksi halde canvas leak olur.

11. **ErrorBoundary** — İki katmanlı: dış (`<Root>` etrafında) ve iç (`<App>` etrafında). Class component olmalı (hooks desteklemez). `getDerivedStateFromError` + `componentDidCatch` pattern.

12. **Service Worker** — `sw.js` dosyası root'ta, `CACHE_NAME` versiyonu güncellenmeli cache bust için. SW kaydı index.html sonunda plain `<script>` ile (Babel değil).

13. **A11y** — Yeni modal eklenirse `role="dialog" aria-modal="true" aria-label={L.xxx}` eklenmeli. Yeni icon button'a `aria-label` eklenmeli. Escape key handler'a yeni modal state eklenmeli.

14. **Profil/Share/Program linkleri** — Kodda her zaman `/profile`, `/share`, `/program` kullanılmalı; asla `.html` uzantılı URL'ler kullanılmamalı. Redirect döngüsüne sebep olur.

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
- ✅ **Hareket önizleme modalı** — EX_PREVIEW objesi (~50 temel hareket), ExPreviewModal bileşeni, IcoInfo ikonu, 3 tetikleyici nokta (Hareketlerim listesi, Hazır Hareketler modal, Gün görünümü kartları), gif/açıklama/teknik ipuçları, TR/EN dil desteği, Escape ile kapanma
- ✅ **Program şablonları** — Hazır program kütüphanesi (PPL, Upper/Lower, Güray varyasyonları, Full Body, Bro Split), eksik hareketler otomatik eklenir
- ✅ **Program döngüsü** — Deload cycle desteği, ayarlanabilir sıklık (3-8 hafta)
- ✅ **Program ilerleme takibi** — Hafta numarası, uyum oranı (%), progress bar, deload haftası göstergesi

### Kategori 5: Veri Yönetimi ✅ TAMAMLANDI
- ✅ **Export JSON** — Tüm veriyi JSON olarak dışa aktarma (yedekleme)
- ✅ **Export CSV** — Antrenman kayıtlarını CSV tablo olarak dışa aktarma
- ✅ **Import JSON** — Daha önce dışa aktarılmış JSON dosyasından geri yükleme
- ✅ **Vücut ölçüleri takibi** — Kilo, boy, vücut yağı, göğüs, bel, kalça, biceps, bacak, boyun, omuz ölçümleri
- ✅ **Veri özeti** — Hareket, antrenman günü, set, program, ölçüm sayıları
- ✅ **Profil fotoğrafı yükleme** — Cloudflare R2'ye upload, 5 MB limit, URL avatar desteği (bkz. 3.3)

### Kategori 6: Bildirimler & Motivasyon ✅ TAMAMLANDI
- ✅ **Başarımlar / Rozetler** — 30 rozet, 6 kategori (Antrenman, Seri, PR, Hacim, Set, Çeşitlilik), BADGES sabiti, checkBadges() ile otomatik kontrol, kutlama toast animasyonu, ilerleme çubukları, kilitli/açık görsel fark
- ✅ **Streak görsel iyileştirme** — pulseGlow animasyonu (3+ gün), rozetler sekmesinde seri göstergesi
- ✅ **Bildirim hatırlatıcı** — Notification API, antrenman günü tespiti (aktif program + bugünün günü), izin yönetimi, günlük tekrar engeli (localStorage key)

### Kategori 7: Teknik / Altyapı ✅ TAMAMLANDI
- ✅ **PWA offline desteği** — `sw.js` Service Worker: cache-first strateji, app shell precache (index.html, CDN libs, ikonlar), Supabase API için network-first, offline fallback. SW kaydı index.html'de plain JS ile. `netlify.toml`'da sw.js için no-cache header.
- ✅ **Performans iyileştirmeleri** — Preconnect/dns-prefetch (fonts.gstatic.com, cdnjs, jsdelivr, supabase), loading skeleton (LOG WISE logo + animasyonlu progress bar, React mount öncesi gösterilir)
- ✅ **Babel Standalone kaldırıldı** (2026-04-10) — ~1.4 MB CDN indirmesi ve runtime JSX derleme yükü ortadan kalktı. `index.html`, `profile.html`, `share.html` artık düz JavaScript (`React.createElement` çağrıları) içeriyor. **Not**: 2026-04-17'de `compile.js` ve `*.babel-backup` akışı da tamamen kaldırıldı; kod artık doğrudan `.html` dosyalarında yazılır (bkz. Bölüm 27).
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
- ✅ **Username sistemi** — Kayıt sırasında zorunlu username (3-20 karakter, harf/rakam/alt çizgi), uniqueness kontrolü, auth metadata + `profiles` senkronu, username'siz mevcut kullanıcılar için fallback modal, sidebar/leaderboard/feed/search/profile'da @username gösterimi
- ✅ **Profil bilgileri görünürlüğü** — Başka kullanıcının profilinde programlar, rozetler ve vücut ölçüleri görüntülenebilir. `show_profile_info` toggle'ı ile kullanıcı bu bilgileri gizleyebilir (default: açık). Takipçi/takip sayılarına tıklayınca liste modalı açılır.
- ✅ **Program & Antrenman Kopyalama Sistemi** — Üç farklı kopyalama akışı: (1) Sosyal akıştaki antrenman paylaşımından 📋 ile takvime kopyalama, (2) Başka kullanıcının profilindeki programı veya paylaşılan antrenmanı kopyalama, (3) Program paylaşım linki — `program.html` sayfasında base64 URL ile veri gömülü, Supabase gerektirmiyor. Tüm akışlarda egzersiz isim eşlemesi yapılır, eksik hareketler "Diğer" kategorisiyle otomatik oluşturulur.

### Diğer Düzeltmeler
- ✅ **Profil sayfası local fix** — `/profile` → `/profile.html` yönlendirmesi (Python HTTP server uyumu)

---

## 15. HENÜZ YAPILMAMIŞ / GELİŞTİRİLEBİLECEK ŞEYLER

### Kategori 5: Veri Yönetimi ✅ TAMAMLANDI
- ✅ Export/Import (JSON/CSV)
- ✅ Vücut ölçüleri takibi
- ✅ Profil fotoğrafı yükleme (Cloudflare R2, 2026-04-15)
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

**Etkilenen fonksiyon**: `getEff(ds)` (index.html)

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

**Etkilenen fonksiyon**: `updSet` (index.html)

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

- `BADGES` — 30 rozet dizisi → **artık `window.LOGWISE_BADGES`'ten alınıyor** (ortak; bkz. Bölüm 29)
- `getBadgeName(b, lang)` — rozet adı lokalizasyonu → **artık `window.LOGWISE_BADGE_LOGIC.getBadgeName`**
- `getBadgeCatLabel(cat, lang)` — rozet kategori etiketi → **artık `window.LOGWISE_BADGE_LOGIC.getBadgeCatLabel`**
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

---

## Bölüm 24 — Program & Antrenman Kopyalama Sistemi (2026-04-12)

### Genel Bakış

Kullanıcılar üç farklı yoldan başkalarının antrenman ve programlarını kendi hesaplarına kopyalayabilir:

1. **Sosyal akış (feed) → Antrenman kopyalama** (`index.html`)
2. **Profil sayfası → Program veya antrenman kopyalama** (`profile.html`)
3. **Program paylaşım linki → Bağımsız önizleme & kopyalama** (`program.html`)

### Temel Tasarım Kararı: Egzersiz ID Eşlemesi

Supabase'deki egzersiz ID'leri kullanıcıya özeldir (başka kullanıcının ID'si anlamsız). Bu yüzden tüm kopyalama akışlarında **isim tabanlı eşleme** yapılır:

```js
// Ortak pattern — tüm kopyalama fonksiyonlarında tekrarlanır
const name = "Bench Press";
let match = myExercises.find(e => e.name.toLowerCase() === name.toLowerCase());
if (!match) {
  match = { id: Date.now().toString(36) + Math.random().toString(36).slice(2,7), name, categories: ["Diğer"] };
  myExercises.push(match);
}
idMap[sourceId_or_index] = match.id;
```

### 1. Sosyal Akıştan Antrenman Kopyalama (`index.html`)

**Yeni state'ler** (diğer state'lerin hemen altına):
```js
const[copyFeedModal,setCopyFeedModal]=useState(null); // paylaşılan post objesi
const[copyFeedDate,setCopyFeedDate]=useState("");      // hedef tarih
const[copyingFeed,setCopyingFeed]=useState(false);
```

**`copySharedWorkout()` fonksiyonu** — `loadLeaderboard` öncesinde tanımlı:
- `copyFeedModal` içindeki `exNames` dizisi ile egzersiz isimleri elde edilir
- `workout_data.exercises` veya düz array formatı desteklenir (geriye dönük uyum)
- `dRef.current` ile mevcut veri okunur (stale closure koruması)
- `debouncedSave` yerine `save()` kullanılır (anlık kayıt)

**Feed kartı UI**: Göz (👁️) butonunun yanına 📋 butonu eklendi. Tıklayınca `setCopyFeedModal({...post, exNames})` çağrılır.

**Kopyalama modalı**: Tarih seçici + Kopyala butonu. `copyFeedDate` boşken buton disabled.

### 2. Profil Sayfasından Kopyalama (`profile.html`)

**Yeni state'ler**:
```js
const[copyPgConfirm,setCopyPgConfirm]=useState(null); // kopyalanacak program ID
const[copySwModal,setCopySwModal]=useState(null);      // kopyalanacak shared workout objesi
const[copySwDate,setCopySwDate]=useState("");
const[copyingPg,setCopyingPg]=useState(false);
const[copyingSw,setCopyingSw]=useState(false);
const[highlightPgId,setHighlightPgId]=useState(null); // ?pg= URL param'dan
```

**`copyProgram(pid)` fonksiyonu**:
- `viewUserData.programs[pid]` içindeki egzersiz ID'lerini isimlerine çevirir (`viewUserData.exercises` ile)
- Kendi Supabase satırından güncel veriyi çekip (`user_data` SELECT) üzerine yazar
- Yeni program adına dil bazlı suffix ekler: `" (kopya)"` / `" (copy)"`
- `offDays` varsa kopyalanır

**`copyWorkoutFromProfile(sw, targetDate)` fonksiyonu**:
- `sw.exercise_names` — string ise JSON.parse, array ise direkt kullanılır
- `sw.workout_data` — aynı güvenli ayrıştırma: `typeof === "string" ? JSON.parse(...) : ...`
- Egzersiz isim eşlemesi yapılır, hedef tarihe eklenir

**Wrapper fonksiyonlar** (ana fonksiyonlardan SONRA tanımlanır):
```js
const copyProgramFn = async(pid) => { setCopyingPg(true); try{await copyProgram(pid)} finally{setCopyingPg(false);setCopyPgConfirm(null)} };
const copySwFn = async() => { if(!copySwModal||!copySwDate)return; setCopyingSw(true); try{await copyWorkoutFromProfile(copySwModal,copySwDate)} finally{setCopyingSw(false);setCopySwModal(null);setCopySwDate("")} };
```

**UI değişiklikleri**:
- Başka kullanıcı profili, program kartları: `user&&viewUserId!==user.id` koşuluyla 📋 Kopyala butonu
- Başka kullanıcı profili, paylaşılan antrenman kartları: 👁️ + 📋 Kopyala butonları
- COPY PROGRAM CONFIRM MODAL ve COPY SHARED WORKOUT MODAL — FOLLOW LIST MODAL'dan önce
- `?pg=` URL param'ı `highlightPgId` state'ini set eder; ilgili program kartına `id="pg-{pid}"` ve mavi kenarlı highlight uygulanır

### 3. Program Paylaşım Linki (`program.html`)

**Mimarisi**: Bağımsız tek dosya React uygulaması. `shared_workouts` tablosuna ihtiyaç duymaz — tüm program verisi URL'ye base64 JSON olarak gömülür.

**Encoding (index.html Programs view, 🔗 butonu)**:
```js
// Türkçe karakter desteği için unescape/encodeURIComponent kombinasyonu
const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(pgData))));
const link = window.location.origin + "/program?d=" + encoded;
```

**Payload yapısı** (`pgData`):
```json
{
  "name": "Push Pull Legs",
  "type": "weekly",
  "days": {
    "0": ["Bench Press", "Shoulder Press"],
    "1": ["Pull Up", "Row"],
    "2": [],
    ...
  },
  "offDays": ["2", "5"],
  "sharedBy": "Ali Çolak",
  "sharedByUsername": "alicolak"
}
```
⚠️ `days` içindeki değerler **egzersiz isimleri** (ID değil) — kullanıcıya özgü ID'ler paylaşım esnasında anlamsızdır.

**Decoding (program.html)**:
```js
const decoded = JSON.parse(decodeURIComponent(escape(atob(d))));
```

**program.html akışı**:
1. URL'den `?d=` param'ı okunur, decode edilir, `programData` state'ine set edilir
2. Auth durumu Supabase'den kontrol edilir (`getSession` + `onAuthStateChange`)
3. Oturum açıksa: 📋 "Bu Programı Kopyala" butonu → `copyProgram()` çağrılır
4. Oturum yoksa: "Giriş Yap / Kayıt Ol" butonu → `/?redirect=<current_url>` yönlendirmesi
5. Kopyalama başarılıysa: `copied=true`, yeşil onay + "Programlarıma Git" butonu

**Kopyalama mantığı (program.html)**:
- `programData.days` dizilerindeki isimler üzerinden egzersiz eşlemesi yapılır
- Kendi `user_data` satırı SELECT + güncellenmiş data UPSERT
- `offDays` varsa korunur

### _redirects Güncellemesi

```
/program      /program.html   200
```

### compile.js Güncellemesi (TARİHSEL — ARTIK GEÇERSİZ)

> **Not (2026-04-17)**: `compile.js` ve `*.babel-backup` sistemi kaldırıldı. Aşağıdaki blok tarihsel referans içindir. Bugün `program.html` doğrudan düzenlenir. Detay için bkz. Bölüm 27.

`files` dizisine `program.html` eklendi:
```js
const files = [
  { src: 'index.html.babel-backup',   dst: 'index.html' },
  { src: 'profile.html.babel-backup', dst: 'profile.html' },
  { src: 'share.html.babel-backup',   dst: 'share.html' },
  { src: 'program.html.babel-backup', dst: 'program.html' },
];
```

### Kopyalama Sonrası Kullanıcı Yönlendirmesi

| Kaynak | Hedef |
|--------|-------|
| Feed antrenman kopyala | Toast: "✅ {tarih} gününe kopyalandı" |
| Profil program kopyala | Toast: "✅ '{isim}' programı kopyalandı!" |
| Profil antrenman kopyala | Toast: "✅ {tarih} gününe kopyalandı" |
| program.html kopyala | Yeşil onay kutusu + "Programlarıma Git" butonu → `/` |

### Önemli Notlar

- **RLS kısıtı**: `user_data` başka kullanıcıdan RLS ile okunamaz. Bu yüzden program paylaşım linki, Supabase'e ihtiyaç duymadan tüm veriyi URL'de taşır. `profile.html`'de `viewUserData` ise `show_profile_info=true` politikası sayesinde okunabilmektedir.
- **`escape`/`unescape` kullanımı**: Deprecated ama evrensel browser desteği var. Türkçe karakterleri (ş, ğ, ü vb.) base64'te güvenle kodlar/çözer.
- **Wrapper vs. Ana Fonksiyon sırası**: `copyProgramFn` ve `copySwFn` wrapper'ları `copyProgram` ve `copyWorkoutFromProfile`'dan SONRA tanımlanmalı; aksi halde çalışma anında "not defined" hatası oluşur.

---

## Bölüm 25 — Mobil Dil Değiştirme Butonu (2026-04-12)

### Değişiklik: TR/EN Toggle Mobil Sidebar'a Eklendi

**Etkilenen dosya**: `index.html`

**Önceki durum**: Dil değiştirme butonu yalnızca `!isMobile` koşuluyla header'da, masaüstünde görünüyordu (index.html ~satır 4500). Mobil kullanıcılar dili değiştiremiyordu.

**Yeni durum**: Mobil sidebar panelinin nav butonları bölümüne, listedeki son butonun hemen altına `isMobile && ...` koşuluyla bir dil değiştirme satırı eklendi (index.html ~satır 4664).

**Konum**: Sol sidebar → nav butonları → ince ayraç çizgisi → 🌐 dil butonu.

**Görünüm**: Diğer nav butonlarıyla aynı stilde (borderRadius: 24, padding: "8px 20px", transparent background). TR aktifken "🌐 English", EN aktifken "🌐 Türkçe" yazar. Butona basıldığında sidebar kapanmaz, dil anında değişir.

**Kod özeti**:
```js
isMobile && React.createElement("div", {
  style: { marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--brd2)" }
}, React.createElement("button", {
  onClick: () => setLang(prev => prev === "tr" ? "en" : "tr"),
  style: { /* nav butonlarıyla aynı stil */ }
}, "🌐 ", lang === "tr" ? "English" : "Türkçe"))
---

## BÃ¶lÃ¼m 26 â€” Auth ve Sidebar UX DÃ¼zeltmeleri (2026-04-14)

### KayÄ±t SonrasÄ± Bilgilendirme MesajÄ±

- KayÄ±t baÅŸarÄ±lÄ± olduktan sonra login ekranÄ±nda gÃ¶sterilen yeÅŸil bilgi mesajÄ± gÃ¼ncellendi.
- Yeni metin, e-posta onayÄ±na ek olarak spam/junk klasÃ¶rÃ¼nÃ¼n de kontrol edilmesini sÃ¶yler.
- TR Ã¶rnek: `KayÄ±t baÅŸarÄ±lÄ±! E-postanÄ± onaylayÄ±p giriÅŸ yap. Spam kutunu da kontrol et.`
- EN Ã¶rnek: `Registered! Please confirm your email, then log in. Also check your spam folder.`

### Username Modal DavranÄ±ÅŸÄ±

- Username artÄ±k sadece kayÄ±t formunda zorunlu olarak alÄ±nÄ±r.
- KullanÄ±cÄ± kayÄ±t sÄ±rasÄ±nda username seÃ§tiyse ve bu deÄŸer auth metadata iÃ§inde varsa, e-posta onayÄ± sonrasÄ± ilk giriÅŸte tekrar username modalÄ± aÃ§Ä±lmaz.
- Ä°lk giriÅŸte yapÄ±lan `syncProfileRecord(...)` senkronu, auth metadata'daki username'i `profiles` kaydÄ±yla hizalar.
- Username modalÄ± yalnÄ±zca gerÃ§ekten username'i bulunmayan legacy/eksik hesaplar iÃ§in fallback olarak kalÄ±r.

### Sidebar YerleÅŸimi ve Kapatma DavranÄ±ÅŸÄ±

- Sol sidebar hem mobilde hem masaÃ¼stÃ¼nde `top: 0, bottom: 0` olacak ÅŸekilde tam yÃ¼kseklik kaplar; Ã¼stte boÅŸluk bÄ±rakmaz.
- MasaÃ¼stÃ¼nde sidebar `fixed` konuma alÄ±ndÄ±ÄŸÄ± iÃ§in ana iÃ§erikte panel aÃ§Ä±kken `margin-left: 256px` uygulanÄ±r.
- Sidebar Ã¼st kÄ±smÄ±na ek bir hamburger butonu yerleÅŸtirildi; bÃ¶ylece masaÃ¼stÃ¼nde panel iÃ§inden manuel kapatma mÃ¼mkÃ¼ndÃ¼r.
- Mobilde overlay kapanÄ±ÅŸÄ± korunur; panel dÄ±ÅŸÄ±na dokununca sidebar kapanÄ±r.

---

## 22. 2026-04-15 Cloudflare R2 Resim Depolama Entegrasyonu

### Değişiklik 1: R2 Bucket ve Worker Kurulumu

- **Cloudflare R2** aktifleştirildi (hesap: colak.ali1928@gmail.com)
- `logwise-images` R2 bucket oluşturuldu (bölge: ENAM)
- `logwise-images-worker` adlı Cloudflare Worker deploy edildi
- Worker URL: `https://logwise-images-worker.colak-ali1928.workers.dev`
- Worker `logwise-worker/` klasöründe tutulur; deploy: `cd logwise-worker && wrangler deploy`
- Worker secret'ları: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `WORKER_URL`, `ALLOWED_ORIGIN`

### Değişiklik 2: JWT Doğrulama Yöntemi

İlk implementasyonda HMAC/HS256 tabanlı JWT doğrulama kullanıldı. Ancak Supabase artık RS256 (asimetrik) ile imzaladığından "Invalid token" hatası alındı. **Çözüm**: Supabase'in `/auth/v1/user` endpoint'ine token ile istek atarak doğrulama yapıldı. Bu yöntem algoritma değişikliklerinden bağımsızdır.

### Değişiklik 3: Profile.html Avatar Upload

`profile.html` değişiklikleri (o zamanki kaynak: `profile.html.babel-backup`; 2026-04-17 sonrası doğrudan `profile.html`):
- `WORKER_URL` sabiti eklendi
- `uploadingAvatar` state, `avatarFileRef` ref eklendi
- `uploadAvatarPhoto(e)` fonksiyonu eklendi: Supabase session token alır → `PUT /avatars/<userId>/avatar_<timestamp>.<ext>` isteği → dönen URL `saveAvatar(url)` ile kaydedilir
- Avatar picker'a gizli `<input type="file">` + **"Fotoğraf Yükle"** butonu eklendi
- Avatar dairesi `overflow: hidden` ile güncellendi

### Değişiklik 4: URL Avatar Render Desteği

Avatar değeri `http` ile başlıyorsa `<img>` tag'iyle, emoji/metin ise doğrudan render edilir. Bu kontrol şu tüm konumlarda uygulandı (o tarihte `.babel-backup` dosyaları düzenleniyordu; bugün karşılıkları doğrudan `.html` içinde):

| Dosya (bugünkü) | Konum |
|---|---|
| `profile.html` | Kendi profil dairesi (88px) |
| `profile.html` | Başka kullanıcı profil dairesi (88px) |
| `profile.html` | Follow/follower listesi (40px) — 2 adet |
| `index.html` | Sosyal feed post kartları (36px) |
| `index.html` | Liderlik tablosu (28px) |
| `index.html` | Kullanıcı arama sonuçları (44px) |
| `index.html` | Sidebar kullanıcı kartı (36px) |

**Sidebar Kullanıcı Kartı Özel Notu**: Bu kısımda `avatar_url` (Google OAuth) ve `avatar` (custom upload URL) iki farklı kaynaktan gelebilir. Kontrol sırası: `avatar_url` varsa veya `avatar` http ile başlıyorsa `<img>` göster; yoksa emoji ya da baş harf göster.

### Değişiklik 5: Profil Fotoğrafı Lightbox (2026-04-15)

Avatar dairesine tıklayınca fotoğraf büyüyerek gösterilir.

- **`photoModal` state** eklendi (`null` veya URL string) — `profile.html` (o tarihte: `.babel-backup`)
- **Kendi profil dairesi**: Avatar URL'yse tıklayınca lightbox açılır; emoji/baş harfse picker açılır. ✏️ butonu her durumda picker'ı açar (`e.stopPropagation()` ile ayrıştırıldı).
- **Başka kullanıcı profil dairesi** (`vp.avatar`): URL'yse tıklayınca lightbox açılır.
- **Lightbox modal**: Siyah transparan overlay (`rgba(0,0,0,.85)`), ortalanmış büyük resim, sağ üstte ✕ butonu. Overlay'e veya ✕'e tıklayınca kapanır.
- **Önemli**: `profile.html`'de iki ayrı `return()` bloğu var — biri kendi profili, biri `viewUserProfile` (başka kullanıcı). Lightbox modal **her iki bloğa da** ayrı ayrı eklenmelidir. Sadece birine eklenirse diğer blokta state set edilir ama modal render edilmez (görünmez).

---

## Bölüm 27 — Babel/Compile Sistemi Kaldırıldı (2026-04-17)

### Özet

`*.babel-backup` kaynak dosyaları, `compile.js` derleyicisi ve Babel bağımlılıkları (`@babel/core`, `@babel/preset-react`) projeden tamamen kaldırıldı. Artık `index.html`, `profile.html`, `share.html`, `program.html` doğrudan düzenlenir; derleme adımı yoktur. Kod `React.createElement()` syntax'ıyla yazılır, JSX kullanılmaz.

### Arka Plan: Neden Kaldırıldı?

2026-04-10'da Babel Standalone CDN (~1.4 MB runtime yükü) kaldırıldığında `compile.js` + `*.babel-backup` hibrit sistemi kuruldu: kaynak JSX yerelde derlenir, deploy edilen `.html`'ler düz JavaScript içerir. Ancak pratikte bu akış sürdürülmedi:

- Günlük geliştirme doğrudan derlenmiş `.html` dosyalarında yapılıyordu (hem manuel düzenlemelerde hem AI araçlarıyla çalışırken)
- `.babel-backup` dosyaları zamanla geride kaldı; son kez 2026-04-12/14/16 tarihlerinde güncellendi ama aynı tarihlerde `.html`'lerde onlarca commit daha yapıldı
- Paralel araçlarla çalışma (Claude Cowork + Codex) sırasında `node compile.js` yanlışlıkla çalıştırılırsa **eski `.babel-backup`'tan yeni `.html`'i ezip tüm güncel değişiklikleri siliyordu** (2026-04-16'da bu yaşandı)
- Rehber `.babel-backup → .html` akışını anlatıyordu ama gerçek akış buna uymuyordu — dokümantasyon-kod drift'i

### Yapılan Değişiklikler

**1. Silinen dosyalar (yerel disk, git'te takip edilmiyordu):**
- `index.html.babel-backup`
- `profile.html.babel-backup`
- `share.html.babel-backup`
- `program.html.babel-backup`
- `compile.js`
- `package.json`
- `package-lock.json`
- `node_modules/` (16 MB)
- `index.html.backup-before-restore` (16 Nisan restore artefaktı)

**2. Arşiv:**
Silinen dosyaların tam kopyası `_archived_babel_system_2026-04-17/` klasörüne alındı. Bu klasör `.gitignore`'da, deploy edilmez ve git'e gitmez. Bir süre bekledikten sonra güvenle silinebilir.

**3. `.gitignore` temizlendi:**
`node_modules/`, `package.json`, `package-lock.json`, `compile.js`, `*.babel-backup` satırları kaldırıldı (artık bu dosyalar yok). Yerine `_archived_babel_system_*/` eklendi.

**4. Rehber güncellendi:**
- Bölüm 1 — teknoloji açıklaması
- Bölüm 2 — dosya yapısı (4 eski dosya girişi kaldırıldı)
- Bölüm 3.1 — tek dosya uygulaması mimarisi
- Bölüm 7 Kategori 7 — "Babel Standalone kaldırıldı" kaydı
- Bölüm 12 Madde 3 — JSX kuralı
- Bölüm 19, 20 — `.babel-backup` referansları `.html`'e güncellendi
- Bölüm 24 — compile.js güncellemesi bloğu "TARİHSEL" olarak işaretlendi
- Bölüm 26 — değişiklik tabloları bugünkü dosyalara güncellendi

### Yeni Geliştirme Akışı

**Eski akış (artık geçersiz):**
```
.html.babel-backup düzenle → node compile.js → .html üret → deploy
```

**Yeni akış:**
```
.html dosyasını doğrudan düzenle → yerel sunucuda test et (local-server.bat) → git push
```

Yerel test sırasında `http://localhost:PORT/` üzerinden çalışır; Cloudflare Pages `main` branch'e push ile otomatik deploy eder.

### Kod Yazım Kuralı

Tüm React bileşenleri `React.createElement()` çağrılarıyla yazılır:

```js
// Doğru — bugün kullanılan syntax
React.createElement("div", { className: "card" },
  React.createElement("h2", null, "Başlık"),
  React.createElement(Button, { onClick: handleClick }, "Tıkla")
)

// Yanlış — JSX çalışmaz (Babel yok)
<div className="card">
  <h2>Başlık</h2>
  <Button onClick={handleClick}>Tıkla</Button>
</div>
```

### İşleyişte Nelerin Değiştiği

**Değişmedi (önemli):**
- Production deploy akışı: `git push` → Cloudflare Pages otomatik yayın
- Cloudflare Pages ayarları (build command yok, output root `/`)
- Runtime davranış: Tarayıcıda çalışan kod birebir aynı (`.html`'lerin içeriği değişmedi)
- Kullanıcı deneyimi: site tamamen aynı çalışır, hiçbir kullanıcı etkisi yoktur
- `logwise-worker/` klasörü, Supabase, R2, PWA, SW — hiçbiri etkilenmedi

**Değişti:**
- Yerel geliştirme: artık `.html` doğrudan düzenlenir; `node compile.js` gereksiz (zaten yok)
- Node.js bağımlılığı kalktı (yerelde artık `npm install` gerekmez)
- Disk temizlendi: `node_modules` (~16 MB) gitti
- Dosya sayısı azaldı: 4 `.babel-backup` + 3 node/babel dosyası = 7 dosya eksildi
- Yanlışlıkla compile.js çalıştırıp iş kaybetme riski ortadan kalktı (2026-04-16'da yaşanan sorun bir daha tekrarlayamaz)
- Dokümantasyon-kod tutarsızlığı giderildi (rehber artık gerçek akışı anlatıyor)

### Riskler / Geri Dönüş Planı

Eğer ileride "JSX ile yazmak istiyorum" dersen `_archived_babel_system_2026-04-17/` klasöründen tüm orijinal dosyalar geri getirilebilir. Ancak:
- Geri dönersen aynı drift problemi tekrarlayacaktır (tek kişi + tek akış değilse)
- Babel CDN Standalone kullanma seçeneği de var ama ~1.4 MB performans yükü geri gelir
- Modern bir yol: Vite/esbuild ile proper bir build pipeline kurmak. Ama bu, proje mimarisini kökten değiştirir ve Cloudflare Pages ayarlarında build step gerektirir.

Şu anki karar: **Sade, derleme-siz, doğrudan düzenleme.** Proje boyutu (~11k satır index.html) için JSX olmadan da makul şekilde yönetilebilir. Ancak index.html'i veri/sabit dosyalara bölme refactor'ı (Aşama 1) bu dosyayı daha yönetilebilir hale getirecek.

### `.babel-backup` Referanslarının Rehberde Kalma Nedeni

Bölüm 18, 19, 20, 22, 23, 24, 26'da tarihsel değişiklik notlarında `.babel-backup` referansları yer alıyordu. Bunların çoğu bugünkü dosya adlarına güncellendi. Bazıları "tarihsel" olarak işaretlendi (örn. Bölüm 24'teki compile.js güncellemesi bloğu). Bu referansları tamamen silmedim çünkü **o tarihteki commit geçmişinde** gerçekten `.babel-backup` düzenlenmişti — tarihsel doğruluk korundu. Bugün kod değişikliği yaparken bu notlara bakanların kafa karıştırmaması için "o tarihte `.babel-backup`, bugün `.html`" şeklinde anotasyon eklendi.

---

## Bölüm 28 — Refactor Aşama 1, Adım A: TR/EN Çevirileri Ayrıldı (2026-04-17)

### Özet

Aşama 1 refactor'un ilk adımı tamamlandı. `index.html` ve `profile.html` içinde inline olarak tanımlı `TR` ve `EN` çeviri objeleri `data/` klasöründe ayrı JavaScript dosyalarına taşındı. Ana `.html` dosyaları artık bu dosyaları plain `<script src="...">` tag'iyle yükleyip `window.LOGWISE_*` global'lerinden okuyor.

### Arka Plan

`index.html` 11.161 satıra ulaşmıştı; TR + EN çevirileri dosyanın ortasında 538 satır yer kaplıyor ve düzenlenecek kodun arama/gezinme sürecini zorlaştırıyordu. Ayrıca profile.html kendi 160 satırlık TR/EN tanımlarını ayrı olarak tutuyor, ortak anahtarlarda (örn. `save`, `cancel`, `email`) görsel olarak duplikasyon oluşuyordu.

Aşama 1 hedefi: veri/sabit bloklarını `data/` ve `lib/` klasörlerine taşımak. Adım A (en izole, en düşük riskli) çeviriler; sonraki adımlar BADGES, PRESET_EXERCISES, PRESET_PROGRAMS, hesaplama yardımcıları ve migrate/init olacak.

### Yapılan Değişiklikler

**1. Yeni dosyalar (`data/` klasörü oluşturuldu):**
- `data/i18n-tr.js` — `window.LOGWISE_TR` (266 anahtar; index.html için)
- `data/i18n-en.js` — `window.LOGWISE_EN` (266 anahtar; index.html için)
- `data/i18n-tr-profile.js` — `window.LOGWISE_TR_PROFILE` (78 anahtar; profile.html için)
- `data/i18n-en-profile.js` — `window.LOGWISE_EN_PROFILE` (78 anahtar; profile.html için)

Dosyalar ES module değildir — plain script olarak yüklenir ve `window` nesnesi üzerinden global'e atanır. Her dosyanın başında kısa bir JSDoc yorum bloğu vardır (kullanım örneği + karşılık gelen EN/TR dosyasına ekleme uyarısı).

**2. `index.html` değişiklikleri:**
- Head kısmında Chart.js CDN satırından sonra, `<style>` bloğundan önce iki yeni satır:
  ```html
  <script src="data/i18n-tr.js"></script>
  <script src="data/i18n-en.js"></script>
  ```
- Ana `<script>` içinde `const TR = { ... }` (eski 269 satır) ve `const EN = { ... }` (eski 269 satır) blokları silindi; yerlerine iki satır kondu:
  ```js
  const TR = window.LOGWISE_TR;
  const EN = window.LOGWISE_EN;
  ```
- **Satır sayısı: 11.161 → 10.627 (534 satır azalma).**

**3. `profile.html` değişiklikleri:**
- Head kısmında Supabase CDN satırından sonra, `<style>` bloğundan önce iki yeni satır:
  ```html
  <script src="data/i18n-tr-profile.js"></script>
  <script src="data/i18n-en-profile.js"></script>
  ```
- Ana `<script>` içinde `const TR = { ... }` ve `const EN = { ... }` blokları silindi; yerlerine:
  ```js
  const TR = window.LOGWISE_TR_PROFILE;
  const EN = window.LOGWISE_EN_PROFILE;
  ```
- **Satır sayısı: 3.833 → 3.677 (156 satır azalma).**

**4. `sw.js` güncellendi:**
- `CACHE_NAME`: `'logwise-v5'` → `'logwise-v6'` — yeni dosyalar eklendiği için cache versiyonu bump edildi; aksi halde mevcut kullanıcıların tarayıcısındaki eski `index.html` cache'i yeni `data/i18n-*.js` dosyalarını 404 olarak alırdı.
- `PRECACHE_URLS` listesine `/data/i18n-tr.js` ve `/data/i18n-en.js` eklendi (ilk offline ziyarette uygulamanın açılabilmesi için). Profile dosyaları listeye eklenmedi çünkü `profile.html` zaten precache'te değil; cache-first fetch stratejisiyle gerektiğinde cache'lenir.

**5. `share.html` ve `program.html`:** Dokunulmadı. Bu dosyalar `TR`/`EN` obje paterni kullanmıyor, inline `lang === "tr" ? "..." : "..."` yaklaşımıyla yazılmış.

**6. `_headers`:** Dokunulmadı. `/*` kuralı `data/` dosyalarını da kapsıyor (güvenlik header'ları). Ekstra cache kuralı bu aşamada gereksiz — Service Worker cache'i yönetiyor, CDN cache başka adımlarda optimize edilebilir.

### Yükleme Stratejisi

Yeni dosyalar klasik `<script src="...">` etiketi ile yüklenir, **ES modules değil**. Sıralama önemli:

1. React + ReactDOM (CDN)
2. Supabase + Chart.js (CDN)
3. `data/i18n-tr.js` + `data/i18n-en.js` (yeni)
4. Ana `<script>` bloğu (index.html'in gövdesi) — burada `const TR = window.LOGWISE_TR` satırı artık garanti bir global'e referans veriyor

Ana kod bloğu çalışmadan önce çevirilerin yüklü olması gerekiyor. Tarayıcı script'leri HTML'deki sıraya göre senkron yüklediği için bu pattern doğal olarak çalışır.

### Doğrulama

- **Syntax check:** `node --check` ile hem `data/*.js` dosyaları hem de `index.html`/`profile.html` içinden ayıklanan inline script bloğu valide edildi.
- **Runtime test:** Node'da `global.window = {}` ile dört data dosyası yüklendi, `window.LOGWISE_TR.calendar === "Takvim"`, `window.LOGWISE_EN.calendar === "Calendar"`, `window.LOGWISE_TR_PROFILE.profile === "Profil"`, `window.LOGWISE_EN_PROFILE.profile === "Profile"` kontrolleri başarılı. Key sayıları TR/EN simetrik (266/266 ve 78/78).
- **Dosya sonu kontrolü:** `tail -5` ile hem `index.html` hem `profile.html`'in `</script></body></html>` ile düzgün bitişi doğrulandı (Rehber Bölüm 11'deki "dosya kesintisi" uyarısı).
- **Bracket balance:** `(` / `{` / `[` farkları Adım A öncesi HEAD ile birebir aynı — değişikliğin dengesizlik eklemediği kanıtlandı.

### Production Etkisi

**Sıfır görsel değişiklik.** Çeviri metinleri tamamen aynı; sadece tanım konumu değişti. Site tam olarak eskisi gibi çalışıyor.

**Kullanıcı deneyimi:**
- Ekstra 2 HTTP isteği (data/i18n-tr.js ~9 KB + data/i18n-en.js ~9 KB; profile.html için ayrıca ~3 KB + 3 KB). CDN cache'leri önceden hazırlandığında bu yük kalıcı değil; ayrıca SW precache ilk yüklemede offline için de işe yarıyor.
- İlk deploy sonrası mevcut kullanıcıların SW cache'i `logwise-v6`'ya güncelleneceği için bir kerelik full reload olabilir. Beklenen davranış.

### Geri Dönüş Planı

Eğer sorun çıkarsa: `data/` klasörünü sil, `index.html` ve `profile.html`'deki `<script src="data/...">` satırlarını kaldır, `const TR = window.LOGWISE_TR` satırları yerine orijinal `const TR = { ... }` + `const EN = { ... }` bloklarını geri yapıştır. `_archived_babel_system_2026-04-17/` içinde bu çevirilerin kopyası **yok** (arşiv Babel temizliği öncesi halidir); ama git history bu commit'ten bir önceki state'i tutuyor, `git revert` yeterli.

### Sonraki Adımlar

- **Adım B:** `BADGES` sabiti ve badge yardımcı fonksiyonları (`checkBadges`, `getBadgeName`, `getBadgeCatLabel`, `calcBadgeStats`, `getNextBadge`). `profile.html`'de de `BADGES` dublikasyonu var; ikisi de ortak dosyaya çekilecek.
- **Adım C:** `PRESET_EXERCISES` + `EX_DESCS` + `EX_PREVIEW` (en büyük veri bloğu).
- **Adım D:** `PRESET_PROGRAMS`.
- **Adım E:** Hesaplama yardımcıları (`calc1RM`, `calcBrzycki`, `calcStreak`, `calcWeekFreq`, `calcMonthFreq`, `getAllPRs`, `calcCompliance`).
- **Adım F:** `migrateData` + `init`.

Her adımda Ali test edip onay verir, git commit yapar, sonraki adıma geçilir.

---

## Bölüm 29 — Refactor Aşama 1, Adım B: BADGES ve Rozet Yardımcıları Ayrıldı (2026-04-17)

### Ne Yapıldı

`BADGES` sabit listesi ve iki adet dublikasyonu giderilmiş rozet yardımcı fonksiyonu, `index.html` ve `profile.html`'den çıkarılıp ortak dosyalara taşındı. Toplamda iki HTML dosyasından **340 satır** düştü (her biri -170 satır).

**Yeni dosyalar:**
- `data/badges.js` (155 satır) — `window.LOGWISE_BADGES` olarak **30 adet** rozet tanımı (id, icon, kategori, eşik değer). Kategoriler: `workout` (7), `streak` (6), `pr` (5), `volume` (5), `sets` (4), `variety` (3).
- `lib/badge-logic.js` (43 satır) — `window.LOGWISE_BADGE_LOGIC` IIFE'si; şu anda **iki ortak fonksiyonu** export ediyor:
  - `getBadgeName(badge, lang)` — rozet adının TR/EN versiyonu (örn. `"50K Hacim"` / `"50K Volume"`)
  - `getBadgeCatLabel(cat, lang)` — kategori etiketinin TR/EN versiyonu (örn. `"Ağırlık PR"` / `"Weight PR"`)

### Neden Sadece İki Fonksiyon?

`checkBadges`, `calcBadgeStats`, `getNextBadge` üçlüsü **yalnızca index.html tarafından çağrılıyor** ve `calcStreak` + `fmt` bağımlılıkları var (bunlar hâlâ `index.html` inline script'inde). Dublikasyon yok, bu yüzden taşımanın marjinal getirisi az ve bağımlılık enjeksiyonu istiyor. Şimdilik index.html içinde bıraktık; **Adım E**'de `lib/calculations.js` oluşturulduğunda `calcStreak` de ortak dosyaya çıkacak ve bu üç fonksiyon o zaman `lib/badge-logic.js`'e taşınabilir (daha temiz bir gruplama). profile.html bu üç fonksiyonu zaten hiç kullanmıyor.

### Script Yükleme Sırası

`index.html` <head>:
```html
<script src="https://.../react.production.min.js"></script>
<script src="https://.../react-dom.production.min.js"></script>
<script src="https://.../@supabase/supabase-js@2"></script>
<script src="https://.../chart.js@4.4.4/.../chart.umd.min.js"></script>
<script src="data/i18n-tr.js"></script>
<script src="data/i18n-en.js"></script>
<script src="data/badges.js"></script>         <!-- Adım B -->
<script src="lib/badge-logic.js"></script>     <!-- Adım B -->
```

`profile.html` <head> (Chart.js yok, Supabase'den sonra i18n):
```html
<script src="data/i18n-tr-profile.js"></script>
<script src="data/i18n-en-profile.js"></script>
<script src="data/badges.js"></script>         <!-- Adım B -->
<script src="lib/badge-logic.js"></script>     <!-- Adım B -->
```

**NOT:** `data/badges.js` önce yüklenmeli çünkü `lib/badge-logic.js` onu **okumaz** (fonksiyon gövdesi `window.LOGWISE_BADGES` referansını çağrı anında alır), ama `const BADGES = window.LOGWISE_BADGES` satırı HTML inline script'te çalıştığında mevcut olmalı.

### HTML İçinde Yeni Satırlar

`index.html` (kaldırılan 149 + 13 + 11 = 173 satırın yerine 4 satır; 3 satır eski `const BADGES = [...]; const getBadgeName = ...; const getBadgeCatLabel = ...;` bloğunu temsil eden yeni yönlendirmeler, +1 script yükleme sonucu bölünmesi):
```js
const BADGES = window.LOGWISE_BADGES;
const getBadgeName = window.LOGWISE_BADGE_LOGIC.getBadgeName;
const getBadgeCatLabel = window.LOGWISE_BADGE_LOGIC.getBadgeCatLabel;
const calcBadgeStats = data => { ... }  // olduğu gibi kaldı
```

`profile.html`:
```js
const BADGES = window.LOGWISE_BADGES;
const getBadgeName = window.LOGWISE_BADGE_LOGIC.getBadgeName;
const getBadgeCatLabel = window.LOGWISE_BADGE_LOGIC.getBadgeCatLabel;
```

### Dosya Satır Sayıları (Öncesi → Sonrası)
- `index.html`: 10,627 → **10,457** (-170)
- `profile.html`: 3,677 → **3,507** (-170)
- `data/badges.js`: 0 → **155** (yeni)
- `lib/badge-logic.js`: 0 → **43** (yeni)
- **Toplam işlenen satır:** 340 temizlendi, 198 ayrı dosyalara taşındı — net -142 satır (dublikasyon ortadan kalktı).

### Doğrulama
- `node --check` tüm yeni dosyaları ve `sw.js`'i onayladı.
- Runtime test (headless Node + `global.window`): 30 badge yüklendi, fonksiyonlar orijinal davranışını birebir koruyor.
- Bracket dengesi: her iki HTML'de **tam denge** (`(` = `)`, `{` = `}`). Adım A'da tespit edilen küçük parantez farkı bu adımda ortadan kalktı (template literal + regex literal içi `{}`'ler taşındığı için).

### Service Worker Güncellemesi
`sw.js` — `CACHE_NAME` `'logwise-v6'` → `'logwise-v7'`. `PRECACHE_URLS`'e `/data/badges.js` ve `/lib/badge-logic.js` eklendi.

### Geri Alma
Sorun çıkarsa: `data/badges.js` ve `lib/badge-logic.js`'i sil, HTML'lerdeki iki script tag'ini ve `const BADGES = window...` üçlüsünü geri çevir. Git revert bu commit için temiz çalışır.

### Sonraki Adımlar
- **Adım C:** `PRESET_EXERCISES` + `EX_DESCS` + `EX_PREVIEW` (en büyük veri bloğu).
- **Adım D:** `PRESET_PROGRAMS`.
- **Adım E:** Hesaplama yardımcıları + `checkBadges`/`calcBadgeStats`/`getNextBadge` bu adımda `badge-logic.js`'e taşınabilir (artık `calcStreak` ortak olacağı için).
- **Adım F:** `migrateData` + `init`.

---

## Bölüm 30 — Refactor Aşama 1, Adım C: PRESET_EXERCISES + EX_DESCS + EX_PREVIEW Ayrıldı (2026-04-17)

### Ne Yapıldı

Aşama 1'in **en büyük tek adımı** tamamlandı. `index.html`'deki üç büyük veri bloğu — preset hareketler listesi, kısa açıklamaları ve önizleme verileri — `data/` klasöründe üç ayrı dosyaya taşındı. Toplam **484 satır** index.html'den düştü.

**Yeni dosyalar (Seçenek 2: üç ayrı dosya):**
- `data/presets-exercises.js` (176 satır) — `window.LOGWISE_PRESET_EXERCISES` olarak **55 preset hareket** (name, opsiyonel nameEN, categories). Kategoriler: Göğüs, Omuz, Triceps, Biceps, Bilek, Sırt, Bacak, Kalça, Kalf, Trapez, Karın, Kardiyo. Not: "Dead Hang" iki kez listede (orijinal davranış korundu).
- `data/ex-descriptions.js` (59 satır) — `window.LOGWISE_EX_DESCS` olarak **54 anahtarlı map**: `{[hareketAdı]: [TR açıklama, EN açıklama]}`. Kısa (bir cümlelik) açıklamalar.
- `data/ex-preview.js` (266 satır) — `window.LOGWISE_EX_PREVIEW` olarak **52 anahtarlı map**: `{[hareketAdı]: {gif, desc:[TR,EN], tips:[[TR,EN],...]}}`. Uzun açıklama + 3-5 adet form ipucu.

### Neden Üç Ayrı Dosya (Seçenek 2)?

- `EX_PREVIEW` en aktif değişen kısım (yeni gif/tips eklendiğinde); ayrıştırılmış halde sadece o dosya değişir, cache invalidation diğer ikisini etkilemez.
- Preset hareket yapısı (`PRESET_EXERCISES`) ve kısa açıklamaları (`EX_DESCS`) görece stabil; preview'dan bağımsız değişir.
- HTTP overhead minimum: SW precache üç dosyayı da ilk ziyarette alıyor; sonraki yüklemeler cache'ten.

### Helper Fonksiyonlar

`getExDesc`, `presetName`, `getExPreview` helper'ları **index.html içinde inline kaldı** — thin wrapper'lar (1-5 satır) olduğu için taşıma marjinal getiri sağlar. Bu fonksiyonlar artık `window.LOGWISE_*` global'lerinden okuyan `const EX_DESCS = window.LOGWISE_EX_DESCS` tanımları üzerinden çalışıyor.

### Script Yükleme Sırası

`index.html` <head> güncel sıra:
```html
<script crossorigin src="https://.../react.production.min.js"></script>
<script crossorigin src="https://.../react-dom.production.min.js"></script>
<script src="https://.../@supabase/supabase-js@2"></script>
<script src="https://.../chart.js@4.4.4/.../chart.umd.min.js"></script>
<script src="data/i18n-tr.js"></script>
<script src="data/i18n-en.js"></script>
<script src="data/badges.js"></script>
<script src="lib/badge-logic.js"></script>
<script src="data/presets-exercises.js"></script>   <!-- Adım C -->
<script src="data/ex-descriptions.js"></script>     <!-- Adım C -->
<script src="data/ex-preview.js"></script>          <!-- Adım C -->
```

`profile.html` etkilenmedi — bu üç sabit orada zaten yoktu.

### HTML İçinde Yeni Satırlar

Eski 3 büyük blok yerine 5 satır (3 yönlendirme + 2 helper):
```js
const PRESET_EXERCISES = window.LOGWISE_PRESET_EXERCISES;
const EX_DESCS = window.LOGWISE_EX_DESCS;
const getExDesc = (name, lang) => { const d = EX_DESCS[name]; if (!d) return null; return lang === "en" ? d[1] : d[0]; };
const presetName = (p, lang) => lang === "en" && p.nameEN ? p.nameEN : p.name;
const EX_PREVIEW = window.LOGWISE_EX_PREVIEW;
const getExPreview = exName => EX_PREVIEW[exName] || null;
```

### Dosya Satır Sayıları (Öncesi → Sonrası)
- `index.html`: 10,457 → **9,973** (-484)
- `data/presets-exercises.js`: 0 → **176** (yeni)
- `data/ex-descriptions.js`: 0 → **59** (yeni)
- `data/ex-preview.js`: 0 → **266** (yeni)

**Kümülatif (Adım A+B+C sonu):** index.html **11,161 → 9,973** = -1,188 satır (%10.6 küçülme).

### Doğrulama
- `node --check` tüm yeni dosyaları ve `sw.js`'i onayladı.
- Runtime test: 55 preset, 54 desc, 52 preview yüklendi; ilk/son kayıtlar birebir; 12 ana kategori doğru dağıldı; `Deadlift.tips` 5 adet.
- Bracket dengesi: `(`=`)`=4682, `{`=`}`=2687 — kusursuz.

### Service Worker Güncellemesi
`sw.js` — `CACHE_NAME` `'logwise-v7'` → `'logwise-v8'`. `PRECACHE_URLS`'e `/data/presets-exercises.js`, `/data/ex-descriptions.js`, `/data/ex-preview.js` eklendi.

### Geri Alma
Sorun çıkarsa: üç `data/ex-*.js` + `data/presets-exercises.js`'i sil, HTML'deki üç script tag'ini ve üç `window.LOGWISE_*` yönlendirme satırını git HEAD'den restore et. Git revert temiz çalışır çünkü helper'lar zaten inline.

### Sonraki Adımlar
- **Adım D:** `PRESET_PROGRAMS` (4 hazır program şablonu) — bkz. Bölüm 31.
- **Adım E:** Hesaplama yardımcıları (`calc1RM`, `calcBrzycki`, `calcStreak`, vs.) + `checkBadges`/`calcBadgeStats`/`getNextBadge`'in `lib/badge-logic.js`'e taşınması.
- **Adım F:** `migrateData` + `init`.

---

## Bölüm 31 — Refactor Aşama 1, Adım D: PRESET_PROGRAMS Ayrıldı (2026-04-18)

### Ne Yapıldı

`index.html`'deki 4 hazır program şablonu (`PRESET_PROGRAMS` dizisi) yeni bir dosyaya taşındı. Küçük ama temiz bir adım — önceki adımlardaki deseni birebir izledi.

**Yeni dosya:**
- `data/presets-programs.js` (60 satır) — `window.LOGWISE_PRESET_PROGRAMS` olarak **4 hazır program**: Push Pull Legs (PPL), Üst/Alt Bölünme (Upper/Lower), Full Body, Bro Split (5 Gün). Her program `{name, nameEN, desc, descEN, days: {"0"-"6": [hareketAdi...]}}` şemasına uyuyor. Günler 0=Pzt ... 6=Paz.

Not: REFACTOR_HANDOFF.md'de "6 program" olarak tahmin edilmişti; gerçek sayı 4. Güray's Hypertrophy programları henüz eklenmemiş.

### Script Yükleme Sırası

`index.html` <head> güncel sıra (Adım D eklemesi en altta):
```html
<script src="data/badges.js"></script>
<script src="lib/badge-logic.js"></script>
<script src="data/presets-exercises.js"></script>
<script src="data/ex-descriptions.js"></script>
<script src="data/ex-preview.js"></script>
<script src="data/presets-programs.js"></script>   <!-- Adım D -->
```

`profile.html` etkilenmedi — `PRESET_PROGRAMS` orada zaten yoktu.

### HTML İçinde Yeni Satır

Eski 57 satırlık blok yerine 1 satır:
```js
const PRESET_PROGRAMS = window.LOGWISE_PRESET_PROGRAMS;
```

### Dosya Satır Sayıları (Öncesi → Sonrası)
- `index.html`: 9,973 → **9,918** (-55)
- `data/presets-programs.js`: 0 → **60** (yeni)

**Kümülatif (Adım A+B+C+D sonu):** index.html **11,161 → 9,918** = -1,243 satır (%11.1 küçülme).

### Doğrulama
- `node --check data/presets-programs.js` ✅
- Runtime test: `LOGWISE_PRESET_PROGRAMS.length === 4`, tüm programlar 7 günlü (`"0"`-`"6"`), PPL 1. gün 5 hareket ✅
- Bracket dengesi (`index.html`): `(`=`)`=4678, `{`=`}`=2679 — kusursuz. (Önceki `4682/2687` rakamlarına göre fark beklenen seviyede — 4 program `{...}` + içindeki `days` objeleri azaldı.)

### Service Worker Güncellemesi
`sw.js` — `CACHE_NAME` `'logwise-v8'` → `'logwise-v9'`. `PRECACHE_URLS`'e `/data/presets-programs.js` eklendi.

### Geri Alma
Sorun çıkarsa: `data/presets-programs.js`'i sil, `index.html`'deki script tag'ini ve `const PRESET_PROGRAMS = window.LOGWISE_PRESET_PROGRAMS;` satırını git HEAD'den restore et. `PRESET_PROGRAMS` sadece bir değişkendir, kullanım noktası (satır ~7650 `PRESET_PROGRAMS.map(...)`) değişmedi.

### Sonraki Adımlar
- **Adım E:** Hesaplama yardımcıları + badge fonksiyonları — bkz. Bölüm 32.
- **Adım F:** `migrateData` + `init`.

---

## Bölüm 32 — Refactor Aşama 1, Adım E: Hesaplama ve Badge Fonksiyonları lib/'e Taşındı (2026-04-18)

Bu adım **iki ayrı commit** halinde yapıldı. E-1 önce (calc.js), sonra E-2 (badge fonksiyonları calc bağımlılıklarını kullanır hale geldi).

### Adım E-1: `lib/calc.js` Oluşturuldu

#### Ne Yapıldı

`index.html`'deki tüm saf hesaplama ve tarih fonksiyonları tek bir dosyada toplandı. **11 fonksiyon** `window.LOGWISE_CALC` namespace'inde:

**Tarih yardımcıları:**
- `fmt(date)` — Date → "YYYY-MM-DD" (yerel saat)
- `pD(str)` — "YYYY-MM-DD" → Date
- `gdow(date)` — Pazartesi=0 ... Pazar=6 (LogWise konvansiyonu)
- `eDays()` — Boş haftalık günler objesi `{"0":[], ..., "6":[]}`

**Hesaplamalar:**
- `calc1RM(w, r)` — Epley formülü
- `calcBrzycki(w, r)` — Brzycki formülü
- `calcStreak(workouts)` — Ardışık antrenman günleri
- `calcWeekFreq(workouts, exercises, cats)` — Son 7 gün kategori sıklığı
- `calcMonthFreq(workouts, exercises, cats)` — Son 30 gün kategori sıklığı
- `getAllPRs(workouts, exercises)` — Tüm PR'lar (maxWeight, maxVolume, est1RM)
- `calcCompliance(pgId, workouts, programs, programMeta)` — Program uyum oranı

#### API Değişikliği

**⚠️ `calcWeekFreq` ve `calcMonthFreq`** artık 3. parametre olarak `cats` alıyor. Eskiden `CATS` globaline bağımlıydılar, şimdi dışarıdan alıyor. Tek çağrı noktası (Dashboard frekans grafiği) güncellendi:

```js
// Eski:
calcWeekFreq(data.workouts, data.exercises)
// Yeni:
calcWeekFreq(data.workouts, data.exercises, CATS)
```

Diğer 9 fonksiyonun imzası aynı kaldı.

#### profile.html Duplikasyon Temizliği

`profile.html`'de duplike halinde duran `calc1RM` ve `calcStreak` tanımları silindi, tek destructuring'e çevrildi:

```js
const { calc1RM, calcStreak } = window.LOGWISE_CALC;
```

Not: `profile.html`'deki eski `calcStreak` `fmt` yerine inline template literal kullanıyordu (aynı sonucu veren farklı yazım). Artık tek kanonik versiyon `lib/calc.js`'te.

#### Script Yükleme Sırası (Kritik)

`calc.js` **`badge-logic.js`'ten önce** yüklenmeli (çünkü E-2'de badge-logic calc'a bağımlı hale geldi):

```html
<script src="data/badges.js"></script>
<script src="lib/calc.js"></script>            <!-- Adım E-1 -->
<script src="lib/badge-logic.js"></script>     <!-- Adım B + E-2 -->
```

### Adım E-2: Badge Fonksiyonları lib/badge-logic.js'e Taşındı

#### Ne Yapıldı

`lib/badge-logic.js` artık 5 fonksiyon export ediyor (önceden 2):

**Yeni eklenenler:**
- `calcBadgeStats(data)` — Kullanıcının verisinden rozet istatistiklerini hesaplar
- `checkBadges(data)` — Yeni açılacak rozetleri ve geri alınacakları belirler
- `getNextBadge(data)` — Kullanıcının ilerleyebileceği bir sonraki rozeti döndürür

**Eski (korundu):**
- `getBadgeName(b, lang)`
- `getBadgeCatLabel(cat, lang)`

#### Neden Adım B'de Değil Adım E'de?

Adım B'de bu 3 fonksiyon **`calcStreak` ve `fmt` bağımlılıkları** yüzünden taşınmamıştı — o zamanlar bu helper'lar `index.html` içinde inline'dı ve `lib/badge-logic.js` içinden erişilemiyordu. Adım E-1'den sonra bu helper'lar `window.LOGWISE_CALC`'a taşındı, böylece E-2'de badge fonksiyonları IIFE'nin başında şöyle alabiliyor:

```js
window.LOGWISE_BADGE_LOGIC = (function () {
  const { calcStreak, fmt } = window.LOGWISE_CALC;
  // ... calcBadgeStats, checkBadges, getNextBadge tanımları
})();
```

#### BADGES Erişim Stratejisi

`checkBadges` ve `getNextBadge` artık `BADGES` sabitini IIFE başında değil, fonksiyon içinde okuyor (`const BADGES = window.LOGWISE_BADGES;`). Bu, yükleme sırası güvenliği sağlar — fonksiyon çağrıldığında `window.LOGWISE_BADGES` mutlaka hazırdır.

#### HTML'de Tek Destructuring Satırı

`index.html`'de eski 5 satır (2 redirection + 3 inline fonksiyon) tek destructuring'e toplandı:

```js
const { getBadgeName, getBadgeCatLabel, calcBadgeStats, checkBadges, getNextBadge } = window.LOGWISE_BADGE_LOGIC;
```

### Dosya Satır Sayıları (Öncesi → Sonrası)

| Dosya | Adım E-1 | Adım E-2 | Toplam |
|---|---|---|---|
| `index.html` | 9,918 → 9,768 (-150) | 9,768 → 9,706 (-62) | **-212** |
| `profile.html` | 3,508 → 3,490 (-18, duplike temizliği) | — | **-18** |
| `lib/calc.js` | 0 → 200 (yeni) | — | **+200** |
| `lib/badge-logic.js` | — | 43 → 118 (+75) | **+75** |

**Kümülatif (Adım A+B+C+D+E sonu):** `index.html` **11,161 → 9,706** = **-1,455 satır (%13.0 küçülme)**.

### Doğrulama

- `node --check lib/calc.js` ve `node --check lib/badge-logic.js` ✅
- Runtime test (`lib/calc.js`): `fmt`, `pD`, `gdow`, `calc1RM(100,5)=116.7`, `calcBrzycki(100,10)=133.3`, `calcBrzycki(100,40)=200` (2w sınırı), `calcStreak({})=0`, mock veriyle `calcCompliance` ✅
- Integration test: `calcStreak` 3 günlük veri üzerinde 3 döndü, `getAllPRs` maxWeight=100/maxVolume=720 doğru, `calcWeekFreq` kategori bazında doğru sıklık verdi ✅
- Runtime test (`lib/badge-logic.js` + dependencies): `calcBadgeStats` istatistikleri doğru, `checkBadges` fresh+revoke doğru ayrıştı, `getNextBadge` doğru progress% döndü ✅
- Bracket dengesi (`index.html`): `(`=`)`=4526, `{`=`}`=2632 ✅

### Service Worker Güncellemesi

Her commit sonrası SW bump'landı:
- E-1: `CACHE_NAME` `'logwise-v9'` → `'logwise-v10'`, `/lib/calc.js` PRECACHE_URLS'e eklendi.
- E-2: `'logwise-v10'` → `'logwise-v11'` (badge-logic.js içeriği değişti; PRECACHE listesi aynı kaldı).

### Bilinen Gotcha: SW Cache

E-2 sonrası Ali'nin tarayıcısında `TypeError: checkBadges is not a function` hatası çıktı. Sebep: eski SW (`logwise-v10`) hâlâ aktifti ve eski `badge-logic.js`'i (sadece `getBadgeName`+`getBadgeCatLabel` içeren) servis ediyordu. Çözüm: DevTools → Application → Service Workers → **Unregister** + **Clear site data** + hard refresh. Incognito'da sorunsuz çalıştı.

**Ders:** İki ayrı commit halinde deploy ederken SW bump yeterli olmayabilir — install olmuş eski SW aktifken Ctrl+Shift+R bile yeterli olmayabiliyor. Her büyük refactor commit'inde kullanıcıya "SW'yi unregister edip hard refresh yap" talimatı vermek lazım.

### Geri Alma

- **E-2'yi geri al:** `lib/badge-logic.js`'i HEAD~1'e döndür, `index.html` destructuring satırını eski 5 satıra (2 redirection + 3 inline fonksiyon) aç. `calcBadgeStats`/`checkBadges`/`getNextBadge` `calcStreak` ve `fmt`'e erişebilir çünkü bunlar inline scope'ta.
- **E-1'i geri al:** `lib/calc.js`'i sil, `calcWeekFreq`/`calcMonthFreq` çağrısından `CATS` argümanını kaldır, 11 inline tanımı geri getir, `profile.html`'deki duplike tanımları restore et.

### Sonraki Adımlar

- **Adım F:** `migrateData` + `init` — bkz. Bölüm 33.
- **Opsiyonel (gelecek aşamalar):** `catLabel`, `normalizeUsername`, `isValidUsername`, `defaultDisplayName`, `defaultAvatar`, `buildProfileRow` — bunlar hesaplama değil, profile/UI utility'si. İstenirse `lib/profile-utils.js` dosyası açılabilir.

---

## Bölüm 33 — Refactor Aşama 1, Adım F: init + migrateData Ayrıldı & Aşama 1 Kapanışı (2026-04-18)

Aşama 1'in **son adımı**. `init()` ve `migrateData()` — iki küçük ama kritik saf fonksiyon — `lib/data-schema.js` dosyasına taşındı. Aşama 1 böylece kapanıyor.

### Ne Yapıldı

**Yeni dosya:**
- `lib/data-schema.js` (54 satır) — `window.LOGWISE_SCHEMA` olarak **2 fonksiyon**:
  - `init()` — Boş/varsayılan kullanıcı verisi şablonu (11 anahtar: `exercises`, `workouts`, `programs`, `dailyPrograms`, `activeProgram`, `durations`, `measurements`, `dayNotes`, `exerciseNotes`, `programMeta`, `badges`).
  - `migrateData(d)` — Eski şemadan yeni şemaya güvenli, idempotent geçiş. Eski `category` → yeni `categories: [category]` dönüşümü ve eksik default objelerin doldurulması.

### HTML'de Tek Satır Redirection

```js
const { init, migrateData } = window.LOGWISE_SCHEMA;
```

6 çağrı noktası (4x `init()`, 2x `migrateData()`) değişmeden kaldı — destructuring binding sayesinde identifier'lar aynen çalışıyor.

### Neden Ayrı Dosya (calc.js'te Değil)?

- **Farklı domain:** `calc.js` hesaplama, `data-schema.js` veri yapısı kontratı. Karıştırmamak ileride bakım için daha temiz.
- **Versiyonlama potansiyeli:** Şema değişirse (yeni alanlar eklenirse) migration fonksiyonları büyüyebilir. İzole bir dosyada olması büyümeyi kısıtlar.
- **Bağımsız:** `data-schema.js` hiçbir şeye bağımlı değil, sıfır import'lu saf fonksiyonlar.

### Script Yükleme Sırası

```html
<script src="data/badges.js"></script>
<script src="lib/calc.js"></script>
<script src="lib/badge-logic.js"></script>
<script src="lib/data-schema.js"></script>    <!-- Adım F — bağımsız, her yere konabilir -->
<script src="data/presets-exercises.js"></script>
...
```

### Dosya Satır Sayıları (Öncesi → Sonrası)

- `index.html`: 9,706 → **9,674** (-32 satır)
- `lib/data-schema.js`: 0 → **54** (yeni)

### Doğrulama

- `node --check lib/data-schema.js` ✅
- Runtime: `init()` 11 anahtarlı obje, `activeProgram: null` ✅
- `migrateData(null)` ve `migrateData(undefined)` aynen döndü (null-safe) ✅
- Eski `{category: "Göğüs"}` → `{category:"Göğüs", categories:["Göğüs"]}` ✅
- Zaten migrate edilmiş veri bozulmadan döndü (idempotent) ✅
- 4 namespace birlikte yüklendi: `LOGWISE_BADGES`, `LOGWISE_CALC`, `LOGWISE_BADGE_LOGIC`, `LOGWISE_SCHEMA` ✅
- Bracket balance (`index.html`): `(`=`)`=4514, `{`=`}`=2614 ✅

### Service Worker Güncellemesi

`sw.js` — `CACHE_NAME` `'logwise-v11'` → `'logwise-v12'`. `/lib/data-schema.js` PRECACHE_URLS'e eklendi.

### Geri Alma

`lib/data-schema.js`'i sil, `index.html`'deki script tag'ini ve `const { init, migrateData } = window.LOGWISE_SCHEMA;` satırını git HEAD'den restore et. Çağrı noktaları (6 adet) değişmedi.

---

## Aşama 1 Kapanış Bilançosu

Tüm adımlar tamamlandı: **A → B → C → D → E (E-1, E-2) → F**.

### Toplam Satır Etkisi

| Adım | Dosya(lar) | index.html | profile.html |
|---|---|---|---|
| A | `data/i18n-tr.js`, `data/i18n-en.js`, `data/i18n-tr-profile.js`, `data/i18n-en-profile.js` | -538 | -163 |
| B | `data/badges.js`, `lib/badge-logic.js` | -173 | (script tag eklendi) |
| C | `data/presets-exercises.js`, `data/ex-descriptions.js`, `data/ex-preview.js` | -484 | — |
| D | `data/presets-programs.js` | -55 | — |
| E-1 | `lib/calc.js` | -150 | -18 (duplike temizliği) |
| E-2 | `lib/badge-logic.js` (genişletildi) | -62 | — |
| F | `lib/data-schema.js` | -32 | — |
| **Toplam** | **11 yeni dosya** | **-1,494** | **-181** |

### Önce/Sonra

**Önce (Aşama 1 başlangıcı):**
- `index.html`: **11,161 satır** (tüm data + lib + UI monolit)
- `profile.html`: **3,833 satır** (duplike helper'lar dahil)
- `data/` ve `lib/` klasörleri yok.

**Sonra (Aşama 1 sonu):**
- `index.html`: **9,674 satır** (%13.3 küçülme)
- `profile.html`: **3,490 satır** (%9.0 küçülme, duplikasyon yok)
- `data/` (9 dosya): 4 i18n + 1 badges + 4 exercise/program data = ~860 satır
- `lib/` (3 dosya): calc.js + badge-logic.js + data-schema.js = ~370 satır

### Global Namespace'ler

Aşama 1 sonunda `window` üzerine eklenen namespace'ler:
- `LOGWISE_TR`, `LOGWISE_EN` (index.html çevirileri)
- `LOGWISE_TR_PROFILE`, `LOGWISE_EN_PROFILE` (profile.html çevirileri)
- `LOGWISE_BADGES` (rozet tanımları)
- `LOGWISE_PRESET_EXERCISES`, `LOGWISE_EX_DESCS`, `LOGWISE_EX_PREVIEW`, `LOGWISE_PRESET_PROGRAMS` (hazır içerik)
- `LOGWISE_CALC` (hesaplama fonksiyonları)
- `LOGWISE_BADGE_LOGIC` (rozet mantığı)
- `LOGWISE_SCHEMA` (veri şeması)

### Mimari Kazanımlar

1. **Single source of truth** — her sabit/fonksiyon tek bir yerde. Duplikasyon yok.
2. **Cache invalidation granülaritesi** — bir çeviri değişirse sadece `i18n-*.js` cache kırılır, diğer dosyalar cache'ten servislenir.
3. **İnceleme kolaylığı** — eski 11k+ satırlık tek dosya yerine, her dosyanın tek bir sorumluluğu var.
4. **Test edilebilirlik** — `lib/` fonksiyonları Node'da `global.window = {}` ile test edilebilir (nitekim her adımda yapıldı).
5. **Build step yok** — hâlâ klasik `<script src>` tag'leri, Babel yok, bundler yok. PWA + SW basit kalıyor.

### Sonraki Fazlar (Opsiyonel)

Bu adımlar kullanıcı talep ederse ayrı bir "Aşama 2" olarak yapılabilir:

- **Profile utilities çıkarımı:** `lib/profile-utils.js` — `catLabel`, `normalizeUsername`, `isValidUsername`, `defaultDisplayName`, `defaultAvatar`, `buildProfileRow`.
- **React bileşen ayrıştırma:** `BrandMark`, `ErrorBoundary`, `DashChart` gibi izole bileşenler ayrı dosyalara çıkarılabilir. Ancak JSX kullanılmadığı için (`React.createElement()`) sadeleştirme kazancı sınırlı.
- **Supabase client wrapper:** DB çağrılarını `lib/db.js`'e toplamak. İleride ek backend eklemeleri için esneklik.
- **CSS ayrıştırma:** `<style>` bloğu büyük, `styles.css`'e çıkartılabilir.

### Öğrenilen Dersler

1. **SW cache invalidation** — `CACHE_NAME` bump her zaman yeterli değil; kullanıcılara hard refresh/unregister talimatı vermek gerekiyor (bkz. E-2 gotcha'sı).
2. **Büyük blok taşımalarında Python regex** — 200+ satırlık blokları `Edit` tool ile değiştirmek pratik değil; tek Python `re.sub` çağrısı daha hızlı ve güvenli.
3. **Bracket balance + node --check + runtime test** — üçünün her adımda birlikte yapılması bug'sız refactor için yeterli.
4. **Bağımlılık sırası** — `lib/badge-logic.js`'in `lib/calc.js`'e bağımlı hale gelmesi script yükleme sırasını zorunlu kıldı. İleride bu sırayı karıştıran bir değişiklik yapılırsa IIFE başındaki destructuring fail olur.
5. **Duplikasyon temizliği bonus** — `profile.html`'de `calc1RM` ve `calcStreak` duplike duruyordu; E-1'de çıkınca tek kanonik versiyon kaldı.

---

## Bölüm 34 — Refactor Aşama 2, Faz 2A: Profile/User Yardımcıları Ayrıldı (2026-04-18)

Aşama 2'nin **ilk fazı**. `index.html` ve `profile.html`'de paylaşılan kullanıcı/profil yardımcı fonksiyonları `lib/profile-utils.js` dosyasına taşındı; bu sırada `profile.html`'deki duplike `normalizeUsername`/`isValidUsername` tanımları temizlendi.

### Ne Yapıldı

**Yeni dosya:**
- `lib/profile-utils.js` (36 satır) — `window.LOGWISE_PROFILE_UTILS` olarak **5 fonksiyon**:
  - `normalizeUsername(v)` — `String(v||'').trim().toLowerCase()`. Null-safe.
  - `isValidUsername(v)` — `^[a-z0-9_]{3,20}$` regex testi. Case-sensitive (büyük harf reddedilir).
  - `defaultDisplayName(user)` — `full_name` → `email`'in @ öncesi → `"User"` fallback zinciri.
  - `defaultAvatar(user)` — `user_metadata.avatar` veya boş string.
  - `buildProfileRow(user, existing, overrides)` — `profiles` tablosu için satır objesi üretir; override > existing > default önceliğiyle `username`, `display_name`, `bio`, `avatar`, `is_public` doldurur.

### `catLabel` Neden Taşınmadı?

`catLabel` `index.html`-spesifik bir `CAT_LABELS_EN` sözlüğüne bağımlı. Onu da `profile-utils.js`'e taşımak için ya `CAT_LABELS_EN`'ı global'e bağlamak (mimari kirlilik) ya da fonksiyon imzasını değiştirip 11 çağrı noktasını tek tek güncellemek gerekirdi. Aşama 1'in "her dosya sıfır bağımlılık" prensibine sadık kalmak için `catLabel` index.html'de yerinde bırakıldı. Profile-utils sıfır bağımlılıklı saf modül olarak kaldı.

### HTML'de Tek Satır Redirection

`index.html`:
```js
const { normalizeUsername, isValidUsername, defaultDisplayName, defaultAvatar, buildProfileRow } = window.LOGWISE_PROFILE_UTILS;
```

`profile.html` (sadece kullanılan 2 fonksiyon — diğerlerine ihtiyaç yok):
```js
const { normalizeUsername, isValidUsername } = window.LOGWISE_PROFILE_UTILS;
```

### Bonus Duplikasyon Temizliği

`profile.html` satır 98-99'da `normalizeUsername` ve `isValidUsername` tanımları **birebir duplike** olarak duruyordu (index.html'deki tanımlarla aynı). Faz 2A bu duplikasyonu kaldırdı — artık tek kanonik kaynak `lib/profile-utils.js`. (E-1'de `calc1RM`/`calcStreak` için yapılan temizliğin aynısı.)

### Script Yükleme Sırası

`index.html`:
```html
<script src="lib/data-schema.js"></script>
<script src="lib/profile-utils.js"></script>    <!-- Faz 2A — bağımsız, her yere konabilir -->
<script src="data/presets-exercises.js"></script>
```

`profile.html`:
```html
<script src="lib/badge-logic.js"></script>
<script src="lib/profile-utils.js"></script>    <!-- Faz 2A -->
<style>...</style>
```

### Dosya Satır Sayıları (Öncesi → Sonrası)

- `index.html`: 9,674 → **9,660** (-14 satır)
- `profile.html`: 3,490 → **3,490** (net 0 — 2 satır silindi, 2 satır eklendi: 1 script tag + 1 destructuring)
- `lib/profile-utils.js`: 0 → **36** (yeni)

Toplam HTML küçülmesi modest (-14 satır), ama mimari kazanç bir o kadar değerli: **single source of truth** — username regex artık iki yerde paralel evrim göstermez.

### Doğrulama

- `node --check lib/profile-utils.js` ✅
- `node --check` index.html ve profile.html inline JS ✅ (geçici `.cjs` dosyalarına extract edilip kontrol)
- Runtime testleri:
  - `normalizeUsername("  ALI  ")` → `"ali"` ✅
  - `normalizeUsername(null/undefined)` → `""` ✅ (null-safe)
  - `isValidUsername("ali")` → true; `"al"` (kısa), `"Ali"` (büyük harf), `"ali!"` (özel karakter), 21 karakter → false ✅
  - `defaultDisplayName({email:"foo@bar.com"})` → `"foo"` ✅
  - `defaultDisplayName({user_metadata:{full_name:"Ali Çolak"}})` → `"Ali Çolak"` ✅
  - `defaultDisplayName({})` → `"User"` ✅
  - `defaultAvatar({user_metadata:{avatar:"🐺"}})` → `"🐺"` ✅
  - `buildProfileRow` override/existing/default önceliği doğru ✅
- Bracket balance (`profile-utils.js`): `(`/`)` = 0, `{`/`}` = 0, `[`/`]` = 0 ✅

### Service Worker Güncellemesi

`sw.js` — `CACHE_NAME` `'logwise-v12'` → `'logwise-v13'`. `/lib/profile-utils.js` PRECACHE_URLS'e eklendi.

### Aşama 1'den Farklı Notlar

- **Local shadowing korundu:** `index.html` satır 4629'daki `const catLabel = lang === "en" ? L.cats[...] : cat;` (heatmap render'ı içindeki local değişken) refactor'dan etkilenmedi. Top-level `catLabel`'a hiç dokunmadık zaten.
- **Profile.html selektif destructuring:** Profile sadece 2 fonksiyon kullanıyor, ölü import yapmamak için sadece o ikisini destructure ettik.

### Geri Alma

`lib/profile-utils.js`'i sil; `index.html` ve `profile.html`'deki yeni script tag'lerini ve destructuring satırlarını git HEAD'den restore et. Tüm çağrı noktaları aynen kaldı, eski tanımlar geri gelir.

---

## Bölüm 35 — Refactor Aşama 2, Faz 2B: Ortak CSS `styles/base.css`'e Ayrıldı (2026-04-18)

Aşama 2'nin ikinci fazı. **4 ana HTML sayfasının (index, profile, share, program)** `<style>` bloklarındaki ortak kısımlar `styles/base.css` dosyasına taşındı; sayfa-spesifik kurallar her HTML'in kendi (artık çok daha küçük) inline `<style>` bloğunda kaldı. **404.html** dokunulmadı (kendi minimal hard-coded stilleri var, paylaşılan tema gerektirmiyor).

### Strateji: Hibrit (base + sayfa-spesifik)

Tek bir mega `main.css` yerine **hibrit** yaklaşım seçildi:
- `styles/base.css` → reset + scrollbar + focus + `:root` (superset 46 değişken) + `[data-theme="light"]` + `.sr-only` + ortak `@keyframes` (fadeIn, scaleIn, toastIn, toastOut, countUp, shine)
- Her HTML'in kendi `<style>` → o sayfaya özgü kural ve animasyonlar

Avantaj: ortak tema/değişkenler tek kaynak (DRY), ama sayfa-spesifik kuralın bozulması diğer sayfalara sıçramaz.

### `:root` Superset Yaklaşımı

Sayfalar arasında değişken setleri farklıydı (index 46, profile 36, share 27, program 24 unique değişken). Her sayfa için ayrı subset taşımak yerine `base.css` **index.html'in tüm 46 değişkenini içeriyor** — diğer sayfalara birkaç KB ekstra geliyor ama tek source of truth korunuyor. Light/dark theme renklerini değiştirmek için artık tek yere bakılır.

### Yeni Dosya

- `styles/base.css` (81 satır) — paylaşılan temel CSS

### HTML Değişiklikleri

Her 4 sayfada:
1. `<style>` bloğunun hemen üstüne `<link rel="stylesheet" href="styles/base.css"/>` eklendi
2. `<style>` bloğundan ortak kurallar (reset, scrollbar, focus, `:root`, `[data-theme="light"]`, `.sr-only`, ortak keyframes) silindi
3. Sayfa-spesifik kurallar yorum bloğuyla işaretlendi: `/* Ortak ... için styles/base.css'e bak. */`

### Dosya Satır Sayıları (Öncesi → Sonrası)

| Dosya | Önce | Sonra | Fark |
|---|---|---|---|
| `index.html` | 9,660 | **9,604** | -56 |
| `profile.html` | 3,490 | **3,443** | -47 |
| `share.html` | 869 | **835** | -34 |
| `program.html` | 715 | **682** | -33 |
| `404.html` | 32 | 32 | 0 (dokunulmadı) |
| **HTML toplam** | 14,766 | **14,596** | **-170** |
| `styles/base.css` | — | +81 | +81 |
| **NET** | — | — | **-89 satır** |

Satır kazancı modest gibi görünse de asıl kazanç **mimari**: tema değişkeni tek yerde, paralel evrim riski yok.

### Yükleme Sırası — Kritik Nokta

`<link>` her sayfada `<style>` bloğundan **ÖNCE** olmalı, çünkü inline `<style>` blokları `var(--blue)`, `var(--scroll)` gibi base.css'te tanımlı değişkenleri kullanıyor. Doğrulama yapıldı:
- index.html: link 45, style 46 ✅
- profile.html: link 25, style 26 ✅
- share.html: link 17, style 18 ✅
- program.html: link 17, style 18 ✅

Eğer ileride Cloudflare Pages "blocking CSS" optimization yapsa bile, browser bu dosyaları paralel indirir ama parse sırası HTML'deki `<link>`/`<style>` sırasını izler. CSS source order gereği sıra korunur.

### `_headers` Notu

`_headers` dosyasına CSS için MIME type kuralı eklenmedi — Cloudflare Pages `.css` uzantılarını otomatik `text/css` olarak servis ediyor. Cache-control da default olarak yeterli (SW bump ile her cache invalidation tetikleniyor zaten). İleride CDN cache süresini özelleştirmek istenirse buraya eklenebilir.

### Doğrulama

- `styles/base.css` brace balance: `{` = `}` ✅
- 4 HTML'in inline `<style>` brace balance: hepsi 0 ✅
- index.html ve profile.html inline JS syntax: `node --check` ✅ (JS değişmedi ama kontrol)
- Her sayfada tam **1 adet** `<link styles/base.css>` ✅
- 404.html dokunulmadı ✅
- `<link>` her sayfada `<style>`'dan önce ✅

### Service Worker Güncellemesi

`sw.js` — `CACHE_NAME` `'logwise-v13'` → `'logwise-v14'`. `/styles/base.css` PRECACHE_URLS'e eklendi (statik varlıklar bölümünde).

### Ne Taşınmadı, Neden

- **404.html**: 8 satır CSS, hard-coded renkler (`#0a0a0a`, `#f0c040`), CSS değişken paletine ihtiyaç duymuyor. Tek başına çalışıyor, paylaşımlı dosyaya gerek yok.
- **Sayfa-spesifik animasyonlar** (`badgeUnlock`, `confetti`, `pulseGlow`, `daySlideFromLeft` vb.): sadece bir sayfada kullanılıyor, base.css'i şişirmemek için yerinde bırakıldı.

### Geri Alma

`styles/base.css` ve `styles/` klasörünü sil. 4 HTML'i git HEAD'den restore et. SW cache adını v13'e düşür. Tüm değişiklik 5 dosyada izole.

---

## Bölüm 36 — Refactor Aşama 2, Faz 2C-1: ErrorBoundary Ayrıldı (2026-04-18)

Aşama 2 Faz 2C (React bileşenleri ayrıştırması) başladı. **C1 stratejisi** seçildi (izole bileşenleri tek tek çıkar), C2 (feature bazlı) Aşama 3'e bırakıldı. C1'in ilk adımı: **ErrorBoundary**.

### Neden C1, Neden ErrorBoundary İlk

- **C1** düşük riskli — 5 aday bileşenin (ErrorBoundary, BrandMark, DashChart, ExPreviewModal, AuthScreen) tamamı closure-free ve props-only; App'in kapasitenin 30+ useState'ine hiç değmiyor.
- **C2 yapılmadı** çünkü App (8,342 satır monolit) 8 `view === "..."` conditional render ile tek return ağacına sıkışmış. View'ları çıkarmak 20-40 prop transfer gerektirir veya Context mimarisi gerektirir — Aşama 3 işi.
- **ErrorBoundary** ilk tercih çünkü en az bağımlı (sadece `React.Component`, `React.createElement`, `localStorage`) ve class component pattern'i yeni bir namespace başlatmak için temiz bir başlangıç.

### Yeni Dosya ve Namespace

- `components/error-boundary.js` (139 satır) — `window.LOGWISE_COMPONENTS.ErrorBoundary`
- Yeni klasör: `components/` ve yeni namespace: `window.LOGWISE_COMPONENTS`

**Defensive init pattern:**
```js
window.LOGWISE_COMPONENTS = window.LOGWISE_COMPONENTS || {};
window.LOGWISE_COMPONENTS.ErrorBoundary = ErrorBoundary;
```

Bu pattern sonraki bileşen dosyalarının (C1-2..C1-5) script sıralamasından bağımsız yüklenebilmesini sağlıyor — namespace objesi yoksa yaratılır, varsa üzerine key eklenir.

### HTML'de Tek Satır Redirection

```js
const { ErrorBoundary } = window.LOGWISE_COMPONENTS;
```

Kullanım yerleri (Root.js fragment ve ReactDOM.createRoot çağrısı) aynen kaldı.

### Script Yükleme Sırası

```html
<script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/...js"></script>
...
<script src="lib/profile-utils.js"></script>
<script src="components/error-boundary.js"></script>  <!-- C1-1 -->
<script src="data/presets-exercises.js"></script>
```

ErrorBoundary `React.Component` extends ediyor, bu yüzden React CDN'inden **sonra** yüklenmek zorunda. lib/'in hemen altı güvenli konum.

### Dosya Satır Sayıları (Öncesi → Sonrası)

- `index.html`: 9,604 → **9,481** (-123 satır) — tek taşıma için büyük kazanç
- `components/error-boundary.js`: 0 → **139** (yeni, yorum + defensive init dahil)

### Doğrulama

- `node --check components/error-boundary.js` ✅
- Runtime (React mock + localStorage mock):
  - `new ErrorBoundary({children:'OK'}).render()` → `'OK'` (hasError=false path) ✅
  - `state={hasError:true,error:new Error()}`, `render()` → `{type:'div', ...}` React element ✅
  - `getDerivedStateFromError(err)` → `{hasError:true, error:err}` ✅
  - `prototype instanceof React.Component` → true ✅
- `node --check` index.html inline JS ✅
- Bracket balance (`error-boundary.js`): `(`=0 `{`=0 `[`=0 ✅
- İki kullanım yeri (Root fragment + ReactDOM render) korundu ✅

### Service Worker Güncellemesi

`sw.js` — `CACHE_NAME` `'logwise-v14'` → `'logwise-v15'`. `/components/error-boundary.js` PRECACHE_URLS'e eklendi.

### Geri Alma

`components/error-boundary.js`'i sil; `index.html`'deki script tag'ini ve `const { ErrorBoundary } = window.LOGWISE_COMPONENTS;` satırını git HEAD'den restore et. Class tanımı geri gelir, 2 kullanım yeri bozulmadan çalışır.

---

## Bölüm 37 — Refactor Aşama 2, Faz 2C-2: BrandMark Ayrıldı (2026-04-18)

C1 alt-adım 2: marka logosu gösteren küçük sunumsal bileşen `BrandMark` `components/brand-mark.js`'e taşındı. **Bonus:** `BRAND_LOGO_SRC` sabiti (sadece BrandMark içinde kullanılıyordu) bileşenin yanına gömüldü, `index.html`'den tamamen silindi.

### Yeni Dosya

- `components/brand-mark.js` (49 satır) — `window.LOGWISE_COMPONENTS.BrandMark`
- Bağımlılıklar: `React.createElement`, `/Site_Logo180.svg` (public root'tan servis)
- Props: `{ size=72, pad=8, radius=20, style={} }`

### `BRAND_LOGO_SRC` Neden Bileşene Gömüldü?

`grep -c BRAND_LOGO_SRC index.html` → 2 sonuç (tanım + tek kullanım yeri). Sabit BrandMark dışında hiçbir yerde kullanılmıyordu. Ayrı bir global olarak tutmak yerine bileşen dosyasının başına `const BRAND_LOGO_SRC = "/Site_Logo180.svg";` olarak konuldu — encapsulation kazanıldı, `index.html`'den 1 satır daha eksildi.

### HTML'de Destructuring Güncellendi

```js
const { ErrorBoundary, BrandMark } = window.LOGWISE_COMPONENTS;
```

C1-1'den kalan tek-key destructuring iki-key'e genişletildi. 3 kullanım yeri (AuthScreen header, onboarding step 0, Root header) aynen kaldı.

### Script Yükleme Sırası

```html
<script src="components/error-boundary.js"></script>
<script src="components/brand-mark.js"></script>     <!-- C1-2 -->
```

Defensive init pattern sayesinde bu iki script arasında sıkı bağımlılık sırası yok — her ikisi de `window.LOGWISE_COMPONENTS = window.LOGWISE_COMPONENTS || {}` yapıyor, hangisi önce yüklenirse namespace'i o açar.

### Dosya Satır Sayıları (Öncesi → Sonrası)

- `index.html`: 9,481 → **9,448** (-33 satır)
- `components/brand-mark.js`: 0 → **49** (yeni)

### Doğrulama

- `node --check components/brand-mark.js` ✅
- Runtime testleri:
  - Default props (size=72, pad=8, radius=20) → outer width 72, inner borderRadius 12 (Math.max(20-8,8)) ✅
  - Custom props (size=120, pad=10, radius=30, style={margin:4}) → outer width 120, inner borderRadius 20, style spread çalışıyor ✅
  - Edge: pad>=radius (radius=10, pad=8 → 10-8=2 < 8 clamp) → 8 ✅
- Defensive init fresh-load testi: boş namespace'te `BrandMark` doğru key ile eklendi ✅
- `node --check` index.html inline JS ✅
- Bracket balance: `(`=0 `{`=0 `[`=0 ✅
- `BrandMark` index.html'de 4 yerde (1 destructuring + 3 createElement) ✅
- `BRAND_LOGO_SRC` index.html'de **0 kalıntı** ✅ (tam temizlik)

### Service Worker Güncellemesi

`sw.js` — `CACHE_NAME` `'logwise-v15'` → `'logwise-v16'`. `/components/brand-mark.js` PRECACHE_URLS'e eklendi.

### Mimari Not: Defensive Init Pattern Doğrulandı

C1-1'de tasarlanan `window.LOGWISE_COMPONENTS = window.LOGWISE_COMPONENTS || {}` pattern'i ilk kez gerçek kullanımda test edildi: ikinci dosya namespace'i bozmadan eklendi. Bu, sonraki C1-3..C1-5 adımlarının da script sırasından bağımsız çalışacağını garanti ediyor.

### Geri Alma

`components/brand-mark.js`'i sil; `index.html`'de:
1. Script tag'ini geri al
2. `BRAND_LOGO_SRC` sabitini IS_LOCAL_STATIC'in altına geri koy
3. BrandMark function tanımını syncProfileRecord'un üstüne geri al
4. Destructuring'i `const { ErrorBoundary } = window.LOGWISE_COMPONENTS;`'a daralt

3 kullanım yeri aynen çalışmaya devam eder.

---

## Bölüm 38 — Refactor Aşama 2, Faz 2C-3: DashChart Ayrıldı (2026-04-18)

C1 alt-adım 3: dashboard görünümünün Chart.js line chart bileşeni `DashChart` (~117 satır) `components/dash-chart.js`'e taşındı. C1'in **en uzun** ve **en çok bağımlılıklı** bileşeni — Chart.js canvas lifecycle ve React ref yönetimi içeriyor.

### Yeni Dosya

- `components/dash-chart.js` (137 satır) — `window.LOGWISE_COMPONENTS.DashChart`
- Bağımlılıklar (runtime'da çözülür):
  - `React.useEffect`, `React.createElement` — React CDN
  - `Chart` — chart.js CDN (global)
  - `window.LOGWISE_CALC.pD` — useEffect gövdesi içinde destructure (çağrıldığında yüklü)

### Neden `useEffect` Yerine `React.useEffect`

index.html'deki inline scope'ta `const { useEffect } = React;` destructure'u var ama bu isim bileşen dosyasına taşınamaz. Alternatifler:
1. Bileşen dosyasında kendi destructure'ı yap — IIFE üst seviyesinde çalışır ama React global yüklenmeden tetiklenirse patlar
2. `React.useEffect` olarak adlandır — `BrandMark`'ın `React.createElement` pattern'ine uyumlu, hiç extra destructure yok

Opsiyon 2 seçildi: tutarlı ve en az karmaşa.

### `LOGWISE_CALC.pD` Runtime Çözümü

IIFE üst seviyesinde değil, `useEffect` gövdesi içinde çözülür:

```js
React.useEffect(() => {
  if (!chartRef.current || !chartHist.length) return;
  // ...
  const { pD } = window.LOGWISE_CALC;  // runtime'da, sadece mount edildiğinde
  // ...
}, [chartHist, mode, theme]);
```

Neden? IIFE hemen çalışır; eğer bir sebepten `lib/calc.js` sonradan yüklenirse patlar. useEffect ise sadece bileşen render edildiğinde çalışır — o zamana kadar tüm script'ler yüklenmiş olur.

### HTML'de Destructuring Güncellendi

```js
const { ErrorBoundary, BrandMark, DashChart } = window.LOGWISE_COMPONENTS;
```

Tek kullanım yeri (dashboard view'de `React.createElement(DashChart, {...})`) aynen kaldı.

### Script Yükleme Sırası

```html
<script src="components/error-boundary.js"></script>
<script src="components/brand-mark.js"></script>
<script src="components/dash-chart.js"></script>     <!-- C1-3 -->
```

### Dosya Satır Sayıları (Öncesi → Sonrası)

- `index.html`: 9,448 → **9,331** (-117 satır) — en büyük tek-adım kazanç
- `components/dash-chart.js`: 0 → **137** (yeni, yorum + defensive init + Chart config dahil)

### Doğrulama

- `node --check components/dash-chart.js` ✅
- Runtime testleri:
  - `window.LOGWISE_COMPONENTS.DashChart` fonksiyon olarak export edildi ✅
  - Mock props (chartRef, chartInstanceRef, chartHist=[], mode="weight", theme="dark", L={}, lang="tr") ile çağrı → canvas element döndü, useEffect early-return (empty hist) tetiklendi ✅
  - `chartHist.length > 0` ile çağrı: `new Chart(...)` çağrıldı, `chartInstanceRef.current` Chart instance'ı tutuyor ✅
  - Cleanup: `chartInstanceRef.current.destroy()` çağrıldı, `.current = null` oldu ✅
  - Mode değişimi: weight → volume → onerm'de borderColor/bgColor/dataPoints doğru switch'lendi ✅
- Defensive init fresh-load testi: önce dash-chart.js yüklendi, `window.LOGWISE_COMPONENTS.DashChart` düzgün tanımlandı ✅
- `node --check` index.html inline JS ✅
- Bracket balance (`dash-chart.js`): `(`=0 `{`=0 `[`=0 ✅
- `DashChart` index.html'de 2 yerde (1 destructuring + 1 createElement) ✅
- `useEffect(` (standalone) index.html inline'da tek DashChart bağlamında silindi, diğer 30+ useEffect kullanımı korundu ✅

### Service Worker Güncellemesi

`sw.js` — `CACHE_NAME` `'logwise-v16'` → `'logwise-v17'`. `/components/dash-chart.js` PRECACHE_URLS'e eklendi.

### Mimari Not: Canvas Ref Lifecycle Dışarıdan Yönetiliyor

DashChart kendi `ref`'ini yaratmıyor — `chartRef` ve `chartInstanceRef` parent'tan (App) geliyor. Bu sayede:
- App, chart instance'ı mount/unmount dışında da manipüle edebilir (tema değişiminde vs.)
- Component saf "render hedefi" rolünde, state taşımıyor — C1 stratejisine uyumlu
- `useRef` hook'larını App'e bırakmak, bileşeni çok daha basit tutuyor

### Geri Alma

`components/dash-chart.js`'i sil; `index.html`'de:
1. `<script src="components/dash-chart.js"></script>` satırını kaldır
2. `function DashChart(...)` tanımını `syncProfileRecord`'un sonrasına geri al (`useEffect` olarak, `React.useEffect` değil)
3. Destructuring'i `const { ErrorBoundary, BrandMark } = window.LOGWISE_COMPONENTS;`'a daralt

Tek kullanım yeri aynen çalışmaya devam eder.

---

## Bölüm 39 — Refactor Aşama 2, Faz 2C-4: ExPreviewModal Ayrıldı (2026-04-18)

C1 alt-adım 4: egzersiz önizleme modalı `ExPreviewModal` (260 satır) `components/ex-preview-modal.js`'e taşındı. **En uzun bileşen** — kategori renk paleti, GIF image fallback, tips listesi ve açıklama bölümlerini içerir.

### Yeni Dosya

- `components/ex-preview-modal.js` (293 satır) — `window.LOGWISE_COMPONENTS.ExPreviewModal`
- IIFE üst seviyesinde paylaşılan sabitler:
  - `CAT_COLORS` — 26 kategori × renk eşleşmesi (TR+EN anahtarlar)
  - `getCatColor(c)` — renk arama fonksiyonu

### Bağımlılık Stratejisi

Bileşen 4 dış bağımlılığı şu şekilde çözdü:

| Bağımlılık | Çözüm |
|---|---|
| `React.useState`, `React.createElement` | `React` global CDN, doğrudan namespace'ten |
| `TR`, `EN` i18n | Runtime'da `window.LOGWISE_TR` / `window.LOGWISE_EN` |
| `EX_PREVIEW` data | Runtime'da `window.LOGWISE_EX_PREVIEW`, inline: `(EX_PREVIEW[ex.name] \|\| null)` |
| `catLabel(cat, lang)` | **Prop olarak** geçilir — `CAT_LABELS_EN` index.html'de kaldığı için (2A kararı) |

### Neden `catLabel` Prop

`catLabel` index.html inline scope'taki `CAT_LABELS_EN` sabitine bağımlı. 2A'da bu sabit ve fonksiyon yerinde bırakıldı (CAT_LABELS_EN sadece index.html'de kullanılıyor, duplicate etmeye değmiyor). Bileşen dosyası window.* yoluyla erişse pattern tutarsızlığı yaratırdı; prop en temiz çözüm.

### HTML'de Destructuring + Prop Güncellendi

```js
const { ErrorBoundary, BrandMark, DashChart, ExPreviewModal } = window.LOGWISE_COMPONENTS;
```

Kullanım sitesi (tek yer):
```js
React.createElement(ExPreviewModal, {
  ex: previewEx,
  onClose: () => setPreviewEx(null),
  lang: lang,
  catLabel: catLabel   // ← C1-4'te eklendi
})
```

### Script Yükleme Sırası

```html
<script src="components/dash-chart.js"></script>
<script src="components/ex-preview-modal.js"></script>   <!-- C1-4 -->
```

### Dosya Satır Sayıları (Öncesi → Sonrası)

- `index.html`: 9,332 → **9,073** (-259 satır) — C1'in en büyük tek-adım kazancı
- `components/ex-preview-modal.js`: 0 → **293** (yeni, yorum + CAT_COLORS + defensive init dahil)

### Doğrulama

- `node --check components/ex-preview-modal.js` ✅
- Runtime testleri:
  - `window.LOGWISE_COMPONENTS.ExPreviewModal` fonksiyon olarak export edildi ✅
  - Preview mevcut (gif var) → img render edilir, setImgErr çağrılabilir ✅
  - Preview mevcut değil → placeholder (💪 ikonu) + `L.exPreviewNoContent` mesajı ✅
  - Tips array'i → numaralandırılmış listede TR/EN doğru seçilir ✅
  - Kategori rozeti → `CAT_COLORS` fallback `#a0a8b8` ✅
  - Backdrop click → `onClose` tetiklenir, modal content click → `stopPropagation` çalışır ✅
- Defensive init fresh-load testi: namespace yoksa açıldı, varsa mevcut key'ler korundu ✅
- `node --check` index.html inline JS ✅
- Bracket balance (`ex-preview-modal.js`): `(`=0 `{`=0 `[`=0 ✅
- `ExPreviewModal` index.html'de 2 yerde (1 destructure + 1 createElement) ✅
- `CAT_COLORS` index.html'de 0 kalıntı ✅ (temizlendi, sadece bileşende)

### Service Worker Güncellemesi

`sw.js` — `CACHE_NAME` `'logwise-v17'` → `'logwise-v18'`. `/components/ex-preview-modal.js` PRECACHE_URLS'e eklendi.

### Mimari Not: Prop-Driven Dependency Injection

`catLabel`'i prop olarak geçmek, test edilebilirliği dramatik artırır. Bileşen artık index.html inline scope'una hiçbir şekilde bağımlı değil — tek dış temas noktası `window.LOGWISE_*` namespace'leri (dokümante edilmiş, tek yönlü veri bağımlılığı). C1-5 (AuthScreen) aynı pattern'i Supabase client için kullanacak (`sb` prop veya `window.LOGWISE_DB`).

### Geri Alma

`components/ex-preview-modal.js`'i sil; `index.html`'de:
1. `<script src="components/ex-preview-modal.js"></script>` satırını kaldır
2. `function ExPreviewModal(...)` tanımını DashChart'ın silinmesinden kalan boşluğa (line 197 sonrası) geri al (`useState` olarak, `React.useState` değil)
3. Destructuring'i `const { ErrorBoundary, BrandMark, DashChart } = window.LOGWISE_COMPONENTS;`'a daralt
4. Kullanım sitesinden `catLabel: catLabel` prop'unu kaldır

Tek kullanım yeri aynen çalışmaya devam eder.

---

## Bölüm 40 — Refactor Aşama 2, Faz 2C-5: AuthScreen Ayrıldı (C1 Kapatıldı, 2026-04-18)

C1 alt-adım 5 (**son**): login/register/şifre-sıfırlama modal'ı `AuthScreen` (425 satır) `components/auth-screen.js`'e taşındı. **C1 (izole bileşen extraction) alt-fazı bu adımla kapatıldı** — 5 bileşenin tamamı `window.LOGWISE_COMPONENTS` namespace'ine ayrıldı.

### Yeni Dosya

- `components/auth-screen.js` (447 satır) — `window.LOGWISE_COMPONENTS.AuthScreen`

### Bağımlılık Stratejisi — Runtime vs Prop

Component 7 dış bağımlılığa sahip. Çözüm matrisi:

| Bağımlılık | Çözüm | Gerekçe |
|---|---|---|
| `React.useState`, `React.createElement` | Doğrudan `React.*` | C1 ailesinin pattern'i |
| `TR`, `EN` | Runtime: `window.LOGWISE_TR/EN` | Faz 1'den namespace'te |
| `normalizeUsername` | Runtime: `window.LOGWISE_PROFILE_UTILS` | Faz 2A'dan |
| `BrandMark` | Runtime: `window.LOGWISE_COMPONENTS` | Faz 2C-2'den |
| `sb` (Supabase) | **Prop** | Faz 2D'ye kadar — `window.LOGWISE_DB` oluşturulunca prop kaldırılacak |
| `profileRoute` | **Prop** | IS_LOCAL_STATIC'e bağlı, index.html-specific |
| `syncProfileRecord` | **Prop** | sb kullanıyor, 2D'de LOGWISE_DB.saveProfile olacak |

3 prop Supabase bağımlılıklı — **Faz 2D bu prop'ları tamamen kaldıracak** çünkü bileşen `window.LOGWISE_DB`'den doğrudan erişecek. Şu an bu 3 prop, 2D'ye köprü niteliğinde.

### Kullanım Sitesi

```js
React.createElement(AuthScreen, {
  onLogin: u => { setUser(u); setShowAuth(false); },
  lang, setLang,
  onClose: () => setShowAuth(false),
  sb,                   // ← C1-5'te eklendi
  profileRoute,         // ← C1-5'te eklendi
  syncProfileRecord     // ← C1-5'te eklendi
})
```

### Script Yükleme Sırası

```html
<script src="components/error-boundary.js"></script>
<script src="components/brand-mark.js"></script>
<script src="components/dash-chart.js"></script>
<script src="components/ex-preview-modal.js"></script>
<script src="components/auth-screen.js"></script>   <!-- C1-5 -->
```

`auth-screen.js` diğer 4 bileşenden **sonra** yüklenmeli çünkü içinde `window.LOGWISE_COMPONENTS.BrandMark`'a runtime'da erişiyor. Ancak defensive init sayesinde script sırası kritik değil — `BrandMark` render'da (App'in `React.createElement(AuthScreen,...)` çağırmasından sonra) çözülür, o noktada tüm bileşenler yüklenmiş olur.

### Dosya Satır Sayıları (Öncesi → Sonrası)

- `index.html`: 9,074 → **8,649** (-425 satır) — C1'in 2. en büyük tek-adım kazancı
- `components/auth-screen.js`: 0 → **447** (yeni, yorum + defensive init + form mantığı + Google SVG dahil)

### Doğrulama

- `node --check components/auth-screen.js` ✅
- Runtime testleri:
  - `window.LOGWISE_COMPONENTS.AuthScreen` fonksiyon olarak export ✅
  - Login mode render — email/password input'ları, "Şifremi Unuttum" linki ✅
  - Register mode — fullname/username/pw/pw2 input'ları, username regex filter ✅
  - Forgot mode — sadece email input'u, Google button gizli, back-to-login linki ✅
  - Google OAuth button click — `sb.auth.signInWithOAuth` çağrıldı ✅
  - Form submit — mode'a göre doğru sb.auth metodu (signIn/signUp/resetPassword) ✅
  - Username taken check — `sb.from("profiles").select` çağrıldı ✅
  - Error/info state'leri doğru render ✅
  - Language toggle button ✅
- Defensive init 2/2 PASS — fresh load + mevcut namespace korundu ✅
- `node --check` index.html inline JS ✅
- Bracket balance (`auth-screen.js`): `(`=0 `{`=0 `[`=0 ✅
- `AuthScreen` index.html'de 2 yerde (1 destructure + 1 createElement) ✅

### Service Worker Güncellemesi

`sw.js` — `CACHE_NAME` `'logwise-v18'` → `'logwise-v19'`. `/components/auth-screen.js` PRECACHE_URLS'e eklendi.

### Mimari Not: Props-for-Supabase Bridge Pattern

`sb`/`profileRoute`/`syncProfileRecord` prop olarak geçmek 2D'ye (DB layer ayrıştırması) geçiş köprüsüdür. Alternatifler:

1. **`window.LOGWISE_SB = sb;` hemen şimdi** — IIFE içinde `const sb = window.LOGWISE_SB` olarak oku. Problem: `profileRoute`/`syncProfileRecord` hâlâ inline, tek taşıyla çözmek 2D'nin skopunu bulanıklaştırır
2. **C1-5'i 2D'ye ertele** — pattern tutarlılığı bozulur (C1 zaten 5 bileşende)
3. **Prop injection (seçilen)** — temiz köprü, 2D geldiğinde 3 prop kolayca temizlenir

### C1 Alt-Fazı Kümülatif Etki

5 bileşenin tamamı çıkarıldıktan sonra index.html'de toplam kazanç:

| Adım | Bileşen | index.html Satır Δ | Component Satır |
|---|---|---:|---:|
| C1-1 | ErrorBoundary | -123 | 139 |
| C1-2 | BrandMark | -33 | 49 |
| C1-3 | DashChart | -116 | 139 |
| C1-4 | ExPreviewModal | -258 | 284 |
| C1-5 | AuthScreen | -425 | 447 |
| **Toplam** | **5 bileşen** | **-955** | **1,058** |

index.html: 9,604 (Faz 2B sonrası) → **8,649** (C1 sonrası)

Bu, monolit dosyayı yaklaşık **%10 daralttı** ve tüm React bileşenlerini bağımsız, test edilebilir, yeniden-kullanılabilir birimlere ayrıştırdı.

### Geri Alma

`components/auth-screen.js`'i sil; `index.html`'de:
1. `<script src="components/auth-screen.js"></script>` satırını kaldır
2. `function AuthScreen(...)` tanımını `syncProfileRecord`'un sonrasına geri al (`useState` olarak, `React.useState` değil; window.*'ları destructure etmek yerine global kullan)
3. Destructuring'i `const { ErrorBoundary, BrandMark, DashChart, ExPreviewModal } = window.LOGWISE_COMPONENTS;`'a daralt
4. Kullanım sitesinden `sb`/`profileRoute`/`syncProfileRecord` prop'larını kaldır

Tek kullanım yeri aynen çalışmaya devam eder.

### Sonraki: Faz 2D — DB/Supabase Layer Ayrıştırması

Faz 2D'nin kapsamı:
- Yeni dosya: `lib/db.js` (`window.LOGWISE_DB`)
- İçerik: `sb` client, `loadUserData/saveUserData`, `loadProfile/saveProfile`, `listFollowers/listFollowing`, realtime subscription helper'ları, auth state listener
- AuthScreen'den 3 bridge prop'u (`sb`, `profileRoute`, `syncProfileRecord`) kaldırılır — component dosyası `window.LOGWISE_DB.*` kullanır
- index.html inline scope'tan ~40-60 satır Supabase ilgili kod daha çıkar

---

## Bölüm 41 — Refactor Aşama 2, Faz 2D: DB Layer Ayrıldı (Aşama 2 Kapatıldı, 2026-04-20)

Faz 2D: Supabase istemcisi ve profil senkron fonksiyonları `lib/db.js` dosyasına taşındı (`window.LOGWISE_DB` namespace). AuthScreen bileşeninden 3 bridge prop (`sb`, `profileRoute`, `syncProfileRecord`) kaldırıldı — component artık namespace'ten doğrudan okuyor. **Bu adımla Aşama 2 (yapısal ayrıştırma) tamamen kapatıldı.**

### Yeni Dosya

- `lib/db.js` (46 satır) — `window.LOGWISE_DB`:
  - `sb` — Supabase client (URL + ANON_KEY dahili sabit)
  - `SUPABASE_URL` — URL sabiti (dışarıda gerekirse)
  - `profileRoute(id?)` — `/profile` veya `/profile.html` URL üretici (IS_LOCAL_STATIC ortam-algılı)
  - `syncProfileRecord(user, overrides?)` — `profiles` tablosuna INSERT/UPDATE (maybeSingle + buildProfileRow)

### Kapsam Kararı — Minimal vs Kapsamlı

Faz 2D iki şekilde yapılabilirdi:

1. **Kapsamlı (reddedildi):** App() içindeki 20+ inline `sb.from(...)` çağrısını tek tek sarmalayıp `LOGWISE_DB.loadUserData()`, `saveFeedback()`, `fetchLeaderboard()` vb. 15-20 fonksiyon yaratmak.
2. **Minimal (seçildi):** Sadece `sb`, `profileRoute`, `syncProfileRecord` taşınır; App içindeki inline çağrılar dokunulmaz — `sb` yine aynı isimle scope'ta erişilebilir (destructure sayesinde).

Gerekçe: Kapsamlı strateji, index.html'deki inline çağrıları dönüştürmek için App function body'sine girmeyi gerektirir ve view extraction (Aşama 3) olmadan erken soyutlama yaratır. Minimal strateji 2D'nin asıl amacını (DB client'ın dosyaya taşınması + AuthScreen bridge temizliği) tek seferde tamamlar; inline call sarmalaması Aşama 3'te view extraction ile birlikte yapılırsa çok daha doğru bölümlenir.

### index.html Değişiklikleri

Silinen inline kod (satır 86-88, 151, 179-197):
```js
// ÖNCE: 23 satır inline
const SUPABASE_URL = "...";
const SUPABASE_ANON_KEY = "...";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
...
const profileRoute = id => `${IS_LOCAL_STATIC ? "/profile.html" : "/profile"}${...}`;
...
const syncProfileRecord = async (user, overrides = {}) => { /* 19 satır */ };
```

Yerine (1 satır destructure):
```js
const { sb, profileRoute, syncProfileRecord } = window.LOGWISE_DB;
```

`IS_LOCAL_STATIC` kalıyor — `shareRoute` hâlâ kullanıyor.

### AuthScreen Prop İmzası Sadeleştirme

Faz 2C-5'te 7 prop vardı (onLogin, lang, setLang, onClose, sb, profileRoute, syncProfileRecord). 2D'den sonra 4 prop:

```js
// ÖNCE (2C-5 sonu)
React.createElement(AuthScreen, {
  onLogin, lang, setLang, onClose,
  sb, profileRoute, syncProfileRecord
})

// SONRA (2D sonu)
React.createElement(AuthScreen, {
  onLogin, lang, setLang, onClose
})
```

Component dosyası içinde:
```js
// components/auth-screen.js
function AuthScreen({ onLogin, lang, setLang, onClose }) {
  const { sb, profileRoute, syncProfileRecord } = window.LOGWISE_DB;
  // ...
}
```

Bu "bridge pattern" çözümü 2C-5'te tahmin edildiği gibi 2D'de temiz biçimde kapatıldı.

### Script Yükleme Sırası

```html
<script src="lib/profile-utils.js"></script>
<script src="lib/db.js"></script>                <!-- YENİ — Faz 2D -->
<script src="components/error-boundary.js"></script>
...
<script src="components/auth-screen.js"></script>
```

`db.js` `profile-utils.js`'ten **sonra** çünkü `syncProfileRecord` içinde `buildProfileRow` (window.LOGWISE_PROFILE_UTILS'den) kullanılıyor; component script'lerinden **önce** çünkü `auth-screen.js` `window.LOGWISE_DB`'yi runtime'da okur.

### Dosya Satır Sayıları (Öncesi → Sonrası)

- `index.html`: 8,649 → **8,630** (-19 satır — 23 inline silindi, 1 destructure eklendi, 3 prop kaldırıldı)
- `lib/db.js`: 0 → **46** (yeni)
- `components/auth-screen.js`: 454 → **452** (-2 satır — 3 prop imzadan çıktı, 1 destructure eklendi, yorum bloğu güncellendi)

### Doğrulama

- `node --check lib/db.js` ✅
- `node --check components/auth-screen.js` ✅
- Bracket balance: `lib/db.js` (`(`=0 `{`=0 `[`=0) ✅
- Runtime:
  - `window.LOGWISE_DB.sb` — Supabase client instance ✅
  - `window.LOGWISE_DB.profileRoute()` → `/profile` (prod) / `/profile.html` (local) ✅
  - AuthScreen register akışı — `syncProfileRecord` namespace'ten çözülüyor ✅
  - Login/logout — `sb.auth.*` çağrıları index.html scope'ta sorunsuz ✅
  - Google OAuth redirectTo → `profileRoute()` ile URL üretiyor ✅

### Service Worker Güncellemesi

`sw.js` — `CACHE_NAME` `'logwise-v19'` → `'logwise-v20'`. `/lib/db.js` PRECACHE_URLS'e eklendi.

### Geri Alma

1. `lib/db.js` sil
2. `index.html`'de `<script src="lib/db.js"></script>` satırını sil
3. `const { sb, profileRoute, syncProfileRecord } = window.LOGWISE_DB;` satırını git HEAD'den restore et (SUPABASE sabitleri + sb init + profileRoute + syncProfileRecord fonksiyonu)
4. AuthScreen kullanım sitesinde `sb, profileRoute, syncProfileRecord` prop'larını geri ekle
5. `components/auth-screen.js` prop imzasını 7'ye genişlet, `const { sb, profileRoute, syncProfileRecord } = window.LOGWISE_DB;` satırını sil
6. `sw.js` CACHE_NAME ve PRECACHE_URLS'i geri al

### Aşama 2 Kapanış Özeti — Yapısal Ayrıştırma Tamam

Aşama 2, Aşama 1'in (veri/sabit/saf fonksiyon ayrıştırması) üzerine **render, stil ve DB katmanını** ayırdı. Faz-faz:

| Faz | Kapsam | Yeni Dosya(lar) | index.html Δ |
|---|---|---|---:|
| 2A | Profile utilities | `lib/profile-utils.js` | -~30 |
| 2B | Ortak CSS | `styles/base.css` | -~100 |
| 2C-1 | ErrorBoundary | `components/error-boundary.js` | -123 |
| 2C-2 | BrandMark | `components/brand-mark.js` | -33 |
| 2C-3 | DashChart | `components/dash-chart.js` | -116 |
| 2C-4 | ExPreviewModal | `components/ex-preview-modal.js` | -258 |
| 2C-5 | AuthScreen | `components/auth-screen.js` | -425 |
| 2D | DB Layer | `lib/db.js` | -19 |
| **Aşama 2 toplam** | **8 faz / 8 yeni dosya** | | **~-1,100 satır** |

`index.html` başlangıç 9,700+ → Aşama 2 sonu **8,630** (~**%11 küçülme**). `window.LOGWISE_*` namespace ailesi 9 üyeye ulaştı: TR, EN, BADGES, PRESET_EXERCISES, EX_DESCS, EX_PREVIEW, PRESET_PROGRAMS, CALC, BADGE_LOGIC, SCHEMA, PROFILE_UTILS, DB + COMPONENTS (5 bileşen).

### Aşama 2 Sonrası Durum

- Veri/sabit katmanı: `data/` (Aşama 1)
- Saf fonksiyon katmanı: `lib/calc.js`, `lib/badge-logic.js`, `lib/data-schema.js`, `lib/profile-utils.js`
- DB katmanı: `lib/db.js` (Aşama 2D)
- Stil katmanı: `styles/base.css` (Aşama 2B)
- Bileşen katmanı: `components/*.js` (Aşama 2C, 5 bileşen)
- `index.html`: App + Root monolit'i + 20+ inline `sb.from(...)` çağrısı

### Sonraki — Aşama 3 (Opsiyonel)

Aşama 3 **view extraction** olacaktır: `App` monolit'inden dashboard/history/stats/programs/exercises/settings/share view'ları ayrı component dosyalarına taşınır. Bu, state paylaşımı için Context API veya prop-drilling kararı gerektirir ve App içindeki inline `sb.from(...)` çağrılarının sarmalanmasıyla eşzamanlı yapılması daha temiz olur. Tahmini 6-10 seans. Kullanıcı pratik performansı baz alarak bu aşamaya geçip geçmeyeceğine karar verecek.

---

## Bölüm 42 — DOC-1: Dokümantasyon Altyapısı (2026-04-20)

Aşama 2 kapandıktan sonra, projede iki AI aracı (Claude + Codex) farklı seanslarda çalışırken koordineli ve tutarlı davranabilmesi için **dokümantasyon altyapısı** ayrıldı. Kod değişikliği yok; tamamen MD dosyası düzenlemeleri.

### Neden Gerekti?

Proje "rehber" olarak tek büyük dosya (`CLAUDE-CODE-REHBER.md`, ~2,700 satır) kullanıyordu. Problemler:
1. **Ad araç-özgülü:** "CLAUDE-CODE-REHBER" Codex'e "bu sana değil" mesajı veriyordu.
2. **Tek dosya, çok amaçlı:** Aktif kurallar + tarihsel refactor kaydı + "nasıl yaparım?" reçeteleri tek yerde iç içeydi.
3. **Seans giriş noktası yok:** AI seansı başladığında "ilk önce ne oku?" net değildi.
4. **Görev-tipi reçete yok:** "Preset hareket nasıl eklenir?" sorusunun cevabı 2,700 satır içinde dağınıktı.

### Yapılanlar

#### 1. `AGENTS.md` oluşturuldu (~180 satır, kök dizin)
Her AI seansının ilk okuduğu dosya. İçeriği:
- Proje özeti
- Seans öncesi kontrol listesi
- Mutlak kurallar (JSX yasak, window.LOGWISE_* namespace, i18n zorunlu, sw.js bump, commit hijyeni, ...)
- Dosya yapısı haritası
- "Ne için nereye bak?" tablosu
- Seans sonu kontrol listesi
- Yasak listesi
- Refactor durumu özeti
- Bu dosyayı güncelleme kuralları

#### 2. `CLAUDE-CODE-REHBER.md` → `REFACTOR-GECMISI.md` yeniden adlandırıldı
- `git mv` ile rename — history korundu.
- Başına uyarı bloğu eklendi: "Bu tarihsel kayıttır; aktif kurallar için `AGENTS.md`'yi oku."
- Ad araç-agnostik oldu; hem Claude hem Codex rahatça okuyabilir.

#### 3. `docs/` klasörü oluşturuldu — görev-tipi reçeteler
Her biri 60-200 satır arasında, tek iş tipine odaklı:

| Dosya | İçerik |
|---|---|
| `docs/PRESET-EXERCISE-EKLEME.md` | Yeni hareket ekleme: `presets-exercises.js` + `ex-descriptions.js` + `ex-preview.js` şemaları, tam örnek, kontrol listesi |
| `docs/PRESET-PROGRAM-EKLEME.md` | Yeni program ekleme: `presets-programs.js` şeması, gün anahtarları, tam örnek |
| `docs/YENI-COMPONENT.md` | React bileşeni ekleme pattern'i (Faz 2C'den çıkan standart): IIFE, defensive init, runtime deps, sw.js + index.html entegrasyonu |
| `docs/SW-VERSION-BUMP.md` | Servis worker versiyon bump: ne zaman gerekli, prosedür, yaygın hatalar |

### İki-Katmanlı Yaklaşım

- **Üst katman (`AGENTS.md`):** Kısa, sözleşme niteliğinde, her seans okunur.
- **Alt katman (`docs/*.md`):** Görev-özgü, sadece ilgili iş yapılırken okunur.
- **Arşiv katmanı (`REFACTOR-GECMISI.md`):** Tarihsel; refactor kararlarına referans için.

Sonuç: Hangi iş olursa olsun AI'nın okuyacağı materyal **hedeflenmiş** ve **asgari** olur.

### Dosya Durum Değişiklikleri

- **Yeni:** `AGENTS.md`, `docs/PRESET-EXERCISE-EKLEME.md`, `docs/PRESET-PROGRAM-EKLEME.md`, `docs/YENI-COMPONENT.md`, `docs/SW-VERSION-BUMP.md`
- **Rename:** `CLAUDE-CODE-REHBER.md` → `REFACTOR-GECMISI.md`
- **İçerik güncellemesi:** `REFACTOR-GECMISI.md` başına uyarı bloğu + bu Bölüm 42

### Kod Değişikliği

**Hiç yok.** Bu faz saf dokümantasyon. Kullanıcı-yüzlü hiçbir şey etkilenmedi. `sw.js` bump GEREKSİZ (hiçbir statik asset eklenmedi/silinmedi).

### Neden "DOC-1"?

Bu faz "Aşama 3" olarak etiketlenmedi çünkü Aşama 3 kod refactor'ü için saklanıyor. Doküman altyapısı ayrı bir "meta" iş; numaralandırma olarak `DOC-1` (Documentation, birinci ada) kullanıldı. İleride `DOC-2` (örneğin yeni bir `docs/API-KULLANIMI.md` gerektiğinde) bu çizgide gelebilir.

### Gelecekteki Sahiplik

- **AGENTS.md'yi her iki AI de okur.** Yeni bir kural/yasak eklerken AGENTS.md'ye eklenir, tarihi yenilenir.
- **docs/ reçeteleri** hangi iş tipinde yapılan değişiklikleri geri yansıtacak şekilde güncellenir (örn. Faz EX-ID geldiğinde `PRESET-EXERCISE-EKLEME.md`'ye ID kuralı eklenir).
- **REFACTOR-GECMISI.md** büyük iş bittikçe yeni Bölüm eklenir.

### Sonraki — Faz EX-ID (Opsiyonel, Aşama 3'ten Bağımsız)

Kullanıcı onayladı: preset hareketlere **slug ID sistemi** eklenecek (kebab-case, örn. `bench-press`). Strateji A seçildi: kullanıcı verisine dokunma, sadece dosyalar arası bağlantı ID'ye çevrilir. Detay planı Faz EX-ID başlamadan önce ayrıca yapılacak.

---

## Bölüm 43 — Faz EX-ID: Preset Hareketlere Slug ID Sistemi (2026-04-20)

### Hedef

Preset hareketler arası referansları **Türkçe isim** yerine **slug id** ile yapmak. Önceki düzende `data/ex-descriptions.js`, `data/ex-preview.js` ve `data/presets-programs.js` dosyaları anahtar olarak Türkçe hareket ismini kullanıyordu (`"Bench Press"`, `"İncline Dumbell Press"`). Bu yapı iki problem doğuruyordu:

1. **Kırılganlık:** Bir hareketin ismini değiştirmek isteyen, 3-4 dosyada senkron rename yapmak zorunda — yoksa lookup sessizce fail olur.
2. **Türkçe karakter riski:** `İ`, `ş`, `ğ` anahtar içinde yanlış encode edilirse key mismatch olur.

Strateji A (kullanıcı onaylı): kullanıcı verisi (Supabase `workouts` tablosu, localStorage) **değişmez** — hâlâ `name` saklar. Sadece preset dosyaları arası referanslar slug'a çevrildi.

### Slug Kuralları

- Format: `[a-z0-9-]+` (kebab-case, küçük harf + rakam + tire)
- İngilizce ad varsa onun slug hâli; yoksa Türkçe ad transliterasyonu (İ→i, ş→s, ü→u, ç→c, ğ→g, ı→i, ö→o)
- Global benzersiz (3 dosyada lookup key'i olarak kullanılır)

Örnekler:
- `Bench Press` → `bench-press`
- `İncline Dumbell Press` / `Incline Dumbell Press` → `incline-dumbell-press`
- `Şınav` / `Push Up` → `push-up`
- `Yürüyüş Bandı` / `Treadmill` → `treadmill`

### Dead Hang Deduplikasyonu (Ön Adım)

`data/presets-exercises.js` orijinalinde `{ name: "Dead Hang", categories: ["Bilek"] }` iki kez listeleniyordu (tam duplicate). Kullanıcı onayıyla silindi: **55 → 54 hareket**.

### Uygulanan Değişiklikler

#### 1. `data/presets-exercises.js`

Her hareket objesine `id: "slug"` alanı eklendi. Objelerin geri kalan yapısı aynen korundu (`name`, `nameEN`, `categories`).

```js
// Önce
{ name: "Bench Press", categories: ["Göğüs"] }
// Sonra
{ id: "bench-press", name: "Bench Press", categories: ["Göğüs"] }
```

54 hareketin hepsi id aldı. Dead Hang duplicate kaldırıldı.

#### 2. `lib/exercise-utils.js` (YENİ DOSYA)

`window.LOGWISE_EX_UTILS` namespace'i. Lazy-built Map index'leri (`_byId`, `_byName`) ilk lookup'ta `LOGWISE_PRESET_EXERCISES` üzerinden kurulur.

Public API:
- `getExerciseById(id)` — slug'dan obje
- `getExerciseByName(name)` — Türkçe isim / nameEN'den obje
- `nameToId(name)` — sadece id getirir, yoksa `null`
- `resolveKey(nameOrId)` — **kritik helper**: slug verilirse slug geri döner; Türkçe isim verilirse slug'a çevirir; hiçbiri bulunamazsa input'u aynen döner (backward compat için)

`resolveKey` stratejisi sayesinde `getExDesc` / `getExPreview` / `ExPreviewModal` hem eski kullanıcı verisine (name ile kaydedilmiş) hem yeni preset referanslarına (slug) cevap verir.

#### 3. `data/ex-descriptions.js` — Anahtar Migrasyonu

Tüm 54 anahtar Türkçe isimden slug'a çevrildi. Değer formatı (`[TR, EN]` dizisi) korundu.

```js
// Önce
"Bench Press": ["Düz bankta...", "Flat bench..."]
// Sonra
"bench-press": ["Düz bankta...", "Flat bench..."]
```

#### 4. `data/ex-preview.js` — Anahtar Migrasyonu

52 preview girdisi (tüm hareketlerin preview'ı yok) aynı şekilde slug'a çevrildi. Değer formatı (`{gif, desc:[TR,EN], tips:[[TR,EN],...]}`) korundu.

#### 5. `data/presets-programs.js` — Referans Migrasyonu

4 programın `days["0"]..."6"]` dizilerindeki tüm hareket string'leri slug'a çevrildi.

```js
// Önce
days: { "0": ["Bench Press", "Overhead Press", ...] }
// Sonra
days: { "0": ["bench-press", "overhead-press", ...] }
```

Cross-reference doğrulandı: tüm program slug'ları `presets-exercises.js`'teki `id` alanlarıyla birebir eşleşiyor (0 eksik).

#### 6. `index.html` — Helper Güncellemeleri

- `<script src="lib/exercise-utils.js"></script>` presets-programs.js'ten sonra eklendi
- `getExDesc(nameOrId, lang)`: artık `LOGWISE_EX_UTILS.resolveKey(nameOrId)` ile key çözüyor
- `getExPreview(nameOrId)`: aynı resolve pattern'i
- `addPresetProgram` → `ensureEx(nameOrId)`: önce `p.id === nameOrId` ile arar, yoksa `p.name`/`p.nameEN` ile — yani hem slug-format (yeni) hem name-format (eski) referanslar çalışır; display name her zaman `presetName(pe, lang)` ile resmi isme döner

#### 7. `components/ex-preview-modal.js`

- Header yorumları Faz EX-ID için güncellendi
- Modal `ex.id || ex.name` değerini `LOGWISE_EX_UTILS.resolveKey` ile slug'a çevirip `EX_PREVIEW[key]` lookup'u yapıyor
- `ex.id` yoksa (eski kullanıcı antrenmanı objesi) fallback `ex.name` ile çalışır — bozulma yok

#### 8. `sw.js` — PRECACHE Güncellemesi

- `CACHE_NAME`: `'logwise-v20'` → `'logwise-v21'`
- `PRECACHE_URLS`'e `/lib/exercise-utils.js` eklendi (lib/db.js'ten sonra)

#### 9. Dokümantasyon Güncellemeleri

- `docs/PRESET-EXERCISE-EKLEME.md` — tam yeniden yazıldı: slug üretme kuralları, `id` zorunluluğu, 3 dosyada aynı slug, backward compat notu
- `docs/PRESET-PROGRAM-EKLEME.md` — tam yeniden yazıldı: artık slug referansları, Node cross-reference doğrulama scripti
- `AGENTS.md` — §4 dosya haritası (54 hareket, slug-id notları, `lib/exercise-utils.js` satırı), §8 Faz EX-ID bölümü, SON GÜNCELLEME tarihi/etiketi

### Backward Compat Stratejisi (Kritik)

Kullanıcı verisi **olduğu gibi** kaldı — hiçbir migration yazılmadı, hiçbir veri dokunulmadı:

- Supabase `workouts` tablosu: `{ name, sets, ... }` — `name` Türkçe isim saklanmaya devam ediyor
- localStorage `logwise-data.entries[].workouts[]` aynı
- `activeProgram` de `{ name, ... }` üzerinden çalışır

Tüm "fix" noktası tek bir helper: `resolveKey(nameOrId)`. Bu helper hem eski `name`-temelli değerleri hem yeni `id`-temelli değerleri doğru `EX_DESCS` / `EX_PREVIEW` anahtarına çevirir. Dolayısıyla:

- Eski kullanıcılar açtıklarında `name` geçerli → resolveKey name→id map'inden slug'a çevirir → preview bulunur
- Yeni kullanıcılar programdan hareket eklerse yine `name` ile display edilir (display name hep `name`), ama arka planda slug'a çözümlenebilir

Eğer gelecekte "kullanıcı verisini de id'ye taşı" adımı istenirse (Faz EX-ID Aşama 2), o iş ayrı bir migration olarak düşünülmeli.

### Doğrulama

- Tüm değişen `.js` dosyalarında `node --check` ✅
- `data/presets-exercises.js`: 54 hareket, her birinde `id` alanı var, id'ler benzersiz (Set size == array length)
- `data/ex-descriptions.js`: 54 slug key, hepsi `presets-exercises.js`'te var
- `data/ex-preview.js`: 52 slug key, hepsi `presets-exercises.js`'te var
- `data/presets-programs.js`: 4 programda toplam N slug referansı; hepsi `presets-exercises.js`'te var (eksik 0)
- `lib/exercise-utils.js`: `resolveKey(slug)` === slug; `resolveKey(tr-name)` === slug; `resolveKey(bogus)` === bogus

### sw.js Durumu

- `CACHE_NAME` bump: `v20` → `v21` (yeni `lib/exercise-utils.js` eklendi); hotfix'lerle birlikte v23'e çıktı (aşağı bkz)
- PRECACHE_URLS'e eklendi: `/lib/exercise-utils.js`
- Mevcut statikler değişmedi (sadece içerik migrasyonu), ama cache isim bump'ı yine de zorunlu (yeni dosya eklendi)

### Hotfix'ler (Deploy Sonrası, 2026-04-20)

Faz EX-ID'nin ana commit'i deploy edildikten sonra canlı testte iki bug yakalandı; aynı gün ardışık iki fix commit'i atıldı.

#### Hotfix 1 — `setPreviewEx({ id: "preset-" + p.idx, ... })` (Sahte Slug)

**Semptom:** "Hareket Ekle → Preset" listesinde hareketin info düğmesine tıklayınca modal açılıyordu ama açıklama/ipuçları boş geliyordu ("Bu hareket için içerik henüz eklenmemiş").

**Sebep:** `index.html` line 5611 civarında, preset listede info butonu `setPreviewEx({ id: "preset-" + p.idx, name: p.displayName, ... })` çağırıyordu. `"preset-0"` gibi sahte bir id geçiriliyordu — Faz EX-ID öncesi sadece React key ihtiyacı içindi, gerçek bir slug değildi. Faz EX-ID sonrası modal `resolveKey(ex.id || ex.name)` yapıyor; truthy id varken name'e fallback yapmıyor, `EX_PREVIEW["preset-0"]` undefined dönüyordu.

**Fix:** `id: "preset-" + p.idx` → `id: p.id`. `p` zaten `PRESET_EXERCISES.map(...)` sonucu olduğu için `p.id` gerçek slug ('bench-press' vs.).

**Commit:** "Faz EX-ID fix: preset hareket preview modal ex.id slug kullansın"

#### Hotfix 2 — Kullanıcı Hareketinde `ex.id = Date.now()` (Numerik, Slug Değil)

**Semptom:** "Hareketlerim" listesinde, kullanıcı bir hareketi (preset'ten eklenmiş bile olsa) info ile açtığında modal yine boş geliyordu. Hatta hareketi silip preset'ten yeniden ekleyince de aynı durum.

**Sebep:** `addExercise` ve `addPresetExercises` fonksiyonları, kullanıcı verisindeki her hareket için `id: Date.now().toString()` kaydediyor (örn. `"1729456789123"`). Bu numerik string slug **değil**, kullanıcı kaydının tanımlayıcısı. Modal yine `resolveKey(ex.id || ex.name)` yapıyor; numerik id truthy olduğu için name'e düşmüyor, `resolveKey` tanımadığı string'i passthrough döndürüyor → lookup fail.

Aynı problem ileride başka noktalarda da çıkabilir çünkü kullanıcı veri şeması `id` alanını farklı bir anlamla kullanıyor. Slug ile kullanıcı id'si **aynı alan adını paylaşan farklı kavramlar**.

**Fix iki katmanda:**

1. **`components/ex-preview-modal.js`** — modal artık `[ex.id, ex.name]` adaylarını **sırayla** dener; `EX_PREVIEW` Map'inde hangisi varsa onu seçer. İlk aday (numerik id) fail olunca otomatik name'e geçer.

   ```js
   const candidates = [ex.id, ex.name].filter(Boolean);
   let lookupKey = null;
   for (const c of candidates) {
     const k = utils ? utils.resolveKey(c) : c;
     if (EX_PREVIEW[k]) { lookupKey = k; break; }
   }
   if (!lookupKey) lookupKey = utils ? utils.resolveKey(ex.name || ex.id) : (ex.name || ex.id);
   ```

2. **`lib/exercise-utils.js → resolveKey`** — fallback katmanları güçlendirildi. Önce sadece `_byId.get` + `_byName.get` (case-sensitive) idi; şimdi 5 katmanlı:
   - Tam slug eşleşmesi
   - Tam name eşleşmesi (case-sensitive)
   - Case-insensitive name eşleşmesi
   - On-the-fly Türkçe→slug normalize (`İ→i`, `ş→s`, `ü→u`, `ç→c`, `ğ→g`, `ı→i`, `ö→o`)
   - Passthrough (legacy/custom adlar için)

   Test: "Bench Press", "bench press", "BENCH PRESS", `bench-press`, "Şınav", "Push Up" hepsi doğru slug'a düşüyor.

**Commit:** "Faz EX-ID fix: modal id+name iki aday sırayla dene"

**sw.js bump:** v21 → v22 (resolveKey güncellemesi) → v23 (modal fix). Bileşen davranışı değişiminde cache invalidate kritikti; aksi halde eski cache'teki modal kodu kullanıcıda kalır ve fix görünmezdi. Bu deneyim `docs/SW-VERSION-BUMP.md`'ye "Bump TERCİH EDİLİR (davranış değişti)" maddesi olarak eklendi.

#### Çıkarılan Ders

- **`id` alanı global anlam taşımıyor.** Aynı isimde iki ayrı kavram var:
  - Preset hareketlerde `id` = slug (`"bench-press"`)
  - Kullanıcı verisinde `id` = kaydın tanımlayıcısı (`Date.now().toString()`)
  Modal/helper'lar her iki durumu da handle etmeli; "id varsa kesin slug" varsayımı yanlış.
- **Fallback zinciri katmanlı tasarlanmalı.** `resolveKey`'in tek-katmanlı versiyonu (sadece exact match) gerçek dünyada yetmedi; case farkı, Türkçe karakter farkı, sahte id varyantları hep failure noktası oluyordu.
- **Bileşen mantığı değiştiyse sw.js bump et.** SW-VERSION-BUMP.md'deki "sadece içerik" istisnası yanıltıcıydı; Cloudflare ETag her zaman tetiklemiyor, kullanıcı cache'inde eski modal kalabiliyor.

### Kullanıcı-Yüzlü Davranış Değişiklikleri

**Hiç yok.** Bu faz saf bir yeniden yapılandırma. Kullanıcı bakış açısından:

- Hareket listesi aynı (sadece Dead Hang bir kez görünür artık, önce iki kezdi → görünmez bir iyileşme)
- Preset programlar aynı hareketleri içerir (slug→name çözümü ile display)
- Preview modal açılışı aynı (resolveKey transparent çalışır)
- Eski kullanıcı kayıtları aynen gösterilir (name ile kaydedilmiş; resolveKey name→slug çözerek EX_DESCS/EX_PREVIEW'e ulaşır)

### Neden "Faz EX-ID"?

- **"Faz"** çünkü bu bir refactor fazı (Aşama 1/2/3 düzleminin dışında, bağımsız bir yapı değişikliği)
- **"EX-ID"** çünkü konu exercise'a id eklemek. "Aşama 3" için ayrılmış slot; bu faz yeni bir doğrusal aşama oluşturmuyor.

### Gelecekteki Muhtemel Adımlar (Opsiyonel)

- **Faz EX-ID Aşama 2**: Kullanıcı verisini de slug'a taşı (Supabase migration + localStorage migrateData güncellemesi). Şu an gerek yok; name temelli veri hâlâ doğru render ediliyor.
- **Aşama 3**: View extraction — `index.html` App monoliti'ten dashboard/history/stats/programs/exercises/settings view'larını ayrı component'lara taşı.

---

## Bölüm 44 — Sosyal Akışta Kendi Paylaşımları + Yorum Sistemi (2026-04-21)

### Motivasyon

İki kullanıcı geri bildirimi:

1. **Bug**: "Bir paylaşım yaptığımda o paylaşımı sosyal kısmında göremiyorum. Sadece başka kullanıcılar göründü." → `loadFeed()` yalnızca `following_id`'lere göre filtreliyor, kullanıcının kendi post'larını dahil etmiyordu.
2. **Özellik**: "Paylaşımların altına yorum yapma mekaniği ekleyelim; aynı sosyal medya gibi." → Post-başı yorum zinciri + beğeni + yanıt.

### Yapılan Değişiklikler

#### 1) Feed bug fix — kendi paylaşımlar dahil

`index.html` içindeki `loadFeed()`:

```js
const fids = (fols || []).map(f => f.following_id);
const feedUids = [...new Set([...fids, user.id])];
const { data: posts } = await sb.from("shared_workouts")
  .select("*").in("user_id", feedUids)
  .order("created_at",{ascending:false}).limit(30);
```

"Takip yoksa erken dön" branch'i kaldırıldı; yeni kullanıcı bile kendi akışını görür.

#### 2) Kendi post'u UI işaretleri

Feed kart render bloğunda:

- `isOwnPost = !isGuest && user && post.user_id === user.id`
- Kart border'ı: `var(--blue)` + hafif glow boxShadow
- Kullanıcı adı yanında "Sen" / "You" rozeti (chip, `--blueL` bg + `--blue` border)
- Aksiyon satırında kırmızı sil butonu (🗑) → `deleteSharedPost(post.id)` (RLS: sadece sahibi silebilir, zaten mevcut)

`deleteSharedPost` helper `loadFeed`'in hemen altına eklendi; onay modalı + optimistik state güncellemesi + toast.

#### 3) Supabase şeması — `supabase_setup.sql`

İki yeni tablo eklendi:

```sql
create table shared_workout_comments (
  id text primary key,
  post_id text references shared_workouts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  parent_id text references shared_workout_comments(id) on delete cascade,
  content text not null,
  edited boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table comment_likes (
  comment_id text references shared_workout_comments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (comment_id, user_id)
);
```

İndeksler: `(post_id, created_at desc)`, `parent_id`, `user_id`, `comment_id`.

RLS politikaları:

- `comments_select` = `true` (public feed)
- `comments_insert`/`update` = `auth.uid() = user_id`
- `comments_delete` = yorum sahibi **veya** paylaşım sahibi (nested `exists(select 1 from shared_workouts where id=post_id and user_id=auth.uid())`)
- `comment_likes_select` = `true`
- `comment_likes_insert/delete` = `auth.uid() = user_id`

#### 4) Yeni bileşen — `components/comment-section.js`

`window.LOGWISE_COMPONENTS.CommentSection`. Tek IIFE, React.createElement.

Props: `{ postId, postOwnerId, user, isGuest, lang, S, setToast, onCountChange? }`.

Özellikler:

- İlk mount'ta hem yorumları hem profilleri (display_name, avatar, username) hem beğeni durumunu (current user liked? count) çeker.
- Top-level yorum + tek seviye reply thread (parent_id).
- Yorum ekleme: Enter tuşu veya Gönder butonu. 500 karakter sınırı client-side.
- Düzenleme (sahip): inline textarea + Kaydet/İptal; `edited=true` flag'i UI'da "düzenlendi"/"edited" italic chip olarak gösterilir.
- Silme: yorum sahibi **veya** paylaşım sahibi; confirm → RLS policy izin verir.
- Beğeni: toggle, optimistik update (hata olursa geri alır). Kalp ikonu + sayı.
- Thread aç/kapa: top-level yorum altında "{n} yanıtı göster" butonu; açılınca replies görünür, kapatılınca gizlenir.
- Göreceli zaman: şimdi / dk / sa / g / tarih.
- Misafir kullanıcılar: yorumları okur, input görmez; yerine "Yorum yapmak için giriş yapmalısın." bilgi kutusu.

Bileşen `window.LOGWISE_DB.sb` üzerinden Supabase'e erişir — index.html'den prop geçmek yerine tek doğru source DB katmanı.

#### 5) Feed kart entegrasyonu

`index.html`:

- Script tag: `<script src="components/comment-section.js"></script>` (auth-screen'den sonra)
- Destructure: `const { ..., CommentSection } = window.LOGWISE_COMPONENTS;`
- Yeni state: `feedCommentCounts` (post_id → N, badge için), `feedOpenComments` (post_id → bool, akordeon aç/kapa)
- `loadFeed()` sonuna: 30 post için tek `select("post_id").in(...)` sorgusu, client-side group-by → `feedCommentCounts`
- Kart aksiyon satırına 💬 N butonu (toggle açar/kapar; sayı 0 ise sadece ikon)
- Kart alt kısmına (exercise-pill container'dan sonra, kart divinin son çocuğu olarak) `feedOpenComments[post.id] && React.createElement(CommentSection, {...})` — açılınca CommentSection yüklenir, `onCountChange` prop'u badge'i canlı günceller

#### 6) i18n — `data/i18n-tr.js` + `data/i18n-en.js`

Yorum sistemiyle ilgili 19 anahtar TR + EN olarak eklendi:

```
comments, commentsNone, commentsLoading, commentsAddPlaceholder,
commentsReplyPlaceholder, commentsPost, commentsReply, commentsEdit,
commentsDelete, commentsEdited, commentsSave, commentsCancel, commentsLike,
commentsShowReplies (format: {n}), commentsHideReplies,
commentsDeleteConfirm, commentsLoginRequired, commentsTooLong
```

#### 7) Service Worker bump

`sw.js`:

- `CACHE_NAME: 'logwise-v23' → 'logwise-v24'`
- `PRECACHE_URLS` listesine `/components/comment-section.js` eklendi

Kural: yeni `components/*.js` dosyası eklendi → `docs/SW-VERSION-BUMP.md` gereği bump zorunlu.

#### 8) AGENTS.md güncelleme

- §4 dosya haritasına `comment-section.js` satırı eklendi
- `SON GÜNCELLEME` satırı `2026-04-21 — Bölüm 44` olarak güncellendi

### Neden tek seviye reply?

Sonsuz nesting (reddit tarzı) UX olarak taşar. Instagram/Twitter tarzı tek seviye yeterli; tüm replies ortak parent'a "flatten" edilir. DB şeması `parent_id` ile gerçek tree destekler; UI şu an sadece iki seviyeyi (top-level + direct replies) render eder. İleride istenirse UI değişikliğiyle nested thread açılabilir, migration gerekmez.

### RLS Tehlike Noktaları

1. `comments_delete` policy'sinde nested `exists` — paylaşım sahibinin başkalarının yorumunu silebilmesi için gerekli. Test: başka kullanıcıyla yorum yap → paylaşımı sen sahipsen sil (yalnızca paylaşım sahibi silebilmeli, random 3. kişi silememeli).
2. `comment_likes` primary key `(comment_id, user_id)` — aynı kullanıcı aynı yorumu 2 kez beğenemez (DB seviyesinde garanti). Double-click race condition'ları insert error yerine update'siz geçer; UI optimistik update hata alırsa state'i eski haline döndürür.
3. `on delete cascade` — paylaşım silinince tüm yorumlar + beğeniler düşer. `deleteSharedPost` toast mesajı bunu kullanıcıya uyarır.

### Geriye Dönük Uyumluluk

- Eski paylaşımlar: yorum sayısı 0 → 💬 butonu ikon-only, açılınca "henüz yorum yok" gösterir.
- Misafir kullanıcılar: hiçbir şey kırılmaz; sadece "login gerekli" bilgisi görür.
- Offline kullanıcılar: SW v24 cache update'i önceki SW lifecycle'ında olacak; activate sonrası yeni cache. İlk yorum query'si online gerektirir (akış zaten network-bound).

### Gelecekteki Muhtemel Adımlar

- **Bildirimler**: Biri yorumunu beğendi / biri yanıt verdi → inbox (DB: `notifications` tablosu). Bu bölümün kapsamı dışı.
- **Mention** (`@username`): yorum içinde kullanıcı adı tag'le → profile linki + notification. Parser + autocomplete gerekir.
- **Sonsuz scroll**: Akış şu an son 30 post ile sınırlı; cursor-based pagination ile genişletilebilir.



---

## Bölüm 45 — Blog Sistemi: Markdown → Statik HTML + Landing Entegrasyonu (2026-06-10)

### Amaç

Landing page'den erişilebilen, SEO-dostu bir blog/bilgilendirici yazı bölümü. Blog, app'ten ve landing'den tamamen ayrı statik HTML olarak yaşar; landing yazılara nav, footer ve "Blog" bölümü üzerinden referans verir.

### Mimari Kararlar

- **Statik üretim, build-step yok (runtime'da):** Yazılar `blog-content/*.md` (frontmatter'lı Markdown) olarak yazılır; `node scripts/build-blog.js` bunları `blog/<slug>.html` + `blog/index.html`'e çevirir. Üretilen HTML commit'lenir — hosting tarafında build gerekmez, mevcut "statik dosya sun" modeli korunur.
- **SEO öncelikli:** Yazı sayfaları düz HTML'dir (React yok). Her sayfada meta description, canonical, Open Graph, twitter:card ve JSON-LD `BlogPosting` şeması gömülüdür. `sitemap.xml` script tarafından tüm yazılarla yeniden üretilir.
- **Karışık dil modeli:** Her yazı kendi dilindedir (`lang: tr|en` frontmatter alanı). Blog index'inde TÜMÜ/TR/EN dil filtresi (vanilla JS) vardır; landing bölümü aktif arayüz diline uyan yazıları öne alır.
- **Landing entegrasyonu marker ile:** Script, landing `index.html` içindeki `/* BLOG-POSTS:START */ ... /* BLOG-POSTS:END */` bloğuna yazı manifestini (`BLOG_POSTS`) enjekte eder. Landing'deki yeni `BlogSection` component'i bu veriden ilk 3 kartı basar (featured > tarih sıralı, dil önceliği aktif dile göre).
- **Vendored parser:** Markdown dönüşümü `scripts/vendor/marked.min.js` (UMD, tek dosya) ile yapılır; root'a package.json/npm bağımlılığı eklenmedi.
- **Clean URL:** `blog/slug.html` → `/blog/slug` hosting tarafından otomatik sunulur; `_redirects`/`netlify.toml` değişikliği gerekmedi (catch-all 404 kuralı force'suz olduğu için dosyalar önceliklidir).
- **SW etkisi yok:** Blog sayfaları PRECACHE'e eklenmedi (yalnızca `data/`, `lib/`, `components/` zorunlu); navigation network-first olduğu için CACHE_NAME bump gerekmez.

### Yeni Dosyalar

| Dosya | İçerik |
|---|---|
| `blog-content/*.md` | Yazı kaynakları (2 örnek yazı: TR günlük tutma + EN progressive overload) |
| `scripts/build-blog.js` | Üretici script: frontmatter parse + marked + şablonlar + sitemap + landing enjeksiyonu |
| `scripts/vendor/marked.min.js` | Vendored markdown parser (marked 12.0.2 UMD) |
| `blog/blog.css` | Blog stilleri — elle yazılır, landing design token'larıyla aynı kimlik |
| `blog/index.html`, `blog/<slug>.html`, `blog/posts.json` | Üretilen çıktılar (elle düzenlenmez) |
| `docs/BLOG-YAZISI-EKLEME.md` | Görev reçetesi |

### Landing (`index.html`) Değişiklikleri

- Nav'daki ölü `#faq` linki kaldırıldı → üçüncü nav öğesi artık "Blog" (`/blog`). `COPY.tr/en.nav` güncellendi.
- `COPY.tr` + `COPY.en`'e blog bölümü metinleri eklendi (`blogKicker/Title/Sub/All/Read/Min`) — i18n senkron.
- Yeni `BlogSection` component'i (AppSection ile Quote arasında render edilir) + `.blog-grid/.blog-card` CSS bloğu.
- Footer: `FOOT_HREFS` eşlemesiyle footer linkleri gerçek href aldı (`#features`, `#app`, `/blog` — önceden hepsi `href="#"` placeholder'dı); foot kolonlarına "Blog" eklendi.
- `BLOG-POSTS:START/END` marker bloğu eklendi (script'in yazdığı alan).

### Doğrulama

- Landing inline JSX, Babel standalone (7.29.0) ile transform edilerek syntax doğrulandı.
- Clean-URL davranışını taklit eden lokal sunucuyla smoke test: `/`, `/blog`, iki yazı sayfası, `blog.css`, `posts.json`, `sitemap.xml` → hepsi 200.

### Gelecekteki Muhtemel Adımlar

- Yazı görselleri için `blog/assets/` klasörü + frontmatter `cover:` alanı (og:image yazıya özel olur).
- RSS/Atom feed üretimi (`blog/feed.xml`) — script'e kolayca eklenebilir.
- Landing'in EN/TR dil tercihini blog index'ine taşıma (query param veya localStorage).



---

## Bölüm 46 — SEO Statik Landing + Canonical Domain Temizliği (2026-06-12)

### Amaç

Landing page'i Google'a JavaScript çalışmadan okunabilir, canonical sinyali temiz, hızlı statik HTML olarak sunmak. EN ana landing `/`, TR landing `/tr` oldu; ürün uygulaması `/app` altında kaldı.

### Mimari Kararlar

- **Landing React'ten ayrıldı:** `index.html` artık EN statik SEO landing; `tr.html` TR statik SEO landing. Landing tarafında React runtime, Babel standalone, `type="text/babel"` ve JSX yok.
- **Uygulama shell'i korunur:** React uygulaması `app.html`/`/app` altında aynı üretim düzeniyle devam eder; landing değişikliği app state/DB katmanına dokunmaz.
- **Ortak landing stili:** Eski inline landing CSS `styles/landing.css` dosyasına taşındı. `index.html` ve `tr.html` bu dosyayı kullanır.
- **Mockup görselleri dosyalaştı:** Landing data URI görselleri `assets/landing/` altına çıkarıldı (`calendar`, `program`, `workout logging`, `progress chart`).
- **Canonical apex domain:** `scripts/build-blog.js`, `robots.txt`, blog canonical/OG/JSON-LD ve sitemap üretimi `https://logwise.fit` kullanır; `www` canonical sinyali kaldırıldı.
- **Statik blog kartları:** Blog üretici artık `BLOG_POSTS` JS const'u basmaz. `<!-- BLOG-CARDS:START -->` / `<!-- BLOG-CARDS:END -->` marker'ları arasına EN/TR landing için ilk 3 blog kartını statik HTML olarak enjekte eder.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `index.html` | EN statik landing + SEO meta + hreflang + JSON-LD |
| `tr.html` | TR statik landing + SEO meta + hreflang + JSON-LD |
| `styles/landing.css` | Landing CSS |
| `assets/landing/*` | Landing mockup görselleri |
| `scripts/build-blog.js` | Apex domain, `/tr` sitemap kaydı, statik landing blog kart enjeksiyonu |
| `_redirects` | `/tr` için explicit rewrite yok; Cloudflare Pages `tr.html` → `/tr` clean URL'yi otomatik sunar |
| `robots.txt` | Apex sitemap URL |
| `sw.js` | `logwise-v27`; landing CSS, TR landing ve mockup asset precache |

### Doğrulama Notları

- `node scripts/build-blog.js` çalıştırıldığında blog sayfaları, `posts.json`, `sitemap.xml`, `index.html` ve `tr.html` birlikte güncellenir.
- Blog post HTML'leri service worker precache listesine eklenmez; navigation network-first davranışı korunur.
- Sonraki içerik büyüme fazı ayrı kalır: EN comparison yazıları, evergreen tool pages ve programmatic exercise/program sayfaları bu bölümün kapsamına dahil edilmedi.

---

## Bölüm 47 — Supabase Bölge Taşıması: us-west-2 → eu-central-1 Frankfurt (2026-06-12)

### Amaç

Türkiye'den ~230-330ms warm RTT'ye sebep olan Oregon (us-west-2) Supabase projesini Frankfurt'a (eu-central-1) taşıyarak web + mobil tüm istekleri ~2× hızlandırmak. Perf kampanyasının (FAZ 1-2-2.5 istemci optimizasyonları + donma fix'i) son adımı.

### Mimari Kararlar

- **Yeni proje:** Supabase bölge değişikliğini desteklemediği için yeni proje açıldı: `hfmqywyfnqmpvskkzksv` ("LogWise", eu-central-1). Eski proje `czbxujioufhmvoajqwzp` ("Workout Tracker") geri dönüş için PAUSE'da tutulur (silinmedi).
- **Şema baştan, advisor-temiz kuruldu:** Tüm RLS policy'lerinde `auth.uid()` → `(select auth.uid())` (initplan fix); `user_data`'nın iki SELECT policy'si tek policy'de birleştirildi; 5 unindexed FK'ye covering index (`app_profiles.active_program_id`, `comment_likes.user_id`, `feedback.user_id`, `shared_workouts.user_id`, `follows.following_id`); fonksiyonlara `set search_path = ''`; `delete_own_account`'ın anon EXECUTE izni revoke edildi.
- **Veri taşıma:** 15 public tablo + `auth.users` (16) + `auth.identities` (19, şifre hash'leri korunarak) MCP `execute_sql` + `jsonb_populate_recordset` ile taşındı; büyük `user_data` satırları yeni projede `http` extension ile eski projenin REST API'sinden server-side çekildi. Tablo bazında md5 checksum'lar iki projede birebir doğrulandı; login testi gerçek kullanıcı + eski şifreyle geçti.
- **Realtime publication** (`user_data`, `feedback`) yeni projede aynen kuruldu.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `lib/db.js` | `SUPABASE_URL` + `SUPABASE_ANON_KEY` → Frankfurt |
| `app.html` | dns-prefetch → Frankfurt |
| `profile.html`, `program.html`, `share.html`, `reset-password.html` | Inline URL + anon key → Frankfurt |
| `sw.js` | `logwise-v26` bump (Bölüm 46 ile birlikte v27 oldu) |
| `logwise-mobile/app.json`, `.env.example`, `types/database*.ts` | URL/key swap + type regen (mobile-design-system branch) |

### Doğrulama Notları

- Warm TTFB (Türkiye'den `auth/v1/health`): Oregon ~313-329ms → Frankfurt ~153-160ms (~2×); cold 1.01s → 0.44s.
- Auth config (Site URL, redirect URLs, Google OAuth client + yeni callback URI) dashboard'dan elle taşındı — Google Cloud Console'da eski callback geçiş dönemi boyunca silinmedi.
- Eski proje pause edilmeden önce cutover sonrası canlı regresyon (login, share, profile, reset-password, sosyal akışlar) beklendi; pause kararı ayrı onayla.



---

## Bölüm 48 — SEO Evergreen Tool: One Rep Max Calculator (2026-06-12)

### Amaç

"one rep max calculator", "1RM calculator" ve benzeri yüksek niyetli aramalardan trafik alabilecek, build-step'siz, statik bir hesaplayıcı sayfası eklemek. Sayfa LogWise'ın antrenman takibi değer önerisine bağlanır ve CTA'ları `/app` uygulama shell'ine yönlendirir.

### Mimari Kararlar

- **Statik tool page:** `one-rep-max-calculator.html` kökte yaşar. Cloudflare Pages `.html` clean URL davranışıyla `/one-rep-max-calculator` olarak sunar; `_redirects` içine explicit kural eklenmedi.
- **React/Babel yok:** Sayfa düz HTML + küçük vanilla JS kullanır. Hesaplama script'i sayfa sonunda çalışır; JSX veya build step yoktur.
- **App ile aynı 1RM mantığı:** Sayfa `lib/calc.js` yükler ve `window.LOGWISE_CALC.calc1RM` (Epley) ile `calcBrzycki` fonksiyonlarını kullanır. Script tarafında sadece dosya yüklenemezse diye aynı formüllerin küçük fallback'i vardır.
- **Ortak landing stili:** Yeni tool sayfası `styles/landing.css` kullanır. Sayfaya özel büyük inline CSS eklenmedi; tool page sınıfları landing CSS'e eklendi.
- **Structured data:** Sayfa `WebPage`, `FAQPage` ve `BreadcrumbList` JSON-LD taşır. Tool için `WebApplication`/`SoftwareApplication` kullanılmadı.
- **Sitemap kalıcılığı:** `scripts/build-blog.js`, blog yazıları yanında `STATIC_SITEMAP_PAGES` listesini de sitemap'e yazar. Böylece sonraki blog build'leri `/one-rep-max-calculator` URL'sini düşürmez.
- **Service worker:** Yeni HTML sayfası `PRECACHE_URLS`'e eklenmedi. HTML navigation network-first olduğu için sayfa ilk online ziyarette taze gelir ve ziyaret edildikten sonra runtime cache'e alınır. `CACHE_NAME` bump gerekmedi.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `one-rep-max-calculator.html` | EN statik 1RM calculator + SEO meta + JSON-LD + vanilla JS |
| `styles/landing.css` | Statik tool page layout/form/table/FAQ stilleri |
| `scripts/build-blog.js` | `STATIC_SITEMAP_PAGES` ile `/one-rep-max-calculator` sitemap kaydı |
| `sitemap.xml` | `/one-rep-max-calculator` URL'si |
| `AGENTS.md` | Dosya haritası + görev tipi + refactor özeti güncellendi |

### Doğrulama Notları

- `node --check scripts/build-blog.js` ve inline calculator script syntax kontrolü yapılmalı.
- `node scripts/build-blog.js` çalıştırıldığında sitemap, blog çıktıları ve landing blog kartları birlikte güncellenir.
- Lokal smoke testte `/one-rep-max-calculator` clean URL, calculator formu ve CTA linkleri doğrulanmalı.



---

## Bölüm 49 — SEO Evergreen Template: Workout Log Template (2026-06-12)

### Amaç

"workout log template", "printable workout log" ve "free workout log template" aramalarına yönelik, Google'ın JS çalıştırmadan okuyabileceği statik bir template/tool sayfası eklemek. Sayfa kullanıcıya hemen basılabilir bir antrenman günlüğü şablonu verir ve uzun vadeli takip için LogWise `/app` CTA'sına bağlanır.

### Mimari Kararlar

- **Statik template page:** `workout-log-template.html` kökte yaşar. Cloudflare Pages `.html` clean URL davranışıyla `/workout-log-template` olarak sunar; `_redirects` içine explicit kural eklenmedi.
- **React/Babel yok:** Sayfa düz HTML + küçük vanilla JS kullanır. JS yalnızca şablona satır ekleme, örnek alanları temizleme ve `window.print()` tetikleme için vardır.
- **Printable template:** Şablon içerikleri `contenteditable` alanlarla tarayıcı içinde düzenlenebilir. `styles/landing.css` içine print media kuralları eklendi; print sırasında nav/CTA/guide bölümleri gizlenir, şablon sade kağıt görünümünde basılır.
- **Ortak tool tasarımı:** 1RM sayfasındaki `tool-*` sınıfları yeniden kullanıldı; template'e özel `template-*` ve `sheet-*` sınıfları aynı `styles/landing.css` içinde tutuldu. Inline büyük CSS eklenmedi.
- **Structured data:** Sayfa `WebPage`, `HowTo`, `FAQPage` ve `BreadcrumbList` JSON-LD taşır. Template sayfası için `WebApplication`/`SoftwareApplication` kullanılmadı.
- **Sitemap kalıcılığı:** `scripts/build-blog.js` içindeki `STATIC_SITEMAP_PAGES` listesine `/workout-log-template` eklendi. Sonraki blog build'leri bu URL'yi sitemap'ten düşürmez.
- **Service worker:** `sw.js` `logwise-v28` → `logwise-v29` bump edildi. `PRECACHE_URLS` listesine `/one-rep-max-calculator`, `/one-rep-max-calculator.html`, `/workout-log-template`, `/workout-log-template.html` eklendi. Sebep: yeni tool/template stilleri `styles/landing.css` içinde ve bu dosya cache-first servis ediliyor; bump eski kullanıcılara güncel CSS'i kesin taşır.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `workout-log-template.html` | EN statik printable workout log template + SEO meta + JSON-LD + vanilla JS |
| `styles/landing.css` | Template sheet, toolbar, print media stilleri |
| `scripts/build-blog.js` | `STATIC_SITEMAP_PAGES` listesine `/workout-log-template` eklendi |
| `sitemap.xml` | `/workout-log-template` URL'si |
| `index.html`, `tr.html` | Footer iç linklerine workout log template eklendi |
| `sw.js` | `logwise-v29` bump + tool/template URL precache |
| `AGENTS.md` | Dosya haritası + refactor özeti güncellendi |

### Doğrulama Notları

- `node --check scripts/build-blog.js`, `node --check sw.js` ve inline template script syntax kontrolü yapılmalı.
- `node scripts/build-blog.js` çalıştırıldığında sitemap, blog çıktıları ve landing blog kartları birlikte güncellenir.
- Lokal smoke testte `/workout-log-template` clean URL, add row / clear / print button varlığı, sitemap ve mobil taşma doğrulanmalı.



---

## Bölüm 50 — Landing Tool Discovery Entegrasyonu (2026-06-12)

### Amaç

Yeni eklenen evergreen SEO tool sayfalarının yalnızca sitemap ve footer linkleriyle kalmaması; ana landing ziyaretçilerinin 1RM calculator ve workout log template sayfalarını kolayca keşfetmesi.

### Değişiklikler

- `index.html` ve `tr.html` üst nav'a `Tools` / `Araçlar` linki eklendi.
- Hero secondary CTA, features yerine yeni `#tools` bölümüne yönlendirildi (`FREE TOOLS` / `ÜCRETSİZ ARAÇLAR`).
- App bölümünden sonra, Blog bölümünden önce iki kartlı `#tools` landing bölümü eklendi:
  - `/one-rep-max-calculator`
  - `/workout-log-template`
- `styles/landing.css` içine `tools-section`, `tools-grid`, `tool-link-card` ve responsive stilleri eklendi.
- `sw.js` `logwise-v29` → `logwise-v30` bump edildi. Sebep: yeni landing tool discovery stilleri `styles/landing.css` içinde ve CSS cache-first servis ediliyor.

### Notlar

- Yeni URL eklenmedi; sitemap değişmedi.
- `_redirects` değişmedi; tool sayfaları hâlihazırda Cloudflare Pages `.html` clean URL davranışıyla sunuluyor.



---

## Bölüm 51 — Blog İki Dilli Varyant Mimarisi (2026-06-13)

### Amaç

Blog index'inde Türkçe ve İngilizce yazıların ayrı konular gibi çoğalmasını engellemek; her blog konusunu tek içerik grubu olarak sunup yazı içinde English/Türkçe geçişi vermek. Bu yapı hem kullanıcı keşfini sadeleştirir hem de Google'a canonical + hreflang sinyallerini daha net taşır.

### Mimari Kararlar

- **`translationKey` zorunlu:** `blog-content/*.md` frontmatter'ına `translationKey` eklendi. Aynı konunun `lang: en` ve `lang: tr` varyantları aynı key'i taşır.
- **Eksik varyant hata:** `scripts/build-blog.js`, her `translationKey` için hem EN hem TR varyantı ister. Tek başına TR veya EN blog yazısı build'i geçmez.
- **Post içi dil geçişi:** Üretilen her `blog/<slug>.html` sayfasında English/Türkçe dil switch'i bulunur.
- **SEO alternates:** Post sayfaları canonical URL yanında `hreflang="en"`, `hreflang="tr"` ve `hreflang="x-default"` üretir. Sitemap post kayıtları da `xhtml:link` alternate kayıtlarıyla yazılır.
- **Blog index tekil konu kartı:** `/blog` artık her dil varyantını ayrı kart olarak listelemez; konu başına tek kart gösterir ve kart içinde EN/TR okuma linkleri verir.
- **Landing kartları aktif dile göre:** `index.html` EN varyantları, `tr.html` TR varyantları gösterir; aynı konu iki kez landing'e düşmez.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `scripts/build-blog.js` | `translationKey` gruplama, hreflang, sitemap alternate, tekil blog index kartları |
| `blog-content/*.md` | Mevcut yazılara `translationKey` eklendi; eksik EN/TR varyantları tamamlandı |
| `blog/blog.css` | Blog kartı dil seçenekleri + post içi dil switch stilleri |
| `docs/BLOG-YAZISI-EKLEME.md` | Yeni iki dilli blog yazısı reçetesi |
| `AGENTS.md` | Blog sistemi özeti ve yeni yazı kuralı güncellendi |
| `sw.js` | `logwise-v32` → `logwise-v33` bump; sebep `blog/blog.css` runtime cache değişimi |

### Doğrulama Notları

- `node --check scripts/build-blog.js` ve `node --check sw.js` çalıştırılmalı.
- `node scripts/build-blog.js` çıktısı her konuda EN/TR varyantı göstermeli.
- Lokal smoke testte `/blog`, bir EN post ve karşılık gelen TR post açılıp dil switch'i ve hreflang meta'ları doğrulanmalı.



---

## Bölüm 52 — Blog Aktif Dil Switch UX (2026-06-13)

### Amaç

Bölüm 51'de eklenen iki dilli blog varyantlarını kullanıcı arayüzünde yan yana göstermeyi bırakmak. Blog index ve yazı sayfaları landing'deki dil switch mantığına benzer tek bir TR/EN switch kullanır; seçili dil neyse başlık, açıklama, okuma süresi, kart hedefi ve yazı sayfası o dile göre çalışır.

### Mimari Kararlar

- **URL yapısı korundu:** Her dil varyantı kendi `/blog/<slug>` URL'sinde kalır. Canonical ve hreflang sinyalleri Bölüm 51'deki gibi korunur.
- **Blog index tek aktif dil gösterir:** `/blog` sayfası konu başına tek kart gösterir; kart içeriği `localStorage` içindeki `logwise-blog-lang` değerine göre EN veya TR olarak doldurulur.
- **Kart hedefleri aktif dile göre değişir:** `/blog` üzerinde TR seçiliyken kartlar TR slug'larına, EN seçiliyken EN slug'larına gider.
- **Post switch nav içine taşındı:** Yazı içindeki ayrı "Read this article / Bu yazıyı oku" bloğu kaldırıldı. TR/EN switch üst nav içinde görünür.
- **Seçim senkron:** Yazı sayfasında dil değiştirildiğinde eş slug'a gidilir ve seçim `localStorage` ile `/blog` sayfasında da korunur. Direkt bir TR/EN yazı URL'si açılırsa mevcut sayfa dili yeni tercih olarak kaydedilir.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `scripts/build-blog.js` | Blog index kartları aktif dile göre dolduran inline runtime + nav dil switch'i |
| `blog/blog.css` | Landing benzeri segmented switch stili; eski çift dilli kart/action stilleri kaldırıldı |
| `blog/*.html`, `blog/posts.json`, `sitemap.xml` | Generator çıktıları yeniden üretildi |
| `docs/BLOG-YAZISI-EKLEME.md` | Yeni switch UX kontrol adımları |
| `AGENTS.md` | Blog sistemi özeti aktif dil switch davranışıyla güncellendi |
| `sw.js` | `logwise-v33` → `logwise-v34` bump; sebep `blog/blog.css` runtime cache değişimi |

### Doğrulama Notları

- `node --check scripts/build-blog.js` ve `node --check sw.js` çalıştırılmalı.
- `node scripts/build-blog.js` sonrası `/blog` default EN açılmalı; switch TR yapıldığında kartlar TR başlık/açıklama/okuma süresi ve TR URL taşımalı.
- Bir post sayfasında switch ile diğer dile geçiş, sonra `/blog` dönüşünde aynı dilin korunması smoke test edilmeli.



---

## Bölüm 53 — SEO Evergreen Tool: Workout Volume Calculator (2026-06-15)

### Amaç

"workout volume calculator" ve training volume aramalarına yönelik, Google'ın JS çalıştırmadan okuyabileceği statik bir hesaplayıcı sayfası eklemek. Sayfa egzersiz, set, tekrar ve ağırlık satırlarından toplam hacim ve egzersiz bazlı özet üretir; uzun vadeli takip için LogWise `/app` CTA'sına bağlanır.

### Mimari Kararlar

- **Statik tool page:** `workout-volume-calculator.html` kökte yaşar. Mevcut tool sayfaları gibi Cloudflare Pages `.html` clean URL davranışıyla `/workout-volume-calculator` olarak sunulur; `_redirects` içine explicit kural eklenmedi.
- **React/Babel yok:** Sayfa düz HTML + vanilla JS kullanır. Script yalnızca satır ekleme, temizleme, kg/lb etiketi ve hacim özetlerini güncelleme işini yapar.
- **Ortak landing stili:** Yeni tool sayfası `styles/landing.css` kullanır. Volume table, summary ve related tools stilleri mevcut `tool-*` ailesine eklendi; büyük inline CSS eklenmedi.
- **Tool discovery:** Ana EN/TR landing araç bölümüne üçüncü kart eklendi. 1RM ve workout log template sayfalarına da "See other tools" bölümü eklenerek yeni sayfaya iç link verildi.
- **Blog iç linkleme:** Workout tracker guide ve progressive overload yazılarının EN/TR varyantlarına `/workout-volume-calculator` bağlantısı eklendi.
- **Sitemap kalıcılığı:** `scripts/build-blog.js` içindeki `STATIC_SITEMAP_PAGES` listesine `/workout-volume-calculator` eklendi. Blog build'leri bu URL'yi sitemap'te tutar.
- **Service worker:** `sw.js` `logwise-v35` → `logwise-v36` bump edildi. `PRECACHE_URLS` listesine `/workout-volume-calculator` ve `/workout-volume-calculator.html` eklendi.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `workout-volume-calculator.html` | EN statik volume calculator + SEO meta + JSON-LD + vanilla JS |
| `styles/landing.css` | Landing üçüncü tool kartı, volume calculator tablosu/özetleri, related tools kartları |
| `index.html`, `tr.html` | Landing tools bölümüne workout volume calculator kartı + footer linki |
| `one-rep-max-calculator.html`, `workout-log-template.html` | Yeni related tools bölümü + volume calculator iç linkleri |
| `blog-content/*.md` | İlgili EN/TR blog yazılarına volume calculator iç linkleri |
| `scripts/build-blog.js` | Statik sitemap listesine `/workout-volume-calculator` eklendi |
| `sitemap.xml`, `blog/*.html`, `blog/posts.json` | Generator çıktıları yeniden üretildi |
| `sw.js` | `logwise-v36` bump + yeni tool URL precache |
| `AGENTS.md` | Dosya haritası ve evergreen SEO tool özeti güncellendi |

### Doğrulama Notları

- `node --check scripts/build-blog.js`, `node --check sw.js` ve inline volume calculator script syntax kontrolü yapılmalı.
- `node scripts/build-blog.js` sonrası sitemap, blog çıktıları ve landing blog kartları birlikte güncellenir.
- Lokal smoke testte `/workout-volume-calculator`, add row / clear, kg/lb toggle, toplam hacim, egzersiz bazlı özet ve CTA linkleri doğrulanmalı.



---

## Bölüm 54 — SEO Tools Hub Sayfası (2026-06-15)

### Amaç

Mevcut evergreen tool sayfalarını tek bir statik keşif sayfasında toplamak: `/tools`. Bu hub, ana landing ve tool sayfalarından merkezi bir "See other tools" hedefi olarak çalışır ve Google'ın JS çalıştırmadan okuyabileceği statik link yapısı sağlar.

### Mimari Kararlar

- **Statik hub page:** `tools.html` kökte yaşar. Cloudflare Pages `.html` clean URL davranışıyla `/tools` olarak sunulur; `_redirects` içine explicit kural eklenmedi.
- **React/Babel yok:** Sayfa düz HTML ve mevcut `styles/landing.css` sınıflarıyla çalışır. Sayfaya özel JS yoktur.
- **Ortak tasarım dili:** Hub, landing'deki `tool-link-card` kart dilini ve tool sayfalarındaki `tool-hero` / `cta` bloklarını yeniden kullanır. Küçük hub layout stilleri `styles/landing.css` içinde tutulur.
- **Structured data:** Sayfa `WebPage`, `ItemList` ve `BreadcrumbList` JSON-LD taşır. ItemList üç tool URL'sini sıralı olarak listeler.
- **İç linkleme:** `index.html` ve `tr.html` tools bölümünden `/tools` sayfasına link verildi. Tool sayfalarındaki hero "See other tools" CTA'ları `/tools` hedefli hale getirildi.
- **Sitemap kalıcılığı:** `scripts/build-blog.js` içindeki `STATIC_SITEMAP_PAGES` listesine `/tools` eklendi.
- **Service worker:** `sw.js` `logwise-v37` → `logwise-v38` bump edildi. `PRECACHE_URLS` listesine `/tools` ve `/tools.html` eklendi.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `tools.html` | EN statik tools hub + SEO meta + JSON-LD |
| `styles/landing.css` | Hub hero/grid ve landing "all tools" link stilleri |
| `index.html`, `tr.html` | Tools bölümüne `/tools` bağlantısı |
| `one-rep-max-calculator.html`, `workout-log-template.html`, `workout-volume-calculator.html` | Hero "See other tools" CTA'ları `/tools` hedefli |
| `scripts/build-blog.js` | Statik sitemap listesine `/tools` eklendi |
| `sitemap.xml`, `blog/index.html`, `blog/posts.json`, `blog/*.html` | Generator çıktıları yeniden üretildi |
| `sw.js` | `logwise-v38` bump + tools hub URL precache |
| `AGENTS.md` | Dosya haritası ve evergreen SEO tool özeti güncellendi |

### Doğrulama Notları

- `node --check scripts/build-blog.js` ve `node --check sw.js` çalıştırılmalı.
- `node scripts/build-blog.js` sonrası sitemap, blog çıktıları ve landing blog kartları birlikte güncellenir.
- Lokal smoke testte `/tools`, üç tool sayfası, `/` ve `/tr` clean URL'leri doğrulanmalı.



---

## Bölüm 55 — Programmatic SEO MVP: Exercise ve Program Sayfaları (2026-06-15)

### Amaç

Programmatic SEO için küçük ve güvenli ilk dilimi eklemek: Google'ın JS çalıştırmadan okuyabileceği statik exercise ve program sayfaları üretmek. MVP kapsamı üç ana hareket (`bench-press`, `squat`, `deadlift`) ve bir hazır program (`push-pull-legs`) ile sınırlandı.

### Mimari Kararlar

- **Generator tabanlı çıktı:** Yeni `scripts/build-programmatic-seo.js`, `data/presets-exercises.js`, `data/ex-descriptions.js`, `data/ex-preview.js` ve `data/presets-programs.js` kaynaklarını Node `vm` içinde okuyup statik HTML üretir.
- **Tek build komutu:** `scripts/build-blog.js`, programmatic SEO generator'ını çağırır. Böylece blog çıktıları, landing blog kartları, sitemap ve programmatic sayfalar yine tek komutla güncellenir.
- **Clean URL yapısı:** Çıktılar `exercises/*.html` ve `programs/*.html` altında yaşar. Cloudflare Pages `.html` clean URL davranışıyla `/exercises/bench-press` ve `/programs/push-pull-legs` olarak sunulur; `_redirects` kuralı eklenmedi.
- **EN-only MVP:** Sayfalar yalnızca İngilizce üretildi. `hreflang="en"` ve `x-default` var; sahte TR alternate eklenmedi.
- **Ortak landing stili:** Sayfalar `styles/landing.css` kullanır. Yeni guide, facts, related-card ve program-layout stilleri burada tutuldu; inline CSS eklenmedi.
- **Structured data:** Exercise sayfaları `WebPage`, `BreadcrumbList` ve görünür adımlarla uyumlu `HowTo` JSON-LD üretir. Program sayfası `WebPage`, `BreadcrumbList` ve exercise listesi için `ItemList` taşır.
- **İç linkleme:** `/tools` sayfasına Training Guides bölümü eklendi. Progressive overload ve workout tracker blog kaynaklarına yeni exercise/program linkleri eklendi; generated blog HTML build ile güncellenir.
- **Sitemap kalıcılığı:** Programmatic sayfalar `build-programmatic-seo.js` tarafından sitemap page listesi olarak export edilir ve `build-blog.js` sitemap'e ekler.
- **Service worker:** `sw.js` `logwise-v39` → `logwise-v40` bump edildi. Yeni generated static SEO URL'leri ve `.html` karşılıkları `PRECACHE_URLS` listesine eklendi.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `scripts/build-programmatic-seo.js` | Exercise/program static HTML generator + sitemap page export |
| `scripts/build-blog.js` | Programmatic generator çağrısı + sitemap entegrasyonu |
| `exercises/*.html` | Bench press, squat, deadlift EN statik guide çıktıları |
| `programs/push-pull-legs.html` | Push Pull Legs EN statik program guide çıktısı |
| `styles/landing.css` | Programmatic guide, quick facts, related cards ve PPL layout stilleri |
| `tools.html` | Training Guides discovery bölümü |
| `blog-content/*.md` | Progressive overload ve workout tracker EN/TR kaynaklarına doğal iç linkler |
| `blog/*.html`, `blog/posts.json`, `sitemap.xml` | Generator çıktıları |
| `sw.js` | `logwise-v40` bump + yeni SEO URL precache |
| `AGENTS.md` | Yeni generated klasörler, generator ve refactor özeti güncellendi |

### Doğrulama Notları

- `node --check scripts/build-programmatic-seo.js`, `node --check scripts/build-blog.js` ve `node --check sw.js` çalıştırılmalı.
- `node scripts/build-blog.js` sonrası exercise/program sayfaları, sitemap ve blog çıktıları birlikte güncellenmeli.
- Sitemap XML parse, `blog/posts.json` JSON parse ve local HTTP smoke test yapılmalı.
- Lokal smoke testte `/exercises/bench-press`, `/exercises/squat`, `/exercises/deadlift`, `/programs/push-pull-legs`, `/tools`, tool sayfaları ve `/blog` clean URL'leri doğrulanmalı.



---

## Bölüm 56 — Guides Bilgi Mimarisi (2026-06-15)

### Amaç

Programmatic SEO sayfalarını kök `/exercises/*` ve `/programs/*` yapısından çıkarıp tek bir statik rehber merkezi altında toplamak: `/guides`. Böylece ana rehber hub'ı, exercise rehberleri ve program rehberleri aynı bilgi mimarisi içinde yaşar.

### Mimari Kararlar

- **Guides hub:** Yeni `guides.html`, Cloudflare Pages clean URL davranışıyla `/guides` olarak sunulur. Exercise ve program rehberlerine merkezi keşif sayfası sağlar.
- **Nested guide URL'leri:** Programmatic SEO çıktıları artık `guides/exercises/*.html` ve `guides/programs/*.html` altında üretilir. Canonical URL'ler `/guides/exercises/bench-press` ve `/guides/programs/push-pull-legs` formatındadır.
- **Eski URL 301'leri:** İlk MVP'de açılan `/exercises/bench-press`, `/exercises/squat`, `/exercises/deadlift` ve `/programs/push-pull-legs` exact URL'leri `_redirects` içinde yeni `/guides/...` adreslerine 301 yönlenir. Çıplak `/exercises` ve `/programs` eski app route uyumluluğu korunur.
- **Generator güncellemesi:** `scripts/build-programmatic-seo.js`, artık `guides.html` hub'ını ve nested guide çıktılarını üretir; `scripts/build-blog.js` aynı tek build akışında sitemap ve blog çıktılarını güncellemeye devam eder.
- **İç linkleme:** Landing, tools hub ve blog kaynaklarındaki rehber linkleri yeni `/guides/...` canonical yapısına taşındı.
- **Service worker:** `sw.js` `logwise-v40` → `logwise-v41` bump edildi. `/guides`, `guides.html` ve nested guide URL'leri precache listesine eklendi; eski programmatic URL'ler precache'den çıkarıldı.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `scripts/build-programmatic-seo.js` | `/guides` hub + nested exercise/program generator çıktıları |
| `guides.html` | EN statik guides hub çıktısı |
| `guides/exercises/*.html` | Bench press, squat, deadlift yeni canonical guide çıktıları |
| `guides/programs/push-pull-legs.html` | PPL program yeni canonical guide çıktısı |
| `_redirects` | Eski programmatic URL'ler için exact 301 yönlendirmeler |
| `index.html`, `tr.html`, `tools.html` | Rehber linkleri `/guides/...` yapısına taşındı; `/guides` hub bağlantıları eklendi |
| `blog-content/*.md` | Blog içi rehber linkleri yeni canonical URL'lere taşındı |
| `scripts/build-blog.js`, `sitemap.xml`, `blog/*.html`, `blog/posts.json` | Build sonrası yeni sitemap ve blog çıktıları |
| `sw.js` | `logwise-v41` bump + yeni guides URL precache |
| `AGENTS.md`, `docs/PROGRAMMATIC-SEO-PROMPT.md` | Yeni guides mimarisi dokümante edildi |

### Doğrulama Notları

- `node --check scripts/build-programmatic-seo.js`, `node --check scripts/build-blog.js` ve `node --check sw.js` çalıştırılmalı.
- `node scripts/build-blog.js` sonrası `/guides`, nested guide sayfaları, sitemap ve blog çıktıları birlikte güncellenmeli.
- Lokal smoke testte `/guides`, `/guides/exercises/bench-press`, `/guides/exercises/squat`, `/guides/exercises/deadlift`, `/guides/programs/push-pull-legs`, `/tools`, `/` ve `/tr` clean URL'leri doğrulanmalı.



---

## Bölüm 57 — Guide Dizin Sayfaları (2026-06-16)

### Amaç

`/guides` hub altında ayrı exercise ve program dizinleri oluşturmak. Kullanıcı `/guides/exercises` sayfasına gittiğinde LogWise içindeki preset egzersizleri kategori bazlı görebilmeli; `/guides/programs` sayfasında da preset program şablonlarını karşılaştırabilmeli.

### Mimari Kararlar

- **Canonical dizin URL'leri:** Yeni dizinler `/guides/exercises` ve `/guides/programs` canonical yapısında yaşar. Dosya çıktıları `guides/exercises.html` ve `guides/programs.html` olarak generator tarafından üretilir.
- **Root alias yönlendirmeleri:** Çıplak `/exercises` ve `/programs` URL'leri artık eski app route rewrite'ı yerine yeni canonical guide dizinlerine 301 yönlenir. Uygulama içindeki yeni route'lar `/app/exercises` ve `/app/programs` olarak korunur.
- **Veri kaynaklı dizin:** Exercise dizini `data/presets-exercises.js`, `data/ex-descriptions.js` ve `data/ex-preview.js` kaynaklarından 145 preset hareketi kategori bazlı listeler. Full guide'ı olan core lift kartları nested guide sayfalarına bağlanır.
- **Program dizini:** Program dizini `data/presets-programs.js` kaynaklarından 4 preset programı listeler. Full guide'ı olan PPL kartı `/guides/programs/push-pull-legs` sayfasına bağlanır.
- **Generator akışı:** `scripts/build-programmatic-seo.js`, artık guides hub + iki dizin sayfası + nested exercise/program guide sayfalarını üretir. `scripts/build-blog.js` aynı tek komutla sitemap ve generated HTML çıktısını günceller.
- **Service worker:** `sw.js` `logwise-v41` → `logwise-v42` bump edildi. Yeni `/guides/exercises`, `/guides/exercises.html`, `/guides/programs`, `/guides/programs.html` URL'leri precache listesine eklendi.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `scripts/build-programmatic-seo.js` | Exercise/program dizin sayfa şablonları + sitemap kayıtları + generator çıktısı |
| `guides/exercises.html` | EN statik exercise library dizin çıktısı |
| `guides/programs.html` | EN statik program library dizin çıktısı |
| `_redirects` | `/exercises` ve `/programs` root alias'ları yeni guide dizinlerine 301 |
| `styles/landing.css` | Dizin chip, kompakt kart grid'i ve program card stat stilleri |
| `scripts/build-blog.js`, `sitemap.xml` | Programmatic SEO özet çıktısı ve sitemap güncellendi |
| `sw.js` | `logwise-v42` bump + yeni dizin URL precache |
| `AGENTS.md` | Dosya haritası ve programmatic SEO özeti güncellendi |

### Doğrulama Notları

- `node --check scripts/build-programmatic-seo.js`, `node --check scripts/build-blog.js` ve `node --check sw.js` çalıştırılmalı.
- `node scripts/build-blog.js` sonrası `/guides/exercises`, `/guides/programs`, nested guide sayfaları ve sitemap birlikte güncellenmeli.
- Lokal smoke testte `/guides/exercises`, `/guides/programs`, `/exercises` → `/guides/exercises` 301 ve `/programs` → `/guides/programs` 301 doğrulanmalı.

---

## Bolum 58 - Library / Learn Public URL Adlandirmasi (2026-06-16)

### Amac

Kullaniciya acik bilgi mimarisinde `guides` adini `library`, `blog` adini `learn` olarak netlestirmek. Library; egzersiz ve program sayfalarinin merkezi, Learn ise iki dilli egitim yazilarinin merkezi olarak konumlanir.

### Mimari Kararlar

- **Yeni canonical URL'ler:** `/guides` ve alt sayfalari artik `/library`; `/blog` ve yazilar artik `/learn` canonical yapisindadir.
- **Eski URL 301'leri:** `_redirects`, eski `/blog/*`, `/guides/*`, `/exercises/*` ve `/programs/*` adreslerini yeni `/learn/*` ve `/library/*` adreslerine 301 tasir.
- **Generator ciktilari:** `scripts/build-blog.js`, `learn/*.html`, `learn/index.html` ve `learn/posts.json` uretir. `scripts/build-programmatic-seo.js`, `library.html`, `library/exercises.html`, `library/programs.html` ve nested Library sayfalarini uretir.
- **Ust navigasyon:** Home, Tools, Library ve Learn sayfalari yeni bilgi mimarisine gore sade nav linkleri kullanir.
- **Service worker:** `sw.js` `logwise-v42` -> `logwise-v43` bump edildi. Eski guides precache kayitlari kaldirildi; yeni Library ve Learn URL'leri eklendi.

### Dosya / Config Degisiklikleri

| Dosya | Degisiklik |
|---|---|
| `scripts/build-blog.js` | Learn cikti klasoru, `/learn` canonical URL'leri, nav ve sitemap kayitlari |
| `scripts/build-programmatic-seo.js` | Library hub/dizin/nested URL ve cikti yapisi |
| `learn/learn.css` | Eski `blog/blog.css` stili Learn klasorune tasindi |
| `index.html`, `tr.html`, `tools.html`, tool sayfalari | Ust nav ve ic linkler Library/Learn yapisina tasindi |
| `blog-content/*.md` | Eski `/guides/...` ic linkleri `/library/...` canonical URL'lerine tasindi |
| `_redirects` | `/blog` -> `/learn`, `/guides` -> `/library`, root exercise/program alias 301'leri |
| `sw.js` | `logwise-v43` bump + Library/Learn precache |
| `AGENTS.md`, `docs/*` | Public adlandirma ve generator ciktilari dokumante edildi |

### Dogrulama Notlari

- `node --check scripts/build-programmatic-seo.js`, `node --check scripts/build-blog.js` ve `node --check sw.js` calistirilmali.
- `node scripts/build-blog.js` sonrasinda `/learn`, `/library`, nested Library sayfalari, sitemap ve landing Learn kartlari birlikte guncellenmeli.
- Lokal smoke testte `/learn`, `/library`, `/library/exercises`, `/library/programs`, nested sayfalar ve eski `/blog`/`/guides` 301'leri dogrulanmali.



---

## Bolum 59 - TR Learn URL Yerellestirmesi ve Kütüphane Alias'i (2026-06-16)

### Amac

TR kullanici akisini sadece ceviri metniyle degil, URL yapisiyla da yerellestirmek. Home landing icindeki `APP` nav linki de urun uygulamasina gitmek yerine landing'deki app tanitim bolumune kaymali.

### Mimari Kararlar

- **Home APP linki:** EN/TR landing ust nav'inda `APP` artik `/app` yerine `#app` anchor'ina gider. Uygulamayi acan CTA butonlari `/app` olarak kalir.
- **TR Learn canonical:** TR Learn index ve TR yazilar artik `/ogren` ve `/ogren/<tr-slug>` canonical URL'lerinde uretilir. EN Learn `/learn` ve `/learn/<en-slug>` olarak kalir.
- **Hreflang ayrimi:** Learn yazilarinda EN alternate `/learn/...`, TR alternate `/ogren/...`, x-default EN URL olacak sekilde generator guncellendi.
- **Kütüphane alias'i:** Library sayfalari henuz EN icerik oldugu icin canonical `/library` kalir; TR landing ve TR Learn nav'i `/kutuphane` alias'ini kullanir. `_redirects` bu alias'i 200 rewrite ile `/library` sayfalarina baglar.
- **Eski TR URL 301'leri:** Onceki `/learn/<tr-slug>` ve `/blog/<tr-slug>` URL'leri yeni `/ogren/<tr-slug>` adreslerine 301 tasindi.
- **Service worker:** `sw.js` `logwise-v43` -> `logwise-v44` bump edildi. `/ogren` ve `/kutuphane` URL'leri precache listesine eklendi.

### Dosya / Config Degisiklikleri

| Dosya | Degisiklik |
|---|---|
| `scripts/build-blog.js` | EN Learn ve TR Ogren output ayrimi, hreflang, manifest, landing kart URL'leri |
| `ogren/*.html` | TR Learn index ve yazi sayfalari |
| `learn/*.html`, `learn/posts.json`, `sitemap.xml` | EN/TR canonical ayrimina gore yeniden uretildi |
| `index.html`, `tr.html` | `APP` anchor fix'i; TR nav ve landing linkleri `Kütüphane`/`Öğren` akisi |
| `_redirects` | Eski TR Learn URL 301'leri + `/kutuphane` 200 alias'lari |
| `sw.js` | `logwise-v44` bump + `/ogren` ve `/kutuphane` precache |
| `AGENTS.md`, `docs/BLOG-YAZISI-EKLEME.md` | Yeni TR URL yapisi dokumante edildi |

### Dogrulama Notlari

- `node --check scripts/build-blog.js` ve `node --check sw.js` calistirilmali.
- `node scripts/build-blog.js` sonrasinda `/learn` EN, `/ogren` TR, post hreflang'leri ve landing kartlari dogrulanmali.
- Lokal smoke testte `/learn/<en-slug>` <-> `/ogren/<tr-slug>` switch hedefleri, eski `/learn/<tr-slug>` 301'leri ve `/kutuphane` 200 alias'i dogrulanmali.

---

## Bolum 60 - Mobil Public Side Panel Navigasyonu (2026-06-18)

### Amac

Mobil header alanini kalabaliklastirmadan Home, Tools, Library ve Learn sayfalari arasinda tutarli bir yonlendirme sunmak.

### Mimari Kararlar

- **Ortak public modul:** `/site-nav.js`, landing, tool, Library ve Learn sayfalarindaki mevcut header'a mobil menu butonu ve soldan acilan drawer ekler.
- **Tek stil kaynagi:** `/styles/site-nav.css`, hem `landing.css` hem de `learn.css` kullanan sayfalarda ayni mobil panel gorunumunu saglar.
- **Iki dilli rota seti:** EN menu `/`, `/tools`, `/library`, `/learn`; TR menu `/tr`, `/tools`, `/kutuphane`, `/ogren` hedeflerini kullanir.
- **Aktif rota:** Tool alt sayfalari Tools, Library alt sayfalari Library, Learn/Ogren yazilari ilgili bilgi merkezi altinda vurgulanir.
- **Erisilebilirlik:** Drawer `aria-expanded`, `aria-hidden`, focus trap, `Escape` ile kapatma, odak geri yukleme ve acikken arka icerigi `inert` yapma davranislarini uygular.
- **Generator kaliciligi:** Learn ve Library generator head bloklari ortak CSS/JS dosyalarini yukler; yeniden uretim side panel entegrasyonunu korur.
- **Service worker:** `sw.js` `logwise-v44` -> `logwise-v45` bump edildi; yeni CSS ve JS precache listesine eklendi.

### Dosya / Config Degisiklikleri

| Dosya | Degisiklik |
|---|---|
| `site-nav.js` | Iki dilli drawer, aktif rota ve erisilebilir klavye/focus davranisi |
| `styles/site-nav.css` | Mobil toggle, scrim, soldan acilan panel ve aktif link stilleri |
| `scripts/build-blog.js`, `scripts/build-programmatic-seo.js` | Generated sayfalara ortak nav asset yuklemesi |
| Public/generated `*.html` sayfalari | Ortak nav CSS/JS referanslari |
| `sw.js` | `logwise-v45` bump + yeni asset precache |
| `AGENTS.md` | Dosya haritasi ve refactor ozeti |

### Dogrulama Notlari

- `node --check site-nav.js`, iki generator ve `sw.js` basariyla gecmeli.
- `node scripts/build-blog.js` sonrasinda header kullanan tum public sayfalar `/site-nav.js` yuklemeli.
- Mobil smoke testte EN/TR etiketleri, aktif rota, scrim/close/`Escape` kapanisi ve scroll kilidi dogrulanmali.

---

## Bölüm 61 — Ortak Exercise Guide Veri ve Medya Altyapısı (2026-06-18)

### Amaç

Library exercise guide sayfaları ile React Native / Expo istemcisinin aynı içerik ve medya sözleşmesini kullanabilmesi için platform-nötr, doğrulanabilir bir kanonik veri kaynağı oluşturmak. Bu bölüm yalnız ortak veri temelini kurar; mobil koda ve mevcut canlı Library exercise sayfalarının generator davranışına dokunmaz.

### Mimari Kararlar

- **Kanonik JSON:** `data/ex-guides.json` elle düzenlenen tek ortak kaynaktır. İlk pilot kayıtlar Bench Press, Squat ve Deadlift için preview metni ile kas kimliklerini taşır.
- **Üretilmiş web wrapper:** `data/ex-guides.js`, `scripts/build-ex-guides.js` tarafından JSON'dan üretilir ve `window.LOGWISE_EX_GUIDES` globalini sağlar. Wrapper elle düzenlenmez.
- **Readiness ayrımı:** `previewReady`, `mediaReady` ve `publish` birbirinden ayrıdır. `publish`, preview ve R2 medya hazır olmadan etkinleştirilemez.
- **Atomik cutover:** Mevcut üç canlı Library guide sayfası medya yüklenene kadar legacy `EXERCISE_GUIDES` generator verisinden üretilmeye devam eder. JSON'a geçiş içerik + medya + generator birlikte hazır olduğunda yapılır.
- **Legacy fallback:** `data/ex-preview.js` ve `data/ex-images.js` migration boyunca korunur. Yeni medya yalnız `mediaReady: true` olduğunda öncelik kazanacaktır.
- **R2 sözleşmesi:** Production medya alanı `https://media.logwise.fit/exercises/{slug}/` olarak kilitlendi. MP4 H.264/Main/yuv420p/faststart/sessiz; URL'ler versiyonlu ve immutable cache uyumludur.
- **Tek build akışı:** `scripts/build-blog.js`, programmatic sayfalardan önce guide doğrulamasını ve wrapper üretimini çalıştırır.
- **Service worker:** `sw.js` `logwise-v45` → `logwise-v46` bump edildi. `ex-guides.json`, üretilmiş wrapper ve mevcut legacy `ex-images.js` precache listesine eklendi; remote R2 medyası precache edilmedi.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Kanonik ortak guide verisi + üç preview-ready pilot hareket |
| `data/ex-guides.js` | Üretilmiş `window.LOGWISE_EX_GUIDES` wrapper'ı |
| `scripts/build-ex-guides.js` | Preset slug, i18n, readiness, URL ve medya dosya adı doğrulaması |
| `docs/ex-guides.schema.json` | Makine-okunur JSON Schema |
| `docs/EXERCISE-GUIDE-SCHEMA.md` | İçerik, MP4 encode, R2 ve migration sözleşmesi |
| `scripts/build-blog.js` | Guide wrapper üretimini mevcut tek build akışına bağlama |
| `app.html` | Üretilmiş `LOGWISE_EX_GUIDES` wrapper'ını web runtime'a yükleme |
| `sw.js` | `logwise-v46` bump + yeni ortak data dosyaları precache |
| `AGENTS.md` | Dosya haritası, görev yönlendirmesi ve refactor özeti |

### Doğrulama Notları

- `node --check scripts/build-ex-guides.js`, `node --check scripts/build-blog.js` ve `node --check sw.js` çalıştırılmalı.
- `node scripts/build-ex-guides.js --check` readiness, i18n, slug ve URL sözleşmesini doğrulamalı.
- `node scripts/build-blog.js` wrapper ile mevcut Learn/Library/sitemap çıktılarını birlikte üretmeli.
- Build sonrasında mevcut `/library/exercises/bench-press`, `/squat` ve `/deadlift` HTML çıktıları medya gelmeden değişmemelidir.

---

## Bölüm 62 — R2 Exercise Media Teslim ve Doğrulama Hattı (2026-06-18)

### Amaç

Exercise guide MP4, WebM, poster ve muscle-map dosyalarının kullanıcı görsellerinden ayrı bir R2 bucket üzerinde güvenilir biçimde yayınlanması; yerel encode çıktısı ile production HTTP davranışının otomatik doğrulanması.

### Mimari Kararlar

- **Ayrı bucket:** Mevcut `logwise-images` bucket'ı avatar/workout fotoğrafları için kalır. Immutable exercise medyası `logwise-exercise-media` bucket'ında tutulur.
- **Production domain:** Public medya yalnız `https://media.logwise.fit/exercises/{slug}/` üzerinden referanslanır; `r2.dev` ve `workers.dev` URL'leri guide JSON'a girmez.
- **CORS config:** Kök `r2-exercise-media-cors.json`, `https://logwise.fit` için GET/HEAD/Range erişimini ve gerekli response header'larını tanımlar.
- **Yerel doğrulama:** `scripts/validate-exercise-media.js --local`, ffprobe ile H.264 Main 3.1, yuv420p, ses kanalı yokluğu, 720p zarfı, süre/bitrate ve faststart kontrolü yapar.
- **Uzak doğrulama:** Aynı script `--remote`, R2 varlıklarında MIME, immutable cache, CORS ve MP4 `206 Partial Content`/`Content-Range` davranışını kontrol eder.
- **Versiyonlu upload:** Object key üzerine yazılmaz; `demo-v1.mp4` → `demo-v2.mp4` şeklinde yeni key oluşturulur.
- **Cloudflare erişimi:** Bu seans sırasında Wrangler kuruluydu fakat oturum kapalıydı. Bucket/domain üzerinde dış değişiklik yapılmadı; runbook oturum açıldıktan sonra uygulanmak üzere hazırlandı.
- **Service worker:** Remote medya precache edilmez ve bu faz yeni runtime statik asset eklemediği için cache bump yapılmadı.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `scripts/validate-exercise-media.js` | Yerel ffprobe ve uzak R2 HTTP doğrulaması |
| `r2-exercise-media-cors.json` | R2 CORS kuralı |
| `docs/R2-EXERCISE-MEDIA-SETUP.md` | Bucket, custom domain, cache ve upload runbook'u |
| `docs/EXERCISE-GUIDE-SCHEMA.md` | Yeni validator komutları ve R2 rehberi bağlantısı |
| `AGENTS.md` | Dosya haritası, görev yönlendirmesi ve refactor özeti |

### Doğrulama Notları

- `node --check scripts/validate-exercise-media.js` çalıştırılmalı.
- `node scripts/validate-exercise-media.js --remote-ready`, media-ready kayıt yokken temiz biçimde no-op olmalı.
- Yerel MP4 doğrulaması için `ffmpeg`/`ffprobe` PATH üzerinde bulunmalıdır.
- Cloudflare oturumu açıldıktan sonra CORS config Wrangler ile uygulanmalı ve Bench Press pilot dosyaları uzak validator'dan geçmelidir.

---

## Bölüm 63 — Exercise Guide JSON Cutover Hazırlığı (2026-06-18)

### Amaç

Bench Press, Squat ve Deadlift için web ile mobilin paylaşacağı tam iki dilli içeriği kanonik JSON'a taşımak; medya tesliminden sonra yalnız readiness bayrakları değiştirilerek güvenli biçimde yayına alınabilecek web generator yolunu hazırlamak.

### Mimari Kararlar

- **Tam pilot içerikler:** Üç hareketin summary, açıklama, form adımları, hatalar, ipuçları, progression, kas kimlikleri ve web metadata/quick-fact/tracking alanları TR+EN olarak `data/ex-guides.json` içine alındı.
- **Publish kontrollü adapter:** Programmatic SEO generator kanonik guide kaydını yalnız `publish: true` olduğunda kullanır. Hazır olmayan veya eksik kayıtlar mevcut `EXERCISE_GUIDES` içeriğine düşer.
- **Regresyonsuz hazırlık:** Pilot kayıtlar `previewReady: true`, `mediaReady: false`, `publish: false` kaldığı için mevcut üç canlı guide HTML çıktısı değişmez.
- **Koşullu medya şablonu:** Media-ready guide sayfası MP4 zorunlu, WebM opsiyonel hareket demosunu ve masaüstü/mobil yerleşime uyarlanan kas haritasını otomatik üretir.
- **Sosyal önizleme:** Yayınlanan guide poster'i varsa Open Graph/Twitter görseli olarak kullanılır; aksi durumda mevcut site paylaşım görseli korunur.
- **Service worker:** Yeni statik dosya veya URL eklenmedi; mevcut `landing.css`, generator ve önceden precache edilen guide verileri güncellendiği için cache adı değiştirilmedi.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Üç pilot hareketin tam TR/EN guide ve web içeriği |
| `data/ex-guides.js` | Güncel kanonik JSON'dan yeniden üretilen web wrapper |
| `scripts/build-programmatic-seo.js` | Publish-gated kanonik adapter, legacy fallback ve medya markup'ı |
| `styles/landing.css` | Hareket demosu ve responsive kas haritası stilleri |
| `docs/EXERCISE-GUIDE-SCHEMA.md` | Generator cutover davranışı |
| `AGENTS.md` | Refactor özeti ve dosya haritası bölüm sayısı |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` ile üç pilot preview-ready ve publish/media-ready sayıları doğrulanmalı.
- `node scripts/build-blog.js` sonrasında mevcut üç canlı guide dosyasının hash'leri değişmemeli.
- Geçici publish-ready fixture ile kanonik metin, demo video, kas haritası ve sosyal poster markup'ı üretilmeli; publish olmayan diğer sayfalar legacy kalmalı.
- Masaüstü ve 390 px mobil viewport'ta demo/kas haritası boyutları, içerik sırası ve yatay taşma kontrol edilmeli.

---

## Bölüm 64 — Tüm Preset Guide Kapsamı ve Web Preview Tüketimi (2026-06-18)

### Amaç

Kanonik exercise-guide kaynağını üç pilottan tüm preset kataloğuna genişletmek ve web PWA exercise preview modalını ortak veriyi doğrudan kullanan, migration boyunca legacy fallback'i koruyan yapıya geçirmek.

### Mimari Kararlar

- **Tam katalog kapsamı:** `data/ex-guides.json`, 145 preset slug'ın tamamı için kayıt taşır. Mevcut 143 legacy preview kaydı summary/description/tips alanlarına kayıpsız aktarıldı.
- **Bilinçli readiness:** Legacy preview içeriği bulunmayan `chest-fly` ve `moonwalk`, uydurma içerik üretilmeden `previewReady: false` bırakıldı. Diğer 143 kayıt preview-ready'dir.
- **Pilot koruması:** Bench Press, Squat ve Deadlift için Bölüm 63'te hazırlanan ayrıntılı form/mistake/progression/web içeriği aynen korundu.
- **Draft kas grupları:** Henüz yayınlanmamış migration kayıtları preset kategori sırasından türetilen geniş kas grubu slug'ları taşır. Publish öncesinde anatomik primary/secondary slug'larla rafine edilir.
- **Coverage validator:** Yeni bir preset eklenip kanonik guide kaydı unutulursa `scripts/build-ex-guides.js` artık build'i durdurur.
- **Web runtime önceliği:** `ExPreviewModal`, `previewReady` kanonik guide'ı önce kullanır; hazır kayıt yoksa `LOGWISE_EX_PREVIEW` fallback'ine döner.
- **Hazır medya davranışı:** `mediaReady` kayıtta MP4/WebM video ve muscle map gösterilir; `publish` kayıtta tam web rehberi bağlantısı eklenir.
- **Erişilebilir modal:** Dialog semantiği, başlık ilişkisi ve iki dilli kapatma düğmesi adı eklendi.
- **Service worker:** Kritik component lookup mantığının mevcut kullanıcılara kesin ulaşması için `logwise-v46` → `logwise-v47` bump edildi.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | 145/145 kanonik guide kaydı; 143 preview-ready |
| `data/ex-guides.js` | Tam katalogdan yeniden üretilen web wrapper |
| `scripts/build-ex-guides.js` | Her preset için guide kaydı zorunluluğu |
| `components/ex-preview-modal.js` | Kanonik öncelik, legacy fallback, video/kas haritası/link ve dialog semantiği |
| `data/i18n-tr.js`, `data/i18n-en.js` | Kas haritası ve tam rehber etiketleri |
| `docs/EXERCISE-GUIDE-SCHEMA.md` | Tam kapsam ve draft kas grubu kuralı |
| `docs/PRESET-EXERCISE-EKLEME.md` | Yeni preset için kanonik guide kaydı zorunluluğu |
| `sw.js` | `logwise-v47` cache bump |
| `AGENTS.md` | Refactor özeti ve bölüm sayısı |

### Doğrulama Notları

- Guide validator sonucu `145 total, 143 preview-ready, 0 media-ready, 0 published` olmalı.
- JSON ile üretilmiş web wrapper byte-equivalent olmalı; legacy migration audit'i açıklama ve ipuçlarında kayıp bulmamalı.
- Component runtime testinde kanonik öncelik, legacy fallback, media-ready video/kas haritası ve publish linki ayrı ayrı doğrulanmalı.
- Gerçek `/app` akışında Bench Press kanonik metni, `Chest Fly` no-content durumu ve 390 × 844 mobil modal taşmasız görünüm doğrulanmalı.
- Üç canlı Library guide HTML dosyası `publish: false` sırasında `HEAD` ile byte-for-byte aynı kalmalı.

---

## Bölüm 65 — Exercise Guide Enrichment Batch 1 (2026-06-18)

### Amaç

Kanonik guide kataloğunda preview metninden tam rehber içeriğine geçişi başlatmak; yüksek değerli temel hareketleri medya tesliminden bağımsız olarak publish-ready metin ve anatomik kas verisi seviyesine getirmek.

### Kapsam

- Incline Bench Press
- Overhead Press
- Pull Up
- Barbell Row
- Romanian Deadlift
- Hip Thrust
- Leg Press

### Mimari Kararlar

- **Tam iki dilli içerik:** Yedi hareket için açıklama, form adımları, yaygın hatalar, teknik ipuçları ve progression alanları TR+EN olarak tamamlandı.
- **Web metadata:** Her kayıt meta title/description, quick facts, tracking ve ilgili hareket slug'larını taşır.
- **Anatomik kas verisi:** Draft kategori slug'ları hareket bazlı primary/secondary anatomik kas slug'larıyla değiştirildi.
- **Türetilmiş readiness:** `contentReady` yeni bir JSON alanı değildir. Validator; dolu tam rehber alanları, `previewReady`, web nesnesi ve anatomik kas verisinden sayacı türetir.
- **Publish güvenliği:** `publish: true` bir kayıt draft kas grupları taşıyorsa validator build'i durdurur.
- **Migration düzeltmesi:** Bölüm 64'teki PowerShell encoding etkisi nedeniyle bazı Türkçe kategorilerde oluşan `full-body` fallback'leri Unicode-safe eşleme ile katalog genelinde düzeltildi.
- **Readiness sonucu:** 145 total, 143 preview-ready, 10 content-ready, 0 media-ready, 0 published.
- **Service worker:** `logwise-v47` bu feature branch'te henüz deploy edilmediği ve aynı merge içinde güncel guide wrapper'ını precache edeceği için ek cache bump yapılmadı.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Yedi tam rehber + katalog geneli draft kas grubu düzeltmesi |
| `data/ex-guides.js` | Kanonik JSON'dan yeniden üretilmiş wrapper |
| `scripts/build-ex-guides.js` | Türetilmiş content-ready sayacı ve publish kas verisi kontrolü |
| `scripts/build-blog.js` | Build özetinde content-ready sayısı |
| `docs/EXERCISE-GUIDE-SCHEMA.md` | Türetilmiş readiness sözleşmesi |
| `AGENTS.md` | Refactor özeti ve bölüm sayısı |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` sonucu tam olarak `145 total, 143 preview-ready, 10 content-ready, 0 media-ready, 0 published` olmalı.
- Draft katalogda `full-body` fallback'i kalmamalı; yedi yeni kayıt ve üç pilot content-ready olmalı.
- JSON ile üretilmiş wrapper birebir eşleşmeli.
- `node scripts/build-blog.js` tüm Learn/Library/sitemap çıktılarını hatasız üretmeli.
- Mevcut Bench Press, Squat ve Deadlift Library HTML dosyaları `publish: false` nedeniyle `HEAD` ile byte-for-byte aynı kalmalı.

---

## Bölüm 66 — Exercise Guide Enrichment Batch 2 (2026-06-19)

### Amaç

Temel yatay itiş, dikey/yatay çekiş ve tek taraflı alt vücut desenlerini tam guide içeriğine taşımak; legacy preview metinlerindeki aşırı katı eklem açısı ve hareket açıklığı kurallarını güncel, kontrol odaklı teknik anlatımla değiştirmek.

### Kapsam

- Push Up
- Dips
- Lat Pulldown
- Cable Row
- Goblet Squat
- Lunge
- Leg Curl

### İçerik Kararları

- **Tam iki dilli rehber:** Yedi hareket için description, formSteps, mistakes, tips, progression, muscles ve web alanları TR+EN tamamlandı.
- **Bireysel hareket açıklığı:** Dips derinliği sabit 90 derece kuralına değil, ağrısız omuz kontrolüne bağlandı.
- **Diz-ayak ucu miti:** Lunge ve goblet squat rehberlerinde dizin ayak ucunu geçmesi tek başına hata sayılmadı; topuk teması ve diz-ayak yönü esas alındı.
- **Hareket ayrımı:** `leg-curl`, ayrı `seated-leg-curl` preset'i bulunduğu için yatarak leg curl makinesine özgü yazıldı.
- **Anatomik kas verisi:** Tüm batch kayıtları geniş kategori slug'ları yerine hareket bazlı primary/secondary anatomik kas slug'ları taşır.
- **Kaynak kontrolü:** Push-up rijit gövde ve kontrollü iniş ilkeleri ACE Push-Up Exercise Library; forward lunge adım/iniş ilkeleri ACE Forward Lunge Exercise Library ile çapraz kontrol edildi.
- **Readiness sonucu:** 145 total, 143 preview-ready, 17 content-ready, 0 media-ready, 0 published.
- **Service worker:** Yeni statik URL veya runtime mantığı eklenmedi; feature branch'teki mevcut `logwise-v47` aynı merge içinde güncel wrapper'ı precache edeceği için ek bump yapılmadı.

### Kaynaklar

- `https://www.acefitness.org/resources/everyone/exercise-library/41/push-up/`
- `https://www.acefitness.org/resources/everyone/exercise-library/8/forward-lunge/`

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Yedi hareket için tam guide ve anatomik kas içeriği |
| `data/ex-guides.js` | Kanonik JSON'dan yeniden üretilen wrapper |
| `AGENTS.md` | Refactor özeti ve bölüm sayısı |
| `REFACTOR-GECMISI.md` | Batch kapsamı, içerik kararları ve doğrulama kaydı |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` sonucu `145 total, 143 preview-ready, 17 content-ready, 0 media-ready, 0 published` olmalı.
- Yedi batch kaydı `isContentReady` kontrolünü geçmeli; `publish` ve `mediaReady` false kalmalı.
- Related exercise slug'ları preset kataloğunda bulunmalı ve meta title/description uzunluk kontrolleri geçmeli.
- JSON ile web wrapper birebir eşleşmeli.
- `node scripts/build-blog.js` tüm Learn/Library/sitemap çıktılarını hatasız üretmeli.
- Bench Press, Squat ve Deadlift Library HTML dosyaları `HEAD` ile byte-for-byte aynı kalmalı.

---

## Bölüm 97 — Antrenman Programlama Learn İçerik Kümesi (2026-07-23)

### Amaç

Antrenman programlama ve ilerleme kararlarında sık karşılaşılan altı soruyu; uygulanabilir örnekler, ölçüm sınırları, sağlık/güvenlik ayrımları ve LogWise kayıt akışıyla birlikte iki dilli Learn/Öğren içerik kümesine dönüştürmek.

### Kapsam ve İçerik Kararları

- **Altı iki dilli konu:** Setler arası dinlenme, kas grubu başına haftalık set sayısı, ısınma setlerinin planlanması, tahmini ve test edilmiş 1RM ayrımı, deload haftası ve ağırlık artırma kararları için 12 Markdown varyantı eklendi; her EN/TR çifti ortak `translationKey` ile eşleştirildi.
- **Bağlama göre programlama:** Dinlenme ve haftalık set hacmi tek bir evrensel sayıya indirgenmedi; hedef, egzersiz, efor, toparlanma ve performans eğilimleri birlikte değerlendirildi.
- **Ölçüm sınırları:** Estimated 1RM'in bir tahmin ve trend aracı olduğu, test edilmiş 1RM'in ise belirli bir gün ve teknik standardındaki performansı gösterdiği açıklandı; iki ölçüm birbirinin yerine kullanılmadı.
- **Hazırlık ve yorgunluk yönetimi:** Isınma setleri çalışma setinden ayrıldı; deload sabit takvim zorunluluğu olarak sunulmadı ve tek kötü antrenman birikmiş yorgunluk kanıtı sayılmadı.
- **İlerleme kararı:** Ağırlık artışı yalnız en iyi sete bağlanmadı; tekrar aralığı, tamamlanan setler, teknik kalite ve RIR birlikte kullanıldı. Küçük yük artışı mümkün değilse tekrar veya teknik ilerleme seçenekleri korundu.
- **İç bağlantılar:** Yazılar ilgili Learn rehberlerine, `/one-rep-max-calculator`, `/rpe-rir-calculator`, `/workout-volume-calculator`, `/barbell-plate-calculator` ve `/app` rotalarına bağlandı.
- **Statik üretim ve SEO:** Learn/Öğren indeksleri, `learn/posts.json` ve `sitemap.xml` generator üzerinden yenilendi; yeni sayfalarda canonical ve karşılıklı EN/TR/x-default hreflang kayıtları üretildi.
- **PWA önbelleği:** 12 yeni makale rotasının clean URL ve `.html` karşılıkları precache listesine eklendi; teslim sürümü `logwise-v65` olarak ayarlandı.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `blog-content/{how-long-to-rest-between-sets,setler-arasinda-ne-kadar-dinlenmeli,how-many-sets-per-muscle-per-week,kas-grubu-basina-haftada-kac-set,how-to-plan-warm-up-sets,isinma-setleri-nasil-yapilir,estimated-1rm-vs-tested-1rm,tahmini-1rm-ve-gercek-1rm,what-is-a-deload-week,deload-haftasi-nedir,when-to-increase-weight,agirligi-ne-zaman-artirmalisin}.md` | Altı konunun EN/TR kanonik Markdown kaynakları |
| `learn/*.html`, `ogren/*.html` | Yeni makale sayfaları ve yenilenen dil indeksleri |
| `learn/posts.json`, `sitemap.xml` | Yeni konu manifesti, canonical ve hreflang kayıtları |
| `sw.js` | `logwise-v65` cache sürümü ve yeni makale rotalarının precache kayıtları |
| `AGENTS.md`, `REFACTOR-GECMISI.md` | Refactor özeti ve teslim kaydı |

### Doğrulama Notları

- `node scripts/build-blog.js` 24 dil varyantını 12 Learn konusu olarak hatasız üretmeli.
- `node --check scripts/build-blog.js` ve `node --check sw.js` başarılı olmalı; `node scripts/check-codegen.js` drift göstermemeli.
- `learn/posts.json` JSON olarak, `sitemap.xml` XML olarak parse edilmeli; `git diff --check` temiz olmalı.
- Altı yeni EN/TR çiftinde canonical, karşılıklı hreflang ve x-default kayıtları bulunmalı; `sw.js` clean URL ve `.html` biçimindeki 24 yeni precache rotasının tamamını içermeli.
- Deploy sonrasında 12 yeni makale URL'si ile Learn/Öğren indeksleri başarılı HTTP yanıtı vermeli ve v65 service worker canlıda görünmelidir.

---

## Bölüm 96 — RPE / RIR Learn İçerik Kümesi (2026-07-15)

### Amaç

RPE/RIR hesaplayıcıya gelen kullanıcının efor ölçeklerini ayrı ayrı öğrenmesini, aralarındaki pratik dönüşümü görmesini ve hesaplayıcıda hangi modu seçmesi gerektiğine karar vermesini sağlayan iki dilli Learn/Öğren içerik kümesi oluşturmak.

### Kapsam ve İçerik Kararları

- **Üç iki dilli konu:** `What Is RPE?` / `RPE Nedir?`, `What Is RIR?` / `RIR Nedir?` ve `RPE vs RIR: Which Should You Use?` / `RPE ve RIR Arasındaki Fark Nedir?` yazıları aynı konu içindeki EN/TR varyantları ortak `translationKey` kullanacak biçimde eklendi.
- **Pratik dönüşüm:** RIR 4–0 aralığı yaklaşık RPE 6–10 karşılıklarıyla verildi; tablonun kesin matematik değil, egzersiz, tekrar aralığı, yorgunluk, teknik ve deneyimden etkilenen pratik bir tahmin olduğu açıklandı.
- **Mod seçimi:** Program RPE hedefi veriyorsa RPE, kullanıcı kalan temiz tekrarlar üzerinden düşünüyorsa RIR önerildi; iki ölçeği aynı set için birlikte kaydetmenin gerekli olmadığı belirtildi.
- **İç bağlantılar:** İçerikler `/rpe-rir-calculator`, `/one-rep-max-calculator` ve `/workout-volume-calculator` rotalarına bağlandı.
- **Statik üretim ve SEO:** Learn/Öğren indeksleri, `learn/posts.json`, landing kartları ve `sitemap.xml` generator üzerinden yenilendi; canonical ve karşılıklı EN/TR/x-default hreflang kayıtları üretildi.
- **PWA önbelleği:** Altı yeni makale rotasının clean URL ve `.html` karşılıkları precache listesine eklendi; aynı teslimdeki URL listesi değişikliği için `logwise-v55` → `logwise-v56` bump kullanıldı.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `blog-content/{what-is-rpe-in-training,rpe-nedir,what-is-rir,rir-nedir,rpe-vs-rir,rpe-rir-farki}.md` | Üç konunun EN/TR kanonik Markdown kaynakları |
| `learn/*.html`, `ogren/*.html` | Yeni makale sayfaları ve yenilenen dil indeksleri |
| `learn/posts.json`, `sitemap.xml` | Yeni konu manifesti, canonical ve hreflang kayıtları |
| `index.html`, `tr.html` | Generator ile yenilenen Learn/Öğren landing kartları |
| `sw.js` | `logwise-v56` cache bump + yeni makale rotalarının precache kayıtları |
| `AGENTS.md`, `REFACTOR-GECMISI.md` | Refactor özeti ve teslim kaydı |

### Doğrulama Notları

- `node scripts/build-blog.js` 12 dil varyantını 6 Learn konusu olarak hatasız üretmeli.
- `node --check scripts/build-blog.js` ve `node --check sw.js` başarılı olmalı; `node scripts/check-codegen.js` drift göstermemeli.
- `learn/posts.json` JSON, `sitemap.xml` XML olarak parse edilmeli; `git diff --check` temiz olmalı.
- EN/TR hedef makalelerde dönüşüm tablosu, üç iç link, canonical ve karşılıklı hreflang kayıtları bulunmalı.
- Desktop tarayıcı testinde iki makale, landing kartları ve Learn/Öğren indeksleri taşma veya konsol hatası olmadan render olmalı; landing dil geçişi doğru locale rotasına gitmeli.

---

## Bölüm 95 — Site Geneli Kalıcı Dil Tercihi (2026-07-15)

### Amaç

Kullanıcının public sitede veya Web uygulamasında seçtiği Türkçe/İngilizce tercihini sayfalar arasında korumak; çeviri karşılığı bulunan canonical sayfalarda tercih edilen rotayı otomatik açmak.

### Mimari Kararlar

- **Tek ortak anahtar:** Public statik yüzeyler, Learn/Öğren ve mevcut Web uygulaması `localStorage` içindeki `gym-log-lang` (`tr` / `en`) anahtarını paylaşır. Böylece `/app`, profil ve public sayfalar aynı tercihi okur.
- **Alternate tabanlı yönlendirme:** `site-nav.js`, kayıtlı dil mevcut belgenin dilinden farklıysa yalnız `<link rel="alternate" hreflang="...">` ile gerçek karşılığı ilan edilmiş rotaya `location.replace()` uygular. Eşlenmemiş veya yalnız İngilizce detay sayfalarında sahte çeviri rotası üretilmez.
- **Tercih kaybı yok:** Yalnız İngilizce tool/Library detay sayfaları kullanıcıyı zorla başka rotaya göndermez; kayıtlı TR tercihi korunur ve sonraki çift dilli sayfada yeniden uygulanır. Mobil public menü de kayıtlı tercih dilindeki etiket ve hedefleri kullanır.
- **Eski tercih taşıma:** Daha önce yalnız Learn/Öğren tarafından kullanılan `logwise-blog-lang`, yeni ortak anahtar boşsa otomatik olarak `gym-log-lang` değerine taşınır.
- **Learn runtime uyumu:** Üretilen Learn/Öğren sayfaları yükleme sırasında mevcut sayfa dilini ortak tercihin üzerine yazmaz. Dil düğmesi seçimi ortak anahtara kaydedilir; canonical EN/TR rota geçişi korunur.
- **PWA önbelleği:** Ortak navigasyon davranışının eski cache'te kalmaması için `sw.js` `logwise-v54` → `logwise-v55` bump edildi.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `site-nav.js` | Ortak dil tercihi, eski anahtar migrasyonu, dil seçici yakalama ve hreflang alternate yönlendirmesi |
| `scripts/build-blog.js` | Learn/Öğren runtime'ının `gym-log-lang` kullanması ve sayfa yüklenirken tercihi ezmemesi |
| `learn/*.html`, `ogren/*.html` | Generator ile yenilenen iki dilli runtime çıktıları |
| `sw.js` | `logwise-v55` cache bump |
| `AGENTS.md`, `REFACTOR-GECMISI.md` | Ortak dil anahtarı sözleşmesi ve karar kaydı |

### Doğrulama Notları

- `node --check site-nav.js`, `scripts/build-blog.js` ve `sw.js` başarılı olmalı.
- `node scripts/build-blog.js` sonrasında Learn/Öğren çıktıları deterministik kalmalı.
- `node scripts/check-codegen.js` ortak veri çıktılarında drift olmadığını doğrulamalı.
- Tarayıcıda TR seçildikten sonra `/tools` → `/araclar`, `/library` → `/kutuphane`, `/learn` → `/ogren` ve `/` → `/tr` akışları; EN seçildiğinde ters yönleri doğrulanmalı.
- `/app` aynı `gym-log-lang` değerini okumalı; yalnız EN canonical detaya geçildiğinde tercih silinmemeli.

---

## Bölüm 94 — Tools / Library Türkçe Hub Yerelleştirmesi (2026-07-11)

### Amaç

İngilizce Tools ve Library ana sayfalarına, URL ve SEO sinyalleri bakımından gerçek Türkçe alternatifler eklemek; TR landing ve Öğren akışındaki geçici İngilizce hedefleri yerelleştirilmiş hub sayfalarına taşımak.

### Mimari Kararlar

- **Ayrı canonical rotalar:** Tools çifti `/tools` ↔ `/araclar`, Library çifti `/library` ↔ `/kutuphane` olarak tanımlandı. Her sayfa kendi canonical URL'sini, karşılıklı `hreflang="en"` / `hreflang="tr"` ve EN `x-default` bağlantısını taşır.
- **Hub-only kapsam:** Bu bölüm yalnız ana Tools ve Library hub sayfalarını yerelleştirir. Hesaplayıcılar ile Library dizin/detay sayfaları EN canonical kalır; TR hub'lardaki bu bağlantılar `hreflang="en"` ile açıkça işaretlenir ve alt sayfalara sahte TR alternate eklenmez.
- **Tools statik çifti:** Elle yönetilen `tools.html` sayfasına dil seçici eklendi; yeni `araclar.html` aynı tasarım dilinde tamamen Türkçe hub içeriği, metadata ve JSON-LD taşır.
- **Library generator sınırı:** `library.html` ve yeni `kutuphane.html`, yalnız `scripts/build-programmatic-seo.js` üzerinden üretilir. Generator locale-aware head/nav/footer şablonları, TR hub kartları ve iki hub sitemap kaydı üretir.
- **Geçici alias kaldırma:** `_redirects` içindeki `/kutuphane` → `/library` 200 rewrite kaldırıldı; clean URL artık gerçek `kutuphane.html` dosyasını sunar. Henüz yerelleştirilmeyen nested `/kutuphane/*` alias'ları EN sayfalara rewrite olmaya devam eder.
- **Tutarlı TR navigasyon:** `site-nav.js`, TR Tools hedefini `/araclar` olarak kullanır. `scripts/build-blog.js` ile üretilen `/ogren` sayfalarının Tools bağlantıları ve `tr.html` ana hub bağlantıları da `/araclar` hedefine taşındı.
- **Sitemap alternate'ları:** Statik sitemap üretimi, hub çiftleri için karşılıklı XHTML hreflang satırları üretecek biçimde genişletildi.
- **PWA önbelleği:** `sw.js` `logwise-v53` → `logwise-v54` bump edildi; `/araclar`, `/araclar.html` ve `/kutuphane.html` precache listesine eklendi.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `araclar.html`, `tools.html` | TR Tools hub + EN/TR dil seçici, canonical/hreflang ve locale metadata |
| `scripts/build-programmatic-seo.js` | TR Library hub üretimi, locale-aware template parçaları ve sitemap kayıtları |
| `library.html`, `kutuphane.html` | Üretilmiş EN/TR Library hub çıktıları |
| `scripts/build-blog.js`, `sitemap.xml` | `/araclar` statik sayfası, TR nav hedefi ve hub hreflang sitemap satırları |
| `site-nav.js`, `tr.html`, `ogren/*.html` | TR Tools hedefinin `/araclar` olarak güncellenmesi |
| `_redirects` | Gerçek `/kutuphane` sayfasını gölgeleyen 200 rewrite'ın kaldırılması |
| `styles/landing.css` | Mobil dil seçici link padding uyumu |
| `sw.js` | `logwise-v54` bump + yeni TR hub precache kayıtları |
| `docs/PROGRAMMATIC-SEO-PROMPT.md` | Gerçek TR hub ile EN kalan nested alias sınırının güncellenmesi |
| `AGENTS.md`, `REFACTOR-GECMISI.md` | Dosya haritası, refactor özeti ve karar kaydı |

### Doğrulama Notları

- `node scripts/build-blog.js`, iki Library hub'ı ve sitemap alternate satırlarını deterministik üretmeli.
- `node --check scripts/build-programmatic-seo.js`, `scripts/build-blog.js`, `site-nav.js` ve `sw.js` başarılı olmalı.
- `node scripts/check-codegen.js` ortak veri çıktılarında drift olmadığını doğrulamalı.
- Sitemap XML parse edilmeli; `/tools`, `/araclar`, `/library` ve `/kutuphane` kayıtları karşılıklı hreflang taşımalı.
- Desktop ve mobile viewport'ta dört hub sayfasının dil seçicisi, CTA'ları ve taşma davranışı smoke testten geçmeli.

---

## Bölüm 93 — RPE / RIR Calculator Statik SEO Tool (2026-07-06)

### Amaç

Tools yüzeyini LogWise'in progress tracking vaadine doğrudan bağlanan bir efor tabanlı hesaplayıcıyla genişletmek:
kullanıcının `100 kg x 5 @ RPE 8` gibi bir setten tahmini 1RM, RIR, hedef tekrar/RPE yükleri ve backoff set önerisi
alabildiği statik SEO sayfası eklemek.

### Kapsam

- `/rpe-rir-calculator` canonical statik tool sayfası eklendi.
- Hesaplayıcı; weight, reps, set RPE, target reps, target RPE ve backoff set sayısını alır.
- RPE/RIR dönüşümü `RIR = 10 - RPE`; tahmini 1RM ise completed reps + RIR ile Epley tarzı formül üzerinden hesaplanır.
- Ana panelde e1RM, RIR, effective reps, target load ve otomatik backoff RPE gösterilir.
- Target set ve backoff suggestion kartları, hedef yükü ve bir RPE daha düşük backoff yükünü pratik şekilde özetler.
- Takip düzeltmesiyle effort girişi üstteki RIR/RPE mod seçiciye taşındı; seçilen moda göre yalnız Set/Target RIR veya Set/Target RPE inputları görünür, karşılık değerler otomatik türetilir.
- Backoff set sayısı opsiyonel hale getirildi; `0` seçildiğinde backoff kartı "No backoff planned" durumuna geçer ve yalnız hedef set/e1RM çıktıları kullanılır.
- RPE 6/7/8/9/10 kolonları ve 3/5/6/8/10/12 tekrar satırlarıyla hedef yük tablosu üretildi.
- `/tools` hub sayfası, EN `/` landing tool kartları ve TR `/tr` landing tool kartları yeni tool'u gösterecek şekilde beşli grid'e taşındı.
- `one-rep-max-calculator.html` related tools bölümüne yeni RPE/RIR iç linki eklendi.
- `scripts/build-blog.js` statik sitemap listesine yeni canonical path eklendi; `/tools` lastmod tarihi güncellendi.
- `sw.js` `logwise-v52` bump ile `/rpe-rir-calculator` ve `.html` varyantlarını precache'e aldı.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `rpe-rir-calculator.html` | Yeni statik SEO tool sayfası + inline RPE/RIR hesaplayıcı |
| `styles/landing.css` | Beşli tools grid, RPE mini preview, RPE form/sonuç/tablo stilleri |
| `tools.html` | Hub metadata/schema ve tool kart listesi 5 tool'a çıkarıldı |
| `index.html`, `tr.html` | Landing tool kartları ve footer linkleri güncellendi |
| `one-rep-max-calculator.html` | Related tools ve footer iç linki eklendi |
| `scripts/build-blog.js` | Statik sitemap sayfa listesine `/rpe-rir-calculator` eklendi |
| `sw.js` | `logwise-v52` bump + yeni tool URL'leri precache listesi |
| `AGENTS.md` | Dosya haritası, son bölüm referansı ve refactor özeti güncellendi |
| `REFACTOR-GECMISI.md` | Bu bölüm |

### Doğrulama Notları

- `node scripts/build-blog.js` ile sitemap çıktıları yeniden üretilmeli.
- `node --check sw.js` ve yeni inline hesaplayıcı script'i syntax kontrolünden geçmeli.
- `node scripts/check-codegen.js` generated ortak veri drift'i olmadığını doğrulamalı.
- Desktop ve mobile viewport'ta `/rpe-rir-calculator.html`, `/tools.html`, `/`, `/tr` görsel smoke kontrolünden geçmeli.

---

## Bölüm 92 — Barbell Plate Calculator Statik SEO Tool (2026-06-30)

### Amaç

Tools yüzeyini gerçek antrenman anında kullanılan, düşük sürtünmeli bir hesaplayıcıyla genişletmek:
hedef bar ağırlığına göre her yana yüklenecek plakaları kg/lb, bar ağırlığı ve custom plaka envanteriyle
hesaplayan statik bir SEO sayfası eklemek.

### Kapsam

- `/barbell-plate-calculator` canonical statik tool sayfası eklendi.
- Hesaplayıcı; target weight ve bar weight'i ana panelde alır, üst öneri alanında hedefe göre 1-3 benzersiz
  balanced/closest plaka dizilimini tek kartlık carousel olarak gösterir, custom envanter girişini ise opsiyonel
  details panelinde tutar.
- Kg default plaka seti `1.25, 2.5, 5, 10, 15, 20, 25`; lb default plaka seti
  `2.5, 5, 10, 25, 35, 45, 55` olarak sabitlendi.
- Envanter sınırlı olduğunda greedy yerine küçük kombinasyon aramasıyla exact veya closest loaded bar weight
  sonucu üretir; yüklenmiş bar görseli, iki yana düşen plakalar, total plates ve target farkını gösterir.
- Üst öneri algoritması sabit senaryo isimlerinden çıkarıldı; tüm dengeli kombinasyonlar dedupe edilip exact seçenek
  varsa yalnız exact seçeneklerden, exact yoksa closest seçeneklerden en fazla üç farklı stack seçilir.
- İlk tablo taslağı görsel olarak sade bulunduğu için envanter satırları plate-card grid'e, sonuç alanı ise
  daha ince, renkli plaka katmanları olan barbell preview paneline çevrildi; plaka label'ları yalnız sayı gösterir.
- Carousel okları bar görselinin yanlarına taşındı; bar merkezi boş bırakıldı, plaka grupları uçlara yaklaştırıldı
  ve görsel sıralama her zaman bardan dışa doğru büyükten küçüğe normalize edildi.
- Custom envanter girişi "pair" yerine toplam plaka adedi olarak düzenlendi; tek kalan plakalar simetrik
  yükleme için kullanılamadığı için hesaplamada `floor(adet / 2)` çift mantığı uygulanır.
- Custom details paneli yalnız plaka envanteri/adedi girişini gösterir; panel kapalıyken üst öneriler default common
  senaryolardan, panel açıkken aynı üst bar görseli custom envanter sonucundan beslenir.
- `/tools` hub sayfası, EN `/` landing tool kartları ve TR `/tr` landing tool kartları yeni tool'u gösterecek
  şekilde dörtlü grid'e taşındı.
- `scripts/build-blog.js` statik sitemap listesine yeni canonical path eklendi; `sw.js` `logwise-v51`
  bump ile `/barbell-plate-calculator` ve `.html` varyantlarını precache'e aldı.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `barbell-plate-calculator.html` | Yeni statik SEO tool sayfası + inline hesaplayıcı + barbell preview |
| `tools.html` | Hub metadata/schema ve tool kart listesi 4 tool'a çıkarıldı |
| `index.html`, `tr.html` | Landing tool kartları ve footer linkleri güncellendi |
| `styles/landing.css` | 4'lü tool grid, plate mini preview ve plate calculator layout stilleri |
| `scripts/build-blog.js` | Statik sitemap sayfa listesine `/barbell-plate-calculator` eklendi |
| `sw.js` | `logwise-v51` bump + yeni tool URL'leri precache listesi |
| `AGENTS.md` | Dosya haritası, son bölüm referansı ve refactor özeti güncellendi |
| `REFACTOR-GECMISI.md` | Bu bölüm |

### Doğrulama Notları

- `node scripts/build-blog.js` ile sitemap çıktıları yeniden üretilmeli.
- `node --check sw.js` ve yeni inline hesaplayıcı script'i syntax kontrolünden geçmeli.
- `node scripts/check-codegen.js` generated ortak veri drift'i olmadığını doğrulamalı.
- Desktop ve mobile viewport'ta `/barbell-plate-calculator.html`, `/tools.html`, `/`, `/tr` görsel smoke kontrolünden geçmeli.

---

## Bölüm 91 — `app_profiles` Kullanıcı Adı DB-Seviyesi Normalize Benzersizlik + RPC Kalıcılaştırma (2026-06-29)

### Durum

**GİDERİLDİ — CANLIDA UYGULANDI VE DOĞRULANDI (2026-06-29).** Önce yalnız repo dosyaları (migration +
snapshot + docs) hazırlandı; ardından migration production'da **manuel uygulandı ve doğrulandı**. Index
canlıda `indisready/indisvalid/indisunique=true` ve tanımı doğru; RPC gövdesi/izinleri doğrulandı;
davranış testleri geçti (aşağı bkz.). [10/R9](docs/project-understanding/10-RISKS-AND-TECHNICAL-DEBT.md) /
[11/D15](docs/project-understanding/11-DECISION-HISTORY.md) `GİDERİLDİ`. Migration SQL gövdesi ve dosya
adı, tekrar üretilebilirlik için **değiştirilmedi** (yalnız üst `Durum:` yorumu güncellendi).

### Amaç

Kayıt akışı username'leri RPC `check_app_username_available` ile `lower(trim(...))` mantığıyla ön-kontrol
ediyordu, ama DB benzersizliği yalnız ham `UNIQUE(username)` ile sağlanıyordu → DB teorik olarak
`Ali`/`ali`/`ali ` değerlerini farklı kabul edebiliyordu (yarış riski; istemci ön-kontrolü constraint'in
yerini tutmaz). Ayrıca RPC tanımı repoda yoktu (yalnız canlıda). Bu bölüm DB-seviyesi normalize garantisini
ekler ve RPC'yi repoya kalıcılaştırır.

### Bulgu (repo + canlı denetim)

- Constraint-name bağımlılığı YOK: `app_profiles_username_key` repoda 0 eşleşme; hata işleme SQLSTATE
  `23505` + `/duplicate|unique|username/i` mesaj regex'ine dayanır (`queries/auth.ts`, `lib/account.ts`,
  `register.tsx`). Yeni index ihlali de aynı şekilde `errUsernameTaken` üretir → ek kod yok.
- Tek username yazıcıları: signUp upsert (`queries/auth.ts`) + `ensureAppProfile` (`lib/account.ts`);
  ikisi de normalize değer yazar. Username UPDATE özelliği yok (Profile ekranı salt-okunur).
- Canlı salt-okunur denetim (2026-06-28): normalize-duplicate grubu 0, NULL username 1, boş 0.

### Çözüm (repoda)

- RPC normalize gövdeye getirildi: kolon+parametre `lower(btrim(...))`; `null`/boş girdi `false`;
  `SECURITY DEFINER`, `set search_path to ''`, açık `revoke all from public` + `grant execute to
  anon, authenticated, service_role`.
- Eşleşen partial unique index: `app_profiles_username_normalized_key on (lower(btrim(username)))
  where username is not null` (NULL'a izin → akış nullable kalır, `NOT NULL` yapılmadı).
- Mevcut `UNIQUE(username)` kasıten korundu.

### Lock / risk

Düz `CREATE UNIQUE INDEX` (CONCURRENTLY değil) `SHARE` kilidi alır (ACCESS EXCLUSIVE değil): okumalar
sürer, yazmalar build boyunca bekleyebilir; tablo çok küçük → alt-saniye → düz index uygun. CONCURRENTLY
transaction bloğunda çalışamadığı için kullanılmadı. Apply anında normalize-duplicate olursa `begin/commit`
temiz rollback verir.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `supabase/migrations/20260629120000_app_username_normalized_unique.sql` | Yeni migration (RPC normalize gövde + grants + partial unique index) |
| `supabase_setup.sql` | `app_profiles` tablo bloğundan sonra normalize index; mobil kapanış bloğuna RPC (yeni gövde) + grants |
| `docs/project-understanding/06,09,10,11,13` | Statü `GİDERİLDİ — CANLIDA UYGULANDI VE DOĞRULANDI` (2026-06-29); R9 kapatıldı (düşük-seviye izleme kaldı), D15 canlı sonuçla tamamlandı |
| `REFACTOR-GECMISI.md` | Bu bölüm |

`AGENTS.md` değiştirilmedi (migration klasörü kaydı zaten var).

### Doğrulama (canlı, 2026-06-29 — TAMAMLANDI)

- Duplicate ön-kontrol (apply öncesi, read-only): **0 satır**.
- `app_profiles_username_normalized_key`: `indisready/indisvalid/indisunique=true`; tanım `UNIQUE` +
  `lower(btrim(username))` + `WHERE (username IS NOT NULL)` (`pg_indexes`).
- RPC (`pg_get_functiondef(...)`): NULL/boş → `false`; kolon+parametre `lower(btrim(...))`.
- İzinler: `anon`, `authenticated`, `service_role` EXECUTE.
- Username varyasyon: exact / UPPERCASE / dış-boşluklu → "müsait değil".
- Uygulama smoke: gözle görülür regresyon yok.

### Gelecek

Statü `GİDERİLDİ` (canlı apply + doğrulama tamam). Düşük-seviye izleme: RPC↔index normalizasyon paritesi,
index'in kaldırılmaması/INVALID olmaması, yeni username yazma yollarının DB garantisini koruması (bkz.
[10/R9](docs/project-understanding/10-RISKS-AND-TECHNICAL-DEBT.md)). İsteğe bağlı sonraki adım: redundant
`UNIQUE(username)` constraint'ini kaldırmak (normalize index zaten daha katı) — ayrı, kapsamlandırılmış iş.

---

## Bölüm 90 — `user_data` Public SELECT Politikasının Kaldırılması (RLS Güvenlik Düzeltmesi) (2026-06-28)

### Amaç

Public profil özelliğiyle birlikte gelen (Bölüm 23, 2026-04-12) `user_data_select_public` politikasının ham `user_data` blob'unu anonim okumaya açması canlıda doğrulandı ve giderildi. Bu bölüm düzeltmeyi repository geçmişine, yeni ortamlara ve tekrar üretilebilirliğe kaydeder.

### Bulgu (canlı, salt-okunur denetim — 2026-06-28)

- `public.user_data` üzerinde RLS açıktı ve `anon` rolünde `SELECT` grant'i vardı.
- Canlı `user_data_select` politikası "satır sahibi VEYA (ilgili `profiles` satırında `is_public=true` ve `show_profile_info=true`)" mantığındaydı.
- Permissive SELECT politikaları OR ile birleştiğinden, public profil seçen her kullanıcının **tüm** `user_data.data` blob'u (egzersiz/antrenman/program/ölçüm) anon dahil herkese okunabiliyordu.
- Anon rol testi: **7 görünür `user_data` satırı**.

### Düzeltme

- Politika owner-only authenticated'a daraltıldı: `for select to authenticated using ((select auth.uid()) = user_id)`.
- Düzeltme sonrası anon görünür satır: **0**.
- Smoke kontrolleri geçti: public profil sayfası **hata vermeden** açıldı; temeller (avatar, bio, PR, shared workouts, takipçi verisi) sürdü. Ham `user_data`ya bağlı **Programs/Badges/Measurements** bölümü ziyaretçilere artık yüklenmez — **tam özellik parity'si korunmadı**, bilinçli güvenlik daraltması (`profile.html:358-363` sorgusu 0 satır döndürür ve hata sessizce yutulur; uygulama kodu değiştirilmedi).

### Migration tasarımı (idempotent)

`DROP IF EXISTS user_data_select_public` + `DROP IF EXISTS user_data_select` + tek owner-only `CREATE POLICY` kullanıldı; çünkü iki geçerli başlangıç durumu farklıdır: repo snapshot'ında **iki** policy (owner-only `user_data_select` + public `user_data_select_public`), canlıda **tek** birleşik `user_data_select`. İki ad da önce düşürülüp tek policy yeniden yaratıldığında her iki durum aynı güvenli sonuca yakınsar ve tekrar çalıştırılabilir.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `supabase/migrations/20260628120000_restrict_user_data_select.sql` | Yeni tarihli migration (yeni `supabase/migrations/` klasörü) |
| `supabase_setup.sql` | `user_data_select_public` kaldırıldı; `user_data_select` owner-only authenticated'a hizalandı; güvenlik notu eklendi |
| `docs/project-understanding/00,06,09,10,11,13` | Risk "koşullu P0" → "canlıda doğrulandı ve 2026-06-28'de giderildi" |
| `AGENTS.md` | §4 dosya haritasına `supabase/migrations/` satırı + tarih yenileme |
| `REFACTOR-GECMISI.md` | Bu bölüm |

### Gelecek

Public istatistik gerekirse ham blob yerine ayrı ve sınırlı bir veri yüzeyi (view / RPC / ayrı tablo). Ham `user_data` blob'u public select'e tekrar açılmamalı.

---

## Bölüm 89 — Codegen Drift Otomasyonu (2026-06-26)

### Amaç

Preset ve exercise guide generated çıktılarının güncel kalmasını yalnız AI checklist'ine bırakmamak; tek local komut ve GitHub Actions ile drift kontrolünü makine zorlamasına bağlamak.

### Kapsam

- `scripts/check-codegen.js` eklendi. Sırayla şu kontrolleri çalıştırır:
  - `node scripts/build-presets-exercises.js --check`
  - `node scripts/build-ex-guides.js --check`
- `.github/workflows/codegen-check.yml` eklendi. `push` ve `pull_request` olaylarında checkout + Node kurulumu + `node scripts/check-codegen.js` çalıştırır.
- Root `package.json` olmadığı için komut plain Node script olarak bırakıldı; ekstra bağımlılık yok.
- Mobil `npm ci && npm run typecheck` bu hızlı codegen job'ına eklenmedi; mobil typecheck ayrı doğrulama olarak kalır.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `scripts/check-codegen.js` | Preset + ex-guides generated drift kontrollerini tek komutta çalıştırır |
| `.github/workflows/codegen-check.yml` | Push/PR üzerinde birleşik codegen check |
| `AGENTS.md` | Per-generator checklist tek `node scripts/check-codegen.js` satırına indirildi |
| `REFACTOR-GECMISI.md` | Bu bölüm |

### Doğrulama Notları

- `node --check scripts/check-codegen.js` geçti.
- Temiz ağaçta `node scripts/check-codegen.js` exit 0 verdi.
- Kasıtlı generated dosya drift testinde komut exit 1 döndü; dosya geri alındıktan sonra check tekrar yeşile döndü.
- `git diff --check` geçti.

---

## Bölüm 88 — Exercise Guide Mobil Projection Codegen (2026-06-26)

### Amaç

`data/ex-guides.json` kanonik guide kaynağını yalnız Web wrapper'ı için değil, mobilin ince egzersiz içerik projection'ı için de tek üretim hattına bağlamak. Böylece mobil `EX_DESCS`/`EX_PREVIEW` wrapper'larının tükettiği `logwise-mobile/data/generated/ex-content.ts` dosyası elle taşınmış statik port olmaktan çıkıp Web ile aynı kanonik JSON'dan üretilen deterministic çıktıya dönüşür.

### Kapsam

- `scripts/build-ex-guides.js` artık iki generated çıktı üretir:
  - `data/ex-guides.js` — mevcut Web `window.LOGWISE_EX_GUIDES` wrapper'ı.
  - `logwise-mobile/data/generated/ex-content.ts` — mobilin render ettiği ince projection.
- Mobil projection alanları bilinçli olarak sınırlıdır: `summary`, `description`, `tips`, `gif`, `webGuideUrl`.
- `gif`, `media.demoMp4 ?? media.demoWebm ?? null` kuralıyla türetilir.
- `muscles`, `formSteps`, `mistakes`, `progression` ve `web` mobil projection'a dahil edilmez; kas/taksonomi alanı Faz 3 migration sonrasına bırakılır.

### Check Davranışı

`node scripts/build-ex-guides.js --check`, doğrulama yanında iki generated çıktıyı da yeniden hesaplayıp commit'li dosyalarla byte karşılaştırır. Drift varsa komut exit 1 verir ve stale dosyaları listeler.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `scripts/build-ex-guides.js` | Web wrapper + mobil `ex-content.ts` çıktısını üreten ve `--check` ile ikisini de doğrulayan hale getirildi |
| `AGENTS.md` | Exercise guide codegen kontrolü, generated çıktı yasağı ve Bölüm 88 özeti eklendi |
| `REFACTOR-GECMISI.md` | Bu bölüm |

### Doğrulama Notları

- `node scripts/build-ex-guides.js` çalıştırıldığında `data/ex-guides.js` ve `logwise-mobile/data/generated/ex-content.ts` için diff oluşmadı.
- `node scripts/build-ex-guides.js --check` exit 0 verdi ve `145 total, 145 preview-ready, 145 content-ready, 0 media-ready, 0 published` sonucunu korudu.
- `node --check scripts/build-ex-guides.js` geçti.
- `node scripts/build-presets-exercises.js --check` geçti; önceki preset codegen hattında drift oluşmadı.
- `cd logwise-mobile && npm run typecheck` geçti.
- Yeni Web runtime URL'si eklenmediği için `sw.js` bump gerekmedi.

### Sonraki Fazlar

1. Mobil taraftan `--check` sıfır-drift ve typecheck teyidi.
2. CI/pre-merge doğrulamasına `build-ex-guides.js --check` ve `build-presets-exercises.js --check` eklenmesi.
3. Faz 3 taksonomi migration'ı: muscles projection bu migration tamamlandıktan sonra yeniden değerlendirilir.

---

## Bölüm 87 — Preset Exercise Codegen Pilotu (2026-06-26)

### Amaç

Web ve mobilde ayrı dosyalarda tutulan 145 preset hareket listesini tek kanonik kaynağa bağlamak; runtime çıktıları byte-birebir koruyarak Web/Mobil veri drift riskini kapatmak ve ilerideki ortak domain veri çalışmaları için küçük, doğrulanabilir codegen pilotu oluşturmak.

### Kapsam ve İş Bölümü

- **Mobil hazırlık:** `feeef6f` ile mobil taraf `presets-exercises.types.ts`, `generated/presets-exercises.ts` ve wrapper `presets-exercises.ts` ayrımına geçti. Public import API'si değişmedi.
- **Kanonik kaynak:** `data/presets-exercises.json` eklendi. Her kayıt `id`, `name`, opsiyonel `nameEN` ve `categories` alanlarını taşır; sıra mevcut Web/Mobil preset sırasıdır.
- **Generator:** `scripts/build-presets-exercises.js` eklendi. Tek komut iki çıktı üretir:
  - `data/presets-exercises.js` — build'siz Web runtime için `window.LOGWISE_PRESET_EXERCISES`.
  - `logwise-mobile/data/generated/presets-exercises.ts` — mobil wrapper'ın tükettiği typed generated veri.
- **Elle düzenleme sınırı:** `data/presets-exercises.js` ve `logwise-mobile/data/generated/presets-exercises.ts` artık generated çıktıdır; değişiklikler `data/presets-exercises.json` üzerinden yapılır.

### Format Kararları

- Web çıktısı mevcut dosya biçimini korur: CRLF, çift tırnak, çok satırlı obje ve `window.LOGWISE_PRESET_EXERCISES = [...]`.
- Mobil çıktı mevcut `feeef6f` hedefini korur: LF, tek tırnak, satır başına bir obje, `nameEN` yalnız tanımlıysa.
- Generator `--check` modunda iki çıktıyı yeniden üretip commit'li dosyayla byte karşılaştırır; drift varsa exit 1 verir.
- JSON doğrulaması duplicate slug, boş string, slug regex'i, zorunlu alanlar ve beklenmeyen anahtarları yakalar.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/presets-exercises.json` | 145 preset için kanonik Web/Mobil kaynak |
| `scripts/build-presets-exercises.js` | Web JS + mobil TS generated çıktı üretimi ve `--check` drift kontrolü |
| `data/presets-exercises.js` | Generator hedefi; mevcut runtime formatı byte-birebir korunur |
| `logwise-mobile/data/generated/presets-exercises.ts` | Generator hedefi; mobil `feeef6f` formatı byte-birebir korunur |
| `sw.js` | Runtime'da kullanılmayan kanonik JSON precache'ten çıkarıldı; cache `logwise-v49` |
| `docs/PRESET-EXERCISE-EKLEME.md` | Yeni preset akışı JSON kaynak + generator komutlarına taşındı |
| `AGENTS.md` | Preset codegen kuralı, dosya haritası, seans sonu kontrolü ve yasak listesi güncellendi |

### Doğrulama Notları

- `node scripts/build-presets-exercises.js --check` sonucu `145 records, 2 outputs` olarak geçti.
- Generator, mevcut `data/presets-exercises.js` ve `logwise-mobile/data/generated/presets-exercises.ts` dosyalarını değiştirmeden doğruladı.
- `data/presets-exercises.json` yalnız codegen girdisi olduğu ve Web runtime tarafından fetch edilmediği için `PRECACHE_URLS` dışında bırakıldı; Web runtime çıktısı `data/presets-exercises.js` precache'te kalır.
- Web syntax kontrolü için `node --check scripts/build-presets-exercises.js`, `node --check data/presets-exercises.js` ve `node --check sw.js` çalıştırıldı.
- Mobil taraf için `cd logwise-mobile && npm run typecheck` ve `npm test -- --runInBand --passWithNoTests --no-cache` yeşil doğrulandı.
- `node scripts/build-ex-guides.js --check` ile mevcut guide kapsamı değişmeden kaldı.

### Sonraki Fazlar

1. CI veya pre-merge check içine `node scripts/build-presets-exercises.js --check` eklemek.
2. Mobil tarafın aynı check'i kendi doğrulamasında çalıştırması.
3. Kategori/kas taksonomisi için bu pilotun üstüne dual-read → slug-only write → idempotent migration → contract-last sırasıyla ilerlemek.

---

## Bölüm 86 — Web/Mobil Monorepo Entegrasyonu (2026-06-26)

### Amaç

Aynı GitHub reposunda ayrı uzun ömürlü branch ve çalışma kopyalarında gelişen build'siz Web uygulaması ile Expo/React Native mobil uygulamasını tek güncel Git ağacında birleştirmek; Web'in güncel SEO/guide altyapısını geriye götürmeden mobil kaynakları, mobil mimari belgelerini ve Supabase `app_` şemasını korumak.

### Kaynak ve Entegrasyon Kararları

- **Web tabanı:** `codex/exercise-guide-data-foundation` branch'inin `2e997ec` checkpoint'i; `origin/master` üstünde lineer 26 Web commit'i.
- **Mobil kaynak:** `mobile-design-system` branch'inin temiz ve push edilmiş `8c9b4a5` checkpoint'i.
- **Mobil ağaç:** `logwise-mobile/` altındaki 136 dosya güncel mobil checkpoint'ten seçici olarak eklendi. Mobil klasör `master`/Web ağacında daha önce bulunmadığı için bu bir dizin eklemesidir.
- **Mobil belgeler:** `docs/mobile-design-system/` altındaki ürün kararları, ekran spesifikasyonları ve prototipler korundu.
- **Supabase:** Mobil `app_profiles`, `app_exercises`, `app_programs`, `app_program_days`, `app_workouts`, `app_sets` ve `app_day_meta` tabloları mevcut Web şemasının sonuna namespace'li, additive blok olarak eklendi. Mevcut Web tabloları değiştirilmedi.
- **Web kök triyajı:** Mobil branch'teki eski `blog/`, eski Learn kaynakları, landing, sitemap ve `scripts/build-blog.js` sürümleri alınmadı. Güncel Web `learn/` + `ogren/` + Library generator hattı korundu.
- **Temizlik kapsamı:** Mobil branch'in eski preset öneri/local-server dosya silmeleri entegrasyonla ilgisiz olduğu için uygulanmadı.
- **AGENTS kapsamı:** Web'e özgü JSX/Babel yasağı monorepo sonrası açıkça Web köküyle sınırlandı; Expo/TSX toolchain'i yalnız `logwise-mobile/` altında izinli hale getirildi.

### Cloudflare Deploy Sınırı

Web asset konfigürasyonu repo kökünü (`assets.directory: "."`) servis ettiği için mobil kaynakların ve iç geliştirme belgelerinin deploy edilmesi yeni `.assetsignore` ile engellendi. `logwise-mobile/`, `docs/`, `scripts/`, `blog-content/`, Worker kaynakları, SQL/refactor belgeleri ve yerel yardımcı dosyalar Web asset manifestine girmez.

### Sonraki Fazlar

1. `presets-exercises` için mevcut Web/Mobil runtime çıktılarını değiştirmeyen kanonik JSON + deterministik codegen pilotu.
2. `--check` modu ve CI drift kontrolü.
3. Kategori/kas taksonomisi için dual-read, slug-only write ve Web local/profile + Mobil Supabase/AsyncStorage'ı kapsayan idempotent kalıcı-veri migration'ı.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `logwise-mobile/` | `8c9b4a5` mobil checkpoint'inden Expo uygulamasının tamamı |
| `docs/mobile-design-system/` | Mobil karar/spec/prototip belgeleri |
| `supabase_setup.sql` | Namespace'li mobil `app_` tablo, index, FK, trigger ve RLS politikaları |
| `.assetsignore` | Mobil ve iç monorepo kaynaklarının Cloudflare Web deploy'undan çıkarılması |
| `AGENTS.md` | Monorepo kapsamı, Web/Mobil kural ayrımı, dosya haritası ve worktree iş akışı |
| `logwise-mobile/package.json`, `package-lock.json` | Expo SDK 54 resmi şablonuyla uyumlu TypeScript `~5.9.2` (`5.9.3` lock) |
| `REFACTOR-GECMISI.md` | Entegrasyon kaynağı, triyaj kararları ve sonraki fazlar |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` sonucu `145 total, 145 preview-ready, 145 content-ready, 0 media-ready, 0 published` olarak doğrulandı.
- `node scripts/build-blog.js` başarıyla çalıştı; üretilen Web çıktılarında satır sonları dışında içerik farkı oluşmadı.
- Mobil checkpoint'teki TypeScript 5.3, Expo SDK 54 `module: "preserve"` ayarını okuyamadığı için resmi SDK 54 şablonundaki `~5.9.2` aralığına yükseltildi; TypeScript 5.9.3 ile `tsc --noEmit` geçti.
- Mobil Jest komutu `--runInBand --passWithNoTests --no-cache` ile geçti; mevcut checkpoint henüz test dosyası içermiyor.
- `.assetsignore` kalıpları Git'in aynı-format ignore matcher'ıyla doğrulandı: mobil/iç dosyalar ignore edilirken Web runtime dosyaları korunuyor. Wrangler 4.83 dry-run, Codex sandbox'ının esbuild alt sürecine yol erişimi vermemesi nedeniyle normal host/CI üzerinde ayrıca çalıştırılmalı.
- Eklenen 7 mobil/prototip `.js` dosyası `node --check` kontrolünü geçti. Yeni Web runtime URL'si eklenmediği için `sw.js` cache bump gerekmez.

---

## Bölüm 85 — Exercise Guide Enrichment Batch 21 ve Tam İçerik Kapsamı (2026-06-20)

### Amaç

Son iki eksik preset olan Superman ve Ay Yürüyüşü kayıtlarını tam guide seviyesine taşımak; Arch Hold/Superman tekrar standardını ayırmak, belirsiz `moonwalk` presetini tarihsel repo bağlamına göre doğru kardiyo cihazına bağlamak ve enrichment fazını 145/145 tam preview/content kapsamıyla kapatmak.

### Kapsam

- Superman
- Ay Yürüyüşü / Moonwalk (air-walker/glider kardiyo cihazı)

### İçerik Kararları

- **Superman standardı:** Yüzüstü pozisyonda kolların, göğsün ve bacakların eşzamanlı kaldırılıp indirildiği dinamik tekrar standardı kullanıldı. Maksimum bel kavsi ve kaldırma yüksekliği yerine nötr boyun, küçük tekrarlanabilir menzil ve kontrollü tempo önceliklendirildi.
- **Arch Hold ayrımı:** `arch-hold` süreli statik calisthenics beden şekli, `superman` ise dinamik tekrar hareketi olarak ayrı yük geçmişlerine bağlandı. İki kaydın related ve tracking alanları bu ayrımı açıkça taşır.
- **Moonwalk anlamı:** Git geçmişindeki Kardiyo kategorisi ve “Eliptik/özel yürüyüş” açıklaması incelendi. Preset dans adımı olarak değil, zıt yönde kayan pedlere sahip air-walker/glider kardiyo cihazı olarak kilitlendi.
- **Moonwalk güvenlik ve tracking:** Sabit tutacakla kontrollü binme/inme, rahat adım boyu ve yavaşlama standardı yazıldı. Cihaz modeli, direnç, süre, kadans, RPE, adım boyu ve hareketli kol kullanımı birlikte takip edilir; air-walker, elliptical ve treadmill ekran verileri doğrudan karşılaştırılmaz.
- **Legacy kısa açıklama:** Uygulama egzersiz listesinde kullanılan `data/ex-descriptions.js` moonwalk metni de “air-walker/glider cihazında kayar pedli kardiyo” olarak güncellendi; canonical guide ile legacy liste anlamı eşitlendi.
- **Readiness kapanışı:** 145 total, 145 preview-ready, 145 content-ready, 0 media-ready, 0 published. Tüm kayıtlarda dolu formSteps, mistakes, tips, progression, anatomik kas slug'ları ve web metadata bulunur.
- **Global metadata kapanışı:** 145 kayıtlık final taramada Bench Press İngilizce meta title'ının 66 karakterle 65 sınırını tek başına aştığı görüldü. Sondaki `| LogWise` kaldırıldı; tüm meta title/description alanları sırasıyla 65/180 sınırına getirildi. `publish: false` pilot HTML legacy üretimde kaldığı için canlı Bench Press sayfası değişmedi.
- **Sonraki faz:** Metin enrichment tamamlandı. Bir sonraki çalışma, versiyonlu MP4/poster/muscle-map üretimi, R2 yükleme/header doğrulaması, `mediaReady` geçişi ve ardından `publish` kontrollü web cutover'dır.
- **Service worker:** Yeni statik URL veya runtime mantığı eklenmedi; mevcut veri dosyalarının içeriği değiştiği için `docs/SW-VERSION-BUMP.md` uyarınca ek cache bump yapılmadı.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Superman ve Moonwalk için tam TR/EN guide, anatomik kas ve web içeriği |
| `data/ex-guides.js` | Kanonik JSON'dan yeniden üretilen 145/145 wrapper |
| `data/ex-descriptions.js` | Moonwalk legacy kısa açıklamasının air-walker cihaz standardıyla eşitlenmesi |
| `library/exercises.html` | Güncellenen Moonwalk kısa açıklamasıyla yeniden üretilen Library dizini |
| `AGENTS.md` | Enrichment kapanış özeti ve bölüm sayısı |
| `REFACTOR-GECMISI.md` | Final batch, anlam kararları ve tam kapsam doğrulama kaydı |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` sonucu `145 total, 145 preview-ready, 145 content-ready, 0 media-ready, 0 published` olmalı.
- 145 kaydın tamamı `isContentReady` kontrolünü geçmeli; draft kas grubu slug'ı kalmamalı.
- Final batch'te `superman` ve `moonwalk` içerikleri ile global kapanış için yalnız Bench Press İngilizce meta title'ı değişmeli; `moonwalk.previewReady` false → true olmalı.
- `data/ex-descriptions.js` içindeki TR/EN Moonwalk kısa açıklamaları air-walker anlamını taşımalı.
- `library/exercises.html` Moonwalk kartı güncellenen air-walker kısa açıklamasını göstermeli.
- Related exercise slug'ları preset kataloğunda bulunmalı; meta title 65 ve meta description 180 karakter sınırını aşmamalı.
- JSON ile web wrapper birebir eşleşmeli; değişen tüm JS dosyaları syntax kontrolünden geçmeli.
- `node scripts/build-blog.js` tüm Learn/Library/sitemap çıktılarını hatasız üretmeli.
- Bench Press, Squat ve Deadlift Library HTML dosyaları `HEAD` ile byte-for-byte aynı kalmalı.

---

## Bölüm 84 — Exercise Guide Enrichment Batch 20 (2026-06-20)

### Amaç

Altı row/pullover deseni ile Arch Hold'u tam guide seviyesine taşımak; ring instabilitesinin üstünlüğü, row hareketlerinde zorunlu maksimum skapula sıkıştırma, T-bar makine/landmine belirsizliği, pullover için zorunlu baş-altı menzili ve Arch Hold'da maksimum bel kavsi hakkındaki legacy cue'ları düzeltmek.

### Kapsam

- Ring Row
- Seal Row
- Meadow Row
- Single Arm Row Machine
- T-Bar Row
- Pullover
- Arch Hold

### İçerik Kararları

- **Ring Row:** Eşit ring yüksekliği, dikey kayış, nötr tutuş ve ayarlanabilir gövde açısı standardı oluşturuldu. İnstabilite ek koordinasyon talebi olarak yazıldı; sabit bar row'a otomatik üstünlük sayılmadı.
- **Seal Row:** Sağlam biçimde yükseltilmiş düz bench ve barbell standardı kilitlendi. Bench yüksekliği, bar tutuşu ve göğüs temas noktası tracking alanına eklendi; destek momentumun tamamını sıfırlayan bir yapı olarak sunulmadı.
- **Meadow Row:** Landmine'a sabitlenmiş barın plaka tarafındaki sleeve'ini tek elle çekme standardı kullanıldı. Plaka çapı, duruş, hinge açısı ve doğal gövde rotasyonu performans bağlamına eklendi.
- **Single Arm Row Machine:** Bağımsız tutacaklı göğüs destekli makine varyasyonu kilitlendi. Makine modeli, koltuk, tutuş ve taraf bazlı yük/RIR ayrı takip edilir; maksimum skapula retraksiyonu ve iki tarafa zorunlu eşit tekrar kaldırıldı.
- **T-Bar Row:** Legacy `Lying_T-Bar_Row` görseliyle uyumlu göğüs destekli T-bar makinesi standardına bağlandı ve landmine T-bar row'dan ayrıldı. Sabit 45 derece gövde açısı kaldırıldı; makine pedi, tutuş ve göğüs teması temel ölçüt yapıldı.
- **Dumbbell Pullover:** Üst sırt bench'e enlemesine destekli, tek dumbbellı iki elle kavrama standardı kullanıldı. Yalnız kürek kemiklerinin benche değmesi ve dumbbellın mutlaka baş altına inmesi cue'ları kaldırıldı; alt menzil omuz kontrolüne bağlandı.
- **Arch Hold:** Yüzüstü, kollar baş üstünde ve bacaklar birleşik süreli calisthenics beden şekli olarak tanımlandı. Maksimum bel kavsi yerine uzun tam-vücut gerilimi ve nötr boyun önceliklendirildi; dinamik Superman tekrarlarından ayrıldı.
- **Readiness sonucu:** 145 total, 144 preview-ready, 143 content-ready, 0 media-ready, 0 published.
- **Service worker:** Yeni statik URL veya runtime mantığı eklenmedi; mevcut guide verisi ve wrapper içeriği değiştiği için ek cache bump yapılmadı.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Altı row/pullover ve bir arch hareketi için tam TR/EN guide ve anatomik kas içeriği |
| `data/ex-guides.js` | Kanonik JSON'dan yeniden üretilen wrapper |
| `AGENTS.md` | Refactor özeti ve bölüm sayısı |
| `REFACTOR-GECMISI.md` | Batch kapsamı, içerik kararları ve doğrulama kaydı |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` sonucu `145 total, 144 preview-ready, 143 content-ready, 0 media-ready, 0 published` olmalı.
- Yedi batch kaydı `isContentReady` kontrolünü geçmeli; `publish` ve `mediaReady` false kalmalı.
- Yalnızca hedeflenen yedi guide kaydı değişmeli; related exercise slug'ları preset kataloğunda bulunmalı.
- Meta title 65, meta description 180 karakter sınırını aşmamalı ve JSON ile web wrapper birebir eşleşmeli.
- `node scripts/build-blog.js` tüm Learn/Library/sitemap çıktılarını hatasız üretmeli.
- Bench Press, Squat ve Deadlift Library HTML dosyaları `HEAD` ile byte-for-byte aynı kalmalı.

---

## Bölüm 83 — Exercise Guide Enrichment Batch 19 (2026-06-20)

### Amaç

Yedi ön kol, kavrama ve bar çekiş hareketini tam guide seviyesine taşımak; dead hang için zorunlu aktif depresyon, wrist hareketlerinin tedavi/önleme garantisi, typewriter pull-up'ın tek kol çekiş sayılması ve Australian pull-up'ta maksimum skapula sıkıştırma hakkındaki legacy cue'ları düzeltmek.

### Kapsam

- Reverse Curl
- Dead Hang
- Wrist Extensions
- Wrist Curls
- Chin Up Hold
- Typewriter Pull Up
- Australian Pull Up

### İçerik Kararları

- **Reverse Curl:** Düz barbell ve pronasyonlu tutuş standardı kilitlendi. Bilek konumu ana takip alanı oldu; daha düşük yük normal kabul edildi ve hareket yalnız ön kol izolasyonu olarak yazılmadı.
- **Dead Hang:** Düz dirsekli süreli asılma standardı kullanıldı. Omuz pozisyonu ağrısız pasif ile hafif destekli aralıkta kişiselleştirildi; zorunlu maksimum depresyon `active-hang` kaydına bırakıldı ve iki varyasyonun süreleri ayrı tutuldu.
- **Wrist Extensions:** Bench destekli, çift dumbbell ve avuç aşağı standart oluşturuldu. Zorunlu tam menzil ve tenisçi dirseği tedavi/önleme garantisi kaldırıldı; belirti durumu tracking alanına eklendi.
- **Wrist Curls:** Bench destekli, çift dumbbell ve avuç yukarı standart oluşturuldu. Parmaklara yuvarlatılan finger curl ayrı varyasyon sayıldı; wrist curl yükü genel kavrama gücünün tek ölçütü olarak kullanılmadı.
- **Chin Up Hold:** Supine tutuşlu tepe izometrisi, nötr boyun ve sabit çene-dirsek-omuz açısıyla tanımlandı. Tepeye kontrolsüz sıçrama kaldırıldı; izometrinin tam chin-up menzilinin yerine geçmediği belirtildi.
- **Typewriter Pull Up:** Geniş pronasyonlu tutuşta tepe konumunda yana geçiş standardı yazıldı. Destek kolunun yük taşımaya devam ettiği açıklandı; tekrar tanımı tek taraf geçişi veya tam sağ-sol döngüsü olarak antrenman öncesinde kilitlenir.
- **Australian Pull Up:** Alçak sabit bar altındaki bodyweight row standardına bağlandı ve `ring-row`dan ayrıldı. Bar yüksekliği, ayak konumu, diz açısı ve göğüs çekiş noktası birlikte takip edilir; maksimum skapula sıkıştırma zorunlu tutulmadı.
- **Readiness sonucu:** 145 total, 144 preview-ready, 136 content-ready, 0 media-ready, 0 published.
- **Service worker:** Yeni statik URL veya runtime mantığı eklenmedi; mevcut guide verisi ve wrapper içeriği değiştiği için ek cache bump yapılmadı.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Yedi ön kol/kavrama/bar çekiş hareketi için tam TR/EN guide ve anatomik kas içeriği |
| `data/ex-guides.js` | Kanonik JSON'dan yeniden üretilen wrapper |
| `AGENTS.md` | Refactor özeti ve bölüm sayısı |
| `REFACTOR-GECMISI.md` | Batch kapsamı, içerik kararları ve doğrulama kaydı |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` sonucu `145 total, 144 preview-ready, 136 content-ready, 0 media-ready, 0 published` olmalı.
- Yedi batch kaydı `isContentReady` kontrolünü geçmeli; `publish` ve `mediaReady` false kalmalı.
- Yalnızca hedeflenen yedi guide kaydı değişmeli; related exercise slug'ları preset kataloğunda bulunmalı.
- Meta title 65, meta description 180 karakter sınırını aşmamalı ve JSON ile web wrapper birebir eşleşmeli.
- `node scripts/build-blog.js` tüm Learn/Library/sitemap çıktılarını hatasız üretmeli.
- Bench Press, Squat ve Deadlift Library HTML dosyaları `HEAD` ile byte-for-byte aynı kalmalı.

---

## Bölüm 82 — Exercise Guide Enrichment Batch 18 (2026-06-20)

### Amaç

Yedi cable, preacher ve incline curl varyasyonunu tam guide seviyesine taşımak; saf biceps izolasyonu, sürekli kablo gerilimi, sabit üst kol, zorunlu maksimum alt uzama ve tepe sıkışmasının kalite garantisi olduğu hakkındaki legacy cue'ları düzeltmek.

### Kapsam

- One Arm Cable Curl
- Drag Curl
- Preacher Curl
- Machine Preacher Curl
- Preacher Hammer Curl
- Incline Dumbell Curl
- Concentration Curl

### İçerik Kararları

- **One Arm Cable Curl:** Alçak makara ve tek el tutacağı standardı kilitlendi. Makara yüksekliği, makaradan uzaklık ve taraf başına yük/menzil/RIR ayrı takip edilir; kablo dış yükü sabit biceps torku olarak sunulmadı.
- **Drag Curl:** Barbell, gövdeye yakın dikey bar yolu ve geriye giden dirsekler varyasyonun tanımlayıcı özellikleri yapıldı. Üst kolu sabit tutma cue'su kaldırıldı; klasik curl'den farklı üst bitiş noktası ayrı performans bağlamı olarak kabul edildi.
- **Preacher Curl:** Kayıt EZ-bar ve preacher bench standardına bağlandı. Koltuk/pad ayarı, EZ-bar kıvrımı ve kontrollü alt menzil takip edilir; pad desteği saf biceps izolasyonu veya zorunlu dirsek kilidi olarak yorumlanmadı.
- **Machine Preacher Curl:** Makine modeli, koltuk ve başlangıç ayarı performans bağlamına eklendi. Sabit yol otomatik güvenlik veya izolasyon sayılmadı; farklı makine direnç profilleri ayrı varyasyonlar gibi takip edilir.
- **Preacher Hammer Curl:** Çift dumbbell ve nötr tutuş standardı kilitlendi. Brachialis/brachioradialis vurgusu bicepsin hareketten tamamen çıktığı iddiasına dönüştürülmedi; taraflar ayrı yük, tekrar ve RIR ile izlenir.
- **Incline Dumbell Curl:** Eğik bench ve çift dumbbell standardı kullanıldı. Bench açısı omuz ekstansiyonunu belirleyen ana tracking alanı oldu; dirsekleri gövdenin gerisinde zorla sabitleme ve maksimum alt uzama zorunluluğu kaldırıldı.
- **Concentration Curl:** Oturarak tek dumbbell ve iç uylukta üst kol desteği standardı yazıldı. Dirsek noktasını uyluğa bastırma kaldırıldı; üst kol desteği saf izolasyon değil momentum sınırlayıcı olarak tanımlandı.
- **Readiness sonucu:** 145 total, 144 preview-ready, 129 content-ready, 0 media-ready, 0 published.
- **Service worker:** Yeni statik URL veya runtime mantığı eklenmedi; mevcut guide verisi ve wrapper içeriği değiştiği için ek cache bump yapılmadı.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Yedi cable/preacher/incline curl varyasyonu için tam TR/EN guide ve anatomik kas içeriği |
| `data/ex-guides.js` | Kanonik JSON'dan yeniden üretilen wrapper |
| `AGENTS.md` | Refactor özeti ve bölüm sayısı |
| `REFACTOR-GECMISI.md` | Batch kapsamı, içerik kararları ve doğrulama kaydı |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` sonucu `145 total, 144 preview-ready, 129 content-ready, 0 media-ready, 0 published` olmalı.
- Yedi batch kaydı `isContentReady` kontrolünü geçmeli; `publish` ve `mediaReady` false kalmalı.
- Yalnızca hedeflenen yedi guide kaydı değişmeli; related exercise slug'ları preset kataloğunda bulunmalı.
- Meta title 65, meta description 180 karakter sınırını aşmamalı ve JSON ile web wrapper birebir eşleşmeli.
- `node scripts/build-blog.js` tüm Learn/Library/sitemap çıktılarını hatasız üretmeli.
- Bench Press, Squat ve Deadlift Library HTML dosyaları `HEAD` ile byte-for-byte aynı kalmalı.

---

## Bölüm 81 — Exercise Guide Enrichment Batch 17 (2026-06-20)

### Amaç

Dört triceps izolasyonu ile üç curl varyasyonunu tam guide seviyesine taşımak; çakışan overhead ekipman tanımları, zorunlu maksimum esneme, tek triceps başı izolasyonu, sabit kablo gerilimi ve maksimum tepe sıkışması hakkındaki legacy iddiaları düzeltmek.

### Kapsam

- Overhead Cable Triceps Extension
- Kickback
- Overhead Triceps Extension
- Skull Crusher
- Spider Curl
- Zottman Curl
- Rope Hammer Curl

### İçerik Kararları

- **Overhead ekipman ayrımı:** `overhead-cable-triceps-extension` yüksek makarada rope ile ayakta yapılan varyasyona, `overhead-triceps-extension` ise iki elle tek dumbbell kullanılan varyasyona bağlandı. Makara/aparat değişimleri ile dumbbell kayıtları ayrı performans geçmişleri olarak tutulur.
- **Legacy görsel uyumu:** Dumbbell standardına bağlanan `overhead-triceps-extension` için `data/ex-images.js` fallback'i kablo görselinden `Seated_Triceps_Press` kaynağına taşındı. Ağ erişimi kapalı olduğundan uzak URL HEAD doğrulaması bu seansta yapılamadı.
- **Overhead menzili:** Dirsekleri zorla kulaklara yapıştırma ve maksimum alt esneme zorunluluğu kaldırıldı. Üst kol açısı, gövde kontrolü ve ağrısız alt menzil birlikte standardize edildi; kablo dış yükü sabit eklem torku olarak sunulmadı.
- **Dumbbell Kickback:** Gövdenin yere tam paralel olması zorunlu tutulmadı. Üst kolun yerçekimine göre konumu ve kontrollü bitiş temel ölçüt yapıldı; hareket medial/lateral triceps başı izolasyonu olarak yazılmadı.
- **Skull Crusher:** EZ-bar ve düz bench standardı kilitlendi. Alın önü ile başın hafif arkası farklı ama geçerli bitişler olarak tanımlandı; tek doğru alt nokta, zorunlu dar dirsek veya EZ-barın herkes için daha rahat olduğu iddia edilmedi.
- **Spider Curl:** Göğüs destekli eğik bench ve EZ-bar standardı kullanıldı. Bench açısı, bar tutuşu ve göğüs teması tracking alanına eklendi; üst noktanın otomatik maksimum biceps gerilimi sağladığı iddiası kaldırıldı.
- **Zottman Curl:** Supine yükseliş, kontrollü üst dönüş ve prone iniş açıkça ayrıldı. Yükü pronasyonlu iniş kontrolü sınırlar; dönüş zamanı ve iniş temposu performans bağlamına eklendi.
- **Rope Hammer Curl:** Alt makara, rope ve nötr tutuş standardı kilitlendi. Rope uçlarını ayırmak opsiyonel tutuldu; kablo dış yükü sabit kas gerilimiyle eşitlenmedi ve biceps katkısı yok sayılmadı.
- **Readiness sonucu:** 145 total, 144 preview-ready, 122 content-ready, 0 media-ready, 0 published.
- **Service worker:** Yeni statik URL veya runtime mantığı eklenmedi; mevcut veri dosyalarının içeriği değiştiği için `docs/SW-VERSION-BUMP.md` uyarınca ek cache bump yapılmadı.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Yedi triceps/curl hareketi için tam TR/EN guide ve anatomik kas içeriği |
| `data/ex-guides.js` | Kanonik JSON'dan yeniden üretilen wrapper |
| `data/ex-images.js` | Dumbbell overhead triceps extension için varyasyonla uyumlu legacy fallback |
| `AGENTS.md` | Refactor özeti ve bölüm sayısı |
| `REFACTOR-GECMISI.md` | Batch kapsamı, içerik kararları ve doğrulama kaydı |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` sonucu `145 total, 144 preview-ready, 122 content-ready, 0 media-ready, 0 published` olmalı.
- Yedi batch kaydı `isContentReady` kontrolünü geçmeli; `publish` ve `mediaReady` false kalmalı.
- Yalnızca hedeflenen yedi guide kaydı değişmeli; related exercise slug'ları preset kataloğunda bulunmalı.
- Meta title 65, meta description 180 karakter sınırını aşmamalı ve JSON ile web wrapper birebir eşleşmeli.
- `data/ex-images.js`, guide wrapper ve generator scriptleri syntax kontrolünden geçmeli.
- `node scripts/build-blog.js` tüm Learn/Library/sitemap çıktılarını hatasız üretmeli.
- Bench Press, Squat ve Deadlift Library HTML dosyaları `HEAD` ile byte-for-byte aynı kalmalı.
- `Seated_Triceps_Press` legacy fallback URL'si ağ erişimi olan bir ortamda ayrıca HEAD/render kontrolünden geçirilmeli.

---

## Bölüm 80 — Exercise Guide Enrichment Batch 16 (2026-06-20)

### Amaç

Beş şınav/dip deseni ile iki triceps hareketini tam guide seviyesine taşımak; bench dip'in otomatik kolaylığı, ring instabilitesinin üstünlüğü, pseudo planche push-up'ın düz kol planche ile eşitliği, tek triceps başı izolasyonu ve JM Press için sabit orta-alt göğüs bar yolu hakkındaki legacy iddiaları düzeltmek.

### Kapsam

- Pike Push Up
- Dip Machine
- Bench Dips
- Ring Push Up
- Pseudo Planche Push Up
- Cross Body Triceps Extension
- JM Press

### İçerik Kararları

- **Pike Push Up:** Ters V gövde açısı, başın ellerin hafif önüne ilerlediği kontrollü yol ve kalça yüksekliği standartlaştırıldı. Başın zemine teması zorunlu tutulmadı; el-ayak mesafesi ile el/ayak yükseltisi tracking alanına eklendi.
- **Dip Machine standardı:** Guide, tutacakların aşağı bastırıldığı oturarak dip press makinesine bağlandı. Destekli paralel bar makinesiyle aynı kayıt altında karşılaştırılmadı; makine modeli, koltuk ayarı ve başlangıç açısı performans bağlamına eklendi.
- **Bench Dips:** Hareket paralel bar dipinin otomatik olarak kolay veya risksiz regresyonu sayılmadı. Omuz ekstansiyonu kişisel menzille sınırlandı; sabit bench, el-ayak konumu ve diz bükülme düzeyi standardize edildi.
- **Ring Push Up:** Eşit ring yüksekliği, dikey kayış ve kontrollü ring açıklığı temel kurulum yapıldı. Ring turn-out opsiyonel tutuldu; instabilitenin koordinasyon talebini artırdığı fakat daha iyi kuvvet veya hipertrofi sonucunu garanti etmediği belirtildi.
- **Pseudo Planche Push Up:** İlerleme ölçütü elin kalçaya yakınlığından çok omuz-bilek yatay mesafesine bağlandı. Hareket bent-arm press olarak sınıflandırıldı; düz kol planche becerisiyle aynı kabul edilmedi ve bilek açısı kişisel konfora bırakıldı.
- **Cross Body Triceps Extension:** Karşı taraftaki omuz yüksekliği çevresindeki makaradan çapraz-aşağı tek kol kablo yolu kilitlendi. Makara yüksekliği ve üst kol konumu ayrı takip edilir; kas hissi tek bir triceps başının tamamen izole edildiğinin kanıtı sayılmaz.
- **JM Press:** Hareket close-grip bench press ile lying triceps extension arasında ayrı bir teknik olarak tanımlandı. Orta-alt göğüs bar yolu kaldırıldı; üst göğüs ile boğaz önü arasındaki kontrollü, kişiye göre tekrarlanabilir iniş hattı kullanıldı ve boyun teması zorunlu tutulmadı.
- **Readiness sonucu:** 145 total, 144 preview-ready, 115 content-ready, 0 media-ready, 0 published.
- **Service worker:** Yeni statik URL veya runtime mantığı eklenmedi; mevcut `data/ex-guides.js` wrapper'ı yeniden üretildiği için ek cache bump yapılmadı.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Yedi şınav/dip/triceps hareketi için tam TR/EN guide ve anatomik kas içeriği |
| `data/ex-guides.js` | Kanonik JSON'dan yeniden üretilen wrapper |
| `AGENTS.md` | Refactor özeti ve bölüm sayısı |
| `REFACTOR-GECMISI.md` | Batch kapsamı, içerik kararları ve doğrulama kaydı |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` sonucu `145 total, 144 preview-ready, 115 content-ready, 0 media-ready, 0 published` olmalı.
- Yedi batch kaydı `isContentReady` kontrolünü geçmeli; `publish` ve `mediaReady` false kalmalı.
- Yalnızca hedeflenen yedi guide kaydı değişmeli; related exercise slug'ları preset kataloğunda bulunmalı.
- Meta title 65, meta description 180 karakter sınırını aşmamalı ve JSON ile web wrapper birebir eşleşmeli.
- `node scripts/build-blog.js` tüm Learn/Library/sitemap çıktılarını hatasız üretmeli.
- Bench Press, Squat ve Deadlift Library HTML dosyaları `HEAD` ile byte-for-byte aynı kalmalı.

---

## Bölüm 79 — Exercise Guide Enrichment Batch 15 (2026-06-20)

### Amaç

Üç fly ve dört şınav varyasyonunu tam guide seviyesine taşımak; sabit kas gerilimi, zorunlu bank açısı, üst göğüs izolasyonu, kusursuz elmas el yerleşimi ve daha derin menzilin otomatik olarak daha iyi olduğu hakkındaki legacy cue'ları düzeltmek.

### Kapsam

- Chest Fly
- Incline Dumbell Fly
- Incline Cable Fly
- Decline Push Up
- Archer Push Up
- Diamond Push Up
- Deficit Push Up

### İçerik Kararları

- **Chest Fly standardı:** Ayrı `dumbell-fly`, `pec-deck` ve `cable-crossover` kayıtları bulunduğu için bu guide tutacaklı chest-fly makinesine bağlandı. Dirsek/önkol pedli varyasyon `pec-deck` altında takip edilir; makine modeli, koltuk ayarı ve başlangıç açısı performans bağlamına eklendi.
- **Fly menzili:** Üç fly varyasyonunda derin esneme zorunluluğu kaldırıldı. Alt nokta, omuz başının kontrol altında kaldığı ağrısız menzil olarak tanımlandı; dirsek açısının büyük ölçüde sabit tutulması fly ile press ayrımını korur.
- **Incline Dumbell Fly:** Sabit `30-45 derece` reçetesi kaldırıldı. Bank açısı omuz konforu ve tekrarlanabilir hareket çizgisine göre seçilir; klaviküler göğüs katkısı artabilse de üst göğüs tamamen izole edilmiş sayılmaz.
- **Incline Cable Fly:** Bank açısı ile makara yüksekliği birlikte takip edilir. Kablonun hareket boyunca dış yük sağlaması, kas veya eklem torkunun her noktada sabit olduğu iddiasına dönüştürülmedi.
- **Decline Push Up:** Ayak yüksekliği yük dağılımını ve denge gereksinimini değiştirir; daha yüksek ayak otomatik olarak daha iyi veya yalnızca üst göğüs odaklı kabul edilmedi. El genişliği, ayak yüksekliği ve menzil birlikte standardize edilir.
- **Archer Push Up:** Destek kolunun yük taşımaya devam ettiği açıkça yazıldı; hareket tek kol şınavı olarak sınıflandırılmadı. Taraf başına tekrar, el genişliği, destek kolu açısı ve göğüs derinliği ayrı takip edilir.
- **Diamond Push Up:** Başparmak ve işaret parmaklarıyla kusursuz elmas oluşturma zorunluluğu kaldırıldı. Bilek ve dirsek konforunu koruyan dar el yerleşimi temel standart yapıldı; tam menzil kişiye özel kabul edildi.
- **Deficit Push Up:** Eşit, kaymaz ve sabit destek kurulumu tanımlandı. Ek derinlik bir seçenek olarak tutuldu; omuz kontrolünü aşan menzil daha iyi tekrar sayılmadı ve destek yüksekliği tracking alanına eklendi.
- **Readiness sonucu:** 145 total, 144 preview-ready, 108 content-ready, 0 media-ready, 0 published. Daha önce preview içeriği boş olan `chest-fly` bu batch ile `previewReady: true` oldu.
- **Service worker:** Yeni statik URL veya runtime mantığı eklenmedi; mevcut `data/ex-guides.js` wrapper'ı yeniden üretildiği için ek cache bump yapılmadı.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Yedi fly/şınav varyasyonu için tam TR/EN guide ve anatomik kas içeriği |
| `data/ex-guides.js` | Kanonik JSON'dan yeniden üretilen wrapper |
| `AGENTS.md` | Refactor özeti, readiness toplamı ve bölüm sayısı |
| `REFACTOR-GECMISI.md` | Batch kapsamı, içerik kararları ve doğrulama kaydı |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` sonucu `145 total, 144 preview-ready, 108 content-ready, 0 media-ready, 0 published` olmalı.
- Yedi batch kaydı `isContentReady` kontrolünü geçmeli; `publish` ve `mediaReady` false kalmalı.
- Yalnızca hedeflenen yedi guide kaydı değişmeli; related exercise slug'ları preset kataloğunda bulunmalı.
- Meta title 65, meta description 180 karakter sınırını aşmamalı ve JSON ile web wrapper birebir eşleşmeli.
- `node scripts/build-blog.js` tüm Learn/Library/sitemap çıktılarını hatasız üretmeli.
- Bench Press, Squat ve Deadlift Library HTML dosyaları `HEAD` ile byte-for-byte aynı kalmalı.

---

## Bölüm 78 — Exercise Guide Enrichment Batch 14 (2026-06-19)

### Amaç

Y-raise, rear-delt fly, upright row, shrug ve straight-arm hang/çekiş desenlerindeki yedi skapula-omuz kuşağı hareketini tam guide seviyesine taşımak; postür/omuz sağlığı garantisi, sabit kablo torku, zorunlu skapular depresyon ve maksimum sıkıştırma hakkındaki mutlak legacy cue'ları düzeltmek.

### Kapsam

- Y-Raise
- Reverse Pec Deck
- Cable Rear-Delt Fly
- Upright Row
- Shrug
- Active Hang
- Scapular Pull-Up

### İçerik Kararları

- **Y-Raise standardı:** Incline bench varyasyonu kilitlendi. Y açısı, bench eğimi ve kontrollü kol yüksekliği takip edilir; hareket tek başına postür veya omuz sağlığı garantisi olarak sunulmadı.
- **Skapular yukarı rotasyon:** Y-Raise ve raise/fly varyasyonlarında trapez-serratus katkısını tamamen yok etme cue'su kaldırıldı; kontrollü elevasyon ve yukarı rotasyon normal hareket bileşeni kabul edildi.
- **Reverse Pec Deck:** Makine modeli, koltuk/tutacak ayarı, göğüs teması ve ağrısız menzil tracking alanına eklendi. Arka deltoid hedefi, orta sırt katkısını tamamen ortadan kaldıran izolasyon olarak yazılmadı.
- **Cable Rear-Delt Fly:** Pulley yüksekliği, dirsek açısı ve kablo yolu standartlaştırıldı. Kablo gerginliğinin omuz torkunu hareket boyunca sabit yapmadığı ve kas hissinin tek kalite ölçütü olmadığı belirtildi.
- **Upright Row:** Guide barbell standardına bağlandı. Çeneye zorunlu çekiş kaldırıldı; tutuş genişliği ve rahat bitiş yüksekliği bireysel izlenir. Hareket otomatik zararlı veya herkes için uygun sayılmadı.
- **Shrug yolu:** Dumbbell shrug için kontrollü skapular elevasyon kullanıldı; hızlı dairesel omuz yuvarlama kaldırıldı. Pause süresi zorunlu tutulmadı ve farklı implement'ler ayrı kayda bağlandı.
- **Active Hang:** Maksimum omuz depresyonu yerine hafif, kontrollü omuz-kuşağı desteği tanımlandı. Dead Hang ve Active Hang süreleri doğrudan karşılaştırılmaz.
- **Scapular Pull-Up:** Dirsek açık küçük skapular hareket standardı yazıldı. Alt pozisyon herkese tam pasif dead hang yapılmadı; küçük menzil başarısız tekrar sayılmadı.
- **Readiness sonucu:** 145 total, 143 preview-ready, 101 content-ready, 0 media-ready, 0 published.
- **Service worker:** Yeni statik URL veya runtime mantığı eklenmedi; feature branch'teki `logwise-v47` aynı merge içinde güncel wrapper'ı precache edeceği için ek bump yapılmadı.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Yedi skapula/omuz kuşağı hareketi için tam guide ve anatomik kas içeriği |
| `data/ex-guides.js` | Kanonik JSON'dan yeniden üretilen wrapper |
| `AGENTS.md` | Refactor özeti ve bölüm sayısı |
| `REFACTOR-GECMISI.md` | Batch kapsamı, içerik kararları ve doğrulama kaydı |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` sonucu `145 total, 143 preview-ready, 101 content-ready, 0 media-ready, 0 published` olmalı.
- Yedi batch kaydı `isContentReady` kontrolünü geçmeli; `publish` ve `mediaReady` false kalmalı.
- Related exercise slug'ları preset kataloğunda bulunmalı ve meta title/description uzunluk kontrolleri geçmeli.
- JSON ile web wrapper birebir eşleşmeli.
- `node scripts/build-blog.js` tüm Learn/Library/sitemap çıktılarını hatasız üretmeli.
- Bench Press, Squat ve Deadlift Library HTML dosyaları `HEAD` ile byte-for-byte aynı kalmalı.

---

## Bölüm 77 — Exercise Guide Enrichment Batch 13 (2026-06-19)

### Amaç

Makine/Arnold shoulder press ile makine, cable, front ve lean-away raise desenlerindeki yedi omuz hareketini tam guide seviyesine taşımak; makine güvenliği, sabit kablo gerilimi, tam kas izolasyonu ve zorunlu omuz hizası bitişi hakkındaki mutlak legacy iddiaları düzeltmek.

### Kapsam

- Machine Shoulder Press
- Arnold Press
- Machine Lateral Raise
- Cable Lateral Raise
- Front Raise
- Cable Front Raise
- Lean-Away Lateral Raise

### İçerik Kararları

- **Makine press güvenliği:** Sabit yolun denge talebini azaltabildiği, omuz konforu veya güvenliği otomatik garanti etmediği yazıldı. Makine modeli, koltuk, tutuş ve kontrollü menzil tracking alanlarına eklendi.
- **Arnold rotasyonu:** Tam palms-in başlangıç zorunlu tutulmadı; omuzun rahat izin verdiği rotasyon kullanıldı. Arnold Press klasik shoulder press'ten otomatik olarak daha geniş veya üstün kas uyarımı sağlayan varyasyon olarak sunulmadı.
- **Skapular hareket:** Lateral/front raise sırasında trapez ve serratus katkısını tamamen yok etme cue'su kaldırıldı; kontrollü skapular yukarı rotasyon normal hareket bileşeni kabul edildi.
- **Makine lateral raise:** Pad/pivot ve koltuk ayarı makineye özgü kaldıraç olarak kaydedildi; sabit yol yan deltoidi tamamen izole eden veya makineler arası yükü karşılaştırılabilir yapan özellik sayılmadı.
- **Kablo torku:** Cable Lateral Raise ve Cable Front Raise için kablo gerginliğinin bulunmasının omuz eklemi torkunu hareket boyunca sabit yapmadığı açıklandı. Pulley, kablo yolu ve vücut konumu ayrı takip edilir.
- **Raise bitiş yüksekliği:** Omuz hizası herkese zorunlu bitiş yapılmadı; ağrısız, kontrollü ve tekrarlanabilir yükseklik kullanıldı.
- **Front raise programlaması:** Ön deltoidin press hareketlerinde de yüklendiği belirtildi; ek raise hacmi program bağlamına bağlandı. Ön deltoid “tam izolasyon” dili kaldırıldı.
- **Lean-away profili:** Lean-away açısının menzil ve direnç profilini değiştirdiği, otomatik olarak daha iyi olmadığı yazıldı. Destek yüksekliği, ayak konumu, lean açısı ve kablo yolu tracking alanına eklendi.
- **Readiness sonucu:** 145 total, 143 preview-ready, 94 content-ready, 0 media-ready, 0 published.
- **Service worker:** Yeni statik URL veya runtime mantığı eklenmedi; feature branch'teki `logwise-v47` aynı merge içinde güncel wrapper'ı precache edeceği için ek bump yapılmadı.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Yedi omuz press/raise hareketi için tam guide ve anatomik kas içeriği |
| `data/ex-guides.js` | Kanonik JSON'dan yeniden üretilen wrapper |
| `AGENTS.md` | Refactor özeti ve bölüm sayısı |
| `REFACTOR-GECMISI.md` | Batch kapsamı, içerik kararları ve doğrulama kaydı |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` sonucu `145 total, 143 preview-ready, 94 content-ready, 0 media-ready, 0 published` olmalı.
- Yedi batch kaydı `isContentReady` kontrolünü geçmeli; `publish` ve `mediaReady` false kalmalı.
- Related exercise slug'ları preset kataloğunda bulunmalı ve meta title/description uzunluk kontrolleri geçmeli.
- JSON ile web wrapper birebir eşleşmeli.
- `node scripts/build-blog.js` tüm Learn/Library/sitemap çıktılarını hatasız üretmeli.
- Bench Press, Squat ve Deadlift Library HTML dosyaları `HEAD` ile byte-for-byte aynı kalmalı.

---

## Bölüm 76 — Exercise Guide Enrichment Batch 12 (2026-06-19)

### Amaç

Dinamik plank, burpee/jumping jack ve dört temel kardiyo makinesi desenindeki yedi hareketi tam guide seviyesine taşımak; sabit yağ/kalori yakımı vaatleri, tek ideal cadence, zorunlu burpee bileşenleri ve yalnız hız/seviye odaklı performans hakkındaki legacy iddiaları düzeltmek.

### Kapsam

- Mountain Climber
- Burpee
- Jumping Jack
- Treadmill
- Cycling
- Stair Climber
- Rowing Machine

### İçerik Kararları

- **Mountain Climber standardı:** Hızlı tekrar yalnız kardiyo, yavaş tekrar yalnız core olarak ayrılmadı. El/plank kurulumu, pelvis kontrolü, cadence ve toplam/side-specific tekrar standardı tracking alanına eklendi.
- **Burpee varyasyonları:** Push-up, chest-to-floor, jump-back ve üstte zıplama zorunlu evrensel bileşenler yapılmadı. Step-back ve zıplamasız burpee geçerli düşük darbeli varyasyonlar olarak tanımlandı.
- **Jumping Jack inişi:** Yalnız ayak parmaklarına inme ve sabit 2-3 dakika ısınma cue'ları kaldırıldı; sessiz kontrollü iniş, rahat omuz açıklığı, cadence ve step-jack regresyonu kullanıldı.
- **Treadmill iddiaları:** Eğim için sabit kalori artışı ve LISS için otomatik yağ kaybı vaat edilmedi. Hız, eğim, süre, mesafe, RPE/nabız ve tutacak desteği birlikte izlenir.
- **Cycling ayarı:** Sele yalnız “diz neredeyse kilitli” kuralıyla ayarlanmadı. Tek ideal kadans, ağır vitesin otomatik zararı ve HIIT'in otomatik üstün yağ yakımı iddiaları kaldırıldı; bisiklet türü, fit, cadence, direnç/watt ve RPE kaydedilir.
- **Stair Climber desteği:** Makine boyundan bağımsız zorunlu tam ayak basışı kaldırıldı. Dengeli ayak basıncı, step rate, tutacak desteği, süre ve RPE standardı yazıldı.
- **Rowing sırası:** Concept2 tekniğiyle uyumlu olarak drive bacak-gövde-kol, recovery kol-gövde-bacak sırasına bağlandı. Catch, finish, split, stroke rate, damper ve drag factor tracking alanlarına eklendi.
- **Anatomik kas verisi:** Kardiyovasküler sistem kas slug'ı olarak kullanılmadı; yedi guide harekete özgü alt/üst vücut ve gövde kaslarına geçirildi.
- **Kategori sonucu:** Kardiyo kategorisinde yalnız ayrı dans/skill kaydı `moonwalk` content-ready değildir.
- **Readiness sonucu:** 145 total, 143 preview-ready, 87 content-ready, 0 media-ready, 0 published.
- **Service worker:** Yeni statik URL veya runtime mantığı eklenmedi; feature branch'teki `logwise-v47` aynı merge içinde güncel wrapper'ı precache edeceği için ek bump yapılmadı.

### Kaynaklar

- `https://www.concept2.com/training/rowing-technique`
- `https://pubmed.ncbi.nlm.nih.gov/21694556/`

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Yedi ana kardiyo hareketi için tam guide ve anatomik kas içeriği |
| `data/ex-guides.js` | Kanonik JSON'dan yeniden üretilen wrapper |
| `AGENTS.md` | Refactor özeti ve bölüm sayısı |
| `REFACTOR-GECMISI.md` | Batch kapsamı, içerik kararları, kaynaklar ve doğrulama kaydı |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` sonucu `145 total, 143 preview-ready, 87 content-ready, 0 media-ready, 0 published` olmalı.
- Yedi batch kaydı `isContentReady` kontrolünü geçmeli; `publish` ve `mediaReady` false kalmalı.
- Related exercise slug'ları preset kataloğunda bulunmalı ve meta title/description uzunluk kontrolleri geçmeli.
- JSON ile web wrapper birebir eşleşmeli.
- `node scripts/build-blog.js` tüm Learn/Library/sitemap çıktılarını hatasız üretmeli.
- Bench Press, Squat ve Deadlift Library HTML dosyaları `HEAD` ile byte-for-byte aynı kalmalı.

---

## Bölüm 75 — Exercise Guide Enrichment Batch 11 (2026-06-19)

### Amaç

Eksantrik pike press, duvar handstand, bilateral loaded carry, tuck front-lever row, paralel bar/ring support ve L-sit desenlerindeki yedi skill/isometric hareketi tam guide seviyesine taşımak; zorunlu omuz depresyonu, tam ring turnout, kusursuz yatay lever ve estetik tam L pozisyonu hakkındaki mutlak legacy cue'ları düzeltmek.

### Kapsam

- Pike Handstand Press Negative
- Wall Handstand Hold
- Farmer Carry
- Tuck Front Lever Row
- Support Hold
- Ring Support Hold
- L-Sit

### İçerik Kararları

- **Pike negatif standardı:** “Mümkün olduğunca yavaş” cue'su yerine tekrarlanabilir eksantrik süre, sabit baş hedefi, ayak yüksekliği ve önceden planlanan güvenli çıkış kullanıldı.
- **Wall handstand kurulumu:** Göğüs-duvar temel varyasyonu için kaymayan el yüzeyi, finger pressure, aktif uzun omuz desteği ve kontrollü iniş yazıldı. Göğüs-duvar ile sırt-duvar varyasyonları ayrı takip edilir.
- **Handstand kas verisi:** El bileği fleksörleri, üst trapez, ön omuz ve triceps katkıları araştırma bulgularıyla uyumlu biçimde anatomik slug'lara işlendi.
- **Farmer Carry omuz pozisyonu:** Omuzları zorla aşağı-geriye kilitleme kaldırıldı; yüklerin doğal yan pozisyonu, brace, kontrollü adım/dönüş ve güvenli indirme esas alındı. Implement, tutacak kalınlığı, strap, mesafe ve dönüş sayısı ayrı izlenir.
- **Tuck lever standardı:** Kalçanın kusursuz yatay olması tek geçerli tekrar yapılmadı; aynı tuck sıkılığı, hedef kalça yüksekliği ve row menzili kullanıldı. Bar ve ring varyasyonları ayrıldı.
- **Support hold dirsek/omuz:** Maksimum depresyon ve zorunlu anatomik kilit yerine aktif omuz desteği ile rahat dirsek ekstansiyonu kullanıldı. Sabit paralel bar süresi ring support süresiyle doğrudan karşılaştırılmaz.
- **Ring support turnout:** Tam ring turnout başlangıç şartı yapılmadı; nötr ring desteği geçerli regresyon olarak tanımlandı. Ring instabilitesinin koordinasyon talebini artırdığı, her kası otomatik daha fazla çalıştırmadığı belirtildi.
- **L-sit progression:** Tuck, tek bacak ve bir diz bükülü varyasyonlar geçerli aşamalar oldu. Diz kilidi ve pointed toes estetiği tek başarı ölçütü yapılmadı; destek/pelvis/topuk yüksekliği tracking alanına eklendi.
- **Kategori sonucu:** Core kategorisinde yalnız kardiyo batch'inde işlenecek `mountain-climber` content-ready değildir.
- **Readiness sonucu:** 145 total, 143 preview-ready, 80 content-ready, 0 media-ready, 0 published.
- **Service worker:** Yeni statik URL veya runtime mantığı eklenmedi; feature branch'teki `logwise-v47` aynı merge içinde güncel wrapper'ı precache edeceği için ek bump yapılmadı.

### Kaynaklar

- `https://pubmed.ncbi.nlm.nih.gov/29471194/`
- `https://pubmed.ncbi.nlm.nih.gov/19528856/`

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Yedi skill/isometric/carry hareketi için tam guide ve anatomik kas içeriği |
| `data/ex-guides.js` | Kanonik JSON'dan yeniden üretilen wrapper |
| `AGENTS.md` | Refactor özeti ve bölüm sayısı |
| `REFACTOR-GECMISI.md` | Batch kapsamı, içerik kararları, kaynaklar ve doğrulama kaydı |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` sonucu `145 total, 143 preview-ready, 80 content-ready, 0 media-ready, 0 published` olmalı.
- Yedi batch kaydı `isContentReady` kontrolünü geçmeli; `publish` ve `mediaReady` false kalmalı.
- Related exercise slug'ları preset kataloğunda bulunmalı ve meta title/description uzunluk kontrolleri geçmeli.
- JSON ile web wrapper birebir eşleşmeli.
- `node scripts/build-blog.js` tüm Learn/Library/sitemap çıktılarını hatasız üretmeli.
- Bench Press, Squat ve Deadlift Library HTML dosyaları `HEAD` ile byte-for-byte aynı kalmalı.

---

## Bölüm 74 — Exercise Guide Enrichment Batch 10 (2026-06-19)

### Amaç

Ayakta rollout, oturarak/kablo rotasyon, asılı diz-bacak kaldırma, strict toes-to-bar ve dragon flag desenlerindeki yedi dinamik/ileri core hareketini tam guide seviyesine taşımak; maksimum rotasyon, alt karın izolasyonu, strict-kipping karışımı ve tam menzil zorunluluğu hakkındaki legacy iddiaları düzeltmek.

### Kapsam

- Standing Ab Wheel
- Russian Twist
- Cable Woodchopper
- Hanging Leg Raise
- Hanging Knee Raise
- Toes-to-Bar
- Dragon Flag

### İçerik Kararları

- **Standing rollout progression:** Tam ayakta tekrar başlangıç şartı yapılmadı; eğimli yüzey, duvar sınırı ve ayakta eksantrik/diz üstü dönüş ayrı regresyonlar olarak tanımlandı.
- **Russian Twist menzili:** Her yana maksimum dönüş zorunluluğu kaldırıldı. Ayaklar yerde temel varyasyon olarak korundu; ayakları kaldırma ve yükü gövdeden uzaklaştırma ayrı zorluk değişkenleri oldu.
- **Woodchopper standardı:** Guide yüksekten aşağı bütün-vücut rotasyon varyasyonu olarak kilitlendi. Ayak pivotuna izin verildi; low-to-high ve anti-rotation varyasyonları ayrı kayda bağlandı. Spor performansına otomatik transfer garantisi verilmedi.
- **Alt karın miti:** Hanging Knee Raise, Hanging Leg Raise ve Toes-to-Bar ayrı bir “alt karın kasını” izole eden hareketler olarak sunulmadı; rectus abdominis, oblik, kalça fleksörü, lat ve kavrama katkıları anatomik veriye işlendi.
- **Asılış pozisyonu:** Omuzları zorla sürekli aşağı bastırma cue'su kaldırıldı; rahat ve kontrollü aktif asılış kullanıldı. Kavrama/omuz kontrolü kaybolduğunda set biter.
- **Strict-kipping ayrımı:** Hanging varyasyonlar ve Toes-to-Bar için strict standart yazıldı; kipli tekrarlar aynı set ve tracking kaydında karıştırılmaz.
- **Toes-to-Bar teması:** Bara temas tek kalite ölçütü yapılmadı; hedef yükseklik, diz açısı, pelvis kıvrımı, salınım ve kontrollü iniş birlikte izlenir.
- **Dragon Flag güvenli ankrajı:** Üst sırt desteği ve boynun ana yük noktası olmaması açıklandı; tuck, tek bacak, straddle ve eksantrik-only progression'lar tam düz bacak tekrardan önce kabul edildi.
- **Readiness sonucu:** 145 total, 143 preview-ready, 73 content-ready, 0 media-ready, 0 published.
- **Service worker:** Yeni statik URL veya runtime mantığı eklenmedi; feature branch'teki `logwise-v47` aynı merge içinde güncel wrapper'ı precache edeceği için ek bump yapılmadı.

### Kaynaklar

- `https://pubmed.ncbi.nlm.nih.gov/25111163/`
- `https://pubmed.ncbi.nlm.nih.gov/16649890/`

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Yedi dinamik/ileri core hareketi için tam guide ve anatomik kas içeriği |
| `data/ex-guides.js` | Kanonik JSON'dan yeniden üretilen wrapper |
| `AGENTS.md` | Refactor özeti ve bölüm sayısı |
| `REFACTOR-GECMISI.md` | Batch kapsamı, içerik kararları, kaynaklar ve doğrulama kaydı |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` sonucu `145 total, 143 preview-ready, 73 content-ready, 0 media-ready, 0 published` olmalı.
- Yedi batch kaydı `isContentReady` kontrolünü geçmeli; `publish` ve `mediaReady` false kalmalı.
- Related exercise slug'ları preset kataloğunda bulunmalı ve meta title/description uzunluk kontrolleri geçmeli.
- JSON ile web wrapper birebir eşleşmeli.
- `node scripts/build-blog.js` tüm Learn/Library/sitemap çıktılarını hatasız üretmeli.
- Bench Press, Squat ve Deadlift Library HTML dosyaları `HEAD` ile byte-for-byte aynı kalmalı.

---

## Bölüm 73 — Exercise Guide Enrichment Batch 9 (2026-06-19)

### Amaç

İzometrik anti-extension, anti-lateral-flexion, kontrollü trunk flexion, pelvis kıvırma ve rollout desenlerindeki yedi temel core hareketini tam guide seviyesine taşımak; tek doğru bel şekli, alt karın izolasyonu, maksimum sıkışma ve yalnız süre odaklı progression hakkındaki mutlak legacy cue'ları düzeltmek.

### Kapsam

- Plank
- Hollow Body Hold
- Side Plank
- Crunch
- Reverse Crunch
- Cable Crunch
- Ab Wheel

### İçerik Kararları

- **Plank standardı:** Herkese tek geometrik düz çizgi dayatılmadı; dirsek/ayak kurulumu, kaburga-pelvis ilişkisi, kontrollü nefes ve form bozulmadan tamamlanan süre esas alındı.
- **Hollow hold bel pozisyonu:** Belin zemine yakınlığı kontrol aracı olarak kullanıldı; ağrılı veya zorlanmış temas hedef yapılmadı. Baş yerde varyasyon geçerli regresyon kabul edildi.
- **Side plank karşılaştırması:** Dizler bükülü, staggered ve ayaklar üst üste varyasyonları ayrıldı; sağ-sol süreleri yalnız aynı destek düzeninde karşılaştırılır.
- **Crunch menzili:** Crunch kısa menzilli kaburga-pelvis trunk flexion'ı olarak tanımlandı; tam sit-up yüksekliği veya boynu elle çekme progression sayılmadı.
- **Alt karın miti:** Reverse Crunch ayrı bir “alt karın kasını” izole eden hareket olarak sunulmadı; rectus abdominis, oblikler ve bacak pozisyonuna katkı veren kalça fleksörleri anatomik veriye işlendi.
- **Cable crunch kalça kontrolü:** Kalçayı topuklara sabitleme cue'su kaldırıldı; tekrarlanabilir pelvis/kalça konumu ve gerçek trunk flexion, büyük hip hinge hareketinden ayrıldı.
- **Ab-wheel izolasyonu:** Rollout yalnız karın izolasyonu olarak yazılmadı; latissimus dorsi, serratus anterior, omuz, triceps ve kalça fleksörü katkıları belirtildi. Menzil artışı yalnız aynı bel kontrolü ve dönüş yolu korunuyorsa progression kabul edildi.
- **Anatomik kas verisi:** Yedi kayıt rectus abdominis, transversus abdominis, internal/external oblique ve harekete özgü yardımcı kas slug'larına geçirildi.
- **Readiness sonucu:** 145 total, 143 preview-ready, 66 content-ready, 0 media-ready, 0 published.
- **Service worker:** Yeni statik URL veya runtime mantığı eklenmedi; feature branch'teki `logwise-v47` aynı merge içinde güncel wrapper'ı precache edeceği için ek bump yapılmadı.

### Kaynaklar

- `https://www.acefitness.org/resources/everyone/exercise-library/52/crunch/`
- `https://pubmed.ncbi.nlm.nih.gov/16649890/`

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Yedi temel core hareketi için tam guide ve anatomik kas içeriği |
| `data/ex-guides.js` | Kanonik JSON'dan yeniden üretilen wrapper |
| `AGENTS.md` | Refactor özeti ve bölüm sayısı |
| `REFACTOR-GECMISI.md` | Batch kapsamı, içerik kararları, kaynaklar ve doğrulama kaydı |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` sonucu `145 total, 143 preview-ready, 66 content-ready, 0 media-ready, 0 published` olmalı.
- Yedi batch kaydı `isContentReady` kontrolünü geçmeli; `publish` ve `mediaReady` false kalmalı.
- Related exercise slug'ları preset kataloğunda bulunmalı ve meta title/description uzunluk kontrolleri geçmeli.
- JSON ile web wrapper birebir eşleşmeli.
- `node scripts/build-blog.js` tüm Learn/Library/sitemap çıktılarını hatasız üretmeli.
- Bench Press, Squat ve Deadlift Library HTML dosyaları `HEAD` ile byte-for-byte aynı kalmalı.

---

## Bölüm 72 — Exercise Guide Enrichment Batch 8 (2026-06-19)

### Amaç

Yanal squat, kaydırmalı/Nordic diz fleksiyonu, makine adduksiyonu, reverse Nordic, donkey calf raise ve back extension desenlerini tam guide seviyesine taşımak; maksimum derinlik/esneme, simetrik menzil, otomatik sakatlık önleme ve üstün kas aktivasyonu hakkındaki mutlak legacy iddiaları düzeltmek.

### Kapsam

- Cossack Squat
- Sliding Leg Curl
- Nordic Curl
- Leg Adduction Machine
- Reverse Nordic
- Donkey Calf Raise
- Back Extension

### İçerik Kararları

- **Cossack squat tarafları:** Sağ ve sol taraf için aynı derinlik zorunlu tutulmadı; topuk teması, diz takibi ve tekrarlanabilir taraf menzili esas alındı. Serbest ayağın parmaklarını yukarı çevirme yalnız bir varyasyon olarak tanımlandı.
- **Slider sürtünmesi:** Sliding Leg Curl zorluğunun zemin/slider sürtünmesi, kalça yüksekliği, eksantrik menzil ve tek/çift bacak seçimiyle değiştiği takip alanlarına eklendi.
- **Nordic progression:** Eksantrik-only tekrarlar geçerli aşama kabul edildi; ankraj, diz pedi, band/el desteği ve kalça açısı ayrı izlenir. Hamstring kuvveti katkısı anlatıldı fakat tek başına sakatlık önleme garantisi verilmedi.
- **Adduction açıklığı:** Makine başlangıç açıklığı maksimum esnemeye zorlanmadı; rahat kalça/diz pozisyonu, pelvis kontrolü ve makineye özgü kaldıraç esas alındı.
- **Reverse Nordic iddiası:** Quadriceps için kullanılabilir bir bodyweight seçenek olarak yazıldı; squat tabanlı hareketlerden otomatik olarak üstün aktivasyon sağladığı iddiası kaldırıldı.
- **Donkey calf standardı:** Öne eğilmenin otomatik derin esneme sağlamadığı belirtildi. Partnerle yüklenen klasik varyasyonun zor standardize edildiği, makine/kemer/plaka yüklerinin daha izlenebilir olduğu yazıldı.
- **Back extension bitişi:** Hareket adı belde maksimum hiperekstansiyon cue'su olarak kullanılmadı; ped altında kalça menteşesi ve gövdenin nötr hizaya dönüşü guide standardı yapıldı.
- **Anatomik kas verisi:** Yedi kayıt hareket bazlı primary/secondary kas slug'larına geçirildi.
- **Kategori sonucu:** Preset `Bacak` ve `Kalf` kategorilerinde content-ready olmayan guide kalmadı.
- **Readiness sonucu:** 145 total, 143 preview-ready, 59 content-ready, 0 media-ready, 0 published.
- **Service worker:** Yeni statik URL veya runtime mantığı eklenmedi; feature branch'teki `logwise-v47` aynı merge içinde güncel wrapper'ı precache edeceği için ek bump yapılmadı.

### Kaynaklar

- `https://pubmed.ncbi.nlm.nih.gov/33049705/`
- `https://pubmed.ncbi.nlm.nih.gov/39214520/`
- `https://pubmed.ncbi.nlm.nih.gov/30293403/`

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Yedi alt vücut/posterior-chain hareketi için tam guide ve anatomik kas içeriği |
| `data/ex-guides.js` | Kanonik JSON'dan yeniden üretilen wrapper |
| `AGENTS.md` | Refactor özeti ve bölüm sayısı |
| `REFACTOR-GECMISI.md` | Batch kapsamı, içerik kararları, kaynaklar ve doğrulama kaydı |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` sonucu `145 total, 143 preview-ready, 59 content-ready, 0 media-ready, 0 published` olmalı.
- Yedi batch kaydı `isContentReady` kontrolünü geçmeli; `publish` ve `mediaReady` false kalmalı.
- Preset `Bacak` ve `Kalf` kategorilerindeki tüm guide kayıtları content-ready olmalı.
- Related exercise slug'ları preset kataloğunda bulunmalı ve meta title/description uzunluk kontrolleri geçmeli.
- JSON ile web wrapper birebir eşleşmeli.
- `node scripts/build-blog.js` tüm Learn/Library/sitemap çıktılarını hatasız üretmeli.
- Bench Press, Squat ve Deadlift Library HTML dosyaları `HEAD` ile byte-for-byte aynı kalmalı.

---

## Bölüm 71 — Exercise Guide Enrichment Batch 7 (2026-06-19)

### Amaç

Kalça ekstansiyonu, kalça abdüksiyonu ve ayakta/oturarak plantar fleksiyon desenlerindeki yedi hareketi tam guide seviyesine taşımak; aktivasyon, izolasyon, zorunlu tam hareket açıklığı ve sabit tekrar aralığı hakkındaki mutlak legacy iddiaları düzeltmek.

### Kapsam

- Single-Leg Hip Thrust
- Glute Bridge
- Glute Kickback
- Cable Kickback
- Hip Abduction Machine
- Calf Raise
- Seated Calf Raise

### İçerik Kararları

- **Tek taraflı çalışma:** Single-Leg Hip Thrust sağ-sol farklarını görünür ve ayrı takip edilebilir kılar; farkları otomatik düzelttiği veya tek başına asimetri tanısı koyduğu iddia edilmedi.
- **Glute bridge bitişi:** Tepe noktası daha fazla bel hiperekstansiyonuyla değil, nötr gövde korunarak tamamlanan kalça ekstansiyonuyla sınırlandı.
- **Kickback ayrımı:** `glute-kickback` dört ayak vücut ağırlığı varyasyonu, `cable-kickback` ayakta düşük makara varyasyonu olarak net biçimde ayrıldı.
- **Aktivasyon dili:** Kas hissi veya “mind-muscle connection” ilerlemenin tek ölçütü yapılmadı; yük, tekrar, hareket açıklığı, tempo ve form takibi öne çıkarıldı.
- **Hip abduction iddiası:** Makine kalça abdüksiyonunun gluteus medius/minimus ve tensor fasciae latae katkısıyla çalıştığı yazıldı; tek başına ağrı veya sakatlık önleme garantisi verilmedi.
- **Calf ROM ve tekrar miti:** Herkes için zorunlu maksimum esneme ve yalnız yüksek tekrar önerisi kaldırıldı; ağrısız, tekrarlanabilir menzil ve hedefe göre yük/tekrar progression'ı kullanıldı.
- **Standing/seated ayrımı:** Diz fleksiyonunun gastrocnemius katkısını azaltıp soleus vurgusunu artırdığı, fakat seated calf raise'in soleus'u tamamen izole etmediği belirtildi.
- **Anatomik kas verisi:** Yedi kayıt hareket bazlı primary/secondary kas slug'larına geçirildi.
- **Readiness sonucu:** 145 total, 143 preview-ready, 52 content-ready, 0 media-ready, 0 published.
- **Service worker:** Yeni statik URL veya runtime mantığı eklenmedi; feature branch'teki `logwise-v47` aynı merge içinde güncel wrapper'ı precache edeceği için ek bump yapılmadı.

### Ek Veri Düzeltmesi

- İlk migration'dan kalan `g?sterimi` ve `?al??an kaslar?n haritas?` kalıpları 142 guide kaydında gerçek Türkçe karakterlerle onarıldı.
- Düzeltme `f5a3d76` commit'inde yalnızca `media.demoLabel[0]` ve `media.muscleMapAlt[0]` alanlarına uygulandı; 145/145 kayıt temiz doğrulandı.

### Kaynaklar

- `https://www.acefitness.org/resources/everyone/exercise-library/49/glute-bridge/`
- `https://www.acefitness.org/resources/everyone/exercise-library/73/standing-calf-raises/`
- `https://pubmed.ncbi.nlm.nih.gov/38156065/`

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Yedi kalça/baldır hareketi için tam guide, anatomik kas içeriği ve düzeltilmiş TR medya alt metinleri |
| `data/ex-guides.js` | Kanonik JSON'dan yeniden üretilen wrapper |
| `AGENTS.md` | Refactor özeti ve bölüm sayısı |
| `REFACTOR-GECMISI.md` | Batch kapsamı, içerik kararları, kaynaklar ve doğrulama kaydı |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` sonucu `145 total, 143 preview-ready, 52 content-ready, 0 media-ready, 0 published` olmalı.
- Yedi batch kaydı `isContentReady` kontrolünü geçmeli; `publish` ve `mediaReady` false kalmalı.
- Related exercise slug'ları preset kataloğunda bulunmalı ve meta title/description uzunluk kontrolleri geçmeli.
- Tüm TR `demoLabel` ve `muscleMapAlt` değerleri bozuk `?` kalıplarından arınmış olmalı.
- JSON ile web wrapper birebir eşleşmeli.
- `node scripts/build-blog.js` tüm Learn/Library/sitemap çıktılarını hatasız üretmeli.
- Bench Press, Squat ve Deadlift Library HTML dosyaları `HEAD` ile byte-for-byte aynı kalmalı.

---

## Bölüm 70 — Exercise Guide Enrichment Batch 6 (2026-06-19)

### Amaç

Squat, split-stance, yürüyüş ve diz fleksiyon/ekstansiyon desenlerindeki yedi bacak hareketini tam guide seviyesine taşımak; makine güvenliği, diz-ayak ucu, platform yüksekliği ve tek taraflı çalışma hakkındaki mutlak legacy iddiaları düzeltmek.

### Kapsam

- Hack Squat
- Smith Machine Squat
- Bulgarian Split Squat
- Walking Lunge
- Step Up
- Leg Extension
- Seated Leg Curl

### İçerik Kararları

- **Hack squat güvenliği:** Sabit yolun denge talebini azaltabildiği yazıldı; hareket otomatik olarak güvenli veya herkese uygun aksesuar hacmi şeklinde sunulmadı.
- **Smith ray geometrisi:** Ayak konumu tek bir ileri mesafeye sabitlenmedi; ray açısı, bar yolu, gövde dengesi ve rahat derinliğe göre ayarlanması istendi.
- **Tek taraflı çalışma:** Bulgarian Split Squat iki taraf arasındaki farkları görünür ve ayrı takip edilebilir kılar; asimetriyi otomatik düzelttiği iddia edilmedi.
- **Diz-ayak ucu miti:** Walking Lunge sırasında dizin ayak ucunu geçmesi tek başına hata sayılmadı; tam ayak teması, diz-ayak yönü ve kontrollü yük aktarımı esas alındı.
- **Step-up yüksekliği:** Daha yüksek platform otomatik olarak daha iyi kabul edilmedi; pelvis kontrolü korunabilen yükseklik ve arkadaki bacaktan minimum itiş öne çıkarıldı.
- **Leg extension bitişi:** Kontrollü tam diz ekstansiyonu ile eklemi hızla kilitlemek ayrıştırıldı; savurarak sert bitiriş hata olarak yazıldı.
- **Seated leg curl ayrımı:** Ayrı `leg-curl` kaydı yatarak varyasyonu temsil ettiği için bu guide kalça fleksiyonunda yapılan oturarak leg curl'e özgü yazıldı.
- **Anatomik kas verisi:** Yedi kayıt hareket bazlı primary/secondary kas slug'larına geçirildi.
- **Readiness sonucu:** 145 total, 143 preview-ready, 45 content-ready, 0 media-ready, 0 published.
- **Service worker:** Yeni statik URL veya runtime mantığı eklenmedi; feature branch'teki `logwise-v47` aynı merge içinde güncel wrapper'ı precache edeceği için ek bump yapılmadı.

### Kaynak

- `https://www.acefitness.org/resources/everyone/exercise-library/94/forward-lunge/`

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Yedi squat/lunge/makine bacak hareketi için tam guide ve anatomik kas içeriği |
| `data/ex-guides.js` | Kanonik JSON'dan yeniden üretilen wrapper |
| `AGENTS.md` | Refactor özeti ve bölüm sayısı |
| `REFACTOR-GECMISI.md` | Batch kapsamı, içerik kararları ve doğrulama kaydı |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` sonucu `145 total, 143 preview-ready, 45 content-ready, 0 media-ready, 0 published` olmalı.
- Yedi batch kaydı `isContentReady` kontrolünü geçmeli; `publish` ve `mediaReady` false kalmalı.
- Related exercise slug'ları preset kataloğunda bulunmalı ve meta title/description uzunluk kontrolleri geçmeli.
- JSON ile web wrapper birebir eşleşmeli.
- `node scripts/build-blog.js` tüm Learn/Library/sitemap çıktılarını hatasız üretmeli.
- Bench Press, Squat ve Deadlift Library HTML dosyaları `HEAD` ile byte-for-byte aynı kalmalı.

---

## Bölüm 69 — Exercise Guide Enrichment Batch 5 (2026-06-19)

### Amaç

Dikey ve yatay sırt çekişlerinin tek kol, düz kol, supine tutuş, yardımlı, dumbbell, makine ve göğüs destekli varyasyonlarını tam guide seviyesine taşımak; tek taraflı çalışma ve makine desteği hakkındaki otomatik sonuç iddialarını düzeltmek.

### Kapsam

- Single-Arm Lat Pulldown
- Straight-Arm Pulldown
- Chin Up
- Assisted Pull Up
- Dumbbell Row (`dumbell-row` legacy slug)
- Machine Row
- Chest-Supported Row

### İçerik Kararları

- **Tek taraflı çalışma:** Single-Arm Lat Pulldown ve Dumbbell Row iki taraf arasındaki farkı görünür ve ayrı takip edilebilir kılar; asimetriyi otomatik düzelttiği iddia edilmedi.
- **Straight-arm ayrımı:** Straight-Arm Pulldown dirsek fleksiyonu değil, büyük ölçüde sabit dirsekle omuz ekstansiyonu olarak tanımlandı.
- **Chin-up standardı:** Supine tam kavrama, brace, dirsekleri aşağı sürme, sallanmadan dik gövde ve kontrollü tam uzama ACE Chin-ups rehberiyle çapraz kontrol edildi.
- **Yardım profili:** Assisted Pull Up için bant ve makinenin farklı yardım eğrileri sunduğu; ilerlemenin aynı sistem içinde karşılaştırılması gerektiği yazıldı.
- **Makine güvenliği:** Machine Row sabit yolu ve desteği denge talebini azaltır; ayar ve omuz kontrolü gerekliliği sürdüğü için mutlak “güvenli hacim” ifadesi kaldırıldı.
- **Göğüs desteği:** Chest-Supported Row spinal erektör talebini azaltabilir; bunu sıfır bel yükü veya herkes için ağrısızlık garantisi olarak sunmadı.
- **Anatomik kas verisi:** Yedi kayıt hareket bazlı primary/secondary kas slug'larına geçirildi.
- **Readiness sonucu:** 145 total, 143 preview-ready, 38 content-ready, 0 media-ready, 0 published.
- **Service worker:** Yeni statik URL veya runtime mantığı eklenmedi; feature branch'teki `logwise-v47` aynı merge içinde güncel wrapper'ı precache edeceği için ek bump yapılmadı.

### Kaynak

- `https://www.acefitness.org/resources/everyone/exercise-library/190/chin-ups/`

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Yedi sırt çekiş hareketi için tam guide ve anatomik kas içeriği |
| `data/ex-guides.js` | Kanonik JSON'dan yeniden üretilen wrapper |
| `AGENTS.md` | Refactor özeti ve bölüm sayısı |
| `REFACTOR-GECMISI.md` | Batch kapsamı, içerik kararları ve doğrulama kaydı |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` sonucu `145 total, 143 preview-ready, 38 content-ready, 0 media-ready, 0 published` olmalı.
- Yedi batch kaydı `isContentReady` kontrolünü geçmeli; `publish` ve `mediaReady` false kalmalı.
- Related exercise slug'ları preset kataloğunda bulunmalı ve meta title/description uzunluk kontrolleri geçmeli.
- JSON ile web wrapper birebir eşleşmeli.
- `node scripts/build-blog.js` tüm Learn/Library/sitemap çıktılarını hatasız üretmeli.
- Bench Press, Squat ve Deadlift Library HTML dosyaları `HEAD` ile byte-for-byte aynı kalmalı.

---

## Bölüm 68 — Exercise Guide Enrichment Batch 4 (2026-06-19)

### Amaç

Göğüs antrenmanının makine, dumbbell, incline, fly, cable ve triceps odaklı press desenlerini tam guide seviyesine taşımak; legacy metinlerdeki mutlak güvenlik, bölgesel izolasyon ve kontrolsüz derin gerilim iddialarını düzeltmek.

### Kapsam

- Chest Press
- Dumbbell Press (`dumbell-press` legacy slug)
- Incline Dumbbell Press (`incline-dumbell-press` legacy slug)
- Dumbbell Fly (`dumbell-fly` legacy slug)
- Cable Crossover
- Pec Deck
- Close-Grip Bench Press

### İçerik Kararları

- **Makine güvenliği:** Chest Press ve Pec Deck için sabit yolun denge ihtiyacını azalttığı, ancak koltuk/başlangıç ayarı ve omuz kontrolünün hâlâ gerekli olduğu açıklandı; “makine güvenlidir” mutlak ifadesi kaldırıldı.
- **Dumbbell simetrisi:** Bağımsız kolların sağ-sol farkını görünür kılabileceği anlatıldı; dumbbell çalışmanın dengesizliği otomatik düzelttiği iddia edilmedi.
- **Sabit dirsek açısı yok:** Dumbbell Press alt noktası herkese 90 derece dirsek açısıyla dayatılmadı; ön kol hizası ve omuz konforuna bağlandı.
- **Fly derinliği:** Dumbbell Fly ve Pec Deck geri açılması, omuz başı öne yuvarlanmadan korunabilen ağrısız hareket açıklığıyla sınırlandı.
- **İç göğüs miti:** Cable Crossover pulley yüksekliğinin kol yolunu değiştirdiği, ancak bağımsız bir “iç göğüs” kasını izole etmediği belirtildi.
- **Close-grip tanımı:** Tutuşun elleri birbirine değdirecek kadar dar olması gerekmediği; normal bench tutuşundan biraz dar, bilek-dirsek rahatlığını koruyan genişlik olması gerektiği yazıldı.
- **Anatomik kas verisi:** Yedi kayıt hareket bazlı primary/secondary kas slug'larına geçirildi.
- **Readiness sonucu:** 145 total, 143 preview-ready, 31 content-ready, 0 media-ready, 0 published.
- **Service worker:** Yeni statik URL veya runtime mantığı eklenmedi; feature branch'teki `logwise-v47` aynı merge içinde güncel wrapper'ı precache edeceği için ek bump yapılmadı.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Yedi göğüs/press hareketi için tam guide ve anatomik kas içeriği |
| `data/ex-guides.js` | Kanonik JSON'dan yeniden üretilen wrapper |
| `AGENTS.md` | Refactor özeti ve bölüm sayısı |
| `REFACTOR-GECMISI.md` | Batch kapsamı, içerik kararları ve doğrulama kaydı |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` sonucu `145 total, 143 preview-ready, 31 content-ready, 0 media-ready, 0 published` olmalı.
- Yedi batch kaydı `isContentReady` kontrolünü geçmeli; `publish` ve `mediaReady` false kalmalı.
- Related exercise slug'ları preset kataloğunda bulunmalı ve meta title/description uzunluk kontrolleri geçmeli.
- JSON ile web wrapper birebir eşleşmeli.
- `node scripts/build-blog.js` tüm Learn/Library/sitemap çıktılarını hatasız üretmeli.
- Bench Press, Squat ve Deadlift Library HTML dosyaları `HEAD` ile byte-for-byte aynı kalmalı.

---

## Bölüm 67 — Exercise Guide Enrichment Batch 3 (2026-06-19)

### Amaç

Omuz ve kol antrenmanının temel press, raise, fly, rotasyon, curl ve pushdown desenlerini tam guide seviyesine taşımak; legacy preview metinlerindeki omuz pozisyonu ve kas aktivasyonu iddialarını daha nötr, kontrol odaklı cue'larla değiştirmek.

### Kapsam

- Shoulder Press
- Lateral Raise
- Rear Delt Fly
- Face Pull
- Biceps Curl
- Hammer Curl
- Triceps Pushdown

### İçerik Kararları

- **Shoulder Press ayrımı:** Barbell strict press ayrı `overhead-press`, makine varyasyonu ayrı `machine-shoulder-press` olduğu için bu kayıt dumbbell shoulder press olarak netleştirildi.
- **Lateral Raise el pozisyonu:** “Su döker gibi başparmak aşağı” cue'su kaldırıldı; skapular düzlemde nötr veya hafif yukarı başparmak pozisyonu kullanıldı.
- **Rear Delt Fly hedefi:** Aşırı kürek kemiği sıkıştırmasının hareketi mid-back rowa çevirebileceği açıklandı; üst kol yatay abdüksiyonu ana hedef yapıldı.
- **Face Pull kontrolü:** Dış rotasyon zorlanmadan, rahat ön kol-bilek hizası ve kontrollü halat ayrımı öne çıkarıldı.
- **Curl gerçekçiliği:** Biceps curl sırasında üst kolun tamamen hareketsiz olması dayatılmadı; küçük doğal hareketin tutarlı ve kontrollü kalması istendi.
- **Pushdown halat miti:** Halat uçlarını ayırmanın “ekstra aktivasyon” sağladığı iddiası kaldırıldı; ayrım yalnız hareket açıklığı ve aparat boşluğu bağlamında anlatıldı.
- **Anatomik kas verisi:** Yedi kayıt hareket bazlı primary/secondary kas slug'larına geçirildi.
- **Readiness sonucu:** 145 total, 143 preview-ready, 24 content-ready, 0 media-ready, 0 published.
- **Service worker:** Yeni statik URL veya runtime mantığı eklenmedi; feature branch'teki `logwise-v47` aynı merge içinde güncel wrapper'ı precache edeceği için ek bump yapılmadı.

### Dosya / Config Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `data/ex-guides.json` | Yedi omuz/kol hareketi için tam guide ve anatomik kas içeriği |
| `data/ex-guides.js` | Kanonik JSON'dan yeniden üretilen wrapper |
| `AGENTS.md` | Refactor özeti ve bölüm sayısı |
| `REFACTOR-GECMISI.md` | Batch kapsamı, içerik kararları ve doğrulama kaydı |

### Doğrulama Notları

- `node scripts/build-ex-guides.js --check` sonucu `145 total, 143 preview-ready, 24 content-ready, 0 media-ready, 0 published` olmalı.
- Yedi batch kaydı `isContentReady` kontrolünü geçmeli; `publish` ve `mediaReady` false kalmalı.
- Related exercise slug'ları preset kataloğunda bulunmalı ve meta title/description uzunluk kontrolleri geçmeli.
- JSON ile web wrapper birebir eşleşmeli.
- `node scripts/build-blog.js` tüm Learn/Library/sitemap çıktılarını hatasız üretmeli.
- Bench Press, Squat ve Deadlift Library HTML dosyaları `HEAD` ile byte-for-byte aynı kalmalı.
