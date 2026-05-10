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
//   chartHist         — [{date, maxW, avgVolPerSet, best1RM}, ...]
//   mode              — "weight" | "volume" | "onerm"
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
    lang
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
      const dataPoints = mode === "weight" ? chartHist.map(h => h.maxW) : mode === "volume" ? chartHist.map(h => h.avgVolPerSet) : chartHist.map(h => h.best1RM);
      const label = mode === "weight" ? L.dashWeight : mode === "volume" ? L.dashVolPerSet : L.dashEst1RM;
      const borderColor = mode === "weight" ? "#f0c040" : mode === "volume" ? "#8fbc8f" : "#d7aefb";
      const bgColor = mode === "weight" ? "rgba(240,192,64,0.1)" : mode === "volume" ? "rgba(143,188,143,0.1)" : "rgba(215,174,251,0.1)";
      const gridColor = theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
      const tickColor = theme === "dark" ? "#888" : "#666";
      chartInstanceRef.current = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: label + " (kg)",
            data: dataPoints,
            borderColor,
            backgroundColor: bgColor,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: borderColor,
            tension: 0.3,
            fill: true
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
              display: false
            },
            tooltip: {
              backgroundColor: theme === "dark" ? "#222" : "#fff",
              titleColor: theme === "dark" ? "#e0e0e0" : "#1a1a1a",
              bodyColor: theme === "dark" ? "#ccc" : "#333",
              borderColor: theme === "dark" ? "#333" : "#ddd",
              borderWidth: 1,
              cornerRadius: 8,
              padding: 10,
              displayColors: false,
              callbacks: {
                label: function (c) {
                  return label + ": " + c.parsed.y + " kg";
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
    }, [chartHist, mode, theme]);
    return React.createElement("canvas", {
      ref: chartRef,
      style: {
        width: "100%",
        height: 260
      }
    });
  }

  // Defensive init: namespace'i yoksa aç (C1-1/C1-2'nin pattern'i).
  window.LOGWISE_COMPONENTS = window.LOGWISE_COMPONENTS || {};
  window.LOGWISE_COMPONENTS.DashChart = DashChart;
})();
