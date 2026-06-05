# LogWise Mobile — Devam Promptu (ADIM 8 BUG FIX TURU — ADIM 4: Workout/Library Test)

> Bu dosyayi yeni bir Cowork/AI seansinda **oldugu gibi mesaj olarak yapistir**.
> Sozlesme: AI bu dosyayi gorur -> mevcut state'i anlar -> Adim 4 (Workout/Library fonksiyonel test) baslar.
> Tur bitince Claude bu dosyayi guncellesin (`devam-promptu-adim-8-bug-fix-turu-5.md`).

---

Merhaba. LogWise mobil uygulamasinin implementation surecindeyiz. **ADIM 1 (Expo scaffold), ADIM 2 (Supabase), ADIM 3 (Theme/tokens + i18n), ADIM 4 (Auth A1-A5), ADIM 5 (Calendar B1 + Day C1 + preset), ADIM 6 (Bottom tab + Library D1-D3 + Day full C2-C4 + E1 More + F1/F2), ADIM 7 (Auto-gen types + Sentry + EAS + PRODUCTION-CHECKLIST), ADIM 8 ana paketi (B1 prototip sadakat + Auth bug fix turu), ADIM 8 BUG FIX TURU — Adim 1 (Auth, 5 bug), Adim 2 (Calendar, 7 bug + 2 UI polish), Adim 3 (Day Detail, 8 bug fix)** tamamlandi. Simdi **ADIM 8 BUG FIX TURU — ADIM 4: D1/D2 Workout/Library fonksiyonel test** sirasi.

**Onceki seansta (ADIM 8 BUG FIX TURU — Adim 3 Day Detail) yapilanlar:**

### A) Mimari degisiklik: Preset/Library birlestirildi

Kullanici karari (2026-06-03): Preset hareketler artik ayri tab'da degil — hepsi "Hareketler" (TR) / "Exercises" (EN) tek tab'inda. Tum 54 preset her kullanicida otomatik gorukuyor.

- **AddExerciseSheet:** `type Tab = 'library' | 'presets' | 'new'` → `'library' | 'new'`. "Hazir Hareketler" tab'i kaldirildi. `usedPresetSlugs` prop kaldirildi. `libraryRows` artik tum 54 preseti + custom hareketleri alfabetik listeler. Preset badge: `(Preset)`, custom badge: `(Ozel)`.
- **workout/index.tsx D1:** `d1Rows` artik tum preseti gosteriyor (eskiden sadece tarihcede kullanilmis preset). `useUsedExerciseRefs` kaldirildi.
- **`[date].tsx`:** `useUsedExerciseRefs` + `usedPresetSlugs` mantigi kaldirildi, `PRESET_EXERCISES` import kaldirildi.
- **`program/[id]/edit.tsx`:** `initialTab="presets"` → `"library"`.

### B) i18n degisiklikleri

- `dayExtra.tabLibrary`: "Kutuphanem" → "Hareketler" (TR) / "My Library" → "Exercises" (EN)
- `dayExtra.tabPresets`: kaldirildi (TR + EN + types)
- `dayExtra.tabNew`: "Yeni Ozel" → "Yeni Hareket" (TR) / "New Custom" → "New Exercise" (EN)
- `library.presetBadge`: `'(Preset)'` yeni eklendi (TR + EN + types)

### C) AppBottomSheet iyilestirmeleri

