/**
 * Library (Kütüphane) — D1 Exercises + D2 Programs (ADIM 6).
 *
 * Tek route; SegmentedTabs ile içerik swap (§8.9). App bar: hamburger (More) + başlık
 * + count + "+ New" pill. D1: custom + tarihçe preset union, search + kategori filtre,
 * row tap → preview, long-press → menü (preview/edit/delete). D2: ActiveProgramCard +
 * OtherProgramsList + NewProgramSheet → D3 push, ProgramActionSheet (activate/edit/delete).
 */
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Menu, Search, Plus, ChevronRight, Dumbbell } from 'lucide-react-native';
import { Screen, Text, Button, HStack, SegmentedTabs, useToast } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { useT, useLocaleStore } from '../../../../lib/i18n';
import { PRESET_EXERCISES, getPresetDisplayName } from '../../../../data/presets-exercises';
import {
  useCustomExercises,
  useUpdateCustomExercise,
  useDeleteCustomExercise,
} from '../../../../queries/exercises';
import {
  usePrograms,
  useActiveProgram,
  useProgramDays,
  useCreateEmptyProgram,
  useActivateProgram,
  useDeactivateProgram,
  useDeleteProgram,
} from '../../../../queries/programs';
import { useAllWorkoutDates, useUsedExerciseRefs } from '../../../../queries/workouts';
import {
  resolveExerciseRef,
  buildCustomMap,
  turkishCatToKey,
  type CategoryKey,
  type ResolvedExercise,
} from '../../../../lib/exercise-resolve';
import ActiveProgramCard from '../../../../components/workout/ActiveProgramCard';
import ProgramActionSheet from '../../../../components/workout/ProgramActionSheet';
import NewProgramSheet from '../../../../components/workout/NewProgramSheet';
import ConfirmModal from '../../../../components/workout/ConfirmModal';
import CustomExerciseEditSheet from '../../../../components/workout/CustomExerciseEditSheet';
import ExPreviewModal from '../../../../components/shared/ExPreviewModal';
import type { AppExercisesRow, AppProgramsRow } from '../../../../types/database';

type Seg = 'exercises' | 'programs';

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}
function todayDow(): number {
  return (new Date().getDay() + 6) % 7;
}

const CATS: Array<CategoryKey | 'all'> = ['all', 'chest', 'back', 'shoulder', 'biceps', 'triceps', 'leg', 'core', 'cardio'];
function lc(s: string): string { return s.toLocaleLowerCase('tr'); }

