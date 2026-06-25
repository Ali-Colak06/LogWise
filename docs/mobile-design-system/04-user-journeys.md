# LogWise Mobile MVP — Kullanıcı Yolculukları

> Bu dosya MVP için 5 ana kullanıcı yolculuğunu ekran ekran haritalar.
> Amaç: boş state'leri, geçiş noktalarını, ve "şimdi ne yapayım?" anlarını erken yakalamak.
> İlgili dosyalar: `03-mvp-decisions.md` (kararlar), `02-mobile-design-system-proposal.md` (token + component), prototipler (`auth-prototype`, `calendar-prototype-v2`, `day-prototype`, `workout-prototype`).

Son güncelleme: 2026-05-19 (rev 7)

---

## Yolculuk listesi

1. **Yeni kullanıcı** — İlk kez indirip hesap açan
2. **Tekrar açan kullanıcı** — Önceden kullanmış, app'i yeniden açıyor
3. **Program takipli kullanıcı** — Aktif programı var, bugünü logluyor
4. **Misafir mod kullanıcısı** — Hesap açmadan kullanmaya başlıyor
5. **Web'den gelen kullanıcı** — Mevcut Supabase hesabıyla mobile geçiş yapıyor

Her yolculuk şu yapıdadır:
- **Niyet:** Kullanıcının amacı
- **Adımlar:** Ekran ekran akış (`A1 → B1 → ...`)
- **Edge cases:** Sapma noktaları
- **Açık sorular:** Henüz karar verilmemiş noktalar

---

## 1. Yeni kullanıcı yolculuğu

### Niyet
Spor uygulaması arayan biri LogWise'ı App Store / Play Store'dan indirdi, ilk kez açıyor. Hesabı yok, beklentisi: "ilk antrenmanımı kolayca loglayabileyim".

### Akış özeti
```
A1 Launch → A2 Welcome → A4 Register → B1 Calendar (boş + hint kartı)
  → C1 Day Detail (boş + program önerisi hint) → C4 Add Exercise (modal)
  → C2 Day Detail (filled) → Set ekle ... → Geri / Calendar (gold dot)
```

### Adım adım

**1. Launch (A1).** App icon'a basar. Siyah arka plan + gold logo + LOG WISE wordmark + loading bar. Arka planda Supabase session check; session yoksa A2'ye yönlendirir.

**2. Welcome (A2).** Logo + tagline + 3 buton:
- **Primary:** Hesap Oluştur (gold)
- **Secondary:** Giriş Yap
- **Ghost:** Misafir Olarak Devam Et

Sağ üstte TR/EN toggle (cihaz diline göre default). Kullanıcı "Hesap Oluştur"a basar.

**3. Register (A4).** Form:
- Display Name (zorunlu, 1-50 karakter)
- Email (zorunlu, format kontrolü)
- Şifre (zorunlu, min 6 karakter)
- Şifre Tekrar (eşleşme kontrolü)

Primary buton "Hesap Oluştur". Alt link: "Hesabın var mı? Giriş Yap".
**Username yok** (MVP). Validation inline (alanın altında). Submit → Supabase `signUp`.

**4. (Atlandı) Email verification.** MVP'de email confirmation **KAPALI**. Hesap açar açmaz B1'e yönlenir. (Karar: hızlı onboarding > email verify. Sonra opsiyonel hatırlatma eklenir.)

**5. Calendar — boş + hint kartı (B1).**
- Üst bar: avatar (initial circle), ay başlığı, Today butonu, view switch (Month/Week).
- Haftanın günleri etiketi.
- Month grid — boş (workout indicator yok).
- **Hint kartı**: takvimin altında bir kart — "İlk antrenmanını ekle: bir gün seç veya hazır bir program başlat." İki CTA: [Bugünü Aç] [Program Seç].
- Hint kartı, kullanıcının ilk workout'undan sonra otomatik kaybolur.
- Bottom nav: Calendar (aktif), Workout, Dashboard, Social, More.

**6. Day Detail — empty + program önerisi (C1).** Kullanıcı bugüne tıklar.
- Üst bar: geri butonu, gün başlığı ("19 Mayıs, Pazartesi · Bugün"), önceki/sonraki gün okları.
- Day summary stat şeridi: Egzersiz: 0, Set: 0, Hacim: —
- **Boş state**: ortada icon + mesaj ("Bu gün için henüz egzersiz yok.") + iki CTA yan yana: [+ Egzersiz Ekle] (primary), [Hazır Program Seç] (secondary).
- FAB sağ altta: + (her durumda hazır).

