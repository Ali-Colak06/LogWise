/**
 * data-bridge — Mode-aware data layer helper (ADIM 5).
 *
 * Karar kaynagi: §3.9 03-mvp ("Misafir mod icin Supabase cagrisi YOK"); queries
 * mode-aware olmali. `auth` → Supabase, `guest` → guest-storage.
 *
 * Tasarim: Bu module dogrudan query'lerden cagrilir; her query (workouts/exercises/
 * programs) icin "read X" / "mutate X" cifti dispatcher fonksiyonu icerir. Boylece
 * `queries/*.ts` dosyalari icinde her hook icinde tekrar mode check yapmaktan
 * kurtuluyoruz.
 *
 * Mode 'unknown' → asla cagrilmamali (auth gating bos ekran gosteriyor). Defensive
 * davranis: 'auth' kabul edilir (Supabase'e gider, RLS koruma saglar).
 */
import { supabase } from './supabase';
import * as gs from './guest-storage';
import { useAuthMode, useAuthSession } from '../stores/auth-store';
import { useMemo } from 'react';
import type {
  AppExercisesRow,
  AppProgramsRow,
  AppProgramDaysRow,
  AppWorkoutsRow,
  AppSetsRow,
  AppSetsUpdate,
  AppDayMetaRow,
  CycleType,
  DayIndex,
  SetType,
  RirValue,
  Json,
} from '../types/database';

// ============================================================================
// Mode hook
// ============================================================================

/**
 * UI'da kullanim: `const ctx = useDataCtx(); ctx.mode === 'guest' ...`
 * userId guest mode'da `null` olur; auth mode'da `session.user.id`.
 */
export interface DataCtx {
  mode: 'auth' | 'guest';
  userId: string | null;
}

export function useDataCtx(): DataCtx {
  const mode = useAuthMode();
  const session = useAuthSession();
  return useMemo<DataCtx>(() => {
    if (mode === 'guest') return { mode: 'guest', userId: null };
    return { mode: 'auth', userId: session?.user.id ?? null };
  }, [mode, session]);
}

// ============================================================================
// Exercises (custom)
// ============================================================================

export async function fetchCustomExercises(ctx: DataCtx): Promise<AppExercisesRow[]> {
  if (ctx.mode === 'guest') {
    const rows = await gs.getGuestExercises();
    // Cast: GuestExerciseRow = Omit<Row, user_id> & { user_id: 'guest' } — yapı aynı.
    return rows as unknown as AppExercisesRow[];
  }
  if (!ctx.userId) return [];
  const { data, error } = await supabase
    .from('app_exercises')
    .select('*')
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as AppExercisesRow[] | null) ?? [];
}

export async function createCustomExercise(
  ctx: DataCtx,
  input: { name: string; categories?: string[]; notes?: string },
): Promise<AppExercisesRow> {
  if (ctx.mode === 'guest') {
    const row = await gs.addGuestExercise(input);
    return row as unknown as AppExercisesRow;
  }
  if (!ctx.userId) throw new Error('No userId');
  const { data, error } = await supabase
    .from('app_exercises')
    .insert({
      user_id: ctx.userId,
      name: input.name,
      categories: input.categories ?? ['Diğer'],
      notes: input.notes ?? '',
    })
    .select()
    .single();
  if (error) throw error;
  return data as AppExercisesRow;
}

// ============================================================================
// Programs
// ============================================================================

export async function fetchPrograms(ctx: DataCtx): Promise<AppProgramsRow[]> {
  if (ctx.mode === 'guest') {
    const rows = await gs.getGuestPrograms();
    return rows as unknown as AppProgramsRow[];
  }
  if (!ctx.userId) return [];
  const { data, error } = await supabase
    .from('app_programs')
    .select('*')
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as AppProgramsRow[] | null) ?? [];
}

export async function fetchActiveProgram(ctx: DataCtx): Promise<AppProgramsRow | null> {
  if (ctx.mode === 'guest') {
    const row = await gs.getGuestActiveProgram();
    return row as unknown as AppProgramsRow | null;
  }
  if (!ctx.userId) return null;
  const { data, error } = await supabase
    .from('app_programs')
    .select('*')
    .eq('user_id', ctx.userId)
    .not('activated_at', 'is', null)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as AppProgramsRow | null) ?? null;
}

/**
 * FAZ 2.2 — Aktif programı GÜNLERİYLE BİRLİKTE tek round-trip'te çeker
 * (activeProgram→programDays serial waterfall'ı kırar). Day Detail bunu kullanır;
 * `fetchActiveProgram` + `fetchProgramDays` ayrı ayrı diğer ekranlarda kalır.
 */
