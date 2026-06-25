/**
 * Wordmark — "LOG WISE" marka yazısı (Space Grotesk bold, gold).
 *
 * Splash + Welcome + auth ekranlarında ortak. Prototip `.wordmark`
 * (display font, 22px/700, letterSpacing ~0.02em, accent rengi).
 *
 * Not: RN'de fontWeight, açık fontFamily verilince yok sayılır; bu yüzden
 * ağırlık `fonts.displayBold` (SpaceGrotesk_700Bold) ailesiyle gelir.
 */
import type { TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import Text from '../ui/Text';

export interface WordmarkProps {
  /** fontSize (px). Default 22. */
  size?: number;
  /** Renk tonu — gold (marka) | primary (nötr). Default 'gold'. */
  tone?: 'gold' | 'primary';
  align?: TextStyle['textAlign'];
}

export default function Wordmark({ size = 22, tone = 'gold', align = 'center' }: WordmarkProps) {
  const { colors, tokens } = useTheme();
  const color = tone === 'gold' ? colors.accent.gold : colors.text.primary;

  return (
    <Text
      variant="screenHeading"
      align={align}
      accessibilityLabel="LogWise"
      style={{
        fontFamily: tokens.fonts.displayBold,
        fontSize: size,
        lineHeight: Math.round(size * 1.12),
        letterSpacing: size * 0.02,
        color,
      }}
    >
      LOG WISE
    </Text>
  );
}
