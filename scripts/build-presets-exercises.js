#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SOURCE_PATH = path.join(ROOT_DIR, 'data', 'presets-exercises.json');
const WEB_OUTPUT_PATH = path.join(ROOT_DIR, 'data', 'presets-exercises.js');
const MOBILE_OUTPUT_PATH = path.join(ROOT_DIR, 'logwise-mobile', 'data', 'generated', 'presets-exercises.ts');

const CHECK_MODE = process.argv.includes('--check');

const WEB_EOL = '\r\n';
const MOBILE_EOL = '\n';

function readCanonicalExercises() {
  const raw = fs.readFileSync(SOURCE_PATH, 'utf8');
  const exercises = JSON.parse(raw);
  validateExercises(exercises);
  return exercises;
}

function validateExercises(exercises) {
  if (!Array.isArray(exercises)) {
    throw new Error('data/presets-exercises.json must be an array.');
  }

  const ids = new Set();

  exercises.forEach((exercise, index) => {
    const location = `exercise[${index}]`;
    const allowedKeys = new Set(['id', 'name', 'nameEN', 'categories']);

    Object.keys(exercise).forEach((key) => {
      if (!allowedKeys.has(key)) {
        throw new Error(`${location} has unsupported key "${key}".`);
      }
    });

    if (!isNonEmptyString(exercise.id)) {
      throw new Error(`${location}.id must be a non-empty string.`);
    }
    if (!/^[a-z0-9-]+$/.test(exercise.id)) {
      throw new Error(`${location}.id must be kebab-case: ${exercise.id}`);
    }
    if (ids.has(exercise.id)) {
      throw new Error(`Duplicate preset exercise id: ${exercise.id}`);
    }
    ids.add(exercise.id);

    if (!isNonEmptyString(exercise.name)) {
      throw new Error(`${location}.name must be a non-empty string.`);
    }
    if (
      Object.prototype.hasOwnProperty.call(exercise, 'nameEN') &&
      !isNonEmptyString(exercise.nameEN)
    ) {
      throw new Error(`${location}.nameEN must be a non-empty string when present.`);
    }
    if (!Array.isArray(exercise.categories) || exercise.categories.length === 0) {
      throw new Error(`${location}.categories must be a non-empty array.`);
    }

    exercise.categories.forEach((category, categoryIndex) => {
      if (!isNonEmptyString(category)) {
        throw new Error(`${location}.categories[${categoryIndex}] must be a non-empty string.`);
      }
    });
  });
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function jsDouble(value) {
  return JSON.stringify(value);
}

function tsSingle(value) {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function buildWebOutput(exercises) {
  const header = [
    '// LogWise — Hazır Hareket (Preset Exercise) Listesi',
    '// 145 hareket; her biri için slug `id` (İngilizce kebab-case), Türkçe ad (name),',
    '// opsiyonel İngilizce ad (nameEN) ve ait olduğu kategori(ler).',
    '// Kategori isimleri Türkçe kalıyor (CAT_LABELS_EN ile çevriliyor).',
    '// Kategoriler: Göğüs, Omuz, Triceps, Biceps, Bilek, Sırt, Bacak, Kalça, Kalf, Trapez, Karın, Kardiyo',
    '//',
    '// id KURALI (Faz EX-ID):',
    "//   - İngilizce ad varsa ondan türet, yoksa name'den (zaten çoğu İng.)",
    '//   - kebab-case, sadece [a-z0-9-] karakterler',
    '//   - Türkçe karakter: İ→i, ş→s, ü→u, ç→c, ğ→g, ı→i, ö→o',
    "//   - id'ler GLOBAL OLARAK BENZERSİZ olmalı (ex-descriptions.js ve ex-preview.js key'i olarak kullanılıyor)",
  ].join(WEB_EOL);

  let output = `${header}${WEB_EOL}window.LOGWISE_PRESET_EXERCISES = [`;

  exercises.forEach((exercise, index) => {
    output += index === 0 ? `{${WEB_EOL}` : `}, {${WEB_EOL}`;
    output += `  id: ${jsDouble(exercise.id)},${WEB_EOL}`;
    output += `  name: ${jsDouble(exercise.name)},${WEB_EOL}`;
    if (Object.prototype.hasOwnProperty.call(exercise, 'nameEN')) {
      output += `  nameEN: ${jsDouble(exercise.nameEN)},${WEB_EOL}`;
    }
    output += `  categories: [${exercise.categories.map(jsDouble).join(', ')}]${WEB_EOL}`;
  });

  output += `}];${WEB_EOL}`;
  return output;
}

function buildMobileOutput(exercises) {
  const lines = [
    '/**',
    ' * GENERATED — elle DÜZENLEME. Kaynak: data/presets-exercises.json',
    ' * Yeniden üret: node scripts/build-presets-exercises.js',
    ' * Doğrula:     node scripts/build-presets-exercises.js --check',
    ' *',
    " * Web `data/presets-exercises.js` ile AYNI kanonik JSON'dan üretilir.",
    ' * Mobil format: tek tırnak, satır başına bir obje, nameEN yalnız tanımlıysa.',
    ' */',
    "import type { PresetExercise } from '../presets-exercises.types';",
    '',
    'export const PRESET_EXERCISES: PresetExercise[] = [',
  ];

  exercises.forEach((exercise) => {
    const fields = [
      `id: ${tsSingle(exercise.id)}`,
      `name: ${tsSingle(exercise.name)}`,
    ];

    if (Object.prototype.hasOwnProperty.call(exercise, 'nameEN')) {
      fields.push(`nameEN: ${tsSingle(exercise.nameEN)}`);
    }

    fields.push(`categories: [${exercise.categories.map(tsSingle).join(', ')}]`);
    lines.push(`  { ${fields.join(', ')} },`);
  });

  lines.push('];', '');
  return lines.join(MOBILE_EOL);
}

function writeOrCheck(outputs) {
  const drifted = [];

  outputs.forEach(({ filePath, content }) => {
    if (CHECK_MODE) {
      const current = fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;
      const expected = Buffer.from(content, 'utf8');
      if (!current || !current.equals(expected)) {
        drifted.push(path.relative(ROOT_DIR, filePath).replace(/\\/g, '/'));
      }
      return;
    }

    fs.writeFileSync(filePath, content, 'utf8');
  });

  if (drifted.length > 0) {
    console.error('Preset exercise generated outputs are stale:');
    drifted.forEach((filePath) => console.error(`  - ${filePath}`));
    console.error('Run: node scripts/build-presets-exercises.js');
    process.exit(1);
  }
}

function main() {
  const exercises = readCanonicalExercises();
  writeOrCheck([
    { filePath: WEB_OUTPUT_PATH, content: buildWebOutput(exercises) },
    { filePath: MOBILE_OUTPUT_PATH, content: buildMobileOutput(exercises) },
  ]);

  const action = CHECK_MODE ? 'validated' : 'generated';
  console.log(`Preset exercises ${action}: ${exercises.length} records, 2 outputs.`);
}

main();