export default function WorkoutScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const t = useT();
  const toast = useToast();
  const locale = useLocaleStore((s) => s.locale);

  const [seg, setSeg] = useState<Seg>('exercises');
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<CategoryKey | 'all'>('all');

  // D1 modals
  const [previewEx, setPreviewEx] = useState<ResolvedExercise | null>(null);
  const [editEx, setEditEx] = useState<AppExercisesRow | null>(null);

  // D2 modals
  const [newProgOpen, setNewProgOpen] = useState(false);
  const [actionProg, setActionProg] = useState<AppProgramsRow | null>(null);
  const [activateTarget, setActivateTarget] = useState<AppProgramsRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppProgramsRow | null>(null);

  const customQ = useCustomExercises();
  const customRows = customQ.data ?? [];
  const customMap = useMemo(() => buildCustomMap(customRows), [customRows]);
  const updateCustom = useUpdateCustomExercise();
  const deleteCustom = useDeleteCustomExercise();

  const programsQ = usePrograms();
  const programs = programsQ.data ?? [];
  const activeProgQ = useActiveProgram();
  const activeProgram = activeProgQ.data ?? null;
  const activeDaysQ = useProgramDays(activeProgram?.id);
  const workoutDatesQ = useAllWorkoutDates();
  const usedRefsQ = useUsedExerciseRefs();
  const createEmpty = useCreateEmptyProgram();
  const activateProg = useActivateProgram();
  const deactivateProg = useDeactivateProgram();
  const deleteProg = useDeleteProgram();

  // §8.8: Kütüphanem = custom (her zaman) + tarihçede kullanılmış preset slug'ları.
  // Tarihçe henüz yüklenmediyse yalnızca custom gösterilir.
  const usedPresetSlugs = useMemo(() => {
    const refs: string[] = usedRefsQ.data ?? [];
    const presetIds = new Set(PRESET_EXERCISES.map((p) => p.id));
    return refs.filter((ref: string) => presetIds.has(ref));
  }, [usedRefsQ.data]);

  // D1 list: custom (her zaman) + tarihçede kullanılmış preset (§8.8 Kütüphanem)
  const d1Rows = useMemo(() => {
    const out: Array<{ ref: string; name: string; cat: CategoryKey; isPreset: boolean }> = [];
    for (const c of customRows) {
      const r = resolveExerciseRef(c.id, customMap, locale);
      out.push({ ref: c.id, name: r.name, cat: r.categories[0] ?? 'other', isPreset: false });
    }
    const usedSet = new Set(usedPresetSlugs);
    for (const p of PRESET_EXERCISES) {
      if (!usedSet.has(p.id)) continue;
      out.push({
        ref: p.id,
        name: getPresetDisplayName(p.id, locale),
        cat: p.categories[0] ? turkishCatToKey(p.categories[0]) : 'other',
        isPreset: true,
      });
    }
    return out;
  }, [customRows, customMap, locale, usedPresetSlugs]);

  const d1Filtered = useMemo(() => {
    const q = lc(query.trim());
    return d1Rows
      .filter((r) => (cat === 'all' ? true : r.cat === cat))
      .filter((r) => (q === '' ? true : lc(r.name).includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name, locale));
  }, [d1Rows, cat, query, locale]);

  const exerciseCount = customRows.length + PRESET_EXERCISES.length;
  const programCount = programs.length;
  const passivePrograms = programs.filter((p: AppProgramsRow) => p.id !== activeProgram?.id);

  // --- D1 handlers ---
  const openPreview = (ref: string) => setPreviewEx(resolveExerciseRef(ref, customMap, locale));
  const onRowMenu = (ref: string, isPreset: boolean) => {
    if (isPreset) {
      Alert.alert(getPresetDisplayName(ref, locale), t('library.presetReadonly'), [
        { text: t('library.preview'), onPress: () => openPreview(ref) },
        { text: t('library.cancel'), style: 'cancel' },
      ]);
      return;
    }
    const row = customRows.find((c: AppExercisesRow) => c.id === ref);
    if (!row) return;
    Alert.alert(row.name, undefined, [
      { text: t('library.preview'), onPress: () => openPreview(ref) },
      { text: t('library.edit'), onPress: () => setEditEx(row) },
      {
        text: t('library.delete'),
        style: 'destructive',
        onPress: () =>
          Alert.alert(t('library.deleteExTitle'), t('library.deleteExBody'), [
            { text: t('library.cancel'), style: 'cancel' },
            {
              text: t('library.delete'),
              style: 'destructive',
              onPress: () =>
                deleteCustom.mutate(row.id, {
                  onSuccess: () => toast.show({ message: t('library.deletedToast', { vars: { name: row.name } }), variant: 'info' }),
                }),
            },
          ]),
      },
      { text: t('library.cancel'), style: 'cancel' },
    ]);
  };

  // --- D2 handlers ---
  const onCreateProgram = (input: { name: string; description?: string }) => {
    createEmpty.mutate(input, {
      onSuccess: ({ programId }) => {
        setNewProgOpen(false);
        router.push(`/program/${programId}/edit`);
      },
      onError: (e) => toast.show({ message: (e as Error).message, variant: 'danger' }),
    });
  };

  const onActivatePress = (program: AppProgramsRow) => {
    setActionProg(null);
    if (activeProgram && activeProgram.id !== program.id) {
      setActivateTarget(program);
    } else {
      activateProg.mutate(program.id, {
        onSuccess: () => toast.show({ message: t('programEdit.activatedToast', { vars: { name: program.name } }), variant: 'success' }),
      });
    }
  };

  const confirmActivate = () => {
    if (!activateTarget) return;
    const tgt = activateTarget;
    setActivateTarget(null);
    activateProg.mutate(tgt.id, {
      onSuccess: () => toast.show({ message: t('programEdit.activatedToast', { vars: { name: tgt.name } }), variant: 'success' }),
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    deleteProg.mutate(id);
  };

  return (
    <Screen scroll={false}>
      {/* App bar */}
      <HStack gap="sm" align="center" style={styles.appBar}>
        <Pressable hitSlop={8} style={styles.iconBtn} accessibilityLabel={t('common.more')}>
          <Menu size={22} color={colors.text.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{t('library.title')}</Text>
          <Text variant="meta" color="secondary">
            {seg === 'exercises'
              ? t('library.countExercises', { vars: { n: exerciseCount } })
              : t('library.countPrograms', { vars: { n: programCount } })}
          </Text>
        </View>
        {seg === 'programs' && (
          <Button variant="secondary" size="sm" label={t('library.newPill')} onPress={() => setNewProgOpen(true)} />
        )}
      </HStack>

      <View style={{ paddingHorizontal: 8, marginTop: 4 }}>
        <SegmentedTabs<Seg>
          options={[
            { key: 'exercises', label: t('library.segExercises'), count: exerciseCount },
            { key: 'programs', label: t('library.segPrograms'), count: programCount },
          ]}
          value={seg}
          onChange={setSeg}
        />
      </View>

      {seg === 'exercises' ? (
        <>
          {/* Search */}
          <View style={[styles.search, { backgroundColor: colors.background.subtle, borderColor: colors.border.subtle }]}>
            <Search size={16} color={colors.text.tertiary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('library.searchPlaceholder')}
              placeholderTextColor={colors.text.tertiary}
              style={[styles.searchInput, { color: colors.text.primary }]}
            />
          </View>
          {/* Category strip */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catStrip} contentContainerStyle={{ gap: 6, paddingHorizontal: 8 }}>
            {CATS.map((c) => {
              const on = c === cat;
              const label = c === 'all' ? t('dayExtra.catAll') : c;
              return (
                <Pressable key={c} onPress={() => setCat(c)} style={[styles.catChip, { borderColor: on ? colors.accent.gold : colors.border.subtle, backgroundColor: on ? colors.accent.goldMuted : 'transparent' }]}>
                  <Text variant="meta" color={on ? 'primary' : 'secondary'}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView contentContainerStyle={{ paddingBottom: 96, paddingHorizontal: 8 }}>
            {d1Filtered.length === 0 ? (
              <View style={styles.empty}>
                <Dumbbell size={48} color={colors.text.tertiary} />
                <Text variant="sectionHeading" align="center" style={{ marginTop: 12 }}>{t('library.emptyExTitle')}</Text>
                <Text variant="body" color="secondary" align="center" style={{ marginTop: 6 }}>{t('library.noResults')}</Text>
              </View>
            ) : (
              d1Filtered.map((r) => (
                <Pressable
                  key={r.ref}
                  onPress={() => openPreview(r.ref)}
                  onLongPress={() => onRowMenu(r.ref, r.isPreset)}
                  delayLongPress={400}
                  style={({ pressed }) => [styles.exRow, { borderColor: colors.border.subtle }, pressed && { opacity: 0.7 }]}
                >
                  <View style={[styles.accent, { backgroundColor: colors.category[r.cat] }]} />
                  <View style={{ flex: 1 }}>
                    <Text variant="body" numberOfLines={1}>{r.name}</Text>
                  </View>
                  {!r.isPreset && <Text variant="meta" color="tertiary">{t('library.customBadge')}</Text>}
                  <ChevronRight size={16} color={colors.text.tertiary} />
                </Pressable>
              ))
            )}
          </ScrollView>
        </>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
          {programCount === 0 ? (
            <View style={styles.empty}>
              <Dumbbell size={48} color={colors.text.tertiary} />
              <Text variant="sectionHeading" align="center" style={{ marginTop: 12 }}>{t('library.emptyPgTitle')}</Text>
              <Text variant="body" color="secondary" align="center" style={{ marginTop: 6 }}>{t('library.emptyPgDesc')}</Text>
              <View style={{ height: 16 }} />
              <Button variant="primary" label={t('library.emptyPgCreate')} onPress={() => setNewProgOpen(true)} />
            </View>
          ) : (
            <>
              {activeProgram ? (
                <ActiveProgramCard
                  program={activeProgram}
                  programDays={activeDaysQ.data ?? []}
                  workoutDates={workoutDatesQ.data ?? []}
                  todayISO={todayIso()}
                  todayDow={todayDow()}
                  onEdit={() => router.push(`/program/${activeProgram.id}/edit`)}
                  onMenu={() =>
                    Alert.alert(activeProgram.name, undefined, [
                      { text: t('library.deactivate'), onPress: () => deactivateProg.mutate(activeProgram.id) },
                      { text: t('library.delete'), style: 'destructive', onPress: () => setDeleteTarget(activeProgram) },
                      { text: t('library.cancel'), style: 'cancel' },
                    ])
                  }
                  onTodayWorkout={() => router.push(`/calendar/day/${todayIso()}`)}
                  onViewWeek={() => router.push('/calendar')}
                />
              ) : (
                <Text variant="body" color="secondary" style={styles.noActive}>{t('library.noActiveHint')}</Text>
              )}

              {passivePrograms.length > 0 && (
                <View style={{ marginTop: 20, paddingHorizontal: 8 }}>
                  <Text variant="caption" color="secondary">
                    {t('library.otherPrograms')}  ·  {t('library.otherCount', { vars: { n: passivePrograms.length } })}
                  </Text>
                  <View style={{ height: 8 }} />
                  {passivePrograms.map((p: AppProgramsRow) => (
                    <Pressable
                      key={p.id}
                      onPress={() => setActionProg(p)}
                      style={({ pressed }) => [styles.pgRow, { backgroundColor: colors.background.elevated, borderColor: colors.border.subtle }, pressed && { opacity: 0.8 }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyStrong" numberOfLines={1}>{p.name}</Text>
                        {p.description ? (
                          <Text variant="meta" color="secondary" numberOfLines={1}>{p.description}</Text>
                        ) : null}
                      </View>
                      <ChevronRight size={18} color={colors.text.tertiary} />
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Modals */}
      <ExPreviewModal visible={previewEx !== null} exercise={previewEx} onClose={() => setPreviewEx(null)} />
      <CustomExerciseEditSheet
        visible={editEx !== null}
        exercise={editEx}
        onCancel={() => setEditEx(null)}
        onSave={(patch) => {
          if (editEx) updateCustom.mutate({ id: editEx.id, patch });
          setEditEx(null);
        }}
      />
      <NewProgramSheet
        visible={newProgOpen}
        onCancel={() => setNewProgOpen(false)}
        onSubmit={onCreateProgram}
        submitting={createEmpty.isPending}
      />
      <ProgramActionSheet
        visible={actionProg !== null}
        program={actionProg}
        onClose={() => setActionProg(null)}
        onActivate={() => { if (actionProg) onActivatePress(actionProg); }}
        onEdit={() => { const p = actionProg; setActionProg(null); if (p) router.push(`/program/${p.id}/edit`); }}
        onDelete={() => { const p = actionProg; setActionProg(null); if (p) setDeleteTarget(p); }}
      />
      <ConfirmModal
        visible={activateTarget !== null}
        title={t('library.activateConfirmTitle')}
        body={activeProgram ? t('library.activateConfirmBody', { vars: { name: activeProgram.name } }) : ''}
        confirmLabel={t('library.activate')}
        cancelLabel={t('library.cancel')}
        onConfirm={confirmActivate}
        onCancel={() => setActivateTarget(null)}
      />
      <ConfirmModal
        visible={deleteTarget !== null}
        title={t('library.deleteProgramTitle')}
        body={t('library.deleteProgramBody')}
        confirmLabel={t('library.delete')}
        cancelLabel={t('library.cancel')}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  appBar: { paddingHorizontal: 8, paddingVertical: 6 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 8, marginTop: 10, paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 10, borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  catStrip: { marginTop: 10, flexGrow: 0 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  exRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 4, borderTopWidth: StyleSheet.hairlineWidth,
  },
  accent: { width: 3, height: 28, borderRadius: 2 },
  empty: { alignItems: 'center', paddingTop: 56, paddingHorizontal: 24 },
  noActive: { paddingHorizontal: 16, paddingTop: 16 },
  pgRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 14, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, marginBottom: 8,
  },
});
