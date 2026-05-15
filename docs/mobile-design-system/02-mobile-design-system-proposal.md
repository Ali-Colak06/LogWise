# LogWise Mobile Design System Proposal

Date: 2026-05-14

Purpose: propose a concrete mobile design system direction for a future LogWise React Native + Expo + TypeScript app. This proposal is based on the current LogWise website audit in `docs/mobile-design-system/01-current-logwise-ui-audit.md`.

Scope:
- This is a design-system proposal, not implementation code.
- Do not treat token names as final TypeScript exports yet; they are written so they can later become React Native theme constants.
- Existing web app files should remain the source of truth until the mobile app is intentionally designed and built.

## 1. Design Direction

### Mobile App Feel

The mobile app should feel like a serious workout log that opens fast, stays readable in a gym, and makes set entry feel effortless. It should be dark, minimal, premium, practical, and a little competitive through PRs, streaks, badges, and progress stats.

The target feel is:

| Quality | Concrete Meaning |
|---|---|
| Dark-first | Black and near-black screens, low-glare surfaces, gold as the main action/accent. |
| Premium | Tight typography, restrained color, clean spacing, no noisy decoration. |
| Fast | Primary actions visible; common workout logging actions reachable with one hand. |
| Dense but legible | Preserve useful data density, but do not compress web tables directly into mobile. |
| Fitness-focused | PRs, sets, rest, programs, streaks, and muscle frequency stay visually central. |
| Calm | Animations should confirm action, not distract during a workout. |

### Preserve From Current Website

Preserve these current identity elements:
- Black/gold brand: current `#0a0a0a` background and `#f0c040` gold accent.
- Logo direction: gold mark on black, compact enough for app icon/header/splash.
- Dark elevated cards: `#111` and `#1a1a1a` surfaces with subtle borders.
- Three typography roles: body text, display/stat text, mono metadata/timers.
- Calendar-to-day mental model.
- Day logging primitives: exercise cards, previous set reference, set type, kg, reps, RIR, notes, rest timer.
- Progress reinforcement: dashboard stats, charts, PRs, streaks, badges, muscle frequency.
- Colored category/status chips.
- Bottom navigation and safe-area aware layout.

### Adjust For Mobile

Adjust these current web patterns:
- Rename the gold accent semantically. The web token `--blue` is actually gold; mobile should use `color.accent.gold`.
- Replace direct table compression with mobile-native set entry rows.
- Reduce emoji dependence. Use a consistent icon set later; emoji can remain in empty states or celebratory moments if the product wants that tone.
- Standardize radii, button styles, cards, tabs, inputs, and chips.
- Treat landing page visuals as marketing inspiration, not as app-screen layout.
- Do not copy the landing page's huge display sizes into mobile app screens.

## 2. Color System

Default theme should be dark. Light mode can be added later using the existing web light tokens as a reference, but MVP mobile should optimize dark mode first.

### Core Colors

| Token | Value | Source | Usage |
|---|---:|---|---|
| `color.background.app` | `#0A0A0A` | Web `--bg` | Main app background, splash background, root screen. |
| `color.background.elevated` | `#111111` | Web `--bg2` | Cards, bottom tab bar, modals, raised panels. |
| `color.background.subtle` | `#1A1A1A` | Web `--bg3` | Inputs, nested rows, inactive chips, calendar filled cells. |
| `color.background.hover` | `#222222` | Web `--bgH` | Pressed state approximation for native touch feedback. |
| `color.background.inverse` | `#F5F2EC` | Web light `--bg` | Rare inverse surfaces only; not MVP default. |

### Text Colors

| Token | Value | Usage |
|---|---:|---|
| `color.text.primary` | `#E0E0E0` | Primary labels, exercise names, screen headings. |
| `color.text.secondary` | `#888888` | Supporting text, labels, inactive nav text. |
| `color.text.tertiary` | `#555555` | Metadata, timestamps, empty hints, table headers. |
| `color.text.disabled` | `#333333` | Disabled icons/text and unavailable calendar days. |
| `color.text.onAccent` | `#000000` | Text/icons on gold primary buttons. |
| `color.text.onSuccessStrong` | `#FFFFFF` | Text on strong success fills when needed. |

### Border Colors

