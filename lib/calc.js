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

  // Bir setin hacmi (kg × tekrar). Kardiyo setleri ({duration}) ve eksik alanlar 0 sayılır;
  // böylece toplam hacim asla NaN olmaz (Faz 1 / B3).
  const setVolume = s => {
    if (!s) return 0;
    const w = Number(s.weight), r = Number(s.reps);
    // Faz 4 / B16: destekli harekette ağırlık negatif girilir (−20 kg destek); hacme eklenmez.
    return (isFinite(w) && w > 0 ? w : 0) * (isFinite(r) && r > 0 ? r : 0);
  };

  // Saniyeyi kısa etikete çevirir: 30 → "30s", 60 → "1m", 90 → "1m30s" (Faz 1 / B5).
  const fmtRestShort = secs => {
    const t = Math.max(0, Math.round(Number(secs) || 0));
    if (t < 60) return t + "s";
    const m = Math.floor(t / 60), sc = t % 60;
    return sc ? `${m}m${sc}s` : `${m}m`;
  };

  // Bitiş zaman damgasından kalan saniye (yukarı yuvarlanmış, en az 0) (Faz 1 / B5).
  const restRemaining = (endsAt, now) => {
    if (!endsAt) return 0;
    return Math.max(0, Math.ceil((endsAt - now) / 1000));
  };

  // === Set durumu (Faz 2 / C1) ===
  // Set değer taşıyor mu? (ağırlık, tekrar veya süre)
  const setHasValue = s => !!s && ((Number(s.weight) || 0) > 0 || (Number(s.reps) || 0) > 0 || (Number(s.duration) || 0) > 0);

  // Set tamamlanmış mı? Yeni setler done:true/false taşır. Eski kayıtlarda alan yoktur:
  // değer taşıyorsa tamamlanmış sayılır (geriye dönük uyum).
  const isSetDone = s => !!s && (s.done === true || (s.done === undefined && setHasValue(s)));

  const doneSets = w => (w && Array.isArray(w.sets) ? w.sets.filter(isSetDone) : []);
  const hasDoneSet = w => doneSets(w).length > 0;

  // İstatistik için antrenman görünümü: yalnız tamamlanmış setler; includeWarmups=false ise
  // ısınma setleri de çıkarılır (Faz 2 / E2). Seti kalmayan hareket ve günler düşer. Girdi değişmez.
  const filterWorkouts = (workouts, opts) => {
    const includeWarmups = !opts || opts.includeWarmups !== false;
    const out = {};
    Object.keys(workouts || {}).forEach(dk => {
      const day = [];
      (workouts[dk] || []).forEach(w => {
        const sets = doneSets(w).filter(st => includeWarmups || (st.type || "working") !== "warmup");
        if (sets.length) day.push({ ...w, sets });
      });
      if (day.length) out[dk] = day;
    });
    return out;
  };

  // Başkasının/geçmişin setini PLAN setine çevirir (Faz 2 / B13 tutarlılığı): değerler hedef olur,
  // set tamamlanmamış başlar. Kardiyo (süre) setleri de desteklenir.
  const toPlanSet = s => {
    const src = s || {};
    if (src.duration !== undefined && src.weight === undefined) return {
      duration: 0,
      done: false,
      target: { duration: Number(src.duration) || 0 }
    };
    return {
      weight: 0,
      reps: 0,
      rir: "-",
      type: src.type || "working",
      done: false,
      target: { weight: Number(src.weight) || 0, reps: Number(src.reps) || 0 }
    };
  };

  // === Plaka ve ısınma (Faz 3 / C5) ===
  // Toplam ağırlık için her tarafa takılacak plakalar (açgözlü; standart kg plakaları).
  const platesPerSide = (total, bar, plates) => {
    const b = typeof bar === "number" ? bar : 20;
    const list = plates || [25, 20, 15, 10, 5, 2.5, 1.25];
    let side = (Number(total) - b) / 2;
    const out = [];
    if (side > 0) {
      list.forEach(p => {
        while (side >= p - 1e-9) {
          out.push(p);
          side -= p;
        }
      });
    }
    return {
      bar: b,
      perSide: out,
      remainder: side > 0 ? Math.round(side * 2 * 100) / 100 : 0
    };
  };
  // Çalışma ağırlığından ısınma basamakları: boş bar ×10, %50 ×5, %70 ×3, %85 ×1 (2,5 kg'a yuvarlı).
  const warmupPlan = (workWeight, bar, step) => {
    const b = typeof bar === "number" ? bar : 20;
    const st = Number(step) > 0 ? Number(step) : 2.5; // Faz 5 / C6: lb modunda 5 lb'ye yuvarlanır
    const w = Number(workWeight) || 0;
    if (w <= b) return [];
    const r = x => Math.max(b, Math.round(x / st) * st);
    const out = [];
    [[b, 10], [r(w * 0.5), 5], [r(w * 0.7), 3], [r(w * 0.85), 1]].forEach(([kg, reps]) => {
      if (kg < w && !out.some(o => o.weight === kg)) out.push({ weight: kg, reps });
    });
    return out;
  };

  // === Çift progresyon (Faz 3 / C4) ===
  // target = { sets, repMin, repMax, inc }. Geçen seansta hedef sayıda normal set, en yüksek ağırlıkta
  // ve hepsi repMax'a ulaştıysa ağırlık artışı önerir. Değilse null.
  const progressionHint = (prevSets, target) => {
    if (!target || !(Number(target.repMax) > 0)) return null;
    const working = (prevSets || []).filter(st => (st.type || "working") === "working" && isSetDone(st));
    const need = Number(target.sets) > 0 ? Number(target.sets) : working.length;
    if (!need || working.length < need) return null;
    const top = Math.max(...working.map(st => Number(st.weight) || 0));
    if (!(top > 0)) return null;
    const atTop = working.filter(st => (Number(st.weight) || 0) >= top);
    if (atTop.length < need) return null;
    if (!atTop.slice(0, need).every(st => (Number(st.reps) || 0) >= Number(target.repMax))) return null;
    const inc = Number(target.inc) > 0 ? Number(target.inc) : 2.5;
    return {
      type: "increase",
      from: top,
      weight: Math.round((top + inc) * 100) / 100,
      reps: Number(target.repMin) > 0 ? Number(target.repMin) : Number(target.repMax)
    };
  };

  // "Son seans" eşleştirmesi (Faz 2 / B8): bugünkü si. set, geçen seanstaki AYNI TÜRDEN aynı sıradaki
  // setle eşleşir. Böylece ısınma setleri normal setlerin ipuçlarını kaydırmaz.
  const matchPrevSet = (prevSets, curSets, si) => {
    if (!Array.isArray(prevSets) || !Array.isArray(curSets) || !curSets[si]) return null;
    const t = curSets[si].type || "working";
    let k = 0;
    for (let i = 0; i < si; i++) if ((curSets[i].type || "working") === t) k++;
    const same = prevSets.filter(p => (p.type || "working") === t);
    return same[k] || null;
  };

  // === Antrenman istatistikleri ===

  // === Seri (Faz 3 / B6) ===
  // Programın dinlenme günleri (gdow: 0=Pzt..6=Paz): offDays + hareket atanmamış günler.
  const programRestDows = program => {
    if (!program || !program.days) return [];
    const off = (program.offDays || []).map(Number);
    const out = [];
    for (let i = 0; i < 7; i++) {
      const ex = program.days[String(i)] || program.days[i] || [];
      if (off.includes(i) || !ex.length) out.push(i);
    }
    return out;
  };

  // Dinlenmeye duyarlı seri. Sayılan şey ANTRENMAN günleridir.
  //  - Bugün henüz antrenman yoksa seri bozulmaz.
  //  - restDows (aktif programın dinlenme günleri) seriyi bozmaz.
  //  - Program yoksa (restDows boş) en fazla maxGap (varsayılan 2) ardışık boş gün tolere edilir.
  // Döner: { current, best }
  const calcStreakInfo = (workouts, opts) => {
    const o = opts || {};
    const w = workouts || {};
    const restDows = new Set((o.restDows || []).map(Number));
    const maxGap = typeof o.maxGap === "number" ? o.maxGap : restDows.size ? 0 : 2;
    const today = o.today ? pD(o.today) : new Date();
    today.setHours(0, 0, 0, 0);
    const has = k => !!(w[k] && w[k].some(hasDoneSet));
    let current = 0,
      gap = 0;
    for (let i = 0; i < 3660; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = fmt(d);
      if (has(k)) {
        current++;
        gap = 0;
        continue;
      }
      if (i === 0 || restDows.has(gdow(d))) continue;
      gap++;
      if (gap > maxGap) break;
    }
    const keys = Object.keys(w).filter(has).sort();
    let best = 0;
    if (keys.length) {
      let run = 0;
      gap = 0;
      const d = pD(keys[0]);
      const endKey = fmt(today);
      for (let guard = 0; guard < 40000; guard++) {
        const k = fmt(d);
        if (k > endKey) break;
        if (has(k)) {
          run++;
          gap = 0;
          if (run > best) best = run;
        } else if (k !== endKey && !restDows.has(gdow(d))) {
          gap++;
          if (gap > maxGap) run = 0;
        }
        d.setDate(d.getDate() + 1);
      }
    }
    return {
      current,
      best: Math.max(best, current)
    };
  };
  // Geriye uyum: mevcut seri. opts verilmezse programsız kurallar (2 güne kadar ara) geçerlidir.
  const calcStreak = (workouts, opts) => calcStreakInfo(workouts, opts).current;

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
      // Faz 3 / B7: aynı gün aynı kas grubu bir kez sayılır (hareket sayısı değil, antrenman günü).
      const dayCats = new Set();
      ws.forEach(w => {
        if (hasDoneSet(w)) {
          const ex = exercises.find(e => e.id === w.exerciseId);
          if (ex) (ex.categories || []).forEach(c => dayCats.add(c));
        }
      });
      dayCats.forEach(c => {
        freq[c] = (freq[c] || 0) + 1;
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
      // Faz 3 / B7: aynı gün aynı kas grubu bir kez sayılır (hareket sayısı değil, antrenman günü).
      const dayCats = new Set();
      ws.forEach(w => {
        if (hasDoneSet(w)) {
          const ex = exercises.find(e => e.id === w.exerciseId);
          if (ex) (ex.categories || []).forEach(c => dayCats.add(c));
        }
      });
      dayCats.forEach(c => {
        freq[c] = (freq[c] || 0) + 1;
      });
    }
    return freq;
  };

  // Tüm hareketler için Personal Record'lar (maxWeight, maxVolume, est1RM, maxReps).
  // Faz 4 / B16: ex.loadType "bodyweight" | "assisted" ise ağırlık 0 veya negatif olabilir;
  // bu hareketlerde rekor en çok tekrardır (maxReps) ve ek ağırlık/destek bilgisiyle birlikte döner.
  const getAllPRs = (workouts, exercises) => {
    const prs = {};
    exercises.forEach(ex => {
      const lt = ex.loadType || "weighted";
      const bw = lt === "bodyweight" || lt === "assisted";
      let maxW = -Infinity,
        maxVol = 0,
        max1RM = 0,
        maxReps = 0,
        rmReps = 0,
        any = false,
        prDate = null;
      // Faz 5 / E4: tarih sırasıyla gezilir; prDate = ana ölçütün (1RM / tekrar) en son yükseldiği gün,
      // est1RMReps = tahmini 1RM'yi veren setin tekrarı (12+ ise tahmin "≈" ile gösterilir).
      Object.keys(workouts).sort().forEach(dk => {
        const f = (workouts[dk] || []).find(w => w.exerciseId === ex.id);
        if (f) doneSets(f).forEach(s => {
          const w = Number(s.weight) || 0, r = Number(s.reps) || 0;
          if (r <= 0 && w <= 0) return;
          any = true;
          if (w > maxW) {
            maxW = w;
            if (!bw && w > 0 && !(max1RM > 0)) prDate = dk;
          }
          if (r > maxReps) {
            maxReps = r;
            if (bw) prDate = dk;
          }
          const vol = setVolume(s);
          if (vol > maxVol) maxVol = vol;
          const rm = w > 0 ? calc1RM(w, r) : 0;
          if (rm > max1RM) {
            max1RM = rm;
            rmReps = r;
            if (!bw) prDate = dk;
          }
        });
      });
      if (!any) return;
      if (bw) {
        if (maxReps > 0) prs[ex.id] = {
          loadType: lt,
          maxWeight: maxW === -Infinity ? 0 : maxW,
          maxVolume: maxVol,
          est1RM: Math.round(max1RM),
          est1RMReps: rmReps,
          maxReps,
          prDate
        };
      } else if (maxW > 0) prs[ex.id] = {
        loadType: lt,
        maxWeight: maxW,
        maxVolume: maxVol,
        est1RM: Math.round(max1RM),
        est1RMReps: rmReps,
        maxReps,
        prDate
      };
    });
    return prs;
  };

  // Faz 4 / E3 + E4: [from, to] aralığında kırılan rekorlar. Önceki geçmişi olmayan hareket rekor sayılmaz.
  // Ağırlıklı harekette ölçüt tahmini 1RM, vücut ağırlığı/destekli harekette en çok tekrar.
  // Döner: [{ exerciseId, date, kind: "1rm"|"reps", value, prev }]
  const prEvents = (workouts, exercises, opts) => {
    const o = opts || {};
    const events = [];
    const keys = Object.keys(workouts || {}).sort();
    (exercises || []).forEach(ex => {
      const lt = ex.loadType || "weighted";
      const bw = lt === "bodyweight" || lt === "assisted";
      if ((ex.categories || []).includes("Kardiyo")) return;
      let best = 0, seen = false;
      keys.forEach(dk => {
        const f = (workouts[dk] || []).find(w => w.exerciseId === ex.id);
        if (!f) return;
        let v = 0;
        doneSets(f).forEach(s => {
          if (s.type === "warmup") return;
          const w = Number(s.weight) || 0, r = Number(s.reps) || 0;
          const x = bw ? r : w > 0 ? calc1RM(w, r) : 0;
          if (x > v) v = x;
        });
        if (v <= 0) return;
        const inRange = (!o.from || dk >= o.from) && (!o.to || dk <= o.to);
        if (inRange && seen && v > best) events.push({ exerciseId: ex.id, date: dk, kind: bw ? "reps" : "1rm", value: v, prev: best });
        if (v > best) best = v;
        seen = true;
      });
    });
    return events;
  };

  // Faz 4 / E1: oturum başına özet. history = [{date, sets}] (tamamlanmış setler).
  // Döner (tarihe göre artan): [{date, maxW, best1RM, vol, maxReps, sets, bestSet}]
  const sessionStats = (history) => {
    return (history || []).map(h => {
      const ss = (h.sets || []).filter(s => s.type !== "warmup");
      const use = ss.length ? ss : h.sets || [];
      let maxW = -Infinity, best1RM = 0, vol = 0, maxReps = 0, bestSet = null;
      use.forEach(s => {
        const w = Number(s.weight) || 0, r = Number(s.reps) || 0;
        if (w > maxW) maxW = w;
        if (r > maxReps) maxReps = r;
        vol += setVolume(s);
        const rm = w > 0 ? calc1RM(w, r) : 0;
        if (rm > best1RM) best1RM = rm;
        if (!bestSet || w > bestSet.weight || w === bestSet.weight && r > bestSet.reps) bestSet = { weight: w, reps: r };
      });
      return {
        date: h.date,
        maxW: maxW === -Infinity ? 0 : maxW,
        best1RM: Math.round(best1RM * 10) / 10,
        vol,
        maxReps,
        sets: use.length,
        bestSet
      };
    }).sort((a, b) => a.date.localeCompare(b.date));
  };

  // Faz 4 / E1: tekrar bazında rekor tablosu — en az r tekrarla kaldırılan en yüksek ağırlık ve tarihi.
  // Döner: [{ reps, weight, date, actualReps }] (kayıt yoksa weight null).
  const repMaxTable = (history, reps) => {
    const rs = reps || [1, 3, 5, 8, 10, 12];
    return rs.map(r => {
      let best = null;
      (history || []).forEach(h => (h.sets || []).forEach(s => {
        if (s.type === "warmup") return;
        const w = Number(s.weight) || 0, n = Number(s.reps) || 0;
        if (w <= 0 || n < r) return;
        if (!best || w > best.weight || w === best.weight && h.date < best.date) best = { weight: w, date: h.date, actualReps: n };
      }));
      return { reps: r, weight: best ? best.weight : null, date: best ? best.date : null, actualReps: best ? best.actualReps : null };
    });
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
      if (pgExs.some(eid => ws.some(w => w.exerciseId === eid && hasDoneSet(w)))) done++;
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

  // Faz 5 / E5: vücut ağırlığı serisi + 7 günlük hareketli ortalama (o gün dahil son 7 takvim günündeki ölçümler).
  // measurements = { "YYYY-MM-DD": [{ weight, id, ... }] } → [{ date, bw, avg }] (tarihe göre artan)
  const weightTrend = (measurements, days) => {
    const win = days || 7;
    const pts = [];
    Object.keys(measurements || {}).sort().forEach(dk => {
      const arr = (measurements[dk] || []).filter(m => Number(m.weight) > 0);
      if (!arr.length) return;
      const last = arr.slice().sort((a, b) => String(a.id || "").localeCompare(String(b.id || ""))).pop();
      pts.push({ date: dk, bw: Number(last.weight) });
    });
    return pts.map((p, i) => {
      const end = pD(p.date);
      const start = new Date(end);
      start.setDate(end.getDate() - (win - 1));
      const sk = fmt(start);
      const w = pts.slice(0, i + 1).filter(x => x.date >= sk);
      const avg = Math.round(w.reduce((a, x) => a + x.bw, 0) / w.length * 10) / 10;
      return { date: p.date, bw: p.bw, avg };
    });
  };

  // Global namespace
  window.LOGWISE_CALC = {
    fmt,
    pD,
    gdow,
    eDays,
    setVolume,
    setHasValue,
    isSetDone,
    doneSets,
    hasDoneSet,
    filterWorkouts,
    matchPrevSet,
    toPlanSet,
    fmtRestShort,
    restRemaining,
    calc1RM,
    calcBrzycki,
    calcStreak,
    calcStreakInfo,
    programRestDows,
    platesPerSide,
    warmupPlan,
    progressionHint,
    calcWeekFreq,
    calcMonthFreq,
    getAllPRs,
    prEvents,
    sessionStats,
    repMaxTable,
    weightTrend,
    calcCompliance
  };
})();
