# LogWise Mobil — Devam Promptu: Takvim (Calendar) Ekranı Cilası

> Bu metni yeni bir sohbete **olduğu gibi yapıştır**.

---

Merhaba. LogWise mobil uygulamasının **arayüz (UI) elden geçirme** sürecini önceki bir
sohbette sürdürüyorduk. Mevcut tasarım sistemini koruyup ekranları sırayla cilalıyoruz.
Sıradaki ekran **Takvim (Calendar)**.

## 0. ÖNCE şu bağlam dosyalarını SIRAYLA oku (istisna yok)
1. `AGENTS.md` (repo kökü) — proje sözleşmesi (§3.2 dosya mimarisi, §3.4 git, §7 yasaklar)
2. `docs/mobile-design-system/03-mvp-decisions.md` — mobil kararların tek kaynağı
3. `docs/mobile-design-system/05-screen-specs.md` → **§B1 Calendar** (implementation-ready spec: layout, component breakdown, state varyantları, edge cases, açık sorular)
4. `theme/tokens.ts` — renk/spacing/typography/shadow token'ları (hardcode YASAK, her şey buradan)
5. Bu dosyanın tamamı

Görsel referans: `docs/mobile-design-system/calendar-prototype-v2/` ve `calendar-home-prototype/` (index.html + styles.css), `docs/mobile-design-system/references/calendar-month-reference.png`.

## 1. İki temel karar (bütün overhaul boyunca geçerli)
- **Görsel yön:** Mevcut **dark + gold premium** dilini KORU. İş = her ekranı tutarlı + rafine + spec/prototiplerle hizalı hale getirmek (yeni görsel dil değil).
- **Yöntem:** Kullanıcı yolculuğu sırasıyla ekran ekran. Tamamlananlar: **tüm auth akışı**. Sıradaki: **Calendar** → sonra Day Detail → Workout/Library → Dashboard → Social → More.

## 2. Şimdiye kadar yapıldı (auth turu — bitti, cihazda doğrulandı)
- **Paylaşılan marka bileşenleri** oluşturuldu ve auth'ta kullanılıyor:
  - `components/shared/BrandMark.tsx` — gold "L" logo; `assets/icon.png`'i `<Image>` ile gösterir (uygulama ikonuyla birebir, render garantili). `size` + `rounded` props.
  - `components/shared/Wordmark.tsx` — "LOG WISE" (Space Grotesk bold = `fonts.displayBold`, gold). `size`/`tone` props.
  - `components/ui/LangPill.tsx` — segmented EN|TR kapsül (aktif segment gold dolgu). UI barrel'a export'lu.
  - `components/shared/AuthHeader.tsx` — geri butonu + LangPill (login/register/forgot/verify üst barı).
  - `components/shared/AuthBrand.tsx` — BrandMark + Wordmark + opsiyonel subhead.
