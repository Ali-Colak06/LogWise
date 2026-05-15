# Current LogWise UI Audit

Date: 2026-05-14

Purpose: audit the current LogWise web UI as a source of truth for a future mobile design system. This is not the new design system and does not propose mobile app code.

Scope notes:
- Inspected actual repository files under `C:\Users\colak\Documents\LogWise`.
- No app, data, auth, Supabase, deployment, or business logic files were modified.
- There is no `package.json`, so there are no package scripts to run. `local-server.bat` is empty, and `local-server-mobile.bat` starts `python -m http.server 8080` after admin firewall setup.
- A temporary Node static server was used to verify local route serving for `/`, `/app`, `/app/dashboard`, `/profile`, `/share`, `/program`, and `/styles/base.css`. Full browser rendering was not available because the bundled Playwright package is missing `playwright-core`; no dependency was installed.

## 1. Project Structure Summary

LogWise is currently a static React 18 web/PWA repository with no build step. The core app is delivered through script tags and global namespaces.

Key entry files:
- `index.html` - public landing page. It contains its own CSS token set and currently uses JSX through Babel (`index.html:10-12`, `index.html:623`, `index.html:1344`).
- `app.html` - main product app shell. It loads React, Supabase, Chart.js, `data/*`, `lib/*`, shared components, and `styles/base.css` (`app.html:29-54`). This is the main source for product UI patterns.
- `profile.html` - profile, settings, stats, security, public profile, follow/share surfaces.
- `share.html` - shared workout detail and copy flow.
- `program.html` - shared program detail and copy flow.
- `404.html` - standalone minimal error page with hard-coded styles.

Supporting UI files:
- `styles/base.css` - shared reset, theme variables, font roles, accessibility helper, and shared animations (`styles/base.css:7-88`).
- `components/brand-mark.js` - reusable logo mark (`components/brand-mark.js:12-43`).
- `components/dash-chart.js` - Chart.js line chart wrapper (`components/dash-chart.js:17-133`).
- `components/ex-preview-modal.js` - exercise preview modal with media, category pills, tips (`components/ex-preview-modal.js:48-220`).
- `components/auth-screen.js` - login/register/reset modal (`components/auth-screen.js:177-241`, `components/auth-screen.js:304-378`).
- `components/comment-section.js` - social feed comments/replies/likes (`components/comment-section.js:24-80`, `components/comment-section.js:134-255`).

Routing and PWA:
- `netlify.toml` maps `/app` and `/app/*` to `app.html`, clean profile/share URLs to their HTML files, and legacy routes like `/dashboard`, `/exercises`, `/programs`, `/feedback`, and `/data` to `app.html`.
- `_redirects` also maps `/app/*` and legacy app routes to `app.html`.
- `manifest.json` sets `start_url` to `/app`, `display` to `standalone`, `background_color` to `#0a0a0a`, and `theme_color` to `#f0c040`.
- `sw.js` precaches app shell files and key scripts (`sw.js:1-35`).

## 2. Current UI/UX Summary

The product UX is calendar-first and workout-log-first. In `app.html`, the initial route resolves to views such as `calendar`, `day`, `dashboard`, `exercises`, `programs`, `feedback`, `data`, and `social` based on the URL (`app.html:200-210`).

Core flows:
- Calendar: month/week overview with day cells, workout indicators, and day navigation (`app.html:3986-4065`).
- Day logging: selected day view with exercise cards, set rows, previous-set references, notes, superset support, rest timer, share button, and add-exercise FAB (`app.html:4222-4325`, `app.html:4840-5238`, `app.html:5308-5340`).
- Dashboard: overview/progress/frequency/badge tabs with stats cards, charts, muscle frequency, and PR/badge mechanics (`app.html:3244-3338`).
- Exercises: exercise list and custom/preset add flow (`app.html:5444-5525`).
- Programs: weekly/daily program tabs, preset add, custom program management (`app.html:5991-6065`).
- Data: export/import and body measurement tabs (`app.html:6974-7045`).
- Social: leaderboard/feed/search tabs (`app.html:7401-7485`).
- Profile/share/program pages: narrower, card-based pages for profile stats/settings and shared workout/program copy actions.

