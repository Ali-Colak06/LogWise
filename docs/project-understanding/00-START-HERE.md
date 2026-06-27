# 00 — START HERE: LogWise'a Tek Sayfada Bakış

> **Bu set nedir?** LogWise'ı *teknik ürün sahibi* seviyesinde anlamak için kod üzerinden
> doğrulanmış, modüler bir referans. Her iddia bir etiket taşır:
> **`DOĞRULANDI`** (kodda görüldü) · **`ÇIKARIM`** (koddan makul çıkarım) ·
> **`BELİRSİZ`** (repodan netleşmedi) · **`ESKİ OLABİLİR`** (terk/şüpheli).
> Kanıt = dosya yolu + sembol adı (satır numarası ikincil; kayabilir).
>
> **Kapsam notu:** Set tamamdır — 14 doküman (`00`–`13`) mevcut. `00`–`03` temel resim;
> `04`–`07` veri/akış/DB/offline; `08`–`13` operasyon/kalite/risk/karar/sözlük/öğrenme. Tüm
> "ileri okuma" linkleri çalışır.

---

## Tek paragrafta sistem

LogWise tek bir Git reposunda **üç** çalışan parça barındırır: **(1) Web** — repo kökünde,
build'siz, `React.createElement` ile yazılmış bir PWA; ürün uygulaması `/app` → `app.html`
monolitinde, landing/SEO sayfaları statik HTML. **(2) Mobil** — `logwise-mobile/` altında
Expo + React Native + TypeScript uygulaması (expo-router). **(3) Worker** — `logwise-worker/`
altında, R2 üzerinde resim yükle/sun/sil yapan bir Cloudflare Worker. Üçü de **aynı Supabase
projesini** (`hfmqywyfnqmpvskkzksv`) kullanır, ama web ile mobil **farklı tablolarda** yaşar.
`DOĞRULANDI` — `AGENTS.md §1`; `app.html`; `logwise-mobile/package.json` (`"main": "expo-router/entry"`);
`logwise-worker/src/worker.js`; `lib/db.js` (`SUPABASE_URL`) ve `logwise-mobile/lib/supabase.ts`.

---

## En önemli 6 kavram

1. **İki istemci, tek proje, iki şema.** Web tablolar: `profiles`, `user_data`, `user_prs`,
   `shared_workouts`, `shared_workout_comments`, `follows`, `feedback`. Mobil tablolar: `app_*`
   (`app_workouts`, `app_sets`, `app_programs`, `app_program_days`, `app_day_meta`,
   `app_exercises`, `app_profiles`). Tek kesişim: `user_data`. `DOĞRULANDI` —
   `.from(...)` kullanımları (`app.html`, `profile.html` ↔ `logwise-mobile/lib/data-bridge.ts`).

2. **Web = tek JSON blob; Mobil = normalize tablolar.** Web tüm kullanıcı verisini tek nesnede
   tutar (11 anahtar: `exercises/workouts/programs/...`). **Authenticated** web kullanıcısının ana
   verisi **yalnız** `user_data` Supabase tablosundadır (debounced upsert); **oturumsuz (guest)**
   kullanıcının (`isGuest = !user`) aynı verisi `localStorage["gym-log-v3"]` blob'undadır. Ayrıca tema
   (`gym-log-theme`) ve dil (`gym-log-lang`) tüm kullanıcılarda localStorage'da tutulur; `gym-timer`
   ve `logwise-onboard-done` da kullanılır. SW + localStorage bulunması authenticated web'i
   **offline-first YAPMAZ** (bkz. [07](07-OFFLINE-AND-SYNC.md)).
   Mobil aynı kavramları ayrı ilişkisel tablolara böler — "aynı ürün, bambaşka veri modeli".
   `DOĞRULANDI` — `lib/data-schema.js` (`init`, `migrateData`); `app.html` (`.from("user_data")`,
   `debouncedSave`, `isGuest`, `localStorage[SK="gym-log-v3"]`, `TK="gym-log-theme"`, `LK="gym-log-lang"`).

3. **Gerçekten paylaşılan tek şey: 2 kanonik JSON + codegen.** `data/presets-exercises.json` ve
   `data/ex-guides.json` kanonik kaynaktır; generator'lar bunlardan **hem** web JS **hem** mobil TS
   üretir. Başka her şey platforma özel kopya/kod. `DOĞRULANDI` — `scripts/build-presets-exercises.js`,
   `scripts/build-ex-guides.js`, `scripts/check-codegen.js`.

