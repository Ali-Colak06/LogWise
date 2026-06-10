/**
 * CalendarWeek — Week view scrollable feed (B1, ADIM 5 → ADIM 8 prototip sadakat).
 *
 * Kaynak: docs/mobile-design-system/calendar-prototype-v2 — .week-block + .week-row
 *   - Haftalar dikey stack; her hafta için kompakt header (W## + tarih aralığı + cats stat)
 *   - Her gün için card row: [48px tarih kolonu] | [body: plan adı + cat chip'leri + meta] | [chev 30px]
 *   - Bugün: gold border (0.4 alpha)
 *   - Rest gun: cyan border + bg (info)
 *   - MVP'de "sonsuz scroll" değil — anchor +/- 3 hafta (7 hafta toplam) gösterim
 */
import { memo, useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Text, HStack } from '../ui';
import { useLocaleStore, useTranslations, useT } from '../../lib/i18n';
import { ChevronRight } from 'lucide-react-native';
import type { CategoryKey } from './CalendarMonth';

export interface WeekDaySummary {
  workoutCount: number;
  setCount: number;
  exerciseNames?: string[];
  planLabel?: string;
  categories?: CategoryKey[];
  isRest?: boolean;
}

export interface CalendarWeekProps {
  anchorDate: Date;
  summaryByDate: Map<string, WeekDaySummary>;
  todayISO: string;
  onDayPress: (dateISO: string) => void;
  weeksBefore?: number;
  weeksAfter?: number;
  /** Bugünü içeren hafta render edildiğinde y offset'ini parent'a bildirir (auto-scroll). */
  onTodayWeekLayout?: (y: number) => void;
}

