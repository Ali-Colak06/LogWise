// Run: node --test scripts/test-calc.js (no dependencies).
// lib/calc.js saf hesaplarının regresyon testleri (Faz 1 / F2).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const context = { window: {}, Date, Math };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../lib/calc.js'), 'utf8'), context);
const C = context.window.LOGWISE_CALC;

test('setVolume: normal set = kg × tekrar', () => {
  assert.equal(C.setVolume({ weight: 60, reps: 8 }), 480);
  assert.equal(C.setVolume({ weight: 62.5, reps: 5 }), 312.5);
});

test('setVolume: kardiyo ve eksik alanlar NaN değil 0 üretir (B3)', () => {
  assert.equal(C.setVolume({ duration: 20 }), 0);
  assert.equal(C.setVolume({ weight: 0, reps: 10 }), 0);
  assert.equal(C.setVolume({ weight: "", reps: 5 }), 0);
  assert.equal(C.setVolume(null), 0);
  assert.equal(C.setVolume(undefined), 0);
});

test('toplam hacim, kardiyo seti olan bir günde sayı kalır (B3)', () => {
  const day = [
    { exerciseId: '1', sets: [{ weight: 60, reps: 8 }, { weight: 60, reps: 6 }] },
    { exerciseId: '11', sets: [{ duration: 20 }] }
  ];
  const total = day.reduce((b, w) => b + w.sets.reduce((c, s) => c + C.setVolume(s), 0), 0);
  assert.equal(total, 840);
  assert.ok(Number.isFinite(total));
});

test('getAllPRs kardiyo setlerinde NaN üretmez', () => {
  const exercises = [{ id: '1', name: 'Bench' }, { id: '11', name: 'Koşu', categories: ['Kardiyo'] }];
  const workouts = {
    '2026-10-30': [{ exerciseId: '1', sets: [{ weight: 64, reps: 8 }] }, { exerciseId: '11', sets: [{ duration: 25 }] }]
  };
  const prs = C.getAllPRs(workouts, exercises);
  assert.equal(prs['1'].maxWeight, 64);
  assert.equal(prs['1'].maxVolume, 512);
  assert.equal(prs['11'], undefined);
});

test('fmtRestShort: dinlenme etiketi saniyeyi kaybetmez (B5)', () => {
  assert.equal(C.fmtRestShort(30), '30s');
  assert.equal(C.fmtRestShort(60), '1m');
  assert.equal(C.fmtRestShort(90), '1m30s');
  assert.equal(C.fmtRestShort(300), '5m');
  assert.equal(C.fmtRestShort(-5), '0s');
});

test('restRemaining: zaman damgasından hesaplanır, arka planda kaymaz (B5)', () => {
  const start = 1_000_000;
  const endsAt = start + 90_000;
  assert.equal(C.restRemaining(endsAt, start), 90);
  assert.equal(C.restRemaining(endsAt, start + 500), 90);      // yukarı yuvarlar
  assert.equal(C.restRemaining(endsAt, start + 60_000), 30);   // sekme 60 sn uyusa bile doğru
  assert.equal(C.restRemaining(endsAt, start + 120_000), 0);   // negatife düşmez
  assert.equal(C.restRemaining(null, start), 0);
});

test('calc1RM temel değerler', () => {
  assert.equal(C.calc1RM(100, 1), 100);
  assert.equal(C.calc1RM(100, 5), 116.7);
  assert.equal(C.calc1RM(0, 5), 0);
});

// ---- Faz 2 ----
test('isSetDone: eski kayıtlar değer taşıyorsa tamam, yeni setler done alanına göre (C1)', () => {
  assert.equal(C.isSetDone({ weight: 60, reps: 8 }), true);          // eski kayıt
  assert.equal(C.isSetDone({ weight: 0, reps: 0 }), false);          // eski hayalet set
  assert.equal(C.isSetDone({ weight: 60, reps: 8, done: false }), false);
  assert.equal(C.isSetDone({ weight: 0, reps: 0, done: false, target: { weight: 60, reps: 8 } }), false);
  assert.equal(C.isSetDone({ weight: 0, reps: 12, done: true }), true); // vücut ağırlığı
  assert.equal(C.isSetDone({ duration: 20 }), true);
});

