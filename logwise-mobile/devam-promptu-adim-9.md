# LogWise Mobile — Devam Promptu (ADIM 9: Reset Password sistemi + Beta Build / EAS)

> Bu dosyayi yeni bir Cowork/AI seansinda **oldugu gibi mesaj olarak yapistir**.
> Sozlesme: AI bu dosyayi gorur -> mevcut state'i anlar -> ADIM 9 (reset password tamamlama + EAS beta build) baslar.
> Tur bitince Claude bu dosyayi guncellesin (`devam-promptu-adim-10.md` veya store-submit hazirligi).

---

Merhaba. LogWise mobil uygulamasinin implementation surecindeyiz. **ADIM 1-7, ADIM 8 ana paketi ve ADIM 8 BUG FIX TURU (Adim 1 Auth, Adim 2 Calendar, Adim 3 Day Detail, Adim 4 Workout/Library D1-D3 + Entegrasyon, Adim 5 E1 More + debug temizlik) TAMAMLANDI.** Tum MVP ekranlari fonksiyonel test edildi, P0/P1 bug'lar fix'lendi, debug satirlari temizlendi. Simdi **ADIM 9: Reset Password sistemini tamamlama + EAS beta build** sirasi.

**Onceki seansta (ADIM 8 BUG FIX TURU — Adim 5: E1 More + debug temizlik) yapilanlar:**

### A) E1 More menu fonksiyonel test ✅
- Alt nav 5. sekme "More" → MoreSheet aciliyor ✅
- Dil (TR/EN) + Tema (dark/light) toggle — aninda re-render ✅
- Disabled placeholder satirlar (Profil/Ayarlar/Veri/Geri Bildirim) → "Cok yakinda!" toast ✅ (toast fix sonrasi)
- Logout (auth) / "Hesap Ac" (guest) ✅
- Misafir varyanti test edilmedi (kullanici "gec" dedi — dusuk risk, header+CTA kodu mevcut/dogru)

### B) YENI — Avatar floating panel (ProfilePopover) — kullanici karari, spec sapmasi
- **Spec §3.1'de avatar tap = MoreSheet idi.** Kullanici avatar'a AYRI bir panel istedi (sol-ust acilir popover).
- `components/shared/ProfilePopover.tsx` (YENI): profil ozeti + Dil/Tema toggle + Cikis Yap (auth) / Hesap Ac (guest). `measureInWindow` ile avatar'in ekran konumunun altina yerlesir; scrim tap ile kapanir. Yeni i18n anahtari YOK (`more.*` mevcut anahtarlar yeniden kullanildi).
- `app/(app)/(tabs)/calendar/index.tsx`: app-bar avatar `View` → `Pressable` (ref + `openProfile` measure helper + accessibilityLabel); `<ProfilePopover>` render edildi.
- **ACIK NOT (kullanici karari):** Avatar paneli ile MoreSheet su an Dil/Tema/Logout acisindan CAKISIYOR — bilincli, "ikisi de simdilik kalsin, sonra duzenleyecegiz" dendi. Ileride More'un rolu (gelecek ozellikler / disabled satirlar) netlestirilecek.

### C) P2 fix — Toast bottom sheet'in ALTINDA kaliyordu (katmanlama)
- **Kok neden:** `AppBottomSheet` RN `<Modal>` (ayri native window) kullaniyor. Root agacta render olan toast `zIndex` ile ayri native window'un USTUNE cikamaz → acik sheet uzerindeki toast gorunmuyordu.
- **Ilk deneme (REDDEDILDI):** Toast'i kendi `<Modal>`'ina sarmak → Android'de Modal/Dialog dokunmayi YUTUYOR, sheet 3sn kilitleniyordu. `pointerEvents` native Dialog'u durdurmuyor.
- **Cozum:** `components/ui/Toast.tsx`: render state'i (`toast` + `opacity`) ayri bir `ToastRenderContext`'e acildi + yeni `ToastOutlet` export. `AppBottomSheet` modal agacinin icine `<ToastOutlet />` konuldu → toast sheet ILE AYNI native window'da, icerigin ustunde, `pointerEvents="none"` ile (dokunmayi yutmadan) gorunur. Root toast normal ekranlar icin aynen duruyor.
- `components/ui/index.ts`: `ToastOutlet` export eklendi.

