/**
 * Input — AppInput primitive (ADIM 4, A2-A5 ekranları için).
 *
 * Tasarım kaynak: 02-mobile-design-system §6 AppInput + auth-prototype `.field` CSS.
 *
 * Yapı:
 *   ┌─────────────────────────────────────┐
 *   │ [icon]  placeholder            [✕] │  ← outer container (bg-elevated + border)
 *   └─────────────────────────────────────┘
 *      ⓘ helper text   /   ⚠ error text   ← optional below
 *
 * Props:
 *   - `value` / `onChangeText` — controlled input
 *   - `type` — 'text' | 'email' | 'password' | 'number' (RN keyboardType + autoComplete map)
 *   - `iconLeft` — opsiyonel decorative icon
 *   - `actionRight` — opsiyonel action button (örn. password reveal)
 *   - `label` — outer container üstünde küçük etiket (opsiyonel)
 *   - `error` — string varsa danger border + error message
 *   - `helper` — gri yardım metni (error öncelikli)
 *   - `autoFocus`, `onSubmitEditing`, `returnKeyType` (chain için)
 *
 * Erişilebilirlik:
 *   - `accessibilityLabel` (label > placeholder)
 *   - Password type → secureTextEntry + reveal action (opsiyonel kullanıcı toggle)
 */
import { forwardRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  TextInput,
  View,
  Pressable,
  type TextInputProps,
  type ViewStyle,
  type StyleProp,
  type ReturnKeyTypeOptions,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../theme';
import Text from './Text';
import Icon from './Icon';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'username';

export interface InputProps {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  type?: InputType;
  label?: string;
  helper?: string;
  error?: string;
  iconLeft?: ReactNode;
  actionRight?: ReactNode;
  /** Password için reveal toggle göster — default true (type='password' iken) */
  showPasswordToggle?: boolean;
  autoFocus?: boolean;
  editable?: boolean;
  onSubmitEditing?: () => void;
  onBlur?: TextInputProps['onBlur'];
  returnKeyType?: ReturnKeyTypeOptions;
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

const TextInputCmp = forwardRef<TextInput, InputProps>(function Input(
  {
    value,
    onChangeText,
    placeholder,
    type = 'text',
    label,
    helper,
    error,
    iconLeft,
    actionRight,
    showPasswordToggle = true,
    autoFocus = false,
    editable = true,
    onSubmitEditing,
    onBlur,
    returnKeyType,
    autoComplete,
    textContentType,
    accessibilityLabel,
    testID,
    style,
  },
  ref,
) {
  const { colors, tokens } = useTheme();
  const [revealPassword, setRevealPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const isPassword = type === 'password';
  const secure = isPassword && !revealPassword;

  // Type → RN keyboard / autoComplete mapping
  let keyboardType: TextInputProps['keyboardType'] = 'default';
  let autoCapitalize: TextInputProps['autoCapitalize'] = 'sentences';
  let autoComplete2: TextInputProps['autoComplete'] = autoComplete;
  let textContentType2: TextInputProps['textContentType'] = textContentType;

  if (type === 'email') {
    keyboardType = 'email-address';
    autoCapitalize = 'none';
    autoComplete2 = autoComplete ?? 'email';
    textContentType2 = textContentType ?? 'emailAddress';
  } else if (type === 'number') {
    keyboardType = 'numeric';
    autoCapitalize = 'none';
  } else if (isPassword) {
    autoCapitalize = 'none';
    autoComplete2 = autoComplete ?? 'password';
    textContentType2 = textContentType ?? 'password';
  } else if (type === 'username') {
    autoCapitalize = 'none';
    autoComplete2 = autoComplete ?? 'username';
    textContentType2 = textContentType ?? 'username';
  } else {
    autoCapitalize = 'sentences';
  }

  const hasError = !!error;
  const borderColor = hasError
    ? colors.border.danger
    : focused
      ? colors.border.accent
      : colors.border.subtle;

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.space.md,
    minHeight: tokens.layout.buttonHeight.md, // 44pt — min touch target
    gap: tokens.space.sm,
    opacity: editable ? 1 : 0.6,
  };

  return (
    <View style={style}>
      {label ? (
        <Text variant="caption" color="secondary" style={{ marginBottom: tokens.space.xs }}>
          {label}
        </Text>
      ) : null}

      <View style={containerStyle}>
        {iconLeft ? <View>{iconLeft}</View> : null}

        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={type === 'text'}
          autoComplete={autoComplete2}
          textContentType={textContentType2}
          autoFocus={autoFocus}
          editable={editable}
          onSubmitEditing={onSubmitEditing}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          onFocus={() => setFocused(true)}
          returnKeyType={returnKeyType}
          accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
          testID={testID}
          style={{
            flex: 1,
            color: colors.text.primary,
            fontSize: tokens.typography.body.fontSize,
            paddingVertical: tokens.space.sm,
            // Inter regular ailesi — Text component'ı dışında font açıkça verilmeli
            fontFamily: tokens.fonts.body,
          }}
        />

        {isPassword && showPasswordToggle ? (
          <Pressable
            onPress={() => setRevealPassword((s) => !s)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={revealPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Icon component={revealPassword ? EyeOff : Eye} size={20} color="secondary" />
          </Pressable>
        ) : null}

        {actionRight ? <View>{actionRight}</View> : null}
      </View>

      {error ? (
        <Text variant="caption" color="primary" style={{ marginTop: tokens.space.xs, color: colors.semantic.danger }}>
          {error}
        </Text>
      ) : helper ? (
        <Text variant="caption" color="tertiary" style={{ marginTop: tokens.space.xs }}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
});

export default TextInputCmp;