| Token | Value | Usage |
|---|---:|---|
| `color.border.subtle` | `#222222` | Card/input borders, list dividers. |
| `color.border.strong` | `#333333` | Active card borders, bottom tab top border, modal border. |
| `color.border.accent` | `#F0C040` | Selected tabs, selected calendar day, primary focus. |
| `color.border.danger` | `#FF6060` | Destructive confirmation fields/actions. |

### Accent Colors

| Token | Value | Usage |
|---|---:|---|
| `color.accent.gold` | `#F0C040` | Primary action, selected nav, selected tabs, brand mark, PR highlight. |
| `color.accent.goldHover` | `#FFD060` | Pressed/active highlight, celebratory shine. |
| `color.accent.goldMuted` | `#2A2210` | Selected tab background, active chip background. |
| `color.accent.goldMutedStrong` | `#3A3218` | Gold card border/background emphasis. |

Usage rules:
- Use gold for one primary action per screen.
- Use gold for selected navigation/tab state.
- Use gold for PRs, streaks, and brand moments.
- Do not use gold for every icon or every stat; it loses hierarchy.

### Semantic Colors

| Token | Value | Muted Token | Muted Value | Usage |
|---|---:|---|---:|---|
| `color.semantic.success` | `#8FBC8F` | `color.semantic.successMuted` | `#1A2A1A` | Saved workout, completed set, positive trend. |
| `color.semantic.danger` | `#FF6060` | `color.semantic.dangerMuted` | `#2A1515` | Errors, delete, last seconds of rest timer. |
| `color.semantic.warning` | `#FFA040` | `color.semantic.warningMuted` | `#2A2010` | Warm-up set, deload week, caution. |
| `color.semantic.info` | `#78D9EC` | `color.semantic.infoMuted` | `#1A2A2F` | Rest day banner, neutral info. |

### Workout Status Colors

| Token | Value | Usage |
|---|---:|---|
| `color.set.working` | `#F0C040` | Working set number, set-type selected state. |
| `color.set.warmup` | `#FFA040` | Warm-up sets. |
| `color.set.drop` | `#D7AEFB` | Drop sets. |
| `color.set.superset` | `#7C4DFF` | Superset connectors and chips. |

### Muscle/Category Colors

Keep the web category colors, but use them mostly in chips, tiny bars, and chart legends.

| Token | Value | Category |
|---|---:|---|
| `color.category.chest` | `#4DABF7` | Chest. Mobile adjustment: reserve gold for brand/primary actions instead of chest chips. |
| `color.category.back` | `#39FF14` | Back. |
| `color.category.shoulder` | `#FFA040` | Shoulder. |
| `color.category.biceps` | `#D7AEFB` | Biceps. |
| `color.category.triceps` | `#FF69B4` | Triceps. |
| `color.category.leg` | `#78D9EC` | Leg. |
| `color.category.core` | `#FF6060` | Core. |
| `color.category.cardio` | `#4DABF7` | Cardio. |
| `color.category.other` | `#8FBC8F` | Other. |

Rule: category colors should never compete with primary gold actions. Use muted backgrounds and small accents.

## 3. Typography System

Recommended approach:
- MVP: use platform system fonts for body if custom font loading slows app startup.
- Brand-rich version: reuse `Inter`, `Space Grotesk`, and `JetBrains Mono` through Expo font loading.
- If custom fonts are used, keep a system fallback path so workout logging never waits on decorative typography.

### Type Roles

| Role | Token | Size | Line Height | Weight | Font | Usage |
|---|---|---:|---:|---:|---|---|
| Title | `typography.title` | 28 | 34 | 700 | Space Grotesk | Large screen title, onboarding headline. |
| Screen Heading | `typography.screenHeading` | 22 | 28 | 700 | Space Grotesk or system | Calendar month, day title, dashboard title. |
| Section Heading | `typography.sectionHeading` | 17 | 22 | 600 | Inter/System | Card section title, form group title. |
| Body | `typography.body` | 15 | 21 | 400 | Inter/System | Normal text, list labels. |
| Body Strong | `typography.bodyStrong` | 15 | 21 | 600 | Inter/System | Exercise name, active tab label. |
| Caption | `typography.caption` | 12 | 16 | 500 | Inter/System | Supporting metadata, helper text. |
| Meta | `typography.meta` | 11 | 14 | 600 | JetBrains Mono | Dates, chart axes, set headers, tags. |
| Stat | `typography.stat` | 30 | 34 | 700 | Space Grotesk | PR values, streak count, dashboard metrics. |
| Timer | `typography.timer` | 36 | 42 | 700 | JetBrains Mono | Rest timer and workout timer. |
| Button | `typography.button` | 15 | 20 | 700 | Inter/System | Primary buttons. |

