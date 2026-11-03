#!/usr/bin/env node
/**
 * Faz 4 / D1 — kas taksonomisi + hareket meta verisi generator'ı.
 *
 * Kanonik kaynaklar:
 *   - data/ex-meta.json   → bölgeler, kas sözlüğü, takma adlar, ekipman/zorluk/yük tipi
 *   - data/ex-guides.json → her hareketin anatomik birincil/ikincil kas listesi
 * Üretilen çıktı:
 *   - data/ex-meta.js     → window.LOGWISE_EX_META (uygulama açılışında yüklenen küçük dosya;
 *                           902 KB'lık ex-guides.js artık yalnız önizleme açılınca yüklenir)
 *
 * Kullanım: node scripts/build-ex-meta.js          (yaz)
 *           node scripts/build-ex-meta.js --check  (drift kontrolü, CI)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const META_FILE = path.join(ROOT, 'data/ex-meta.json');
const GUIDE_FILE = path.join(ROOT, 'data/ex-guides.json');
const PRESET_FILE = path.join(ROOT, 'data/presets-exercises.json');
const OUT_FILE = path.join(ROOT, 'data/ex-meta.js');

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));

function build() {
  const meta = readJson(META_FILE);
  const guides = readJson(GUIDE_FILE);
  const presets = readJson(PRESET_FILE);
  const errors = [];
  const regionIds = new Set(Object.keys(meta.regions || {}));
  const equipment = new Set(meta.equipment || []);
  const loadTypes = new Set(meta.loadTypes || []);

  for (const [id, r] of Object.entries(meta.regions)) {
    if (!Array.isArray(r.label) || r.label.length !== 2) errors.push(`regions.${id}.label must be [TR, EN]`);
    if (!['front', 'back', 'both'].includes(r.view)) errors.push(`regions.${id}.view must be front|back|both`);
  }
  for (const [m, def] of Object.entries(meta.muscles)) {
    if (!regionIds.has(def.region)) errors.push(`muscles.${m}.region "${def.region}" is not a region`);
    if (!Array.isArray(def.label) || def.label.length !== 2) errors.push(`muscles.${m}.label must be [TR, EN]`);
  }
  for (const [a, target] of Object.entries(meta.aliases || {})) {
    if (!meta.muscles[target]) errors.push(`aliases.${a} → "${target}" is not a muscle`);
  }
  for (const [cat, regs] of Object.entries(meta.categoryRegions || {})) {
    for (const r of regs) if (!regionIds.has(r)) errors.push(`categoryRegions.${cat} has unknown region "${r}"`);
  }

  const canon = m => (meta.aliases && meta.aliases[m]) || m;
  const exercises = {};
  for (const p of presets) {
    const rec = meta.exercises[p.id];
    const guide = guides[p.id];
    if (!rec) { errors.push(`exercises.${p.id} is missing`); continue; }
    if (!guide || !guide.muscles) { errors.push(`ex-guides.json has no muscles for ${p.id}`); continue; }
    if (!Array.isArray(rec.equipment) || !rec.equipment.length) errors.push(`exercises.${p.id}.equipment must be a non-empty array`);
    for (const e of rec.equipment || []) if (!equipment.has(e)) errors.push(`exercises.${p.id}.equipment "${e}" is not in the equipment list`);
    if (![1, 2, 3].includes(rec.difficulty)) errors.push(`exercises.${p.id}.difficulty must be 1, 2 or 3`);
    if (rec.loadType !== undefined && !loadTypes.has(rec.loadType)) errors.push(`exercises.${p.id}.loadType "${rec.loadType}" is invalid`);
    const pm = [], sm = [];
    for (const raw of guide.muscles.primary || []) {
      const m = canon(raw);
      if (!meta.muscles[m]) errors.push(`${p.id}: primary muscle "${raw}" is not in the dictionary`);
      else if (!pm.includes(m)) pm.push(m);
    }
    for (const raw of guide.muscles.secondary || []) {
      const m = canon(raw);
      if (!meta.muscles[m]) errors.push(`${p.id}: secondary muscle "${raw}" is not in the dictionary`);
      else if (!pm.includes(m) && !sm.includes(m)) sm.push(m);
    }
    const pr = [...new Set(pm.map(m => meta.muscles[m] && meta.muscles[m].region).filter(Boolean))];
    const sr = [...new Set(sm.map(m => meta.muscles[m] && meta.muscles[m].region).filter(Boolean))].filter(r => !pr.includes(r));
    const out = { p: pr, s: sr, pm, sm, eq: rec.equipment, d: rec.difficulty };
    if (rec.loadType && rec.loadType !== 'weighted') out.lt = rec.loadType;
    exercises[p.id] = out;
  }
  for (const id of Object.keys(meta.exercises)) {
    if (!presets.some(p => p.id === id)) errors.push(`exercises.${id} is not a preset exercise`);
  }
  if (errors.length) {
    const e = new Error('ex-meta validation failed:\n- ' + errors.join('\n- '));
    e.validationErrors = errors;
    throw e;
  }

  const payload = {
    equipment: meta.equipment,
    regions: meta.regions,
    muscles: meta.muscles,
    categoryRegions: meta.categoryRegions,
    exercises
  };
  const body = [
    '// LogWise — kas taksonomisi ve hareket meta verisi (Faz 4 / D1)',
    '// ÜRETİLMİŞ DOSYA — elle düzenleme. Kaynak: data/ex-meta.json + data/ex-guides.json',
    '// Üretmek için: node scripts/build-ex-meta.js',
    '// exercises[id] = { p: birincil bölgeler, s: ikincil bölgeler, pm/sm: kas slug\'ları, eq: ekipman, d: zorluk 1-3, lt?: yük tipi }',
    'window.LOGWISE_EX_META = ' + JSON.stringify(payload) + ';',
    ''
  ].join('\n');
  return body;
}

function main() {
  const check = process.argv.includes('--check');
  let out;
  try { out = build(); } catch (e) { console.error(e.message); process.exit(1); }
  if (check) {
    const cur = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8').replace(/\r\n/g, '\n') : null;
    if (cur !== out) {
      console.error('data/ex-meta.js is out of date. Run: node scripts/build-ex-meta.js');
      process.exit(1);
    }
    console.log('data/ex-meta.js is up to date.');
    return;
  }
  fs.writeFileSync(OUT_FILE, out);
  console.log('Wrote data/ex-meta.js (' + out.length + ' bytes).');
}

if (require.main === module) main();
module.exports = { build };
