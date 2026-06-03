/**
 * SetTypeSelect — working / warmup / drop chip (ADIM 6 — C2, rev 12: superset çıktı).
 * Compact inline; tap döngüsel veya 3 chip. MVP: 3 chip inline.
 */
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from '../ui';
import { useT } from '../../lib/i18n';
import type { SetType } from '../../types/database';

const TYPES: SetType[] = ['working', 'warmup', 'drop'];
const LABEL_KEY: Record<SetType, string> = {
  working: 'dayExtra.typeWorking',
  warmup: 'dayExtra.typeWarmup',
  drop: 'dayExtra.typeDrop',
};

export interface SetTypeSelectProps {
  value: SetType;
  onChange: (v: SetType) => void;
}

export default function SetTypeSelect({ value, onChange }: SetTypeSelectProps) {
  const { colors } = useTheme();
  const t = useT();
  const colorFor = (ty: SetType) =>
    ty === 'working' ? colors.set.working : ty === 'warmup' ? colors.set.warmup : colors.set.drop;
  return (
    <View style={styles.row}>
      {TYPES.map((ty) => {
        const active = ty === value;
        return (
          <Pressable
            key={ty}
            onPress={() => onChange(ty)}
            style={[
              styles.chip,
              {
                borderColor: active ? colorFor(ty) : colors.border.subtle,
                backgroundColor: active ? colors.background.subtle : 'transparent',
              },
            ]}
            accessibilityState={{ selected: active }}
          >
            <View style={[styles.dot, { backgroundColor: colorFor(ty) }]} />
            <Text variant="meta" color={active ? 'primary' : 'secondary'}>
              {t(LABEL_KEY[ty] as never)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
