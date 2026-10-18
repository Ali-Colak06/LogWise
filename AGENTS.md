# AGENTS.md — LogWise Proje Rehberi (AI Araçları İçin)

<!-- SON GÜNCELLEME: 2026-10-18 — Alışkanlıklar takvim entegrasyonu, doğrudan iç rota asset yüklemesi ve PWA v68. -->

Bu dosya, LogWise üzerinde çalışan **her AI aracının (Claude, Codex, ...) seans başında okuması gereken** ortak sözleşmedir. Kurallar bağlayıcıdır; ihlal bir hata değil, proje mimarisini bozan bir karardır.

---

## 1. Proje Özeti

LogWise tek Git reposunda iki istemci barındırır:

- **Web:** React 18 + Supabase tabanlı, Cloudflare üzerinde yayınlanan build'siz PWA. Ürün uygulaması `/app`/`app.html` altında çalışır; landing sayfaları (`/`, `/tr`) statik SEO HTML'dir. Web React kodu doğrudan `React.createElement()` kullanır; JSX yoktur.
- **Mobil:** `logwise-mobile/` altında Expo + React Native + TypeScript uygulaması. Metro/Babel ve TSX yalnız bu alt proje içinde kullanılır.

Prod URL: https://logwise.fit

---

## 2. Seans Öncesi Kontrol Listesi

Her AI seansı başlamadan **önce**:

1. Bu dosyayı (`AGENTS.md`) oku.
2. `git status` ve `git log --oneline -10` çek — repo'nun son durumunu gör.
3. Yapılacak iş büyük bir refactor mi? Öyleyse `REFACTOR-GECMISI.md`'deki en son Bölüm'ü oku (şu an Bölüm 95 — site geneli kalıcı dil tercihi).
4. Göreve özel bir reçete var mı? `docs/` klasörüne bak:
   - **Yeni hareket ekleme** → `docs/PRESET-EXERCISE-EKLEME.md`
   - **Yeni program ekleme** → `docs/PRESET-PROGRAM-EKLEME.md`
   - **Yeni React bileşeni** → `docs/YENI-COMPONENT.md`
   - **sw.js versiyon bump** → `docs/SW-VERSION-BUMP.md`
5. Mobil görevlerde ayrıca `logwise-mobile/README.md` ve ilgili `docs/mobile-design-system/` belgesini oku.

---

## 3. Mutlak Kurallar (İhlal Edilemez)

### 3.1 Kod
- **Web kökünde JSX yasak.** Web React render'ları `React.createElement(...)` ile yazılır. Web için build aracı yoktur.
- **Web kökünde Babel yasak.** Babel, TSX ve Expo/Metro yalnız `logwise-mobile/` alt projesinde kullanılabilir.
- **Global namespace:** Tüm yeniden-kullanılabilir Web modülleri `window.LOGWISE_*` altında yaşar. Her yeni Web modülü kendi isim uzayını alır.
- **Component pattern:** Her Web React bileşeni IIFE içinde tanımlanır, defensive init pattern'iyle `window.LOGWISE_COMPONENTS`'a bağlanır. Detay: `docs/YENI-COMPONENT.md`.
- **i18n zorunlu:** Web string'leri `window.LOGWISE_TR` / `window.LOGWISE_EN`; mobil string'leri `logwise-mobile/data/i18n-*.ts` üzerinden çözülür. Kullanıcıya görünen tek dilli hardcode metin yasaktır.
- **Web dil tercihi:** Public statik sayfalar ile Web uygulaması ortak `localStorage` anahtarı `gym-log-lang` (`tr` / `en`) kullanır. Public sayfalardaki kayıt, alternate rotaya yönlendirme ve eski `logwise-blog-lang` tercihini taşıma sorumluluğu `site-nav.js`'dedir.

### 3.2 Dosya Mimarisi
- `data/` — yalnızca sabit veri + i18n sözlükleri (React bağımlılığı yok).
- `lib/` — saf fonksiyonlar, DB layer, utility'ler (React bağımlılığı yok).
- `components/` — React bileşenleri (`window.LOGWISE_COMPONENTS`).
- `styles/base.css` — uygulama paylaşılan CSS. Yeni ortak app CSS buraya yazılır.
- `styles/landing.css` — statik landing ortak CSS (`index.html` + `tr.html`).
- `index.html` / `tr.html` — statik SEO landing sayfaları (React/Babel yok).
- `app.html` / `profile.html` / `share.html` / `program.html` — uygulama ve paylaşım sayfa dosyaları.
- `logwise-mobile/` — bağımsız Expo alt projesi; kendi `package.json`, TypeScript, Metro/Babel ve React Native bileşen kurallarına sahiptir.
- `.assetsignore` — repo kökündeki geliştirme/mobil kaynaklarının Cloudflare Web asset deploy'una girmesini engeller.
- Web/Mobil ortak domain verilerinde kanonik kaynak + generator modeli kullanılır. `presets-exercises` için kaynak `data/presets-exercises.json`; `ex-guides` için kaynak `data/ex-guides.json` dosyasıdır. Generated dosyalar elle değiştirilmez.

