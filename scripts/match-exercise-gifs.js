#!/usr/bin/env node
/**
 * scripts/match-exercise-gifs.js
 *
 * LogWise preset egzersizleri için GIF eşleştirme aracı.
 * Zaten eşleştirilmiş hareketleri atlar (gif-mapping.json'a bakar).
 *
 * Kullanım:
 *   node scripts/match-exercise-gifs.js                        ← JPG (key gerekmez)
 *   node scripts/match-exercise-gifs.js --api-key YOUR_KEY     ← GIF (WorkoutX ücretsiz key)
 *
 * WorkoutX ücretsiz key: https://workoutxapp.com (kredi kartı gerekmez, 500 istek/ay)
 *
 * Çıktı:
 *   scripts/review-gifs.html  →  tarayıcıda aç, onayla, JSON indir
 *   İndirilen gif-mapping.json proje köküne taşı →
 *   node scripts/update-ex-images.js  →  data/ex-images.js güncellenir
 */

'use strict';

const fs    = require('fs');
const http  = require('http');
const https = require('https');
const path  = require('path');

// ── 1. CLI argümanları ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const keyIdx = args.indexOf('--api-key');
const WORKOUTX_KEY = keyIdx !== -1 ? args[keyIdx + 1] : null;
const USE_WORKOUTX = !!WORKOUTX_KEY;

if (USE_WORKOUTX) {
  console.log('✓ WorkoutX API modu — animasyonlu GIF\n');
} else {
  console.log('ℹ  JPG modu (yuhonas). Gerçek GIF için: --api-key YOUR_KEY');
  console.log('   Ücretsiz key: https://workoutxapp.com\n');
}

// ── 2. LogWise preset'lerini oku ─────────────────────────────────────────────

const presetsFile = fs.readFileSync(
  path.join(__dirname, '../data/presets-exercises.js'), 'utf8'
);
const fakeWindow = {};
new Function('window', presetsFile)(fakeWindow);
const LW_EXERCISES = fakeWindow.LOGWISE_PRESET_EXERCISES;

if (!LW_EXERCISES || !LW_EXERCISES.length) {
  console.error('HATA: presets-exercises.js okunamadı.');
  process.exit(1);
}
console.log(`✓ ${LW_EXERCISES.length} LogWise hareketi yüklendi`);

// ── 3. HTTP/HTTPS yardımcısı ──────────────────────────────────────────────────

function fetchJSON(urlStr, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const parsed  = new URL(urlStr);
    const adapter = parsed.protocol === 'https:' ? https : http;

    const req = adapter.get(urlStr, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LogWise-GIF-Matcher/1.0',
        ...extraHeaders,
      },
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJSON(res.headers.location, extraHeaders).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} — ${urlStr}`));
      }
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', chunk => (raw += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error(`JSON parse hatası: ${e.message}\nCevap: ${raw.slice(0, 300)}`)); }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error(`Zaman aşımı: ${urlStr}`)));
  });
}

// ── 4. Kaynak verisi çek ──────────────────────────────────────────────────────

async function fetchAllExercises() {
  return USE_WORKOUTX ? fetchWorkoutX() : fetchYuhonas();
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchWorkoutX() {
  console.log('WorkoutX API\'den veri çekiliyor...');
  const headers = { 'X-WorkoutX-Key': WORKOUTX_KEY };

  // Önbellek: kısmi sonuçları biriktirir, her çalıştırmada kaldığı yerden devam eder.
  const cacheFile = path.join(__dirname, '.workoutx-cache.json');
  let cached = { data: [], total: Infinity };
  if (fs.existsSync(cacheFile)) {
    try { cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8')); }
    catch { cached = { data: [], total: Infinity }; }
  }

  // Tüm veriye zaten sahibiz — doğrudan döndür
  if (Array.isArray(cached.data) && cached.data.length >= (cached.total || 0) && cached.total > 0) {
    console.log(`✓ Önbellekten yüklendi: ${cached.data.length} / ${cached.total} egzersiz`);
    return mapWorkoutX(cached.data);
  }

  // Kısmi cache varsa kaldığı yerden devam et
  let all = Array.isArray(cached.data) ? cached.data : [];
  let total = cached.total || Infinity;
  let offset = all.length;

  if (offset > 0) {
    console.log(`↪ Kaldığı yerden devam: ${offset} / ${total === Infinity ? '?' : total}`);
  }

  const PAGE = 10; // ücretsiz katman: sayfa başına 10
  const DELAY_MS = 700; // rate limit saygısı

  while (all.length < total) {
    const url = `https://api.workoutxapp.com/v1/exercises?limit=${PAGE}&offset=${offset}`;
    let res;
    try {
      res = await fetchJSON(url, headers);
    } catch (e) {
      if (e.message.includes('429') && all.length > 0) {
        console.log(`\n⚠ Rate limit — ${all.length} egzersiz önbelleklendi. Tekrar çalıştır.`);
        break;
      }
      throw new Error(`WorkoutX API hatası: ${e.message}`);
    }

    const page = Array.isArray(res) ? res
               : Array.isArray(res.data) ? res.data
               : Array.isArray(res.exercises) ? res.exercises
               : [];

    if (total === Infinity && res.total) total = res.total;

    if (!page.length) { total = all.length; break; } // gerçek son
    all = all.concat(page);
    process.stdout.write(`  ${all.length} / ${total === Infinity ? '?' : total} egzersiz çekildi...\r`);
    offset += page.length;
    if (page.length < PAGE) { total = all.length; break; } // son sayfa

    await sleep(DELAY_MS);
  }

  if (!all.length) throw new Error('WorkoutX boş yanıt döndürdü.');
  console.log(`✓ ${all.length} WorkoutX egzersizi çekildi`);

  // Birikimli önbelleğe kaydet
  try {
    fs.writeFileSync(cacheFile, JSON.stringify({ total, data: all }, null, 2), 'utf8');
    if (all.length < total) {
      console.log(`✓ Önbelleklendi (${all.length}/${total}) — Kalan için tekrar çalıştır.`);
    } else {
      console.log(`✓ Tüm liste önbelleklendi: ${all.length} egzersiz`);
    }
  } catch { /* yazılamazsa geç */ }

  return mapWorkoutX(all);
}

