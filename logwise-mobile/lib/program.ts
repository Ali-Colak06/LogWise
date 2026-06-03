/**
 * program.ts — Aktif program gün çözümleyici (ADIM 6 — C3 + D2).
 *
 * Bir tarih + aktif program (+ program_days) verildiğinde:
 *   - dayIndex (0=Pzt ... 6=Paz)
 *   - isOffDay (off_days içinde VEYA o günde hiç egzersiz yok)
 *   - weekNumber (activated_at'tan bugüne kaç hafta — 1-based)
 *   - isDeloadWeek (cycle_type='deload' + (weekNumber % deload_every === 0))
 *   - exercises (o günün exercise_ref listesi, position'a göre sıralı)
 *
 * §3.2 + §8.8 + §8.10 + C3 spec.
 */
import type { AppProgramsRow, AppProgramDaysRow, DayIndex } from '../types/database';

/** JS getDay(): 0=Paz...6=Cmt. Bizim indeks: 0=Pzt...6=Paz. */
export function isoToDayIndex(dateISO: string): DayIndex {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO);
  if (!m) return 0;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return (((d.getDay() + 6) % 7) as DayIndex);
}

function diffDays(fromISO: string, toISO: string): number {
  const a = parseISO(fromISO);
  const b = parseISO(toISO);
  if (!a || !b) return 0;
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}

function parseISO(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export interface ResolvedProgramDay {
  dayIndex: DayIndex;
  isOffDay: boolean;
  weekNumber: number;        // 1-based; activated_at gelecekteyse 0
  isDeloadWeek: boolean;
  exerciseRefs: string[];    // sıralı
  hasStarted: boolean;       // activated_at <= date
}

export function resolveProgramDay(
  program: AppProgramsRow,
  programDays: AppProgramDaysRow[],
  dateISO: string,
): ResolvedProgramDay {
  const dayIndex = isoToDayIndex(dateISO);
  const activatedISO = program.activated_at
    ? program.activated_at.slice(0, 10)
    : null;

  const hasStarted = activatedISO ? activatedISO <= dateISO : false;
  const daysSinceStart = activatedISO ? diffDays(activatedISO, dateISO) : -1;
  const weekNumber = daysSinceStart >= 0 ? Math.floor(daysSinceStart / 7) + 1 : 0;

  const dayRows = programDays
    .filter((d) => d.day_index === dayIndex)
    .sort((a, b) => a.position - b.position);
  const exerciseRefs = dayRows.map((d) => d.exercise_ref);

  const inOffDays = program.off_days.includes(dayIndex);
  const isOffDay = inOffDays || exerciseRefs.length === 0;

  const isDeloadWeek =
    program.cycle_type === 'deload' &&
    program.deload_every != null &&
    program.deload_every > 0 &&
    weekNumber > 0 &&
    weekNumber % program.deload_every === 0;

  return { dayIndex, isOffDay, weekNumber, isDeloadWeek, exerciseRefs, hasStarted };
}

/** D2 ActiveProgramCard 7-hücre özeti için gün → egzersiz sayısı. */
export function programDayCounts(
  program: AppProgramsRow,
  programDays: AppProgramDaysRow[],
): Array<{ dayIndex: DayIndex; exerciseCount: number; isOffDay: boolean }> {
  const out: Array<{ dayIndex: DayIndex; exerciseCount: number; isOffDay: boolean }> = [];
  for (let i = 0 as DayIndex; i <= 6; i = ((i + 1) as DayIndex)) {
    const count = programDays.filter((d) => d.day_index === i).length;
    const isOffDay = program.off_days.includes(i) || count === 0;
    out.push({ dayIndex: i, exerciseCount: count, isOffDay });
    if (i === 6) break;
  }
  return out;
}

/** Toplam egzersiz sayısı (program "aktif edilebilir mi" kontrolü için). */
export function totalProgramExercises(programDays: AppProgramDaysRow[]): number {
  return programDays.length;
}

/** Off-day haricinde egzersizli gün sayısı. */
export function programDayCount(
  program: AppProgramsRow,
  programDays: AppProgramDaysRow[],
): number {
  const counts = programDayCounts(program, programDays);
  return counts.filter((c) => c.exerciseCount > 0 && !program.off_days.includes(c.dayIndex)).length;
}
