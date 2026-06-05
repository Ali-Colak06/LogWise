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
import { useFocusEffect, useRouter } from 'expo-router';
import { Calendar as CalendarIcon, LayoutGrid, Target, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Screen, Text, Button, HStack, useToast } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { useT, useTranslations } from '../../../../lib/i18n';
import { useWorkoutsByMonth } from '../../../../queries/workouts';
import { useActiveProgram, useCreateProgramFromPreset } from '../../../../queries/programs';
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
import { computeOffDays, type PresetProgram } from '../../../../data/presets-programs';

type ViewMode = 'month' | 'week';

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

export default function CalendarScreen() {
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
  const activeProgQ = useActiveProgram();
  const createProgM = useCreateProgramFromPreset();

  // Day Detail'de set girilince ya da D2'de program aktif edilince Calendar'a
  // dönüldüğünde taze veri göster. refetchOnWindowFocus kapalı (query-client) olduğu
  // için, ekran her odaklandığında (geri dönüş) ilgili query'leri elle yeniden çek.
  // refetch referansları React Query'de stabildir → callback stabil; her zaman
  // o an görüntülenen ayın query'sini tazeler.
  const refetchWorkouts = workoutsQ.refetch;
  const refetchActiveProg = activeProgQ.refetch;
  useFocusEffect(
    useCallback(() => {
      refetchWorkouts();
      refetchActiveProg();
    }, [refetchWorkouts, refetchActiveProg]),
  );

  const prefsQ = useProfilePreferences();
  const setPref = useSetProfilePreference();
  const webCountQ = useWebUserCount();

  const seenHintCard = prefsQ.data?.seen_hint_card === true;
  const seenWebWelcome = prefsQ.data?.seen_web_welcome === true;

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

  const onDayPress = (dateISO: string) => router.push(`/calendar/day/${dateISO}`);

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
        <View style={[styles.avatar, { borderColor: colors.border.subtle, backgroundColor: colors.background.subtle }]}>
          <Text style={{ color: colors.accent.gold, fontFamily: tokens.fonts.displayBold, fontSize: 13 }}>
            {(activeProgQ.data?.name ?? 'LW').slice(0, 2).toUpperCase()}
          </Text>
        </View>
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
            onTodayWeekLayout={(y) => {
              todayWeekYRef.current = y;
              scrollToTodayWeek(false);
            }}
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