- **Uygulama ikonu + splash** Expo varsayılan mavi "A"dan LogWise gold "L"ye değiştirildi (`assets/*.png` yeniden üretildi; `app.json` splash/adaptiveIcon bg zaten `#000000`). NOT: ikon/splash native → sadece gerçek build'de görünür, Expo Go'da değil.
- **Register'a username eklendi (web paritesi):** web kuralları (`^[a-zA-Z0-9_]{3,20}$`, küçük harf, canlı sanitizasyon). DB: `app_profiles.username` UNIQUE + `check_app_username_available(text)` SECURITY DEFINER RPC (Frankfurt projesinde uygulandı; repo'da migrations klasörü yok). Tipler yeniden üretildi.
- **Email doğrulaması AÇIK akışı entegre edildi:** signUp session döndürmüyor → kayıt sonrası **Verify ("mailini kontrol et")** ekranına yönlendiriliyor (resend countdown + spam ipucu). Profil oluşturma + misafir→hesap migration'ı **doğrulama+ilk girişten sonra** `app/(app)/_layout.tsx`'te yapılıyor (`lib/account.ts` `ensureAppProfile` + `pendingMigration` bayrağı). Login/register submit'te `Keyboard.dismiss()` (toast klavye arkasında kalmasın).
- **Bekleyen dış iş (kod değil):** Resend SMTP'nin Supabase dashboard'dan bağlanması (Frankfurt taşımasında kaybolmuştu). Bağlandıysa mailler güvenilir gelir. (DKIM/SPF doğrulandı; DMARC Cloudflare'e eklendi.)

## 3. Teknik kurallar (HER değişiklikte)
- **tsc:** `logwise-mobile` kökünden `npx tsc -p tsconfig.check.json --noEmit` → **0 hata** şart.
- **TypeScript strict** (+ noUncheckedIndexedAccess + noImplicitOverride). `supabase: any` cast YOK.
- **Stil:** Renk/size HARDCODE yasak — `theme/tokens.ts` + `useTheme()` (`{ colors, scheme, tokens }`). Layout için `VStack/HStack/Box` (`components/ui/Stack`), tipografi için `Text` (variant + font), `Button`, `Icon`, `Screen`, `SegmentedTabs`, `Input`.
- **i18n:** Yeni kullanıcıya görünen string → önce `data/i18n-types.ts`, sonra `data/i18n-tr.ts` + `data/i18n-en.ts` (üçü senkron). `useT()` ile kullan.
- **Supabase:** Frankfurt projesi `hfmqywyfnqmpvskkzksv` (eu-central-1). Mobil tablolar `app_*` prefix. Email doğrulaması AÇIK.
- **Git:** Branch `mobile-design-system`. Bu turda yapılanlar **henüz commit edilmedi** — yeni sohbette istersen mantıklı parçalara bölüp commit edebilirsin (mesaj sonu: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`). Web tarafı (master) ayrı.

## 4. Sıradaki iş: Calendar ekranı cilası
İlgili dosyalar:
- `app/(app)/(tabs)/calendar/index.tsx` — ay/hafta görünümü ana ekranı
- `app/(app)/(tabs)/calendar/_layout.tsx`
- `components/calendar/CalendarMonth.tsx`, `components/calendar/CalendarWeek.tsx`, `components/calendar/PresetProgramModal.tsx`
- (Day Detail `calendar/day/[date].tsx` AYRI bir sonraki adım — bu turda Calendar ana ekranına odaklan)

**Çalışma şekli (auth'ta işe yarayan akış):**
1. Mevcut `calendar/index.tsx` + alt bileşenleri OKU.
2. `05-screen-specs.md §B1` + calendar prototiplerini OKU; aradaki **cila farklarını** (tipografi, spacing, hizalama, durum hâlleri, today pill, boş/yükleme durumları, marka tutarlılığı) çıkar.
3. Net bir cila planı sun; uygula.
4. `npx tsc -p tsconfig.check.json --noEmit` → 0 hata.
5. **DUR**, kullanıcı Expo Go'da görsün (Calendar saf JS → Expo Go'da görünür). Onay alınca devam.

**Performans notu:** Calendar perf'i geçmişte çözüldü (CalendarMonth/Week `React.memo`, ay→gün cache seeding, Hermes `Intl.Collator` fix). Cila yaparken bu memo/perf yapısını BOZMA (memo prop stabilitesi, gereksiz re-render). 

**Önemli:** Bu bir görsel cila turu — render'ı sen göremezsin; değişiklikten sonra kullanıcıdan cihazda doğrulama iste. Subjektif görsel kararları (renk tonu, boyut, gölge) kullanıcıya bırak/teyit ettir.

## 5. Görev listesi (TaskCreate ile aç/sürdür)
Tamamlanan: Auth marka bileşenleri + Welcome; auth ekranlarına marka yayma; Register username. 
Sıradaki: **Calendar** → Day Detail → Workout/Library → Dashboard+Social+More.
