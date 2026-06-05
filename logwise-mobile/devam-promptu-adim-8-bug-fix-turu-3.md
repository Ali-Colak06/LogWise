# LogWise Mobile — Devam Promptu (ADIM 8 BUG FIX TURU — ADIM 3: Day Detail)

> Bu dosyayi yeni bir Cowork/AI seansinda **oldugu gibi mesaj olarak yapistir**.
> Sozlesme: AI bu dosyayi gorur -> mevcut state'i anlar -> Adim 3 (Day Detail fonksiyonel test) baslar.
> Tur bitince Claude bu dosyayi guncellesin (`devam-promptu-adim-8-bug-fix-turu-4.md`).

---

Merhaba. LogWise mobil uygulamasinin implementation surecindeyiz. **ADIM 1 (Expo scaffold), ADIM 2 (Supabase), ADIM 3 (Theme/tokens + i18n), ADIM 4 (Auth A1-A5), ADIM 5 (Calendar B1 + Day C1 + preset), ADIM 6 (Bottom tab + Library D1-D3 + Day full C2-C4 + E1 More + F1/F2), ADIM 7 (Auto-gen types + Sentry + EAS + PRODUCTION-CHECKLIST), ADIM 8 ana paketi (B1 prototip sadakat + Auth bug fix turu), ADIM 8 BUG FIX TURU — Adim 1 (Auth, 5 bug), Adim 2 (Calendar, 7 bug + 2 UI polish)** tamamlandi. Simdi **ADIM 8 BUG FIX TURU — ADIM 3: Day Detail fonksiyonel test** sirasi.

**Onceki seansta (ADIM 8 BUG FIX TURU — Adim 2 Calendar) yapilanlar:**

### A) Tab bar duzeltmesi (3 bug)
- **Tab bar tek Calendar butonu:** `app/(app)/(tabs)/calendar/_layout.tsx` ve `app/(app)/(tabs)/workout/_layout.tsx` yeni Stack layout dosyalari olusturuldu — dynamic route'lar (`calendar/day/[date]`) artik tab bar'da gozukmuyor, ic Stack'te navigate ediliyor
- **Initial route Calendar:** `(tabs)/_layout.tsx`'e `initialRouteName="calendar"` eklendi (geri tusu Calendar'a doner, Panel'e degil)
- **Tab siralamasi:** Custom `BottomTabBar` zaten dogru sirayi kullaniyordu (Calendar > Workout/Kutuphane > Panel > Sosyal > Daha) — sorun dynamic route'lar yuzundendi, layout fix ile cozuldu

### B) Calendar UI duzeltmesi (B1-B6)
- **B1 (P1) Ust bardaki ay basligini kaldir:** `CalendarMonth`'tan sub-header (`< ay >`) ve `onPrevMonth/onNextMonth` props'u tamamen kaldirildi. App bar baslik satiri artik: `[avatar] [<] [Ay] [>] [view-switch] [BUGUN pill]` + altinda yil (mono). Oklar sadece month modunda gosterilir; week modunda gizli.
- **B2 (P0) Week view bugunku haftaya anchor:** `weekAnchor` state eklendi (default: bugun). `CalendarWeek`'e `onTodayWeekLayout?: (y: number) => void` prop eklendi — bugunu iceren hafta render edildiginde y offset'i parent'a bildirilir. Parent `ScrollView` ref + `todayWeekYRef` ile auto-scroll yapiyor. Month → Week gecisinde 50ms gecikme ile bugunku hafta gorunume gelir.
- **B3 (P1) Today pill week view'da:** `goToday` artik hem `monthDate` (1.gun) hem `weekAnchor` (bugun) reset ediyor. Week modundaysa `scrollToTodayWeek` cagrilir.
- **B5 (P1) Month grid ekrana sigsin:** `CalendarMonth` 6×7 flex grid yapildi (`root: { flex: 1 }`, `grid: { flex: 1, flexDirection: 'column' }`, `gridRow: { flex: 1, flexDirection: 'row' }`, `dayCell: { flex: 1 }`). Grid kalan dikey alani doldurur. ScrollView yerine month modunda dogrudan `View flex:1`; week modunda ScrollView korundu.
- **B6 (P1) Hint card floating overlay:** Hint card artik `position: absolute, bottom: 16` ile grid uzerinde gezen panel. Shadow + elevation eklendi. Grid'i sikistirmaz.
- **B7 (P0) Hint card gorunmuyor → DB fix:** `app_profiles.preferences.seen_hint_card` true idi (onceki dismiss). Supabase'de false'a cekildi. Ayrica Haziran 2026'da 1 test workout (`1 Haziran bench-press`) vardi → silindi. Su an: `seen_hint_card=false`, Haziran 2026 workout=0, `active_program_id=null`. Yeni reload'da hint card gorunmeli.
- **UI polish — padding & radius:** `Screen` `hPadding={0}` (screenHPadding sifirlandi); `monthContainer paddingHorizontal: 1`; grid + gridRow `gap: 1`; `dayCell borderRadius: 6 → 3`. Hucreler ekran kenarina dayali, daha genis, keskin koseli.

