/**
 * Theme module — ThemeProvider + useTheme() hook
 *
 * Çözdüğü problem:
 *   - `useThemeStore`'daki mod (system/light/dark) + cihazın gerçek
 *     `Appearance.getColorScheme()` çıktısı birlikte değerlendirilip aktif
 *     `ColorPalette` belirlenir.
 *   - `mode === 'system'` → cihazın `Appearance`'i takip edilir; kullanıcı
 *     OS'tan dark mode'a geçince app da geçer (Appearance event listener).
 *   - `mode === 'light' | 'dark'` → cihazın değeri ne olursa olsun seçili tema
 *     uygulanır.
 *
 * API:
 *   <ThemeProvider>{children}</ThemeProvider>   — _layout.tsx en üstte
 *   const { tokens, colors, shadows, scheme, mode, setMode, cycleMode } = useTheme();
 *
 * `colors` = aktif şemanın `ColorPalette`'i (en sık kullanılan kestirme).
 * `shadows` = aktif şemanın shadow setidir.
 * `tokens` = sabit `tokens` objesi (spacing/radius/typography ortak).
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, type ColorSchemeName } from 'react-native';
import {
  colors as colorMap,
  shadows as shadowMap,
  tokens,
  type ColorPalette,
  type ColorScheme,
  type ShadowToken,
} from './tokens';
import { useThemeStore, type ThemeMode } from '../lib/theme-store';

export interface ThemeContextValue {
  /** Aktif şema (light | dark) — UI bunu kullanır */
  scheme: ColorScheme;
  /** Kullanıcının seçimi (system | light | dark) — toggle UI bunu gösterir */
  mode: ThemeMode;
  /** Aktif renk paleti — en sık kullanılan kestirme */
  colors: ColorPalette;
  /** Aktif shadow seti (light/dark) */
  shadows: typeof shadowMap.dark;
  /** Sabit token'lar — spacing/radius/typography */
  tokens: typeof tokens;
  /** Tema modunu doğrudan set et */
  setMode: (mode: ThemeMode) => void;
  /** system → light → dark → system döngüsü (More menü toggle) */
  cycleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  /**
   * Test/Storybook gibi durumlar için override (Appearance ve store devre dışı).
   */
  forceScheme?: ColorScheme;
}

/**
 * `Appearance.getColorScheme()` 'light' | 'dark' | null | undefined dönebilir.
 * `null` (henüz init olmamış) ve undefined → 'dark' (LogWise default — §8.5).
 */
function resolveSystemScheme(systemScheme: ColorSchemeName): ColorScheme {
  return systemScheme === 'light' ? 'light' : 'dark';
}

export function ThemeProvider({ children, forceScheme }: ThemeProviderProps) {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const cycleMode = useThemeStore((s) => s.cycleMode);

  // Appearance event listener — system tema değişirse re-render
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme(),
  );

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  const scheme: ColorScheme = forceScheme
    ? forceScheme
    : mode === 'system'
      ? resolveSystemScheme(systemScheme)
      : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({
      scheme,
      mode,
      colors: colorMap[scheme],
      shadows: shadowMap[scheme],
      tokens,
      setMode,
      cycleMode,
    }),
    [scheme, mode, setMode, cycleMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * useTheme() — UI component'ları aktif paletteyi buradan alır.
 * Provider yoksa fail-safe: dark palette + sabit token'lar (geliştirici sürprizi yok).
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx;
  // Fallback — ThemeProvider unutulursa veya test'te yoksa dark döner
  return {
    scheme: 'dark',
    mode: 'system',
    colors: colorMap.dark,
    shadows: shadowMap.dark,
    tokens,
    setMode: () => undefined,
    cycleMode: () => undefined,
  };
}

// Re-export token tipleri için kolay erişim
export { tokens } from './tokens';
export type {
  ColorPalette,
  ColorScheme,
  ShadowToken,
  TypographyVariant,
  TypographyToken,
  SpaceToken,
  RadiusToken,
  ShadowVariant,
} from './tokens';