const TR_DOW = ['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ'];
const EN_DOW = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function toIsoDate(d: Date): string {
  const y = d.getFullYear().toString().padStart(4, '0');
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfWeekMonday(d: Date): Date {
  const dow = d.getDay();
  const offset = (dow + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
}

function isoWeekNumber(d: Date): number {
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayNum = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNum + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = (target.getTime() - firstThursday.getTime()) / 86400000;
  return 1 + Math.round((diff - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
}

function CalendarWeek({
  anchorDate,
  summaryByDate,
  todayISO,
  onDayPress,
  weeksBefore = 3,
  weeksAfter = 3,
  onTodayWeekLayout,
}: CalendarWeekProps) {
  const { colors, tokens } = useTheme();
  const locale = useLocaleStore((s) => s.locale);
  const dict = useTranslations();
  const t = useT();
  const months = dict.months;

  const weeks = useMemo(() => {
    const anchorWeekStart = startOfWeekMonday(anchorDate);
    const startWeek = new Date(
      anchorWeekStart.getFullYear(),
      anchorWeekStart.getMonth(),
      anchorWeekStart.getDate() - weeksBefore * 7,
    );
    const totalWeeks = weeksBefore + weeksAfter + 1;
    const out: Array<{ start: Date; days: Array<{ date: Date; iso: string }> }> = [];
    for (let w = 0; w < totalWeeks; w++) {
      const wStart = new Date(startWeek.getFullYear(), startWeek.getMonth(), startWeek.getDate() + w * 7);
      const days: Array<{ date: Date; iso: string }> = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(wStart.getFullYear(), wStart.getMonth(), wStart.getDate() + i);
        days.push({ date: d, iso: toIsoDate(d) });
      }
      out.push({ start: wStart, days });
    }
    return out;
  }, [anchorDate, weeksBefore, weeksAfter]);

  const dowLabels = locale === 'en' ? EN_DOW : TR_DOW;

  return (
    <View style={styles.feed}>
      {weeks.map(({ start, days }) => {
        const weekNum = isoWeekNumber(start);
        const lastDay = days[6];
        if (!lastDay) return null;
        const startMonth = months[start.getMonth()] ?? '';
        const endMonth = months[lastDay.date.getMonth()] ?? '';
        const rangeLabel = start.getMonth() === lastDay.date.getMonth()
          ? `${start.getDate()} — ${lastDay.date.getDate()} ${startMonth}`
          : `${start.getDate()} ${startMonth} — ${lastDay.date.getDate()} ${endMonth}`;

        const totalWorkouts = days.reduce((acc, dd) => acc + (summaryByDate.get(dd.iso)?.workoutCount ?? 0), 0);
        const workoutDays = days.filter((dd) => (summaryByDate.get(dd.iso)?.workoutCount ?? 0) > 0).length;

        const containsToday = days.some((dd) => dd.iso === todayISO);

        return (
          <View
            key={start.toISOString()}
            style={styles.weekBlock}
            onLayout={containsToday ? (e) => onTodayWeekLayout?.(e.nativeEvent.layout.y) : undefined}
          >
            <View style={styles.weekHeader}>
              <View style={styles.whLeft}>
                <Text
                  style={{
                    color: colors.text.tertiary,
                    fontFamily: tokens.fonts.monoBold,
                    fontSize: 10,
                    letterSpacing: 1.4,
                  }}
                >
                  W{weekNum.toString().padStart(2, '0')}
                </Text>
                <Text
                  style={{
                    color: colors.text.primary,
                    fontFamily: tokens.fonts.displayBold,
                    fontSize: 14,
                    letterSpacing: -0.05,
                  }}
                >
                  {rangeLabel}
                </Text>
              </View>
              {totalWorkouts > 0 && (
                <View style={styles.whStats}>
                  <Text style={{ color: colors.text.tertiary, fontFamily: tokens.fonts.mono, fontSize: 10 }}>
                    {workoutDays} {t('calendar.weekDaysAbbr')}
                  </Text>
                  <View style={[styles.sep, { backgroundColor: colors.border.strong }]} />
                  <Text style={{ color: colors.text.tertiary, fontFamily: tokens.fonts.mono, fontSize: 10 }}>
                    {totalWorkouts} {t('calendar.weekExAbbr')}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.weekStrip}>
              {days.map(({ date, iso }) => {
                const dowIdx = (date.getDay() + 6) % 7;
                const summary = summaryByDate.get(iso);
                const isToday = iso === todayISO;
                const isRest = summary?.isRest ?? false;
                const hasWorkout = (summary?.workoutCount ?? 0) > 0;

                const rowBorder = isToday
                  ? colors.accent.gold
                  : isRest
                    ? colors.semantic.info
                    : colors.border.subtle;
                const rowBg = isRest
                  ? colors.semantic.infoMuted
                  : colors.background.elevated;

                return (
                  <Pressable
                    key={iso}
                    onPress={() => onDayPress(iso)}
                    style={({ pressed }) => [
                      styles.weekRow,
                      {
                        borderColor: rowBorder,
                        backgroundColor: pressed ? colors.background.hover : rowBg,
                      },
                    ]}
                  >
                    <View style={[styles.weekDate, { borderRightColor: colors.border.subtle }]}>
                      <Text
                        style={{
                          color: colors.text.secondary,
                          fontFamily: tokens.fonts.monoBold,
                          fontSize: 9.5,
                          letterSpacing: 1,
                        }}
                      >
                        {dowLabels[dowIdx]}
                      </Text>
                      <Text
                        style={{
                          color: isToday ? colors.accent.gold : colors.text.primary,
                          fontFamily: tokens.fonts.displayBold,
                          fontSize: 20,
                          lineHeight: 22,
                        }}
                      >
                        {date.getDate()}
                      </Text>
                    </View>

                    <View style={styles.weekBody}>
                      <HStack gap="sm" align="center" justify="space-between">
                        <Text
                          numberOfLines={1}
                          style={{
                            color: isRest ? colors.semantic.info : colors.text.primary,
                            fontFamily: tokens.fonts.displayBold,
                            fontSize: 13,
                            flex: 1,
                          }}
                        >
                          {summary?.planLabel ?? (isRest ? t('day.restDayShort') : hasWorkout ? t('day.workout') : t('day.rest'))}
                        </Text>
                        {hasWorkout && (
                          <View style={styles.weekMeta}>
                            <Text style={{ color: colors.text.tertiary, fontFamily: tokens.fonts.mono, fontSize: 10 }}>
                              {summary?.workoutCount} ex
                            </Text>
                            {(summary?.setCount ?? 0) > 0 && (
                              <>
                                <View style={[styles.sep, { backgroundColor: colors.border.strong }]} />
                                <Text style={{ color: colors.text.tertiary, fontFamily: tokens.fonts.mono, fontSize: 10 }}>
                                  {summary?.setCount} sets
                                </Text>
                              </>
                            )}
                          </View>
                        )}
                      </HStack>

                      {summary?.categories && summary.categories.length > 0 && (
                        <View style={styles.catChipRow}>
                          {summary.categories.slice(0, 4).map((cat, i) => (
                            <View
                              key={`${cat}-${i}`}
                              style={[
                                styles.catChip,
                                { backgroundColor: colors.categoryMuted[cat] },
                              ]}
                            >
                              <View style={[styles.catDot, { backgroundColor: colors.category[cat] }]} />
                              <Text
                                style={{
                                  color: colors.category[cat],
                                  fontSize: 10,
                                  fontWeight: '700',
                                  lineHeight: 14,
                                }}
                              >
                                {summary.exerciseNames?.[i] ?? cat}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    <View style={[styles.chev, { borderColor: colors.border.subtle, backgroundColor: colors.background.subtle }]}>
                      <ChevronRight color={colors.text.secondary} size={14} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// PERF: 49 gün-satırlık feed, CalendarMonth ile aynı sebeple memo (push re-render'ı).
export default memo(CalendarWeek);

const styles = StyleSheet.create({
  feed: {
    flexDirection: 'column',
    gap: 16,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 16,
  },
  weekBlock: { flexDirection: 'column', gap: 8 },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  whLeft: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  whStats: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sep: { width: 2, height: 2, borderRadius: 1 },
  weekStrip: { flexDirection: 'column', gap: 6 },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 12,
    borderWidth: 1,
    borderRadius: 12,
    gap: 10,
  },
  weekDate: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingRight: 6,
    borderRightWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  weekBody: { flex: 1, flexDirection: 'column', gap: 4, minWidth: 0 },
  weekMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 18,
    paddingHorizontal: 7,
    borderRadius: 999,
  },
  catDot: { width: 5, height: 5, borderRadius: 2.5 },
  chev: {
    width: 30,
    height: 30,
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