### C) Atlanan testler (sonraki turlara birakildi)
- **Test 7 — Preset Program Modal:** Hint card cache'i guncellenmedigi icin atlandi. Telefonda app restart sonrasi hint gorunecek, sonra modal test edilebilir. Beklenenler:
  - "Program Sec" butonu → modal acilir
  - Preset listesi (PPL, Full Body, Upper/Lower) gorunur
  - Bir preset sec → program olusur, modal kapanir, "Kaydedildi" toast, hint kaybolur
  - Ayni preset'i tekrar sec → `DuplicateProgramError` → "Bu program zaten kutuphanende" toast
  - Modal dismiss (swipe down / X butonu) calisir
- **Test 8 — Web user welcome modal:** Kullanici `seen_web_welcome=true` (zaten dismiss edilmis). Yeni test icin DB'de false'a cekilebilir.
- **Test 9 — Event chip rendering:** Hicbir workout girilmedigi icin atlandi. Program olusturulup workout girildikten sonra test edilebilir.
- **Test 10 — Week view detaylari (rest day, hafta header stats):** Workout/rest gun verisi yokken atlandi.

### D) Avatar tap (gozlem, ileride)
- Avatara (ust bardaki PU initials) tiklayinca hicbir aksiyon yok. MVP'de aksiyon tanimli degil. **Ileride profil sheet veya MoreSheet acabilir** — P2, simdilik birakildi.

**tsc durumu:** 0 hata (`tsconfig.check.json` ile dogrulandi). NUL byte tuzagi 1 kez CalendarMonth.tsx'te gerceklesti, `python3` ile temizlendi. Truncation tuzagi 2 kez `calendar/index.tsx`'te gerceklesti, python heredoc ile yeniden yazilarak onarildi.

---

## 0. Once su baglam dosyalarini sirayla oku — HIC ISTISNA YOK

1. `AGENTS.md` — proje sozlesmesi
2. `docs/mobile-design-system/03-mvp-decisions.md` (rev 15) — §3.6 Day Detail spec, §8.5 theme
3. `docs/mobile-design-system/05-screen-specs.md` — C1-C4 Day Detail tam spec
4. **BU DOSYANIN §1 ve §3'unu mutlaka oku** — onceki seans operasyonel notlari + mevcut state

---

## 1. Su anki proje state'i — neyi varsayabilirsin, neyi varsayma

### Hazir olan (ADIM 1-8 BUG FIX Adim 2 sonu)

