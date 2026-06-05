# LogWise Mobile — Devam Promptu (ADIM 8 BUG FIX TURU — ADIM 5: More menu (E1) + Debug temizlik)

> Bu dosyayi yeni bir Cowork/AI seansinda **oldugu gibi mesaj olarak yapistir**.
> Sozlesme: AI bu dosyayi gorur -> mevcut state'i anlar -> Adim 5 (E1 More menu fonksiyonel test + debug temizlik) baslar.
> Tur bitince Claude bu dosyayi guncellesin (`devam-promptu-adim-8-bug-fix-turu-6.md`).

---

Merhaba. LogWise mobil uygulamasinin implementation surecindeyiz. **ADIM 1-7, ADIM 8 ana paketi, ADIM 8 BUG FIX TURU — Adim 1 (Auth), Adim 2 (Calendar), Adim 3 (Day Detail), Adim 4 (Workout/Library D1/D2/D3 + Entegrasyon)** tamamlandi. Simdi **ADIM 8 BUG FIX TURU — ADIM 5: E1 More menu fonksiyonel test + debug temizlik** sirasi.

**Onceki seansta (ADIM 8 BUG FIX TURU — Adim 4 Workout/Library + Entegrasyon) yapilanlar:**

### A) D1 Exercises tab — test ✅ + 1 bug fix

- **Test sonucu:** liste, arama, kategori filtresi, bos sonuc, preview modal, preset/custom long-press menu, custom duzenle/sil — hepsi ✅.
- **P2 fix — Kategori etiketleri cevrilmemis:** Kategori chip'leri "all" disinda ham Ingilizce key gosteriyordu (`chest`, `back`, ...). i18n'de zaten var olan `cats` dizisi (9 eleman, CategoryKey sirasiyla birebir) kullanildi. Yeni anahtar EKLENMEDI.
  - `lib/exercise-resolve.ts`: `CATEGORY_KEYS` sirali dizi + `catLabel(key, cats)` helper eklendi.
  - `workout/index.tsx` (D1 strip), `components/day/AddExerciseSheet.tsx` (filtre strip + "yeni hareket" formundaki kategori secici — bu sonuncusu hardcoded TR gosteriyordu, artik lokalize), `components/workout/CustomExerciseEditSheet.tsx` (duzenleme formu).
  - **ONEMLI:** Kaydedilen kategori degeri Turkce kaliyor (preset formatiyla tutarli — orn. `'Göğüs'`), sadece GOSTERIM lokalize. `catLabel(turkishCatToKey(c), dict.cats)` deseni.

### B) D2 Programs tab — test ✅ + modal yukseklik fix

- **Test sonucu:** bos liste, "+ New" → NewProgramSheet → olustur → D3 push, pasif program tap → ActionSheet, aktive et, tek-aktif kurali + onay modali, aktif kart ⋮ (pasiflestir/sil), duzenle, sil, aktif kart CTA'lari — hepsi ✅.
- **UI fix — Modallar fazla alcak kaliyordu** (icerik icin scroll gerekiyordu). ExPreviewModal'daki minHeight yaklasimini merkezilestirdim:
  - `components/ui/AppBottomSheet.tsx`: yeni `minHeightRatio?: number` prop. Verilince `minHeight = screenH × ratio` (maxHeightRatio ile birlikte calisir).
  - `NewProgramSheet`, `ProgramActionSheet` (max'i 0.5→0.6 yapildi), `CustomExerciseEditSheet` → `minHeightRatio={0.5}` (en az yarim ekran).
  - **ConfirmModal'a DOKUNULMADI** — o bottom sheet degil, ekran ortasi dialog (scroll/alcak kalma sorunu yasamaz).

### C) D3 Program Edit — test ✅ + 3 bug fix

- **Test sonucu:** ekran acilis, ad/aciklama duzenle (autosave on blur), cycle ayarlari (weekly/deload/none + deload_every), gun panel ac/kapa, hareket ekle (tekli + coklu), sirala, baska gune tasi, cikar, off-day, aktif et/pasiflestir, sil, geri — hepsi ✅.
- **P1 fix — Coklu secimle hareket ekleyince hareketler sessizce dusuyor:** `app_program_days` PK = `(program_id, day_index, position)`. Eski `onAddRefs` her ref icin PARALEL insert atiyordu; hepsi ayni position'i hesaplayip PK ihlaline dusuyordu (auth: kalan insert'ler duser; guest: AsyncStorage lost-write). DB ile dogrulandi.
  - `lib/data-bridge.ts`: yeni `addProgramDayExercises` (batch) — position'lari tek okumadan ardisik hesaplar; auth tek insert, guest sirali await.
  - `queries/programs.ts`: `useAddProgramDayExercises` hook. (Eski `useAddProgramDayExercise` singular artik kullanilmiyor ama zararsiz export olarak duruyor.)
  - `app/(app)/program/[id]/edit.tsx`: `onAddRefs` batch hook + hata toast'i.
