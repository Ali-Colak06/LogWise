/**
 * ExPreviewModal — egzersiz önizleme (ADIM 6 — C2 👁 + D1 row tap ortak).
 *
 * Preset: gif (MVP null) + uzun açıklama + tips (data/ex-preview.ts).
 * Custom: ad + kategoriler + not (gif yok — C4 açık sorusu kararı: custom gif yok).
 */
import { StyleSheet, View } from 'react-native';
import { AppBottomSheet, Text } from '../ui';
import { useTheme } from '../../theme';
import { useLocaleStore } from '../../lib/i18n';
import { getExPreview } from '../../data/ex-preview';
import type { ResolvedExercise } from '../../lib/exercise-resolve';

export interface ExPreviewModalProps {
  visible: boolean;
  exercise: ResolvedExercise | null;
  onClose: () => void;
}

export default function ExPreviewModal({ visible, exercise, onClose }: ExPreviewModalProps) {
  const { colors } = useTheme();
  const locale = useLocaleStore((s) => s.locale);
  const li = locale === 'en' ? 1 : 0;

  const preview = exercise && exercise.isPreset ? getExPreview(exercise.ref) : null;

  return (
    <AppBottomSheet visible={visible} onClose={onClose} maxHeightRatio={0.8}>
      {exercise && (
        <View style={{ minHeight: 360 }}>
          <Text variant="screenHeading">{exercise.name}</Text>
          <View style={styles.cats}>
            {exercise.rawCategories.map((c, i) => (
              <View
                key={`${c}-${i}`}
                style={[styles.chip, { backgroundColor: colors.background.subtle }]}
              >
                <Text variant="meta" color="secondary">{c}</Text>
              </View>
            ))}
          </View>

          {preview ? (
            <>
              <Text variant="body" color="secondary" style={styles.desc}>
                {preview.desc[li]}
              </Text>
              {preview.tips.length > 0 && (
                <View style={styles.tips}>
                  {preview.tips.map((tip, i) => (
                    <View key={i} style={styles.tipRow}>
                      <View style={[styles.bullet, { backgroundColor: colors.accent.gold }]} />
                      <Text variant="caption" color="secondary" style={{ flex: 1 }}>
                        {tip[li]}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : exercise.notes ? (
            <Text variant="body" color="secondary" style={styles.desc}>
              {exercise.notes}
            </Text>
          ) : null}
          <View style={{ height: 8 }} />
        </View>
      )}
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  cats: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  desc: { marginTop: 14 },
  tips: { marginTop: 14, gap: 8 },
  tipRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  bullet: { width: 5, height: 5, borderRadius: 3, marginTop: 7 },
});
