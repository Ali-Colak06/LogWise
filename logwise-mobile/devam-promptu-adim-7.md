# LogWise Mobile — Devam Promptu (ADIM 7)

> Bu dosyayi yeni bir Cowork/AI seansinda **oldugu gibi mesaj olarak yapistir**.
> Sozlesme: AI bu dosyayi gorur -> mevcut state'i anlar -> ADIM 7'ye baslar.
> Bir sonraki adima gecince Claude bu dosyayi guncellesin.

---

Merhaba. LogWise mobil uygulamasinin implementation surecindeyiz. **ADIM 1 (Expo scaffold), ADIM 2 (Supabase tablolari + client), ADIM 3 (Theme/tokens + i18n + base UI primitives), ADIM 4 (Auth A1-A5 + React Query + Inter + Toast/Input + guest iskelet), ADIM 5 (Calendar B1 + Day C1 iskelet + preset + guest CRUD + migration + 2 bug fix) ve ADIM 6 (Bottom tab navigator + Library D1-D3 + Day Detail full C2-C4 + E1 More + F1/F2 placeholder + program secimi PRIORITY 0 fix + tsc 0 hata) tamamlandi** — simdi **ADIM 7** sirasi.

**ADIM 7 kapsami:** (A) **Prototip sadakat turu — kullanici onceligi: gorunum prototiplere uzak, bire bir yaklastirilacak** + (B) altyapi: auto-gen DB types + `supabase: any` cast temizligi + App icon/splash app.json'a baglama + Sentry (crash-only) + EAS build + `fetchUsedExerciseRefs` (OPEN) + production checklist. (Eski calendar sil + tsc 0 hata ZATEN bitti.)

## 0. Once su baglam dosyalarini sirayla oku — HIC ISTISNA YOK

