// LogWise — BrandMark
// Refactor Aşama 2, Faz 2C-2 — index.html'in marka logosu gösteren küçük sunumsal bileşen.
// Bağımlılıklar:
//   - React (CDN, global) — React.createElement
//   - /Site_Logo180.svg   — public root'tan servis edilen SVG
// Kullanım: window.LOGWISE_COMPONENTS.BrandMark
// Props: { size=72, pad=8, radius=20, style={} }
// Saf sunumsal: tüm görünüm props ve CSS değişkenleriyle (var(--bg3), var(--brd), var(--shadow2)).
(function () {
  const BRAND_LOGO_SRC = "/Site_Logo180.svg";

  function BrandMark({
    size = 72,
    pad = 8,
    radius = 20,
    style = {}
  }) {
    return React.createElement("div", {
      style: {
        width: size,
        height: size,
        padding: pad,
        borderRadius: radius,
        background: "var(--bg3)",
        border: "1px solid var(--brd)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "var(--shadow2)",
        ...style
      }
    }, React.createElement("img", {
      src: BRAND_LOGO_SRC,
      alt: "",
      "aria-hidden": "true",
      style: {
        width: "100%",
        height: "100%",
        display: "block",
        objectFit: "contain",
        borderRadius: Math.max(radius - pad, 8)
      }
    }));
  }

  // Defensive init: namespace'i yoksa aç (C1-1'in pattern'i).
  window.LOGWISE_COMPONENTS = window.LOGWISE_COMPONENTS || {};
  window.LOGWISE_COMPONENTS.BrandMark = BrandMark;
})();
