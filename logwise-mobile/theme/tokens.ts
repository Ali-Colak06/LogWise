/**
 * LogWise Mobile — Design Tokens (ADIM 3)
 *
 * Tek kaynak: web `styles/base.css` (:root = dark, [data-theme="light"] = light)
 * + `docs/mobile-design-system/02-mobile-design-system-proposal.md` §2-5.
 *
 * Kural: hardcode renk/size yasak — UI her zaman bu modülden import eder.
 * Component yazımı: `useTheme()` (theme/index.ts) aktif `ColorPalette`'i döner;
 * sabit kalan (spacing/radius/typography/shadow/motion) doğrudan `tokens` import edilir.
 */
import { Platform } from 'react-native';

// ============================================================================
// Renk paleti — light + dark ortak interface
// ============================================================================

export interface ColorPalette {
  // Background katmanları (en alt → en üst)
  background: {
    app: string;        // Ana ekran arka planı
    elevated: string;   // Card, modal, bottom tab
    subtle: string;     // Input, nested row, inactive chip
    hover: string;      // Press feedback
    inverse: string;    // Nadir inverse surfaces
  };
  // Metin renkleri
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    onAccent: string;        // Gold buton üstündeki metin
    onSuccessStrong: string; // Strong success fill üstündeki metin
  };
  // Sınırlar
  border: {
    subtle: string;
    strong: string;
    accent: string;
    danger: string;
  };
  // Marka aksanı (gold)
  accent: {
    gold: string;
    goldHover: string;
    goldMuted: string;
    goldMutedStrong: string;
  };
  // Semantic (durum)
  semantic: {
    success: string;
    successMuted: string;
    danger: string;
    dangerMuted: string;
    warning: string;
    warningMuted: string;
    info: string;
    infoMuted: string;
  };
  // Set tipleri (workout)
  set: {
    working: string;
    warmup: string;
    drop: string;
    superset: string; // MVP UI'da görünmez ama token kalır (§8.8)
  };
  // Kategori (chest/back/...)
  category: {
    chest: string;
    back: string;
    shoulder: string;
    biceps: string;
    triceps: string;
    leg: string;
    core: string;
    cardio: string;
    other: string;
  };
  // Kategori muted (chip background) — prototip --cat-*-muted token'larıyla eşleşir
  categoryMuted: {
    chest: string;
    back: string;
    shoulder: string;
    biceps: string;
    triceps: string;
    leg: string;
    core: string;
    cardio: string;
    other: string;
  };
  // Set tip muted (set-type chip background) — prototip --set-*-muted token'larıyla eşleşir
  setMuted: {
    working: string;
    warmup: string;
    drop: string;
    superset: string;
  };
  // Scroll indicator (RN'de doğrudan style yok ama ileride lazım olur)
  scroll: string;
}

