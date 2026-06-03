/**
 * queries/workouts — TanStack Query hooks for workouts + sets (ADIM 5).
 *
 * Mode-aware: `useDataCtx()` arac koyar; queryKey'e mode + userId yazar boylece
 * misafir <-> auth gecisinde cache otomatik invalidate olur (key degisir).
 *
 * Day & Month fetch'i ayri (Calendar Month grid icin tek query, Day Detail icin tek query).
 * Sets ayri hook: tek workout veya bir array workout_id icin.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchWorkoutsByDate,
  fetchWorkoutsByMonth,
  fetchSetsForWorkouts,
  fetchAllWorkoutDates,
  fetchUsedExerciseRefs,
  addWorkoutSet,
  ensureWorkout,
  deleteWorkout,
  updateSet,
  deleteSet,
  fetchLastSessionForRef,
  skipExerciseForDay,
  fetchDayMeta,
  useDataCtx,
  type DataCtx,
} from '../lib/data-bridge';
import type { AppSetsRow, AppWorkoutsRow, AppDayMetaRow, SetType, RirValue } from '../types/database';

// ----------------------------------------------------------------
// QueryKey builders — mode + userId garantisi
// ----------------------------------------------------------------

export const wkKeys = {
  all: (ctx: DataCtx) => ['workouts', ctx.mode, ctx.userId ?? 'guest'] as const,
  day: (ctx: DataCtx, dateISO: string) => [...wkKeys.all(ctx), 'day', dateISO] as const,
  month: (ctx: DataCtx, year: number, month: number) =>
    [...wkKeys.all(ctx), 'month', year, month] as const,
  setsFor: (ctx: DataCtx, workoutIds: readonly string[]) =>
    [...wkKeys.all(ctx), 'sets', [...workoutIds].sort().join(',')] as const,
};

// ----------------------------------------------------------------
// Reads
// ----------------------------------------------------------------

export function useWorkoutsByDate(dateISO: string) {
  const ctx = useDataCtx();
  return useQuery<AppWorkoutsRow[]>({
    queryKey: wkKeys.day(ctx, dateISO),
    queryFn: () => fetchWorkoutsByDate(ctx, dateISO),
    enabled: !!dateISO,
  });
}

export function useWorkoutsByMonth(year: number, month1to12: number) {
  const ctx = useDataCtx();
  return useQuery<AppWorkoutsRow[]>({
    queryKey: wkKeys.month(ctx, year, month1to12),
    queryFn: () => fetchWorkoutsByMonth(ctx, year, month1to12),
  });
}

export function useAllWorkoutDates() {
  const ctx = useDataCtx();
  return useQuery<string[]>({
    queryKey: [...wkKeys.all(ctx), 'alldates'],
    queryFn: () => fetchAllWorkoutDates(ctx),
  });
}

/**
 * Tarihçede kullanılmış distinct exercise_ref'ler (§8.8 Kütüphanem kapsamı).
 * D1/C4 "Kütüphanem" sekmesinde custom + bu listedeki preset slug'ları gösterilir.
 */
export function useUsedExerciseRefs() {
  const ctx = useDataCtx();
  return useQuery<string[]>({
    queryKey: [...wkKeys.all(ctx), 'usedrefs'],
    queryFn: () => fetchUsedExerciseRefs(ctx),
  });
}

export function useSetsForWorkouts(workoutIds: readonly string[]) {
  const ctx = useDataCtx();
  return useQuery<AppSetsRow[]>({
    queryKey: wkKeys.setsFor(ctx, workoutIds),
    queryFn: () => fetchSetsForWorkouts(ctx, [...workoutIds]),
    enabled: workoutIds.length > 0,
  });
}

// ----------------------------------------------------------------
// Mutations
// ----------------------------------------------------------------

export function useAddSet() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      workoutId: string;
      setIndex?: number;
      setType?: SetType;
      weight?: number | null;
      reps?: number | null;
      rir?: RirValue | null;
    }) => addWorkoutSet(ctx, input),
    onSuccess: (_data, vars) => {
      // Invalidate sets caches that include this workout
      qc.invalidateQueries({
        queryKey: ['workouts', ctx.mode, ctx.userId ?? 'guest', 'sets'],
      });
      // Day query may also derive aggregate stats from sets
      void vars;
      qc.invalidateQueries({ queryKey: wkKeys.all(ctx) });
    },
  });
}

// ----------------------------------------------------------------
// ADIM 6 — Day Detail C2/C3/C4 mutations + day meta
// ----------------------------------------------------------------

export function useDayMeta(dateISO: string) {
  const ctx = useDataCtx();
  return useQuery<AppDayMetaRow | null>({
    queryKey: [...wkKeys.all(ctx), 'daymeta', dateISO],
    queryFn: () => fetchDayMeta(ctx, dateISO),
    enabled: !!dateISO,
  });
}

/** Same exercise_ref icin bugunden onceki en son session (prefill — §3.2). */
export function useLastSession(exerciseRef: string | null | undefined, beforeDateISO: string) {
  const ctx = useDataCtx();
  return useQuery({
    queryKey: [...wkKeys.all(ctx), 'lastsession', exerciseRef ?? '_none', beforeDateISO],
    queryFn: () => fetchLastSessionForRef(ctx, { exerciseRef: exerciseRef as string, beforeDateISO }),
    enabled: !!exerciseRef,
  });
}

function invalidateDay(qc: ReturnType<typeof useQueryClient>, ctx: DataCtx) {
  qc.invalidateQueries({ queryKey: wkKeys.all(ctx) });
}

/** Lazy yazma: program/manuel kartina ilk set girilince workout insert + set ekle. */
export function useEnsureWorkoutAndAddSet() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      dateISO: string;
      exerciseRef: string;
      setType?: SetType;
      weight?: number | null;
      reps?: number | null;
      rir?: RirValue | null;
    }) => {
      const wk = await ensureWorkout(ctx, { dateISO: input.dateISO, exerciseRef: input.exerciseRef });
      const set = await addWorkoutSet(ctx, {
        workoutId: wk.id,
        setType: input.setType,
        weight: input.weight ?? null,
        reps: input.reps ?? null,
        rir: input.rir ?? null,
      });
      return { workout: wk, set };
    },
    onSuccess: () => invalidateDay(qc, ctx),
  });
}

export function useUpdateSet() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      setId: string;
      patch: { setType?: SetType; weight?: number | null; reps?: number | null; rir?: RirValue | null };
    }) => updateSet(ctx, input.setId, input.patch),
    onSuccess: () => invalidateDay(qc, ctx),
  });
}

export function useDeleteSet() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (setId: string) => deleteSet(ctx, setId),
    onSuccess: () => invalidateDay(qc, ctx),
  });
}

export function useDeleteWorkout() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workoutId: string) => deleteWorkout(ctx, workoutId),
    onSuccess: () => invalidateDay(qc, ctx),
  });
}

export function useSkipExerciseForDay() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { dateISO: string; exerciseRef: string }) => skipExerciseForDay(ctx, input),
    onSuccess: () => invalidateDay(qc, ctx),
  });
}
