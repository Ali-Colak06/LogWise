// LogWise — user_data senkron katmanı (Faz 1: A1 + A2 + A3)
// window.LOGWISE_SYNC namespace. React bağımlılığı yok.
//
// Amaç: Tek blob'luk user_data modelinde veri kaybını önlemek.
//   1. Yükleme hatası "satır yok" ile karıştırılmaz (A1). Hata varsa boş veri buluta yazılmaz.
//   2. Bulut yazımı KOŞULLUDUR: yalnız son okunan/yazılan updated_at hâlâ aynıysa UPDATE yapılır.
//      Başka sekme/cihaz/sayfa arada yazdıysa 0 satır döner → "conflict" (sessiz ezme yok).
//      DB migration gerektirmez; user_data_updated_at trigger'ı olsa da olmasa da çalışır
//      (yeni temel değer her zaman yazma sonucundan okunur).
//   3. Oturumlu kullanıcı için kullanıcıya özel yerel kopya (gym-log-local-<uid>) tutulur (A2/A3).
//      Kayıt: { v:1, data, base:{exists, updatedAt}, dirty, savedAt }.
//      dirty=true → buluta henüz yazılmamış değişiklik var.
//
// Saf fonksiyonlar (test edilir: scripts/test-sync.js):
//   localKey, readLocal, writeLocal, clearLocal, classifyLoad, decideInitial, sameStamp, isOfflineError
// Supabase'e dokunanlar (sb parametre olarak verilir; lib/db.js'e bağımlı değil):
//   loadCloud, writeCloud, forceWriteCloud, fetchCloudStamp, mutateUserData
(function () {
  const LOCAL_PREFIX = "gym-log-local-";
  const localKey = uid => LOCAL_PREFIX + uid;

  const readLocal = (storage, uid) => {
    if (!storage || !uid) return null;
    try {
      const raw = storage.getItem(localKey(uid));
      if (!raw) return null;
      const rec = JSON.parse(raw);
      if (!rec || typeof rec !== "object" || !rec.data || typeof rec.data !== "object") return null;
      const base = rec.base && typeof rec.base === "object" ? rec.base : { exists: false, updatedAt: null };
      return {
        v: 1,
        data: rec.data,
        base: { exists: !!base.exists, updatedAt: base.updatedAt || null },
        dirty: !!rec.dirty,
        savedAt: rec.savedAt || 0
      };
    } catch (e) {
      return null;
    }
  };

  // true/false döner — kota dolarsa uygulama çalışmaya devam eder.
  const writeLocal = (storage, uid, rec) => {
    if (!storage || !uid || !rec) return false;
    try {
      storage.setItem(localKey(uid), JSON.stringify({
        v: 1,
        data: rec.data,
        base: rec.base || { exists: false, updatedAt: null },
        dirty: !!rec.dirty,
        savedAt: rec.savedAt || Date.now()
      }));
      return true;
    } catch (e) {
      return false;
    }
  };

  const clearLocal = (storage, uid) => {
    if (!storage || !uid) return;
    try {
      storage.removeItem(localKey(uid));
    } catch (e) {}
  };

  // İki updated_at değeri aynı anı mı gösteriyor? (format farklı olabilir: "Z" / "+00:00")
  const sameStamp = (a, b) => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a === b) return true;
    const ta = Date.parse(a), tb = Date.parse(b);
    return !isNaN(ta) && ta === tb;
  };

  // Supabase sorgu sonucunu sınıflandırır. maybeSingle(): satır yoksa data=null, error=null.
  const classifyLoad = res => {
    const r = res || {};
    if (r.error) return { status: "error", error: r.error };
    if (!r.data || !r.data.data) return { status: "missing" };
    return { status: "ok", data: r.data.data, updatedAt: r.data.updated_at || null };
  };

  // Açılışta hangi verinin kullanılacağına karar verir.
  // Döner: { action, data?, base?, dirty?, push?, local?, error? }
  //   action: "cloud" | "init" | "local" | "local-offline" | "conflict" | "error"
  const decideInitial = ({ local, cloud }) => {
    const c = cloud || { status: "error" };
    if (c.status === "error") {
      if (local) return { action: "local-offline", data: local.data, base: local.base, dirty: local.dirty, error: c.error };
      return { action: "error", error: c.error };
    }
    if (c.status === "missing") {
      if (local && local.dirty && !local.base.exists) {
        return { action: "local", data: local.data, base: { exists: false, updatedAt: null }, dirty: true, push: true };
      }
      if (local && local.dirty && local.base.exists) {
        // Bulutta satır vardı, şimdi yok (hesap verisi silinmiş olabilir). Kullanıcıya sor.
        return { action: "conflict", data: null, base: { exists: false, updatedAt: null }, local };
      }
      return { action: "init", base: { exists: false, updatedAt: null } };
    }
    const cloudBase = { exists: true, updatedAt: c.updatedAt };
    if (!local || !local.dirty) return { action: "cloud", data: c.data, base: cloudBase, dirty: false };
    if (local.base.exists && sameStamp(local.base.updatedAt, c.updatedAt)) {
      // Bulut, yerel değişikliğin üzerine kurulduğu sürümde duruyor → yereli gönder.
      return { action: "local", data: local.data, base: cloudBase, dirty: true, push: true };
    }
    return { action: "conflict", data: c.data, base: cloudBase, local };
  };

  const isOfflineError = err => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
    if (!err) return false;
    const msg = String(err.message || err.details || err.error || "").toLowerCase();
    return msg.includes("failed to fetch") || msg.includes("network") || msg.includes("offline") ||
      msg.includes("load failed") || err.status === 503 || err.status === 0;
  };

  // ---- Supabase işlemleri ----

  const loadCloud = async (sb, uid) => {
    try {
      const res = await sb.from("user_data").select("data, updated_at").eq("user_id", uid).maybeSingle();
      return classifyLoad(res);
    } catch (e) {
      return { status: "error", error: e };
    }
  };

  const fetchCloudStamp = async (sb, uid) => {
    try {
      const { data, error } = await sb.from("user_data").select("updated_at").eq("user_id", uid).maybeSingle();
      if (error) return { status: "error", error };
      if (!data) return { status: "missing" };
      return { status: "ok", updatedAt: data.updated_at || null };
    } catch (e) {
      return { status: "error", error: e };
    }
  };

  // Koşullu yazma. base = { exists, updatedAt } (son okunan/yazılan bulut durumu).
  // Döner: { status:"ok", base } | { status:"conflict", cloudUpdatedAt } | { status:"error", error, offline }
  const writeCloud = async (sb, uid, data, base) => {
    const b = base || { exists: false, updatedAt: null };
    const now = new Date().toISOString();
    try {
      if (b.exists) {
        let q = sb.from("user_data").update({ data, updated_at: now }).eq("user_id", uid);
        q = b.updatedAt ? q.eq("updated_at", b.updatedAt) : q.is("updated_at", null);
        const { data: rows, error } = await q.select("updated_at");
        if (error) return { status: "error", error, offline: isOfflineError(error) };
        if (rows && rows.length) return { status: "ok", base: { exists: true, updatedAt: rows[0].updated_at || now } };
        // 0 satır: ya biri arada yazdı (çakışma) ya da satır/oturum yok. Ayırt et.
        const st = await fetchCloudStamp(sb, uid);
        if (st.status === "ok" && !sameStamp(st.updatedAt, b.updatedAt)) return { status: "conflict", cloudUpdatedAt: st.updatedAt };
        if (st.status === "missing") return { status: "conflict", cloudUpdatedAt: null };
        return { status: "error", error: st.error || new Error("update matched no rows"), offline: isOfflineError(st.error) };
      }
      const { data: rows, error } = await sb.from("user_data").insert({ user_id: uid, data, updated_at: now }).select("updated_at");
      if (error) {
        if (error.code === "23505") {
          const st = await fetchCloudStamp(sb, uid);
          return { status: "conflict", cloudUpdatedAt: st.status === "ok" ? st.updatedAt : null };
        }
        return { status: "error", error, offline: isOfflineError(error) };
      }
      return { status: "ok", base: { exists: true, updatedAt: rows && rows[0] ? rows[0].updated_at : now } };
    } catch (e) {
      return { status: "error", error: e, offline: isOfflineError(e) };
    }
  };

  // Kullanıcı çakışmada "bu cihazdakini kaydet" dediğinde: koşulsuz yaz.
  const forceWriteCloud = async (sb, uid, data) => {
    try {
      const { data: rows, error } = await sb.from("user_data")
        .upsert({ user_id: uid, data, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
        .select("updated_at");
      if (error) return { status: "error", error, offline: isOfflineError(error) };
      return { status: "ok", base: { exists: true, updatedAt: rows && rows[0] ? rows[0].updated_at : null } };
    } catch (e) {
      return { status: "error", error: e, offline: isOfflineError(e) };
    }
  };

  // Profil / paylaşım / program sayfalarındaki "kopyala" akışları için güvenli oku-değiştir-yaz.
  // mutate(cur) yeni veri nesnesini döndürür. Yükleme hatasında ASLA yazmaz (A1).
  // Çakışmada en fazla 2 kez taze veriyle yeniden dener.
  const mutateUserData = async (sb, uid, mutate, makeEmpty) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const c = await loadCloud(sb, uid);
      if (c.status === "error") return { ok: false, error: c.error || new Error("load failed") };
      const cur = c.status === "ok" ? c.data : makeEmpty();
      const base = c.status === "ok" ? { exists: true, updatedAt: c.updatedAt } : { exists: false, updatedAt: null };
      const next = mutate(cur);
      const w = await writeCloud(sb, uid, next, base);
      if (w.status === "ok") {
        // Açık bir app sekmesinin temiz yerel kopyası artık eski; temizle ki bir sonraki açılış buluttan okusun.
        try {
          const rec = readLocal(window.localStorage, uid);
          if (rec && !rec.dirty) clearLocal(window.localStorage, uid);
        } catch (e) {}
        return { ok: true };
      }
      if (w.status === "error") return { ok: false, error: w.error };
    }
    return { ok: false, error: new Error("conflict") };
  };

  // ---- Misafir verisini hesaba aktarma (Faz 2 / A5) ----
  // Saf fonksiyon: account ve guest değiştirilmez; yeni nesne döner.
  // Kurallar: hareketler presetId veya (küçük harf) isimle eşleşir; aynı gün aynı hareket iki tarafta
  // da varsa BULUTTAKİ korunur; programlar/günlük programlar eklenir (aynı ad + aynı günler ise atlanır);
  // not, süre, ölçüm ve dinlenme ayarlarında yalnız eksik olan eklenir; aktif program yalnız hesapta yoksa alınır.
  const guestSummary = guest => {
    const g = guest || {};
    const days = Object.keys(g.workouts || {}).filter(dk => (g.workouts[dk] || []).some(w => (w.sets || []).length > 0));
    return {
      workoutDays: days.length,
      exercises: (g.exercises || []).length,
      programs: Object.keys(g.programs || {}).length
    };
  };
  const hasGuestContent = guest => {
    const s = guestSummary(guest);
    return s.workoutDays > 0 || s.exercises > 0 || s.programs > 0;
  };
  const mergeGuestData = (account, guest) => {
    const acc = JSON.parse(JSON.stringify(account || {}));
    const g = guest || {};
    ["exercises"].forEach(k => {
      if (!Array.isArray(acc[k])) acc[k] = [];
    });
    ["workouts", "programs", "dailyPrograms", "measurements", "dayNotes", "exerciseNotes", "durations", "programMeta", "exerciseRest"].forEach(k => {
      if (!acc[k] || typeof acc[k] !== "object") acc[k] = {};
    });
    const norm = n => String(n || "").trim().toLowerCase();
    const byPreset = new Map();
    const byName = new Map();
    const accIds = new Set();
    acc.exercises.forEach(e => {
      if (e.presetId) byPreset.set(e.presetId, e.id);
      byName.set(norm(e.name), e.id);
      accIds.add(e.id);
    });
    const idMap = {};
    const stats = { addedExercises: 0, addedDays: 0, addedEntries: 0, skippedEntries: 0, addedPrograms: 0 };
    (g.exercises || []).forEach(ge => {
      let target = (ge.presetId && byPreset.get(ge.presetId)) || byName.get(norm(ge.name));
      if (!target) {
        let nid = String(ge.id);
        let i = 0;
        while (accIds.has(nid)) nid = ge.id + "-g" + ++i;
        acc.exercises.push({ ...ge, id: nid });
        accIds.add(nid);
        byName.set(norm(ge.name), nid);
        if (ge.presetId) byPreset.set(ge.presetId, nid);
        target = nid;
        stats.addedExercises++;
      }
      idMap[ge.id] = target;
    });
    const mapId = id => idMap[id] || id;
    Object.keys(g.workouts || {}).forEach(dk => {
      const day = (acc.workouts[dk] || []).slice();
      const hadDay = day.length > 0;
      let added = false;
      (g.workouts[dk] || []).forEach(w => {
        if (!w || !(w.sets || []).length) return;
        const eid = mapId(w.exerciseId);
        if (day.some(x => x.exerciseId === eid)) {
          stats.skippedEntries++;
          return;
        }
        day.push({ ...JSON.parse(JSON.stringify(w)), exerciseId: eid });
        stats.addedEntries++;
        added = true;
      });
      if (day.length) acc.workouts[dk] = day;
      if (added && !hadDay) stats.addedDays++;
    });
    const mapDays = days => {
      const out = {};
      Object.keys(days || {}).forEach(k => {
        out[k] = (days[k] || []).map(mapId);
      });
      return out;
    };
    const pidMap = {};
    Object.keys(g.programs || {}).forEach(pid => {
      const pr = g.programs[pid];
      const mapped = { ...pr, days: mapDays(pr.days) };
      const same = Object.keys(acc.programs).find(k => acc.programs[k].name === mapped.name && JSON.stringify(acc.programs[k].days) === JSON.stringify(mapped.days));
      if (same) {
        pidMap[pid] = same;
        return;
      }
      let nid = pid;
      let i = 0;
      while (acc.programs[nid]) nid = pid + "-g" + ++i;
      acc.programs[nid] = mapped;
      if (g.programMeta && g.programMeta[pid]) acc.programMeta[nid] = { ...g.programMeta[pid] };
      pidMap[pid] = nid;
      stats.addedPrograms++;
    });
    Object.keys(g.dailyPrograms || {}).forEach(id => {
      const dp = g.dailyPrograms[id];
      const mapped = { ...dp, exercises: (dp.exercises || []).map(mapId) };
      if (Object.values(acc.dailyPrograms).some(x => x.name === mapped.name && JSON.stringify(x.exercises) === JSON.stringify(mapped.exercises))) return;
      let nid = id;
      let i = 0;
      while (acc.dailyPrograms[nid]) nid = id + "-g" + ++i;
      acc.dailyPrograms[nid] = mapped;
    });
    Object.keys(g.measurements || {}).forEach(dk => {
      const cur = (acc.measurements[dk] || []).slice();
      (g.measurements[dk] || []).forEach(m => {
        if (!cur.some(x => x.id === m.id)) cur.push({ ...m });
      });
      if (cur.length) acc.measurements[dk] = cur;
    });
    Object.keys(g.dayNotes || {}).forEach(dk => {
      if (!acc.dayNotes[dk]) acc.dayNotes[dk] = g.dayNotes[dk];
    });
    Object.keys(g.exerciseNotes || {}).forEach(id => {
      const eid = mapId(id);
      if (!acc.exerciseNotes[eid]) acc.exerciseNotes[eid] = g.exerciseNotes[id];
    });
    Object.keys(g.exerciseRest || {}).forEach(id => {
      const eid = mapId(id);
      if (!acc.exerciseRest[eid]) acc.exerciseRest[eid] = g.exerciseRest[id];
    });
    Object.keys(g.durations || {}).forEach(dk => {
      if (!acc.durations[dk]) acc.durations[dk] = (g.durations[dk] || []).slice();
    });
    if (!acc.activeProgram && g.activeProgram && pidMap[g.activeProgram]) acc.activeProgram = pidMap[g.activeProgram];
    return { data: acc, stats };
  };

  // ---- Paylaşılan antrenmanı bir güne ekleme (Faz 3 / B12) ----
  // Saf: cur değiştirilmez. Aynı gün aynı hareket zaten varsa setler O kayda eklenir (çift kayıt yok).
  // Hareket isimle eşleşir; yoksa resolvePreset(name) ile hazır harekete (presetId + kategoriler) bağlanır.
  // opts: { resolvePreset(name) → {id, categories}|null, toPlanSet(set) → set, makeId(idx) → string, fallbackName(idx) }
  const applySharedWorkout = (cur, sharedExs, exNames, date, opts) => {
    const o = opts || {};
    const resolve = o.resolvePreset || (() => null);
    const toPlan = o.toPlanSet || (st => ({ ...st }));
    const makeId = o.makeId || (idx => Date.now().toString(36) + Math.random().toString(36).slice(2, 7) + String(idx));
    const fallbackName = o.fallbackName || (idx => "#" + (idx + 1));
    const base = cur || {};
    const exercises = [...(base.exercises || [])];
    const day = (base.workouts && base.workouts[date] || []).map(w => ({ ...w, sets: [...(w.sets || [])] }));
    (sharedExs || []).forEach((se, idx) => {
      const name = (exNames && exNames[idx]) || fallbackName(idx);
      const lower = String(name).toLowerCase();
      const preset = resolve(name);
      let match = exercises.find(e => String(e.name || "").toLowerCase() === lower) || (preset ? exercises.find(e => e.presetId === preset.id) : null);
      if (!match) {
        match = {
          id: makeId(idx),
          name,
          categories: preset && preset.categories ? [...preset.categories] : ["Diğer"],
          ...(preset ? { presetId: preset.id } : {})
        };
        exercises.push(match);
      }
      const sets = (se.sets || []).map(toPlan);
      const existing = day.find(w => w.exerciseId === match.id);
      if (existing) existing.sets = [...existing.sets, ...sets];
      else day.push({ exerciseId: match.id, sets, ...(se.supersetGroup ? { supersetGroup: se.supersetGroup } : {}) });
    });
    return {
      ...base,
      exercises,
      workouts: { ...(base.workouts || {}), [date]: day }
    };
  };

  window.LOGWISE_SYNC = {
    applySharedWorkout,
    guestSummary,
    hasGuestContent,
    mergeGuestData,
    localKey,
    readLocal,
    writeLocal,
    clearLocal,
    sameStamp,
    classifyLoad,
    decideInitial,
    isOfflineError,
    loadCloud,
    fetchCloudStamp,
    writeCloud,
    forceWriteCloud,
    mutateUserData
  };
})();
