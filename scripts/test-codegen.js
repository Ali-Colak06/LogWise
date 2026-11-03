// Run: node --test scripts/test-codegen.js (no dependencies).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const FILES = [
  'scripts/check-codegen.js',
  'scripts/build-presets-exercises.js',
  'scripts/build-ex-guides.js',
  'scripts/build-ex-meta.js',
  'data/presets-exercises.json',
  'data/ex-guides.json',
  'data/ex-meta.json',
  'data/presets-exercises.js',
  'data/ex-guides.js',
  'data/ex-meta.js',
  'logwise-mobile/data/generated/presets-exercises.ts',
  'logwise-mobile/data/generated/ex-content.ts'
];

function fixture(t, eol) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'logwise-codegen-'));
  t.after(() => {
    const resolved = path.resolve(dir);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('logwise-codegen-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  FILES.forEach(file => {
    const dest = path.join(dir, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/\r\n/g, '\n');
    fs.writeFileSync(dest, eol === '\n' ? source : source.replace(/\n/g, eol));
  });
  return dir;
}

function check(dir) {
  return spawnSync(process.execPath, [path.join(dir, 'scripts/check-codegen.js')], {
    cwd: dir,
    encoding: 'utf8'
  });
}

for (const [label, eol] of [['LF', '\n'], ['CRLF', '\r\n']]) {
  test(`codegen checks accept an unchanged ${label} checkout`, t => {
    const result = check(fixture(t, eol));
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });
}

test('codegen checks reject actual content drift in every generated output', t => {
  const dir = fixture(t, '\n');
  for (const file of FILES.filter(f => f.startsWith('data/') && f.endsWith('.js') || f.endsWith('.ts'))) {
    const dest = path.join(dir, file);
    const original = fs.readFileSync(dest, 'utf8');
    fs.appendFileSync(dest, '\n// unexpected generated content\n');
    const result = check(dir);
    assert.equal(result.status, 1, file + ': ' + result.stdout + result.stderr);
    assert.ok((result.stdout + result.stderr).includes(file), file);
    fs.writeFileSync(dest, original);
  }
});