4. **Guest (misafir) modu hem mobilde hem webde vardır (ayrı implementasyonlar).** Mobil misafir
   verisi AsyncStorage'da (`@logwise/guest/*`) tutulur, Supabase'e hiç gitmez; tüm mobil sorgular
   mode-aware bir köprüden geçer. Web'de oturumsuz kullanıcı (`isGuest = !user`) misafir sayılır ve
   verisi `localStorage["gym-log-v3"]` blob'undadır. `DOĞRULANDI` —
   `logwise-mobile/lib/data-bridge.ts` (`useDataCtx`, `ctx.mode === 'guest'`),
   `logwise-mobile/lib/guest-storage.ts`; web `app.html` (`isGuest`, `SK`).

5. **Web SPA "monolit"tir.** Tüm view'lar tek `app.html` içinde `setView(...)` ile değişir
   (`calendar`, `day`, `dashboard`, `exercises`, `programs`, `social`, `feedback`, `data`).
   View'ları ayrı dosyalara çıkarma (Aşama 3) **henüz yapılmadı**. `DOĞRULANDI` — `app.html`
   (`setView`, `view ===`); `AGENTS.md §8` ("Aşama 3 ... henüz başlamadı").

6. **Sosyal özellikler web'de canlı, mobilde ertelenmiş.** Web'de `social` view + `share.html` +
   `program.html` + `follows`/`shared_workouts` tabloları var; mobilde `social` sekmesi route'ta
   kayıtlı ama **bar'da gizli** (v2'ye ertelendi). `DOĞRULANDI` — `logwise-mobile/app/(app)/(tabs)/_layout.tsx`
   ("social ... bar'da GİZLİ"); web `.from("follows")`, `share.html`.

---

## Önerilen okuma sırası

| Sıra | Doküman | Ne zaman |
|---|---|---|
| 1 | **00** (bu dosya) | İlk gün, genel resim |
| 2 | **[01-PRODUCT-MAP](01-PRODUCT-MAP.md)** | "Ürün ne yapıyor, web↔mobil farkı ne" |
| 3 | **[02-SYSTEM-ARCHITECTURE](02-SYSTEM-ARCHITECTURE.md)** | Parçalar nasıl bağlanıyor (diyagramlı) |
| 4 | **[03-REPOSITORY-GUIDE](03-REPOSITORY-GUIDE.md)** | "Şu dosya ne işe yarar" |
| 5 | **[04-DATA-AND-STATE](04-DATA-AND-STATE.md)** | Hangi veri nerede yaşıyor (katmanlar) |
| 6 | **[05-CORE-USER-FLOWS](05-CORE-USER-FLOWS.md)** | Akışlar UI→DB (sequence diyagramları) |
| 7 | **[06-DATABASE-AND-AUTH](06-DATABASE-AND-AUTH.md)** | Şema + RLS + auth + worker token |
| 8 | **[07-OFFLINE-AND-SYNC](07-OFFLINE-AND-SYNC.md)** | Offline/sync sınırları (PWA ≠ offline-first) |
| 9 | **[08-BUILD-DEPLOY-OPERATIONS](08-BUILD-DEPLOY-OPERATIONS.md)** | Build/deploy/rollback (web/worker/mobil) |
| 10 | **[09-QUALITY-TESTING](09-QUALITY-TESTING.md)** | Kalite kapıları + test boşlukları |
| 11 | **[10-RISKS-AND-TECHNICAL-DEBT](10-RISKS-AND-TECHNICAL-DEBT.md)** | P0–P3 risk envanteri |
| 12 | **[11-DECISION-HISTORY](11-DECISION-HISTORY.md)** | Önemli kararlar + gerekçe |
| 13 | **[12-GLOSSARY](12-GLOSSARY.md)** | Terimler (LogWise örnekleriyle) |
| 14 | **[13-LEARNING-BACKLOG](13-LEARNING-BACKLOG.md)** | Proje sahibi öğrenme planı |

İlk teknik derinlik için kod sırası: `lib/db.js` & `lib/data-schema.js` (web veri) →
`logwise-mobile/lib/data-bridge.ts` (mobil veri) → `scripts/check-codegen.js` (ortak veri) →
`app.html` (web monolit) → `logwise-mobile/app/` (mobil router).

---

## En ciddi riskler ve belirsizlikler (özet — detay: [10-RISKS-AND-TECHNICAL-DEBT](10-RISKS-AND-TECHNICAL-DEBT.md))

