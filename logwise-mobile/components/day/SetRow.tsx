/**
 * SetRow — tek set satırı (ADIM 6 — C2).
 *
 * KG (decimal) + Reps (integer) inputs → focus-blur'da debounced save (onChange patch).
 * Set type + RIR satır altında. Sil butonu. Prefill (önceki session) görsel ayrım:
 * prefilled değer secondary; kullanıcı dokununca primary.
 *
 * @gorhom yok; plain TextInput. Debounce: blur'da commit (300ms timer yerine blur).
 */
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Text } from '../ui';
import RirSelect from './RirSelect';
import SetTypeSelect from './SetTypeSelect';
import type { SetType, RirValue } from '../../types/database';

export interface SetRowValue {
  setType: SetType;
  weight: number | null;
  reps: number | null;
  rir: RirValue;
}

export interface SetRowProps {
  index: number;          // 0-based; UI +1
  value: SetRowValue;
  /** Önceki session prefill (placeholder/ghost). */
  prefill?: { weight: number | null; reps: number | null };
  onChange: (patch: Partial<SetRowValue>) => void;
  onDelete: () => void;
}

function numToStr(n: number | null): string {
  return n === null || Number.isNaN(n) ? '' : String(n);
}

export default function SetRow({ index, value, prefill, onChange, onDelete }: SetRowProps) {
  const { colors } = useTheme();
  const [kg, setKg] = useState(numToStr(value.weight));
  const [reps, setReps] = useState(numToStr(value.reps));

  useEffect(() => {
    setKg(numToStr(value.weight));
  }, [value.weight]);
  useEffect(() => {
    setReps(numToStr(value.reps));
  }, [value.reps]);

  const commitKg = () => {
    const parsed = kg.trim() === '' ? null : Number(kg.replace(',', '.'));
    onChange({ weight: parsed !== null && Number.isNaN(parsed) ? null : parsed });
  };
  const commitReps = () => {
    const parsed = reps.trim() === '' ? null : parseInt(reps, 10);
    onChange({ reps: parsed !== null && Number.isNaN(parsed) ? null : parsed });
  };

  const kgPlaceholder = prefill?.weight != null ? String(prefill.weight) : 'kg';
  const repsPlaceholder = prefill?.reps != null ? String(prefill.reps) : 'reps';

  return (
    <View style={[styles.wrap, { borderColor: colors.border.subtle }]}>
      <View style={styles.line1}>
        <Text variant="caption" color="secondary" style={styles.num}>
          {index + 1}
        </Text>
        <TextInput
          value={kg}
          onChangeText={setKg}
          onBlur={commitKg}
          onSubmitEditing={commitKg}
          placeholder={kgPlaceholder}
          placeholderTextColor={colors.text.tertiary}
          keyboardType="decimal-pad"
          style={[
            styles.input,
            { color: colors.text.primary, borderColor: colors.border.subtle, backgroundColor: colors.background.subtle },
          ]}
        />
        <Text variant="caption" color="tertiary">×</Text>
        <TextInput
          value={reps}
          onChangeText={setReps}
          onBlur={commitReps}
          onSubmitEditing={commitReps}
          placeholder={repsPlaceholder}
          placeholderTextColor={colors.text.tertiary}
          keyboardType="number-pad"
          style={[
            styles.input,
            { color: colors.text.primary, borderColor: colors.border.subtle, backgroundColor: colors.background.subtle },
          ]}
        />
        <Pressable onPress={onDelete} hitSlop={8} style={styles.del} accessibilityLabel="delete set">
          <X size={16} color={colors.text.tertiary} />
        </Pressable>
      </View>
      <View style={styles.line2}>
        <SetTypeSelect value={value.setType} onChange={(setType) => onChange({ setType })} />
        <RirSelect value={value.rir} onChange={(rir) => onChange({ rir })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    gap: 6,
  },
  line1: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  num: { width: 16, textAlign: 'center' },
  input: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 15,
    textAlign: 'center',
  },
  del: { padding: 4 },
  line2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
});
