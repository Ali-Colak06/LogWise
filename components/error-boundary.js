// LogWise — ErrorBoundary
// Refactor Aşama 2, Faz 2C-1 — index.html'in en dış React Error Boundary'si.
// Bağımlılıklar:
//   - React (CDN, global)            — React.Component, React.createElement
//   - localStorage                   — browser native (gym-log-lang okur)
// Kullanım: window.LOGWISE_COMPONENTS.ErrorBoundary
// Hata yakalanırsa TR/EN'e göre fallback ekran çizer; "Tekrar Dene" hata state'ini sıfırlar,
// "Sayfayı Yenile" location.reload() çağırır.
(function () {
  class ErrorBoundary extends React.Component {
    constructor(p) {
      super(p);
      this.state = {
        hasError: false,
        error: null,
        info: null
      };
    }
    static getDerivedStateFromError(e) {
      return {
        hasError: true,
        error: e
      };
    }
    componentDidCatch(e, info) {
      this.setState({
        info
      });
      console.error("ErrorBoundary:", e, info);
    }
    render() {
      if (!this.state.hasError) return this.props.children;
      const lang = localStorage.getItem("gym-log-lang") || "tr";
      const isTR = lang === "tr";
      return React.createElement("div", {
        style: {
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg,#0a0a0a)",
          color: "var(--t1,#e0e0e0)",
          padding: 24,
          textAlign: "center",
          fontFamily: "var(--font-body,'Inter',sans-serif)"
        }
      }, React.createElement("div", {
        style: {
          fontSize: 64,
          marginBottom: 16
        }
      }, "⚠️"), React.createElement("h2", {
        style: {
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 8
        }
      }, isTR ? "Bir şeyler ters gitti" : "Something went wrong"), React.createElement("p", {
        style: {
          fontSize: 13,
          color: "#888",
          marginBottom: 24,
          maxWidth: 400,
          lineHeight: 1.6
        }
      }, isTR ? "Uygulama beklenmeyen bir hata ile karşılaştı. Aşağıdaki butonları kullanarak kurtarabilirsiniz." : "The app encountered an unexpected error. Use the buttons below to recover."), this.state.error && React.createElement("details", {
        style: {
          marginBottom: 20,
          maxWidth: 500,
          textAlign: "left",
          background: "#111",
          border: "1px solid #333",
          borderRadius: 8,
          padding: 12,
          fontSize: 11,
          color: "#ff6060",
          wordBreak: "break-all"
        }
      }, React.createElement("summary", {
        style: {
          cursor: "pointer",
          marginBottom: 8,
          color: "#888"
        }
      }, isTR ? "Hata Detayı" : "Error Details"), React.createElement("pre", {
        style: {
          whiteSpace: "pre-wrap"
        }
      }, String(this.state.error)), this.state.info && React.createElement("pre", {
        style: {
          whiteSpace: "pre-wrap",
          marginTop: 8,
          color: "#666",
          fontSize: 10
        }
      }, this.state.info.componentStack)), React.createElement("div", {
        style: {
          display: "flex",
          gap: 10
        }
      }, React.createElement("button", {
        onClick: () => this.setState({
          hasError: false,
          error: null,
          info: null
        }),
        style: {
          padding: "10px 24px",
          borderRadius: 20,
          border: "none",
          background: "#f0c040",
          color: "#000",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit"
        }
      }, isTR ? "Tekrar Dene" : "Try Again"), React.createElement("button", {
        onClick: () => window.location.reload(),
        style: {
          padding: "10px 24px",
          borderRadius: 20,
          border: "1px solid #333",
          background: "#111",
          color: "#e0e0e0",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: "inherit"
        }
      }, isTR ? "Sayfayı Yenile" : "Reload Page")));
    }
  }

  // Defensive init: namespace'i yoksa aç. Sonraki bileşen dosyaları aynı pattern'i kullanacak.
  window.LOGWISE_COMPONENTS = window.LOGWISE_COMPONENTS || {};
  window.LOGWISE_COMPONENTS.ErrorBoundary = ErrorBoundary;
})();