test('planlanan (tamamlanmamış) setler istatistiğe girmez (C1/B13)', () => {
  const workouts = {
    '2026-10-30': [{ exerciseId: '1', sets: [{ weight: 64, reps: 8, done: true }] }],
    '2026-11-02': [{ exerciseId: '1', sets: [{ weight: 0, reps: 0, done: false, target: { weight: 64, reps: 8 } }] }]
  };
  const f = C.filterWorkouts(workouts);
  assert.equal(Object.keys(f).join(','), '2026-10-30');
  const prs = C.getAllPRs(workouts, [{ id: '1' }]);
  assert.equal(prs['1'].maxWeight, 64);
});

test('filterWorkouts: includeWarmups=false ısınma setlerini çıkarır (E2)', () => {
  const workouts = { d: [{ exerciseId: '1', sets: [{ weight: 30, reps: 10, type: 'warmup' }, { weight: 60, reps: 8, type: 'working' }] }] };
  assert.equal(C.filterWorkouts(workouts).d[0].sets.length, 2);
  assert.equal(C.filterWorkouts(workouts, { includeWarmups: false }).d[0].sets.length, 1);
  const onlyWarm = { d: [{ exerciseId: '1', sets: [{ weight: 30, reps: 10, type: 'warmup' }] }] };
  assert.equal(JSON.stringify(C.filterWorkouts(onlyWarm, { includeWarmups: false })), '{}');
  assert.equal(workouts.d[0].sets.length, 2); // girdi değişmedi
});

test('matchPrevSet: ısınma seti normal setlerin ipucunu kaydırmaz (B8)', () => {
  const prev = [{ weight: 30, reps: 10, type: 'warmup' }, { weight: 64, reps: 8, type: 'working' }, { weight: 64, reps: 7, type: 'working' }];
  const curNoWarm = [{ type: 'working' }, { type: 'working' }];
  assert.equal(C.matchPrevSet(prev, curNoWarm, 0).weight, 64);
  assert.equal(C.matchPrevSet(prev, curNoWarm, 1).reps, 7);
  const curWithWarm = [{ type: 'warmup' }, { type: 'working' }];
  assert.equal(C.matchPrevSet(prev, curWithWarm, 0).weight, 30);
  assert.equal(C.matchPrevSet(prev, curWithWarm, 1).reps, 8);
  assert.equal(C.matchPrevSet(prev, [{ type: 'drop' }], 0), null);
  assert.equal(C.matchPrevSet(prev, [{}], 0).weight, 64); // tür yoksa normal
});

test('calcStreak tamamlanmamış planlı günü saymaz', () => {
  const fmt = C.fmt;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const y = new Date(today); y.setDate(y.getDate() - 1);
  const w = {};
  w[fmt(y)] = [{ exerciseId: '1', sets: [{ weight: 60, reps: 8 }] }];
  w[fmt(today)] = [{ exerciseId: '1', sets: [{ weight: 0, reps: 0, done: false }] }];
  assert.equal(C.calcStreak(w), 1);
});

test('toPlanSet: paylaşılan/kopyalanan set plan olur, istatistiğe girmez (B13 tutarlılığı)', () => {
  const p = C.toPlanSet({ weight: 80, reps: 5, type: 'working', rir: '2' });
  assert.equal(p.done, false);
  assert.equal(p.weight, 0);
  assert.equal(p.target.weight, 80);
  assert.equal(C.isSetDone(p), false);
  const c = C.toPlanSet({ duration: 25 });
  assert.equal(c.target.duration, 25);
  assert.equal(C.isSetDone(c), false);
});

// ---- Faz 3 ----
const dayKey = (base, off) => { const d = C.pD(base); d.setDate(d.getDate() + off); return C.fmt(d); };
const W = (dates) => Object.fromEntries(dates.map(k => [k, [{ exerciseId: '1', sets: [{ weight: 60, reps: 8 }] }]]));

