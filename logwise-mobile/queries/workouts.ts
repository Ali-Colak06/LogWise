/**
 * queries/workouts — TanStack Query hooks for workouts + sets (ADIM 5; FAZ 1-2 perf).
 *
 * Mode-aware: `useDataCtx()` arac koyar; queryKey'e mode + userId yazar boylece
 * misafir <-> auth gecisinde cache otomatik invalidate olur (key degisir).
 *
 * FAZ 1 (istemci optimizasyonu):
 *   - Tum yazma hook'lari OPTIMISTIC (onMutate cache yaz + onError rollback).
 *   - `wkKeys.all` blanket invalidation KALDIRILDI (refetch firtinasi yok).
 *
 * FAZ 2.1 (waterfall kir — devam-promptu-perf-NIHAI §2.1, "sets-by-date" yolu):
 *   - Sets artik workout id'lerine DEGIL TARIHE gore cekilir (`useSetsByDate`).
 *     Day Detail'de workouts + sets PARALEL baslar (serial waterfall yok).
 *   - Sets cache anahtari `setsByDate(date)` → eski id-join (`setsFor`) key churn
 *     reconcile'i ortadan kalkti; optimistic kod sadelesti, daha saglam.
 *
 * FAZ 2.5 (month→day cache seeding — "gun acilisi aninda olsun"):
 *   - Calendar ayin workout'larini (month) + ayin set'lerini (setsMonth) zaten cekiyor.
 *   - `useWorkoutsByDate` / `useSetsByDate` mount'ta once bu month cache'lerinden
 *     `initialData` ile SEED edilir → Calendar'dan gune tiklamak 0 network ile render
 *     olur. `initialDataUpdatedAt` month fetch zamanina baglanir: seed staleTime'i
 *     gecmisse arka planda sessizce tazelenir (stale-while-revalidate).
 */
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  fetchWorkoutsByDate,
  fetchWorkoutsByMonth,
  fetchSetsByDate,
  fetchSetsByMonth,
  fetchAllWorkoutDates,
  fetchUsedExerciseRefs,
  addWorkoutSet,
  ensureWorkout,
  deleteWorkout,
  reorderDayCards,
  updateSet,
  deleteSet,
  fetchLastSessionForRef,
  skipExerciseForDay,
  fetchDayMeta,
  useDataCtx,
  type AppSetsRowWithDate,
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
  setsByDate: (ctx: DataCtx, dateISO: string) => [...wkKeys.all(ctx), 'setsByDate', dateISO] as const,
  setsMonth: (ctx: DataCtx, year: number, month: number) =>
    [...wkKeys.all(ctx), 'setsMonth', year, month] as const,
};

// ---- FAZ 2.5 seed yardimcilari ----

function parseYearMonth(dateISO: string): { y: number; m: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) };
}
function monthKeyForDate(ctx: DataCtx, dateISO: string): readonly unknown[] | null {
  const p = parseYearMonth(dateISO);
  return p ? wkKeys.month(ctx, p.y, p.m) : null;
}
function setsMonthKeyForDate(ctx: DataCtx, dateISO: string): readonly unknown[] | null {
  const p = parseYearMonth(dateISO);
  return p ? wkKeys.setsMonth(ctx, p.y, p.m) : null;
}

// ----------------------------------------------------------------
// Reads
// ----------------------------------------------------------------

export function useWorkoutsByDate(dateISO: string) {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useQuery<AppWorkoutsRow[]>({
    queryKey: wkKeys.day(ctx, dateISO),
    queryFn: () => fetchWorkoutsByDate(ctx, dateISO),
    enabled: !!dateISO,
    // FAZ 2.5: Calendar'in month cache'i bu gunun satirlarini zaten iceriyor →
    // network beklemeden seed et. Seed staleTime'i asmissa arka planda tazelenir.
    initialData: () => {
      const mKey = monthKeyForDate(ctx, dateISO);
      const month = mKey ? qc.getQueryData<AppWorkoutsRow[]>(mKey) : undefined;
      if (!month) return undefined;
      return month
        .filter((w) => w.workout_date === dateISO)
        .sort((a, b) => a.position - b.position);
    },
    initialDataUpdatedAt: () => {
      const mKey = monthKeyForDate(ctx, dateISO);
      return mKey ? qc.getQueryState(mKey)?.dataUpdatedAt : undefined;
    },
  });
}

