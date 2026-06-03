# LogWise Mobile — Devam Promptu (ADIM 8)

> Bu dosyayi yeni bir Cowork/AI seansinda **oldugu gibi mesaj olarak yapistir**.
> Sozlesme: AI bu dosyayi gorur -> mevcut state'i anlar -> ADIM 8'e baslar.
> Bir sonraki adima gecince Claude bu dosyayi guncellesin.

---

Merhaba. LogWise mobil uygulamasinin implementation surecindeyiz. **ADIM 1 (Expo scaffold), ADIM 2 (Supabase tablolari + client), ADIM 3 (Theme/tokens + i18n + base UI primitives), ADIM 4 (Auth A1-A5 + React Query + Inter + Toast/Input + guest iskelet), ADIM 5 (Calendar B1 + Day C1 iskelet + preset + guest CRUD + migration + 2 bug fix), ADIM 6 (Bottom tab navigator + Library D1-D3 + Day Detail full C2-C4 + E1 More + F1/F2 placeholder + program secimi PRIORITY 0 fix + tsc 0 hata) ve ADIM 7 ALTYAPI KISMI tamamlandi** — simdi **ADIM 8 = (A) PROTOTIP SADAKAT TURU + (B) Beta dagitim hazirligi + (C) Bug fix turu** sirasi.

