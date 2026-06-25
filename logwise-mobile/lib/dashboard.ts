/**
 * dashboard.ts — F1 Dashboard saf hesaplama (§3.11 launch fazı).
 *
 * Ham `DashboardSet[]` (data-bridge `fetchDashboardSets`) → türetilmiş metrikler.
 * Saf/yan-etkisiz: aynı girdi → aynı çıktı (test edilebilir). Ref→kategori/isim
 * çözümü locale+customMap bağımlı olduğu için BURADA yapılmaz; ham `setsByRef` /
 * `prByRef` döner, ekran `resolveExerciseRef` ile çözer (kas dağılımı + PR isimleri).
 */
import { isoToDayIndex } from './program';

export interface DashboardSet {
  weight: number | null;
  reps: number | null;
  ref: string;
  date: string; // YYYY-MM-DD
}

export interface WeeklyVolumePoint {
  weekStartISO: string; // o haftanın Pazartesi'si
  volume: number;
}

export interface RefCount {
  ref: string;
  count: number;
}

export interface RefPR {
  ref: string;
  weight: number;
  reps: number;
  score: number; // weight × reps
}

export interface DashboardData {
  hasData: boolean;
  totalWorkouts: number; // set girilen distinct gün
  totalVolumeKg: number;
  totalSets: number;
  thisWeekWorkouts: number; // bu takvim haftasındaki distinct gün
  weeklyVolume: WeeklyVolumePoint[]; // son N hafta (eskiden yeniye)
  setsByRef: RefCount[]; // ref başına set sayısı (azalan)
  prByRef: RefPR[]; // ref başına en ağır set (score azalan)
}

function parseISO(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function isoFromDate(d: Date): string {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
    .getDate()
    .toString()
    .padStart(2, '0')}`;
}

/** Bir tarihin haftasının Pazartesi'si (ISO). Pzt=0 (isoToDayIndex). */
export function weekStartISO(dateISO: string): string {
  const d = parseISO(dateISO);
  if (!d) return dateISO;
  const dow = isoToDayIndex(dateISO); // Pzt=0..Paz=6
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow);
  return isoFromDate(monday);
}

export function computeDashboard(
  sets: DashboardSet[],
  todayISO: string,
  weeks = 8,
  muscleWindowDays = 30,
): DashboardData {
  const dates = new Set<string>();
  let totalVolumeKg = 0;
  const volumeByWeek = new Map<string, number>();
  const setsByRef = new Map<string, number>(); // son `muscleWindowDays` gün (güncel denge)
  const prByRef = new Map<string, RefPR>(); // all-time rekor

  // Kas dağılımı penceresi alt sınırı (today − muscleWindowDays)
  const todayD = parseISO(todayISO);
  const cutoffISO = todayD
    ? isoFromDate(new Date(todayD.getFullYear(), todayD.getMonth(), todayD.getDate() - muscleWindowDays))
    : '0000-00-00';

  for (const s of sets) {
    dates.add(s.date);
    if (s.date >= cutoffISO) {
      setsByRef.set(s.ref, (setsByRef.get(s.ref) ?? 0) + 1);
    }

    if (typeof s.weight === 'number' && typeof s.reps === 'number') {
      const vol = s.weight * s.reps;
      totalVolumeKg += vol;
      const wk = weekStartISO(s.date);
      volumeByWeek.set(wk, (volumeByWeek.get(wk) ?? 0) + vol);

      const score = s.weight * s.reps;
      const cur = prByRef.get(s.ref);
      if (!cur || score > cur.score) {
        prByRef.set(s.ref, { ref: s.ref, weight: s.weight, reps: s.reps, score });
      }
    }
  }

  // Bu hafta: bugünün haftasına ait distinct antrenman günü
  const thisWeekStart = weekStartISO(todayISO);
  const thisWeekWorkouts = Array.from(dates).filter((d) => weekStartISO(d) === thisWeekStart).length;

  // Son `weeks` hafta: bugünden geriye sabit pencere (boş haftalar 0 ile dolu).
  const weekly: WeeklyVolumePoint[] = [];
  const today = parseISO(todayISO);
  if (today) {
    const todayMonday = parseISO(thisWeekStart)!;
    for (let i = weeks - 1; i >= 0; i--) {
      const ws = new Date(todayMonday.getFullYear(), todayMonday.getMonth(), todayMonday.getDate() - i * 7);
      const wsISO = isoFromDate(ws);
      weekly.push({ weekStartISO: wsISO, volume: volumeByWeek.get(wsISO) ?? 0 });
    }
  }

  const setsByRefArr = Array.from(setsByRef.entries())
    .map(([ref, count]) => ({ ref, count }))
    .sort((a, b) => b.count - a.count);
  const prByRefArr = Array.from(prByRef.values()).sort((a, b) => b.score - a.score);

  return {
    hasData: sets.length > 0,
    totalWorkouts: dates.size,
    totalVolumeKg: Math.round(totalVolumeKg),
    totalSets: sets.length,
    thisWeekWorkouts,
    weeklyVolume: weekly,
    setsByRef: setsByRefArr,
    prByRef: prByRefArr,
  };
}

/** Büyük sayıları kısalt: 48230 → "48.2k". UI stat kartları için. */
export function compactNumber(n: number): string {
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) {
    const k = n / 1000;
    return `${k >= 100 ? Math.round(k) : k.toFixed(1)}k`;
  }
  const m = n / 1_000_000;
  return `${m >= 100 ? Math.round(m) : m.toFixed(1)}M`;
}
