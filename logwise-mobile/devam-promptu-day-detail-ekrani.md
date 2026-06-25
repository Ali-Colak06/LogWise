# LogWise Mobil — Devam Promptu: Gün Detayı (Day Detail) Ekranı Cilası

> Bu metni yeni bir sohbete **olduğu gibi yapıştır**.

---

Merhaba. LogWise mobil uygulamasının **arayüz (UI) elden geçirme** sürecini önceki bir
sohbette sürdürüyorduk. Mevcut tasarım sistemini koruyup ekranları kullanıcı yolculuğu
sırasıyla cilalıyoruz. Sıradaki ekran **Gün Detayı (Day Detail)** — takvimde bir güne
tıklanınca açılan, set girişinin yapıldığı ekran.

## 0. ÖNCE şu bağlam dosyalarını SIRAYLA oku (istisna yok)
1. `AGENTS.md` (repo kökü) — proje sözleşmesi (§3.2 dosya mimarisi, §3.4 git, §7 yasaklar)
2. `docs/mobile-design-system/03-mvp-decisions.md` — mobil kararların tek kaynağı.
   Özellikle: **§3.2 Day Detail davranışı**, **§8.2 Day Detail**, **§8.3 Rest Timer**,
   **§8.6 Custom egzersiz & Compliance**, **§8.8 Day Detail görsel/etkileşim kararları (rev 12)**.
3. `docs/mobile-design-system/05-screen-specs.md` → **§C1 (empty) + C2 (filled) + C3 (program
   günü) + C4 (Add Exercise)** — implementation-ready spec: layout, component breakdown, state
   varyantları, props (TS interface), interaction notes, edge cases, açık sorular.
4. `theme/tokens.ts` — renk/spacing/typography/shadow token'ları (hardcode YASAK, her şey buradan)
5. Bu dosyanın tamamı

Görsel referans: `docs/mobile-design-system/day-prototype/` (index.html + styles.css + script.js)
— idle state + active state + rest timer. (Day için ayrı PNG referansı yok; prototip ana kaynak.)

## 1. İki temel karar (bütün overhaul boyunca geçerli)
- **Görsel yön:** Mevcut **dark + gold premium** dilini KORU. İş = her ekranı tutarlı + rafine +
  spec/prototiplerle hizalı hale getirmek (yeni görsel dil DEĞİL).
- **Yöntem:** Kullanıcı yolculuğu sırasıyla ekran ekran. Tamamlananlar: **tüm auth akışı** +
  **Calendar (ay + hafta)**. Sıradaki: **Day Detail** → sonra Library (Workout) → Dashboard →
  Social → More.

## 2. Şimdiye kadar yapıldı (cihazda doğrulandı)

