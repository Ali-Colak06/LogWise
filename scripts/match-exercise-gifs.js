#!/usr/bin/env node
/**
 * scripts/match-exercise-gifs.js
 *
 * yuhonas/free-exercise-db (GitHub, ücretsiz, key yok) kullanarak
 * LogWise preset egzersizleriyle fuzzy-match yapar ve tarayıcıda
 * açılacak bir HTML review sayfası üretir.
 *
 * Görsel: her egzersiz için form fotoğrafı (JPG) — doğru eşleşmeyi
 * doğrulamak için yeterlidir. Animasyonlu GIF istersen WorkoutX API
 * üzerinden --api-key parametresiyle kullanılabilir (sonradan eklenebilir).
 *
 * Kullanım:
 *   node scripts/match-exercise-gifs.js
 *
 * Çıktı:
 *   scripts/review-gifs.html  →  tarayıcıda aç, onayla, JSON indir
 *   (JSON çıktısı: { "bench-press": "imageUrl", ... })
 */

'use strict';

const fs   = require('fs');
const http  = require('http');
const https = require('https');
const path  = require('path');

// ── 1. LogWise preset'lerini oku ─────────────────────────────────────────────

const presetsFile = fs.readFileSync(
  path.join(__dirname, '../data/presets-exercises.js'),
  'utf8'
);
// window mock'u ile eval — sadece bu scriptte kullanılır
const fakeWindow = {};
new Function('window', presetsFile)(fakeWindow);
const LW_EXERCISES = fakeWindow.LOGWISE_PRESET_EXERCISES;

if (!LW_EXERCISES || !LW_EXERCISES.length) {
  console.error('HATA: presets-exercises.js okunamadı.');
  process.exit(1);
}
console.log(`✓ ${LW_EXERCISES.length} LogWise hareketi yüklendi`);

// ── 2. Config ────────────────────────────────────────────────────────────────

// yuhonas/free-exercise-db (public domain, JPG form fotoğrafları)
const SOURCE_JSON = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const SOURCE_IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

// ── 3. HTTP/HTTPS yardımcısı ──────────────────────────────────────────────────