Rules:
- Use `typography.meta` sparingly for structured data; never use mono for long paragraphs.
- Use `typography.stat` only for important numeric values.
- Use `typography.title` on onboarding/empty states, not on dense workout entry rows.
- Keep button labels short enough for Turkish and English.

## 4. Spacing System

Use a 4-point spacing base with named tokens.

| Token | Value | Usage |
|---|---:|---|
| `space.none` | 0 | Reset. |
| `space.xs` | 4 | Tiny gaps, chip internal icon gap. |
| `space.sm` | 8 | Tight row gaps, compact buttons. |
| `space.md` | 12 | Input/card internal rhythm. |
| `space.lg` | 16 | Default screen horizontal padding, card padding. |
| `space.xl` | 20 | Section gap, medium card padding. |
| `space.2xl` | 24 | Large card padding, screen top spacing. |
| `space.3xl` | 32 | Major screen section gap. |
| `space.4xl` | 40 | Empty state vertical spacing. |

### Layout Rules

| Context | Token/Value |
|---|---:|
| Screen horizontal padding | `space.lg` / 16 |
| Large screen horizontal padding | `space.xl` / 20 |
| Card padding compact | `space.md` / 12 |
| Card padding default | `space.lg` / 16 |
| Card padding spacious | `space.xl` / 20 |
| Section vertical gap | `space.2xl` / 24 |
| Component internal gap | `space.sm` / 8 |
| Dense set-row gap | `space.xs` / 4 |
| Bottom tab height | 64 plus safe area |
| FAB bottom offset | bottom tab height plus `space.lg` |

Rules:
- Workout logging screens should prioritize vertical density but keep touch targets usable.
- No component should depend on exact English label length.
- Add bottom padding equal to `bottomTabHeight + safeAreaBottom + space.6` on tab screens.

## 5. Radius/Border System

The web uses many radii. Mobile should standardize them.

| Token | Value | Usage |
|---|---:|---|
| `radius.xs` | 4 | Tiny progress bars, mini calendar indicators. |
| `radius.sm` | 8 | Inputs inside dense rows, small controls. |
| `radius.md` | 12 | Buttons, chips, compact cards. |
| `radius.lg` | 16 | Default cards, modals, stat cards. |
| `radius.xl` | 20 | Large cards, workout cards. |
| `radius.full` | 999 | Pills, circular buttons, avatars. |

### Component Radius Rules

| Component | Radius | Border |
|---|---:|---|
| Cards | `radius.lg` | 1px `color.border.subtle`. |
| WorkoutCard | `radius.xl` | 1px subtle; 2px set/accent only when active. |
| Inputs | `radius.md` | 1px subtle; accent border on focus. |
| Primary Button | `radius.md` | No border. |
| Secondary Button | `radius.md` | 1px subtle. |
| Chips | `radius.full` | 1px matching muted/accent border when selected. |
| Calendar Day | `radius.md` | No border by default; selected uses gold border/fill. |
| Selected Calendar Date | `radius.full` for date number, `radius.md` for day cell. |
| Bottom Tab Bar | 0 top-level radius | 1px top border. |
| Modal Sheet | `radius.xl` top corners | 1px strong border. |

## 6. Core Mobile Components

These are conceptual component contracts for later React Native implementation.

### AppScreen

Purpose: standard root wrapper for all screens.

| Property | Proposal |
|---|---|
| Background | `color.background.app`. |
| Padding | Horizontal `space.4`; optional `paddingBottom` aware of bottom tabs. |
| Safe area | Always uses safe-area insets. |
| Scroll | Default scroll for content screens; fixed layout for active logging if needed. |
| Variants | `default`, `dense`, `centered`, `modal`. |

Rules:
- Never put a full screen inside a card.
- Use `dense` for Day Detail, not for onboarding/profile.

### AppHeader

Purpose: screen title and top actions.

| Slot | Usage |
|---|---|
| `left` | Back/menu/icon button. |
| `title` | Screen heading, single line when possible. |
| `subtitle` | Date/program context, optional. |
| `right` | Search, settings, theme, share, more. |

