# 08 — BUILD, DEPLOY & OPERATIONS

> Etiketler: `DOĞRULANDI` / `ÇIKARIM` / `BELİRSİZ` / `ESKİ OLABİLİR`. Kanıt = dosya + sembol.
> Komut etiketleri: **[Repo]** repository'de tanımlı · **[Doküman]** bir dokümanda önerilmiş ·
> **[Çıkarım]** standart araçtan çıkarım · **[Doğrulanamaz]** repository'den doğrulanamıyor.

---

## A. WEB

### Build modeli
**Build adımı YOKTUR.** Kökte `package.json` yok; tarayıcı `app.html`'in `<script src>`'lerini
doğrudan yükler (`window.LOGWISE_*`). React/Supabase/Chart.js CDN UMD. `DOĞRULANDI` — `AGENTS.md §3.1`
("Web için build aracı yoktur"), kökte `package.json` yok. → **npm build komutu önerme.**

### Deployment
- **Repo-otoritatif hedef: Cloudflare.** `wrangler.jsonc` (`name: "logwise"`, `assets.directory: "."`,
  `compatibility_flags: ["nodejs_compat"]`, `observability.enabled`) → repo kökü statik asset olarak
  servis edilir; `_redirects`/`_headers` dosya başlıkları açıkça "Cloudflare Pages" der. `DOĞRULANDI` —
  `wrangler.jsonc`, `_redirects`, `_headers`; `AGENTS.md §1` ("Cloudflare üzerinde yayınlanan"), `§4`
  dosya haritası (`netlify.toml`'u anmaz).
- **`.assetsignore`** mobil/iç kaynakları bu asset deploy'undan çıkarır. `DOĞRULANDI`.
- **`netlify.toml` repo'da mevcut ama legacy görünür:** `AGENTS.md §4` haritasında yer almaz ve
  routing'i `_redirects` ile **çelişir** (aşağıya bakın) → güncel/otoritatif config değil. `ESKİ OLABİLİR`.
- **Canlı production'ın gerçekten hangi platformda koştuğu repodan kesinleşmez** (ağ/panel
  doğrulaması gerekir); herhangi bir config dosyasının varlığı tek başına aktiflik kanıtı değildir.
  `BELİRSİZ`.

### `/app` → `app.html` ve yönlendirmeler
- **Otorite `_redirects` (Cloudflare)**: `/app/*`→`app.html` (200); SPA route'ları `/social`,
  `/dashboard`, `/feedback`, `/data` → `app.html` (200); **`/exercises` → `/library/exercises` (301)**
  ve **`/programs` → `/library/programs` (301)** (SEO Library'ye, app'e DEĞİL); eski blog/guides
  URL'leri → `learn`/`ogren`/`library` (301); `/kutuphane/*` → `/library/*` (200 alias). `DOĞRULANDI`.
- **`netlify.toml` (legacy, çelişik)**: `/exercises`,`/programs`'ı `/app.html`'e (200) yönlendirir —
  bu, `_redirects` ile **çelişir** ve repo'da legacy görünür; **aktif gerçeklik olarak alınmamalı**.
  `ESKİ OLABİLİR`.
- `_headers` (Cloudflare): `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Cache-Control` (sw.js + `*.html` + `/` `no-cache`). `DOĞRULANDI` — `_headers`.

### Service worker versiyonlama + cache
- `sw.js` `CACHE_NAME='logwise-v49'`; `PRECACHE_URLS` = app shell + statik + CDN. Yeni statik dosya
  eklenince **CACHE_NAME bump + PRECACHE'e ekleme zorunlu** (yoksa eski kullanıcı yeni dosyayı almaz).
  `DOĞRULANDI` — `sw.js`; reçete `docs/SW-VERSION-BUMP.md`, `AGENTS.md §3.3`.
- Fetch stratejisi: HTML navigate = network-first→cache; statik = cache-first; Supabase = network-first
  →503. `DOĞRULANDI` — `sw.js`.