The strongest product pattern is "log quickly, compare against last time, then use stats to reinforce progress." The UI is dense, practical, and training-session-oriented rather than decorative.

## 3. Existing Visual Identity

The brand direction is dark, minimal, premium, and gym/strength focused.

Brand signals:
- Logo asset `Site_Logo180.svg` is a black square (`#0A0A0A`) with a gold mark (`#F0C040`).
- `BrandMark` wraps the logo in a dark square with border and shadow (`components/brand-mark.js:18-31`).
- App loading state uses a dark background, gold wordmark, and gold loading bar (`app.html:88`).
- PWA theme color is gold (`manifest.json`).

Tone and feel:
- The landing page uses large editorial display type, gold highlights, dense analytics mockups, phone mockups, badge grids, and a performance-focused pitch (`index.html:67-140`, `index.html:196-324`).
- The app is more utilitarian: compact headers, dense forms, cards, tabs, charts, pills, timers, and data tables.
- Emoji are used heavily as quick visual shorthand in app navigation and actions (`app.html:2801`, `app.html:7401-7415`). This gives the app a friendly/practical feel but is less premium than the black/gold typography system.

## 4. Current Color Palette Found In The Code

Shared dark theme variables live in `styles/base.css:23-48`.

Dark base:
- `--bg: #0a0a0a` - page/app background.
- `--bg2: #111` - elevated surface.
- `--bg3: #1a1a1a` - secondary surface/input.
- `--bgH: #222` - hover surface.
- `--t1: #e0e0e0` - primary text.
- `--t2: #888` - secondary text.
- `--t3: #555` - tertiary/meta text.
- `--t4: #333` - disabled/low contrast.
- `--brd: #222`, `--brd2: #333` - borders.
- `--shadow: 0 2px 8px rgba(0,0,0,.6)`, `--shadow2: 0 1px 4px rgba(0,0,0,.4)`.

Primary accent:
- `--blue: #f0c040`, `--blueH: #ffd060`, `--blueL: #2a2210`, `--blueL2: #3a3218`.
- `--accent: #f0c040`, `--accentT: #000`.
- Note: the app calls the gold accent `blue`, probably from an older palette. Future mobile tokens should rename this semantically, for example `accent.gold`, while preserving compatibility in docs.

Semantic and category colors:
- `--green: #8fbc8f`, `--red: #ff6060`, `--orange: #ffa040`, `--purple: #d7aefb`, `--teal: #78d9ec`, `--ngreen: #39ff14`, `--sky: #4dabf7`, `--pink: #ff69b4`, `--amber: #ffb300`, `--lime: #aeea00`, `--indigo: #7c4dff`, `--coral: #ff7043`, `--violet: #ce93d8`.
- Each has a low-emphasis `L` variant for chip backgrounds (`styles/base.css:31-43`).
- Exercise category mapping uses these colors in `CC` (`app.html:119-134`).
- Set type color mapping uses `working -> blue`, `warmup -> orange`, `drop -> purple`, `superset -> indigo` (`app.html:174-179`).

Light theme:
- Defined under `[data-theme="light"]` in `styles/base.css:51-73`.
- It shifts to warm off-white surfaces (`#f5f2ec`, `#fff`, `#f0ede6`) with gold/brown accent (`#c8960a`).

Landing page palette:
- `index.html` defines separate variables: `--gold`, `--gold2`, `--gold-d`, `--goldL`, `--goldL2` plus similar dark/text colors (`index.html:14-29`).
- This is visually aligned with the app but not token-compatible with `styles/base.css`.

## 5. Current Typography/Font Usage

Font families:
- Body: `Inter`, system fallback (`styles/base.css:24`, `index.html:22`).
- Display: `Space Grotesk`, then Inter (`styles/base.css:25`, `index.html:23`).
- Mono/meta: `JetBrains Mono`, system monospace (`styles/base.css:26`, `index.html:24`).

