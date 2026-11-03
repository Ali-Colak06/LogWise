// LogWise — Rozet Mantığı
// Rozet adı/kategori etiketleri, istatistik hesaplama, rozet açma/iptal mantığı.
// Bağımlılıklar (başka script tag'lerinde ÖNCEDEN tanımlı olmalı):
//   - window.LOGWISE_BADGES (data/badges.js)  — rozet tanımları
//   - window.LOGWISE_CALC   (lib/calc.js)     — calcStreak, fmt için (E-2'den beri)
// NOT: checkBadges/calcBadgeStats/getNextBadge yalnızca index.html tarafından çağrılır.
//       profile.html sadece getBadgeName ve getBadgeCatLabel kullanır.

window.LOGWISE_BADGE_LOGIC = (function () {
  // calcStreak ve fmt — IIFE çalışırken LOGWISE_CALC'ten al. Script sırası buna garanti veriyor.
  const { calcStreakInfo, fmt, pD, gdow, hasDoneSet, doneSets, setVolume } = window.LOGWISE_CALC;

  const getBadgeName = (b, lang) => {
    if (b.cat === "workout" && b.val === 1) return lang === "tr" ? "İlk Antrenman" : "First Workout";
    if (b.cat === "workout") return lang === "tr" ? b.val + " Antrenman" : b.val + " Workouts";
    if (b.cat === "streak") return lang === "tr" ? b.val + " Gün Seri" : b.val + " Day Streak";
    if (b.cat === "pr") return b.val + "kg PR";
    if (b.cat === "volume") {
      const v = b.val >= 1e6 ? b.val / 1e6 + "M" : b.val >= 1e3 ? b.val / 1e3 + "K" : b.val;
      return lang === "tr" ? v + " Hacim" : v + " Volume";
    }
    if (b.cat === "sets") return b.val + " Set" + (lang === "en" ? "s" : "");
    if (b.cat === "variety") return lang === "tr" ? b.val + " Farklı Hareket" : b.val + " Exercises";
    return b.id;
  };

  const getBadgeCatLabel = (cat, lang) => {
    const m = {
      workout: ["Antrenman", "Workouts"],
      streak: ["Seri", "Streak"],
      pr: ["Ağırlık PR", "Weight PR"],
      volume: ["Hacim", "Volume"],
      sets: ["Setler", "Sets"],
      variety: ["Çeşitlilik", "Variety"]
    };
    return (m[cat] || [cat, cat])[lang === "tr" ? 0 : 1];
  };

  // Kullanıcının verilerinden rozet istatistiklerini hesaplar.
  // Döner: {totalWorkouts, streak, maxWeight, totalVol, totalSets, variety}
  // opts: { restDows, maxGap } — seri kuralları (Faz 3 / B6). streak = EN İYİ seri (rozetler için),
  // currentStreak = şu anki seri.
  const calcBadgeStats = (data, opts) => {
    const wKeys = Object.keys(data.workouts).filter(k => data.workouts[k].some(hasDoneSet));
    let totalVol = 0,
      totalSets = 0,
      maxWeight = 0;
    const usedEx = new Set();
    Object.values(data.workouts).forEach(ws => {
      ws.forEach(w => {
        const ds = doneSets(w);
        if (ds.length > 0) {
          usedEx.add(w.exerciseId);
          ds.forEach(s => {
            totalVol += setVolume(s);
            totalSets++;
            if (s.weight > maxWeight) maxWeight = s.weight;
          });
        }
      });
    });
    const si = calcStreakInfo(data.workouts, opts);
    return {
      totalWorkouts: wKeys.length,
      streak: si.best,
      currentStreak: si.current,
      maxWeight,
      totalVol,
      totalSets,
      variety: usedEx.size
    };
  };

  // Yeni açılacak rozetleri ve geri alınacakları belirler.
  // Döner: {fresh: [{id, unlockedAt}...], revokeIds: Set<id>}
  // Faz 3 / B19: Her rozetin eşiğinin ilk aşıldığı GERÇEK tarih (kronolojik tarama).
  const achievedDates = (data, opts) => {
    const BADGES = window.LOGWISE_BADGES;
    const w = data.workouts || {};
    const o = opts || {};
    const restDows = new Set((o.restDows || []).map(Number));
    const maxGap = typeof o.maxGap === "number" ? o.maxGap : restDows.size ? 0 : 2;
    const keys = Object.keys(w).filter(k => w[k].some(hasDoneSet)).sort();
    const out = {};
    if (!keys.length) return out;
    let totalWorkouts = 0,
      totalSets = 0,
      totalVol = 0,
      maxWeight = 0,
      run = 0,
      best = 0,
      gap = 0;
    const used = new Set();
    const mark = (k, st) => {
      BADGES.forEach(b => {
        if (out[b.id]) return;
        const cur = b.cat === "workout" ? st.totalWorkouts : b.cat === "streak" ? st.best : b.cat === "pr" ? st.maxWeight : b.cat === "volume" ? st.totalVol : b.cat === "sets" ? st.totalSets : b.cat === "variety" ? st.variety : -1;
        if (cur >= b.val) out[b.id] = k;
      });
    };
    const d = pD(keys[0]);
    const last = keys[keys.length - 1];
    for (let guard = 0; guard < 40000; guard++) {
      const k = fmt(d);
      if (k > last) break;
      if (w[k] && w[k].some(hasDoneSet)) {
        totalWorkouts++;
        run++;
        gap = 0;
        if (run > best) best = run;
        w[k].forEach(ent => {
          const ds = doneSets(ent);
          if (ds.length) used.add(ent.exerciseId);
          ds.forEach(x => {
            totalSets++;
            totalVol += setVolume(x);
            if ((Number(x.weight) || 0) > maxWeight) maxWeight = Number(x.weight) || 0;
          });
        });
        mark(k, { totalWorkouts, totalSets, totalVol, maxWeight, best, variety: used.size });
      } else if (!restDows.has(gdow(d))) {
        gap++;
        if (gap > maxGap) run = 0;
      }
      d.setDate(d.getDate() + 1);
    }
    return out;
  };

  // Faz 3 / B6: Seri rozetleri EN İYİ seriye göre açılır ve kazanıldıktan sonra GERİ ALINMAZ.
  // Diğer kategoriler veri silinirse geri alınabilir (ör. yanlışlıkla girilen 500 kg).
  const checkBadges = (data, opts) => {
    const BADGES = window.LOGWISE_BADGES;
    const existing = data.badges || [];
    const unlockedIds = new Set(existing.map(b => b.id));
    const st = calcBadgeStats(data, opts);
    let dates = null;
    const fresh = [];
    const revokeIds = new Set();
    BADGES.forEach(b => {
      let ok = false;
      if (b.cat === "workout") ok = st.totalWorkouts >= b.val;else if (b.cat === "streak") ok = st.streak >= b.val;else if (b.cat === "pr") ok = st.maxWeight >= b.val;else if (b.cat === "volume") ok = st.totalVol >= b.val;else if (b.cat === "sets") ok = st.totalSets >= b.val;else if (b.cat === "variety") ok = st.variety >= b.val;
      if (ok && !unlockedIds.has(b.id)) {
        if (!dates) dates = achievedDates(data, opts);
        fresh.push({
          id: b.id,
          unlockedAt: dates[b.id] || fmt(new Date())
        });
      } else if (!ok && unlockedIds.has(b.id) && b.cat !== "streak") revokeIds.add(b.id);
    });
    return {
      fresh,
      revokeIds
    };
  };

  // Kullanıcının ilerleyebileceği bir sonraki rozeti döndürür.
  // Döner: {...badge, current, pct} veya null (tüm rozetler açıksa).
  const getNextBadge = (data, opts) => {
    const BADGES = window.LOGWISE_BADGES;
    const unlocked = new Set((data.badges || []).map(b => b.id));
    const st = calcBadgeStats(data, opts);
    for (const b of BADGES) {
      if (unlocked.has(b.id)) continue;
      let cur = 0;
      if (b.cat === "workout") cur = st.totalWorkouts;else if (b.cat === "streak") cur = st.streak;else if (b.cat === "pr") cur = st.maxWeight;else if (b.cat === "volume") cur = st.totalVol;else if (b.cat === "sets") cur = st.totalSets;else if (b.cat === "variety") cur = st.variety;
      return {
        ...b,
        current: cur,
        pct: Math.min(Math.round(cur / b.val * 100), 99)
      };
    }
    return null;
  };

  return {
    getBadgeName,
    getBadgeCatLabel,
    calcBadgeStats,
    achievedDates,
    checkBadges,
    getNextBadge
  };
})();