// ---------- DARK (default) ---------- web :root
export const darkColors: ColorPalette = {
  background: {
    app:      '#0A0A0A',
    elevated: '#111111',
    subtle:   '#1A1A1A',
    hover:    '#222222',
    inverse:  '#F5F2EC',
  },
  text: {
    primary:         '#E0E0E0',
    secondary:       '#888888',
    tertiary:        '#555555',
    disabled:        '#333333',
    onAccent:        '#0A0A0A',
    onSuccessStrong: '#FFFFFF',
  },
  border: {
    subtle: '#222222',
    strong: '#333333',
    accent: '#F0C040',
    danger: '#FF6060',
  },
  accent: {
    gold:            '#F0C040',
    goldHover:       '#FFD060',
    goldMuted:       '#2A2210',
    goldMutedStrong: '#3A3218',
  },
  semantic: {
    success:      '#8FBC8F',
    successMuted: '#1A2A1A',
    danger:       '#FF6060',
    dangerMuted:  '#2A1515',
    warning:      '#FFA040',
    warningMuted: '#2A2010',
    info:         '#78D9EC',
    infoMuted:    '#1A2A2F',
  },
  set: {
    working:  '#F0C040',
    warmup:   '#FFA040',
    drop:     '#D7AEFB',
    superset: '#7C4DFF',
  },
  category: {
    chest:    '#4DABF7',
    back:     '#39FF14',
    shoulder: '#FFA040',
    biceps:   '#D7AEFB',
    triceps:  '#FF69B4',
    leg:      '#78D9EC',
    core:     '#FF6060',
    cardio:   '#4DABF7',
    other:    '#8FBC8F',
  },
  // Prototip --cat-*-muted: chip background — koyu, doygun değil
  categoryMuted: {
    chest:    '#0D1F33',
    back:     '#0A2A05',
    shoulder: '#2A2010',
    biceps:   '#2A1A3A',
    triceps:  '#2A0F1F',
    leg:      '#1A2A2F',
    core:     '#2A1515',
    cardio:   '#0D1F33',
    other:    '#1A2A1A',
  },
  // Prototip --set-*-muted: set-type chip background
  setMuted: {
    working:  '#2A2210',
    warmup:   '#2A2010',
    drop:     '#2A1A3A',
    superset: '#1A0F3A',
  },
  scroll: '#333333',
};

// ---------- LIGHT ---------- web [data-theme="light"]
export const lightColors: ColorPalette = {
  background: {
    app:      '#F5F2EC',
    elevated: '#FFFFFF',
    subtle:   '#F0EDE6',
    hover:    '#E8E4DC',
    inverse:  '#0A0A0A',
  },
  text: {
    primary:         '#1A1A1A',
    secondary:       '#666666',
    tertiary:        '#999999',
    disabled:        '#CCCCCC',
    onAccent:        '#FFFFFF',
    onSuccessStrong: '#FFFFFF',
  },
  border: {
    subtle: '#D0CDC6',
    strong: '#BBB8B0',
    accent: '#C8960A',
    danger: '#D44040',
  },
  accent: {
    gold:            '#C8960A',
    goldHover:       '#A07808',
    goldMuted:       '#F5ECD0',
    goldMutedStrong: '#E8DFC0',
  },
  semantic: {
    success:      '#2D7A2D',
    successMuted: '#EDF5ED',
    danger:       '#D44040',
    dangerMuted:  '#FCE8E6',
    warning:      '#E37400',
    warningMuted: '#FEF7E0',
    info:         '#007B83',
    infoMuted:    '#E4F7FB',
  },
  set: {
    working:  '#C8960A',
    warmup:   '#E37400',
    drop:     '#9334E6',
    superset: '#5C6BC0',
  },
  category: {
    chest:    '#1971C2',
    back:     '#1DB805',
    shoulder: '#E37400',
    biceps:   '#9334E6',
    triceps:  '#C2185B',
    leg:      '#007B83',
    core:     '#D44040',
    cardio:   '#1971C2',
    other:    '#2D7A2D',
  },
  // Light tema chip background — kategori rengi + alpha (~ %12)
  categoryMuted: {
    chest:    '#E4F0FB',
    back:     '#E5FAE0',
    shoulder: '#FEF0DC',
    biceps:   '#F3E6FB',
    triceps:  '#FBE3EE',
    leg:      '#DFF2F4',
    core:     '#FCE8E6',
    cardio:   '#E4F0FB',
    other:    '#E2F0E2',
  },
  setMuted: {
    working:  '#F8EFD3',
    warmup:   '#FEF0DC',
    drop:     '#F3E6FB',
    superset: '#E0E3F2',
  },
  scroll: '#D0CDC6',
};

export const colors = {
  light: lightColors,
  dark:  darkColors,
} as const;

export type ColorScheme = keyof typeof colors;

