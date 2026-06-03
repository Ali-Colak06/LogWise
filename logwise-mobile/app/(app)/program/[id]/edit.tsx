/**
 * D3 Program Edit — tam ekran (ADIM 6 — §8.4.1 + §8.10).
 *
 * Bottom nav GİZLİ (bu route (tabs) dışında, (app) Stack altında).
 * name/desc editor + cycle settings (weekly/deload/none + deload_every) +
 * 7 collapsible gün paneli (egzersiz ekle/çıkar/sırala/taşı + off-day toggle) +
 * Aktif Et CTA + Sil. Autosave: değişiklikler anında mutation (debounce yerine
 * her edit'te commit — basit/güvenli; cihaz testinde debounce eklenebilir).
 *
 * NOT (OPEN): drag/reorder yerine ⋮ menü "yukarı/aşağı taşı" (draggable-flatlist
 * paketi yüklü değil). Spec drag istiyor — ADIM 7 paket eklenince upgrade.
 */
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft, ChevronDown, ChevronUp, X, Moon, Plus, MoreVertical,
} from 'lucide-react-native';
import { Screen, Text, Button, HStack, useToast } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { useT, useLocaleStore, useTranslations } from '../../../../lib/i18n';
import {
  useProgram,
  useProgramDays,
  useUpdateProgram,
  useDeleteProgram,
  useActivateProgram,
  useDeactivateProgram,
  useActiveProgram,
  useAddProgramDayExercise,
  useRemoveProgramDayExercise,
  useReorderProgramDay,
  useMoveProgramDayExercise,
  useClearProgramDay,
} from '../../../../queries/programs';
import { useCustomExercises } from '../../../../queries/exercises';
import { resolveExerciseRef, buildCustomMap } from '../../../../lib/exercise-resolve';
import { totalProgramExercises } from '../../../../lib/program';
import AddExerciseSheet from '../../../../components/day/AddExerciseSheet';
import ConfirmModal from '../../../../components/workout/ConfirmModal';
import type { AppProgramDaysRow, CycleType, DayIndex } from '../../../../types/database';

const DELOAD_OPTS = [3, 4, 5, 6, 8];

