# 13 — LEARNING BACKLOG (proje sahibi için)

> **Amaç:** Seni mobil/web geliştiriciye dönüştürmek **değil**. Amaç: sistemi anlamak, yapay zekâ
> planlarını değerlendirmek, seçenekler arasında karar vermek, riskleri tanımak, diff/test/release
> sonuçlarını yorumlamak ve yeni bir AI-destekli projeyi doğru sırayla yönetmek.
> Bu bir kodlama kursu değildir — her konu LogWise'ın gerçek dosyalarına bağlıdır.

Gruplar: **1) Şimdi · 2) Sonraki büyük özellikten önce · 3) Production öncesi · 4) İhtiyaç çıkarsa ·
5) Şimdilik öğrenme.**

---

## GRUP 1 — Şimdi öğren

### 1.1 Repository ve dosya haritası
- **Neden:** Nereye bakacağını bilmeden hiçbir planı değerlendiremezsin.
- **LogWise örneği:** Web kök / `logwise-mobile/` / `logwise-worker/` üçlüsü.
- **İncele:** [03-REPOSITORY-GUIDE](03-REPOSITORY-GUIDE.md), `AGENTS.md §4`.
- **Minimum seviye:** Hangi klasör ne işe yarar + entry point'leri tanımak.
- **Gerekmeyen:** Her dosyanın iç kodu.
- **Tamamlanma:** Rastgele bir özelliği duyunca "bu hangi klasörde" diyebilmek.
- **3 soru:** (1) Web app entry hangi dosya? (2) Mobil rotalar nerede? (3) Kanonik veri nerede?
- **Claude promptu:** *"LogWise'ta egzersiz kütüphanesi özelliğine dokunan tüm dosyaları listele ve
  her birinin rolünü tek cümleyle açıkla."*
- **Sonra verebileceğin karar:** Bir değişikliğin hangi katmanları etkileyeceğini kestirebilmek.

### 1.2 State / cache / storage ayrımı (kavramsal)
- **Neden:** "Veri kayboldu" tartışmalarının çoğu bu katmanların karıştırılmasından çıkar.
- **LogWise örneği:** React state ≠ React Query cache ≠ localStorage ≠ SecureStore ≠ guest storage ≠
  Supabase.
- **İncele:** [04-DATA-AND-STATE §1](04-DATA-AND-STATE.md), [12-GLOSSARY](12-GLOSSARY.md).
- **Minimum seviye:** Her katmanın "ne kadar kalıcı" olduğunu söyleyebilmek.
- **Gerekmeyen:** zustand/React Query iç implementasyonu.
- **Tamamlanma:** "Bu veri uygulama kapanınca kalır mı?" sorusunu her katman için yanıtlamak.
- **3 soru:** (1) RQ cache kapanınca kalır mı? (2) Web ana verisi localStorage'da mı? (3) Misafir
  verisi nerede?
- **Claude promptu:** *"Mobil bir set kaydının geçtiği her depolama katmanını sırayla göster."*
- **Sonra:** Bir veri-kaybı riskinin gerçek mi yoksa cache yanılgısı mı olduğunu ayırt etmek.

### 1.3 Web ve mobil veri modeli farkı
- **Neden:** LogWise'ın en temel mimari gerçeği; çoğu risk buradan doğar.
- **LogWise örneği:** Web `user_data` blob ↔ mobil `app_*` normalize; köprü yalnız tespit.
- **İncele:** [04](04-DATA-AND-STATE.md), [06 §2](06-DATABASE-AND-AUTH.md).
- **Minimum seviye:** İki ayrı veri evreni olduğunu ve web→mobil taşıma olmadığını bilmek.
- **Gerekmeyen:** SQL kolon tipleri ezbere.
- **Tamamlanma:** "Web'de eklediğim antrenman mobilde görünür mü?" → "Hayır, ayrı modeller" diyebilmek.
- **3 soru:** (1) İki şema neden ayrı? (2) `user_data` köprüsü ne yapar? (3) Gerçek migration hangisi?
- **Claude promptu:** *"Web ve mobilde 'program oluşturma'nın ayrı ayrı nerede kodlandığını göster."*
- **Sonra:** "Web–mobil veriyi birleştirelim mi?" kararını bilinçli vermek.

