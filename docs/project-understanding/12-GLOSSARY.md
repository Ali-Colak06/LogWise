# 12 — GLOSSARY (LogWise bağlamında)

> Terimler genel yazılım dersi olarak değil, **LogWise'taki gerçek örnekle** açıklanır.
> Format: **Terim** — basit tanım. *LogWise:* gerçek örnek (`dosya`). *Neden bilmelisin / Bunu
> bilmen yeterli.*

---

## Git & repo

**Repository (repo)** — Projenin tüm kodu + geçmişi olan klasör. *LogWise:* tek repo hem web (kök)
hem mobil (`logwise-mobile/`) hem worker (`logwise-worker/`). *Bilmen yeterli:* "Tek depo, üç
uygulama."

**Worktree** — Aynı reponun farklı dalını ayrı klasörde açma. *LogWise:* `LogWise`=master/mobil,
`LogWise-master`=web/work, `LogWise-audit`=bu inceleme (`AGENTS.md §3.5`). *Bilmen yeterli:* "Aynı
repo, paralel çalışma klasörleri; çakışmayı önler."

**Branch (dal)** — Kodun paralel bir sürümü. *LogWise:* `master` (deploy), `web/work` (web geliştirme).
*Bilmen yeterli:* "Ana sürüm = `master`; iş önce dalda yapılır."

**Commit** — Bir mantıksal değişikliğin kaydı. *LogWise:* `7c47cbd ci: add unified codegen drift check`.
*Bilmen yeterli:* "Geri dönülebilir tek değişiklik birimi."

---

## Uygulama yapısı

**Entry point** — Uygulamanın başladığı dosya. *LogWise:* web `app.html`; mobil `app/_layout.tsx` +
`app/index.tsx`; worker `src/worker.js`. *Bilmen yeterli:* "Akışı buradan izlemeye başla."

**Route** — Bir URL/ekranın eşlemesi. *LogWise:* web `/app`→`app.html` (`netlify.toml`); mobil
`app/(app)/(tabs)/calendar/index.tsx`. *Bilmen yeterli:* "Hangi adres hangi ekranı açar."

**Component (bileşen)** — Tekrar kullanılabilir UI parçası. *LogWise:* mobil `components/day/SetRow.tsx`;
web `components/dash-chart.js`. *Bilmen yeterli:* "Ekranı oluşturan lego parçası."

**State** — Bir anki değişken veri (bellekte). *LogWise:* `useState` (ekran içi). *Bilmen yeterli:*
"Geçici, kapanınca gider."

**Store** — Uygulama geneli paylaşılan state. *LogWise:* mobil `stores/auth-store.ts` (session/mode,
zustand). *Bilmen yeterli:* "Tüm ekranların gördüğü ortak hafıza."

**Hook** — React'te mantığı paylaşan fonksiyon (`use...`). *LogWise:* `hooks/useAuth.ts`,
`useWorkoutsByDate`. *Bilmen yeterli:* "Ekranların kullandığı yeniden-kullanılabilir mantık."

**Query** — Sunucudan veri **okuyan** RQ hook'u. *LogWise:* `useWorkoutsByDate` (`queries/workouts.ts`).
*Bilmen yeterli:* "Veri çekme + cache."

**Mutation** — Veri **değiştiren** RQ hook'u. *LogWise:* `useAddSet`, `useDeleteWorkout`. *Bilmen
yeterli:* "Yazma/silme işlemi."

**React Query cache** — Çekilen verinin bellekte tutulması. *LogWise:* `lib/query-client.ts`
(staleTime 60s, in-memory). *Bilmen yeterli:* "Aynı veriyi tekrar tekrar çekmemek için geçici depo;
uygulama kapanınca gider."

**Optimistic update** — Sunucu cevabını beklemeden UI'ı hemen güncelleme. *LogWise:* `useAddSet`
`onMutate` (kart anında dolar). *Bilmen yeterli:* "Hızlı görünür; başarısızsa geri alınır."

**Rollback** — Başarısız işlemde önceki duruma dönme. *LogWise:* mutasyon `onError`
(`restoreSnapshot`). *Bilmen yeterli:* "Hata olunca eski hale dön."

**Cache invalidation** — Cache'i bayatladı işaretleyip tazeleme. *LogWise:* `useSkipExerciseForDay`
`onSettled` `invalidateQueries`. *Bilmen yeterli:* "Eski veriyi at, yeniden çek."

**Derived data (türetilmiş)** — Ham veriden hesaplanan, saklanmayan değer. *LogWise:* `computeDashboard`
(`lib/dashboard.ts`), `calcCompliance`. *Bilmen yeterli:* "Depolanmaz, her seferinde hesaplanır."

---

## Supabase & veritabanı

**Supabase** — Hazır backend (DB + auth + API). *LogWise:* tek proje `hfmqywyfnqmpvskkzksv`
(`lib/db.js`, `lib/supabase.ts`). *Bilmen yeterli:* "Veritabanı + giriş sistemi, hazır servis."