### Statik SEO/blog/programmatic üretim scriptleri
| Script | Çıktı | Etiket |
|---|---|---|
| `scripts/build-blog.js` | `blog-content/*.md` → `learn/*.html` + `ogren/*.html` + hreflang + landing kart | **[Repo]** `DOĞRULANDI` |
| `scripts/build-programmatic-seo.js` | `data/*.js` → `library.html` + `library/{exercises,programs}.html` + nested | **[Repo]** `DOĞRULANDI` |
| `scripts/build-presets-exercises.js` / `build-ex-guides.js` | kanonik JSON → web+mobil çıktı | **[Repo]** `DOĞRULANDI` |
| `scripts/check-codegen.js` | codegen drift `--check` | **[Repo]** + CI `DOĞRULANDI` |
| `node --check <path>` | web JS syntax kapısı | **[Doküman]** `AGENTS.md §6` `DOĞRULANDI` |

### Environment / config (web)
- Supabase `SUPABASE_URL` + `SUPABASE_ANON_KEY` **hardcoded** `lib/db.js`'de (env yok). anon key
  client'ta — güvenlik RLS'e bağlı. `DOĞRULANDI`.
- Cloudflare proje ayarları (domain, env) repoda yok. `Doğrulanamaz`.

### Yayın sonrası doğrulama · Rollback · Production hatası
- **Doğrulama:** `AGENTS.md §6` — `node --check`, `node scripts/check-codegen.js`, etkilenen view'ı
  render. **[Doküman]** `DOĞRULANDI`. Canlı smoke (URL açma) repoda otomatik değil. `Çıkarım`.
- **Rollback:** Git revert + yeniden deploy (Cloudflare). Repoda yazılı rollback prosedürü yok.
  `Çıkarım`/`Doğrulanamaz`.
- **Production hatası → nereye bak:** Supabase logs (sorgu/RLS), tarayıcı console, SW cache
  (`CACHE_NAME` eski mi). **Web'de hata izleme/Sentry YOK** (Sentry sadece mobil). `DOĞRULANDI` —
  web kodunda Sentry referansı yok.

---

## B. CLOUDFLARE WORKER (resim API)

- **Entry:** `logwise-worker/src/worker.js` (`export default { fetch }`). `DOĞRULANDI`.
- **R2:** `wrangler.toml` `[[r2_buckets]] binding=LOGWISE_IMAGES bucket=logwise-images`. `DOĞRULANDI`.
- **Auth:** Yazma için `Authorization: Bearer` → `verifyWithSupabase` → Supabase `/auth/v1/user`
  (anon key ile). Sahiplik `avatars/<uid>/` | `workouts/<uid>/`. 5 MB limit. GET public. `DOĞRULANDI`.
- **Env/secret sınırları:** `wrangler.toml` yorumu `wrangler secret put` ile: `SUPABASE_JWT_SECRET`,
  `WORKER_URL`, `ALLOWED_ORIGIN`. ⚠️ **Tutarsızlık:** `worker.js` aslında `env.SUPABASE_URL` +
  `env.SUPABASE_ANON_KEY` kullanır (JWT secret değil) → yorum/kod **uyuşmuyor**. `DOĞRULANDI`
  (kod ↔ wrangler yorum farkı).
- **Deploy/rollback:** `wrangler deploy` / `wrangler rollback` (standart). **[Çıkarım]** — repoda
  worker deploy script'i/CI yok.