Font roles:
- Shared role selectors assign display font to hero/section/card headings and mono font to tags, chart labels, legends, and dense stat rows (`styles/base.css:75-77`).
- Landing page uses very large display type: hero `84px`, section title `54px`, final CTA `100px` (`index.html:75`, `index.html:154`, `index.html:320`).
- Main app uses smaller utilitarian sizes: headers around `15-22px`, tab buttons around `13-14px`, inputs around `13-15px`, set row labels around `10-12px` (`app.html:2528-2619`, `app.html:8657-8736`).
- Timers and numeric performance data commonly use `JetBrains Mono` or display font with tabular/numeric feel (`app.html:2843-2851`, `app.html:4353-4359`, `index.html:180`).

Observation for mobile:
- Preserve the three-role typography model: body, display, mono/meta.
- Avoid copying the landing page's extreme hero sizes into app screens. Mobile logging screens should use app-scale typography, not marketing-scale type.

## 6. Current Component Patterns

The app uses a mix of extracted global components and local inline style objects.

Reusable extracted components:
- `BrandMark` - logo container with configurable size/padding/radius (`components/brand-mark.js:12-43`).
- `DashChart` - Chart.js wrapper with gold/green/purple series by mode (`components/dash-chart.js:38-43`).
- `ExPreviewModal` - full-screen overlay, centered modal, category chips, image/video-like exercise preview (`components/ex-preview-modal.js:85-220`).
- `AuthScreen` - centered auth modal with `BrandMark`, Google action, form fields, primary submit, error/info banners (`components/auth-screen.js:177-241`, `components/auth-screen.js:304-378`).
- `CommentSection` - feed comments with reply/edit/delete/like and guest read-only behavior (`components/comment-section.js:24-80`, `components/comment-section.js:134-255`).

Local style primitives:
- `app.html` has a shared `S` object for icon buttons, text buttons, select, primary/secondary buttons, inputs, table headers, FAB, overlay, and dialog (`app.html:8657-8780`).
- `profile.html`, `share.html`, and `program.html` each define their own local `S` objects with similar `card`, `pri`, `sec`, `inp`, and `ib` patterns (`profile.html:826-875`, `share.html:213-245`, `program.html:230-269`).

Repeated UI patterns:
- Primary buttons: gold background, black/white accent text, medium/bold weight.
- Secondary buttons: dark background, border, primary text.
- Icon buttons: circular, transparent, 40x40 base.
- Cards: dark elevated surface, 1px border, 12-16px radius, 20-24px padding, subtle shadow.
- Tabs/segmented controls: active state uses `var(--blueL)` background, `var(--blue)` text/border, usually pill radius.
- Inputs: `var(--bg2)` or `var(--bg3)`, 1px border, 8-10px radius, 8-16px padding.
- Chips/pills: category or status color as text plus low-emphasis background.
- Modals: dark overlay (`rgba(0,0,0,.5-.65)`), blur, centered card, `scaleIn` animation.
- Data-dense set rows: grid columns for set number, type, kg, reps, RIR, delete action (`app.html:5146-5238`).
- Floating actions: 56px circular FAB for adding exercise to a day (`app.html:5329-5335`, `app.html:8744-8758`).
- Timers: prominent mono digits, colored countdown, preset chips (`app.html:4334-4415`).

## 7. Current Layout Patterns

Global web app layout:
- `html, body, #root` are full-height with hidden overflow in `styles/base.css:9`; scrolling is mostly inside app-level containers.
- Main app header is 64px high, fixed at top of the app content area, with hamburger/menu, view title, route-specific controls, search, theme toggle, and language toggle (`app.html:2528-2647`).
- Desktop sidebar is fixed, 256px wide; mobile drawer is fixed, 288px wide with an overlay (`app.html:2736-2767`).
- Main content shifts with `marginLeft: 256` when desktop sidebar is open (`app.html:3084-3094`).