Rules:
- Height target: 56-64.
- Use icon buttons at 40x40.
- Avoid placing more than two right actions on narrow screens; overflow to more menu.

### AppButton

| Variant | Background | Text | Usage |
|---|---|---|---|
| `primary` | `color.accent.gold` | `color.text.onAccent` | Main action: add set, save workout, start. |
| `secondary` | `color.background.elevated` | `color.text.primary` | Cancel, back, neutral action. |
| `ghost` | Transparent | `color.text.secondary` | Low-emphasis inline action. |
| `danger` | `color.semantic.dangerMuted` | `color.semantic.danger` | Delete/destructive. |
| `success` | `color.semantic.success` | `color.text.onSuccessStrong` | Rare completed state. |

Sizing:
- `sm`: height 36, horizontal padding 12.
- `md`: height 44, horizontal padding 16.
- `lg`: height 52, horizontal padding 20.
- Minimum touch target: 44.

### AppInput

| Variant | Usage |
|---|---|
| `text` | Notes, exercise names, usernames. |
| `number` | Weight, reps, RIR, duration. |
| `search` | Exercise search, social search. |
| `textarea` | Feedback, workout notes. |

Rules:
- Background `color.background.subtle`.
- Border `color.border.subtle`; focused border `color.border.accent`.
- Placeholder `color.text.tertiary`.
- Numeric inputs should expose the numeric keyboard.
- Day logging numeric fields should preserve previous-set placeholder behavior.

### AppCard

| Variant | Usage |
|---|---|
| `default` | Settings/profile sections, dashboard cards. |
| `compact` | Set rows, mini stats, small summaries. |
| `interactive` | Exercise rows, program rows, tappable cards. |
| `highlight` | PR/streak/selected program. |

Rules:
- Default background `color.background.elevated`.
- Nested surfaces use `color.background.subtle`.
- One card level only; avoid card-inside-card unless the inner item is a true repeated row.

### EmptyState

| Slot | Usage |
|---|---|
| Icon | Brand/icon/optional emoji. |
| Title | Direct state: "No workouts yet". |
| Body | One sentence max. |
| Action | One primary button. |

Rules:
- Keep empty states actionable.
- Use gold only for action and optional icon accent.

### WorkoutCard

Purpose: day workout summary or shared workout preview.

Content:
- Date/day.
- Exercise count and total set count.
- PR/streak/badge markers if present.
- Primary action: open/log/continue.

Visual:
- `radius.xl`, `color.background.elevated`, subtle border.
- Left accent strip in gold if today's workout; category gradient only for exercise-level cards.

### ExerciseCard

Purpose: exercise block inside Day Detail.

Content:
- Exercise name.
- Category chips.
- Previous-set summary.
- Set rows.
- Actions: add set, rest, note, preview, history, more.

Rules:
- Header is tappable/collapsible on long days.
- Category colors are chips, not full-card backgrounds.
- Superset state uses `color.set.superset` connector and border.

### StatCard

Purpose: metric blocks for dashboard/profile.

Content:
- Label.
- Large stat.
- Delta or hint.

Visual:
- Stat value uses `typography.stat`.
- Gold only for primary metric; use green/warning/danger for trend or state.

### BottomTabBar

MVP tabs:
- Calendar
- Dashboard
- Exercises
- Programs
- Profile

Later/optional:
- Social can replace Profile only if social is a core MVP goal; otherwise put Social inside Profile or Dashboard entry points.

Rules:
- Do not truncate labels manually.
- Use icons plus full short labels.
- Active color `color.accent.gold`.
- Inactive color `color.text.secondary`.
- Background `color.background.elevated`.
- Height: 64 plus safe-area bottom.

### CalendarDay

States:
- `default`
- `today`
- `selected`
- `hasWorkout`
- `hasProgram`
- `restDay`
- `disabled`

Visual rules:
- Date number is always readable.
- Selected date: gold-muted cell plus gold date circle/border.
- Has workout: small gold dot or mini stacked indicators.
- Rest day: muted info/teal cue, never danger.
- Disabled: tertiary/disabled text and no action emphasis.

### SetRow

Purpose: mobile-native row for set entry.

Recommended structure:
- Row number/type chip.
- Weight input.
- Reps input.
- RIR selector.
- More/delete action.

