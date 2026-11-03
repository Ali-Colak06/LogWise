// LogWise — ExPreviewModal
// Refactor Aşama 2, Faz 2C-4 — egzersiz önizleme modalı (GIF, açıklama, ipuçları, kategori rozetleri).
// Faz EX-ID güncellemesi: EX_PREVIEW artık slug ile anahtarlı; LOGWISE_EX_UTILS.resolveKey
// hem id hem name'i (kullanıcı verisi backward compat) lookup için doğru key'e çevirir.
// Faz 4 / D5: sekmeler (Nasıl yapılır · Hatalar · İlerleme · Kaslar · Benzer · Geçmiş). Kanonik rehber verisi
// (data/ex-guides.js, ~900 KB) pencere ilk açıldığında LOGWISE_EX_UTILS.loadGuides() ile yüklenir; yüklenene
// kadar hafif legacy önizleme (ex-preview.js) gösterilir. Kas sekmesi küçük meta dosyasını (ex-meta.js) kullanır.
// Bağımlılıklar (runtime'da çözülür):
//   - React (CDN, global)            — React.useState, React.createElement
//   - window.LOGWISE_TR / LOGWISE_EN — i18n sözlükleri
//   - window.LOGWISE_EX_GUIDES       — canonical shared guide source (geç yüklenir)
//   - window.LOGWISE_EX_PREVIEW      — legacy preview fallback
//   - window.LOGWISE_EX_UTILS        — resolveKey(nameOrId), loadGuides()
//   - window.LOGWISE_EX_META         — kas bölgeleri, ekipman, zorluk
//   - window.LOGWISE_MUSCLES         — exerciseRegions(ex)
//   - window.LOGWISE_COMPONENTS.MuscleMap
// Kullanım: window.LOGWISE_COMPONENTS.ExPreviewModal
// Props:
//   ex             — {id?, name, categories?: string[], presetId?}  egzersiz objesi
//   onClose        — () => void
//   lang           — "tr" | "en"
//   catLabel       — (cat, lang) => string
//   history        — opsiyonel [{date, sets}] (yeniden eskiye) — Geçmiş sekmesi
//   fmtSet         — opsiyonel (set) => string — Geçmiş sekmesindeki set etiketi
//   presetName     — opsiyonel (presetId) => string — Benzer sekmesinde görünen ad
//   inLibrary      — opsiyonel (presetId) => bool
//   onAddToLibrary — opsiyonel (presetId) => void — "Kütüphaneme ekle"
//   onOpenPreset   — opsiyonel (presetId) => void — benzer hareketin önizlemesine geç
//   onOpenDetail   — opsiyonel () => void — hareket detay sayfası (E1)
//   initialTab     — opsiyonel sekme kimliği
(function () {
  const CAT_COLORS = {
    "Göğüs": "#e8a0b4",
    "Chest": "#e8a0b4",
    "Sırt": "#82c9a0",
    "Back": "#82c9a0",
    "Omuz": "#7db8e8",
    "Shoulder": "#7db8e8",
    "Biceps": "#f0c06e",
    "Triceps": "#b07de8",
    "Bacak": "#6ecee8",
    "Leg": "#6ecee8",
    "Kalça": "#e87d7d",
    "Hip": "#e87d7d",
    "Karın": "#a0d080",
    "Core": "#a0d080",
    "Kardiyo": "#f0906e",
    "Cardio": "#f0906e",
    "Trapez": "#c0a87e",
    "Traps": "#c0a87e",
    "Kalf": "#7ebea0",
    "Calf": "#7ebea0",
    "Bilek": "#c8c080",
    "Wrist": "#c8c080",
    "Boyun": "#d8a0c8",
    "Neck": "#d8a0c8",
    "Diğer": "#a0a8b8",
    "Other": "#a0a8b8"
  };
  const getCatColor = c => CAT_COLORS[c] || "#a0a8b8";
  const h = (...a) => React.createElement(...a);
  const SEC = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "1px",
    textTransform: "uppercase",
    color: "var(--t3)",
    marginBottom: 8,
    fontFamily: "var(--font-mono)"
  };

  function resolveLookupKey(ex) {
    const utils = window.LOGWISE_EX_UTILS;
    const EX_GUIDES = window.LOGWISE_EX_GUIDES || {};
    const EX_PREVIEW = window.LOGWISE_EX_PREVIEW || {};
    const META = window.LOGWISE_EX_META || { exercises: {} };
    // Faz EX-ID: ex.id kullanıcı verisinde Date.now() (numerik) olabilir — slug değil.
    const candidates = [ex.presetId, ex.id, ex.name].filter(Boolean);
    for (const c of candidates) {
      const k = utils ? utils.resolveKey(c) : c;
      if (META.exercises[k] || (EX_GUIDES[k] && EX_GUIDES[k].previewReady) || EX_PREVIEW[k]) return k;
    }
    return utils ? utils.resolveKey(ex.name || ex.id) : (ex.name || ex.id);
  }

  function ExPreviewModal(props) {
    const { ex, onClose, lang, catLabel } = props;
    const TR = window.LOGWISE_TR;
    const EN = window.LOGWISE_EN;
    const L = lang === "tr" ? TR : EN;
    const li = pair => (Array.isArray(pair) ? (lang === "tr" ? pair[0] : pair[1]) : pair);
    const [guidesState, setGuidesState] = React.useState(window.LOGWISE_EX_GUIDES ? "ready" : "loading");
    React.useEffect(() => {
      if (guidesState !== "loading") return;
      let alive = true;
      const U = window.LOGWISE_EX_UTILS;
      if (!U || !U.loadGuides) { setGuidesState("failed"); return; }
      U.loadGuides().then(() => alive && setGuidesState("ready"), () => alive && setGuidesState("failed"));
      return () => { alive = false; };
    }, [guidesState]);
    const lookupKey = resolveLookupKey(ex);
    const EX_GUIDES = window.LOGWISE_EX_GUIDES || {};
    const EX_PREVIEW = window.LOGWISE_EX_PREVIEW || {};
    const META = window.LOGWISE_EX_META || { exercises: {}, muscles: {}, regions: {} };
    const meta = META.exercises[lookupKey] || null;
    const guide = EX_GUIDES[lookupKey] || null;
    const legacyPreview = EX_PREVIEW[lookupKey] || null;
    const preview = guide && guide.previewReady ? { desc: guide.description, tips: guide.tips } : legacyPreview;
    const desc = preview ? li(preview.desc) : null;
    const tips = preview ? preview.tips : null;
    const steps = guide && guide.formSteps && guide.formSteps.length ? guide.formSteps : null;
    const mistakes = guide && guide.mistakes && guide.mistakes.length ? guide.mistakes : null;
    const progression = guide && guide.progression && guide.progression.length ? guide.progression : null;
    const related = guide && guide.web && Array.isArray(guide.web.related) ? guide.web.related.filter(id => META.exercises[id]) : [];
    const history = Array.isArray(props.history) ? props.history : null;
    const media = guide && guide.mediaReady ? guide.media : null;
    const demoMedia = media && media.demoMp4 ? media : null;
    const demoLabel = demoMedia ? li(demoMedia.demoLabel) : ex.name;
    const EX_IMAGES = window.LOGWISE_EX_IMAGES || {};
    const gif = EX_IMAGES[lookupKey] || (legacyPreview ? legacyPreview.gif : null);
    const [mediaErr, setMediaErr] = React.useState(false);
    const [imgErr, setImgErr] = React.useState(false);
    const isAnimated = Array.isArray(gif) && gif.length >= 2;
    const [frame, setFrame] = React.useState(0);
    React.useEffect(() => {
      if (!isAnimated || imgErr) return;
      const id = setInterval(() => setFrame(f => 1 - f), 1350);
      return () => clearInterval(id);
    }, [isAnimated, imgErr]);
    const cats = ex.categories || [];
    const catLabels = cats.map(c => catLabel(c, lang));
    const firstCatColor = cats.length > 0 ? getCatColor(catLabels[0]) : "#a0a8b8";
    const regions = window.LOGWISE_MUSCLES ? window.LOGWISE_MUSCLES.exerciseRegions({ ...ex, presetId: meta ? lookupKey : ex.presetId }) : { primary: [], secondary: [], source: "category" };

    const tabs = [["how", L.exTabHow]];
    if (mistakes) tabs.push(["mistakes", L.exTabMistakes]);
    if (progression) tabs.push(["progression", L.exTabProgression]);
    if (regions.primary.length) tabs.push(["muscles", L.exTabMuscles]);
    if (related.length) tabs.push(["related", L.exTabRelated]);
    if (history) tabs.push(["history", L.exTabHistory]);
    const [tab, setTab] = React.useState(props.initialTab || "how");
    const activeTab = tabs.some(t => t[0] === tab) ? tab : "how";

    const chip = (text, key, color) => h("span", {
      key,
      style: {
        fontSize: 10,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 10,
        background: color ? color + "22" : "var(--bg3)",
        color: color || "var(--t2)",
        border: "1px solid " + (color ? color + "44" : "var(--brd)"),
        letterSpacing: "0.5px",
        textTransform: "uppercase"
      }
    }, text);
    const numberedList = (items, accent, testId) => h("div", { "data-testid": testId, style: { display: "flex", flexDirection: "column", gap: 8 } },
      items.map((it, i) => h("div", {
        key: i,
        style: { display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", background: "var(--bg3)", borderRadius: 10, borderLeft: "3px solid " + accent }
      }, h("span", { style: { fontSize: 11, fontWeight: 700, color: accent, fontFamily: "var(--font-mono)", flexShrink: 0, paddingTop: 1 } }, i + 1),
        h("span", { style: { fontSize: 13, color: "var(--t2)", lineHeight: 1.5 } }, li(it)))));

    const mediaBlock = h("div", {
      style: { marginTop: 4, marginBottom: 16, borderRadius: 14, overflow: "hidden", background: "var(--bg3)", minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }
    }, demoMedia && !mediaErr
      ? h("video", {
          controls: true, muted: true, loop: true, playsInline: true, preload: "metadata", poster: demoMedia.poster, "aria-label": demoLabel,
          onError: () => setMediaErr(true),
          style: { display: "block", width: "100%", aspectRatio: "16 / 9", maxHeight: 300, objectFit: "cover", background: "#050505" }
        }, demoMedia.demoWebm && h("source", { src: demoMedia.demoWebm, type: "video/webm" }), h("source", { src: demoMedia.demoMp4, type: "video/mp4" }))
      : gif && !imgErr
      ? (isAnimated
          ? h("div", { style: { position: "relative", width: "100%", height: 220 } }, gif.slice(0, 2).map((src, i) => h("img", {
              key: i, src, alt: ex.name, onError: () => setImgErr(true),
              style: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: frame === i ? 1 : 0, transition: "opacity 0.35s ease" }
            })))
          : h("img", { src: gif, alt: ex.name, onError: () => setImgErr(true), style: { width: "100%", maxHeight: 260, objectFit: "cover", display: "block" } }))
      : h("div", { style: { padding: "32px 20px", textAlign: "center" } },
          h("div", { style: { width: 64, height: 64, borderRadius: "50%", background: firstCatColor + "22", border: "2px dashed " + firstCatColor + "66", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 28 } }, "💪"),
          h("div", { style: { fontSize: 12, color: "var(--t3)" } }, L.exPreviewImgSoon)));

    let body = null;
    if (activeTab === "how") {
      body = h(React.Fragment, null, mediaBlock,
        !preview && h("div", { style: { padding: 16, background: "var(--bg3)", borderRadius: 12, textAlign: "center", color: "var(--t3)", fontSize: 13 } }, guidesState === "loading" ? L.exGuideLoading : L.exPreviewNoContent),
        desc && h("div", { style: { marginBottom: 16 } }, h("div", { style: SEC }, L.exPreviewDesc), h("div", { style: { fontSize: 14, color: "var(--t2)", lineHeight: 1.65 } }, desc)),
        steps && h("div", { style: { marginBottom: 16 } }, h("div", { style: SEC }, L.exTabHowSteps), numberedList(steps, firstCatColor, "ex-steps")),
        tips && tips.length > 0 && h("div", null, h("div", { style: SEC }, L.exPreviewTips), numberedList(tips, firstCatColor)),
        guidesState === "loading" && preview && h("div", { style: { fontSize: 11, color: "var(--t3)", marginTop: 10 } }, L.exGuideLoading));
    } else if (activeTab === "mistakes") {
      body = numberedList(mistakes, "var(--red)", "ex-mistakes");
    } else if (activeTab === "progression") {
      body = numberedList(progression, "var(--green)", "ex-progression");
    } else if (activeTab === "muscles") {
      const MuscleMap = window.LOGWISE_COMPONENTS && window.LOGWISE_COMPONENTS.MuscleMap;
      const hl = MuscleMap ? MuscleMap.highlightFills(regions.primary, regions.secondary) : null;
      const mLabel = m => (META.muscles[m] ? li(META.muscles[m].label) : m);
      const rLabel = r => (META.regions[r] ? li(META.regions[r].label) : r);
      const list = (title, names, strong) => names.length > 0 && h("div", { style: { marginBottom: 12 } },
        h("div", { style: SEC }, title),
        h("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, names.map(n => h("span", {
          key: n,
          style: { fontSize: 12, padding: "4px 10px", borderRadius: 12, background: strong ? "var(--blueL)" : "var(--bg3)", color: strong ? "var(--blue)" : "var(--t2)", border: "1px solid " + (strong ? "var(--blue)" : "var(--brd)") }
        }, n))));
      body = h("div", { "data-testid": "ex-muscles" },
        MuscleMap && h("div", { style: { padding: "8px 0 14px" } }, h(MuscleMap, { ...hl, lang, height: 230, testId: "preview-map" })),
        meta ? h(React.Fragment, null, list(L.musclesPrimary, meta.pm.map(mLabel), true), list(L.musclesSecondary, meta.sm.map(mLabel), false))
          : h(React.Fragment, null, list(L.musclesPrimary, regions.primary.map(rLabel), true),
              h("div", { style: { fontSize: 12, color: "var(--t3)" } }, L.musclesFromCategory)));
    } else if (activeTab === "related") {
      body = h("div", { "data-testid": "ex-related", style: { display: "flex", flexDirection: "column", gap: 8 } }, related.map(id => {
        const own = props.inLibrary ? props.inLibrary(id) : false;
        const nm = props.presetName ? props.presetName(id) : id;
        const m = META.exercises[id];
        return h("div", { key: id, style: { display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--bg3)", borderRadius: 10 } },
          h("button", {
            onClick: () => props.onOpenPreset && props.onOpenPreset(id),
            style: { flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", color: "var(--t1)", fontSize: 13, fontWeight: 600, cursor: props.onOpenPreset ? "pointer" : "default", fontFamily: "inherit", padding: 0 }
          }, nm, m && h("div", { style: { fontSize: 11, fontWeight: 400, color: "var(--t3)", marginTop: 2 } }, m.eq.map(e => L["eq_" + e] || e).join(" · "))),
          own ? h("span", { style: { fontSize: 11, color: "var(--green)", fontWeight: 600 } }, "✓ ", L.inLibrary)
            : props.onAddToLibrary && h("button", {
                onClick: () => props.onAddToLibrary(id),
                "data-testid": "related-add-" + id,
                style: { fontSize: 12, fontWeight: 600, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--blue)", background: "var(--blueL)", color: "var(--blue)", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }
              }, "+ ", L.addToLibrary));
      }));
    } else if (activeTab === "history") {
      const months = L.months || [];
      const fmtD = ds => { const p = ds.split("-").map(Number); return p[2] + " " + (months[p[1] - 1] || p[1]) + " " + p[0]; };
      let best = null;
      history.forEach(x => x.sets.forEach(s => {
        if (s.type === "warmup") return;
        const w = Number(s.weight) || 0, r = Number(s.reps) || 0;
        if (!best || w > best.w || (w === best.w && r > best.r)) best = { w, r, date: x.date, s };
      }));
      body = h("div", { "data-testid": "ex-history" },
        history.length === 0 ? h("div", { style: { padding: 20, textAlign: "center", color: "var(--t3)", fontSize: 13 } }, L.noHistory)
          : h(React.Fragment, null,
              best && h("div", { style: { padding: "10px 12px", background: "var(--blueL)", border: "1px solid var(--blue)", borderRadius: 10, marginBottom: 12, fontSize: 13, color: "var(--t1)" } },
                h("b", null, L.bestSet, ": "), props.fmtSet ? props.fmtSet(best.s) : `${best.w}kg × ${best.r}`, h("span", { style: { color: "var(--t3)" } }, " · ", fmtD(best.date))),
              history.slice(0, 5).map((x, i) => h("div", { key: i, style: { padding: "10px 0", borderBottom: "1px solid var(--brd)" } },
                h("div", { style: { fontSize: 13, fontWeight: 600, color: "var(--t1)", marginBottom: 6 } }, fmtD(x.date)),
                h("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, x.sets.map((s, j) => h("span", {
                  key: j,
                  style: { fontSize: 12, padding: "3px 10px", borderRadius: 12, background: "var(--bg3)", color: s.type === "warmup" ? "var(--t3)" : "var(--t2)" }
                }, props.fmtSet ? props.fmtSet(s) : `${s.weight}kg × ${s.reps}`))))),
              props.onOpenDetail && h("button", {
                onClick: props.onOpenDetail,
                style: { marginTop: 12, width: "100%", padding: "10px", borderRadius: 8, border: "1px solid var(--brd)", background: "var(--bg)", color: "var(--t1)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }
              }, L.openExerciseDetail, " →")));
    }

    const diffLabel = meta ? [L.diff1, L.diff2, L.diff3][meta.d - 1] : null;
    return h("div", {
      style: { position: "fixed", inset: 0, zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" },
      onClick: onClose
    }, h("div", {
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "ex-preview-title",
      "data-testid": "ex-preview",
      style: { background: "var(--bg2)", borderRadius: 20, maxWidth: 480, width: "100%", maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" },
      onClick: e => e.stopPropagation()
    }, h("div", { style: { padding: "18px 20px 10px", display: "flex", alignItems: "flex-start", gap: 12 } },
      h("div", { style: { flex: 1, minWidth: 0 } },
        h("div", { id: "ex-preview-title", style: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--t1)", marginBottom: 6, lineHeight: 1.2 } }, ex.name),
        h("div", { style: { display: "flex", flexWrap: "wrap", gap: 5 } },
          catLabels.map((c, i) => chip(c, "c" + i, getCatColor(c))),
          meta && meta.eq.map(e => chip(L["eq_" + e] || e, "e" + e)),
          diffLabel && chip(diffLabel, "d"))),
      h("button", {
        onClick: onClose, title: L.close, "aria-label": L.ariaCloseModal,
        style: { background: "var(--bg3)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }
      }, h("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "var(--t3)" }, h("path", { d: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" })))),
      tabs.length > 1 && h("div", {
        role: "tablist",
        "aria-label": L.exPreviewBtn,
        style: { display: "flex", gap: 4, padding: "0 16px 10px", overflowX: "auto", borderBottom: "1px solid var(--brd)", flexShrink: 0 }
      }, tabs.map(([id, lb]) => h("button", {
        key: id,
        role: "tab",
        "aria-selected": activeTab === id,
        "data-testid": "ex-tab-" + id,
        onClick: () => setTab(id),
        style: {
          padding: "6px 12px", borderRadius: 16, whiteSpace: "nowrap", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          border: activeTab === id ? "1.5px solid var(--blue)" : "1px solid var(--brd)",
          background: activeTab === id ? "var(--blueL)" : "transparent",
          color: activeTab === id ? "var(--blue)" : "var(--t2)"
        }
      }, lb))),
      h("div", { role: "tabpanel", style: { flex: 1, overflowY: "auto", padding: "14px 20px 20px" } }, body,
        guide && guide.publish && activeTab === "how" && h("a", {
          href: guide.webGuideUrl,
          style: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: 42, marginTop: 20, padding: "10px 16px", borderRadius: 8, background: "var(--accent)", color: "var(--accentT)", fontSize: 13, fontWeight: 700, textDecoration: "none" }
        }, L.exPreviewFullGuide))));
  }

  // Defensive init — C1 ailesinin ortak pattern'i.
  window.LOGWISE_COMPONENTS = window.LOGWISE_COMPONENTS || {};
  window.LOGWISE_COMPONENTS.ExPreviewModal = ExPreviewModal;
})();