### Auth turu — bitti
- Paylaşılan marka bileşenleri (BrandMark, Wordmark, LangPill, AuthHeader, AuthBrand).
- Uygulama ikonu + splash LogWise gold "L" (native → sadece gerçek build'de görünür).
- Register'a username (web paritesi). Email doğrulaması AÇIK akışı (Verify ekranı + migration).

### Calendar turu — bitti (cihazda doğrulandı)
- **App bar:** Avatar artık gerçek kullanıcı baş harfleri (misafirde "M"). Week başlığı
  scroll-senkronlu: görünür haftanın aralığı ("13 — 19 Haz") + "W## · yıl".
- **Month görünümü:** Chip'ler artık **hareket adı** gösterir (kategori değil); **stroke yok**,
  solda **ince kategori-renkli bar** (chip kıvrımında), taşan ad **clip** ("…" yok). Aktif
  programdan **PLANLI** (bugün+gelecek, henüz loglanmamış) günler **soluk** chip olarak görünür
  (`resolveProgramDay`). Köşe radius'ları yumuşatıldı (gün hücresi 3, chip 2).
- **Month swipe:** Elle yazılan Reanimated pager bırakıldı → **`react-native-pager-view`** (native).
  Sabit pencere ±24 ay, recenter yok → hızlı ileri-geri'de karışma yok. Sadece seçili ±1 sayfa
  gerçek grid (tembel), komşu ayların workouts'u **prefetch** + React Query cache → gecikmesiz.
- **Week görünümü:** Collapsed satırda sol-üst "N hareket · M set" + o günün **kategori (bölge)
  chip'leri** (planlı gün soluk). Sağdaki **chevron → akordiyon**: alt alta hareket satırları,
  her birinin sağında **son seanstaki en ağır set "kg × tekrar"** (`useLastSession`, lazy). Detay
  altında **"Start workout" → GEÇİCİ kronometre** (Durdur/Bitir, DB'ye YAZMAZ). Gün gövdesine tap
  (chevron hariç) → Day Detail'e gider.
- **i18n:** `calendar.exShort/setShort/startWorkout/timerPause/timerResume/timerFinish` eklendi
  (types + tr + en senkron).
- **Doc:** `03-mvp-decisions.md` **§8.1.1 (rev 16)** — bu turun bilinçli sapmaları kayda geçti:
  month chip = hareket adı (§3.5'i geçersiz kılar); week akordiyon + inline timer (§B1 + §8.3 +
  §3.2 "active-workout yok"u week için geçersiz kılar).

### Bekleyen dış/açık işler
- **Kronometre kalıcılığı:** Week view "Start workout" kronometresi şimdilik **ephemeral**
  (kaydetmiyor). Kullanıcı ileride kalıcılık için **hatırlatma** istedi (kalıcılık yolu:
  `app_day_meta.total_duration_minutes`). Bu **Day Detail rest timer'ı (§8.3) ile tutarlılık**
  açısından önemli — aşağı bak.
- **Resend SMTP** Supabase dashboard reconfig (auth turundan kalan, mail güvenilirliği).
- **Git:** Calendar turu değişiklikleri **henüz commit edilmedi** (branch `mobile-design-system`).
  Yeni sohbette istersen mantıklı parçalara bölüp commit et (mesaj sonu:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`).

## 3. Teknik kurallar (HER değişiklikte)
- **tsc:** `logwise-mobile` kökünden `npx tsc -p tsconfig.check.json --noEmit` → **0 hata** şart.
- **TypeScript strict** (+ noUncheckedIndexedAccess + noImplicitOverride). `supabase: any` cast YOK.
- **Stil:** Renk/size HARDCODE yasak — `theme/tokens.ts` + `useTheme()` (`{ colors, scheme, tokens }`).
  Layout için `VStack/HStack/Box`, tipografi için `Text` (variant + font), `Button`, `Icon`,
  `Screen`, `SegmentedTabs`, `Input`.
- **i18n:** Yeni kullanıcıya görünen string → önce `data/i18n-types.ts`, sonra `data/i18n-tr.ts`
  + `data/i18n-en.ts` (üçü senkron). `useT()` ile kullan.
- **Supabase:** Frankfurt projesi `hfmqywyfnqmpvskkzksv` (eu-central-1). Mobil tablolar `app_*`.
- **Git:** Branch `mobile-design-system`. Web tarafı (master) ayrı.

## 4. Sıradaki iş: Day Detail ekranı cilası

İlgili dosyalar:
- `app/(app)/(tabs)/calendar/day/[date].tsx` — ana ekran (C1/C2/C3 tek route)
- `components/day/ExerciseCard.tsx` — egzersiz kartı (başlık + setler + "Set Ekle")
- `components/day/SetRow.tsx` — tek set satırı (kg / reps / RIR / set tipi)
- `components/day/RirSelect.tsx`, `components/day/SetTypeSelect.tsx` — set satırı seçicileri
- `components/day/RestDayBanner.tsx` — off-day/rest banner
- `components/day/AddExerciseSheet.tsx` — C4 Add Exercise modal (Kütüphanem / Hazır / Yeni Özel)
- `components/shared/ExPreviewModal.tsx` — hareket önizleme (gif + açıklama + tips)

**Day Detail'e özgü, KORUNACAK kararlar (spec'ten — bozma):**
- §3.2 / §8.2: **"Start workout" butonu YOK**; ekran açılınca set girişi direkt aktif. Set,
  kartın içindeki "Set Ekle" ile eklenir. "Active workout" kavramı MVP'de yok.
- §3.2: Set kaydı **focus-blur / "Done" → autosave (debounced)**, "Geri al" toast. Önceki kayıt
  varsa setler **gerçek değerlerle prefill** (placeholder hayalet değil). Egzersiz **reorder
  sadece kart başlığında** long-press (set satırlarına bulaşmaz). Geçmiş düzenleme her zaman açık.
- §3.2: Aktif program günü → egzersizler **otomatik kartlanmış (lazy)**; `app_workouts`'a **sadece
  set girilince** yazılır. Program egzersizi silme → "Sadece bugün / Tüm programdan" modalı.
- §8.8 rev 12: Empty state **Dumbbell 48pt** + başlık + 1 satır + CTA'lar (≥360pt yan yana,
  <360pt stack). Drag handle **görünür 6-nokta** kart başlığı sağında. **Superset YOK** (set tipi:
  working/warmup/drop). **RIR "F"** (UI=DB). Geçmiş program günü hiç set yoksa → **boş state**
  (lazy kart yok). Program günü label (Push/Pull) MVP'de yok → subtitle "ProgramAdı · Gün · Hf N".
- §8.3: **Rest Timer** manuel başlatma, Day Detail sticky bottom (prototip referans), push/background
  yok.

**ÖNEMLİ — timer tutarlılığı (kullanıcıya sor):** Calendar week-view'a bilinçli olarak inline bir
**"Start workout" antrenman kronometresi** (geçici) eklendi. Day Detail spec'inde ise **set arası
rest timer** (§8.3) var — bunlar kavramsal olarak FARKLI (antrenman süresi sayacı vs dinlenme
sayacı). Day Detail'i yaparken bu ikisinin nasıl ilişkileneceğini **kullanıcıya teyit ettir**
(ör. Day Detail'de rest timer + opsiyonel antrenman kronometresi mi, yoksa sadece rest timer mı;
kalıcılık isteniyor mu). Karar verilirse `03-mvp-decisions.md`'ye işle.

**Çalışma şekli (auth + calendar'da işe yarayan akış):**
1. Mevcut `[date].tsx` + alt bileşenleri (ExerciseCard, SetRow, RestDayBanner, AddExerciseSheet) OKU.
2. `05-screen-specs §C1-C4` + `day-prototype`'ı OKU; aradaki **cila farklarını** (tipografi, spacing,
   hizalama, durum hâlleri, empty/loading, set satırı ergonomisi, marka tutarlılığı) çıkar.
3. Net bir cila planı sun; belirsiz/subjektif noktalarda kullanıcıya sor.
4. Uygula → `npx tsc -p tsconfig.check.json --noEmit` → 0 hata.
5. **DUR**, kullanıcı Expo Go'da görsün (Day Detail saf JS → Expo Go'da görünür). Onay alınca devam.

**Performans notu (BOZMA):** Day Detail iki fazlı mount kullanıyor (`InteractionManager` +
`contentReady`) → push geçişi ağır kart ağacını (TextInput'lu SetRow'lar) beklemiyor. Yazma
hook'ları optimistic + hedefli cache güncellemesi. Memo prop stabilitesini koru.

**Önemli:** Bu bir görsel cila turu — render'ı sen göremezsin; değişiklikten sonra kullanıcıdan
cihazda doğrulama iste. Subjektif görsel kararları (renk tonu, boyut, gölge, radius) kullanıcıya
bırak/teyit ettir.

## 5. Görev listesi (TaskCreate ile aç/sürdür)
Tamamlanan: Auth turu; Calendar turu (month chip/pager/week akordiyon+timer).
Sıradaki: **Day Detail** → Library (Workout) → Dashboard + Social + More.