function mapWorkoutX(list) {
  return list.map(e => ({
    workoutxId: e.id,          // ← gif-mapping.json'a kaydedilecek
    name:       e.name,
    gifUrl:     e.gifUrl || '', // ← review sayfasında blob URL üretmek için
    bodyPart:   e.bodyPart  || '',
    target:     e.target    || '',
    equipment:  e.equipment || '',
  }));
}

async function fetchYuhonas() {
  console.log('yuhonas/free-exercise-db\'den veri çekiliyor...');
  const JSON_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
  const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

  const raw  = await fetchJSON(JSON_URL);
  const list = Array.isArray(raw) ? raw : [];
  if (!list.length) throw new Error('yuhonas verisi boş döndü.');
  console.log(`✓ ${list.length} yuhonas egzersizi çekildi`);

  return list.map(e => ({
    workoutxId: null,  // yuhonas modunda ID yok
    name:       e.name,
    gifUrl:     e.images && e.images[0] ? IMG_BASE + e.images[0] : '', // public JPG URL
    bodyPart:   (e.primaryMuscles || []).join(', '),
    target:     (e.primaryMuscles || [])[0] || '',
    equipment:  e.equipment || '',
  }));
}

// ── 5. Fuzzy eşleştirme ───────────────────────────────────────────────────────

const NOISE_RE = /\b(barbell|dumbbell|dumbell|cable|machine|ez[- ]?bar|smith|with|using|on|the|a|an|and|or|for)\b/g;