test('calcStreakInfo: programın dinlenme günleri seriyi bozmaz (B6)', () => {
  // 2026-11-02 Pazartesi. PPL: Pzt, Sal, Çar, Cum, Cmt antrenman; Per (3) ve Paz (6) dinlenme.
  const today = '2026-11-02';
  const w = W(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-30', '2026-10-31']);
  const r = C.calcStreakInfo(w, { restDows: [3, 6], today });
  assert.equal(r.current, 5); // bugün boş (nötr), Pazar dinlenme, 5 antrenman günü
  const strict = C.calcStreakInfo(w, { restDows: [3, 6], today: '2026-11-03' }); // Pazartesi kaçırıldı
  assert.equal(strict.current, 0);
  assert.equal(strict.best, 5);
});

test('calcStreakInfo: program yoksa 2 güne kadar ara tolere edilir', () => {
  const today = '2026-11-02';
  const w = W(['2026-10-26', '2026-10-28', '2026-10-31', '2026-11-02']);
  assert.equal(C.calcStreakInfo(w, { today }).current, 4);
  const w2 = W(['2026-10-20', '2026-10-24', '2026-10-26']); // 3 günlük boşluk seriyi böler
  const r2 = C.calcStreakInfo(w2, { today: '2026-10-26' });
  assert.equal(r2.current, 2);
  assert.equal(r2.best, 2);
});

test('sıklık: aynı gün aynı kas grubu bir kez sayılır (B7)', () => {
  const now = new Date(); const k = C.fmt(now);
  const ex = [{ id: 'a', categories: ['Sırt'] }, { id: 'b', categories: ['Sırt', 'Biceps'] }, { id: 'c', categories: ['Sırt'] }];
  const w = { [k]: ['a', 'b', 'c'].map(id => ({ exerciseId: id, sets: [{ weight: 50, reps: 8 }] })) };
  const f = C.calcWeekFreq(w, ex, ['Sırt', 'Biceps']);
  assert.equal(f['Sırt'], 1);
  assert.equal(f['Biceps'], 1);
});

test('platesPerSide ve warmupPlan (C5)', () => {
  const p = C.platesPerSide(100);
  assert.equal(p.perSide.join('+'), '25+15');
  assert.equal(C.platesPerSide(62.5).perSide.join('+'), '20+1.25');
  assert.equal(C.platesPerSide(20).perSide.length, 0);
  assert.equal(C.platesPerSide(61).remainder, 1);
  const wu = C.warmupPlan(100);
  assert.equal(wu.map(x => x.weight + 'x' + x.reps).join(' '), '20x10 50x5 70x3 85x1');
  assert.equal(C.warmupPlan(20).length, 0);
});

test('progressionHint: tüm setler üst sınıra ulaşınca artış önerir (C4)', () => {
  const t = { sets: 3, repMin: 8, repMax: 12, inc: 2.5 };
  const done = [{ weight: 30, reps: 10, type: 'warmup' }, { weight: 60, reps: 12 }, { weight: 60, reps: 12 }, { weight: 60, reps: 12 }];
  const h = C.progressionHint(done, t);
  assert.equal(h.weight, 62.5);
  assert.equal(h.reps, 8);
  const notYet = [{ weight: 60, reps: 12 }, { weight: 60, reps: 11 }, { weight: 60, reps: 10 }];
  assert.equal(C.progressionHint(notYet, t), null);
  assert.equal(C.progressionHint(done, null), null);
  assert.equal(C.progressionHint([{ weight: 60, reps: 12 }], t), null); // set sayısı eksik
});

test('programRestDows: offDays + boş günler', () => {
  const pg = { days: { 0: ['a'], 1: ['b'], 2: [], 3: ['c'], 4: [], 5: [], 6: [] }, offDays: ['3'] };
  assert.equal(C.programRestDows(pg).join(','), '2,3,4,5,6');
});
