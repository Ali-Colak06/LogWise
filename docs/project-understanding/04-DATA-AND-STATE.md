# 04 — DATA & STATE

> Etiketler: `DOĞRULANDI` / `ÇIKARIM` / `BELİRSİZ` / `ESKİ OLABİLİR`. Kanıt = dosya + sembol.
> **Altın kural:** Aynı kavramın web'de ve mobilde bulunması ortak kod değildir; veri katmanları
> da platforma göre tamamen farklıdır. Aşağıda web ve mobil ayrı izlenir.

---

## 1. Durum/depolama katmanları (karıştırma!)

| # | Katman | Web | Mobil | Kanıt |
|---|---|---|---|---|
| 1 | UI/component local state | `app.html` `useState` (App scope) | ekran/bileşen `useState` | `DOĞRULANDI` |
| 2 | Global client store | **Yok** (tek App React state'i) | zustand `auth-store.ts` (session+mode), `theme-store.ts` (in-memory) | `DOĞRULANDI` |
| 3 | Server-state cache | **Yok** | TanStack Query `lib/query-client.ts` | `DOĞRULANDI` |
| 4 | Kalıcı OLMAYAN in-memory cache | App `data` nesnesi + `gym-timer` React state | RQ cache (staleTime 60s, gcTime 5dk) | `DOĞRULANDI` |
| 5 | localStorage (web) | **yalnız** `gym-timer`, `logwise-onboard-done` | — | `DOĞRULANDI` — `app.html` grep |
| 6 | SecureStore (mobil) | — | Supabase oturum token'ları (chunk'lı) | `DOĞRULANDI` — `lib/supabase.ts` `secureStorage` |
| 7 | Guest storage (mobil) | — | AsyncStorage `@logwise/guest/*` | `DOĞRULANDI` — `lib/guest-storage.ts` `GUEST_KEYS` |
| 8 | Supabase Auth session | `auth.users` (ortak) | `auth.users` (ortak) | `DOĞRULANDI` |
| 9 | Web `user_data` JSON blob | tek satır/kullanıcı, 11 anahtar | (mobil yazmaz) | `DOĞRULANDI` — `app.html` `.from("user_data")` |
| 10 | Mobil `app_*` normalize tablolar | (web yazmaz) | 7 tablo | `DOĞRULANDI` — `supabase_setup.sql` |
| 11 | Derived/hesaplanan | `lib/calc.js` (PR/1RM/compliance) | `lib/calc.ts` + `lib/dashboard.ts` | `DOĞRULANDI` |
| 12 | Kanonik preset | `data/presets-exercises.json`, `ex-guides.json` | (aynı) | `DOĞRULANDI` |
| 13 | Generated preset çıktı | `data/*.js` | `logwise-mobile/data/generated/*.ts` | `DOĞRULANDI` |

> **Kritik:** Web'in ana kullanıcı verisi `localStorage`'da **tutulmaz**. `localStorage` yalnızca
> kronometre (`gym-timer`) ve onboarding bayrağıdır. Ana veri **yalnızca** `user_data` Supabase
> tablosundadır ve oturum açıkken React state'e yüklenir. `DOĞRULANDI` — `app.html` (load `line ~533`,
> save `debouncedSave`/`upsert` `line ~564-594`); `localStorage` anahtarları yalnız `gym-timer` +
> `logwise-onboard-done`.

---

## 2. Web `user_data` blob'unun şekli (11 anahtar)

`lib/data-schema.js` `init()`: `exercises, workouts, programs, dailyPrograms, activeProgram,
durations, measurements, dayNotes, exerciseNotes, programMeta, badges`. `migrateData()` eski/eksik
şemayı yükseltir (örn. `category` → `categories: [..]`). DB default'u yalnız 4 anahtar
(`{"exercises":[],"workouts":{},"programs":{},"activeProgram":null}`) — gerisi `migrateData` ile
doldurulur. `DOĞRULANDI` — `lib/data-schema.js`; `supabase_setup.sql` `user_data.data default`.

