# AGENTS.md — LogWise Proje Rehberi (AI Araçları İçin)

<!-- SON GÜNCELLEME: 2026-06-18 — Tüm preset guide kapsamı ve web preview tüketimi eklendi. -->

Bu dosya, LogWise üzerinde çalışan **her AI aracının (Claude, Codex, ...) seans başında okuması gereken** ortak sözleşmedir. Kurallar bağlayıcıdır; ihlal bir hata değil, proje mimarisini bozan bir karardır.

---

## 1. Proje Özeti

LogWise — React 18 + Supabase tabanlı, Cloudflare Pages üzerinde yayınlanan bir antrenman takip PWA'sı. Build step yok. Ürün uygulaması `/app`/`app.html` altında React ile çalışır; landing sayfaları (`/`, `/tr`) statik SEO HTML'dir. React, doğrudan `React.createElement()` çağrılarıyla kullanılır; JSX yoktur. Dil desteği: Türkçe + İngilizce.

Prod URL: https://logwise.fit

---

## 2. Seans Öncesi Kontrol Listesi

Her AI seansı başlamadan **önce**:

1. Bu dosyayı (`AGENTS.md`) oku.
2. `git status` ve `git log --oneline -10` çek — repo'nun son durumunu gör.
3. Yapılacak iş büyük bir refactor mi? Öyleyse `REFACTOR-GECMISI.md`'deki en son Bölüm'ü oku (şu an Bölüm 59 — TR Learn URL yerelleştirmesi).
4. Göreve özel bir reçete var mı? `docs/` klasörüne bak:
   - **Yeni hareket ekleme** → `docs/PRESET-EXERCISE-EKLEME.md`
   - **Yeni program ekleme** → `docs/PRESET-PROGRAM-EKLEME.md`
   - **Yeni React bileşeni** → `docs/YENI-COMPONENT.md`
   - **sw.js versiyon bump** → `docs/SW-VERSION-BUMP.md`

---

## 3. Mutlak Kurallar (İhlal Edilemez)

### 3.1 Kod
- **JSX yasak.** Her React render `React.createElement(...)` ile yazılır. Build aracı yok, tarayıcı script tag'leri ile çalışır.
- **Babel kaldırıldı** (bkz. REFACTOR-GECMISI.md Bölüm 27). Hiçbir dosyada JSX syntax veya Babel yönergesi olmamalı.
- **Global namespace:** Tüm yeniden-kullanılabilir modüller `window.LOGWISE_*` altında yaşar. Her yeni modül kendi isim uzayını alır.
- **Component pattern:** Her React bileşeni IIFE içinde tanımlanır, defensive init pattern'iyle `window.LOGWISE_COMPONENTS`'a bağlanır. Detay: `docs/YENI-COMPONENT.md`.
- **i18n zorunlu:** Kullanıcıya görünen her string TR+EN çift dillidir. `window.LOGWISE_TR` / `window.LOGWISE_EN` sözlüklerinden çözülür. Hardcode Türkçe veya İngilizce yasak.

### 3.2 Dosya Mimarisi
- `data/` — yalnızca sabit veri + i18n sözlükleri (React bağımlılığı yok).
- `lib/` — saf fonksiyonlar, DB layer, utility'ler (React bağımlılığı yok).
- `components/` — React bileşenleri (`window.LOGWISE_COMPONENTS`).
- `styles/base.css` — uygulama paylaşılan CSS. Yeni ortak app CSS buraya yazılır.
- `styles/landing.css` — statik landing ortak CSS (`index.html` + `tr.html`).
- `index.html` / `tr.html` — statik SEO landing sayfaları (React/Babel yok).
- `app.html` / `profile.html` / `share.html` / `program.html` — uygulama ve paylaşım sayfa dosyaları.

### 3.3 PWA / Service Worker
- **Yeni `data/`, `lib/` veya `components/` dosyası eklediğinde** `sw.js`'de iki değişiklik zorunlu: `CACHE_NAME` bump + `PRECACHE_URLS`'e yeni dosyayı ekle. Detay: `docs/SW-VERSION-BUMP.md`.
- `CACHE_NAME` bump unutulursa eski kullanıcıların tarayıcısı yeni dosyayı **almaz**; site kırılabilir.

