# 02 — SYSTEM ARCHITECTURE

> Etiketler: `DOĞRULANDI` / `ÇIKARIM` / `BELİRSİZ` / `ESKİ OLABİLİR`. Kanıt = dosya + sembol.
> Diyagramlar Mermaid'dir; GitHub/VS Code Mermaid önizlemesinde render olur.

---

## 1. Üst düzey sistem haritası

```mermaid
flowchart TB
    subgraph Clients["İstemciler"]
        WEB["Web PWA<br/>app.html (monolit)<br/>React.createElement"]
        MOB["Mobil<br/>logwise-mobile/ (Expo/RN/TS)<br/>expo-router"]
    end

    subgraph Edge["Cloudflare / Netlify Edge"]
        STATIC["Statik hosting (Cloudflare)<br/>_redirects + _headers + wrangler.jsonc<br/>(netlify.toml = legacy)"]
        WORKER["Image Worker (upload)<br/>logwise-worker (R2)<br/>…workers.dev"]
        R2[("R2 bucket<br/>LOGWISE_IMAGES")]
    end

    subgraph Supabase["Supabase projesi hfmqywyfnqmpvskkzksv"]
        AUTH["Auth (/auth/v1)"]
        WEBTBL[("Web şeması<br/>profiles, user_data,<br/>user_prs, shared_workouts,<br/>follows, feedback")]
        APPTBL[("Mobil şeması<br/>app_workouts, app_sets,<br/>app_programs, app_program_days,<br/>app_day_meta, app_exercises,<br/>app_profiles")]
    end

    WEB -->|UMD supabase-js| AUTH
    WEB --> WEBTBL
    WEB -->|user_data blob| WEBTBL
    MOB -->|supabase-js + SecureStore| AUTH
    MOB --> APPTBL
    MOB -. "yalnız okuma: web kullanıcı tespiti" .-> WEBTBL
    WEB --> STATIC
    WEB -->|avatar/foto upload| WORKER
    MOB -->|avatar/foto upload| WORKER
    WORKER --> R2
    WORKER -. "token doğrula" .-> AUTH
```

`DOĞRULANDI` — `lib/db.js` (`SUPABASE_URL`, `sb.from(...)`); `app.html` (`.from("user_data")`);
`logwise-mobile/lib/supabase.ts` + `lib/data-bridge.ts` (`app_*`, `countWebUserData`);
`logwise-worker/src/worker.js` (`verifyWithSupabase`, `env.LOGWISE_IMAGES`); `netlify.toml`.

---

## 2. Web mimarisi (build'siz)

Web'in **derleme adımı yoktur**; tarayıcı dosyaları doğrudan yükler. Tüm yeniden-kullanılabilir
modüller `window.LOGWISE_*` global isim uzayında yaşar ve `app.html` içindeki `<script src>`
sırasıyla yüklenir. `DOĞRULANDI` — `AGENTS.md §3.1`, `app.html` script etiketleri.

```mermaid
flowchart LR
    subgraph apphtml["app.html (monolit SPA)"]
        ROOT["Root + App<br/>setView(): calendar/day/dashboard/<br/>exercises/programs/social/feedback/data"]
    end
    subgraph data["data/ (sabit veri)"]
        I18N["i18n-tr.js / i18n-en.js<br/>window.LOGWISE_TR/EN"]
        PRESETS["presets-exercises.js (generated)<br/>presets-programs.js (elle)"]
        GUIDES["ex-guides.js / ex-descriptions.js<br/>ex-preview.js / ex-images.js"]
        BADGES["badges.js"]
    end
    subgraph lib["lib/ (saf + DB)"]
        DB["db.js → window.LOGWISE_DB<br/>(Supabase client)"]
        SCHEMA["data-schema.js<br/>init() + migrateData()"]
        CALC["calc.js (1RM/hacim)"]
        EXU["exercise-utils.js"]
    end
    subgraph comp["components/ (React.createElement)"]
        AUTHS["auth-screen.js"]
        DASH["dash-chart.js"]
        EXMODAL["ex-preview-modal.js"]
        COMMENT["comment-section.js"]
    end
    ROOT --> data
    ROOT --> lib
    ROOT --> comp
    ROOT -->|debounced upsert| DB
    DB --> SUPA[("Supabase user_data")]
    ROOT -->|guest blob + tema + dil| LS[("localStorage<br/>gym-log-v3 guest ana veri,<br/>gym-log-theme, gym-log-lang,<br/>gym-timer, logwise-onboard-done")]
```

