/**
 * queries/exercises — TanStack Query hooks for custom exercises (ADIM 5).
 *
 * Custom exercise listesi (`app_exercises`). Preset hareketler `data/presets-exercises.ts`'tedir
 * ve query'lenmez. UI'da iki kaynak birlestirilirek gosterilir (C4 Add Exercise + D1 Library).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchCustomExercises,
  createCustomExercise,
  updateCustomExercise,
  deleteCustomExercise,
  useDataCtx,
  type DataCtx,
} from '../lib/data-bridge';
import type { AppExercisesRow } from '../types/database';

export const exKeys = {
  all: (ctx: DataCtx) => ['exercises', ctx.mode, ctx.userId ?? 'guest'] as const,
  custom: (ctx: DataCtx) => [...exKeys.all(ctx), 'custom'] as const,
};

export function useCustomExercises() {
  const ctx = useDataCtx();
  return useQuery<AppExercisesRow[]>({
    queryKey: exKeys.custom(ctx),
    queryFn: () => fetchCustomExercises(ctx),
  });
}

export function useAddCustomExercise() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; categories?: string[]; notes?: string }) =>
      createCustomExercise(ctx, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: exKeys.all(ctx) });
    },
  });
}

export function useUpdateCustomExercise() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; patch: { name?: string; categories?: string[]; notes?: string } }) =>
      updateCustomExercise(ctx, input.id, input.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: exKeys.all(ctx) }),
  });
}

export function useDeleteCustomExercise() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCustomExercise(ctx, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: exKeys.all(ctx) }),
  });
}
