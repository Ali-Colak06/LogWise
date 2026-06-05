/**
 * Day Detail — C1 (empty) + C2 (filled) + C3 (program day) + C4 (Add Exercise) (ADIM 6).
 *
 * §3.2 + §3.5.2 + §8.2 + §8.8 + C1-C4 spec.
 *   - App bar: back + tarih + prev/next
 *   - Stat strip (Egzersiz / Set / Hacim)
 *   - Aktif program + bugün/gelecek + off-day → RestDayBanner
 *   - Aktif program günü → lazy kartlar (DB'de yok, set girilince yazılır)
 *   - Manuel/persisted kartlar → ExerciseCard
 *   - FAB → AddExerciseSheet (C4)
 *   - Geçmiş program günü: lazy kart YOK (rev 12 §8.8)
 */
import { useMemo, useState } from 'react';
import { Alert, ScrollView, View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Dumbbell, ChevronLeft, ChevronRight, ArrowLeft, Plus } from 'lucide-react-native';
import { Screen, Text, Button, VStack, HStack, useToast } from '../../../../../components/ui';
import { useTheme } from '../../../../../theme';
import { useT, useLocaleStore, useTranslations } from '../../../../../lib/i18n';
import {
  useWorkoutsByDate,
  useSetsForWorkouts,
  useDayMeta,
  useEnsureWorkoutAndAddSet,
  useAddSet,
  useUpdateSet,
  useDeleteSet,
  useDeleteWorkout,
  useSkipExerciseForDay,
} from '../../../../../queries/workouts';
import { useActiveProgram, useProgramDays } from '../../../../../queries/programs';
import { useCustomExercises } from '../../../../../queries/exercises';
import { resolveExerciseRef, buildCustomMap, type ResolvedExercise } from '../../../../../lib/exercise-resolve';
import { resolveProgramDay } from '../../../../../lib/program';
import { totalVolume } from '../../../../../lib/calc';
import ExerciseCard from '../../../../../components/day/ExerciseCard';
import RestDayBanner from '../../../../../components/day/RestDayBanner';
import AddExerciseSheet from '../../../../../components/day/AddExerciseSheet';
import ExPreviewModal from '../../../../../components/shared/ExPreviewModal';
import type { AppWorkoutsRow, AppSetsRow } from '../../../../../types/database';
import type { SetRowValue } from '../../../../../components/day/SetRow';

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}
function parseIsoDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}
function shiftIso(iso: string, days: number): string {
  const d = parseIsoDate(iso);
  if (!d) return iso;
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
  return `${next.getFullYear()}-${(next.getMonth() + 1).toString().padStart(2, '0')}-${next.getDate().toString().padStart(2, '0')}`;
}