export async function fetchActiveProgramWithDays(
  ctx: DataCtx,
): Promise<{ program: AppProgramsRow | null; days: AppProgramDaysRow[] }> {
  if (ctx.mode === 'guest') {
    const program = (await gs.getGuestActiveProgram()) as unknown as AppProgramsRow | null;
    if (!program) return { program: null, days: [] };
    const days = await gs.getGuestProgramDays(program.id);
    return { program, days };
  }
  if (!ctx.userId) return { program: null, days: [] };
  const { data, error } = await supabase
    .from('app_programs')
    .select('*, app_program_days(*)')
    .eq('user_id', ctx.userId)
    .not('activated_at', 'is', null)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { program: null, days: [] };
  const row = data as unknown as AppProgramsRow & { app_program_days?: AppProgramDaysRow[] };
  const days = ((row.app_program_days as AppProgramDaysRow[] | undefined) ?? [])
    .slice()
    .sort((a, b) => a.day_index - b.day_index || a.position - b.position);
  const program: AppProgramsRow = { ...row };
  delete (program as { app_program_days?: unknown }).app_program_days;
  return { program, days };
}

export async function fetchProgramDays(
  ctx: DataCtx,
  programId: string,
): Promise<AppProgramDaysRow[]> {
  if (ctx.mode === 'guest') {
    const rows = await gs.getGuestProgramDays(programId);
    return rows;
  }
  const { data, error } = await supabase
    .from('app_program_days')
    .select('*')
    .eq('program_id', programId)
    .order('day_index')
    .order('position');
  if (error) throw error;
  return (data as AppProgramDaysRow[] | null) ?? [];
}

/**
 * Aynı preset'ten zaten bir program varken tekrar oluşturma denenirse fırlatılır.
 * ADIM 6 PRIORITY 0: kullanıcı modal'da "Bu Programı Başlat"a birden çok kez basınca
 * (3 kopya PPL gözlemlendi) UI net bir mesaj göstersin diye typed error.
 * NOT (OPEN): Bu davranış spec'te (03-mvp §3.8) yazılı değil — duplicate guard kullanıcı
 * kararıyla ADIM 6'da eklendi. Spec'e yedirilmesi gerekir.
 */
export class DuplicateProgramError extends Error {
  readonly code = 'DUPLICATE_PROGRAM';
  constructor(public programName: string) {
    super(`DUPLICATE_PROGRAM:${programName}`);
    this.name = 'DuplicateProgramError';
  }
}

export async function createProgramFromPreset(
  ctx: DataCtx,
  input: {
    name: string;
    description: string;
    presetSlug: string;
    offDays: number[];
    daysBySlug: Record<'0' | '1' | '2' | '3' | '4' | '5' | '6', string[]>;
    cycle_type?: CycleType;
  },
): Promise<{ programId: string }> {
  const cycle = input.cycle_type ?? 'weekly';
  if (ctx.mode === 'guest') {
    // Duplicate guard (guest): aynı preset_origin zaten varsa engelle.
    const existing = await gs.getGuestPrograms();
    if (existing.some((p) => p.preset_origin === input.presetSlug)) {
      throw new DuplicateProgramError(input.name);
    }
    const prog = await gs.addGuestProgram({
      name: input.name,
      description: input.description,
      preset_origin: input.presetSlug,
      cycle_type: cycle,
      off_days: input.offDays,
      activated_at: new Date().toISOString(),
    });
    // Aktif olusturdugumuz icin diger programlari pasiflestir:
    await gs.activateGuestProgram(prog.id);
    // program_days satirlarini olustur
    const rows: Array<Omit<AppProgramDaysRow, 'program_id'>> = [];
    (Object.entries(input.daysBySlug) as Array<[keyof typeof input.daysBySlug, string[]]>).forEach(
      ([dayKey, slugs]) => {
        const dayIndex = parseInt(dayKey, 10) as DayIndex;
        slugs.forEach((slug, position) => {
          rows.push({ day_index: dayIndex, position, exercise_ref: slug });
        });
      },
    );
    await gs.setGuestProgramDays(prog.id, rows);
    return { programId: prog.id };
  }
  if (!ctx.userId) throw new Error('No userId');
  // auth mode — Supabase
  // Duplicate guard (auth): aynı preset_origin zaten kullanıcıda varsa engelle.
  const { data: dupRows, error: dupErr } = await supabase
    .from('app_programs')
    .select('id')
    .eq('user_id', ctx.userId)
    .eq('preset_origin', input.presetSlug)
    .limit(1);
  if (dupErr) throw dupErr;
  if (Array.isArray(dupRows) && dupRows.length > 0) {
    throw new DuplicateProgramError(input.name);
  }
  const nowIso = new Date().toISOString();
  // Onceki aktif programlari pasiflestir (tek aktif kurali — §8.9)
  await supabase
    .from('app_programs')
    .update({ activated_at: null })
    .eq('user_id', ctx.userId)
    .not('activated_at', 'is', null);

  const { data: progData, error: progErr } = await supabase
    .from('app_programs')
    .insert({
      user_id: ctx.userId,
      name: input.name,
      description: input.description,
      preset_origin: input.presetSlug,
      cycle_type: cycle,
      off_days: input.offDays,
      activated_at: nowIso,
    })
    .select()
    .single();
  if (progErr) throw progErr;
  const programId = (progData as AppProgramsRow).id;

  const dayInserts: AppProgramDaysRow[] = [];
  (Object.entries(input.daysBySlug) as Array<[keyof typeof input.daysBySlug, string[]]>).forEach(
    ([dayKey, slugs]) => {
      const dayIndex = parseInt(dayKey, 10) as DayIndex;
      slugs.forEach((slug, position) => {
        dayInserts.push({
          program_id: programId,
          day_index: dayIndex,
          position,
          exercise_ref: slug,
        });
      });
    },
  );
  if (dayInserts.length > 0) {
    const { error: dErr } = await supabase.from('app_program_days').insert(dayInserts);
    if (dErr) throw dErr;
  }
  return { programId };
}

