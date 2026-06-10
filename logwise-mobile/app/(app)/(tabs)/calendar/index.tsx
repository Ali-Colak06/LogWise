/**
 * B1 Calendar — Month/Week view (ADIM 5 + ADIM 6 polish + ADIM 8 prototip sadakat).
 *
 * ADIM 8 değişiklikleri:
 *   - Top app bar prototipe yaklaştırıldı: avatar | 2-satır title | view-switch + today pill
 *   - View switch tek icon button (calendar / grid) — tıklayınca month↔week
 *   - Today pill: gold-muted bg + gold border + Target icon + uppercase mono label
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, ScrollView, View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar as CalendarIcon, LayoutGrid, Target, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Screen, Text, Button, HStack, useToast } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { useT, useTranslations } from '../../../../lib/i18n';
import { useWorkoutsByMonth, useSetsByMonth } from '../../../../queries/workouts';
import { useActiveProgramWithDays, useCreateProgramFromPreset } from '../../../../queries/programs';
import { useCustomExercises } from '../../../../queries/exercises';
import {
  useProfilePreferences,
  useSetProfilePreference,
  useWebUserCount,
} from '../../../../queries/profile';
import { getPresetExerciseBySlug } from '../../../../data/presets-exercises';
import { turkishCatToKey } from '../../../../lib/exercise-resolve';
import { DuplicateProgramError } from '../../../../lib/data-bridge';
import CalendarMonth, { type DayWorkoutSummary, type CategoryKey } from '../../../../components/calendar/CalendarMonth';
import CalendarWeek, { type WeekDaySummary } from '../../../../components/calendar/CalendarWeek';
import PresetProgramModal from '../../../../components/calendar/PresetProgramModal';
import WebUserWelcomeModal from '../../../../components/auth/WebUserWelcomeModal';
import ProfilePopover, { type AnchorRect } from '../../../../components/shared/ProfilePopover';
import { computeOffDays, type PresetProgram } from '../../../../data/presets-programs';

type ViewMode = 'month' | 'week';

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

export default function CalendarScreen() {
  // [PERF] geçici teşhis logu — push sırasında ekran gövdesi yeniden çalışıyor mu?
  if (__DEV__) console.log(`[PERF][cal-render] t=${Date.now()}`);
  const router = useRouter();
  const { colors, tokens } = useTheme();
  const t = useT();
  const dict = useTranslations();
  const toast = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [monthDate, setMonthDate] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [weekAnchor, setWeekAnchor] = useState<Date>(() => new Date());
  const [presetOpen, setPresetOpen] = useState(false);
  const [webWelcomeOpen, setWebWelcomeOpen] = useState(false);

  // Avatar tap → sol-üst profil popover. measureInWindow ile avatar'ın ekran
  // konumunu alıp kartı tam altına yerleştiririz.
  const avatarRef = useRef<View | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarRect, setAvatarRect] = useState<AnchorRect | null>(null);
  const openProfile = () => {
    avatarRef.current?.measureInWindow((x, y, width, height) => {
      setAvatarRect({ x, y, width, height });
      setProfileOpen(true);
    });
  };

  // ADIM 8 fix: week view bugünkü haftaya auto-scroll için ScrollView ref
  const scrollRef = useRef<ScrollView | null>(null);
  const todayWeekYRef = useRef<number>(0);
  const scrollToTodayWeek = (animated = true) => {
    const y = Math.max(0, todayWeekYRef.current - 4);
    scrollRef.current?.scrollTo({ y, animated });
  };

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth() + 1;

  const workoutsQ = useWorkoutsByMonth(year, month);
  // FAZ 2.5 — seed query'ler: gune tiklayinca Day Detail network beklemeden acilsin.
  // setsMonth → useSetsByDate seed'i; activeWithDays → Day ile AYNI query key (cache
  // ortak); customExercises → customMap Day acilmadan once hazir.
  useSetsByMonth(year, month);
  useCustomExercises();
  const activeProgQ = useActiveProgramWithDays();
  const createProgM = useCreateProgramFromPreset();

  // FAZ 1.3: Eski blanket useFocusEffect refetch'i KALDIRILDI. Day Detail yazma
  // hook'lari artik optimistic + hedefli cache guncellemesi yapiyor (queries/workouts.ts);
  // month cache geri donuste zaten guncel. Program aktiflestirme mutation'lari da
  // workouts ailesini invalidate ediyor (queries/programs.ts) → arka plandaki aktif
  // query otomatik tazelenir. Boylece her tab donusunde gereksiz 2 round-trip onlenir.

  const prefsQ = useProfilePreferences();
  const setPref = useSetProfilePreference();

  const seenHintCard = prefsQ.data?.seen_hint_card === true;
  const seenWebWelcome = prefsQ.data?.seen_web_welcome === true;

  // FAZ 2.2: webUserCount lazy — sadece prefs yuklendi + welcome henuz gorulmediyse cek.
  const webCountQ = useWebUserCount(!prefsQ.isLoading && !seenWebWelcome);

  useEffect(() => {
    if (
      !prefsQ.isLoading &&
      !seenWebWelcome &&
      (webCountQ.data ?? 0) > 0
    ) {
      setWebWelcomeOpen(true);
    }
  }, [prefsQ.isLoading, seenWebWelcome, webCountQ.data]);

  const monthSummary = useMemo(() => {
    const m = new Map<string, DayWorkoutSummary>();
    const rows = workoutsQ.data ?? [];
    for (const w of rows) {
      const ex = getPresetExerciseBySlug(w.exercise_ref);
      const firstCat = ex?.categories[0] ? turkishCatToKey(ex.categories[0]) : 'other';
      const existing = m.get(w.workout_date);
      if (!existing) {
        m.set(w.workout_date, { categories: [firstCat], hasMore: false, workoutCount: 1 });
      } else {
        const cats: CategoryKey[] = existing.categories.includes(firstCat)
          ? existing.categories
          : [...existing.categories, firstCat];
        m.set(w.workout_date, {
          categories: cats.slice(0, 2),
          hasMore: cats.length > 2,
          workoutCount: existing.workoutCount + 1,
        });
      }
    }
    return m;
  }, [workoutsQ.data]);

  const weekSummary = useMemo(() => {
    const m = new Map<string, WeekDaySummary>();
    const rows = workoutsQ.data ?? [];
    for (const w of rows) {
      const ex = getPresetExerciseBySlug(w.exercise_ref);
      const name = ex?.name ?? w.exercise_ref;
      const existing = m.get(w.workout_date);
      if (!existing) {
        m.set(w.workout_date, { workoutCount: 1, setCount: 0, exerciseNames: [name] });
      } else {
        m.set(w.workout_date, {
          workoutCount: existing.workoutCount + 1,
          setCount: existing.setCount,
          exerciseNames: [...(existing.exerciseNames ?? []), name],
        });
      }
    }
    return m;
  }, [workoutsQ.data]);

  const hasWorkouts = (workoutsQ.data?.length ?? 0) > 0;
  const showHint = !hasWorkouts && !workoutsQ.isLoading && !seenHintCard;
  const today = todayIso();

  const monthLabel = useMemo(() => {
    return dict.months[monthDate.getMonth()] ?? '';
  }, [monthDate, dict.months]);

  const goPrevMonth = () => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNextMonth = () => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToday = () => {
    const d = new Date();
    setMonthDate(new Date(d.getFullYear(), d.getMonth(), 1));
    setWeekAnchor(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    if (viewMode === 'week') {
      // Anchor değişmemişse layout tetiklenmez; bir frame sonra scroll'u zorla.
      setTimeout(() => scrollToTodayWeek(true), 0);
    }
  };

  // Month → Week geçişinde bugünkü haftaya auto-scroll (anchor zaten today)
  useEffect(() => {
    if (viewMode === 'week') {
      // Layout hesaplanana kadar minik bir gecikme
      const id = setTimeout(() => scrollToTodayWeek(false), 50);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [viewMode]);

  // PERF: memo'lu CalendarMonth/Week'e stabil referans gitsin (yoksa memo boşa düşer).
  const onDayPress = useCallback(
    (dateISO: string) => {
      // [PERF] geçici teşhis logu — perf turu bitince silinecek.
      if (__DEV__) console.log(`[PERF][tap-day] ${dateISO} t=${Date.now()}`);
      router.push(`/calendar/day/${dateISO}`);
    },
    [router],
  );

  const onTodayWeekLayout = useCallback((y: number) => {
    todayWeekYRef.current = y;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 4), animated: false });
  }, []);

  const dismissHint = () => setPref.mutate({ key: 'seen_hint_card', value: true });

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
            toast.show({
              message: t('library.duplicateProgram', { vars: { name: err.programName } }),
              variant: 'info',
            });
            setPresetOpen(false);
          } else {
            toast.show({ message: (err as Error).message, variant: 'danger' });
          }
        },
      },
    );
  };

  const markWebWelcomeSeen = () => setPref.mutate({ key: 'seen_web_welcome', value: true });

  return (
    <Screen scroll={false} hPadding={0}>
      {/* ADIM 8 prototip sadakat — app-bar: avatar | 2-satır title | view-switch + today */}
      <View style={[styles.appBar, { borderBottomColor: colors.border.subtle }]}>
        <Pressable
          ref={avatarRef}
          onPress={openProfile}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={t('more.rowProfile')}
          style={[styles.avatar, { borderColor: colors.border.subtle, backgroundColor: colors.background.subtle }]}
        >
          <Text style={{ color: colors.accent.gold, fontFamily: tokens.fonts.displayBold, fontSize: 13 }}>
            {(activeProgQ.data?.program?.name ?? 'LW').slice(0, 2).toUpperCase()}
          </Text>
        </Pressable>
        <View style={styles.barTitle}>
          <View style={styles.barTitleRow}>
            {viewMode === 'month' && (
              <Pressable
                onPress={goPrevMonth}
                hitSlop={10}
                accessibilityLabel={t('aria.prevMonth')}
                style={styles.barNavBtn}
              >
                <ChevronLeft color={colors.text.secondary} size={18} />
              </Pressable>
            )}
            <Text
              numberOfLines={1}
              style={{ color: colors.text.primary, fontFamily: tokens.fonts.displayBold, fontSize: 17, textAlign: 'center' }}
            >
              {viewMode === 'month' ? monthLabel : t('nav.week')}
            </Text>
            {viewMode === 'month' && (
              <Pressable
                onPress={goNextMonth}
                hitSlop={10}
                accessibilityLabel={t('aria.nextMonth')}
                style={styles.barNavBtn}
              >
                <ChevronRight color={colors.text.secondary} size={18} />
              </Pressable>
            )}
          </View>
          <Text
            style={{ color: colors.text.tertiary, fontFamily: tokens.fonts.mono, fontSize: 10, letterSpacing: 1.2, textAlign: 'center' }}
          >
            {monthDate.getFullYear()}
          </Text>
        </View>
        <HStack gap="xs" align="center">
          <Pressable
            onPress={() => setViewMode((v) => (v === 'month' ? 'week' : 'month'))}
            hitSlop={6}
            style={[styles.viewSwitch, { borderColor: colors.border.subtle, backgroundColor: colors.background.elevated }]}
          >
            {viewMode === 'month' ? (
              <CalendarIcon color={colors.text.secondary} size={16} />
            ) : (
              <LayoutGrid color={colors.text.secondary} size={16} />
            )}
          </Pressable>
          <Pressable
            onPress={goToday}
            hitSlop={6}
            style={[
              styles.todayPill,
              {
                backgroundColor: colors.accent.goldMuted,
                borderColor: colors.accent.gold,
              },
            ]}
          >
            <Target color={colors.accent.goldHover} size={13} />
            <Text style={{ color: colors.accent.goldHover, fontFamily: tokens.fonts.monoBold, fontSize: 11, letterSpacing: 0.5 }}>
              {t('calendar.today').toUpperCase()}
            </Text>
          </Pressable>
        </HStack>
      </View>

      {viewMode === 'month' ? (
        <View style={styles.monthContainer}>
          <CalendarMonth
            monthDate={monthDate}
            workoutsByDate={monthSummary}
            todayISO={today}
            onDayPress={onDayPress}
          />
        </View>
      ) : (
        <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 96 }}>
          <CalendarWeek
            anchorDate={weekAnchor}
            summaryByDate={weekSummary}
            todayISO={today}
            onDayPress={onDayPress}
            onTodayWeekLayout={onTodayWeekLayout}
          />
        </ScrollView>
      )}

      {/* Floating hint card — grid'i sıkıştırmaz, üstünde overlay (ADIM 8 fix) */}
      {showHint && (
        <View
          pointerEvents="box-none"
          style={styles.hintOverlay}
        >
          <View style={[styles.hintCard, { backgroundColor: colors.background.elevated, borderColor: colors.border.subtle }]}>
            <HStack gap="sm" align="center">
              <View style={[styles.goldDot, { backgroundColor: colors.accent.gold }]} />
              <Text variant="bodyStrong" style={{ flex: 1 }}>{t('calendar.hintTitle')}</Text>
            </HStack>
            <View style={{ height: 6 }} />
            <Text variant="body" color="secondary">{t('calendar.hintDesc')}</Text>
            <View style={{ height: 12 }} />
            <HStack gap="sm">
              <Button variant="secondary" label={t('calendar.hintCtaOpenToday')} onPress={() => { dismissHint(); onDayPress(today); }} size="sm" />
              <Button variant="primary" label={t('calendar.hintCtaChoosePreset')} onPress={() => setPresetOpen(true)} size="sm" />
            </HStack>
          </View>
        </View>
      )}

      <PresetProgramModal
        visible={presetOpen}
        onDismiss={() => setPresetOpen(false)}
        onSelectPreset={onSelectPreset}
        isSubmitting={createProgM.isPending}
      />

      <ProfilePopover
        visible={profileOpen}
        anchor={avatarRect}
        onClose={() => setProfileOpen(false)}
      />

      <WebUserWelcomeModal
        visible={webWelcomeOpen}
        onContinueMobile={() => { markWebWelcomeSeen(); setWebWelcomeOpen(false); }}
        onOpenWeb={() => {
          markWebWelcomeSeen();
          setWebWelcomeOpen(false);
          Linking.openURL('https://logwise.fit').catch(() => undefined);
        }}
        onDismiss={() => setWebWelcomeOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barTitle: { flex: 1, alignItems: 'center' },
  barTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  barNavBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewSwitch: {
    width: 34,
    height: 30,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
  },
  monthContainer: {
    flex: 1,
    paddingHorizontal: 1,
    paddingTop: 4,
    paddingBottom: 8,
  },
  hintOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 16,
    paddingHorizontal: 12,
  },
  hintCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  goldDot: { width: 8, height: 8, borderRadius: 4 },
});

export type { CategoryKey };