function normalize(s) {
  return s.toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(NOISE_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function jaccardScore(a, b) {
  const wa = new Set(normalize(a).split(' ').filter(Boolean));
  const wb = new Set(normalize(b).split(' ').filter(Boolean));
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  const union = new Set([...wa, ...wb]).size;
  return union === 0 ? 0 : inter / union;
}

function topMatches(lwEx, edbList, n = 4) {
  const name = lwEx.nameEN || lwEx.name;
  const scored = edbList.map(e => ({
    workoutxId: e.workoutxId,
    name:       e.name,
    gifUrl:     e.gifUrl,
    bodyPart:   e.bodyPart,
    equipment:  e.equipment,
    score:      jaccardScore(name, e.name),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, n);
}

// ── 6. HTML üret ─────────────────────────────────────────────────────────────

function generateHTML(exercises, edbList, existingMapping = {}) {
  const rows = exercises.map(lw => ({ lw, matches: topMatches(lw, edbList) }));

  const dataJson     = JSON.stringify(rows)
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
  const existingJson = JSON.stringify(existingMapping)
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

  // WorkoutX modunda API key HTML'e gömülür — bu dosya SADECE localde kullanılır, deploy edilmez!
  const workoutxKeyForBlob = USE_WORKOUTX
    ? JSON.stringify(WORKOUTX_KEY).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
    : 'null';

  return /* html */`<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>LogWise — GIF Eşleştirme Editörü</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#0d0f1a;color:#dde1f0;padding:24px;min-height:100vh}
h1{font-size:1.4rem;margin-bottom:6px;color:#fff}
#subtitle{color:#6b7280;font-size:.875rem;margin-bottom:4px}
#mode-badge{display:inline-block;padding:2px 10px;border-radius:999px;font-size:.72rem;font-weight:700;margin-bottom:16px;${USE_WORKOUTX ? 'background:#14532d;color:#4ade80' : 'background:#1c1d2e;color:#6b7280'}}
#progress-wrap{display:flex;align-items:center;gap:12px;margin-bottom:24px}
#progress-bar-bg{flex:1;background:#1e2235;border-radius:999px;height:8px;overflow:hidden}
#progress-bar{background:#4ade80;height:8px;border-radius:999px;width:0;transition:width .35s}
#progress-txt{font-size:.8rem;color:#9ca3af;white-space:nowrap;min-width:140px;text-align:right}
#loading-banner{background:#1e2235;border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:.82rem;color:#9ca3af;display:none}
.card{background:#131625;border:1.5px solid #1e2235;border-radius:14px;padding:20px;margin-bottom:14px;display:flex;gap:20px;align-items:flex-start;transition:border-color .2s}
.card.approved{border-color:#16a34a}
.card.skipped{border-color:#3f3f46;opacity:.55}
.lw-col{min-width:150px;max-width:160px;flex-shrink:0}
.lw-name{font-weight:700;font-size:.95rem;color:#fff;margin-bottom:4px;line-height:1.3}
.lw-id{font-family:monospace;font-size:.7rem;color:#6b7280}
.lw-cats{font-size:.72rem;color:#a78bfa;margin-top:4px}
.status{display:inline-flex;align-items:center;gap:4px;margin-top:10px;padding:3px 10px;border-radius:999px;font-size:.72rem;font-weight:700}
.status.ok{background:#14532d;color:#4ade80}
.status.skip{background:#27272a;color:#71717a}
.candidates{display:flex;gap:10px;flex-wrap:wrap;flex:1}
.cand{background:#0d0f1a;border:2px solid #1e2235;border-radius:10px;padding:10px;width:160px;cursor:pointer;transition:border-color .15s,transform .1s;flex-shrink:0}
.cand:hover{border-color:#6366f1;transform:translateY(-1px)}
.cand.sel{border-color:#4ade80}
.cand-img-wrap{width:140px;height:140px;background:#1e2235;border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center}
.cand-img-wrap img{width:100%;height:100%;object-fit:cover;display:block}
.loading-gif{width:140px;height:140px;background:#1e2235;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:.65rem;color:#6b7280}
.cand-name{font-size:.68rem;color:#d1d5db;margin-top:7px;line-height:1.35}
.cand-score{font-size:.62rem;color:#6b7280;margin-top:2px}
.cand-meta{font-size:.62rem;color:#818cf8;margin-top:2px}
.actions{display:flex;flex-direction:column;gap:8px;min-width:96px;flex-shrink:0}
button{padding:9px 16px;border:none;border-radius:8px;cursor:pointer;font-size:.82rem;font-weight:700;transition:background .15s}
.btn-ok{background:#15803d;color:#bbf7d0}.btn-ok:hover{background:#166534}
.btn-skip{background:#27272a;color:#a1a1aa}.btn-skip:hover{background:#3f3f46}
#sticky{position:sticky;bottom:0;background:#0d0f1a;border-top:1px solid #1e2235;padding:14px 0;margin-top:8px;display:flex;align-items:center;gap:16px;z-index:10}
.btn-export{background:#4f46e5;color:#fff;padding:11px 26px;font-size:.95rem}.btn-export:hover{background:#4338ca}
#exp-stat{font-size:.82rem;color:#6b7280}
</style>
</head>
<body>
<h1>LogWise — GIF Eşleştirme Editörü</h1>
<p id="subtitle">Her hareket için doğru adayı seç (yeşil çerçeve = seçili) ve <b>Onayla</b>'ya bas.</p>
<span id="mode-badge">${USE_WORKOUTX ? '✦ WorkoutX — Animasyonlu GIF' : '◆ JPG modu (yuhonas)'}</span>
<div id="progress-wrap">
  <div id="progress-bar-bg"><div id="progress-bar"></div></div>
  <span id="progress-txt">yükleniyor...</span>
</div>
<div id="loading-banner">⏳ GIF'ler yükleniyor, lütfen bekleyin...</div>
<div id="cards"></div>
<div id="sticky">
  <button class="btn-export" onclick="exportMapping()">⬇ gif-mapping.json indir</button>
  <span id="exp-stat"></span>
</div>

<script>
const DATA        = ${dataJson};
const EXISTING    = ${existingJson};
const WORKOUTX_KEY = ${workoutxKeyForBlob};
const USE_WORKOUTX = ${USE_WORKOUTX ? 'true' : 'false'};

const approved = Object.assign({}, EXISTING);
const skipped  = new Set();
const selIdx   = {};
const blobCache = {}; // gifUrl → blob URL (WorkoutX modunda)

function refreshProgress() {
  const ap  = Object.keys(approved).length;
  const sk  = skipped.size;
  const doneInPage = DATA.filter(r => approved[r.lw.id] || skipped.has(r.lw.id)).length;
  const pct = DATA.length ? Math.round((doneInPage / DATA.length) * 100) : 0;
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('progress-txt').textContent = doneInPage + ' / ' + DATA.length + ' tamamlandı';
  document.getElementById('exp-stat').textContent = ap + ' toplam eşleştirme hazır';
}

function setSelect(lwId, idx) {
  selIdx[lwId] = idx;
  document.querySelectorAll(\`.cand[data-lw="\${lwId}"]\`).forEach((el, i) =>
    el.classList.toggle('sel', i === idx));
}

function approve(lwId) {
  const row = DATA.find(r => r.lw.id === lwId);
  if (!row) return;
  const idx = selIdx[lwId] ?? 0;
  const match = row.matches[idx];
  if (!match) return;
  // WorkoutX: ID sakla. yuhonas: gifUrl (public URL) sakla.
  approved[lwId] = USE_WORKOUTX ? match.workoutxId : match.gifUrl;
  skipped.delete(lwId);
  setCardStatus(lwId, 'approved', '✓ Onaylandı');
  refreshProgress();
}

function skipEx(lwId) {
  delete approved[lwId];
  skipped.add(lwId);
  setCardStatus(lwId, 'skipped', '— Atlandı');
  refreshProgress();
}

function setCardStatus(lwId, cls, label) {
  const card = document.getElementById('card-' + lwId);
  card.className = 'card ' + cls;
  const old = card.querySelector('.status');
  if (old) old.remove();
  const badge = document.createElement('span');
  badge.className = 'status ' + (cls === 'approved' ? 'ok' : 'skip');
  badge.textContent = label;
  card.querySelector('.lw-col').appendChild(badge);
}

function exportMapping() {
  if (!Object.keys(approved).length) { alert('Henüz hiçbir hareket onaylanmadı!'); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(approved, null, 2)], {type:'application/json'}));
  a.download = 'gif-mapping.json';
  a.click();
}

// WorkoutX GIF'lerini fetch ile çek → blob URL oluştur
async function loadGifAsBlob(gifUrl) {
  if (blobCache[gifUrl]) return blobCache[gifUrl];
  try {
    const res = await fetch(gifUrl, {
      headers: { 'X-WorkoutX-Key': WORKOUTX_KEY }
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    blobCache[gifUrl] = url;
    return url;
  } catch { return null; }
}

// Kartları render et, sonra GIF'leri lazy yükle
const container = document.getElementById('cards');

DATA.forEach(({ lw, matches }) => {
  selIdx[lw.id] = 0;
  const card = document.createElement('div');
  card.className = 'card';
  card.id = 'card-' + lw.id;

  const candidatesHTML = !matches.length
    ? '<p style="color:#6b7280;font-size:.8rem;padding:8px">Eşleşme bulunamadı</p>'
    : matches.map((m, i) => {
        const imgId = \`img-\${lw.id}-\${i}\`;
        // yuhonas: doğrudan img src. WorkoutX: önce placeholder, sonra blob
        const imgContent = USE_WORKOUTX
          ? \`<div class="loading-gif" id="\${imgId}">⏳</div>\`
          : \`<img src="\${m.gifUrl || ''}" alt="\${m.name}" onerror="this.style.opacity='.3'" />\`;
        return \`
        <div class="cand \${i === 0 ? 'sel' : ''}" data-lw="\${lw.id}" data-gifurl="\${m.gifUrl}" data-idx="\${i}" onclick="setSelect('\${lw.id}', \${i})">
          <div class="cand-img-wrap">\${imgContent}</div>
          <div class="cand-name">\${m.name}</div>
          <div class="cand-score">Benzerlik: \${Math.round(m.score * 100)}%</div>
          <div class="cand-meta">\${m.bodyPart} · \${m.equipment}</div>
        </div>\`;
      }).join('');

  card.innerHTML = \`
    <div class="lw-col">
      <div class="lw-name">\${lw.name}</div>
      <div class="lw-id">\${lw.id}</div>
      <div class="lw-cats">\${(lw.categories || []).join(', ')}</div>
    </div>
    <div class="candidates">\${candidatesHTML}</div>
    <div class="actions">
      <button class="btn-ok"   onclick="approve('\${lw.id}')">✓ Onayla</button>
      <button class="btn-skip" onclick="skipEx('\${lw.id}')">— Atla</button>
    </div>\`;

  container.appendChild(card);
});

refreshProgress();

// WorkoutX modunda GIF'leri arka planda yükle
if (USE_WORKOUTX) {
  document.getElementById('loading-banner').style.display = 'block';

  (async function loadAllGifs() {
    const allCands = document.querySelectorAll('.cand[data-gifurl]');
    let loaded = 0;
    const total = allCands.length;

    // Paralel yükleme (3'erli gruplar — rate limit'e saygı)
    const BATCH = 3;
    for (let i = 0; i < total; i += BATCH) {
      const batch = Array.from(allCands).slice(i, i + BATCH);
      await Promise.all(batch.map(async (candEl) => {
        const gifUrl  = candEl.dataset.gifurl;
        const lwId    = candEl.dataset.lw;
        const idx     = candEl.dataset.idx;
        const imgId   = \`img-\${lwId}-\${idx}\`;
        const placeholder = document.getElementById(imgId);
        if (!placeholder || !gifUrl) return;

        const blobUrl = await loadGifAsBlob(gifUrl);
        if (blobUrl) {
          const img = document.createElement('img');
          img.src = blobUrl;
          img.alt = candEl.querySelector('.cand-name')?.textContent || '';
          placeholder.replaceWith(img);
        } else {
          placeholder.textContent = '✗';
        }
        loaded++;
        document.getElementById('loading-banner').textContent =
          \`⏳ GIF yükleniyor: \${loaded} / \${total}\`;
      }));
    }
    document.getElementById('loading-banner').textContent =
      \`✓ \${loaded} GIF yüklendi\`;
    setTimeout(() => {
      document.getElementById('loading-banner').style.display = 'none';
    }, 2000);
  })();
}
</script>
</body>
</html>`;
}

// ── 7. Ana akış ───────────────────────────────────────────────────────────────

async function main() {
  const mappingPath = path.join(__dirname, '../gif-mapping.json');
  let existingMapping = {};
  if (fs.existsSync(mappingPath)) {
    try {
      existingMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
      console.log(`✓ Mevcut eşleştirme: ${Object.keys(existingMapping).length} hareket`);
    } catch { console.warn('⚠ gif-mapping.json okunamadı, sıfırdan başlanıyor.'); }
  }

  const missing = LW_EXERCISES.filter(ex => !existingMapping[ex.id]);
  if (!missing.length) {
    console.log('\n✓ Tüm hareketler zaten eşleştirilmiş!');
    return;
  }
  console.log(`→ Eşleştirilecek: ${missing.length} hareket (${LW_EXERCISES.length - missing.length} zaten var)\n`);

  let edbList;
  try { edbList = await fetchAllExercises(); }
  catch (e) { console.error('\n✗', e.message); process.exit(1); }

  console.log('Eşleştirme hesaplanıyor...');
  const html    = generateHTML(missing, edbList, existingMapping);
  const outPath = path.join(__dirname, 'review-gifs.html');
  fs.writeFileSync(outPath, html, 'utf8');

  console.log('\n✓ Hazır!');
  console.log(`\n  Aç: ${outPath}\n`);
  console.log('Sonraki adımlar:');
  console.log('  1. review-gifs.html → tarayıcıda aç');
  if (USE_WORKOUTX) console.log('     (GIF\'ler otomatik yüklenir — biraz sabır gerekebilir)');
  console.log('  2. Her hareket için doğru GIF\'i seç → "Onayla"');
  console.log('  3. "gif-mapping.json indir" → proje köküne taşı');
  console.log('  4. node scripts/update-ex-images.js  →  data/ex-images.js güncellenir\n');
}

main().catch(e => { console.error(e); process.exit(1); });
