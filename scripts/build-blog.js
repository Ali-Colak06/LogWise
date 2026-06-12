#!/usr/bin/env node
/**
 * LogWise Blog Üretici
 * --------------------
 * blog-content/*.md  →  blog/<slug>.html + blog/index.html + blog/posts.json
 * Ayrıca: sitemap.xml'i statik SEO sayfalarıyla birlikte yeniden üretir ve landing sayfalarındaki
 * BLOG-CARDS marker bloğuna öne çıkan yazı kartlarını enjekte eder.
 *
 * Kullanım:  node scripts/build-blog.js
 * Bağımlılık: scripts/vendor/marked.min.js (vendored UMD — npm install gerekmez)
 *
 * Yazı formatı (blog-content/ornek.md):
 *   ---
 *   title: Yazı Başlığı
 *   slug: yazi-basligi            (zorunlu, küçük harf + tire)
 *   date: 2026-06-10              (YYYY-MM-DD)
 *   lang: tr                      (tr | en)
 *   description: Meta açıklama (SEO + kart metni, ideal <160 karakter)
 *   tags: antrenman, takip        (virgülle ayrılmış)
 *   featured: true                (landing'de öncelik — opsiyonel)
 *   ---
 *   Markdown gövde...
 */

'use strict';

const fs = require('fs');
const path = require('path');

const markedMod = require('./vendor/marked.min.js');
const marked = markedMod.marked || markedMod;

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'blog-content');
const OUT_DIR = path.join(ROOT, 'blog');
const LANDING_FILES = [
  { file: path.join(ROOT, 'index.html'), lang: 'en' },
  { file: path.join(ROOT, 'tr.html'), lang: 'tr' }
];
const SITEMAP = path.join(ROOT, 'sitemap.xml');

const SITE = 'https://logwise.fit';
const OG_IMAGE = `${SITE}/icon-512.png`;
const STATIC_SITEMAP_PAGES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/tr', changefreq: 'weekly', priority: '0.9' },
  { path: '/blog', changefreq: 'weekly', priority: '0.8' },
  { path: '/one-rep-max-calculator', lastmod: '2026-06-12', changefreq: 'monthly', priority: '0.8' },
  { path: '/workout-log-template', lastmod: '2026-06-12', changefreq: 'monthly', priority: '0.8' }
];

// ---------------------------------------------------------------- helpers

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseFrontmatter(raw, file) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: frontmatter bloğu (--- ... ---) bulunamadı`);
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) throw new Error(`${file}: frontmatter satırı çözümlenemedi: "${line}"`);
    let val = kv[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    meta[kv[1]] = val;
  }
  return { meta, body: m[2] };
}

function readingMinutes(markdownBody) {
  const text = markdownBody
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`[\]()!-]/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function fmtDate(iso, lang) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

function fmtShortDate(iso, lang) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function jsonForScript(obj) {
  // </script> kaçışı — inline <script> içine güvenli gömme
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

// ---------------------------------------------------------------- load posts

if (!fs.existsSync(CONTENT_DIR)) {
  console.error(`HATA: ${CONTENT_DIR} yok. Yazılar blog-content/ altına .md olarak konur.`);
  process.exit(1);
}

const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
if (!files.length) {
  console.error('HATA: blog-content/ altında .md dosyası yok.');
  process.exit(1);
}

const posts = [];
const slugSeen = new Set();

for (const file of files) {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
  const { meta, body } = parseFrontmatter(raw, file);

  for (const req of ['title', 'slug', 'date', 'lang', 'description']) {
    if (!meta[req]) throw new Error(`${file}: zorunlu alan eksik: ${req}`);
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(meta.slug)) {
    throw new Error(`${file}: slug yalnızca küçük harf/rakam/tire olabilir: "${meta.slug}"`);
  }
  if (slugSeen.has(meta.slug)) throw new Error(`${file}: slug tekrar ediyor: "${meta.slug}"`);
  slugSeen.add(meta.slug);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) throw new Error(`${file}: date YYYY-MM-DD olmalı`);
  if (meta.lang !== 'tr' && meta.lang !== 'en') throw new Error(`${file}: lang tr|en olmalı`);
  if (meta.description.length > 170) {
    console.warn(`UYARI ${file}: description ${meta.description.length} karakter (SEO için <160 idealdir)`);
  }

  posts.push({
    slug: meta.slug,
    title: meta.title,
    description: meta.description,
    date: meta.date,
    lang: meta.lang,
    tags: meta.tags ? meta.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    featured: meta.featured === 'true',
    readMins: readingMinutes(body),
    html: marked.parse(body)
  });
}

posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));

// ---------------------------------------------------------------- templates

const NAV = `
<header class="nav">
  <div class="shell-wide nav-row">
    <a href="/" class="brand">
      <span class="brand-mark"><img src="/Site_Logo180.svg" alt="LogWise logo"/></span>
      <span class="brand-name">LOG <b>WISE</b></span>
    </a>
    <div class="nav-actions">
      <a href="/blog" class="brand-blog">BLOG</a>
      <a href="/app" class="btn btn-primary">__OPEN__ →</a>
    </div>
  </div>
</header>`;

const FOOTER = `
<footer>
  <div class="shell-wide foot-row">
    <span>© 2026 LOG WISE</span>
    <span><a href="/">logwise.fit</a> · <a href="/blog">BLOG</a> · <a href="/app">APP</a></span>
  </div>
</footer>`;

const STR = {
  tr: {
    open: "UYGULAMAYI AÇ",
    read: "OKU",
    minRead: "DK OKUMA",
    back: "← Tüm yazılar",
    ctaH: "Antrenmanlarını LogWise ile takip et",
    ctaP: "Set kaydı saniyeler sürer; grafikler ve PR takibi otomatik gelir. Ücretsiz, reklamsız.",
    ctaBtn: "LOGWISE'I AÇ →"
  },
  en: {
    open: "OPEN APP",
    read: "READ",
    minRead: "MIN READ",
    back: "← All posts",
    ctaH: "Track your training with LogWise",
    ctaP: "Logging a set takes seconds; charts and PR tracking come built-in. Free, no ads.",
    ctaBtn: "OPEN LOGWISE →"
  }
};

function headBlock({ title, description, url, lang, jsonLd, ogType, published }) {
  return `<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}"/>
<link rel="canonical" href="${url}"/>
<link rel="icon" href="/favicon.ico"/>
<meta property="og:site_name" content="LogWise"/>
<meta property="og:type" content="${ogType}"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(description)}"/>
<meta property="og:url" content="${url}"/>
<meta property="og:image" content="${OG_IMAGE}"/>
<meta property="og:locale" content="${lang === 'tr' ? 'tr_TR' : 'en_US'}"/>
${published ? `<meta property="article:published_time" content="${published}"/>` : ''}
<meta name="twitter:card" content="summary"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="/blog/blog.css"/>
<script type="application/ld+json">${jsonLd}</script>`;
}

