/**
 * Stack primitives — VStack, HStack, Box
 *
 * Amaç: tüm spacing & layout style'larını token üzerinden tek noktada toplamak.
 * RN'de Tailwind/Chakra benzeri spacing API'si yok; her inline `marginVertical: 16`
 * yazımı = token kaçağı. Bu wrapper ile `<VStack gap="lg" padding="md">`.
 *
 * Box = generic container (flex props yok, sadece padding/margin/bg).
 * VStack = flexDirection: 'column' + gap
 * HStack = flexDirection: 'row' + gap + alignItems default 'center'
 *
 * Spacing prop'ları: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
 *
 * Renk prop'u (`bg`, `borderColor`) `ColorPalette` keylerini destekler (dot notation
 * resolve'u runtime).
 */
import { View, type ViewStyle, type StyleProp } from 'react-native';
import type { ReactNode } from 'react';
import { useTheme } from '../../theme';
import { space, type ColorPalette } from '../../theme/tokens';

export type SpaceKey =
  | 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';

// `ColorPalette.background.app` gibi dotted path; en sık kullanılanlar.
export type BgKey =
  | 'app' | 'elevated' | 'subtle' | 'hover' | 'inverse'
  | (string & {}); // raw hex fallback

export type BorderKey =
  | 'subtle' | 'strong' | 'accent' | 'danger'
  | (string & {});

interface BaseProps {
  children?: ReactNode;
  padding?: SpaceKey;
  paddingX?: SpaceKey;
  paddingY?: SpaceKey;
  paddingTop?: SpaceKey;
  paddingBottom?: SpaceKey;
  paddingLeft?: SpaceKey;
  paddingRight?: SpaceKey;
  margin?: SpaceKey;
  marginX?: SpaceKey;
  marginY?: SpaceKey;
  marginTop?: SpaceKey;
  marginBottom?: SpaceKey;
  bg?: BgKey;
  borderColor?: BorderKey;
  borderWidth?: number;
  radius?: number;
  flex?: number;
  width?: ViewStyle['width'];
  height?: ViewStyle['height'];
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface StackProps extends BaseProps {
  gap?: SpaceKey;
  wrap?: boolean;
}

function resolveBg(colors: ColorPalette, key: BgKey | undefined): string | undefined {
  if (!key) return undefined;
  if (key in colors.background) return colors.background[key as keyof ColorPalette['background']];
  return key; // raw hex
}

function resolveBorder(colors: ColorPalette, key: BorderKey | undefined): string | undefined {
  if (!key) return undefined;
  if (key in colors.border) return colors.border[key as keyof ColorPalette['border']];
  return key;
}

function buildBaseStyle(
  props: BaseProps,
  resolvedBg: string | undefined,
  resolvedBorder: string | undefined,
): ViewStyle {
  const style: ViewStyle = {};
  if (props.padding) style.padding = space[props.padding];
  if (props.paddingX !== undefined) style.paddingHorizontal = space[props.paddingX];
  if (props.paddingY !== undefined) style.paddingVertical = space[props.paddingY];
  if (props.paddingTop) style.paddingTop = space[props.paddingTop];
  if (props.paddingBottom) style.paddingBottom = space[props.paddingBottom];
  if (props.paddingLeft) style.paddingLeft = space[props.paddingLeft];
  if (props.paddingRight) style.paddingRight = space[props.paddingRight];
  if (props.margin) style.margin = space[props.margin];
  if (props.marginX !== undefined) style.marginHorizontal = space[props.marginX];
  if (props.marginY !== undefined) style.marginVertical = space[props.marginY];
  if (props.marginTop) style.marginTop = space[props.marginTop];
  if (props.marginBottom) style.marginBottom = space[props.marginBottom];
  if (resolvedBg) style.backgroundColor = resolvedBg;
  if (resolvedBorder) {
    style.borderColor = resolvedBorder;
    style.borderWidth = props.borderWidth ?? 1;
  } else if (props.borderWidth !== undefined) {
    style.borderWidth = props.borderWidth;
  }
  if (props.radius !== undefined) style.borderRadius = props.radius;
  if (props.flex !== undefined) style.flex = props.flex;
  if (props.width !== undefined) style.width = props.width;
  if (props.height !== undefined) style.height = props.height;
  if (props.align) style.alignItems = props.align;
  if (props.justify) style.justifyContent = props.justify;
  return style;
}

export function Box({ children, style, testID, ...props }: BaseProps) {
  const { colors } = useTheme();
  const baseStyle = buildBaseStyle(props, resolveBg(colors, props.bg), resolveBorder(colors, props.borderColor));
  return <View style={[baseStyle, style]} testID={testID}>{children}</View>;
}

export function VStack({ children, gap, wrap, style, testID, ...props }: StackProps) {
  const { colors } = useTheme();
  const baseStyle = buildBaseStyle(props, resolveBg(colors, props.bg), resolveBorder(colors, props.borderColor));
  const stackStyle: ViewStyle = {
    ...baseStyle,
    flexDirection: 'column',
    ...(gap ? { gap: space[gap] } : {}),
    ...(wrap ? { flexWrap: 'wrap' } : {}),
  };
  return <View style={[stackStyle, style]} testID={testID}>{children}</View>;
}

export function HStack({ children, gap, wrap, style, testID, ...props }: StackProps) {
  const { colors } = useTheme();
  const baseStyle = buildBaseStyle(props, resolveBg(colors, props.bg), resolveBorder(colors, props.borderColor));
  const stackStyle: ViewStyle = {
    ...baseStyle,
    flexDirection: 'row',
    alignItems: props.align ?? 'center',
    ...(gap ? { gap: space[gap] } : {}),
    ...(wrap ? { flexWrap: 'wrap' } : {}),
  };
  return <View style={[stackStyle, style]} testID={testID}>{children}</View>;
}

const Stack = { Box, VStack, HStack };
export default Stack;
