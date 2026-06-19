/**
 * queries/programs — TanStack Query hooks for programs + program_days (ADIM 5-6).
 *
 * Tek aktif program kurali §8.9 ile uyumlu.
 * ADIM 6: D2/D3 icin tam CRUD (create/update/delete/activate/deactivate +
 * program_days add/remove/reorder/move/clear) eklendi.
 */
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  fetchActiveProgram,
  fetchActiveProgramWithDays,
  fetchPrograms,
  fetchProgramDays,
  fetchProgramDayCounts,
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
import { wkKeys } from './workouts';
import type { AppProgramDaysRow, AppProgramsRow, CycleType, DayIndex } from '../types/database';

export const pgKeys = {
  all: (ctx: DataCtx) => ['programs', ctx.mode, ctx.userId ?? 'guest'] as const,
  list: (ctx: DataCtx) => [...pgKeys.all(ctx), 'list'] as const,
  active: (ctx: DataCtx) => [...pgKeys.all(ctx), 'active'] as const,
  activeWithDays: (ctx: DataCtx) => [...pgKeys.all(ctx), 'activeWithDays'] as const,
  one: (ctx: DataCtx, programId: string) => [...pgKeys.all(ctx), 'one', programId] as const,
  days: (ctx: DataCtx, programId: string) => [...pgKeys.all(ctx), 'days', programId] as const,
};

// ----------------------------------------------------------------
// ADIM 3a (perf cilası) — hedefli invalidation yardımcıları.
// `pgKeys.all` blanket'i list + active + activeWithDays + one(*) + days(*)
// hepsini stale yapıyordu (mount'lu olanların tamamı refetch). Mutation başına
// yalnız gerçekten etkilenen alt-anahtarlar invalidate edilir.
// ----------------------------------------------------------------

/** Aktif program değişti/değişmiş olabilir → Calendar/Day'in tükettiği iki query. */
function invalidateActive(qc: QueryClient, ctx: DataCtx): void {
  void qc.invalidateQueries({ queryKey: pgKeys.active(ctx) });
  void qc.invalidateQueries({ queryKey: pgKeys.activeWithDays(ctx) });
}

/**
 * Bir programın günleri değişti → days(programId) + activeWithDays.
 * (Düzenlenen program aktif OLABİLİR; aktiflik cache'ten kesin bilinemeyeceği için
 * activeWithDays güvenli tarafta her zaman tazelenir — mount'lu değilse maliyeti yok.)
 */
function invalidateProgramDays(qc: QueryClient, ctx: DataCtx, programId: string): void {
  void qc.invalidateQueries({ queryKey: pgKeys.days(ctx, programId) });
  void qc.invalidateQueries({ queryKey: pgKeys.activeWithDays(ctx) });
}

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
 * programDays serial waterfall'ını kırar. Aktif programı etkileyebilecek her mutation
 * `invalidateActive`/`invalidateProgramDays` üzerinden bu query'yi tazeler.
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

/** D2 pasif satir meta'si — program_id → { dayCount, total } (tek batch). */
export function useProgramDayCounts() {
  const ctx = useDataCtx();
  return useQuery<Record<string, { dayCount: number; total: number }>>({
    queryKey: [...pgKeys.all(ctx), 'daycounts'],
    queryFn: () => fetchProgramDayCounts(ctx),
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
      // Yeni program + AKTİF ETME: liste + aktif ailesi + takvim grid'i (PRIORITY 0
      // refresh fix — aktif program değişimi day kartlarını/grid'i etkiler).
      void qc.invalidateQueries({ queryKey: pgKeys.list(ctx) });
      invalidateActive(qc, ctx);
      void qc.invalidateQueries({ queryKey: wkKeys.all(ctx) });
    },
  });
}

/** §8.4.1 — Sifirdan bos program olustur (aktif degil) → D3'e push. */
export function useCreateEmptyProgram() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; description?: string }) => createEmptyProgram(ctx, input),
    // Aktif edilmeden oluşturulur → yalnız liste etkilenir.
    onSuccess: () => qc.invalidateQueries({ queryKey: pgKeys.list(ctx) }),
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
    onSuccess: (_data, input) => {
      // Meta değişimi liste + tekil kaydı etkiler; düzenlenen program aktifse
      // off_days/cycle değişimi rest-day görünümünü de etkiler → aktif ailesi.
      void qc.invalidateQueries({ queryKey: pgKeys.list(ctx) });
      void qc.invalidateQueries({ queryKey: pgKeys.one(ctx, input.programId) });
      invalidateActive(qc, ctx);
    },
  });
}

export function useDeleteProgram() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (programId: string) => deleteProgram(ctx, programId),
    onSuccess: (_data, programId) => {
      // Silinen programın query'leri refetch edilmez, cache'ten ATILIR.
      qc.removeQueries({ queryKey: pgKeys.one(ctx, programId) });
      qc.removeQueries({ queryKey: pgKeys.days(ctx, programId) });
      void qc.invalidateQueries({ queryKey: pgKeys.list(ctx) });
      // Silinen program aktif olabilirdi → aktif ailesi güvenli tarafta tazelenir.
      invalidateActive(qc, ctx);
    },
  });
}

export function useActivateProgram() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (programId: string) => activateProgram(ctx, programId),
    onSuccess: (_data, programId) => {
      // is_active bayrağı liste + tekil kayıtta da görünür.
      void qc.invalidateQueries({ queryKey: pgKeys.list(ctx) });
      void qc.invalidateQueries({ queryKey: pgKeys.one(ctx, programId) });
      invalidateActive(qc, ctx);
      // Aktif program değişimi Day lazy kartlarını/Calendar grid'ini etkiler.
      void qc.invalidateQueries({ queryKey: wkKeys.all(ctx) });
    },
  });
}

export function useDeactivateProgram() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (programId: string) => deactivateProgram(ctx, programId),
    onSuccess: (_data, programId) => {
      void qc.invalidateQueries({ queryKey: pgKeys.list(ctx) });
      void qc.invalidateQueries({ queryKey: pgKeys.one(ctx, programId) });
      invalidateActive(qc, ctx);
    },
  });
}

export function useAddProgramDayExercise() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { programId: string; dayIndex: DayIndex; exerciseRef: string }) =>
      addProgramDayExercise(ctx, input),
    onSuccess: (_data, input) => invalidateProgramDays(qc, ctx, input.programId),
  });
}

export function useAddProgramDayExercises() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { programId: string; dayIndex: DayIndex; exerciseRefs: string[] }) =>
      addProgramDayExercises(ctx, input),
    onSuccess: (_data, input) => invalidateProgramDays(qc, ctx, input.programId),
  });
}

export function useRemoveProgramDayExercise() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { programId: string; dayIndex: DayIndex; exerciseRef: string }) =>
      removeProgramDayExercise(ctx, input),
    onSuccess: (_data, input) => invalidateProgramDays(qc, ctx, input.programId),
  });
}

export function useReorderProgramDay() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { programId: string; dayIndex: DayIndex; orderedRefs: string[] }) =>
      reorderProgramDay(ctx, input),
    onSuccess: (_data, input) => invalidateProgramDays(qc, ctx, input.programId),
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
    onSuccess: (_data, input) => invalidateProgramDays(qc, ctx, input.programId),
  });
}

export function useClearProgramDay() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { programId: string; dayIndex: DayIndex }) => clearProgramDay(ctx, input),
    onSuccess: (_data, input) => invalidateProgramDays(qc, ctx, input.programId),
  });
}
