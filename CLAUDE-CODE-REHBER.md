# LOG WISE — Tam Proje Rehberi (Claude Code İçin)

Bu doküman, LOG WISE projesinin kuruluşundan güncel haline kadar her şeyi açıklar. Claude Code'a bu dosyayı okutarak projeye hakim olması sağlanır.

---

## 1. PROJE NEDİR?

LOG WISE, tek sayfalık (SPA) bir antrenman takip web uygulamasıdır. Kullanıcılar hareketlerini tanımlar, haftalık veya günlük programlar oluşturur, takvim üzerinden günlere hareket ekler ve her set için ağırlık/tekrar/RIR kaydı tutar.

- **Canlı URL**: https://logwise.fit/ (Netlify deploy, custom domain)
- **Eski URL**: https://incomparable-starburst-f7802c.netlify.app/
- **Teknoloji**: React 18 + Babel Standalone (tarayıcıda JSX derleme, build step yok), Supabase (auth + veritabanı)
- **Ana dosya**: `index.html` (~1090 satır, tüm CSS/JS/React inline tek dosyada)
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
- **TR/EN dil desteği**: `TR` ve `EN` constant objeleri (~90+ anahtar). `lang` state: "tr" veya "en", localStorage'da (`gym-log-lang`).

### 3.6 URL Routing (Client-Side)

React tarafında pushState/replaceState ile URL yönetimi:

- `/` → Takvim
- `/exercises` → Hareketler
- `/programs` → Programlar
- `/feedback` → Geri Bildirim
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
    },
    {
      "id": "1711234567891",
      "name": "Şınav / Push Up",
      "categories": ["Göğüs", "Omuz", "Triceps"]
    }
  ],
  "workouts": {
    "2026-04-01": [
      {
        "exerciseId": "1711234567890",
        "sets": [
          { "weight": 80, "reps": 8, "rir": "2" },
          { "weight": 85, "reps": 6, "rir": "1" }
        ]
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
  }
}
```

### Veri Alanları Açıklaması

- `exercises[].categories` — Dizi! Eski veride `category` (string) olabilir, `migrateData()` fonksiyonu otomatik dönüştürür.
- `programs[].days` — Key'ler string olmalı ("0"–"6", Pazartesi=0, Pazar=6). `savePg` fonksiyonunda normalize edilir.
- `dailyPrograms` — Haftanın günlerinden bağımsız, sadece hareket listesi içeren programlar.
- `activeProgram` — Aktif haftalık program ID'si veya null. Aynı anda sadece bir program aktif olabilir.
- `durations` — Timer kayıtları, gün bazında saniye cinsinden dizi.

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

### 6.2 Gün Görünümü

- O gün eklenen hareketler kart olarak listelenir. Her kartta set tablosu (SET | KG | TEKRAR | RIR | Sil).
- Aktif haftalık programda o günün başlanmamış hareketleri üstte pill butonlar olarak gösterilir.
- "Günlük Programı Ekle" butonu ile günlük programlardan biri seçilerek o güne eklenebilir.
- "Antrenman Kopyala" butonu ile geçmiş günlerden antrenman kopyalanabilir.
- Sağ altta FAB butonu ile hareket ekleme modalı açılır.

### 6.3 Hareketler

- Bölgelere göre gruplandırılmış hareket listesi. Çoklu bölgeli hareketler her bölgenin altında ayrı ayrı görünür.
- Her hareketin yanında son max ağırlık ve toplam kayıt sayısı gösterilir.
- "Yeni Hareket" butonuna tıklanınca iki sekme açılır:
  - **Kendin Ekle**: İsim gir + birden fazla bölge seç (multi-select pill butonlar)
  - **Hazır Hareketler**: Bölgeye göre filtrelenebilen preset hareket listesinden çoklu seçim yapılır

### 6.4 Hazır Hareketler Sistemi (PRESET_EXERCISES)

Kodun başında `PRESET_EXERCISES` dizisi var. Developer yeni hareket eklemek için bu diziye satır ekler:

```js
{ name: "Türkçe Ad", nameEN: "English Name", categories: ["Bölge1", "Bölge2"] }
```

- `name` → Türkçe modda gösterilir ve bu isimle kaydedilir
- `nameEN` → İngilizce modda gösterilir ve bu isimle kaydedilir. Verilmezse `name` kullanılır.
- Zaten eklenmiş hareketler soluk gösterilir ve seçilemez (her iki dildeki isme de bakılır).

### 6.5 Programlar

İki program türü var, programlar sayfasında sekmelerle seçilir:

**Haftalık Program:**
- Haftanın 7 gününe ayrı ayrı hareket atanır (Pzt–Paz sekmeleri)
- "Aktif Et" ile aktifleştirilir → takvimde otomatik görünür
- Aynı anda sadece bir program aktif olabilir
- Aktif program sidebar'da özet olarak gösterilir

**Günlük Program:**
- Haftanın günlerinden bağımsız, sadece bir hareket listesi
- Takvimde gün görünümüne gidince "Günlük Programı Ekle" butonu ile o güne eklenir
- Ekleme işlemi hareketleri boş setlerle kopyalar

### 6.6 Hareket Geçmişi Modal

- Herhangi bir hareketin 📊 butonuna basınca açılır
- Tüm kayıtlı günler ters kronolojik sırayla: tarih, max ağırlık, hacim, set detayları
- PR (personal record) sağ üstte gösterilir

### 6.7 RIR (Reps in Reserve)

Her set için dropdown: "—" (yok), "Failure" (0), "RIR 1", "RIR 2", "RIR 3", "RIR 4+".

### 6.8 Timer (Kronometre)

- Sidebar'da start/stop/reset/save butonları
- localStorage ile persist (tarayıcı kapansa bile kalır, `gym-timer` key)
- Birden fazla kayıt/gün desteklenir (durations dizisi)
- Gün görünümünde toplam + detaylar gösterilir

### 6.9 Geri Bildirim

- Mesaj + kategori (Hata/Özellik İsteği/Genel/Diğer) + 5 yıldız puan
- Supabase `feedback` tablosuna kaydedilir
- Misafir modda engelli

---

## 7. BİLEŞEN HARİTASI (index.html satır yapısı)

```
Satır 1-80      HTML head, CSS (değişkenler, animasyonlar, dark/light tema, yeni renkler)
Satır 90-98     Supabase client, React hooks, sabitler (D, DF, MO, CATS, CC)
Satır 100-175   PRESET_EXERCISES dizisi (hazır hareketler, yorum bloğu ile açıklanmış)
Satır 175-176   presetName() helper, RIRS sabiti
Satır 177-183   Yardımcı fonksiyonlar (fmt, pD, gdow, storage keys, eDays, init, migrateData)
Satır 184-185   TR ve EN çeviri objeleri (~90+ anahtar)
Satır 187-267   AuthScreen bileşeni (login/register/forgot modal, Google OAuth)
Satır 269-1042  App bileşeni (ana uygulama):
  269-282       Props, state tanımları (view, calendar, sidebar, mobile)
  283-305       State tanımları (exercises, programs, daily programs, modals)
  306-347       Timer, feedback, refs (stale closure pattern)
  349-369       Data loading (migrateData ile), save/debouncedSave/flushSave
  370-420       URL routing, page title, view transitions
  421-441       Exercise CRUD (addExercise, addPresetExercises, removeExercise)
  442-447       Day CRUD (addExToDay, rmExDay, addSet, updSet, rmSet, startPgEx)
  448-473       Program CRUD (savePg, delPg, actPg, resetPg, openEditPg, togPgEx)
  474-486       Daily Program CRUD (saveDp, delDp, resetDp, openEditDp, togDpEx, addDpToDay)
  487-495       Helper fonksiyonlar (exN, exC, exCats, cl, clAll, getH, getEff)
  496-508       Calendar hesaplamaları (calDays, weekDays, today)
  510-600       JSX: Header + Sidebar (navigasyon, timer, mini takvim, aktif program özeti, user/guest)
  600-660       JSX: Calendar view (month + week grid'leri)
  660-720       JSX: Day view (set tabloları, program hareketleri, günlük program ekleme, kopyalama)
  720-810       JSX: Exercises view (gruplandırılmış liste, add exercise modal with tabs)
  810-960       JSX: Programs view (weekly/daily tabs, modals)
  960-1000      JSX: Feedback view
  1000-1030     JSX: History modal, Guest banner
Satır 1035-1042 S style objesi (inline style sabitleri)
Satır 1045-1073 Root bileşeni (auth state, lang, theme), ReactDOM render
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

Yeni alan eklenmesi gerekirse bu fonksiyona eklenmeli.

---

## 10. DEPLOY

Netlify'da deploy ediliyor. `netlify.toml` içeriği:

- `publish = "."` — kök dizin publish edilir
- SPA redirect'leri: `/exercises`, `/programs`, `/feedback` → `/index.html` (status 200)
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

---

## 13. SUPABASE SETUP

Supabase Dashboard → SQL Editor'da `supabase_setup.sql` çalıştırılarak tablolar ve RLS politikaları oluşturulur. Önemli detaylar:

- `user_data` tablosu: JSONB blob, `user_id` UUID primary key
- `feedback` tablosu: `id` text PK, `user_id`, `msg`, `cat`, `rating`, `created_at`
- RLS politikaları: SELECT/INSERT/UPDATE/DELETE — `auth.uid() = user_id`
- `delete_own_account()` fonksiyonu: Kullanıcının kendi hesabını silmesi için

---

## 14. HENÜZ YAPILMAMIŞ / GELİŞTİRİLEBİLECEK ŞEYLER

- Veri export/import (JSON)
- Grafik/chart ile ilerleme takibi
- PWA tam desteği (offline çalışma, service worker)
- Drag & drop ile set/hareket sıralama
- Responsive iyileştirmeleri (mobilde detay geliştirilebilir)
- Hareket düzenleme (isim/bölge değiştirme)
- Program sıralama/drag-drop
- Sosyal özellikler (antrenman paylaşma)
