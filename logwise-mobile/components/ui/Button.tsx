/**
 * Button — AppButton primitive (§6 02-design-system).
 *
 * Varyantlar: primary | secondary | ghost | danger
 * Boyutlar:   sm (36pt) | md (44pt — default, minimum touch target) | lg (52pt)
 *
 * Özellikler:
 *   - Disabled state (token color + non-interactive)
 *   - Opsiyonel `icon` slotu (sol veya sağ — `iconPosition`)
 *   - A11y: `accessibilityRole="button"`, `accessibilityLabel` zorunlu değil
 *     (label varsa kullanılır, yoksa children string'i)
 *   - Native press feedback: `Pressable` + opacity transition (RN platform native)
 *
 * Yasak:
 *   - Renk/size hardcode (her şey token üzerinden)
 *   - `onPress` opsiyonel ama yoksa disabled effect uygulanır (yanlışlıkla
 *     interactive görünmesin)
 */
import { Pressable, type GestureResponderEvent, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../../theme';
import Text from './Text';
import type { ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label?: string;
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean; // ileride spinner; şimdilik sadece disabled davranır
  onPress?: (e: GestureResponderEvent) => void;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export default function Button({
  label,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onPress,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  accessibilityLabel,
  testID,
  style,
}: ButtonProps) {
  const { colors, tokens } = useTheme();
  const isInteractive = !disabled && !loading && typeof onPress === 'function';

  // Variant → bg/border/text color
  let bg: string;
  let borderColor: string | undefined;
  let textColor: 'onAccent' | 'primary' | 'secondary' | 'tertiary';

  switch (variant) {
    case 'primary':
      bg = colors.accent.gold;
      textColor = 'onAccent';
      break;
    case 'secondary':
      bg = colors.background.elevated;
      borderColor = colors.border.subtle;
      textColor = 'primary';
      break;
    case 'ghost':
      bg = 'transparent';
      textColor = 'secondary';
      break;
    case 'danger':
      bg = colors.semantic.dangerMuted;
      borderColor = colors.semantic.danger;
      textColor = 'primary'; // danger fg yine primary metin — semantic.danger border ile vurgu
      break;
  }

  const height = tokens.layout.buttonHeight[size];
  const hPad = tokens.layout.buttonHPadding[size];

  const baseStyle: ViewStyle = {
    height,
    paddingHorizontal: hPad,
    borderRadius: tokens.radius.md,
    backgroundColor: isInteractive ? bg : variant === 'ghost' ? 'transparent' : colors.background.subtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space.sm,
    opacity: isInteractive ? 1 : 0.5,
    ...(borderColor ? { borderWidth: 1, borderColor: isInteractive ? borderColor : colors.border.subtle } : {}),
    ...(fullWidth ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start' }),
  };

  const content = children ?? (label ? (
    <Text
      variant="button"
      color={variant === 'primary' ? 'onAccent' : textColor}
    >
      {label}
    </Text>
  ) : null);

  const a11yLabel = accessibilityLabel ?? label ?? (typeof children === 'string' ? children : undefined);

  return (
    <Pressable
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      accessibilityLabel={a11yLabel}
      testID={testID}
      style={({ pressed }) => [
        baseStyle,
        pressed && isInteractive ? { opacity: 0.7 } : null,
        style,
      ]}
    >
      {icon && iconPosition === 'left' ? icon : null}
      {content}
      {icon && iconPosition === 'right' ? icon : null}
    </Pressable>
  );
}
