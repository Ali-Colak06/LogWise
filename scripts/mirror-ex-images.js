#!/usr/bin/env node
/**
 * Faz 5 / D6 — hareket görsellerini raw.githubusercontent.com yerine media.logwise.fit (R2) üzerinden sunmak.
 *
 * data/ex-images.js içindeki free-exercise-db görselleri bugün doğrudan GitHub'ın raw sunucusundan çekiliyor;
 * o sunucu CDN olarak tasarlanmadı (hız sınırı, önbellek başlığı yok). Bu script üç adımda taşır:
 *
 *   1) node scripts/mirror-ex-images.js download [klasör]
 *        Görselleri indirir: <klasör>/exercises/<slug>/still-<n>-v1.jpg (varsayılan klasör: ../logwise-media-staging)
 *        ve aynı klasöre upload.ps1 + upload.sh yazar (wrangler r2 object put komutları).
 *   2) Klasördeki upload.ps1 (Windows) veya upload.sh ile R2'ye yükle (wrangler oturumu gerekir;
 *      bucket: logwise-exercise-media, bkz. docs/R2-EXERCISE-MEDIA-SETUP.md).
 *   3) node scripts/mirror-ex-images.js rewrite [--dry-run]
 *        Her görseli https://media.logwise.fit/exercises/<slug>/still-<n>-v1.jpg adresinde HEAD ile doğrular;
 *        yalnız TÜM kareleri erişilebilir olan hareketlerin URL'lerini data/ex-images.js içinde değiştirir.
 *        Erişilemeyenler eski adreste kalır ve listelenir. Sonra sw.js CACHE_NAME artırılmalı.
 *
 * Bağımlılık yok (Node 18+ fetch).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const IMAGES_FILE = path.join(ROOT, 'data/ex-images.js');
const MEDIA_ORIGIN = 'https://media.logwise.fit';
const BUCKET = 'logwise-exercise-media';
const RAW_RE = /^https:\/\/raw\.githubusercontent\.com\//;

function loadImages() {
  const src = fs.readFileSync(IMAGES_FILE, 'utf8');
  const ctx = { window: {} };
  vm.runInNewContext(src, ctx, { filename: IMAGES_FILE });
  return { src, map: ctx.window.LOGWISE_EX_IMAGES || {} };
}
const asList = v => (Array.isArray(v) ? v : v ? [v] : []);
const keyFor = (slug, i) => `exercises/${slug}/still-${i}-v1.jpg`;

async function download(outDir) {
  const { map } = loadImages();
  let ok = 0, fail = 0;
  const lines = [];
  for (const [slug, v] of Object.entries(map)) {
    const urls = asList(v);
    if (!urls.length || !urls.every(u => RAW_RE.test(u))) continue;
    for (let i = 0; i < urls.length; i++) {
      const dest = path.join(outDir, keyFor(slug, i));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      try {
        if (!fs.existsSync(dest)) {
          const res = await fetch(urls[i]);
          if (!res.ok) throw new Error('HTTP ' + res.status);
          fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
        }
        ok++;
        lines.push(keyFor(slug, i));
      } catch (e) {
        fail++;
        console.error(`İndirilemedi: ${slug} #${i} — ${e.message}`);
      }
    }
  }
  const cmd = (k, file) => `wrangler r2 object put ${BUCKET}/${k} --file ${file} --ct image/jpeg --cc "public, max-age=31536000, immutable" --remote --force`;
  fs.writeFileSync(path.join(outDir, 'upload.sh'), '#!/bin/sh\nset -e\ncd "$(dirname "$0")"\n' + lines.map(k => cmd(k, k)).join('\n') + '\n');
  fs.writeFileSync(path.join(outDir, 'upload.ps1'), '$ErrorActionPreference = "Stop"\nSet-Location $PSScriptRoot\n' + lines.map(k => cmd(k, '.\\' + k.replace(/\//g, '\\'))).join('\n') + '\n');
  console.log(`${ok} görsel hazır, ${fail} hata. Yükleme komutları: ${path.join(outDir, 'upload.ps1')} / upload.sh`);
}

async function headOk(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok && /^image\//.test(res.headers.get('content-type') || 'image/');
  } catch (e) {
    return false;
  }
}

async function rewrite(dryRun) {
  const { src, map } = loadImages();
  let out = src;
  const moved = [], kept = [];
  for (const [slug, v] of Object.entries(map)) {
    const urls = asList(v);
    if (!urls.length || !urls.every(u => RAW_RE.test(u))) continue;
    const next = urls.map((_, i) => `${MEDIA_ORIGIN}/${keyFor(slug, i)}`);
    const checks = await Promise.all(next.map(headOk));
    if (!checks.every(Boolean)) { kept.push(slug); continue; }
    urls.forEach((u, i) => { out = out.split(JSON.stringify(u)).join(JSON.stringify(next[i])); });
    moved.push(slug);
  }
  if (!dryRun && moved.length) fs.writeFileSync(IMAGES_FILE, out);
  console.log(`${moved.length} hareket media.logwise.fit'e taşındı${dryRun ? ' (deneme, dosya yazılmadı)' : ''}; ${kept.length} hareket eski adreste kaldı.`);
  if (kept.length) console.log('Eski adreste kalanlar: ' + kept.join(', '));
  if (moved.length && !dryRun) console.log('Şimdi sw.js içindeki CACHE_NAME değerini artır.');
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'download') download(path.resolve(arg || path.join(ROOT, '..', 'logwise-media-staging')));
else if (cmd === 'rewrite') rewrite(process.argv.includes('--dry-run'));
else {
  console.log('Kullanım: node scripts/mirror-ex-images.js download [klasör] | rewrite [--dry-run]');
  process.exit(1);
}