### D) Debug temizlik (bug fix turu BITTI — yapildi)
- `components/shared/MoreSheet.tsx`: debug row (`mode=… · email=…`) KALDIRILDI.
- `app/index.tsx`: `console.log('[RootIndex] mode=', mode)` KALDIRILDI.
- Kalan `console.warn`'lar tarandi → hepsi gercek hata/fallback loglamasi (useAuth bootstrap, i18n missing key, guest-storage parse, migration/register fail, Toast provider-yok fail-safe) — KASITLI, birakildi.

---

## 0. Once su baglam dosyalarini sirayla oku — HIC ISTISNA YOK

1. `AGENTS.md` — proje sozlesmesi
2. `docs/mobile-design-system/03-mvp-decisions.md` (rev 15) — §3.6 (logout/auth), §A5 reset password karari
3. `docs/mobile-design-system/05-screen-specs.md` — A5 Forgot Password + (varsa) reset/set-new-password spec
4. **BU DOSYANIN §1 ve §3'unu mutlaka oku** — onceki seans notlari + mevcut state + operasyonel notlar

---

## 1. Su anki proje state'i — neyi varsayabilirsin, neyi varsayma

### Hazir olan (ADIM 1-8 BUG FIX TURU sonu — TAM)
- **Auth (A1-A5):** welcome / login / register / verify / forgot-password ekranlari mevcut. `queries/auth.ts` icinde `useAuthResetPassword` VAR — `supabase.auth.resetPasswordForEmail` cagiriyor, opsiyonel `redirectTo` (`app.json extra.resetPasswordRedirect`).
- **Calendar / Day Detail / Workout-Library (D1-D3) / E1 More / F1-F2 placeholder:** hepsi test edildi, P0/P1 fix'lendi. ✅
- **E1 More + Avatar ProfilePopover:** calisir durumda (yukari bkz).
- **Toast:** artik bottom sheet ustunde de gorunuyor (`ToastOutlet`).

### Reset password — MEVCUT DURUM (onemli, ADIM 9'un cekirdegi)
- `app/(auth)/forgot-password.tsx`: email gir → `resetPasswordForEmail` → success state (MailCheck + 60sn resend countdown + back-link). **Calisiyor: mail GONDERILIYOR.**
- **EKSIK olan:** Kullanici mailindeki linke tikladiktan SONRA **uygulama icinde yeni sifre belirleme** akisi YOK.
  - Su an link `extra.resetPasswordRedirect` (web reset sayfasi, orn. `https://logwise.fit/reset-password`) bos ise Supabase default'una (Site URL) gider — mobil kullanici icin kirik.
  - **Deep link handler YOK**, **set-new-password (A6?) ekrani YOK**, `supabase.auth.updateUser({ password })` cagrisi YOK.
- **A5 spec notu:** "Deep link MVP'de yok — mail tarayicida acilir, user app'e doner ve A2'de gir." → Yani MVP minimum: web reset sayfasi ya da Supabase recovery linki. ADIM 9'da kullanici ile **deep link mi yoksa web-reset mi** karari netlestirilecek.

### EAS / build durumu
- `eas.json` MEVCUT: `development` (dev client, internal), `preview` (internal, Android APK), `production` (app-bundle, autoIncrement). `submit.production` placeholder ID'ler iceriyor (Apple/Play — henuz doldurulmamis).
- `app.json` mevcut; `extra.resetPasswordRedirect` opsiyonel alani var.
- **Beta build hedefi:** `preview` profili (Android APK, internal distribution) ile dahili test build'i.

