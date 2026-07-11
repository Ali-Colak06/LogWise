#!/usr/bin/env node
/**
 * LogWise Programmatic SEO Generator
 * ----------------------------------
 * data/*.js -> library.html + library directories + library/exercises/*.html + library/programs/*.html
 *
 * MVP scope:
 *   /library
 *   /library/exercises
 *   /library/programs
 *   /library/exercises/bench-press
 *   /library/exercises/squat
 *   /library/exercises/deadlift
 *   /library/programs/push-pull-legs
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadAndValidateExerciseGuides } = require('./build-ex-guides.js');

const DEFAULT_ROOT = path.join(__dirname, '..');
const DEFAULT_SITE = 'https://logwise.fit';
const DATE_PUBLISHED = '2026-06-15';
const LASTMOD = '2026-06-15';
const HUB_LASTMOD = '2026-07-11';
const OG_IMAGE = '/icon-512.png';
const LIBRARY_PATH = '/library';
const TURKISH_LIBRARY_PATH = '/kutuphane';
const EXERCISE_LIBRARY_PATH = '/library/exercises';
const PROGRAM_LIBRARY_PATH = '/library/programs';

const GENERATED_EXERCISES = ['bench-press', 'squat', 'deadlift'];
const GENERATED_PROGRAMS = ['push-pull-legs'];

const SITEMAP_PAGES = [
  {
    path: LIBRARY_PATH,
    lastmod: HUB_LASTMOD,
    changefreq: 'monthly',
    priority: '0.8',
    alternates: [
      { lang: 'en', path: LIBRARY_PATH },
      { lang: 'tr', path: TURKISH_LIBRARY_PATH },
      { lang: 'x-default', path: LIBRARY_PATH }
    ]
  },
  {
    path: TURKISH_LIBRARY_PATH,
    lastmod: HUB_LASTMOD,
    changefreq: 'monthly',
    priority: '0.8',
    alternates: [
      { lang: 'en', path: LIBRARY_PATH },
      { lang: 'tr', path: TURKISH_LIBRARY_PATH },
      { lang: 'x-default', path: LIBRARY_PATH }
    ]
  },
  {
    path: EXERCISE_LIBRARY_PATH,
    lastmod: LASTMOD,
    changefreq: 'monthly',
    priority: '0.8'
  },
  {
    path: PROGRAM_LIBRARY_PATH,
    lastmod: LASTMOD,
    changefreq: 'monthly',
    priority: '0.8'
  },
  ...GENERATED_EXERCISES.map(slug => ({
    path: `${EXERCISE_LIBRARY_PATH}/${slug}`,
    lastmod: LASTMOD,
    changefreq: 'monthly',
    priority: '0.7'
  })),
  ...GENERATED_PROGRAMS.map(slug => ({
    path: `${PROGRAM_LIBRARY_PATH}/${slug}`,
    lastmod: LASTMOD,
    changefreq: 'monthly',
    priority: '0.7'
  }))
];

const CATEGORY_LABELS = {
  'Göğüs': 'Chest',
  'Omuz': 'Shoulders',
  'Triceps': 'Triceps',
  'Biceps': 'Biceps',
  'Bilek': 'Forearms',
  'Sırt': 'Back',
  'Bacak': 'Legs',
  'Kalça': 'Glutes',
  'Kalf': 'Calves',
  'Trapez': 'Traps',
  'Karın': 'Core',
  'Kardiyo': 'Cardio'
};

const EXERCISE_GUIDES = {
  'bench-press': {
    title: 'Bench Press',
    metaTitle: 'Bench Press Guide: Form, Muscles, Mistakes & Progression | LogWise',
    description: 'Learn how to bench press with cleaner form, avoid common mistakes, progress your sets, and track bench press workouts in LogWise.',
    quickFacts: {
      primaryMuscles: 'Chest, front delts, triceps',
      equipment: 'Barbell, flat bench, rack',
      pattern: 'Horizontal press',
      bestFor: 'Upper-body strength and pressing volume'
    },
    howTo: [
      'Set your eyes under the bar, plant your feet, and pull your shoulder blades back into the bench.',
      'Grip the bar slightly wider than shoulder width and keep your wrists stacked over your elbows.',
      'Unrack with control, lower the bar toward the mid-to-lower chest, and keep the elbows slightly tucked.',
      'Touch the chest without bouncing, then press up and back until the bar is over the shoulders.',
      'Keep your hips on the bench and repeat each rep with the same setup and bar path.'
    ],
    mistakes: [
      'Bouncing the bar off the chest instead of controlling the bottom.',
      'Letting the shoulders roll forward before or during the press.',
      'Flaring the elbows straight out to the sides on every rep.',
      'Lifting the hips off the bench to turn the set into a different movement.'
    ],
    progression: [
      'Add reps inside a fixed range before adding load, such as 3 sets of 6-8.',
      'Use small load jumps on pressing movements when possible.',
      'Track working-set volume so extra bench work does not quietly outpace recovery.',
      'Leave 1-3 reps in reserve on most sets and save true grinders for planned tests.'
    ],
    tracking: [
      'Log each set with weight, reps, and RIR so your next target is obvious.',
      'Add notes for grip width, pause reps, shoulder comfort, or spotter help.',
      'Use estimated 1RM as a trend, not as a reason to max out every week.'
    ],
    related: ['incline-bench-press', 'close-grip-bench-press', 'dumbell-press']
  },
  squat: {
    title: 'Squat',
    metaTitle: 'Squat Guide: Form, Muscles, Mistakes & Progression | LogWise',
    description: 'Learn how to squat with better form, track sets and volume, avoid common squat mistakes, and progress your lower-body training.',
    quickFacts: {
      primaryMuscles: 'Quads, glutes, hamstrings, core',
      equipment: 'Barbell, rack, plates',
      pattern: 'Squat',
      bestFor: 'Lower-body strength, leg volume, full-body bracing'
    },
    howTo: [
      'Set the bar securely on the upper back, brace your torso, and step out with a stable stance.',
      'Keep your feet rooted and let the knees track in the same direction as the toes.',
      'Sit down between your hips while keeping the chest tall and the midfoot balanced.',
      'Reach a depth you can control, then drive the floor away to stand up.',
      'Reset your breath and brace before each rep instead of rushing the set.'
    ],
    mistakes: [
      'Letting the knees collapse inward as the load gets heavy.',
      'Rising onto the toes and losing midfoot balance.',
      'Relaxing the brace at the bottom of the rep.',
      'Cutting depth shorter every week while counting it as progress.'
    ],
    progression: [
      'Progress reps first, then load, while keeping depth consistent.',
      'Use volume changes carefully because squat fatigue can affect the rest of the week.',
      'Track RIR so a normal working set does not become an accidental max attempt.',
      'If the lift stalls, adjust volume, pause work, or recovery before changing everything.'
    ],
    tracking: [
      'Record stance notes, depth, belt use, and any form cues that changed the set.',
      'Track total squat volume and compare it with leg press, lunges, and other leg work.',
      'Review estimated 1RM over several weeks rather than reacting to one rough session.'
    ],
    related: ['goblet-squat', 'leg-press', 'bulgarian-split-squat']
  },
  deadlift: {
    title: 'Deadlift',
    metaTitle: 'Deadlift Guide: Form, Muscles, Mistakes & Progression | LogWise',
    description: 'Learn how to deadlift with a stronger setup, avoid common mistakes, progress safely, and track deadlift workouts in LogWise.',
    quickFacts: {
      primaryMuscles: 'Back, glutes, hamstrings, quads, grip',
      equipment: 'Barbell and plates',
      pattern: 'Hip hinge and pull',
      bestFor: 'Total-body strength and posterior-chain loading'
    },
    howTo: [
      'Stand with the bar over the midfoot and place your feet around hip width.',
      'Hinge down, grip the bar, and bring the shins to the bar without pushing it forward.',
      'Brace hard, pull the slack out of the bar, and keep the chest proud.',
      'Push the floor away while the bar stays close to the legs.',
      'Lock out by driving the hips through, then lower the bar with control.'
    ],
    mistakes: [
      'Starting with the bar too far from the body.',
      'Rounding the back because the brace or setup was rushed.',
      'Yanking the bar off the floor before tension is built.',
      'Turning every deadlift session into a maximal test.'
    ],
    progression: [
      'Progress deadlift volume conservatively because heavy pulls are expensive to recover from.',
      'Use top sets plus back-off sets if straight heavy volume beats you up.',
      'Track RIR and bar speed notes so you can tell a strong pull from a forced pull.',
      'Rotate variations only when they solve a clear problem, not just because the lift feels hard.'
    ],
    tracking: [
      'Log stance, grip, straps, belt use, and whether reps were touch-and-go or reset.',
      'Track weekly pulling volume alongside rows, pull-ups, and Romanian deadlifts.',
      'Use notes to separate technical misses from strength misses.'
    ],
    related: ['romanian-deadlift', 'barbell-row', 'back-extension']
  }
};

const PROGRAM_GUIDES = {
  'push-pull-legs': {
    title: 'Push Pull Legs Program',
    sourceNameEN: 'Push Pull Legs (PPL)',
    metaTitle: 'Push Pull Legs Program: Weekly PPL Workout Layout | LogWise',
    description: 'Use this Push Pull Legs program guide to understand the weekly PPL layout, exercises, progression, and how to track it in LogWise.',
    overview: [
      { label: 'Weekly frequency', value: '6 training days' },
      { label: 'Day structure', value: 'Push, pull, legs, repeat' },
      { label: 'Best for', value: 'Intermediate lifters who recover well' },
      { label: 'Main goal', value: 'Balanced hypertrophy and strength practice' }
    ],
    layout: [
      { day: 'Monday', type: 'Push', note: 'Chest, shoulders, triceps' },
      { day: 'Tuesday', type: 'Pull', note: 'Back, rear delts, biceps' },
      { day: 'Wednesday', type: 'Legs', note: 'Squat pattern, leg accessories' },
      { day: 'Thursday', type: 'Push', note: 'Second pressing day' },
      { day: 'Friday', type: 'Pull', note: 'Deadlift and pulling volume' },
      { day: 'Saturday', type: 'Legs', note: 'Leg press, lunge, glute work' },
      { day: 'Sunday', type: 'Rest', note: 'Recover and review the log' }
    ],
    progression: [
      'Start with loads you can complete with 1-3 reps in reserve on most working sets.',
      'Add reps first, then add weight once all sets reach the top of the target range.',
      'Watch weekly volume by movement pattern so push, pull, and legs stay balanced.',
      'If performance drops across several sessions, reduce volume or add recovery before adding more exercises.'
    ],
    relatedReading: [
      {
        title: 'Progressive Overload, Explained Simply',
        url: '/learn/progressive-overload-explained'
      },
      {
        title: 'Workout Tracker App: What to Log for Real Progress',
        url: '/learn/workout-tracker-app-guide'
      }
    ]
  }
};

const RELATED_TOOLS = [
  {
    eyebrow: '1RM',
    title: 'One Rep Max Calculator',
    description: 'Estimate max strength from a hard set and compare training loads.',
    url: '/one-rep-max-calculator',
    action: 'OPEN CALCULATOR'
  },
  {
    eyebrow: 'VOLUME',
    title: 'Workout Volume Calculator',
    description: 'Total sets x reps x weight by exercise before changing your program.',
    url: '/workout-volume-calculator',
    action: 'OPEN CALCULATOR'
  },
  {
    eyebrow: 'TEMPLATE',
    title: 'Workout Log Template',
    description: 'Use a simple sheet for exercises, sets, reps, weight, RIR, and notes.',
    url: '/workout-log-template',
    action: 'OPEN TEMPLATE'
  }
];

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function jsonForScript(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

function siteUrl(site, pagePath) {
  return `${site}${pagePath}`;
}

function exerciseGuidePath(slug) {
  return `${EXERCISE_LIBRARY_PATH}/${slug}`;
}

function programGuidePath(slug) {
  return `${PROGRAM_LIBRARY_PATH}/${slug}`;
}

function sitemapPages() {
  return SITEMAP_PAGES.map(page => Object.assign({}, page));
}

function loadWindowData(root) {
  const ctx = { window: {} };
  vm.createContext(ctx);

  [
    'data/presets-exercises.js',
    'data/ex-descriptions.js',
    'data/ex-preview.js',
    'data/presets-programs.js'
  ].forEach(file => {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
  });

  return ctx.window;
}

function exerciseName(exercise) {
  return exercise.nameEN || exercise.name;
}

function buildLookups(windowData, guides) {
  return {
    exercises: windowData.LOGWISE_PRESET_EXERCISES || [],
    descriptions: windowData.LOGWISE_EX_DESCS || {},
    previews: windowData.LOGWISE_EX_PREVIEW || {},
    guides: guides || {},
    programs: windowData.LOGWISE_PRESET_PROGRAMS || [],
    exerciseById: new Map((windowData.LOGWISE_PRESET_EXERCISES || []).map(ex => [ex.id, ex]))
  };
}

function categoryList(exercise) {
  return (exercise.categories || []).map(category => CATEGORY_LABELS[category] || category).join(', ');
}

function descriptionFor(data, id) {
  const short = data.descriptions[id] && data.descriptions[id][1];
  const long = data.previews[id] && data.previews[id].desc && data.previews[id].desc[1];
  return short || long || '';
}

function descriptionForTR(data, id) {
  const short = data.descriptions[id] && data.descriptions[id][0];
  const long = data.previews[id] && data.previews[id].desc && data.previews[id].desc[0];
  return short || long || '';
}

function localizedEN(value) {
  return Array.isArray(value) ? value[1] : '';
}

function localizedListEN(value) {
  return Array.isArray(value) ? value.map(localizedEN).filter(Boolean) : [];
}

function canonicalGuideFor(data, id) {
  const source = data.guides[id];
  const exercise = data.exerciseById.get(id);
  if (!source || !source.publish || !exercise) return null;

  const web = source.web;
  return {
    title: exerciseName(exercise),
    metaTitle: localizedEN(web.metaTitle),
    metaDescription: localizedEN(web.metaDescription),
    description: localizedEN(source.description),
    quickFacts: {
      primaryMuscles: localizedEN(web.quickFacts.primaryMuscles),
      equipment: localizedEN(web.quickFacts.equipment),
      pattern: localizedEN(web.quickFacts.movementPattern),
      bestFor: localizedEN(web.quickFacts.bestFor)
    },
    howTo: localizedListEN(source.formSteps),
    mistakes: localizedListEN(source.mistakes),
    progression: localizedListEN(source.progression),
    tracking: localizedListEN(web.tracking),
    tips: localizedListEN(source.tips),
    related: web.related.slice(),
    mediaReady: source.mediaReady,
    media: source.media,
    canonical: true
  };
}

function exerciseGuideFor(data, id) {
  return canonicalGuideFor(data, id) || EXERCISE_GUIDES[id];
}

function sourceTips(data, id, guide) {
  if (guide && guide.canonical) return guide.tips.slice(0, 4);
  const preview = data.previews[id];
  if (!preview || !Array.isArray(preview.tips)) return [];
  return preview.tips.map(tip => tip[1]).filter(Boolean).slice(0, 4);
}

function headBlock({ title, description, url, site, jsonLd, image, lang = 'en', alternates }) {
  const socialImage = image || `${site}${OG_IMAGE}`;
  const twitterCard = image ? 'summary_large_image' : 'summary';
  const locale = lang === 'tr' ? 'tr_TR' : 'en_US';
  const alternateLocale = lang === 'tr' ? 'en_US' : 'tr_TR';
  const languageAlternates = alternates || [
    { lang: 'en', url },
    { lang: 'x-default', url }
  ];
  const alternateLinks = languageAlternates
    .map(item => `<link rel="alternate" hreflang="${item.lang}" href="${item.url}"/>`)
    .join('\n');
  const hasOtherLocale = languageAlternates.some(item => item.lang === (lang === 'tr' ? 'en' : 'tr'));
  const alternateLocaleMeta = hasOtherLocale
    ? `\n<meta property="og:locale:alternate" content="${alternateLocale}"/>`
    : '';
  return `<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}"/>
<link rel="canonical" href="${url}"/>
${alternateLinks}
<link rel="icon" type="image/x-icon" href="/favicon.ico"/>
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"/>
<link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png"/>
<link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
<link rel="manifest" href="/manifest.json"/>
<meta property="og:site_name" content="LogWise"/>
<meta property="og:type" content="website"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(description)}"/>
<meta property="og:url" content="${url}"/>
<meta property="og:image" content="${esc(socialImage)}"/>
<meta property="og:locale" content="${locale}"/>${alternateLocaleMeta}
<meta name="twitter:card" content="${twitterCard}"/>
<meta name="twitter:title" content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(description)}"/>
<meta name="twitter:image" content="${esc(socialImage)}"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="/styles/landing.css"/>
<link rel="stylesheet" href="/styles/site-nav.css"/>
<script src="/site-nav.js" defer></script>
<script type="application/ld+json">${jsonForScript(jsonLd)}</script>`;
}

function nav(linkSet, options = {}) {
  const lang = options.lang === 'tr' ? 'tr' : 'en';
  const homeHref = lang === 'tr' ? '/tr' : '/';
  const primaryLabel = lang === 'tr' ? 'Ana yönlendirme' : 'Primary';
  const appLabel = lang === 'tr' ? 'KAYDETMEYE BAŞLA' : 'START TRACKING';
  const mobileAppLabel = lang === 'tr' ? 'AÇ' : 'OPEN';
  const languageLabel = lang === 'tr' ? 'Dil' : 'Language';
  const languageSwitch = options.translations ? `<div class="lang-switch" role="group" aria-label="${languageLabel}">
        <a href="${options.translations.tr}" hreflang="tr" class="${lang === 'tr' ? 'on' : ''}"${lang === 'tr' ? ' aria-current="page"' : ''}>TR</a>
        <a href="${options.translations.en}" hreflang="en" class="${lang === 'en' ? 'on' : ''}"${lang === 'en' ? ' aria-current="page"' : ''}>EN</a>
      </div>` : '';
  const languageControl = languageSwitch ? `${languageSwitch}\n      ` : '';
  const links = linkSet.map(link => `<a href="${link.href}">${esc(link.label)}</a>`).join('\n      ');
  return `<header class="nav">
  <div class="shell nav-row">
    <a href="${homeHref}" class="brand">
      <span class="brand-mark"><img src="/Site_Logo180.svg" alt="LogWise logo" class="logo-img"/></span>
      <span class="brand-name">LOG <b>WISE</b></span>
    </a>
    <nav class="nav-links" aria-label="${primaryLabel}">
      ${links}
    </nav>
    <div class="nav-actions">
      ${languageControl}<a href="/app" class="btn btn-primary"><span class="desktop-label">${appLabel}</span><span class="mobile-label">${mobileAppLabel}</span> &rarr;</a>
    </div>
  </div>
</header>`;
}

function footer(lang = 'en') {
  if (lang === 'tr') {
    return `<footer>
  <div class="shell foot-row">
    <div class="footer-brand-block">
      <a href="/tr" class="brand">
        <span class="brand-mark"><img src="/Site_Logo180.svg" alt="LogWise logo" class="logo-img"/></span>
        <span class="brand-name">LOG <b>WISE</b></span>
      </a>
      <p class="foot-tagline">Gelişimini daha net görmek isteyen sporcular için ücretsiz, tarayıcı tabanlı antrenman takibi.</p>
    </div>
    <div class="foot-col">
      <h5>Kütüphane</h5>
      <a href="/kutuphane">Genel bakış</a>
      <a href="/library/exercises" hreflang="en">Egzersizler</a>
      <a href="/library/exercises/bench-press" hreflang="en">Bench Press</a>
      <a href="/library/exercises/squat" hreflang="en">Squat</a>
      <a href="/library/exercises/deadlift" hreflang="en">Deadlift</a>
    </div>
    <div class="foot-col">
      <h5>Programlar</h5>
      <a href="/library/programs" hreflang="en">Tüm programlar</a>
      <a href="/library/programs/push-pull-legs" hreflang="en">Push Pull Legs</a>
      <a href="/app">Antrenman günlüğü</a>
      <a href="/araclar">Ücretsiz araçlar</a>
    </div>
    <div class="foot-col">
      <h5>LogWise</h5>
      <a href="/tr">Ana Sayfa</a>
      <a href="/ogren">Öğren</a>
      <a href="/library" hreflang="en">English library</a>
    </div>
  </div>
  <div class="shell foot-bottom">
    <span>&copy; 2026 LOG WISE</span>
    <span>ANTRENMAN KÜTÜPHANESİ &middot; LOGWISE.FIT</span>
  </div>
</footer>`;
  }

  return `<footer>
  <div class="shell foot-row">
    <div class="footer-brand-block">
      <a href="/" class="brand">
        <span class="brand-mark"><img src="/Site_Logo180.svg" alt="LogWise logo" class="logo-img"/></span>
        <span class="brand-name">LOG <b>WISE</b></span>
      </a>
      <p class="foot-tagline">Free browser-based workout tracking for lifters who want clearer progress.</p>
    </div>
    <div class="foot-col">
      <h5>Library</h5>
      <a href="/library">Overview</a>
      <a href="/library/exercises">Exercises</a>
      <a href="/library/exercises/bench-press">Bench Press</a>
      <a href="/library/exercises/squat">Squat</a>
      <a href="/library/exercises/deadlift">Deadlift</a>
    </div>
    <div class="foot-col">
      <h5>Programs</h5>
      <a href="/library/programs">All programs</a>
      <a href="/library/programs/push-pull-legs">Push Pull Legs</a>
      <a href="/app">Workout log app</a>
      <a href="/tools">Free tools</a>
    </div>
    <div class="foot-col">
      <h5>LogWise</h5>
      <a href="/">Home</a>
      <a href="/learn">Learn</a>
      <a href="/tr">Turkish landing</a>
    </div>
  </div>
  <div class="shell foot-bottom">
    <span>&copy; 2026 LOG WISE</span>
    <span>TRAINING LIBRARY &middot; LOGWISE.FIT</span>
  </div>
</footer>`;
}

function listItems(items) {
  return items.map(item => `        <li>${esc(item)}</li>`).join('\n');
}

function toolCards() {
  return RELATED_TOOLS.map(tool => `<a href="${tool.url}" class="tool-related-card">
      <span>${esc(tool.eyebrow)}</span>
      <h3>${esc(tool.title)}</h3>
      <p>${esc(tool.description)}</p>
      <em>${esc(tool.action)} &rarr;</em>
    </a>`).join('\n');
}

function toolCardsTR() {
  const tools = [
    {
      url: '/one-rep-max-calculator',
      eyebrow: '1RM',
      title: 'Tek Tekrar Maksimum Hesaplayıcı',
      description: 'Zorlu bir setten tahmini maksimum gücünü ve antrenman yüklerini hesapla.',
      action: 'HESAPLAYICIYI AÇ'
    },
    {
      url: '/workout-volume-calculator',
      eyebrow: 'HACİM',
      title: 'Antrenman Hacmi Hesaplayıcı',
      description: 'Programını değiştirmeden önce egzersiz bazında set × tekrar × ağırlık toplamını gör.',
      action: 'HESAPLAYICIYI AÇ'
    },
    {
      url: '/workout-log-template',
      eyebrow: 'ŞABLON',
      title: 'Antrenman Günlüğü Şablonu',
      description: 'Egzersiz, set, tekrar, ağırlık, RIR ve notlar için sade bir çalışma sayfası kullan.',
      action: 'ŞABLONU AÇ'
    }
  ];

  return tools.map(tool => `<a href="${tool.url}" hreflang="en" class="tool-related-card">
      <span>${esc(tool.eyebrow)}</span>
      <h3>${esc(tool.title)}</h3>
      <p>${esc(tool.description)}</p>
      <em>${esc(tool.action)} &rarr;</em>
    </a>`).join('\n');
}

function relatedExerciseCard(data, id, generatedIds) {
  const exercise = data.exerciseById.get(id);
  if (!exercise) return '';
  const name = exerciseName(exercise);
  const description = descriptionFor(data, id) || `${name} is available in the LogWise exercise library.`;
  const attrs = generatedIds.has(id)
    ? `a href="${exerciseGuidePath(id)}" class="guide-link-card"`
    : 'article class="guide-link-card guide-link-card-static"';
  const closeTag = generatedIds.has(id) ? 'a' : 'article';
  const action = generatedIds.has(id) ? '<em>OPEN EXERCISE &rarr;</em>' : '<em>IN LOGWISE LIBRARY</em>';

  return `    <${attrs}>
      <span>${esc(categoryList(exercise))}</span>
      <h3>${esc(name)}</h3>
      <p>${esc(description)}</p>
      ${action}
    </${closeTag}>`;
}

function relatedExerciseCardTR(data, id) {
  const exercise = data.exerciseById.get(id);
  if (!exercise) return '';
  const name = exercise.name || exerciseName(exercise);
  const description = descriptionForTR(data, id) || `${name}, LogWise egzersiz kütüphanesinde yer alır.`;

  return `    <a href="${exerciseGuidePath(id)}" hreflang="en" class="guide-link-card">
      <span>${esc((exercise.categories || []).join(', '))}</span>
      <h3>${esc(name)}</h3>
      <p>${esc(description)}</p>
      <em>EGZERSİZİ AÇ &rarr;</em>
    </a>`;
}

function primaryCategory(exercise) {
  const category = (exercise.categories && exercise.categories[0]) || 'Other';
  return CATEGORY_LABELS[category] || category;
}

function exerciseDirectoryGroups(data) {
  const groups = new Map();
  for (const exercise of data.exercises) {
    const category = primaryCategory(exercise);
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(exercise);
  }

  return Array.from(groups.entries()).map(([category, exercises]) => ({
    category,
    exercises: exercises.slice().sort((a, b) => exerciseName(a).localeCompare(exerciseName(b), 'en'))
  }));
}

function exerciseDirectoryCard(data, exercise, generatedIds) {
  const name = exerciseName(exercise);
  const description = descriptionFor(data, exercise.id) || `${name} is available in the LogWise exercise library.`;
  if (generatedIds.has(exercise.id)) {
    return `      <a href="${exerciseGuidePath(exercise.id)}" class="guide-link-card directory-card">
        <span>${esc(categoryList(exercise))}</span>
        <h3>${esc(name)}</h3>
        <p>${esc(description)}</p>
        <em>OPEN EXERCISE &rarr;</em>
      </a>`;
  }

  return `      <article class="guide-link-card guide-link-card-static directory-card">
        <span>${esc(categoryList(exercise))}</span>
        <h3>${esc(name)}</h3>
        <p>${esc(description)}</p>
        <em>IN LOGWISE LIBRARY</em>
      </article>`;
}

function programGuideSlug(program) {
  return Object.keys(PROGRAM_GUIDES).find(slug => PROGRAM_GUIDES[slug].sourceNameEN === program.nameEN) || null;
}

function activeProgramDays(program) {
  return Object.values(program.days || {}).filter(day => Array.isArray(day) && day.length).length;
}

function uniqueProgramExercises(program) {
  return new Set(Object.values(program.days || {}).flat().filter(Boolean));
}

function programDirectoryCard(program, data) {
  const slug = programGuideSlug(program);
  const exerciseCount = uniqueProgramExercises(program).size;
  const activeDays = activeProgramDays(program);
  const href = slug ? programGuidePath(slug) : '/app';
  const tag = slug ? 'PROGRAM PAGE' : 'APP PRESET';
  const action = slug ? 'OPEN PROGRAM' : 'USE IN LOGWISE';
  const cardTag = slug ? 'a' : 'article';
  const attrs = slug
    ? `href="${href}" class="guide-link-card directory-program-card"`
    : 'class="guide-link-card guide-link-card-static directory-program-card"';

  return `    <${cardTag} ${attrs}>
      <span>${tag}</span>
      <h3>${esc(program.nameEN || program.name)}</h3>
      <p>${esc(program.descEN || program.desc)}</p>
      <dl class="directory-card-stats">
        <div><dt>Days</dt><dd>${activeDays}</dd></div>
        <div><dt>Exercises</dt><dd>${exerciseCount}</dd></div>
      </dl>
      <em>${action}${slug ? ' &rarr;' : ''}</em>
    </${cardTag}>`;
}

function slugifyLabel(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function jsonLdBreadcrumb(site, parts) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: parts.map((part, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: part.name,
      item: `${site}${part.path}`
    }))
  };
}

function exerciseJsonLd({ site, slug, guide }) {
  const path = exerciseGuidePath(slug);
  const url = siteUrl(site, path);
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: guide.title,
      url,
      description: guide.description,
      inLanguage: 'en',
      datePublished: DATE_PUBLISHED,
      dateModified: LASTMOD,
      isPartOf: { '@type': 'WebSite', name: 'LogWise', url: site },
      about: [guide.title, 'strength training', 'workout tracking']
    },
    jsonLdBreadcrumb(site, [
      { name: 'LogWise', path: '/' },
      { name: 'Library', path: LIBRARY_PATH },
      { name: 'Exercises', path: EXERCISE_LIBRARY_PATH },
      { name: guide.title, path }
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: `How to do the ${guide.title}`,
      description: guide.description,
      step: guide.howTo.map((text, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: `Step ${index + 1}`,
        text
      }))
    }
  ];
}

function exerciseDemoBlock(guide) {
  if (!guide.mediaReady || !guide.media || !guide.media.demoMp4 || !guide.media.poster) return '';
  const webm = guide.media.demoWebm
    ? `          <source src="${esc(guide.media.demoWebm)}" type="video/webm"/>\n`
    : '';
  return `      <section class="guide-block guide-media-block" aria-labelledby="movement-demo-title">
        <div class="section-kicker">MOVEMENT DEMO</div>
        <h2 id="movement-demo-title">Watch the movement</h2>
        <figure class="guide-demo">
          <video controls muted loop playsinline preload="metadata" poster="${esc(guide.media.poster)}" aria-label="${esc(localizedEN(guide.media.demoLabel))}">
${webm}          <source src="${esc(guide.media.demoMp4)}" type="video/mp4"/>
          </video>
          <figcaption>${esc(localizedEN(guide.media.demoLabel))}</figcaption>
        </figure>
      </section>
`;
}

function exerciseMuscleMapBlock(guide, placement) {
  if (!guide.mediaReady || !guide.media || !guide.media.muscleMap) return '';
  const placementClass = placement === 'inline' ? 'guide-muscle-map-inline' : 'guide-muscle-map-side';
  return `      <div class="guide-side-box guide-muscle-map ${placementClass}">
        <h3>Muscles worked</h3>
        <img src="${esc(guide.media.muscleMap)}" alt="${esc(localizedEN(guide.media.muscleMapAlt))}" width="800" height="1000" loading="lazy" decoding="async"/>
      </div>
`;
}

function exercisePage(slug, data, site) {
  const guide = exerciseGuideFor(data, slug);
  const exercise = data.exerciseById.get(slug);
  if (!guide || !exercise) throw new Error(`Missing exercise guide or source data for ${slug}`);

  const url = siteUrl(site, exerciseGuidePath(slug));
  const generatedIds = new Set(GENERATED_EXERCISES);
  const sourceCueItems = sourceTips(data, slug, guide);
  const sourceCueBlock = sourceCueItems.length ? `<div class="guide-side-box">
        <h3>LogWise cues</h3>
        <ul>
${listItems(sourceCueItems)}
        </ul>
      </div>` : '';
  const relatedCards = guide.related.map(id => relatedExerciseCard(data, id, generatedIds)).filter(Boolean).join('\n');
  const demoBlock = exerciseDemoBlock(guide);
  const inlineMuscleMapBlock = exerciseMuscleMapBlock(guide, 'inline');
  const sideMuscleMapBlock = exerciseMuscleMapBlock(guide, 'side');
  const metaDescription = guide.metaDescription || guide.description;
  const socialImage = guide.mediaReady && guide.media ? guide.media.poster : null;

  return `<!DOCTYPE html>
<!-- AUTO-GENERATED by scripts/build-programmatic-seo.js. Do not edit library/exercises/*.html manually. -->
<html lang="en">
<head>
${headBlock({ title: guide.metaTitle, description: metaDescription, url, site, jsonLd: exerciseJsonLd({ site, slug, guide }), image: socialImage })}
</head>
<body class="seo-guide-page">
${nav([
  { href: '/', label: 'Home' },
  { href: '/library', label: 'Library' },
  { href: '/tools', label: 'Tools' },
  { href: '/learn', label: 'Learn' }
])}

<main>
<section class="guide-hero">
  <div class="shell guide-hero-grid">
    <div class="guide-hero-copy">
      <div class="tag"><span class="tag-dot"></span>Exercise guide</div>
      <h1 class="display">${esc(guide.title)} <span class="gold">Guide</span></h1>
      <p class="lead">${esc(guide.description)}</p>
      <div class="hero-ctas">
        <a href="/app" class="btn btn-primary">TRACK THIS LIFT IN LOGWISE &rarr;</a>
        <a href="/one-rep-max-calculator" class="btn btn-ghost">CALCULATE YOUR 1RM &rarr;</a>
      </div>
      <div class="hero-meta">
        <span><b>${esc(categoryList(exercise))}</b></span><span class="dot"></span><span><b>WORKING SETS</b></span><span class="dot"></span><span><b>RIR</b></span>
      </div>
    </div>
    <aside class="guide-facts-card" aria-label="${esc(guide.title)} quick facts">
      <div class="section-kicker">QUICK FACTS</div>
      <dl>
        <div><dt>Primary muscles</dt><dd>${esc(guide.quickFacts.primaryMuscles)}</dd></div>
        <div><dt>Equipment</dt><dd>${esc(guide.quickFacts.equipment)}</dd></div>
        <div><dt>Movement pattern</dt><dd>${esc(guide.quickFacts.pattern)}</dd></div>
        <div><dt>Best for</dt><dd>${esc(guide.quickFacts.bestFor)}</dd></div>
      </dl>
    </aside>
  </div>
</section>

<section id="how-to" class="section-pad">
  <div class="shell guide-content-grid">
    <article class="guide-main">
${demoBlock}      <section class="guide-block">
        <div class="section-kicker">FORM GUIDE</div>
        <h2>How to do the ${esc(guide.title)}</h2>
        <ol class="guide-steps">
${listItems(guide.howTo)}
        </ol>
      </section>
${inlineMuscleMapBlock}      <section class="guide-block">
        <div class="section-kicker">COMMON MISTAKES</div>
        <h2>Keep the lift honest</h2>
        <ul class="guide-list">
${listItems(guide.mistakes)}
        </ul>
      </section>
      <section id="progress" class="guide-block">
        <div class="section-kicker">HOW TO PROGRESS</div>
        <h2>Make progress measurable</h2>
        <ul class="guide-list">
${listItems(guide.progression)}
        </ul>
        <p class="guide-link-note">Use the <a href="/workout-volume-calculator">workout volume calculator</a> when sets, reps, or load change enough that recovery becomes harder to judge.</p>
      </section>
      <section class="guide-block">
        <div class="section-kicker">TRACKING TIPS</div>
        <h2>What to log in LogWise</h2>
        <ul class="guide-list">
${listItems(guide.tracking)}
        </ul>
        <p class="guide-link-note">If you want a paper structure first, the <a href="/workout-log-template">workout log template</a> captures the same basics: sets, reps, weight, RIR, and notes.</p>
      </section>
    </article>
    <aside class="guide-side">
${sideMuscleMapBlock}      ${sourceCueBlock}
      <div class="guide-side-box">
        <h3>Track the useful numbers</h3>
        <p>For this lift, the most useful history is simple: top set, back-off sets, total working volume, RIR, and short technique notes.</p>
        <a href="/app" class="guide-side-link">OPEN LOGWISE &rarr;</a>
      </div>
    </aside>
  </div>
</section>

<section class="section-pad section-alt">
  <div class="shell section-head">
    <div>
      <div class="section-kicker">RELATED TOOLS</div>
      <h2 class="section-title">Turn this lift into better training decisions.</h2>
    </div>
    <p class="section-sub">Estimate strength, calculate workload, or start with a printable log before moving everything into LogWise.</p>
  </div>
  <div class="shell tool-related-grid guide-related-grid">
${toolCards()}
  </div>
</section>

<section class="section-pad">
  <div class="shell section-head">
    <div>
      <div class="section-kicker">RELATED EXERCISES</div>
      <h2 class="section-title">Useful variations to keep in the same training log.</h2>
    </div>
    <p class="section-sub">These movements are already part of the LogWise exercise library and can be tracked with the same set, rep, weight, and RIR fields.</p>
  </div>
  <div class="shell guide-card-grid">
${relatedCards}
  </div>
</section>

<section class="cta">
  <div class="shell">
    <div class="cta-mark"><img src="/Site_Logo180.svg" alt="LogWise logo" class="logo-img"/></div>
    <h2>Track the ${esc(guide.title)}. <span class="gold">Beat last time.</span></h2>
    <p>LogWise keeps your sets, reps, weights, PRs, and notes in one clean browser-based workout log.</p>
    <div class="ctas">
      <a href="/app" class="btn btn-primary">TRACK THIS LIFT &rarr;</a>
      <a href="/library/programs/push-pull-legs" class="btn btn-ghost">SEE THE PPL PROGRAM</a>
    </div>
  </div>
</section>
</main>

${footer()}
</body>
</html>
`;
}

function programJsonLd({ site, slug, guide, program, data }) {
  const path = programGuidePath(slug);
  const url = siteUrl(site, path);
  const exerciseIds = Object.values(program.days).flat().filter(Boolean);
  const seen = new Set();
  const itemListElement = exerciseIds
    .filter(id => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map((id, index) => {
      const exercise = data.exerciseById.get(id);
      const item = {
        '@type': 'ListItem',
        position: index + 1,
        name: exercise ? exerciseName(exercise) : id
      };
      if (GENERATED_EXERCISES.includes(id)) item.url = siteUrl(site, exerciseGuidePath(id));
      return item;
    });

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: guide.title,
      url,
      description: guide.description,
      inLanguage: 'en',
      datePublished: DATE_PUBLISHED,
      dateModified: LASTMOD,
      isPartOf: { '@type': 'WebSite', name: 'LogWise', url: site },
      about: ['push pull legs program', 'workout program', 'workout tracking']
    },
    jsonLdBreadcrumb(site, [
      { name: 'LogWise', path: '/' },
      { name: 'Library', path: LIBRARY_PATH },
      { name: 'Programs', path: PROGRAM_LIBRARY_PATH },
      { name: guide.title, path }
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${guide.title} exercise list`,
      itemListElement
    }
  ];
}

function programDay(program, data, dayIndex) {
  const ids = program.days[String(dayIndex)] || [];
  const layout = PROGRAM_GUIDES['push-pull-legs'].layout[dayIndex];
  const items = ids.length ? ids.map(id => {
    const exercise = data.exerciseById.get(id);
    const name = exercise ? exerciseName(exercise) : id;
    if (GENERATED_EXERCISES.includes(id)) {
      return `          <li><a href="${exerciseGuidePath(id)}">${esc(name)}</a></li>`;
    }
    return `          <li><span>${esc(name)}</span></li>`;
  }).join('\n') : '          <li><span>Rest or light recovery work</span></li>';

  return `    <article class="program-day-card">
      <div class="program-day-head">
        <span>${esc(layout.day)}</span>
        <b>${esc(layout.type)}</b>
      </div>
      <p>${esc(layout.note)}</p>
      <ul>
${items}
      </ul>
    </article>`;
}

function programPage(slug, data, site) {
  const guide = PROGRAM_GUIDES[slug];
  if (!guide) throw new Error(`Missing program guide for ${slug}`);
  const program = data.programs.find(item => item.nameEN === guide.sourceNameEN);
  if (!program) throw new Error(`Missing source program for ${guide.sourceNameEN}`);

  const url = siteUrl(site, programGuidePath(slug));
  const overview = guide.overview.map(item => `<div><dt>${esc(item.label)}</dt><dd>${esc(item.value)}</dd></div>`).join('\n        ');
  const dayCards = guide.layout.map((_, index) => programDay(program, data, index)).join('\n');
  const readingCards = guide.relatedReading.map(item => `<a href="${item.url}" class="guide-link-card">
      <span>LEARN</span>
      <h3>${esc(item.title)}</h3>
      <p>Read the supporting article, then bring the idea back into your workout log.</p>
      <em>READ ARTICLE &rarr;</em>
    </a>`).join('\n');

  return `<!DOCTYPE html>
<!-- AUTO-GENERATED by scripts/build-programmatic-seo.js. Do not edit library/programs/*.html manually. -->
<html lang="en">
<head>
${headBlock({ title: guide.metaTitle, description: guide.description, url, site, jsonLd: programJsonLd({ site, slug, guide, program, data }) })}
</head>
<body class="seo-guide-page">
${nav([
  { href: '/', label: 'Home' },
  { href: '/library', label: 'Library' },
  { href: '/tools', label: 'Tools' },
  { href: '/learn', label: 'Learn' }
])}

<main>
<section class="guide-hero">
  <div class="shell guide-hero-grid">
    <div class="guide-hero-copy">
      <div class="tag"><span class="tag-dot"></span>Workout program guide</div>
      <h1 class="display">Push Pull Legs <span class="gold">Program</span></h1>
      <p class="lead">${esc(guide.description)}</p>
      <div class="hero-ctas">
        <a href="/app" class="btn btn-primary">START TRACKING THIS PROGRAM &rarr;</a>
        <a href="#layout" class="btn btn-ghost">SEE WEEKLY LAYOUT &rarr;</a>
      </div>
      <div class="hero-meta">
        <span><b>6 DAYS</b></span><span class="dot"></span><span><b>PUSH</b></span><span class="dot"></span><span><b>PULL</b></span><span class="dot"></span><span><b>LEGS</b></span>
      </div>
    </div>
    <aside class="guide-facts-card" aria-label="Push Pull Legs program quick facts">
      <div class="section-kicker">PROGRAM OVERVIEW</div>
      <dl>
        ${overview}
      </dl>
    </aside>
  </div>
</section>

<section id="overview" class="section-pad">
  <div class="shell guide-content-grid">
    <article class="guide-main">
      <section class="guide-block">
        <div class="section-kicker">WHO IT FITS</div>
        <h2>A high-frequency split for lifters who can recover</h2>
        <p>Push Pull Legs works because each training day has a clear job. Push days train pressing muscles, pull days train back and biceps, and leg days collect squat, leg press, hamstring, glute, and calf work.</p>
        <p>This MVP page uses the preset LogWise PPL template as the source of truth, so the exercise list below matches the program available inside the app.</p>
      </section>
      <section id="layout" class="guide-block">
        <div class="section-kicker">WEEKLY LAYOUT</div>
        <h2>Push, pull, legs, then repeat</h2>
        <div class="program-layout-grid">
${dayCards}
        </div>
      </section>
      <section class="guide-block">
        <div class="section-kicker">HOW TO PROGRESS</div>
        <h2>Progress the plan without turning every day into a max test</h2>
        <ul class="guide-list">
${listItems(guide.progression)}
        </ul>
        <p class="guide-link-note">The <a href="/workout-volume-calculator">workout volume calculator</a> is useful when you want to compare push, pull, and leg workload before changing the split.</p>
      </section>
    </article>
    <aside class="guide-side">
      <div class="guide-side-box">
        <h3>What to track</h3>
        <p>For each exercise, save sets, reps, weight, RIR, and short notes. For the program, review weekly volume and which lifts are moving.</p>
        <a href="/app" class="guide-side-link">OPEN LOGWISE &rarr;</a>
      </div>
      <div class="guide-side-box">
        <h3>Main lift pages</h3>
        <ul>
          <li><a href="/library/exercises/bench-press">Bench Press</a></li>
          <li><a href="/library/exercises/squat">Squat</a></li>
          <li><a href="/library/exercises/deadlift">Deadlift</a></li>
        </ul>
      </div>
    </aside>
  </div>
</section>

<section class="section-pad section-alt">
  <div class="shell section-head">
    <div>
      <div class="section-kicker">RELATED TOOLS</div>
      <h2 class="section-title">Use the program with better numbers.</h2>
    </div>
    <p class="section-sub">Estimate strength, total workload, and keep a clean log while you run the split.</p>
  </div>
  <div class="shell tool-related-grid guide-related-grid">
${toolCards()}
  </div>
</section>

<section class="section-pad">
  <div class="shell section-head">
    <div>
      <div class="section-kicker">RELATED READING</div>
      <h2 class="section-title">The training ideas behind the split.</h2>
    </div>
    <p class="section-sub">Use these learn articles to decide when to add reps, load, volume, or recovery.</p>
  </div>
  <div class="shell guide-card-grid">
${readingCards}
  </div>
</section>

<section class="cta">
  <div class="shell">
    <div class="cta-mark"><img src="/Site_Logo180.svg" alt="LogWise logo" class="logo-img"/></div>
    <h2>Run the program. <span class="gold">Keep the record.</span></h2>
    <p>Start tracking the Push Pull Legs split in LogWise and keep sets, PRs, volume, and notes in one browser-based workout log.</p>
    <div class="ctas">
      <a href="/app" class="btn btn-primary">START TRACKING &rarr;</a>
      <a href="/workout-log-template" class="btn btn-ghost">USE THE TEMPLATE</a>
    </div>
  </div>
</section>
</main>

${footer()}
</body>
</html>
`;
}

function exerciseDirectoryJsonLd(data, site) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Exercise Library',
      url: siteUrl(site, EXERCISE_LIBRARY_PATH),
      description: 'Browse the LogWise exercise library by muscle group, including bench press, squat, deadlift, rows, curls, presses, leg work, and core movements.',
      inLanguage: 'en',
      datePublished: DATE_PUBLISHED,
      dateModified: LASTMOD,
      isPartOf: { '@type': 'WebSite', name: 'LogWise', url: site },
      about: ['exercise library', 'strength training exercises', 'workout tracking']
    },
    jsonLdBreadcrumb(site, [
      { name: 'LogWise', path: '/' },
      { name: 'Library', path: LIBRARY_PATH },
      { name: 'Exercises', path: EXERCISE_LIBRARY_PATH }
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'LogWise exercise library',
      itemListElement: data.exercises.map((exercise, index) => {
        const item = {
          '@type': 'ListItem',
          position: index + 1,
          name: exerciseName(exercise)
        };
        if (GENERATED_EXERCISES.includes(exercise.id)) item.url = siteUrl(site, exerciseGuidePath(exercise.id));
        return item;
      })
    }
  ];
}

function exercisesIndexPage(data, site) {
  const title = 'Exercise Library: Browse Workout Exercises | LogWise';
  const description = 'Browse the LogWise exercise library by muscle group, including bench press, squat, deadlift, rows, curls, presses, leg work, and core movements.';
  const url = siteUrl(site, EXERCISE_LIBRARY_PATH);
  const generatedIds = new Set(GENERATED_EXERCISES);
  const groups = exerciseDirectoryGroups(data);
  const categoryLinks = groups.map(group => `<a href="#${slugifyLabel(group.category)}">${esc(group.category)}</a>`).join('\n        ');
  const groupedSections = groups.map(group => `<section id="${slugifyLabel(group.category)}" class="directory-group">
  <div class="shell directory-group-head">
    <div>
      <div class="section-kicker">${esc(group.category)}</div>
      <h2>${esc(group.category)} exercises</h2>
    </div>
    <span>${group.exercises.length} exercises</span>
  </div>
  <div class="shell directory-card-grid">
${group.exercises.map(exercise => exerciseDirectoryCard(data, exercise, generatedIds)).join('\n')}
  </div>
</section>`).join('\n\n');

  return `<!DOCTYPE html>
<!-- AUTO-GENERATED by scripts/build-programmatic-seo.js. Do not edit library/exercises.html manually. -->
<html lang="en">
<head>
${headBlock({ title, description, url, site, jsonLd: exerciseDirectoryJsonLd(data, site) })}
</head>
<body class="seo-guide-page">
${nav([
  { href: '/', label: 'Home' },
  { href: '/library', label: 'Library' },
  { href: '/tools', label: 'Tools' },
  { href: '/learn', label: 'Learn' }
])}

<main>
<section class="guide-hero">
  <div class="shell guide-hero-grid">
    <div class="guide-hero-copy">
      <div class="tag"><span class="tag-dot"></span>Exercise library</div>
      <h1 class="display">Browse Workout <span class="gold">Exercises</span></h1>
      <p class="lead">See the preset exercises available in LogWise, grouped by primary muscle area. Open full library pages for core lifts, or use the app to track any movement in your workout log.</p>
      <div class="hero-ctas">
        <a href="/app" class="btn btn-primary">TRACK AN EXERCISE &rarr;</a>
        <a href="/library/programs" class="btn btn-ghost">SEE PROGRAMS &rarr;</a>
      </div>
      <div class="hero-meta">
        <span><b>${data.exercises.length} EXERCISES</b></span><span class="dot"></span><span><b>${groups.length} GROUPS</b></span><span class="dot"></span><span><b>${GENERATED_EXERCISES.length} FULL PAGES</b></span>
      </div>
    </div>
    <aside class="guide-facts-card" aria-label="Exercise library quick facts">
      <div class="section-kicker">LIBRARY SNAPSHOT</div>
      <dl>
        <div><dt>Preset movements</dt><dd>${data.exercises.length}</dd></div>
        <div><dt>Muscle groups</dt><dd>${groups.length}</dd></div>
        <div><dt>Full pages</dt><dd>${GENERATED_EXERCISES.map(slug => EXERCISE_GUIDES[slug].title).join(', ')}</dd></div>
        <div><dt>Best next step</dt><dd>Track sets, reps, weight, and RIR</dd></div>
      </dl>
    </aside>
  </div>
</section>

<section class="section-pad">
  <div class="shell section-head">
    <div>
      <div class="section-kicker">MUSCLE GROUPS</div>
      <h2 class="section-title">Jump to a section.</h2>
    </div>
    <p class="section-sub">These groups use the same preset exercise library that powers LogWise inside the app.</p>
  </div>
  <div class="shell directory-chip-row">
        ${categoryLinks}
  </div>
</section>

${groupedSections}

<section class="cta">
  <div class="shell">
    <div class="cta-mark"><img src="/Site_Logo180.svg" alt="LogWise logo" class="logo-img"/></div>
    <h2>Pick an exercise. <span class="gold">Track the work.</span></h2>
    <p>LogWise keeps each set, rep, weight, RIR, PR, and note connected to the movement you trained.</p>
    <div class="ctas">
      <a href="/app" class="btn btn-primary">OPEN LOGWISE &rarr;</a>
      <a href="/library" class="btn btn-ghost">BACK TO LIBRARY</a>
    </div>
  </div>
</section>
</main>

${footer()}
</body>
</html>
`;
}

function programDirectoryJsonLd(data, site) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Workout Programs',
      url: siteUrl(site, PROGRAM_LIBRARY_PATH),
      description: 'Browse LogWise workout program templates, including Push Pull Legs, Upper Lower, Full Body, and Bro Split structures.',
      inLanguage: 'en',
      datePublished: DATE_PUBLISHED,
      dateModified: LASTMOD,
      isPartOf: { '@type': 'WebSite', name: 'LogWise', url: site },
      about: ['workout programs', 'training split', 'workout tracking']
    },
    jsonLdBreadcrumb(site, [
      { name: 'LogWise', path: '/' },
      { name: 'Library', path: LIBRARY_PATH },
      { name: 'Programs', path: PROGRAM_LIBRARY_PATH }
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'LogWise workout programs',
      itemListElement: data.programs.map((program, index) => {
        const slug = programGuideSlug(program);
        const item = {
          '@type': 'ListItem',
          position: index + 1,
          name: program.nameEN || program.name
        };
        if (slug) item.url = siteUrl(site, programGuidePath(slug));
        return item;
      })
    }
  ];
}

function programsIndexPage(data, site) {
  const title = 'Workout Programs: Browse Training Splits | LogWise';
  const description = 'Browse LogWise workout program templates, including Push Pull Legs, Upper Lower, Full Body, and Bro Split structures.';
  const url = siteUrl(site, PROGRAM_LIBRARY_PATH);
  const programCards = data.programs.map(program => programDirectoryCard(program, data)).join('\n');

  return `<!DOCTYPE html>
<!-- AUTO-GENERATED by scripts/build-programmatic-seo.js. Do not edit library/programs.html manually. -->
<html lang="en">
<head>
${headBlock({ title, description, url, site, jsonLd: programDirectoryJsonLd(data, site) })}
</head>
<body class="seo-guide-page">
${nav([
  { href: '/', label: 'Home' },
  { href: '/library', label: 'Library' },
  { href: '/tools', label: 'Tools' },
  { href: '/learn', label: 'Learn' }
])}

<main>
<section class="guide-hero">
  <div class="shell guide-hero-grid">
    <div class="guide-hero-copy">
      <div class="tag"><span class="tag-dot"></span>Program library</div>
      <h1 class="display">Browse Workout <span class="gold">Programs</span></h1>
      <p class="lead">Compare the preset LogWise training splits, see how many days and exercises they use, then open the app to start logging the program.</p>
      <div class="hero-ctas">
        <a href="/app" class="btn btn-primary">START A PROGRAM &rarr;</a>
        <a href="/library/exercises" class="btn btn-ghost">BROWSE EXERCISES &rarr;</a>
      </div>
      <div class="hero-meta">
        <span><b>${data.programs.length} PROGRAMS</b></span><span class="dot"></span><span><b>PPL</b></span><span class="dot"></span><span><b>UPPER/LOWER</b></span><span class="dot"></span><span><b>FULL BODY</b></span>
      </div>
    </div>
    <aside class="guide-facts-card" aria-label="Program library quick facts">
      <div class="section-kicker">PROGRAM SNAPSHOT</div>
      <dl>
        <div><dt>Preset programs</dt><dd>${data.programs.length}</dd></div>
        <div><dt>Full page</dt><dd>Push Pull Legs</dd></div>
        <div><dt>Tracking focus</dt><dd>Weekly volume and exercise progress</dd></div>
        <div><dt>Best next step</dt><dd>Pick a split you can repeat and review</dd></div>
      </dl>
    </aside>
  </div>
</section>

<section class="section-pad">
  <div class="shell section-head">
    <div>
      <div class="section-kicker">PROGRAMS</div>
      <h2 class="section-title">Choose the structure, then track the trend.</h2>
    </div>
    <p class="section-sub">Each card comes from the same preset program data used inside LogWise.</p>
  </div>
  <div class="shell guide-card-grid program-directory-grid">
${programCards}
  </div>
</section>

<section class="section-pad section-alt">
  <div class="shell section-head">
    <div>
      <div class="section-kicker">RELATED TOOLS</div>
      <h2 class="section-title">Plan the split with clearer numbers.</h2>
    </div>
    <p class="section-sub">Use the calculators and template to estimate strength, compare weekly volume, and start logging cleanly.</p>
  </div>
  <div class="shell tool-related-grid guide-related-grid">
${toolCards()}
  </div>
</section>

<section class="cta">
  <div class="shell">
    <div class="cta-mark"><img src="/Site_Logo180.svg" alt="LogWise logo" class="logo-img"/></div>
    <h2>Run the split. <span class="gold">Review the trend.</span></h2>
    <p>LogWise turns preset programs into a clean workout log with sets, reps, weight, PRs, and notes.</p>
    <div class="ctas">
      <a href="/app" class="btn btn-primary">OPEN LOGWISE &rarr;</a>
      <a href="/library/exercises" class="btn btn-ghost">SEE EXERCISES</a>
    </div>
  </div>
</section>
</main>

${footer()}
</body>
</html>
`;
}

function libraryHubAlternates(site) {
  return [
    { lang: 'en', url: siteUrl(site, LIBRARY_PATH) },
    { lang: 'tr', url: siteUrl(site, TURKISH_LIBRARY_PATH) },
    { lang: 'x-default', url: siteUrl(site, LIBRARY_PATH) }
  ];
}

function libraryHubJsonLd(site) {
  const items = [
    ...GENERATED_EXERCISES.map((slug, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: EXERCISE_GUIDES[slug].title,
      url: siteUrl(site, exerciseGuidePath(slug))
    })),
    ...GENERATED_PROGRAMS.map((slug, index) => ({
      '@type': 'ListItem',
      position: GENERATED_EXERCISES.length + index + 1,
      name: PROGRAM_GUIDES[slug].title,
      url: siteUrl(site, programGuidePath(slug))
    }))
  ];

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Workout Library',
      url: siteUrl(site, LIBRARY_PATH),
      description: 'Browse the LogWise workout library for exercises, programs, key lifts, and practical workout tracking.',
      inLanguage: 'en',
      datePublished: DATE_PUBLISHED,
      dateModified: HUB_LASTMOD,
      isPartOf: { '@type': 'WebSite', name: 'LogWise', url: site },
      about: ['workout library', 'exercise library', 'training programs']
    },
    jsonLdBreadcrumb(site, [
      { name: 'LogWise', path: '/' },
      { name: 'Library', path: LIBRARY_PATH }
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'LogWise workout library',
      itemListElement: items
    }
  ];
}

function libraryHubPage(data, site) {
  const title = 'Workout Library: Exercises & Training Programs | LogWise';
  const description = 'Browse the LogWise workout library for exercises, programs, bench press, squat, deadlift, Push Pull Legs, and practical tracking.';
  const url = siteUrl(site, LIBRARY_PATH);
  const generatedIds = new Set(GENERATED_EXERCISES);
  const exerciseCards = GENERATED_EXERCISES
    .map(id => relatedExerciseCard(data, id, generatedIds))
    .join('\n');
  const programCards = GENERATED_PROGRAMS.map(slug => {
    const guide = PROGRAM_GUIDES[slug];
    return `    <a href="${programGuidePath(slug)}" class="guide-link-card">
      <span>PROGRAM PAGE</span>
      <h3>${esc(guide.title)}</h3>
      <p>${esc(guide.description)}</p>
      <em>OPEN PROGRAM &rarr;</em>
    </a>`;
  }).join('\n');

  return `<!DOCTYPE html>
<!-- AUTO-GENERATED by scripts/build-programmatic-seo.js. Do not edit library.html manually. -->
<html lang="en">
<head>
${headBlock({ title, description, url, site, jsonLd: libraryHubJsonLd(site), alternates: libraryHubAlternates(site) })}
</head>
<body class="seo-guide-page">
${nav([
  { href: '/', label: 'Home' },
  { href: '/library/exercises', label: 'Exercises' },
  { href: '/library/programs', label: 'Programs' },
  { href: '/tools', label: 'Tools' },
  { href: '/learn', label: 'Learn' }
], { lang: 'en', translations: { tr: TURKISH_LIBRARY_PATH, en: LIBRARY_PATH } })}

<main>
<section class="guide-hero">
  <div class="shell guide-hero-grid">
    <div class="guide-hero-copy">
      <div class="tag"><span class="tag-dot"></span>Workout library</div>
      <h1 class="display">Exercise and Program <span class="gold">Library</span></h1>
      <p class="lead">Start with a lift or a program, then bring the sets, reps, weight, RIR, volume, and notes into LogWise.</p>
      <div class="hero-ctas">
        <a href="/library/exercises" class="btn btn-primary">BROWSE EXERCISES &rarr;</a>
        <a href="/library/programs" class="btn btn-ghost">SEE PROGRAMS &rarr;</a>
      </div>
      <div class="hero-meta">
        <span><b>BENCH PRESS</b></span><span class="dot"></span><span><b>SQUAT</b></span><span class="dot"></span><span><b>DEADLIFT</b></span><span class="dot"></span><span><b>PPL</b></span>
      </div>
    </div>
    <aside class="guide-facts-card" aria-label="Library quick facts">
      <div class="section-kicker">LIBRARY</div>
      <dl>
        <div><dt>Exercise pages</dt><dd>${GENERATED_EXERCISES.length} core lifts</dd></div>
        <div><dt>Program pages</dt><dd>${GENERATED_PROGRAMS.length} starter split</dd></div>
        <div><dt>Related tools</dt><dd>1RM, volume, log template</dd></div>
        <div><dt>Best for</dt><dd>Turning training advice into logged progress</dd></div>
      </dl>
    </aside>
  </div>
</section>

<section id="exercises" class="section-pad">
  <div class="shell section-head">
    <div>
      <div class="section-kicker">EXERCISE LIBRARY</div>
      <h2 class="section-title">Learn the lift, then track the numbers that matter.</h2>
      <a href="/library/exercises" class="guide-side-link">SEE ALL EXERCISES &rarr;</a>
    </div>
    <p class="section-sub">Each page connects form, progression, volume, and logging so the next workout has a clear target.</p>
  </div>
  <div class="shell guide-card-grid">
${exerciseCards}
  </div>
</section>

<section id="programs" class="section-pad section-alt">
  <div class="shell section-head">
    <div>
      <div class="section-kicker">PROGRAM LIBRARY</div>
      <h2 class="section-title">Use a split you can review, not just repeat.</h2>
      <a href="/library/programs" class="guide-side-link">SEE ALL PROGRAMS &rarr;</a>
    </div>
    <p class="section-sub">Program pages show the weekly structure and link back to LogWise tools for volume, strength estimates, and workout logging.</p>
  </div>
  <div class="shell guide-card-grid">
${programCards}
  </div>
</section>

<section class="section-pad">
  <div class="shell section-head">
    <div>
      <div class="section-kicker">RELATED TOOLS</div>
      <h2 class="section-title">Use the library with better training numbers.</h2>
    </div>
    <p class="section-sub">Estimate strength, calculate workload, or keep a simple workout log before moving everything into LogWise.</p>
  </div>
  <div class="shell tool-related-grid guide-related-grid">
${toolCards()}
  </div>
</section>

<section class="cta">
  <div class="shell">
    <div class="cta-mark"><img src="/Site_Logo180.svg" alt="LogWise logo" class="logo-img"/></div>
    <h2>Read the page. <span class="gold">Track the work.</span></h2>
    <p>LogWise keeps your sets, reps, weights, PRs, volume, programs, and notes in one clean browser-based workout log.</p>
    <div class="ctas">
      <a href="/app" class="btn btn-primary">START TRACKING &rarr;</a>
      <a href="/tools" class="btn btn-ghost">OPEN FREE TOOLS</a>
    </div>
  </div>
</section>
</main>

${footer()}
</body>
</html>
`;
}

function libraryHubJsonLdTR(site) {
  const items = [
    ...GENERATED_EXERCISES.map((slug, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: EXERCISE_GUIDES[slug].title,
      url: siteUrl(site, exerciseGuidePath(slug))
    })),
    ...GENERATED_PROGRAMS.map((slug, index) => ({
      '@type': 'ListItem',
      position: GENERATED_EXERCISES.length + index + 1,
      name: PROGRAM_GUIDES[slug].title,
      url: siteUrl(site, programGuidePath(slug))
    }))
  ];

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Antrenman Kütüphanesi',
      url: siteUrl(site, TURKISH_LIBRARY_PATH),
      description: 'Egzersizleri, antrenman programlarını ve gelişimini takip etmene yardımcı olacak pratik rehberleri keşfet.',
      inLanguage: 'tr',
      datePublished: HUB_LASTMOD,
      dateModified: HUB_LASTMOD,
      isPartOf: { '@type': 'WebSite', name: 'LogWise', url: site },
      about: ['antrenman kütüphanesi', 'egzersiz kütüphanesi', 'antrenman programları']
    },
    jsonLdBreadcrumb(site, [
      { name: 'LogWise', path: '/tr' },
      { name: 'Kütüphane', path: TURKISH_LIBRARY_PATH }
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'LogWise antrenman kütüphanesi',
      itemListElement: items
    }
  ];
}

function libraryHubPageTR(data, site) {
  const title = 'Antrenman Kütüphanesi: Egzersizler ve Programlar | LogWise';
  const description = 'LogWise antrenman kütüphanesinde egzersizleri, programları, bench press, squat, deadlift ve Push Pull Legs rehberlerini keşfet.';
  const url = siteUrl(site, TURKISH_LIBRARY_PATH);
  const exerciseCards = GENERATED_EXERCISES
    .map(id => relatedExerciseCardTR(data, id))
    .join('\n');
  const programCards = `    <a href="/library/programs/push-pull-legs" hreflang="en" class="guide-link-card">
      <span>PROGRAM SAYFASI</span>
      <h3>Push Pull Legs Programı</h3>
      <p>Haftalık PPL düzenini, egzersizleri, ilerleme yaklaşımını ve programı LogWise içinde nasıl takip edeceğini incele.</p>
      <em>PROGRAMI AÇ &rarr;</em>
    </a>`;

  return `<!DOCTYPE html>
<!-- AUTO-GENERATED by scripts/build-programmatic-seo.js. Do not edit kutuphane.html manually. -->
<html lang="tr">
<head>
${headBlock({
    title,
    description,
    url,
    site,
    jsonLd: libraryHubJsonLdTR(site),
    lang: 'tr',
    alternates: libraryHubAlternates(site)
  })}
</head>
<body class="seo-guide-page">
${nav([
  { href: '/tr', label: 'Ana Sayfa' },
  { href: '/library/exercises', label: 'Egzersizler' },
  { href: '/library/programs', label: 'Programlar' },
  { href: '/araclar', label: 'Araçlar' },
  { href: '/ogren', label: 'Öğren' }
], { lang: 'tr', translations: { tr: TURKISH_LIBRARY_PATH, en: LIBRARY_PATH } })}

<main>
<section class="guide-hero">
  <div class="shell guide-hero-grid">
    <div class="guide-hero-copy">
      <div class="tag"><span class="tag-dot"></span>Antrenman kütüphanesi</div>
      <h1 class="display">Egzersiz ve Program <span class="gold">Kütüphanesi</span></h1>
      <p class="lead">Bir egzersiz veya program seç; ardından set, tekrar, ağırlık, RIR, hacim ve notlarını LogWise ile düzenli biçimde takip et.</p>
      <div class="hero-ctas">
        <a href="/library/exercises" hreflang="en" class="btn btn-primary">EGZERSİZLERE GÖZ AT &rarr;</a>
        <a href="/library/programs" hreflang="en" class="btn btn-ghost">PROGRAMLARI GÖR &rarr;</a>
      </div>
      <div class="hero-meta">
        <span><b>BENCH PRESS</b></span><span class="dot"></span><span><b>SQUAT</b></span><span class="dot"></span><span><b>DEADLIFT</b></span><span class="dot"></span><span><b>PPL</b></span>
      </div>
    </div>
    <aside class="guide-facts-card" aria-label="Kütüphane özeti">
      <div class="section-kicker">KÜTÜPHANE</div>
      <dl>
        <div><dt>Egzersiz sayfaları</dt><dd>${GENERATED_EXERCISES.length} temel hareket</dd></div>
        <div><dt>Program sayfaları</dt><dd>${GENERATED_PROGRAMS.length} başlangıç programı</dd></div>
        <div><dt>İlgili araçlar</dt><dd>1RM, hacim, günlük şablonu</dd></div>
        <div><dt>En uygun kullanım</dt><dd>Antrenman bilgisini kayıtlı gelişime dönüştürmek</dd></div>
      </dl>
    </aside>
  </div>
</section>

<section id="exercises" class="section-pad">
  <div class="shell section-head">
    <div>
      <div class="section-kicker">EGZERSİZ KÜTÜPHANESİ</div>
      <h2 class="section-title">Hareketi öğren, ardından önemli sayıları takip et.</h2>
      <a href="/library/exercises" hreflang="en" class="guide-side-link">TÜM EGZERSİZLERİ GÖR &rarr;</a>
    </div>
    <p class="section-sub">Her sayfa form, ilerleme, hacim ve kayıt alışkanlığını bir araya getirerek sonraki antrenmanın için net bir hedef oluşturur.</p>
  </div>
  <div class="shell guide-card-grid">
${exerciseCards}
  </div>
</section>

<section id="programs" class="section-pad section-alt">
  <div class="shell section-head">
    <div>
      <div class="section-kicker">PROGRAM KÜTÜPHANESİ</div>
      <h2 class="section-title">Yalnızca tekrar ettiğin değil, değerlendirebildiğin bir program kullan.</h2>
      <a href="/library/programs" hreflang="en" class="guide-side-link">TÜM PROGRAMLARI GÖR &rarr;</a>
    </div>
    <p class="section-sub">Program sayfaları haftalık yapıyı gösterir; hacim, güç tahmini ve antrenman kaydı araçlarına bağlanır.</p>
  </div>
  <div class="shell guide-card-grid">
${programCards}
  </div>
</section>

<section class="section-pad">
  <div class="shell section-head">
    <div>
      <div class="section-kicker">İLGİLİ ARAÇLAR</div>
      <h2 class="section-title">Kütüphaneyi daha net antrenman verileriyle kullan.</h2>
    </div>
    <p class="section-sub">Her şeyi LogWise'a taşımadan önce gücünü tahmin et, iş yükünü hesapla veya sade bir antrenman günlüğü kullan.</p>
  </div>
  <div class="shell tool-related-grid guide-related-grid">
${toolCardsTR()}
  </div>
</section>

<section class="cta">
  <div class="shell">
    <div class="cta-mark"><img src="/Site_Logo180.svg" alt="LogWise logo" class="logo-img"/></div>
    <h2>Rehberi oku. <span class="gold">Antrenmanı kaydet.</span></h2>
    <p>LogWise; setlerini, tekrarlarını, ağırlıklarını, PR'larını, hacmini, programlarını ve notlarını tek bir düzenli antrenman günlüğünde tutar.</p>
    <div class="ctas">
      <a href="/app" class="btn btn-primary">KAYDETMEYE BAŞLA &rarr;</a>
      <a href="/araclar" class="btn btn-ghost">ÜCRETSİZ ARAÇLARI AÇ</a>
    </div>
  </div>
</section>
</main>

${footer('tr')}
</body>
</html>
`;
}

function buildProgrammaticSeo(options = {}) {
  const root = options.root || DEFAULT_ROOT;
  const site = options.site || DEFAULT_SITE;
  const data = buildLookups(loadWindowData(root), loadAndValidateExerciseGuides(root));
  const libraryDir = path.join(root, 'library');
  const exerciseDir = path.join(libraryDir, 'exercises');
  const programDir = path.join(libraryDir, 'programs');

  fs.mkdirSync(libraryDir, { recursive: true });
  fs.mkdirSync(exerciseDir, { recursive: true });
  fs.mkdirSync(programDir, { recursive: true });

  fs.writeFileSync(path.join(root, 'library.html'), libraryHubPage(data, site), 'utf8');
  fs.writeFileSync(path.join(root, 'kutuphane.html'), libraryHubPageTR(data, site), 'utf8');
  fs.writeFileSync(path.join(libraryDir, 'exercises.html'), exercisesIndexPage(data, site), 'utf8');
  fs.writeFileSync(path.join(libraryDir, 'programs.html'), programsIndexPage(data, site), 'utf8');

  for (const slug of GENERATED_EXERCISES) {
    fs.writeFileSync(path.join(exerciseDir, `${slug}.html`), exercisePage(slug, data, site), 'utf8');
  }

  for (const slug of GENERATED_PROGRAMS) {
    fs.writeFileSync(path.join(programDir, `${slug}.html`), programPage(slug, data, site), 'utf8');
  }

  return {
    library: 2,
    directories: 2,
    exercises: GENERATED_EXERCISES.length,
    programs: GENERATED_PROGRAMS.length,
    pages: sitemapPages()
  };
}

if (require.main === module) {
  const result = buildProgrammaticSeo();
  console.log(`Done: ${result.library} library hubs, ${result.directories} library directories, ${result.exercises} exercise pages and ${result.programs} program pages generated.`);
  for (const page of result.pages) {
    console.log(`  ${page.path}`);
  }
}

module.exports = {
  buildProgrammaticSeo,
  sitemapPages
};