1. `AGENTS.md` — proje sozlesmesi (web odakli; mobil alt-agac kendi kurallarini docs'tan alir)
2. `docs/mobile-design-system/03-mvp-decisions.md` (rev 15) — ozellikle **§10 (Sentry), §8.5 (theme), §4.3 (sema/auto-gen types)**
3. `docs/mobile-design-system/05-screen-specs.md` — C2-C4/D1-D3/E1/F1/F2 (implement edildi; refer ederken)
4. **GORSEL TUR ICIN BAGLAYICI:** `docs/mobile-design-system/calendar-prototype-v2/`, `day-prototype/`, `workout-prototype/` (HTML+CSS+JS). Prototip sadakat turunda bunlar **gorsel hakikat kaynagi** — CSS degerlerini buradan al.
5. **BU DOSYANIN §1 ve §3'unu mutlaka oku** — ADIM 6 operasyonel notlari (Edit truncation tuzagi!) ve PRIORITY 0'in gercek sebebi orada.

## 1. Su anki proje state'i — neyi varsayabilirsin, neyi varsayma

### Hazir olan (ADIM 1-6 sonu)

**ADIM 6'da yazilan/guncellenen dosyalar (~30 dosya, ~4000+ satir):**

**Data/logic layer (genisletildi):**
- `lib/data-bridge.ts` (~870 satir, +~500) — Program CRUD (`createEmptyProgram`/`fetchProgramById`/`updateProgram`/`deleteProgram`/`activateProgram`/`deactivateProgram`), program_days mutations (`addProgramDayExercise`/`removeProgramDayExercise`/`reorderProgramDay`/`moveProgramDayExercise`/`clearProgramDay` + `rewriteProgramDays` helper), workout/set CRUD (`ensureWorkout` lazy yazma/`deleteWorkout`/`updateSet`/`deleteSet`/`fetchLastSessionForRef`), `skipExerciseForDay`, custom ex update/delete, `countWebUserData`/`fetchProfilePreferences`/`setProfilePreference`, `fetchAllWorkoutDates`. **`DuplicateProgramError` class** (PRIORITY 0).
- `lib/exercise-resolve.ts` (YENI, ~120) — polymorphic ref → `ResolvedExercise` ({name, categories: CategoryKey[], isPreset, isMissing}); `turkishCatToKey` + `buildCustomMap`. Custom silinmisse "(silinmiş egzersiz)" fallback (rev 13 soft ref).
- `lib/program.ts` (YENI, ~115) — `resolveProgramDay` (dayIndex/isOffDay/weekNumber/isDeloadWeek/exerciseRefs/hasStarted), `programDayCounts` (7-hucre), `totalProgramExercises`, `programDayCount`, `isoToDayIndex`.
- `lib/calc.ts` (YENI, ~165) — `calcCompliance` (§8.6; none→null), `nextTrainingDow`, `calcStreak`, `calcPRDisplay`, `totalVolume`, `relativeDayLabel`.
- `queries/programs.ts` (rewrite, 196) — D2/D3 icin tam mutation seti + `useProgram`/`useCreateEmptyProgram`/activate/deactivate/delete/add/remove/reorder/move/clear. `useCreateProgramFromPreset` artik workouts cache'ini de invalidate eder (PRIORITY 0 refresh fix).
- `queries/workouts.ts` (+~100) — `useAllWorkoutDates`/`useDayMeta`/`useLastSession`/`useEnsureWorkoutAndAddSet`/`useUpdateSet`/`useDeleteSet`/`useDeleteWorkout`/`useSkipExerciseForDay`.
- `queries/exercises.ts` (+) — `useUpdateCustomExercise`/`useDeleteCustomExercise`.
- `queries/profile.ts` (YENI) — `useProfilePreferences`/`useSetProfilePreference`/`useWebUserCount`.

**UI primitives (YENI):**
- `components/ui/AppBottomSheet.tsx` — plain RN Modal + Animated slide-up + scrim (@gorhom YOK).
- `components/ui/SegmentedTabs.tsx` — 2-3 segment, count badge.
- `components/ui/BottomTabBar.tsx` — custom Expo Router tab bar; 5 sekme, "more" sheet acar (onMorePress), gold underline.
- `components/ui/index.ts` — yeni export'lar eklendi.

**Day (C2/C3/C4):**
- `components/day/RirSelect.tsx`, `SetTypeSelect.tsx`, `SetRow.tsx` (KG/reps blur-commit + type + RIR + sil), `ExerciseCard.tsx`, `RestDayBanner.tsx`, `AddExerciseSheet.tsx` (3 tab + search + kategori filtre + single/multi-select + yeni ozel form).

**Workout/Library (D1/D2/D3):**
- `components/workout/ActiveProgramCard.tsx`, `OtherPrograms` (index'e inline), `ProgramActionSheet.tsx`, `NewProgramSheet.tsx`, `ConfirmModal.tsx` (ActivateConfirm + DeleteProgram ortak), `CustomExerciseEditSheet.tsx`.

**Shared:**
- `components/shared/PlaceholderScreen.tsx`, `MoreSheet.tsx` (E1; auth/guest varyant + dil/tema toggle + disabled rows + logout/register), `ExPreviewModal.tsx`.

**Routes (yeniden yapilandirildi — ÖNEMLI):**
- `app/(app)/_layout.tsx` — **Stack** (auth gating): `(tabs)` + `program/[id]/edit` (D3 tam ekran, bottom nav gizli).
- `app/(app)/(tabs)/_layout.tsx` — **Tabs** + custom BottomTabBar + MoreSheet (layout seviyesinde).
- `app/(app)/(tabs)/calendar/index.tsx` — B1 (UI polish + WebWelcome trigger + hint dismiss + duplicate-error).
- `app/(app)/(tabs)/calendar/day/[date].tsx` — C1+C2+C3+C4 entegre.
- `app/(app)/(tabs)/workout/index.tsx` — D1 + D2 segmented.
- `app/(app)/(tabs)/dashboard.tsx` + `social.tsx` — F1/F2 PlaceholderScreen.
- `app/(app)/(tabs)/more.tsx` — redirect stub (sheet layout'ta).
- `app/(app)/program/[id]/edit.tsx` — D3 Program Edit (collapsible day panels + cycle + off-day + reorder + move + activate + delete).

**i18n:**
- `data/i18n-types.ts` + `i18n-tr.ts` + `i18n-en.ts` — yeni namespace'ler: `library.*` (~50), `programEdit.*` (~30), `more.*` (~16), `placeholder.*` (4), `dayExtra.*` (~35) + `nav.library`/`nav.more`. **Toplam ~135 yeni anahtar × 2 dil.** Interpolation `{n}` / `{name}` (mevcut `interpolate` helper'i `{key}` formatini destekler — `%d` DEGIL; eski `calendar.weekNumber: 'Hf %d'` manuel `.replace('%d', ...)` ile cozuldu).

### ADIM 6 PRIORITY 0 — GERCEK SEBEP (prompt'taki tahminler YANLISTI)

Prompt "tablo yok / anon key placeholder / guest mode" tahmin ediyordu. **Supabase MCP ile dogrudan kontrol edildi:**
- `app_*` tablolarinin **HEPSI MEVCUT** (`app_programs` 3 satir, `app_program_days` 87 satir).
- `app.json` `supabaseAnonKey` **gercek key** (placeholder degil).
- `app_programs`'ta auth kullanici `ba569072-...` icin **3 kopya PPL** vardi; sonuncusunda `activated_at` dolu (tek-aktif kurali calisiyor). Yani **insert BASARILI oluyordu** — RLS/auth sorunu YOK.

**Gercek 2 sorun:** (1) UI refresh — `useCreateProgramFromPreset` sadece `programs` cache'ini invalidate ediyordu, takvim grid'i (`workouts`) tazelenmiyordu; app bar'da aktif program adi gec/gorunmuyordu. (2) Duplicate guard yoktu — kullanici 3 kez basinca 3 kopya olustu.

**Cozum (uygulandi):** `createProgramFromPreset` icine **`DuplicateProgramError`** guard (guest + auth; ayni `preset_origin` varsa firlatir). `useCreateProgramFromPreset.onSuccess` artik `programs` + `workouts` cache'ini birlikte invalidate eder. Calendar `onSelectPreset` `DuplicateProgramError`'i yakalayip `library.duplicateProgram` ("{name} zaten ekli.") info toast'i gosterir. **NOT (OPEN):** Bu duplicate davranisi 03-mvp §3.8'de yazili degil — kullanici karariyla eklendi, spec'e yedirilmeli.

### Verify durumu — ✅ TAMAMLANDI (ADIM 6 sonu, ek seans)

**`tsc` CALISTIRILDI ve 0 HATA.** VM geri gelince `npx tsc -p tsconfig.check.json --noEmit` calistirildi. Cikan 9 hata duzeltildi:
- 7 implicit-`any` parametresi (`?? []` ile genisleyen array tipleri) → acik tip anotasyonu (`(p: AppProgramsRow)`, `const days: AppProgramDaysRow[] = ...`, `(d: number)` vb.)
- 2 dosya (`(tabs)/workout/index.tsx` + `program/[id]/edit.tsx`) VM remount sirasinda **sonlarindan kesilmisti** (StyleSheet blogu yarim) → tail'leri bash ile onarildi.
- `tsconfig.check.json` **silindi** (gecici dosya).

**⚠️ OPERASYONEL NOT (kritik):** Edit tool bu buyuk TSX dosyalarinda **birden cok kez truncation yapti** (dosya sonu kesildi). Son duzeltmeler **bash/python ile** yapildi. **Kural:** buyuk dosyada Edit sonrasi mutlaka `python3 -c "s=open(f).read();print(s.count('{'),s.count('}'))"` ile brace balance + `tail` ile son satir kontrolu yap; kesilmis ise bash heredoc/python ile tail'i geri yaz.

### Manuel yapilmasi gerekenler — ✅ HEPSI HALLEDILDI

1. ~~Eski `app/(app)/calendar/` sil~~ → **SILINDI** (`rm -rf`). Route yapisi temiz: `(tabs)/` altinda 5 sekme + `program/[id]/edit` tam ekran. Duplicate-route yok.
2. ~~`tsconfig.check.json` sil~~ → **SILINDI**.
3. **Paket gerekebilir (hala YUKLU DEGIL):** `react-native-draggable-flatlist` (drag/reorder), `@gorhom/bottom-sheet` (sheet polish), `expo-haptics`, `@shopify/flash-list` (virtualization). App bunlarsiz calisir (reorder = ⋮ yukari/asagi buton; sheet = RN Modal). ADIM 7'de istenirse kullanici PowerShell'de kursun (`--legacy-peer-deps`).

### ADIM 6 sonu telefonda test — kismi yapildi

Kullanici Expo Go'da hizli test etti. **Sonuc: ISLEV olarak prototiplere benziyor ve calisiyor; ama GORUNUM olarak prototiplerden ÇOK UZAK.** Spesifik fonksiyonel blocker raporlanmadi (hizli bakis). Detayli ekran-ekran fonksiyonel test hala onerilir.

**KULLANICI KARARI (önemli):** ADIM 6 ekranlari prototiplere **gorsel olarak sadik degil** — islev oncelikli kuruldugu icin spacing/tipografi/kart-chip-buton stilleri prototipten sapmis. Kullanici bunu kabul etti ve **ayri bir "prototip sadakat turu"** istiyor. Bu, ADIM 7'nin (veya ayri bir 7B'nin) parcasi. Kaynak: `docs/mobile-design-system/*-prototype/` (gercek HTML/CSS/JS) — bunlar **baglayici gorsel referans** (rev 7 §7). Yaklasim: prototip CSS degerlerini (renk/spacing/radius/font/kart yapilari) RN token + component stillerine **bire bir** tasi. "Piksel-perfect" degil "prototipe sadik" hedef (RN'de gradient/blur/web-only CSS birebir gelmeyebilir; en yakin esdeger).

### Bekleyen (ADIM 7 kapsami)

- **PRIORITY 0 (yine): tsc 0 hata + eski calendar dosyalarini sil** (yukarida)
- App icon + splash asset'leri (§10.3) — `assets/` + `app.json` icon/splash
- Sentry (`@sentry/react-native` veya `sentry-expo`) — §10.1; `app.json extra.sentryDsn` (su an bos `""`)
- **Auto-gen DB types:** `supabase gen types typescript` → `types/database.ts` guncelle → `data-bridge.ts` + `migration.ts`'teki `const supabase: any` cast'lerini **kaldir** (rev 13 §4.3; ADIM 5/6'dan beri bekliyor)
- EAS build config (`eas.json`) + production checklist
- **PROTOTIP SADAKAT TURU (kullanici onceligi)** — gorunumu `*-prototype/` HTML/CSS'e bire bir yaklastir (bkz §2.1-A)
- Drag/reorder gercek implementasyon (paket eklenirse)
- C2 rest timer (manuel) — MVP sonrasi ama istenirse
- `usedPresetSlugs` gercek hesabi: D1/C4 "Kütüphanem" kapsami su an custom + tum preset gosteriyor; spec "custom + tarihcede kullanilmis preset distinct" istiyor (§8.8). Tarihce-distinct query eklenmeli (`fetchUsedExerciseRefs`). **OPEN.**

### Bekleyen (ADIM 7 kapsami disi)

- Realtime/Storage/Functions — MVP disi
- Sosyal feed / Dashboard chart icerigi — MVP disi (placeholder yeterli)
- Password strength meter, rest timer push notification — MVP sonrasi

## 2. ADIM 7 — Gorev tanimi

### 2.0 SIFIR ONCELIK — ✅ ZATEN HALLEDILDI (ek seansta)
1. ~~Eski calendar sil~~ ✅  2. ~~tsc 0 hata + tsconfig.check.json sil~~ ✅
ADIM 7'ye temiz, derlenen kod tabaniyla baslaniyor. Yeni `tsc` gerekirse tsconfig.check.json'i §3'teki sablonla yeniden uret.

### 2.1 Yapilacaklar (kullanici onceligi: ÖNCE prototip sadakat turu olabilir)

> **KULLANICI ONCELIGI:** Kullanici gorunumun prototiplere uzak oldugunu soyledi ve **prototip sadakat turunu** istiyor (bkz. §1 test notu). Seans basinda kullaniciya sor: "Once prototip sadakat (gorsel) turu mu, yoksa altyapi (types/Sentry/EAS) mi?" Kullanici "sonraki adima gecip sonra gorunumu hallederiz" dedi — yani altyapi once de olabilir; ama prototip sadakat turu ADIM 7 kapsamindadir, atlanmaz.

**A) Prototip sadakat turu (GORSEL — kullanici talebi):**
- Kaynak: `docs/mobile-design-system/calendar-prototype-v2/`, `day-prototype/`, `workout-prototype/` (HTML+CSS+JS). Bunlari OKU; CSS degerlerini (renk/spacing/radius/font-size/font-weight/kart-chip-buton yapilari/gradient/shadow) cikar.
- Token kontrolu: `theme/tokens.ts` zaten prototipten turetildi ama ekran-component stilleri sapti. Once tokenlarin prototip CSS ile esit oldugunu dogrula, sonra her ekranin StyleSheet'ini prototipe yaklastir.
- Ekran ekran: B1 Calendar (app bar, ay grid hucreleri, chip indicator, today border, week feed satirlari) → Day Detail (ex-card, set-grid 6-sutun, set tipi accent renkleri, FAB) → Library D1 (ex-row accent bar + PR pill + chev), D2 (ActiveProgramCard ap-head/ap-stats/ap-days/ap-cta birebir), D3, More.
- "Piksel-perfect" degil "prototipe sadik": RN'de gradient/blur/web-only CSS birebir gelmeyebilir → en yakin esdeger. Her ekran sonrasi kullanicidan telefon ekran goruntusu iste, iteratif yaklastir.

**B) Altyapi/production:**
1. Auto-gen DB types + `any` cast temizligi (`data-bridge.ts:17` + `migration.ts:27`). Supabase MCP ile sema okunabilir veya `supabase gen types`.
2. Sentry (crash-only, beforeSend dev drop, DSN app.json `extra.sentryDsn` — su an `""`). Paket yuklu degil → kullanici kursun.
3. App icon + splash: asset'ler `assets/` icinde HAZIR (`icon.png`, `splash-icon.png`, android adaptive ikonlari) ama `app.json`'a **baglanmamis** (`icon`/`splash` alanlari YOK). Sadece app.json'a eklemek yeterli + `expo-splash-screen` config.
4. EAS build (`eas.json` YOK — uret; bundle id'ler hazir `fit.logwise.mobile`).
5. `fetchUsedExerciseRefs` (D1/C4 "Kütüphanem" su an custom + TUM preset gosteriyor; spec custom + tarihce-distinct preset istiyor §8.8). **OPEN.**
6. (Opsiyonel) drag/reorder + bottom-sheet + FlashList paketleri.
7. Production checklist.

### 2.2 Yapmayacaklarin
- Sosyal/Dashboard gercek icerik (placeholder kalir)
- MVP-sonrasi ozellikler (rest timer push, password meter, realtime)

## 3. OZEL OPERASYONEL NOTLAR — bu sandbox'ta ogrendiklerimiz (GUNCEL)

**Bunlari okumadan kod yazma:**

- **VM/Linux sandbox kararsiz olabilir.** ADIM 6'da seans ortasinda dustu, sonra geri geldi (tsc o zaman calisti). **Plan B:** VM dustugunde Write/Edit/Read/Grep/Glob dosya araclari Windows path'inde calismaya devam eder; sadece bash (tsc/rm/git) durur.
- **⚠️ Edit/Write tool BUYUK TSX dosyalarini KESEBILIYOR (truncation).** ADIM 6'da `workout/index.tsx` ve `program/[id]/edit.tsx` Edit sonrasi sonlarindan kesildi (StyleSheet yarim kaldi); ayrica VM remount da dosya kesti. **Kural:** buyuk dosyaya Edit/Write sonrasi DAIMA dogrula: `python3 -c "s=open(f).read();print('{:',s.count('{'),'}:',s.count('}'))"` + `tail -5 f`. Brace dengesizse veya son satir yarim ise bash/python ile tail'i geri yaz. Kucuk hedefli Edit'ler genelde guvenli; buyuk insert/replace riskli.
- **bash heredoc ile append ederken truncation olabildi:** `data-bridge.ts`'e `cat >>` ile eklerken bir blok yarida kesildi (826. satirda `{ cou`). Cozum: kirik partial'i python ile kesip yeniden append. **Kural:** append sonrasi `python3 -c "print(s.count('{'),s.count('}'))"` ile balance kontrol et.
- **Expo Router route yapisi:** Tab'lar `(tabs)` grubunda; tam-ekran route (D3) `(tabs)` DISINDA `(app)` Stack altinda → bottom nav otomatik gizli. Ayni path'i iki dosya tanimlarsa (eski + yeni calendar) **build patlar** — eski silinmeli.
- **i18n interpolation `{key}` formatinda** (`%d` DEGIL). `t('x', { vars: { n: 5 } })`. Array erisimi `useTranslations().days[i]` (`t()` array dondurmez). `noUncheckedIndexedAccess` → `dict.days[i] ?? ''`.
- **Yeni paket YOK:** @gorhom/bottom-sheet, draggable-flatlist, expo-haptics, flash-list yuklu degil. Sheet = RN Modal+Animated, reorder = buton, liste = ScrollView/map. Kabul edilebilir MVP; ADIM 7'de upgrade opsiyonel.
- **Supabase MCP dogrudan kullanilabilir** (debug icin altin deger): `list_tables`, `execute_sql` ile gercek DB state'i gor — PRIORITY 0 boyle cozuldu. Tahmin etme, sorgula.
- **`Stack justify` prop:** `"space-between"` (CSS standardi), `"between"` degil.
- **`useDataCtx()` mode-aware:** her query/mutation queryKey'e mode+userId dahil; mode degisince cache invalidate.
- **`supabase: any` cast** hala data-bridge + migration'da (auto-gen sonrasi kaldirilacak — ADIM 7).
- **tsconfig.check.json SILINDI** (verify bitti). Tekrar `tsc` gerekirse yeniden uret: kokte, extends ETMEDEN, `module:esnext` + `moduleResolution:bundler` + `jsx:react-native` + `target:ES2022` + `lib:[ES2022,DOM]` + `types:[react,react-native,node]` + path alias'lar (`@components/*` vb. + `@app-types/*: ["types/*"]`) el ile. Sonra `npx tsc -p tsconfig.check.json --noEmit`, bitince sil.
- **`?? []` / `?? null` implicit-any tuzagi:** `const x = query.data ?? []` bazen `any[]`'a genisliyor → `.filter`/`.map` callback'leri implicit any hatasi verir (strict). Cozum: degiskeni acik tiple (`const days: AppProgramDaysRow[] = ...`) veya callback param'ini anote et.

## 4. Mutlak kurallar — bu adimda hatirla

- **TypeScript strict** (+ noUncheckedIndexedAccess + noImplicitOverride)
- **i18n cift dilli zorunlu** — yeni anahtar: once `i18n-types.ts` (tip), sonra `i18n-tr.ts` + `i18n-en.ts`. Array icin `useTranslations()`, `t()` degil.
- **Hardcode string yasak** — `t()` / `useT()` / `useTranslations()`
- **Theme token'lari** uzerinden styling (`useTheme().colors`)
- **Light mode aktif** (§8.5)
- **Misafir mod icin Supabase cagrisi YOK** — data-bridge mode-aware
- **Lucide icon** — named import (Icon wrapper veya dogrudan)
- **Path alias** veya relative — ikisi de OK

## 5. Calisma sekli

- **Her adim sonunda dur** — ozet sun, "devam" denene kadar gecme
- Karar verirken **03-mvp + 05-screen-specs oku**; gorsel icin **`*-prototype/` oku** (baglayici); yoksa `// OPEN:` isaretle
- Buyuk dosya yazimi sonrasi DAIMA brace-balance + tail kontrol (Edit/Write kesebiliyor — §3)
- **Gorsel turda iteratif calis:** her ekrandan sonra kullanicidan telefon ekran goruntusu iste, prototiple kiyasla, yaklastir.

## 6. Onerilen Task list (ADIM 7 basinda create et)

> SIFIR oncelik (eski calendar sil + tsc) ZATEN bitti — task list'e ekleme.
> Seans basinda kullaniciya sor: gorsel sadakat turu mu once, altyapi mi once?

1. Telefonda detayli fonksiyonel test (ekran ekran; kullanicidan gozlem) — blocker var mi?
2. **Prototip sadakat turu (gorsel):** prototipleri oku → token dogrula → ekran ekran StyleSheet'leri prototipe yaklastir (B1→Day→D1/D2/D3→More), her ekran sonrasi kullanici ekran goruntusu
3. Auto-gen DB types + `supabase: any` cast temizligi (data-bridge + migration)
4. App icon + splash → app.json'a bagla (asset'ler hazir) + expo-splash-screen config
5. Sentry crash-only entegrasyon (paket kurulumu kullanici)
6. EAS build config (`eas.json`) + production checklist
7. `fetchUsedExerciseRefs` (D1/C4 Kütüphanem dogru kapsam) — OPEN kapat
8. (Opsiyonel) drag/reorder + bottom-sheet + FlashList paket upgrade
9. `devam-promptu-adim-8.md` uret

## 7. Adim sonu beklentisi

Bittiginde ozet: yazilan dosyalar + boyutlari, tsc sonucu, Sentry durumu, asset durumu, EAS hazirligi, kalan manuel adimlar, telefonda test edilebilir mi. + `devam-promptu-adim-8.md`.

ADIM 8 muhtemel: beta dagitim (TestFlight/Internal track) + gercek kullanici geri bildirimi + bug fix turu + MVP-sonrasi backlog onceliklendirme.
