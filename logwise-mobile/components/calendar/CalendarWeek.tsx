/**
 * CalendarWeek — Week view scrollable feed + akordiyon detay (B1, ADIM 5 → kullanıcı turu).
 *
 * Kaynak: docs/mobile-design-system/calendar-prototype-v2 — .week-block + .week-row (+ expanded).
 *   - Haftalar dikey stack; her hafta kompakt header (W## + tarih aralığı + cats stat)
 *   - Gün satırı (collapsed): sol tarih kolonu | sol-üst "N hareket · M set" + kategori chip'leri | chevron
 *   - Chevron tap → akordiyon aç: alt alta hareket satırları (sağda son seans max kg×tekrar) +
 *     "Start workout" → geçici kronometre (Durdur/Bitir). Aynı anda tek gün açık.
 *   - Gün gövdesine tap (chevron hariç) → o güne (Day Detail) gider.
 *   - Bugün: gold border. Planlı gün (aktif programdan, loglanmamış): gövde soluk.
 */
import { memo, useEffect, useMemo, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ChevronDown, Play, Pause, Check } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Text } from '../ui';
import { useLocaleStore, useTranslations, useT } from '../../lib/i18n';
import { useLastSession } from '../../queries/workouts';
import { CAT_SHORT_TR, CAT_SHORT_EN, type CategoryKey } from './CalendarMonth';
import type { AppSetsRow } from '../../types/database';

export interface WeekDayExercise {
  ref: string;          // slug VEYA UUID (§4.3 polymorphic) — son seans lookup'ı için
  name: string;
  category: CategoryKey;
}

export interface WeekDaySummary {
  workoutCount: number;          // = exercises.length
  setCount: number;              // loglu set sayısı (planlı günde 0)
  planned: boolean;              // true → aktif programdan planlı, loglanmamış (soluk)
  exercises: WeekDayExercise[];
  isRest?: boolean;
}

export interface CalendarWeekProps {
  anchorDate: Date;
  summaryByDate: Map<string, WeekDaySummary>;
  todayISO: string;
  onDayPress: (dateISO: string) => void;
  weeksBefore?: number;
  weeksAfter?: number;
  /**
   * Her hafta bloğu render/layout olduğunda y offset'ini parent'a bildirir.
   * Parent bunu hem bugünün haftasına auto-scroll hem de app bar başlığını
   * görünür haftaya senkronlamak için kullanır.
   */
  onWeekLayout?: (weekStartISO: string, weekStart: Date, y: number, isToday: boolean) => void;
}