Content widths:
- Dashboard: max width 900 (`app.html:3304-3309`).
- Day view and social: max width 720 (`app.html:4237-4243`, `app.html:7401-7406`).
- Exercises, programs, data, feedback: max width 640 (`app.html:5444-5449`, `app.html:5991-5996`, `app.html:6974-6979`, `app.html:7241-7246`).
- Profile/share/program pages use centered narrow cards around max width 560 (`profile.html:2244-2254`, `share.html:526`, `program.html:438`).

Landing layout:
- `index.html` uses a `shell` max width of 1280 with 32px side padding (`index.html:40-42`).
- It uses large section bands, a two-column hero, feature showcase grids, program grids, chart strips, badge bands, phone mockups, quote section, and final CTA (`index.html:67-324`).

## 8. Mobile/Responsive Observations

Responsive logic exists both in CSS and JavaScript.

App mobile behavior:
- `app.html` treats `window.innerWidth <= 768` as mobile (`app.html:229-239`).
- On mobile, the sidebar becomes an overlay drawer and closes after navigation (`app.html:2736-2806`).
- Authenticated mobile users get a fixed bottom nav with five tabs: calendar, dashboard, exercises, programs, social (`app.html:7947-7990`).
- Bottom spacing uses `env(safe-area-inset-bottom)` constants to avoid overlapping FAB/bottom nav (`app.html:8653-8656`).
- The day view's set-entry grid is compressed on mobile (`app.html:5146-5170`), which preserves functionality but creates a very dense form.
- Calendar month cells reduce to `minmax(60px, auto)` and add bottom padding on mobile (`app.html:4008-4015`).

Landing responsive behavior:
- `index.html` uses `1024px` and `640px` breakpoints (`index.html:338-461`).
- The hero grid collapses to one column, nav links hide, CTAs become full-width, and feature/program grids become single-column on mobile (`index.html:362-455`).
- Later "mobile hotfix" rules hide the hero mockup entirely and heavily override phone mockup sizing with `!important` (`index.html:463-616`). This suggests mobile landing polish has been reactive rather than systematized.

Local verification:
- Temporary local route serving succeeded for `/`, `/app`, `/app/dashboard`, `/profile`, `/share`, `/program`, and `/styles/base.css`.
- Full visual screenshots were not captured because Playwright was unavailable without installing dependencies. This audit therefore relies on code inspection plus local route-serving verification.

## 9. Strengths Of The Current Design

- Strong dark premium base: black/near-black surfaces with gold accent are consistent and memorable.
- Clear product identity: strength training, PRs, streaks, charts, programs, badges, and fast logging are all visible in the UI.
- Practical logging UX: day cards, previous set references, compact set rows, RIR, set types, rest timer, and quick add patterns support gym-floor use.
- Data hierarchy: dashboard tabs, chart cards, muscle frequency, PR cards, and badges reinforce progress.
- Good token seeds: `styles/base.css` already contains colors, font roles, shadows, animations, and theme variants.
- Mobile awareness: app has mobile drawer, bottom nav, safe-area spacing, and mobile-specific grid compression.
- Bilingual foundation: app labels use TR/EN dictionaries in `data/i18n-tr.js` and `data/i18n-en.js`.
- Shareability/social layer: profile, shared workout/program, leaderboard, feed, comments, and copy flows create product loops beyond private logging.

## 10. Weaknesses Or Inconsistencies