function postPage(p) {
  const t = STR[p.lang];
  const url = `${SITE}/blog/${p.slug}`;
  const jsonLd = jsonForScript({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.description,
    datePublished: p.date,
    dateModified: p.date,
    inLanguage: p.lang,
    mainEntityOfPage: url,
    author: { '@type': 'Organization', name: 'LogWise', url: SITE },
    publisher: {
      '@type': 'Organization', name: 'LogWise',
      logo: { '@type': 'ImageObject', url: OG_IMAGE }
    }
  });

  return `<!DOCTYPE html>
<!-- AUTO-GENERATED — scripts/build-blog.js tarafından üretildi; elle düzenleme. Kaynak: blog-content/ -->
<html lang="${p.lang}">
<head>
${headBlock({ title: `${p.title} — LogWise Blog`, description: p.description, url, lang: p.lang, jsonLd, ogType: 'article', published: p.date })}
</head>
<body>
${NAV.replace('__OPEN__', t.open)}
<main class="shell">
  <article>
    <div class="post-head">
      <div class="post-meta">
        <span class="post-lang">${p.lang.toUpperCase()}</span>
        <time datetime="${p.date}">${fmtDate(p.date, p.lang).toUpperCase()}</time>
        <span class="dot"></span>
        <span>${p.readMins} ${t.minRead}</span>
      </div>
      <h1>${esc(p.title)}</h1>
      <p class="lead">${esc(p.description)}</p>
      ${p.tags.length ? `<div class="post-tags">${p.tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</div>` : ''}
    </div>
    <div class="post-body">
${p.html}
      <div class="post-cta">
        <div>
          <h4>${t.ctaH}</h4>
          <p>${t.ctaP}</p>
        </div>
        <a href="/app" class="btn btn-primary">${t.ctaBtn}</a>
      </div>
    </div>
    <div class="post-foot">
      <a href="/blog" class="back-link">${t.back}</a>
    </div>
  </article>
</main>
${FOOTER}
</body>
</html>
`;
}

function indexPage(allPosts) {
  const url = `${SITE}/blog`;
  const title = 'Blog — LogWise';
  const description = 'Antrenman, takip ve gelişim üzerine kısa, uygulanabilir yazılar. Short, practical reads on training, tracking and progress.';
  const jsonLd = jsonForScript({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'LogWise Blog',
    url,
    blogPost: allPosts.map(p => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `${SITE}/blog/${p.slug}`,
      datePublished: p.date,
      inLanguage: p.lang
    }))
  });

  const cards = allPosts.map(p => {
    const t = STR[p.lang];
    return `    <a class="post-card" data-lang="${p.lang}" href="/blog/${p.slug}">
      <div class="post-card-meta">
        <span class="post-lang">${p.lang.toUpperCase()}</span>
        <time datetime="${p.date}">${fmtDate(p.date, p.lang).toUpperCase()}</time>
      </div>
      <h2>${esc(p.title)}</h2>
      <p>${esc(p.description)}</p>
      <span class="read">${p.readMins} ${t.minRead} · ${t.read} →</span>
    </a>`;
  }).join('\n');

  return `<!DOCTYPE html>
<!-- AUTO-GENERATED — scripts/build-blog.js tarafından üretildi; elle düzenleme. Kaynak: blog-content/ -->
<html lang="tr">
<head>
${headBlock({ title, description, url, lang: 'tr', jsonLd, ogType: 'website' })}
</head>
<body>
${NAV.replace('__OPEN__', 'UYGULAMAYI AÇ')}
<main class="shell-wide">
  <div class="blog-head">
    <div class="kicker">LOGWISE BLOG</div>
    <h1>Antrenmanı sadece yapma — <span style="color:var(--gold)">anla</span>.</h1>
    <p>Antrenman, takip ve gelişim üzerine kısa, uygulanabilir yazılar. · Short, practical reads on training and progress.</p>
    <div class="lang-filter" role="group" aria-label="Dil filtresi / Language filter">
      <button class="on" data-f="all">TÜMÜ · ALL</button>
      <button data-f="tr">TÜRKÇE</button>
      <button data-f="en">ENGLISH</button>
    </div>
  </div>
  <div class="post-list">
${cards}
  </div>
</main>
${FOOTER}
<script>
(function(){
  var btns = document.querySelectorAll('.lang-filter button');
  var cards = document.querySelectorAll('.post-card');
  btns.forEach(function(b){
    b.addEventListener('click', function(){
      btns.forEach(function(x){ x.classList.remove('on'); });
      b.classList.add('on');
      var f = b.getAttribute('data-f');
      cards.forEach(function(c){
        c.style.display = (f === 'all' || c.getAttribute('data-lang') === f) ? '' : 'none';
      });
    });
  });
})();
</script>
</body>
</html>
`;
}

