/**
 * Library (Kütüphane) — D1 Exercises + D2 Programs (ADIM 6).
 *
 * Tek route; SegmentedTabs ile içerik swap (§8.9). App bar: hamburger (More) + başlık
 * + count + "+ New" pill. D1: custom + tarihçe preset union, search + kategori filtre,
 * row tap → preview, long-press → menü (preview/edit/delete). D2: ActiveProgramCard +
 * OtherProgramsList + NewProgramSheet → D3 push, ProgramActionSheet (activate/edit/delete).
 */
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, ChevronRight, Dumbbell } from 'lucide-react-native';
import { Screen, Text, Button, HStack, SegmentedTabs, useToast } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { useT, useLocaleStore, useTranslations } from '../../../../lib/i18n';
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
  useProgramDayCounts,
  useCreateEmptyProgram,
  useCreateProgramFromPreset,
  useActivateProgram,
  useDeactivateProgram,
  useDeleteProgram,
} from '../../../../queries/programs';
import { useAllWorkoutDates, useLastSessionByRef } from '../../../../queries/workouts';
import {
  resolveExerciseRef,
  buildCustomMap,
  turkishCatToKey,
  catLabel,
  type CategoryKey,
  type ResolvedExercise,
} from '../../../../lib/exercise-resolve';
import ActiveProgramCard from '../../../../components/workout/ActiveProgramCard';
import ProgramActionSheet from '../../../../components/workout/ProgramActionSheet';
import NewProgramSheet from '../../../../components/workout/NewProgramSheet';
import ConfirmModal from '../../../../components/workout/ConfirmModal';
import PresetProgramModal from '../../../../components/calendar/PresetProgramModal';
import { computeOffDays, type PresetProgram } from '../../../../data/presets-programs';
import { DuplicateProgramError } from '../../../../lib/data-bridge';
import CustomExerciseEditSheet from '../../../../components/workout/CustomExerciseEditSheet';
import ExPreviewModal from '../../../../components/shared/ExPreviewModal';
import ProfilePopover, { type AnchorRect } from '../../../../components/shared/ProfilePopover';
import AddExerciseSheet from '../../../../components/day/AddExerciseSheet';
import { useAuthMode, useAuthSession } from '../../../../stores/auth-store';
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
  const { colors, tokens } = useTheme();
  const t = useT();
  const dict = useTranslations();
  const toast = useToast();
  const locale = useLocaleStore((s) => s.locale);

  // App bar avatar → ProfilePopover (Calendar app bar ile aynı kalıp; her ekran kendi
  // prototip imzasını taşır — kullanıcı kararı 2026-06-19: hamburger yerine profil tuşu).
  const mode = useAuthMode();
  const session = useAuthSession();
  const avatarInitials = useMemo(() => {
    if (mode === 'guest') return 'M';
    const email = session?.user.email ?? '';
    const displayName =
      (session?.user.user_metadata?.display_name as string | undefined) ??
      email.split('@')[0] ??
      'LogWise';
    return displayName.slice(0, 2).toUpperCase();
  }, [mode, session]);
  const avatarRef = useRef<View | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarRect, setAvatarRect] = useState<AnchorRect | null>(null);
  const openProfile = () => {
    avatarRef.current?.measureInWindow((x, y, width, height) => {
      setAvatarRect({ x, y, width, height });
      setProfileOpen(true);
    });
  };

  const [seg, setSeg] = useState<Seg>('exercises');
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<CategoryKey | 'all'>('all');

  // D1 modals
  const [newCustomOpen, setNewCustomOpen] = useState(false);
  const [previewEx, setPreviewEx] = useState<ResolvedExercise | null>(null);
  const [editEx, setEditEx] = useState<AppExercisesRow | null>(null);

  // D2 modals
  const [newProgOpen, setNewProgOpen] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const [actionProg, setActionProg] = useState<AppProgramsRow | null>(null);
  const [activateTarget, setActivateTarget] = useState<AppProgramsRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppProgramsRow | null>(null);

  const customQ = useCustomExercises();
  const customRows = customQ.data ?? [];
  const customMap = useMemo(() => buildCustomMap(customRows), [customRows]);
  const lastByRefQ = useLastSessionByRef();
  const lastByRef = lastByRefQ.data ?? {};
  const updateCustom = useUpdateCustomExercise();
  const deleteCustom = useDeleteCustomExercise();

  const programsQ = usePrograms();
  const programs = programsQ.data ?? [];
  const activeProgQ = useActiveProgram();
  const activeProgram = activeProgQ.data ?? null;
  const activeDaysQ = useProgramDays(activeProgram?.id);
  const programCountsQ = useProgramDayCounts();
  const programCounts = programCountsQ.data ?? {};
  const workoutDatesQ = useAllWorkoutDates();
  const createEmpty = useCreateEmptyProgram();
  const createFromPreset = useCreateProgramFromPreset();
  const activateProg = useActivateProgram();
  const deactivateProg = useDeactivateProgram();
  const deleteProg = useDeleteProgram();

  // Hermes'te locale parametreli `localeCompare` HER çağrıda yeni Intl.Collator kurar
  // (yüzlerce çağrı → JS-thread donması). Tek Collator kur, sort'ta yeniden kullan.
  const collator = useMemo(() => new Intl.Collator(locale), [locale]);

  // D1 list: custom hareketler + tüm preset hareketler, alfabetik
  const d1Rows = useMemo(() => {
    const out: Array<{ ref: string; name: string; nameLc: string; cat: CategoryKey; isPreset: boolean }> = [];
    for (const c of customRows) {
      const r = resolveExerciseRef(c.id, customMap, locale);
      out.push({ ref: c.id, name: r.name, nameLc: lc(r.name), cat: r.categories[0] ?? 'other', isPreset: false });
    }
    for (const p of PRESET_EXERCISES) {
      const name = getPresetDisplayName(p.id, locale);
      out.push({
        ref: p.id,
        name,
        nameLc: lc(name),
        cat: p.categories[0] ? turkishCatToKey(p.categories[0]) : 'other',
        isPreset: true,
      });
    }
    return out.sort((a, b) => collator.compare(a.name, b.name));
  }, [customRows, customMap, locale, collator]);

  const d1Filtered = useMemo(() => {
    const q = lc(query.trim());
    // d1Rows zaten sıralı; filter sırayı korur → ikinci sort gereksiz.
    return d1Rows
      .filter((r) => (cat === 'all' ? true : r.cat === cat))
      .filter((r) => (q === '' ? true : r.nameLc.includes(q)));
  }, [d1Rows, cat, query]);

  // Alfabetik sticky letter-head bölümleri (SectionList). d1Filtered zaten sıralı.
  const d1Sections = useMemo(() => {
    const sections: Array<{ title: string; data: typeof d1Filtered }> = [];
    let cur: { title: string; data: typeof d1Filtered } | null = null;
    for (const r of d1Filtered) {
      const letter = (r.name.charAt(0) || '#').toLocaleUpperCase('tr');
      if (!cur || cur.title !== letter) {
        cur = { title: letter, data: [] };
        sections.push(cur);
      }
      cur.data.push(r);
    }
    return sections;
  }, [d1Filtered]);

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

  const onSelectPreset = (program: PresetProgram) => {
    createFromPreset.mutate(
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

  // D1 listesi: düz çocuk dizisi + sticky harf-başlık index'leri (ScrollView
  // stickyHeaderIndices). SectionList virtualization'ı uzun yukarı scroll'da satırları
  // boş bırakıyordu (blank rows); liste küçük (~80) → tümünü render et, sanallaştırma yok
  // (AddExerciseSheet ile aynı kalıp). Sticky başlıklar opak arka planla satırların önünde kalır.
  const d1Children: ReactNode[] = [];
  const d1Sticky: number[] = [];
  if (seg === 'exercises') {
    for (const section of d1Sections) {
      d1Sticky.push(d1Children.length);
      d1Children.push(
        <View key={`h-${section.title}`} style={[styles.letterHead, { backgroundColor: colors.background.app }]}>
          <Text font="mono" style={[styles.letterHeadText, { color: colors.text.tertiary }]}>
            {section.title}
          </Text>
        </View>,
      );
      for (const r of section.data) {
        const last = lastByRef[r.ref];
        const lastLabel = last ? `${last.weight} kg × ${last.reps}` : null;
        d1Children.push(
          <Pressable
            key={r.ref}
            onPress={() => openPreview(r.ref)}
            onLongPress={() => onRowMenu(r.ref, r.isPreset)}
            delayLongPress={400}
            style={({ pressed }) => [styles.exRow, { borderColor: colors.border.subtle }, pressed && { opacity: 0.7 }]}
          >
            <View style={[styles.accent, { backgroundColor: colors.category[r.cat] }]} />
            <View style={styles.exBody}>
              <Text variant="body" numberOfLines={1}>{r.name}</Text>
              <View style={styles.exSub}>
                <View style={[styles.rowCatChip, { backgroundColor: colors.categoryMuted[r.cat] }]}>
                  <View style={[styles.rowCatDot, { backgroundColor: colors.category[r.cat] }]} />
                  <Text font="mono" style={[styles.rowCatChipText, { color: colors.category[r.cat] }]}>
                    {catLabel(r.cat, dict.cats)}
                  </Text>
                </View>
                {lastLabel && (
                  <Text font="mono" style={[styles.lastText, { color: colors.text.tertiary }]}>
                    {t('dayExtra.last')}: {lastLabel}
                  </Text>
                )}
                {!r.isPreset && (
                  <Text font="mono" style={[styles.customHint, { color: colors.text.tertiary }]}>
                    {t('library.customBadge')}
                  </Text>
                )}
              </View>
            </View>
            <ChevronRight size={16} color={colors.text.tertiary} />
          </Pressable>,
        );
      }
    }
  }

  return (
    <Screen scroll={false}>
      {/* App bar */}
      <HStack gap="sm" align="center" style={styles.appBar}>
        <Pressable
          ref={avatarRef}
          onPress={openProfile}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={t('more.rowProfile')}
          style={[styles.avatar, { borderColor: colors.border.subtle, backgroundColor: colors.background.subtle }]}
        >
          <Text style={{ color: colors.accent.gold, fontFamily: tokens.fonts.displayBold, fontSize: 13 }}>
            {avatarInitials}
          </Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{t('library.title')}</Text>
          <Text variant="meta" color="secondary">
            {seg === 'exercises'
              ? t('library.countExercises', { vars: { n: exerciseCount } })
              : t('library.countPrograms', { vars: { n: programCount } })}
          </Text>
        </View>
        <Button
          variant="secondary"
          size="sm"
          label={t('library.newPill')}
          onPress={() => (seg === 'exercises' ? setNewCustomOpen(true) : setNewProgOpen(true))}
        />
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
              const label = c === 'all' ? t('dayExtra.catAll') : catLabel(c, dict.cats);
              return (
                <Pressable key={c} onPress={() => setCat(c)} style={[styles.catChip, { borderColor: on ? colors.accent.gold : colors.border.subtle, backgroundColor: on ? colors.accent.goldMuted : 'transparent' }]}>
                  <Text variant="meta" color={on ? 'primary' : 'secondary'}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {d1Filtered.length === 0 ? (
            <View style={styles.noResults}>
              <Text variant="body" color="secondary" align="center">{t('library.noResults')}</Text>
              <View style={{ height: 10 }} />
              <Button variant="ghost" size="sm" label={t('library.emptyExCta')} onPress={() => setNewCustomOpen(true)} />
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 96, paddingHorizontal: 8 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              stickyHeaderIndices={d1Sticky}
            >
              {d1Children}
            </ScrollView>
          )}
        </>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
          {programCount === 0 ? (
            <View style={styles.empty}>
              <Dumbbell size={48} color={colors.text.tertiary} />
              <Text variant="sectionHeading" align="center" style={{ marginTop: 12 }}>{t('library.emptyPgTitle')}</Text>
              <Text variant="body" color="secondary" align="center" style={{ marginTop: 6 }}>{t('library.emptyPgDesc')}</Text>
              <View style={{ height: 16 }} />
              <View style={styles.emptyCtas}>
                <Button variant="secondary" label={t('library.emptyPgChoosePreset')} onPress={() => setPresetOpen(true)} />
                <Button variant="primary" label={t('library.emptyPgCreate')} onPress={() => setNewProgOpen(true)} />
              </View>
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
                  onViewWeek={() => router.push({ pathname: '/calendar', params: { view: 'week', ts: Date.now().toString() } })}
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
                  {passivePrograms.map((p: AppProgramsRow) => {
                    const c = programCounts[p.id];
                    const metaLabel = c
                      ? `${t('library.dayCount', { vars: { n: c.dayCount } })}  ·  ${t('library.countExercises', { vars: { n: c.total } })}`
                      : (p.description ?? '');
                    const cycleLabel =
                      p.cycle_type === 'deload'
                        ? t('library.cycleDeload')
                        : p.cycle_type === 'none'
                          ? t('library.cycleNone')
                          : t('library.cycleWeekly');
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => setActionProg(p)}
                        style={({ pressed }) => [styles.pgRow, { backgroundColor: colors.background.elevated, borderColor: colors.border.subtle }, pressed && { opacity: 0.8 }]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text variant="bodyStrong" numberOfLines={1}>{p.name}</Text>
                          {metaLabel ? (
                            <Text variant="meta" color="secondary" numberOfLines={1}>{metaLabel}</Text>
                          ) : null}
                        </View>
                        <View style={[styles.typeBadge, { borderColor: colors.border.subtle, backgroundColor: colors.background.subtle }]}>
                          <Text font="mono" style={[styles.typeBadgeText, { color: colors.text.secondary }]}>{cycleLabel}</Text>
                        </View>
                        <ChevronRight size={18} color={colors.text.tertiary} />
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Modals */}
      <ProfilePopover visible={profileOpen} anchor={avatarRect} onClose={() => setProfileOpen(false)} />
      <AddExerciseSheet
        visible={newCustomOpen}
        initialTab="new"
        onClose={() => setNewCustomOpen(false)}
        onAddRefs={() => setNewCustomOpen(false)}
      />
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
      <PresetProgramModal
        visible={presetOpen}
        onDismiss={() => setPresetOpen(false)}
        onSelectPreset={onSelectPreset}
        isSubmitting={createFromPreset.isPending}
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
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
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
  accent: { alignSelf: 'stretch', width: 3, borderRadius: 2, marginVertical: 2 },
  letterHead: { paddingTop: 10, paddingBottom: 4, paddingHorizontal: 4 },
  letterHeadText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  exBody: { flex: 1, gap: 4 },
  exSub: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  rowCatChip: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 18, paddingHorizontal: 7, borderRadius: 999 },
  rowCatDot: { width: 5, height: 5, borderRadius: 3 },
  rowCatChipText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  lastText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  customHint: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  empty: { alignItems: 'center', paddingTop: 56, paddingHorizontal: 24 },
  noResults: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 24 },
  noActive: { paddingHorizontal: 16, paddingTop: 16 },
  emptyCtas: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  pgRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 14, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, marginBottom: 8,
  },
  typeBadge: { height: 20, paddingHorizontal: 8, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  typeBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3, textTransform: 'lowercase' },
});
