/**
 * Text — typography token uygulayan RN.Text wrapper.
 *
 * Kullanım:
 *   <Text variant="screenHeading">Hareketler</Text>
 *   <Text variant="body" color="secondary">Açıklama satırı</Text>
 *   <Text variant="meta" font="mono">12:34</Text>
 *
 * - `variant` typography token'ını seçer (§3 02-design-system).
 * - `color` aktif `ColorPalette.text` keyleri ile sınırlıdır; tema değişince
 *   otomatik yeniden renklendirilir.
 * - `font` rolü override eder (`body` default → Inter; `display` Space Grotesk;
 *   `mono` JetBrains Mono / monospace).
 */
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { typography, fonts, type TypographyVariant, type ColorPalette } from '../../theme/tokens';

export type TextColor = keyof ColorPalette['text'];

export type FontRole = 'body' | 'display' | 'mono';

export interface TextProps extends Omit<RNTextProps, 'style'> {
  variant?: TypographyVariant;
  color?: TextColor;
  font?: FontRole;
  align?: TextStyle['textAlign'];
  style?: TextStyle | TextStyle[];
}

export default function Text({
  variant = 'body',
  color = 'primary',
  font,
  align,
  style,
  children,
  ...rest
}: TextProps) {
  const { colors } = useTheme();
  const typo = typography[variant];

  // Font ailesi seçimi:
  // - Explicit `font` prop > variant'ın doğal font ailesi > undefined (system fallback)
  // - `timer` ve `meta` variant'ları mono varsayar; `title`/`stat`/`screenHeading` display.
  // - ADIM 4: Inter aileleri weight'a göre ayrı font (RN'de fontWeight auto-mapping yok).
  //   Variant'ın fontWeight'ına bakıp `fonts.body*` ailesinden uygun olanı seçeriz.
  let resolvedFontFamily: string | undefined;
  if (font === 'mono') {
    resolvedFontFamily = fonts.mono;
  } else if (font === 'display') {
    resolvedFontFamily = fonts.display;
  } else if (variant === 'timer' || variant === 'meta') {
    resolvedFontFamily = fonts.mono;
  } else if (variant === 'title' || variant === 'screenHeading' || variant === 'stat') {
    // Display tokenları — system fallback (Inter olsa bile başlıklarda display var ama
    // bizde Space Grotesk yok, Inter bold'u kullan).
    resolvedFontFamily = fonts.display ?? fonts.bodyBold;
  } else {
    // Body family — weight'a göre Inter varyantı seç
    const w = typo.fontWeight;
    if (w === '800' || w === '900' || w === 'bold' || w === '700') resolvedFontFamily = fonts.bodyBold;
    else if (w === '600') resolvedFontFamily = fonts.bodyStrong;
    else if (w === '500') resolvedFontFamily = fonts.bodyMedium;
    else resolvedFontFamily = fonts.body;
  }

  const baseStyle: TextStyle = {
    fontSize: typo.fontSize,
    lineHeight: typo.lineHeight,
    fontWeight: typo.fontWeight,
    color: colors.text[color],
    ...(resolvedFontFamily ? { fontFamily: resolvedFontFamily } : {}),
    ...(align ? { textAlign: align } : {}),
  };

  return (
    <RNText
      {...rest}
      style={style ? (Array.isArray(style) ? [baseStyle, ...style] : [baseStyle, style]) : baseStyle}
    >
      {children}
    </RNText>
  );
}