### 3.3 Web PWA / Service Worker
- **Yeni `data/`, `lib/` veya `components/` dosyası eklediğinde** `sw.js`'de iki değişiklik zorunlu: `CACHE_NAME` bump + `PRECACHE_URLS`'e yeni dosyayı ekle. Detay: `docs/SW-VERSION-BUMP.md`.
- **Generator girdileri istisnası:** Kanonik JSON yalnız build/codegen girdisiyse ve Web runtime tarafından fetch edilmiyorsa `PRECACHE_URLS`'e eklenmez. Precache yalnız runtime'da yüklenen Web çıktıları içindir.
- `CACHE_NAME` bump unutulursa eski kullanıcıların tarayıcısı yeni dosyayı **almaz**; site kırılabilir.

### 3.4 Git / Commit
- Her commit mantıksal bir birim içerir (bir bileşen, bir bölüm, bir fix). Dev commit'leri yok.
- `Co-Authored-By:` satırı AI'yı belirtir (Claude için: `Co-Authored-By: Claude <noreply@anthropic.com>`; Codex için eşdeğer satır).
- Sensitive dosyalar (`.env`, credentials) commit'e girmez. `git add .` yerine dosyaları ismen ekle.
- `master` branch'i deploy'dur; büyük işler önce feature branch'te geliştirilir.

### 3.5 Çoklu-ajan worktree iş akışı (BAĞLAYICI — "Seçenek 1")

Tek repo, tek `.git` (`C:/Users/colak/Documents/LogWise/.git`). Ajanlar ayrı **worktree**'lerde çalışır; ayrı clone YOKTUR. Git aynı dalı iki worktree'de aynı anda açtırmadığı için roller sabittir:

| Worktree | Dal | Ajan / alan |
|---|---|---|
| `C:/Users/colak/Documents/LogWise/` | `master` | **Claude — mobil** (`logwise-mobile/`) + repo-yönetim dosyaları |
| `C:/Users/colak/Documents/LogWise-master/` | `web/work` | **Codex — web** (repo kökü) |

- **Master'ı `LogWise/` (Claude) tutar.** Claude mobil değişiklikleri + ortak yönetim dosyalarını (AGENTS.md, REFACTOR-GECMISI.md) doğrudan `master`'a commit'ler.
- **Codex web tarafını `web/work` dalında yürütür** (her zaman güncel `origin/master` tabanlı). `web/work`'e commit + push.
- **Web → master inişi:** `git push origin web/work:master` (server-side fast-forward — **kimsenin worktree'sine dokunmaz**; diverge varsa otomatik reddedilir → `web/work`'ü `origin/master` üzerine rebase edip tekrar dene). **Başka ajanın worktree'sinde (`git -C .../LogWise ...`) komut çalıştırma** — o ajan o sırada commit'siz işte olabilir. Riskli/büyük işte PR tercih et. İniş sonrası iki worktree de `git fetch && git merge --ff-only origin/master` ile senkronlanır.
- **Çalışmadan önce `git fetch`; handoff'ta `push`.** `origin` ortak doğruluk kaynağıdır. Diğer worktree `git merge --ff-only origin/master` ile senkronlanır.
- **Çift-taraflı iş** (HEM web HEM mobil dosyaya dokunan; ör. kas taksonomisi göçü): iki ayrı dalda paralel YAPMA → **tek dalda topla, tek merge ile indir** (yoksa aynı dosyalarda gerçek çakışma çıkar).
- **`mobile-design-system` dalı SİLİNMEZ** — squash öncesi mobil geçmişin tek arşividir.
- Generated çıktılara elle dokunma; `node scripts/check-codegen.js` yeşil olmadan push etme (§3.2, §3.3).

---

## 4. Dosya Yapısı Haritası

