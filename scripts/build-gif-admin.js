#!/usr/bin/env node
/**
 * scripts/build-gif-admin.js
 *
 * Egzersiz GIF yönetim sayfasını oluşturur.
 * Kullanım: node scripts/build-gif-admin.js
 * Çıktı:    scripts/gif-admin.html
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const presetsFile = fs.readFileSync(
  path.join(__dirname, '../data/presets-exercises.js'), 'utf8'
);
const fakeWindow = {};
new Function('window', presetsFile)(fakeWindow);
const exercises = fakeWindow.LOGWISE_PRESET_EXERCISES;

const imagesFile = path.join(__dirname, '../data/ex-images.js');
const imagesSrc  = fs.readFileSync(imagesFile, 'utf8');
const fakeWin2   = {};
try { new Function('window', imagesSrc)(fakeWin2); } catch {}
const currentImages = fakeWin2.LOGWISE_EX_IMAGES || {};

function safeJSON(v) {
  return JSON.stringify(v)
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

const exercises_json = safeJSON(exercises.map(e => ({
  id:     e.id,
  name:   e.name,
  nameEN: e.nameEN || e.name,
  cats:   (e.categories || []).join(', '),
})));

const images_json = safeJSON(currentImages);

const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>LogWise — GIF Yönetimi</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden;font-family:system-ui,sans-serif;background:#0d0f1a;color:#dde1f0}
#app{display:flex;flex-direction:column;height:100vh}

/* Top bar */
#top{flex-shrink:0;background:#0a0c17;border-bottom:1px solid #1e2235;padding:9px 16px;
     display:flex;align-items:center;gap:10px}
#top h1{font-size:.92rem;color:#fff;white-space:nowrap}
#top-stat{font-size:.72rem;color:#6b7280;white-space:nowrap}
#lw-filter{padding:6px 10px;background:#131625;border:1px solid #1e2235;border-radius:7px;
           color:#dde1f0;font-size:.78rem;outline:none;width:160px}
#lw-filter:focus{border-color:#4f46e5}
#lw-filter::placeholder{color:#4b5563}
.btn-export{margin-left:auto;padding:7px 16px;background:#4f46e5;color:#fff;border:none;
            border-radius:7px;cursor:pointer;font-size:.78rem;font-weight:700}