// ============================================================================
// Workouts
// ============================================================================

export async function fetchWorkoutsByDate(
  ctx: DataCtx,
  dateISO: string,
): Promise<AppWorkoutsRow[]> {
  if (ctx.mode === 'guest') {
    const rows = await gs.getGuestWorkoutsByDate(dateISO);
    return rows as unknown as AppWorkoutsRow[];
  }
  if (!ctx.userId) return [];
  const { data, error } = await supabase
    .from('app_workouts')
    .select('*')
    .eq('user_id', ctx.userId)
    .eq('workout_date', dateISO)
    .order('position');
  if (error) throw error;
  return (data as AppWorkoutsRow[] | null) ?? [];
}

// workout_date `date` kolonu → literal date'e cast edilir. '...-32' geçersiz tarih
// (ERROR: date/time field value out of range) → sorgu patlardı. Exclusive üst sınır
// = SONRAKI ayın 1'i.
function monthRange(year: number, month1to12: number): { lo: string; hi: string } {
  const mm = month1to12.toString().padStart(2, '0');
  const yyyy = year.toString().padStart(4, '0');
  const lo = `${yyyy}-${mm}-01`;
  const nextMonth = month1to12 === 12 ? 1 : month1to12 + 1;
  const nextYear = month1to12 === 12 ? year + 1 : year;
  const hi = `${nextYear.toString().padStart(4, '0')}-${nextMonth.toString().padStart(2, '0')}-01`;
  return { lo, hi };
}

export async function fetchWorkoutsByMonth(
  ctx: DataCtx,
  year: number,
  month1to12: number,
): Promise<AppWorkoutsRow[]> {
  if (ctx.mode === 'guest') {
    const rows = await gs.getGuestWorkoutsByMonth(year, month1to12);
    return rows as unknown as AppWorkoutsRow[];
  }
  if (!ctx.userId) return [];
  const { lo, hi } = monthRange(year, month1to12);
  const { data, error } = await supabase
    .from('app_workouts')
    .select('*')
    .eq('user_id', ctx.userId)
    .gte('workout_date', lo)
    .lt('workout_date', hi)
    .order('workout_date');
  if (error) throw error;
  return (data as AppWorkoutsRow[] | null) ?? [];
}

/** FAZ 2.5 — set + ait olduğu günün tarihi (seed cache satırı). */
export type AppSetsRowWithDate = AppSetsRow & { workout_date: string };

/**
 * FAZ 2.5 — Ayın TÜM set'leri (workout_date ile birlikte). Calendar mount'ta çekilir
 * ve gün açılışında `setsByDate` cache'inin SEED kaynağı olur: güne tıklayınca set'ler
 * network beklenmeden render edilir. Hiçbir ekranda doğrudan gösterilmez.
 */
export async function fetchSetsByMonth(
  ctx: DataCtx,
  year: number,
  month1to12: number,
): Promise<AppSetsRowWithDate[]> {
  if (ctx.mode === 'guest') {
    const wks = await gs.getGuestWorkoutsByMonth(year, month1to12);
    if (wks.length === 0) return [];
    const dateById = new Map(wks.map((w) => [w.id, w.workout_date]));
    const all = await gs.getGuestSets();
    return all
      .filter((s) => dateById.has(s.workout_id))
      .map((s) => ({ ...s, workout_date: dateById.get(s.workout_id) as string }));
  }
  if (!ctx.userId) return [];
  const { lo, hi } = monthRange(year, month1to12);
  const { data, error } = await supabase
    .from('app_sets')
    .select('*, app_workouts!inner(workout_date, user_id)')
    .eq('app_workouts.user_id', ctx.userId)
    .gte('app_workouts.workout_date', lo)
    .lt('app_workouts.workout_date', hi);
  if (error) throw error;
  const rows =
    (data as unknown as Array<AppSetsRow & { app_workouts?: { workout_date?: string } }>) ?? [];
  return rows.map((r) => ({
    id: r.id,
    workout_id: r.workout_id,
    set_index: r.set_index,
    set_type: r.set_type,
    weight: r.weight,
    reps: r.reps,
    rir: r.rir,
    created_at: r.created_at,
    workout_date: r.app_workouts?.workout_date ?? '',
  }));
}

/**
 * Tarihçede kullanılmış distinct exercise_ref listesi — D1/C4 "Kütüphanem" sekmesi
 * için (§8.8 03-mvp). Hem preset slug'ları hem custom UUID'leri döner; UI ayırır.
 * Sıra önemli değil (caller filtre/sort eder).
 */
