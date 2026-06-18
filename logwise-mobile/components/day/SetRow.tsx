/**
 * SetRow — tek set satırı (Day cila turu — prototip 6-sütun grid).
 *
 * Düzen prototip `day-prototype`'a sadık: `# · Type · KG · Reps · RIR · ×` tek satır.
 *   - `#` set numarası: mono, set-tipi rengiyle vurgulu.
 *   - Type / RIR: native `<select>` benzeri **AnchoredDropdown** — hücreye dokununca
 *     hemen altında dikey seçenek listesi açılır (kullanıcı kararı 2026-06-17).
 *   - KG / Reps: mono tabular TextInput; değer girilince accent (gold) rengi.
 *   - `×` sil.
 *
 * Save: KG/Reps blur veya "Done" → onChange patch (parent debounce/optimistic).
 * Prefill: önceki seansın aynı set index değeri henüz boşsa placeholder hayalet
 * olarak gösterilir; gerçek prefill set eklenirken (parent) yapılır + kaydedilir.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Text } from '../ui';
import { useT } from '../../lib/i18n';
import AnchoredDropdown, { type DropdownOption } from './AnchoredDropdown';
import type { SetType, RirValue } from '../../types/database';

export interface SetRowValue {
  setType: SetType;
  weight: number | null;
  reps: number | null;
  rir: RirValue;
}

export interface SetRowProps {
  index: number; // 0-based; UI +1
  value: SetRowValue;
  /** Önceki seans aynı index — boş input için placeholder hayalet. */
  prefill?: { weight: number | null; reps: number | null };
  onChange: (patch: Partial<SetRowValue>) => void;
  onDelete: () => void;
}

/** ExerciseCard grid başlığıyla hizalı sabit sütun genişlikleri. */
export const SET_COL = { num: 22, type: 78, rir: 54, del: 26, gap: 6 } as const;

const TYPE_LABEL_KEY: Record<SetType, string> = {
  working: 'dayExtra.typeWorking',
  warmup: 'dayExtra.typeWarmup',
  drop: 'dayExtra.typeDrop',
};

const RIR_VALUES: RirValue[] = ['-', 'F', '1', '2', '3', '4+'];

function numToStr(n: number | null): string {
  return n === null || Number.isNaN(n) ? '' : String(n);
}

export default function SetRow({ index, value, prefill, onChange, onDelete }: SetRowProps) {
  const { colors, tokens } = useTheme();
  const t = useT();
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

  const typeColor = colors.set[value.setType];
  const kgFilled = kg.trim() !== '';
  const repsFilled = reps.trim() !== '';
  const rirSet = value.rir !== '-';

  const typeOptions: DropdownOption<SetType>[] = useMemo(
    () => [
      { value: 'working', label: t('dayExtra.typeWorking'), color: colors.set.working },
      { value: 'warmup', label: t('dayExtra.typeWarmup'), color: colors.set.warmup },
      { value: 'drop', label: t('dayExtra.typeDrop'), color: colors.set.drop },
    ],
    [t, colors.set.working, colors.set.warmup, colors.set.drop],
  );
  const rirOptions: DropdownOption<RirValue>[] = useMemo(
    () => RIR_VALUES.map((v) => ({ value: v, label: v })),
    [],
  );

  const inputStyle = (filled: boolean) => [
    styles.input,
    {
      fontFamily: tokens.fonts.mono,
      color: filled ? colors.accent.goldHover : colors.text.primary,
      borderColor: filled ? colors.accent.gold : colors.border.subtle,
      backgroundColor: colors.background.subtle,
    },
  ];

  const kgPlaceholder = prefill?.weight != null ? String(prefill.weight) : 'kg';
  const repsPlaceholder = prefill?.reps != null ? String(prefill.reps) : 'reps';

  return (
    <View style={styles.row}>
      <Text font="mono" style={[styles.num, { color: typeColor }]}>
        {index + 1}
      </Text>

      <AnchoredDropdown<SetType>
        value={value.setType}
        options={typeOptions}
        onChange={(setType) => onChange({ setType })}
        width={SET_COL.type}
        triggerBg={colors.setMuted[value.setType]}
        triggerBorder={typeColor}
        triggerColor={typeColor}
        triggerFontSize={9}
        triggerUppercase
        accessibilityLabel={t('dayExtra.setTypeTitle')}
      />

      <TextInput
        value={kg}
        onChangeText={setKg}
        onBlur={commitKg}
        onSubmitEditing={commitKg}
        placeholder={kgPlaceholder}
        placeholderTextColor={colors.text.tertiary}
        keyboardType="decimal-pad"
        style={inputStyle(kgFilled)}
      />
      <TextInput
        value={reps}
        onChangeText={setReps}
        onBlur={commitReps}
        onSubmitEditing={commitReps}
        placeholder={repsPlaceholder}
        placeholderTextColor={colors.text.tertiary}
        keyboardType="number-pad"
        style={inputStyle(repsFilled)}
      />

      <AnchoredDropdown<RirValue>
        value={value.rir}
        options={rirOptions}
        onChange={(rir) => onChange({ rir })}
        width={SET_COL.rir}
        triggerBg={colors.background.subtle}
        triggerBorder={rirSet ? colors.accent.gold : colors.border.subtle}
        triggerColor={rirSet ? colors.accent.goldHover : colors.text.secondary}
        triggerFontSize={12}
        accessibilityLabel={`RIR ${value.rir}`}
      />

      <Pressable onPress={onDelete} hitSlop={8} style={styles.del} accessibilityLabel="delete set">
        <X size={15} color={colors.text.tertiary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SET_COL.gap,
    minHeight: 36,
    marginBottom: 4,
  },
  num: {
    width: SET_COL.num,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    height: 30,
    paddingHorizontal: 6,
    paddingVertical: 0,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  del: {
    width: SET_COL.del,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
