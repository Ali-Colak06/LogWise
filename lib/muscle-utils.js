// LogWise — Kas bölgesi yardımcıları (Faz 4 / D1, D3, E3, B16)
// Saf fonksiyonlar: girdi → çıktı. React/DOM/Supabase'e dokunmaz.
// Veri kaynağı window.LOGWISE_EX_META (data/ex-meta.js, generator çıktısı); testlerde meta parametreyle verilebilir.
// Kullanım: window.LOGWISE_MUSCLES.countMuscleSets(workouts, exercises, { from, to })
(function () {
  const C = () => window.LOGWISE_CALC;
  const getMeta = meta => meta || window.LOGWISE_EX_META || { regions: {}, muscles: {}, exercises: {}, categoryRegions: {}, equipment: [] };
  const DEFAULT_TARGET = { min: 10, max: 20 };

  // Kullanıcı hareketinin hazır hareket kimliği (presetId yoksa adından çözülür).
  const presetIdOf = (ex, meta) => {
    if (!ex) return null;
    const M = getMeta(meta);
    if (ex.presetId && M.exercises[ex.presetId]) return ex.presetId;
    if (ex.id && M.exercises[ex.id]) return ex.id;
    const U = window.LOGWISE_EX_UTILS;
    if (U && ex.name) {
      const k = U.resolveKey(ex.name);
      if (k && M.exercises[k]) return k;
    }
    return null;
  };

  // Bir hareketin çalıştırdığı bölgeler. Hazır harekette anatomik veri; özel harekette kategoriden tahmin.
  const exerciseRegions = (ex, meta) => {
    const M = getMeta(meta);
    const pid = presetIdOf(ex, M);
    if (pid) {
      const e = M.exercises[pid];
      return { primary: e.p.slice(), secondary: e.s.slice(), source: "preset", presetId: pid };
    }
    const cats = (ex && (ex.categories || (ex.category ? [ex.category] : []))) || [];
    const primary = [];
    cats.forEach(c => ((M.categoryRegions || {})[c] || []).forEach(r => { if (!primary.includes(r)) primary.push(r); }));
    return { primary, secondary: [], source: "category", presetId: null };
  };

  // B16: yük tipi — "weighted" | "bodyweight" | "assisted". Kullanıcı seçimi > hazır hareket verisi > ağırlıklı.
  const loadTypeOf = (ex, meta) => {
    if (ex && ex.loadType) return ex.loadType;
    const M = getMeta(meta);
    const pid = presetIdOf(ex, M);
    return pid && M.exercises[pid].lt ? M.exercises[pid].lt : "weighted";
  };

  const isCardio = ex => !!ex && (ex.categories || []).includes("Kardiyo");

  // Pazartesi başlangıçlı hafta: { start, end } ("YYYY-MM-DD").
  const weekBounds = (date) => {
    const { fmt, gdow } = C();
    const d = new Date(date || new Date());
    d.setHours(0, 0, 0, 0);
    const s = new Date(d);
    s.setDate(d.getDate() - gdow(d));
    const e = new Date(s);
    e.setDate(s.getDate() + 6);
    return { start: fmt(s), end: fmt(e) };
  };

  // D3: tarih aralığında bölge başına tamamlanan set sayısı.
  // Birincil bölge 1 set, ikincil bölge 0,5 set; ısınma setleri ve kardiyo sayılmaz.
  // Bir hareket aynı bölgeyi birden çok kasla çalıştırsa da set başına en fazla 1 sayılır.
  const countMuscleSets = (workouts, exercises, opts) => {
    const o = opts || {};
    const M = getMeta(o.meta);
    const { isSetDone } = C();
    const byId = {};
    (exercises || []).forEach(e => { byId[e.id] = e; });
    const out = {};
    const regCache = {};
    Object.keys(workouts || {}).forEach(dk => {
      if (o.from && dk < o.from) return;
      if (o.to && dk > o.to) return;
      (workouts[dk] || []).forEach(w => {
        const ex = byId[w.exerciseId];
        if (!ex || isCardio(ex)) return;
        const n = (w.sets || []).filter(s => s && s.type !== "warmup" && isSetDone(s)).length;
        if (!n) return;
        const r = regCache[ex.id] || (regCache[ex.id] = exerciseRegions(ex, M));
        r.primary.forEach(reg => { out[reg] = (out[reg] || 0) + n; });
        r.secondary.forEach(reg => { out[reg] = (out[reg] || 0) + n * 0.5; });
      });
    });
    return out;
  };

  // Kişisel hedef bandı (settings.muscleTargets[region] = {min, max}); yoksa 10–20.
  const targetFor = (region, settings) => {
    const t = settings && settings.muscleTargets ? settings.muscleTargets[region] : null;
    const min = t && Number(t.min) >= 0 ? Number(t.min) : DEFAULT_TARGET.min;
    const max = t && Number(t.max) > 0 ? Math.max(Number(t.max), min) : Math.max(DEFAULT_TARGET.max, min);
    return { min, max };
  };
  const targetStatus = (sets, t) => sets < t.min ? "under" : sets > t.max ? "over" : "in";

  // Haftalık kartta gösterilecek bölgeler: küçük (minor) bölgeler hariç, haritadaki sırayla.
  const trackedRegions = meta => {
    const M = getMeta(meta);
    return Object.keys(M.regions).filter(r => !M.regions[r].minor);
  };

  // Son `days` günde hiç çalışılmış bölgeler (hedef uyarısı yalnız bunlar için).
  const recentlyTrainedRegions = (workouts, exercises, today, days, meta) => {
    const { fmt, pD } = C();
    const t = typeof today === "string" ? pD(today) : new Date(today || new Date());
    const from = new Date(t);
    from.setDate(t.getDate() - (days || 28));
    const c = countMuscleSets(workouts, exercises, { from: fmt(from), to: fmt(t), meta });
    return Object.keys(c).filter(r => c[r] > 0);
  };

  // D2: bir bölgeyi birincil çalıştıran hazır hareketler (ekipman filtresiyle).
  const presetsForRegion = (region, opts) => {
    const o = opts || {};
    const M = getMeta(o.meta);
    const eq = o.equipment || [];
    return Object.keys(M.exercises).filter(id => {
      const e = M.exercises[id];
      if (region && !(e.p.includes(region) || (o.includeSecondary && e.s.includes(region)))) return false;
      if (eq.length && !eq.some(x => e.eq.includes(x))) return false;
      if (o.difficulty && e.d !== o.difficulty) return false;
      return true;
    });
  };

  // E3: haftalık özet. workouts tamamlanmış setlere süzülmüş olmalı (statWorkouts).
  const weekSummary = (workouts, exercises, opts) => {
    const o = opts || {};
    const { fmt, pD, gdow, hasDoneSet, prEvents } = C();
    const today = o.today ? (typeof o.today === "string" ? pD(o.today) : o.today) : new Date();
    const wb = weekBounds(today);
    const keys = Object.keys(workouts || {}).filter(k => k >= wb.start && k <= wb.end);
    const trainedDays = keys.filter(k => (workouts[k] || []).some(w => hasDoneSet(w))).length;
    let sets = 0;
    keys.forEach(k => (workouts[k] || []).forEach(w => { sets += (w.sets || []).filter(s => s.type !== "warmup").length; }));
    let plannedDays = null;
    const pg = o.program;
    if (pg && pg.days) {
      const off = (pg.offDays || []).map(String);
      plannedDays = 0;
      for (let i = 0; i < 7; i++) if ((pg.days[String(i)] || []).length && !off.includes(String(i))) plannedDays++;
    }
    const prs = prEvents ? prEvents(workouts, exercises, { from: wb.start, to: wb.end }).length : 0;
    const counts = countMuscleSets(workouts, exercises, { from: wb.start, to: wb.end, meta: o.meta });
    const active = recentlyTrainedRegions(workouts, exercises, today, 28, o.meta);
    // Haftanın geçen kısmı: hedefin altında kalan en geride bölge (yalnız son 4 haftada çalışılanlar).
    let under = null;
    active.filter(r => trackedRegions(o.meta).includes(r)).forEach(r => {
      const t = targetFor(r, o.settings);
      const v = counts[r] || 0;
      if (v >= t.min) return;
      const ratio = v / (t.min || 1);
      if (!under || ratio < under.ratio) under = { region: r, sets: v, min: t.min, ratio };
    });
    // Haftanın başında (Pzt–Prş) her bölge doğal olarak hedefin altındadır; uyarı Cuma'dan itibaren gösterilir.
    const showUnder = !!under && gdow(today) >= 4;
    return { start: wb.start, end: wb.end, trainedDays, plannedDays, sets, prs, counts, under, showUnder, todayDow: gdow(today), todayKey: fmt(today) };
  };

  // Faz 5 / D4: basit toparlanma görünümü — her bölgenin en son çalışıldığı gün, aradan geçen gün ve o günkü set.
  // Sezgisel gösterge (0–1 gün: taze yük, 2 gün: toparlanıyor, 3+ gün: hazır); bilimsel ölçüm değildir.
  const recoveryStatus = (workouts, exercises, opts) => {
    const o = opts || {};
    const { fmt, pD } = C();
    const today = o.today ? (typeof o.today === "string" ? pD(o.today) : new Date(o.today)) : new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = fmt(today);
    const keys = Object.keys(workouts || {}).filter(k => k <= todayKey).sort().reverse();
    const out = {};
    for (const dk of keys) {
      const c = countMuscleSets({ [dk]: workouts[dk] }, exercises, { meta: o.meta });
      Object.keys(c).forEach(r => {
        if (out[r] || !(c[r] > 0)) return;
        const days = Math.round((today - pD(dk)) / 86400000);
        out[r] = { last: dk, days, sets: c[r], state: days <= 1 ? "fresh" : days === 2 ? "recovering" : "ready" };
      });
    }
    return out;
  };

  window.LOGWISE_MUSCLES = {
    recoveryStatus,
    DEFAULT_TARGET,
    getMeta,
    presetIdOf,
    exerciseRegions,
    loadTypeOf,
    weekBounds,
    countMuscleSets,
    targetFor,
    targetStatus,
    trackedRegions,
    recentlyTrainedRegions,
    presetsForRegion,
    weekSummary
  };
})();
