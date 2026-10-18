// Run: node --test scripts/test-habit-utils.js (no dependencies).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const context = { window: {}, Intl, Date };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../lib/habit-utils.js'), 'utf8'), context);
const U = context.window.LOGWISE_HABIT_UTILS;
const stats = (days, today) => JSON.parse(JSON.stringify(U.statistics(days, today)));

test('today stays open while yesterday’s streak is preserved', () => {
  assert.deepEqual(stats(['2026-10-16', '2026-10-17'], '2026-10-18'), { current: 2, longest: 2, thisMonth: 2 });
});
test('completing today extends the streak; missing yesterday breaks it', () => {
  assert.equal(stats(['2026-10-16', '2026-10-17', '2026-10-18'], '2026-10-18').current, 3);
  assert.deepEqual(stats(['2026-10-16'], '2026-10-18'), { current: 0, longest: 1, thisMonth: 1 });
});
test('gaps and removed past marks recalculate the longest streak', () => {
  assert.deepEqual(stats(['2026-10-12', '2026-10-13', '2026-10-15', '2026-10-16', '2026-10-17'], '2026-10-18'),
    { current: 3, longest: 3, thisMonth: 5 });
  assert.equal(stats(['2026-10-12', '2026-10-13', '2026-10-15', '2026-10-17'], '2026-10-18').longest, 2);
});
test('empty, duplicate, unordered and future entries do not inflate progress', () => {
  assert.deepEqual(stats([], '2026-10-18'), { current: 0, longest: 0, thisMonth: 0 });
  assert.deepEqual(stats(['2026-10-18', '2026-10-17', '2026-10-18', '2026-10-19'], '2026-10-18'),
    { current: 2, longest: 2, thisMonth: 2 });
});
test('streaks cross year, month and leap-day boundaries', () => {
  assert.deepEqual(stats(['2025-12-31', '2026-01-01'], '2026-01-02'), { current: 2, longest: 2, thisMonth: 1 });
  assert.equal(stats(['2024-02-28', '2024-02-29', '2024-03-01'], '2024-03-01').current, 3);
  assert.equal(U.shiftDay('2026-03-01', -1), '2026-02-28');
});
test('Monday-first month cells contain leap days and correct padding', () => {
  const leap = U.monthCells('2024-02');
  assert.equal(leap.length, 35);
  assert.equal(leap[0], null);
  assert.equal(leap[3], '2024-02-01');
  assert.equal(leap[31], '2024-02-29');
  assert.equal(U.monthCells('2026-02').length, 35);
  assert.equal(U.monthCells('2026-03').length, 42);
});
test('month navigation crosses years without date overflow', () => {
  assert.equal(U.shiftMonth('2026-01', -1), '2025-12');
  assert.equal(U.shiftMonth('2026-12', 1), '2027-01');
});
test('Istanbul midnight is consistent regardless of device timezone', () => {
  assert.equal(U.todayKey(new Date('2026-10-18T20:59:59Z')), '2026-10-18');
  assert.equal(U.todayKey(new Date('2026-10-18T21:00:00Z')), '2026-10-19');
});
