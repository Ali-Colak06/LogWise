// LogWise — Rozet Mantığı
// Rozet adı/kategori etiketleri, istatistik hesaplama, rozet açma/iptal mantığı.
// Bağımlılıklar (başka script tag'lerinde ÖNCEDEN tanımlı olmalı):
//   - window.LOGWISE_BADGES (data/badges.js)  — rozet tanımları
//   - window.LOGWISE_CALC   (lib/calc.js)     — calcStreak, fmt için (E-2'den beri)
// NOT: checkBadges/calcBadgeStats/getNextBadge yalnızca index.html tarafından çağrılır.
//       profile.html sadece getBadgeName ve getBadgeCatLabel kullanır.

window.LOGWISE_BADGE_LOGIC = (function () {
  // calcStreak ve fmt — IIFE çalışırken LOGWISE_CALC'ten al. Script sırası buna garanti veriyor.
  const { calcStreak, fmt } = window.LOGWISE_CALC;

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
  const calcBadgeStats = data => {
    const wKeys = Object.keys(data.workouts).filter(k => data.workouts[k].some(w => w.sets && w.sets.length > 0));
    let totalVol = 0,
      totalSets = 0,
      maxWeight = 0;
    const usedEx = new Set();
    Object.values(data.workouts).forEach(ws => {
      ws.forEach(w => {
        if (w.sets && w.sets.length > 0) {
          usedEx.add(w.exerciseId);
          w.sets.forEach(s => {
            totalVol += (s.weight || 0) * (s.reps || 0);
            totalSets++;
            if (s.weight > maxWeight) maxWeight = s.weight;
          });
        }
      });
    });
    return {
      totalWorkouts: wKeys.length,
      streak: calcStreak(data.workouts),
      maxWeight,
      totalVol,
      totalSets,
      variety: usedEx.size
    };
  };

  // Yeni açılacak rozetleri ve geri alınacakları belirler.
  // Döner: {fresh: [{id, unlockedAt}...], revokeIds: Set<id>}
  const checkBadges = data => {
    const BADGES = window.LOGWISE_BADGES;
    const existing = data.badges || [];
    const unlockedIds = new Set(existing.map(b => b.id));
    const st = calcBadgeStats(data);
    const fresh = [];
    const revokeIds = new Set();
    BADGES.forEach(b => {
      let ok = false;
      if (b.cat === "workout") ok = st.totalWorkouts >= b.val;else if (b.cat === "streak") ok = st.streak >= b.val;else if (b.cat === "pr") ok = st.maxWeight >= b.val;else if (b.cat === "volume") ok = st.totalVol >= b.val;else if (b.cat === "sets") ok = st.totalSets >= b.val;else if (b.cat === "variety") ok = st.variety >= b.val;
      if (ok && !unlockedIds.has(b.id)) fresh.push({
        id: b.id,
        unlockedAt: fmt(new Date())
      });else if (!ok && unlockedIds.has(b.id)) revokeIds.add(b.id);
    });
    return {
      fresh,
      revokeIds
    };
  };

  // Kullanıcının ilerleyebileceği bir sonraki rozeti döndürür.
  // Döner: {...badge, current, pct} veya null (tüm rozetler açıksa).
  const getNextBadge = data => {
    const BADGES = window.LOGWISE_BADGES;
    const unlocked = new Set((data.badges || []).map(b => b.id));
    const st = calcBadgeStats(data);
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
    checkBadges,
    getNextBadge
  };
})();