**7. Add Exercise modal (C4).** Kullanıcı "+ Egzersiz Ekle"ye basar.
- Bottom sheet açılır.
- Üst: arama input + kapatma X.
- Sekmeler (segmented): **Kütüphanem** (boş — yeni kullanıcı), **Hazır Hareketler** (54 preset), **Yeni Özel**.
- Kategori chips filtre.
- **Çoklu seçim**: default single tap (tek tıklama → hemen ekle, modal kapanır). Uzun bas → multi-select mode'a geç → birden fazla seç → alt barda "3 hareket · Ekle".

**8. Egzersiz seçimi.** "Hazır Hareketler" → "Bench Press" tıklar. Single tap'te hemen Day'e eklenir, modal kapanır. Arka planda `app_exercises` tablosuna preset_id ile kopyalanır.

**9. Day Detail — filled (C2).** Modal kapanır, kullanıcı Day Detail'de.
- Egzersiz kartı: başlık "Bench Press", kategori chip "Göğüs", "+ Set Ekle" butonu, ⋯ menü (note, preview, delete).
- Önceki set referansı: yeni kullanıcıda yok, yerine placeholder ("İlk antrenmanın!").
- Day summary: Egzersiz: 1, Set: 0, Hacim: —

**10. İlk set girişi.** "+ Set Ekle"ye basar.
- Yeni satır: #1, type chip (Working default), KG input (numpad focus), REPS input, RIR selector (chip group: -, 0, 1, 2, 3, 4+), X (sil).
- Kullanıcı 60 → REPS'e geç → 10 → focus dışına dokun veya klavye "Done".
- **Set kaydı**: focus dışı / Done'da otomatik save (debounced). Hata durumunda kısa "Geri al" toast.

**11. Rest timer (opsiyonel, manuel).** Day Detail'in alt kısmında **global "⏱ Dinlenme" butonu**. Basarsa sticky bottom rest timer slide up:
- Default 90 sn, preset chips: 30/60/90/120/180/300.
- Pause/Resume, +30s/-30s, Skip, Settings (default kaydet).
- Set ile bağı yok — kullanıcı istediği zaman istediği süreyle.

**12. İkinci set, üçüncü set...** "+ Set Ekle" → yeni satır.
- Önceki setin değerleri **placeholder** olarak gelir (60kg/10reps). Kullanıcı isterse değiştirir.

**13. İkinci egzersiz...** FAB veya "+ Egzersiz Ekle" → C4 modal → ikinci egzersiz.
- Egzersizler dikey stack.
- **Reorder**: long-press drag (uzun bas, sürükle). react-native-reanimated + gesture-handler.

**14. Bitirme.** "Save workout" butonu **yok** (direkt set girişi modeli — her set zaten kaydedildi).
- Kullanıcı geri butonu veya bottom nav'dan başka sekmeye.
- Calendar'a döndüğünde bugünün hücresinde **gold dot** (workout var).
- **Duration** MVP'de tutulmaz (alan şemada var ama UI'da yok).

