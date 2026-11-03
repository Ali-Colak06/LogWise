// LogWise — MuscleMap (Faz 4 / D2)
// Ön ve arka vücut çizimi; her kas bölgesi data/ex-meta.json'daki bölge adıyla (chest, lats, …) bir <path>.
// Üç yerde kullanılır: hareket kütüphanesi filtresi (tıklanabilir), önizleme penceresi (birincil koyu,
// ikincil açık) ve panel ısı haritası (haftalık set / hedef).
// Bağımlılıklar: React (global), window.LOGWISE_EX_META (bölge etiketleri; opsiyonel).
// Kullanım: window.LOGWISE_COMPONENTS.MuscleMap
// Props:
//   fills     — { region: cssColor } bölge dolguları (yardımcılar: MuscleMap.highlightFills / heatFills)
//   opacity   — { region: 0..1 } opsiyonel dolgu opaklığı
//   selected  — seçili bölge (çerçeve vurgusu)
//   onSelect  — (region) => void; verilirse bölgeler klavye ile de seçilebilir düğmelerdir
//   lang      — "tr" | "en" (erişilebilir adlar için)
//   views     — ["front","back"] (varsayılan ikisi)
//   height    — piksel yükseklik (varsayılan 260)
//   testId    — data-testid öneki
(function () {
  const h = (...a) => React.createElement(...a);
  const W = 200;

  // Sol yarı (izleyicinin solu) şekilleri; sağ yarı aynalanır. Merkezdeki tek parça şekiller "mid" ile işaretli.
  const FRONT = {
    traps: ["M93,58 L80,68 L92,70 Z"],
    "front-delts": ["M80,70 Q66,70 62,84 L64,98 Q70,88 80,84 Z"],
    "side-delts": ["M62,84 Q54,92 56,106 L63,106 Q62,94 64,88 Z"],
    chest: ["M98,74 L82,72 Q70,80 68,96 Q74,112 98,112 Z"],
    serratus: ["M71,108 L80,113 L79,124 L72,118 Z"],
    biceps: ["M64,104 Q56,118 57,138 L68,140 Q72,124 71,108 Z"],
    forearms: ["M57,143 Q49,164 51,188 L61,190 Q68,168 67,145 Z"],
    abs: ["M90,116 L98.5,116 L98.5,170 Q93,172 89,166 Z"],
    obliques: ["M88,118 L79,124 Q77,148 82,168 L88,166 Z"],
    "hip-flexors": ["M83,172 L94,176 L93,188 L82,182 Z"],
    quads: ["M80,184 Q71,220 76,262 L92,264 Q96,226 93,190 Z"],
    adductors: ["M94,192 L99,194 L99,232 Q96,240 94,236 Z"],
    tibialis: ["M79,282 Q76,310 80,338 L85,338 Q85,310 84,282 Z"],
    calves: ["M74,284 Q70,306 75,332 L79,332 Q76,306 78,284 Z"]
  };
  const BACK = {
    traps: ["M100,56 L86,64 L74,74 L92,86 L100,96 Z"],
    "rear-delts": ["M74,76 Q64,78 61,90 L66,100 Q70,88 80,82 Z"],
    "side-delts": ["M61,88 Q54,94 56,106 L63,106 Q62,98 65,96 Z"],
    "rotator-cuff": ["M82,88 L92,90 L91,104 L81,100 Z"],
    "upper-back": ["M100,98 L93,88 L93,108 L99,124 L100,124 Z", "M92,106 L82,102 L84,112 L93,118 Z"],
    lats: ["M80,104 Q71,122 77,150 L93,158 L93,122 Z"],
    "lower-back": ["M93,134 L99,134 L99,172 L88,170 Q90,150 93,134 Z"],
    triceps: ["M64,104 Q56,118 57,138 L68,140 Q72,124 71,108 Z"],
    forearms: ["M57,143 Q49,164 51,188 L61,190 Q68,168 67,145 Z"],
    glutes: ["M99,176 L84,174 Q74,190 78,212 Q90,220 99,214 Z"],
    hamstrings: ["M79,216 Q73,240 77,266 L92,266 Q96,240 96,222 Z"],
    calves: ["M78,282 Q71,304 78,332 L90,332 Q94,304 88,282 Z"]
  };
  // Siluet (her iki görünüm aynı)
  const BODY = [
    // baş + boyun
    "M100,8 Q118,8 118,32 Q118,52 106,56 L108,64 Q130,66 140,80 Q148,92 146,106 Q152,140 150,190 Q150,200 144,204 Q138,202 139,190 Q138,166 134,148 Q132,128 128,118 Q126,150 120,170 Q124,184 122,200 Q130,240 124,270 Q128,286 126,300 Q126,330 120,346 Q122,354 114,356 L108,352 Q110,330 112,300 Q108,286 108,270 Q102,240 100,214 Q98,240 92,270 Q92,286 88,300 Q90,330 92,352 L86,356 Q78,354 80,346 Q74,330 74,300 Q72,286 76,270 Q70,240 78,200 Q76,184 80,170 Q74,150 72,118 Q68,128 66,148 Q62,166 61,190 Q62,202 56,204 Q50,200 50,190 Q48,140 54,106 Q52,92 60,80 Q70,66 92,64 L94,56 Q82,52 82,32 Q82,8 100,8 Z"
  ];
  const ABS_LINES = ["M90,132 L110,132", "M90,148 L110,148", "M100,116 L100,170"];

  const label = (region, lang) => {
    const M = window.LOGWISE_EX_META;
    const r = M && M.regions ? M.regions[region] : null;
    return r ? (lang === "en" ? r.label[1] : r.label[0]) : region;
  };

  function View({ shapes, side, fills, opacity, selected, onSelect, lang, height, testId }) {
    const nodes = [];
    nodes.push(h("path", { key: "body", d: BODY[0], fill: "var(--bg3)", stroke: "var(--brd2)", strokeWidth: 1.2, pointerEvents: "none" }));
    Object.keys(shapes).forEach(region => {
      const fill = (fills && fills[region]) || "var(--t4)";
      const op = opacity && opacity[region] != null ? opacity[region] : 1;
      const isSel = selected === region;
      const name = label(region, lang);
      const common = {
        fill,
        fillOpacity: op,
        stroke: isSel ? "var(--t1)" : "var(--bg)",
        strokeWidth: isSel ? 1.6 : 0.8,
        style: { cursor: onSelect ? "pointer" : "default", transition: "fill .2s, fill-opacity .2s" }
      };
      const paths = [];
      shapes[region].forEach((d, i) => {
        paths.push(h("path", { key: "l" + i, d, ...common }));
        paths.push(h("path", { key: "r" + i, d, transform: `translate(${W},0) scale(-1,1)`, ...common }));
      });
      const gProps = {
        key: region,
        "data-region": region,
        "data-testid": testId ? `${testId}-${side}-${region}` : undefined
      };
      if (onSelect) {
        Object.assign(gProps, {
          role: "button",
          tabIndex: 0,
          "aria-label": name,
          "aria-pressed": isSel ? "true" : "false",
          onClick: () => onSelect(region),
          onKeyDown: e => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(region); }
          }
        });
      }
      nodes.push(h("g", gProps, h("title", null, name), paths));
    });
    if (side === "front") ABS_LINES.forEach((d, i) => nodes.push(h("path", { key: "al" + i, d, stroke: "var(--bg)", strokeWidth: 0.8, fill: "none", pointerEvents: "none" })));
    return h("svg", {
      viewBox: "40 0 120 362",
      height,
      width: Math.round(height * 120 / 362),
      role: onSelect ? "group" : "img",
      "aria-label": side === "front" ? (lang === "en" ? "Body, front" : "Vücut, ön") : (lang === "en" ? "Body, back" : "Vücut, arka"),
      style: { display: "block", overflow: "visible" }
    }, nodes);
  }

  function MuscleMap(props) {
    const views = props.views || ["front", "back"];
    const height = props.height || 260;
    const cap = { fontSize: 10, color: "var(--t3)", textAlign: "center", marginTop: 4, fontFamily: "var(--font-mono)", letterSpacing: ".5px", textTransform: "uppercase" };
    return h("div", {
      "data-testid": props.testId || undefined,
      style: { display: "flex", justifyContent: "center", gap: props.gap != null ? props.gap : 18, alignItems: "flex-start" }
    }, views.map(v => h("div", { key: v },
      h(View, { ...props, side: v, shapes: v === "front" ? FRONT : BACK, height }),
      props.captions !== false && h("div", { style: cap }, v === "front" ? (props.lang === "en" ? "Front" : "Ön") : (props.lang === "en" ? "Back" : "Arka")))));
  }

  // Önizleme: birincil bölgeler vurgu renginde, ikinciller aynı renkte açık.
  MuscleMap.highlightFills = (primary, secondary) => {
    const fills = {}, opacity = {};
    (secondary || []).forEach(r => { fills[r] = "var(--blue)"; opacity[r] = 0.38; });
    (primary || []).forEach(r => { fills[r] = "var(--blue)"; opacity[r] = 1; });
    return { fills, opacity };
  };
  // Isı haritası: hedefin altı turuncu (ilerledikçe koyulaşır), bant içi yeşil, üstü mavi.
  MuscleMap.heatFills = (counts, targetFor) => {
    const fills = {}, opacity = {};
    Object.keys(counts || {}).forEach(r => {
      const v = counts[r] || 0;
      if (v <= 0) return;
      const t = targetFor(r);
      if (v < t.min) { fills[r] = "var(--orange)"; opacity[r] = 0.35 + 0.5 * Math.min(1, v / (t.min || 1)); }
      else if (v <= t.max) { fills[r] = "var(--green)"; opacity[r] = 1; }
      else { fills[r] = "var(--sky)"; opacity[r] = 1; }
    });
    return { fills, opacity };
  };
  MuscleMap.regionLabel = label;
  MuscleMap.REGIONS_FRONT = Object.keys(FRONT);
  MuscleMap.REGIONS_BACK = Object.keys(BACK);

  window.LOGWISE_COMPONENTS = window.LOGWISE_COMPONENTS || {};
  window.LOGWISE_COMPONENTS.MuscleMap = MuscleMap;
})();
