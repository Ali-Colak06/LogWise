# 03 — REPOSITORY GUIDE

> Etiketler: `DOĞRULANDI` / `ÇIKARIM` / `BELİRSİZ` / `ESKİ OLABİLİR`. Kanıt = dosya + sembol.
> Bu rehber `AGENTS.md §4` (dosya haritası) ile **çelişmez, onu tamamlar**: AGENTS "nereye
> dokunayım" sözleşmesi; bu doküman "her parça ne işe yarar + hangi sınıfta" açıklamasıdır.

---

## 1. Entry point'ler (nereden başlar)

| Platform | Entry | Açıklama | Kanıt |
|---|---|---|---|
| Web — ürün | `app.html` | SPA monolit; `/app` rewrite ile sunulur | `_redirects`, `wrangler.jsonc` (Cloudflare) `DOĞRULANDI` |
| Web — landing | `index.html` (`/`), `tr.html` (`/tr`) | Statik SEO | `AGENTS.md §3.2` `DOĞRULANDI` |
| Web — diğer sayfalar | `profile.html`, `share.html`, `program.html`, `reset-password.html`, `404.html` | Bağımsız HTML | dosyalar `DOĞRULANDI` |
| Mobil | `logwise-mobile/app/_layout.tsx` + `app/index.tsx` | `expo-router/entry` → root layout → mode redirect | `package.json` (`"main"`), `app/index.tsx` `DOĞRULANDI` |
| Worker | `logwise-worker/src/worker.js` | `export default { fetch }` | dosya `DOĞRULANDI` |

---

## 2. Web kök — klasör sorumlulukları