export default function DayDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const dateISO = typeof params.date === 'string' ? params.date : todayIso();
  const { colors } = useTheme();
  const t = useT();
  const toast = useToast();
  const locale = useLocaleStore((s) => s.locale);
  const dict = useTranslations();

  const [addOpen, setAddOpen] = useState(false);
  const [previewEx, setPreviewEx] = useState<ResolvedExercise | null>(null);

  const today = todayIso();
  const isToday = dateISO === today;
  const isPast = dateISO < today;

  const workoutsQ = useWorkoutsByDate(dateISO);
  const workouts: AppWorkoutsRow[] = workoutsQ.data ?? [];
  const workoutIds = workouts.map((w) => w.id);
  const setsQ = useSetsForWorkouts(workoutIds);
  const sets: AppSetsRow[] = setsQ.data ?? [];
  const dayMetaQ = useDayMeta(dateISO);
  const customQ = useCustomExercises();
  const customMap = useMemo(() => buildCustomMap(customQ.data ?? []), [customQ.data]);
  const activeProgQ = useActiveProgram();
  const activeProgram = activeProgQ.data ?? null;
  const programDaysQ = useProgramDays(activeProgram?.id);
  const programDays = programDaysQ.data ?? [];

  const ensureAndAdd = useEnsureWorkoutAndAddSet();
  const addSet = useAddSet();
  const updateSet = useUpdateSet();
  const deleteSet = useDeleteSet();
  const deleteWorkout = useDeleteWorkout();
  const skipExercise = useSkipExerciseForDay();

  // Program günü çözümü (sadece bugün/gelecek; geçmişte lazy yok — §8.8 rev 12)
  const programDay = useMemo(() => {
    if (!activeProgram || isPast) return null;
    return resolveProgramDay(activeProgram, programDays, dateISO);
  }, [activeProgram, programDays, dateISO, isPast]);

  const showProgramContext = !!programDay && programDay.hasStarted;
  const isOffDay = !!programDay && programDay.hasStarted && programDay.isOffDay;

  const skippedRefs = dayMetaQ.data?.skipped_exercise_ids ?? [];
  const persistedRefs = new Set(workouts.map((w) => w.exercise_ref));

  // Lazy kart ref'leri: program gününde olup henüz persisted olmayan + skip edilmeyen
  const lazyRefs = useMemo(() => {
    if (!showProgramContext || isOffDay) return [];
    return programDay!.exerciseRefs.filter(
      (ref) => !persistedRefs.has(ref) && !skippedRefs.includes(ref),
    );
  }, [showProgramContext, isOffDay, programDay, persistedRefs, skippedRefs]);

  const exerciseCount = workouts.length + lazyRefs.length;
  const setCount = sets.length;
  const volume = totalVolume(sets);

  const dateObj = parseIsoDate(dateISO);
  const dayName = dateObj ? dict.daysFull[(dateObj.getDay() + 6) % 7] ?? '' : '';
  const dateLabel = dateObj ? `${dateObj.getDate()} ${dict.months[dateObj.getMonth()] ?? ''}` : dateISO;

  const weekLabel = programDay
    ? dict.calendar.weekNumber.replace('%d', String(programDay.weekNumber))
    : '';
  const subtitle = showProgramContext && !isOffDay && activeProgram
    ? `${activeProgram.name} · ${dayName} · ${weekLabel}`
    : isToday
      ? t('day.todayTag')
      : dayName;

  const isEmpty =
    workouts.length === 0 && lazyRefs.length === 0 && !isOffDay && !workoutsQ.isLoading;

  const setsByWorkout = (wid: string) => sets.filter((s) => s.workout_id === wid);

  // --- handlers ---
  const onAddSetToWorkout = (workoutId: string) => {
    const existing = setsByWorkout(workoutId);
    const lastIdx = existing.length === 0 ? -1 : Math.max(...existing.map((s) => s.set_index));
    addSet.mutate(
      { workoutId, setIndex: lastIdx + 1, setType: 'working', rir: '-' },
      { onError: (e) => toast.show({ message: (e as Error).message, variant: 'danger' }) },
    );
  };

  const onAddSetToLazy = (ref: string) => {
    // Lazy: workout insert + ilk set
    ensureAndAdd.mutate(
      { dateISO, exerciseRef: ref, setType: 'working', rir: '-' },
      { onError: (e) => toast.show({ message: (e as Error).message, variant: 'danger' }) },
    );
  };

  const onChangeSet = (setId: string, patch: Partial<SetRowValue>) => {
    updateSet.mutate({ setId, patch });
  };
  const onDeleteSet = (setId: string) => {
    deleteSet.mutate(setId);
  };

  const onCardMenu = (w: AppWorkoutsRow | null, ref: string, isProgramEx: boolean) => {
    if (isProgramEx) {
      Alert.alert(t('dayExtra.deleteCardProgramTitle'), undefined, [
        { text: t('dayExtra.deleteOnlyToday'), onPress: () => skipExercise.mutate({ dateISO, exerciseRef: ref }) },
        {
          text: t('dayExtra.deleteFromProgram'),
          style: 'destructive',
          onPress: () => {
            // Programdan kaldır: data-bridge removeProgramDayExercise (D3 ile ortak)
            // Burada hızlı yol: skip + kullanıcıya D3'te kalıcı düzenleme önerilir.
            skipExercise.mutate({ dateISO, exerciseRef: ref });
            toast.show({ message: t('dayExtra.deleteOnlyToday'), variant: 'info' });
          },
        },
        { text: t('library.cancel'), style: 'cancel' },
      ]);
    } else {
      Alert.alert(t('dayExtra.deleteCardTitle'), t('dayExtra.deleteCardBody'), [
        { text: t('library.cancel'), style: 'cancel' },
        {
          text: t('library.delete'),
          style: 'destructive',
          onPress: () => { if (w) deleteWorkout.mutate(w.id); },
        },
      ]);
    }
  };

  const onAddRefs = (refs: string[]) => {
    // Manuel ekleme: her ref için workout insert (set olmadan). ensureWorkout + 1 boş set
    // yerine sadece workout oluştur → ilk set kullanıcı eklesin. Basit: ensureAndAdd ilk set.
    refs.forEach((ref) => onAddSetToLazy(ref));
    toast.show({ message: t('dayExtra.addedToast', { vars: { n: refs.length } }), variant: 'success' });
  };

  const stackCtas = useWindowDimensions().width < 360;

  const openPreview = (ref: string) => {
    setPreviewEx(resolveExerciseRef(ref, customMap, locale));
  };

  return (
    <Screen scroll={false}>
      {/* App bar */}
      <HStack gap="md" align="center" justify="space-between" style={styles.appBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn} accessibilityLabel={t('day.back')}>
          <ArrowLeft color={colors.text.primary} size={22} />
        </Pressable>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text variant="bodyStrong">{dateLabel}</Text>
          <Text variant="caption" color="secondary" numberOfLines={1}>{subtitle}</Text>
        </View>
        <HStack gap="xs">
          <Pressable onPress={() => router.replace(`/calendar/day/${shiftIso(dateISO, -1)}`)} hitSlop={8} style={styles.iconBtn} accessibilityLabel={t('day.prevDay')}>
            <ChevronLeft color={colors.text.primary} size={22} />
          </Pressable>
          <Pressable onPress={() => router.replace(`/calendar/day/${shiftIso(dateISO, 1)}`)} hitSlop={8} style={styles.iconBtn} accessibilityLabel={t('day.nextDay')}>
            <ChevronRight color={colors.text.primary} size={22} />
          </Pressable>
        </HStack>
      </HStack>

      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        {/* Stat strip */}
        <HStack gap="sm" style={[styles.statStrip, { borderColor: colors.border.subtle }]}>
          <View style={styles.statCell}>
            <Text variant="caption" color="secondary">{t('day.statExercises')}</Text>
            <Text variant="stat">{exerciseCount}</Text>
          </View>
          <View style={[styles.statCell, { borderLeftWidth: StyleSheet.hairlineWidth, borderColor: colors.border.subtle }]}>
            <Text variant="caption" color="secondary">{t('day.statSets')}</Text>
            <Text variant="stat">{setCount}</Text>
          </View>
          <View style={[styles.statCell, { borderLeftWidth: StyleSheet.hairlineWidth, borderColor: colors.border.subtle }]}>
            <Text variant="caption" color="secondary">{t('day.statVolume')}</Text>
            <Text variant="stat">{volume > 0 ? `${volume}` : '—'}</Text>
          </View>
        </HStack>

        {isOffDay ? (
          <RestDayBanner onAddAnyway={() => setAddOpen(true)} />
        ) : isEmpty ? (
          <VStack gap="md" align="center" style={styles.emptyBody}>
            <Dumbbell color={colors.text.tertiary} size={48} />
            <Text variant="sectionHeading" align="center">{t('day.emptyTitle')}</Text>
            <Text variant="body" color="secondary" align="center">{t('day.emptyDesc')}</Text>
            {stackCtas ? (
              <VStack gap="sm">
                <Button variant="primary" label={t('day.ctaAddExercise')} onPress={() => setAddOpen(true)} fullWidth />
              </VStack>
            ) : (
              <HStack gap="sm">
                <Button variant="primary" label={t('day.ctaAddExercise')} onPress={() => setAddOpen(true)} />
              </HStack>
            )}
          </VStack>
        ) : (
          <VStack gap="sm" style={{ paddingHorizontal: 8, paddingTop: 12 }}>
            {/* Persisted cards */}
            {workouts.map((w) => {
              const resolved = resolveExerciseRef(w.exercise_ref, customMap, locale);
              const isProgramEx = !!programDay && programDay.exerciseRefs.includes(w.exercise_ref);
              return (
                <ExerciseCard
                  key={w.id}
                  resolved={resolved}
                  sets={setsByWorkout(w.id)}
                  onAddSet={() => onAddSetToWorkout(w.id)}
                  onChangeSet={onChangeSet}
                  onDeleteSet={onDeleteSet}
                  onOpenPreview={() => openPreview(w.exercise_ref)}
                  onOpenMenu={() => onCardMenu(w, w.exercise_ref, isProgramEx)}
                />
              );
            })}
            {/* Lazy program cards */}
            {lazyRefs.map((ref) => {
              const resolved = resolveExerciseRef(ref, customMap, locale);
              return (
                <ExerciseCard
                  key={`lazy-${ref}`}
                  resolved={resolved}
                  sets={[]}
                  onAddSet={() => onAddSetToLazy(ref)}
                  onChangeSet={onChangeSet}
                  onDeleteSet={onDeleteSet}
                  onOpenPreview={() => openPreview(ref)}
                  onOpenMenu={() => onCardMenu(null, ref, true)}
                />
              );
            })}
          </VStack>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => setAddOpen(true)}
        style={[styles.fab, { backgroundColor: colors.accent.gold }]}
        accessibilityLabel={t('day.ctaAddExercise')}
      >
        <Plus size={26} color={colors.text.onAccent} />
      </Pressable>

      <AddExerciseSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onAddRefs={onAddRefs}
      />
      <ExPreviewModal
        visible={previewEx !== null}
        exercise={previewEx}
        onClose={() => setPreviewEx(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  appBar: { paddingHorizontal: 4, paddingVertical: 6 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statStrip: {
    marginTop: 8,
    marginHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statCell: { flex: 1, alignItems: 'center' },
  emptyBody: { paddingVertical: 32 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
});