Mobile adjustment:
- Do not directly copy the web's six-column dense grid.
- For compact mode, use two-line rows:
  - Line 1: set number, type, previous set.
  - Line 2: weight, reps, RIR, action.
- Use large enough inputs for sweaty/gym use.

## 7. Key Mobile Screens

### Calendar

Purpose: main home screen.

Layout:
- AppHeader with month title and quick Today action.
- Week/month toggle as segmented control.
- Calendar grid.
- Today's workout/program summary below grid.
- FAB or primary bottom action: add/log workout.

Preserve:
- Calendar-first model from web.
- Workout indicators and selected/today states.

Improve:
- Make day cells touch-friendly.
- Show only the most useful signals in cells; details go into Day Detail.

### Day Detail

Purpose: primary workout logging screen.

Layout:
- Sticky AppHeader with date and back/month control.
- Program/rest-day banner if relevant.
- Active rest timer card when running.
- ExerciseCard list.
- Sticky bottom action area or FAB: add exercise.

Key details:
- Previous-set references stay visible near each exercise.
- Rest presets are accessible without scrolling far.
- Share can live in header more menu or post-workout summary, not as a dominant action.

### Add Workout

Purpose: start or build a day workout.

Layout:
- Exercise search at top.
- Quick sections: program exercises, recent exercises, preset exercises, custom exercise.
- Multi-select option for adding several exercises.
- Primary action pinned bottom: add selected.

Rules:
- Search must be fast and forgiving.
- Category filters should be horizontal chips.
- Do not force users through a long form for common exercises.

### Exercise Select

Purpose: choose an exercise from owned + preset list.

Layout:
- Search input.
- Category chips.
- Exercise rows with name, category chips, recent PR/last used.
- Preview action.

Rules:
- Owned exercises first, presets second.
- Support Turkish/English names later according to app locale.

### Exercise Detail

Purpose: exercise history and guidance.

Layout:
- Header with exercise name and category chips.
- Preview media if available.
- Recent history.
- PR/stat summary.
- Notes.
- Tips/description.

Preserve:
- Exercise preview modal content model from web.

Improve:
- Make it a full screen or bottom sheet rather than a desktop-style centered modal.

### Dashboard Overview

Purpose: motivation and progress reinforcement.

Layout:
- Top stat row: streak, workouts, volume, latest PR.
- Progress chart card.
- Muscle frequency card.
- Recent PRs/badges card.

Rules:
- Dashboard is a review screen, not the logging screen.
- Use fewer cards than web per viewport; prioritize the next useful insight.

### Profile / Settings

Purpose: user identity, preferences, privacy, data, account.

Layout:
- Profile summary card.
- Stats/showcase section.
- Settings list: language, theme, privacy, data export/import, security.
- Social/followers entry points if included in MVP.

Rules:
- Keep destructive account actions isolated.
- Data/security actions should be clearly labeled and separated from everyday profile edits.

## 8. State Design

### Loading

| Token/Component | Proposal |
|---|---|
| `state.loading.background` | `color.background.app` |
| `state.loading.indicator` | Gold progress bar or spinner. |
| `state.loading.text` | `color.text.secondary` |

Rules:
- Use skeleton rows for lists after initial app load.
- Use brand loading only for launch/auth-boundary moments.

### Error

| Token/Component | Proposal |
|---|---|
| `state.error.background` | `color.semantic.dangerMuted` |
| `state.error.text` | `color.semantic.danger` |
| `state.error.border` | `color.semantic.danger` |

Rules:
- Error messages should say what happened and what the user can do.
- Do not use red for normal workout intensity; reserve it for errors/danger/countdown urgency.

### Empty State

Visual:
- Icon/mark at 40-56.
- Title with `typography.sectionHeading`.
- Body with `typography.body`.
- One primary action.

Examples:
- Calendar: "No workout logged today" + "Add Exercise".
- Dashboard: "No workouts yet" + "Log your first workout".
- Exercises: "No exercises yet" + "Add Exercise".

### Success

Visual:
- Short toast or inline confirmation.
- Success color for saved/completed.
- Gold can be used for PR/badge celebrations.

Rules:
- Save interactions should confirm quickly and disappear.
- PR/badge celebrations can be slightly stronger but should not block workout flow.

### Disabled States

