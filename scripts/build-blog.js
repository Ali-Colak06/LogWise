#!/usr/bin/env node
/**
 * LogWise Blog Generator
 * ----------------------
 * blog-content/*.md -> blog/<slug>.html + blog/index.html + blog/posts.json
 * Also rebuilds sitemap.xml and injects featured blog cards into static landing pages.
 *
 * Usage: node scripts/build-blog.js
 * Dependency: scripts/vendor/marked.min.js (vendored UMD, no npm install required)
 *
 * Post format (blog-content/example.md):
 *   ---
 *   title: Post Title
 *   slug: post-title                  (required, lowercase + dash)
 *   date: 2026-06-10                 (YYYY-MM-DD)
 *   lang: en                         (tr | en)
 *   translationKey: post-topic-key    (same value for TR + EN variants)
 *   description: SEO/card description
 *   tags: training, tracking
 *   featured: true                   (optional landing priority)
 *   ---
 *   Markdown body...
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
const LANG_ORDER = ['en', 'tr'];
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
  if (!m) throw new Error(`${file}: frontmatter block (--- ... ---) not found`);
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) throw new Error(`${file}: frontmatter line could not be parsed: "${line}"`);
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
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

function postUrl(post) {
  return `${SITE}/blog/${post.slug}`;
}

function sortedAlternates(post) {
  return LANG_ORDER
    .map(lang => post.alternates[lang])
    .filter(Boolean);
}

function localeFor(lang) {
  return lang === 'tr' ? 'tr_TR' : 'en_US';
}

function languageName(lang) {
  return lang === 'tr' ? 'Türkçe' : 'English';
}

// ---------------------------------------------------------------- load posts

if (!fs.existsSync(CONTENT_DIR)) {
  console.error(`ERROR: ${CONTENT_DIR} does not exist. Put .md posts under blog-content/.`);
  process.exit(1);
}

const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
if (!files.length) {
  console.error('ERROR: No .md files found under blog-content/.');
  process.exit(1);
}

const posts = [];
const slugSeen = new Set();
const groupsByKey = new Map();

for (const file of files) {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
  const { meta, body } = parseFrontmatter(raw, file);

  for (const req of ['title', 'slug', 'date', 'lang', 'translationKey', 'description']) {
    if (!meta[req]) throw new Error(`${file}: missing required field: ${req}`);
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(meta.slug)) {
    throw new Error(`${file}: slug can only contain lowercase letters, numbers, and dashes: "${meta.slug}"`);
  }
  if (slugSeen.has(meta.slug)) throw new Error(`${file}: duplicate slug: "${meta.slug}"`);
  slugSeen.add(meta.slug);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) throw new Error(`${file}: date must be YYYY-MM-DD`);
  if (meta.lang !== 'tr' && meta.lang !== 'en') throw new Error(`${file}: lang must be tr|en`);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(meta.translationKey)) {
    throw new Error(`${file}: translationKey can only contain lowercase letters, numbers, and dashes`);
  }
  if (meta.description.length > 170) {
    console.warn(`WARN ${file}: description is ${meta.description.length} chars (SEO ideal is <160)`);
  }

  const post = {
    slug: meta.slug,
    title: meta.title,
    description: meta.description,
    date: meta.date,
    lang: meta.lang,
    translationKey: meta.translationKey,
    tags: meta.tags ? meta.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    featured: meta.featured === 'true',
    readMins: readingMinutes(body),
    html: marked.parse(body)
  };

  posts.push(post);

  if (!groupsByKey.has(post.translationKey)) {
    groupsByKey.set(post.translationKey, {
      key: post.translationKey,
      posts: [],
      postsByLang: {}
    });
  }
  const group = groupsByKey.get(post.translationKey);
  if (group.postsByLang[post.lang]) {
    throw new Error(`${file}: duplicate ${post.lang} variant for translationKey "${post.translationKey}"`);
  }
  group.posts.push(post);
  group.postsByLang[post.lang] = post;
}

posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));

const postGroups = Array.from(groupsByKey.values()).map(group => {
  const missing = LANG_ORDER.filter(lang => !group.postsByLang[lang]);
  if (missing.length) {
    throw new Error(`translationKey "${group.key}" is missing variant(s): ${missing.join(', ')}`);
  }

  group.posts.sort((a, b) => b.date.localeCompare(a.date) || a.lang.localeCompare(b.lang));
  group.sortDate = group.posts.reduce((latest, post) => post.date > latest ? post.date : latest, group.posts[0].date);
  group.featured = group.posts.some(post => post.featured);

  for (const post of group.posts) {
    post.alternates = {};
    for (const alt of group.posts) {
      post.alternates[alt.lang] = {
        lang: alt.lang,
        slug: alt.slug,
        title: alt.title,
        url: postUrl(alt)
      };
    }
  }

  return group;
}).sort((a, b) =>
  Number(b.featured) - Number(a.featured) ||
  b.sortDate.localeCompare(a.sortDate) ||
  a.key.localeCompare(b.key)
);

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
    open: 'UYGULAMAYI AÇ',
    read: 'OKU',
    minRead: 'DK OKUMA',
    back: '← Tüm yazılar',
    language: 'Bu yazıyı oku:',
    ctaH: 'Antrenmanlarını LogWise ile takip et',
    ctaP: 'Set kaydı saniyeler sürer; grafikler ve PR takibi otomatik gelir. Ücretsiz, reklamsız.',
    ctaBtn: "LOGWISE'I AÇ →"
  },
  en: {
    open: 'OPEN APP',
    read: 'READ',
    minRead: 'MIN READ',
    back: '← All posts',
    language: 'Read this article:',
    ctaH: 'Track your training with LogWise',
    ctaP: 'Logging a set takes seconds; charts and PR tracking come built-in. Free, no ads.',
    ctaBtn: 'OPEN LOGWISE →'
  }
};

function headBlock({ title, description, url, lang, jsonLd, ogType, published, alternates = [] }) {
  const hreflangs = alternates.length ? alternates.map(alt =>
    `<link rel="alternate" hreflang="${alt.lang}" href="${alt.url}"/>`
  ).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${(alternates.find(alt => alt.lang === 'en') || alternates[0]).url}"/>` : '';
  const ogLocaleAlternates = alternates
    .filter(alt => alt.lang !== lang)
    .map(alt => `<meta property="og:locale:alternate" content="${localeFor(alt.lang)}"/>`)
    .join('\n');

  return `<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}"/>
<link rel="canonical" href="${url}"/>
${hreflangs}
<link rel="icon" href="/favicon.ico"/>
<meta property="og:site_name" content="LogWise"/>
<meta property="og:type" content="${ogType}"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(description)}"/>
<meta property="og:url" content="${url}"/>
<meta property="og:image" content="${OG_IMAGE}"/>
<meta property="og:locale" content="${localeFor(lang)}"/>
${ogLocaleAlternates}
${published ? `<meta property="article:published_time" content="${published}"/>` : ''}
<meta name="twitter:card" content="summary"/>
<meta name="twitter:title" content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(description)}"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="/blog/blog.css"/>
<script type="application/ld+json">${jsonLd}</script>`;
}

function postLanguageSwitch(post) {
  const t = STR[post.lang];
  const links = LANG_ORDER.map(lang => {
    const alt = post.alternates[lang];
    const active = lang === post.lang;
    const attrs = [
      `href="/blog/${alt.slug}"`,
      `hreflang="${lang}"`,
      `lang="${lang}"`,
      `class="${active ? 'on' : ''}"`
    ];
    if (active) attrs.push('aria-current="page"');
    return `<a ${attrs.join(' ')}>${languageName(lang)}</a>`;
  }).join('');

  return `<nav class="post-lang-switch" aria-label="${post.lang === 'tr' ? 'Yazı dili' : 'Article language'}">
        <span>${t.language}</span>
        <div>${links}</div>
      </nav>`;
}

function postPage(post) {
  const t = STR[post.lang];
  const url = postUrl(post);
  const alternates = sortedAlternates(post);
  const otherTranslations = alternates
    .filter(alt => alt.lang !== post.lang)
    .map(alt => ({
      '@type': 'BlogPosting',
      headline: alt.title,
      inLanguage: alt.lang,
      url: alt.url
    }));
  const jsonLd = jsonForScript({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: post.lang,
    mainEntityOfPage: url,
    author: { '@type': 'Organization', name: 'LogWise', url: SITE },
    publisher: {
      '@type': 'Organization', name: 'LogWise',
      logo: { '@type': 'ImageObject', url: OG_IMAGE }
    },
    workTranslation: otherTranslations
  });

  return `<!DOCTYPE html>
<!-- AUTO-GENERATED by scripts/build-blog.js. Do not edit blog/*.html manually. Source: blog-content/ -->
<html lang="${post.lang}">
<head>
${headBlock({ title: `${post.title} — LogWise Blog`, description: post.description, url, lang: post.lang, jsonLd, ogType: 'article', published: post.date, alternates })}
</head>
<body>
${NAV.replace('__OPEN__', t.open)}
<main class="shell">
  <article>
    <div class="post-head">
      <div class="post-meta">
        <time datetime="${post.date}">${fmtDate(post.date, post.lang).toUpperCase()}</time>
        <span class="dot"></span>
        <span>${post.readMins} ${t.minRead}</span>
      </div>
      ${postLanguageSwitch(post)}
      <h1>${esc(post.title)}</h1>
      <p class="lead">${esc(post.description)}</p>
      ${post.tags.length ? `<div class="post-tags">${post.tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</div>` : ''}
    </div>
    <div class="post-body">
${post.html}
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

function indexCard(group) {
  const en = group.postsByLang.en;
  const tr = group.postsByLang.tr;
  const primary = en;

  return `    <article class="post-card topic-card" data-topic="${esc(group.key)}">
      <div class="post-card-meta">
        <span class="post-lang">EN/TR</span>
        <time datetime="${group.sortDate}">${fmtShortDate(group.sortDate, 'en').toUpperCase()}</time>
      </div>
      <h2>${esc(primary.title)}</h2>
      <p>${esc(primary.description)}</p>
      <div class="topic-translation" lang="tr">
        <span>TR</span>
        <strong>${esc(tr.title)}</strong>
      </div>
      <div class="post-card-actions" aria-label="Read article language options">
        <a class="read-link" href="/blog/${en.slug}" hreflang="en" lang="en">EN · ${en.readMins} ${STR.en.minRead} →</a>
        <a class="read-link" href="/blog/${tr.slug}" hreflang="tr" lang="tr">TR · ${tr.readMins} ${STR.tr.minRead} →</a>
      </div>
    </article>`;
}

function indexPage(groups) {
  const url = `${SITE}/blog`;
  const title = 'Blog — LogWise';
  const description = 'Short, practical reads on training, tracking and progress. Her yazı İngilizce ve Türkçe okunabilir.';
  const jsonLd = jsonForScript({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'LogWise Blog',
    url,
    blogPost: posts.map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: postUrl(post),
      datePublished: post.date,
      inLanguage: post.lang,
      translationOfWork: post.alternates.en && post.lang === 'tr' ? {
        '@type': 'BlogPosting',
        headline: post.alternates.en.title,
        url: post.alternates.en.url,
        inLanguage: 'en'
      } : undefined
    })).map(item => {
      if (item.translationOfWork === undefined) delete item.translationOfWork;
      return item;
    })
  });

  const cards = groups.map(indexCard).join('\n');

  return `<!DOCTYPE html>
<!-- AUTO-GENERATED by scripts/build-blog.js. Do not edit blog/*.html manually. Source: blog-content/ -->
<html lang="en">
<head>
${headBlock({ title, description, url, lang: 'en', jsonLd, ogType: 'website' })}
</head>
<body>
${NAV.replace('__OPEN__', 'OPEN APP')}
<main class="shell-wide">
  <div class="blog-head">
    <div class="kicker">LOGWISE BLOG</div>
    <h1>Training notes that work in <span style="color:var(--gold)">both languages</span>.</h1>
    <p>Short, practical reads on training, tracking and progress. Her yazı İngilizce ve Türkçe okunabilir.</p>
  </div>
  <div class="post-list">
${cards}
  </div>
</main>
${FOOTER}
</body>
</html>
`;
}

// ---------------------------------------------------------------- write blog/

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

for (const f of fs.readdirSync(OUT_DIR)) {
  if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT_DIR, f));
}

for (const post of posts) {
  fs.writeFileSync(path.join(OUT_DIR, `${post.slug}.html`), postPage(post), 'utf8');
}
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexPage(postGroups), 'utf8');

const manifest = posts.map(post => ({
  slug: post.slug,
  title: post.title,
  description: post.description,
  date: post.date,
  lang: post.lang,
  translationKey: post.translationKey,
  tags: post.tags,
  featured: post.featured,
  readMins: post.readMins,
  url: `/blog/${post.slug}`,
  alternates: LANG_ORDER.reduce((acc, lang) => {
    const alt = post.alternates[lang];
    if (alt) acc[lang] = { slug: alt.slug, title: alt.title, url: `/blog/${alt.slug}` };
    return acc;
  }, {})
}));
fs.writeFileSync(path.join(OUT_DIR, 'posts.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

// ---------------------------------------------------------------- sitemap.xml

function sitemapStaticEntry(page) {
  return `  <url>\n    <loc>${SITE}${page.path}</loc>${page.lastmod ? `\n    <lastmod>${page.lastmod}</lastmod>` : ''}\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`;
}

function sitemapPostEntry(post) {
  const alternates = sortedAlternates(post);
  const xDefault = alternates.find(alt => alt.lang === 'en') || alternates[0];
  const links = [
    ...alternates.map(alt => `    <xhtml:link rel="alternate" hreflang="${alt.lang}" href="${alt.url}"/>`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${xDefault.url}"/>`
  ].join('\n');

  return `  <url>\n    <loc>${postUrl(post)}</loc>\n${links}\n    <lastmod>${post.date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
}

const sitemapEntries = [
  ...STATIC_SITEMAP_PAGES.map(sitemapStaticEntry),
  ...posts.map(sitemapPostEntry)
];
fs.writeFileSync(
  SITEMAP,
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sitemapEntries.join('\n')}\n</urlset>\n`,
  'utf8'
);

// ---------------------------------------------------------------- landing injection

const LANDING_START = '<!-- BLOG-CARDS:START -->';
const LANDING_END = '<!-- BLOG-CARDS:END -->';

function groupPriorityForLang(group, lang) {
  const local = group.postsByLang[lang];
  if (local && local.featured) return 2;
  return group.featured ? 1 : 0;
}

function landingPostsFor(lang) {
  return postGroups
    .slice()
    .sort((a, b) =>
      groupPriorityForLang(b, lang) - groupPriorityForLang(a, lang) ||
      b.sortDate.localeCompare(a.sortDate) ||
      a.key.localeCompare(b.key)
    )
    .slice(0, 3)
    .map(group => group.postsByLang[lang] || group.postsByLang.en || group.postsByLang.tr);
}

function landingCard(post, lang) {
  const read = lang === 'tr' ? 'OKU' : 'READ';
  const minRead = lang === 'tr' ? 'dk okuma' : 'min read';
  return `      <a href="/blog/${post.slug}" class="blog-card">
        <div class="blog-card-meta">
          <span class="blog-lang">${post.lang.toUpperCase()}</span>
          <time datetime="${post.date}">${fmtShortDate(post.date, lang).toUpperCase()}</time>
        </div>
        <h3>${esc(post.title)}</h3>
        <p>${esc(post.description)}</p>
        <span class="blog-card-read">${post.readMins} ${minRead} · ${read} →</span>
      </a>`;
}

const landingUpdated = [];
for (const target of LANDING_FILES) {
  if (!fs.existsSync(target.file)) {
    console.warn(`WARN: ${path.basename(target.file)} was not found; landing blog cards were not injected.`);
    continue;
  }
  let html = fs.readFileSync(target.file, 'utf8');
  const si = html.indexOf(LANDING_START);
  const ei = html.indexOf(LANDING_END);
  if (si === -1 || ei === -1 || ei < si) {
    console.warn(`WARN: ${path.basename(target.file)} does not contain ${LANDING_START} / ${LANDING_END} markers.`);
    continue;
  }
  const cards = landingPostsFor(target.lang).map(post => landingCard(post, target.lang)).join('\n');
  const injected = `${LANDING_START}\n${cards}\n      ${LANDING_END}`;
  html = html.slice(0, si) + injected + html.slice(ei + LANDING_END.length);
  fs.writeFileSync(target.file, html, 'utf8');
  landingUpdated.push(path.basename(target.file));
}

// ---------------------------------------------------------------- summary

console.log(`Done: ${posts.length} language variants across ${postGroups.length} blog topics generated.`);
for (const group of postGroups) {
  console.log(`  ${group.key}  [en:/blog/${group.postsByLang.en.slug}] [tr:/blog/${group.postsByLang.tr.slug}]`);
}
console.log(
  'Updated: blog/index.html, blog/posts.json, sitemap.xml' +
  (landingUpdated.length ? `, ${landingUpdated.join(', ')} (BLOG_CARDS)` : '')
);