```
LogWise/
├── AGENTS.md                  ← Bu dosya — her AI seansının ilk okuyacağı
├── REFACTOR-GECMISI.md        ← Refactor tarihsel kaydı (Bölüm 1-99)
├── .github/workflows/         ← CI otomasyonları
│   └── codegen-check.yml      ← Generated çıktı drift kontrolü + alışkanlık tarih/seri testleri
├── .assetsignore              ← Mobil/iç kaynakları Cloudflare Web asset deploy'undan çıkarır
├── docs/                      ← Görev-tipi reçeteler
│   ├── mobile-design-system/  ← Mobil ürün kararları, ekran spesifikasyonları ve prototipler
│   ├── PRESET-EXERCISE-EKLEME.md
│   ├── PRESET-PROGRAM-EKLEME.md
│   ├── YENI-COMPONENT.md
│   ├── SW-VERSION-BUMP.md
│   ├── BLOG-YAZISI-EKLEME.md  ← Yeni Learn yazısı ekleme reçetesi
│   ├── HABIT-TRACKER.md        ← Kişisel alışkanlık alanı mimarisi, test ve canlı kurulum adımları
│   ├── PROGRAMMATIC-SEO-PROMPT.md ← Programmatic SEO çalışma promptu
│   ├── EXERCISE-GUIDE-SCHEMA.md ← Ortak web/mobile guide ve medya sözleşmesi
│   ├── R2-EXERCISE-MEDIA-SETUP.md ← Exercise medya R2 kurulum/yükleme reçetesi
│   └── ex-guides.schema.json  ← Exercise guide makine-okunur JSON Schema
├── assets/
│   └── landing/                ← Statik landing mockup görselleri
├── data/                      ← Sabit veri + i18n (Aşama 1)
│   ├── i18n-tr.js             ← window.LOGWISE_TR
│   ├── i18n-en.js             ← window.LOGWISE_EN
│   ├── i18n-tr-profile.js     ← window.LOGWISE_TR_PROFILE
│   ├── i18n-en-profile.js     ← window.LOGWISE_EN_PROFILE
│   ├── badges.js              ← window.LOGWISE_BADGES (30 rozet)
│   ├── presets-exercises.json ← Kanonik Web/Mobil preset exercise kaynağı (145 hareket)
│   ├── presets-exercises.js   ← Üretilmiş window.LOGWISE_PRESET_EXERCISES web wrapper'ı
│   ├── ex-descriptions.js     ← window.LOGWISE_EX_DESCS (slug-anahtarlı kısa açıklamalar)
│   ├── ex-preview.js          ← window.LOGWISE_EX_PREVIEW (slug-anahtarlı gif + uzun desc + tips)
│   ├── ex-images.js           ← window.LOGWISE_EX_IMAGES (legacy harici görsel fallback'leri)
│   ├── ex-guides.json         ← Kanonik platform-nötr exercise guide kaynağı
│   ├── ex-guides.js           ← Üretilmiş window.LOGWISE_EX_GUIDES web wrapper'ı
│   └── presets-programs.js    ← window.LOGWISE_PRESET_PROGRAMS (4 program, slug referanslı)
├── lib/                       ← Saf fonksiyonlar + DB (Aşama 1-2)
│   ├── calc.js                ← window.LOGWISE_CALC
│   ├── badge-logic.js         ← window.LOGWISE_BADGE_LOGIC
│   ├── data-schema.js         ← window.LOGWISE_SCHEMA (init + migrateData)
│   ├── profile-utils.js       ← window.LOGWISE_PROFILE_UTILS
│   ├── db.js                  ← window.LOGWISE_DB (Supabase client + profil senkronu)
│   ├── habit-utils.js         ← window.LOGWISE_HABIT_UTILS (İstanbul gün sınırı, takvim, seri)
│   ├── habits-db.js           ← window.LOGWISE_HABITS_DB (RLS korumalı kişisel alışkanlık CRUD)
│   └── exercise-utils.js      ← window.LOGWISE_EX_UTILS (id/name lookup, resolveKey)
├── styles/
│   ├── base.css               ← App paylaşılan CSS (reset, :root, @keyframes)
│   ├── landing.css            ← Statik landing CSS (index.html + tr.html)
│   └── site-nav.css           ← Public statik sayfaların ortak mobil side panel stili
├── components/                ← React bileşenleri (Aşama 2C)
│   ├── error-boundary.js      ← ErrorBoundary
│   ├── brand-mark.js          ← BrandMark
│   ├── dash-chart.js          ← DashChart
│   ├── ex-preview-modal.js    ← ExPreviewModal
│   ├── auth-screen.js         ← AuthScreen
│   ├── habits-page.js         ← HabitTracker (App içi alışkanlık kontrolü + takvim/mini takvim veri köprüsü)
│   └── comment-section.js     ← CommentSection (Bölüm 44)
├── blog-content/              ← Learn yazıları — Markdown kaynak (TR/EN varyantlı, translationKey frontmatter'lı)
├── learn/                     ← Üretilmiş statik EN Learn sayfaları + learn.css (elle) + posts.json
├── ogren/                     ← Üretilmiş statik TR Öğren sayfaları
├── library/                   ← Üretilmiş statik Library dizinleri ve alt sayfaları (`/library/exercises`, `/library/programs`, nested sayfalar)
├── scripts/
│   ├── build-blog.js          ← blog-content/*.md → learn/*.html + ogren/*.html üretici + TR/EN hreflang + landing Learn/Öğren kart enjeksiyonu
│   ├── check-codegen.js       ← Preset + exercise guide generated çıktı drift kontrollerini tek komutta çalıştırır
│   ├── test-habit-utils.js    ← Bağımlılıksız tarih/seri davranış testleri (node --test)
│   ├── test-private-habits.js ← İzole PostgreSQL/PGlite RLS ve CRUD testleri
│   ├── build-presets-exercises.js ← presets-exercises.json → Web JS + mobil TS generated çıktıları ve --check drift kontrolü
│   ├── build-ex-guides.js     ← ex-guides.json doğrulama + Web ex-guides.js + mobil generated ex-content.ts üretimi
│   ├── validate-exercise-media.js ← Yerel MP4 + uzak R2 header/range doğrulaması
│   ├── build-programmatic-seo.js ← data/*.js → library.html + library/exercises.html + library/programs.html + nested Library HTML üretici
│   └── vendor/marked.min.js   ← Vendored markdown parser (npm install gerekmez)
├── index.html                 ← EN statik SEO landing
├── tr.html                    ← TR statik SEO landing
├── site-nav.js                ← Public statik sayfaların ortak mobil navigasyon davranışı
├── tools.html                 ← EN statik SEO tools hub sayfası
├── araclar.html               ← TR statik SEO araçlar hub sayfası (`/araclar`)
├── library.html               ← Üretilmiş EN statik SEO Library hub sayfası
├── kutuphane.html             ← Üretilmiş TR statik SEO Kütüphane hub sayfası (`/kutuphane`)
├── library/exercises.html     ← EN statik SEO exercise library dizin sayfası
├── library/programs.html      ← EN statik SEO program library dizin sayfası
├── one-rep-max-calculator.html ← EN statik SEO tool sayfası
├── rpe-rir-calculator.html    ← EN statik SEO RPE/RIR calculator tool sayfası
├── barbell-plate-calculator.html ← EN statik SEO barbell plate calculator tool sayfası
├── workout-log-template.html  ← EN statik SEO printable template sayfası
├── workout-volume-calculator.html ← EN statik SEO workout volume calculator sayfası
├── app.html                   ← Ana uygulama (App + Root monolit)
├── habits.html                ← /app/habits uygulama sekmesine eski bağlantı yönlendirmesi (noindex)
├── profile.html               ← Profil sayfası
├── share.html                 ← Paylaşım sayfası
├── program.html               ← Program paylaşım sayfası
├── 404.html                   ← 404
├── robots.txt                 ← Arama motoru crawl yönergeleri + sitemap referansları
├── sitemap.xml                ← Tek kanonik XML sitemap (hreflang destekli)
├── r2-exercise-media-cors.json ← `media.logwise.fit` R2 CORS konfigürasyonu
├── sw.js                      ← Service Worker (PWA)
├── manifest.json              ← PWA manifest
├── _redirects, _headers       ← Cloudflare Web yönlendirme/header konfigürasyonu
├── supabase_setup.sql         ← Web + mobil `app_` Supabase tablo şemaları ve RLS (kurulum snapshot'ı)
├── supabase/migrations/       ← Supabase tarihli migration'lar (snapshot üzerine uygulanan değişiklikler; ilk: 20260628120000 user_data public SELECT açığını kaldırır)
├── logwise-worker/            ← Cloudflare Worker (resim API)
│   ├── src/worker.js
│   └── wrangler.toml
└── logwise-mobile/            ← Expo + React Native + TypeScript mobil uygulaması
    ├── app/, components/, data/, data/generated/, lib/, queries/, stores/, theme/, types/
    └── package.json, app.json, eas.json
```

