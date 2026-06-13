/**
 * BrandMark — LogWise logosu (gold L, siyah zemin), app-icon stili döşeme.
 *
 * Kaynak: `assets/icon.png` (uygulama ikonuyla BİREBİR aynı görsel). Inline SVG
 * yerine PNG kullanılır → her ortamda kesin render + ikon/uygulama-içi tutarlılık.
 *
 * Spec: 05-screen-specs.md §A2 (Welcome 80), §A3 (Login 64).
 */
import { Image, View, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../../theme';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const LOGO = require('../../assets/icon.png');

export interface BrandMarkProps {
  /** Döşeme boyutu (px). Default 64. */
  size?: number;
  /** App-icon stili yuvarlatılmış köşe. Default true. */
  rounded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function BrandMark({ size = 64, rounded = true, style }: BrandMarkProps) {
  const { scheme, tokens } = useTheme();
  const radius = rounded ? Math.round(size * 0.22) : 0;

  const wrapStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    backgroundColor: '#0A0A0A',
    ...tokens.shadows[scheme].cardLarge,
  };

  return (
    <View style={[wrapStyle, style]}>
      <Image
        source={LOGO}
        style={{ width: size, height: size, borderRadius: radius }}
        accessibilityLabel="LogWise"
        accessible
      />
    </View>
  );
}
