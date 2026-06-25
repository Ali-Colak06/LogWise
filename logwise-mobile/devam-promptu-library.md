# LogWise Mobil — Devam Promptu: Library (Workout) cila turu

> Bu metni yeni bir sohbete **olduğu gibi yapıştır**.

---

Merhaba. LogWise mobil uygulamasının **arayüz (UI) elden geçirme** sürecini sürdürüyoruz.
Mevcut tasarım sistemini koruyup ekranları **kullanıcı yolculuğu sırasıyla** cilalıyoruz.
**Auth + Calendar + Day Detail** turları TAMAM (cihazda doğrulandı + commit'lendi). Sıradaki ekran:
**Library / Workout** (D1 Egzersizler + D2 Programlar, sonra D3 Program Düzenle).

> NOT: Bu ekranlar **zaten çalışıyor** (işlevsel kod mevcut). Bu bir **cila turu** — sıfırdan
> yazım değil; prototip sadakatine + dark+gold dile + spec'e hizalama, tutarlılık, etkileşim
> rafine etme. Day Detail turunda olduğu gibi: küçük, doğrulanabilir adımlar.

## 0. ÖNCE şu bağlam dosyalarını SIRAYLA oku (istisna yok)
1. `AGENTS.md` (repo kökü) — proje sözleşmesi (§3.2 dosya mimarisi, §3.5 mobil kuralları, §3.4 git, §7 yasaklar).
2. `docs/mobile-design-system/03-mvp-decisions.md` — mobil kararların tek kaynağı (şu an **rev 18**). Özellikle:
   - **§8.9 (rev 13)** → Library (D1-D2) kararları: D1+D2 **tek route** (segmented control, URL değişmez); D1 kapsam = custom egzersizler + tüm tarihçedeki distinct preset slug'lar; D1 row tap = preview, ⋯/long-press = menü; custom delete = soft reference + fallback "(silinmiş egzersiz)"; D2 ActiveProgramCard (compliance + streak + sıradaki + 7-chip grid + 2 CTA); tek aktif program kuralı (ActivateConfirmModal); "+ New" sadece sıfırdan; app bar sol = hamburger → MoreSheet.
   - **§8.10 (rev 14)** → D3 Program Edit kararları: tam ekran route (modal değil); gün layout = dikey scroll + collapsible panel (bugün açık default, multi-expand); cycle type `weekly`(default)/`deload`/`none`; autosave debounced (manuel "Kaydet" yok, app bar pill = save & exit); off-day toggle = Opsiyon A (dolu gün off yapılınca satırlar silinir, confirm); gün-gün taşıma = Opsiyon A (⋯ → MoveToDaySheet); aktif et CTA disabled koşul = en az 1 egzersiz; 6-dot drag handle (gün içi reorder + program day).
   - **§3.8** (preset program akışı) + **§8.4.1** (NewProgramSheet sıfırdan akış).
3. `docs/mobile-design-system/04-user-journeys.md` — 3. yolculuk (program takipli) Library kullanım kalıbı.
4. `docs/mobile-design-system/05-screen-specs.md` — **D1, D2, D3** spec'leri (layout + component + state + props + interaction + edge case). Bağlayıcı.
5. `theme/tokens.ts` — renk/spacing/typography/shadow token'ları (hardcode YASAK).
6. Bu dosyanın tamamı.
7. Mevcut Library kodu (cilalanacak):
   - `app/(app)/(tabs)/workout/index.tsx` — D1+D2 ana ekran (segmented control).
   - `app/(app)/(tabs)/workout/_layout.tsx` — stack/route.
   - `app/(app)/program/[id]/edit.tsx` — D3 Program Düzenle (tam ekran, tabs DIŞINDA).
   - `components/workout/ActiveProgramCard.tsx`, `NewProgramSheet.tsx`, `ProgramActionSheet.tsx`,
     `ConfirmModal.tsx`, `CustomExerciseEditSheet.tsx`, `DayExerciseActionSheet.tsx`.
   - `components/day/AddExerciseSheet.tsx` — **paylaşılan** (C4 + D1 + D3; mode prop'larıyla davranış ayrımı).
   - `components/shared/ExPreviewModal.tsx`, `components/shared/MoreSheet.tsx`.
8. Veri katmanı (zaten mevcut — gerekirse dokun):
   - `queries/programs.ts`, `queries/exercises.ts` (+ `queries/workouts.ts` `useUsedExerciseRefs`).
   - `lib/data-bridge.ts` — program CRUD: `createEmptyProgram`, `updateProgram`, `deleteProgram`,
     `activateProgram`/`deactivateProgram`, `addProgramDayExercises`, `removeProgramDayExercise`,
     `reorderProgramDay`, `moveProgramDayExercise`, `clearProgramDay`, `rewriteProgramDays`.
   - `lib/exercise-resolve.ts` (ref → ad/kategori), `lib/program.ts` (resolveProgramDay/compliance).
9. Görsel referans: `docs/mobile-design-system/workout-prototype/` (D1 Exercises + D2 Programs + Program Edit prototipi).

## 1. İki temel karar (bütün overhaul boyunca geçerli)
- **Görsel yön:** Mevcut **dark + gold premium** dilini KORU (yeni dil DEĞİL). Her ekranı tutarlı/rafine/prototip-sadık yap.
- **Yöntem:** Kullanıcı yolculuğu sırasıyla. Library'den sonra sıradaki: Dashboard → Social → More.

## 2. Şimdiye kadar TAMAM olan turlar (cihazda doğrulandı + commit'lendi)
- **Auth turu:** BrandMark/Wordmark/LangPill/AuthHeader paylaşılan bileşenleri; username (web paritesi);
  email doğrulama akışı (Verify ekranı); app icon + splash.
- **Calendar turu:** Month hareket-adı chip + native pager-view swipe + planlı soluk chip; Week akordiyon +
  geçici "Start workout" kronometresi; app bar avatar + scroll-senkron başlık. Doc §8.1.1 (rev 16).
- **Day Detail turu (CP1 + CP2):** prototip 6-sütun set grid + `AnchoredDropdown` (Type/RIR); prefill
  (önceki seans gerçek değer + kaydedilir); ephemeral antrenman kronometresi (rest timer YOK);
  **CP2 reorder** — paketsiz custom drag (Reanimated 4 + gesture-handler), TÜM kartlar (persisted + lazy)
  sürüklenir, sıra `app_day_meta.card_order`'da (lazy-write korunur). Doc §8.11 (rev 17 + rev 18).
- Commit'ler (`mobile-design-system`, PUSH edilmedi): `3ccbbf0`, `f58ba1a`, `2b8910d`, `92165ae`.

## 3. Sıradaki iş — Library cila turu

**Amaç:** D1/D2/D3'ü prototip + dark+gold + spec'e hizala. Önce **ekran ekran OKU → ne sapıyor tespit et →
küçük adımlarla cilala**. Day Detail'de işe yarayan akış: bir checkpoint uygula → tsc → cihazda doğrulat → devam.

**Beklenen odak alanları (cihazda gözlemleyip kullanıcıyla netleştir):**
- **D1 Egzersizler:** segmented control (Egzersizler | Programlar) görsel dili; arama/filtre; satır tasarımı
  (kategori-chip + ad + ⋯), preview tap; empty state ("+ Yeni Özel" tek CTA); custom edit/delete (soft ref
  fallback "(silinmiş egzersiz)"). Kütüphane kapsamı = custom + tarihçedeki preset'ler (§8.9).
- **D2 Programlar:** `ActiveProgramCard` (workout-prototype Phone 2 sadakati — kicker + ad + meta + ✎ + ⋯;
  compliance gold / streak / sıradaki; 7-chip gün grid bugün gold + rest "—"/cyan; 2 CTA "Bugünkü workout" +
  "Haftayı gör"); "Diğer programlar" listesi; "+ New" → NewProgramSheet → D3 push; aktif et = ActivateConfirmModal;
  sil = ConfirmModal (geçmiş korunur).
- **D3 Program Düzenle:** tam ekran; 7 gün dikey collapsible panel (bugün açık default); cycle settings
  (weekly/deload/none + deload_every + off_days); gün-bazlı egzersiz ekle (AddExerciseSheet) / çıkar / **reorder**
  (gün içi 6-dot drag) / **gün-gün taşıma** (Opsiyon A: ⋯ → MoveToDaySheet); off-day toggle (Opsiyon A, confirm);
  autosave debounced; app bar "Kaydet" = save & exit; aktif et toggle.

**Day Detail CP2 reorder altyapısı tekrar kullanılabilir:** Gün içi egzersiz reorder için projede artık
**paketsiz custom drag** kalıbı var (`components/day/ReorderableCardList.tsx`). D3 gün-içi reorder buna
benzer kurulabilir (program_days `position` → `reorderProgramDay` mevcut). Yeni paket EKLEME.

**KULLANICIYA SORULACAK (ürün/görsel kararları — tahmin etme):**
- Hangi alt-ekrandan başlayalım (D1 mi D2 mi)? Öneri: yolculuk sırası → D2 (aktif program) görünürlüğü yüksek,
  ama D1 daha sade; kullanıcı seçsin.
- D3 zaten ne kadar prototip-sadık? Cihazda bakıp eksik/sapma listesini kullanıcıyla önceliklendir.
- Superset set tipi (açık konu, MVP'de yok) — bu turun parçası DEĞİL; ayrı.

## 4. Teknik kurallar (HER değişiklikte)
- **tsc:** `logwise-mobile` kökünden `npx tsc -p tsconfig.check.json --noEmit` → **0 hata** şart.
- **TypeScript strict** (+ noUncheckedIndexedAccess + noImplicitOverride). `supabase: any` cast YOK.
- **Stil:** Renk/size HARDCODE yasak — `theme/tokens.ts` + `useTheme()`. Layout `VStack/HStack/Box`,
  tipografi `Text`, `Button`, `Icon`, `Screen`.
- **i18n:** Yeni kullanıcıya görünen string → `data/i18n-types.ts` + `data/i18n-tr.ts` + `data/i18n-en.ts` (üçü senkron).
- **Supabase:** Frankfurt projesi `hfmqywyfnqmpvskkzksv`. Mobil tablolar `app_*`. Şema değişikliği gerekirse
  ÖNCE kullanıcıya teyit ettir (migration additive + geri alınabilir olsun; Day Detail'de `app_day_meta.card_order` böyle eklendi).
- **Git:** Branch `mobile-design-system`. Commit sonu: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
  Doc kararları `03-mvp-decisions.md`'ye işlenir + değişiklik kaydına satır + rev numarası artırılır.

## 5. Çalışma şekli (auth + calendar + day detail'de işe yarayan akış)
1. Yukarıdaki dosyaları OKU (özellikle D1-D3 spec + mevcut kod).
2. Net bir plan sun; **belirsiz/ürün/görsel kararı olan noktaları kullanıcıya sor** (yukarıdaki liste + cihazda gördüğün sapmalar).
3. Küçük checkpoint uygula → `npx tsc -p tsconfig.check.json --noEmit` → 0 hata.
4. **DUR**, kullanıcı Expo Go'da görsün. Onay alınca devam.
5. Render'ı sen göremezsin → subjektif görsel/etkileşim kararlarını (boşluk, hizalama, his, animasyon) kullanıcıya teyit ettir.
6. Tur bitince doc'u güncelle (rev artır) + `mobile-design-system`'e commit et.

## 6. Bekleyen diğer açık işler (Library dışı)
- **Resend SMTP** Supabase dashboard reconfig (mail güvenilirliği — kod değil; Frankfurt taşımasında kayboldu).
- **Kronometre kalıcılığı** (week + day "Start workout"): şimdilik ephemeral; ileride `app_day_meta.total_duration_minutes` (kullanıcı hatırlatma istedi).
- **Superset set tipi** (açık): görselde vardı, MVP'de bilinçli çıkarıldı (§8.8). Kullanıcı geri ekleme kararı vermedi.

İlgili referanslar: önceki devir notları `devam-promptu-day-detail-ekrani.md` + `devam-promptu-day-detail-reorder.md` (Day Detail CP1/CP2 girdileri).