### Sabitlenmiş kararlar (bu yolculuktan)
- Email confirmation **KAPALI**
- Calendar empty state: **hint kartı** (ilk workout'tan sonra kaybolur)
- Day Detail empty state: program önerisi hint'i **var** (yan yana iki CTA)
- Add Exercise modal: **hibrit multi-select** (single tap default + long-press multi)
- Set kaydı: **focus dışı/Done'da otomatik save** + undo toast
- Rest timer girişi: **Day Detail global buton** (set ile bağı yok)
- Egzersiz reorder: **long-press drag**
- Workout duration: **MVP'de yok** (alan şemada kalır)
- "Save workout" butonu yok — her set anında kaydedilir
- Calendar'da workout indicator: **gold dot**

### 1. yolculuğun kalan kararları (rev 5'te kapatıldı)

- **Calendar empty state hint kartı tasarımı:** Grid'in **altında**, sade text card — gold accent dot + başlık ("İlk antrenmanını ekle") + 1 satır açıklama + 2 kompakt buton yan yana ([Bugünü Aç] [Program Seç]). İlustration yok. İlk workout eklenince **otomatik kaybolur** (manuel X yok).
- **"Hazır Program Seç" CTA yönlendirmesi:** Direkt **preset program seçim modal'ı** açılır (Calendar/Day Detail üzerinde). İçerik: "Hazır Program Seç" başlığı + 4 preset listesi (her satırda ad + kısa açıklama + gün-chip mini grid) + her satırın altında [Bu Programı Başlat] butonu (veya satıra tap → preview → Başlat). Alt link: "Daha sonra kendim ekleyeceğim" → modal kapanır. Seçilince program `app_programs`'a kopyalanır, hemen aktif edilir, modal kapanır, ekran yenilenir.
- **Yeni kullanıcıda önceki kayıt olmayan ilk set placeholder'ı:** Hint metni "kg" / "reps". Alan etiketleri placeholder olarak görünür; kullanıcı yazınca otomatik kaybolur. Yanlış değer önerisi yok.
- **Long-press drag tetikleyicisi:** **Sadece kart başlığı (header) drag handle**. Set satırlarına uzun basmak hiçbir şey yapmaz, input çakışması yok. Kart başlığı **belirgin** olmalı (küçük drag handle icon veya pressed state) — kullanıcıya drag affordance'ı verir.

---

## 2. Tekrar açan kullanıcı yolculuğu

### Niyet
Kullanıcı önceden hesabını açmış, bir kaç antrenman loglamış. App'i tekrar açıyor, beklentisi: **"hızlı ana ekrana ulaşayım, yeniden login olmak istemem"**.

### Akış özeti
```
A1 Launch
  → [Auto-login: Supabase session refresh]
  → B1 Calendar (dolu, mini kategori chip'leriyle geçmiş workout'lar görünür)
  → C2 Day Detail (bugün: filled veya program ile pre-rendered)
       veya geçmiş güne tıklama → düzenleme
```

### Adım adım

**1. Launch (A1).** App icon → splash.
- Arka planda `getSession()` çağrılır.
- Token expo-secure-store'da, refresh otomatik.
- Geçerli session varsa B1'e atla (Welcome/Login görünmez).
- Splash: en az 300ms, en çok 2sn.

**2. Calendar — dolu (B1).**
- Üst bar: avatar (initial), ay başlığı, Today butonu, view switch.
- Month grid: geçmiş workout'lar **mini kategori chip'leriyle** işaretli (calendar-prototype-v2'deki gibi — örn. mavi=göğüs, yeşil=sırt). Hücre başına en fazla 2-3 chip.
- Bugünün hücresi: gold border (today indicator).
- Hint kartı YOK (ilk workout'tan sonra otomatik kaybolmuştu).
- Bottom nav: Calendar default aktif.
- **Açılışta hep bugünün ayı** — son bakılan ay hatırlanmaz.

**3. Bugüne tıklama → Day Detail.** Burada 3 dallanma:

**3a. Day Detail — boş, aktif program YOK (C1).**
- Day summary: Egzersiz: 0, Set: 0, Hacim: —
- Boş state: ortada icon + mesaj + 2 CTA: [+ Egzersiz Ekle] (primary), [Hazır Program Seç] (secondary).
- FAB sağ altta + butonu.

**3b. Day Detail — boş, aktif program VAR (C1 variant).**
- **Boş state YOK.** Programdaki bugünün egzersizleri **otomatik kartlanmış** halde görünür.
- Bu egzersizler **lazy/sanal**: ekranda render edilir, ama set girişi olmadıkça `app_workouts` tablosuna yazılmaz.
- Kullanıcı sadece set girişine başlar.
- Programda olmayan ekstra egzersiz: FAB ile manuel ekle.
- Programdaki bir egzersizi sil → **modal: "Sadece bugün için mi, tüm programdan mı?"** çıkar.
  - "Sadece bugün" → o gün için skip (program kalır)
  - "Programdan" → `app_program_days`'ten satır silinir, yarın da gelmez

**3c. Day Detail — bugün için kayıt VAR.**
- Day summary güncel (örn. Egzersiz: 3, Set: 8, Hacim: 3,240 kg).
- Var olan egzersiz kartları + set satırları görünür.
- Yeni egzersiz ekleme: FAB.
- Set ekleme/düzenleme: yine direkt.

**4. Geçmiş güne tıklama.** Calendar'da dün veya hafta öncesine tıkla.
- Day Detail açılır, eski workout görünür.
- **Read-write her zaman** — set düzenle, ekle, sil, drag/reorder hepsi çalışır (bugün ile tam aynı davranır).
- Üst bar ileri/geri okları ile gün geçişi.

**5. View switch (Month ↔ Week).** Üst bar switch.
- Week: prototipteki sonsuz scrollable feed (calendar-prototype-v2).

### Önceki set placeholder (web ile aynı davranış)

Bir egzersiz kartı render edilirken:
- O egzersizin **bugünden önceki en son tarihteki** workout'u bulunur.
- O günün setleri set-by-set placeholder olarak yeni satırlara verilir:
  - Set 1 input → önceki Set 1 (örn. "60kg / 10 reps")
  - Set 2 input → önceki Set 2
  - vs.
- Kullanıcı isterse değerleri olduğu gibi bırakır veya değiştirir.
- Hiç önceki kayıt yoksa placeholder boş.

### Sabitlenmiş kararlar (bu yolculuktan)
- **Session persistence:** Tam auto-login (token expo-secure-store, refresh otomatik)
- **Default sekme:** Calendar
- **Calendar açılışı:** Hep bugünün ayı (son bakılan ay hatırlanmaz)
- **Geçmiş workout düzenleme:** Her zaman read-write (bugün ile aynı davranır)
- **Önceki set placeholder:** Son antrenmanın set-by-set tüm setleri (web ile aynı)
- **Calendar workout indicator:** Mini kategori chip'leri (calendar-prototype-v2 referans)
- **Aktif program + boş gün:** Programdaki bugünün egzersizleri **otomatik kartlanmış** olarak görünür (boş state yok)
- **Program egzersizi yazma stratejisi:** Lazy/sanal — sadece render, set girilince DB'ye yazılır
- **Program egzersizi silme:** Modal sorar — "Sadece bugün mü, tüm programdan mı?"

### 2. yolculuğun kalan kararları (rev 7'de kapatıldı)
- **Calendar Month max chip:** Hücre başına **max 2 chip** (ilk 2 kategori). Daha fazlası taşırır, detay Day Detail'de.
- **Rest day Day Detail:** Info renkli "Rest Day" banner + opsiyonel FAB ile manuel egzersiz. (Bu zaten 3. yolculukta sabit, açık liste hatalıydı.)
- **Geçmiş günde program context:** **Hiç gösterilmez.** Üst bar sadece tarih + gün adı. Karmaşıklığı azaltır, `app_programs`'a deactivated_at eklemek gerekmez.

### Felsefe notu (önemli)

> Calendar'da kaçırılan günleri gizleme kararının amacı **demotivasyon değil, görsel netlik**: kullanıcı takvime baktığında "hangi günler antrenman yaptım" sorusuna anında cevap alsın diye. Programs tab'daki compliance % ise farklı amaca hizmet eder ("program disiplinim") ve gerçek rakam (yapılan/yapılması gereken) gösterir — bu motive eder, demotive etmez.

---

## 3. Program takipli kullanıcı yolculuğu

### Niyet
Kullanıcı bir program (örn. PPL) seçmiş ve aktif etmiş. Sistematik bir rutin takip ediyor. Beklentisi: **"sıfır sürtünme — sadece kg/reps gir, başka düşünme"**.

### Akış özeti
```
Workout → Programs tab → Add Program → Preset seç (PPL) → Aktif Et
  → Calendar dönüş → Bugün (push day) → Day Detail (egzersizler otomatik kartlanmış)
  → Set gir × N → Geri
  → Yarın (off day) → Rest Day banner
```

### Adım adım

**1. Programs tab — boş state.** Kullanıcı Workout sekmesine geçer.
- Segmented control: Exercises (sayı: 3), Programs (sayı: 0).
- Boş state: ortada icon + "Henüz program eklemedin" + CTA: [+ Yeni Program].
- Üst sağda "+" pill butonu.

**2. Add Program modal.** "+" tıklanır.
- **Tek modal'da segmented control** (Add Exercise ile tutarlı):
  - Sekme 1: **Hazır** (4 preset: PPL, Upper/Lower, Full Body, Bro Split)
  - Sekme 2: **Sıfırdan**
- Hazır sekmesi: her satırda program adı + kısa açıklama + gün-chip mini grid. Tap → preview (tüm günlerin egzersizleri).
- Bottom CTA: [Kütüphaneme Ekle].

**3. Preset program ekleme.**
- `app_programs` tablosuna kopyalanır.
- `app_program_days` satırları preset'teki günlerle dolar.
- **Preset egzersizler ayrı tabloya kopyalanmaz** — preset 54 hareket zaten bundle'da global okuma-only havuz olarak duruyor (her kullanıcının kütüphanesinde "preset" sekmesinde otomatik görünür). `app_program_days.exercise_ref` doğrudan slug ("bench-press") referansı tutar.
- "Kütüphaneme eklendi" toast.

**4. Program Detail / Edit.** Kullanıcı eklediği programa tıklar.
- Üst: program adı, açıklama, "Aktif Et" toggle.
- Gün-chip grid (Pzt/Sal/Çar/Per/Cum/Cmt/Paz): her gün egzersiz sayısı veya "Rest".
- Cycle settings: none/weekly/deload + deload_every + off_days.
- Düzenle: gün başına egzersiz ekle/çıkar, drag/reorder, cycle ayarları (prototipte tam ne varsa).

**5. Aktif Et.** "Aktif Et" toggle.
- **Tek aktif program** kuralı: önceki aktifse modal sorar: "PPL şu an aktif. Üzerine yazmak ister misin?"
- Onay → eski program `activated_at: null`, yeni program `activated_at: bugün`.
- Toast: "PPL aktif edildi".
- Bottom nav Calendar'a yönlen veya kullanıcı kendi geçer.

**6. Calendar — aktif program ile (B1 variant).**
- Geçmiş tamamlanan workout'lar: **normal/full opacity** mini kategori chip'leriyle (yapılmış).
- Geçmiş program günleri ama log yok: **görünmez** (kaçırılan günler sessizce gizlenir, demotivasyon yaratmamak için).
- Gelecek program günleri: **soluk/muted** chip'ler (%40 opacity gibi — planlama göstergesi).
- Bugün: gold border + (varsa) full chip'ler.

**7. Day Detail — bugün push day (C2 variant).** Kullanıcı bugüne tıklar.
- Üst bar subtitle: **"PPL · Push Day · Hafta 2"** (program context).
- Egzersizler **otomatik kartlanmış** halde: Bench, OHP, Lateral, Triceps Pushdown, Cable Crossover.
- **Lazy/sanal yazma:** render edilir, set girilince `app_workouts`'a satır oluşur.
- Önceki set placeholder'lar: geçen haftaki aynı egzersizin setleri set-by-set placeholder.

**8. Set girişi.** Her kartta "+ Set Ekle" → normal akış.

**9. Programdaki egzersizi atlama.** Kullanıcı bugün Lateral Raise yapmak istemiyor.
- Kartın ⋯ menüsünden "Sil" → modal: "Sadece bugün mü, tüm programdan mı?"
- "Sadece bugün" → o gün skip; `app_day_meta.skipped_exercise_ids` listesine eklenir (app kapansa da korunur).
- "Programdan" → `app_program_days` satırı silinir; yarın yine push day olsa da Lateral gelmez.

**10. Programa olmayan ekstra egzersiz.** FAB veya "+ Egzersiz Ekle" → C4 modal → seç.
- Eklenir, **görsel ayrım yok** (program ve ekstra aynı görünür). Bugün ne yapıldıysa o.

**11. Rest day (program off day).** Kullanıcı Pazar günü Day Detail'i açar (PPL'de off_day).
- Üst bar: "16 Mayıs Pazar · Rest Day".
- Body: "Rest Day" banner (info renk — teal/cyan), açıklama: "Bugün programında dinlenme günü".
- "Yine de egzersiz eklemek istersen" + FAB.

**12. Program yönetimi (Programs tab featured card).**
- Aktif program featured card (workout-prototype):
  - Program adı + aktif badge.
  - **Compliance %** (örn. "78%") — web `calcCompliance` mantığı.
  - Current week (örn. "Hafta 3").
  - Gün-chip grid: her gün egzersiz sayısı / rest.
  - Aksiyonlar: Düzenle, Pasifleştir.
- Diğer programlar (pasif) altta compact liste.

**13. Program silme.** Program Detail → ⋯ → "Programı Sil".
- Modal: "Silmek istediğine emin misin? Log'lar etkilenmez."
- Onay → `app_programs` + `app_program_days` silinir.
- Aktif programsa: kullanıcının aktif programı yok'a düşer.

### Sabitlenmiş kararlar (bu yolculuktan)
- **Aktif program sayısı:** Tek (yeni aktif eski'yi pasif eder)
- **Add Program modal:** Tek modal'da segmented control (Hazır / Sıfırdan)
- **Preset hareketler:** Ayrı tabloya kopyalanmaz; bundle'da global okuma-only havuz olarak kalır. `app_program_days` ve `app_workouts` slug referansı tutar.
- **Program context Day Detail'de:** Üst bar subtitle ("PPL · Push Day · Hafta 2")
- **Programa olmayan ekstra egzersiz:** Görsel ayrım yok (aynı görünür)
- **"Sadece bugün skip":** `app_day_meta.skipped_exercise_ids` field'ında saklanır
- **Calendar future chips:** Gelecek günler için program varsa **soluk/muted** chip'ler görünür
- **Calendar past chips:** Geçmiş tamamlanan workout'lar **full opacity**; kaçırılan program günleri **görünmez** (sessizce gizlenir)
- **Rest day Day Detail:** Info renkli "Rest Day" banner + opsiyonel FAB ile manuel ekleme
- **Programs tab compliance:** Yüzde olarak (web ile aynı, `calcCompliance` mantığı)

### Şema ETKİSİ (önemli)

Bu yolculuğun en büyük teknik etkisi: preset hareketlerin **`app_exercises` tablosuna kopyalanmaması**. Bu şemada bir değişiklik:

- **`app_exercises` tablosu:** Sadece kullanıcının kendi **custom egzersizleri** için. `is_custom` field gereksiz (her zaman true).
- **Preset egzersizler:** Bundle'da JSON olarak. Frontend bunları "kütüphane" görünümünde preset slug'ları + custom listesini birleştirip gösterir.
- **`app_workouts.exercise_ref text`** (önceki tasarımdaki `exercise_id uuid` yerine): hem slug ("bench-press") hem UUID (custom egzersiz id) tutar. **Polymorphic referans.**
- **`app_program_days.exercise_ref text`**: aynı polymorphic.
- **`app_day_meta.skipped_exercise_ids text[]`**: yeni field, slug veya UUID listesi.

### 3. yolculuğun kalan kararları (rev 7'de kısmen kapatıldı)
- **Custom egzersiz kategori seçimi:** **Default "Diğer"** — kullanıcı seçmezse otomatik atanır. Veri tutarlı, sürtünmesiz.
- **Compliance hesabı:** **Yapılan / Yapılması gereken** (web `calcCompliance` formülü). Off_day'ler dışlanır. Gerçek rakam (%75 gibi) motivasyon verir. Calendar'daki "kaçırılan günleri gizleme" kararıyla çelişmez; iki ekran farklı amaca hizmet eder (Calendar = log haritası, compliance = disiplin metriği).

### Hâlâ açık (sonraki rev'lerde — düşük öncelik)
- Program preview modal'da hangi detaylar gösterilir (her günün tüm egzersizleri mi, sadece günler/sayılar mı)?
- Yeni program "Sıfırdan oluştur" akışı tam nasıl olur (boş program oluştur → Edit sayfası mı, wizard mı)?

---

## 4. Misafir mod kullanıcısı yolculuğu

### Niyet
Hesap açmak istemiyor, app'i denemek istiyor. Beklentisi: **"hızlıca içeri gir, sınırlamalar belli olsun"**.

### Akış özeti
```
A1 Launch → A2 Welcome → [Continue as Guest tap]
  → B1 Calendar (boş + hint kartı) → normal yeni kullanıcı akışı
  → Veri tümü AsyncStorage'da, Supabase'e hiç gitmez
```

### Yeni kullanıcıdan farklılıklar

- **Auth flow yok:** Register/Login adımları atlanır. Welcome'dan direkt Calendar'a.
- **Supabase çağrısı yok:** Hiçbir `app_*` tablosuna istek yok. Tüm veri lokal.
- **Veri yapısı:** AsyncStorage'da JSON. Anahtarlar:
  - `@logwise/guest/exercises`
  - `@logwise/guest/programs`
  - `@logwise/guest/program_days`
  - `@logwise/guest/workouts`
  - `@logwise/guest/sets`
  - `@logwise/guest/day_meta`
  - `@logwise/guest/profile` (sadece preferences/theme/locale için)
- **Özellik kilidi YOK:** MVP'nin tüm özellikleri (Calendar, Workout, Day Detail, Programs) misafir için açık. Ürünün tam değerini görmeli.

### Sınırlama bildirimi

- **Welcome ekranında:** "Misafir Olarak Devam Et" butonunun **altında küçük not**: "Verin sadece cihazda saklanır."
- **Uygulama içinde:** Profil avatarı yerine **"Misafir" badge**. More menüde "Hesap Aç" item sticky kalır.
- **Banner yok:** Sürekli üstte uyarı banner'ı **kullanılmaz** (rahatsız edici).

### Guest → Hesap geçişi

Misafir kullanıcı bir noktada hesap açmak isteyebilir. Akış:

1. **More menüden "Hesap Aç"a basar** → Register ekranı açılır.
2. Form doldurulur (email, şifre, display name).
3. Submit → modal onayı: "Misafir verileriniz hesabına aktarılacak. Devam?" [İptal] [Devam Et]
4. Onay → Supabase `signUp` çağrısı → `auth.users.id` elde edilir.
5. **Veri aktarımı:**
   - AsyncStorage'daki tüm guest anahtarları okunur.
   - Her satır yeni `user_id` ile Supabase `app_*` tablolarına insert edilir.
   - UUID'ler regenerate edilir (temizlik için).
   - `app_workouts.exercise_ref` ve `app_program_days.exercise_ref` aynen taşınır (slug ise slug, UUID ise yeni UUID).
6. Loading state: "Verileriniz aktarılıyor..." (5-10 sn).
7. **Başarılı:** AsyncStorage guest anahtarları **silinir**. Toast: "X egzersiz, Y antrenman aktarıldı". Calendar'a yönlen.
8. **Hata:** AsyncStorage **silinmez** (rollback). Modal: "Aktarım başarısız oldu. Tekrar dene?" [Tekrar Dene] [İptal]

### Sınır durumları

- Guest → hesap aktarımı sırasında Supabase'de insert hatası → rollback (AsyncStorage korunur)
- Misafir kullanıcı uygulamayı silip yeniden indirirse veri kaybolur (uyarı: Welcome'daki "sadece cihazda" notu)
- Misafir kullanıcı başka cihaza geçemez (data taşımak için hesap açmak gerekir)

### Sabitlenmiş kararlar (bu yolculuktan)
- **Sınırlama bildirimi:** Welcome'da buton altında küçük not + uygulama içinde "Misafir" badge
- **Özellik kilidi:** YOK (tam erişim — Calendar/Workout/Day Detail/Programs hepsi açık)
- **Veri kaydı:** AsyncStorage, JSON anahtarları
- **Guest → hesap geçişi:** Veri **otomatik aktarılır** (modal onayıyla). Hata olursa rollback.
- **Hesap Aç CTA konumu:** More menüde sticky item

### 4. yolculuğun kalan kararları (rev 7'de kısmen kapatıldı)
- **Misafir tercih aktarımı:** Dil/tema **aktarılır** — `@logwise/guest/profile` (locale, theme) → `app_profiles.preferences`. Veri aktarımının doğal parçası.

### Hâlâ açık (sonraki rev'lerde — düşük öncelik)
- AsyncStorage anahtarlarının final isimlendirme stratejisi (prefix `@logwise/guest/` onaylandı, ama sub-key formatları henüz net değil)
- Veri aktarımı sırasındaki loading state UI (full-screen mi modal mı ne kadar detay gösterilir)

---

## 5. Web'den gelen kullanıcı yolculuğu

### Niyet
Kullanıcı LogWise web sitesinde aktif. Mobil app yayınlandı, indiriyor. Aynı email/şifresiyle giriyor. Beklentisi: **"web verilerimi göreyim"** — ama bizim kararımız: mobil temiz başlar, web verisi taşınmaz.

Bu yolculuk **UX riski yüksek**. "Veri nerede?" şoku doğru bir mesajla yumuşatılmalı.

### Akış özeti
```
A1 Launch → A2 Welcome → A3 Login
  → [auth.users zaten var, giriş başarılı]
  → [Sistem check: user_data tablosunda satır var mı? → EVET]
  → Tek seferlik "Hoş geldin" modal (web link'i ile)
  → B1 Calendar (boş — app_* tablolar yeni kullanıcı gibi)
```

### Sistem tanıma mantığı

Login başarılı olduktan sonra:
1. Supabase `auth.user.id` elde edilir.
2. Sistem **web verisi check'i** yapar: `select count(*) from user_data where user_id = $1`
3. Sonuç > 0 → bu kullanıcı web kullanıcısı → "Hoş geldin" modal'ı göster
4. Sonuç = 0 → tamamen yeni kullanıcı, normal akış

Bu check her login'de değil — sadece bu kullanıcı için **ilk mobil login'inde** yapılır. Sonuç bir flag olarak saklanır:
- AsyncStorage'da: `@logwise/seen_web_welcome_modal` (boolean)
- Veya `app_profiles.preferences.seen_web_welcome` (jsonb içinde)

**Önerim:** `app_profiles.preferences.seen_web_welcome = true` — kullanıcı bu modal'ı bir kez görünce bir daha görmez (cihaz değiştirse bile, profile sync olur).

### "Hoş geldin" modal içeriği

- Üst: gold logo (küçük) + başlık "Hoş geldin!"
- Body (2 paragraf, sade):
  - "LogWise mobil app, ayrı bir veri katmanı kullanıyor. Web hesabınızla giriş yaptınız ama antrenman geçmişiniz web tarafında kalmaya devam ediyor."
  - "Mobil için sıfırdan başlayacaksınız. Web verilerinize istediğiniz zaman web sitemizden erişebilirsiniz."
- İki buton:
  - Primary: [Mobil'e Başla] → modal kapanır, Calendar'a yönlen
  - Secondary/ghost: [Web'e Git] → tarayıcıda `https://logwise.fit` açılır (Linking API)
- Alt link: "Bu mesajı bir daha gösterme" (default işaretli, kaldırılabilir)

### Yeni kullanıcıdan farkları

- **Sadece bu modal var.** Geri kalan akış (Calendar boş + hint kartı + ilk antrenman) yeni kullanıcı ile birebir aynı.
- Web kullanıcısı için empty state hint kartı yine görünür ("İlk antrenmanını ekle").

### Sınır durumları

- **Web hesabı var ama mobile şifreyi unutmuş:** A5 Forgot Password → reset link → yeni şifre. Sistem hâlâ aynı `auth.users.id` ile çalışır, modal yine görünür.
- **Web hesabı ama login'de hata:** Standart Supabase hatası. Modal görünmez.
- **Aynı cihazda hem web hem mobile aynı hesap:** Mobile'da işlem yapılınca web etkilenmez (ayrı tablo). Web'de işlem yapılınca mobile etkilenmez. İki ürün paralel yaşar.

### Sabitlenmiş kararlar (bu yolculuktan)
- **Web kullanıcısı tanıma:** Login sonrası `user_data` tablosunda satır var mı kontrolü
- **"Hoş geldin" modal:** Tek seferlik, mesaj + web link + "bir daha gösterme" toggle
- **Modal görünüm bayrağı:** `app_profiles.preferences.seen_web_welcome` (jsonb)
- **Web link aksiyonu:** Tarayıcıda `logwise.fit` açılır (Linking API)
- **Geri kalan akış:** Yeni kullanıcı ile birebir aynı (empty state hint kartı dahil)

### Hâlâ açık
- Modal'ın görsel detayı (auth-prototype'taki modallarla aynı stil mi)
- "Bu mesajı bir daha gösterme" default işaretli mi yoksa boş mu
- Web kullanıcısı için ileride senkron seçeneği gelirse (MVP sonrası), modal mesajı güncellenir mi

---

## Değişiklik kaydı

| Tarih | Bölüm | Değişiklik |
|---|---|---|
| 2026-05-19 | İskelet | Dosya oluşturuldu, 5 yolculuk için yer ayrıldı. |
| 2026-05-19 | §1 | 1. yolculuk (Yeni kullanıcı) tamamen yazıldı, 8 açık soru cevaplandı: email confirm KAPALI, calendar empty hint kartı, day empty program önerisi var, multi-select hibrit, set kaydı focus-dışı auto, rest timer global buton, reorder long-press, duration MVP'de yok. |
| 2026-05-19 | §2 | 2. yolculuk (Tekrar açan kullanıcı) tamamen yazıldı: tam auto-login, default Calendar+bugünün ayı, geçmiş read-write, önceki set placeholder web ile aynı, mini kategori chip'leri indicator. Aktif program + boş gün için **boş state yok** — egzersizler otomatik kartlanmış olarak görünür, lazy/sanal yazma stratejisi, silme modal'ı sorar. |
| 2026-05-19 | §3 | 3. yolculuk (Program takipli) tamamen yazıldı: tek aktif program, Add Program segmented modal, preset hareketler bundle'da kalır (kütüphaneye kopyalanmaz), program context üst bar subtitle, "sadece bugün skip" `app_day_meta.skipped_exercise_ids`'de, Calendar future muted/past full/missed gizli, rest day banner, compliance %. **Şema etkisi:** `app_workouts.exercise_ref` ve `app_program_days.exercise_ref` polymorphic text (slug VEYA UUID). |
| 2026-05-19 | §1 (kalan) | 1. yolculuğun 4 açık sorusu kapatıldı: ilk set placeholder "kg" / "reps" hint metni, Calendar hint kartı grid altında sade text card + otomatik kapanış, "Hazır Program Seç" direkt preset seçim modal'ı (Workout sekmesine yönlenmez), long-press drag sadece kart başlığında (set satırlarına bulaşmaz). |
| 2026-05-19 | §4 | 4. yolculuk (Misafir mod) yazıldı: Welcome'da küçük not + içeride "Misafir" badge, tam özellik erişimi, AsyncStorage `@logwise/guest/*` anahtarları, **Guest → Hesap geçişinde veri otomatik aktarılır** (önceki "yok sayılır" kararı geri alındı). Hata durumunda rollback. |
| 2026-05-19 | §5 | 5. yolculuk (Web'den gelen) yazıldı: Login sonrası `user_data` check, tek seferlik "Hoş geldin" modal + web link, bayrak `app_profiles.preferences.seen_web_welcome`, geri kalan akış yeni kullanıcı ile aynı. Mobile ve web paralel yaşar (ayrı veri katmanları). |
| 2026-05-19 | §2, §3, §4 (Grup A) | Grup A açık soruları kapatıldı: Calendar max 2 chip, geçmiş günde program context yok, custom egzersiz default "Diğer", compliance % web formülü, misafir tercih aktarılır. **Felsefe notu eklendi:** Calendar'da kaçırılan günleri gizleme = görsel netlik (demotivasyon değil). Compliance % gerçek rakam gösterir. |
