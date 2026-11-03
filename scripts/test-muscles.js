// Run: node --test scripts/test-muscles.js (no dependencies).
// Faz 4 — kas taksonomisi (D1), haftalık kas seti (D3), haftalık özet (E3),
// vücut ağırlığı rekorları (B16) ve hareket detay hesapları (E1).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const context = { window: {}, Date, Math, console };
vm.createContext(context);
for (const f of ['lib/calc.js', 'data/presets-exercises.js', 'lib/exercise-utils.js', 'data/ex-meta.js', 'lib/muscle-utils.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), context, { filename: f });
}
const C = context.window.LOGWISE_CALC;
const M = context.window.LOGWISE_MUSCLES;
const META = context.window.LOGWISE_EX_META;
const J = x => JSON.stringify(x);

test('D1: ex-meta generator çıktısı güncel ve her hazır hareketi kapsıyor', () => {
  const { build } = require('./build-ex-meta.js');
  const out = build();
  const cur = fs.readFileSync(path.join(root, 'data/ex-meta.js'), 'utf8').replace(/\r\n/g, '\n');
  assert.equal(cur, out);
  const presets = context.window.LOGWISE_PRESET_EXERCISES;
  assert.equal(Object.keys(META.exercises).length, presets.length);
  presets.forEach(p => assert.ok(META.exercises[p.id], p.id));
});

test('D1: takma ad kas adları tek bölgeye normalleşir', () => {
  // abdominals → rectus-abdominis, spinal-erectors → erector-spinae
  Object.values(META.exercises).forEach(e => {
    assert.ok(!e.pm.includes('abdominals') && !e.sm.includes('abdominals'));
    assert.ok(!e.pm.includes('spinal-erectors') && !e.sm.includes('spinal-erectors'));
    e.p.concat(e.s).forEach(r => assert.ok(META.regions[r], r));
    e.s.forEach(r => assert.ok(!e.p.includes(r), 'ikincil bölge birincilde tekrar etmemeli'));
  });
  assert.equal(J(META.exercises['bench-press'].p), J(['chest']));
  assert.equal(J(META.exercises['bench-press'].s), J(['front-delts', 'triceps']));
});

test('D3: birincil 1, ikincil 0,5 set; ısınma ve tamamlanmamış set sayılmaz', () => {
  const exercises = [{ id: 'e1', name: 'Bench Press', presetId: 'bench-press', categories: ['Göğüs'] }];
  const w = {
    '2026-11-02': [{ exerciseId: 'e1', sets: [
      { weight: 40, reps: 10, type: 'warmup', done: true },
      { weight: 60, reps: 8, done: true }, { weight: 60, reps: 8, done: true },
      { weight: 60, reps: 8, done: true }, { weight: 60, reps: 8, done: true },
      { weight: 0, reps: 0, done: false, target: { weight: 60, reps: 8 } }
    ] }]
  };
  const c = M.countMuscleSets(w, exercises, { from: '2026-11-02', to: '2026-11-08' });
  assert.equal(c.chest, 4);
  assert.equal(c['front-delts'], 2);
  assert.equal(c.triceps, 2);
});

test('D3: plandaki örnek — iki push gününde 4 bench + 3 incline dumbbell = göğüs 14', () => {
  const exercises = [
    { id: 'a', name: 'Bench Press', presetId: 'bench-press', categories: ['Göğüs'] },
    { id: 'b', name: 'Incline DB', presetId: 'incline-dumbell-press', categories: ['Göğüs'] }
  ];
  const day = () => [
    { exerciseId: 'a', sets: Array.from({ length: 4 }, () => ({ weight: 60, reps: 8, done: true })) },
    { exerciseId: 'b', sets: Array.from({ length: 3 }, () => ({ weight: 22, reps: 10, done: true })) }
  ];
  const c = M.countMuscleSets({ '2026-11-02': day(), '2026-11-05': day() }, exercises, { from: '2026-11-02', to: '2026-11-08' });
  assert.equal(c.chest, 14);
});

test('D3: özel hareket kategoriden bölgeye düşer, kardiyo sayılmaz', () => {
  const exercises = [
    { id: 'x', name: 'Benim Hareketim', categories: ['Sırt'] },
    { id: 'k', name: 'Koşu', categories: ['Kardiyo'] }
  ];
  const w = { '2026-11-03': [{ exerciseId: 'x', sets: [{ weight: 50, reps: 10 }, { weight: 50, reps: 10 }] }, { exerciseId: 'k', sets: [{ duration: 30 }] }] };
  const c = M.countMuscleSets(w, exercises, {});
  assert.equal(c.lats, 2);
  assert.equal(c['upper-back'], 2);
  assert.equal(Object.keys(c).length, 2);
});

test('D3: kişisel hedef bandı; varsayılan 10–20', () => {
  assert.equal(J(M.targetFor('chest', {})), J({ min: 10, max: 20 }));
  assert.equal(J(M.targetFor('chest', { muscleTargets: { chest: { min: 16, max: 20 } } })), J({ min: 16, max: 20 }));
  assert.equal(M.targetStatus(9.5, { min: 10, max: 20 }), 'under');
  assert.equal(M.targetStatus(14, { min: 10, max: 20 }), 'in');
  assert.equal(M.targetStatus(22, { min: 10, max: 20 }), 'over');
});

test('D2: bölgeye ve ekipmana göre hazır hareket listesi', () => {
  const chest = M.presetsForRegion('chest');
  assert.ok(chest.includes('bench-press'));
  assert.ok(!chest.includes('squat'));
  const cableChest = M.presetsForRegion('chest', { equipment: ['cable'] });
  assert.ok(cableChest.includes('cable-crossover'));
  assert.ok(!cableChest.includes('bench-press'));
});

test('B16: vücut ağırlığı hareketinde rekor en çok tekrar; destekli harekette negatif ağırlık', () => {
  const exercises = [
    { id: 'p', name: 'Pull Up', presetId: 'pull-up', categories: ['Sırt'], loadType: M.loadTypeOf({ presetId: 'pull-up' }) },
    { id: 'a', name: 'Assisted', presetId: 'assisted-pull-up', categories: ['Sırt'], loadType: M.loadTypeOf({ presetId: 'assisted-pull-up' }) }
  ];
  assert.equal(exercises[0].loadType, 'bodyweight');
  assert.equal(exercises[1].loadType, 'assisted');
  const w = {
    '2026-11-01': [{ exerciseId: 'p', sets: [{ weight: 0, reps: 8 }, { weight: 0, reps: 10 }] }, { exerciseId: 'a', sets: [{ weight: -30, reps: 8 }] }],
    '2026-11-03': [{ exerciseId: 'p', sets: [{ weight: 10, reps: 5 }] }, { exerciseId: 'a', sets: [{ weight: -20, reps: 8 }] }]
  };
  const prs = C.getAllPRs(w, exercises);
  assert.equal(prs.p.maxReps, 10);
  assert.equal(prs.p.maxWeight, 10);
  assert.equal(prs.a.maxReps, 8);
  assert.equal(prs.a.maxWeight, -20); // en az destek
  assert.equal(C.setVolume({ weight: -20, reps: 8 }), 0);
  // Ağırlıklı hareket 0 kg ile rekor üretmez (eski davranış korunur).
  const prs2 = C.getAllPRs({ d: [{ exerciseId: 'z', sets: [{ weight: 0, reps: 10 }] }] }, [{ id: 'z' }]);
  assert.equal(prs2.z, undefined);
});

test('E3: hafta içinde kırılan rekorlar (ilk seans rekor sayılmaz)', () => {
  const ex = [{ id: 'b', categories: ['Göğüs'] }, { id: 'p', loadType: 'bodyweight', categories: ['Sırt'] }];
  const w = {
    '2026-10-26': [{ exerciseId: 'b', sets: [{ weight: 60, reps: 8 }] }, { exerciseId: 'p', sets: [{ weight: 0, reps: 8 }] }],
    '2026-11-03': [{ exerciseId: 'b', sets: [{ weight: 62.5, reps: 8 }] }, { exerciseId: 'p', sets: [{ weight: 0, reps: 7 }] }],
    '2026-11-04': [{ exerciseId: 'n', sets: [{ weight: 40, reps: 8 }] }]
  };
  const ev = C.prEvents(w, ex.concat([{ id: 'n', categories: ['Biceps'] }]), { from: '2026-11-02', to: '2026-11-08' });
  assert.equal(ev.length, 1);
  assert.equal(ev[0].exerciseId, 'b');
});

test('E3: haftalık özet — antrenman günü, set, rekor, hedefin altındaki bölge', () => {
  const exercises = [
    { id: 'sq', name: 'Squat', presetId: 'squat', categories: ['Bacak'] },
    { id: 'bp', name: 'Bench Press', presetId: 'bench-press', categories: ['Göğüs'] }
  ];
  const sets = (n, w) => Array.from({ length: n }, () => ({ weight: w, reps: 8 }));
  const w = {
    '2026-10-20': [{ exerciseId: 'sq', sets: sets(3, 80) }, { exerciseId: 'bp', sets: sets(4, 60) }],
    '2026-11-02': [{ exerciseId: 'bp', sets: sets(4, 62.5) }],
    '2026-11-03': [{ exerciseId: 'bp', sets: sets(4, 60) }, { exerciseId: 'sq', sets: sets(2, 80) }]
  };
  const program = { days: { 0: ['bp'], 1: ['sq'], 2: [], 3: ['bp'], 4: ['sq'], 5: [], 6: [] }, offDays: [] };
  const s = M.weekSummary(w, exercises, { today: '2026-11-04', program });
  assert.equal(s.start, '2026-11-02');
  assert.equal(s.trainedDays, 2);
  assert.equal(s.plannedDays, 4);
  assert.equal(s.sets, 10);
  assert.equal(s.prs, 1);
  // squat 2 set → ön bacak 2/10, arka bacak (ikincil) 1/10 → en geride arka bacak
  assert.equal(s.showUnder, false); // Çarşamba: uyarı henüz gösterilmez
  assert.equal(s.under.region, 'hamstrings');
  assert.equal(s.under.sets, 1);
  assert.equal(s.counts.quads, 2);
  assert.equal(s.counts.chest, 8);
});

test('E1: tekrar bazında rekor tablosu ve oturum özeti', () => {
  const hist = [
    { date: '2026-10-30', sets: [{ weight: 64, reps: 8 }, { weight: 70, reps: 5 }, { weight: 30, reps: 12, type: 'warmup' }] },
    { date: '2026-10-20', sets: [{ weight: 64, reps: 9 }, { weight: 50, reps: 12 }] }
  ];
  const t = C.repMaxTable(hist);
  const row = r => t.find(x => x.reps === r);
  assert.equal(row(8).weight, 64);
  assert.equal(row(8).date, '2026-10-20'); // aynı ağırlıkta ilk ulaşılan tarih
  assert.equal(row(5).weight, 70);
  assert.equal(row(1).weight, 70);
  assert.equal(row(12).weight, 50); // ısınma seti sayılmaz
  const ss = C.sessionStats(hist);
  assert.equal(ss[0].date, '2026-10-20');
  assert.equal(ss[1].maxW, 70);
  assert.equal(ss[1].sets, 2);
  assert.equal(ss[1].best1RM, C.calc1RM(64, 8) > C.calc1RM(70, 5) ? C.calc1RM(64, 8) : C.calc1RM(70, 5));
});

test('E3: hedef-altı uyarısı Cuma\'dan itibaren gösterilir', () => {
  const exercises = [{ id: 'sq', name: 'Squat', presetId: 'squat', categories: ['Bacak'] }];
  const w = { '2026-10-20': [{ exerciseId: 'sq', sets: [{ weight: 80, reps: 8 }] }], '2026-11-02': [{ exerciseId: 'sq', sets: [{ weight: 80, reps: 8 }] }] };
  assert.equal(M.weekSummary(w, exercises, { today: '2026-11-05' }).showUnder, false); // Perşembe
  const fri = M.weekSummary(w, exercises, { today: '2026-11-06' });
  assert.equal(fri.showUnder, true);
  assert.equal(fri.plannedDays, null); // program yok
});

// ---- Faz 5 ----
test('D4: toparlanma — son çalışılan gün, aradan geçen gün ve durum', () => {
  const exercises = [{ id: 'bp', name: 'Bench Press', presetId: 'bench-press', categories: ['Göğüs'] }, { id: 'sq', name: 'Squat', presetId: 'squat', categories: ['Bacak'] }];
  const w = {
    '2026-10-28': [{ exerciseId: 'sq', sets: [{ weight: 80, reps: 8 }, { weight: 80, reps: 8 }] }],
    '2026-11-01': [{ exerciseId: 'bp', sets: [{ weight: 60, reps: 8 }] }],
    '2026-11-03': [{ exerciseId: 'bp', sets: [{ weight: 60, reps: 8, done: false }] }] // plan: sayılmaz
  };
  const r = M.recoveryStatus(w, exercises, { today: '2026-11-03' });
  assert.equal(r.chest.last, '2026-11-01');
  assert.equal(r.chest.days, 2);
  assert.equal(r.chest.state, 'recovering');
  assert.equal(r.quads.days, 6);
  assert.equal(r.quads.state, 'ready');
  assert.equal(r.quads.sets, 2);
  assert.equal(r.lats, undefined);
});

test('E5: kilo serisi ve 7 günlük hareketli ortalama', () => {
  const ms = {
    '2026-10-20': [{ id: '1', weight: 80 }],
    '2026-10-25': [{ id: '2', weight: 79 }, { id: '3', weight: 78.6 }], // aynı gün: son kayıt
    '2026-10-27': [{ id: '4', weight: 78, waist: 80 }],
    '2026-10-30': [{ id: '5', waist: 79 }] // kilo yok: atlanır
  };
  const t = C.weightTrend(ms);
  assert.equal(t.length, 3);
  assert.equal(t[1].bw, 78.6);
  assert.equal(t[1].avg, 79.3); // 19–25 Ekim: 80 ve 78,6
  assert.equal(t[0].avg, 80);
  assert.equal(t[2].avg, 78.3); // 21–27 Ekim: 20 Ekim pencerenin dışında
});

test('E4: rekor tarihi ve 12+ tekrarlı tahmin işareti', () => {
  const ex = [{ id: 'a' }, { id: 'p', loadType: 'bodyweight' }];
  const w = {
    '2026-10-01': [{ exerciseId: 'a', sets: [{ weight: 40, reps: 15 }] }, { exerciseId: 'p', sets: [{ weight: 0, reps: 10 }] }],
    '2026-10-10': [{ exerciseId: 'a', sets: [{ weight: 30, reps: 10 }] }, { exerciseId: 'p', sets: [{ weight: 0, reps: 12 }] }]
  };
  const prs = C.getAllPRs(w, ex);
  assert.equal(prs.a.prDate, '2026-10-01');
  assert.equal(prs.a.est1RMReps, 15);
  assert.equal(prs.p.prDate, '2026-10-10');
});

test('C6: lb ısınma planı 5 lb adımla', () => {
  assert.equal(C.warmupPlan(225, 45, 5).map(x => x.weight + 'x' + x.reps).join(' '), '45x10 115x5 160x3 190x1');
});

test('D6: eski yazımlı hazır hareket adları tanınır, id değişmez', () => {
  const U = context.window.LOGWISE_EX_UTILS;
  assert.equal(U.getExerciseById('dumbell-press').name, 'Dumbbell Press');
  assert.equal(U.isDefaultPresetName('dumbell-press', 'Dumbell Press'), true);
  assert.equal(U.isDefaultPresetName('incline-bench-press', 'İncline Bench Press'), true);
  assert.equal(U.isDefaultPresetName('dumbell-press', 'Benim Pressim'), false);
  assert.equal(U.resolveKey('Dumbell Press'), 'dumbell-press');
  assert.equal(U.resolveKey('İncline Dumbell Press'), 'incline-dumbell-press');
});
