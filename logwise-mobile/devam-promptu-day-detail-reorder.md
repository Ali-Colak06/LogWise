# LogWise Mobil — Devam Promptu: Gün Detayı (Day Detail) — Checkpoint 2: Drag Handle + Reorder

> Bu metni yeni bir sohbete **olduğu gibi yapıştır**.

---

Merhaba. LogWise mobil uygulamasının **arayüz (UI) elden geçirme** sürecini sürdürüyoruz.
Mevcut tasarım sistemini koruyup ekranları kullanıcı yolculuğu sırasıyla cilalıyoruz.
**Day Detail (Gün Detayı)** ekranının **Checkpoint 1**'i tamamlandı, cihazda doğrulandı ve
commit edildi. Şimdi **Checkpoint 2 = egzersiz kartlarını sürükleyerek sıralama (reorder) +
görünür 6-nokta drag handle**.

## 0. ÖNCE şu bağlam dosyalarını SIRAYLA oku (istisna yok)
1. `AGENTS.md` (repo kökü) — proje sözleşmesi (§3.2 dosya mimarisi, §3.4 git, §7 yasaklar).
2. `docs/mobile-design-system/03-mvp-decisions.md` — mobil kararların tek kaynağı. Özellikle:
   - **§3.2 Day Detail davranışı** → reorder kuralı: **long-press SADECE kart başlığında**;
     set satırlarına bulaşmaz (TextInput çakışması yok). Program egzersizi silme modalı.
   - **§8.8 (rev 12)** → **görünür 6-nokta drag handle**: kart başlığının sağ kenarında, ⋯
     menünün solunda, `t-tertiary` renk.
   - **§8.11 (rev 17)** → Day Detail cila turu kararları + Checkpoint 1'de yapılanlar + **reorder'ın
     bilinçli olarak Checkpoint 2'ye ertelendiği** not (dependency riski).
