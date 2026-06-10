/**
 * queries/programs — TanStack Query hooks for programs + program_days (ADIM 5-6).
 *
 * Tek aktif program kurali §8.9 ile uyumlu.
 * ADIM 6: D2/D3 icin tam CRUD (create/update/delete/activate/deactivate +
 * program_days add/remove/reorder/move/clear) eklendi.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchActiveProgram,
  fetchActiveProgramWithDays,
  fetchPrograms,
  fetchProgramDays,
  fetchProgramById,
  createProgramFromPreset,
  createEmptyProgram,
  updateProgram,
  deleteProgram,
  activateProgram,
  deactivateProgram,
  addProgramDayExercise,
  addProgramDayExercises,
  removeProgramDayExercise,
  reorderProgramDay,
  moveProgramDayExercise,
  clearProgramDay,
  useDataCtx,
  type DataCtx,
} from '../lib/data-bridge';
import type { AppProgramDaysRow, AppProgramsRow, CycleType, DayIndex } from '../types/database';

export const pgKeys = {
  all: (ctx: DataCtx) => ['programs', ctx.mode, ctx.userId ?? 'guest'] as const,
  list: (ctx: DataCtx) => [...pgKeys.all(ctx), 'list'] as const,
  active: (ctx: DataCtx) => [...pgKeys.all(ctx), 'active'] as const,
  activeWithDays: (ctx: DataCtx) => [...pgKeys.all(ctx), 'activeWithDays'] as const,
  one: (ctx: DataCtx, programId: string) => [...pgKeys.all(ctx), 'one', programId] as const,
  days: (ctx: DataCtx, programId: string) => [...pgKeys.all(ctx), 'days', programId] as const,
};

export function usePrograms() {
  const ctx = useDataCtx();
  return useQuery<AppProgramsRow[]>({
    queryKey: pgKeys.list(ctx),
    queryFn: () => fetchPrograms(ctx),
  });
}

export function useActiveProgram() {
  const ctx = useDataCtx();
  return useQuery<AppProgramsRow | null>({
    queryKey: pgKeys.active(ctx),
    queryFn: () => fetchActiveProgram(ctx),
  });
}

/**
 * FAZ 2.2 — Aktif program + günleri TEK round-trip (Day Detail için). activeProgram→
 * programDays serial waterfall'ını kırar. `pgKeys.all` invalidation'ı kapsar (program
 * aktifleştirme/düzenleme bu query'yi de tazeler).
 */
export function useActiveProgramWithDays() {
  const ctx = useDataCtx();
  return useQuery<{ program: AppProgramsRow | null; days: AppProgramDaysRow[] }>({
    queryKey: pgKeys.activeWithDays(ctx),
    queryFn: () => fetchActiveProgramWithDays(ctx),
  });
}

export function useProgram(programId: string | null | undefined) {
  const ctx = useDataCtx();
  return useQuery<AppProgramsRow | null>({
    queryKey: pgKeys.one(ctx, programId ?? '_none'),
    queryFn: () => fetchProgramById(ctx, programId as string),
    enabled: !!programId,
  });
}

export function useProgramDays(programId: string | null | undefined) {
  const ctx = useDataCtx();
  return useQuery<AppProgramDaysRow[]>({
    queryKey: pgKeys.days(ctx, programId ?? '_none'),
    queryFn: () => fetchProgramDays(ctx, programId as string),
    enabled: !!programId,
  });
}

/** §3.8 — Preset programdan yeni program kopyala + aktif et. */
export function useCreateProgramFromPreset() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createProgramFromPreset>[1]) =>
      createProgramFromPreset(ctx, input),
    onSuccess: () => {
      // Aktif program + listesi + takvim grid'i tazele (PRIORITY 0 refresh fix).
      qc.invalidateQueries({ queryKey: pgKeys.all(ctx) });
      qc.invalidateQueries({ queryKey: ['workouts', ctx.mode, ctx.userId ?? 'guest'] });
    },
  });
}

/** §8.4.1 — Sifirdan bos program olustur (aktif degil) → D3'e push. */
export function useCreateEmptyProgram() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; description?: string }) => createEmptyProgram(ctx, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: pgKeys.all(ctx) }),
  });
}

export function useUpdateProgram() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      programId: string;
      patch: {
        name?: string;
        description?: string;
        cycle_type?: CycleType;
        deload_every?: number | null;
        off_days?: number[];
      };
    }) => updateProgram(ctx, input.programId, input.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: pgKeys.all(ctx) }),
  });
}

export function useDeleteProgram() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (programId: string) => deleteProgram(ctx, programId),
    onSuccess: () => qc.invalidateQueries({ queryKey: pgKeys.all(ctx) }),
  });
}

export function useActivateProgram() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (programId: string) => activateProgram(ctx, programId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pgKeys.all(ctx) });
      qc.invalidateQueries({ queryKey: ['workouts', ctx.mode, ctx.userId ?? 'guest'] });
    },
  });
}

export function useDeactivateProgram() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (programId: string) => deactivateProgram(ctx, programId),
    onSuccess: () => qc.invalidateQueries({ queryKey: pgKeys.all(ctx) }),
  });
}

export function useAddProgramDayExercise() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { programId: string; dayIndex: DayIndex; exerciseRef: string }) =>
      addProgramDayExercise(ctx, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: pgKeys.all(ctx) }),
  });
}

export function useAddProgramDayExercises() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { programId: string; dayIndex: DayIndex; exerciseRefs: string[] }) =>
      addProgramDayExercises(ctx, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: pgKeys.all(ctx) }),
  });
}

export function useRemoveProgramDayExercise() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { programId: string; dayIndex: DayIndex; exerciseRef: string }) =>
      removeProgramDayExercise(ctx, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: pgKeys.all(ctx) }),
  });
}

export function useReorderProgramDay() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { programId: string; dayIndex: DayIndex; orderedRefs: string[] }) =>
      reorderProgramDay(ctx, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: pgKeys.all(ctx) }),
  });
}

export function useMoveProgramDayExercise() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      programId: string;
      fromDay: DayIndex;
      toDay: DayIndex;
      exerciseRef: string;
    }) => moveProgramDayExercise(ctx, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: pgKeys.all(ctx) }),
  });
}

export function useClearProgramDay() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { programId: string; dayIndex: DayIndex }) => clearProgramDay(ctx, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: pgKeys.all(ctx) }),
  });
}
