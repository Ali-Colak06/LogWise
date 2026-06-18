/**
 * Day Detail — C1 (empty) + C2 (filled) + C3 (program day) + C4 (Add Exercise).
 *
 * Cila turu (2026-06-17):
 *   - App bar: display-font tarih başlığı + mono alt-satır (program/rest/Bugün).
 *   - Stat strip: mono tabular sayılar + Hacim'e "kg".
 *   - Prototip 6-sütun set grid (ExerciseCard + SetRow), kategori-chip, "Son:" satırı.
 *   - Prefill: önceki seansın aynı set index değeri yeni set eklenince GERÇEK gelir
 *     ve dokunulmasa da kaydedilir (kullanıcı kararı).
 *   - Antrenman kronometresi (WorkoutTimerBar) — ephemeral, rest timer YOK (kullanıcı
 *     kararı; §8.2/§8.3 override).
 *   - Empty state ikinci CTA: "Hazır Program Seç" → PresetProgramModal (reuse).
 *
 * Performans (BOZMA): iki fazlı mount (InteractionManager + contentReady), yazma
 * hook'ları optimistic + hedefli cache.
 */
import { useEffect, useMemo, useState } from 'react';
import { Alert, InteractionManager, ScrollView, View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Dumbbell, ChevronLeft, ChevronRight, ArrowLeft, Plus } from 'lucide-react-native';
import { Screen, Text, Button, VStack, HStack, useToast } from '../../../../../components/ui';
import { useTheme } from '../../../../../theme';
import { useT, useLocaleStore, useTranslations } from '../../../../../lib/i18n';
import {
  useWorkoutsByDate,
  useSetsByDate,
  useDayMeta,
  useEnsureWorkoutAndAddSet,
  useAddSet,
  useUpdateSet,
  useDeleteSet,
  useDeleteWorkout,
  useSkipExerciseForDay,
} from '../../../../../queries/workouts';
import { useActiveProgramWithDays, useCreateProgramFromPreset } from '../../../../../queries/programs';
import { useCustomExercises } from '../../../../../queries/exercises';
import { resolveExerciseRef, buildCustomMap, type ResolvedExercise } from '../../../../../lib/exercise-resolve';
import { resolveProgramDay } from '../../../../../lib/program';
import { totalVolume } from '../../../../../lib/calc';
import { DuplicateProgramError } from '../../../../../lib/data-bridge';
import { computeOffDays, type PresetProgram } from '../../../../../data/presets-programs';
import ExerciseCard, { type SetSeed } from '../../../../../components/day/ExerciseCard';
import RestDayBanner from '../../../../../components/day/RestDayBanner';
import AddExerciseSheet from '../../../../../components/day/AddExerciseSheet';
import WorkoutTimerBar, { useWorkoutStopwatch } from '../../../../../components/day/WorkoutTimerBar';
import PresetProgramModal from '../../../../../components/calendar/PresetProgramModal';
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
  const [presetOpen, setPresetOpen] = useState(false);
  const [previewEx, setPreviewEx] = useState<ResolvedExercise | null>(null);
  const sw = useWorkoutStopwatch();

  // PERF: iki fazlı mount — push geçişi ağır kart ağacını (TextInput'lu SetRow'lar)
  // BEKLEMESİN. İlk commit hafif kabuk (app bar + stat şeridi) → geçiş anında başlar.
  const [contentReady, setContentReady] = useState(false);
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setContentReady(true);
    });
    return () => task.cancel();
  }, []);

  const today = todayIso();
  const isToday = dateISO === today;
  const isPast = dateISO < today;

  const workoutsQ = useWorkoutsByDate(dateISO);
  const workouts: AppWorkoutsRow[] = workoutsQ.data ?? [];
  const setsQ = useSetsByDate(dateISO);
  const sets: AppSetsRow[] = setsQ.data ?? [];
  const dayMetaQ = useDayMeta(dateISO);
  const customQ = useCustomExercises();
  const customMap = useMemo(() => buildCustomMap(customQ.data ?? []), [customQ.data]);
  const activeProgQ = useActiveProgramWithDays();
  const activeProgram = activeProgQ.data?.program ?? null;
  const programDays = activeProgQ.data?.days ?? [];

  const ensureAndAdd = useEnsureWorkoutAndAddSet();
  const addSet = useAddSet();
  const updateSet = useUpdateSet();
  const deleteSet = useDeleteSet();
  const deleteWorkout = useDeleteWorkout();
  const skipExercise = useSkipExerciseForDay();
  const createProgM = useCreateProgramFromPreset();

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
  const dowIdx = dateObj ? (dateObj.getDay() + 6) % 7 : 0;
  const dayName = dateObj ? dict.daysFull[dowIdx] ?? '' : '';
  const dayShort = dateObj ? dict.days[dowIdx] ?? '' : '';
  const dateLabel = dateObj ? `${dateObj.getDate()} ${dict.months[dateObj.getMonth()] ?? ''}` : dateISO;
  const title = dateObj ? `${dayShort}, ${dateLabel}` : dateISO;

  const weekLabel = programDay
    ? dict.calendar.weekNumber.replace('%d', String(programDay.weekNumber))
    : '';

  let subtitle = '';
  let subtitleGold = false;
  if (showProgramContext && !isOffDay && activeProgram) {
    subtitle = `${activeProgram.name} · ${dayName} · ${weekLabel}`;
  } else if (isOffDay && activeProgram) {
    subtitle = `${activeProgram.name} · ${t('day.restDayShort')} · ${weekLabel}`;
  } else if (isToday) {
    subtitle = t('day.todayTag');
    subtitleGold = true;
  }

  const isEmpty =
    workouts.length === 0 && lazyRefs.length === 0 && !isOffDay && !workoutsQ.isLoading;

  const setsByWorkout = (wid: string) => sets.filter((s) => s.workout_id === wid);

  // --- handlers ---
  const onAddSetToWorkout = (workoutId: string, seed?: SetSeed) => {
    const existing = setsByWorkout(workoutId);
    const lastIdx = existing.length === 0 ? -1 : Math.max(...existing.map((s) => s.set_index));
    addSet.mutate(
      {
        workoutId,
        setIndex: lastIdx + 1,
        setType: seed?.setType ?? 'working',
        weight: seed?.weight ?? null,
        reps: seed?.reps ?? null,
        rir: seed?.rir ?? '-',
      },
      { onError: (e) => toast.show({ message: (e as Error).message, variant: 'danger' }) },
    );
  };

  const onAddSetToLazy = (ref: string, seed?: SetSeed) => {
    ensureAndAdd.mutate(
      {
        dateISO,
        exerciseRef: ref,
        setType: seed?.setType ?? 'working',
        weight: seed?.weight ?? null,
        reps: seed?.reps ?? null,
        rir: seed?.rir ?? '-',
      },
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
    refs.forEach((ref) => onAddSetToLazy(ref));
    toast.show({ message: t('dayExtra.addedToast', { vars: { n: refs.length } }), variant: 'success' });
  };

  const onSelectPreset = (program: PresetProgram) => {
    createProgM.mutate(
      {
        name: program.name,
        description: program.desc,
        presetSlug: program.slug,
        offDays: computeOffDays(program),
        daysBySlug: program.days,
        cycle_type: 'weekly',
      },
      {
        onSuccess: () => {
          setPresetOpen(false);
          toast.show({ message: t('common.saved'), variant: 'success' });
        },
        onError: (err) => {
          if (err instanceof DuplicateProgramError) {
            toast.show({ message: t('library.duplicateProgram', { vars: { name: err.programName } }), variant: 'info' });
            setPresetOpen(false);
          } else {
            toast.show({ message: (err as Error).message, variant: 'danger' });
          }
        },
      },
    );
  };

  const stackCtas = useWindowDimensions().width < 360;

  const openPreview = (ref: string) => {
    setPreviewEx(resolveExerciseRef(ref, customMap, locale));
  };

  return (
    <Screen scroll={false} hPadding={0}>
      {/* App bar */}
      <HStack gap="sm" align="center" justify="space-between" style={styles.appBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn} accessibilityLabel={t('day.back')}>
          <ArrowLeft color={colors.text.primary} size={22} />
        </Pressable>
        <View style={styles.titleArea}>
          <Text variant="bodyStrong" font="display" numberOfLines={1}>{title}</Text>
          {subtitle ? (
            <Text
              variant="caption"
              numberOfLines={1}
              style={{ color: subtitleGold ? colors.accent.gold : colors.text.secondary, marginTop: 1 }}
            >
              {subtitle}
            </Text>
          ) : null}
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

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Stat strip */}
        <HStack gap="sm" style={[styles.statStrip, { borderColor: colors.border.subtle }]}>
          <View style={styles.statCell}>
            <Text variant="meta" color="tertiary">{t('day.statExercises')}</Text>
            <Text font="mono" style={styles.statValue}>{exerciseCount}</Text>
          </View>
          <View style={[styles.statCell, { borderLeftWidth: StyleSheet.hairlineWidth, borderColor: colors.border.subtle }]}>
            <Text variant="meta" color="tertiary">{t('day.statSets')}</Text>
            <Text font="mono" style={styles.statValue}>{setCount}</Text>
          </View>
          <View style={[styles.statCell, { borderLeftWidth: StyleSheet.hairlineWidth, borderColor: colors.border.subtle }]}>
            <Text variant="meta" color="tertiary">{t('day.statVolume')}</Text>
            <Text font="mono" style={styles.statValue}>{volume > 0 ? `${volume} kg` : '—'}</Text>
          </View>
        </HStack>

        {!contentReady ? null : isOffDay ? (
          <RestDayBanner onAddAnyway={() => setAddOpen(true)} />
        ) : isEmpty ? (
          <VStack gap="md" align="center" style={styles.emptyBody}>
            <Dumbbell color={colors.text.tertiary} size={48} />
            <Text variant="sectionHeading" align="center">{t('day.emptyTitle')}</Text>
            <Text variant="body" color="secondary" align="center">{t('day.emptyDesc')}</Text>
            {stackCtas ? (
              <VStack gap="sm" style={styles.ctaStack}>
                <Button variant="primary" label={t('day.ctaAddExercise')} onPress={() => setAddOpen(true)} fullWidth />
                <Button variant="secondary" label={t('day.ctaChoosePreset')} onPress={() => setPresetOpen(true)} fullWidth />
              </VStack>
            ) : (
              <HStack gap="sm">
                <Button variant="primary" label={t('day.ctaAddExercise')} onPress={() => setAddOpen(true)} />
                <Button variant="secondary" label={t('day.ctaChoosePreset')} onPress={() => setPresetOpen(true)} />
              </HStack>
            )}
          </VStack>
        ) : (
          <VStack gap="sm" style={styles.cardList}>
            {/* Persisted cards */}
            {workouts.map((w) => {
              const resolved = resolveExerciseRef(w.exercise_ref, customMap, locale);
              const isProgramEx = !!programDay && programDay.exerciseRefs.includes(w.exercise_ref);
              return (
                <ExerciseCard
                  key={w.id}
                  resolved={resolved}
                  dateISO={dateISO}
                  sets={setsByWorkout(w.id)}
                  onAddSet={(seed) => onAddSetToWorkout(w.id, seed)}
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
                  dateISO={dateISO}
                  sets={[]}
                  onAddSet={(seed) => onAddSetToLazy(ref, seed)}
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

      {/* Antrenman kronometresi (ephemeral) — sticky bottom */}
      <WorkoutTimerBar sw={sw} />

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
      <PresetProgramModal
        visible={presetOpen}
        onDismiss={() => setPresetOpen(false)}
        onSelectPreset={onSelectPreset}
        isSubmitting={createProgM.isPending}
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
  appBar: { paddingHorizontal: 8, paddingVertical: 6 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  titleArea: { flex: 1, alignItems: 'center' },
  scroll: { flex: 1 },
  statStrip: {
    marginTop: 8,
    marginHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statCell: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22, fontWeight: '700' },
  emptyBody: { paddingVertical: 32, paddingHorizontal: 24 },
  ctaStack: { alignSelf: 'stretch' },
  cardList: { paddingHorizontal: 12, paddingTop: 12 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 76,
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