| Token | Value |
|---|---|
| `state.disabled.background` | `color.background.subtle` |
| `state.disabled.text` | `color.text.disabled` |
| `state.disabled.border` | `color.border.subtle` |

Rules:
- Disabled controls remain visible but clearly unavailable.
- Explain why if the disabled action is important.

## 9. Design Rules

### Do

- Use dark backgrounds and gold primary actions consistently.
- Keep one main action per screen.
- Use the app UI as the interaction source of truth; use the landing page for brand mood only.
- Use cards for repeated items and focused panels.
- Use chips for set type, category, rest presets, tabs, and filters.
- Keep workout entry controls reachable with one hand.
- Keep previous-set data close to the current set input.
- Use safe-area spacing on all tab screens.
- Use semantic token names in new mobile docs and code.
- Validate Turkish and English labels before finalizing spacing.

### Avoid

- Do not copy the web's dense set grid directly into mobile.
- Do not use gold for every metric, chip, and icon.
- Do not create nested cards as the default layout.
- Do not truncate tab labels with fixed string slicing.
- Do not mix too many radius values.
- Do not rely on emoji as the only navigation language.
- Do not introduce a bright or unrelated color palette.
- Do not make dashboard/marketing visuals the first screen of the app.
- Do not hide critical workout actions behind deep menus.

### Consistency Rules

- Every screen uses `AppScreen`.
- Every screen title uses `AppHeader`.
- Every repeated surface uses `AppCard` unless it is a pure list row.
- Every primary action uses `AppButton` variant `primary`.
- Every text entry uses `AppInput`.
- Every selected state uses the same gold foreground/muted background pattern.
- Every destructive action uses danger color and confirmation.
- Every bottom-tab screen has bottom safe-area padding.

## 10. Recommended MVP Screen Design Order

Build the mobile design system in the order that protects the hardest product workflow first.

| Order | Screen/Area | Why First |
|---:|---|---|
| 1 | Foundations: colors, type, spacing, radius | Prevents token drift before components exist. |
| 2 | AppScreen, AppHeader, AppButton, AppInput, AppCard | Most screens depend on these primitives. |
| 3 | BottomTabBar | Defines mobile navigation and safe-area behavior. |
| 4 | Calendar | Current product starts from calendar; defines home rhythm. |
| 5 | Day Detail + ExerciseCard + SetRow | Core workout logging experience and highest UX risk. |
| 6 | Add Workout + Exercise Select | Supports the main logging flow. |
| 7 | Rest Timer + workout success states | Critical in-session utility and feedback. |
| 8 | Dashboard Overview + StatCard | Reinforces progress after logging works. |
| 9 | Exercise Detail | Adds guidance/history depth without blocking MVP logging. |
| 10 | Profile / Settings | Required for account/preferences, but after core workout loop. |
| 11 | Programs | Important product feature; can follow the base logging loop. |
| 12 | Social / Feed / Leaderboard | Valuable loop, but should not shape the first mobile navigation unless MVP strategy requires it. |

MVP recommendation:
- First design the loop `Calendar -> Day Detail -> Add Workout/Exercise Select -> SetRow -> Rest Timer -> Save/Success`.
- Then design `Dashboard Overview`.
- Then design `Profile / Settings`.

## Implementation Notes For Later

Potential React Native theme constant shape:

```ts
theme = {
  color: {
    background: { app, elevated, subtle, hover },
    text: { primary, secondary, tertiary, disabled, onAccent },
    border: { subtle, strong, accent, danger },
    accent: { gold, goldHover, goldMuted, goldMutedStrong },
    semantic: { success, successMuted, warning, warningMuted, danger, dangerMuted, info, infoMuted },
    set: { working, warmup, drop, superset },
    category: { chest, back, shoulder, biceps, triceps, leg, core, cardio, other }
  },
  typography: { title, screenHeading, sectionHeading, body, bodyStrong, caption, meta, stat, timer, button },
  space: { none, xs, sm, md, lg, xl, '2xl', '3xl', '4xl' },
  radius: { xs, sm, md, lg, xl, full }
}
```

Open decisions before implementation:
- Confirm whether custom fonts ship in MVP.
- Confirm whether Social is a bottom tab or secondary feature.
- Confirm final category color mapping, especially chest vs gold.
- Confirm light mode scope.
- Confirm whether exercise preview media is required in MVP.
