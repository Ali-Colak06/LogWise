/**
 * ExerciseCard — Day Detail tek egzersiz kartı (cila turu — prototip ex-card).
 *
 * Head: kategori-chip (dot + ad) + egzersiz adı + "Son: kg × tekrar" + 👁 + ⋮.
 * Body: set-grid başlık (# Type KG Reps RIR) + SetRow'lar + "+ Set Ekle".
 *
 * Prefill (kullanıcı kararı): önceki seansın aynı set index değerleri yeni set
 * eklenince GERÇEK değer olarak gelir ve dokunulmasa da kaydedilir. Kart, kendi
 * `useLastSession` sorgusunu çalıştırır; "+ Set Ekle" sıradaki index için seed'i
 * parent'a verir (parent mutation'a weight/reps/type/rir geçer).
 * Lazy yazma korunur: hiç set yoksa DB'ye satır yazılmaz (sets boş).
 */
import { useMemo } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Eye, MoreVertical } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Text, Button } from '../ui';
import { useT, useTranslations } from '../../lib/i18n';
import { useLastSession } from '../../queries/workouts';
import { catLabel } from '../../lib/exercise-resolve';
import SetRow, { SET_COL, type SetRowValue } from './SetRow';
import type { ResolvedExercise } from '../../lib/exercise-resolve';
import type { AppSetsRow, SetType, RirValue } from '../../types/database';

export interface SetSeed {
  setType?: SetType;
  weight?: number | null;
  reps?: number | null;
  rir?: RirValue;
}

export interface ExerciseCardProps {
  resolved: ResolvedExercise;
  /** beforeDateISO — önceki seans prefill kaynağı. */
  dateISO: string;
  sets: AppSetsRow[]; // persisted set'ler (boşsa lazy kart)
  onAddSet: (seed?: SetSeed) => void;
  onChangeSet: (setId: string, patch: Partial<SetRowValue>) => void;
  onDeleteSet: (setId: string) => void;
  onOpenPreview: () => void;
  onOpenMenu: () => void;
}

function bestSetLabel(sets: { weight: number | null; reps: number | null }[]): string | null {
  let best: { weight: number; reps: number } | null = null;
  for (const s of sets) {
    if (typeof s.weight !== 'number') continue;
    const reps = typeof s.reps === 'number' ? s.reps : 0;
    if (!best || s.weight > best.weight) best = { weight: s.weight, reps };
  }
  return best ? `${best.weight} kg × ${best.reps}` : null;
}

export default function ExerciseCard({
  resolved,
  dateISO,
  sets,
  onAddSet,
  onChangeSet,
  onDeleteSet,
  onOpenPreview,
  onOpenMenu,
}: ExerciseCardProps) {
  const { colors } = useTheme();
  const t = useT();
  const dict = useTranslations();
  const primaryCat = resolved.categories[0] ?? 'other';

  const sorted = useMemo(() => [...sets].sort((a, b) => a.set_index - b.set_index), [sets]);

  // Önceki seans (aynı ref, bugünden önce) — "Son:" satırı + set ekleme prefill kaynağı.
  const lastQ = useLastSession(resolved.ref, dateISO);
  const lastByIndex = useMemo(() => {
    const m = new Map<number, AppSetsRow>();
    for (const s of lastQ.data?.sets ?? []) m.set(s.set_index, s);
    return m;
  }, [lastQ.data]);
  const lastLabel = useMemo(() => bestSetLabel(lastQ.data?.sets ?? []), [lastQ.data]);

  const handleAddSet = () => {
    const nextIndex = sorted.length === 0 ? 0 : Math.max(...sorted.map((s) => s.set_index)) + 1;
    const prev = lastByIndex.get(nextIndex);
    if (prev) {
      onAddSet({
        setType: prev.set_type,
        weight: prev.weight,
        reps: prev.reps,
        rir: prev.rir ?? '-',
      });
    } else {
      onAddSet();
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.background.elevated, borderColor: colors.border.subtle }]}>
      {/* Header */}
      <View style={styles.head}>
        <View style={styles.titleCol}>
          <Text variant="bodyStrong" font="display" numberOfLines={2}>
            {resolved.name}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.catChip, { backgroundColor: colors.categoryMuted[primaryCat] }]}>
              <View style={[styles.catDot, { backgroundColor: colors.category[primaryCat] }]} />
              <Text font="mono" style={[styles.catChipText, { color: colors.category[primaryCat] }]}>
                {catLabel(primaryCat, dict.cats)}
              </Text>
            </View>
            {lastLabel ? (
              <Text font="mono" style={[styles.lastText, { color: colors.text.tertiary }]}>
                {t('dayExtra.last')}: {lastLabel}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={onOpenPreview} hitSlop={8} style={styles.iconBtn} accessibilityLabel={t('library.preview')}>
            <Eye size={17} color={colors.text.secondary} />
          </Pressable>
          <Pressable onPress={onOpenMenu} hitSlop={8} style={styles.iconBtn} accessibilityLabel={t('common.more')}>
            <MoreVertical size={17} color={colors.text.secondary} />
          </Pressable>
        </View>
      </View>

      {/* Set grid */}
      {sorted.length > 0 && (
        <View style={styles.grid}>
          <View style={[styles.gridHead, { borderColor: colors.border.subtle }]}>
            <Text font="mono" style={[styles.gridHeadCell, styles.colNum, { color: colors.text.tertiary }]}>
              {t('dayExtra.colSet')}
            </Text>
            <Text font="mono" style={[styles.gridHeadCell, styles.colType, { color: colors.text.tertiary }]}>
              {t('dayExtra.colType')}
            </Text>
            <Text font="mono" style={[styles.gridHeadCell, styles.colFlex, { color: colors.text.tertiary }]}>
              {t('dayExtra.colKg')}
            </Text>
            <Text font="mono" style={[styles.gridHeadCell, styles.colFlex, { color: colors.text.tertiary }]}>
              {t('dayExtra.colReps')}
            </Text>
            <Text font="mono" style={[styles.gridHeadCell, styles.colRir, { color: colors.text.tertiary }]}>
              {t('dayExtra.colRir')}
            </Text>
            <View style={styles.colDel} />
          </View>
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
              prefill={lastByIndex.get(s.set_index)}
              onChange={(patch) => onChangeSet(s.id, patch)}
              onDelete={() => onDeleteSet(s.id)}
            />
          ))}
        </View>
      )}

      <View style={{ height: 8 }} />
      <Button variant="secondary" size="sm" label={t('dayExtra.addSet')} onPress={handleAddSet} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 12,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  titleCol: { flex: 1, minWidth: 0, gap: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 18,
    paddingHorizontal: 7,
    borderRadius: 999,
  },
  catDot: { width: 5, height: 5, borderRadius: 3 },
  catChipText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  lastText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  grid: { marginTop: 10 },
  gridHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SET_COL.gap,
    paddingBottom: 4,
    marginBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  gridHeadCell: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  colNum: { width: SET_COL.num },
  colType: { width: SET_COL.type },
  colFlex: { flex: 1 },
  colRir: { width: SET_COL.rir },
  colDel: { width: SET_COL.del },
});