- **UX fix — ⋮ menusu (Android Alert limiti):** `onMoveExercise` native `Alert.alert` ile 6 gun + iptal = 7 buton veriyordu; **Android Alert max 3 buton** gosterir → sadece 3 gun + iptal yok. Ayrica ⋮ dogrudan tasimaya gidiyordu.
  - Yeni `components/workout/DayExerciseActionSheet.tsx` (bottom sheet, 2 asamali): menu (Onizle / Baska gune tasi / Cikar) → move (gecerli gun haric TUM gunler + "← Iptal", backdrop dismiss).
  - `edit.tsx`: ⋮ artik `setRowMenu(...)` aciyor; `ExPreviewModal` da edit ekranina baglandi (Onizle icin).
  - i18n: `programEdit.removeExercise` (Cikar/Remove) eklendi (TR+EN+types).
- **P1 fix — Bos program kaydedilebiliyordu:** D2'den "yeni program" → `createEmptyProgram` hemen DB satiri atiyor; kullanici D3'ten hareket eklemeden cikarsa bos program kaliyordu.
  - `edit.tsx`: `navigation.addListener('beforeRemove')` guard — ekrandan her cikista (geri/kaydet/hardware back/swipe) gun verisi yuklenmis VE toplam hareket 0 ise program auto-delete + "Bos program kaydedilmedi" toast. Explicit silme ile cakismamasi icin `skipAutoDeleteRef`. Veri yuklenmemisse silmez (mevcut programi yanlislikla silmeyi onler).
  - i18n: `programEdit.discardedEmpty` eklendi (TR+EN+types).
  - **ACIK NOT:** Bu guard, MEVCUT bir programin tum hareketlerini silip cikarinca onu da siler (kural: "hareketi olmayan program kalmaz"). Kullaniciya soruldu, simdilik kabul. Ileride sadece yeni programlara sinirlanmasi istenirse degisebilir.

### D) Entegrasyon (program ↔ Calendar ↔ Day Detail) — test ✅ + KRITIK P1 fix