// ============================================================================
// Typography — §3 (02-mobile-design-system-proposal.md)
// ============================================================================
// Hibrit shipping (§2 03-mvp): Inter bundle'da yüklenecek (ADIM 4'te `expo-font`);
// Space Grotesk + JetBrains Mono = system fallback. Bu token'lar font yüklenmeden
// önce de güvenle render eder (system fonts).
//
// React Native font ailesi:
//   - iOS: system font alma kuralı, fontFamily key tanımlı değilse SF varsayılan
//   - Android: 'sans-serif', 'monospace', 'serif' aliases
// `expo-font` Inter yüklenince fontFamily: 'Inter' kullanılır.
// MVP'de fontFamily UNDEFINED bırakılır → system fallback → ADIM 4'te aktive.

type FontWeight =
  | 'normal' | 'bold'
  | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

export interface TypographyToken {
  fontSize: number;
  lineHeight: number;
  fontWeight: FontWeight;
  fontFamily?: string;       // undefined → system fallback (MVP-safe)
  letterSpacing?: number;
}

export const typography = {
  title:          { fontSize: 28, lineHeight: 34, fontWeight: '700' } as TypographyToken,
  screenHeading:  { fontSize: 22, lineHeight: 28, fontWeight: '700' } as TypographyToken,
  sectionHeading: { fontSize: 17, lineHeight: 22, fontWeight: '600' } as TypographyToken,
  body:           { fontSize: 15, lineHeight: 21, fontWeight: '400' } as TypographyToken,
  bodyStrong:     { fontSize: 15, lineHeight: 21, fontWeight: '600' } as TypographyToken,
  caption:        { fontSize: 12, lineHeight: 16, fontWeight: '500' } as TypographyToken,
  meta:           { fontSize: 11, lineHeight: 14, fontWeight: '600' } as TypographyToken,
  stat:           { fontSize: 30, lineHeight: 34, fontWeight: '700' } as TypographyToken,
  timer:          { fontSize: 36, lineHeight: 42, fontWeight: '700' } as TypographyToken,
  button:         { fontSize: 15, lineHeight: 20, fontWeight: '700' } as TypographyToken,
} as const;

export type TypographyVariant = keyof typeof typography;

// Font family rolleri — Text component'ı veya inline style tarafından kullanılır.
// ADIM 4: Inter `@expo-google-fonts/inter` paketi üzerinden yükleniyor.
// `_layout.tsx`'te `useFonts({ Inter_400Regular, Inter_600SemiBold, ... })` çağrısı
// fontları aktive eder. Yüklenmeden önce RN otomatik system font'a düşer (graceful).
//
// Display + mono: hala system fallback (Space Grotesk + JetBrains Mono ship'lenmedi —
// hibrit strategy, §2 03-mvp). iOS'ta SF Pro / SF Mono, Android'de Roboto / Roboto Mono.
//
// NOT: Inter weight'ları RN tarafında ayrı font ailesi olarak kayıtlı; `fontWeight`
// otomatik mapping çalışmaz. Bu yüzden `Text` component'ı variant'a göre uygun
// `Inter_*` adını seçer (örn. screenHeading → Inter_700Bold). Buradaki `body` =
// default regular.
// ADIM 8: Space Grotesk + JetBrains Mono Google Fonts paketleri eklendi
// (`@expo-google-fonts/space-grotesk`, `@expo-google-fonts/jetbrains-mono`).
// `_layout.tsx` useFonts'a kayıt edildiklerinde aktif olur. Font yüklenmeden
// önce RN system fallback'e düşer.
export const fonts = {
  body:        'Inter_400Regular' as string | undefined,
  bodyMedium:  'Inter_500Medium' as string | undefined,
  bodyStrong:  'Inter_600SemiBold' as string | undefined,
  bodyBold:    'Inter_700Bold' as string | undefined,
  bodyHeavy:   'Inter_800ExtraBold' as string | undefined,
  display:        'SpaceGrotesk_500Medium' as string | undefined,
  displayStrong:  'SpaceGrotesk_600SemiBold' as string | undefined,
  displayBold:    'SpaceGrotesk_700Bold' as string | undefined,
  mono:           'JetBrainsMono_400Regular' as string | undefined,
  monoStrong:     'JetBrainsMono_600SemiBold' as string | undefined,
  monoBold:       'JetBrainsMono_700Bold' as string | undefined,
} as const;

