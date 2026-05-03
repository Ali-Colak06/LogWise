#!/usr/bin/env node
/**
 * scripts/build-manual-picker.js
 *
 * Manuel GIF seçim aracı oluşturur.
 * Kullanım:
 *   node scripts/build-manual-picker.js --api-key YOUR_KEY
 *
 * Çıktı: scripts/gif-picker.html  →  tarayıcıda aç
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const args   = process.argv.slice(2);
const keyIdx = args.indexOf('--api-key');
const KEY    = keyIdx !== -1 ? args[keyIdx + 1] : '';

// ── Veri yükle ────────────────────────────────────────────────────────────────

const cacheFile = path.join(__dirname, '.workoutx-cache.json');
if (!fs.existsSync(cacheFile)) {
  console.error('HATA: .workoutx-cache.json yok. Önce match-exercise-gifs.js çalıştır.');
  process.exit(1);
}
const { data: wxAll } = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));

const presetsFile = fs.readFileSync(path.join(__dirname, '../data/presets-exercises.js'), 'utf8');
const fakeWindow  = {};
new Function('window', presetsFile)(fakeWindow);
const LW = fakeWindow.LOGWISE_PRESET_EXERCISES;

let existing = {};
const mapPath = path.join(__dirname, '../gif-mapping.json');
if (fs.existsSync(mapPath)) {
  existing = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  // Eski yuhonas URL'lerini temizle — sadece WorkoutX ID'leri tut
  for (const [k, v] of Object.entries(existing)) {
    if (typeof v === 'string' && v.startsWith('https://')) delete existing[k];
  }
}

// ── Hafifletilmiş WorkoutX verisi ─────────────────────────────────────────────

const wxLight = wxAll.map(e => ({
  id:        e.id,
  name:      e.name,
  bodyPart:  e.bodyPart  || '',
  equipment: e.equipment || '',
  target:    e.target    || '',
}));

// ── LogWise listesi ───────────────────────────────────────────────────────────

const lwList = LW.map(e => ({
  id:         e.id,
  name:       e.name,
  nameEN:     e.nameEN || e.name,
  categories: (e.categories || []).join(', '),
}));

// ── Güvenli JSON serialize ────────────────────────────────────────────────────

function safeJSON(v) {
  return JSON.stringify(v)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

// ── HTML ──────────────────────────────────────────────────────────────────────

const html = /* html */`<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>LogWise — Manuel GIF Seçici</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden;font-family:system-ui,sans-serif;background:#0d0f1a;color:#dde1f0}

#app{display:flex;height:100vh}

/* Sol panel */
#left{width:255px;flex-shrink:0;display:flex;flex-direction:column;border-right:1px solid #1e2235;background:#0a0c17}
#left-header{padding:12px 12px 8px;border-bottom:1px solid #1e2235}
#left-header h2{font-size:.85rem;color:#fff;margin-bottom:2px}
#left-stat{font-size:.7rem;color:#6b7280;margin-bottom:6px}
#lw-search{width:100%;padding:6px 10px;background:#131625;border:1px solid #1e2235;border-radius:7px;color:#dde1f0;font-size:.78rem;outline:none}
#lw-search:focus{border-color:#4f46e5}
#lw-list{flex:1;overflow-y:auto}
.lw-item{padding:7px 10px;cursor:pointer;border-left:3px solid transparent;transition:background .1s}
.lw-item:hover{background:#131625}
.lw-item.active{background:#191c30;border-left-color:#4f46e5}
.lw-item.mapped{border-left-color:#16a34a}
.lw-item.active.mapped{border-left-color:#4ade80}
.lw-name{font-size:.8rem;font-weight:600;color:#e2e8f0;line-height:1.3}
.lw-cats{font-size:.65rem;color:#818cf8;margin-top:1px}
.lw-badge{display:inline-block;font-size:.6rem;padding:1px 5px;border-radius:999px;margin-top:2px;background:#14532d;color:#4ade80}

/* Sağ panel */
#right{flex:1;display:flex;flex-direction:column;overflow:hidden}
#right-header{padding:10px 14px 8px;border-bottom:1px solid #1e2235;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
#active-box{min-width:0}
#active-label{font-size:.7rem;color:#6b7280}
#active-name{font-weight:700;font-size:.92rem;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#wx-search{flex:1;min-width:160px;padding:7px 12px;background:#131625;border:1px solid #1e2235;border-radius:8px;color:#dde1f0;font-size:.82rem;outline:none}
#wx-search:focus{border-color:#4f46e5}
#wx-search::placeholder{color:#4b5563}

#filter-wrap{padding:6px 14px;border-bottom:1px solid #1e2235;display:flex;gap:5px;flex-wrap:wrap;align-items:center}
.filter-btn{padding:3px 9px;border:1px solid #1e2235;border-radius:999px;background:#131625;color:#6b7280;font-size:.68rem;cursor:pointer;white-space:nowrap}
.filter-btn:hover{border-color:#4f46e5;color:#a5b4fc}
.filter-btn.on{background:#1e1b4b;border-color:#4f46e5;color:#a5b4fc;font-weight:600}
#result-count{margin-left:auto;font-size:.68rem;color:#374151}

/* Queue status */
#queue-bar{padding:4px 14px;font-size:.7rem;background:#0a0c17;border-bottom:1px solid #1e2235;display:flex;align-items:center;gap:8px}
#queue-dot{width:7px;height:7px;border-radius:50%;background:#374151;flex-shrink:0;transition:background .3s}
#queue-dot.loading{background:#f59e0b;animation:pulse .8s infinite alternate}
#queue-dot.error{background:#ef4444}
#queue-dot.ok{background:#22c55e}
@keyframes pulse{to{opacity:.3}}
#queue-txt{color:#6b7280;flex:1}
#btn-retry{padding:2px 8px;background:#292524;border:1px solid #44403c;border-radius:4px;color:#a8a29e;font-size:.65rem;cursor:pointer;display:none}
#btn-retry:hover{background:#44403c}

#grid{flex:1;overflow-y:auto;padding:12px 14px;display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:10px;align-content:start}

/* Kart */
.wx-card{background:#101322;border:2px solid #1e2235;border-radius:11px;overflow:hidden;cursor:pointer;transition:border-color .15s,transform .1s;display:flex;flex-direction:column}
.wx-card:hover{border-color:#6366f1;transform:translateY(-2px)}
.wx-card.selected{border-color:#4ade80;background:#0a1a0a}
.gif-wrap{width:100%;aspect-ratio:1;background:#0a0c17;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;flex-shrink:0}
.gif-wrap img{width:100%;height:100%;object-fit:cover;display:block}
.gif-placeholder{font-size:.65rem;color:#374151;text-align:center;padding:8px;line-height:1.5}
.gif-loading{font-size:.75rem;color:#6b7280}
.gif-error{font-size:.65rem;color:#7f1d1d;cursor:pointer}
.wx-info{padding:6px 8px;flex:1;display:flex;flex-direction:column;justify-content:space-between}
.wx-name{font-size:.67rem;font-weight:600;color:#d1d5db;line-height:1.35;margin-bottom:2px}
.wx-meta{font-size:.58rem;color:#4b5563}

/* Alt bar */
#bottom{padding:8px 14px;border-top:1px solid #1e2235;display:flex;align-items:center;gap:10px;background:#0a0c17;flex-shrink:0}
#status-msg{flex:1;font-size:.75rem;color:#6b7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.btn-clear{padding:7px 12px;background:#27272a;color:#a1a1aa;border:none;border-radius:7px;cursor:pointer;font-size:.75rem;white-space:nowrap}
.btn-clear:hover{background:#3f3f46}
.btn-export{padding:7px 18px;background:#4f46e5;color:#fff;border:none;border-radius:7px;cursor:pointer;font-size:.78rem;font-weight:700;white-space:nowrap}
.btn-export:hover{background:#4338ca}

::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#1e2235;border-radius:2px}
</style>
</head>
<body>
<div id="app">

  <div id="left">
    <div id="left-header">
      <h2>LogWise Egzersizleri</h2>
      <div id="left-stat"></div>
      <input id="lw-search" type="text" placeholder="Egzersiz ara…">
    </div>
    <div id="lw-list"></div>
  </div>

  <div id="right">
    <div id="right-header">
      <div id="active-box">
        <div id="active-label">Aktif egzersiz:</div>
        <div id="active-name">— Sol panelden seç —</div>
      </div>
      <input id="wx-search" type="text" placeholder="WorkoutX'te ara (bench press, squat, pull up…)">
    </div>
    <div id="filter-wrap">
      <span style="font-size:.68rem;color:#374151;flex-shrink:0">Bölge:</span>
      <button class="filter-btn on" data-bp="">Tümü</button>
      <span id="result-count"></span>
    </div>
    <div id="queue-bar">
      <div id="queue-dot"></div>
      <span id="queue-txt">GIF yükleyici hazır.</span>
      <button id="btn-retry" onclick="retryQueue()">Tekrar dene</button>
    </div>
    <div id="grid"></div>
    <div id="bottom">
      <div id="status-msg">Sol panelden egzersiz seç → sağdan GIF'e tıkla.</div>
      <button class="btn-clear" onclick="clearActive()">✕ Atamasını Kaldır</button>
      <button class="btn-export" onclick="doExport()">⬇ gif-mapping.json indir</button>
    </div>
  </div>
</div>

<script>
// ── Veriler ───────────────────────────────────────────────────────────────────
const WX_KEY = ${safeJSON(KEY)};
const WX_ALL = ${safeJSON(wxLight)};
const LW_ALL = ${safeJSON(lwList)};
const mapping = ${safeJSON(existing)};

// ── State ─────────────────────────────────────────────────────────────────────
let activeLwId = null;
let searchTerm = '';
let bodyFilter = '';
const blobCache = {};

// ── GIF Yükleme Kuyruğu ───────────────────────────────────────────────────────
// Aynı anda tek istek, 429'da otomatik bekle.

const gifQueue   = [];        // { wxId, imgEl, wrapEl } nesneleri
let   qRunning   = false;
let   qPaused    = false;
let   qPauseMs   = 0;
const Q_DELAY    = 600;       // başarılı yüklemeler arası ms
const Q_RETRY_MS = 60000;     // 429 sonrası bekleme ms (API ~60s'de reset oluyor)

function enqueueGif(wxId, imgEl, wrapEl) {
  if (blobCache[wxId]) { showGif(imgEl, wrapEl, blobCache[wxId]); return; }
  // Zaten kuyrukta mı?
  if (gifQueue.some(i => i.wxId === wxId)) return;
  gifQueue.push({ wxId, imgEl, wrapEl });
  runQueue();
}

async function runQueue() {
  if (qRunning) return;
  qRunning = true;
  setQueueStatus('loading', 'GIF yükleniyor…');

  while (gifQueue.length > 0) {
    if (qPaused) {
      document.getElementById('btn-retry').style.display = '';
      // Geri sayım göster
      const t0 = Date.now();
      while (Date.now() - t0 < qPauseMs) {
        const kalan = Math.ceil((qPauseMs - (Date.now() - t0)) / 1000);
        setQueueStatus('error', 'Rate limit — ' + kalan + 's sonra devam eder.');
        await sleep(1000);
      }
      qPaused = false;
      document.getElementById('btn-retry').style.display = 'none';
    }

    const item = gifQueue[0];
    // Kart hâlâ DOM'da mı?
    if (!document.body.contains(item.wrapEl)) { gifQueue.shift(); continue; }

    try {
      const burl = await fetchGif(item.wxId);
      showGif(item.imgEl, item.wrapEl, burl);
      gifQueue.shift();
      setQueueStatus('loading', gifQueue.length > 0 ? gifQueue.length + ' kalan…' : '');
      if (gifQueue.length > 0) await sleep(Q_DELAY);
    } catch(e) {
      if (String(e.message).includes('429')) {
        qPaused  = true;
        qPauseMs = Q_RETRY_MS;
        item.wrapEl.innerHTML = '<span class="gif-error" title="Rate limit — bekleniyor">⏸ 429</span>';
      } else {
        item.wrapEl.innerHTML = '<span class="gif-error" onclick="retryOne(\\''+item.wxId+'\\')">✗ ' + e.message + '</span>';
        gifQueue.shift();
      }
    }
  }

  qRunning = false;
  setQueueStatus('ok', 'Yüklendi.');
  setTimeout(() => setQueueStatus('idle', 'Hazır.'), 2000);
}

function retryQueue() {
  qPaused = false;
  qPauseMs = 0;
  document.getElementById('btn-retry').style.display = 'none';
  if (!qRunning) runQueue();
}

function retryOne(wxId) {
  const card = document.querySelector('.wx-card[data-wxid="' + wxId + '"]');
  if (!card) return;
  const wrap = card.querySelector('.gif-wrap');
  const img  = card.querySelector('img') || new Image();
  wrap.innerHTML = '<span class="gif-loading">⏳</span>';
  wrap.appendChild(img);
  enqueueGif(wxId, img, wrap);
}

async function fetchGif(wxId) {
  if (blobCache[wxId]) return blobCache[wxId];
  if (!WX_KEY) throw new Error('key yok');
  const url = 'https://api.workoutxapp.com/v1/gifs/' + wxId + '.gif';
  const res  = await fetch(url, { headers: { 'X-WorkoutX-Key': WX_KEY } });
  if (!res.ok) throw new Error(res.status);
  const blob = await res.blob();
  const burl = URL.createObjectURL(blob);
  blobCache[wxId] = burl;
  return burl;
}

function showGif(imgEl, wrapEl, burl) {
  imgEl.onload  = () => { wrapEl.innerHTML = ''; wrapEl.appendChild(imgEl); };
  imgEl.onerror = () => { wrapEl.innerHTML = '<span class="gif-error">✗ yüklenemedi</span>'; };
  imgEl.src = burl;
}

function setQueueStatus(state, msg) {
  const dot = document.getElementById('queue-dot');
  dot.className = 'queue-dot ' + (state === 'loading' ? 'loading' : state === 'error' ? 'error' : state === 'ok' ? 'ok' : '');
  document.getElementById('queue-txt').textContent = msg || '';
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Sol panel ────────────────────────────────────────────────────────────────

function renderLwList() {
  const q   = document.getElementById('lw-search').value.toLowerCase();
  const lst = document.getElementById('lw-list');
  const filtered = LW_ALL.filter(e =>
    !q || e.name.toLowerCase().includes(q) || (e.nameEN||'').toLowerCase().includes(q)
  );
  filtered.sort((a, b) => {
    const am = !!mapping[a.id], bm = !!mapping[b.id];
    if (am !== bm) return am ? 1 : -1;
    return a.name.localeCompare(b.name, 'tr');
  });
  lst.innerHTML = '';
  filtered.forEach(e => {
    const div = document.createElement('div');
    div.className = 'lw-item' +
      (mapping[e.id] ? ' mapped' : '') +
      (activeLwId === e.id ? ' active' : '');
    div.dataset.id = e.id;
    div.innerHTML =
      '<div class="lw-name">' + esc(e.name) + '</div>' +
      (e.categories ? '<div class="lw-cats">' + esc(e.categories) + '</div>' : '') +
      (mapping[e.id] ? '<span class="lw-badge">✓ atandı</span>' : '');
    div.onclick = () => setActive(e.id);
    lst.appendChild(div);
  });
  const total  = LW_ALL.length;
  const mapped = LW_ALL.filter(e => mapping[e.id]).length;
  document.getElementById('left-stat').textContent = mapped + ' / ' + total + ' eşleştirildi';
}

function setActive(lwId) {
  activeLwId = lwId;
  const ex = LW_ALL.find(e => e.id === lwId);
  document.getElementById('active-name').textContent = ex ? ex.name : '—';
  renderLwList();
  highlightSelected(mapping[lwId] || null);
  document.getElementById('status-msg').textContent = mapping[lwId]
    ? 'Mevcut atama: WorkoutX #' + mapping[lwId] + ' — başka birine tıkla.'
    : "Sağdan GIF'e tıkla → otomatik atanır.";
  // Egzersiz adını otomatik ara
  if (ex) {
    const searchEl = document.getElementById('wx-search');
    searchEl.value = ex.nameEN || ex.name;
    searchTerm = searchEl.value;
    renderGrid();
  }
}

// ── Sağ panel (grid) ──────────────────────────────────────────────────────────

function getFiltered() {
  const q  = searchTerm.toLowerCase().trim();
  const bp = bodyFilter.toLowerCase();
  return WX_ALL.filter(e => {
    if (bp && e.bodyPart.toLowerCase() !== bp) return false;
    if (!q) return true;
    return e.name.toLowerCase().includes(q) ||
           e.bodyPart.toLowerCase().includes(q) ||
           e.target.toLowerCase().includes(q) ||
           e.equipment.toLowerCase().includes(q);
  });
}

let intersectionObs = null;

function renderGrid() {
  const grid  = document.getElementById('grid');
  if (intersectionObs) intersectionObs.disconnect();
  gifQueue.length = 0; // mevcut kuyruğu temizle

  const items = getFiltered();
  document.getElementById('result-count').textContent = items.length + ' sonuç';
  grid.innerHTML = '';

  intersectionObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      intersectionObs.unobserve(en.target);
      const wxId  = en.target.dataset.wxid;
      const wrap  = en.target.querySelector('.gif-wrap');
      const img   = new Image();
      wrap.innerHTML = '<span class="gif-loading">⏳</span>';
      wrap.appendChild(img);
      enqueueGif(wxId, img, wrap);
    });
  }, { rootMargin: '80px' });

  items.forEach(wx => {
    const card = document.createElement('div');
    card.className = 'wx-card' + (isSelectedWx(wx.id) ? ' selected' : '');
    card.dataset.wxid = wx.id;

    const wrap = document.createElement('div');
    wrap.className = 'gif-wrap';
    wrap.innerHTML = '<span class="gif-placeholder">' + esc(wx.id) + '</span>';

    const info = document.createElement('div');
    info.className = 'wx-info';
    info.innerHTML =
      '<div class="wx-name">' + esc(wx.name) + '</div>' +
      '<div class="wx-meta">' + esc(wx.bodyPart) +
        (wx.equipment ? ' · ' + esc(wx.equipment) : '') + '</div>';

    card.appendChild(wrap);
    card.appendChild(info);
    card.onclick = () => assignGif(wx.id, wx.name);
    grid.appendChild(card);

    intersectionObs.observe(card);
  });
}

function isSelectedWx(wxId) { return activeLwId && mapping[activeLwId] === wxId; }

function highlightSelected(wxId) {
  document.querySelectorAll('.wx-card').forEach(c =>
    c.classList.toggle('selected', c.dataset.wxid === wxId));
}

function assignGif(wxId, wxName) {
  if (!activeLwId) { alert('Önce sol panelden bir LogWise egzersizi seç!'); return; }
  mapping[activeLwId] = wxId;
  highlightSelected(wxId);
  renderLwList();
  const lw = LW_ALL.find(e => e.id === activeLwId);
  document.getElementById('status-msg').textContent =
    '✓ ' + esc(lw ? lw.name : activeLwId) + ' → ' + esc(wxName) + ' (#' + wxId + ')';

  // Sonraki eşleştirilmemiş egzersize geç
  const unmapped = LW_ALL.filter(e => !mapping[e.id]);
  if (unmapped.length) {
    const cur  = LW_ALL.findIndex(e => e.id === activeLwId);
    const next = unmapped.find(e => LW_ALL.indexOf(e) > cur) || unmapped[0];
    if (next && next.id !== activeLwId) setTimeout(() => setActive(next.id), 350);
  }
}

function clearActive() {
  if (!activeLwId) return;
  delete mapping[activeLwId];
  highlightSelected(null);
  renderLwList();
  document.getElementById('status-msg').textContent = 'Atama kaldırıldı.';
}

function doExport() {
  const count = Object.keys(mapping).length;
  if (!count) { alert('Henüz hiçbir atama yok!'); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(mapping,null,2)],{type:'application/json'}));
  a.download = 'gif-mapping.json';
  a.click();
}

// ── Body part filtreleri ──────────────────────────────────────────────────────

function buildFilters() {
  const bps  = [...new Set(WX_ALL.map(e => e.bodyPart).filter(Boolean))].sort();
  const wrap = document.getElementById('filter-wrap');
  bps.forEach(bp => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.bp = bp;
    btn.textContent = bp;
    btn.onclick = () => setBodyFilter(bp);
    wrap.insertBefore(btn, document.getElementById('result-count'));
  });
  wrap.querySelector('[data-bp=""]').onclick = () => setBodyFilter('');
}

function setBodyFilter(bp) {
  bodyFilter = bp;
  document.querySelectorAll('.filter-btn').forEach(b =>
    b.classList.toggle('on', b.dataset.bp === bp));
  renderGrid();
}

function esc(s) {
  return String(s||'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Events ────────────────────────────────────────────────────────────────────

document.getElementById('lw-search').addEventListener('input', renderLwList);
document.getElementById('wx-search').addEventListener('input', function() {
  searchTerm = this.value;
  renderGrid();
});

// ── Init ──────────────────────────────────────────────────────────────────────
buildFilters();
renderLwList();
renderGrid();
</script>
</body>
</html>`;

const outFile = path.join(__dirname, 'gif-picker.html');
fs.writeFileSync(outFile, html, 'utf8');
console.log('✓ gif-picker.html oluşturuldu →', outFile);