| Yol | Sorumluluk | Kanıt |
|---|---|---|
| `data/` | Sabit veri + i18n (React bağımlılığı yok), `window.LOGWISE_*` | `AGENTS.md §3.2` `DOĞRULANDI` |
| `lib/` | Saf fonksiyonlar + DB katmanı (`db.js`, `data-schema.js`, `calc.js`, `exercise-utils.js`, `badge-logic.js`, `profile-utils.js`) | dosyalar `DOĞRULANDI` |
| `components/` | React bileşenleri (`React.createElement`, IIFE + `window.LOGWISE_COMPONENTS`) | `AGENTS.md §3.1` `DOĞRULANDI` |
| `styles/` | `base.css` (app), `landing.css` (statik), `site-nav.css` (public nav) | dosyalar `DOĞRULANDI` |
| `scripts/` | Codegen + blog/SEO build + gif/medya tooling (`vendor/marked.min.js` ile npm'siz) | dosyalar `DOĞRULANDI` |
| `assets/landing/` | Statik landing mockup görselleri | `AGENTS.md §4` `DOĞRULANDI` |
| `blog-content/` | Learn yazıları Markdown kaynağı (TR/EN, `translationKey`) | `AGENTS.md §4` `DOĞRULANDI` |
| `learn/`, `ogren/`, `library/` | **Üretilmiş** statik Learn/Library HTML çıktıları | `scripts/build-blog.js`, `build-programmatic-seo.js` `DOĞRULANDI` |
| `docs/` | Görev reçeteleri + `mobile-design-system/` ürün kararları | `AGENTS.md §2` `DOĞRULANDI` |
| `logwise-worker/` | Cloudflare Worker (R2 resim API) | `worker.js`, `wrangler.toml` `DOĞRULANDI` |
| `logwise-mobile/` | Bağımsız Expo alt projesi (kendi `package.json`/TS/Metro) | `AGENTS.md §3.2` `DOĞRULANDI` |

**Kök config/deploy dosyaları:** `_redirects`, `_headers` (Cloudflare edge routing/headers; dosya
başlıkları "Cloudflare Pages"); `wrangler.jsonc` (Cloudflare web static asset config); `.assetsignore`
(asset deploy filtresi); `netlify.toml` (repo'da bulunur ama `AGENTS.md §4` dosya haritasında yer
almaz ve `_redirects` ile çelişir → **legacy görünür**, `ESKİ OLABİLİR`); `sw.js` + `manifest.json`
(PWA); `supabase_setup.sql` (web + `app_*` şema/RLS); `robots.txt` + `sitemap*.xml` + `sitemap.txt`
(SEO). `DOĞRULANDI` — dosyalar + `AGENTS.md §1, §4`.

---

## 3. Mobil (`logwise-mobile/`) — klasör sorumlulukları

| Yol | Sorumluluk | Kanıt |
|---|---|---|
| `app/` | expo-router rota ağacı: `(auth)`, `(app)/(tabs)`, `program/[id]/edit` | tam ağaç `DOĞRULANDI` |
| `components/` | Ekran bileşenleri: `ui/`, `shared/`, `calendar/`, `day/`, `workout/`, `auth/` | `find components` `DOĞRULANDI` |
| `lib/` | Servisler: `supabase.ts`, `data-bridge.ts`, `guest-storage.ts`, `migration.ts`, `query-client.ts`, `dashboard.ts`, `calc.ts`, `exercise-resolve.ts`, `program.ts`, `account.ts`, `theme-store.ts`, `sentry.ts`, `uuid.ts`, `i18n.ts` | `ls lib` `DOĞRULANDI` |
| `queries/` | TanStack Query hook'ları: `auth/workouts/programs/exercises/profile/dashboard/account.ts` | `ls queries` `DOĞRULANDI` |
| `stores/` | zustand: `auth-store.ts` (mode) | `ls stores` `DOĞRULANDI` |
| `theme/` | Tasarım token'ları + provider (`tokens.ts`, `index.tsx`) | `ls theme` `DOĞRULANDI` |
| `types/` | `database.ts` + **generated** `database.generated.ts` (Supabase tipleri) | `ls types` `DOĞRULANDI` |
| `data/` | i18n + presets + ex-content (bir kısmı **generated/wrapper**, bkz. §4) | `ls data` `DOĞRULANDI` |
| `__tests__/` | Jest testleri | klasör mevcut `DOĞRULANDI` |
| config | `app.json` (Expo + `extra`), `eas.json` (build profilleri), `metro.config.js`, `babel.config.js`, `tsconfig*.json` | dosyalar `DOĞRULANDI` |

---

## 4. Dosya sınıflandırması: KANONİK / GENERATED / WRAPPER / ELLE-PARALEL / ESKİ

Bu, audit'in en kritik ayrımıdır — generated çıktıyı kaynakla karıştırmamak için.

### 4.1 KANONİK kaynak (elle düzenlenir, codegen girdisi)
- `data/presets-exercises.json` — 145 hareket. `DOĞRULANDI` — `build-presets-exercises.js` (`SOURCE_PATH`).
- `data/ex-guides.json` — platform-nötr egzersiz rehberi. `DOĞRULANDI` — `build-ex-guides.js`.

### 4.2 GENERATED çıktı (ELLE DÜZENLENMEZ — JSON'dan üretilir)
- `data/presets-exercises.js` (web) — `window.LOGWISE_PRESET_EXERCISES`. `DOĞRULANDI` — `build-presets-exercises.js` (`WEB_OUTPUT_PATH`).
- `data/ex-guides.js` (web) — başlıkta "AUTO-GENERATED ... Do not edit manually". `DOĞRULANDI`.
- `logwise-mobile/data/generated/presets-exercises.ts`. `DOĞRULANDI` — `MOBILE_OUTPUT_PATH`.
- `logwise-mobile/data/generated/ex-content.ts`. `DOĞRULANDI` — `build-ex-guides.js`.
- `logwise-mobile/types/database.generated.ts` — Supabase'den üretilmiş tipler. `ÇIKARIM` (ad + içerik; üreten komut repoda görünmedi → üretim adımı `BELİRSİZ`).

> **Dikkat — yanıltıcı durum:** `data/presets-exercises.js` başlığında "AUTO-GENERATED" yazmaz
> (yalnızca açıklama yorumu var), ama **yine de generated'dır** (script `WEB_OUTPUT_PATH`'e bu başlığı
> yazar). Banner'ın olmaması "elle dosya" anlamına gelmez. `DOĞRULANDI` — `build-presets-exercises.js`
> (`header` dizisi).

### 4.3 WRAPPER (generated'ı re-export eder, veri tutmaz)
- `logwise-mobile/data/presets-exercises.ts` — generated + tip + `isPresetSlug`. `DOĞRULANDI` — başlık.
- `logwise-mobile/data/ex-descriptions.ts` — `EX_DESCS`, ex-content projection'ından türetilir. `DOĞRULANDI` — başlık.