.btn-export:hover{background:#4338ca}

/* Body */
#body{flex:1;display:flex;overflow:hidden}

/* Left */
#left{width:235px;flex-shrink:0;border-right:1px solid #1e2235;display:flex;flex-direction:column;background:#0a0c17;overflow:hidden}
#left-stat{padding:6px 12px;font-size:.68rem;color:#4b5563;flex-shrink:0;border-bottom:1px solid #1e2235}
#lw-list{flex:1;overflow-y:auto}
.lw-item{padding:7px 12px;cursor:pointer;border-left:3px solid transparent;user-select:none}
.lw-item:hover{background:#131625}
.lw-item.active{background:#191c30;border-left-color:#4f46e5}
.lw-item.has-gif{border-left-color:#16a34a}
.lw-item.active.has-gif{border-left-color:#4ade80}
.lw-name{font-size:.8rem;font-weight:600;color:#e2e8f0;line-height:1.3}
.lw-cats{font-size:.63rem;color:#818cf8;margin-top:1px}
.lw-badge{display:inline-block;font-size:.6rem;padding:1px 5px;border-radius:999px;
          background:#14532d;color:#4ade80;margin-top:2px}

/* Right */
#right{flex:1;display:flex;flex-direction:column;overflow:hidden}

/* Active header */
#active-bar{flex-shrink:0;padding:10px 16px;border-bottom:1px solid #1e2235;
            display:flex;align-items:center;gap:8px;flex-wrap:wrap}
#active-name{font-size:.9rem;font-weight:700;color:#fff;flex:1;min-width:100px}
#active-id{font-size:.68rem;color:#4b5563;font-family:monospace}

/* Quick search buttons */
#search-btns{flex-shrink:0;padding:8px 16px;border-bottom:1px solid #1e2235;
             display:flex;gap:8px;align-items:center;flex-wrap:wrap}
#search-btns span{font-size:.7rem;color:#6b7280;white-space:nowrap}
.btn-site{padding:6px 12px;border:none;border-radius:7px;cursor:pointer;font-size:.75rem;font-weight:600;white-space:nowrap;text-decoration:none;display:inline-block}
.btn-giphy{background:#1a1025;color:#a855f7;border:1px solid #4c1d95}
.btn-giphy:hover{background:#2d1b4e}
.btn-google{background:#0f1b2d;color:#60a5fa;border:1px solid #1e3a5f}
.btn-google:hover{background:#1e3a5f}
.btn-tenor{background:#1a1025;color:#f472b6;border:1px solid #831843}
.btn-tenor:hover{background:#2d0f1e}

/* URL input row */
#url-row{flex-shrink:0;padding:10px 16px;border-bottom:1px solid #1e2235;display:flex;gap:8px;align-items:center}
#url-input{flex:1;padding:8px 12px;background:#0a0c17;border:1px solid #1e2235;
           border-radius:8px;color:#dde1f0;font-size:.82rem;outline:none}
#url-input:focus{border-color:#4ade80}
#url-input.has-val{border-color:#16a34a}
#url-input::placeholder{color:#374151}
.btn-save{padding:8px 16px;background:#15803d;color:#bbf7d0;border:none;border-radius:8px;
          cursor:pointer;font-size:.8rem;font-weight:700;white-space:nowrap}
.btn-save:hover{background:#166534}
.btn-del{padding:8px 10px;background:#27272a;color:#71717a;border:none;border-radius:8px;cursor:pointer;font-size:.8rem}
.btn-del:hover{background:#3f3f46;color:#ef4444}

/* Hint */
#hint{flex-shrink:0;padding:5px 16px;font-size:.7rem;color:#374151;border-bottom:1px solid #1e2235}

/* Preview area */
#preview{flex:1;overflow:hidden;display:flex;align-items:center;justify-content:center;
         background:#0a0c17;position:relative}
#preview-img{max-width:100%;max-height:100%;object-fit:contain;display:none}
#preview-placeholder{text-align:center;color:#1f2937}
#preview-placeholder .big{font-size:3rem;margin-bottom:8px}
#preview-placeholder p{font-size:.8rem;line-height:1.8}
#preview-placeholder em{color:#374151;font-style:normal;font-size:.72rem}

/* Status */
#status{flex-shrink:0;padding:5px 16px;font-size:.72rem;color:#6b7280;
        border-top:1px solid #1e2235;background:#0a0c17;min-height:24px}

::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#1e2235;border-radius:2px}
</style>
</head>
<body>
<div id="app">
  <div id="top">
    <h1>LogWise — GIF Yönetimi</h1>
    <span id="top-stat"></span>
    <input id="lw-filter" type="text" placeholder="Egzersiz filtrele…">
    <button class="btn-export" onclick="exportFile()">⬇ ex-images.js kaydet</button>
  </div>

  <div id="body">
    <!-- Sol: liste -->
    <div id="left">
      <div id="left-stat"></div>
      <div id="lw-list"></div>
    </div>

    <!-- Sağ: düzenleyici -->
    <div id="right">
      <div id="active-bar">
        <span id="active-name">← Sol panelden egzersiz seç</span>
        <span id="active-id"></span>
      </div>

      <div id="search-btns">
        <span>Bul:</span>
        <a id="btn-giphy" class="btn-site btn-giphy" href="#" target="_blank">🎞 Giphy</a>
        <a id="btn-tenor" class="btn-site btn-tenor" href="#" target="_blank">📹 Tenor</a>
        <a id="btn-google" class="btn-site btn-google" href="#" target="_blank">🔍 Google GIF</a>
        <span style="margin-left:4px;font-size:.68rem;color:#4b5563">→ GIF'e sağ tık → Resmi kopyala → aşağıya yapıştır</span>
      </div>

      <div id="url-row">
        <input id="url-input" type="text" placeholder="GIF veya resim URL'sini buraya yapıştır…" oninput="onUrlInput(this)">
        <button class="btn-save" onclick="saveUrl()">✓ Kaydet</button>
        <button class="btn-del" onclick="deleteUrl()" title="Bu egzersizin GIF atmasını kaldır">✕</button>
      </div>

      <div id="hint">💡 Giphy'de beğendiğin GIF'e <b>sağ tık → Resmin bağlantı adresini kopyala</b> → yukarıya yapıştır</div>

      <div id="preview">
        <img id="preview-img" alt="Önizleme">
        <div id="preview-placeholder">
          <div class="big">🏋️</div>
          <p>Sol panelden egzersiz seç<br>URL yapıştırınca burada önizleme görürsün</p>
          <em>Giphy · Tenor · Google Images · herhangi bir site</em>
        </div>
      </div>

      <div id="status">Hazır.</div>
    </div>
  </div>
</div>

<script>
const EXERCISES = ${exercises_json};
const images    = ${images_json};
let   activeId  = null;

// ── Sol liste ─────────────────────────────────────────────────────────────────
function stat() {
  const n = EXERCISES.filter(e => images[e.id]).length;
  const t = EXERCISES.length;
  document.getElementById('top-stat').textContent  = n + ' / ' + t + ' atandı';
  document.getElementById('left-stat').textContent = n + ' / ' + t + ' atandı';
}

function renderList() {
  const q   = document.getElementById('lw-filter').value.toLowerCase();
  const lst = document.getElementById('lw-list');
  const arr = EXERCISES.filter(e =>
    !q || e.name.toLowerCase().includes(q) || e.nameEN.toLowerCase().includes(q) || e.cats.toLowerCase().includes(q)
  );
  arr.sort((a, b) => {
    const am = !!images[a.id], bm = !!images[b.id];
    if (am !== bm) return am ? 1 : -1;
    return a.name.localeCompare(b.name, 'tr');
  });
  lst.innerHTML = '';
  arr.forEach(ex => {
    const d = document.createElement('div');
    d.className = 'lw-item' +
      (images[ex.id] ? ' has-gif' : '') +
      (activeId === ex.id ? ' active' : '');
    d.innerHTML =
      '<div class="lw-name">' + esc(ex.name) + '</div>' +
      (ex.cats ? '<div class="lw-cats">' + esc(ex.cats) + '</div>' : '') +
      (images[ex.id] ? '<span class="lw-badge">✓</span>' : '');
    d.onclick = () => activate(ex.id);
    lst.appendChild(d);
  });
}

function activate(id) {
  activeId = id;
  const ex = EXERCISES.find(e => e.id === id);
  document.getElementById('active-name').textContent = ex ? ex.name : '—';
  document.getElementById('active-id').textContent   = id;

  // URL kutusunu doldur
  const url = images[id] || '';
  const inp = document.getElementById('url-input');
  inp.value = url;
  inp.classList.toggle('has-val', !!url);

  // Önizleme
  showPreview(url);

  // Arama linklerini güncelle
  const q = encodeURIComponent((ex ? ex.nameEN : id) + ' exercise');
  document.getElementById('btn-giphy').href  = 'https://giphy.com/search/' + q;
  document.getElementById('btn-tenor').href  = 'https://tenor.com/search/' + encodeURIComponent((ex ? ex.nameEN : id) + '-exercise-gif');
  document.getElementById('btn-google').href = 'https://www.google.com/search?q=' + q + '+gif&tbm=isch&tbs=itp:animated';

  renderList();
  setStatus(url ? 'Mevcut: ' + url : 'Henüz GIF atanmamış. Arama butonlarından birini kullan.');
}

// ── URL kutusu ────────────────────────────────────────────────────────────────
function onUrlInput(inp) {
  inp.classList.toggle('has-val', !!inp.value.trim());
  showPreview(inp.value.trim());
}

function saveUrl() {
  if (!activeId) { alert('Önce sol panelden egzersiz seç!'); return; }
  const url = document.getElementById('url-input').value.trim();
  if (!url) { deleteUrl(); return; }
  images[activeId] = url;
  renderList();
  stat();
  setStatus('✓ Kaydedildi.');
  goNextUnmapped();
}

function deleteUrl() {
  if (!activeId) return;
  delete images[activeId];
  document.getElementById('url-input').value = '';
  document.getElementById('url-input').classList.remove('has-val');
  showPreview('');
  renderList();
  stat();
  setStatus('GIF kaldırıldı.');
}

function goNextUnmapped() {
  const unmapped = EXERCISES.filter(e => !images[e.id]);
  if (!unmapped.length) { setStatus('🎉 Tüm egzersizler tamamlandı!'); return; }
  const cur  = EXERCISES.findIndex(e => e.id === activeId);
  const next = unmapped.find(e => EXERCISES.indexOf(e) > cur) || unmapped[0];
  if (next && next.id !== activeId) setTimeout(() => activate(next.id), 250);
}

// ── Önizleme ──────────────────────────────────────────────────────────────────
function showPreview(url) {
  const img = document.getElementById('preview-img');
  const ph  = document.getElementById('preview-placeholder');
  if (!url) {
    img.style.display = 'none';
    img.src = '';
    ph.style.display  = '';
    return;
  }
  img.style.display = 'none';
  ph.style.display  = '';
  img.onload  = () => { img.style.display = 'block'; ph.style.display = 'none'; };
  img.onerror = () => { img.style.display = 'none'; ph.innerHTML = '<div class="big">⚠️</div><p style="color:#ef4444">Görüntü yüklenemedi<br><em style="color:#6b7280">' + esc(url) + '</em></p>'; };
  img.src = url;
}

// ── Export ────────────────────────────────────────────────────────────────────
function exportFile() {
  const count  = Object.keys(images).length;
  if (!count) { alert('Henüz hiçbir GIF atanmadı!'); return; }
  const sorted  = Object.entries(images).sort(([a],[b]) => a.localeCompare(b));
  const entries = sorted.map(([k,v]) => '  ' + JSON.stringify(k) + ': ' + JSON.stringify(v)).join(',\\n');
  const content =
    "// LogWise — Egzersiz GIF/resim URL'leri\\n" +
    "// Yonetmek icin: scripts/gif-admin.html\\n" +
    "// Guncelleme: " + new Date().toISOString().slice(0,10) + " | Toplam: " + count + "\\n" +
    "window.LOGWISE_EX_IMAGES = {\\n" + entries + "\\n};\\n";
  const a = document.createElement('a');
  a.href     = URL.createObjectURL(new Blob([content], {type:'text/javascript'}));
  a.download = 'ex-images.js';
  a.click();
  setStatus('✓ ' + count + ' egzersiz — ex-images.js indirildi. data/ klasorune tasıyın.');
}

function setStatus(m) { document.getElementById('status').textContent = m; }
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Enter ile kaydet ──────────────────────────────────────────────────────────
document.getElementById('url-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') saveUrl();
});
document.getElementById('lw-filter').addEventListener('input', renderList);

stat();
renderList();
</script>
</body>
</html>`;

const outPath = path.join(__dirname, 'gif-admin.html');
fs.writeFileSync(outPath, html, 'utf8');

const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (m) { try { new Function(m[1]); console.log('✓ JS syntax OK'); } catch(e) { console.error('✗', e.message); } }
console.log('✓ gif-admin.html oluşturuldu →', outPath);
