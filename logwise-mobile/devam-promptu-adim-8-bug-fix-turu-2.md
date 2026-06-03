# LogWise Mobile — Devam Promptu (ADIM 8 BUG FIX TURU — ADIM 2: Calendar)

> Bu dosyayi yeni bir Cowork/AI seansinda **oldugu gibi mesaj olarak yapistir**.
> Sozlesme: AI bu dosyayi gorur -> mevcut state'i anlar -> Adim 2 (Calendar fonksiyonel test) baslar.
> Tur bitince Claude bu dosyayi guncellesin (`devam-promptu-adim-8-bug-fix-turu-3.md`).

---

Merhaba. LogWise mobil uygulamasinin implementation surecindeyiz. **ADIM 1 (Expo scaffold), ADIM 2 (Supabase), ADIM 3 (Theme/tokens + i18n), ADIM 4 (Auth A1-A5), ADIM 5 (Calendar B1 + Day C1 + preset), ADIM 6 (Bottom tab + Library D1-D3 + Day full C2-C4 + E1 More + F1/F2), ADIM 7 (Auto-gen types + Sentry + EAS + PRODUCTION-CHECKLIST), ADIM 8 ana paketi (B1 prototip sadakat + Auth bug fix turu)** tamamlandi. Simdi **ADIM 8 BUG FIX TURU — ADIM 2: Calendar fonksiyonel test** sirasi.

**Onceki seansta (ADIM 8 ilk yari) yapilanlar:**