---

## 5. Ne Yapacaksın? → Nereye Bakacaksın?

| İş Tipi | Bak |
|---|---|
| Yeni preset hareket eklemek | `docs/PRESET-EXERCISE-EKLEME.md` |
| Yeni preset program eklemek | `docs/PRESET-PROGRAM-EKLEME.md` |
| Yeni React bileşeni eklemek | `docs/YENI-COMPONENT.md` |
| Mevcut bileşeni değiştirmek | `components/*.js` + ilgili REFACTOR-GECMISI.md bölümü |
| Yeni i18n metni eklemek | `data/i18n-tr.js` + `data/i18n-en.js` (ikisine de eşzamanlı) |
| Yeni rozet eklemek | `data/badges.js` + `lib/badge-logic.js` kontrol |
| Supabase sorgusu eklemek | `lib/db.js` veya `app.html` App scope'u (Aşama 3'te sarmalanacak) |
| Ortak CSS eklemek | `styles/base.css` |
| Landing CSS değiştirmek | `styles/landing.css` |
| Sayfa-özel CSS eklemek | `profile.html` / `share.html` / `program.html` inline `<style>` |
| sw.js versiyon bump | `docs/SW-VERSION-BUMP.md` |
| Yeni Learn yazısı eklemek | `docs/BLOG-YAZISI-EKLEME.md` (her konu TR+EN varyantlı, aynı `translationKey`) |
| Landing SEO/metin güncellemek | `index.html` + `tr.html` + `scripts/build-blog.js` marker enjeksiyonu |
| Yeni SEO araç sayfası eklemek | `.html` dosyası + `styles/landing.css` + `scripts/build-blog.js` statik sitemap kaydı + sw.js değerlendirmesi |
| Programmatic SEO sayfaları eklemek/genişletmek | `docs/PROGRAMMATIC-SEO-PROMPT.md` + `scripts/build-programmatic-seo.js` |
| Exercise guide ortak veri/medya eklemek | `docs/EXERCISE-GUIDE-SCHEMA.md` + `data/ex-guides.json` |
| Exercise medyası encode/yükleme/doğrulama | `docs/R2-EXERCISE-MEDIA-SETUP.md` + `scripts/validate-exercise-media.js` |
| Yeni sayfa eklemek | `.html` dosyası + gerekirse `_redirects` + sw.js PRECACHE |
| Mobil ekran/bileşen değiştirmek | `logwise-mobile/app/` + `logwise-mobile/components/` + ilgili `docs/mobile-design-system/` belgesi |
| Mobil veri/query değiştirmek | `logwise-mobile/lib/` + `logwise-mobile/queries/` + `logwise-mobile/types/` |
| Web/Mobil ortak domain verisi değiştirmek | Kanonik JSON sözleşmesi + ilgili generator; generated Web/Mobil çıktılarını elle değiştirme |