- **Mimari gercek (spec B1 ile uyumlu):** Takvim chip'leri = YALNIZCA loglanmis `app_workouts`. Program = plan, sadece Day Detail'de lazy kartlar + D2 ActiveProgramCard 7-gun grid. **Programi aktif etmek tek basina takvimde chip OLUSTURMAZ** — chip icin lazy karta set girip loglamak gerekir. Bu tasarim gereği (bug degil).
- **Test sonucu:** bugun/gelecek antrenman gunu → lazy kartlar ✅, off-day → RestDayBanner ✅, gecmis gun → lazy kart yok ✅, lazy karta set gir → persist ✅, set girince takvimde chip ✅ (fix sonrasi).
- **KRITIK P1 fix — Takvimde HIC chip gorunmuyordu:** `fetchWorkoutsByMonth` (auth) ay ust sinirini `'YYYY-MM-32'` ("exclusive upper bound trick") yapiyordu. Ama `workout_date` bir **`date` kolonu** → Postgres `'2026-06-32'`'yi tarihe cast edip `ERROR: date/time field value out of range` veriyor → **ay sorgusu HER ZAMAN patliyordu** → takvim hic veri almiyordu. DB ile dogrulandi.
  - `lib/data-bridge.ts`: ust sinir artik geçersiz `-32` yerine **sonraki ayin 1'i** (Aralik → sonraki yilin Ocak'i). Guest path `startsWith(prefix)` kullaniyor, etkilenmemisti.
  - `app/(app)/(tabs)/calendar/index.tsx`: ayrica `useFocusEffect` ile ekran odaklaninca workout + aktif program refetch (Day Detail/D2'den donunce taze veri — saglamlik agi).

---

## 0. Once su baglam dosyalarini sirayla oku — HIC ISTISNA YOK

1. `AGENTS.md` — proje sozlesmesi
2. `docs/mobile-design-system/03-mvp-decisions.md` (rev 15) — §3.1 navigation, §3.9 More panel kararlari
3. `docs/mobile-design-system/05-screen-specs.md` — E1 More panel tam spec
4. **BU DOSYANIN §1 ve §3'unu mutlaka oku** — onceki seans operasyonel notlari + mevcut state

---

## 1. Su anki proje state'i — neyi varsayabilirsin, neyi varsayma

### Hazir olan (ADIM 1-8 BUG FIX Adim 4 sonu)

**Tip katmani:**
- `types/database.generated.ts` (Supabase auto-gen) + `types/database.ts` kopru
- `data/i18n-types.ts` — `programEdit.removeExercise` + `programEdit.discardedEmpty` eklendi
- `data/i18n-tr.ts` + `data/i18n-en.ts` — guncel

**Auth / Calendar / Day Detail / Workout-Library:** Adim 1-4'te test edildi, P0/P1 fix'lendi. ✅

**Onemli yeni/degisen dosyalar (Adim 4):**
- `lib/exercise-resolve.ts` — `CATEGORY_KEYS` + `catLabel()`
- `lib/data-bridge.ts` — `addProgramDayExercises` (batch) + `fetchWorkoutsByMonth` date-range fix
- `queries/programs.ts` — `useAddProgramDayExercises`
- `components/ui/AppBottomSheet.tsx` — `minHeightRatio` prop
- `components/workout/DayExerciseActionSheet.tsx` — YENI (D3 ⋮ menu)
- `app/(app)/program/[id]/edit.tsx` — batch add + ⋮ sheet + empty-program guard
- `app/(app)/(tabs)/calendar/index.tsx` — `useFocusEffect` refetch
- `components/day/AddExerciseSheet.tsx`, `components/workout/CustomExerciseEditSheet.tsx`, `NewProgramSheet.tsx`, `ProgramActionSheet.tsx`, `components/shared/ExPreviewModal.tsx`

### Mevcut DB durumu (auth user: colak.ali1928@gmail.com, user_id: ba569072-755d-4e68-b470-d78bacbdf0c6)
- Project ID: `czbxujioufhmvoajqwzp`
- `app_workouts`: Haziran 2-5 arasi test workout'lari var (set'li). Takvimde chip olarak gorunuyor.
- En az 1 program var (D2/D3 testlerinden). Aktif program durumu degisken.
- `app_profiles.preferences`: `seen_hint_card`, `seen_web_welcome` (Adim 3 notu — hint card hala gozukmuyor, dusuk oncelik).
- **DB tablo isimleri:** `app_profiles`, `app_workouts`, `app_programs`, `app_program_days`, `app_sets`, `app_exercises`, `app_day_meta`.
- **`app_workouts.workout_date` = `date` tipi** (string degil — range sorgularinda gecerli tarih sinirlari kullan, `-32` gibi numaralar PATLAR).
- **`app_program_days` PK = `(program_id, day_index, position)`** (coklu insert'te position cakismasi PK ihlali).

### Bekleyen (Adim 5 — E1 More menu testi + debug temizlik, BU SEANS)

**1. E1 More menu fonksiyonel test:**
   - Alt nav 5. sekme "More" → MoreSheet aciliyor mu?
   - Calendar app bar avatar + (varsa) hamburger entry'leri ayni MoreSheet'i aciyor mu?
   - Dil degistirme (TR/EN) calisiyor mu? Aninda re-render?
   - Tema toggle (dark/light) calisiyor mu?
   - Auth kullanici: profil/email gorunur mu, Logout calisiyor mu?
   - Misafir kullanici: "Misafir" rozeti + hesap olustur CTA?
   - Disabled placeholder satirlar (§3.9 — gelecekte aktif olacaklar) dogru gorunuyor mu?

**2. Debug temizlik (bug fix turu BITERKEN yapilacak):**
   - `components/shared/MoreSheet.tsx` debug row: `mode=auth · email=...` → KALDIR
   - `app/index.tsx` debug `console.log('[RootIndex] mode=', mode)` → KALDIR
   - Baska kalan `console.log` / debug satiri var mi tarayip temizle

### Adim 5 sonrasi (sonraki seanslar)
- Hint card + Preset Program Modal sorunu (DB state — dusuk oncelik)
- ADIM 9: Reset password sistemi + beta build (EAS)

---

## 2. Bu seansin gorev tanimi

### 2.0 SIFIR ONCELIK (yapilmis durumda olmali)
- ✅ tsc 0 hata (`npx tsc -p tsconfig.check.json --noEmit`)
- ✅ Takvim chip'leri loglanmis workout'larda gorunuyor
- ✅ D1/D2/D3 + entegrasyon test edilmis, P0/P1 fix'lenmis

### 2.1 Yapilacaklar

**SEANS BASINDA KULLANICIYA SOR:** "Adim 5 (E1 More menu fonksiyonel test + debug temizlik) ile devam edelim mi?"

Kullanici hazir oldugunda:
1. **E1 More menu** ekran ekran test (acilis, dil, tema, profil/logout, misafir varyanti, disabled satirlar)
2. Her bug icin: P0/P1/P2 once → kod incelemesi → fix → dogrula
3. **Bug fix turu bittiyse → debug temizlik** (MoreSheet debug row + index.tsx console.log + kalan debug)
4. Bittiginde: `devam-promptu-adim-8-bug-fix-turu-6.md` uret (veya bug fix turu bittiyse ADIM 9 hazirlik notu)

### 2.2 Yapmayacaklarin
- Hint card / Preset Modal derin debug (DB state — ileride)
- Beta dagitim / Reset password (ADIM 9)
- Debug temizligi turu bitmeden yapma (once tum ekranlar test edilsin)

---

## 3. OZEL OPERASYONEL NOTLAR — GUNCEL (cok onemli!)

**Bunlari okumadan kod yazma:**

- **⚠️ Edit/Write tool BUYUK dosyalari KESEBILIR (truncation) + NUL byte tuzagi.** Buyuk dosyaya Edit/Write sonrasi tsc ile dogrula. NUL temizleme:
  ```bash
  python3 -c "f='path'; d=open(f,'rb').read(); open(f,'wb').write(d.replace(b'\\x00',b''))"
  ```
- **`workout_date` = `date` kolonu.** Ay/aralik sorgusu ust sinirini SONRAKI ayin 1'i yap (`-32`/`-31` gibi gecersiz tarih PATLAR: `date/time field value out of range`). Bkz. `fetchWorkoutsByMonth`.
- **`app_program_days` PK = `(program_id, day_index, position)`.** Coklu hareket eklemede position'lari ardisik hesapla (batch `addProgramDayExercises`); paralel tek-tek insert PK ihlaline duser.
- **Takvim chip kaynagi = SADECE `app_workouts`** (loglanmis). Program plan = Day Detail lazy kart + D2 grid. Programi aktif etmek tek basina chip uretmez (tasarim gereği).
- **Kategori gosterimi:** `catLabel(key, dict.cats)`. CategoryKey → i18n `cats` dizisi (sira birebir). Kaydedilen deger Turkce (`'Göğüs'`), gosterim lokalize. Custom kategori secicilerde `catLabel(turkishCatToKey(c), dict.cats)`.
- **AppBottomSheet:** `minHeightRatio` (en az ekran orani) + `maxHeightRatio` + `footer` prop + ScrollView'da `flexShrink: 1` (asla `flex: 1` — Animated.View'da explicit height yok).
- **Native Alert max 3 buton (Android)!** 3+ secenekli menu/liste icin native Alert KULLANMA — bottom sheet yap (orn. `DayExerciseActionSheet`, `ProgramActionSheet`). Iki-secenekli onay icin `ConfirmModal` (merkez dialog) veya kisa Alert OK.
- **D3 empty-program guard:** `navigation.addListener('beforeRemove')` ile ekrandan cikista hareket=0 ise program auto-delete. Yeni full-ekran route eklerken benzer "yarim kayit" senaryolarini dusun.
- **Calendar fresh data:** `useFocusEffect` ile ekran odaklaninca refetch (`refetchOnWindowFocus: false` oldugu icin). Baska "ekrana donunce tazele" gereken ekranlarda ayni desen.
- **i18n:** yeni anahtar → once `i18n-types.ts`, sonra `i18n-tr.ts` + `i18n-en.ts`. Array alanlar (`days`, `daysFull`, `months`, `cats`) `useTranslations()` ile (t() string doner). Interpolation `{key}` formatinda.
- **Tab/route yapisi:** `(tabs)/_layout.tsx` `initialRouteName="calendar"`; `calendar/` ve `workout/` ic Stack; `program/[id]/edit` (tabs) DISINDA (app) Stack altinda (bottom nav gizli). Custom `BottomTabBar` 5 sekme: calendar / workout / dashboard / social / more.
- **AddExerciseSheet:** tek "Hareketler" tab + "Yeni Hareket" (2 tab). `onAddRefs` cagirir. `initialTab="library"`.
- **MoreSheet'te debug row** + **`app/index.tsx` console.log** HALA VAR — Adim 5'te bug fix turu biterken temizlenecek. Simdilik dokunma (test edilmemis ekran kalmadiysa temizle).
- **Supabase MCP** dogrudan kullanilabilir: `execute_sql`, `list_tables`, `generate_typescript_types`. Project ID: `czbxujioufhmvoajqwzp`. **Bug tani icin DB'yi sorgula** (Adim 4'te chip bug'i DB sorgusuyla bisect edildi — cok faydali).
- **tsc:** `npx tsc -p tsconfig.check.json --noEmit` (kokte tsconfig.check.json var).

