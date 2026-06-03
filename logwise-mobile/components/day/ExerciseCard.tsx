/**
 * ExerciseCard — C2 tek egzersiz kartı (ADIM 6).
 *
 * Head: ad + kategori chip + Son: ref + 👁 preview + ⋯ menü.
 * Body: set satırları (SetRow) + "+ Set Ekle".
 * Lazy yazma: kart program/manuel olabilir; ilk set parent'ta workout insert eder.
 * Drag/reorder: paket yok → ⋮ menüde yukarı/aşağı (MVP basit). Spec drag istiyor ama
 * react-native-draggable-flatlist yüklü değil; OPEN olarak işaretlendi.
 */
import { StyleSheet, View, Pressable } from 'react-native';
import { Eye, MoreVertical } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Text, Button } from '../ui';
import { useT } from '../../lib/i18n';
import SetRow, { type SetRowValue } from './SetRow';
import type { ResolvedExercise } from '../../lib/exercise-resolve';
import type { AppSetsRow } from '../../types/database';

export interface ExerciseCardProps {
  resolved: ResolvedExercise;
  sets: AppSetsRow[];                       // persisted set'ler (boşsa lazy kart)
  lastSession?: { weight: number | null; reps: number | null } | null;  // prefill (set 0)
  onAddSet: () => void;
  onChangeSet: (setId: string, patch: Partial<SetRowValue>) => void;
  onDeleteSet: (setId: string) => void;
  onOpenPreview: () => void;
  onOpenMenu: () => void;
}

export default function ExerciseCard({
  resolved,
  sets,
  lastSession,
  onAddSet,
  onChangeSet,
  onDeleteSet,
  onOpenPreview,
  onOpenMenu,
}: ExerciseCardProps) {
  const { colors } = useTheme();
  const t = useT();
  const primaryCat = resolved.categories[0] ?? 'other';
  const sorted = [...sets].sort((a, b) => a.set_index - b.set_index);

  const lastLabel =
    lastSession && lastSession.weight != null && lastSession.reps != null
      ? `${t('dayExtra.last')}: ${lastSession.weight} × ${lastSession.reps}`
      : null;

  return (
    <View style={[styles.card, { backgroundColor: colors.background.elevated, borderColor: colors.border.subtle }]}>
      {/* Header */}
      <View style={styles.head}>
        <View style={[styles.accent, { backgroundColor: colors.category[primaryCat] }]} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" numberOfLines={2}>{resolved.name}</Text>
          <Text variant="meta" color="secondary" style={{ marginTop: 2 }}>
            {resolved.rawCategories[0] ?? ''}
            {lastLabel ? `  ·  ${lastLabel}` : ''}
          </Text>
        </View>
        <Pressable onPress={onOpenPreview} hitSlop={8} style={styles.iconBtn} accessibilityLabel={t('library.preview')}>
          <Eye size={18} color={colors.text.secondary} />
        </Pressable>
        <Pressable onPress={onOpenMenu} hitSlop={8} style={styles.iconBtn} accessibilityLabel={t('common.more')}>
          <MoreVertical size={18} color={colors.text.secondary} />
        </Pressable>
      </View>

      {/* Set rows */}
      {sorted.length > 0 && (
        <View style={styles.setList}>
          {sorted.map((s, i) => (
            <SetRow
              key={s.id}
              index={i}
              value={{
                setType: s.set_type,
                weight: s.weight,
                reps: s.reps,
                rir: s.rir ?? '-',
              }}
              prefill={i === 0 && lastSession ? lastSession : undefined}
              onChange={(patch) => onChangeSet(s.id, patch)}
              onDelete={() => onDeleteSet(s.id)}
            />
          ))}
        </View>
      )}

      <View style={{ height: 8 }} />
      <Button variant="secondary" size="sm" label={t('dayExtra.addSet')} onPress={onAddSet} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  accent: { width: 3, alignSelf: 'stretch', borderRadius: 2 },
  iconBtn: { padding: 4 },
  setList: { marginTop: 8 },
});
