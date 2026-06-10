/**
 * CalendarMonth — Month view grid (B1, ADIM 5 → ADIM 8 prototip sadakat).
 *
 * Kaynak: docs/mobile-design-system/calendar-prototype-v2 — .month-grid + .day-cell + .event
 *   - 7 sütun × 6 satır eşit yükseklik grid, 2px gap, 6px radius
 *   - Hücrede üstte day number (mono 10.5px, merkez), altta event chip stack
 *   - Event chip: 14px yükseklik, kategori-renkli, 1px border, 2px radius
 *   - Bugün: gold border 0.5 alpha
 *   - Seçili: gold border + gold linear bg
 *   - Rest gun: info bg + border (cyan)
 *   - Pre/post month: visual parity (muted opacity yok)
 */
import { memo, useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from '../ui';
import { useT, useLocaleStore, useTranslations } from '../../lib/i18n';
import type { ColorPalette } from '../../theme/tokens';

export type CategoryKey = keyof ColorPalette['category'];

export interface DayWorkoutSummary {
  categories: CategoryKey[];
  hasMore: boolean;
  workoutCount: number;
  /** İleride preset.dayLabel ile zenginleştirilecek (Push / Pull / Leg) */
  dayLabel?: string;
}

export interface CalendarMonthProps {
  monthDate: Date;
  workoutsByDate: Map<string, DayWorkoutSummary>;
  todayISO: string;
  onDayPress: (dateISO: string) => void;
  /** Selected day (gold linear bg) — opsiyonel */
  selectedISO?: string;
  /** Rest day ISO seti (info bg + cyan border) — opsiyonel, parent'tan gelir */
  restDayISOs?: Set<string>;
}

const TR_DAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const EN_DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Kısa kategori isimleri (event chip içinde 7-8 char sığar)
const CAT_SHORT_TR: Record<CategoryKey, string> = {
  chest: 'Göğüs', back: 'Sırt', shoulder: 'Omuz', biceps: 'Biceps',
  triceps: 'Triceps', leg: 'Bacak', core: 'Karın', cardio: 'Kardio', other: 'Diğer',
};
const CAT_SHORT_EN: Record<CategoryKey, string> = {
  chest: 'Chest', back: 'Back', shoulder: 'Shoulder', biceps: 'Biceps',
  triceps: 'Triceps', leg: 'Leg', core: 'Core', cardio: 'Cardio', other: 'Other',
};

function buildMonthCells(monthDate: Date): Array<{ date: Date; iso: string; isCurrentMonth: boolean }> {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstDow = firstOfMonth.getDay();
  const mondayOffset = (firstDow + 6) % 7;
  const startDate = new Date(year, month, 1 - mondayOffset);
  const cells: Array<{ date: Date; iso: string; isCurrentMonth: boolean }> = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
    cells.push({ date: d, iso: toIsoDate(d), isCurrentMonth: d.getMonth() === month });
  }
  return cells;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear().toString().padStart(4, '0');
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function CalendarMonth({
  monthDate,
  workoutsByDate,
  todayISO,
  onDayPress,
  selectedISO,
  restDayISOs,
}: CalendarMonthProps) {
  const { colors, tokens } = useTheme();
  const locale = useLocaleStore((s) => s.locale);
  const dict = useTranslations();

  const cells = useMemo(() => buildMonthCells(monthDate), [monthDate]);
  const rows = useMemo(() => {
    const out: typeof cells[] = [];
    for (let r = 0; r < 6; r++) out.push(cells.slice(r * 7, r * 7 + 7));
    return out;
  }, [cells]);
  const dayLabels = locale === 'en' ? EN_DAYS_SHORT : TR_DAYS_SHORT;
  const catShort = locale === 'en' ? CAT_SHORT_EN : CAT_SHORT_TR;
  // months/monthLabel/yearLabel parent app-bar tarafından gösteriliyor (ADIM 8 fix).
  void dict.months;

  return (
    <View style={styles.root}>
      <View style={styles.weekRow}>
        {dayLabels.map((d) => (
          <View key={d} style={styles.weekCell}>
            <Text
              variant="meta"
              color="tertiary"
              align="center"
              style={{ fontFamily: tokens.fonts.mono, fontSize: 10, letterSpacing: 0.4 }}
            >
              {d.toUpperCase()}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {rows.map((row, rIdx) => (
          <View key={rIdx} style={styles.gridRow}>
            {row.map((cell) => {
          const isToday = cell.iso === todayISO;
          const isSelected = cell.iso === selectedISO;
          const isRest = restDayISOs?.has(cell.iso) ?? false;
          const summary = workoutsByDate.get(cell.iso);

          const cellBorder = isSelected
            ? colors.accent.gold
            : isToday
              ? colors.accent.gold
              : isRest
                ? colors.semantic.info
                : colors.border.subtle;

          const cellBg = isSelected
            ? colors.accent.goldMuted
            : isRest
              ? colors.semantic.infoMuted
              : colors.background.elevated;

          const dayNumColor = isSelected
            ? colors.text.onAccent
            : isToday
              ? colors.accent.goldHover
              : isRest
                ? colors.semantic.info
                : cell.isCurrentMonth
                  ? colors.text.primary
                  : colors.text.tertiary;

          const dayNumBg = isSelected
            ? colors.accent.gold
            : isToday
              ? colors.accent.goldMuted
              : 'transparent';

          return (
            <Pressable
              key={cell.iso}
              onPress={() => onDayPress(cell.iso)}
              style={({ pressed }) => [
                styles.dayCell,
                {
                  borderColor: cellBorder,
                  backgroundColor: pressed ? colors.background.hover : cellBg,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={[styles.dayNumWrap, { backgroundColor: dayNumBg }]}>
                <Text
                  align="center"
                  style={{
                    color: dayNumColor,
                    fontFamily: tokens.fonts.monoBold,
                    fontSize: 10.5,
                    lineHeight: 12,
                    fontWeight: '700',
                  }}
                >
                  {cell.date.getDate()}
                </Text>
              </View>

              {summary && summary.workoutCount > 0 && (
                <View style={styles.eventStack}>
                  {summary.categories.slice(0, 2).map((cat, i) => (
                    <View
                      key={`${cat}-${i}`}
                      style={[
                        styles.event,
                        {
                          backgroundColor: colors.categoryMuted[cat],
                          borderColor: colors.category[cat],
                        },
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          color: colors.category[cat],
                          fontSize: 8,
                          fontWeight: '700',
                          lineHeight: 10,
                        }}
                      >
                        {summary.dayLabel ?? catShort[cat]}
                      </Text>
                    </View>
                  ))}
                  {summary.hasMore && (
                    <Text
                      style={{
                        color: colors.text.tertiary,
                        fontSize: 8,
                        fontWeight: '700',
                        textAlign: 'center',
                      }}
                    >
                      +
                    </Text>
                  )}
                </View>
              )}

              {isRest && !summary && (
                <View style={[styles.event, { backgroundColor: colors.semantic.infoMuted, borderColor: colors.semantic.info }]}>
                  <Text
                    style={{
                      color: colors.semantic.info,
                      fontSize: 8,
                      fontFamily: tokens.fonts.mono,
                      fontWeight: '700',
                      letterSpacing: 0.5,
                      textAlign: 'center',
                      flex: 1,
                    }}
                  >
                    REST
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
          </View>
        ))}
      </View>
    </View>
  );
}

// PERF: 42 hücrelik grid her navigasyon push'unda yeniden çiziliyordu (navigator
// re-render'ı) ve push geçişini ~1.5s bloke ediyordu. Prop'lar değişmedikçe atla.
export default memo(CalendarMonth);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  weekRow: {
    flexDirection: 'row',
    paddingTop: 2,
    paddingBottom: 4,
  },
  weekCell: {
    flex: 1,
  },
  grid: {
    flex: 1,
    flexDirection: 'column',
    gap: 1,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 1,
  },
  dayCell: {
    flex: 1,
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 3,
    padding: 2,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  dayNumWrap: {
    width: 18,
    height: 16,
    alignSelf: 'center',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  eventStack: {
    gap: 1,
    marginTop: 1,
  },
  event: {
    height: 14,
    paddingHorizontal: 3,
    paddingTop: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 2,
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