### 1.4 Git: status / diff / commit / branch / worktree
- **Neden:** AI'ın yaptığını görmek ve geri almak için.
- **LogWise örneği:** Bu audit `docs/project-understanding` dalında; `git status --short`.
- **İncele:** [12-GLOSSARY](12-GLOSSARY.md) Git bölümü, `AGENTS.md §3.4-3.5`.
- **Minimum seviye:** Değişeni görmek, commit'i okumak, dalı/worktree'yi ayırt etmek.
- **Gerekmeyen:** Rebase/cherry-pick ustalığı.
- **Tamamlanma:** Bir AI değişikliğinden sonra `git diff`'i okuyup "ne değişti" diyebilmek.
- **3 soru:** (1) `status` neyi gösterir? (2) Hangi dalın deploy olduğunu nasıl bilirsin? (3) Worktree
  neden var?
- **Claude promptu:** *"Bu dalda master'a göre değişen dosyaları ve her birinin neyi etkilediğini özetle."*
- **Sonra:** Bir değişikliği güvenle onaylamak veya geri almak.

### 1.5 Yapay zekâ planını ve diff'ini inceleme
- **Neden:** Senin asıl işin: planı/diff'i değerlendirmek, körü körüne onaylamamak.
- **LogWise örneği:** Bu üç turluk audit'in kendisi (plan → tur → doğrulama raporu).
- **İncele:** Her dokümanın `DOĞRULANDI/ÇIKARIM/BELİRSİZ` etiketleri.
- **Minimum seviye:** "Kanıt nerede?" + "etki sınırı ne?" sorularını sormak.
- **Gerekmeyen:** Kodu satır satır yazabilmek.
- **Tamamlanma:** Bir planda kanıtsız iddiayı ve kapsam dışı dokunuşu fark etmek.
- **3 soru:** (1) Bu iddianın dosya kanıtı var mı? (2) Değişiklik sınırı korunmuş mu? (3) Hangi
  varsayım `BELİRSİZ`?
- **Claude promptu:** *"Bu planın her adımı için kanıt dosyasını ve dokunacağı katmanı belirt; kanıtsız
  varsayımları işaretle."*
- **Sonra:** "Bu planı uygula / daralt / reddet" kararını gerekçeyle vermek.

---

## GRUP 2 — Sonraki büyük özellikten önce

### 2.1 Bir kullanıcı akışını UI'dan database'e takip etme
- **Neden:** Özellik eklerken/değiştirirken zinciri görmek şart.
- **LogWise örneği:** Set kaydı: `SetRow` → `useAddSet` → `data-bridge` → `app_sets`.
- **İncele:** [05-CORE-USER-FLOWS](05-CORE-USER-FLOWS.md) (sequence diyagramları).
- **Minimum seviye:** UI→hook→bridge→DB zincirini bir akış için izleyebilmek.
- **Gerekmeyen:** Her hook'un tüm parametreleri.
- **Tamamlanma:** Bir akışı kendi cümlelerinle uçtan uca anlatmak.
- **3 soru:** (1) Optimistic update nerede? (2) Guest dalı nerede ayrılıyor? (3) Hata olunca ne olur?
- **Claude promptu:** *"'Workout silme' akışını UI'dan Supabase'e kadar adım adım, dosya isimleriyle çıkar."*
- **Sonra:** Yeni bir özelliğin hangi katmanlara dokunacağını planlamak.

### 2.2 Codegen ve kanonik kaynak
- **Neden:** Yanlış dosyayı düzenlersen (generated) değişiklik kaybolur.
- **LogWise örneği:** `data/presets-exercises.json` (kanonik) → `.js`/`.ts` (generated).
- **İncele:** [02 §4](02-SYSTEM-ARCHITECTURE.md), [03 §4](03-REPOSITORY-GUIDE.md), `scripts/check-codegen.js`.
- **Minimum seviye:** Kanonik/generated/wrapper ayrımı + `check-codegen` ne yapar.
- **Gerekmeyen:** Generator script'inin iç algoritması.
- **Tamamlanma:** "Bu dosyayı elle düzenleyebilir miyim?" sorusunu doğru yanıtlamak.
- **3 soru:** (1) Hangi JSON kanonik? (2) `presets-programs` neden drift riski? (3) `--check` ne işe yarar?
- **Claude promptu:** *"Bir preset egzersiz eklemek için hangi dosyayı düzenlemeliyim ve hangi komutu çalıştırmalıyım?"*
- **Sonra:** "Bu ortak veriyi codegen'e alalım mı?" kararı.

