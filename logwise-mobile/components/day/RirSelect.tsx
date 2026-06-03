/**
 * RirSelect — RIR chip group (ADIM 6 — C2). rev 12 enum: - / F / 1 / 2 / 3 / 4+.
 * Inline horizontal chips; tap → anında onChange (debounce yok).
 */
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from '../ui';
import type { RirValue } from '../../types/database';

const RIR_OPTIONS: RirValue[] = ['-', 'F', '1', '2', '3', '4+'];

export interface RirSelectProps {
  value: RirValue;
  onChange: (v: RirValue) => void;
}

export default function RirSelect({ value, onChange }: RirSelectProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {RIR_OPTIONS.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.accent.goldMuted : colors.background.subtle,
                borderColor: active ? colors.accent.gold : colors.border.subtle,
              },
            ]}
            accessibilityLabel={`RIR ${opt}`}
            accessibilityState={{ selected: active }}
          >
            <Text variant="meta" color={active ? 'primary' : 'secondary'}>
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  chip: {
    minWidth: 30,
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