---

## 4. Mutlak kurallar — bu adimda hatirla

- **TypeScript strict** (+ noUncheckedIndexedAccess + noImplicitOverride)
- **i18n cift dilli zorunlu** — yeni anahtar: once types, sonra tr + en
- **Hardcode string yasak** — `t()` / `useT()` / `useTranslations()`
- **Theme token'lari** uzerinden styling (`useTheme().colors`)
- **Dark mode default**
- **Misafir mod icin Supabase cagrisi YOK** — data-bridge mode-aware
- **Lucide icon** — named import
- **`supabase: any` cast YOK**
- **Buyuk dosyaya Edit/Write sonrasi tsc ile dogrula**
- **Native Alert 3+ buton YOK (Android) — bottom sheet kullan**
- **`date` kolonu aralik sorgusunda gecerli tarih sinirlari kullan**

---

## 5. Calisma sekli

- **Her test sonunda dur** — kullanici test gozlemi versin, bug varsa fix sonrasi tekrar dogrula
- Test reglemanli: ekran-ekran, kullanici verisi/bug raporu temelli
- Bug bulununca priorite: P0 (crash/data loss) → P1 (broken flow) → P2 (cosmetic)
- **Tani icin DB sorgula** (MCP execute_sql) — "veri mi yok, gosterim mi bozuk" ayrimini netlestirir
- Buyuk dosya yazimi sonrasi tsc + (gerekirse) tail/wc kontrol

---

## 6. Adim 5 sonu beklentisi

Bittiginde ozet:
- E1 More menu test durumu (✅ / ❌ + aciklama)
- Bulunan bug'lar + fix'ler (priorite ile)
- Debug temizlik tamamlandi mi (MoreSheet row + index.tsx log + kalan)
- tsc dogrulamasi
- `devam-promptu-adim-8-bug-fix-turu-6.md` uret VEYA bug fix turu bittiyse ADIM 9 (reset password + beta build) hazirlik notu

**ADIM 8 BUG FIX TURU sonu hedef:** Tum MVP ekranlari (Auth + Calendar + Day Detail + D1/D2/D3 + E1 More) fonksiyonel test edilmis, P0/P1 bug'lar duzeltilmis, debug satirlari temizlenmis, ADIM 9'a temiz baslangic.
