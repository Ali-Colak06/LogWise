// LogWise — ExPreviewModal
// Refactor Aşama 2, Faz 2C-4 — egzersiz önizleme modalı (GIF, açıklama, ipuçları, kategori rozetleri).
// Faz EX-ID güncellemesi: EX_PREVIEW artık slug ile anahtarlı; LOGWISE_EX_UTILS.resolveKey
// hem id hem name'i (kullanıcı verisi backward compat) lookup için doğru key'e çevirir.
// Bağımlılıklar (runtime'da çözülür):
//   - React (CDN, global)            — React.useState, React.createElement
//   - window.LOGWISE_TR              — TR i18n sözlüğü
//   - window.LOGWISE_EN              — EN i18n sözlüğü
//   - window.LOGWISE_EX_PREVIEW      — {slug: {desc:[tr,en], tips:[[tr,en],...], gif}}
//   - window.LOGWISE_EX_UTILS        — resolveKey(nameOrId) helper'ı
// Kullanım: window.LOGWISE_COMPONENTS.ExPreviewModal
// Props:
//   ex        — {id?, name, categories?: string[]}  egzersiz objesi
//   onClose   — () => void                     modal kapatma callback'i
//   lang      — "tr" | "en"
//   catLabel  — (cat, lang) => string          kategori ismi yerelleştirici (index.html'den prop)
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

  function ExPreviewModal({
    ex,
    onClose,
    lang,
    catLabel
  }) {
    const TR = window.LOGWISE_TR;
    const EN = window.LOGWISE_EN;
    const L = lang === "tr" ? TR : EN;
    const EX_PREVIEW = window.LOGWISE_EX_PREVIEW || {};
    // Faz EX-ID: ex.id kullanıcı verisinde Date.now() (numerik) olabilir — slug değil.
    // O yüzden id + name iki adayı sırayla deneriz; biri preview/desc Map'inde varsa onu seçeriz.
    const utils = window.LOGWISE_EX_UTILS;
    const candidates = [ex.id, ex.name].filter(Boolean);
    let lookupKey = null;
    for (const c of candidates) {
      const k = utils ? utils.resolveKey(c) : c;
      if (EX_PREVIEW[k]) { lookupKey = k; break; }
    }
    // Hiç eşleşme yoksa name (varsa) ile son bir deneme — desc varsa modal yine de açıklama gösterir
    if (!lookupKey) lookupKey = utils ? utils.resolveKey(ex.name || ex.id) : (ex.name || ex.id);
    const preview = EX_PREVIEW[lookupKey] || null;
    const desc = preview ? lang === "tr" ? preview.desc[0] : preview.desc[1] : null;
    const tips = preview ? preview.tips : null;
    const EX_IMAGES = window.LOGWISE_EX_IMAGES || {};
    const gif = EX_IMAGES[lookupKey] || (preview ? preview.gif : null);
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
    return React.createElement("div", {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)"
      },
      onClick: onClose
    }, React.createElement("div", {
      style: {
        background: "var(--bg2)",
        borderRadius: 20,
        maxWidth: 480,
        width: "100%",
        maxHeight: "85vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)"
      },
      onClick: e => e.stopPropagation()
    }, React.createElement("div", {
      style: {
        padding: "18px 20px 14px",
        borderBottom: "1px solid var(--brd)",
        display: "flex",
        alignItems: "flex-start",
        gap: 12
      }
    }, React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("div", {
      style: {
        fontFamily: "'Space Mono',monospace",
        fontWeight: 700,
        fontSize: 17,
        color: "var(--t1)",
        marginBottom: 6,
        lineHeight: 1.2
      }
    }, ex.name), React.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 5
      }
    }, catLabels.map((c, i) => React.createElement("span", {
      key: i,
      style: {
        fontSize: 10,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 10,
        background: getCatColor(c) + "22",
        color: getCatColor(c),
        border: "1px solid " + getCatColor(c) + "44",
        letterSpacing: "0.5px",
        textTransform: "uppercase"
      }
    }, c)))), React.createElement("button", {
      onClick: onClose,
      style: {
        background: "var(--bg3)",
        border: "none",
        borderRadius: 8,
        width: 32,
        height: 32,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }
    }, React.createElement("svg", {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "var(--t3)"
    }, React.createElement("path", {
      d: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
    })))), React.createElement("div", {
      style: {
        flex: 1,
        overflowY: "auto",
        padding: "0 20px 20px"
      }
    }, React.createElement("div", {
      style: {
        marginTop: 16,
        marginBottom: 16,
        borderRadius: 14,
        overflow: "hidden",
        background: "var(--bg3)",
        minHeight: 180,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative"
      }
    }, gif && !imgErr
      ? (isAnimated
          ? React.createElement("div", {
              style: { position: "relative", width: "100%", height: 220 }
            }, gif.slice(0, 2).map((src, i) =>
              React.createElement("img", {
                key: i,
                src: src,
                alt: ex.name,
                onError: () => setImgErr(true),
                style: {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: frame === i ? 1 : 0,
                  transition: "opacity 0.35s ease"
                }
              })
            ))
          : React.createElement("img", {
              src: gif,
              alt: ex.name,
              onError: () => setImgErr(true),
              style: {
                width: "100%",
                maxHeight: 260,
                objectFit: "cover",
                display: "block"
              }
            }))
      : React.createElement("div", {
      style: {
        padding: "32px 20px",
        textAlign: "center"
      }
    }, React.createElement("div", {
      style: {
        width: 64,
        height: 64,
        borderRadius: "50%",
        background: firstCatColor + "22",
        border: "2px dashed " + firstCatColor + "66",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 12px",
        fontSize: 28
      }
    }, "\uD83D\uDCAA"), React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--t3)",
        fontFamily: "'Space Mono',monospace"
      }
    }, L.exPreviewImgSoon))), !preview && React.createElement("div", {
      style: {
        padding: "16px",
        background: "var(--bg3)",
        borderRadius: 12,
        textAlign: "center",
        color: "var(--t3)",
        fontSize: 13
      }
    }, L.exPreviewNoContent), desc && React.createElement("div", {
      style: {
        marginBottom: 16
      }
    }, React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "1px",
        textTransform: "uppercase",
        color: "var(--t3)",
        marginBottom: 8,
        fontFamily: "'Space Mono',monospace"
      }
    }, L.exPreviewDesc), React.createElement("div", {
      style: {
        fontSize: 14,
        color: "var(--t2)",
        lineHeight: 1.65
      }
    }, desc)), tips && tips.length > 0 && React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "1px",
        textTransform: "uppercase",
        color: "var(--t3)",
        marginBottom: 8,
        fontFamily: "'Space Mono',monospace"
      }
    }, L.exPreviewTips), React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, tips.map((tip, i) => {
      const tipText = lang === "tr" ? tip[0] : tip[1];
      return React.createElement("div", {
        key: i,
        style: {
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          padding: "10px 12px",
          background: "var(--bg3)",
          borderRadius: 10,
          borderLeft: "3px solid " + firstCatColor
        }
      }, React.createElement("span", {
        style: {
          fontSize: 11,
          fontWeight: 700,
          color: firstCatColor,
          fontFamily: "'Space Mono',monospace",
          flexShrink: 0,
          paddingTop: 1
        }
      }, i + 1), React.createElement("span", {
        style: {
          fontSize: 13,
          color: "var(--t2)",
          lineHeight: 1.5
        }
      }, tipText));
    }))))));
  }

  // Defensive init — C1 ailesinin ortak pattern'i.
  window.LOGWISE_COMPONENTS = window.LOGWISE_COMPONENTS || {};
  window.LOGWISE_COMPONENTS.ExPreviewModal = ExPreviewModal;
})();
