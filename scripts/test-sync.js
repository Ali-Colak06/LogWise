// Run: node --test scripts/test-sync.js (no dependencies).
// lib/sync.js — veri kaybı korumalarının regresyon testleri (Faz 1 / A1, A2, A3, F2).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const makeStorage = () => {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
    _m: m
  };
};

const load = () => {
  const storage = makeStorage();
  const context = { window: { localStorage: storage }, Date, JSON, Math, Promise, navigator: { onLine: true } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../lib/sync.js'), 'utf8'), context);
  return { S: context.window.LOGWISE_SYNC, storage };
};

// Supabase'in kullandığımız kısmını taklit eden bellek-içi sahte istemci.
// row: { data, updated_at } | null. failSelect: true → okuma hata verir. log: yapılan yazmalar.
const fakeSb = (opts = {}) => {
  const state = { row: opts.row === undefined ? null : opts.row, log: [], failSelect: !!opts.failSelect, failWrite: !!opts.failWrite, tick: 0 };
  const stamp = () => `2026-11-02T20:00:${String(++state.tick).padStart(2, '0')}.000+00:00`;
  const from = () => {
    const q = { op: 'select', filters: [] };
    const exec = async () => {
      if (q.op === 'select') {
        if (state.failSelect) return { data: null, error: { message: 'TypeError: Failed to fetch' } };
        return { data: state.row ? { ...state.row } : null, error: null };
      }
      if (state.failWrite) return { data: null, error: { message: 'TypeError: Failed to fetch' } };
      if (q.op === 'update') {
        const ok = state.row && q.filters.every(([k, v]) => k === 'user_id' || (v === null ? state.row.updated_at == null : state.row.updated_at === v));
        if (!ok) return { data: [], error: null };
        state.row = { data: q.payload.data, updated_at: stamp() };
        state.log.push(['update', q.payload.data]);
        return { data: [{ updated_at: state.row.updated_at }], error: null };
      }
      if (q.op === 'insert') {
        if (state.row) return { data: null, error: { code: '23505', message: 'duplicate key' } };
        state.row = { data: q.payload.data, updated_at: stamp() };
        state.log.push(['insert', q.payload.data]);
        return { data: [{ updated_at: state.row.updated_at }], error: null };
      }
      if (q.op === 'upsert') {
        state.row = { data: q.payload.data, updated_at: stamp() };
        state.log.push(['upsert', q.payload.data]);
        return { data: [{ updated_at: state.row.updated_at }], error: null };
      }
      return { data: null, error: { message: 'unknown op' } };
    };
    const api = {
      select: () => api,
      update: p => { q.op = 'update'; q.payload = p; return api; },
      insert: p => { q.op = 'insert'; q.payload = p; return api; },
      upsert: p => { q.op = 'upsert'; q.payload = p; return api; },
      eq: (k, v) => { if (k !== 'user_id') q.filters.push([k, v]); return api; },
      is: (k, v) => { q.filters.push([k, v]); return api; },
      maybeSingle: () => exec(),
      then: (res, rej) => exec().then(res, rej)
    };
    return api;
  };
  return { from, state };
};

const empty = () => ({ exercises: [], workouts: {} });

test('classifyLoad: hata ile "satır yok" ayrılır (A1)', () => {
  const { S } = load();
  assert.equal(S.classifyLoad({ data: null, error: { message: 'x' } }).status, 'error');
  assert.equal(S.classifyLoad({ data: null, error: null }).status, 'missing');
  const ok = S.classifyLoad({ data: { data: { a: 1 }, updated_at: 't1' }, error: null });
  assert.equal(ok.status, 'ok');
  assert.equal(ok.updatedAt, 't1');
});

test('decideInitial: bulut hatası + yerel kopya yok → error (boş veri ile devam ETMEZ)', () => {
  const { S } = load();
  assert.equal(S.decideInitial({ local: null, cloud: { status: 'error' } }).action, 'error');
});

test('decideInitial: bulut hatası + yerel kopya var → çevrimdışı yerel ile devam', () => {
  const { S } = load();
  const local = { data: { x: 1 }, base: { exists: true, updatedAt: 't1' }, dirty: false };
  const d = S.decideInitial({ local, cloud: { status: 'error' } });
  assert.equal(d.action, 'local-offline');
  assert.deepEqual(d.data, { x: 1 });
});

test('decideInitial: kirli yerel kopya, bulut aynı sürümde → yereli gönder', () => {
  const { S } = load();
  const local = { data: { x: 2 }, base: { exists: true, updatedAt: '2026-11-02T20:00:01.000Z' }, dirty: true };
  const d = S.decideInitial({ local, cloud: { status: 'ok', data: { x: 1 }, updatedAt: '2026-11-02T20:00:01+00:00' } });
  assert.equal(d.action, 'local');
  assert.equal(d.push, true);
});

test('decideInitial: kirli yerel kopya, bulut başka yerde değişmiş → conflict (sessiz ezme yok)', () => {
  const { S } = load();
  const local = { data: { x: 2 }, base: { exists: true, updatedAt: 't1' }, dirty: true };
  const d = S.decideInitial({ local, cloud: { status: 'ok', data: { x: 9 }, updatedAt: 't5' } });
  assert.equal(d.action, 'conflict');
});

test('decideInitial: temiz yerel kopya → her zaman bulut', () => {
  const { S } = load();
  const local = { data: { x: 2 }, base: { exists: true, updatedAt: 't1' }, dirty: false };
  assert.equal(S.decideInitial({ local, cloud: { status: 'ok', data: { x: 9 }, updatedAt: 't5' } }).action, 'cloud');
  assert.equal(S.decideInitial({ local: null, cloud: { status: 'missing' } }).action, 'init');
});

test('readLocal/writeLocal kullanıcıya özel anahtar kullanır, misafir anahtarına dokunmaz (A3)', () => {
  const { S, storage } = load();
  assert.equal(S.writeLocal(storage, 'u1', { data: { a: 1 }, base: { exists: true, updatedAt: 't' }, dirty: true }), true);
  assert.equal(storage.getItem('gym-log-v3'), null);
  const r = S.readLocal(storage, 'u1');
  assert.equal(r.dirty, true);
  assert.deepEqual(r.data, { a: 1 });
  assert.equal(S.readLocal(storage, 'u2'), null);
  storage.setItem(S.localKey('u3'), '{bozuk');
  assert.equal(S.readLocal(storage, 'u3'), null);
});

test('writeCloud: temel sürüm eşleşirse yazar ve yeni temeli döndürür', async () => {
  const { S } = load();
  const sb = fakeSb({ row: { data: empty(), updated_at: 't0' } });
  const w = await S.writeCloud(sb, 'u1', { exercises: [1] }, { exists: true, updatedAt: 't0' });
  assert.equal(w.status, 'ok');
  assert.notEqual(w.base.updatedAt, 't0');
  assert.deepEqual(sb.state.row.data, { exercises: [1] });
});

test('writeCloud: başka biri arada yazdıysa conflict döner, bulutu EZMEZ (A1/A2)', async () => {
  const { S } = load();
  const sb = fakeSb({ row: { data: { exercises: ['başka cihaz'] }, updated_at: 't9' } });
  const w = await S.writeCloud(sb, 'u1', { exercises: [] }, { exists: true, updatedAt: 't0' });
  assert.equal(w.status, 'conflict');
  assert.deepEqual(sb.state.row.data, { exercises: ['başka cihaz'] });
  assert.equal(sb.state.log.length, 0);
});

test('writeCloud: ilk kayıt insert; satır zaten varsa conflict', async () => {
  const { S } = load();
  const sb = fakeSb({ row: null });
  assert.equal((await S.writeCloud(sb, 'u1', { a: 1 }, { exists: false })).status, 'ok');
  const sb2 = fakeSb({ row: { data: { a: 'eski' }, updated_at: 't1' } });
  const w = await S.writeCloud(sb2, 'u1', { a: 1 }, { exists: false });
  assert.equal(w.status, 'conflict');
  assert.deepEqual(sb2.state.row.data, { a: 'eski' });
});

test('writeCloud: ağ hatası offline olarak işaretlenir', async () => {
  const { S } = load();
  const sb = fakeSb({ row: { data: {}, updated_at: 't0' }, failWrite: true });
  const w = await S.writeCloud(sb, 'u1', {}, { exists: true, updatedAt: 't0' });
  assert.equal(w.status, 'error');
  assert.equal(w.offline, true);
});

test('mutateUserData: okuma hata verirse HİÇ yazmaz (profil/paylaşım kopyalama, A1)', async () => {
  const { S } = load();
  const sb = fakeSb({ row: { data: { programs: { p1: 'gerçek geçmiş' } }, updated_at: 't0' }, failSelect: true });
  const r = await S.mutateUserData(sb, 'u1', cur => ({ ...cur, programs: { yeni: 1 } }), empty);
  assert.equal(r.ok, false);
  assert.equal(sb.state.log.length, 0);
  assert.deepEqual(sb.state.row.data, { programs: { p1: 'gerçek geçmiş' } });
});

test('mutateUserData: mevcut veriyi korur ve üzerine ekler', async () => {
  const { S } = load();
  const sb = fakeSb({ row: { data: { programs: { p1: 'eski' } }, updated_at: 't0' } });
  const r = await S.mutateUserData(sb, 'u1', cur => ({ ...cur, programs: { ...cur.programs, p2: 'yeni' } }), empty);
  assert.equal(r.ok, true);
  assert.deepEqual(sb.state.row.data, { programs: { p1: 'eski', p2: 'yeni' } });
});

// ---- Faz 2 / A5: misafir verisini hesaba aktarma ----
test('mergeGuestData: hareketleri presetId/isimle eşler, aynı gün aynı hareket bulutta kalır', () => {
  const { S } = load();
  const account = {
    exercises: [{ id: 'a1', name: 'Bench Press', presetId: 'bench-press', categories: ['Göğüs'] }],
    workouts: { '2026-10-30': [{ exerciseId: 'a1', sets: [{ weight: 64, reps: 8 }] }] },
    programs: {}, activeProgram: null
  };
  const guest = {
    exercises: [
      { id: 'g1', name: 'bench press', categories: ['Göğüs'] },
      { id: 'g2', name: 'Hack Squat', categories: ['Bacak'] }
    ],
    workouts: {
      '2026-10-30': [{ exerciseId: 'g1', sets: [{ weight: 50, reps: 10 }] }, { exerciseId: 'g2', sets: [{ weight: 80, reps: 10 }] }],
      '2026-10-31': [{ exerciseId: 'g1', sets: [{ weight: 55, reps: 10 }] }]
    },
    programs: { p9: { name: 'Misafir PPL', days: { 0: ['g1'], 1: ['g2'] } } },
    activeProgram: 'p9'
  };
  const { data, stats } = S.mergeGuestData(account, guest);
  assert.equal(data.exercises.length, 2);
  const hack = data.exercises.find(e => e.name === 'Hack Squat');
  assert.equal(data.workouts['2026-10-30'].length, 2);
  assert.equal(data.workouts['2026-10-30'][0].sets[0].weight, 64); // bulut korundu
  assert.equal(data.workouts['2026-10-30'][1].exerciseId, hack.id);
  assert.equal(data.workouts['2026-10-31'][0].exerciseId, 'a1');
  assert.equal(JSON.stringify(data.programs.p9.days[0]), '["a1"]');
  assert.equal(data.activeProgram, 'p9');
  assert.equal(stats.skippedEntries, 1);
  assert.equal(stats.addedDays, 1);
  assert.equal(account.workouts['2026-10-30'].length, 1); // girdi değişmedi
});

test('mergeGuestData: aktif program hesapta varsa korunur, id çakışması yeniden adlandırılır', () => {
  const { S } = load();
  const account = { exercises: [{ id: 'x', name: 'Squat' }], workouts: {}, programs: { p1: { name: 'Hesap', days: {} } }, activeProgram: 'p1' };
  const guest = { exercises: [{ id: 'x', name: 'Deadlift' }], workouts: {}, programs: { p1: { name: 'Misafir', days: { 0: ['x'] } } }, activeProgram: 'p1' };
  const { data } = S.mergeGuestData(account, guest);
  assert.equal(data.activeProgram, 'p1');
  assert.equal(data.programs.p1.name, 'Hesap');
  const dl = data.exercises.find(e => e.name === 'Deadlift');
  assert.notEqual(dl.id, 'x');
  const gp = Object.values(data.programs).find(p => p.name === 'Misafir');
  assert.equal(JSON.stringify(gp.days[0]), JSON.stringify([dl.id]));
});

test('guestSummary / hasGuestContent', () => {
  const { S } = load();
  assert.equal(S.hasGuestContent(null), false);
  assert.equal(S.hasGuestContent({ exercises: [], workouts: {}, programs: {} }), false);
  assert.equal(JSON.stringify(S.guestSummary({ exercises: [{}], workouts: { d: [{ sets: [{}] }], e: [] }, programs: {} })), JSON.stringify({ workoutDays: 1, exercises: 1, programs: 0 }));
});

test('applySharedWorkout: aynı gün aynı hareket çift kayıt açmaz, hazır hareketi tanır (B12)', () => {
  const { S } = load();
  const cur = { exercises: [{ id: 'b1', name: 'Bench Press', categories: ['Göğüs'] }], workouts: { d: [{ exerciseId: 'b1', sets: [{ weight: 60, reps: 8 }] }] } };
  const presets = { 'lat pulldown': { id: 'lat-pulldown', categories: ['Sırt'] } };
  const out = S.applySharedWorkout(cur, [{ sets: [{ weight: 70, reps: 5 }] }, { sets: [{ weight: 50, reps: 10 }] }], ['bench press', 'Lat Pulldown'], 'd', {
    resolvePreset: n => presets[n.toLowerCase()] || null,
    toPlanSet: st => ({ weight: 0, reps: 0, done: false, target: { weight: st.weight, reps: st.reps } }),
    makeId: i => 'new' + i
  });
  assert.equal(out.workouts.d.length, 2);
  assert.equal(out.workouts.d[0].sets.length, 2);
  const lat = out.exercises.find(e => e.name === 'Lat Pulldown');
  assert.equal(lat.presetId, 'lat-pulldown');
  assert.equal(lat.categories[0], 'Sırt');
  assert.equal(cur.workouts.d[0].sets.length, 1); // girdi değişmedi
});
