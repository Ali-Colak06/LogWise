# LogWise Mobile MVP — Karar Kaydı

> **Bu dosya, mobil uygulama geliştirme sürecinde verilen tüm kararların tek kaynağıdır.**
> Her yeni konuşma başında AI bu dosyayı okur; yeni bir karar verildiğinde bu dosya güncellenir.
> İlgili sözleşme dosyası: `AGENTS.md` (proje kuralları). İlgili tasarım dosyaları: `01-current-logwise-ui-audit.md`, `02-mobile-design-system-proposal.md`.

Son güncelleme: 2026-06-20 (rev 23)

---

## 1. Ürün konumlandırması

- Mobil app, mevcut LogWise web ürününün **evrimidir**. Aynı marka, aynı kullanıcı kitlesi.
- MVP tamamlandıktan sonra **asıl ürün mobil uygulama olacak**; web ikinci sınıf vatandaşa düşecek.
- Mobil app, web ile **aynı Supabase Auth hesap havuzunu** paylaşır (kullanıcı aynı email/şifre ile girer), ancak **veri tabloları ayrıdır** (`app_` prefix'li).
- Web kullanıcılarının mevcut verisi mobile **taşınmaz** — mobil temiz başlar.

## 2. Teknik stack

- **Framework:** React Native + Expo
- **Dil:** TypeScript (web'deki "build yok, JSX yok" kuralı mobil için **geçerli değildir** — mobil normal TS/JSX kullanır)
- **Backend:** Supabase (mevcut proje, yeni tablolar)
- **Navigation:** **Expo Router** (file-based routing, Expo native, auth gating `_layout.tsx` ile)
- **State management:**
  - **UI state:** Zustand (auth session, modal'lar, seçili tarih, tercihler — küçük store'lar)
  - **Server state:** TanStack Query (Supabase'den çekilen veri — cache, invalidation, optimistic update, mutation rollback)
- **Custom font shipping:** **Hibrit** — Inter bundle'a `expo-font` ile yüklenir (body, button, label için marka kimliği); Space Grotesk ve JetBrains Mono **system font fallback** (display başlıklar ve mono için: iOS'ta SF Pro/SF Mono, Android'de Roboto/Roboto Mono). Bundle ~200KB ekstra; startup minimal etki.
- **Storage:** AsyncStorage (`@react-native-async-storage/async-storage`) — misafir verisi + cache + tercihler
- **Secure storage:** `expo-secure-store` — Supabase auth token

## 2.1 Klasör yapısı (zorunlu)

```
logwise-mobile/
├── app/                        # Expo Router — route'lar
│   ├── _layout.tsx             # Root layout (auth provider, theme, query client)
│   ├── (auth)/                 # Auth gerektirmeyen route grubu
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (app)/                  # Auth (veya guest) gereken route grubu
│   │   ├── _layout.tsx         # Bottom tab navigator
│   │   ├── calendar/
│   │   │   ├── index.tsx       # B1 Calendar (Month default)
│   │   │   └── day/[date].tsx  # C1-C3 Day Detail
│   │   ├── workout/
│   │   │   └── index.tsx       # D1/D2 Workout (segmented)
│   │   ├── dashboard.tsx       # F1 Placeholder
│   │   ├── social.tsx          # F2 Placeholder
│   │   └── more.tsx            # E1 More panel
│   └── +not-found.tsx
├── components/                 # Reusable UI components
│   ├── ui/                     # AppButton, AppInput, AppCard, AppHeader, AppScreen
│   ├── calendar/               # CalendarGrid, DayCell, WeekFeed
│   ├── workout/                # ExerciseCard, SetRow, AddExerciseSheet
│   └── shared/                 # BrandMark, EmptyState, Toast
├── lib/                        # İş mantığı, saf fonksiyonlar
│   ├── supabase.ts             # Supabase client
│   ├── calc.ts                 # 1RM, streak, compliance (web lib/calc.js portu)
│   ├── exercise-utils.ts       # Slug resolve, polymorphic ref
│   ├── guest-storage.ts        # AsyncStorage guest layer
│   └── migration.ts            # Guest → hesap migration
├── data/                       # Static data + i18n
│   ├── presets-exercises.ts    # 54 preset (web'den port)
│   ├── presets-programs.ts     # 4 preset programs
│   ├── ex-preview.ts           # Açıklama + tips
│   ├── i18n-tr.ts
│   └── i18n-en.ts
├── stores/                     # Zustand stores
│   ├── auth-store.ts
│   ├── preferences-store.ts    # locale, theme
│   └── ui-store.ts             # modal'lar, transient state
├── queries/                    # TanStack Query hooks
│   ├── workouts.ts
│   ├── exercises.ts
│   ├── programs.ts
│   └── profile.ts
├── theme/                      # Tasarım token'ları
│   ├── tokens.ts               # Color, typography, spacing, radius
│   ├── colors.ts               # Dark + light tema renkleri
│   └── ThemeProvider.tsx
├── types/                      # TypeScript types
│   ├── database.ts             # Supabase tablo tipleri (auto-generated)
│   ├── domain.ts               # Workout, Set, Exercise, Program
│   └── i18n.ts
├── hooks/                      # Custom hooks
│   ├── useAuth.ts
│   ├── useGuest.ts
│   └── useI18n.ts
├── assets/                     # Fonts, images
│   ├── fonts/                  # Inter.ttf variants
│   └── images/                 # icon, splash, logo
├── app.json                    # Expo config
├── tsconfig.json
├── package.json
└── README.md
```

**Konvansiyonlar:**
- Stores ve queries **ayrı klasör** (server state vs. UI state ayrımı net olsun)
- Theme ayrı klasör — design token'lar tek yerden export edilir
- Database tipleri auto-generated (`supabase gen types typescript`)
- Hooks domain hook'ları için (auth/guest/i18n); UI hook'ları kendi component'inin yanında

## 3. MVP kapsamı

MVP'de **işlevsel olarak** şu ekranlar/akışlar olacak:

- Auth (giriş, kayıt, şifre sıfırlama, misafir mod)
- Calendar (takvim ana ekranı)
- Workout (egzersiz + program yönetimi tek sekmede)
- Günlük kayıt (Day Detail — set girişi, direkt set ekleme; "Start workout" akışı yok)

**MVP'de placeholder olarak görünür ama işlevsiz:**

- Dashboard (bottom nav'da yeri tutulur)
- Social (bottom nav'da yeri tutulur)

**MVP dışı (sonraya):** Profile, Settings, shared workouts, comments, badges, stats, charts, measurements, data export/import, programlar arası transfer.

## 3.1 Navigation yapısı

Bottom navigation **5 öğeden** oluşur (calendar-prototype-v2'deki yapı):

1. **Calendar** — takvim ana ekranı (aktif)
2. **Library / Kütüphane** — egzersizlerim + programlarım tek ekranda, segmented control ile (aktif)
3. **Dashboard** — placeholder (MVP dışı, ileride aktifleşecek)
4. **Social** — placeholder (MVP dışı, ileride aktifleşecek)
5. **More** — tıklanınca floating panel açar; diğer sayfalara (Profile, Settings, Data, Feedback vs.) buradan erişilir. MVP'de panel **minimal içerik**: Logout (auth'lu kullanıcı) / Hesap Aç (misafir), Language toggle, Theme toggle. MVP-dışı satırlar (Profil, Ayarlar, Veri, Geri Bildirim) **disabled/gri gösterilir** — tap "Çok yakında!" toast verir.

> **E1 More panel kararları (rev 15 — 2026-05-25):**
> - **Floating panel = bottom sheet.** `MoreSheet` component (`AppBottomSheet` wrapper). Bottom nav More tap + B1 avatar tap aynı sheet'i açar (B1 açık soru kapatıldı).
> - **İki entry point:** Bottom nav 5. öğe tap + B1 CalendarAppBar avatar tap — her ikisi de `MoreSheet`'i açar. Route yok, sheet overlay.
> - **Disabled placeholder satırlar gösterilir:** Profil / Ayarlar / Veri / Geri Bildirim satırları `opacity: 0.38` + "Çok yakında!" toast. Kullanıcı kararı (2026-05-25).
> - **Auth varyantı:** Profil özeti (avatar + ad + email, disabled) + Dil + Tema + disabled satırlar + Çıkış Yap (danger).
> - **Misafir varyantı:** Misafir başlık + Dil + Tema + disabled satırlar + Hesap Aç (accent, §3.9 sticky item).
> - **Dil/Tema toggle:** `LangTogglePill` / `ThemeTogglePill` — anında değişim, AsyncStorage'a yazılır.
> - **F1 + F2 PlaceholderScreen:** `PlaceholderScreen` ortak component, icon/title/description prop ile farklılaşır. CTA yok — sade mesaj. Kullanıcı kararı (2026-05-25).

> **Sekme adı kararı (rev 10):** İkinci sekme **EN: Library / TR: Kütüphane** olarak kesinleşti. Sebep: sekme hem egzersiz havuzunu hem program havuzunu barındırıyor; "Workout" dar kalıyor, "Library" mental modeli ("oradan seçerim") doğru kuruyor. Klasör yapısında (`app/(app)/workout/`) ve component klasörlerinde (`components/workout/`) **path adı `workout` olarak kalır** — sadece kullanıcıya görünen sekme etiketi `Library / Kütüphane`. Bu, internal naming ile UI string'i ayrı tutmak için bilinçli bir tercih.

## 3.2 Day Detail davranışı

- Day Detail açıldığında set girişi **direkt aktiftir**; "Start workout" butonu yok.
- Egzersiz kartının içinde "Set Ekle" butonu ile kullanıcı satır ekler ve girer.
- Rest timer manuel başlatılır (set kaydı sonrası otomatik başlatma opsiyonu sonra).
- "Active workout" kavramı MVP'de yok — kullanıcı istediği zaman set ekler/düzenler.
- **Set kaydı:** focus dışına çıkınca / klavye "Done" → otomatik save (debounced). Hata için "Geri al" toast.
- **Önceki kayıt olmayan ilk set placeholder:** "kg" / "reps" hint metni (alan etiketleri placeholder olarak). Yanlış default değer önerilmez.
- **Egzersiz reorder:** Long-press drag — **sadece görünür 6-nokta handle'da** (header sağı; set satırlarına/TextInput'lara bulaşmaz). **(rev 18 — UYGULANDI):** paketsiz custom drag (Reanimated 4 + gesture-handler); TÜM kartlar (persisted + lazy) sürüklenir; sıra `app_day_meta.card_order`'da (lazy kartlar workout yazılmadan sıralanır — lazy-write korunur). Detay §8.11 Checkpoint 2.
- **Geçmiş düzenleme:** Her zaman read-write; bugün ve geçmiş aynı davranır.
- **Önceki set placeholder (rev 12 — web'den ayrıldı):** O egzersizin bugünden önceki en son antrenmandaki setleri set-by-set **gerçek değer olarak prefill edilir** (placeholder hayalet metin değil). Web'de placeholder hayalet gibiydi, kullanıcı yine manuel yazmak zorundaydı; mobilde **input value'ları gerçek sayılarla dolar** — kullanıcı aynı ağırlığı tekrar girecekse hiçbir şey yapmaz, sadece RIR'i (veya farklı bir reps'i) günceller. Kaynak: same `exercise_ref` için en son `workout_date` (program bağı yok — preset/custom ayırt etmeden, programa olsun veya olmasın en son kayıt). Hiç önceki kayıt yoksa input boş kalır; hint metni `kg` / `reps` (Açık karar kalan §3.2 1. yolculuk son kararı).
- **"Save vs auto-prefilled" ayrımı:** Otomatik prefill edilen değer DB'ye **anında yazılmaz**; kullanıcı input'a dokunduğunda veya focus-blur olduğunda (yani örtük onay) save tetiklenir. "Bench Press kartını hiç açmadan geçtim" durumunda DB'ye placeholder yazılmaz (lazy yazma kuralıyla — bkz. C3 lazy/sanal).
- **Aktif program + boş gün:** Programdaki bugünün egzersizleri **otomatik kartlanmış** olarak görünür (boş state yok). Lazy/sanal yazma stratejisi: ekranda render edilir ama `app_workouts` tablosuna **sadece set girilince** yazılır.
- **Program egzersizi silme:** Modal sorar — "Sadece bugün mü, tüm programdan mı?" Sadece bugün → o gün skip; programdan → `app_program_days`'den satır silinir.

## 3.5 Calendar davranışı

- **Default açılış:** Calendar sekmesi + bugünün ayı (son bakılan ay hatırlanmaz).
- **Bugünün indicator'ı:** Gold border.
- **Workout indicator:** Mini kategori chip'leri (calendar-prototype-v2 referans — örn. mavi=göğüs, yeşil=sırt). **Hücre başına max 2 chip** (ilk 2 kategori); fazlası taşırır, detay Day Detail'de.
- **View modes:** Month (default) + Week (sonsuz scrollable feed).
- **İlk kullanıcı için empty state:** Hint kartı görünür ("İlk antrenmanını ekle..."). **Konum:** grid'in altında. **Görsel:** sade text card — gold accent dot + başlık + 1 satır açıklama + 2 kompakt buton ([Bugünü Aç] [Program Seç]). Illustration yok. **Kapanış:** ilk workout eklenince otomatik kaybolur, manuel X yok.

### 3.5.1 Felsefe notu — Calendar'da kaçırılan günleri gizleme

> Bu kararın amacı **demotivasyon değil, görsel netlik**: kullanıcı takvime baktığında "hangi günler antrenman yaptım" sorusuna anında cevap alsın diye. Programs tab'daki compliance % farklı amaca hizmet eder (program disiplinim metriği) ve **gerçek rakam** (yapılan / yapılması gereken) gösterir — bu motive eder.

## 3.5.2 Geçmiş günde program context

- Geçmiş bir güne (Day Detail) tıklandığında üst bar subtitle'da **program context gösterilmez** — sadece tarih + gün adı görünür.
- Sebep: kullanıcı 6 ay önceye baktığında "o zaman hangi program aktifti?" sorusu öncelik değil, set'lerine bakar.
- Şema sade kalır: `app_programs`'a `deactivated_at` field'ı **eklenmez**.
- Bugün ve gelecek günler için program context (üst bar subtitle) görünür (aktif program varsa).

## 3.8 "Hazır Program Seç" CTA davranışı

Hem Calendar empty hint kartında hem Day Detail empty state'inde bulunan **"Hazır Program Seç"** CTA'sı:

- **Hedef:** Workout sekmesine yönlenmez. Doğrudan **preset program seçim modal'ı** Calendar/Day Detail üzerinde açılır.
- **Modal içeriği:** Başlık "Hazır Program Seç" + 4 preset listesi (her satırda program adı + kısa açıklama + gün-chip mini grid) + satıra tap → preview → [Bu Programı Başlat] butonu.
- **Preview detayı (rev 11):** Satıra tap edince açılan preview'da **her günün tüm egzersizleri always expanded** olarak görünür. Gün başlığı (Pzt/Çrş/Cum vs.) + altında o gündeki egzersiz isimleri listesi. Scroll uzun olabilir (4-6 günlük programda); kullanıcı program seçerken tam görmek ister, mental "sürpriz yok" garantisi. Collapse/expand yok — tek scroll'lu transparent görünüm.
- **Alt link:** "Daha sonra kendim ekleyeceğim" → modal kapanır.
- **Seçim aksiyonu:** Program `app_programs`'a kopyalanır, hemen aktif edilir (`activated_at: bugün`), modal kapanır, ekran yenilenir (artık program kartları / chip'leri görünür).
- **Sıfırdan oluştur seçeneği bu modal'da YOK** — yeni kullanıcı için preset hızlı başlangıç önemli. Sıfırdan oluştur Workout sekmesi → Programs tab → Add Program akışında bulunur.

## 3.6 Auth & Session

- **Email confirmation:** KAPALI (MVP). Hesap açar açmaz Calendar'a girer.
- **Auto-login:** Tam aktif. Token `expo-secure-store`'da, refresh otomatik.
- **Logout:** More menüden manuel.

## 3.9 Misafir (Guest) mod detayları

- **Sınırlama bildirimi:** Welcome ekranında buton altında küçük not ("Verin sadece cihazda saklanır") + uygulama içinde profil avatarı yerine **"Misafir" badge**. Sürekli üst banner KULLANILMAZ.
- **Özellik kilidi:** YOK. Tüm MVP özellikleri (Calendar, Workout, Day Detail, Programs) misafir için açık.
- **Veri kaydı:** AsyncStorage, JSON anahtarları (`@logwise/guest/exercises`, `@logwise/guest/programs`, `@logwise/guest/program_days`, `@logwise/guest/workouts`, `@logwise/guest/sets`, `@logwise/guest/day_meta`, `@logwise/guest/profile`). Supabase'e hiç çağrı yapılmaz. **Anahtar format kuralı (rev 10):** Prefix `@logwise/guest/`, sub-key **snake_case** ve DB tablo isimleriyle birebir eşleşir (`program_days`, `day_meta` gibi). Versiyon prefix'i (`v1/`) MVP'de yok; ileride schema kırılırsa eklenir.
- **Hesap Aç CTA:** More menüde sticky item.

### 3.9.1 Guest → Hesap geçişi (ÖNEMLİ — önceki karar revize)

> **Bu karar §5'teki "guest verisi yok sayılır" kararını GEÇERSİZ KILAR.**
> Daha önce MVP basitliği için "atılır" denmişti; 4. yolculuk haritalama sırasında veri kaybının kötü deneyim olduğu görüldü ve aktarımın teknik olarak makul olduğu netleşti.

Akış:
1. Misafir More menüden "Hesap Aç"a basar → Register ekranı.
2. Form doldurulur, submit edilir.
3. Modal onayı: "Misafir verileriniz hesabına aktarılacak. Devam?"
4. Onay → Supabase `signUp` → `auth.users.id` elde edilir.
5. AsyncStorage'daki tüm guest anahtarları okunur ve yeni `user_id` ile `app_*` tablolarına insert edilir. UUID'ler regenerate edilir. `exercise_ref`'ler aynen taşınır (slug veya UUID).
6. Loading state (5-10 sn).
7. **Başarılı:** AsyncStorage guest anahtarları **silinir**, toast: "X egzersiz, Y antrenman aktarıldı".
8. **Hata:** AsyncStorage **silinmez** (rollback), retry seçeneği.

**Loading state UI (rev 11):** **Full-screen modal + sade spinner.** Tam ekran overlay (siyah scrim), ortada gold spinner + altında tek satır metin "Verileriniz aktarılıyor, bu birkaç saniye sürebilir...". Canlı progress (X/Y aktarıldı) **MVP'de yok** — TanStack Query batch insert'le yazıyoruz, granular progress emit etmek gereksiz karmaşıklık. Süre uzarsa (15+ sn) metin değişir: "İşlem biraz uzadı, lütfen bekleyin...". Kullanıcı dismiss edemez; başarı veya hata kapatır.

## 3.10 Web'den gelen kullanıcı (web → mobil geçişi)

- **Tanıma:** Login sonrası `select count(*) from user_data where user_id = $1` — sonuç > 0 ise web kullanıcısı.
- **Tek seferlik "Hoş geldin" modal:** Web kullanıcısı için ilk mobil login'inde. İçerik:
  - Mesaj: "Mobil app ayrı bir veri katmanı kullanıyor. Web hesabınızla giriş yaptınız ama antrenman geçmişiniz web tarafında kalıyor. Mobil için sıfırdan başlayacaksınız."
  - Web link: tarayıcıda `https://logwise.fit` açılır (React Native Linking API).
  - [Mobil'e Başla] primary buton, [Web'e Git] secondary buton.
  - "Bu mesajı bir daha gösterme" toggle (default işaretli).
- **Modal görünüm bayrağı:** `app_profiles.preferences.seen_web_welcome = true` (jsonb).
- **Modal görsel stili (rev 11):** **Merkez modal (dialog), orta boy.** Scrim arka plan (siyah, ~60% opacity), ekran ortasında card modal — sabit max-width (~340-360pt), padding'li. İçerik sırası: marka mark (üstte, küçük), başlık ("LogWise Mobile"), 2-3 paragraf mesaj, web linki, 2 buton ([Mobil'e Başla] primary gold + [Web'e Git] secondary ghost), en altta toggle ("Bu mesajı bir daha gösterme"). Tam ekran sheet veya bottom sheet **değil** — tek seferlik info için orta boy dialog yeterli; app'in geri kalan modal'larıyla (preset program, sil onay) tutarlı patterni korur.
- **Toggle default (rev 11):** "Bu mesajı bir daha gösterme" toggle **default işaretli (true)**. Sebep: modal tek seferlik bilgi, kullanıcı OK demeden bile bir daha görmek istemez; sade UX. Kullanıcı isterse manuel uncheck eder.
- **Geri kalan akış:** Yeni kullanıcı ile birebir aynı (Calendar boş + hint kartı + ilk antrenman).
- **Paralel yaşam:** Mobile ve web ayrı veri katmanları. Birbirini etkilemez.

## 3.11 Yayın (launch) kapsam kararı — solo-tamamla, sosyali ertele (rev 22 — 2026-06-19)

> Bu karar §3'ün bazı MVP-scope kararlarını **GÜNCELLER** (aşağıda işaretli). UI cila
> kampanyası bitince "MVP'yi şimdi mi yayınlayalım" sorusu açıldı; karar: **tek-kullanıcı
> (solo) deneyimini tamamlayıp Play Store'a çıkmak**, sosyali yayın sonrası v2'ye bırakmak.
> Gerekçe: Dashboard/Profile solo değer taşır + cold-start'tan bağımsız; Social ise
> kullanıcı tabanı olmadan ölü ağırlık (en riskli/karmaşık kısmı tahminle kurmamak için ertelenir).

- **Dashboard:** placeholder → **GERÇEK (launch öncesi)**. İstatistik/ilerleme; fitness app'in
  çekirdek değer önermesi. *(§3 + §3.1 "Dashboard placeholder/işlevsiz" GÜNCELLENDİ.)*
- **Profile:** MVP-dışı → **launch öncesi IN** (düşük efor + store zorunluluğu). Profil/ayar
  ekranı + **hesap silme akışı** (Apple 5.1.1(v): hesap oluşturma varsa uygulama içi silme zorunlu).
  *(§3 "Profile MVP dışı" GÜNCELLENDİ.)*
- **Social:** **bottom nav'dan GİZLE**; v2'de gerçek kullanıcı tabanıyla. *(§3 + §3.1 "Social
  placeholder görünür" → sekme gizlenir.)*
- **Launch hedefi = Play Store** (Android önce). Yeni Play geliştirici hesabında **20-tester /
  14-gün kapalı test** şartı → hesap + kapalı testi geliştirmeyle **paralel** başlat (saat işler).
- **Blocker'lar (launch öncesi):** Resend SMTP fix (email-confirm AÇIK → reviewer maili almazsa
  red), `mobile-design-system` → `master` merge, privacy policy URL, store listeleme içeriği
  (ekran görüntüleri/açıklama/data-safety), prod `app.json` Sentry DSN.

## 3.7 Add Exercise modal davranışı

- **Default mode:** Single tap → hemen Day'e eklenir, modal kapanır.
- **Multi-select:** Uzun bas → selection mode'a geçer → birden fazla işaretle → alt barda "N hareket · Ekle".
- **Sekmeler:** Kütüphanem / Hazır Hareketler / Yeni Özel.
- **Kategori chips:** Filtreleme için.

## 3.3 Auth ek detay

- Username MVP'de **yok** (ne register'da ne profile'da). Sosyal MVP'de olmadığı için gerekmez. İleride eklenir.

## 3.4 Dil

- **TR + EN** desteklenir (web ile aynı). Mevcut `data/i18n-tr.js` ve `data/i18n-en.js` sözlükleri TS'e port edilir.
- Varsayılan dil: cihaz diline göre (Turkish ise TR, değilse EN). Kullanıcı More menüden değiştirebilir.

## 4. Backend kararları

### 4.1 Altyapı

- **Aynı Supabase projesi** (mevcut `czbxujioufhmvoajqwzp.supabase.co`)
- Web'in eski tabloları aynen kalır (`user_data`, `feedback`, `profiles`, `shared_workouts` vs.)
- Mobil için yeni tablolar `app_` prefix'iyle eklenir
- Auth user'ları ortak — kullanıcı aynı hesapla her iki ürüne girer

### 4.2 Bağlantı modu

- **Online-only** MVP. Offline-first hedef değil.
- Salon Wi-Fi'si zayıfsa kullanıcı görür; MVP'de tam offline mod yok.
- İleride PWA-tarzı cache ve sync eklenebilir (MVP sonrası).

### 4.3 Şema yaklaşımı — Hibrit

**Normalize tablolar** (yoğun yazılan, query'lenen veriler):

- `app_exercises` — kullanıcının **custom** egzersizleri (preset hareketler ayrı tabloya kopyalanmaz)
- `app_programs` — programlar (kullanıcının sahip olduğu)
- `app_program_days` — programın haftalık günleri
- `app_workouts` — bir günde bir egzersiz için yapılan antrenman
- `app_sets` — set satırları (en yoğun yazılan tablo)

**JSONB alanlar** (esnek, nadiren query'lenen):

- `app_profiles.preferences` — kullanıcı ayarları (theme, language, vs.)
- `app_workouts.notes` — egzersiz notu (text)
- `app_day_meta` — gün notu, süre, skipped_exercise_ids

### Preset hareketler stratejisi (KRİTİK)

Preset 54 hareket **Supabase'e kopyalanmaz**. Bundle'da JSON olarak global okuma-only havuz olarak kalır. Bu sebeple:

- `app_exercises` sadece kullanıcının custom egzersizleri için. `is_custom` field gereksiz (her zaman true).
- `app_workouts.exercise_ref text` ve `app_program_days.exercise_ref text` — **polymorphic referans**:
  - Preset egzersiz ise: slug string ("bench-press")
  - Custom egzersiz ise: UUID string
- Frontend ayırt eder: slug formatı (kebab-case, harf+rakam+tire) UUID formatından (8-4-4-4-12 hex) farklı.

### Detaylı şema taslağı

```
auth.users  (Supabase Auth — değişmez)

app_profiles
  user_id (PK, FK auth.users)
  username (unique, nullable — MVP'de yok ama alan kalır)
  display_name, avatar, locale, theme
  preferences jsonb
  active_program_id (FK app_programs, nullable)
  created_at, updated_at

app_exercises                 -- SADECE custom egzersizler
  id (uuid, PK)
  user_id (FK)
  name text                   -- kullanıcı verdiği ad
  categories text[]           -- ["Göğüs","Triceps"]
  notes text                  -- exerciseNotes
  created_at

app_programs
  id (uuid, PK)
  user_id (FK)
  name, description
  preset_origin text          -- preset'ten kopyalanmışsa slug (opsiyonel)
  cycle_type text             -- "none" | "weekly" | "deload"
  deload_every int
  off_days int[]              -- [5,6] = Cmt,Paz
  activated_at timestamptz
  created_at, updated_at

app_program_days
  program_id (FK)
  day_index int               -- 0=Pzt ... 6=Paz
  exercise_ref text           -- POLYMORPHIC: slug VEYA UUID
  position int                -- gün içindeki sıra
  PRIMARY KEY (program_id, day_index, position)

app_workouts
  id (uuid, PK)
  user_id (FK)
  workout_date date           -- YYYY-MM-DD
  exercise_ref text           -- POLYMORPHIC: slug VEYA UUID
  position int
  superset_group int
  duration_minutes int        -- MVP'de yazılmaz, alan ileride
  notes text
  created_at, updated_at
  UNIQUE (user_id, workout_date, exercise_ref)

app_sets
  id (uuid, PK)
  workout_id (FK app_workouts)
  set_index int
  set_type text               -- "working"|"warmup"|"drop"|"superset"
  weight numeric
  reps int
  rir text                    -- "-","F","1","2","3","4+"  (rev 12: "F" = Failure; web'deki "0" yerine — UI ile DB tek dil)
  created_at

app_day_meta
  user_id (FK)
  workout_date date
  day_note text
  total_duration_minutes int  -- MVP'de yazılmaz
  skipped_exercise_ids text[] -- "sadece bugün skip" listesi (slug veya UUID)
  card_order text[]           -- (rev 18) Day Detail birleşik kart sırası (persisted+lazy ref'leri); lazy kartlar workout yazılmadan sıralanır
  PRIMARY KEY (user_id, workout_date)
```

### 4.4 Güvenlik

- Her `app_*` tablosunda RLS aktif
- Her satırda `user_id` alanı
- Policy: `auth.uid() = user_id` — herkes sadece kendi verisini görür/yazar
- Misafir kullanıcı `app_*` tablolarına dokunmaz

## 5. Auth kararları

- **Email + şifre:** Aktif (Supabase native).
- **Misafir (guest) mod:** Aktif. Veri sadece cihazda (AsyncStorage). Supabase'e hiç gitmez.
- **Google OAuth:** MVP dışı (sonra).
- **Apple Sign-In:** MVP dışı (sonra — iOS App Store yayını için 3. parti OAuth varsa zorunlu olur, MVP'de OAuth yok).
- **Guest → hesap geçişi:** Veri **otomatik aktarılır** (modal onayıyla). Detay: §3.9.1. *(Bu karar rev 7'de revize edildi; eski karar "yok sayılır" idi.)*

## 6. Preset veri stratejisi

- **Bundle'da JSON.** Mevcut `data/presets-exercises.js` (54 hareket) ve `data/presets-programs.js` (4 program) TypeScript'e port edilir, app içine gömülür.
- App ilk açılışta preset listesini anında gösterir; network gerekmez.
- Yeni preset eklemek için app güncellemesi gerekir (Expo OTA update ile store yayını olmadan da güncellenebilir).
- i18n sözlükleri (`i18n-tr.js`, `i18n-en.js`) de bundle'da kalır.
- Kullanıcı bir preset seçince `app_exercises` veya `app_programs` tablosuna kopyalanır; `preset_id` / `preset_origin` alanıyla kaynağı izlenir.

## 7. Tasarım sistemi referansı

- Tüm token'lar ve component API'ları için: `docs/mobile-design-system/02-mobile-design-system-proposal.md`
- Dark-first, gold accent (`#f0c040`), Inter + Space Grotesk + JetBrains Mono
- **Bağlayıcı kural:** Hazır prototipler **tüm ekranlar için ana referanstır**. Bir ekran tasarlanırken/kodlanırken önce ilgili prototip incelenir ve görsel/etkileşim olarak takip edilir. Yeni bir görünüm icat edilmeden önce prototipte karşılığı kontrol edilir.
- Prototipler:
  - `auth-prototype/` → Auth ekranları (Login, Register, Forgot, Verify)
  - `calendar-prototype-v2/` → Calendar Month + Week + Bottom Nav
  - `day-prototype/` → Day Detail (idle + active state, rest timer)
  - `workout-prototype/` → Workout sekmesi (Exercises + Programs)
  - `homepage-prototype-v2/` → Genel marka diline referans

## 8. Ekran kapsamı detayı

### 8.1 Calendar
- **Month view:** Var. Default.
- **Week view:** Var. `calendar-prototype-v2`'deki gibi sonsuz scrollable feed.
- Toggle butonu üst barda (prototipte var).

### 8.1.1 Calendar cila turu — kullanıcı kararları (rev 16 — 2026-06-16)

> Bu kararlar bazı önceki MVP kararlarını **GEÇERSİZ KILAR** (aşağıda işaretli). Kullanıcı talebi; implement edildi.

**Month view:**
- **Chip'ler kategori değil HAREKET ADI gösterir.** §3.5'teki "max 2 kategori chip" kuralı kalktı; o günün tüm hareketleri ad olarak chip'lenir (hücre yüksekliğiyle overflow-clip — "..." yok, prototip geometrisi). Renk hâlâ kategoriye göre. *(§3.5 "kategori chip / max 2" GEÇERSİZ — month için.)*
- **Planlı (gelecek) chip'ler:** Aktif programın o güne denk gelen hareketleri, **bugün + gelecek** ve **henüz loglanmamış** günler için **soluk** (opacity ~0.45) chip olarak görünür. Geçmiş günler sadece gerçek log gösterir. Kaynak: `resolveProgramDay` (off-day/week/deload mantığı dahil). Aktif program yoksa planlı chip yok.
- **Chip yüksekliği** font'a yakın azaltıldı (14→12).
- **Aylar arası yatay swipe:** `react-native-gesture-handler` Pan, yön kilitli (`activeOffsetX ±24`, `failOffsetY ±18`) — dikey/diagonal niyet yanlışlıkla ay değiştirmez. Sol→sonraki, sağ→önceki ay. (Chevron'lar app bar'da kalır.)

**Week view (akordiyon — §B1 + §8.3'ü GEÇERSİZ KILAR):**
- **Collapsed satır:** sol-üst küçük "N hareket · M set" + altında o günün **kategori (bölge) chip'leri**. Planlı gün soluk.
- **Chevron tap → akordiyon:** o gün yerinde açılır (aynı anda tek gün); alt alta hareket satırları, her birinin **sağında son seanstaki en ağır set "kg × tekrar"** (`useLastSession`, lazy — sadece açılınca fetch; "—" eğer geçmiş yok).
- **Gün gövdesine tap (chevron hariç) → Day Detail'e gider** (router.push).
- **Detay altında "Start workout" → kronometre** + **Durdur** (duraklat/devam) + **Bitir**. **KRONOMETRE GEÇİCİDİR (ephemeral):** sadece UI state, DB'ye yazmaz, akordiyon kapanınca/ekrandan çıkınca sıfırlanır. *(§8.3 "timer Day Detail'de, manuel" + §3.2 "active-workout kavramı yok" + §B1 "week expanded + timer MVP'de yok" — bu üçü week view için GEÇERSİZ.)*
  - **Açık/ertelenmiş:** Süre kalıcılığı (Bitir → `app_day_meta.total_duration_minutes`) ileride değerlendirilecek (kullanıcı hatırlatma istedi). Şema alanı hazır.

### 8.2 Day Detail
- **Start workout butonu yok.** Day Detail açılınca set girişi direkt aktiftir.
- Egzersiz kartının içindeki "Set Ekle" butonu ile satır eklenir.

### 8.3 Rest Timer
> **REST TIMER MVP'DEN ÇIKARILDI (rev 17 — 2026-06-17, kullanıcı kararı).** MVP'de set
> arası dinlenme sayacı **yok**. Day Detail'de bunun yerine week-view ile tutarlı,
> "Start workout" ile başlayan **geçici (ephemeral) antrenman kronometresi** var (§8.11).
> Aşağıdaki rest-timer kararları MVP sonrasına ertelendi (referans için duruyor).
- ~~**Manuel başlatma.** Set kaydı sonrası otomatik başlatma MVP'de yok.~~ (MVP sonrası)
- Push notification entegrasyonu MVP'de yok (background timer dahil sonra).
- ~~Day Detail'in sticky bottom alanında görünür (prototip referans).~~ (yerini antrenman kronometresi aldı)

### 8.4 Program Edit
- **Prototipteki seviyede.** Drag/reorder, cycle settings (none/weekly/deload), deload_every, off_days, gün başına egzersiz ekle/çıkar — hepsi prototip kapsamında.

### 8.4.1 Yeni program "Sıfırdan oluştur" akışı (rev 11)

- **Entry point:** Library / Kütüphane → Programs tab → "+ Add Program" butonu.
- **Akış:** Tek bottom sheet açılır, sadece **"Program adı"** input'u + (opsiyonel) **"Açıklama"** input'u. Kaydet → satır `app_programs`'a insert edilir (boş, sadece isim) → **kullanıcı doğrudan Program Edit ekranına atılır**.
- **Program Edit'te:** Cycle tipi (none/weekly/deload), deload_every, off_days, ve günlere egzersiz ekleme — hepsi orada yapılır. Yani "sıfırdan oluştur" = sadece isim al + Edit'e at; geri kalan sahip olduğun Program Edit ekranı.
- **Wizard yok** — deneyimli kullanıcı için hızlı, az sürtünme. Yeni kullanıcının zaten "Hazır Program Seç" alternatifi var (Calendar empty hint kartı § 3.8).
- **Aktif etme:** Yeni program varsayılan olarak aktif **edilmez**. Kullanıcı Edit'i bitirip program detayında "Bu programı aktif et" toggle'ı ile aktive eder. (Hazır preset seçimi farklı: orada otomatik aktif — § 3.8 referans.)

### 8.5 Theme
- **Light mode aktif** (web'deki gibi toggle).
- Toggle More menüde olur.
- Token'lar: web'in `styles/base.css`'deki light teması mobile için aynen taşınır (uyum için).

## 8.6 Custom egzersiz & Compliance

- **Custom egzersiz kategori seçimi:** **Default "Diğer"** — kullanıcı seçmezse otomatik atanır. Veri tutarlı, sürtünmesiz.
- **Compliance % formülü:** Yapılan / Yapılması gereken (web `calcCompliance` ile aynı). Off_day'ler dışlanır. Gerçek rakam gösterilir (örn. %75) — motivasyonel.

## 8.8 Day Detail görsel/etkileşim kararları (rev 12)

C1-C4 spec yazımı sırasında ortaya çıkan kararlar:

- **Empty state icon:** `lucide-react-native` → **Dumbbell** outline, 48pt, `t-tertiary` renk. Day Detail empty + Library empty + Add Exercise empty hepsinde tutarlı.
- **Empty state CTA layout:** Responsive — **≥360pt yan yana**, **<360pt stack** (`flexWrap`). iPhone SE 1 gibi dar ekranlarda otomatik dikey yığın.
- **Drag handle (long-press reorder):** **Visible 6-dot icon** (lucide `GripVertical`), kart başlığının sağ kenarında (⋯ menünün solunda), `t-tertiary` renk. Long-press affordance'ı net; set satırlarına bulaşmaz (§3.2). **(rev 18 — UYGULANDI):** her kartta görünür (persisted + lazy + tek kart); paketsiz custom drag; sıra `app_day_meta.card_order`. Detay §8.11 Checkpoint 2.
- **Superset MVP'de:** **YOK.** Set type chip seçeneklerinden "SS" (superset) **çıkarılır**; sadece `working` / `warmup` / `drop` kalır. Şemadaki `app_workouts.superset_group` alanı **kalır** (MVP'de yazılmaz; gelecek için yer tutar). Set type enum değişikliği: `"working" | "warmup" | "drop"` (MVP); `"superset"` MVP sonrası eklenir.
- **RIR display = DB ("F" standardı):** UI'da "F" gösterilir, DB'ye de "F" yazılır (rev 12 değişikliği; web "0" idi). Web mobil ayrı veri katmanı zaten (§4.1), web RIR'i etkilenmez.
- **Geçmiş program günü davranışı:** Bugünden önceki bir program günü açılır ve o güne hiç set girilmemişse → **boş state** gösterilir (C1 empty gibi). Lazy kartlar render edilmez. Subtitle'da program context da yok (§3.5.2 zaten böyle). Sebep: "o gün hiç açmadım, neden egzersizler var?" şaşkınlığını önler.
- **Program günü label MVP'de yok:** "Push Day" / "Pull Day" gibi kullanıcı tanımlı etiketler MVP dışı. Subtitle = "ProgramAdı · HaftanınGünü · Hf N" (örn "PPL · Pazartesi · Hf 2"). `app_program_days.label` field eklenmez; MVP sonrası eklenir.
- **C4 "Kütüphanem" sekmesinin kapsamı:** Custom egzersizler + **tüm tarihçede kullanılmış preset slug'lar** (distinct). Eski denemeler de listede kalır; "yakın zamanda kullandığım" filtresi yok. Search/filter ile gerekirse daraltılır.
- **B1 Hint kartı kapanışı (sticky dismiss):** Kart bir kere kapandıysa (ilk workout eklendiğinde) **bir daha gösterilmez**, kullanıcı tüm workout'larını silse bile. Flag: AsyncStorage'da `@logwise/seen_hint_card: true` (guest) veya `app_profiles.preferences.seen_hint_card = true` (auth).
- **B1 Month view swipe:** **Var.** Sol/sağ horizontal swipe = önceki/sonraki ay. `react-native-pager-view` ile implementasyon. Today pill swipe sonrası bugünün ayına dönmek için kalır (her zaman görünür).

## 8.9 Library (D1-D2) spec yazımı kararları (rev 13)

D1-D2 spec yazımı sırasında netleşen kararlar:

- **§8.4.1 NewProgramSheet ana implementasyonu D2'dedir:** "+ New" pill (D2 app bar) → NewProgramSheet bottom sheet — sadece "Program adı" zorunlu + opsiyonel "Açıklama" → Kaydet → `app_programs` insert (`activated_at = null`; varsayılan aktif **değil** — §8.4.1) → **router.push('/workout/program/[id]/edit')** D3 Program Edit ekranına. Wizard yok; alt sürtünme MVP felsefesi (§8.4.1). Sheet dismiss = backdrop tap / drag down / "İptal" — kapanır, hiçbir şey yazılmaz.
- **D3 Program Edit MVP scope'unda ama bu seansta spec yok:** Program Edit ekranı (cycle settings, off_days, gün-bazlı egzersiz ekle/çıkar, drag/reorder, aktif et toggle) MVP'nin parçasıdır. Bu seansta D2 spec'i tamamlandı; D3'ün kendi 9-bölüm spec'i sıradaki seansa kaldı. D2'de sadece **router.push tetiklendiği** kararı yazıldı (✎ icon ve pasif "Düzenle" link D3 entry'leri).
- **Library/Kütüphane route yapısı:** D1 ve D2 **tek route** (`app/(app)/workout/index.tsx`); segmented control ile içerik swap. URL değişmez. Search/filter state **sekmeye özel** — Exercises filtresi Programs'a taşmaz.
- **D1 Exercises kütüphane kapsamı:** Custom egzersizler + **tüm tarihçede `app_workouts.exercise_ref` distinct preset slug'lar** (§8.8 rev 12'deki C4 Kütüphanem kapsamıyla **birebir tutarlı**). Tarih filtresi yok; eski denemeler de listede kalır.
- **D1 row tap davranışı = preview:** Single tap → ExPreviewModal (gif + açıklama + tips). C2/C3'teki 👁 ile aynı component. Long-press veya ⋯ icon → ExerciseRowMenu (Preview / Edit / Delete — custom için 3; preset için "Hazır hareket — düzenlenemez" disabled bilgi).
- **D1 custom delete cascade:** `app_workouts.exercise_ref` (UUID) **soft reference** kalır (FK değil). Custom egzersiz silinince geçmiş antrenmanlar **persist eder**; ref resolve fail durumunda fallback display ("(silinmiş egzersiz)"). Modal mesajı: "Geçmiş antrenmanların etkilenmez, sadece kütüphaneden kalkar." (Bu karar henüz açık — D1 açık sorularda detay; final onay sonraki seansta.)
- **D2 ActiveProgramCard merkezi yapı:** workout-prototype Phone 2 birebir port — ap-head (kicker + adı + meta) + ✎ edit + ⋯ menu (sağ üst) + ap-stats (3 stat: Uyum gold + Seri + Sıradaki) + ap-days (7-chip grid; bugün gold border, rest day "—" + cyan) + ap-cta-row ("Bugünkü workout" → /calendar/day/[today]; "Haftayı gör" → /calendar?view=week).
- **Tek aktif program kuralı uygulaması:** Pasif programa "Aktif Et" tap'i halihazırda aktif program varsa **ActivateConfirmModal** sorar ("PPL şu an aktif. Üzerine yazmak ister misin?"). Onay → eski `activated_at = null` + yeni `activated_at = today` (atomik mutation veya transaction). UI'da featured card yer değiştirir; eski program "Diğer programlar" listesine düşer.
- **D2 program delete cascade:** `app_programs` + `app_program_days` silinir; `app_workouts` **etkilenmez** (geçmiş kayıt korunur). UndoToast 5sn. Modal mesajı: "Sil? Geçmiş antrenmanların etkilenmez."
- **D2 "+ New" sadece sıfırdan:** Preset entry'si "+ New" ile birleşmez. Hazır preset seçim akışı **B1 hint kartı** + **C1 empty state secondary CTA** + **D2 empty state CTA "Hazır Seç"** (PresetProgramModal). Aktif programlar ekranında preset seçmek nadir; mevcut kullanıcı için "+ New" niyeti sıfırdan oluşturma. Eski rev 11'deki "Add Program segmented modal (Hazır / Sıfırdan)" prototip taslağı **iptal**; ayrı akışlar nettir.
- **D2 day-chip grid tap MVP'de no-op:** Hücreler decorative; tap → no-op. Sonra detaylandırılabilir (örn. o günkü Day Detail'e push).
- **D2 Paylaş satırı MVP'de gizli:** Pasif/aktif program ⋯ menüsünde "Paylaş" satırı **gizli** (sosyal MVP dışı, §3 MVP scope). MVP sonrası eklenir.
- **App bar sol icon (D1+D2):** **Hamburger** — workout-prototype'a sadık (rev 13 onay). Tap → bottom sheet More açar. B1 Calendar'da avatar pattern (calendar-prototype-v2 referans) korunur; her ekran kendi prototipinin app bar dilini takip eder. Tutarlılık mental modeli **prototipler arası** kurulur (her ekranın kendi imzası), pan-screen identical değildir. Avantaj: prototip-ekran karşılığı bire bir; workout sekmesinde "menü açma" daha doğrudan affordance.
- **D1 empty state CTA sadeleştirildi:** Empty state'te tek CTA → **"+ Yeni Özel"**. Önceki sketch'teki "Hazır Listele" CTA'sı **kaldırıldı**. Preset keşfi B1 hint kartı + C1 secondary CTA + C4 modal "Hazır Hareketler" tab'ı üzerinden devam eder; D1 niyetine (özel egzersiz oluşturma + kütüphane yönetimi) odaklı, daha temiz UI. Empty state Dumbbell-48pt + başlık + 1 satır + tek CTA.
- **D1 custom delete = soft reference + fallback display (kesin karar — rev 13):** `app_workouts.exercise_ref` (UUID) **FK değil, text alanı (soft reference)**. Custom egzersiz silinince `app_exercises` DELETE; ilgili `app_workouts` ve `app_sets` satırları **persist eder**. Resolve sırasında UUID `app_exercises`'ta bulunamazsa fallback display: `"(silinmiş egzersiz)"`. Modal mesajı: "Geçmiş antrenmanların etkilenmez, sadece kütüphaneden kalkar." Şema sade — `deleted_at` kolonu **eklenmez**, soft-delete tablosu yok. Cascade delete (geçmiş kayıt silimi) reddedildi — kullanıcı veri kaybı kritik UX risk.
- **Sıradaki seans önceliği = D3 Program Edit (rev 13 onay):** D2'nin "router.push D3" kararı boşta; D3 yazılmadan D2 işlevsel olarak tamamlanmaz. D3 kapsamı: cycle settings (none/weekly/deload + deload_every + off_days), gün-bazlı egzersiz ekle/çıkar (her gün ayrı liste + C4 entry), drag/reorder (gün içi pozisyon ve gün-gün taşıma), program aktif et toggle, sil. Prototip kaynağı: web `program.html` + auth-prototype dilini referans. E1+F1+F2 D3'ten sonra tek seansta birlikte alınabilir (kısa ekranlar).

## 8.10 D3 Program Edit kararları (rev 14)

D3 spec yazımı sırasında netleşen kararlar:

- **D3 tam ekran route, state ayırt etmez:** `app/(app)/workout/program/[id]/edit.tsx`. NewProgramSheet save + D2 ✎ icon + D2 OtherProgramsList "Düzenle" hepsi aynı route'a push. Yeni vs mevcut görsel ayrım **yok**; ekran mount'ta query çeker. Modal değil — tam ekran (mobile ergonomi, derin edit). Wizard yok (§8.4.1 ile tutarlı).
- **Gün layout = dikey scroll + collapsible panels:** 7 gün Pzt-Paz dikey listelenir; her gün ayrı genişleyen panel (chevron). Default: bugünün günü açık, diğerleri kapalı. Multi-expand izinli (accordion zorlamaz — kullanıcı 3 günü açık tutup karşılaştırabilir). Web `app.html`'in 7-day chip stripe + seçili-gün-altta pattern'inden mobile için ayrıldık (rev 14).
- **Cycle type 3 seçenek — `weekly` default (rev 14 — KAPATILDI):** Mobile cycle type'lar:
  - **`weekly`** (default) — Haftalık tekrar. Compliance hesabı aktif. En yaygın kullanım. Web `app.html`'de **yoktu**; mobile için yeni eklendi (haftalık tekrar standart mental modeli).
  - **`deload`** — N hafta normal + 1 hafta deload döngüsü. `deloadEvery` field 3/4/5/6/8 (web ile aynı). Compliance hesabı aktif; deload week için subtitle "Deload" label.
  - **`none`** — Tek seferlik plan (haftalık tekrar yok). Compliance hesaplanmaz (`lib/calc.ts` `null` döner; UI'da `—%` veya hidden). MVP'de nadir kullanım; default değil. İleri kullanıcı için "haftalık tekrar istemiyorum" seçeneği.
- **Autosave debounced (300-500ms):** Tüm değişiklikler optimistic + autosave; manuel "Kaydet" buton **yok**. App bar'daki "Kaydet" pill **sadece save & exit** (D2'ye geri dönmeden son patch'i sync etmek için). Implementation final debounce süresi cihaz testinde.
- **Off-day toggle → egzersizler silinir (Opsiyon A — rev 14 KAPATILDI):** Dolu bir gün off-day yapılırsa confirm modal sorar ("3 egzersiz var, listeden çıkarılacak. Devam?") → onay → o günün `app_program_days` satırları **silinir**. Off-day kaldırılırsa kullanıcı sıfırdan ekler. Opsiyon B (DB'de koru, UI'da gizle) reddedildi — sade veri modeli; off-day ↔ workout day mutually exclusive.
- **Gün-gün taşıma = Opsiyon A (rev 14 KAPATILDI):** Egzersiz row long-press → ⋯ menü → "Başka güne taşı" satırı → bottom sheet (7 gün listesi, mevcut gün disabled, off-day'ler bilgi olarak). Tap → `app_program_days.day_index` update. Drag-cross-panel (Opsiyon B) MVP sonrası.
- **Aktif et CTA disabled koşul = en az 1 toplam egzersiz (rev 14 KAPATILDI):** Programın hiçbir gününde egzersiz yoksa CTA disabled + label "Önce egzersiz ekle". En az 1 (herhangi günde) → enabled. Hiç şart yok seçeneği reddedildi (boş program aktifleştirme yanlışlık riski).
- **Bottom nav D3'te gizli:** Tam ekran edit pattern; bottom nav görünmez. Geri dönüş app bar back ile. Expo Router `<Stack.Screen options={{ tabBarStyle: { display: 'none' } }}>` veya equivalent.
- **D2 + D3 ortak component'ler:** `ActivateConfirmModal`, `DeleteProgramModal` (D2 + D3 paylaşır); `AddExerciseSheet` (C4 + D1 + D3 paylaşır, mode props ile davranış ayrımı).
- **Drag handle = 6-dot icon (§8.8 C2 ile aynı):** ProgramExerciseRow'da sol kenar; long-press anywhere on row da drag tetikler (handle decorative). Set satırlarındaki çatışma yok burada (input yok).
- **Program adı validation:** Min 1 char, max 60, trim, aynı isimle 2 program OK (D1 + D2 ile tutarlı — rev 13).

## 8.11 Day Detail cila turu — kullanıcı kararları (rev 17 — 2026-06-17)

> Bu kararlar bazı önceki MVP kararlarını **GEÇERSİZ KILAR** (aşağıda işaretli). Kullanıcı
> talebi; UI cila turunda (auth + calendar'dan sonra) implement edildi. Checkpoint 1 uygulandı;
> drag/reorder checkpoint 2'ye kaldı.

**Timer (§8.2 + §8.3'ü GEÇERSİZ KILAR):**
- **Rest timer YOK (MVP).** Set arası dinlenme sayacı MVP'den çıkarıldı (§8.3 güncellendi).
- **Day Detail'de "Start workout" antrenman kronometresi VAR (ephemeral).** Week-view ile
  tutarlı: Başla → süre + Durdur/Devam + Bitir. **DB'ye HİÇBİR ŞEY yazmaz**; ekrandan çıkınca
  sıfırlanır. Component: `components/day/WorkoutTimerBar.tsx` (`useWorkoutStopwatch` hook). Sticky
  bottom. *(§3.2/§8.2 "Start workout butonu YOK" — kronometre için GEÇERSİZ; ancak set girişi
  HÂLÂ direkt aktiftir, kronometre logging'i gate'lemez.)* Kalıcılık yolu hazır:
  `app_day_meta.total_duration_minutes` (ileride; week-view ile ortak hatırlatma).

**Set girişi (prototip hizalama):**
- **Set satırı = prototip 6-sütun grid** (`# · Type · KG · Reps · RIR · ×`), tek satır. Type ve
  RIR birer hücre; tap → native `<select>` benzeri **`AnchoredDropdown`** (hücrenin hemen altında,
  içeriğin üstüne binen dikey seçenek listesi; seçili = gold vurgulu; `measureInWindow` + Modal
  overlay, ekran altına taşarsa yukarı flip). KG/Reps mono tabular; değer girilince accent (gold).
  Önceki 2-satır chip + merkez modal + inline-akordiyon denemeleri bırakıldı; `SetTypeSelect` /
  `RirSelect` **silindi** (kullanıcı kararı: web `<select>` dropdown'ı gibi olsun, 2026-06-17).
- **Prefill (§3.2 rev 12'yi netleştirir/GÜÇLENDİRİR):** Önceki seansın **aynı set index**'indeki
  değerleri (weight/reps/type/rir) yeni set eklenince **gerçek değer olarak gelir ve kullanıcı
  dokunmasa da kaydedilir**. (Rev 12 "input'a dokunulana kadar yazılmaz" kuralı yumuşatıldı:
  set EKLENDİĞİ an gerçek değerlerle yazılır.) **Lazy yazma korunur:** hiç set eklenmemiş
  program kartı DB'ye yazılmaz — "push day'i açtım, 5'ten 2'sini yaptım → DB'de 2 kart" garantisi
  sürüyor. Kaynak: `useLastSession` (kart başına lazy). Hiç önceki kayıt yoksa boş + `kg`/`reps`
  hint.

**Görsel cila (baseline — prototip dark+gold):**
- **App bar:** display-font tarih başlığı ("Sal, 15 Eylül") + tek-satır mono alt başlık
  (program context "PPL · Pazartesi · Hf 2" / rest "PPL · Dinlenme günü · Hf 2" / gold "Bugün").
- **Stat strip:** mono tabular sayılar; Hacim'e `kg` eklendi. **"0/20 planlı set hedefi" GÖSTERİLMEZ**
  — `app_program_days` set sayısı tutmuyor (şemada yok), uydurulmaz. (C3 spec sketch'inden sapma.)
- **Kart başlığı:** kategori-chip pill (renkli dot + lokalize ad) + egzersiz adı + "Son: kg × tekrar"
  (artık `useLastSession` ile gerçekten besleniyor — önceden ölü prop'tu) + 👁 + ⋮.
- **Empty state:** ikinci CTA "Hazır Program Seç" eklendi → `PresetProgramModal` reuse
  (§3.8). ≥360pt yan yana / <360pt stack (§8.8).

**Checkpoint 2 — TAMAM (rev 18, 2026-06-18, cihazda doğrulandı):** **Görünür 6-nokta drag
handle + long-press reorder** (§8.8).
- **Paketsiz custom drag (kullanıcı kararı):** `react-native-draggable-flatlist` EKLENMEDİ
  (son sürümü Reanimated 2 hedefliyor, RNA4.1 uyumu doğrulanmadı, Expo Go bundle riski).
  Yerine projede zaten çalışan **Reanimated 4 + gesture-handler** ile custom drag yazıldı
  (`components/day/ReorderableCardList.tsx`; AppBottomSheet Pan kalıbı). Long-press tetik
  SADECE handle'da → SetRow TextInput'larına bulaşmaz (§3.2). Tetik 220ms; hızlı dikey
  kaydırma hâlâ scroll eder.
- **Reorder kapsamı = TÜM kartlar (persisted + lazy), kullanıcı kararı:** Handle her kartta
  görünür (lazy program kartları + tek kart dahil) ve hepsi sürüklenir. Önce "yalnızca
  persisted" düşünülmüştü ama program günü açıldığında kartların çoğu lazy → handle hiç
  görünmüyordu; kullanıcı "tüm kartlarda görünsün + hepsi sürüklensin" dedi.
- **Sıra `app_day_meta.card_order text[]`'te (yeni kolon):** Birleşik görüntü sırası
  exercise_ref dizisi olarak saklanır. **Lazy kartlar workout satırı YAZILMADAN sıralanır
  → lazy-write garantisi korunur** ("push day'i açtım, 5'ten 2'sini yaptım → DB'de 2 kart").
  Persisted kartların `app_workouts.position`'ı da birleşik sıraya göre güncellenir (month
  grid + diğer position tüketicileri tutarlı). Görüntü sırası: `card_order`'daki görünür
  ref'ler → kalanı doğal sırada (persisted by position → lazy program sırası); stale ref'ler
  bir sonraki reorder'da temizlenir. Yazma katmanı: `lib/data-bridge.ts reorderDayCards` +
  `queries/workouts.ts useReorderDayCards` (optimistic: card_order + day/month position).
- **Drop "flash" fix:** Kartlar STABİL sırada (ref'e göre sıralı) render edilir; görsel sıra
  tamamen `translateY` (shared order) ile sürülür → reorder commit'i React çocuk sırasını
  değiştirmediği için bırakınca 1-frame "eski konum" flash'ı olmaz.
- **Program egzersizi silme fix (reorder sonrası "silinemiyor"):** Program egzersizini günden
  çıkarırken loglu (persisted) ise workout da silinir (set'ler cascade) + skip; sadece skip
  persisted kartı gizlemiyordu (skip filtresi yalnız lazy'e uygulanıyor).

## 8.12 Library (D1-D2) cila turu — kullanıcı kararları (rev 19 — 2026-06-19)

> Bu kararlar §8.9'un bazı kararlarını **GEÇERSİZ KILAR** (işaretli). UI cila turunda
> (auth + calendar + day detail'den sonra) kullanıcı talebiyle uygulandı + cihazda
> doğrulandı. **D1 Egzersizler + D2 Programlar TAMAM**; D3 Program Edit ayrı tura kaldı.

**D1 Egzersizler:**
- **App bar sol icon = AVATAR + ProfilePopover (§8.9 "hamburger" GEÇERSİZ — kullanıcı kararı):**
  Hamburger yerine Calendar app bar ile aynı avatar (baş harfler, gold) + tap → `ProfilePopover`
  (sol-üst popover: profil + dil/tema + çıkış/hesap aç). Gerekçe: ekranlar arası tutarlılık.
  MoreSheet bu ekrandan kaldırıldı (ProfilePopover aynı içeriği sunar; bottom nav More ayrı).
- **D1 kapsamı = custom + TÜM 54 preset KORUNUR (§8.9 "custom + kullanılan preset slug" GEÇERSİZ
  — kullanıcı kararı):** D1 her zaman tüm hareket kataloğunu gösterir (gözatılabilir katalog).
  "Kütüphane boş" empty state pratikte tetiklenmez; sadece arama/filtre sonucu boşsa kompakt
  "sonuç yok" + "+ Yeni Özel" linki.
- **Satır tasarımı:** sol kategori-renginde tam-boy accent rayı + ad + alt-satır kategori-chip
  (renkli dot + lokalize ad — Day Detail kart başlığıyla aynı stil) + custom için "(Özel)" + chev.
- **Son seans stat'ı VAR (turun erken "yalın satır" kararı GEÇERSİZ — kullanıcı kararı):** Her
  satırda "Son: {weight} kg × {reps}" (en ağır set; Day Detail "Son:" mantığıyla aynı). Tek batch
  `fetchLastSessionByRef` / `useLastSessionByRef` (satır başına sorgu yok; perf). weight'i numeric
  olmayan harekette gizli. PR ayrı bir stat olarak EKLENMEDİ (son seans yeterli görüldü).
- **Alfabetik sticky letter-head:** `ScrollView` + `stickyHeaderIndices` (SectionList DEĞİL).
  SectionList virtualization uzun yukarı scroll'da satırları boşaltıyordu (blank rows); liste küçük
  (~80) → tümünü render (AddExerciseSheet kalıbı). Harf gruplama Türkçe-aware (`toLocaleUpperCase('tr')`).
- **"+ Yeni" pill her iki sekmede:** Egzersizler → `AddExerciseSheet` (mode library, initialTab='new');
  Programlar → `NewProgramSheet`.

**D2 Programlar:**
- **Pasif program satırları:** ad + meta ("{N} gün · {N} hareket") + tip rozeti (haftalık/deload/yok —
  lowercase mono pill) + chev. Meta tek batch `fetchProgramDayCounts` / `useProgramDayCounts`.
- **Empty state 2 CTA:** "Hazır Seç" (`PresetProgramModal` — Calendar akışı reuse:
  `createProgramFromPreset` + duplicate guard + toast) + "+ Yeni Program" (responsive yan yana/stack).
- **ActiveProgramCard meta:** "Haftalık · Hafta N" (N = activated_at'tan bugüne 1-based hafta;
  'none' / başlamamış programda gizli). Streak "{n}g" formatı (yeni i18n `library.weekLabel`,
  `library.streakValue`).
- **Gün-chip count formatı AÇIK:** 7-hücre çıplak sayı ("5" / rest "—"); prototip "5 ex". Mobilde
  dar olduğu için sade bırakıldı; "5e" eki kullanıcı kararına bırakıldı (henüz verilmedi).

**Bug fix — "Haftayı gör" CTA (ActiveProgramCard):** Calendar bir **tab** olduğundan ekran state'i
(mod + ay/hafta konumu) korunuyordu → CTA ne hafta görünümüne geçiyor ne bugünün haftasına dönüyordu.
Fix: CTA `/calendar?view=week&ts=<nonce>` gönderir; Calendar param effect'i hafta görünümüne geçer +
bugünün haftasına döner + scroll eder (`ts` nonce her basışta tetikler). "Bugünkü workout" CTA
(day-detail push) değişmedi.

**Açık / sıradaki:**
- **D3 Program Edit cila turu** (ayrı seans — §8.10 spec mevcut; cihazda eksik/sapma önceliklendirilecek).
- Gün-chip "5e / 5 ex" formatı kararı.
- D1 satır menüsü şu an native Alert; stilize `ExerciseRowMenu` bottom sheet'e çevirme opsiyonel.

## 8.13 D3 Program Edit cila turu — kullanıcı kararları (rev 20 — 2026-06-19)

> UI cila turunun son ana ekranı (auth + calendar + day detail + library D1-D2'den sonra).
> Ekran zaten işlevsel-tam (autosave, cycle ayarları, off-day toggle, gün-gün taşıma,
> aktif-et koşulu, sil — hepsi §8.10 rev 14'e uygun çalışıyordu); bu tur **görsel cila**.
> İki checkpoint, ikisi de cihazda doğrulandı.

**Checkpoint 1 — görsel hizalama:**
- **Egzersiz satırı = D1/Day Detail dili:** sol kategori-renginde accent rayı + ad +
  alt-satır kategori-chip (renkli dot + lokalize mono ad) + custom için "(Özel)". Satıra
  tap → `ExPreviewModal` (D1 ile tutarlı). `ResolvedExercise.categories` zaten mevcuttu.
- **Off-day rozeti emoji `💤` → lucide `Moon`** (cyan/info) — uygulama geneliyle tutarlı
  (gövdede zaten Moon kullanılıyordu, başlıkta emoji kalmıştı).
- **App bar alt-başlığı:** program adının altında mono "{cycle} · {N} hareket"
  (cycle/sayı değişince güncellenir).
- ▲▼ ok-tuşu reorder CP1'de korundu (reorder bozulmasın diye); CP2'de drag'e dönüştü.

**Checkpoint 2 — 6-nokta drag (spec §8.8/§8.10; kullanıcı "drag" seçti):**
- Gün içi sıralama **paketsiz custom drag** ile: Day Detail'in `ReorderableCardList`
  bileşeni **yeniden kullanıldı** (Reanimated 4 + gesture-handler; ayrı kopya/yeni paket
  yok). Görünür 6-nokta `GripVertical` handle + long-press (220ms) sürükleme; bırakınca
  "flash" yok (stabil baseOrder + translateY modeli).
- **Satırlar ayrık gap'li kartlara döndü** (tam hairline border + radius + `background.subtle`
  bg): gap'li drag listesinin doğru görsel hali — bitişik top-border kopuk görünürdü. CP1'in
  tight bordered-row görünümünden bilinçli geçiş.
- Sürükleme aktifken **ana ScrollView gate'lenir** (`onActiveChange` → `scrollEnabled=false`);
  drag/scroll çakışması yok.
- **MVP sınırı:** kenar autoscroll yok (Day Detail ile aynı); program günü tipik birkaç
  egzersiz → yeterli.
- ▲▼ ok-tuşları kaldırıldı. **Gün-gün taşıma değişmedi:** yine ⋮ menü → MoveToDaySheet
  (§8.10 Opsiyon A).

**Açık / sıradaki:**
- **E1 More + F1 Dashboard + F2 Social** cila turu (kısa ekranlar — tek seansta birlikte alınabilir).
- **Autosave debounce (§8.10) hâlâ uygulanmadı** — kod her edit'te anında mutation atıyor
  (name/desc blur'da commit); işlevsel sorun yok, debounce ileride opsiyonel.
- §8.12'den devreden: gün-chip "5e / 5 ex" formatı; D1 satır menüsü Alert → stilize sheet (opsiyonel).

## 8.14 E1 More + F1/F2 Placeholder cila turu — kullanıcı kararları (rev 21 — 2026-06-19)

> Ana yolculuk ekranlarından (auth→calendar→day→library→D3) sonra kalan kısa
> placeholder/yardımcı ekranlar. İki checkpoint + kullanıcı bulgularına 3 ek düzeltme;
> hepsi cihazda doğrulandı.

**CP1 — F1 Dashboard + F2 Social placeholder (`PlaceholderScreen`):**
- İkon **goldMuted halka** içinde gold renkte (sönük gri yüzen ikon yerine) + altında
  **"ÇOK YAKINDA" gold pill rozeti** (mono, uppercase) + başlık + açıklama. Spec'in "sade,
  CTA yok" kuralı korunur (rozet bilgi amaçlı, aksiyon değil). Yeni i18n `placeholder.soon`.

**CP2 — E1 MoreSheet + ortak modül (kullanıcı "rol ayrımını koru" seçti):**
- **Paylaşılan `components/shared/profile-menu.tsx`** çıkarıldı: `useProfileMenu(onClose)`
  hook (profil state + Çıkış/Hesap-Aç/Giriş handler'ları) + `TogglePill` + `ProfileMenuHeader`.
  MoreSheet (bottom-nav) ile ProfilePopover (avatar) bu modülü paylaşır → **kod tekrarı bitti,
  davranış değişmedi**. Rol ayrımı korunur: popover = hızlı menü, MoreSheet = tam hub.
- **Disabled placeholder satırlar** (Profil/Ayarlar/Veri/Geri Bildirim) artık sağında
  **"Çok Yakında" çipi** (rev15'teki "opacity 0.38" yerine — çip daha okunabilir/net affordance).
  Tap → "Çok yakında!" toast (değişmedi).

**Kullanıcı bulguları (3 ek düzeltme):**
- **Misafir More'da "Giriş Yap" eksikti** → misafir varyantına LogIn satırı eklendi
  (`auth.login` → `/login`); "Hesap Aç" korundu. Hem MoreSheet hem ProfilePopover. Gerekçe:
  zaten hesabı olan misafir giriş yapabilmeli (kayıt tek yol değildi).
- **Calendar Month açık tema stroke** (§8.1.1 rev16 follow-up): normal günlerde border
  **tema-duyarlı** — açık temada app-bg tonu + hairline (beyaz kart + krem gutter; gri 1px
  stroke kalktı), koyu temada 1px subtle (grid ayrımı korunur). Bugün/seçili/rest hâlâ 1px
  gold/cyan vurgulu.
- **Calendar Month gün arası gap** 2 → 1 (daha sıkı grid; kullanıcı talebi).

**Sonuç:** UI cila kampanyasının **tüm ekranları bitti** (Auth, Calendar, Day Detail,
Library D1-D3, E1 More, F1/F2). Dashboard/Social MVP'de işlevsiz placeholder kalır (§3).

## 8.15 Launch fazı uygulaması — Social gizleme + Profile + hesap silme (rev 23 — 2026-06-20)

> §3.11 kararının ilk uygulama dilimi. Üç checkpoint, cihazda doğrulandı.

- **Social sekmesi gizlendi:** `BottomTabBar` `HIDDEN_TABS = {'social'}` ile o route'u bar'dan
  atlar (route kayıtlı kalır → v2'de set'ten çıkınca geri gelir). Görünür 4 sekme.
- **Profile ekranı** (`app/(app)/profile.tsx`, tabs dışı Stack route, auth-only; misafir →
  Calendar redirect): avatar + düzenlenebilir ad (blur'da commit → `auth.users.user_metadata.
  display_name` + `app_profiles` aynası; `onAuthStateChange` USER_UPDATED ile UI otomatik
  tazelenir) + read-only username/email. Dil/Tema More'da kaldı (§8.14 rol ayrımı). Klavye:
  ScrollView `flex:1` + `keyboardShouldPersistTaps="handled"` → boş alana dokununca da blur+kaydet.
  Giriş: More "Profil" satırı gerçek (auth-only) + avatar popover başlık tap. Ortak nav
  `profile-menu.useProfileMenu.onProfile`.
- **Hesap silme** (Apple 5.1.1(v)): "SİL"/"DELETE" yaz-onayı modalı (tam eşleşmede aktif) →
  **mevcut `delete_own_account()` RPC** (`delete from auth.users where id = auth.uid()`;
  SECURITY DEFINER, search_path='', authenticated grant'li). **Yeni migration YOK.** auth.users'a
  bağlı TÜM FK'lar CASCADE (app_* + web tabloları) → tek silme tüm kullanıcı verisini temizler
  (tam hesap silme; web+mobil ortak kimlik). Tek NO ACTION FK (app_profiles.active_program_id →
  app_programs) sorun değil: her iki satır aynı cascade'de silinir. Client: `useDeleteAccount`
  (rpc + signOut + setSession(null) → auth gating welcome'a atar).

**Açık (launch fazı kalan):** Dashboard (gerçek istatistik) + store hazırlığı (privacy policy,
Sentry DSN, ekran görüntüleri/data-safety) + Resend SMTP + master merge + Play kapalı test.

## 8.7 Misafir tercih aktarımı

- Misafir kullanıcının dil/tema tercihi (`@logwise/guest/profile` içinde `locale`, `theme`) hesap açtıktan sonra `app_profiles.preferences`'a **aktarılır**. Veri aktarımının doğal parçası.

## 9. Açık / henüz karar verilmemiş

### Grup B — Tasarım/görsel detayları ✅ KAPATILDI (rev 11)
Kararlar ilgili bölümlere yedirildi:
- B1 Program preview detayı → §3.8 (her günün tüm egzersizleri always expanded)
- B2 Sıfırdan program oluştur akışı → §8.4.1 (sadece isim + Edit'e at)
- B3 Guest → hesap loading state UI → §3.9.1 (full-screen modal + sade spinner)
- B4 Web "Hoş geldin" modal görsel stili → §3.10 (merkez dialog, orta boy)
- B5 "Bir daha gösterme" toggle default → §3.10 (default işaretli)

### Grup C — Stack ve mimari ✅ KAPATILDI (rev 9)
Tüm kararlar §2 ve §2.1'de.

### Grup D — Operasyonel ✅ KAPATILDI (rev 10)
Tüm kararlar §10'da.

### Grup E — MVP sonrası
- Web kullanıcısı için ileride senkron seçeneği gelirse modal mesajı güncellenir mi
- **WebWelcomeModal hardware back davranışı (yeni — rev 12):** Back basınca modal dismiss + `seen_web_welcome` flag'i set edilsin mi yoksa sadece geçici kapansın mı? MVP içi karar olabilir ama kritik değil; default: back = İptal (flag set ETMEZ → bir sonraki Calendar mount'ta tekrar açılır). Kullanıcı bilinçli aksiyon ([Mobil'e Başla]/[Web'e Git]) yapana kadar tekrar gösterilir. Bu davranış 05-screen-specs.md B1 spec'inde dokümanlı; resmi onay sonraki seansta.

### Grup F — D1-D2 spec yazımı sonrası karar oturumu (rev 13)

**Bu seansta kapatılan kararlar:**
- ✅ **D1+D2 app bar sol icon = hamburger** (workout-prototype'a sadık; her ekran kendi prototipini takip eder; B1 avatar pattern kendi prototipinde kalır). §8.9'da işlendi.
- ✅ **D1 empty state sadeleştirildi:** Tek CTA "+ Yeni Özel" (önceki "Hazır Listele" kaldırıldı). §8.9'da işlendi; D1 spec'i de güncellendi.
- ✅ **D1 custom delete = soft reference + fallback display** (FK yok, deleted_at yok, cascade yok — app_workouts persist; fallback "(silinmiş egzersiz)"). §8.9'da işlendi.
- ✅ **Sıradaki seans önceliği = D3 Program Edit** (D2 router.push'unu işlevsel kılmak için). E1+F1+F2 D3'ten sonra. §8.9'da işlendi.

**Kalan açık sorular (sonraki seans veya implementation):**
- **D1+C4 aynı isim preset+custom çakışması:** Custom satırına "(Özel)" hint mi, yoksa create-time engelleme mi? (Ortak soru — C4 açık sorularında.)
- **D1+C4 Türkçe lowercase / search locale-aware utility:** `text.toLocaleLowerCase('tr')` mi manuel char map mi? Implementation karar.
- **D2 empty state icon:** Dumbbell (tüm empty state'ler) vs CalendarRange (program-spesifik) — §8.8 tutarlılık vs D2 nüansı.
- **D2 day-chip cell count format:** "5 ex" / "5e" / sadece sayı + küçük etiket? i18n implementasyonunda.
- **D2 "+ New" preset+sıfırdan birleştirilsin mi:** §8.9'da "ayrım korunsun" yazıldı; final onay.
- **B1/C1/C2/C3/C4'ten kalan açık sorular:** Tagline (A1), avatar tap (B1), Today pill her zaman görünür mü (B1), Week feed render miktarı (B1), Stat strip "Hacim" formatı (C1), FAB disable empty'de (C1), set delete UndoToast süresi (C2), rest timer default 90sn (C2), prefill görsel ayrım (C2), category multi/single (C4), long-press 400/500ms (C4), custom egzersize gif (C4). Hepsi implementation seçimi veya MVP-küçük detay.

### Grup G — D3 Program Edit kararları (rev 14 oturumu)

**Bu seansta kapatılan kararlar:**
- ✅ **Cycle type 3 seçenek: `weekly` (default) / `deload` / `none`** — `none` MVP'de kalır ama default değil. İleri kullanıcı için "haftalık tekrar istemiyorum, tek seferlik plan" seçeneği. Compliance hesabı `none` için **atlanır** (UI'da `—%`, `lib/calc.ts` `null` döner).
- ✅ **Off-day toggle = Opsiyon A** — Dolu gün off-day yapılınca confirm modal ("3 egzersiz var, listeden çıkarılacak. Devam?") + `app_program_days` satırları silinir. Off kaldırılırsa kullanıcı sıfırdan ekler. Sade veri modeli; off-day ↔ workout day exclusive.
- ✅ **Gün-gün taşıma = Opsiyon A** — Long-press egzersiz row → ⋯ menü → "Başka güne taşı" → MoveToDaySheet (7 gün listesi, mevcut gün disabled). Tap → `app_program_days.day_index` update. Drag-cross-panel (Opsiyon B) MVP sonrası.
- ✅ **Aktif et CTA disabled koşul = en az 1 toplam egzersiz** (kullanıcı tercih bildirmedi, önerim alındı). Boş program aktif edilemez; CTA disabled + label "Önce egzersiz ekle". Hiç şart yok seçeneği reddedildi — kullanıcı yanlışlıkla boş program aktif etmesin.

**Kalan açık sorular (implementation aşamasında veya sonra):**
- **Day panel accordion mı multi-expand mı?** §8.10'da multi-expand önerildi; final onay implementation'da.
- **D2 NewProgramSheet save sonrası D3 navigate türü:** `router.push` mu `router.replace` mı? Önerim: push.
- **Drag-during-keyboard-open davranışı:** Klavye açıkken row drag → blur mu yoksa block mi? Implementation karar.
- **Autosave debounce final süre (300/500/700ms):** Cihaz testinde belirlenir.
- **D2 active program activated_at = gelecek tarih:** "Henüz başlamadı" sub-badge vs aktif sayılır. Cycle resolver D3 implementation aşamasında netleşir.

---

## 10. Operasyonel kararlar (Grup D — rev 10)

### 10.1 Analytics & crash reporting

- **Karar:** **Sentry (sadece crash)** MVP'de aktif.
- **Paket:** `sentry-expo` (resmi Expo entegrasyonu).
- **Kapsam:** Yalnızca crash/error reporting + temel performans (transactions). Davranış analytics (PostHog vs.) **MVP'de yok** — kullanıcı sayısı düşükken sinyal/gürültü oranı düşük, lansman sonrası ihtiyaç netleşince eklenir.
- **DSN yönetimi:** `app.json` → `extra.sentryDsn`; runtime'da `expo-constants` üzerinden okunur. DSN public olduğu için repo'ya commit edilebilir; sensitive değil.
- **Filtreleme:** `beforeSend` hook'unda dev build event'leri drop edilir. Sadece production crashes Sentry'ye gider.
- **PII:** Default olarak user_id ve email Sentry'ye gönderilmez; gerekirse explicit `Sentry.setUser({ id })` ile sadece UUID gönderilir.

### 10.2 Test stratejisi

- **Karar:** **TypeScript tip kontrolü + Jest unit (lib/ + calc)** MVP'de aktif. UI test (RNTL) ve E2E (Maestro/Detox) **MVP dışı**.
- **TypeScript:** `tsc --noEmit` CI'da gate. `strict: true`, `noUncheckedIndexedAccess: true` tsconfig'de açık.
- **ESLint:** `eslint-config-expo` baseline + import order + unused-imports kuralları.
- **Jest hedef coverage:** `lib/calc.ts` (1RM, streak, compliance), `lib/exercise-utils.ts` (slug resolve, polymorphic ref ayırt etme), `lib/migration.ts` (guest → hesap transform), `lib/guest-storage.ts` (read/write happy path + JSON parse fail). UI ve hooks için test yazılmaz.
- **CI:** `tsc --noEmit && eslint . && jest` tek pipeline. E2E lansman öncesi tekrar değerlendirilir.

### 10.3 App icon & splash screen

- **Karar:** **Mevcut `Site_Logo180.svg`'den otomatik üretim.**
- **Master asset:** SVG → 1024×1024 PNG (transparent background) export — `assets/images/icon-source.png`.
- **Üretim:** `expo-icon` / `@expo/cli prebuild` workflow ile Android (mipmap-*, adaptive icon foreground) ve iOS (Icon-*.png variants) boyutları otomatik üretilir. Adaptive icon background: `#000000` (marka siyahı).
- **Splash:** `expo-splash-screen` config — `backgroundColor: "#000000"`, `image: assets/images/splash-logo.png` (icon ile aynı kaynak, ortalanmış). Wordmark "LOG WISE" splash'ta görünür (`auth-prototype`/A1 referans).
- **app.json blok'u (taslak):**
  ```json
  {
    "icon": "./assets/images/icon.png",
    "splash": {
      "image": "./assets/images/splash-logo.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/icon-foreground.png",
        "backgroundColor": "#000000"
      }
    }
  }
  ```
- **Lansman öncesi review:** Adaptive icon foreground'un safe zone'a sığdığını ve iOS'ta köşelerin doğru clip olduğunu fiziksel cihazda kontrol et.

### 10.4 İkinci sekme adı

- **Karar:** **EN: Library / TR: Kütüphane** (detay §3.1).
- i18n key: `nav.library` → "Library" / "Kütüphane".
- Klasör/route yolu `app/(app)/workout/` ve component klasörü `components/workout/` **değişmez** — internal naming sabit, UI string i18n üzerinden çözülür.

### 10.5 AsyncStorage anahtar format

- **Karar:** **`@logwise/guest/<snake_case_table>`** (detay §3.9).
- Tüm anahtarlar sabitler dosyasında merkezi tanımlı: `lib/guest-storage.ts` → `export const GUEST_KEYS = { exercises: '@logwise/guest/exercises', programs: '@logwise/guest/programs', programDays: '@logwise/guest/program_days', workouts: '@logwise/guest/workouts', sets: '@logwise/guest/sets', dayMeta: '@logwise/guest/day_meta', profile: '@logwise/guest/profile' } as const;`
- String literal'ı doğrudan kullanma yasak — her zaman `GUEST_KEYS.xxx`. Bu hem typo'yu engeller hem ileride versiyon prefix'i ekleme tek noktadan yapılır.
- `app_*` (auth'lu) veriler için AsyncStorage kullanılmaz; sadece TanStack Query cache (memory) + Supabase.

---

## Değişiklik kaydı

| Tarih | Bölüm | Değişiklik |
|---|---|---|
| 2026-05-19 | Tüm bölümler | İlk oluşturma — stack (RN+Expo+TS), MVP scope, backend (Supabase hibrit şema), auth (email+guest), preset (bundle) kararları kaydedildi. |
| 2026-05-19 | §3, §3.1-3.4 | MVP scope detaylandırıldı: 5 sekmeli bottom nav (Calendar/Workout/Dashboard/Social/More), Dashboard ve Social placeholder olarak görünür; Day Detail "Start workout" yok, direkt set girişi; username MVP'de yok; TR+EN destekli (cihaz diline göre default). |
| 2026-05-19 | §7, §8 | Prototipler **bağlayıcı ana referans** olarak işaretlendi. Ekran kapsamı detaylandı: Calendar'da Week view var (prototip), Day Detail "Start workout" yok, Rest timer manuel, Program edit tam prototip seviyesinde, Light mode toggle aktif. |
| 2026-05-19 | §3.2, §3.5, §3.6, §3.7 | 1. ve 2. yolculuğun kararları kayda işlendi: email confirm kapalı, auto-login, calendar bugünün ayı default, mini kategori chip indicator, hint kartı sadece yeni kullanıcı, önceki set placeholder web ile aynı, set kaydı focus-dışı auto + undo, reorder long-press drag, multi-select hibrit, aktif program lazy/sanal Day'e gelir, program egzersizi silme modal'ı sorar. |
| 2026-05-19 | §4.3 (şema) | 3. yolculuğun **şema etkisi** işlendi: preset hareketler `app_exercises`'a kopyalanmaz, bundle'da kalır. `app_workouts.exercise_ref` ve `app_program_days.exercise_ref` polymorphic text (slug VEYA UUID). `app_exercises` sadece custom. `app_day_meta.skipped_exercise_ids` field eklendi. Tek aktif program kuralı, Add Program segmented modal, program context üst bar subtitle, Calendar future muted/past full/missed gizli, compliance % gösterilir. |
| 2026-05-19 | §3.2, §3.5, §3.8 | 1. yolculuğun kalan 4 sorusu kapatıldı: ilk set placeholder "kg"/"reps" hint metni; Calendar hint kartı grid altında sade text card + 2 buton + otomatik kapanış; long-press drag sadece kart başlığında (set satırı/input çakışması yok); "Hazır Program Seç" doğrudan preset modal'ı açar (Workout sekmesine yönlenmez), seçince aktif eder. |
| 2026-05-19 | §3.9, §3.10, §5 | 4. ve 5. yolculuk işlendi. **REVİZE:** Guest verisi hesap açarken atılmaz, **aktarılır** (modal onayıyla, hata durumunda rollback). AsyncStorage anahtarları `@logwise/guest/*`. Web'den gelen kullanıcı için login sonrası `user_data` check + tek seferlik "Hoş geldin" modal + web link, bayrak `app_profiles.preferences.seen_web_welcome`. |
| 2026-05-19 | §3.5, §3.5.1, §3.5.2, §8.6, §8.7, §9 | Grup A açık soruları kapatıldı. Calendar max 2 chip, geçmiş günde program context yok (`deactivated_at` ekleme gereği iptal), custom egzersiz default "Diğer", compliance % web formülü, misafir tercih aktarılır. **Felsefe notu eklendi:** Calendar'da kaçırılan günleri gizleme = görsel netlik (demotivasyon değil); compliance gerçek rakam gösterir. §9 yeniden organize edildi: Grup B/C/D/E. |
| 2026-05-19 | §2, §2.1 | **Grup C tamamen kapatıldı.** Stack: Expo Router (navigation), Zustand + TanStack Query (state), hibrit font shipping (Inter ship + Space Grotesk/JetBrains Mono system fallback), AsyncStorage + expo-secure-store. Klasör yapısı §2.1'de tam detay: app/ (file-based routes), components/ (ui/calendar/workout/shared), lib/, data/, stores/, queries/, theme/, types/, hooks/, assets/. |
| 2026-05-20 | §3.1, §3.9, §10 | **Grup D tamamen kapatıldı.** Yeni §10 eklendi. D1: Sentry (sadece crash, `sentry-expo`, prod-only `beforeSend` filter, PII default off). D2: TypeScript strict + ESLint + Jest unit (lib/calc, lib/exercise-utils, lib/migration, lib/guest-storage) — UI/E2E MVP dışı. D3: `Site_Logo180.svg` → 1024 master PNG → `expo-icon` ile Android/iOS otomatik üretim; splash `expo-splash-screen` (siyah bg + ortalanmış logo). D4: 2. sekme **Library / Kütüphane** (path adı `workout` sabit kalır). D5: AsyncStorage anahtarları `@logwise/guest/<snake_case_table>` formatında, `lib/guest-storage.ts` içinde `GUEST_KEYS` sabiti olarak merkezi. |
| 2026-05-20 | §3.8, §3.9.1, §3.10, §8.4.1 | **Grup B tamamen kapatıldı.** B1: Preset program preview = her günün tüm egzersizleri always expanded. B2: Yeni program (Library → Programs → + Add) = bottom sheet sadece isim+açıklama → kaydet → direkt Program Edit (wizard yok). B3: Guest → hesap migration loading = full-screen modal + sade spinner + tek satır metin (granular progress yok). B4: Web "Hoş geldin" modal = merkez dialog, orta boy + scrim arka plan. B5: "Bir daha gösterme" toggle default işaretli. Yeni §8.4.1 (Sıfırdan program oluştur akışı) eklendi. |
| 2026-05-21 | §3.2, §4.3, §8.8, §9 | **rev 12 — C1-C4 spec yazımı kararları.** Önceki set placeholder web'den ayrıldı: hayalet metin değil, **gerçek değer olarak input prefill** (aynı ağırlığı tekrar girmek gerekmez). RIR enum standardı: **DB+UI "F"** (web "0" yerine). Superset MVP'den **çıkarıldı**: set type chip enum `working/warmup/drop` (superset MVP sonrası, şema field'ı yer tutar). Yeni §8.8 eklendi: empty icon (Dumbbell 48pt), responsive CTA (≥360pt yan yana / <360pt stack), visible 6-dot drag handle, geçmiş program günü boş state (lazy yok), program günü label MVP'de yok, C4 Kütüphanem = custom + tüm tarihçe preset'ler, B1 hint kartı sticky dismiss flag, B1 Month swipe pager_view ile var. |
| 2026-05-23 | §8.4.1, §8.9 (yeni), §9 Grup F (yeni) | **rev 13 — D1-D2 spec yazımı kararları.** Yeni §8.9 eklendi (Library spec yazımı kararları): NewProgramSheet ana implementasyonu D2'dedir (sadece isim + opsiyonel açıklama → app_programs insert with activated_at=null → router.push D3 Program Edit); D3 Program Edit MVP scope'unda ama bu seansta spec yok; D1+D2 tek route (segmented); D1 Exercises kütüphane kapsamı C4 Kütüphanem ile birebir tutarlı (custom + tüm tarihçe preset distinct slug); D1 row tap = preview, long-press = ⋯ menü; D1 custom delete = soft reference + fallback ("(silinmiş egzersiz)") — app_workouts persist; D2 ActiveProgramCard workout-prototype Phone 2 port (compliance + streak + next + 7-chip grid + 2 CTA); tek aktif program kuralı ActivateConfirmModal ile uygulanır; D2 program delete = app_programs+app_program_days silinir, app_workouts persist; "+ New" sadece sıfırdan (preset entry'si B1/C1/D2 empty state'lerinde); day-chip tap no-op MVP'de; Paylaş satırı gizli; app bar sol icon hamburger → avatar (B1 ile tutarlı). Yeni Grup F açık sorular eklendi (D1+D2 kalan sorular + önceki ekranların kalanları). |
| 2026-05-25 | §3.1 (E1+F1+F2), §9 | **rev 15 — E1+F1+F2 spec yazımı kararları.** §3.1'e E1 More panel detayları eklendi: floating panel = bottom sheet; iki entry point (bottom nav + avatar tap) aynı sheet; disabled placeholder satırlar gösterilir (Profil/Ayarlar/Veri/GeriBildirim — "Çok yakında!" toast); auth vs guest iki varyant (Logout ↔ Hesap Aç); F1+F2 PlaceholderScreen ortak component kararı; CTA yok — sade mesaj. MVP screen listesi tamamlandı (15 ekran: A1-A5 + B1 + C1-C4 + D1-D3 + E1 + F1-F2). |
| 2026-06-16 | §8.1.1 (yeni) | **rev 16 — Calendar cila turu kararları.** Month chip = hareket adı (kategori değil; §3.5 max-2-kategori GEÇERSİZ); planlı (gelecek) soluk chip'ler; aylar arası yatay swipe (gesture-handler Pan, yön kilitli); Week akordiyon (collapsed: N hareket·M set + bölge chip; chevron → hareket satırları + son seans en ağır set) + gün gövdesine tap → Day Detail; week "Start workout" → **geçici kronometre** (DB'ye yazmaz) — §8.3 rest timer + §3.2 "active-workout yok" + §B1 week için GEÇERSİZ. |
| 2026-06-17 | §8.3, §8.11 (yeni), değişiklik kaydı | **rev 17 — Day Detail cila turu (checkpoint 1).** Rest timer MVP'den **çıkarıldı** (§8.3); yerine Day Detail'de "Start workout" ile başlayan **geçici antrenman kronometresi** (week-view ile tutarlı, DB'ye yazmaz — §8.2/§8.3 override). Set satırı **prototip 6-sütun grid**'e geçti (Type/RIR tap→modal seçici, KG/Reps mono). Prefill **güçlendirildi**: önceki seansın aynı index değerleri set eklenince gerçek gelir + dokunulmasa da kaydedilir (rev 12 lazy-yaz kuralı yumuşatıldı; program kartı hiç dokunulmazsa yine yazılmaz). Baseline cila: app bar (display başlık + mono alt-satır), stat strip (mono + kg), kategori-chip pill, "Son:" satırı artık `useLastSession` ile gerçek, empty state 2. CTA "Hazır Program Seç" (PresetProgramModal reuse). "0/20 planlı hedef" gösterilmiyor (şema set sayısı tutmuyor). **Checkpoint 2'ye ertelendi:** 6-nokta drag handle + reorder (react-native-draggable-flatlist / Reanimated 4 uyum riski izole edildi). |
| 2026-06-18 | §3.2, §4.3 (şema), §8.8, §8.11, değişiklik kaydı | **rev 18 — Day Detail Checkpoint 2: drag handle + reorder (cihazda doğrulandı).** Görünür 6-nokta handle + long-press reorder UYGULANDI. **Paketsiz custom drag** (Reanimated 4 + gesture-handler; `react-native-draggable-flatlist` EKLENMEDİ — RNA4 uyum/Expo Go bundle riski). **Reorder kapsamı = TÜM kartlar (persisted + lazy + tek kart)** (kullanıcı kararı; "yalnızca persisted" iptal — program günü lazy kartlarda handle görünmüyordu). Sıra yeni **`app_day_meta.card_order text[]`** kolonunda; **lazy kartlar workout YAZILMADAN sıralanır** (lazy-write korunur), persisted `position` da senkronlanır. Yazma: `reorderDayCards` / `useReorderDayCards` (optimistic). Drop "flash" fix (kartlar sabit sırada render, görsel sıra translateY ile). Program egzersizi silme fix: loglu program kartı günden çıkarılırken workout da silinir + skip (sadece skip persisted kartı gizlemiyordu). Handle tetik 220ms, yalnız handle'da → SetRow input çakışması yok. |
| 2026-06-19 | §8.12 (yeni), §8.9 (override notları), değişiklik kaydı | **rev 19 — Library (D1-D2) cila turu (cihazda doğrulandı).** Yeni §8.12 eklendi. **D1 Egzersizler:** app bar hamburger → **avatar + ProfilePopover** (§8.9 hamburger GEÇERSİZ — Calendar tutarlılığı, kullanıcı kararı); D1 kapsamı **custom + TÜM 54 preset KORUNUR** (§8.9 "kullanılan slug" GEÇERSİZ — kullanıcı kararı); satır = accent rayı + ad + kategori-chip alt-satır + custom "(Özel)"; her satırda **"Son: kg × tekrar"** (en ağır set, tek batch `fetchLastSessionByRef`); alfabetik **sticky letter-head** = `ScrollView` + `stickyHeaderIndices` (SectionList virtualization yukarı scroll'da blank-row yapıyordu → ~80 satır tümü render); "+ Yeni" pill her iki sekmede. **D2 Programlar:** pasif satır = ad + meta ("N gün · N hareket", batch `fetchProgramDayCounts`) + tip rozeti; empty state 2 CTA ("Hazır Seç" PresetProgramModal reuse + "+ Yeni Program"); ActiveProgramCard meta "Haftalık · Hafta N" + streak "{n}g" (yeni i18n `weekLabel`/`streakValue`). **Bug fix:** "Haftayı gör" CTA artık `/calendar?view=week&ts=<nonce>` → Calendar hafta görünümüne geçip bugünün haftasına döner (tab state korunduğu için eskiden çalışmıyordu). **Açık:** D3 Program Edit cila turu (ayrı seans); gün-chip "5e/5 ex" formatı; D1 satır menüsü Alert→sheet (opsiyonel). |
| 2026-06-19 | §8.13 (yeni), değişiklik kaydı | **rev 20 — D3 Program Edit cila turu (cihazda doğrulandı).** Yeni §8.13. **CP1 görsel:** egzersiz satırı D1/Day Detail diline hizalandı (kategori accent rayı + kategori-chip + custom "(Özel)" + satıra tap → `ExPreviewModal`); off-day rozeti emoji `💤` → lucide `Moon`; app bar alt-başlığı mono "{cycle} · N hareket". **CP2 drag (kullanıcı "drag" seçti):** gün içi sıralama ▲▼ ok-tuşlarından **6-nokta `GripVertical` handle + long-press sürükleme**ye geçti — Day Detail `ReorderableCardList` **yeniden kullanıldı** (paketsiz, Reanimated 4 + gesture-handler); satırlar ayrık gap'li kartlara döndü (tam border + radius + `background.subtle`); sürükleme aktifken ana ScrollView gate'lenir (`scrollEnabled=false`); kenar autoscroll yok (MVP sınırı, Day Detail ile aynı). Gün-gün taşıma değişmedi (⋮ → MoveToDaySheet, §8.10 Opsiyon A). **Açık:** E1+F1+F2 cila turu (sıradaki); autosave debounce (§8.10) hâlâ uygulanmadı (anında yazıyor — işlevsel sorun yok). |
| 2026-06-20 | §8.15 (yeni), değişiklik kaydı | **rev 23 — Launch fazı part 1: Social gizleme + Profile + hesap silme (cihazda doğrulandı).** §3.11 uygulaması. Social bottom nav'dan gizlendi (`BottomTabBar HIDDEN_TABS`; route v2 için kayıtlı). Profile ekranı (auth-only, tabs dışı): ad düzenle (auth metadata + app_profiles aynası) + read-only username/email; klavye tap-dışı kaydet (`keyboardShouldPersistTaps="handled"` + ScrollView flex:1); giriş More "Profil" satırı + popover başlık tap. Hesap silme: "SİL"/"DELETE" yaz-onayı → **mevcut `delete_own_account()` RPC** (auth.users sil → tüm app_*+web CASCADE; **yeni migration YOK**). Ortak `profile-menu` hook'una onProfile/onLogin eklendi; i18n `profile` namespace (3 dosya). **Açık:** Dashboard (gerçek) + store hazırlığı (privacy/Sentry/asset) + Resend SMTP + master merge + Play kapalı test. |
| 2026-06-19 | §3.11 (yeni), §3 + §3.1 (scope güncelleme), değişiklik kaydı | **rev 22 — Yayın kapsam kararı: solo-tamamla, sosyali ertele.** UI cila kampanyası bitti; "MVP'yi şimdi mi yayınlayalım" tartışıldı. Karar: **Dashboard** (placeholder→gerçek) + **Profile** (MVP-dışı→in, + hesap silme / Apple 5.1.1(v)) launch öncesi yapılır; **Social sekmesi bottom nav'dan gizlenir**, v2'ye (gerçek kullanıcı tabanı) ertelenir — cold-start riski. Launch hedefi Play Store; yeni hesap 20-tester/14-gün kapalı test paralel başlar. Blocker: Resend SMTP, master merge, privacy policy, store içeriği, Sentry DSN. |
| 2026-06-19 | §8.14 (yeni), §8.1.1 (açık-tema follow-up), değişiklik kaydı | **rev 21 — E1 More + F1/F2 placeholder cila turu (cihazda doğrulandı).** Yeni §8.14. **CP1:** PlaceholderScreen → goldMuted halka içinde gold ikon + "ÇOK YAKINDA" pill rozeti (yeni i18n `placeholder.soon`). **CP2:** ortak `components/shared/profile-menu.tsx` çıkarıldı (`useProfileMenu` + `TogglePill` + `ProfileMenuHeader`) → MoreSheet + ProfilePopover paylaşır, kod tekrarı bitti, davranış aynı (kullanıcı "rol ayrımını koru" seçti); MoreSheet disabled satırlara "Çok Yakında" çipi (rev15 opacity 0.38 yerine). **Kullanıcı bulguları:** misafir More'a "Giriş Yap" satırı (`auth.login` → /login, kayıt tek yol değil); Calendar Month açık tema normal-gün stroke'u tema-duyarlı yumuşatıldı (app-bg + hairline; koyu tema 1px subtle korunur — grid ayrımı); gün arası gap 2→1. **UI cila kampanyasının TÜM ekranları bitti.** |
| 2026-05-23 | §8.10 (yeni), §9 Grup G (yeni) | **rev 14 — D3 Program Edit spec yazımı kararları + seans sonu karar oturumu.** Yeni §8.10 eklendi: D3 tam ekran route (modal değil), state ayırt etmez (NewProgramSheet save + ✎ edit + "Düzenle" hepsi aynı route'a push); gün layout = dikey scroll + collapsible panels (bugün açık default, multi-expand izinli); cycle type **3 seçenek `weekly` (default) / `deload` / `none`** (web `app.html`'de `weekly` yoktu — mobil için yeni eklendi, haftalık tekrar standart mental model); `none` MVP'de kalır ama default değil, compliance hesaplanmaz; autosave debounced (300-500ms, manuel "Kaydet" yok); off-day toggle = Opsiyon A (dolu gün off-day yapılınca app_program_days satırları silinir, confirm sorar); gün-gün taşıma = Opsiyon A (long-press ⋯ → MoveToDaySheet; drag-cross-panel MVP sonrası); aktif et CTA disabled koşul = en az 1 toplam egzersiz; bottom nav D3'te gizli (tam ekran edit); D2+D3 ortak component'ler (ActivateConfirmModal, DeleteProgramModal); 6-dot drag handle (§8.8 ile aynı); program adı validation (1-60 char, trim, duplicate OK). Grup G karar oturumu: 4 sorudan 3'üne kullanıcı karar verdi (cycle `none` kalır, off-day Opsiyon A, taşıma Opsiyon A); 1'i (aktif et koşulu) önerimle kapatıldı. |