- **Codegen-DIŞI paralel kopya driftı.** `presets-programs` (web `data/presets-programs.js` ↔ mobil
  `logwise-mobile/data/presets-programs.ts`, açıkça "port") ve `i18n` (web `.js` ↔ mobil `.ts`)
  elle senkronlanır, `check-codegen` kapsamında **değildir** → sessizce ayrışabilir. `DOĞRULANDI` —
  `scripts/check-codegen.js` (`CHECKS` yalnızca presets-exercises + ex-guides); mobil dosya başlığı
  "Web `data/presets-programs.js` port".
- **Web↔mobil köprüsü = tespit, taşıma DEĞİL.** Mobil, web kullanıcısını yalnız `user_data` satır
  **sayısıyla** saptar (`countWebUserData`) ve bir karşılama modalı gösterir; web blob'unu `app_*`'a
  **aktarmaz** (web→mobil veri migration'ı YOK). Gerçek migration ayrı şeydir: mobil **guest**
  verisinin authenticated hesaba aktarımı (`migrateGuestToAccount`). `DOĞRULANDI` —
  `logwise-mobile/lib/data-bridge.ts` (`countWebUserData`), `components/auth/WebUserWelcomeModal.tsx`,
  `logwise-mobile/lib/migration.ts`.
- **Gizlilik — `user_data_select_public` policy'si.** `supabase_setup.sql`'de public profilli
  kullanıcının **tüm `user_data` blob'unu** (antrenman/program geçmişi) herkese açan bir SELECT
  policy'si var. `DOĞRULANDI` (repo SQL); canlıda aktif mi `BELİRSİZ` → eşleşirse ciddi gizlilik
  riski. Detay: [06 §3](06-DATABASE-AND-AUTH.md), [10/R1](10-RISKS-AND-TECHNICAL-DEBT.md).
- **Guest→hesap migration atomik değil + duplicate riski.** `migrateGuestToAccount` DB transaction
  kullanmaz; yarıda hata → kısmi cloud insert + guest temizlenmez → retry duplikasyonu. `DOĞRULANDI`
  — [05 §17](05-CORE-USER-FLOWS.md), [10/R5-R6](10-RISKS-AND-TECHNICAL-DEBT.md).
- **Web çoklu-cihaz blob ezişmesi + offline yazma kaybı.** `user_data` tek-blob upsert (LWW) +
  offline'da Supabase 503. `DOĞRULANDI` — [07](07-OFFLINE-AND-SYNC.md), [10/R2-R3](10-RISKS-AND-TECHNICAL-DEBT.md).
- **Sıfır otomatik test + repo SQL ≠ canlı garanti.** `__tests__/` boş; CI yalnız codegen;
  `check_app_username_available` RPC kodda çağrılır ama SQL'de yok. `DOĞRULANDI` —
  [09](09-QUALITY-TESTING.md), [06 §6](06-DATABASE-AND-AUTH.md).
- **Şüpheli/terk dosyalar.** `landing_page_tr_localized.html` (1.5 MB, hiçbir yerden referanssız),
  `logwise-mobile/data/*.bak.adim8`, boş/duplicate `local-server*.bat`. `ESKİ OLABİLİR` —
  referans taraması (`grep`) sonuçsuz.
- **`app.html` monolit boyutu** (~293 KB tek dosya) bakım/parçalama riski taşır; Aşama 3 bekliyor.
  `DOĞRULANDI` — dosya boyutu; `AGENTS.md §8`.

---

## Hızlı gerçekler kartı

| Konu | Değer | Kanıt |
|---|---|---|
| Prod URL | https://logwise.fit | `AGENTS.md §1` `DOĞRULANDI` |
| Supabase projesi | `hfmqywyfnqmpvskkzksv` (tek, ortak) | `lib/db.js`, `logwise-mobile/lib/supabase.ts` `DOĞRULANDI` |
| Web build | Yok (build'siz, CDN UMD) | `AGENTS.md §3.1`; kökte `package.json` yok `DOĞRULANDI` |
| Mobil stack | Expo SDK 54, RN 0.81, React 19, expo-router 6 | `logwise-mobile/package.json` `DOĞRULANDI` |
| Mobil state | TanStack Query + zustand + guest AsyncStorage | `lib/query-client.ts`, `stores/auth-store.ts` `DOĞRULANDI` |
| SW cache | `logwise-v49` | `sw.js` (`CACHE_NAME`) `DOĞRULANDI` |
| CI | `.github/workflows/codegen-check.yml` (codegen drift) | dosya mevcut `DOĞRULANDI` |
| Worker (upload) | Avatar/foto upload API (`…workers.dev`); egzersiz medyası ayrı `media.logwise.fit` (read-only) | `logwise-worker/src/worker.js`, `profile.html` (`WORKER_URL`) `DOĞRULANDI` |