> **Web vs Mobil model farkı:** Web'de `workouts` bir **nesnedir** (`{ "YYYY-MM-DD": [ {exerciseId,
> sets:[...]}, ... ] }` — gün-anahtarlı, set'ler gömülü). Mobilde aynı bilgi `app_workouts` +
> `app_sets` **ilişkisel** satırlara bölünür. `DOĞRULANDI` — `lib/calc.js` (`workouts[k]`,
> `w.sets`, `w.exerciseId`); `supabase_setup.sql`.

---

## 3. Veri türü yaşam döngüsü matrisi

Her tür: **kaynak → oluşturan → okuyan → güncelleyen → kalıcılık → cache → sil/güncelle →
guest/auth → web/mobil → risk → semboller.**

### 3.1 Kullanıcı profili
- **Web:** `profiles` tablosu (username/bio/avatar/is_public/show_profile_info). Oluşturan/sync:
  `lib/db.js` `syncProfileRecord` (`buildProfileRow` — `lib/profile-utils.js`). Okuyan: `profile.html`.
  Kalıcılık: Supabase. Guest yok. `DOĞRULANDI`.
- **Mobil:** `app_profiles` (username/display_name/locale/theme/preferences/active_program_id).
  Oluşturan: `queries/auth.ts` signUp upsert. Okuyan: `queries/profile.ts`. Guest: `@logwise/guest/profile`.
  `DOĞRULANDI`.
- **Risk:** İki ayrı profil tablosu; web `profiles` ↔ mobil `app_profiles` **senkronize değil**
  (aynı kullanıcı iki ayrı profil satırı taşır). `DOĞRULANDI` (iki ayrı tablo).

### 3.2 Workout
- **Web:** `user_data.data.workouts[date][]` (gün-anahtarlı dizi). Güncelleyen: `app.html`
  `debouncedSave` → `user_data` upsert (debounce). `DOĞRULANDI`.
- **Mobil:** `app_workouts` satırı; lazy-write (ilk set girilince `ensureWorkout`). Oluşturan/okuyan:
  `queries/workouts.ts` (`useEnsureWorkoutAndAddSet`, `useWorkoutsByDate`). Köprü: `data-bridge.ts`.
  Guest: `@logwise/guest/workouts`. `DOĞRULANDI`.
- **Cache:** Mobil optimistic + RQ; web React state + debounced cloud save.
- **Risk:** Web debounced save online'a bağımlı; offline'da kayıp (bkz. 07). Mobil optimistic
  rollback var. `DOĞRULANDI`.

### 3.3 Set / tekrar / ağırlık
- **Web:** workout nesnesi içinde gömülü `sets[]` (`{weight, reps, ...}`). `DOĞRULANDI` — `lib/calc.js` `f.sets`.
- **Mobil:** `app_sets` (set_type `working|warmup|drop`, rir `F|-|1|2|3|4+`, weight numeric, reps int).
  Mutasyonlar **tamamen optimistic**: `useAddSet`/`useUpdateSet`/`useDeleteSet` (onMutate yaz + onError
  rollback). Guest: `@logwise/guest/sets`. `DOĞRULANDI` — `queries/workouts.ts`, `supabase_setup.sql` `app_sets`.
- **Web vs mobil:** RIR kodlaması farklı (web "0"=failure ↔ mobil "F"). `DOĞRULANDI` — `supabase_setup.sql` yorum.

### 3.4 Egzersiz: preset / custom
- **Preset (ortak):** Kanonik `data/presets-exercises.json` → bundle/static (Supabase'e
  **kopyalanmaz**). `DOĞRULANDI` — `supabase_setup.sql` yorum "preset ... KOPYALANMAZ".
- **Custom — Web:** `user_data.data.exercises[]`. **Custom — Mobil:** `app_exercises` (kullanıcıya özel).
  Oluşturan: `data-bridge.ts` `createCustomExercise`; guest `@logwise/guest/exercises`. `DOĞRULANDI`.
- **Referans:** `exercise_ref` polymorphic (slug | uuid), FK değil (soft ref). `DOĞRULANDI` — `supabase_setup.sql`.

### 3.5 Program
- **Web:** `user_data.data.programs` + `programMeta` (activatedAt/deloadEvery) + `dailyPrograms`.
  `DOĞRULANDI` — `lib/calc.js` `programs[pgId]`, `programMeta`.
- **Mobil:** `app_programs` + `app_program_days` (preset'ten kopyalanır: `createProgramFromPreset`,
  `preset_origin`=slug). Tek-aktif kuralı: `activated_at not null` tek satır (uygulama katmanı).
  Düzenleme: `app/(app)/program/[id]/edit.tsx`. Guest: `@logwise/guest/{programs,program_days}`.
  `DOĞRULANDI` — `data-bridge.ts`, `supabase_setup.sql`.
- **Risk:** Tek-aktif kuralı DB'de **zorlanmaz** (sadece uygulama) → eşzamanlı/çok-cihaz iki aktif
  program oluşabilir. `ÇIKARIM` — `supabase_setup.sql` yorum "uygulama katmanı garantisi".

### 3.6 Program adherence (uyum)
- **Türetilmiş, kalıcı değil.** Web: `lib/calc.js` `calcCompliance(pgId, workouts, programs, programMeta)`
  → `{week, rate, done, total, isDeload}`. Mobil: `lib/calc.ts` `calcCompliance` + `calcStreak` +
  `nextTrainingDow`. `DOĞRULANDI`.
- **Web vs mobil:** Aynı kavram, ayrı implementasyon (imza/şekil farklı). `DOĞRULANDI`.

### 3.7 PR (Personal Record)
- **Web:** Hesap `lib/calc.js` `getAllPRs` (maxWeight/maxVolume/est1RM). **Denormalize** kalıcı:
  `user_prs` tablosu (`upsert`, `app.html line ~1837`); liderlik okuması `line ~1682`. `DOĞRULANDI`.
- **Mobil:** `lib/calc.ts` `calcPRDisplay` = en yüksek **weight×reps** (1RM **değil**). Kalıcı PR
  tablosu **yok**; her seferinde set'lerden hesaplanır. `DOĞRULANDI`.
- **Risk:** "PR" anlamı platformlar arası farklı (web est1RM-temelli ↔ mobil hacim-temelli). `DOĞRULANDI`.

### 3.8 Estimated 1RM
- **Yalnız web.** `lib/calc.js` `calc1RM` (Epley `w*(1+r/30)`) + `calcBrzycki` (`w*36/(37-r)`).
  `user_prs.estimated_1rm` kolonuna yazılır. Ayrıca statik araç `one-rep-max-calculator.html`.
  **Mobilde Epley/Brzycki YOK.** `DOĞRULANDI` — `lib/calc.js`; `logwise-mobile/lib/calc.ts` (formül yok).

### 3.9 Dashboard istatistikleri
- **Türetilmiş, kalıcı değil.** Mobil: `lib/dashboard.ts` `computeDashboard(sets, today)` →
  totalWorkouts/volume/weeklyVolume(8h)/setsByRef(30g)/prByRef. Kaynak: `data-bridge.ts`
  `fetchDashboardSets`. Web: `components/dash-chart.js` + `lib/calc.js` frekanslar. `DOĞRULANDI`.

### 3.10 Badge (rozet)
- **Web:** `data/badges.js` (30 rozet tanımı) + `lib/badge-logic.js`; kazanılanlar
  `user_data.data.badges[]`. `DOĞRULANDI`.
- **Mobil:** Rozet sistemi **görünmüyor** (placeholder halka/rozet — proje notu). `BELİRSİZ`/`ESKİ OLABİLİR`
  (mobilde aktif rozet hesabı bu turda bulunamadı).

### 3.11 Tema / dil / ayarlar
- **Mobil:** `app_profiles.locale`/`theme` (auth) ya da `@logwise/guest/profile` (guest). `theme-store.ts`
  şu an **in-memory** (kalıcı AsyncStorage entegrasyonu "henüz yok" notu); persist app_profiles üzerinden.
  `DOĞRULANDI`/`ÇIKARIM` — `theme-store.ts` yorumu, `app_profiles` kolonları, `migration.ts` `syncProfile`.
- **Web:** dil seçimi i18n (`window.LOGWISE_TR/EN`); web ayar/tema persist kapsamı bu sette
  doğrulanmadı. `BELİRSİZ`.

---

## 4. Guest ↔ Auth ve Web ↔ Mobil özet farkları

| Eksen | Fark | Kanıt |
|---|---|---|
| Guest (mobil) | Tüm veri `@logwise/guest/*` AsyncStorage; Supabase'e gitmez | `data-bridge.ts` guest dalları `DOĞRULANDI` |
| Guest→Auth (mobil) | **Gerçek migration** (UUID remap + insert + rollback) | `lib/migration.ts` `migrateGuestToAccount` `DOĞRULANDI` |
| Web→Mobil | **Migration YOK** — yalnız tespit + karşılama modalı | `data-bridge.ts` `countWebUserData` + `WebUserWelcomeModal.tsx` `DOĞRULANDI` |
| Veri modeli | Web blob ↔ mobil normalize | `user_data` ↔ `app_*` `DOĞRULANDI` |
| Profil | Ayrı tablolar, senkron yok | `profiles` ↔ `app_profiles` `DOĞRULANDI` |

---

## 5. En ciddi veri tutarsızlık / kayıp riskleri (detay 10'da)
1. **Web offline yazma kaybı:** Ana veri localStorage'da değil; offline `user_data` upsert 503 →
   React state'teki değişiklik reload'da kaybolur. `DOĞRULANDI` (bkz. 07).
2. **Tek-aktif program DB'de zorlanmıyor** → çok-cihaz/yarış iki aktif program. `ÇIKARIM`.
3. **Web↔mobil iki ayrı veri evreni:** Aynı kullanıcı web'de ve mobilde **farklı** antrenman geçmişi
   görür (blob ↔ app_*); köprü yok. `DOĞRULANDI`.
4. **PR/1RM tanım farkı** raporlama tutarsızlığı yaratır. `DOĞRULANDI`.
