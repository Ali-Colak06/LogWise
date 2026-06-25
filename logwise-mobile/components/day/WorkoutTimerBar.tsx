/**
 * WorkoutTimerBar — Day Detail antrenman kronometresi (sticky bottom).
 *
 * Kullanıcı kararı (2026-06-17): MVP'de rest timer YOK. Day Detail'de week-view ile
 * tutarlı, "Start workout" ile başlayan GEÇİCİ (ephemeral) bir antrenman kronometresi
 * var: Başla → süre + Durdur/Devam + Bitir. DB'ye HİÇBİR ŞEY yazmaz; ekrandan çıkınca
 * sıfırlanır. (İleride kalıcılık: app_day_meta.total_duration_minutes — şema hazır.)
 * Set girişini GATE'lemez; ekran açılır açılmaz set girilebilir (§3.2 direkt giriş).
 */
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Play, Pause, Check } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Text } from '../ui';
import { useT } from '../../lib/i18n';

export interface WorkoutStopwatch {
  started: boolean;
  running: boolean;
  elapsed: number;
  start: () => void;
  toggle: () => void;
  finish: () => void;
}

export function useWorkoutStopwatch(): WorkoutStopwatch {
  const [started, setStarted] = useState(false);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const start = useCallback(() => {
    setStarted(true);
    setRunning(true);
  }, []);
  const toggle = useCallback(() => setRunning((r) => !r), []);
  const finish = useCallback(() => {
    setStarted(false);
    setRunning(false);
    setElapsed(0);
  }, []);

  return { started, running, elapsed, start, toggle, finish };
}

export function fmtElapsed(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export interface WorkoutTimerBarProps {
  sw: WorkoutStopwatch;
}

export default function WorkoutTimerBar({ sw }: WorkoutTimerBarProps) {
  const { colors, tokens } = useTheme();
  const t = useT();

  if (!sw.started) {
    return (
      <View style={[styles.wrap, { borderColor: colors.border.subtle, backgroundColor: colors.background.elevated }]}>
        <Pressable
          onPress={sw.start}
          style={({ pressed }) => [styles.startBtn, { backgroundColor: colors.accent.gold, opacity: pressed ? 0.85 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel={t('calendar.startWorkout')}
        >
          <Play size={15} color={colors.text.onAccent} fill={colors.text.onAccent} />
          <Text style={{ color: colors.text.onAccent, fontFamily: tokens.fonts.bodyBold, fontSize: 14 }}>
            {t('calendar.startWorkout')}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { borderColor: colors.border.subtle, backgroundColor: colors.background.elevated }]}>
      <View style={[styles.timerBar, { borderColor: colors.accent.gold, backgroundColor: colors.accent.goldMuted }]}>
        <View style={[styles.pulse, { backgroundColor: colors.accent.gold }]} />
        <Text style={{ flex: 1, color: colors.accent.goldHover, fontFamily: tokens.fonts.monoBold, fontSize: 18, letterSpacing: 0.5 }}>
          {fmtElapsed(sw.elapsed)}
        </Text>
        <Pressable
          onPress={sw.toggle}
          hitSlop={4}
          style={[styles.ctl, { borderColor: colors.border.subtle, backgroundColor: colors.background.subtle }]}
        >
          {sw.running ? (
            <Pause size={13} color={colors.text.secondary} />
          ) : (
            <Play size={13} color={colors.text.secondary} />
          )}
          <Text style={{ color: colors.text.secondary, fontSize: 12, fontFamily: tokens.fonts.bodyBold }}>
            {sw.running ? t('calendar.timerPause') : t('calendar.timerResume')}
          </Text>
        </Pressable>
        <Pressable
          onPress={sw.finish}
          hitSlop={4}
          style={[styles.ctl, { borderColor: colors.accent.gold, backgroundColor: colors.accent.gold }]}
        >
          <Check size={13} color={colors.text.onAccent} />
          <Text style={{ color: colors.text.onAccent, fontSize: 12, fontFamily: tokens.fonts.bodyBold }}>
            {t('calendar.timerFinish')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  startBtn: {
    height: 44,
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
  pulse: { width: 8, height: 8, borderRadius: 4 },
  ctl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