**Tip katmani:**
- `types/database.generated.ts` (Supabase auto-gen) + `types/database.ts` kopru
- `data/i18n-types.ts` (~597 satir, ADIM 8'de tail onarimi)
- `data/i18n-tr.ts` + `data/i18n-en.ts` (~640 satir, ADIM 8'de tail onarimi)

**Theme:**
- `theme/tokens.ts`: ColorPalette + categoryMuted + setMuted, shadows.cardLarge + shadows.cta, fonts.{display*,mono*}
- `theme/index.tsx`: useTheme() -> aktif scheme (dark default)

**App config:**
- `app.json`: icon, splash, expo-splash-screen plugin, extra.resetPasswordRedirect
- `eas.json`: development/preview/production
- `PRODUCTION-CHECKLIST.md`

**Auth (ADIM 8 BUG FIX Adim 1 — 5 bug fix):**
- `app/(auth)/_layout.tsx`: `initialRouteName="welcome"` + sadece `mode==='auth'`'ta redirect
- `app/(auth)/welcome.tsx`: 3 buton (Register/Login/Misafir secondary)
- `app/(auth)/login.tsx`, `register.tsx` (width 100%), `forgot-password.tsx`, `verify.tsx`
- `app/index.tsx`: root index + debug log
- `stores/auth-store.ts`, `hooks/useAuth.ts`, `queries/auth.ts`

**Calendar (ADIM 8 BUG FIX Adim 2 — 7 bug + 2 UI polish):**
- `app/(app)/(tabs)/calendar/_layout.tsx` **YENI** (Stack layout)
- `app/(app)/(tabs)/calendar/index.tsx` (~407 satir) — App bar yeniden tasarlandi: avatar | < ay > | view-switch | BUGUN. Month view tam flex. Floating hint overlay. `weekAnchor` state + scroll ref.
- `app/(app)/(tabs)/calendar/day/[date].tsx` (C1-C4) — **bu seansta test edilecek, DEGISMEDI**
- `components/calendar/CalendarMonth.tsx` (~288 satir) — sub-header kaldirildi, 6×7 flex grid, `borderRadius: 3`
- `components/calendar/CalendarWeek.tsx` (~345 satir) — `onTodayWeekLayout` prop eklendi
- `components/calendar/PresetProgramModal.tsx`

**Workout/Library:**
- `app/(app)/(tabs)/workout/_layout.tsx` **YENI** (Stack layout)
- `app/(app)/(tabs)/workout/index.tsx` (D1+D2)
- `app/(app)/(tabs)/dashboard.tsx`, `social.tsx` (F1/F2 placeholder)
- `app/(app)/(tabs)/more.tsx` (redirect stub; MoreSheet sheet'te)
- `app/(app)/program/[id]/edit.tsx` (D3)

**Components:**
- `components/shared/MoreSheet.tsx` (debug row + Logout fix)
- `components/ui/AppBottomSheet.tsx` (ScrollView)
- Day: `RirSelect`, `SetTypeSelect`, `SetRow`, `ExerciseCard`, `RestDayBanner`, `AddExerciseSheet`
- Workout/Library: `ActiveProgramCard`, `ProgramActionSheet`, `NewProgramSheet`, `ConfirmModal`, `CustomExerciseEditSheet`

**Data layer:** `lib/data-bridge.ts`, `lib/migration.ts`, `lib/exercise-resolve.ts`, `lib/program.ts`, `lib/calc.ts`, `lib/sentry.ts`
**Queries:** `queries/programs.ts`, `queries/workouts.ts`, `queries/exercises.ts`, `queries/profile.ts`, `queries/auth.ts`

### Mevcut DB durumu (auth user: colak.ali1928@gmail.com)
- `app_profiles.preferences = {"seen_hint_card": false, "seen_web_welcome": true}` (hint card icin reset edildi)
- `active_program_id: null` (PPL deaktive edildi)
- Haziran 2026 `app_workouts`: 0 satir (1 Haziran test silindi)
- Project ID: `czbxujioufhmvoajqwzp`

### Telefonda Adim 1 (Auth) test sonucu — TAMAMLANDI ✅
- Welcome 3 buton (Register + Login + Misafir): ✅
- Login → Calendar: ✅
- Logout: ✅
- Misafir → Register migration: ATLANDI

### Telefonda Adim 2 (Calendar) test sonucu — TAMAMLANDI ✅ (kismi)
- Month view render + 7×6 grid + bugun gold border: ✅
- Gun tikla → Day Detail: ✅
- Ay navigasyonu (uste tasindi): ✅
- Today pill (her iki view'da): ✅
- View switch (Month ↔ Week) + week view bugunku haftaya anchor: ✅
- Grid ekran dolduruyor, padding dusuk, radius keskin: ✅
- Floating hint card layout: ✅ (gorunurluk: telefonda app restart sonrasi dogrulanmali)
- **ATLANDI:** Preset modal full test, Web user welcome, Event chip rendering, Week view detaylari (rest day vb.)

### Bekleyen (Adim 3 — Day Detail fonksiyonel test, BU SEANS)

**Test edilecekler:**

1. **C1 — Date header**
   - Tarih basligi (gun adi + tarih) dogru gosteriyor mu?
   - Program day badge (eger aktif program varsa, Push/Pull/Leg etc.) — su an aktif program yok, atlanabilir
   - Geri butonu → Calendar'a donus

2. **C2 — Exercise card + Set rows**
   - "Hareket Ekle" CTA gorunuyor mu? (bos gun)
   - Bir gune git, hareket ekle → exercise card gorunuyor mu?
   - Set row: weight + reps + RIR + set type input alanlari calisiyor mu?
   - Set ekle / sil
   - RIR select dropdown
   - Set type select (warmup, working, drop, etc.)
   - Set kaydet → DB'ye yaziyor mu? (auth user → Supabase, guest → AsyncStorage)

3. **C3 — Add Exercise Sheet**
   - "Hareket Ekle" → bottom sheet acilir mi?
   - Hareket arama / kategori filtreleme
   - Preset hareket sec (örn bench press) → exercise card eklenir mi?
   - Custom hareket (yeni hareket olusturma) varsa

4. **C4 — Rest day banner**
   - Rest gun isaretle (eger UI varsa) → banner gosteriliyor mu?
   - Rest day toggle calisiyor mu?

5. **Navigation**
   - Day Detail → Calendar geri tusu
   - Day Detail → Calendar tab tusu
   - Date carousel (eger gunler arasi navigation varsa)

### Adim 3 sonrasi (sonraki seans)

- Adim 4: D1/D2 Workout/Library fonksiyonel test
- Adim 5: D3 Program Edit fonksiyonel test
- Adim 6: More menu (E1) fonksiyonel test
- Sonra: Debug temizlik (MoreSheet debug row + `app/index.tsx` console.log) + ADIM 9 hazirligi (reset password sistemi + beta build)

---

## 2. Bu seansin gorev tanimi

### 2.0 SIFIR ONCELIK (yapilmis durumda olmali)
- ✅ tsc 0 hata
- ✅ Tab bar tek calendar butonu
- ✅ Calendar app bar + flex grid + floating hint
- ✅ Hint card DB reset
- ✅ Truncation/NUL byte tuzaklari onarildi

### 2.1 Yapilacaklar

**SEANS BASINDA KULLANICIYA SOR:** "Adim 3 (Day Detail fonksiyonel test) ile devam edelim mi?"

Kullanici hazir oldugunda:
1. **Kullanicidan ekran ekran test gozlemi al** — yukaridaki 5 alt madde (C1-C4 + Navigation)
2. **Her bug icin format:**
   - Ekran: (ornegin "Day Detail — Bench Press set ekleme")
   - Adim: (ornegin "Set ekledim, weight=80 girdim")
   - Beklenen: (ornegin "Kaydedildi toast + DB'ye yazma")
   - Olan: (ornegin "Hicbir sey olmadi, console hatasi var mi?")
   - Screenshot: varsa
3. **Bug bulununca:**
   - Onceliklendir (P0 crash/data loss / P1 broken flow / P2 cosmetic)
   - Kod incelemesi -> root cause (Day Detail: `app/(app)/(tabs)/calendar/day/[date].tsx` + `components/day/*`)
   - Fix uygula
   - Reload + tekrar dogrula
4. **Bittiginde:**
   - `devam-promptu-adim-8-bug-fix-turu-4.md` uret (Adim 4: Workout/Library testi)

### 2.2 Yapmayacaklarin
- Prototip sadakat (Day icin ileride ayri tur olabilir)
- Beta dagitim (ADIM 9 kapsami)
- Reset password sistemi (ADIM 9 kapsami)
- Yeni feature (MVP-sonrasi)
- Avatar tap aksiyonu (ileride)

---

## 3. OZEL OPERASYONEL NOTLAR — GUNCEL (cok onemli!)

**Bunlari okumadan kod yazma:**

- **⚠️ Edit/Write tool BUYUK dosyalari ISRARLA KESIYOR (truncation).** ADIM 8 BUG FIX Adim 2'de tekrar gerceklesti (`calendar/index.tsx` 2 kez kesildi). Belirti: dosya son satiri yarim kesik, bash'te `wc -l` Read tool'unun gosterdiginden cok daha az. **Kural:**
  - Buyuk dosyaya Edit/Write sonrasi DAIMA bash ile dogrula: `wc -l <file>` + `tail -10 <file>`
  - Eger kesikse: `python3` heredoc ile **tam dosyayi yeniden yaz** veya kesik kismi tamamla
  - Kucuk dosyalar (<60 satir) Edit/Write guvenli
- **NUL byte tuzagi:** Edit bazen dosya sonuna `\x00` byte'lar yaziyor → `error TS1127: Invalid character`. Cozum:
  ```bash
  python3 -c "f='path'; data=open(f,'rb').read(); open(f,'wb').write(data.replace(b'\\x00',b''))"
  ```
- **Read tool cache vs disk asenkron:** Read tool dosyanin "tam halini" gosterirken, gercekte disk uzerinde kesik olabilir. **Bash ile `wc -l` ve `tail` ile diskte ne oldugunu dogrula.**

- **Tab bar yapisi:**
  - `(tabs)/_layout.tsx` `initialRouteName="calendar"`
  - `calendar/_layout.tsx` ve `workout/_layout.tsx` ic Stack layout — dynamic route'lar tab bar'da gozukmez
  - Custom `BottomTabBar` 5 sekme: calendar / workout / dashboard / social / more

- **Calendar app bar:** Avatar | < (sadece month) | Title | > (sadece month) | view-switch | BUGUN pill. Month/Week ortak app bar; alt header artik yok.

- **Calendar week scroll:** `scrollRef` (parent ScrollView) + `todayWeekYRef` + `CalendarWeek.onTodayWeekLayout`. Month → Week gecisinde `setTimeout(50ms)` ile auto-scroll.

- **Calendar month flex grid:** 6×7 row/cell, hepsi `flex: 1`. Screen `hPadding={0}`, `monthContainer paddingHorizontal: 1`, `gap: 1`, `dayCell borderRadius: 3`.

- **Calendar hint card:** `position: absolute, bottom: 16`, `pointerEvents="box-none"`. `showHint = !hasWorkouts && !workoutsQ.isLoading && !seenHintCard`. **Workout o ay icin hic yoksa ve daha once dismiss edilmemisse gorunur.** Test icin DB reset gerekti.

- **Auth gating:**
  - `app/index.tsx` -> mode'a gore `(auth)/welcome` veya `(app)/calendar` redirect
  - `app/(auth)/_layout.tsx` -> sadece `mode === 'auth'`'ta `(app)/calendar` redirect (guest mode auth ekranlarina erisebilir)
  - `app/(auth)/_layout.tsx` -> `initialRouteName="welcome"`

- **AppBottomSheet ScrollView** — uzun icerikler artik scroll edilebilir.

- **MoreSheet'te debug row** var: `mode=auth · email=...` — Bug fix turu bitince temizlenecek. **Simdilik dokunma.**
- **`app/index.tsx`** debug `console.log('[RootIndex] mode=', mode)` var — bug fix turu bitince temizlenecek.

- **Reset password redirectTo:** `app.json extra.resetPasswordRedirect` whitelist edilmemis. ADIM 9'a bekliyor.

- **VM/Linux sandbox kararsiz olabilir.** Dustugunde Read/Write/Edit/Grep/Glob Windows path'inde calismaya devam eder; bash (tsc/rm) durur.

- **Expo Router route yapisi:** Tab'lar `(tabs)` grubunda; tam-ekran route (D3) `(tabs)` DISINDA `(app)` Stack altinda → bottom nav otomatik gizli. Tab gruplarinda dynamic route'lar (calendar/day/[date]) artik ic Stack layout sayesinde tab bar'da gozukmuyor.

- **i18n interpolation `{key}` formatinda** (eski `%d` degil). Array erisimi `useTranslations().days[i]`. `noUncheckedIndexedAccess` → `dict.days[i] ?? ''`.

- **Supabase MCP** dogrudan kullanilabilir: `list_tables`, `execute_sql`, `generate_typescript_types`. Project ID: `czbxujioufhmvoajqwzp`. Auth user `colak.ali1928@gmail.com`. **DB tablo isimleri: `app_profiles`, `app_workouts`** (not `profiles`, `workouts`).

- **`Stack justify` prop:** `"space-between"`, `"between"` degil.

- **`?? []` / `?? null` implicit-any tuzagi:** Acik tip anotasyonu kullan veya callback param'i anote et.

- **`tsc` icin gecici tsconfig.check.json** kokte (zaten var):
  ```bash
  npx tsc -p tsconfig.check.json --noEmit
  ```

---

## 4. Mutlak kurallar — bu adimda hatirla

- **TypeScript strict** (+ noUncheckedIndexedAccess + noImplicitOverride)
- **i18n cift dilli zorunlu** — yeni anahtar: once `i18n-types.ts` (tip), sonra `i18n-tr.ts` + `i18n-en.ts`. Array icin `useTranslations()`, `t()` degil.
- **Hardcode string yasak** — `t()` / `useT()` / `useTranslations()`
- **Theme token'lari** uzerinden styling (`useTheme().colors`)
- **Dark mode default** (§8.5)
- **Misafir mod icin Supabase cagrisi YOK** — data-bridge mode-aware
- **Lucide icon** — named import
- **Path alias** veya relative — ikisi de OK
- **`supabase: any` cast YOK** — yeni cast EKLEME
- **Buyuk dosyaya Edit/Write sonrasi DAIMA dogrula** (wc -l + tail)

---

## 5. Calisma sekli

- **Her test sonunda dur** — kullanici test gozlemi versin, bug varsa fix sonrasi tekrar dogrula
- Test reglemanli: ekran-ekran, kullanici verisi/bug raporu temelli
- **Test edilecekler ortak format:** ✅ veya ❌ + ekran adi + adim
- Buyuk dosya yazimi sonrasi DAIMA brace-balance + tail kontrol
- Bug bulununca priorite: P0 (crash/data loss) -> P1 (broken flow) -> P2 (cosmetic)

---

## 6. Adim 3 sonu beklentisi

Bittiginde ozet:
- Test edilen 5 alt madde durumlari (✅ / ❌ + aciklama)
- Bulunan bug'lar listesi (priorite ile)
- Fix edilenler + kalan blocker'lar
- tsc dogrulamasi (yeni kod sonrasi)
- `devam-promptu-adim-8-bug-fix-turu-4.md` uret (Adim 4: Workout/Library testi)

**ADIM 8 BUG FIX TURU sonu hedef:** 6 ekranin tumu fonksiyonel test edilmis, P0/P1 bug'lar duzeltilmis, debug satirlari temizlenmis, ADIM 9'a temiz baslangic.
