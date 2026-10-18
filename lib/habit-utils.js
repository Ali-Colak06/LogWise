// LogWise — Pure habit calendar calculations. Date-only keys; one shared day boundary.
(function () {
  const TIME_ZONE = 'Europe/Istanbul';
  function todayKey(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(now);
    const part = type => parts.find(p => p.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
  function dateKey(date) { return date.toISOString().slice(0, 10); }
  function shiftDay(key, offset) {
    const date = new Date(key + 'T12:00:00Z');
    date.setUTCDate(date.getUTCDate() + offset);
    return dateKey(date);
  }
  function shiftMonth(month, offset) {
    const date = new Date(month + '-01T12:00:00Z');
    date.setUTCMonth(date.getUTCMonth() + offset);
    return dateKey(date).slice(0, 7);
  }
  function monthCells(month) {
    const first = new Date(month + '-01T12:00:00Z');
    const padding = (first.getUTCDay() + 6) % 7;
    const next = shiftMonth(month, 1) + '-01';
    const cells = Array(padding).fill(null);
    for (let key = month + '-01'; key < next; key = shiftDay(key, 1)) cells.push(key);
    while (cells.length % 7) cells.push(null);
    return cells;
  }
  function statistics(completedDays, today) {
    const days = [...new Set(completedDays)].filter(day => day <= today).sort();
    const done = new Set(days);
    let current = 0, longest = 0, run = 0, previous;
    let cursor = done.has(today) ? today : shiftDay(today, -1);
    while (done.has(cursor)) { current++; cursor = shiftDay(cursor, -1); }
    for (const day of days) {
      run = previous && shiftDay(previous, 1) === day ? run + 1 : 1;
      longest = Math.max(longest, run);
      previous = day;
    }
    return { current, longest, thisMonth: days.filter(day => day.slice(0, 7) === today.slice(0, 7)).length };
  }
  window.LOGWISE_HABIT_UTILS = { TIME_ZONE, todayKey, shiftDay, shiftMonth, monthCells, statistics };
})();
