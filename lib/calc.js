// LogWise — Hesaplama ve Tarih Yardımcıları
// Tüm fonksiyonlar saf: girdi → çıktı. Dış state'e (React/DOM/Supabase) dokunmaz.
// Kullanım: const { fmt, calc1RM, ... } = window.LOGWISE_CALC;
(function () {
  // === Tarih yardımcıları ===

  // Date → "YYYY-MM-DD" (yerel saat dilimi)
  const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // "YYYY-MM-DD" → Date (yerel saat, saat 00:00:00)
  const pD = s => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  // Pazartesi=0 ... Pazar=6 (JS'in default Pazar=0'ını LogWise'a çevirir)
  const gdow = d => {
    const v = d.getDay();
    return v === 0 ? 6 : v - 1;
  };

  // Boş haftalık program günleri objesi {"0": [], ..., "6": []}
  const eDays = () => ({
    "0": [],
    "1": [],
    "2": [],
    "3": [],
    "4": [],
    "5": [],
    "6": []
  });

  // === 1RM (tek tekrar maksimum) formülleri ===

  // Epley formülü: 1RM = w * (1 + r/30)
  const calc1RM = (w, r) => {
    if (!w || !r || r <= 0) return 0;
    if (r === 1) return w;
    return Math.round(w * (1 + r / 30) * 10) / 10;
  };

  // Brzycki formülü: 1RM = w * 36 / (37 - r)  (r>=37 için 2w sınırı)
  const calcBrzycki = (w, r) => {
    if (!w || !r || r <= 0) return 0;
    if (r === 1) return w;
    if (r >= 37) return w * 2;
    return Math.round(w * (36 / (37 - r)) * 10) / 10;
  };

  // === Antrenman istatistikleri ===

  // Ardışık antrenman günleri — bugünden geriye sayar, ilk boşlukta durur.
  const calcStreak = workouts => {
    let streak = 0;
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const d = new Date(t);
      d.setDate(d.getDate() - i);
      const k = fmt(d);
      if (workouts[k] && workouts[k].some(w => w.sets && w.sets.length > 0)) {
        streak++;
      } else if (i > 0) break;
    }
    return streak;
  };

  // Son 7 gün kategori bazlı antrenman sıklığı. cats dışarıdan verilir.
  const calcWeekFreq = (workouts, exercises, cats) => {
    const now = new Date();
    const freq = {};
    cats.forEach(c => freq[c] = 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const k = fmt(d);
      const ws = workouts[k] || [];
      ws.forEach(w => {
        if (w.sets && w.sets.length > 0) {
          const ex = exercises.find(e => e.id === w.exerciseId);
          if (ex) {
            (ex.categories || []).forEach(c => {
              freq[c] = (freq[c] || 0) + 1;
            });
          }
        }
      });
    }
    return freq;
  };

  // Son 30 gün kategori bazlı antrenman sıklığı. cats dışarıdan verilir.
  const calcMonthFreq = (workouts, exercises, cats) => {
    const now = new Date();
    const freq = {};
    cats.forEach(c => freq[c] = 0);
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const k = fmt(d);
      const ws = workouts[k] || [];
      ws.forEach(w => {
        if (w.sets && w.sets.length > 0) {
          const ex = exercises.find(e => e.id === w.exerciseId);
          if (ex) {
            (ex.categories || []).forEach(c => {
              freq[c] = (freq[c] || 0) + 1;
            });
          }
        }
      });
    }
    return freq;
  };

  // Tüm hareketler için Personal Record'lar (maxWeight, maxVolume, est1RM).
  const getAllPRs = (workouts, exercises) => {
    const prs = {};
    exercises.forEach(ex => {
      let maxW = 0,
        maxVol = 0,
        max1RM = 0;
      Object.values(workouts).forEach(dayW => {
        const f = dayW.find(w => w.exerciseId === ex.id);
        if (f) f.sets.forEach(s => {
          if (s.weight > maxW) maxW = s.weight;
          const vol = s.weight * s.reps;
          if (vol > maxVol) maxVol = vol;
          const rm = calc1RM(s.weight, s.reps);
          if (rm > max1RM) max1RM = rm;
        });
      });
      if (maxW > 0) prs[ex.id] = {
        maxWeight: maxW,
        maxVolume: maxVol,
        est1RM: Math.round(max1RM)
      };
    });
    return prs;
  };

  // Program uyum (compliance) — aktif programa karşı tamamlanan gün oranı.
  // Döner: {week, rate, done, total, isDeload} veya null.
  const calcCompliance = (pgId, workouts, programs, programMeta) => {
    const meta = (programMeta || {})[pgId];
    if (!meta || !meta.activatedAt) return null;
    const pg = programs[pgId];
    if (!pg) return null;
    const start = pD(meta.activatedAt);
    const tod = new Date();
    tod.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((tod - start) / (1000 * 60 * 60 * 24));
    if (daysDiff < 0) return {
      week: 1,
      rate: 0,
      done: 0,
      total: 0,
      isDeload: false
    };
    const week = Math.floor(daysDiff / 7) + 1;
    let total = 0,
      done = 0;
    for (let i = 0; i <= daysDiff; i++) {
      const dd = new Date(start);
      dd.setDate(dd.getDate() + i);
      const di = gdow(dd);
      const pgExs = pg.days[String(di)] || [];
      const pgOff = pg.offDays || [];
      if (pgOff.includes(String(di)) || pgExs.length === 0) continue;
      total++;
      const dk = fmt(dd);
      const ws = workouts[dk] || [];
      if (pgExs.some(eid => ws.some(w => w.exerciseId === eid && w.sets && w.sets.length > 0))) done++;
    }
    const deloadEvery = meta.deloadEvery || 0;
    const isDeload = deloadEvery > 0 && week % deloadEvery === 0;
    return {
      week,
      rate: total > 0 ? Math.round(done / total * 100) : 0,
      done,
      total,
      isDeload
    };
  };

  // Global namespace
  window.LOGWISE_CALC = {
    fmt,
    pD,
    gdow,
    eDays,
    calc1RM,
    calcBrzycki,
    calcStreak,
    calcWeekFreq,
    calcMonthFreq,
    getAllPRs,
    calcCompliance
  };
})();