export async function fetchUsedExerciseRefs(ctx: DataCtx): Promise<string[]> {
  if (ctx.mode === 'guest') {
    const all = await gs.getGuestWorkouts();
    return Array.from(new Set(all.map((w) => w.exercise_ref)));
  }
  if (!ctx.userId) return [];
  const { data, error } = await supabase
    .from('app_workouts')
    .select('exercise_ref')
    .eq('user_id', ctx.userId);
  if (error) throw error;
  const rows = (data as Array<{ exercise_ref: string }> | null) ?? [];
  return Array.from(new Set(rows.map((r) => r.exercise_ref)));
}

/** Tüm workout tarihleri (distinct) — compliance/streak hesabı için (D2). */
export async function fetchAllWorkoutDates(ctx: DataCtx): Promise<string[]> {
  if (ctx.mode === 'guest') {
    const all = await gs.getGuestWorkouts();
    return Array.from(new Set(all.map((w) => w.workout_date)));
  }
  if (!ctx.userId) return [];
  const { data, error } = await supabase
    .from('app_workouts')
    .select('workout_date')
    .eq('user_id', ctx.userId);
  if (error) throw error;
  const rows = (data as Array<{ workout_date: string }> | null) ?? [];
  return Array.from(new Set(rows.map((r) => r.workout_date)));
}

export async function fetchSetsForWorkouts(
  ctx: DataCtx,
  workoutIds: string[],
): Promise<AppSetsRow[]> {
  if (workoutIds.length === 0) return [];
  if (ctx.mode === 'guest') {
    const all = await gs.getGuestSets();
    const set = new Set(workoutIds);
    return all.filter((s) => set.has(s.workout_id));
  }
  const { data, error } = await supabase
    .from('app_sets')
    .select('*')
    .in('workout_id', workoutIds);
  if (error) throw error;
  return (data as AppSetsRow[] | null) ?? [];
}

/**
 * FAZ 2.1 — Bir günün TÜM set'lerini workout id'lerine bağlı OLMADAN, doğrudan
 * tarihe göre çeker (workouts→sets serial waterfall'ı kırar; iki query paralel başlar).
 * Auth: `app_sets` ⋈ `app_workouts!inner` (workout_date + user_id ile filtre).
 * Guest: o günün workout id'leri üzerinden filtre. Her iki yol da düz AppSetsRow[] döner.
 */
export async function fetchSetsByDate(ctx: DataCtx, dateISO: string): Promise<AppSetsRow[]> {
  if (ctx.mode === 'guest') {
    const wks = await gs.getGuestWorkoutsByDate(dateISO);
    if (wks.length === 0) return [];
    const ids = new Set(wks.map((w) => w.id));
    const all = await gs.getGuestSets();
    return all.filter((s) => ids.has(s.workout_id));
  }
  if (!ctx.userId) return [];
  const { data, error } = await supabase
    .from('app_sets')
    .select('*, app_workouts!inner(workout_date, user_id)')
    .eq('app_workouts.user_id', ctx.userId)
    .eq('app_workouts.workout_date', dateISO);
  if (error) throw error;
  const rows = (data as unknown as Array<AppSetsRow & { app_workouts?: unknown }>) ?? [];
  // Embed'i sıyır → düz AppSetsRow (cache shape eski `fetchSetsForWorkouts` ile birebir).
  return rows.map((r) => ({
    id: r.id,
    workout_id: r.workout_id,
    set_index: r.set_index,
    set_type: r.set_type,
    weight: r.weight,
    reps: r.reps,
    rir: r.rir,
    created_at: r.created_at,
  }));
}