**ADIM 7'de yapilanlar (tamamlandi):**
- Auto-gen DB types (Supabase MCP `generate_typescript_types`) → `types/database.generated.ts`, `types/database.ts` artik **kopru dosyasi** (auto-gen + literal union'lar)
- `lib/data-bridge.ts` + `lib/migration.ts`'teki `const supabase: any` cast'leri kaldirildi; tip uyumsuzluklari `Json` cast'leri/`AppSetsUpdate` ile cozuldu
- `app.json` → icon, splash, adaptiveIcon (foreground/background/monochrome), favicon, expo-splash-screen plugin BAGLI
- `lib/sentry.ts` (YENI) — Sentry crash-only entegrasyon (`@sentry/react-native` dinamik require; paket yoksa veya DSN bossa no-op; beforeSend dev drop; PII off)
- `app/_layout.tsx` → `initSentry()` provider'lardan once cagrilir
- `eas.json` (YENI) — development/preview/production profilleri + submit credentials placeholder
- `PRODUCTION-CHECKLIST.md` (YENI) — 9 bolum (build/config, paketler, EAS, smoke test, manuel test, telemetri, store, sonrasi, EAS komut referansi)
- `fetchUsedExerciseRefs` (data-bridge), `useUsedExerciseRefs` (queries/workouts) → D1/C4 "Kutuphanem" su an custom + sadece **tarihcede kullanilmis preset slug** gosteriyor (§8.8 spec dogru)
- **tsc 0 hata** dogrulandi (tsconfig.check.json gecici, sonra silindi)

**ADIM 7'de ATLANDI / 7B'YE BIRAKILDI (kullanici karari):**
- **Prototip sadakat turu** (gorsel) → bu ADIM 8'in A bolumu

## 0. Once su baglam dosyalarini sirayla oku — HIC ISTISNA YOK

1. `AGENTS.md` — proje sozlesmesi (web odakli; mobil alt-agac kendi kurallarini docs'tan alir)
2. `docs/mobile-design-system/03-mvp-decisions.md` (rev 15) — ozellikle **§8.5 theme, §8.8 Kutuphanem, §10 Sentry**
3. `docs/mobile-design-system/05-screen-specs.md` — C2-C4/D1-D3/E1/F1/F2
4. **GORSEL TUR ICIN BAGLAYICI:** `docs/mobile-design-system/calendar-prototype-v2/`, `day-prototype/`, `workout-prototype/` (HTML+CSS+JS). Gorsel tur bunlara **birebir** yaklasacak — CSS degerlerini buradan al.
5. **BU DOSYANIN §1 ve §3'unu mutlaka oku** — ADIM 7 operasyonel notlari (Edit truncation tuzagi DEVAM EDIYOR!) ve mevcut state.

## 1. Su anki proje state'i — neyi varsayabilirsin, neyi varsayma

### Hazir olan (ADIM 1-7 sonu)

**Tip katmani (ADIM 7'de yenilendi):**
- `types/database.generated.ts` — Supabase auto-gen tipi (~17KB). Manuel duzenleme YOK. Tekrar uretmek icin: `npx supabase gen types typescript --project-id czbxujioufhmvoajqwzp --schema public > types/database.generated.ts` (veya Supabase MCP `generate_typescript_types`).
- `types/database.ts` — Kopru: `Database` re-export + semantik alias'lar (`AppExercisesRow`, `AppProgramsRow`, ...) `Tables<'app_xxx'>` uzerinden + literal union'lar (`CycleType`, `SetType`, `RirValue`, `DayIndex`) Omit/&  ile override. `Json` da burdan re-export.
- `lib/data-bridge.ts` (~890 satir, ADIM 7'de `supabase: any` cast'i KALDIRILDI; `dbPatch: AppSetsUpdate`; `preferences as Json` cast; `fetchUsedExerciseRefs` EKLENDI)
- `lib/migration.ts` (~285 satir, ADIM 7'de cast kaldirildi; `syncProfile` signature `string | null` + `Json`)
- `lib/sentry.ts` (YENI, ~110 satir) — crash-only init; paket yoksa no-op
- `lib/supabase.ts` — Database tipi `@app-types/database`'den (kopru)

**App config (ADIM 7'de guncellendi):**
- `app.json` — `icon`, `android.adaptiveIcon` (3 image), `web.favicon`, `expo-splash-screen` plugin BAGLI
- `eas.json` (YENI) — development/preview/production + submit credentials placeholder
- `PRODUCTION-CHECKLIST.md` (YENI) — beta dagitim oncesi 9 bolum kontrol listesi

**UI / Routes (ADIM 6'dan beri):**
- `app/_layout.tsx` — Sentry init + Stack auth/app gating
- `app/(app)/_layout.tsx` — Stack (tabs + program edit tam ekran)
- `app/(app)/(tabs)/_layout.tsx` — 5 sekme + BottomTabBar + MoreSheet
- `app/(app)/(tabs)/calendar/index.tsx` (B1), `calendar/day/[date].tsx` (C1+C2+C3+C4 — ADIM 7'de `useUsedExerciseRefs` baglandi)
- `app/(app)/(tabs)/workout/index.tsx` (D1+D2 — ADIM 7'de `useUsedExerciseRefs` baglandi, D1 artik gercekten "Kutuphanem" gosteriyor)
- `app/(app)/(tabs)/dashboard.tsx` + `social.tsx` (F1/F2 placeholder)
- `app/(app)/(tabs)/more.tsx` (redirect stub; sheet layout'ta)
- `app/(app)/program/[id]/edit.tsx` (D3)
- Data layer: `lib/exercise-resolve.ts`, `lib/program.ts`, `lib/calc.ts`
- Queries: `queries/programs.ts`, `queries/workouts.ts` (ADIM 7'de `useUsedExerciseRefs` eklendi), `queries/exercises.ts`, `queries/profile.ts`
- Day components: `RirSelect`, `SetTypeSelect`, `SetRow`, `ExerciseCard`, `RestDayBanner`, `AddExerciseSheet` (3 tab — `usedPresetSlugs` prop'u artik gercek kaynaktan geliyor)
- Workout/Library: `ActiveProgramCard`, `ProgramActionSheet`, `NewProgramSheet`, `ConfirmModal`, `CustomExerciseEditSheet`
- Shared: `PlaceholderScreen`, `MoreSheet` (E1), `ExPreviewModal`

**i18n:** rev 7 itibariyla `library.*` (~50), `programEdit.*` (~30), `more.*` (~16), `placeholder.*` (4), `dayExtra.*` (~35) + `nav.*` — TR + EN, `{key}` interpolation.

### ADIM 7 sonu telefonda test — YAPILMADI

Kullanici altyapi sectigi icin ADIM 7'de telefonda test edilmedi. Ilk action: tcr/yapi kontrolu ve sentry kontrol → telefonda manuel smoke (PRODUCTION-CHECKLIST.md §5'teki maddeler).

### Bekleyen (ADIM 8 kapsami)

**A) PROTOTIP SADAKAT TURU (kullanici onceligi — ADIM 7'den devredildi):**
- Kaynak: `docs/mobile-design-system/calendar-prototype-v2/`, `day-prototype/`, `workout-prototype/` (HTML+CSS+JS)
- Token kontrolu: `theme/tokens.ts` zaten prototipten turetildi ama ekran-component stilleri sapti. Once tokenlarin prototip CSS ile esit oldugunu dogrula, sonra her ekranin StyleSheet'ini prototipe yaklastir.
- Ekran ekran: B1 Calendar → Day Detail → D1/D2/D3 → More. Her ekran sonrasi kullanicidan telefon ekran goruntusu iste, iteratif yaklastir.
- "Piksel-perfect" degil "prototipe sadik": RN'de gradient/blur/web-only CSS birebir gelmeyebilir → en yakin esdeger.

**B) BETA DAGITIM HAZIRLIGI:**
1. Sentry paketini kullanici kursun: `npx expo install @sentry/react-native`
2. Sentry projesi olustur (sentry.io), DSN al → `app.json` `extra.sentryDsn` doldur
3. `eas-cli` kur (kullanici): `npm install -g eas-cli`, `eas login`, `eas project:init`
4. `eas.json`'daki submit credentials placeholder'lari doldur (ASC ID, Apple ID, Team ID, Play Service Account JSON)
5. EAS preview build: `eas build --profile preview --platform all` → telefonda smoke test
6. PRODUCTION-CHECKLIST.md §1-7 maddelerini sirayla isaretle

**C) BUG FIX TURU + kullanici geri bildirimi:**
- Telefonda detayli fonksiyonel test (ekran ekran) → blocker'lari yakala
- Kullanici geri bildirimine gore oncelik (prototip sadakatinden bagimsiz)
- D3 reorder paketi (`react-native-draggable-flatlist`) opsiyonel upgrade

**D) MVP-sonrasi backlog onceliklendirme:**
- Realtime/Storage/Functions, sosyal feed, dashboard chart, rest timer push, password meter — istek sirasi belirle, ADIM 9+'a yay

## 2. ADIM 8 — Gorev tanimi

### 2.0 SIFIR ONCELIK
- ~~tsc 0 hata~~ ✅ (ADIM 7 sonu)
- ~~Auto-gen types~~ ✅
- ~~`supabase: any` cast temizligi~~ ✅
- ~~`fetchUsedExerciseRefs`~~ ✅
- ~~App icon/splash bagla~~ ✅
- ~~Sentry kod entegrasyon~~ ✅
- ~~EAS config~~ ✅

ADIM 8'e temiz, derlenen kod tabaniyla baslaniyor.

### 2.1 Yapilacaklar (sira: kullaniciya sor)

> **SEANS BASINDA KULLANICIYA SOR:** "Once (A) prototip sadakat turu mu, (B) beta dagitim mi, yoksa (C) bug fix/fonksiyonel test mi?"

**A) Prototip sadakat turu:**
- `docs/mobile-design-system/*-prototype/` OKU; CSS degerlerini (renk/spacing/radius/font/kart-chip-buton/gradient/shadow) cikar
- Token dogrula (`theme/tokens.ts` vs prototip CSS) — sapma varsa duzelt
- Ekran ekran StyleSheet'leri prototipe yaklastir; her ekran sonrasi kullanici ekran goruntusu
- Oneri sirasi: B1 Calendar → Day Detail → ActiveProgramCard → D1 Library → D3 Program Edit → More

**B) Beta dagitim:**
- PRODUCTION-CHECKLIST.md §1-7 sirayla
- Sentry paketi + DSN
- EAS preview build → telefonda smoke
- iOS: TestFlight Internal; Android: Play Internal Track

**C) Bug fix turu:**
- Kullanicidan ekran ekran fonksiyonel test gozlemi al
- Blocker'lari onceliklendir
- D3 reorder, bottom-sheet polish, FlashList virtualization opsiyonel paketler

### 2.2 Yapmayacaklarin
- Sosyal/Dashboard gercek icerik (placeholder kalir)
- MVP-sonrasi ozellikler (rest timer push, password meter, realtime, ML)

## 3. OZEL OPERASYONEL NOTLAR — bu sandbox'ta ogrendiklerimiz (GUNCEL)

**Bunlari okumadan kod yazma:**

- **⚠️ Edit/Write tool BUYUK TSX/JSON dosyalarini ISRARLA KESIYOR (truncation).** ADIM 6'da `workout/index.tsx`, `program/[id]/edit.tsx`; ADIM 7'de `app.json`, `app/_layout.tsx`, `lib/data-bridge.ts`, `app/(app)/(tabs)/calendar/day/[date].tsx`, `app/(app)/(tabs)/workout/index.tsx` Edit/Write sonrasi sonlarindan kesildi. Bash heredoc da bazen kesti.
  - **Kural:** Buyuk dosyaya Edit/Write sonrasi DAIMA dogrula: `python3 -c "s=open(f).read(); print('braces:', s.count('{'), s.count('}'))"` + `tail -10 f`.
  - Brace dengesizse veya son satir yarim ise **bash heredoc** veya **python script** ile tail'i geri yaz.
  - Kucuk hedefli Edit'ler genelde guvenli; buyuk insert/replace YUKSEK RISK.
  - **Kucuk dosyalar (< 60 satir) icin Write/Edit guvenli;** buyukler icin once tail kontrolu.
- **NUL byte tuzagi:** Edit bazen dosya sonuna `\x00` byte'lar yaziyor → `error TS1127: Invalid character`. Cozum: `data.replace(b'\x00', b'')` python ile.
- **VM/Linux sandbox kararsiz olabilir.** Dustugunde Read/Write/Edit/Grep/Glob Windows path'inde calismaya devam eder; bash (tsc/rm) durur.
- **Expo Router route yapisi:** Tab'lar `(tabs)` grubunda; tam-ekran route (D3) `(tabs)` DISINDA `(app)` Stack altinda → bottom nav otomatik gizli.
- **i18n interpolation `{key}` formatinda** (`%d` DEGIL — eski `calendar.weekNumber: 'Hf %d'` manuel `.replace('%d', ...)` ile cozuldu). Array erisimi `useTranslations().days[i]`. `noUncheckedIndexedAccess` → `dict.days[i] ?? ''`.
- **Yeni paket YOK:** @gorhom/bottom-sheet, draggable-flatlist, expo-haptics, flash-list, @sentry/react-native yuklu degil. Sentry yuklenmedikce no-op davranir.
- **Supabase MCP dogrudan kullanilabilir** (debug + auto-gen icin altin deger): `list_tables`, `execute_sql`, `generate_typescript_types`. Tahmin etme, sorgula.
- **`Stack justify` prop:** `"space-between"` (CSS standardi), `"between"` degil.
- **`useDataCtx()` mode-aware:** her query/mutation queryKey'e mode+userId dahil; mode degisince cache invalidate.
- **`?? []` / `?? null` implicit-any tuzagi:** `const x = query.data ?? []` bazen `any[]`'a genisliyor → strict mode `.filter`/`.map` callback implicit any verir. **Cozum:** acik tip anotasyonu (`const refs: string[] = query.data ?? []`) veya callback param'i anote (`(r: string)`).
- **`tsc` icin gecici tsconfig.check.json:** kokte, `extends` ETMEDEN, `module:esnext` + `moduleResolution:bundler` + `jsx:react-native` + `target:ES2022` + `lib:[ES2022,DOM]` + `types:[react,react-native,node]` + path alias'lar (`@components/*` vb. + `@app-types/*: ["types/*"]`) el ile. Sonra `npx tsc -p tsconfig.check.json --noEmit`, bitince sil.

## 4. Mutlak kurallar — bu adimda hatirla

- **TypeScript strict** (+ noUncheckedIndexedAccess + noImplicitOverride)
- **i18n cift dilli zorunlu** — yeni anahtar: once `i18n-types.ts` (tip), sonra `i18n-tr.ts` + `i18n-en.ts`. Array icin `useTranslations()`, `t()` degil.
- **Hardcode string yasak** — `t()` / `useT()` / `useTranslations()`
- **Theme token'lari** uzerinden styling (`useTheme().colors`)
- **Light mode aktif** (§8.5)
- **Misafir mod icin Supabase cagrisi YOK** — data-bridge mode-aware
- **Lucide icon** — named import
- **Path alias** veya relative — ikisi de OK
- **`supabase: any` cast YOK** (ADIM 7'de kaldirildi) — yeni cast EKLEME

## 5. Calisma sekli

- **Her adim sonunda dur** — ozet sun, "devam" denene kadar gecme
- Karar verirken **03-mvp + 05-screen-specs oku**; gorsel icin **`*-prototype/` oku** (baglayici); yoksa `// OPEN:` isaretle
- Buyuk dosya yazimi sonrasi DAIMA brace-balance + tail kontrol (Edit/Write kesebiliyor — §3)
- **Gorsel turda iteratif calis:** her ekrandan sonra kullanicidan telefon ekran goruntusu iste, prototiple kiyasla, yaklastir.

## 6. Onerilen Task list (ADIM 8 basinda create et)

> Seans basinda kullaniciya sor: (A) prototip sadakat / (B) beta dagitim / (C) bug fix hangisi once?

1. Kullanici secimine gore alt task'lara dagit
2. **A) Gorsel sadakat:** prototipleri oku → token dogrula → ekran ekran StyleSheet'leri prototipe yaklastir (B1→Day→D1/D2/D3→More), her ekran sonrasi kullanici ekran goruntusu
3. **B) Beta:** PRODUCTION-CHECKLIST.md §1-7 sirayla; Sentry paket + DSN; eas-cli setup; preview build
4. **C) Bug fix:** ekran-ekran fonksiyonel test gozlemi al → blocker'lari oncele
5. tsc dogrulama (yeni kod sonrasi)
6. `devam-promptu-adim-9.md` uret

## 7. Adim sonu beklentisi

Bittiginde ozet: yazilan dosyalar + boyutlari, tsc sonucu, Sentry durumu (paket/DSN), EAS build durumu, telefonda smoke sonucu, gorsel sadakat ilerlemesi, kalan manuel adimlar. + `devam-promptu-adim-9.md`.

ADIM 9 muhtemel: store yayinlama + ilk kullanici dalgasi + analytics + MVP-sonrasi ilk ozellik (rest timer / password meter / realtime).