### 2.3 Typecheck / test / build farkı
- **Neden:** Bunlar farklı şeyleri yakalar; hangisinin ne dediğini bilmelisin.
- **LogWise örneği:** `tsc` (tip) ≠ jest (davranış, **boş**) ≠ codegen `--check` (veri).
- **İncele:** [09-QUALITY-TESTING](09-QUALITY-TESTING.md).
- **Minimum seviye:** Her kapının neyi yakaladığını + LogWise'ta hangisinin gerçekten çalıştığını bilmek.
- **Gerekmeyen:** Jest/tsconfig ince ayarları.
- **Tamamlanma:** "Yeşil typecheck = doğru çalışıyor mu?" → "Hayır, sadece tip" diyebilmek.
- **3 soru:** (1) LogWise'ta kaç test var? (2) CI neyi çalıştırır? (3) Typecheck davranışı test eder mi?
- **Claude promptu:** *"LogWise'ta hangi kalite kapıları otomatik, hangileri manuel? Eksikleri listele."*
- **Sonra:** "Bu özelliğe test isteyeyim mi?" kararı.

---

## GRUP 3 — Production öncesi öğren

### 3.1 Supabase Auth ve RLS
- **Neden:** LogWise'ın güvenliği tamamen RLS'e bağlı; yanlış policy = veri sızıntısı.
- **LogWise örneği:** `user_data_select_public` (public blob okuma), `app_*` owner-only.
- **İncele:** [06-DATABASE-AND-AUTH §3](06-DATABASE-AND-AUTH.md).
- **Minimum seviye:** "Bu tabloyu kim okuyabilir?" sorusunu policy'den okumak.
- **Gerekmeyen:** PostgreSQL ileri SQL.
- **Tamamlanma:** Bir tablonun public mi owner-only mu olduğunu söyleyebilmek.
- **3 soru:** (1) anon key gizli mi? (2) `user_prs` kimler okur? (3) Client kontrolü güvenlik mi?
- **Claude promptu:** *"LogWise'ta herkese açık (public select) tüm tabloları ve riskini listele."*
- **Sonra:** "Bu veriyi public yapalım mı / RLS'i sıkalım mı?" kararı.

### 3.2 Offline ve sync sınırları
- **Neden:** Kullanıcıya yanlış offline vaadi vermemek + veri kaybını anlamak.
- **LogWise örneği:** Authenticated web, kullanıcı verisini offline olarak kaydedemez (önceden cache
  edilmiş web guest modu ise `localStorage` üzerinden workout verisini ağsız yazabilir — bu authenticated
  web için geçerli değildir); mobil auth offline rollback; çoklu cihaz LWW.
- **İncele:** [07-OFFLINE-AND-SYNC](07-OFFLINE-AND-SYNC.md).
- **Minimum seviye:** "PWA = offline-first değil" + çoklu-cihaz riskini bilmek.
- **Gerekmeyen:** Service worker API detayı.
- **Tamamlanma:** Bir kullanıcının "uçakta kaydettim, gitti" şikayetini açıklayabilmek.
- **3 soru:** (1) Web offline kaydeder mi? (2) Offline queue var mı? (3) İki cihaz çakışırsa ne olur?
- **Claude promptu:** *"İki cihazda aynı hesapla çalışınca hangi veri kaybı senaryoları oluşur?"*
- **Sonra:** "Offline desteği ekleyelim mi, önceliği ne?" kararı.

### 3.3 Release ve rollback
- **Neden:** Yayını yapmak ve sorun çıkınca geri almak senin sorumluluğun.
- **LogWise örneği:** Web Cloudflare; mobil EAS build/submit/OTA; `PRODUCTION-CHECKLIST.md`.
- **İncele:** [08-BUILD-DEPLOY-OPERATIONS](08-BUILD-DEPLOY-OPERATIONS.md).
- **Minimum seviye:** Her platformun yayın + geri alma yolunu kabaca bilmek.
- **Gerekmeyen:** EAS/Cloudflare ileri konfig.
- **Tamamlanma:** "Bu sürümü nasıl yayınlarım, bozulursa nasıl dönerim?" yanıtı.
- **3 soru:** (1) SW cache bump neden önemli? (2) OTA ile binary farkı? (3) CI deploy yapıyor mu?
- **Claude promptu:** *"Mobil bir hotfix'i OTA ile nasıl yayınlarım; binary gerektiren değişiklik ne?"*
- **Sonra:** "Bu düzeltme OTA mı, yeni build mi?" kararı.