**Auth session** — Giriş yapmış kullanıcının kimlik oturumu. *LogWise:* mobil SecureStore'da token
(`lib/supabase.ts`); `auth.users` ortak. *Bilmen yeterli:* "Kimsin + giriş açık mı bilgisi."

**Anon key** — İstemciye gömülü public anahtar. *LogWise:* `lib/db.js` + `app.json extra`. *Bilmen
yeterli:* "Gizli değil; güvenlik RLS'e bağlı."

**Service role** — Tüm RLS'i atlayan gizli yönetici anahtarı. *LogWise:* **repoda yok** (olmamalı).
*Bilmen yeterli:* "Asla istemciye/koda koyma."

**RLS (Row Level Security)** — Her satıra "kim görebilir/yazabilir" kuralı. *LogWise:*
`supabase_setup.sql` her tabloda `enable row level security`. *Bilmen yeterli:* "Asıl güvenlik
burada; doğru kurulmazsa veri sızar."

**Policy** — Belirli bir RLS kuralı. *LogWise:* `app_workouts_select using (auth.uid()=user_id)`;
ama `user_prs` `using(true)` (herkese açık). *Bilmen yeterli:* "Her tabloda ayrı; genelleme yapma."

**RPC** — DB içinde tanımlı çağrılabilir fonksiyon. *LogWise:* `delete_own_account()` (var),
`check_app_username_available` (kodda çağrılır, **SQL'de yok**). *Bilmen yeterli:* "Sunucuda çalışan
özel işlem; repoda tanımlı mı kontrol et."

**SQL schema** — Tabloların yapısı (kolon/tip/kısıt). *LogWise:* `supabase_setup.sql`. *Bilmen
yeterli:* "Verinin iskeleti."

**Migration** — Şemayı adım adım değiştiren versiyonlu dosya. *LogWise:* **yok** — yalnız tek
snapshot SQL. *Bilmen yeterli:* "Şema değişiklik geçmişi; LogWise'ta izlenmiyor (risk)."

**Generated type** — Şemadan üretilen TypeScript tipleri. *LogWise:* `types/database.generated.ts`.
*Bilmen yeterli:* "DB ile kod tip uyumu; güncel mi belirsiz."

**JSON blob** — Tüm veriyi tek JSON alanında tutma. *LogWise:* web `user_data.data` (11 anahtar).
*Bilmen yeterli:* "Web verisi tek torbada; çoklu-cihazda riskli."

**Normalize veri modeli** — Veriyi ilişkili ayrı tablolara bölme. *LogWise:* mobil `app_workouts`+
`app_sets`+`app_programs`. *Bilmen yeterli:* "Mobil verisi düzenli tablolarda."

---

## Ortak veri & codegen

**Canonical source (kanonik kaynak)** — Tek doğruluk noktası, elle düzenlenen. *LogWise:*
`data/presets-exercises.json`, `data/ex-guides.json`. *Bilmen yeterli:* "Asıl kaynak; burayı düzenle."

**Generated output** — Kaynaktan üretilen, elle düzenlenmeyen çıktı. *LogWise:* `data/presets-exercises.js`,
`logwise-mobile/data/generated/*`. *Bilmen yeterli:* "Üretilir; elle dokunma."

**Wrapper** — Generated'ı tip/yardımcıyla sarıp re-export eden dosya. *LogWise:*
`logwise-mobile/data/presets-exercises.ts`. *Bilmen yeterli:* "Veri tutmaz, üretilmişi paketler."

**Codegen drift** — Kaynak değişip çıktının eskimesi (ayrışma). *LogWise:* `scripts/check-codegen.js`
+ CI engeller; ama `presets-programs`/`i18n` **kapsam dışı** → drift riski. *Bilmen yeterli:* "Kaynak
ile çıktı uyuşmazlığı; codegen-dışı kopyalar tehlikeli."

---

## Depolama & offline

**localStorage** — Tarayıcıda kalıcı küçük depo. *LogWise:* web'de oturumsuz (guest) kullanıcının
**ana veri blob'u** `gym-log-v3`, ayrıca tema `gym-log-theme`, dil `gym-log-lang`, `gym-timer`,
`logwise-onboard-done` burada. Authenticated kullanıcının ana verisi ise Supabase `user_data`'da
(`app.html` `isGuest`/`SK`). *Bilmen yeterli:* "Web guest verisi + tema/dil/ayar burada; authenticated ana veri Supabase'de."

**SecureStore** — Mobilde şifreli güvenli depo. *LogWise:* Supabase token'ları (`lib/supabase.ts`,
chunk'lı). *Bilmen yeterli:* "Hassas oturum bilgisi burada."

**Guest storage** — Misafir verisinin yerel deposu. *LogWise:* mobil AsyncStorage `@logwise/guest/*`
(`lib/guest-storage.ts`); web ise oturumsuz kullanıcı için `localStorage["gym-log-v3"]`
(`app.html` `isGuest`). *Bilmen yeterli:* "Misafir verisi sadece cihazda (mobil AsyncStorage / web localStorage)."

**Service worker** — Tarayıcıda istekleri yakalayan arka plan scripti. *LogWise:* `sw.js`
(`logwise-v49`, app shell cache). *Bilmen yeterli:* "Statik dosyaları cache'ler; veri senkronu yapmaz."

**PWA** — Web'i app gibi yükleten teknoloji. *LogWise:* `manifest.json` + `sw.js`. *Bilmen yeterli:*
"Ana ekrana eklenir; ama offline-first değil."

**Offline-first** — Çevrimdışı tam çalışıp sonra senkronlama. *LogWise:* **uygulanmadı**
(authenticated web/mobil online; mobil guest yerel; **web guest** önceden yüklenmişse `localStorage`
ile sınırlı offline çalışır ama bulut senkronu yok). *Bilmen yeterli:* "LogWise genel offline-first DEĞİL; yalnız guest yerel veri ağsız tutulur."

**Offline mutation queue** — Çevrimdışı yazıları biriktirip bağlanınca gönderme. *LogWise:* **yok**.
*Bilmen yeterli:* "Offline yazma kaydedilmez/kuyruğa girmez."

**Conflict resolution** — Çakışan değişiklikleri çözme. *LogWise:* **yok**. *Bilmen yeterli:* "Çakışma
yönetimi yok."

**Last-write-wins (LWW)** — Son yazan kazanır (eski ezilir). *LogWise:* örtük; web blob'da tüm-gün
kaybı olası. *Bilmen yeterli:* "İki cihaz çakışırsa biri silinir."

---

## Deploy & platform

**Netlify** — Statik site barındırma servisi. *LogWise:* `netlify.toml` repo'da var ama
`AGENTS.md §4` haritasında yer almaz ve `_redirects` ile çelişir → **legacy görünür** (`ESKİ OLABİLİR`).
*Bilmen yeterli:* "Repo'da eski kalıntı gibi; routing otoritesi Cloudflare `_redirects`/`_headers`; canlı platform repodan kesinleşmez."

**Cloudflare Worker** — Cloudflare'de çalışan küçük sunucu fonksiyonu. *LogWise:* `logwise-worker`
(resim API). *Bilmen yeterli:* "Resim yükle/sun/sil servisi."

**R2** — Cloudflare'in dosya/obje deposu (S3 benzeri). *LogWise:* `LOGWISE_IMAGES` bucket
(`wrangler.toml`) + `media.logwise.fit`. *Bilmen yeterli:* "Görsellerin saklandığı yer."

**Expo** — React Native uygulamasını kolaylaştıran araç seti. *LogWise:* `logwise-mobile` Expo SDK 54.
*Bilmen yeterli:* "Mobil uygulamanın çatısı."

**Expo Router** — Dosya-tabanlı mobil navigasyon. *LogWise:* `app/` ağacı. *Bilmen yeterli:* "Dosya
yapısı = ekran yapısı."

**Expo Go** — Hazır test uygulaması (dev). *LogWise:* `npm start`. *Bilmen yeterli:* "Hızlı önizleme;
ama tüm native modüller çalışmaz."

**Development build** — Native modülleri içeren özel test derlemesi. *LogWise:* `eas build --profile
development`. *Bilmen yeterli:* "Gerçek özelliklerle test için."

**EAS Build** — Expo'nun bulut derleme servisi. *LogWise:* `eas.json` (development/preview/production).
*Bilmen yeterli:* "App store'a giden derlemeyi bulutta üretir."

**Production build** — Mağazaya yüklenecek final derleme. *LogWise:* `eas build --profile production`
(Android app-bundle). *Bilmen yeterli:* "Yayın sürümü."

**Sentry** — Çökme/hata izleme servisi. *LogWise:* mobil crash-only (`lib/sentry.ts`); web'de **yok**.
*Bilmen yeterli:* "Mobil çökmeleri raporlar; web'de izleme yok."

---

## Kalite

**Typecheck** — TypeScript tip doğrulaması. *LogWise:* `tsc -p tsconfig.check.json --noEmit` (manuel,
CI'de değil). *Bilmen yeterli:* "Tip hatalarını yakalar; otomatik zorlanmıyor."

**Unit test** — Tek fonksiyonu izole test. *LogWise:* altyapı var (jest) ama `__tests__/` **boş**.
*Bilmen yeterli:* "Şu an hiç yok."

**Integration test** — Birden çok parçayı birlikte test. *LogWise:* **yok**. *Bilmen yeterli:* "Yok."

**CI (Continuous Integration)** — Push'ta otomatik kontrol. *LogWise:* `codegen-check.yml` (yalnız
codegen drift). *Bilmen yeterli:* "Tek otomatik kapı codegen; test/typecheck CI'de yok."

**Rollback (deploy)** — Yayını önceki sürüme döndürme. *LogWise:* git revert + redeploy / OTA geri
alma (yazılı prosedür yok). *Bilmen yeterli:* "Sorunlu yayını geri alma; süreç netleşmeli."

**Feature parity** — İki platformun aynı özelliği taşıması. *LogWise:* web'de sosyal + 1RM var,
mobilde yok → parity eksik. *Bilmen yeterli:* "Web ve mobil her şeyi aynı yapmaz."
