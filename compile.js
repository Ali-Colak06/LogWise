#!/usr/bin/env node
/**
 * LogWise JSX Pre-compiler
 * ─────────────────────────
 * Babel Standalone'u KALDIRDI, JSX'i önceden derler.
 *
 * KULLANIM:
 *   node compile.js
 *
 * GEREKSİNİM:
 *   npm install @babel/core @babel/preset-react
 *
 * ÇALIŞMA MANTIĞI:
 *   - *.babel-backup dosyaları → kaynak (JSX ile orijinal)
 *   - Bu script → derleyip index.html / profile.html / share.html üretir
 *   - Cloudflare'e deploy edilen dosyalar derlenmişlerdir (Babel CDN yok)
 */

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const BABEL_CDN_LINE = /<script[^>]*babel[^>]*><\/script>\n?/i;
const BABEL_OPEN_TAG = /<script\s+type="text\/babel">/;
const BABEL_OPEN_TAG_G = /<script\s+type="text\/babel">/g;

function compileBabelBlock(jsxCode, filename) {
  const result = babel.transformSync(jsxCode, {
    presets: [
      ['@babel/preset-react', {
        runtime: 'classic',
        pragma: 'React.createElement',
        pragmaFrag: 'React.Fragment',
      }]
    ],
    filename: filename,
    sourceType: 'script',
    compact: false,
    comments: false,
  });
  return result.code;
}

function processFile(inputPath, outputPath) {
  console.log(`\n📄 Processing: ${path.basename(inputPath)}`);
  let html = fs.readFileSync(inputPath, 'utf8');

  const babelBlocks = html.match(BABEL_OPEN_TAG_G);
  if (!babelBlocks) {
    console.log('  ⚠️  No <script type="text/babel"> found — skipping.');
    return;
  }
  console.log(`  Found ${babelBlocks.length} babel script block(s)`);

  if (BABEL_CDN_LINE.test(html)) {
    html = html.replace(BABEL_CDN_LINE, '');
    console.log('  ✅ Removed Babel Standalone CDN script tag');
  }

  let blockIndex = 0;
  while (BABEL_OPEN_TAG.test(html)) {
    blockIndex++;
    const openTagMatch = html.match(BABEL_OPEN_TAG);
    const openTagStart = html.indexOf(openTagMatch[0]);
    const openTagEnd = openTagStart + openTagMatch[0].length;

    const closeTagIndex = html.indexOf('</script>', openTagEnd);
    if (closeTagIndex === -1) {
      console.error(`  ❌ Could not find closing </script> for block ${blockIndex}`);
      process.exit(1);
    }

    const jsxCode = html.substring(openTagEnd, closeTagIndex);
    console.log(`  🔨 Compiling block ${blockIndex} (${jsxCode.length} chars)...`);

    let compiledCode;
    try {
      compiledCode = compileBabelBlock(jsxCode, path.basename(inputPath));
    } catch (err) {
      console.error(`  ❌ Babel compile error:\n${err.message}`);
      process.exit(1);
    }

    console.log(`  ✅ ${jsxCode.length} chars → ${compiledCode.length} chars`);
    const before = html.substring(0, openTagStart);
    const after = html.substring(closeTagIndex + '</script>'.length);
    html = before + '<script>\n' + compiledCode + '\n</script>' + after;
  }

  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`  💾 Written: ${path.basename(outputPath)}`);
}

const PROJECT_DIR = __dirname;

const files = [
  { src: 'index.html.babel-backup',   dst: 'index.html' },
  { src: 'profile.html.babel-backup', dst: 'profile.html' },
  { src: 'share.html.babel-backup',   dst: 'share.html' },
];

for (const f of files) {
  const src = path.join(PROJECT_DIR, f.src);
  const dst = path.join(PROJECT_DIR, f.dst);
  if (!fs.existsSync(src)) {
    console.log(`⚠️  Kaynak bulunamadı, atlanıyor: ${f.src}`);
    continue;
  }
  processFile(src, dst);
}

console.log('\n🎉 Derleme tamamlandı! Cloudflare\'e deploy edebilirsin.');