// ============================================================================
// Spacing — 4pt grid (§4)
// ============================================================================
// İki erişim biçimi: semantic ad (sm/md/lg...) + numeric step (1=4, 2=8, ...).
// `space[1]` = 4px = `space.xs`. Component'lar her ikisini de kullanabilir.

export const space = {
  none: 0,
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  // Numeric step (4pt grid)
  0:  0,
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  7:  28,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export type SpaceToken = keyof typeof space;

// ============================================================================
// Radius — §5
// ============================================================================

export const radius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  full: 999,
} as const;

export type RadiusToken = keyof typeof radius;

// ============================================================================
// Shadow — RN-uyumlu (iOS shadowColor/offset/opacity/radius + Android elevation)
// ============================================================================

export interface ShadowToken {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number; // Android
}

// Dark theme shadow (siyah, daha yüksek opacity)
export const shadowsDark = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ShadowToken,
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 2,
  } as ShadowToken,
  // Prototip --shadow-card: büyük dramatik shadow (phone shell + featured cards)
  cardLarge: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 10,
  } as ShadowToken,
  // Prototip --shadow-cta: gold halo CTA buton
  cta: {
    shadowColor: '#F0C040',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  } as ShadowToken,
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  } as ShadowToken,
} as const;

// Light theme shadow (siyah, daha düşük opacity)
export const shadowsLight = {
  none: shadowsDark.none,
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  } as ShadowToken,
  cardLarge: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 8,
  } as ShadowToken,
  cta: {
    shadowColor: '#C8960A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  } as ShadowToken,
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  } as ShadowToken,
} as const;

export const shadows = {
  light: shadowsLight,
  dark:  shadowsDark,
} as const;

export type ShadowVariant = keyof typeof shadowsDark;

// ============================================================================
// Motion — duration + easing (Reanimated/Animated için kullanılabilir)
// ============================================================================

export const duration = {
  instant: 0,
  fast:    150,
  normal:  250,
  slow:    400,
  slower:  600,
} as const;

// Easing curves — Reanimated `Easing.bezier(...)` veya Animated.timing easing
// karşılıklarına çevrilebilir cubic-bezier kontrol noktaları.
export const easing = {
  standard:    [0.4, 0.0, 0.2, 1] as const, // material standard
  decelerate:  [0.0, 0.0, 0.2, 1] as const, // ease-out
  accelerate:  [0.4, 0.0, 1.0, 1] as const, // ease-in
  sharp:       [0.4, 0.0, 0.6, 1] as const,
} as const;

export type EasingToken = keyof typeof easing;

// ============================================================================
// Z-Index — overlay/modal/toast sırası (RN'de Stack ordering yedeği)
// ============================================================================

export const zIndex = {
  base:    0,
  card:    10,
  header:  20,
  overlay: 30,
  modal:   40,
  sheet:   50,
  toast:   60,
} as const;

// ============================================================================
// Layout sabitleri — (§4 Layout Rules)
// ============================================================================

export const layout = {
  bottomTabHeight: 64,            // §4 — alt safe area hariç
  appBarHeight:    56,            // §6 AppHeader 56-64
  minTouchTarget:  44,            // §6 AppButton minimum
  screenHPadding:  space.lg,      // 16
  buttonHeight: {
    sm: 36,
    md: 44,
    lg: 52,
  },
  buttonHPadding: {
    sm: space.md, // 12
    md: space.lg, // 16
    lg: space.xl, // 20
  },
} as const;

// ============================================================================
// Default export — birleşik tokens objesi
// ============================================================================

export const tokens = {
  colors,
  typography,
  fonts,
  space,
  radius,
  shadows,
  duration,
  easing,
  zIndex,
  layout,
} as const;

export type Tokens = typeof tokens;

export default tokens;
