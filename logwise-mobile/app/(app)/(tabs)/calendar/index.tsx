/**
 * B1 Calendar — Month/Week view (ADIM 5 + ADIM 6 polish + ADIM 8 prototip sadakat).
 *
 * ADIM 8 değişiklikleri:
 *   - Top app bar prototipe yaklaştırıldı: avatar | 2-satır title | view-switch + today pill
 *   - View switch tek icon button (calendar / grid) — tıklayınca month↔week
 *   - Today pill: gold-muted bg + gold border + Target icon + uppercase mono label
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  ScrollView,
  View,
  Pressable,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { useRouter } from 'expo-router';
import { Calendar as CalendarIcon, LayoutGrid, Target, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Screen, Text, Button, HStack, useToast } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { useT, useTranslations, useLocaleStore } from '../../../../lib/i18n';
import { useWorkoutsByMonth, useSetsByMonth } from '../../../../queries/workouts';
import { useActiveProgramWithDays, useCreateProgramFromPreset } from '../../../../queries/programs';
import { useCustomExercises } from '../../../../queries/exercises';
import {
  useProfilePreferences,
  useSetProfilePreference,
  useWebUserCount,
} from '../../../../queries/profile';
import { resolveExerciseRef, buildCustomMap } from '../../../../lib/exercise-resolve';
import { resolveProgramDay } from '../../../../lib/program';
import { DuplicateProgramError } from '../../../../lib/data-bridge';
import CalendarMonth, { type DayWorkoutSummary, type CategoryKey } from '../../../../components/calendar/CalendarMonth';
import CalendarWeek, {
  type WeekDaySummary,
  isoWeekNumber,
  startOfWeekMonday,
  formatWeekRange,
} from '../../../../components/calendar/CalendarWeek';
import PresetProgramModal from '../../../../components/calendar/PresetProgramModal';
import WebUserWelcomeModal from '../../../../components/auth/WebUserWelcomeModal';
import ProfilePopover, { type AnchorRect } from '../../../../components/shared/ProfilePopover';
import { useAuthMode, useAuthSession } from '../../../../stores/auth-store';
import { computeOffDays, type PresetProgram } from '../../../../data/presets-programs';
import type { AppWorkoutsRow, AppExercisesRow } from '../../../../types/database';

type ViewMode = 'month' | 'week';

/** Bir günün hareketi — ad + kategori + ref (week detayında son seans lookup'ı için). */
type DayExerciseEntry = { ref: string; name: string; category: CategoryKey };

/** Month pager penceresi: anchor (açılış ayı) etrafında ±MONTH_WINDOW ay. Recenter yok. */
const MONTH_WINDOW = 24;

/** Ayın 42 hücresinin (6×7, Pazartesi başlangıç) tarihleri — planlı chip taraması için. */
function monthCellDates(monthDate: Date): Date[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const mondayOffset = (firstDow + 6) % 7;
  const out: Date[] = [];
  for (let i = 0; i < 42; i++) out.push(new Date(year, month, 1 - mondayOffset + i));
  return out;
}