3. `theme/tokens.ts` — renk/spacing/typography/shadow token'ları (hardcode YASAK).
4. Bu dosyanın tamamı.
5. Mevcut Day Detail kodu:
   - `app/(app)/(tabs)/calendar/day/[date].tsx` — ana ekran (kart listesi şu an `ScrollView` + `map`)
   - `components/day/ExerciseCard.tsx` — kart (header'a drag handle eklenecek)
   - `components/day/SetRow.tsx`, `components/day/AnchoredDropdown.tsx`, `components/day/WorkoutTimerBar.tsx`
6. Yazma katmanı (reorder mutation'ı buraya eklenecek):
   - `queries/workouts.ts` — optimistic mutation kalıpları (`useAddSet`, `useEnsureWorkoutAndAddSet`
     içinde `position` nasıl set ediliyor: `Math.max(...positions)+1`). Hedefli cache (predicate).
   - `lib/data-bridge.ts` — `ensureWorkout` / `deleteWorkout` write helper'ları (guest + auth dallı).
7. Hareket/gesture referansı (projede zaten çalışan, Expo Go uyumlu):
   - `components/calendar/CalendarMonth.tsx` — `react-native-gesture-handler` Pan (yön kilitli swipe).

Görsel referans: `docs/mobile-design-system/day-prototype/` (idle kartlar) + `§8.8` 6-nokta handle.

## 1. İki temel karar (bütün overhaul boyunca geçerli)
- **Görsel yön:** Mevcut **dark + gold premium** dilini KORU (yeni dil DEĞİL).
- **Yöntem:** Kullanıcı yolculuğu sırasıyla. Day Detail'den sonra sıradaki: Library (Workout) →
  Dashboard → Social → More.

## 2. Day Detail Checkpoint 1 — TAMAM (cihazda doğrulandı + commit'lendi)
- **Set satırı = prototip 6-sütun grid** (`# Type KG Reps RIR ×`). Type/RIR = native `<select>`
  benzeri **`AnchoredDropdown`** (kutuyla aynı genişlikte, hücrenin altında açılan dikey liste,
  `measureInWindow` + Modal overlay, alt-taşma flip). `SetTypeSelect`/`RirSelect` **silindi**.
- **Prefill (kullanıcı kararı):** Önceki seansın aynı set index değerleri (weight/reps/type/rir)
  "+ Set Ekle"de **gerçek değer olarak gelir ve dokunulmasa da kaydedilir**. Lazy yazma korunur:
  hiç set eklenmemiş program kartı DB'ye yazılmaz. Kaynak: `useLastSession` (ExerciseCard içinde).
- **Timer (kullanıcı kararı):** Rest timer YOK. Day Detail'de "Start workout" ile başlayan
  **geçici antrenman kronometresi** (`WorkoutTimerBar` + `useWorkoutStopwatch`; DB'ye yazmaz;
  set girişini gate'lemez). §8.2/§8.3 override (doc'a işlendi).
- **Görsel cila:** app bar (display tarih + mono alt-satır: program/rest/Bugün), mono stat strip +
  `kg`, kategori-chip pill, "Son: kg×tekrar" (`useLastSession`), empty state 2. CTA "Hazır Program
  Seç" (`PresetProgramModal` reuse). "0/20 planlı hedef" yok (şema set sayısı tutmuyor).
- Commit'ler (`mobile-design-system`, PUSH edilmedi): `3ccbbf0` takvim cilası, `f58ba1a` gün
  detayı cilası, `2b8910d` karar dokümanı (rev16+17).

## 3. Sıradaki iş — Checkpoint 2: Drag handle + reorder

**Hedef davranış (spec):**
- **Görünür 6-nokta drag handle** ExerciseCard başlığında (§8.8): ⋯ menünün solunda, `t-tertiary`.
- **Long-press → kart sürükle → sırala.** §3.2: tetikleme **SADECE kart başlığında/handle'da**;
  set satırlarına (SetRow/TextInput'lar) bulaşmaz.
- **Yeni sıra `app_workouts.position`'a kalıcı yazılır** (optimistic + hedefli cache).

**Önceki sohbette netleşen teknik kısıtlar (DİKKAT — taşı):**
- **Bağımlılık riski:** Proje **Reanimated 4.1** + **gesture-handler 2.28**'de. `react-native-draggable-flatlist`
  projede YOK ve son sürümü Reanimated 2 hedefliyor → RNA4 uyumu doğrulanmadı, bundle'ı (Expo Go)
  kırma riski yüksek. **ÖNERİ: paket eklemeden, projede zaten çalışan Reanimated 4 + gesture-handler
  ile custom drag yaz** (CalendarMonth Pan gesture referans). Paket yolunu seçeceksen önce uyumu
  doğrula; kullanıcıya teyit ettir.
- **Reorder mutation'ı YOK → eklenecek:** `lib/data-bridge.ts`'e `reorderWorkouts(ctx, { dateISO,
  orderedIds })` (guest + auth; her workout'un `position`'ını yeni sıraya göre güncelle) +
  `queries/workouts.ts`'e `useReorderWorkouts` (optimistic: day cache'inde sırayı hemen değiştir,
  predicate-bazlı hedefli güncelleme; diğer mutation'ların kalıbını izle).
- **Karışık liste (lazy + persisted) — KULLANICIYA SOR:** Day Detail aynı anda **persisted
  workout kartları** (DB'de, `position` var) + **lazy program kartları** (DB'de YOK, program
  sırasından türetiliyor) render edebiliyor. Reorder yalnızca persisted kartlarda mı anlamlı,
  yoksa lazy kartlar da sürüklenip ilk dokunuşta mı materialize edilmeli? Program günü ilk açıldığında
  TÜM kartlar lazy olabilir (henüz set yok) → sürükleme neyi kaydeder? Bu **ürün kararını kullanıcıya
  sor** (öneri: reorder persisted kartlar arası; lazy kartlar program sırasını korur / sürüklenince
  o kart materialize edilir). Karar verilince `03-mvp-decisions.md`'ye işle.
- **Liste yapısı:** Kartlar şu an `[date].tsx` içinde `ScrollView` + `map`. Custom drag için
  ScrollView ile gesture çakışması + kenar autoscroll dikkat ister. Reanimated tabanlı reorder
  yapısına geçerken **iki fazlı mount** (`InteractionManager` + `contentReady`) ve **memo prop
  stabilitesi** korunmalı (perf notu). Off-day/empty state'ler reorder dışı.

## 4. Teknik kurallar (HER değişiklikte)
- **tsc:** `logwise-mobile` kökünden `npx tsc -p tsconfig.check.json --noEmit` → **0 hata** şart.
- **TypeScript strict** (+ noUncheckedIndexedAccess + noImplicitOverride). `supabase: any` cast YOK.
- **Stil:** Renk/size HARDCODE yasak — `theme/tokens.ts` + `useTheme()`. Layout `VStack/HStack/Box`,
  tipografi `Text`, `Button`, `Icon`, `Screen`.
- **i18n:** Yeni kullanıcıya görünen string → `data/i18n-types.ts` + `data/i18n-tr.ts` + `data/i18n-en.ts`
  (üçü senkron). (Reorder için muhtemelen yeni string gerekmez; handle aria için bir tane gerekebilir.)
- **Supabase:** Frankfurt projesi `hfmqywyfnqmpvskkzksv`. Mobil tablolar `app_*`. `app_workouts.position` int.
- **Git:** Branch `mobile-design-system`. Commit sonu: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## 5. Çalışma şekli (auth + calendar + day-cp1'de işe yarayan akış)
1. Yukarıdaki dosyaları OKU.
2. Net bir plan sun; **belirsiz/ürün kararı olan noktaları kullanıcıya sor** — özellikle: (a) custom
   drag mı paket mi, (b) lazy+persisted karışık liste reorder semantiği.
3. Uygula → `npx tsc -p tsconfig.check.json --noEmit` → 0 hata.
4. **DUR**, kullanıcı Expo Go'da görsün (gesture-handler/reanimated Expo Go'da çalışıyor — calendar
   pager/swipe zaten orada). Onay alınca devam.
5. Render'ı sen göremezsin → subjektif görsel/etkileşim kararlarını (handle konumu, sürükleme hissi,
   haptik) kullanıcıya teyit ettir.

## 6. Bekleyen diğer açık işler
- **Superset set tipi (açık):** Görselde 4. seçenek olarak vardı ama MVP'de bilinçli çıkarılmıştı
  (§8.8 rev12: working/warmup/drop). Kullanıcı geri ekleme kararı vermedi; reorder'dan ayrı bir konu.
- **Resend SMTP** Supabase dashboard reconfig (auth turundan kalan mail güvenilirliği — kod değil).
- **Kronometre kalıcılığı** (week + day "Start workout"): şimdilik ephemeral; ileride
  `app_day_meta.total_duration_minutes` (kullanıcı hatırlatma istedi).

İlgili referanslar: önceki devir notu `devam-promptu-day-detail-ekrani.md` (Checkpoint 1 girdisi).
