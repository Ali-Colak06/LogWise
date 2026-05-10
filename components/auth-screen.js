// LogWise — AuthScreen
// Refactor Aşama 2, Faz 2C-5 — login/register/şifre-sıfırlama modal'ı (Google OAuth + email/password).
// C1 (izole bileşenler) alt-adımının SON adımı.
// Faz 2D'de bridge prop'lar (sb, profileRoute, syncProfileRecord) kaldırıldı; artık window.LOGWISE_DB'den okunuyor.
// Bağımlılıklar (runtime'da çözülür):
//   - React (CDN, global)                                  — React.useState, React.createElement
//   - window.LOGWISE_TR / window.LOGWISE_EN                — i18n sözlükleri
//   - window.LOGWISE_PROFILE_UTILS.normalizeUsername       — kullanıcı adı normalize (Faz 2A'dan)
//   - window.LOGWISE_DB                                    — {sb, profileRoute, syncProfileRecord} (Faz 2D'den)
//   - window.LOGWISE_COMPONENTS.BrandMark                  — logo (Faz 2C-2'den)
// Props:
//   onLogin(user)                   — başarılı giriş callback'i
//   lang, setLang                   — dil state'i ve setter'ı (App'ten)
//   onClose                         — modal kapatma callback'i (opsiyonel; undefined ise X butonu yok)
// Kullanım: window.LOGWISE_COMPONENTS.AuthScreen
(function () {
  function AuthScreen({
    onLogin,
    lang,
    setLang,
    onClose
  }) {
    const TR = window.LOGWISE_TR;
    const EN = window.LOGWISE_EN;
    const { normalizeUsername } = window.LOGWISE_PROFILE_UTILS;
    const { sb, profileRoute, syncProfileRecord } = window.LOGWISE_DB;
    const { BrandMark } = window.LOGWISE_COMPONENTS;
    const L = lang === "tr" ? TR : EN;
    const [mode, setMode] = React.useState("login");
    const [email, setEmail] = React.useState("");
    const [pw, setPw] = React.useState("");
    const [name, setName] = React.useState("");
    const [pw2, setPw2] = React.useState("");
    const [uname, setUname] = React.useState("");
    const [err, setErr] = React.useState("");
    const [info, setInfo] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const switchMode = m => {
      setMode(m);
      setErr("");
      setInfo("");
    };
    const sub = async e => {
      e.preventDefault();
      setErr("");
      setInfo("");
      if (mode === "forgot") {
        if (!email) {
          setErr(lang === "tr" ? "E-posta adresini gir" : "Enter your email");
          return;
        }
        setBusy(true);
        try {
          const {
            error
          } = await sb.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + profileRoute() + "?reset=1"
          });
          if (error) {
            setErr(error.message);
            return;
          }
          setInfo(lang === "tr" ? "Şifre sıfırlama linki e-postana gönderildi!" : "Password reset link sent to your email!");
        } finally {
          setBusy(false);
        }
        return;
      }
      if (!email || !pw) return;
      if (mode === "register" && (!name || pw !== pw2)) {
        setErr(lang === "tr" ? "Bilgileri kontrol edin" : "Please check your info");
        return;
      }
      if (mode === "register") {
        if (!uname.trim()) {
          setErr(L.usernameRequired);
          return;
        }
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(uname.trim())) {
          setErr(L.usernameInvalid);
          return;
        }
      }
      setBusy(true);
      try {
        if (mode === "login") {
          const {
            data,
            error
          } = await sb.auth.signInWithPassword({
            email,
            password: pw
          });
          if (error) {
            setErr(lang === "tr" ? "E-posta veya şifre hatalı" : "Invalid email or password");
            return;
          }
          onLogin(data.user);
        } else {
          const uLower = normalizeUsername(uname);
          const {
            data: existing
          } = await sb.from("profiles").select("username").eq("username", uLower).maybeSingle();
          if (existing) {
            setErr(L.usernameTaken);
            return;
          }
          const {
            data,
            error
          } = await sb.auth.signUp({
            email,
            password: pw,
            options: {
              data: {
                full_name: name,
                username: uLower
              }
            }
          });
          if (error) {
            setErr(error.message);
            return;
          }
          if (data.user) {
            const {
              error: profileError
            } = await syncProfileRecord(data.user, {
              username: uLower,
              display_name: name,
              is_public: true
            });
            if (profileError && data.session) {
              setErr(profileError.message);
              return;
            }
          }
          if (data.session) {
            onLogin(data.user);
          } else {
            setInfo(lang === "tr" ? "Kayıt başarılı! E-postanı onaylayıp giriş yap. Spam kutunu da kontrol et." : "Registered! Please confirm your email, then log in. Also check your spam folder.");
            setMode("login");
          }
        }
      } finally {
        setBusy(false);
      }
    };
    const googleLogin = async () => {
      setBusy(true);
      try {
        const {
          error
        } = await sb.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) setErr(error.message);
      } finally {
        setBusy(false);
      }
    };
    const inputStyle = {
      background: "var(--bg3)",
      border: "1px solid var(--brd)",
      borderRadius: 10,
      padding: "12px 16px",
      color: "var(--t1)",
      fontSize: 14,
      fontFamily: "inherit",
      width: "100%",
      marginBottom: 12,
      transition: "border-color .2s ease"
    };
    return React.createElement("div", {
      style: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 300,
        animation: "fadeIn .2s ease"
      },
      onClick: onClose
    }, React.createElement("div", {
      style: {
        background: "var(--bg2)",
        borderRadius: 20,
        padding: "36px 32px 28px",
        width: "100%",
        maxWidth: 420,
        boxShadow: "0 8px 32px rgba(0,0,0,.4)",
        animation: "scaleIn .3s ease",
        position: "relative",
        border: "1px solid var(--brd)"
      },
      onClick: e => e.stopPropagation()
    }, onClose && React.createElement("button", {
      onClick: onClose,
      style: {
        position: "absolute",
        top: 14,
        right: 14,
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "var(--t3)",
        fontSize: 20,
        fontFamily: "inherit",
        lineHeight: 1
      }
    }, "\u2715"), React.createElement("div", {
      style: {
        textAlign: "center",
        marginBottom: 24
      }
    }, React.createElement(BrandMark, {
      size: 68,
      pad: 7,
      radius: 20,
      style: {
        margin: "0 auto 8px"
      }
    }), React.createElement("h1", {
      style: {
        fontFamily: "var(--font-display)",
        fontSize: 26,
        color: "var(--accent)",
        marginBottom: 4
      }
    }, "LOG WISE"), React.createElement("p", {
      style: {
        fontSize: 13,
        color: "var(--t2)"
      }
    }, mode === "login" ? L.login : mode === "register" ? L.register : lang === "tr" ? "Şifre Sıfırlama" : "Reset Password")), mode !== "forgot" && React.createElement("button", {
      onClick: googleLogin,
      disabled: busy,
      style: {
        width: "100%",
        padding: "11px",
        borderRadius: 10,
        border: "1px solid var(--brd)",
        background: "var(--bg3)",
        color: "var(--t1)",
        fontSize: 14,
        fontWeight: 500,
        cursor: busy ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        transition: "all .2s ease"
      },
      onMouseEnter: e => e.currentTarget.style.background = "var(--bgH)",
      onMouseLeave: e => e.currentTarget.style.background = "var(--bg3)"
    }, React.createElement("svg", {
      width: "18",
      height: "18",
      viewBox: "0 0 48 48"
    }, React.createElement("path", {
      fill: "#EA4335",
      d: "M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    }), React.createElement("path", {
      fill: "#4285F4",
      d: "M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    }), React.createElement("path", {
      fill: "#FBBC05",
      d: "M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    }), React.createElement("path", {
      fill: "#34A853",
      d: "M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    })), lang === "tr" ? "Google ile devam et" : "Continue with Google"), mode !== "forgot" && React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 16
      }
    }, React.createElement("div", {
      style: {
        flex: 1,
        height: 1,
        background: "var(--brd)"
      }
    }), React.createElement("span", {
      style: {
        fontSize: 12,
        color: "var(--t3)"
      }
    }, lang === "tr" ? "veya" : "or"), React.createElement("div", {
      style: {
        flex: 1,
        height: 1,
        background: "var(--brd)"
      }
    })), React.createElement("form", {
      onSubmit: sub
    }, mode === "register" && React.createElement("input", {
      type: "text",
      placeholder: L.fullname,
      value: name,
      onChange: e => setName(e.target.value),
      style: inputStyle
    }), mode === "register" && React.createElement("input", {
      type: "text",
      placeholder: "@" + L.usernamePlaceholder,
      value: uname,
      onChange: e => setUname(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20)),
      style: inputStyle,
      autoComplete: "off"
    }), React.createElement("input", {
      type: "email",
      placeholder: L.email,
      value: email,
      onChange: e => setEmail(e.target.value),
      style: inputStyle
    }), mode !== "forgot" && React.createElement("input", {
      type: "password",
      placeholder: L.password,
      value: pw,
      onChange: e => setPw(e.target.value),
      style: inputStyle
    }), mode === "register" && React.createElement("input", {
      type: "password",
      placeholder: L.confirmPw,
      value: pw2,
      onChange: e => setPw2(e.target.value),
      style: {
        ...inputStyle,
        marginBottom: 16
      }
    }), err && React.createElement("p", {
      style: {
        fontSize: 13,
        color: "var(--red)",
        textAlign: "center",
        marginBottom: 10,
        padding: "8px 12px",
        background: "var(--redL)",
        borderRadius: 8
      }
    }, err), info && React.createElement("p", {
      style: {
        fontSize: 13,
        color: "var(--green)",
        textAlign: "center",
        marginBottom: 10,
        padding: "8px 12px",
        background: "var(--greenL)",
        borderRadius: 8
      }
    }, info), React.createElement("button", {
      type: "submit",
      disabled: busy,
      style: {
        width: "100%",
        padding: "12px",
        borderRadius: 12,
        border: "none",
        background: busy ? "var(--t4)" : "var(--accent)",
        color: "var(--accentT)",
        fontSize: 15,
        fontWeight: 700,
        cursor: busy ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        marginBottom: 12,
        transition: "all .2s ease",
        boxShadow: busy ? "none" : "0 2px 8px rgba(240,192,64,.3)"
      }
    }, busy ? "..." : mode === "login" ? L.login : mode === "register" ? L.register : lang === "tr" ? "Sıfırlama Linki Gönder" : "Send Reset Link")), mode === "login" && React.createElement("p", {
      style: {
        fontSize: 12,
        textAlign: "center",
        color: "var(--t3)",
        marginBottom: 6
      }
    }, React.createElement("button", {
      onClick: () => switchMode("forgot"),
      style: {
        background: "none",
        border: "none",
        color: "var(--blue)",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12
      }
    }, lang === "tr" ? "Şifremi Unuttum" : "Forgot Password?")), mode === "forgot" && React.createElement("p", {
      style: {
        fontSize: 12,
        textAlign: "center",
        color: "var(--t3)",
        marginBottom: 6
      }
    }, React.createElement("button", {
      onClick: () => switchMode("login"),
      style: {
        background: "none",
        border: "none",
        color: "var(--blue)",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12
      }
    }, "\u2190 ", L.login)), React.createElement("p", {
      style: {
        fontSize: 13,
        textAlign: "center",
        color: "var(--t3)"
      }
    }, mode === "login" ? L.noAccount : mode === "register" ? L.hasAccount : "", " ", mode !== "forgot" && React.createElement("button", {
      onClick: () => switchMode(mode === "login" ? "register" : "login"),
      style: {
        background: "none",
        border: "none",
        color: "var(--blue)",
        cursor: "pointer",
        fontFamily: "inherit",
        textDecoration: "underline"
      }
    }, mode === "login" ? L.register : L.login)), React.createElement("div", {
      style: {
        textAlign: "center",
        marginTop: 14
      }
    }, React.createElement("button", {
      onClick: () => setLang(l => l === "tr" ? "en" : "tr"),
      style: {
        padding: "4px 16px",
        borderRadius: 6,
        border: "1px solid var(--brd)",
        background: "var(--bg)",
        color: "var(--t1)",
        fontSize: 12,
        cursor: "pointer",
        fontFamily: "inherit"
      }
    }, lang === "tr" ? "EN" : "TR"))));
  }

  // Defensive init — C1 ailesinin ortak pattern'i.
  window.LOGWISE_COMPONENTS = window.LOGWISE_COMPONENTS || {};
  window.LOGWISE_COMPONENTS.AuthScreen = AuthScreen;
})();
