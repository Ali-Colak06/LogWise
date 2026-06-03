/**
 * Icon — lucide-react-native wrapper.
 *
 * Kural (rev 3 AGENTS): "Sadece kullanilan icon'lar named import, tum seti yasak."
 * Bu wrapper'a `component` prop ile lucide icon component'i gecilir:
 *
 *   import { Dumbbell } from 'lucide-react-native';
 *   <Icon component={Dumbbell} size={48} color="tertiary" />
 *
 * - `size` numeric (default 24).
 * - `color` aktif `ColorPalette.text` keys'inden secer; ya da raw hex string.
 * - `strokeWidth` default 2 (lucide default).
 *
 * NOT: `lucide-react-native` LucideIcon icin export ettigi tip
 * `ForwardRefExoticComponent<LucideProps & RefAttributes<SVGSVGElement>>` —
 * RN'in `ColorValue` tipini kullanir (sadece string degil). Bu wrapper o tipe
 * uyumlu kalmali, aksi halde TS hatasi verir.
 */
import type { ComponentType } from 'react';
import type { ColorValue } from 'react-native';
import { useTheme } from '../../theme';
import type { ColorPalette } from '../../theme/tokens';

export type IconColor = keyof ColorPalette['text'] | (string & {});

/** lucide-react-native icon component'inin minimum prop kontrati. */
export interface LucideIconProps {
  size?: number | string;
  color?: ColorValue;
  strokeWidth?: number | string;
}

export interface IconProps {
  component: ComponentType<LucideIconProps>;
  size?: number;
  color?: IconColor;
  strokeWidth?: number;
  /** Token-bazli accent override (gold) */
  accent?: boolean;
}

export default function Icon({
  component: Cmp,
  size = 24,
  color = 'primary',
  strokeWidth = 2,
  accent = false,
}: IconProps) {
  const { colors } = useTheme();

  let resolvedColor: string;
  if (accent) {
    resolvedColor = colors.accent.gold;
  } else if (typeof color === 'string' && (color in colors.text)) {
    resolvedColor = colors.text[color as keyof ColorPalette['text']];
  } else {
    resolvedColor = color as string;
  }

  return <Cmp size={size} color={resolvedColor} strokeWidth={strokeWidth} />;
}
