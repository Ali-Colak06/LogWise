/**
 * SegmentedTabs — 2-3 segmentli kontrol (ADIM 6).
 *
 * D1/D2 (Exercises/Programs), C4 (Kütüphanem/Hazır/Yeni Özel) paylaşır.
 * Aktif segment altın highlight. Opsiyonel count badge.
 */
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import Text from './Text';

export interface SegmentedTabOption<T extends string> {
  key: T;
  label: string;
  count?: number;
}

export interface SegmentedTabsProps<T extends string> {
  options: Array<SegmentedTabOption<T>>;
  value: T;
  onChange: (v: T) => void;
  testID?: string;
}

export default function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  testID,
}: SegmentedTabsProps<T>) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.background.subtle, borderColor: colors.border.subtle },
      ]}
      testID={testID}
    >
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={({ pressed }) => [
              styles.seg,
              active && { backgroundColor: colors.background.elevated },
              pressed && { opacity: 0.8 },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text variant="caption" color={active ? 'primary' : 'secondary'}>
              {opt.label}
              {typeof opt.count === 'number' ? `  ${opt.count}` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
    gap: 3,
  },
  seg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
});