### 4.4 ELLE-PARALEL (iki platformda ayrı, codegen YOK — DRİFT RİSKİ)
- `data/presets-programs.js` (web) ↔ `logwise-mobile/data/presets-programs.ts` (mobil) — mobil başlığı
  açıkça "Web `data/presets-programs.js` port". `check-codegen` kapsamı dışı; yalnızca
  `build-programmatic-seo.js` web sürümünü **okur** (üretmez). `DOĞRULANDI`.
- `data/i18n-{tr,en}.js` (+ `-profile.js`) ↔ `logwise-mobile/data/i18n-{tr,en}.ts` — ayrı format,
  codegen yok. `DOĞRULANDI`.

### 4.5 ESKİ / ŞÜPHELİ (terk veya kullanılmıyor olabilir — silmeden önce doğrula)
- `landing_page_tr_localized.html` (1.5 MB) — **hiçbir HTML/JS/config'den referans yok**.
  `ESKİ OLABİLİR` — `grep` taraması boş.
- `logwise-mobile/data/i18n-{en,tr,types}.ts.bak.adim8` — `.bak` yedekleri. `ESKİ OLABİLİR` — uzantı.
- `local-server.bat` (0 byte, boş), `local-server (1).bat`, `local-server-mobile.bat` — örtüşen/boş
  yardımcı betikler. `ESKİ OLABİLİR` — boyut/duplicate.
- `gif-mapping.json` (`{}`, boş) — **dead değil**: gif tooling betikleri okur/yazar
  (`scripts/{build-manual-picker,match-exercise-gifs,update-ex-images}.js`, `gif-picker.html`);
  şu an boş durumda bir admin-tooling state dosyası. `BELİRSİZ` (boş ama referanslı).
- `PRESET_PROGRAM_ONERILERI.{md,pdf,html}`, `REFACTOR-GECMISI.md` (338 KB) — kod değil, doküman
  artıkları (REFACTOR-GECMISI canlı tarihsel kayıt). `DOĞRULANDI` (doküman, kod değil).

---

## 5. "Şunu yapacağım → şu dosya" hızlı eşleme (kodla doğrulanmış)

| Amaç | Web | Mobil |
|---|---|---|
| Supabase sorgusu | `lib/db.js` / `app.html` App scope | `lib/data-bridge.ts` + `queries/*.ts` |
| Yeni preset hareket | `data/presets-exercises.json` → `node scripts/build-presets-exercises.js` (her iki çıktı) | (aynı codegen üretir) |
| Egzersiz rehberi içeriği | `data/ex-guides.json` → `build-ex-guides.js` | (aynı codegen) |
| Yeni program şablonu | `data/presets-programs.js` (elle) | `logwise-mobile/data/presets-programs.ts` (elle — **ayrıca güncelle!**) |
| i18n metni | `data/i18n-tr.js` + `i18n-en.js` | `logwise-mobile/data/i18n-tr.ts` + `i18n-en.ts` |
| 1RM/hesap | `lib/calc.js` | `logwise-mobile/lib/calc.ts` |
| Yeni statik dosya | dosya + `sw.js` (`CACHE_NAME` bump + `PRECACHE_URLS`) | — |

`DOĞRULANDI` — `AGENTS.md §5`; ilgili dosyalar. **Vurgu:** program şablonu ve i18n değişiklikleri
iki tarafta **ayrı ayrı** yapılmalı (codegen yok); aksi halde drift oluşur.

---

## 6. Bu rehberde derinleşilmeyen — diğer dokümanlarda ele alındı

- `lib/migration.ts`, `WebUserWelcomeModal.tsx` davranışı → [05](05-CORE-USER-FLOWS.md), [04](04-DATA-AND-STATE.md).
- `supabase_setup.sql` tablo/kolon/RLS detayı → [06](06-DATABASE-AND-AUTH.md).
- `__tests__/` kapsamı, CI, kalite kapıları → [09](09-QUALITY-TESTING.md).
- Worker + medya hattı (`r2-exercise-media-cors.json`, `validate-exercise-media.js`) → [08 §B](08-BUILD-DEPLOY-OPERATIONS.md).