function fetchJSON(urlStr) {
  return new Promise((resolve, reject) => {
    const parsed  = new URL(urlStr);
    const adapter = parsed.protocol === 'https:' ? https : http;

    const req = adapter.get(
      urlStr,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LogWise-GIF-Matcher/1.0',
        },
      },
      res => {
        // Redirect desteği (en fazla 3 hop)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchJSON(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} — ${urlStr}`));
        }

        let raw = '';
        res.setEncoding('utf8');
        res.on('data', chunk => (raw += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            reject(new Error(`JSON parse hatası: ${e.message}\nCevap: ${raw.slice(0, 300)}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.setTimeout(20000, () => {
      req.destroy(new Error(`Zaman aşımı: ${urlStr}`));
    });
  });
}

// ── 4. Kaynak verisi çek (yuhonas/free-exercise-db) ─────────────────────────

async function fetchAllExercises() {
  console.log('yuhonas/free-exercise-db\'den veri çekiliyor...');

  const raw = await fetchJSON(SOURCE_JSON);
  const list = Array.isArray(raw) ? raw : [];

  if (!list.length) throw new Error('Veri boş döndü.');

  // yuhonas formatını ExerciseDB formatına normalize et:
  // { id, name, primaryMuscles, equipment, category, images: ["Air_Bike/0.jpg", ...] }
  return list.map(e => ({
    id:        e.id,
    name:      e.name,
    gifUrl:    e.images && e.images[0] ? SOURCE_IMG_BASE + e.images[0] : '',
    bodyPart:  (e.primaryMuscles || []).join(', '),
    target:    (e.primaryMuscles || [])[0] || '',
    equipment: e.equipment || '',
    category:  e.category  || '',
  }));
}

// ── 5. Fuzzy eşleştirme ───────────────────────────────────────────────────────

// Eşleştirmeyi bozan gürültü kelimeleri (ekipman/edatlar)
const NOISE_RE = /\b(barbell|dumbbell|dumbell|cable|machine|ez[- ]?bar|smith|with|using|on|the|a|an|and|or|for)\b/g;

function normalize(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(NOISE_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Jaccard benzerliği (kelime kümesi örtüşmesi)
function jaccardScore(a, b) {
  const wa = new Set(normalize(a).split(' ').filter(Boolean));
  const wb = new Set(normalize(b).split(' ').filter(Boolean));
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  const union = new Set([...wa, ...wb]).size;
  return union === 0 ? 0 : inter / union;
}

function topMatches(lwEx, edbList, n = 4) {
  const searchName = lwEx.nameEN || lwEx.name;
  const scored = edbList.map(e => ({
    id:        e.id,
    name:      e.name,
    gifUrl:    e.gifUrl,
    bodyPart:  e.bodyPart  || '',
    target:    e.target    || '',
    equipment: e.equipment || '',
    score:     jaccardScore(searchName, e.name),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, n);
}

// ── 6. HTML üret ─────────────────────────────────────────────────────────────

function generateHTML(exercises, edbList) {
  const rows = exercises.map(lw => ({
    lw,
    matches: topMatches(lw, edbList),
  }));

  const dataJson = JSON.stringify(rows)
    .replace(/</g, '\\u003c')   // XSS koruması (inline script'te)
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

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
#subtitle{color:#6b7280;font-size:.875rem;margin-bottom:16px}
#progress-wrap{display:flex;align-items:center;gap:12px;margin-bottom:24px}
#progress-bar-bg{flex:1;background:#1e2235;border-radius:999px;height:8px;overflow:hidden}
#progress-bar{background:#4ade80;height:8px;border-radius:999px;width:0;transition:width .35s}
#progress-txt{font-size:.8rem;color:#9ca3af;white-space:nowrap;min-width:120px}
.card{
  background:#131625;border:1.5px solid #1e2235;border-radius:14px;
  padding:20px;margin-bottom:14px;display:flex;gap:20px;align-items:flex-start;
  transition:border-color .2s;
}
.card.approved{border-color:#16a34a}
.card.skipped{border-color:#3f3f46;opacity:.55}
.lw-col{min-width:150px;max-width:160px}
.lw-name{font-weight:700;font-size:.95rem;line-height:1.3;color:#fff;margin-bottom:4px}
.lw-id{font-family:monospace;font-size:.7rem;color:#6b7280}
.lw-cats{font-size:.72rem;color:#a78bfa;margin-top:4px}
.status{display:inline-flex;align-items:center;gap:4px;margin-top:10px;
  padding:3px 10px;border-radius:999px;font-size:.72rem;font-weight:700}
.status.ok{background:#14532d;color:#4ade80}
.status.skip{background:#27272a;color:#71717a}
.candidates{display:flex;gap:10px;flex-wrap:wrap;flex:1}
.cand{
  background:#0d0f1a;border:2px solid #1e2235;border-radius:10px;
  padding:10px;width:155px;cursor:pointer;transition:border-color .15s,transform .1s;
  flex-shrink:0;
}
.cand:hover{border-color:#6366f1;transform:translateY(-1px)}
.cand.sel{border-color:#4ade80}
.cand img,.cand .gif-err{
  display:block;width:135px;height:135px;object-fit:cover;
  border-radius:6px;background:#1e2235;
}
.gif-err{display:flex;align-items:center;justify-content:center;
  font-size:.65rem;color:#6b7280;text-align:center;padding:4px}
.cand-name{font-size:.68rem;color:#d1d5db;margin-top:7px;line-height:1.35}
.cand-score{font-size:.62rem;color:#6b7280;margin-top:2px}
.cand-meta{font-size:.62rem;color:#818cf8;margin-top:2px}
.actions{display:flex;flex-direction:column;gap:8px;min-width:96px}
button{padding:9px 16px;border:none;border-radius:8px;cursor:pointer;
  font-size:.82rem;font-weight:700;transition:background .15s}
.btn-ok{background:#15803d;color:#bbf7d0}
.btn-ok:hover{background:#166534}
.btn-skip{background:#27272a;color:#a1a1aa}
.btn-skip:hover{background:#3f3f46}
#sticky{
  position:sticky;bottom:0;background:#0d0f1a;border-top:1px solid #1e2235;
  padding:14px 0;margin-top:8px;display:flex;align-items:center;gap:16px;z-index:10;
}
.btn-export{background:#4f46e5;color:#fff;padding:11px 26px;font-size:.95rem}
.btn-export:hover{background:#4338ca}
#exp-stat{font-size:.82rem;color:#6b7280}
</style>
</head>
<body>

<h1>LogWise — GIF Eşleştirme Editörü</h1>
<p id="subtitle">Her hareket için doğru GIF adayını seç (yeşil çerçeve = seçili) ve <b>Onayla</b>'ya bas. Sonunda JSON'ı indir.</p>

<div id="progress-wrap">
  <div id="progress-bar-bg"><div id="progress-bar"></div></div>
  <span id="progress-txt">0 onaylandı</span>
</div>

<div id="cards"></div>

<div id="sticky">
  <button class="btn-export" onclick="exportMapping()">⬇ gif-mapping.json indir</button>
  <span id="exp-stat"></span>
</div>

<script>
const DATA    = ${dataJson};
const approved = {};          // { lwId: gifUrl }
const skipped  = new Set();
const selIdx   = {};          // { lwId: candidateIndex }

function pct() {
  const done = Object.keys(approved).length + skipped.size;
  return Math.round((done / DATA.length) * 100);
}

function refreshProgress() {
  const ap = Object.keys(approved).length;
  const sk = skipped.size;
  const rem = DATA.length - ap - sk;
  document.getElementById('progress-bar').style.width = pct() + '%';
  document.getElementById('progress-txt').textContent =
    ap + ' onaylandı · ' + sk + ' atlandı · ' + rem + ' kaldı';
  document.getElementById('exp-stat').textContent =
    ap + ' / ' + DATA.length + ' eşleştirme hazır';
}

function setSelect(lwId, idx) {
  selIdx[lwId] = idx;
  document.querySelectorAll('.cand[data-lw="' + lwId + '"]').forEach((el, i) => {
    el.classList.toggle('sel', i === idx);
  });
}

function approve(lwId) {
  const row = DATA.find(r => r.lw.id === lwId);
  if (!row) return;
  const idx = selIdx[lwId] ?? 0;
  if (!row.matches[idx]) return;
  approved[lwId] = row.matches[idx].gifUrl;
  skipped.delete(lwId);
  updateCardStatus(lwId, 'approved', '✓ Onaylandı');
  refreshProgress();
}

function skipEx(lwId) {
  delete approved[lwId];
  skipped.add(lwId);
  updateCardStatus(lwId, 'skipped', '— Atlandı');
  refreshProgress();
}

function updateCardStatus(lwId, cls, label) {
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
  if (!Object.keys(approved).length) {
    alert('Henüz hiçbir hareket onaylanmadı!');
    return;
  }
  const json = JSON.stringify(approved, null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download = 'gif-mapping.json';
  a.click();
}

// ── Kartları render et ───────────────────────────────────────────────────────
const container = document.getElementById('cards');

DATA.forEach(({ lw, matches }) => {
  selIdx[lw.id] = 0;

  const card = document.createElement('div');
  card.className = 'card';
  card.id = 'card-' + lw.id;

  const cats = (lw.categories || []).join(', ');

  const candidatesHTML = matches.length === 0
    ? '<p style="color:#6b7280;font-size:.8rem">Eşleşme bulunamadı</p>'
    : matches.map((m, i) => {
        const scoreStr = Math.round(m.score * 100) + '%';
        const imgId = 'img-' + lw.id + '-' + i;
        return \`<div class="cand \${i === 0 ? 'sel' : ''}"
                     data-lw="\${lw.id}"
                     onclick="setSelect('\${lw.id}', \${i})">
          <img id="\${imgId}" src="\${m.gifUrl || ''}" alt="\${m.name}"
               onerror="this.outerHTML='<div class=\\"gif-err\\">GIF yok</div>'" />
          <div class="cand-name">\${m.name}</div>
          <div class="cand-score">Benzerlik: \${scoreStr}</div>
          <div class="cand-meta">\${m.bodyPart} · \${m.equipment}</div>
        </div>\`;
      }).join('');

  card.innerHTML = \`
    <div class="lw-col">
      <div class="lw-name">\${lw.name}</div>
      <div class="lw-id">\${lw.id}</div>
      <div class="lw-cats">\${cats}</div>
    </div>
    <div class="candidates">\${candidatesHTML}</div>
    <div class="actions">
      <button class="btn-ok"   onclick="approve('\${lw.id}')">✓ Onayla</button>
      <button class="btn-skip" onclick="skipEx('\${lw.id}')">— Atla</button>
    </div>\`;

  container.appendChild(card);
});

refreshProgress();
</script>
</body>
</html>`;
}

// ── 7. Ana akış ───────────────────────────────────────────────────────────────

async function main() {
  let edbList;
  try {
    edbList = await fetchAllExercises();
  } catch (e) {
    console.error('\n✗', e.message);
    process.exit(1);
  }

  console.log(`✓ ${edbList.length} ExerciseDB hareketi çekildi`);
  console.log('Eşleştirme hesaplanıyor...');

  const html = generateHTML(LW_EXERCISES, edbList);

  const outPath = path.join(__dirname, 'review-gifs.html');
  fs.writeFileSync(outPath, html, 'utf8');

  console.log('\n✓ Hazır!');
  console.log(`\n  Aç: ${outPath}\n`);
  console.log('Adımlar:');
  console.log('  1. review-gifs.html dosyasını Chrome/Firefox ile aç');
  console.log('     (Not: fotoğraflar GitHub\'dan yükleniyor, internet bağlantısı gerekli)');
  console.log('  2. Her hareket için doğru fotoğrafı seç → "Onayla"');
  console.log('  3. "gif-mapping.json indir" ile sonuçları kaydet');
  console.log('  4. gif-mapping.json\'ı proje kök dizinine taşı\n');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
