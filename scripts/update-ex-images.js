#!/usr/bin/env node
/**
 * scripts/update-ex-images.js
 *
 * gif-mapping.json → data/ex-images.js dönüşümü.
 * match-exercise-gifs.js ile yeni eşleştirmeler onaylandıktan sonra çalıştır.
 *
 * Kullanım:
 *   node scripts/update-ex-images.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const mappingPath  = path.join(__dirname, '../gif-mapping.json');
const outputPath   = path.join(__dirname, '../data/ex-images.js');

if (!fs.existsSync(mappingPath)) {
  console.error('HATA: gif-mapping.json bulunamadı. Önce match-exercise-gifs.js çalıştır.');
  process.exit(1);
}

const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
const count   = Object.keys(mapping).length;

// WorkoutX ID: kısa alfanümerik string (ör. "0028"), tam URL değil.
// Tam URL'ler (https:// ile başlayanlar) yuhonas JPG'leri — olduğu gibi bırak.
function toRuntimeUrl(v) {
  if (!v) return v;
  if (/^https?:\/\//.test(v)) return v;                 // tam URL — değiştirme
  if (/^[a-zA-Z0-9_-]+$/.test(v)) {                    // WorkoutX ID
    return `/.netlify/functions/gif?id=${v}`;
  }
  return v;
}

const entries = Object.entries(mapping)
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(toRuntimeUrl(v))}`)
  .join(',\n');

const output = `// LogWise — Egzersiz görsel URL eşleştirmesi
// Kaynak: gif-mapping.json  |  Güncelleme: ${new Date().toISOString().slice(0, 10)}
// Toplam: ${count} hareket
// Üretmek için: node scripts/update-ex-images.js
window.LOGWISE_EX_IMAGES = {
${entries}
};
`;

fs.writeFileSync(outputPath, output, 'utf8');
console.log(`✓ data/ex-images.js güncellendi (${count} hareket)`);