export async function addWorkoutSet(
  ctx: DataCtx,
  input: {
    workoutId: string;
    setIndex?: number;
    setType?: SetType;
    weight?: number | null;
    reps?: number | null;
    rir?: RirValue | null;
  },
): Promise<AppSetsRow> {
  if (ctx.mode === 'guest') {
    const row = await gs.addGuestSet({
      workout_id: input.workoutId,
      set_index: input.setIndex,
      set_type: input.setType,
      weight: input.weight ?? null,
      reps: input.reps ?? null,
      rir: input.rir ?? null,
    });
    return row;
  }
  const { data, error } = await supabase
    .from('app_sets')
    .insert({
      workout_id: input.workoutId,
      set_index: input.setIndex ?? 0,
      set_type: input.setType ?? 'working',
      weight: input.weight ?? null,
      reps: input.reps ?? null,
      rir: input.rir ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as AppSetsRow;
}

// ============================================================================
// Day meta
// ============================================================================

export async function fetchDayMeta(
  ctx: DataCtx,
  dateISO: string,
): Promise<AppDayMetaRow | null> {
  if (ctx.mode === 'guest') {
    const row = await gs.getGuestDayMeta(dateISO);
    return row as unknown as AppDayMetaRow | null;
  }
  if (!ctx.userId) return null;
  const { data, error } = await supabase
    .from('app_day_meta')
    .select('*')
    .eq('user_id', ctx.userId)
    .eq('workout_date', dateISO)
    .maybeSingle();
  if (error) throw error;
  return (data as AppDayMetaRow | null) ?? null;
}

// ============================================================================
// Program CRUD (ADIM 6 — D2/D3)
// ============================================================================

export async function createEmptyProgram(
  ctx: DataCtx,
  input: { name: string; description?: string },
): Promise<{ programId: string }> {
  if (ctx.mode === 'guest') {
    const prog = await gs.addGuestProgram({
      name: input.name,
      description: input.description ?? '',
      cycle_type: 'weekly',
      off_days: [],
      activated_at: null, // §8.4.1: yeni program varsayilan aktif degil
    });
    return { programId: prog.id };
  }
  if (!ctx.userId) throw new Error('No userId');
  const { data, error } = await supabase
    .from('app_programs')
    .insert({
      user_id: ctx.userId,
      name: input.name,
      description: input.description ?? '',
      cycle_type: 'weekly',
      off_days: [],
      activated_at: null,
    })
    .select()
    .single();
  if (error) throw error;
  return { programId: (data as AppProgramsRow).id };
}

export async function fetchProgramById(
  ctx: DataCtx,
  programId: string,
): Promise<AppProgramsRow | null> {
  if (ctx.mode === 'guest') {
    const list = await gs.getGuestPrograms();
    return (list.find((p) => p.id === programId) as unknown as AppProgramsRow) ?? null;
  }
  if (!ctx.userId) return null;
  const { data, error } = await supabase
    .from('app_programs')
    .select('*')
    .eq('id', programId)
    .maybeSingle();
  if (error) throw error;
  return (data as AppProgramsRow | null) ?? null;
}

export async function updateProgram(
  ctx: DataCtx,
  programId: string,
  patch: {
    name?: string;
    description?: string;
    cycle_type?: CycleType;
    deload_every?: number | null;
    off_days?: number[];
  },
): Promise<void> {
  if (ctx.mode === 'guest') {
    await gs.updateGuestProgram(programId, patch);
    return;
  }
  const { error } = await supabase
    .from('app_programs')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', programId);
  if (error) throw error;
}

export async function deleteProgram(ctx: DataCtx, programId: string): Promise<void> {
  if (ctx.mode === 'guest') {
    await gs.deleteGuestProgram(programId);
    return;
  }
  // app_program_days cascade ON DELETE; app_workouts persist (soft ref).
  const { error: dErr } = await supabase
    .from('app_program_days')
    .delete()
    .eq('program_id', programId);
  if (dErr) throw dErr;
  const { error } = await supabase.from('app_programs').delete().eq('id', programId);
  if (error) throw error;
}

/** Tek aktif kurali: digerlerini pasiflestir, target'i aktif et. */
export async function activateProgram(ctx: DataCtx, programId: string): Promise<void> {
  if (ctx.mode === 'guest') {
    await gs.activateGuestProgram(programId);
    return;
  }
  if (!ctx.userId) throw new Error('No userId');
  const nowIso = new Date().toISOString();
  const { error: deErr } = await supabase
    .from('app_programs')
    .update({ activated_at: null })
    .eq('user_id', ctx.userId)
    .not('activated_at', 'is', null);
  if (deErr) throw deErr;
  const { error } = await supabase
    .from('app_programs')
    .update({ activated_at: nowIso, updated_at: nowIso })
    .eq('id', programId);
  if (error) throw error;
}

export async function deactivateProgram(ctx: DataCtx, programId: string): Promise<void> {
  if (ctx.mode === 'guest') {
    await gs.updateGuestProgram(programId, { activated_at: null });
    return;
  }
  const { error } = await supabase
    .from('app_programs')
    .update({ activated_at: null, updated_at: new Date().toISOString() })
    .eq('id', programId);
  if (error) throw error;
}

// ---- program_days mutations ----

export async function addProgramDayExercise(
  ctx: DataCtx,
  input: { programId: string; dayIndex: DayIndex; exerciseRef: string },
): Promise<void> {
  if (ctx.mode === 'guest') {
    await gs.addGuestProgramDayExercise({
      program_id: input.programId,
      day_index: input.dayIndex,
      exercise_ref: input.exerciseRef,
    });
    return;
  }
  const existing = await fetchProgramDays(ctx, input.programId);
  const sameDay = existing.filter((d) => d.day_index === input.dayIndex);
  const position =
    sameDay.length === 0 ? 0 : Math.max(...sameDay.map((d) => d.position)) + 1;
  const { error } = await supabase.from('app_program_days').insert({
    program_id: input.programId,
    day_index: input.dayIndex,
    position,
    exercise_ref: input.exerciseRef,
  });
  if (error) throw error;
}

/**
 * Bir güne **birden fazla** hareketi tek seferde ekler. `addProgramDayExercise`'i
 * çoklu seçimde N kez paralel çağırmak position çakışmasına yol açar
 * (PRIMARY KEY (program_id, day_index, position) ihlali → auth'ta kalan insert'ler
 * sessizce düşer, guest'te AsyncStorage lost-write). Bu fonksiyon position'ları
 * tek okumadan ardışık hesaplayıp tek yazımla ekler.
 */
export async function addProgramDayExercises(
  ctx: DataCtx,
  input: { programId: string; dayIndex: DayIndex; exerciseRefs: string[] },
): Promise<void> {
  if (input.exerciseRefs.length === 0) return;
  if (ctx.mode === 'guest') {
    // Sıralı await: her ekleme bir öncekinin yazdığı state'i görür → lost-write yok.
    for (const ref of input.exerciseRefs) {
      // eslint-disable-next-line no-await-in-loop
      await gs.addGuestProgramDayExercise({
        program_id: input.programId,
        day_index: input.dayIndex,
        exercise_ref: ref,
      });
    }
    return;
  }
  const existing = await fetchProgramDays(ctx, input.programId);
  const sameDay = existing.filter((d) => d.day_index === input.dayIndex);
  const base = sameDay.length === 0 ? 0 : Math.max(...sameDay.map((d) => d.position)) + 1;
  const rows = input.exerciseRefs.map((ref, i) => ({
    program_id: input.programId,
    day_index: input.dayIndex,
    position: base + i,
    exercise_ref: ref,
  }));
  const { error } = await supabase.from('app_program_days').insert(rows);
  if (error) throw error;
}

export async function removeProgramDayExercise(
  ctx: DataCtx,
  input: { programId: string; dayIndex: DayIndex; exerciseRef: string },
): Promise<void> {
  // Atomik replace stratejisi (her iki mode'da): gunun satirlarini yeniden yaz.
  const all = await fetchProgramDays(ctx, input.programId);
  const kept = all
    .filter((d) => !(d.day_index === input.dayIndex && d.exercise_ref === input.exerciseRef));
  await rewriteProgramDays(ctx, input.programId, kept);
}

export async function reorderProgramDay(
  ctx: DataCtx,
  input: { programId: string; dayIndex: DayIndex; orderedRefs: string[] },
): Promise<void> {
  const all = await fetchProgramDays(ctx, input.programId);
  const others = all.filter((d) => d.day_index !== input.dayIndex);
  const reordered: AppProgramDaysRow[] = input.orderedRefs.map((ref, position) => ({
    program_id: input.programId,
    day_index: input.dayIndex,
    position,
    exercise_ref: ref,
  }));
  await rewriteProgramDays(ctx, input.programId, others.concat(reordered));
}

export async function moveProgramDayExercise(
  ctx: DataCtx,
  input: {
    programId: string;
    fromDay: DayIndex;
    toDay: DayIndex;
    exerciseRef: string;
  },
): Promise<void> {
  const all = await fetchProgramDays(ctx, input.programId);
  const remaining = all.filter(
    (d) => !(d.day_index === input.fromDay && d.exercise_ref === input.exerciseRef),
  );
  const toDayRows = remaining.filter((d) => d.day_index === input.toDay);
  const nextPos =
    toDayRows.length === 0 ? 0 : Math.max(...toDayRows.map((d) => d.position)) + 1;
  remaining.push({
    program_id: input.programId,
    day_index: input.toDay,
    position: nextPos,
    exercise_ref: input.exerciseRef,
  });
  await rewriteProgramDays(ctx, input.programId, remaining);
}

/** Off-day = o gunun tum satirlarini sil (Opsiyon A — §8.10). */
export async function clearProgramDay(
  ctx: DataCtx,
  input: { programId: string; dayIndex: DayIndex },
): Promise<void> {
  const all = await fetchProgramDays(ctx, input.programId);
  const kept = all.filter((d) => d.day_index !== input.dayIndex);
  await rewriteProgramDays(ctx, input.programId, kept);
}

/** Tum program_days'i atomik degistir (position'lar normalize edilir). */
async function rewriteProgramDays(
  ctx: DataCtx,
  programId: string,
  rows: AppProgramDaysRow[],
): Promise<void> {
  // Position normalize: her gun icin 0..n-1 sirala.
  const byDay = new Map<number, AppProgramDaysRow[]>();
  for (const r of rows) {
    const arr = byDay.get(r.day_index) ?? [];
    arr.push(r);
    byDay.set(r.day_index, arr);
  }
  const normalized: AppProgramDaysRow[] = [];
  for (const [day, arr] of byDay) {
    arr
      .sort((a, b) => a.position - b.position)
      .forEach((r, i) =>
        normalized.push({ ...r, day_index: day as DayIndex, position: i }),
      );
  }
  if (ctx.mode === 'guest') {
    await gs.setGuestProgramDays(
      programId,
      normalized.map(({ day_index, position, exercise_ref }) => ({
        day_index,
        position,
        exercise_ref,
      })),
    );
    return;
  }
  const { error: delErr } = await supabase
    .from('app_program_days')
    .delete()
    .eq('program_id', programId);
  if (delErr) throw delErr;
  if (normalized.length > 0) {
    const { error } = await supabase.from('app_program_days').insert(normalized);
    if (error) throw error;
  }
}

// ============================================================================
// Workout + set CRUD (ADIM 6 — C2/C3/C4)
// ============================================================================

/** Lazy yazma: program gunu kartina ilk set girilince workout row insert. */
export async function ensureWorkout(
  ctx: DataCtx,
  input: { dateISO: string; exerciseRef: string; position?: number },
): Promise<AppWorkoutsRow> {
  // Once ayni gun + ref var mi bak (UNIQUE(user_id, workout_date, exercise_ref)).
  const existing = await fetchWorkoutsByDate(ctx, input.dateISO);
  const found = existing.find((w) => w.exercise_ref === input.exerciseRef);
  if (found) return found;
  if (ctx.mode === 'guest') {
    const row = await gs.addGuestWorkout({
      workout_date: input.dateISO,
      exercise_ref: input.exerciseRef,
      position: input.position,
    });
    return row as unknown as AppWorkoutsRow;
  }
  if (!ctx.userId) throw new Error('No userId');
  const position =
    input.position ??
    (existing.length === 0 ? 0 : Math.max(...existing.map((w) => w.position)) + 1);
  const { data, error } = await supabase
    .from('app_workouts')
    .insert({
      user_id: ctx.userId,
      workout_date: input.dateISO,
      exercise_ref: input.exerciseRef,
      position,
    })
    .select()
    .single();
  if (error) throw error;
  return data as AppWorkoutsRow;
}

export async function deleteWorkout(ctx: DataCtx, workoutId: string): Promise<void> {
  if (ctx.mode === 'guest') {
    await gs.deleteGuestWorkout(workoutId);
    return;
  }
  // app_sets cascade ON DELETE.
  const { error } = await supabase.from('app_workouts').delete().eq('id', workoutId);
  if (error) throw error;
}

/**
 * Bir günün TÜM kartlarının (persisted + lazy) görüntü sırasını günceller (C2 reorder —
 * §8.8/§3.2; kullanıcı kararı 2026-06-18: lazy kartlar da sürüklenir).
 *
 * `orderedRefs` = istenen sıradaki exercise_ref'ler (persisted + lazy birlikte). Sıra
 * `app_day_meta.card_order`'a yazılır → lazy kartlar **workout satırı YAZILMADAN** sıralanır
 * (lazy-write garantisi korunur). Ek olarak persisted kartların `position`'ı birleşik sıraya
 * göre güncellenir (month grid + diğer position tüketicileri tutarlı kalsın). position
 * UNIQUE değil → paralel UPDATE güvenli; delete+reinsert YASAK (set'leri cascade ile silerdi).
 */
export async function reorderDayCards(
  ctx: DataCtx,
  input: { dateISO: string; orderedRefs: string[] },
): Promise<void> {
  if (input.orderedRefs.length === 0) return;
  const rank = new Map(input.orderedRefs.map((ref, i) => [ref, i] as const));

  if (ctx.mode === 'guest') {
    await gs.upsertGuestDayMeta({ workout_date: input.dateISO, card_order: input.orderedRefs });
    const existing = await gs.getGuestWorkoutsByDate(input.dateISO);
    for (const w of existing) {
      const pos = rank.get(w.exercise_ref);
      if (pos === undefined || pos === w.position) continue;
      // eslint-disable-next-line no-await-in-loop
      await gs.updateGuestWorkout(w.id, { position: pos });
    }
    return;
  }

  if (!ctx.userId) throw new Error('No userId');
  const userId = ctx.userId;
  const updatedAt = new Date().toISOString();

  const { error: metaErr } = await supabase.from('app_day_meta').upsert(
    {
      user_id: userId,
      workout_date: input.dateISO,
      card_order: input.orderedRefs,
      updated_at: updatedAt,
    },
    { onConflict: 'user_id,workout_date' },
  );
  if (metaErr) throw metaErr;

  const existing = await fetchWorkoutsByDate(ctx, input.dateISO);
  const updates = existing
    .map((w) => ({ id: w.id, position: rank.get(w.exercise_ref) }))
    .filter((u): u is { id: string; position: number } => u.position !== undefined);
  if (updates.length === 0) return;
  const results = await Promise.all(
    updates.map((u) =>
      supabase
        .from('app_workouts')
        .update({ position: u.position, updated_at: updatedAt })
        .eq('id', u.id)
        .eq('user_id', userId),
    ),
  );
  for (const { error } of results) {
    if (error) throw error;
  }
}

export async function updateSet(
  ctx: DataCtx,
  setId: string,
  patch: { setType?: SetType; weight?: number | null; reps?: number | null; rir?: RirValue | null },
): Promise<void> {
  if (ctx.mode === 'guest') {
    await gs.updateGuestSet(setId, {
      ...(patch.setType !== undefined ? { set_type: patch.setType } : {}),
      ...(patch.weight !== undefined ? { weight: patch.weight } : {}),
      ...(patch.reps !== undefined ? { reps: patch.reps } : {}),
      ...(patch.rir !== undefined ? { rir: patch.rir } : {}),
    });
    return;
  }
  const dbPatch: AppSetsUpdate = {};
  if (patch.setType !== undefined) dbPatch.set_type = patch.setType;
  if (patch.weight !== undefined) dbPatch.weight = patch.weight;
  if (patch.reps !== undefined) dbPatch.reps = patch.reps;
  if (patch.rir !== undefined) dbPatch.rir = patch.rir;
  const { error } = await supabase.from('app_sets').update(dbPatch).eq('id', setId);
  if (error) throw error;
}

export async function deleteSet(ctx: DataCtx, setId: string): Promise<void> {
  if (ctx.mode === 'guest') {
    await gs.deleteGuestSet(setId);
    return;
  }
  const { error } = await supabase.from('app_sets').delete().eq('id', setId);
  if (error) throw error;
}

/** Same exercise_ref icin bugunden onceki en son workout'un setleri (prefill — §3.2). */
export async function fetchLastSessionForRef(
  ctx: DataCtx,
  input: { exerciseRef: string; beforeDateISO: string },
): Promise<{ workoutDate: string; sets: AppSetsRow[] } | null> {
  if (ctx.mode === 'guest') {
    const all = await gs.getGuestWorkouts();
    const prior = all
      .filter((w) => w.exercise_ref === input.exerciseRef && w.workout_date < input.beforeDateISO)
      .sort((a, b) => (a.workout_date < b.workout_date ? 1 : -1));
    const last = prior[0];
    if (!last) return null;
    const sets = await gs.getGuestSetsByWorkout(last.id);
    return { workoutDate: last.workout_date, sets };
  }
  if (!ctx.userId) return null;
  const { data: wkData, error: wkErr } = await supabase
    .from('app_workouts')
    .select('*')
    .eq('user_id', ctx.userId)
    .eq('exercise_ref', input.exerciseRef)
    .lt('workout_date', input.beforeDateISO)
    .order('workout_date', { ascending: false })
    .limit(1);
  if (wkErr) throw wkErr;
  const last = (wkData as AppWorkoutsRow[] | null)?.[0];
  if (!last) return null;
  const { data: setData, error: setErr } = await supabase
    .from('app_sets')
    .select('*')
    .eq('workout_id', last.id)
    .order('set_index');
  if (setErr) throw setErr;
  return { workoutDate: last.workout_date, sets: (setData as AppSetsRow[] | null) ?? [] };
}

// ============================================================================
// Day meta — skip exercise (program gununde "sadece bugun")
// ============================================================================

export async function skipExerciseForDay(
  ctx: DataCtx,
  input: { dateISO: string; exerciseRef: string },
): Promise<void> {
  const meta = await fetchDayMeta(ctx, input.dateISO);
  const current = meta?.skipped_exercise_ids ?? [];
  if (current.includes(input.exerciseRef)) return;
  const next = [...current, input.exerciseRef];
  if (ctx.mode === 'guest') {
    await gs.upsertGuestDayMeta({ workout_date: input.dateISO, skipped_exercise_ids: next });
    return;
  }
  if (!ctx.userId) throw new Error('No userId');
  const { error } = await supabase
    .from('app_day_meta')
    .upsert(
      {
        user_id: ctx.userId,
        workout_date: input.dateISO,
        skipped_exercise_ids: next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,workout_date' },
    );
  if (error) throw error;
}

export async function updateCustomExercise(
  ctx: DataCtx,
  id: string,
  patch: { name?: string; categories?: string[]; notes?: string },
): Promise<void> {
  if (ctx.mode === 'guest') {
    await gs.updateGuestExercise(id, patch);
    return;
  }
  const { error } = await supabase.from('app_exercises').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteCustomExercise(ctx: DataCtx, id: string): Promise<void> {
  if (ctx.mode === 'guest') {
    await gs.deleteGuestExercise(id);
    return;
  }
  // Soft reference (rev 13): app_workouts persist, sadece app_exercises sil.
  const { error } = await supabase.from('app_exercises').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================================
// Web user detection (§3.10) + profile preferences (seen flags)
// ============================================================================

export async function countWebUserData(ctx: DataCtx): Promise<number> {
  if (ctx.mode !== 'auth' || !ctx.userId) return 0;
  const { count, error } = await supabase
    .from('user_data')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', ctx.userId);
  if (error) return 0; // tablo yoksa / RLS: sessizce 0
  return count ?? 0;
}

export async function fetchProfilePreferences(
  ctx: DataCtx,
): Promise<Record<string, unknown>> {
  if (ctx.mode === 'guest') {
    const p = await gs.getGuestProfile();
    return (p?.preferences as Record<string, unknown>) ?? {};
  }
  if (!ctx.userId) return {};
  const { data, error } = await supabase
    .from('app_profiles')
    .select('preferences')
    .eq('user_id', ctx.userId)
    .maybeSingle();
  if (error) return {};
  return ((data as { preferences?: Record<string, unknown> } | null)?.preferences) ?? {};
}

export async function setProfilePreference(
  ctx: DataCtx,
  key: string,
  value: unknown,
): Promise<void> {
  const current = await fetchProfilePreferences(ctx);
  const next = { ...current, [key]: value };
  if (ctx.mode === 'guest') {
    await gs.setGuestProfile({ preferences: next as Json });
    return;
  }
  if (!ctx.userId) return;
  const { error } = await supabase
    .from('app_profiles')
    .upsert(
      { user_id: ctx.userId, preferences: next as Json, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
  if (error) throw error;
}