### 3.4 Git / Commit
- Her commit mantıksal bir birim içerir (bir bileşen, bir bölüm, bir fix). Dev commit'leri yok.
- `Co-Authored-By:` satırı AI'yı belirtir (Claude için: `Co-Authored-By: Claude <noreply@anthropic.com>`; Codex için eşdeğer satır).
- Sensitive dosyalar (`.env`, credentials) commit'e girmez. `git add .` yerine dosyaları ismen ekle.
- `main` branch'i deploy'dur; büyük işler önce feature branch'te geliştirilir (opsiyonel).

---

## 4. Dosya Yapısı Haritası

```
LogWise/
├── AGENTS.md                  ← Bu dosya — her AI seansının ilk okuyacağı
├── REFACTOR-GECMISI.md        ← Refactor tarihsel kaydı (Bölüm 1-64)
├── docs/                      ← Görev-tipi reçeteler
│   ├── PRESET-EXERCISE-EKLEME.md
│   ├── PRESET-PROGRAM-EKLEME.md
│   ├── YENI-COMPONENT.md
│   ├── SW-VERSION-BUMP.md
│   ├── BLOG-YAZISI-EKLEME.md  ← Yeni Learn yazısı ekleme reçetesi
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
│   ├── presets-exercises.js   ← window.LOGWISE_PRESET_EXERCISES (145 hareket, slug-id'li)
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
│   └── comment-section.js     ← CommentSection (Bölüm 44)
├── blog-content/              ← Learn yazıları — Markdown kaynak (TR/EN varyantlı, translationKey frontmatter'lı)
├── learn/                     ← Üretilmiş statik EN Learn sayfaları + learn.css (elle) + posts.json
├── ogren/                     ← Üretilmiş statik TR Öğren sayfaları
├── library/                   ← Üretilmiş statik Library dizinleri ve alt sayfaları (`/library/exercises`, `/library/programs`, nested sayfalar)
├── scripts/
│   ├── build-blog.js          ← blog-content/*.md → learn/*.html + ogren/*.html üretici + TR/EN hreflang + landing Learn/Öğren kart enjeksiyonu
│   ├── build-ex-guides.js     ← ex-guides.json doğrulama + ex-guides.js wrapper üretimi
│   ├── validate-exercise-media.js ← Yerel MP4 + uzak R2 header/range doğrulaması
│   ├── build-programmatic-seo.js ← data/*.js → library.html + library/exercises.html + library/programs.html + nested Library HTML üretici
│   └── vendor/marked.min.js   ← Vendored markdown parser (npm install gerekmez)
├── index.html                 ← EN statik SEO landing
├── tr.html                    ← TR statik SEO landing
├── site-nav.js                ← Public statik sayfaların ortak mobil navigasyon davranışı
├── tools.html                 ← EN statik SEO tools hub sayfası
├── library.html               ← EN statik SEO Library hub sayfası
├── library/exercises.html     ← EN statik SEO exercise library dizin sayfası
├── library/programs.html      ← EN statik SEO program library dizin sayfası
├── one-rep-max-calculator.html ← EN statik SEO tool sayfası
├── workout-log-template.html  ← EN statik SEO printable template sayfası
├── workout-volume-calculator.html ← EN statik SEO workout volume calculator sayfası
├── app.html                   ← Ana uygulama (App + Root monolit)
├── profile.html               ← Profil sayfası
├── share.html                 ← Paylaşım sayfası
├── program.html               ← Program paylaşım sayfası
├── 404.html                   ← 404
├── robots.txt                 ← Arama motoru crawl yönergeleri + sitemap referansları
├── sitemap.xml                ← XML sitemap (hreflang destekli)
├── sitemap_index.xml          ← Sitemap index fallback'i
├── sitemap-basic.xml          ← Minimal XML sitemap fallback'i
├── sitemap.txt                ← Düz metin sitemap fallback'i
├── r2-exercise-media-cors.json ← `media.logwise.fit` R2 CORS konfigürasyonu
├── sw.js                      ← Service Worker (PWA)
├── manifest.json              ← PWA manifest
├── _redirects, _headers       ← Cloudflare Pages konfigürasyonu
├── supabase_setup.sql         ← Supabase tablo şemaları + RLS
└── logwise-worker/            ← Cloudflare Worker (resim API)
    ├── src/worker.js
    └── wrangler.toml
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

---

## 6. Seans Sonu Kontrol Listesi

İşi bitirmeden **önce** şunları geç:

1. **Syntax kontrol:** Yeni/değişen her `.js` dosyası için `node --check <path>`.
2. **Inline script kontrol:** `app.html` veya diğer sayfalarda inline script değiştiyse, inline kısmı ayıklayıp `node --check` yap.
3. **Bracket balance:** Büyük component dosyalarında `(` `{` `[` dengesi 0 olmalı.
4. **sw.js güncel mi?** Yeni statik dosya eklediysen → `CACHE_NAME` bump + `PRECACHE_URLS` ekle.
5. **i18n senkron mu?** Yeni TR string eklediysen EN karşılığını da ekledin mi?
6. **REFACTOR-GECMISI.md** — büyük bir iş (yeni dosya, yeni pattern, mimari karar) yaptıysan yeni bir Bölüm ekle.
7. **AGENTS.md dosya haritası** — yeni dosya/klasör eklediysen haritayı güncelle + `SON GÜNCELLEME` tarihini yenile.
8. **Çalıştırma testi:** mümkünse tarayıcıda aç, en az etkilenen view'ı render et.
9. **Commit disiplini:** `git add <dosyalar>` ismen; mesaj kısa ama anlamlı; `Co-Authored-By:` satırı.

---

## 7. Yasak Listesi

- ❌ JSX kullanmak
- ❌ Babel veya herhangi bir build aracı eklemek
- ❌ Landing CSS'i `styles/landing.css` dışında inline büyütmek
- ❌ Yeni klasör açmadan önce bu dosyayı güncellemeden açmak
- ❌ Kullanıcıya görünen metinleri TR veya EN'den sadece birini yazmak
- ❌ `data/`, `lib/`, `components/` altına React-dışı / namespace-dışı dosya eklemek
- ❌ `window.LOGWISE_*` dışında global değişken oluşturmak
- ❌ `sw.js` `CACHE_NAME` bump'ını unutarak yeni statik dosya eklemek
- ❌ Supabase `SUPABASE_URL` / `SUPABASE_ANON_KEY` gibi sabitleri `lib/db.js` dışında duplicate etmek
- ❌ Commit'e sensitive dosya (.env, credentials) eklemek
- ❌ `git push --force` main'e atmak

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
- **Aşama 3** (opsiyonel, henüz başlamadı): View extraction — `App` monolit'inden dashboard/history/stats/programs/exercises/settings view'ları ayrı bileşenlere taşınır.

Detay için `REFACTOR-GECMISI.md`'ye bak.

---

## 9. İletişim ve Çakışma Önleme

Bu projede iki AI aracı (Claude + Codex) **farklı seanslarda, ayrı ayrı** çalışır. Çakışma engellemek için:

- Büyük refactor işleri → Claude
- Küçük fix + preset ekleme → Codex (veya Claude, sen karar verirsin)
- Her seansta ilk iş: `git pull` sonra bu dosyayı oku
- Seans sonunda: `git push` + (büyük işse) REFACTOR-GECMISI.md'ye Bölüm ekle
- Eğer yarım iş bırakıyorsan: `git commit` yap, mesaja "WIP:" ön ek koy; diğer AI bunu görüp üstüne inşa etmez

---

## 10. Bu Dosyayı Güncelleme Kuralları

`AGENTS.md` **yaşayan bir sözleşmedir**. Şu durumlarda güncellenir:

- Yeni bir mutlak kural kabul edildiğinde (§3'e ekle)
- Yeni bir klasör açıldığında (§4 dosya haritasını güncelle)
- Yeni bir görev-tipi reçetesi `docs/` altına eklendiğinde (§5'e satır ekle)
- Yeni bir yasak belirlendiğinde (§7'ye ekle)
- Refactor aşaması bittiğinde (§8'i güncelle)

Güncelleme sonrası **her zaman** üstteki `SON GÜNCELLEME` yorumunu ve tarih satırını yenile.