---

## 6. Seans Sonu Kontrol Listesi

İşi bitirmeden **önce** şunları geç:

1. **Web syntax kontrolü:** Yeni/değişen her Web `.js` dosyası için `node --check <path>`.
2. **Inline script kontrol:** `app.html` veya diğer sayfalarda inline script değiştiyse, inline kısmı ayıklayıp `node --check` yap.
3. **Bracket balance:** Büyük component dosyalarında `(` `{` `[` dengesi 0 olmalı.
4. **sw.js güncel mi?** Yeni statik dosya eklediysen → `CACHE_NAME` bump + `PRECACHE_URLS` ekle.
5. **i18n senkron mu?** Yeni TR string eklediysen EN karşılığını da ekledin mi?
6. **Codegen:** Kanonik JSON veya generator değiştiyse `node scripts/check-codegen.js` çalıştır (presets + ex-guides drift kontrolü).
7. **Mobil kontrol:** Mobil dosya değiştiyse `cd logwise-mobile && npm run typecheck`; ilgili test varsa `npm test -- --runInBand`.
8. **REFACTOR-GECMISI.md** — büyük bir iş (yeni dosya, yeni pattern, mimari karar) yaptıysan yeni bir Bölüm ekle.
9. **AGENTS.md dosya haritası** — yeni dosya/klasör eklediysen haritayı güncelle + `SON GÜNCELLEME` tarihini yenile.
10. **Çalıştırma testi:** mümkünse etkilenen Web view'ını ve/veya Expo ekranını render et.
11. **Commit disiplini:** `git add <dosyalar>` ismen; mesaj kısa ama anlamlı; `Co-Authored-By:` satırı.

---

## 7. Yasak Listesi