- Styling is fragmented. `styles/base.css`, `index.html` inline CSS, `app.html` inline JS styles, and per-page `S` objects all define overlapping patterns.
- Token naming is confusing. The app's primary gold accent is named `--blue`, while landing uses `--gold`.
- Border radii vary widely without an explicit scale: 4, 6, 8, 10, 12, 14, 16, 20, 22, 24, 28, 38, 46, 56, 99, 999.
- Button styles vary by page. `app.html` primary buttons are 20px pills (`app.html:8705-8715`), while profile/share/program use 12px rounded rectangles (`profile.html:827-838`, `share.html:234-244`, `program.html:234-245`).
- Landing and app tech patterns diverge. `app.html` follows the no-build `React.createElement` model, while `index.html` and `landing_page_tr_localized.html` still load Babel and use JSX.
- Landing page has duplicate/legacy localized copies: `index.html` and `landing_page_tr_localized.html` appear visually similar, with separate inline CSS and Babel.
- Some comments are stale: `app.html` style comment refers to `index.html dashboard` even though it is in `app.html` (`app.html:55-57`).
- Mobile set-entry rows are very dense and may be difficult during an active workout, especially the type/kg/reps/RIR/delete grid (`app.html:5146-5238`).
- Bottom nav text is truncated with `l.slice(0, 6)` (`app.html:7986-7990`), which may harm clarity in Turkish and English.
- Heavy emoji usage works for speed but may conflict with a more premium native app feel.
- `404.html` does not use `styles/base.css`; it recreates the same colors and fonts manually (`404.html:14-22`).
- Exercise preview images are loaded by `app.html` through `data/ex-images.js` (`app.html:51`), but `sw.js` precache list shown in `sw.js:28-31` does not include that file. This may affect offline/first-load reliability of visual exercise previews.

## 11. What Should Be Preserved In The Mobile App

- Dark-first brand direction with black surfaces and gold primary action/accent.
- Logo treatment: gold mark on black, with a compact mark usable in app header/splash/icon contexts.
- Three-role typography system: Inter for body, Space Grotesk for brand/display/numbers, JetBrains Mono for metadata/timers/charts.
- Calendar-to-day logging mental model.
- Fast set entry with last-time comparison, set type, kg, reps, RIR, notes, and delete/reorder actions.
- Rest timer presets and visible countdown.
- Category/status chips with low-emphasis colored backgrounds.
- Dashboard reinforcement loops: PRs, streaks, volume, frequency, badges, and progress charts.
- Program support and workout-day/rest-day cues.
- Compact utility-first cards rather than marketing-style cards inside the app.
- Bottom navigation/safe-area awareness for mobile.
- Bilingual TR/EN structure.

## 12. What Should Be Improved For The Mobile App

- Define a mobile token layer with semantic names: `color.background`, `color.surface`, `color.surfaceRaised`, `color.accent.gold`, `color.text.primary`, `color.border.subtle`, etc.
- Rename or alias the current `--blue` gold token in mobile docs to avoid semantic confusion.
- Create a formal radius scale and button taxonomy before implementing native components.
- Design mobile-native set entry rather than directly compressing the web grid. Consider larger touch targets, numeric keypad flows, stepper actions, previous-set ghost values, and one-hand use.
- Replace some emoji navigation/action markers with a consistent icon set while preserving friendliness where it helps.
- Standardize cards, tabs, inputs, modals, chips, and toasts across app/profile/share/program flows.
- Decide whether the native app should support light mode from day one. The web has light tokens, but the brand identity is strongest in dark mode.
- Improve mobile navigation clarity: avoid text truncation; choose stable labels/icons for five core tabs.
- Document state colors for set types, muscle categories, success/error/warning/info, rest-day banners, and PR/badge events.
- Audit offline/media expectations early, especially exercise GIF/image previews and PWA-derived behavior.
- Build accessibility rules into the mobile system: contrast, focus/pressed states, touch target size, reduced motion, and readable dense tables.

## 13. Open Questions / Uncertain Findings

- Which surface is the highest source of truth for brand: the app (`app.html`) or landing (`index.html`)? The app is more practical; the landing is more polished/editorial.
- Should the mobile app be dark-only at launch, or include the existing light theme concept?
- How much of Social should be first-class in mobile navigation versus secondary/profile-driven?
- Should mobile preserve emoji as part of the LogWise voice, or migrate to a consistent icon library?
- Is `Space Grotesk` required in native, or should mobile use system fonts with similar hierarchy?
- Should exercise previews use the same GIF/image assets, or should mobile have optimized/native media assets?
- What are the must-have first mobile screens: calendar/day logging only, or dashboard/program/social too?
- Should landing-page visual patterns influence the native app, or only marketing materials?
- Are the current gold/black logo proportions final for mobile splash/app icon usage?
- What level of offline support is expected in the mobile app compared with the PWA?
