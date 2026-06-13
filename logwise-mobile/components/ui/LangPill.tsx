/**
 * LangPill — segmented EN|TR dil seçici (prototip `.lang-pill`).
 *
 * Aktif segment: gold dolgu + onAccent metin. Pasif: tertiary metin.
 * Full-radius kapsül, elevated bg + subtle border, JetBrains Mono.
 *
 * Önceki ghost+Globe buton yerine geçer (Welcome + auth header ortak).
 */
import { Pressable, View, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import Text from './Text';

export interface LangPillProps {
  value: 'tr' | 'en';
  onChange: (lang: 'tr' | 'en') => void;
  testID?: string;
}

const ORDER = ['en', 'tr'] as const;

export default function LangPill({ value, onChange, testID }: LangPillProps) {
  const { colors, tokens } = useTheme();

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: tokens.space.xs,
    borderRadius: tokens.radius.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.elevated,
  };

  return (
    <View style={containerStyle} accessibilityRole="radiogroup" testID={testID}>
      {ORDER.map((lang) => {
        const active = value === lang;
        return (
          <Pressable
            key={lang}
            onPress={() => onChange(lang)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={lang.toUpperCase()}
            hitSlop={6}
            style={({ pressed }) => [
              {
                minWidth: 28,
                paddingHorizontal: tokens.space.sm,
                paddingVertical: tokens.space.xs,
                borderRadius: tokens.radius.full,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? colors.accent.gold : 'transparent',
              },
              pressed && !active ? { backgroundColor: colors.background.hover } : null,
            ]}
          >
            <Text
              style={{
                fontFamily: tokens.fonts.monoBold,
                fontSize: 11,
                lineHeight: 14,
                letterSpacing: 0.6,
                color: active ? colors.text.onAccent : colors.text.tertiary,
              }}
            >
              {lang.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