### A) Prototip sadakat (B1 Calendar)
- `theme/tokens.ts` genisletildi: `ColorPalette.categoryMuted`, `ColorPalette.setMuted`, `shadows.cardLarge`, `shadows.cta` (gold halo), `text.onAccent: '#0A0A0A'` (prototip ile birebir)
- **Yeni fontlar:** `@expo-google-fonts/space-grotesk@^0.4.1` + `@expo-google-fonts/jetbrains-mono@^0.4.1` `package.json`'a eklendi, `app/_layout.tsx` `useFonts`'a kayit, `tokens.fonts.{display,displayStrong,displayBold,mono,monoStrong,monoBold}` aktif
- `components/calendar/CalendarMonth.tsx` prototipe yaklastirildi: 6x7 grid, day number wrap, event chip (kategori-renkli + muted bg), bugun gold border, secili gold linear bg, rest day cyan bg, kisa kategori isimleri (chest -> "Gogus" / "Chest")
- `components/calendar/CalendarWeek.tsx` prototipe yaklastirildi: week-block (W## + tarih araligi + meta stats) -> week-strip -> her satir [48px tarih kolonu] | [body: plan adi + cat chips + meta] | [chev 30px]
- `app/(app)/(tabs)/calendar/index.tsx` top app bar: avatar (initials) | 2-satir title (ay adi + yil mono) | view-switch icon + today pill (gold-muted bg + gold border + Target icon + UPPERCASE mono label)
- i18n yeni anahtarlar: `calendar.weekDaysAbbr`, `calendar.weekExAbbr`, `day.workout`, `day.rest`, `day.restDayShort` (TR + EN)

### B) BLOCKER fix (truncation tuzagi)
ADIM 7'de uyarilan Edit/Write tool truncation tuzagi 5 dosyada gerceklesti, hepsi onarildi:
- `data/i18n-types.ts`, `data/i18n-tr.ts`, `data/i18n-en.ts` (son satirdan kesik + NUL byte temizlik)
- `components/calendar/CalendarMonth.tsx`, `components/calendar/CalendarWeek.tsx`
- `app/(app)/(tabs)/calendar/index.tsx`
- **Yedek dosyalar:** `data/i18n-*.bak.adim8` (kullanici sandbox silme izni yok, manuel silinebilir)

### C) Auth bug fix turu (Adim 1) — 5 P0/P1 bug duzeltildi
- **BUG #1 (P0) Logout sheet'te yok** -> `components/ui/AppBottomSheet.tsx`'e `ScrollView` eklendi (uzun sheet icerikleri scroll edilebilir, son row erisilebilir)
- **BUG #2 (P0) Misafir "Hesap Ac" anlik kapaniyor** -> `app/(auth)/_layout.tsx`'te `mode === 'guest'` durumunda da `/(app)/calendar`'a redirect ediyordu; sadece `mode === 'auth'` durumunda redirect var; `MoreSheet.onRegister` `setTimeout 250ms` race condition kaldirildi (push once, close sonra)
- **BUG #3 (P1) Welcome'da Misafir butonu goz onunde degil** -> `app/(auth)/welcome.tsx` `variant="ghost"` -> `variant="secondary"` (transparent bg + secondary text yerine elevated bg + border + primary text)
- **BUG #4 (P0) Ilk acilista Login geliyor** -> `app/(auth)/_layout.tsx` `<Stack initialRouteName="welcome">` eklendi; `app/index.tsx`'e debug `console.log('[RootIndex] mode=', mode)` eklendi (test araci, sonra temizlenecek)
- **BUG #5 (P1) Register form input'lari kucuk** -> `app/(auth)/register.tsx` form VStack'ine `width="100%"` eklendi (login.tsx ile ayni pattern)

### D) Ertelenenler / kayitli backlog
- **BUG #6 (P0) Reset password landing'e gidiyor** -> ADIM 9'a planlandi. Mevcut: `queries/auth.ts`'te `resetPasswordForEmail` artik `redirectTo` parametresini `app.json extra.resetPasswordRedirect` ('https://logwise.fit/reset-password') uzerinden geciyor. **Web reset sayfasi BROKEN** (sifreni sifirlamak yerine login yapiyor). ADIM 9 kapsami: yeni reset sistem tasarimi (mobile reset screen + deep link veya yeni web reset sayfasi)
- **Email confirmation** -> MVP karari, ACIK (§3.6 03-mvp). Kasitli kapali. Post-MVP'de Supabase Dashboard'da acilabilir
- **Misafir -> Register migration testi** -> Sonraki seansa ertelendi
- **MoreSheet debug row** (`mode=auth · email=`) ve `app/index.tsx console.log` -> Bug fix turu bitince temizlenecek

### E) Konfigurasyon notu
- **`app.json extra.resetPasswordRedirect: "https://logwise.fit/reset-password"`** eklendi. ADIM 9'da gercek hedefe gore guncellenecek + Supabase Dashboard'da Redirect URLs'e whitelist eklenecek

**tsc durumu:** 0 hata (`tsconfig.check.json` ile dogrulandi). Sadece beklenen 2 missing module hatasi (Space Grotesk + JetBrains Mono) `npm install` ile cozuldu, runtime'da fontlar yuklu.

---

## 0. Once su baglam dosyalarini sirayla oku — HIC ISTISNA YOK

1. `AGENTS.md` — proje sozlesmesi
2. `docs/mobile-design-system/03-mvp-decisions.md` (rev 15) — §3.5 calendar spec, §8.5 theme, §8.1 calendar visual
3. `docs/mobile-design-system/05-screen-specs.md` — B1 Calendar tam spec
4. **GORSEL TUR BAGLAYICI:** `docs/mobile-design-system/calendar-prototype-v2/` (HTML+CSS+JS) — Calendar prototip
5. **BU DOSYANIN §1 ve §3'unu mutlaka oku** — onceki seans operasyonel notlari + mevcut state

---

## 1. Su anki proje state'i — neyi varsayabilirsin, neyi varsayma

### Hazir olan (ADIM 1-8 ilk yari sonu)

**Tip katmani (ADIM 7'de auto-gen, ADIM 8'de onarildi):**
- `types/database.generated.ts` (Supabase auto-gen) + `types/database.ts` kopru
- `data/i18n-types.ts` (~597 satir, ADIM 8'de tail onarimi)
- `data/i18n-tr.ts` + `data/i18n-en.ts` (~640 satir, ADIM 8'de tail onarimi + yeni anahtarlar)

**Theme (ADIM 8'de genisletildi):**
- `theme/tokens.ts`: ColorPalette + categoryMuted + setMuted, shadows.cardLarge + shadows.cta, fonts.{display*,mono*}
- `theme/index.tsx`: useTheme() -> aktif scheme (default dark — §8.5 dogrulandi), Appearance listener

**App config:**
- `app.json`: icon, splash, expo-splash-screen plugin, **extra.resetPasswordRedirect** (ADIM 8'de eklendi)
- `eas.json`: development/preview/production profilleri (ADIM 7'de)
- `PRODUCTION-CHECKLIST.md`: 9 bolum

**Auth (ADIM 8'de 5 bug duzeltildi):**
- `app/(auth)/_layout.tsx`: `initialRouteName="welcome"` + sadece `mode==='auth'`'ta redirect
- `app/(auth)/welcome.tsx`: 3 buton (Register/Login/**Misafir** secondary variant)
- `app/(auth)/login.tsx`, `register.tsx` (width 100%), `forgot-password.tsx`, `verify.tsx`
- `app/index.tsx`: root index + debug log
- `stores/auth-store.ts`, `hooks/useAuth.ts`, `queries/auth.ts` (resetPassword redirectTo eklendi)

**UI / Routes:**
- `app/_layout.tsx`: Sentry init + Stack auth/app gating + 11 font yukleme (Inter + SpaceGrotesk + JetBrainsMono)
- `app/(app)/_layout.tsx`, `app/(app)/(tabs)/_layout.tsx`
- `app/(app)/(tabs)/calendar/index.tsx` (ADIM 8'de prototipe yaklastirildi) — Month/Week + top bar
- `app/(app)/(tabs)/calendar/day/[date].tsx` (C1-C4, ADIM 6+7'de)
- `app/(app)/(tabs)/workout/index.tsx` (D1+D2)
- `app/(app)/(tabs)/dashboard.tsx`, `social.tsx` (F1/F2 placeholder)
- `app/(app)/(tabs)/more.tsx` (redirect stub; MoreSheet sheet'te)
- `app/(app)/program/[id]/edit.tsx` (D3)

**Components:**
- `components/calendar/CalendarMonth.tsx` (ADIM 8 prototip yaklastirma) — 335 satir
- `components/calendar/CalendarWeek.tsx` (ADIM 8 prototip yaklastirma) — 336 satir
- `components/calendar/PresetProgramModal.tsx`
- `components/shared/MoreSheet.tsx` (ADIM 8'de debug row + Logout fix)
- `components/ui/AppBottomSheet.tsx` (ADIM 8'de ScrollView eklendi)
- Day: `RirSelect`, `SetTypeSelect`, `SetRow`, `ExerciseCard`, `RestDayBanner`, `AddExerciseSheet`
- Workout/Library: `ActiveProgramCard`, `ProgramActionSheet`, `NewProgramSheet`, `ConfirmModal`, `CustomExerciseEditSheet`

**Data layer:** `lib/data-bridge.ts`, `lib/migration.ts`, `lib/exercise-resolve.ts`, `lib/program.ts`, `lib/calc.ts`, `lib/sentry.ts`
**Queries:** `queries/programs.ts`, `queries/workouts.ts` (useUsedExerciseRefs), `queries/exercises.ts`, `queries/profile.ts`, `queries/auth.ts`

### Telefonda Auth turu testi sonucu (Adim 1 — TAMAMLANDI ✅)
- Welcome 3 buton: ✅ Register + Login + Misafir gorunuyor
- Login: ✅ Calendar'a basariyla dusuyor
- Logout: ✅ MoreSheet'te buton gorunuyor, onay dialog, Welcome'a donus
- Misafir -> Register migration: ATLANDI, sonraki teste birakildi

### Bekleyen (Adim 2 — Calendar fonksiyonel test, BU SEANS)

**Test edilecekler:**
1. **Month view**
   - 7x6 grid render
   - Bugun gold border
   - Hucrelere tiklayinca Day Detail'e gecis
   - Ay navigasyonu (prev/next ok)
   - Today pill -> bu aya don
   - Kategori chip rendering (eger antrenman varsa)
2. **Week view**
   - view-switch icon -> Month <-> Week toggle
   - 7 hafta gosterimi (anchor +/- 3)
   - Bugun row gold border
   - Hafta header (W## + tarih araligi)
   - Tap -> Day Detail
3. **Top app bar**
   - Avatar (initials)
   - Title (ay adi + yil mono)
   - View-switch icon toggle
   - Today pill (gold-muted + UPPERCASE)
4. **Empty state**
   - Hicbir antrenman yokken hint card gorunuyor mu
   - "Bugunu Ac" + "Program Sec" CTA'lari calisiyor mu
5. **Preset program modal**
   - "Program Sec" -> modal acilir mi
   - Bir preset secince program olusturuluyor mu
   - DuplicateProgramError dogru toast veriyor mu
6. **Web user welcome modal** (auth user'da web verisi varsa)
   - Modal trigger
   - "Mobil'e Basla" / "Web'e Git" / dismiss

### Adim 2 sonrasi (sonraki seans)

- Adim 3: Day Detail (C1-C4) fonksiyonel test
- Adim 4: D1/D2 Workout/Library fonksiyonel test
- Adim 5: D3 Program Edit fonksiyonel test
- Adim 6: More menu (E1) fonksiyonel test
- Sonra: Debug temizlik + ADIM 9 hazirligi (reset password sistemi + beta build)

---

## 2. Bu seansin gorev tanimi

### 2.0 SIFIR ONCELIK (yapilmis durumda olmali)
- ✅ tsc 0 hata
- ✅ B1 Calendar prototipe yaklastirildi
- ✅ Auth turu (Adim 1) 5 bug duzeltildi
- ✅ Truncated dosyalar onarildi

### 2.1 Yapilacaklar

**SEANS BASINDA KULLANICIYA SOR:** "Adim 2 (Calendar fonksiyonel test) ile devam edelim mi?"

Kullanici hazir oldugunda:
1. **Kullanicidan ekran ekran test gozlemi al** — yukaridaki 6 alt madde
2. **Her bug icin format:**
   - Ekran: (ornegin "Calendar Month")
   - Adim: (ornegin "Bir gune tikladim")
   - Beklenen: (ornegin "Day Detail acilir")
   - Olan: (ornegin "Hicbir sey olmadi")
   - Screenshot: varsa
3. **Bug bulununca:**
   - Onceliklendir (P0 crash / P1 broken flow / P2 cosmetic)
   - Kod incelemesi -> root cause
   - Fix uygula
   - Reload + tekrar dogrula
4. **Bittiginde:**
   - `devam-promptu-adim-8-bug-fix-turu-3.md` uret (Adim 3: Day Detail icin)

### 2.2 Yapmayacaklarin
- Prototip sadakat (B1 zaten yapildi, Day/D1/D3 sonraki turlarda)
- Beta dagitim (ADIM 9 kapsami)
- Reset password sistemi (ADIM 9 kapsami)
- Yeni feature (MVP-sonrasi)

---

## 3. OZEL OPERASYONEL NOTLAR — GUNCEL (cok onemli!)

**Bunlari okumadan kod yazma:**

- **⚠️ Edit/Write tool BUYUK dosyalari ISRARLA KESIYOR (truncation).** ADIM 8'de **5 dosya** kesildi (i18n + 3 calendar). Belirti: dosya son satiri yarim kesik, bash'te `wc -l` Read tool'unun gosterdiginden cok daha az. **Kural:**
  - Buyuk dosyaya Edit/Write sonrasi DAIMA bash ile dogrula: `wc -l <file>` + `tail -10 <file>`
  - Eger kesikse: `python3` heredoc ile **tam dosyayi yeniden yaz** (`cat > file <<'TSXEOF' ... TSXEOF`)
  - Heredoc icinde **`'TSXEOF'`** (tek tirnak) kullan ki shell interpolation olmasin
  - Kucuk dosyalar (<60 satir) Edit/Write guvenli
- **NUL byte tuzagi:** Edit bazen dosya sonuna `\x00` byte'lar yaziyor → `error TS1127: Invalid character`. Cozum: `python3 -c "data=open(f,'rb').read(); open(f,'wb').write(data.replace(b'\\x00',b''))"`
- **Read tool cache vs disk asenkron:** Read tool dosyanin "tam halini" gosterirken, gercekte disk uzerinde kesik olabilir. **Bash ile `wc -l` ve `tail` ile diskte ne oldugunu dogrula.**
- **Auth gating:**
  - `app/index.tsx` -> mode'a gore `(auth)/welcome` veya `(app)/calendar` redirect
  - `app/(auth)/_layout.tsx` -> sadece `mode === 'auth'`'ta `(app)/calendar` redirect (guest mode auth ekranlarina erisebilir, ADIM 8 fix)
  - `app/(auth)/_layout.tsx` -> `initialRouteName="welcome"` (default route sabitlendi)
- **AppBottomSheet ScrollView** — uzun icerikler artik scroll edilebilir. Yeni sheet yazarken bu zaten var, manuel ScrollView eklemeyin.
- **MoreSheet'te debug row** var: `mode=auth · email=...` — Bug fix turu bitince temizlenecek. **Simdilik dokunma.**
- **`app/index.tsx`** debug `console.log('[RootIndex] mode=', mode)` var — bug fix turu bitince temizlenecek.
- **Reset password redirectTo:** `app.json extra.resetPasswordRedirect` Supabase Dashboard'da whitelist edilmemis (henuz kullanilmiyor cunku web reset broken). ADIM 9'a bekliyor.
- **VM/Linux sandbox kararsiz olabilir.** Dustugunde Read/Write/Edit/Grep/Glob Windows path'inde calismaya devam eder; bash (tsc/rm) durur.
- **Expo Router route yapisi:** Tab'lar `(tabs)` grubunda; tam-ekran route (D3) `(tabs)` DISINDA `(app)` Stack altinda → bottom nav otomatik gizli.
- **i18n interpolation `{key}` formatinda** (eski `%d` degil). Array erisimi `useTranslations().days[i]`. `noUncheckedIndexedAccess` → `dict.days[i] ?? ''`.
- **Supabase MCP** dogrudan kullanilabilir (debug + auto-gen icin): `list_tables`, `execute_sql`, `generate_typescript_types`. Tahmin etme, sorgula.
- **`Stack justify` prop:** `"space-between"`, `"between"` degil.
- **`?? []` / `?? null` implicit-any tuzagi:** Acik tip anotasyonu kullan veya callback param'i anote et.
- **`tsc` icin gecici tsconfig.check.json** kokte:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noUncheckedIndexedAccess": true,
      "noImplicitOverride": true,
      "module": "esnext",
      "moduleResolution": "bundler",
      "jsx": "react-native",
      "target": "ES2022",
      "lib": ["ES2022", "DOM"],
      "types": ["react", "react-native", "node"],
      "skipLibCheck": true,
      "esModuleInterop": true,
      "allowSyntheticDefaultImports": true,
      "resolveJsonModule": true,
      "baseUrl": ".",
      "paths": {
        "@components/*": ["components/*"],
        "@queries/*": ["queries/*"],
        "@lib/*": ["lib/*"],
        "@theme/*": ["theme/*"],
        "@app-types/*": ["types/*"],
        "@data/*": ["data/*"],
        "@hooks/*": ["hooks/*"],
        "@stores/*": ["stores/*"]
      }
    },
    "include": ["app/**/*", "components/**/*", "lib/**/*", "queries/**/*", "theme/**/*", "types/**/*", "data/**/*", "hooks/**/*", "stores/**/*"],
    "exclude": ["node_modules", ".expo", "**/*.test.ts", "**/*.test.tsx"]
  }
  ```
  Sonra `npx tsc -p tsconfig.check.json --noEmit`, bitince sil.

---

## 4. Mutlak kurallar — bu adimda hatirla

- **TypeScript strict** (+ noUncheckedIndexedAccess + noImplicitOverride)
- **i18n cift dilli zorunlu** — yeni anahtar: once `i18n-types.ts` (tip), sonra `i18n-tr.ts` + `i18n-en.ts`. Array icin `useTranslations()`, `t()` degil.
- **Hardcode string yasak** — `t()` / `useT()` / `useTranslations()`
- **Theme token'lari** uzerinden styling (`useTheme().colors`)
- **Dark mode default** (§8.5 zaten dark — useThemeStore default 'system', resolveSystemScheme light olmayan her seyi dark'a ceviriyor)
- **Misafir mod icin Supabase cagrisi YOK** — data-bridge mode-aware
- **Lucide icon** — named import
- **Path alias** veya relative — ikisi de OK
- **`supabase: any` cast YOK** (ADIM 7'de kaldirildi) — yeni cast EKLEME
- **Buyuk dosyaya Edit/Write sonrasi DAIMA dogrula** (wc -l + tail)

---

## 5. Calisma sekli

- **Her test sonunda dur** — kullanici test gozlemi versin, bug varsa fix sonrasi tekrar dogrula
- Test reglemanli: ekran-ekran, kullanici verisi/bug raporu temelli
- **Test edilecekler ortak format:** ✅ veya ❌ + ekran adi + adim
- Buyuk dosya yazimi sonrasi DAIMA brace-balance + tail kontrol
- Bug bulununca priorite: P0 (crash/data loss) -> P1 (broken flow) -> P2 (cosmetic)

---

## 6. Adim 2 sonu beklentisi

Bittiginde ozet:
- Test edilen 6 alt madde durumlari (✅ / ❌ + aciklama)
- Bulunan bug'lar listesi (priorite ile)
- Fix edilenler + kalan blocker'lar
- tsc dogrulamasi (yeni kod sonrasi)
- `devam-promptu-adim-8-bug-fix-turu-3.md` uret (Adim 3: Day Detail testi)

**ADIM 8 BUG FIX TURU sonu hedef:** 6 ekranin tumu fonksiyonel test edilmis, P0/P1 bug'lar duzeltilmis, debug satirlari temizlenmis, ADIM 9'a temiz baslangic.
