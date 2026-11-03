// LogWise — DashChart
// Refactor Aşama 2, Faz 2C-3 — index.html'in dashboard görünümündeki Chart.js line chart bileşeni.
// Bağımlılıklar (başka script tag'lerinde ÖNCEDEN yüklenmiş olmalı):
//   - React (CDN, global)              — React.useEffect, React.createElement
//   - Chart (chart.js CDN, global)     — new Chart(ctx, config)
//   - window.LOGWISE_CALC              — pD (parse date) runtime'da çözülür
// Kullanım: window.LOGWISE_COMPONENTS.DashChart
// Props:
//   chartRef          — React ref, <canvas> elementine bağlanır
//   chartInstanceRef  — React ref, Chart.js örneğini tutar (destroy için)
//   chartHist         — [{date, maxW, avgVolPerSet, best1RM, vol?, maxReps?}, ...]
//   height            — opsiyonel piksel yükseklik (varsayılan 260)
//   unit              — opsiyonel "kg" | "lb" (Faz 5 / C6; veri çağıran tarafta çevrilmiş gelir)
//   mode              — "weight" | "volume" | "onerm" | "totalvol" | "reps" (Faz 4 / E1)
//   theme             — "dark" | "light"
//   L                 — i18n sözlüğü (L.dashWeight, L.dashVolPerSet, L.dashEst1RM)
//   lang              — "tr" | "en" (şu an kullanılmıyor ama API tutarlılığı için tutuluyor)
(function () {
  function DashChart({
    chartRef,
    chartInstanceRef,
    chartHist,
    mode,
    theme,
    L,
    lang,
    height,
    unit: unitProp
  }) {
    React.useEffect(() => {
      if (!chartRef.current || !chartHist.length) return;
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      const { pD } = window.LOGWISE_CALC;
      const ctx = chartRef.current.getContext("2d");
      const labels = chartHist.map(h => {
        const d = pD(h.date);
        return d.getDate() + "/" + (d.getMonth() + 1);
      });
      // Faz 4 / E1: "totalvol" (seans toplam hacmi) ve "reps" (en çok tekrar — vücut ağırlığı hareketleri) modları
      const dataPoints = mode === "bw" ? chartHist.map(h => h.bw) : mode === "weight" ? chartHist.map(h => h.maxW) : mode === "volume" ? chartHist.map(h => h.avgVolPerSet) : mode === "totalvol" ? chartHist.map(h => h.vol) : mode === "reps" ? chartHist.map(h => h.maxReps) : chartHist.map(h => h.best1RM);
      const label = mode === "bw" ? L.bwDaily : mode === "weight" ? L.dashWeight : mode === "volume" ? L.dashVolPerSet : mode === "totalvol" ? L.dashTotalVolShort : mode === "reps" ? L.dashMaxReps : L.dashEst1RM;
      const unit = mode === "reps" ? "" : " " + (unitProp || "kg"); // Faz 5 / C6: kg | lb
      const borderColor = mode === "weight" ? "#f0c040" : mode === "volume" || mode === "totalvol" ? "#8fbc8f" : mode === "reps" ? "#78d9ec" : "#d7aefb";
      const bgColor = mode === "weight" ? "rgba(240,192,64,0.1)" : mode === "volume" || mode === "totalvol" ? "rgba(143,188,143,0.1)" : mode === "reps" ? "rgba(120,217,236,0.1)" : "rgba(215,174,251,0.1)";
      const gridColor = theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
      const tickColor = theme === "dark" ? "#888" : "#666";
      // Faz 5 / E5: "bw" modu — günlük vücut ağırlığı noktaları + 7 günlük ortalama çizgisi
      const extra = mode === "bw" ? [{
        label: L.bwAvg7,
        data: chartHist.map(h => h.avg),
        borderColor: "#78d9ec",
        backgroundColor: "transparent",
        borderWidth: 2.5,
        pointRadius: 0,
        tension: 0.35,
        fill: false
      }] : [];
      chartInstanceRef.current = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [...extra, {
            label: label + (unit ? " (" + unit.trim() + ")" : ""),
            data: dataPoints,
            borderColor,
            backgroundColor: bgColor,
            borderWidth: mode === "bw" ? 0 : 2,
            showLine: mode !== "bw",
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: borderColor,
            tension: 0.3,
            fill: mode !== "bw"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: "index"
          },
          plugins: {
            legend: {
              display: mode === "bw",
              labels: {
                color: theme === "dark" ? "#aaa" : "#555",
                boxWidth: 12,
                font: {
                  size: 11
                }
              }
            },
            tooltip: {
              backgroundColor: theme === "dark" ? "#222" : "#fff",
              titleColor: theme === "dark" ? "#e0e0e0" : "#1a1a1a",
              bodyColor: theme === "dark" ? "#ccc" : "#333",
              borderColor: theme === "dark" ? "#333" : "#ddd",
              borderWidth: 1,
              cornerRadius: 8,
              padding: 10,
              displayColors: mode === "bw",
              callbacks: {
                label: function (c) {
                  return (c.dataset.label || label).replace(/ \((kg|lb)\)$/, "") + ": " + c.parsed.y + unit;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                color: gridColor
              },
              ticks: {
                color: tickColor,
                font: {
                  size: 10,
                  family: "'JetBrains Mono',ui-monospace,monospace"
                },
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 8
              }
            },
            y: {
              grid: {
                color: gridColor
              },
              ticks: {
                color: tickColor,
                font: {
                  size: 10,
                  family: "'JetBrains Mono',ui-monospace,monospace"
                }
              },
              beginAtZero: false
            }
          }
        }
      });
      return () => {
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
          chartInstanceRef.current = null;
        }
      };
    }, [chartHist, mode, theme, unitProp]);
    return React.createElement("canvas", {
      ref: chartRef,
      style: {
        width: "100%",
        height: height || 260
      }
    });
  }

  // Defensive init: namespace'i yoksa aç (C1-1/C1-2'nin pattern'i).
  window.LOGWISE_COMPONENTS = window.LOGWISE_COMPONENTS || {};
  window.LOGWISE_COMPONENTS.DashChart = DashChart;
})();