/** Görünür hafta feed'inin (anchor ±n hafta) tüm günleri — planlı chip taraması için. */
function weekFeedDates(anchor: Date, before: number, after: number): Date[] {
  const start = startOfWeekMonday(anchor);
  const first = new Date(start.getFullYear(), start.getMonth(), start.getDate() - before * 7);
  const total = (before + after + 1) * 7;
  const out: Date[] = [];
  for (let i = 0; i < total; i++) out.push(new Date(first.getFullYear(), first.getMonth(), first.getDate() + i));
  return out;
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

function todayIso(): string {
  return toIsoDate(new Date());
}

/** Bir ayın workout satırlarını gün → loglu hareketler map'ine çevirir (position sırasıyla). */
function buildLoggedMap(
  rows: AppWorkoutsRow[] | undefined,
  customMap: Map<string, AppExercisesRow>,
  locale: 'tr' | 'en',
): Map<string, DayExerciseEntry[]> {
  const m = new Map<string, DayExerciseEntry[]>();
  const sorted = [...(rows ?? [])].sort((a, b) => a.position - b.position);
  for (const w of sorted) {
    const r = resolveExerciseRef(w.exercise_ref, customMap, locale);
    const arr = m.get(w.workout_date) ?? [];
    arr.push({ ref: w.exercise_ref, name: r.name, category: r.categories[0] ?? 'other' });
    m.set(w.workout_date, arr);
  }
  return m;
}

/** Bir ay paneli için özet: loglu günler (tam opak) + planlı günler (soluk). */
function buildMonthSummaryMap(
  monthDate: Date,
  loggedMap: Map<string, DayExerciseEntry[]>,
  plannedFor: (iso: string) => DayExerciseEntry[] | null,
): Map<string, DayWorkoutSummary> {
  const m = new Map<string, DayWorkoutSummary>();
  for (const [date, exs] of loggedMap) {
    m.set(date, { exercises: exs, planned: false, workoutCount: exs.length });
  }
  for (const d of monthCellDates(monthDate)) {
    const iso = toIsoDate(d);
    if (m.has(iso)) continue;
    const planned = plannedFor(iso);
    if (planned && planned.length > 0) {
      m.set(iso, { exercises: planned, planned: true, workoutCount: planned.length });
    }
  }
  return m;
}

export default function CalendarScreen() {
  const router = useRouter();
  const { colors, tokens } = useTheme();
  const t = useT();
  const dict = useTranslations();
  const locale = useLocaleStore((s) => s.locale);
  const toast = useToast();

  // Avatar baş harfleri — ProfilePopover ile aynı mantık: kullanıcı display name /
  // email öneki, misafirde "M". (Önceki sürüm yanlışlıkla aktif program adını gösteriyordu.)
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

  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Month pager — native react-native-pager-view. Sabit pencere (anchor ±MONTH_WINDOW ay),
  // recenter YOK → hızlı ileri-geri'de karışma yok. Sayfalar tembel: sadece seçili ±1
  // grid gerçek render edilir; gerisi boş placeholder (hafif). Gösterilen ay =
  // months[selectedIndex]; kaydırma native, pozisyon ile ay daima senkron.
  const anchorMonth = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }, []);
  const months = useMemo(() => {
    const out: Date[] = [];
    for (let i = -MONTH_WINDOW; i <= MONTH_WINDOW; i++) {
      out.push(new Date(anchorMonth.getFullYear(), anchorMonth.getMonth() + i, 1));
    }
    return out;
  }, [anchorMonth]);
  const [selectedIndex, setSelectedIndex] = useState(MONTH_WINDOW);
  const pagerRef = useRef<PagerView>(null);
  const monthDate = months[selectedIndex] ?? anchorMonth;
  const goToPage = useCallback(
    (i: number) => {
      const clamped = i < 0 ? 0 : i > MONTH_WINDOW * 2 ? MONTH_WINDOW * 2 : i;
      pagerRef.current?.setPage(clamped);
    },
    [],
  );

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

  // Week başlık senkronu: her hafta bloğunun y offset'i (CalendarWeek.onWeekLayout'tan)
  // + scroll sırasında en üstteki görünür haftayı tutan state. Title bu haftaya göre
  // güncellenir; ağır feed (memo'lu CalendarWeek) re-render OLMAZ — sadece app bar.
  const weekOffsetsRef = useRef<Array<{ startISO: string; start: Date; y: number }>>([]);
  const [visibleWeekStart, setVisibleWeekStart] = useState<Date | null>(null);

  // Seçili sayfa + komşuları (kenarlarda clamp). Komşu ayların workouts'u ÖNCEDEN
  // çekilir → o sayfaya kaydırınca veri zaten hazır (gecikmesiz). React Query cache'ler,
  // yeniden ziyaret anlık.
  const idxPrev = Math.max(0, selectedIndex - 1);
  const idxNext = Math.min(MONTH_WINDOW * 2, selectedIndex + 1);
  const curM = months[selectedIndex] ?? anchorMonth;
  const prevM = months[idxPrev] ?? curM;
  const nextM = months[idxNext] ?? curM;
  const workoutsQ = useWorkoutsByMonth(curM.getFullYear(), curM.getMonth() + 1);
  const workoutsPrevQ = useWorkoutsByMonth(prevM.getFullYear(), prevM.getMonth() + 1);
  const workoutsNextQ = useWorkoutsByMonth(nextM.getFullYear(), nextM.getMonth() + 1);
  // FAZ 2.5 — seed query'ler: gune tiklayinca Day Detail network beklemeden acilsin.
  // setsMonth → useSetsByDate seed'i + week görünümü set sayısı; activeWithDays → Day
  // ile AYNI query key (cache ortak); customExercises → customMap Day acilmadan once hazir.
  const setsQ = useSetsByMonth(curM.getFullYear(), curM.getMonth() + 1);
  const customQ = useCustomExercises();
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

  const today = todayIso();
  const customMap = useMemo(() => buildCustomMap(customQ.data ?? []), [customQ.data]);
  const activeProgram = activeProgQ.data?.program ?? null;
  // PERF: stabil referans — yoksa her render yeni [] üretir, plannedFor→weekSummary
  // her scroll tick'inde değişip CalendarWeek memo'sunu boşa düşürürdü.
  const programDays = useMemo(() => activeProgQ.data?.days ?? [], [activeProgQ.data]);

  // Gün → loglu hareketler — her ay için ayrı (pager panelleri kendi ayını kullanır).
  const loggedCur = useMemo(() => buildLoggedMap(workoutsQ.data, customMap, locale), [workoutsQ.data, customMap, locale]);
  const loggedPrev = useMemo(() => buildLoggedMap(workoutsPrevQ.data, customMap, locale), [workoutsPrevQ.data, customMap, locale]);
  const loggedNext = useMemo(() => buildLoggedMap(workoutsNextQ.data, customMap, locale), [workoutsNextQ.data, customMap, locale]);
  // Week feed ±3 hafta komşu aylara taşabilir → üç ayın loglarını birleştir.
  const loggedAll = useMemo(() => {
    const m = new Map(loggedCur);
    for (const [k, v] of loggedPrev) if (!m.has(k)) m.set(k, v);
    for (const [k, v] of loggedNext) if (!m.has(k)) m.set(k, v);
    return m;
  }, [loggedCur, loggedPrev, loggedNext]);

  // Gün başına set sayısı — week meta ("N hareket · M set").
  const setsByDate = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of setsQ.data ?? []) m.set(s.workout_date, (m.get(s.workout_date) ?? 0) + 1);
    return m;
  }, [setsQ.data]);

  // Aktif programdan PLANLI hareketler — bugün+gelecek. Loglu günleri çağıran taraf
  // (buildMonthSummaryMap / weekSummary) m.has ile zaten atlar → ay-bağımsız; üç panel
  // de aynı fonksiyonu kullanır.
  const plannedFor = useCallback(
    (dateISO: string): DayExerciseEntry[] | null => {
      if (!activeProgram) return null;
      if (dateISO < today) return null; // geçmiş: planlı gösterme (sadece gerçek log)
      const pd = resolveProgramDay(activeProgram, programDays, dateISO);
      if (!pd.hasStarted || pd.isOffDay || pd.exerciseRefs.length === 0) return null;
      return pd.exerciseRefs.map((ref) => {
        const r = resolveExerciseRef(ref, customMap, locale);
        return { ref, name: r.name, category: r.categories[0] ?? 'other' };
      });
    },
    [activeProgram, programDays, today, customMap, locale],
  );

  // Pager üç ay özeti (prev / cur / next) — her biri kendi loglu map'i + planlı.
  const summaryCur = useMemo(() => buildMonthSummaryMap(curM, loggedCur, plannedFor), [curM, loggedCur, plannedFor]);
  const summaryPrev = useMemo(() => buildMonthSummaryMap(prevM, loggedPrev, plannedFor), [prevM, loggedPrev, plannedFor]);
  const summaryNext = useMemo(() => buildMonthSummaryMap(nextM, loggedNext, plannedFor), [nextM, loggedNext, plannedFor]);

  // Week özeti: görünür haftalar (anchor ±3) için loglu (üç ay birleşik) + planlı.
  const weekSummary = useMemo(() => {
    const m = new Map<string, WeekDaySummary>();
    for (const [date, exs] of loggedAll) {
      m.set(date, { workoutCount: exs.length, setCount: setsByDate.get(date) ?? 0, planned: false, exercises: exs });
    }
    for (const d of weekFeedDates(weekAnchor, 3, 3)) {
      const iso = toIsoDate(d);
      if (m.has(iso)) continue;
      const planned = plannedFor(iso);
      if (planned && planned.length > 0) {
        m.set(iso, { workoutCount: planned.length, setCount: 0, planned: true, exercises: planned });
      }
    }
    return m;
  }, [loggedAll, setsByDate, weekAnchor, plannedFor]);

  const hasWorkouts = (workoutsQ.data?.length ?? 0) > 0;
  const showHint = !hasWorkouts && !workoutsQ.isLoading && !seenHintCard;

  const monthLabel = useMemo(() => {
    return dict.months[monthDate.getMonth()] ?? '';
  }, [monthDate, dict.months]);

  // Week app bar başlığı: görünür haftanın aralığı ("13 — 19 Eyl") + "W## · yıl".
  // visibleWeekStart scroll'da güncellenir; yoksa anchor haftası (bugün) gösterilir.
  const { weekTitleLabel, weekSubLabel } = useMemo(() => {
    const ws = visibleWeekStart ?? startOfWeekMonday(weekAnchor);
    const we = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + 6);
    return {
      weekTitleLabel: formatWeekRange(ws, we, dict.months),
      weekSubLabel: `W${isoWeekNumber(ws).toString().padStart(2, '0')} · ${ws.getFullYear()}`,
    };
  }, [visibleWeekStart, weekAnchor, dict.months]);

  const goToday = () => {
    const d = new Date();
    setWeekAnchor(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    // Başlık anında bugünün haftasına dönsün (scroll snap sonrası zaten teyit edilir).
    setVisibleWeekStart(null);
    if (viewMode === 'week') {
      // Anchor değişmemişse layout tetiklenmez; bir frame sonra scroll'u zorla.
      setTimeout(() => scrollToTodayWeek(true), 0);
    } else {
      // Month: bugünün ayına (pencerenin merkezi = anchor) animasyonlu git.
      goToPage(MONTH_WINDOW);
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
      router.push(`/calendar/day/${dateISO}`);
    },
    [router],
  );

  const onWeekLayout = useCallback(
    (startISO: string, start: Date, y: number, isToday: boolean) => {
      const arr = weekOffsetsRef.current;
      const idx = arr.findIndex((w) => w.startISO === startISO);
      if (idx >= 0) arr[idx] = { startISO, start, y };
      else arr.push({ startISO, start, y });
      arr.sort((a, b) => a.y - b.y);
      if (isToday) {
        todayWeekYRef.current = y;
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 4), animated: false });
      }
    },
    [],
  );

  // Scroll'da en üstteki görünür haftayı seç → app bar başlığı senkronlanır.
  const onWeekScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const sy = e.nativeEvent.contentOffset.y;
    const arr = weekOffsetsRef.current;
    let picked: { startISO: string; start: Date; y: number } | null = null;
    for (const w of arr) {
      if (w.y <= sy + 12) picked = w;
    }
    if (!picked && arr.length > 0) picked = arr[0] ?? null;
    if (picked) {
      const next = picked;
      setVisibleWeekStart((prev) =>
        prev && toIsoDate(prev) === next.startISO ? prev : next.start,
      );
    }
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
            {avatarInitials}
          </Text>
        </Pressable>
        <View style={styles.barTitle}>
          <View style={styles.barTitleRow}>
            {viewMode === 'month' && (
              <Pressable
                onPress={() => goToPage(selectedIndex - 1)}
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
              {viewMode === 'month' ? monthLabel : weekTitleLabel}
            </Text>
            {viewMode === 'month' && (
              <Pressable
                onPress={() => goToPage(selectedIndex + 1)}
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
            {viewMode === 'month' ? monthDate.getFullYear() : weekSubLabel}
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
        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={selectedIndex}
          onPageSelected={(e) => setSelectedIndex(e.nativeEvent.position)}
          offscreenPageLimit={1}
        >
          {months.map((m, i) => {
            // Tembel render: sadece seçili ±1 sayfada gerçek grid (veriyle); gerisi boş.
            const delta = i - selectedIndex;
            const near = delta >= -1 && delta <= 1;
            const summary = delta === 0 ? summaryCur : delta < 0 ? summaryPrev : summaryNext;
            return (
              <View key={i} style={styles.monthPanel} collapsable={false}>
                {near ? (
                  <CalendarMonth
                    monthDate={m}
                    workoutsByDate={summary}
                    todayISO={today}
                    onDayPress={onDayPress}
                  />
                ) : null}
              </View>
            );
          })}
        </PagerView>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingBottom: 96 }}
          onScroll={onWeekScroll}
          scrollEventThrottle={64}
        >
          <CalendarWeek
            anchorDate={weekAnchor}
            summaryByDate={weekSummary}
            todayISO={today}
            onDayPress={onDayPress}
            onWeekLayout={onWeekLayout}
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
  // Native pager — sayfalar (aylar) yatay kaydırılır; her sayfa tam ekran.
  pager: {
    flex: 1,
  },
  monthPanel: {
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