- **`footer` prop eklendi:** ScrollView disinda, her zaman gorunen sticky footer alani. Multi-select "Ekle" butonu artik buraya render ediliyor — liste ne kadar uzun olursa olsun her zaman altta gorunur.
- **`flexShrink: 1`:** AppBottomSheet ici ScrollView'a eklendi. Kisa icerik → sheet content yuksekligi kadar. Uzun icerik → maxHeight'a dayanir, ScrollView scroll eder. (`flex: 1` yerine `flexShrink: 1` — cunku Animated.View'da explicit height yok, `flex: 1` sifira cekiyordu.)

### D) ExPreviewModal duzeltmesi

- Inner `ScrollView` kaldirildi → `View` yapildi (nested vertical ScrollView catismasi cozuldu).
- `minHeight: 220` eklendi — kisa notlu custom hareketlerde modal daha genis aciliyor.

### E) Library catStrip duzeltmesi

- `workout/index.tsx` D1 egzersiz listesi ScrollView'una `style={{ flex: 1 }}` eklendi. 54 preset + custom hareketler tam yukseklikte listeleniyor; category strip artik sikilmiyor.

### F) Day Detail test sonucu — TAMAMLANDI ✅

- C1 (bos gun): ✅
- C2 (exercise card + set rows + RIR + set type): ✅
- C3 (AddExerciseSheet — arama, kategori filtresi, multi-select, yeni hareket): ✅
- C4 (Rest day banner): ✅
- Navigation (geri + prev/next oklar): ✅
- Hint card: ATLANDI (gorunmuyor — DB state sorunu, sonra)
- Preset Program Modal: ATLANDI (hint card gorunmediginden)

### G) Atlanan testler (sonraki turlara birakildi)

- **Hint card + Preset Program Modal:** `seen_hint_card=false` DB'de ama uygulama gostermedi. Supabase'de tekrar kontrol gerekebilir. Oncelik dusuk; ileride.
- **Web user welcome modal:** `seen_web_welcome=true`. Test icin DB'de false'a cekip test edilebilir.
- **Event chip rendering (Calendar):** Workout girildikten sonra test edilebilir.
- **Week view detaylari (rest day chip, hafta stats):** Workout + program verisi sonrasi.

---

## 0. Once su baglam dosyalarini sirayla oku — HIC ISTISNA YOK

1. `AGENTS.md` — proje sozlesmesi
2. `docs/mobile-design-system/03-mvp-decisions.md` (rev 15) — §3.1 navigation yapisi, §3.6 Day Detail spec
3. `docs/mobile-design-system/05-screen-specs.md` — D1-D3 Library + Program Edit tam spec
4. **BU DOSYANIN §1 ve §3'unu mutlaka oku** — onceki seans operasyonel notlari + mevcut state

---

## 1. Su anki proje state'i — neyi varsayabilirsin, neyi varsayma

### Hazir olan (ADIM 1-8 BUG FIX Adim 3 sonu)

**Tip katmani:**
- `types/database.generated.ts` (Supabase auto-gen) + `types/database.ts` kopru
- `data/i18n-types.ts` (~599 satir) — `tabPresets` kaldirildi, `presetBadge` eklendi
- `data/i18n-tr.ts` + `data/i18n-en.ts` (~641 satir) — guncel

**Theme:**
- `theme/tokens.ts`: ColorPalette + categoryMuted + setMuted, shadows.cardLarge + shadows.cta, fonts.{display*,mono*}
- `theme/index.tsx`: useTheme() -> aktif scheme (dark default)

**Auth (ADIM 8 BUG FIX Adim 1):**
- `app/(auth)/_layout.tsx`, `welcome.tsx`, `login.tsx`, `register.tsx`, `forgot-password.tsx`, `verify.tsx`
- `app/index.tsx`, `stores/auth-store.ts`, `hooks/useAuth.ts`, `queries/auth.ts`

**Calendar (ADIM 8 BUG FIX Adim 2):**
- `app/(app)/(tabs)/calendar/_layout.tsx` (Stack layout)
- `app/(app)/(tabs)/calendar/index.tsx` (~407 satir)
- `components/calendar/CalendarMonth.tsx`, `CalendarWeek.tsx`, `PresetProgramModal.tsx`

**Day Detail (ADIM 8 BUG FIX Adim 3):**
- `app/(app)/(tabs)/calendar/day/[date].tsx` — `useUsedExerciseRefs` + `usedPresetSlugs` kaldirildi, `PRESET_EXERCISES` import yok
- `components/day/ExerciseCard.tsx`, `SetRow.tsx`, `RirSelect.tsx`, `SetTypeSelect.tsx`
- `components/day/RestDayBanner.tsx`, `AddExerciseSheet.tsx` (tek tab: Hareketler + Yeni Hareket)
- `components/shared/ExPreviewModal.tsx` — inner ScrollView kaldirildi, `minHeight: 220`

**Workout/Library (degisiklikler Adim 3'te):**
- `app/(app)/(tabs)/workout/_layout.tsx` (Stack layout)
- `app/(app)/(tabs)/workout/index.tsx` — D1 artik tum preseti gosteriyor, badge'ler var, `flex: 1` exercise list ScrollView'da
- `app/(app)/program/[id]/edit.tsx` (D3) — `initialTab="library"`

**Components:**
- `components/ui/AppBottomSheet.tsx` — `footer` prop + `flexShrink: 1` ScrollView
- `components/shared/MoreSheet.tsx` (debug row + Logout fix — debug row hala var, temizlenecek)
- `components/workout/ActiveProgramCard.tsx`, `ProgramActionSheet.tsx`, `NewProgramSheet.tsx`, `ConfirmModal.tsx`, `CustomExerciseEditSheet.tsx`

**Data layer:** `lib/data-bridge.ts`, `lib/migration.ts`, `lib/exercise-resolve.ts`, `lib/program.ts`, `lib/calc.ts`, `lib/sentry.ts`
**Queries:** `queries/programs.ts`, `queries/workouts.ts`, `queries/exercises.ts`, `queries/profile.ts`, `queries/auth.ts`

### Mevcut DB durumu (auth user: colak.ali1928@gmail.com)
- `app_profiles.preferences = {"seen_hint_card": false, "seen_web_welcome": true}`
- `active_program_id: null` (PPL deaktive edildi)
- `app_workouts`: birkac test workout var (Adim 3 testinde eklendi)
- Project ID: `czbxujioufhmvoajqwzp`

### Adim 3 test sonucu — TAMAMLANDI ✅
- C1 bos gun, C2 hareket+set, C3 AddExerciseSheet, C4 rest day, Navigation: hepsi ✅
- Hint card + Preset Modal: atlandi

### Bekleyen (Adim 4 — Workout/Library testi, BU SEANS)

**Test edilecekler:**

1. **D1 — Exercises tab**
   - Hareket listesi yukleniyor mu? (54 preset + custom hareketler)
   - Arama calisiyor mu?
   - Kategori filtresi calisiyor mu?
   - Row'a tikla → ExPreviewModal aciliyor mu?
   - Row uzun bas → menu (preset: sadece preview; custom: duzenle/sil)
   - Custom hareket duzenle (CustomExerciseEditSheet) calisiyor mu?
   - Custom hareket sil calisiyor mu?

2. **D2 — Programs tab**
   - Program listesi yukleniyor mu? (aktif program yok, liste bos olmali)
   - "Yeni Program" butonu → NewProgramSheet aciliyor mu?
   - Program olustur → liste guncelleniyor mu?
   - Program kart aksiyon (aktivasyon, duzenleme, silme) calisiyor mu?
   - Aktif program card gorunuyor mu?

3. **D3 — Program Edit**
   - Program karta tikla → D3 edit ekrani aciliyor mu?
   - Gun listesi gorunuyor mu?
   - Gun'e hareket ekle → AddExerciseSheet aciliyor mu? (simdi "Hareketler" tek tab)
   - Hareket listesi guncelleniyor mu?
   - Program adini duzenle calisiyor mu?
   - Geri butonu → Library'ye donus

4. **Entegrasyon: Program aktif → Calendar**
   - D2'de program aktif et → Calendar'da event chip'ler gorunuyor mu? (Test 9)
   - Calendar gun'une git → Day Detail'de program gunu gorukuyor mu? (lazy kartlar)

### Adim 4 sonrasi (sonraki seans)

- Adim 5: D3 Program Edit detayli + More menu (E1) fonksiyonel test
- Sonra: Debug temizlik (MoreSheet debug row + `app/index.tsx` console.log)
- ADIM 9: Reset password sistemi + beta build

---

## 2. Bu seansin gorev tanimi

### 2.0 SIFIR ONCELIK (yapilmis durumda olmali)
- ✅ tsc 0 hata
- ✅ Tek "Hareketler" tab (preset merge)
- ✅ AppBottomSheet footer + flexShrink
- ✅ ExPreviewModal scroll + minHeight

### 2.1 Yapilacaklar

**SEANS BASINDA KULLANICIYA SOR:** "Adim 4 (Workout/Library fonksiyonel test) ile devam edelim mi?"

Kullanici hazir oldugunda:
1. Workout/Library tab'ina git (ikinci sekme)
2. **D1 Exercises tab** ekran ekran test (liste, arama, filtre, preview, menu, custom CRUD)
3. **D2 Programs tab** test (bos liste, program olustur, aktive et, duzenle, sil)
4. **D3 Program Edit** test (gun listesi, hareket ekle, isim duzenle, geri)
5. **Entegrasyon**: Program aktif → Calendar event chip + Day Detail lazy kart
6. Her bug icin: P0/P1/P2 once → kod incelemesi → fix → dogrula
7. Bittiginde: `devam-promptu-adim-8-bug-fix-turu-5.md` uret

### 2.2 Yapmayacaklarin
- Hint card / Preset Modal (ileride)
- Web welcome modal (ileride)
- Beta dagitim (ADIM 9 kapsami)
- Reset password (ADIM 9 kapsami)
- Debug temizlik (bug fix turu bitmeden yapma — MoreSheet debug row + index.tsx console.log hala kasitli var)

---

## 3. OZEL OPERASYONEL NOTLAR — GUNCEL (cok onemli!)

**Bunlari okumadan kod yazma:**

- **⚠️ Edit/Write tool BUYUK dosyalari ISRARLA KESIYOR (truncation).** Belirti: dosya son satiri yarim kesik, bash'te `wc -l` Read tool'unun gosterdiginden cok daha az. **Kural:**
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
  - `calendar/_layout.tsx` ve `workout/_layout.tsx` ic Stack layout
  - Custom `BottomTabBar` 5 sekme: calendar / workout / dashboard / social / more

- **AddExerciseSheet tab yapisi (DEGISTI — Adim 3):**
  - Eski: `library | presets | new` (3 tab)
  - Yeni: `library | new` (2 tab) — "Hareketler" + "Yeni Hareket"
  - `usedPresetSlugs` prop KALDIRILDI — artik gerekmiyor
  - D1, AddExerciseSheet, [date].tsx, program edit hepsinde guncel

- **AppBottomSheet:**
  - `footer` prop: ScrollView disinda sticky footer (multi-select butonu burada)
  - `flexShrink: 1` on ScrollView: kisa icerik auto-height, uzun icerik scrollable
  - `flex: 1` KULLANMA — Animated.View'da explicit height yok, sifira ceker

- **D1 hareket listesi:**
  - `workout/index.tsx` D1 → tum 54 preset + custom hareketler alfabetik
  - Preset badge: `(Preset)`, custom badge: `(Ozel)`
  - `style={{ flex: 1 }}` exercise list ScrollView'da (category strip sikismasin diye)

- **ExPreviewModal:**
  - Inner ScrollView kaldirildi (nested ScrollView sorunu)
  - `minHeight: 220` eklendi (kisa notlu custom hareketler icin)

- **Calendar app bar:** Avatar | < (sadece month) | Title | > (sadece month) | view-switch | BUGUN pill.

- **Auth gating:**
  - `app/index.tsx` → mode'a gore redirect
  - `app/(auth)/_layout.tsx` → sadece `mode === 'auth'`'ta redirect

- **MoreSheet'te debug row** var: `mode=auth · email=...` — Bug fix turu bitince temizlenecek. **Simdilik dokunma.**
- **`app/index.tsx`** debug `console.log('[RootIndex] mode=', mode)` var — bug fix turu bitince temizlenecek.

- **Reset password redirectTo:** `app.json extra.resetPasswordRedirect` whitelist edilmemis. ADIM 9'a bekliyor.

- **i18n interpolation `{key}` formatinda** (eski `%d` degil). Array erisimi `useTranslations().days[i]`. `noUncheckedIndexedAccess` → `dict.days[i] ?? ''`.

- **Supabase MCP** dogrudan kullanilabilir: `list_tables`, `execute_sql`, `generate_typescript_types`. Project ID: `czbxujioufhmvoajqwzp`. Auth user `colak.ali1928@gmail.com`. **DB tablo isimleri: `app_profiles`, `app_workouts`** (not `profiles`, `workouts`).

- **`tsc` icin gecici tsconfig.check.json** kokte (zaten var):
  ```bash
  npx tsc -p tsconfig.check.json --noEmit
  ```

---

## 4. Mutlak kurallar — bu adimda hatirla

- **TypeScript strict** (+ noUncheckedIndexedAccess + noImplicitOverride)
- **i18n cift dilli zorunlu** — yeni anahtar: once `i18n-types.ts` (tip), sonra `i18n-tr.ts` + `i18n-en.ts`
- **Hardcode string yasak** — `t()` / `useT()` / `useTranslations()`
- **Theme token'lari** uzerinden styling (`useTheme().colors`)
- **Dark mode default** (§8.5)
- **Misafir mod icin Supabase cagrisi YOK** — data-bridge mode-aware
- **Lucide icon** — named import
- **`supabase: any` cast YOK**
- **Buyuk dosyaya Edit/Write sonrasi DAIMA dogrula** (wc -l + tail)
- **AppBottomSheet'e `flex: 1` degil `flexShrink: 1`** (Animated.View explicit height yok)

---

## 5. Calisma sekli

- **Her test sonunda dur** — kullanici test gozlemi versin, bug varsa fix sonrasi tekrar dogrula
- Test reglemanli: ekran-ekran, kullanici verisi/bug raporu temelli
- **Test edilecekler ortak format:** ✅ veya ❌ + ekran adi + adim
- Buyuk dosya yazimi sonrasi DAIMA brace-balance + tail kontrol
- Bug bulununca priorite: P0 (crash/data loss) -> P1 (broken flow) -> P2 (cosmetic)

---

## 6. Adim 4 sonu beklentisi

Bittiginde ozet:
- Test edilen D1/D2/D3 + entegrasyon durumlari (✅ / ❌ + aciklama)
- Bulunan bug'lar listesi (priorite ile)
- Fix edilenler + kalan blocker'lar
- tsc dogrulamasi (yeni kod sonrasi)
- `devam-promptu-adim-8-bug-fix-turu-5.md` uret (Adim 5: More menu + debug temizlik)

**ADIM 8 BUG FIX TURU sonu hedef:** 6 ekranin tumu fonksiyonel test edilmis, P0/P1 bug'lar duzeltilmis, debug satirlari temizlenmis, ADIM 9'a temiz baslangic.