### Mevcut DB (auth user: colak.ali1928@gmail.com, user_id: ba569072-755d-4e68-b470-d78bacbdf0c6)
- Project ID: `czbxujioufhmvoajqwzp`
- DB tablolari: `app_profiles`, `app_workouts`, `app_programs`, `app_program_days`, `app_sets`, `app_exercises`, `app_day_meta`.
- `app_workouts.workout_date` = `date` tipi; `app_program_days` PK = `(program_id, day_index, position)`.

### Bekleyen (ADIM 9 — BU SEANS)
**1. Reset password tamamlama:**
   - Kullanici ile karar: (a) Web reset sayfasi (landing'de `/reset-password`) mi, (b) mobil deep link + in-app set-new-password ekrani mi?
   - (b) secilirse: `expo-linking` / Supabase recovery deep link handler + yeni "set new password" ekrani (`app/(auth)/reset-password.tsx`?) + `supabase.auth.updateUser({ password })` + i18n (types→tr→en).
   - Supabase Dashboard → Authentication → URL Configuration → Redirect URLs whitelist guncellemesi (kullaniciya hatirlat).

**2. EAS beta build:**
   - `preview` profili ile Android APK build (`eas build -p android --profile preview`).
   - EAS login / project link kontrolu; `app.json` version/build ayarlari; env (`EXPO_PUBLIC_*`) dogrulama.
   - Build oncesi: `npx tsc -p tsconfig.check.json --noEmit` 0 hata + (varsa) `eas build` interaktif promptlar kullaniciya birakilir (AI EAS interaktif login yapamaz — kullaniciya `! eas ...` komutlari onerilir).

### ADIM 9 sonrasi (sonraki seanslar)
- Hint card + Preset Program Modal sorunu (DB state — dusuk oncelik, hala acik)
- Avatar paneli ↔ MoreSheet rol ayrimi (kullanici "sonra duzenleyecegiz" dedi)
- Store submit hazirligi (`submit.production` placeholder ID'ler, asset/screenshot, privacy policy)

---

## 2. Bu seansin gorev tanimi

### 2.0 SIFIR ONCELIK (yapilmis durumda olmali)
- ✅ tsc 0 hata (`npx tsc -p tsconfig.check.json --noEmit`)
- ✅ Tum MVP ekranlari test edilmis, debug temizlenmis (ADIM 8 BUG FIX TURU bitti)

### 2.1 Yapilacaklar
**SEANS BASINDA KULLANICIYA SOR:** "ADIM 9 (Reset password tamamlama + EAS beta build) ile devam edelim mi? Reset password icin web-reset sayfasi mi yoksa mobil deep link + in-app yeni sifre ekrani mi istersin?"

Karar netlesince:
1. Reset password akisini sec + uygula (deep link secilirse: handler + ekran + `updateUser` + i18n)
2. tsc dogrula; mumkunse cihazda akisi test et (mail → link → yeni sifre → login)
3. EAS beta build: `preview` profili; interaktif komutlari kullaniciya `! eas ...` ile birak
4. Bittiginde: `devam-promptu-adim-10.md` (store submit hazirligi) uret

### 2.2 Yapmayacaklarin
- Store submit / production app-bundle (sonraki adim — once beta APK)
- Avatar paneli ↔ MoreSheet rol ayrimi (kullanici sonraya birakti)
- Hint card / Preset Modal derin debug (DB state — ileride)
- AI'nin EAS interaktif login/build'i kendisi calistirmaya calismasi (kullaniciya `!` ile birak)

---

## 3. OZEL OPERASYONEL NOTLAR — GUNCEL (cok onemli!)

**Bunlari okumadan kod yazma:**

- **Toast + RN Modal katmanlama:** Root agactaki overlay (toast/snackbar) RN `<Modal>` (AppBottomSheet, ProfilePopover, ConfirmModal vb. — ayri native window) USTUNDE GORUNMEZ. Cozum deseni: render state'i context'e ac + Modal kullanan bilesenin agacina `<ToastOutlet />` koy (ayni native window, `pointerEvents="none"`). **Toast'i kendi Modal'ina SARMA** — Android'de dokunmayi yutar. Yeni RN-Modal'li bir bilesen toast gosterecekse icine `ToastOutlet` koymayi dusun.
- **ProfilePopover konumlanma:** Avatar `Pressable`'a `ref` + `measureInWindow((x,y,w,h)=>…)` → kart `top = y+h+gap`, `left` ekran kenarina `clamp`. Yeni anchored popover'larda ayni desen.
- **`workout_date` = `date` kolonu.** Ay/aralik sorgusu ust sinirini SONRAKI ayin 1'i yap (`-32`/`-31` PATLAR).
- **`app_program_days` PK = `(program_id, day_index, position)`.** Coklu ekleme: batch `addProgramDayExercises` (ardisik position).
- **Takvim chip kaynagi = SADECE `app_workouts`** (loglanmis). Program aktif etmek tek basina chip uretmez (tasarim geregi).
- **Native Alert max 3 buton (Android)!** 3+ secenekli menu → bottom sheet (DayExerciseActionSheet/ProgramActionSheet). Iki-secenekli onay → ConfirmModal veya kisa Alert.
- **Reset password mevcut:** `queries/auth.ts useAuthResetPassword` + `app.json extra.resetPasswordRedirect`. Deep link/in-app yeni sifre HENUZ YOK — ADIM 9'da eklenecek. Supabase Redirect URLs whitelist guncellemesi gerekir (kullaniciya hatirlat).
- **EAS profilleri:** `development` (dev client), `preview` (Android APK internal — BETA icin bu), `production` (app-bundle). `submit.production` ID'leri placeholder (henuz dolu degil).
- **i18n:** yeni anahtar → once `i18n-types.ts`, sonra `i18n-tr.ts` + `i18n-en.ts`. Array alanlar `useTranslations()`. Interpolation `{key}`.
- **Edit/Write buyuk dosyayi KESEBILIR + NUL byte tuzagi.** Buyuk dosyaya yazim sonrasi tsc ile dogrula. NUL temizleme: `python3 -c "f='path'; d=open(f,'rb').read(); open(f,'wb').write(d.replace(b'\x00',b''))"`.
- **Supabase MCP** dogrudan kullanilabilir (`execute_sql`, `list_tables`). Project ID: `czbxujioufhmvoajqwzp`. Bug tani icin DB'yi sorgula.
- **tsc:** `npx tsc -p tsconfig.check.json --noEmit` (kokte tsconfig.check.json).
- **Expo start:** Proje kokunden (`C:\Users\colak\Documents\LogWise\logwise-mobile`) `npm start` (global `npx expo` degil — proje icindeki expo).

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
- **Buyuk dosyaya yazim sonrasi tsc ile dogrula**
- **Native Alert 3+ buton YOK (Android) — bottom sheet kullan**
- **Toast'i kendi Modal'ina sarma — `ToastOutlet` deseni kullan**
- **EAS interaktif komutlarini AI calistirmaz — kullaniciya `!` ile birak**

---

## 5. Calisma sekli
- **Her test sonunda dur** — kullanici gozlem versin, bug varsa fix sonrasi tekrar dogrula
- Bug priorite: P0 (crash/data loss) → P1 (broken flow) → P2 (cosmetic)
- **Tani icin DB sorgula** (MCP execute_sql)
- Buyuk dosya yazimi sonrasi tsc + (gerekirse) tail/wc kontrol
- Reset password gibi auth-kritik akista: gercek mail → link → yeni sifre → login uctan uca test et

---

## 6. ADIM 9 sonu beklentisi
Bittiginde ozet:
- Reset password akisi karari + implementasyon (web-reset veya deep-link + in-app ekran)
- Uctan uca test sonucu (mail → yeni sifre → login)
- EAS beta build durumu (preview APK — build ID / kullaniciya birakilan interaktif adimlar)
- tsc dogrulamasi
- Supabase Redirect URLs whitelist hatirlatmasi yapildi mi
- `devam-promptu-adim-10.md` (store submit hazirligi) uret

**ADIM 9 sonu hedef:** Reset password uctan uca calisir, dahili (beta) Android APK build alinabilir durumda, store submit'e temiz gecis.
