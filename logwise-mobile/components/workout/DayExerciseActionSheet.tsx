/**
 * DayExerciseActionSheet — D3 program günü hareket satırı ⋮ menüsü (ADIM 8 bug fix).
 *
 * İki aşamalı tek sheet:
 *   - 'menu': Önizle / Başka güne taşı / Çıkar
 *   - 'move': geçerli gün hariç TÜM günler + "← Geri"
 *
 * Native Alert yerine bottom sheet kullanılır: Android'in 3-buton Alert limiti gün
 * listesini kırpıyordu ve İptal kaybolabiliyordu. Sheet'te tüm günler + geri/dismiss var.
 */
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { AppBottomSheet, Text } from '../ui';
import { useTheme } from '../../theme';
import { useT } from '../../lib/i18n';
import type { DayIndex } from '../../types/database';

const ALL_DAYS: DayIndex[] = [0, 1, 2, 3, 4, 5, 6];

export interface DayExerciseActionSheetProps {
  visible: boolean;
  exerciseName: string;
  currentDay: DayIndex | null;
  dayNames: readonly string[]; // dict.daysFull
  onClose: () => void;
  onPreview: () => void;
  onMove: (toDay: DayIndex) => void;
  onRemove: () => void;
}

export default function DayExerciseActionSheet({
  visible,
  exerciseName,
  currentDay,
  dayNames,
  onClose,
  onPreview,
  onMove,
  onRemove,
}: DayExerciseActionSheetProps) {
  const { colors } = useTheme();
  const t = useT();
  const [mode, setMode] = useState<'menu' | 'move'>('menu');

  // Sheet her açıldığında menüden başla.
  useEffect(() => {
    if (visible) setMode('menu');
  }, [visible]);

  return (
    <AppBottomSheet visible={visible} onClose={onClose} maxHeightRatio={0.7} minHeightRatio={0.5}>
      <Text variant="sectionHeading" numberOfLines={2}>{exerciseName}</Text>
      <View style={{ height: 12 }} />

      {mode === 'menu' ? (
        <View>
          <Pressable onPress={onPreview} style={[styles.row, { backgroundColor: colors.background.subtle }]}>
            <Text variant="bodyStrong" align="center">{t('library.preview')}</Text>
          </Pressable>
          <Pressable onPress={() => setMode('move')} style={[styles.row, { backgroundColor: colors.background.subtle }]}>
            <Text variant="bodyStrong" align="center">{t('programEdit.moveToDay')}</Text>
          </Pressable>
          <Pressable onPress={onRemove} style={styles.delRow} hitSlop={6}>
            <Text variant="body" align="center" style={{ color: colors.semantic.danger }}>{t('programEdit.removeExercise')}</Text>
          </Pressable>
        </View>
      ) : (
        <View>
          <Pressable onPress={() => setMode('menu')} style={styles.backRow} hitSlop={6}>
            <ArrowLeft size={16} color={colors.text.secondary} />
            <Text variant="meta" color="secondary">{t('library.cancel')}</Text>
          </Pressable>
          {ALL_DAYS.filter((d) => d !== currentDay).map((d) => (
            <Pressable key={d} onPress={() => onMove(d)} style={[styles.row, { backgroundColor: colors.background.subtle }]}>
              <Text variant="bodyStrong" align="center">{dayNames[d] ?? String(d)}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 14, borderRadius: 12, marginBottom: 8 },
  delRow: { paddingVertical: 12, marginTop: 4 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, marginBottom: 4 },
});