// ---------------------------------------------------------------- write blog/

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Eski üretilmiş post sayfalarını temizle (silinen yazılar artık yayınlanmasın)
for (const f of fs.readdirSync(OUT_DIR)) {
  if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT_DIR, f));
}

for (const p of posts) {
  fs.writeFileSync(path.join(OUT_DIR, `${p.slug}.html`), postPage(p), 'utf8');
}
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexPage(posts), 'utf8');

const manifest = posts.map(({ html, ...rest }) => rest);
fs.writeFileSync(path.join(OUT_DIR, 'posts.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

// ---------------------------------------------------------------- sitemap.xml

const sitemapEntries = [
  ...STATIC_SITEMAP_PAGES.map(page =>
    `  <url>\n    <loc>${SITE}${page.path}</loc>${page.lastmod ? `\n    <lastmod>${page.lastmod}</lastmod>` : ''}\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`
  ),
  ...posts.map(p =>
    `  <url>\n    <loc>${SITE}/blog/${p.slug}</loc>\n    <lastmod>${p.date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`)
];
fs.writeFileSync(
  SITEMAP,
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.join('\n')}\n</urlset>\n`,
  'utf8'
);

// ---------------------------------------------------------------- landing enjeksiyonu

const LANDING_START = '<!-- BLOG-CARDS:START -->';
const LANDING_END = '<!-- BLOG-CARDS:END -->';

function landingPostsFor(lang) {
  return posts
    .slice()
    .sort((a, b) =>
      (a.lang === lang ? 0 : 1) - (b.lang === lang ? 0 : 1) ||
      Number(b.featured) - Number(a.featured) ||
      b.date.localeCompare(a.date) ||
      a.slug.localeCompare(b.slug)
    )
    .slice(0, 3);
}

function landingCard(p, lang) {
  const read = lang === 'tr' ? 'OKU' : 'READ';
  const minRead = lang === 'tr' ? 'dk okuma' : 'min read';
  return `      <a href="/blog/${p.slug}" class="blog-card">
        <div class="blog-card-meta">
          <span class="blog-lang">${p.lang.toUpperCase()}</span>
          <time datetime="${p.date}">${fmtShortDate(p.date, lang).toUpperCase()}</time>
        </div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.description)}</p>
        <span class="blog-card-read">${p.readMins} ${minRead} · ${read} →</span>
      </a>`;
}

const landingUpdated = [];
for (const target of LANDING_FILES) {
  if (!fs.existsSync(target.file)) {
    console.warn(`UYARI: ${path.basename(target.file)} bulunamadı; landing blog kartları enjekte edilmedi.`);
    continue;
  }
  let html = fs.readFileSync(target.file, 'utf8');
  const si = html.indexOf(LANDING_START);
  const ei = html.indexOf(LANDING_END);
  if (si === -1 || ei === -1 || ei < si) {
    console.warn(`UYARI: ${path.basename(target.file)} içinde ${LANDING_START} / ${LANDING_END} marker'ları bulunamadı.`);
    continue;
  }
  const cards = landingPostsFor(target.lang).map(p => landingCard(p, target.lang)).join('\n');
  const injected = `${LANDING_START}\n${cards}\n      ${LANDING_END}`;
  html = html.slice(0, si) + injected + html.slice(ei + LANDING_END.length);
  fs.writeFileSync(target.file, html, 'utf8');
  landingUpdated.push(path.basename(target.file));
}

// ---------------------------------------------------------------- özet

console.log(`Tamamlandı: ${posts.length} yazı üretildi.`);
for (const p of posts) {
  console.log(`  /blog/${p.slug}  [${p.lang}] ${p.featured ? '★ featured' : ''}  ${p.date}  ${p.readMins} dk`);
}
console.log(
  'Güncellendi: blog/index.html, blog/posts.json, sitemap.xml' +
  (landingUpdated.length ? `, ${landingUpdated.join(', ')} (BLOG_CARDS)` : '')
);