**Veri akışı (web):** Kullanıcı verisi tek nesnedir (`lib/data-schema.js` `init()` → 11 anahtar:
`exercises/workouts/programs/dailyPrograms/activeProgram/durations/measurements/dayNotes/
exerciseNotes/programMeta/badges`). **Authenticated** kullanıcıda bu nesne **yalnız** `user_data`
Supabase tablosuna **debounced upsert** ile yazılır (`app.html` `debouncedSave`); **oturumsuz
(guest)** kullanıcıda (`isGuest = !user`) aynı nesne `localStorage["gym-log-v3"]` (`SK`) blob'una
yazılır/okunur. Yüklemede `migrateData()` eski şemayı yükseltir. Ek olarak tema (`gym-log-theme`/`TK`)
ve dil (`gym-log-lang`/`LK`) tüm kullanıcılarda localStorage'da tutulur; `gym-timer` ve
`logwise-onboard-done` da kullanılır. `DOĞRULANDI` — `lib/data-schema.js`; `app.html` (`isGuest`,
`.from("user_data")`, `debouncedSave`, `localStorage[SK/TK/LK]`).

**Veri yolu ayrımı (özet — karıştırma!):**
- Web authenticated UI → `debouncedSave` → Supabase `user_data` (ana veri, online). `DOĞRULANDI`.
- Web guest (`isGuest = !user`) → `localStorage["gym-log-v3"]` (ana veri blob'u, ağsız). `DOĞRULANDI`.
- Web `localStorage` ayrıca → tema (`gym-log-theme`), dil (`gym-log-lang`), `gym-timer`, `logwise-onboard-done`. `DOĞRULANDI`.
- Mobil authenticated → `queries/*` → `data-bridge.ts` → Supabase `app_*`. `DOĞRULANDI`.
- Mobil guest → `data-bridge.ts` → `guest-storage.ts` (AsyncStorage, Supabase YOK). `DOĞRULANDI`.
- Mobil guest→authenticated → `migration.ts` `migrateGuestToAccount` (gerçek veri taşıma). `DOĞRULANDI`.
- Web kullanıcı tespiti → `countWebUserData` = `user_data` **sayımı** (veri aktarımı DEĞİL). `DOĞRULANDI`.

**Routing (repo-otoritatif Cloudflare config'ine göre):** `_redirects`'e göre `/app`,`/app/*` →
`app.html` (200) ve SPA route'ları `/social`, `/dashboard`, `/feedback`, `/data` → `app.html` (200);
**`/exercises` → `/library/exercises` (301)** ve **`/programs` → `/library/programs` (301)** (SEO
Library sayfalarına, app'e DEĞİL). React içinde `setView` ile view değişir. `DOĞRULANDI` —
`_redirects` (başlık "Cloudflare Pages"), `_headers`. **Not:** `netlify.toml` `/exercises`,`/programs`'ı
`app.html`'e yönlendirir ama bu config repo'da legacy görünür ve `_redirects` ile çelişir
(`ESKİ OLABİLİR`); canlı production platformu repodan kesinleşmez (`BELİRSİZ`).

---

## 3. Mobil mimari

```mermaid
flowchart TB
    subgraph router["expo-router (app/)"]
        ROOTL["_layout.tsx<br/>Gesture+SafeArea+Theme+Query+Toast+Bootstrap"]
        IDX["index.tsx → mode'a göre redirect"]
        AUTHG["(auth)/*: welcome/login/register/verify/forgot"]
        APPG["(app)/(tabs): calendar / workout / dashboard / social(gizli) / more"]
        DAY["calendar/day/[date].tsx"]
        PROG["program/[id]/edit.tsx"]
    end
    subgraph state["State"]
        AUTHSTORE["stores/auth-store.ts (zustand)<br/>mode: auth | guest | unknown"]
        QC["lib/query-client.ts (TanStack Query)"]
    end
    subgraph dataaccess["Veri erişimi"]
        QUERIES["queries/*.ts<br/>(workouts/programs/exercises/...)"]
        BRIDGE["lib/data-bridge.ts<br/>useDataCtx → mode dispatch"]
        SUPA["lib/supabase.ts (SecureStore)"]
        GUEST["lib/guest-storage.ts (AsyncStorage)"]
    end
    ROOTL --> IDX --> AUTHG
    IDX --> APPG --> DAY
    APPG --> PROG
    APPG --> QUERIES --> BRIDGE
    BRIDGE -->|mode=auth| SUPA --> DB[("app_* tablolar")]
    BRIDGE -->|mode=guest| GUEST --> AS[("AsyncStorage @logwise/guest/*")]
    AUTHSTORE --> BRIDGE
    QC --> QUERIES
```

**Önemli desen — mode-aware dispatch:** Her veri işlemi `useDataCtx()` ile mod (`auth`/`guest`)
çözer; `data-bridge.ts` içindeki her fonksiyon `ctx.mode === 'guest'` ise AsyncStorage'a, değilse
Supabase'e gider. Böylece `queries/*.ts` hook'ları mod kontrolü tekrarlamaz. `DOĞRULANDI` —
`logwise-mobile/lib/data-bridge.ts` (`useDataCtx`, `DataCtx`, tüm `fetch*/create*` fonksiyonları).

**Auth gating:** Root'ta değil, grup layout'larında (`(auth)/_layout.tsx`, `(app)/_layout.tsx`)
`Redirect` ile mod'a göre yapılır. `DOĞRULANDI` — `app/_layout.tsx` ("Auth gating bu seviyede DEĞIL").

**Oturum depolama:** Token'lar `expo-secure-store`'da (chunk'lı, 1800 byte parça), AsyncStorage'a
sızdırılmaz. `DOĞRULANDI` — `lib/supabase.ts` (`secureStorage`, `SECURE_CHUNK_SIZE`).

---

## 4. Ortak veri + codegen mimarisi

```mermaid
flowchart LR
    JSON1["data/presets-exercises.json<br/>(KANONİK)"]
    JSON2["data/ex-guides.json<br/>(KANONİK)"]
    GEN1["scripts/build-presets-exercises.js"]
    GEN2["scripts/build-ex-guides.js"]
    CHECK["scripts/check-codegen.js<br/>(--check drift kapısı)"]
    CI[".github/workflows/codegen-check.yml"]

    WEBO1["data/presets-exercises.js (web)"]
    MOBO1["logwise-mobile/data/generated/presets-exercises.ts"]
    WEBO2["data/ex-guides.js (web)"]
    MOBO2["logwise-mobile/data/generated/ex-content.ts"]

    JSON1 --> GEN1 --> WEBO1
    GEN1 --> MOBO1
    JSON2 --> GEN2 --> WEBO2
    GEN2 --> MOBO2
    GEN1 --- CHECK
    GEN2 --- CHECK
    CHECK --- CI
```

- **Tek kaynak → iki çıktı:** Bir generator hem web (`.js`, `window.LOGWISE_*`) hem mobil
  (`generated/*.ts`) üretir; `--check` modunda diske yazmadan farkı denetler. `DOĞRULANDI` —
  `scripts/build-presets-exercises.js` (`WEB_OUTPUT_PATH`, `MOBILE_OUTPUT_PATH`, `CHECK_MODE`).
- **Mobil wrapper'lar:** `logwise-mobile/data/presets-exercises.ts` ve `data/ex-descriptions.ts`
  generated dosyayı tip + yardımcıyla re-export eder (elle veri tutmaz). `DOĞRULANDI` — dosya
  başlıkları ("wrapper", "generated'dan türetilir").

---

## 5. Gerçekten ORTAK vs sadece BENZER (ayrı implementasyon)

| Yapı | Durum | Kanıt |
|---|---|---|
| `data/presets-exercises.json` | **GERÇEK ORTAK** (kanonik → codegen) | `build-presets-exercises.js` `DOĞRULANDI` |
| `data/ex-guides.json` | **GERÇEK ORTAK** (kanonik → codegen) | `build-ex-guides.js` `DOĞRULANDI` |
| `scripts/*` codegen | **GERÇEK ORTAK** (tek araç, iki hedef) | `check-codegen.js` `DOĞRULANDI` |
| `supabase_setup.sql` | **ORTAK dosya, AYRI şemalar** (web + `app_*` birlikte) | `AGENTS.md §4`, dosya `DOĞRULANDI` |
| **presets-programs** | **AYRI IMPLEMENTASYON** (web `.js` elle ↔ mobil `.ts` "port") | mobil başlık "Web ... port"; `check-codegen` kapsamı **dışında** `DOĞRULANDI` |
| **i18n** | **AYRI IMPLEMENTASYON** (web `data/i18n-*.js` ↔ mobil `data/i18n-*.ts`) | iki ayrı format, codegen yok `DOĞRULANDI` |
| **calc / 1RM** | **AYRI** (web `lib/calc.js` ↔ mobil `lib/calc.ts`) | iki dosya `DOĞRULANDI` |
| **exercise resolve** | **AYRI** (web `lib/exercise-utils.js` ↔ mobil `lib/exercise-resolve.ts`) | iki dosya `DOĞRULANDI` |
| **veri erişim katmanı** | **AYRI** (web `lib/db.js`+`app.html` ↔ mobil `data-bridge.ts`) | tablo adları bile farklı `DOĞRULANDI` |

> **Kural:** "Aynı kavram iki platformda da var" ≠ "ortak kod". Ortaklık yalnızca kanonik JSON +
> codegen hattındadır; geri kalan her şey paralel ve elle senkronlanır (ve bir kısmı drift riski
> taşır — bkz. presets-programs, i18n). `DOĞRULANDI`.

---

## 6. Dağıtım sınırları (özet — detay 08'de)

- `.assetsignore` mobil/iç kaynakların Cloudflare web asset deploy'una girmesini engeller.
  `DOĞRULANDI` — `AGENTS.md §3.2`, dosya mevcut.
- `master` = deploy dalı; web `web/work`, mobil `master` worktree'lerinde geliştirilir.
  `DOĞRULANDI` — `AGENTS.md §3.5`.
- SW cache adı her yeni statik dosyada bump edilmeli (`logwise-v49`). `DOĞRULANDI` — `sw.js`,
  `AGENTS.md §3.3`.