### 3.4 Teknik risk değerlendirme
- **Neden:** Hangi riskin önce çözüleceğine karar vermek.
- **LogWise örneği:** P0-P3 risk listesi (gizlilik, veri kaybı, test boşluğu).
- **İncele:** [10-RISKS-AND-TECHNICAL-DEBT](10-RISKS-AND-TECHNICAL-DEBT.md).
- **Minimum seviye:** Olasılık × etki + "önce doğrula" ayrımını okumak.
- **Gerekmeyen:** Resmî risk metodolojileri.
- **Tamamlanma:** Bir riski P-seviyesiyle gerekçelendirebilmek.
- **3 soru:** (1) En yüksek gizlilik riski hangisi? (2) Hangi risk "canlıda doğrula" gerektirir? (3)
  Test boşluğu neden P1?
- **Claude promptu:** *"LogWise risklerini önce-çöz sırasına koy ve her biri için ilk doğrulama adımını ver."*
- **Sonra:** Sprint önceliklerini riske göre dizmek.

---

## GRUP 4 — İhtiyaç çıkarsa öğren

### 4.1 Worker / R2 medya detayları
- **Neden:** Yalnız resim/medya işine girersen gerekir.
- **LogWise örneği:** `logwise-worker` upload/serve; `media.logwise.fit`.
- **İncele:** [08 §B](08-BUILD-DEPLOY-OPERATIONS.md), `logwise-worker/src/worker.js`.
- **Minimum:** Worker'ın auth + sahiplik mantığı. **Gerekmeyen:** Cloudflare runtime iç detayı.
- **Tamamlanma kriteri:** Avatar yükleme akışını anlatmak. **Claude promptu:** *"Worker bir avatar
  upload'ını nasıl yetkilendirir?"* **Sonra:** "Mobil avatar'ı worker'a bağlayalım mı?" kararı.

### 4.2 React Query optimistic/cache mekaniği (derin)
- **Neden:** Mobil veri/perf işine girersen.
- **LogWise örneği:** `queries/workouts.ts` optimistic + seed cache.
- **İncele:** [05](05-CORE-USER-FLOWS.md), `queries/workouts.ts`. **Minimum:** onMutate/onError/onSuccess
  döngüsü. **Gerekmeyen:** RQ internals. **Tamamlanma:** Bir optimistic mutasyonu izah etmek.
  **Claude promptu:** *"useEnsureWorkoutAndAddSet'in optimistic akışını adım adım açıkla."* **Sonra:**
  Perf/cache değişikliklerini değerlendirmek.

---

## GRUP 5 — Şimdilik öğrenme

Bunlar LogWise'ı yönetmek için **gerekmiyor**; AI bunları üstlenebilir. Zaman/ilgi olursa, yukarıdaki
gruplar bittikten sonra.

- **İleri TypeScript** (generics, conditional types) — kodu okuyabilmek için gerekmez; AI yazar.
- **Native Android/iOS** (Kotlin/Swift, Xcode/Gradle iç detayı) — Expo/EAS soyutluyor.
- **Algoritma/veri-yapısı mülakat konuları** — ürün yönetimiyle ilgisiz.
- **Framework iç yapıları** (React reconciler, Metro/Babel internals, Supabase motoru) — kullanım
  yeterli, iç işleyiş değil.

> **Kural:** Bu bölümdeki bir konu, ancak somut bir LogWise kararını bloke ediyorsa yukarı taşınır —
> "genel kültür" için değil.

---

## Önerilen ilk 5 (sırayla)
1. [03 Repository haritası](03-REPOSITORY-GUIDE.md) (1.1)
2. State/cache/storage ayrımı (1.2) + [04](04-DATA-AND-STATE.md)
3. Web–mobil veri modeli farkı (1.3)
4. Git status/diff/commit (1.4)
5. AI planı/diff inceleme (1.5)