- **Aktif kullanım:** **Web `profile.html`** upload worker'ına (`WORKER_URL =
  "https://logwise-images-worker.colak-ali1928.workers.dev"`) avatar yazar → kullanımda. **Mobilde
  worker çağrısı bulunamadı** (avatar yükleme mobilde henüz bağlı değil). `DOĞRULANDI` (web) /
  `BELİRSİZ` (mobil).
- **Ayrı medya yüzeyi:** `media.logwise.fit` (read-only R2, GET/HEAD CORS — `r2-exercise-media-cors.json`)
  egzersiz rehberi medyasını sunar; `scripts/build-ex-guides.js` + `profile.html` referans verir.
  Worker upload API'sinden **farklı** bir okuma yüzeyi. `DOĞRULANDI`.

---

## C. MOBİL (Expo + EAS)

### Çalıştırma / build komutları
| Amaç | Komut | Etiket |
|---|---|---|
| Dev server | `npm start` / `expo start` | **[Repo]** `package.json scripts.start` `DOĞRULANDI` |
| Android/iOS dev | `npm run android` / `npm run ios` | **[Repo]** `DOĞRULANDI` |
| Web (Metro) | `npm run web` | **[Repo]** `DOĞRULANDI` |
| Development build | `eas build --profile development --platform android` | **[Doküman]** `PRODUCTION-CHECKLIST.md` + eas.json `DOĞRULANDI` |
| Preview build | `eas build --profile preview --platform all` | **[Doküman]** `DOĞRULANDI` |
| Production build | `eas build --profile production --platform all` | **[Doküman]** `DOĞRULANDI` |
| Store submit | `eas submit --profile production --platform ios/android` | **[Doküman]** `DOĞRULANDI` |
| OTA update | `eas update --branch production` | **[Doküman]** + `app.json updates.url` `DOĞRULANDI` |

> **Expo Go notu:** Native modüller (`expo-secure-store`, `@sentry/react-native`) Expo Go'da sınırlı;
> gerçek test **development build** ile yapılır. `ÇIKARIM` (plugin listesi + native bağımlılıklar).

### EAS profilleri (`eas.json`)
- `development` (developmentClient, internal, channel development, iOS simulator).
- `preview` (internal, channel preview, Android **apk**).
- `production` (channel production, **autoIncrement**, Android **app-bundle**).
- `submit.production` iOS/Android kimlikleri **placeholder** (`REPLACE_WITH_...`,
  `play-store-service-account.json`). `DOĞRULANDI` — `eas.json`.

### Version / build number
- `app.json` `version: "0.1.0"`; `eas.json` `appVersionSource: "remote"` + production
  `autoIncrement`; `runtimeVersion.policy: "appVersion"`; EAS `projectId`
  `2863f167-...`; OTA `updates.url u.expo.dev/...`. `DOĞRULANDI`.

### Environment / config (mobil)
- Çalışma-zamanı config **`app.json` `extra`'dan** okunur: `supabaseUrl`, `supabaseAnonKey`,
  `sentryDsn` (dolu), `resetPasswordRedirect` (`https://logwise.fit/reset-password`). `DOĞRULANDI` —
  `lib/supabase.ts`, `lib/sentry.ts`, `queries/auth.ts`.
- ⚠️ `.env.example` `EXPO_PUBLIC_SUPABASE_*` listeler ama kod `extra`'dan okur → env örneği
  güncel/uyumlu değil. `DOĞRULANDI` (kod ↔ .env.example farkı).

### Sentry / logging
- `lib/sentry.ts` **crash-only** (`tracesSampleRate:0`, `sendDefaultPii:false`, `beforeSend`
  `__DEV__` drop). DSN yoksa **no-op**; paket yoksa dinamik require + try/catch no-op. Paket
  `@sentry/react-native` **kurulu** (`package.json`), DSN **dolu** (`app.json`). `DOĞRULANDI`.

### Release / rollback / production hatası
- **Release:** EAS build → submit (store) veya OTA (`eas update`). **[Doküman]** `PRODUCTION-CHECKLIST.md`.
- **Rollback:** OTA için önceki update'i yeniden yayınla / channel değiştir; binary için store geri
  alma. Repoda yazılı kesin prosedür yok → `Çıkarım`.
- **Production hatası → nereye bak:** Sentry dashboard (crash-only), EAS build logları, Supabase logs.
  `DOĞRULANDI` (Sentry) / `Çıkarım` (diğer).

---

## D. Operasyon özeti / boşluklar
- **CI yalnız codegen drift** çalıştırır (`.github/workflows/codegen-check.yml`); deploy, typecheck,
  test, lint CI'de **yok**. `DOĞRULANDI`.
- Web ve worker için **otomatik deploy pipeline'ı repoda yok** (manuel). `DOĞRULANDI` (negatif).
- Mobil release tamamen EAS + manuel checklist'e bağlı (`PRODUCTION-CHECKLIST.md`). `DOĞRULANDI`.
