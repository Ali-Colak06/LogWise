/**
 * calc.ts — Compliance + streak + PR hesapları (ADIM 6 — D2).
 *
 * §8.6: Compliance = yapılan / yapılması gereken (off_days dışlanır). `none` cycle
 * için null (UI'da —%). Web `calcCompliance` mantığıyla hizalı.
 *
 * MVP basitleştirme: streak = activated_at'tan bugüne, log'lanan program günlerinin
 * ardışık serisi. PR = en yüksek (weight × reps) ürünü olan set.
 */
import type { AppProgramsRow, AppProgramDaysRow, AppWorkoutsRow, AppSetsRow, DayIndex } from '../types/database';
import { isoToDayIndex } from './program';

function parseISO(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function diffDays(fromISO: string, toISO: string): number {
  const a = parseISO(fromISO);
  const b = parseISO(toISO);
  if (!a || !b) return 0;
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}

function isoFromDate(d: Date): string {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
    .getDate()
    .toString()
    .padStart(2, '0')}`;
}

/**
 * Compliance % (0-100) — `none` cycle veya plan yoksa null.
 * workoutDates = kullanıcının workout girdiği distinct tarihler (program aralığında).
 */
export function calcCompliance(
  program: AppProgramsRow,
  programDays: AppProgramDaysRow[],
  workoutDates: string[],
  todayISO: string,
): number | null {
  if (program.cycle_type === 'none') return null;
  if (!program.activated_at) return null;
  const startISO = program.activated_at.slice(0, 10);
  const span = diffDays(startISO, todayISO);
  if (span < 0) return null;

  // Egzersizli (off olmayan) gün indexleri
  const trainingDays = new Set<DayIndex>();
  for (let i = 0 as DayIndex; i <= 6; i = ((i + 1) as DayIndex)) {
    const count = programDays.filter((d) => d.day_index === i).length;
    if (count > 0 && !program.off_days.includes(i)) trainingDays.add(i);
    if (i === 6) break;
  }
  if (trainingDays.size === 0) return null;

  // Beklenen training günleri (start → today arası her gün)
  let expected = 0;
  const start = parseISO(startISO)!;
  for (let i = 0; i <= span; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    if (trainingDays.has(isoToDayIndex(isoFromDate(d)))) expected++;
  }
  if (expected === 0) return null;

  // Yapılan: program aralığında training günü olan distinct workout tarihleri
  const doneSet = new Set(
    workoutDates.filter((wd) => wd >= startISO && wd <= todayISO && trainingDays.has(isoToDayIndex(wd))),
  );
  const done = doneSet.size;
  return Math.min(100, Math.round((done / expected) * 100));
}

/** Bir sonraki egzersiz günü (bugün dahil) — D2 "Sıradaki" stat. */
export function nextTrainingDow(
  program: AppProgramsRow,
  programDays: AppProgramDaysRow[],
  todayISO: string,
): DayIndex | undefined {
  const trainingDays = new Set<DayIndex>();
  for (let i = 0 as DayIndex; i <= 6; i = ((i + 1) as DayIndex)) {
    const count = programDays.filter((d) => d.day_index === i).length;
    if (count > 0 && !program.off_days.includes(i)) trainingDays.add(i);
    if (i === 6) break;
  }
  if (trainingDays.size === 0) return undefined;
  const todayDow = isoToDayIndex(todayISO);
  for (let off = 0; off < 7; off++) {
    const dow = (((todayDow + off) % 7) as DayIndex);
    if (trainingDays.has(dow)) return dow;
  }
  return undefined;
}

/** Basit streak: bugünden geriye, training günlerinde kesintisiz log serisi. */
export function calcStreak(
  program: AppProgramsRow,
  programDays: AppProgramDaysRow[],
  workoutDates: string[],
  todayISO: string,
): number {
  const trainingDays = new Set<DayIndex>();
  for (let i = 0 as DayIndex; i <= 6; i = ((i + 1) as DayIndex)) {
    const count = programDays.filter((d) => d.day_index === i).length;
    if (count > 0 && !program.off_days.includes(i)) trainingDays.add(i);
    if (i === 6) break;
  }
  if (trainingDays.size === 0) return 0;
  const done = new Set(workoutDates);
  const today = parseISO(todayISO);
  if (!today) return 0;
  let streak = 0;
  // Bugünden geriye 365 güne kadar tara
  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const iso = isoFromDate(d);
    const dow = isoToDayIndex(iso);
    if (!trainingDays.has(dow)) continue; // off-day zinciri kırmaz
    if (done.has(iso)) {
      streak++;
    } else {
      // bugün henüz yapılmadıysa zinciri kırma (gün bitmedi)
      if (i === 0) continue;
      break;
    }
  }
  return streak;
}

/** PR display: en yüksek (weight×reps) seti. Yoksa undefined. */
export function calcPRDisplay(sets: AppSetsRow[]): string | undefined {
  let best: { weight: number; reps: number; score: number } | null = null;
  for (const s of sets) {
    if (s.weight == null || s.reps == null) continue;
    const score = s.weight * s.reps;
    if (!best || score > best.score) best = { weight: s.weight, reps: s.reps, score };
  }
  if (!best) return undefined;
  return `${best.weight} × ${best.reps}`;
}

/** Toplam hacim (kg) — kart/gün özeti. */
export function totalVolume(sets: AppSetsRow[]): number {
  let v = 0;
  for (const s of sets) {
    if (s.weight != null && s.reps != null) v += s.weight * s.reps;
  }
  return v;
}

/** Relative "X gün önce" / "bugün" — i18n dışı basit util (caller locale verir). */
export function relativeDayLabel(dateISO: string, todayISO: string, locale: 'tr' | 'en'): string {
  const d = diffDays(dateISO, todayISO);
  if (d <= 0) return locale === 'tr' ? 'bugün' : 'today';
  if (d === 1) return locale === 'tr' ? 'dün' : 'yesterday';
  if (d < 7) return locale === 'tr' ? `${d} gün önce` : `${d} days ago`;
  const w = Math.floor(d / 7);
  if (w === 1) return locale === 'tr' ? '1 hafta önce' : '1 week ago';
  if (w < 5) return locale === 'tr' ? `${w} hafta önce` : `${w} weeks ago`;
  const mo = Math.floor(d / 30);
  return locale === 'tr' ? `${mo} ay önce` : `${mo} months ago`;
}