export function useWorkoutsByMonth(year: number, month1to12: number) {
  const ctx = useDataCtx();
  return useQuery<AppWorkoutsRow[]>({
    queryKey: wkKeys.month(ctx, year, month1to12),
    queryFn: () => fetchWorkoutsByMonth(ctx, year, month1to12),
    // §1.4: ay gezinirken onceki ayi goster (bos->spinner flicker'i biter).
    placeholderData: keepPreviousData,
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

/** FAZ 2.1 — Bir günün tüm set'leri (tarihe göre; workouts ile paralel başlar). */
export function useSetsByDate(dateISO: string) {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useQuery<AppSetsRow[]>({
    queryKey: wkKeys.setsByDate(ctx, dateISO),
    queryFn: () => fetchSetsByDate(ctx, dateISO),
    enabled: !!dateISO,
    // FAZ 2.5: setsMonth seed cache'inden ilk veri (Calendar acikken 0 network).
    initialData: () => {
      const smKey = setsMonthKeyForDate(ctx, dateISO);
      const monthSets = smKey ? qc.getQueryData<AppSetsRowWithDate[]>(smKey) : undefined;
      if (!monthSets) return undefined;
      return monthSets
        .filter((s) => s.workout_date === dateISO)
        .map(({ workout_date: _wd, ...rest }) => rest);
    },
    initialDataUpdatedAt: () => {
      const smKey = setsMonthKeyForDate(ctx, dateISO);
      return smKey ? qc.getQueryState(smKey)?.dataUpdatedAt : undefined;
    },
  });
}

/**
 * FAZ 2.5 — SEED query: ayin tum set'leri. Calendar mount'ta cekilir; tek amaci
 * `useSetsByDate`'in initialData kaynagi olmak (gun acilisi 0 network). UI'da
 * dogrudan render edilmez.
 */
export function useSetsByMonth(year: number, month1to12: number) {
  const ctx = useDataCtx();
  return useQuery<AppSetsRowWithDate[]>({
    queryKey: wkKeys.setsMonth(ctx, year, month1to12),
    queryFn: () => fetchSetsByMonth(ctx, year, month1to12),
  });
}

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

// ================================================================
// Optimistic update altyapisi (predicate-bazli cache hedefleme)
// ================================================================

type QC = ReturnType<typeof useQueryClient>;
type KeyPredicate = (q: { queryKey: readonly unknown[] }) => boolean;
const GUEST = 'guest';

function tempId(prefix: string): string {
  return `optimistic-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function nowIso(): string {
  return new Date().toISOString();
}

function isWkKey(key: readonly unknown[], ctx: DataCtx): boolean {
  return key[0] === 'workouts' && key[1] === ctx.mode && key[2] === (ctx.userId ?? GUEST);
}
// setsMonth (FAZ 2.5 seed) da dahil: set update/delete seed cache'inde de yansisin,
// yoksa gc sonrasi yeniden seed'de silinmis/eski set geri gelir.
function isSetsKey(key: readonly unknown[], ctx: DataCtx): boolean {
  return isWkKey(key, ctx) && (key[3] === 'setsByDate' || key[3] === 'setsMonth');
}
function isDayKey(key: readonly unknown[], ctx: DataCtx): boolean {
  return isWkKey(key, ctx) && key[3] === 'day';
}
function isMonthKey(key: readonly unknown[], ctx: DataCtx): boolean {
  return isWkKey(key, ctx) && key[3] === 'month';
}

function setsFilter(ctx: DataCtx): { predicate: KeyPredicate } {
  return { predicate: (q) => isSetsKey(q.queryKey, ctx) };
}
function daysFilter(ctx: DataCtx): { predicate: KeyPredicate } {
  return { predicate: (q) => isDayKey(q.queryKey, ctx) };
}
function monthsFilter(ctx: DataCtx): { predicate: KeyPredicate } {
  return { predicate: (q) => isMonthKey(q.queryKey, ctx) };
}

/** workoutId'nin hangi gune ait oldugunu mount'lu day cache'lerinden bul (set ekleme hedefi). */
function findWorkout(qc: QC, ctx: DataCtx, workoutId: string): AppWorkoutsRow | null {
  const days = qc.getQueriesData<AppWorkoutsRow[]>(daysFilter(ctx));
  for (const [, data] of days) {
    const found = data?.find((w) => w.id === workoutId);
    if (found) return found;
  }
  return null;
}

type SetPatch = { setType?: SetType; weight?: number | null; reps?: number | null; rir?: RirValue | null };
function applySetPatch(s: AppSetsRow, patch: SetPatch): AppSetsRow {
  return {
    ...s,
    ...(patch.setType !== undefined ? { set_type: patch.setType } : {}),
    ...(patch.weight !== undefined ? { weight: patch.weight } : {}),
    ...(patch.reps !== undefined ? { reps: patch.reps } : {}),
    ...(patch.rir !== undefined ? { rir: patch.rir } : {}),
  };
}

type Snapshot<T> = Array<[readonly unknown[], T | undefined]>;
function restoreSnapshot<T>(qc: QC, entries: Snapshot<T> | undefined): void {
  if (!entries) return;
  for (const [key, data] of entries) qc.setQueryData(key, data);
}

/**
 * FAZ 2.5 — basariyla yazilan set'i setsMonth SEED cache'ine de ekle (varsa).
 * Seed dogrudan render edilmedigi icin optimistic gerekmez; server-truth yeterli.
 */
function appendToSetsMonthSeed(qc: QC, ctx: DataCtx, dateISO: string | null, set: AppSetsRow): void {
  if (!dateISO) return;
  const smKey = setsMonthKeyForDate(ctx, dateISO);
  if (!smKey) return;
  qc.setQueryData<AppSetsRowWithDate[]>(smKey, (old: AppSetsRowWithDate[] | undefined) =>
    old ? [...old, { ...set, workout_date: dateISO }] : old,
  );
}

// ----------------------------------------------------------------
// Mutations (hepsi optimistic)
// ----------------------------------------------------------------

/** Mevcut workout'a set ekle (persisted kart "+ Set Ekle"). */
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
    onMutate: async (input) => {
      const wk = findWorkout(qc, ctx, input.workoutId);
      const dateISO = wk?.workout_date ?? null;
      if (!dateISO) return { key: null, prev: undefined, tempSetId: null, dateISO: null };
      const key = wkKeys.setsByDate(ctx, dateISO);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<AppSetsRow[]>(key);
      const optimistic: AppSetsRow = {
        id: tempId('set'),
        workout_id: input.workoutId,
        set_index: input.setIndex ?? 0,
        set_type: input.setType ?? 'working',
        weight: input.weight ?? null,
        reps: input.reps ?? null,
        rir: input.rir ?? null,
        created_at: nowIso(),
      };
      qc.setQueryData<AppSetsRow[]>(key, (old: AppSetsRow[] | undefined) =>
        old ? [...old, optimistic] : [optimistic],
      );
      return { key, prev, tempSetId: optimistic.id, dateISO };
    },
    onError: (_e, _input, context) => {
      if (context?.key) qc.setQueryData(context.key, context.prev);
    },
    onSuccess: (data, _input, context) => {
      if (!context?.key || !context.tempSetId) return;
      const tempSetId = context.tempSetId;
      qc.setQueryData<AppSetsRow[]>(context.key, (old: AppSetsRow[] | undefined) =>
        old ? old.map((s) => (s.id === tempSetId ? data : s)) : old,
      );
      appendToSetsMonthSeed(qc, ctx, context.dateISO, data);
    },
  });
}

/** Set guncelle (kilo/tekrar/RIR/tip — blur'da). Pure optimistic, refetch yok. */
export function useUpdateSet() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { setId: string; patch: SetPatch }) => updateSet(ctx, input.setId, input.patch),
    onMutate: async (input) => {
      const filter = setsFilter(ctx);
      await qc.cancelQueries(filter);
      const prev = qc.getQueriesData<AppSetsRow[]>(filter);
      qc.setQueriesData<AppSetsRow[]>(filter, (old: AppSetsRow[] | undefined) =>
        old ? old.map((s) => (s.id === input.setId ? applySetPatch(s, input.patch) : s)) : old,
      );
      return { prev };
    },
    onError: (_e, _input, context) => restoreSnapshot(qc, context?.prev),
  });
}

/** Set sil. Pure optimistic, refetch yok. */
export function useDeleteSet() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (setId: string) => deleteSet(ctx, setId),
    onMutate: async (setId) => {
      const filter = setsFilter(ctx);
      await qc.cancelQueries(filter);
      const prev = qc.getQueriesData<AppSetsRow[]>(filter);
      qc.setQueriesData<AppSetsRow[]>(filter, (old: AppSetsRow[] | undefined) =>
        old ? old.filter((s) => s.id !== setId) : old,
      );
      return { prev };
    },
    onError: (_e, _input, context) => restoreSnapshot(qc, context?.prev),
  });
}

/**
 * Lazy yazma: program/manuel kartina ilk set girilince workout insert + set ekle.
 * Optimistic: gecici workout + gecici set yazilir (kart aninda dolar). onSuccess'te
 * temp id'ler gercegiyle reconcile edilir. Sets cache TARIHE gore anahtarli oldugu
 * icin yeni workout eklenmesi anahtari DEGISTIRMEZ (key churn yok). Ayni ref icin
 * workout zaten varsa (manuel tekrar ekleme) sadece set eklenir.
 */
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
    onMutate: async (input) => {
      const dayKey = wkKeys.day(ctx, input.dateISO);
      const setsKey = wkKeys.setsByDate(ctx, input.dateISO);
      await qc.cancelQueries({ queryKey: dayKey });
      await qc.cancelQueries({ queryKey: setsKey });

      const prevDay = qc.getQueryData<AppWorkoutsRow[]>(dayKey) ?? [];
      const prevSets = qc.getQueryData<AppSetsRow[]>(setsKey);
      const existing = prevDay.find((w) => w.exercise_ref === input.exerciseRef) ?? null;
      const newSetId = tempId('set');
      const created = nowIso();

      if (existing) {
        const idx = (prevSets ?? []).filter((s) => s.workout_id === existing.id).length;
        const optimisticSet: AppSetsRow = {
          id: newSetId, workout_id: existing.id, set_index: idx,
          set_type: input.setType ?? 'working', weight: input.weight ?? null,
          reps: input.reps ?? null, rir: input.rir ?? null, created_at: created,
        };
        qc.setQueryData<AppSetsRow[]>(setsKey, (old: AppSetsRow[] | undefined) =>
          old ? [...old, optimisticSet] : [optimisticSet],
        );
        return { kind: 'existing' as const, dayKey, setsKey, prevDay, prevSets, tempSetId: newSetId };
      }

      const newWkId = tempId('wk');
      const position = prevDay.length === 0 ? 0 : Math.max(...prevDay.map((w) => w.position)) + 1;
      const optimisticWk: AppWorkoutsRow = {
        id: newWkId, user_id: ctx.userId ?? GUEST, workout_date: input.dateISO,
        exercise_ref: input.exerciseRef, position, superset_group: null,
        duration_minutes: null, notes: null, created_at: created, updated_at: created,
      };
      const optimisticSet: AppSetsRow = {
        id: newSetId, workout_id: newWkId, set_index: 0,
        set_type: input.setType ?? 'working', weight: input.weight ?? null,
        reps: input.reps ?? null, rir: input.rir ?? null, created_at: created,
      };
      qc.setQueryData<AppWorkoutsRow[]>(dayKey, [...prevDay, optimisticWk]);
      qc.setQueryData<AppSetsRow[]>(setsKey, (old: AppSetsRow[] | undefined) =>
        old ? [...old, optimisticSet] : [optimisticSet],
      );

      // Month grid: gunun ilk workout'u ise yeni chip optimistic gozuksun.
      const monthKey = monthKeyForDate(ctx, input.dateISO);
      const prevMonth = monthKey ? qc.getQueryData<AppWorkoutsRow[]>(monthKey) : undefined;
      if (monthKey && prevMonth) {
        qc.setQueryData<AppWorkoutsRow[]>(monthKey, [...prevMonth, optimisticWk]);
      }

      return {
        kind: 'new' as const, dayKey, setsKey, prevDay, prevSets,
        tempWkId: newWkId, tempSetId: newSetId, monthKey: monthKey ?? null, prevMonth,
      };
    },
    onError: (_e, _input, context) => {
      if (!context) return;
      qc.setQueryData(context.dayKey, context.prevDay);
      qc.setQueryData(context.setsKey, context.prevSets);
      if (context.kind === 'new' && context.monthKey && context.prevMonth) {
        qc.setQueryData(context.monthKey, context.prevMonth);
      }
    },
    onSuccess: (data, input, context) => {
      if (!context) return;
      if (context.kind === 'existing') {
        const tempSetId = context.tempSetId;
        qc.setQueryData<AppSetsRow[]>(context.setsKey, (old: AppSetsRow[] | undefined) =>
          old ? old.map((s) => (s.id === tempSetId ? data.set : s)) : old,
        );
        appendToSetsMonthSeed(qc, ctx, input.dateISO, data.set);
        return;
      }
      const { tempWkId, tempSetId } = context;
      qc.setQueryData<AppWorkoutsRow[]>(context.dayKey, (old: AppWorkoutsRow[] | undefined) =>
        old ? old.map((w) => (w.id === tempWkId ? data.workout : w)) : old,
      );
      qc.setQueryData<AppSetsRow[]>(context.setsKey, (old: AppSetsRow[] | undefined) =>
        old
          ? old.map((s) =>
              s.id === tempSetId
                ? data.set
                : s.workout_id === tempWkId
                  ? { ...s, workout_id: data.workout.id }
                  : s,
            )
          : old,
      );
      if (context.monthKey && context.prevMonth !== undefined) {
        const mKey = context.monthKey;
        qc.setQueryData<AppWorkoutsRow[]>(mKey, (old: AppWorkoutsRow[] | undefined) =>
          old ? old.map((w) => (w.id === tempWkId ? data.workout : w)) : old,
        );
      }
      appendToSetsMonthSeed(qc, ctx, input.dateISO, data.set);
    },
  });
}

/** Workout sil (kartin tum setleriyle). Optimistic; day + month + sets cache'lerinden cikar. */
export function useDeleteWorkout() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workoutId: string) => deleteWorkout(ctx, workoutId),
    onMutate: async (workoutId) => {
      await qc.cancelQueries({ queryKey: wkKeys.all(ctx) });
      const prevDays = qc.getQueriesData<AppWorkoutsRow[]>(daysFilter(ctx));
      const prevMonths = qc.getQueriesData<AppWorkoutsRow[]>(monthsFilter(ctx));
      const prevSets = qc.getQueriesData<AppSetsRow[]>(setsFilter(ctx));
      qc.setQueriesData<AppWorkoutsRow[]>(daysFilter(ctx), (old: AppWorkoutsRow[] | undefined) =>
        old ? old.filter((w) => w.id !== workoutId) : old,
      );
      qc.setQueriesData<AppWorkoutsRow[]>(monthsFilter(ctx), (old: AppWorkoutsRow[] | undefined) =>
        old ? old.filter((w) => w.id !== workoutId) : old,
      );
      qc.setQueriesData<AppSetsRow[]>(setsFilter(ctx), (old: AppSetsRow[] | undefined) =>
        old ? old.filter((s) => s.workout_id !== workoutId) : old,
      );
      return { prevDays, prevMonths, prevSets };
    },
    onError: (_e, _workoutId, context) => {
      if (!context) return;
      restoreSnapshot(qc, context.prevDays);
      restoreSnapshot(qc, context.prevMonths);
      restoreSnapshot(qc, context.prevSets);
    },
  });
}

/**
 * Gun ici TUM kartlarin (persisted + lazy) gorunum sirasini yeniden duzenle (C2 — §8.8;
 * kullanici karari 2026-06-18). Optimistic: day_meta.card_order + day/month position'lari
 * hemen guncelle, rollback onError. `orderedRefs` = exercise_ref'ler (persisted + lazy);
 * lazy ref'ler sadece card_order'a yazilir (workout satiri yok — lazy-write korunur).
 */
export function useReorderDayCards() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { dateISO: string; orderedRefs: string[] }) => reorderDayCards(ctx, input),
    onMutate: async (input) => {
      const dayKey = wkKeys.day(ctx, input.dateISO);
      const monthKey = monthKeyForDate(ctx, input.dateISO);
      const metaKey = [...wkKeys.all(ctx), 'daymeta', input.dateISO] as const;
      await qc.cancelQueries({ queryKey: dayKey });
      await qc.cancelQueries({ queryKey: metaKey });
      const prevDay = qc.getQueryData<AppWorkoutsRow[]>(dayKey);
      const prevMonth = monthKey ? qc.getQueryData<AppWorkoutsRow[]>(monthKey) : undefined;
      const prevMeta = qc.getQueryData<AppDayMetaRow | null>(metaKey);
      const rank = new Map(input.orderedRefs.map((ref, i) => [ref, i] as const));

      // day_meta.card_order optimistic
      qc.setQueryData<AppDayMetaRow | null>(metaKey, (old: AppDayMetaRow | null | undefined) => {
        if (old) return { ...old, card_order: input.orderedRefs };
        return {
          user_id: ctx.userId ?? GUEST,
          workout_date: input.dateISO,
          day_note: null,
          total_duration_minutes: null,
          skipped_exercise_ids: [],
          card_order: input.orderedRefs,
          created_at: nowIso(),
          updated_at: nowIso(),
        };
      });

      // Persisted kartlarin position'i (day cache) — birlesik siraya gore.
      qc.setQueryData<AppWorkoutsRow[]>(dayKey, (old: AppWorkoutsRow[] | undefined) =>
        old
          ? old
              .map((w) =>
                rank.has(w.exercise_ref) ? { ...w, position: rank.get(w.exercise_ref) ?? w.position } : w,
              )
              .slice()
              .sort((a, b) => a.position - b.position)
          : old,
      );
      // Month grid chip sirasi da guncel kalsin (gun satirlari position'a gore render edilir).
      if (monthKey && prevMonth) {
        qc.setQueryData<AppWorkoutsRow[]>(monthKey, (old: AppWorkoutsRow[] | undefined) =>
          old
            ? old.map((w) =>
                w.workout_date === input.dateISO && rank.has(w.exercise_ref)
                  ? { ...w, position: rank.get(w.exercise_ref) ?? w.position }
                  : w,
              )
            : old,
        );
      }
      return { dayKey, prevDay, monthKey: monthKey ?? null, prevMonth, metaKey, prevMeta };
    },
    onError: (_e, _input, context) => {
      if (!context) return;
      qc.setQueryData(context.dayKey, context.prevDay);
      qc.setQueryData(context.metaKey, context.prevMeta);
      if (context.monthKey && context.prevMonth !== undefined) {
        qc.setQueryData(context.monthKey, context.prevMonth);
      }
    },
  });
}

/** Program gununde "sadece bugun skip". Optimistic day_meta; onSettled hedefli refetch. */
export function useSkipExerciseForDay() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { dateISO: string; exerciseRef: string }) => skipExerciseForDay(ctx, input),
    onMutate: async (input) => {
      const key = [...wkKeys.all(ctx), 'daymeta', input.dateISO] as const;
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<AppDayMetaRow | null>(key);
      qc.setQueryData<AppDayMetaRow | null>(key, (old: AppDayMetaRow | null | undefined) => {
        const current = old?.skipped_exercise_ids ?? [];
        if (current.includes(input.exerciseRef)) return old ?? null;
        const next = [...current, input.exerciseRef];
        if (old) return { ...old, skipped_exercise_ids: next };
        return {
          user_id: ctx.userId ?? GUEST,
          workout_date: input.dateISO,
          day_note: null,
          total_duration_minutes: null,
          skipped_exercise_ids: next,
          card_order: null,
          created_at: nowIso(),
          updated_at: nowIso(),
        };
      });
      return { key, prev };
    },
    onError: (_e, _input, context) => {
      if (context) qc.setQueryData(context.key, context.prev);
    },
    onSettled: (_d, _e, input) => {
      qc.invalidateQueries({ queryKey: [...wkKeys.all(ctx), 'daymeta', input.dateISO] });
    },
  });
}