- ❌ Web kökünde JSX kullanmak
- ❌ Web köküne Babel veya build aracı eklemek (`logwise-mobile/` Expo toolchain'i istisnadır)
- ❌ Landing CSS'i `styles/landing.css` dışında inline büyütmek
- ❌ Yeni klasör açmadan önce bu dosyayı güncellemeden açmak
- ❌ Kullanıcıya görünen metinleri TR veya EN'den sadece birini yazmak
- ❌ Web `data/`, `lib/`, `components/` altına React-dışı / namespace-dışı dosya eklemek
- ❌ Web kökünde `window.LOGWISE_*` dışında global değişken oluşturmak
- ❌ `sw.js` `CACHE_NAME` bump'ını unutarak yeni statik dosya eklemek
- ❌ Supabase `SUPABASE_URL` / `SUPABASE_ANON_KEY` gibi sabitleri `lib/db.js` dışında duplicate etmek
- ❌ Commit'e sensitive dosya (.env, credentials) eklemek
- ❌ `git push --force` ile `master`ı güncellemek
- ❌ `logwise-mobile/` veya dahili monorepo kaynaklarını Cloudflare Web asset deploy'una dahil etmek
- ❌ Generated ortak-veri çıktılarını (`data/presets-exercises.js`, `data/ex-guides.js`, `logwise-mobile/data/generated/*.ts`) elle düzenlemek; kaynak JSON'u değiştir ve generator çalıştır

---

## 8. Proje Refactor Durumu (Özet)

- **Aşama 1** (Bölüm 28-33): Veri/sabit/saf fonksiyon ayrıştırması ✅
- **Aşama 2** (Bölüm 34-41): DB + Stil + React bileşenleri ayrıştırması ✅
- **DOC-1** (Bölüm 42): Dokümantasyon altyapısı (AGENTS.md + docs/*) ✅
- **Faz EX-ID** (Bölüm 43): Preset hareketlere slug `id` sistemi + Dead Hang deduplikasyonu + tüm referansların id'ye taşınması ✅
- **Learn/Öğren sistemi** (Bölüm 45, 51-52, 58-59): Markdown kaynaklı statik Learn + sitemap + landing Learn/Öğren entegrasyonu; EN canonical `/learn`, TR canonical `/ogren`, her konu TR/EN varyantlı, hreflang'li ve UI'da aktif dil switch'iyle tek dil gösterir ✅
- **SEO statik landing** (Bölüm 46): EN `/` + TR `/tr` statik landing, canonical apex domain, statik Learn kart enjeksiyonu ✅
- **SEO evergreen araç sayfaları** (Bölüm 48-49, 53-54): `/tools` hub + `/one-rep-max-calculator` + `/workout-log-template` + `/workout-volume-calculator` statik tool/template sayfaları + sitemap statik sayfa kaydı ✅
- **Programmatic SEO MVP** (Bölüm 55-58): `/library` hub + `/library/exercises` dizini + `/library/programs` dizini + `/library/exercises/bench-press`, `/library/exercises/squat`, `/library/exercises/deadlift`, `/library/programs/push-pull-legs` statik generator çıktıları + sitemap/SW entegrasyonu ✅
- **Mobil public navigasyon** (Bölüm 60): Home/Tools/Library/Learn için iki dilli, erişilebilir ve aktif rota vurgulu ortak side panel ✅
- **Ortak exercise guide altyapısı** (Bölüm 61): Platform-nötr JSON kaynak, web wrapper üretimi, readiness/medya doğrulaması ve legacy fallback geçiş sözleşmesi ✅
- **R2 exercise-media teslim hattı** (Bölüm 62): Ayrı public bucket, CORS/custom-domain/upload reçetesi ve yerel/uzak medya doğrulayıcı ✅
- **Exercise guide JSON cutover hazırlığı** (Bölüm 63): Üç pilotun tam TR/EN içeriği, `publish` kontrollü generator adapter'ı ve koşullu demo/kas haritası şablonu ✅
- **Tüm preset guide kapsamı + web preview tüketimi** (Bölüm 64): 145/145 kanonik kayıt, 143 preview-ready içerik ve `ExPreviewModal` kanonik öncelik/legacy fallback akışı ✅
- **Exercise guide enrichment batch 1** (Bölüm 65): Yedi temel hareketin tam TR/EN guide içeriği, anatomik kas verisi ve türetilmiş `content-ready` raporu ✅
- **Exercise guide enrichment batch 2** (Bölüm 66): Yedi ek temel hareketin tam TR/EN içeriği, form miti düzeltmeleri ve toplam 17 content-ready guide ✅
- **Exercise guide enrichment batch 3** (Bölüm 67): Yedi omuz/kol hareketinin tam TR/EN içeriği, riskli cue düzeltmeleri ve toplam 24 content-ready guide ✅
- **Exercise guide enrichment batch 4** (Bölüm 68): Yedi göğüs/press hareketinin tam TR/EN içeriği, izolasyon miti düzeltmeleri ve toplam 31 content-ready guide ✅
- **Exercise guide enrichment batch 5** (Bölüm 69): Yedi sırt çekiş hareketinin tam TR/EN içeriği, tek taraf/makine iddiası düzeltmeleri ve toplam 38 content-ready guide ✅
- **Exercise guide enrichment batch 6** (Bölüm 70): Yedi squat/lunge/makine bacak hareketinin tam TR/EN içeriği, eklem/form miti düzeltmeleri ve toplam 45 content-ready guide ✅
- **Exercise guide enrichment batch 7** (Bölüm 71): Yedi kalça/baldır hareketinin tam TR/EN içeriği, calf varyasyonu ayrımı, TR medya alt metni onarımı ve toplam 52 content-ready guide ✅
- **Exercise guide enrichment batch 8** (Bölüm 72): Yedi alt vücut/posterior-chain hareketinin tam TR/EN içeriği, Nordic yükleme düzeltmeleri, Bacak/Kalf kategori kapanışı ve toplam 59 content-ready guide ✅
- **Exercise guide enrichment batch 9** (Bölüm 73): Yedi temel core hareketinin tam TR/EN içeriği, alt karın/izolasyon cue düzeltmeleri ve toplam 66 content-ready guide ✅
- **Exercise guide enrichment batch 10** (Bölüm 74): Yedi dinamik/ileri core hareketinin tam TR/EN içeriği, strict-kipping ve rotasyon standardı ayrımları, toplam 73 content-ready guide ✅
- **Exercise guide enrichment batch 11** (Bölüm 75): Yedi skill/isometric/carry hareketinin tam TR/EN içeriği, ring-bar ve kaldıraç standardı ayrımları, toplam 80 content-ready guide ✅
- **Exercise guide enrichment batch 12** (Bölüm 76): Yedi ana kardiyo hareketinin tam TR/EN içeriği, yoğunluk/kalori miti düzeltmeleri ve toplam 87 content-ready guide ✅
- **Exercise guide enrichment batch 13** (Bölüm 77): Yedi omuz press/raise varyasyonunun tam TR/EN içeriği, makine-kablo ve izolasyon iddiası düzeltmeleri, toplam 94 content-ready guide ✅
- **Exercise guide enrichment batch 14** (Bölüm 78): Yedi skapula/omuz kuşağı hareketinin tam TR/EN içeriği, elevasyon-depresyon ve hang standardı ayrımları, toplam 101 content-ready guide ✅
- **Exercise guide enrichment batch 15** (Bölüm 79): Yedi fly/şınav varyasyonunun tam TR/EN içeriği, makine fly ayrımı, menzil ve yük dağılımı miti düzeltmeleri, toplam 108 content-ready ve 144 preview-ready guide ✅
- **Exercise guide enrichment batch 16** (Bölüm 80): Yedi şınav/dip/triceps hareketinin tam TR/EN içeriği, seated dip standardı, ring instabilitesi ve JM Press bar yolu düzeltmeleri, toplam 115 content-ready guide ✅
- **Exercise guide enrichment batch 17** (Bölüm 81): Dört triceps ve üç curl hareketinin tam TR/EN içeriği, overhead ekipman ayrımı, skull-crusher bitiş standardı ve curl direnç profili düzeltmeleri, toplam 122 content-ready guide ✅
- **Exercise guide enrichment batch 18** (Bölüm 82): Yedi cable/preacher/incline curl varyasyonunun tam TR/EN içeriği, ekipman geçmişi ayrımları, izolasyon ve zorunlu uzama miti düzeltmeleri, toplam 129 content-ready guide ✅
- **Exercise guide enrichment batch 19** (Bölüm 83): Yedi ön kol/kavrama/bar çekiş hareketinin tam TR/EN içeriği, dead-active hang, wrist tedavi iddiası ve typewriter tekrar standardı düzeltmeleri, toplam 136 content-ready guide ✅
- **Exercise guide enrichment batch 20** (Bölüm 84): Altı row/pullover ve bir arch hareketinin tam TR/EN içeriği, makine-landmine ayrımları, pullover menzili ve statik arch standardı düzeltmeleri, toplam 143 content-ready guide ✅
- **Exercise guide enrichment batch 21 + tam kapsam** (Bölüm 85): Superman ve air-walker Ay Yürüyüşü kayıtlarının tam TR/EN içeriği, dinamik-statik arch ayrımı ve Moonwalk cihaz anlamı; 145/145 preview-ready ve content-ready guide ✅
- **Web/Mobil monorepo entegrasyonu** (Bölüm 86): Expo uygulaması `logwise-mobile/` altında güncel mobil checkpoint'ten eklendi; mobil tasarım belgeleri ve `app_` Supabase şeması korundu; Web SEO/build'siz mimarisi ve Cloudflare asset sınırı güvenceye alındı ✅
- **Preset exercise codegen pilotu** (Bölüm 87): `data/presets-exercises.json` kanonik kaynak; Web `data/presets-exercises.js` ve mobil `logwise-mobile/data/generated/presets-exercises.ts` deterministik generator + `--check` ile doğrulanır ✅
- **Exercise guide mobil projection codegen** (Bölüm 88): `data/ex-guides.json` kanonik kaynak; Web `data/ex-guides.js` ve mobil `logwise-mobile/data/generated/ex-content.ts` aynı generator + `--check` ile doğrulanır ✅
- **Codegen drift otomasyonu** (Bölüm 89): `scripts/check-codegen.js` tek komutu ve GitHub Actions `codegen-check.yml` ile generated çıktı drift'i push/PR seviyesinde zorlanır ✅
- **`user_data` public SELECT güvenlik düzeltmesi** (Bölüm 90): Ham `user_data` blob'unu anonim/public okumaya açan politika kaldırıldı; owner-only authenticated SELECT ve tarihli Supabase migration kaydedildi ✅
- **`app_profiles` username normalize benzersizlik** (Bölüm 91): Mobil `app_profiles` username için `lower(btrim(username))` partial unique index'i, normalize RPC gövdesi ve canlı doğrulama kaydı eklendi ✅
- **Barbell Plate Calculator statik SEO tool** (Bölüm 92): `/barbell-plate-calculator` sayfası, Tools hub/landing kartları, sitemap generator kaydı ve `sw.js` precache bump'ı eklendi ✅
- **RPE / RIR Calculator statik SEO tool** (Bölüm 93): `/rpe-rir-calculator` sayfası, RPE/RIR tabanlı e1RM, hedef yük ve backoff set önerileri, Tools hub/landing kartları, sitemap generator kaydı ve `sw.js` precache bump'ı eklendi ✅
- **Tools / Library TR hub yerelleştirmesi** (Bölüm 94): `/tools` ↔ `/araclar` ve `/library` ↔ `/kutuphane` canonical/hreflang çiftleri, TR hub içerikleri, iki dilli üst navigasyon, sitemap alternate kayıtları ve `sw.js` precache entegrasyonu eklendi; alt tool/Library detay sayfaları EN canonical kalır ✅
- **Site geneli kalıcı dil tercihi** (Bölüm 95): Public sayfalar, Learn/Öğren ve Web uygulaması `gym-log-lang` üzerinde birleştirildi; TR/EN seçimi canonical alternate bulunan tüm sayfalarda otomatik uygulanır, yalnız EN içeriği olan detaylarda tercih korunur ve `sw.js` v55 ile dağıtılır ✅
- **RPE / RIR Learn içerik kümesi** (Bölüm 96): RPE, RIR ve aralarındaki pratik farkı anlatan üç konu EN/TR Markdown çiftleriyle eklendi; hesaplayıcı mod seçimi, dönüşüm tablosu, iç linkler, sitemap/hreflang çıktıları ve `sw.js` v56 precache entegrasyonu tamamlandı ✅
- **Antrenman programlama Learn içerik kümesi** (Bölüm 97): Set arası dinlenme, haftalık set hacmi, ısınma setleri, tahmini/gerçek 1RM, deload ve ağırlık artırma konularını anlatan altı EN/TR Markdown çifti eklendi; Learn/Öğren indeksleri, manifest, sitemap/hreflang çıktıları ve `sw.js` v65 precache entegrasyonu tamamlandı ✅
- **Aşama 3** (opsiyonel, henüz başlamadı): View extraction — `App` monolit'inden dashboard/history/stats/programs/exercises/settings view'ları ayrı bileşenlere taşınır.
- **Kişisel alışkanlık takvimi** (Bölüm 98): `/habits` altında tek seçili alışkanlık, altın tamamlanma günleri, mevcut/aylık/en uzun seri; `private_habit_access` ile sabit hesap kimliğine bağlı RLS. Migration canlıya ayrıca uygulanır; salt HTML görünürlüğü yetkilendirme sayılmaz.
- **Alışkanlıklar uygulama sekmesi** (Bölüm 99): Yan menüde Alışkanlıklar; `/app/habits` görünümü antrenman takviminin aynı ay grid'ini ve mini takvimini kullanır. Kompakt seçim/seri alanı; ayrı sayfa kabuğu yok. `/habits` eski bağlantısı sekmeye yönlenir. App runtime dosyaları kökten mutlak URL kullanır; doğrudan iç rota yüklemesi testlidir; PWA v68.

Detay için `REFACTOR-GECMISI.md`'ye bak.

---

## 9. İletişim ve Çakışma Önleme

Web ve mobil aynı Git ağacında, tercihen ayrı worktree'lerde geliştirilir:

- Seans başında `git fetch --prune`, ardından `git status` ve branch karşılaştırması yap. Temiz ve yalnız fast-forward mümkünse `git pull --ff-only` kullan.
- Web işi Web worktree/feature branch'inde; mobil işi mobil worktree/feature branch'inde yürütülür.
- `AGENTS.md`, `REFACTOR-GECMISI.md`, `supabase_setup.sql`, kanonik ortak veri ve generator dosyaları ortak sahipliktedir; değişiklikten önce karşı branch kontrol edilir.
- Ortak dosya değişiklikleri küçük, ayrı commit olarak önce entegrasyon branch'inde doğrulanır.
- Aynı dosya iki ajan tarafından eşzamanlı değiştirilmez; devirde branch + commit hash açıkça yazılır.
- Yarım iş yalnız zorunluysa `WIP:` checkpoint commit ile bırakılır; commit edilmemiş çalışma diğer worktree'ye taşınmaz.
- Seans sonunda ilgili testleri çalıştır, dosyaları ismen stage et, push sonrası hash'i karşı tarafa bildir.

---

## 10. Bu Dosyayı Güncelleme Kuralları

`AGENTS.md` **yaşayan bir sözleşmedir**. Şu durumlarda güncellenir:

- Yeni bir mutlak kural kabul edildiğinde (§3'e ekle)
- Yeni bir klasör açıldığında (§4 dosya haritasını güncelle)
- Yeni bir görev-tipi reçetesi `docs/` altına eklendiğinde (§5'e satır ekle)
- Yeni bir yasak belirlendiğinde (§7'ye ekle)
- Refactor aşaması bittiğinde (§8'i güncelle)

Güncelleme sonrası **her zaman** üstteki `SON GÜNCELLEME` yorumunu ve tarih satırını yenile.