export default function ProgramEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const programId = typeof params.id === 'string' ? params.id : '';
  const { colors } = useTheme();
  const t = useT();
  const toast = useToast();
  const locale = useLocaleStore((s) => s.locale);
  const dict = useTranslations();

  const programQ = useProgram(programId);
  const program = programQ.data ?? null;
  const daysQ = useProgramDays(programId);
  const days: AppProgramDaysRow[] = daysQ.data ?? [];
  const customQ = useCustomExercises();
  const customMap = useMemo(() => buildCustomMap(customQ.data ?? []), [customQ.data]);
  const activeProgQ = useActiveProgram();
  const activeProgram = activeProgQ.data ?? null;

  const updateProg = useUpdateProgram();
  const deleteProg = useDeleteProgram();
  const activateProg = useActivateProgram();
  const deactivateProg = useDeactivateProgram();
  const addEx = useAddProgramDayExercise();
  const removeEx = useRemoveProgramDayExercise();
  const reorder = useReorderProgramDay();
  const moveEx = useMoveProgramDayExercise();
  const clearDay = useClearProgramDay();

  const [name, setName] = useState<string | null>(null);
  const [desc, setDesc] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set([(new Date().getDay() + 6) % 7]));
  const [addForDay, setAddForDay] = useState<DayIndex | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // İlk yüklemede local state'i doldur
  const nameVal = name ?? program?.name ?? '';
  const descVal = desc ?? program?.description ?? '';

  if (!programQ.isLoading && !program) {
    return (
      <Screen scroll={false}>
        <View style={styles.appBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}><ArrowLeft size={22} color={colors.text.primary} /></Pressable>
        </View>
        <Text variant="body" color="secondary" align="center" style={{ marginTop: 40 }}>—</Text>
      </Screen>
    );
  }

  const isActive = !!program && program.activated_at !== null;
  const totalEx = totalProgramExercises(days);
  const canActivate = totalEx > 0;

  const commitName = () => {
    const n = nameVal.trim();
    if (n.length === 0 || !program) return;
    updateProg.mutate({ programId, patch: { name: n } });
  };
  const commitDesc = () => {
    if (!program) return;
    updateProg.mutate({ programId, patch: { description: descVal.trim() } });
  };

  const setCycle = (cycle: CycleType) => {
    updateProg.mutate({ programId, patch: { cycle_type: cycle } });
  };
  const setDeloadEvery = (n: number) => {
    updateProg.mutate({ programId, patch: { deload_every: n } });
  };

  const toggleExpand = (di: number) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(di)) n.delete(di); else n.add(di);
      return n;
    });

  const dayExercises = (di: DayIndex): AppProgramDaysRow[] =>
    days.filter((d) => d.day_index === di).sort((a, b) => a.position - b.position);

  const isOff = (di: DayIndex) => (program?.off_days ?? []).includes(di) && dayExercises(di).length === 0;

  const onToggleOff = (di: DayIndex) => {
    if (!program) return;
    const off: number[] = program.off_days ?? [];
    const currentlyOff = off.includes(di);
    if (currentlyOff) {
      updateProg.mutate({ programId, patch: { off_days: off.filter((d: number) => d !== di) } });
      return;
    }
    const exs = dayExercises(di);
    const apply = () => {
      updateProg.mutate({ programId, patch: { off_days: [...off, di] } });
      if (exs.length > 0) clearDay.mutate({ programId, dayIndex: di });
    };
    if (exs.length > 0) {
      Alert.alert(
        t('programEdit.offDayConfirmTitle'),
        t('programEdit.offDayConfirmBody', { vars: { n: exs.length } }),
        [
          { text: t('library.cancel'), style: 'cancel' },
          { text: t('programEdit.makeOffDay'), style: 'destructive', onPress: apply },
        ],
      );
    } else {
      apply();
    }
  };

  const onAddRefs = (refs: string[]) => {
    if (addForDay === null) return;
    const di = addForDay;
    refs.forEach((ref) => addEx.mutate({ programId, dayIndex: di, exerciseRef: ref }));
    setAddForDay(null);
  };

  const onMoveExercise = (di: DayIndex, ref: string, name2: string) => {
    const buttons = ([0, 1, 2, 3, 4, 5, 6] as DayIndex[])
      .filter((d) => d !== di)
      .map((d) => ({
        text: dict.daysFull[d] ?? String(d),
        onPress: () => moveEx.mutate({ programId, fromDay: di, toDay: d, exerciseRef: ref }),
      }));
    Alert.alert(t('programEdit.moveToDayTitle', { vars: { name: name2 } }), undefined, [
      ...buttons,
      { text: t('library.cancel'), style: 'cancel' },
    ]);
  };

  const onReorder = (di: DayIndex, ref: string, dir: -1 | 1) => {
    const list = dayExercises(di).map((d) => d.exercise_ref);
    const idx = list.indexOf(ref);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= list.length) return;
    const next = [...list];
    const tmp = next[idx]!;
    next[idx] = next[target]!;
    next[target] = tmp;
    reorder.mutate({ programId, dayIndex: di, orderedRefs: next });
  };

  const onActivate = () => {
    if (!program) return;
    if (activeProgram && activeProgram.id !== program.id) {
      Alert.alert(
        t('library.activateConfirmTitle'),
        t('library.activateConfirmBody', { vars: { name: activeProgram.name } }),
        [
          { text: t('library.cancel'), style: 'cancel' },
          {
            text: t('library.activate'),
            onPress: () =>
              activateProg.mutate(program.id, {
                onSuccess: () => toast.show({ message: t('programEdit.activatedToast', { vars: { name: program.name } }), variant: 'success' }),
              }),
          },
        ],
      );
    } else {
      activateProg.mutate(program.id, {
        onSuccess: () => toast.show({ message: t('programEdit.activatedToast', { vars: { name: program.name } }), variant: 'success' }),
      });
    }
  };

  const cycleType = program?.cycle_type ?? 'weekly';
  const deloadEvery = program?.deload_every ?? 4;

  return (
    <Screen scroll={false}>
      {/* App bar */}
      <HStack gap="sm" align="center" justify="space-between" style={styles.appBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn} accessibilityLabel={t('day.back')}>
          <ArrowLeft size={22} color={colors.text.primary} />
        </Pressable>
        <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>
          {nameVal || t('programEdit.titleNew')}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={8} style={[styles.savePill, { backgroundColor: colors.accent.gold }]}>
          <Text variant="meta" color="onAccent">{t('programEdit.save')}</Text>
        </Pressable>
      </HStack>

      <ScrollView contentContainerStyle={{ paddingBottom: 48, paddingHorizontal: 12 }}>
        {/* Name + desc */}
        <Text variant="caption" color="secondary" style={styles.label}>{t('programEdit.nameLabel')}</Text>
        <TextInput
          value={nameVal}
          onChangeText={setName}
          onBlur={commitName}
          placeholderTextColor={colors.text.tertiary}
          style={[styles.input, { color: colors.text.primary, borderColor: colors.border.subtle, backgroundColor: colors.background.subtle }]}
        />
        <Text variant="caption" color="secondary" style={styles.label}>{t('programEdit.descLabel')}</Text>
        <TextInput
          value={descVal}
          onChangeText={setDesc}
          onBlur={commitDesc}
          multiline
          placeholderTextColor={colors.text.tertiary}
          style={[styles.input, { height: 56, color: colors.text.primary, borderColor: colors.border.subtle, backgroundColor: colors.background.subtle }]}
        />

        {/* Cycle settings */}
        <View style={[styles.card, { borderColor: colors.border.subtle, backgroundColor: colors.background.elevated }]}>
          <Text variant="caption" color="secondary">{t('programEdit.cycleSettings')}</Text>
          <View style={{ height: 8 }} />
          <Text variant="meta" color="secondary">{t('programEdit.cycleType')}</Text>
          <View style={styles.chipRow}>
            {(['weekly', 'deload', 'none'] as CycleType[]).map((c) => {
              const on = c === cycleType;
              const label = c === 'weekly' ? t('library.cycleWeekly') : c === 'deload' ? t('library.cycleDeload') : t('library.cycleNone');
              return (
                <Pressable key={c} onPress={() => setCycle(c)} style={[styles.chip, { borderColor: on ? colors.accent.gold : colors.border.subtle, backgroundColor: on ? colors.accent.goldMuted : 'transparent' }]}>
                  <Text variant="meta" color={on ? 'primary' : 'secondary'}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
          {cycleType === 'deload' && (
            <>
              <View style={{ height: 10 }} />
              <Text variant="meta" color="secondary">{t('programEdit.deloadEvery')}</Text>
              <View style={styles.chipRow}>
                {DELOAD_OPTS.map((n) => {
                  const on = n === deloadEvery;
                  return (
                    <Pressable key={n} onPress={() => setDeloadEvery(n)} style={[styles.chip, { borderColor: on ? colors.accent.gold : colors.border.subtle, backgroundColor: on ? colors.accent.goldMuted : 'transparent' }]}>
                      <Text variant="meta" color={on ? 'primary' : 'secondary'}>{n}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* Days */}
        <Text variant="caption" color="secondary" style={[styles.label, { marginTop: 16 }]}>{t('programEdit.weekDays')}</Text>
        {([0, 1, 2, 3, 4, 5, 6] as DayIndex[]).map((di) => {
          const exs = dayExercises(di);
          const off = isOff(di);
          const open = expanded.has(di);
          return (
            <View key={di} style={[styles.dayPanel, { borderColor: colors.border.subtle, backgroundColor: colors.background.elevated }]}>
              <Pressable onPress={() => toggleExpand(di)} style={styles.dayHead}>
                <Text variant="bodyStrong" style={{ flex: 1 }}>{dict.daysFull[di] ?? ''}</Text>
                <Text variant="meta" color="secondary" style={{ marginRight: 8 }}>
                  {off ? `💤 ${t('programEdit.offBadge')}` : t('programEdit.exerciseCount', { vars: { n: exs.length } })}
                </Text>
                {open ? <ChevronUp size={18} color={colors.text.secondary} /> : <ChevronDown size={18} color={colors.text.secondary} />}
              </Pressable>

              {open && (
                <View style={styles.dayBody}>
                  {off ? (
                    <View style={styles.offEmpty}>
                      <Moon size={28} color={colors.semantic.info} strokeWidth={1.5} />
                      <Text variant="caption" color="secondary" align="center" style={{ marginTop: 6 }}>{t('programEdit.offDayEmptyDesc')}</Text>
                      <View style={{ height: 10 }} />
                      <Button variant="ghost" size="sm" label={t('programEdit.removeOffDay')} onPress={() => onToggleOff(di)} />
                    </View>
                  ) : (
                    <>
                      {exs.map((ex, i) => {
                        const r = resolveExerciseRef(ex.exercise_ref, customMap, locale);
                        return (
                          <View key={ex.exercise_ref} style={[styles.exRow, { borderColor: colors.border.subtle }]}>
                            <View style={styles.reorder}>
                              <Pressable onPress={() => onReorder(di, ex.exercise_ref, -1)} hitSlop={6} disabled={i === 0}>
                                <ChevronUp size={16} color={i === 0 ? colors.text.disabled : colors.text.secondary} />
                              </Pressable>
                              <Pressable onPress={() => onReorder(di, ex.exercise_ref, 1)} hitSlop={6} disabled={i === exs.length - 1}>
                                <ChevronDown size={16} color={i === exs.length - 1 ? colors.text.disabled : colors.text.secondary} />
                              </Pressable>
                            </View>
                            <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>{r.name}</Text>
                            <Pressable onPress={() => onMoveExercise(di, ex.exercise_ref, r.name)} hitSlop={6} style={{ padding: 4 }}>
                              <MoreVertical size={16} color={colors.text.tertiary} />
                            </Pressable>
                            <Pressable onPress={() => removeEx.mutate({ programId, dayIndex: di, exerciseRef: ex.exercise_ref })} hitSlop={6} style={{ padding: 4 }}>
                              <X size={16} color={colors.text.tertiary} />
                            </Pressable>
                          </View>
                        );
                      })}
                      <View style={{ height: 8 }} />
                      <HStack gap="sm">
                        <Button variant="secondary" size="sm" label={t('programEdit.addExercise')} onPress={() => setAddForDay(di)} icon={<Plus size={14} color={colors.text.primary} />} />
                        <Button variant="ghost" size="sm" label={t('programEdit.makeOffDay')} onPress={() => onToggleOff(di)} />
                      </HStack>
                    </>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {/* Activate CTA */}
        <View style={{ height: 20 }} />
        {isActive ? (
          <Button variant="secondary" label={t('programEdit.activeLabel')} onPress={() => program && deactivateProg.mutate(program.id)} fullWidth />
        ) : (
          <Button
            variant="primary"
            label={canActivate ? t('programEdit.activateCta') : t('programEdit.activateDisabled')}
            onPress={onActivate}
            disabled={!canActivate}
            fullWidth
          />
        )}

        {/* Delete */}
        <Pressable onPress={() => setDeleteOpen(true)} style={{ paddingVertical: 18, alignItems: 'center' }}>
          <Text variant="body" style={{ color: colors.semantic.danger }}>{t('programEdit.deleteLink')}</Text>
        </Pressable>
      </ScrollView>

      <AddExerciseSheet
        visible={addForDay !== null}
        onClose={() => setAddForDay(null)}
        onAddRefs={onAddRefs}
        initialTab="presets"
      />
      <ConfirmModal
        visible={deleteOpen}
        title={t('library.deleteProgramTitle')}
        body={t('library.deleteProgramBody')}
        confirmLabel={t('library.delete')}
        cancelLabel={t('library.cancel')}
        danger
        onConfirm={() => {
          setDeleteOpen(false);
          if (program) deleteProg.mutate(program.id, { onSuccess: () => router.back() });
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  appBar: { paddingHorizontal: 8, paddingVertical: 6 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  savePill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  label: { marginTop: 14, marginBottom: 4 },
  input: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, fontSize: 15 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 14, marginTop: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, minWidth: 36, alignItems: 'center' },
  dayPanel: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, marginTop: 8, overflow: 'hidden' },
  dayHead: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  dayBody: { paddingHorizontal: 14, paddingBottom: 14 },
  offEmpty: { alignItems: 'center', paddingVertical: 16 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  reorder: { alignItems: 'center' },
});
