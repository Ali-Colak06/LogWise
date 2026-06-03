/**
 * ActiveProgramCard — D2 featured aktif program kartı (ADIM 6).
 * kicker + ad + meta + ✎/⋯ + 3 stat (Uyum/Seri/Sıradaki) + 7 day-chip + CTA row.
 */
import { StyleSheet, View, Pressable } from 'react-native';
import { Pencil, MoreVertical } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Text, Button } from '../ui';
import { useT, useTranslations } from '../../lib/i18n';
import { programDayCounts } from '../../lib/program';
import { calcCompliance, calcStreak, nextTrainingDow } from '../../lib/calc';
import type { AppProgramsRow, AppProgramDaysRow } from '../../types/database';

export interface ActiveProgramCardProps {
  program: AppProgramsRow;
  programDays: AppProgramDaysRow[];
  workoutDates: string[];
  todayISO: string;
  todayDow: number;
  onEdit: () => void;
  onMenu: () => void;
  onTodayWorkout: () => void;
  onViewWeek: () => void;
}

export default function ActiveProgramCard({
  program,
  programDays,
  workoutDates,
  todayISO,
  todayDow,
  onEdit,
  onMenu,
  onTodayWorkout,
  onViewWeek,
}: ActiveProgramCardProps) {
  const { colors } = useTheme();
  const t = useT();
  const dict = useTranslations();

  const counts = programDayCounts(program, programDays);
  const compliance = calcCompliance(program, programDays, workoutDates, todayISO);
  const streak = calcStreak(program, programDays, workoutDates, todayISO);
  const nextDow = nextTrainingDow(program, programDays, todayISO);

  const cycleLabel =
    program.cycle_type === 'deload'
      ? t('library.cycleDeload')
      : program.cycle_type === 'none'
        ? t('library.cycleNone')
        : t('library.cycleWeekly');

  return (
    <View style={[styles.card, { backgroundColor: colors.background.elevated, borderColor: colors.border.subtle }]}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text variant="meta" color="secondary">{t('library.activeProgram')}</Text>
          <Text variant="screenHeading" numberOfLines={2} style={{ marginTop: 2 }}>{program.name}</Text>
          <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>{cycleLabel}</Text>
        </View>
        <Pressable onPress={onEdit} hitSlop={8} style={styles.iconBtn} accessibilityLabel={t('library.edit')}>
          <Pencil size={18} color={colors.text.secondary} />
        </Pressable>
        <Pressable onPress={onMenu} hitSlop={8} style={styles.iconBtn} accessibilityLabel={t('common.more')}>
          <MoreVertical size={18} color={colors.text.secondary} />
        </Pressable>
      </View>

      {/* Stats */}
      <View style={[styles.stats, { borderColor: colors.border.subtle }]}>
        <View style={styles.statCell}>
          <Text variant="meta" color="secondary">{t('library.statCompliance')}</Text>
          <Text variant="bodyStrong" style={{ color: colors.accent.gold }}>
            {compliance === null ? '—' : `%${compliance}`}
          </Text>
        </View>
        <View style={[styles.statCell, styles.statBorder, { borderColor: colors.border.subtle }]}>
          <Text variant="meta" color="secondary">{t('library.statStreak')}</Text>
          <Text variant="bodyStrong">{streak}</Text>
        </View>
        <View style={[styles.statCell, styles.statBorder, { borderColor: colors.border.subtle }]}>
          <Text variant="meta" color="secondary">{t('library.statNext')}</Text>
          <Text variant="bodyStrong">{nextDow !== undefined ? (dict.days[nextDow] ?? '—') : '—'}</Text>
        </View>
      </View>

      {/* 7 day chips */}
      <View style={styles.chips}>
        {counts.map((c) => {
          const isToday = c.dayIndex === todayDow;
          const rest = c.isOffDay;
          return (
            <View
              key={c.dayIndex}
              style={[
                styles.chip,
                {
                  borderColor: isToday ? colors.accent.gold : colors.border.subtle,
                  borderWidth: isToday ? 2 : StyleSheet.hairlineWidth,
                },
              ]}
            >
              <Text variant="meta" color={isToday ? 'primary' : 'secondary'}>{dict.days[c.dayIndex] ?? ''}</Text>
              <Text variant="meta" style={{ color: rest ? colors.semantic.info : colors.text.secondary }}>
                {rest ? '—' : `${c.exerciseCount}`}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.ctaRow}>
        <View style={{ flex: 1 }}>
          <Button variant="primary" size="sm" label={t('library.ctaTodayWorkout')} onPress={onTodayWorkout} fullWidth />
        </View>
        <View style={{ flex: 1 }}>
          <Button variant="secondary" size="sm" label={t('library.ctaViewWeek')} onPress={onViewWeek} fullWidth />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 16, marginHorizontal: 8, marginTop: 12 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  iconBtn: { padding: 4 },
  stats: { flexDirection: 'row', borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, marginTop: 14, paddingVertical: 10 },
  statCell: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: StyleSheet.hairlineWidth },
  chips: { flexDirection: 'row', gap: 4, marginTop: 14 },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 8, gap: 2 },
  ctaRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
});