const TR_DOW = ['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ'];
const EN_DOW = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function toIsoDate(d: Date): string {
  const y = d.getFullYear().toString().padStart(4, '0');
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startOfWeekMonday(d: Date): Date {
  const dow = d.getDay();
  const offset = (dow + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
}

export function isoWeekNumber(d: Date): number {
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayNum = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNum + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = (target.getTime() - firstThursday.getTime()) / 86400000;
  return 1 + Math.round((diff - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
}

/** "13 — 19 Eyl" / "29 Eyl — 5 Eki" — hafta başlığı + app bar senkronu ortak kullanır. */
export function formatWeekRange(start: Date, end: Date, months: readonly string[]): string {
  const startMonth = months[start.getMonth()] ?? '';
  const endMonth = months[end.getMonth()] ?? '';
  return start.getMonth() === end.getMonth()
    ? `${start.getDate()} — ${end.getDate()} ${startMonth}`
    : `${start.getDate()} ${startMonth} — ${end.getDate()} ${endMonth}`;
}

/** Bir gündeki hareketlerin benzersiz kategorileri (ilk görülme sırasıyla). */
function uniqueCategories(exs: WeekDayExercise[]): CategoryKey[] {
  const seen = new Set<CategoryKey>();
  const out: CategoryKey[] = [];
  for (const e of exs) {
    if (!seen.has(e.category)) {
      seen.add(e.category);
      out.push(e.category);
    }
  }
  return out;
}

/** Set listesinden en ağır set → "82.5 kg × 6"; yoksa "—". */
function bestSetLabel(sets: AppSetsRow[]): string {
  let best: { weight: number; reps: number } | null = null;
  for (const s of sets) {
    const w = typeof s.weight === 'number' ? s.weight : null;
    if (w == null) continue;
    const reps = typeof s.reps === 'number' ? s.reps : 0;
    if (!best || w > best.weight) best = { weight: w, reps };
  }
  if (!best) return '—';
  return `${best.weight} kg × ${best.reps}`;
}

function fmtElapsed(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// ---------------------------------------------------------------------------
// Akordiyon detayındaki tek hareket satırı — son seans en ağır seti (lazy fetch).
// ---------------------------------------------------------------------------
function WeekExerciseDetailRow({
  exercise,
  beforeDateISO,
}: {
  exercise: WeekDayExercise;
  beforeDateISO: string;
}) {
  const { colors, tokens } = useTheme();
  const lastQ = useLastSession(exercise.ref, beforeDateISO);
  const label = useMemo(() => bestSetLabel(lastQ.data?.sets ?? []), [lastQ.data]);

  return (
    <View style={styles.exRow}>
      <View style={[styles.exAccent, { backgroundColor: colors.category[exercise.category] }]} />
      <Text numberOfLines={1} style={[styles.exName, { color: colors.text.primary }]}>
        {exercise.name}
      </Text>
      <Text style={{ color: colors.text.tertiary, fontFamily: tokens.fonts.mono, fontSize: 10.5 }}>
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Start workout → geçici (ephemeral) kronometre + Durdur/Bitir.
// NOT: Bu kronometre bilinçli olarak GEÇİCİDİR — DB'ye hiçbir şey yazmaz, akordiyon
// kapanınca/ekrandan çıkınca sıfırlanır (kullanıcı kararı 2026-06-16). İleride kalıcı
// yapılırsa süre app_day_meta.total_duration_minutes alanına yazılabilir (şema hazır).
// ---------------------------------------------------------------------------
function WeekTimerCta() {
  const { colors, tokens } = useTheme();
  const t = useT();
  const [started, setStarted] = useState(false);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  if (!started) {
    return (
      <Pressable
        onPress={() => {
          setStarted(true);
          setRunning(true);
        }}
        style={({ pressed }) => [
          styles.startBtn,
          { backgroundColor: colors.accent.gold, opacity: pressed ? 0.85 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('calendar.startWorkout')}
      >
        <Play size={14} color={colors.text.onAccent} fill={colors.text.onAccent} />
        <Text style={{ color: colors.text.onAccent, fontFamily: tokens.fonts.bodyBold, fontSize: 13 }}>
          {t('calendar.startWorkout')}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.timerBar, { borderColor: colors.accent.gold, backgroundColor: colors.accent.goldMuted }]}>
      <View style={[styles.timerPulse, { backgroundColor: colors.accent.gold }]} />
      <Text style={{ flex: 1, color: colors.accent.goldHover, fontFamily: tokens.fonts.monoBold, fontSize: 15, letterSpacing: 0.5 }}>
        {fmtElapsed(elapsed)}
      </Text>
      <Pressable
        onPress={() => setRunning((r) => !r)}
        hitSlop={4}
        style={[styles.timerCtl, { borderColor: colors.border.subtle, backgroundColor: colors.background.subtle }]}
      >
        {running ? <Pause size={12} color={colors.text.secondary} /> : <Play size={12} color={colors.text.secondary} />}
        <Text style={{ color: colors.text.secondary, fontSize: 11, fontFamily: tokens.fonts.bodyBold }}>
          {running ? t('calendar.timerPause') : t('calendar.timerResume')}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => {
          setStarted(false);
          setRunning(false);
          setElapsed(0);
        }}
        hitSlop={4}
        style={[styles.timerCtl, { borderColor: colors.accent.gold, backgroundColor: colors.accent.gold }]}
      >
        <Check size={12} color={colors.text.onAccent} />
        <Text style={{ color: colors.text.onAccent, fontSize: 11, fontFamily: tokens.fonts.bodyBold }}>
          {t('calendar.timerFinish')}
        </Text>
      </Pressable>
    </View>
  );
}

function CalendarWeek({
  anchorDate,
  summaryByDate,
  todayISO,
  onDayPress,
  weeksBefore = 3,
  weeksAfter = 3,
  onWeekLayout,
}: CalendarWeekProps) {
  const { colors, tokens } = useTheme();
  const locale = useLocaleStore((s) => s.locale);
  const dict = useTranslations();
  const t = useT();
  const months = dict.months;

  const [expandedISO, setExpandedISO] = useState<string | null>(null);

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
  const catShort = locale === 'en' ? CAT_SHORT_EN : CAT_SHORT_TR;

  return (
    <View style={styles.feed}>
      {weeks.map(({ start, days }) => {
        const weekNum = isoWeekNumber(start);
        const lastDay = days[6];
        if (!lastDay) return null;
        const rangeLabel = formatWeekRange(start, lastDay.date, months);

        // Header stat'ları sadece LOGLU (yapılmış) günleri sayar — planlı günler şişirmesin.
        const totalWorkouts = days.reduce((acc, dd) => {
          const s = summaryByDate.get(dd.iso);
          return acc + (s && !s.planned ? s.workoutCount : 0);
        }, 0);
        const workoutDays = days.filter((dd) => {
          const s = summaryByDate.get(dd.iso);
          return !!s && !s.planned && s.workoutCount > 0;
        }).length;

        const containsToday = days.some((dd) => dd.iso === todayISO);

        return (
          <View
            key={start.toISOString()}
            style={styles.weekBlock}
            onLayout={(e) => onWeekLayout?.(toIsoDate(start), start, e.nativeEvent.layout.y, containsToday)}
          >
            <View style={styles.weekHeader}>
              <View style={styles.whLeft}>
                <Text style={{ color: colors.text.tertiary, fontFamily: tokens.fonts.monoBold, fontSize: 10, letterSpacing: 1.4 }}>
                  W{weekNum.toString().padStart(2, '0')}
                </Text>
                <Text style={{ color: colors.text.primary, fontFamily: tokens.fonts.displayBold, fontSize: 14, letterSpacing: -0.05 }}>
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
                const exercises = summary?.exercises ?? [];
                const hasExercises = exercises.length > 0;
                const planned = summary?.planned ?? false;
                const isExpanded = expandedISO === iso && hasExercises;
                const cats = hasExercises ? uniqueCategories(exercises) : [];
                const setCount = summary?.setCount ?? 0;

                const rowBorder = isExpanded || isToday
                  ? colors.accent.gold
                  : isRest
                    ? colors.semantic.info
                    : colors.border.subtle;
                const rowBg = isRest ? colors.semantic.infoMuted : colors.background.elevated;

                return (
                  <View
                    key={iso}
                    style={[styles.weekRow, { borderColor: rowBorder, backgroundColor: rowBg }]}
                  >
                    {/* Header (tap → Day Detail). Chevron iç içe Pressable: kendi tap'ini yutar. */}
                    <Pressable
                      onPress={() => onDayPress(iso)}
                      style={({ pressed }) => [styles.weekRowHeader, pressed && { opacity: 0.7 }]}
                    >
                      <View style={[styles.weekDate, { borderRightColor: colors.border.subtle }]}>
                        <Text style={{ color: colors.text.secondary, fontFamily: tokens.fonts.monoBold, fontSize: 9.5, letterSpacing: 1 }}>
                          {dowLabels[dowIdx]}
                        </Text>
                        <Text style={{ color: isToday ? colors.accent.gold : colors.text.primary, fontFamily: tokens.fonts.displayBold, fontSize: 20, lineHeight: 22 }}>
                          {date.getDate()}
                        </Text>
                      </View>

                      <View style={[styles.weekBody, planned && styles.weekBodyPlanned]}>
                        {hasExercises ? (
                          <>
                            <Text style={{ color: colors.text.tertiary, fontFamily: tokens.fonts.mono, fontSize: 10, letterSpacing: 0.2 }}>
                              {exercises.length} {t('calendar.exShort')}
                              {setCount > 0 ? ` · ${setCount} ${t('calendar.setShort')}` : ''}
                            </Text>
                            <View style={styles.catChipRow}>
                              {cats.slice(0, 5).map((cat, i) => (
                                <View key={`${cat}-${i}`} style={[styles.catChip, { backgroundColor: colors.categoryMuted[cat] }]}>
                                  <View style={[styles.catDot, { backgroundColor: colors.category[cat] }]} />
                                  <Text style={{ color: colors.category[cat], fontSize: 10, fontWeight: '700', lineHeight: 14 }}>
                                    {catShort[cat]}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </>
                        ) : (
                          <Text style={{ color: isRest ? colors.semantic.info : colors.text.tertiary, fontFamily: tokens.fonts.body, fontSize: 12 }}>
                            {isRest ? t('day.restDayShort') : '—'}
                          </Text>
                        )}
                      </View>

                      {hasExercises ? (
                        <Pressable
                          onPress={() => setExpandedISO((cur) => (cur === iso ? null : iso))}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityState={{ expanded: isExpanded }}
                          style={[styles.chev, { borderColor: colors.border.subtle, backgroundColor: colors.background.subtle }]}
                        >
                          <View style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}>
                            <ChevronDown color={isExpanded ? colors.accent.gold : colors.text.secondary} size={16} />
                          </View>
                        </Pressable>
                      ) : (
                        <View style={styles.chevSpacer} />
                      )}
                    </Pressable>

                    {/* Akordiyon detayı — header Pressable'ın DIŞINDA (tap'leri navigasyona gitmesin). */}
                    {isExpanded && (
                      <View style={[styles.expandedWrap, { borderTopColor: colors.border.subtle }]}>
                        <View style={styles.exerciseList}>
                          {exercises.map((ex, i) => (
                            <WeekExerciseDetailRow
                              key={`${ex.ref}-${i}`}
                              exercise={ex}
                              beforeDateISO={toIsoDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1))}
                            />
                          ))}
                        </View>
                        <WeekTimerCta />
                      </View>
                    )}
                  </View>
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
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  weekRowHeader: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 12,
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
  weekBody: { flex: 1, flexDirection: 'column', gap: 4, minWidth: 0, justifyContent: 'center' },
  weekBodyPlanned: { opacity: 0.5 },
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
  chevSpacer: { width: 30, alignSelf: 'center' },
  // ----- Akordiyon detay -----
  expandedWrap: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  exerciseList: { flexDirection: 'column' },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
  },
  exAccent: { width: 4, height: 22, borderRadius: 2 },
  exName: { flex: 1, fontSize: 13, fontWeight: '600' },
  // ----- Start workout / kronometre -----
  startBtn: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
  },
  timerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 6,
    borderWidth: 1,
    borderRadius: 12,
  },
  timerPulse: { width: 8, height: 8, borderRadius: 4 },
  timerCtl: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
});
