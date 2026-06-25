/**
 * Migration — Guest → Hesap geçişi (ADIM 5 — gerçek implementation).
 *
 * Karar kaynakları:
 *   §3.9.1 03-mvp — 8 adım akışı (modal onayı → signUp → readGuest → regen UUID →
 *     insert → success: clearAllGuestData; hata: rollback)
 *   §3.9.1 rev 11 — Loading state: full-screen modal + sade spinner (UI: MigrationLoadingOverlay)
 *   §8.7 03-mvp — Misafir profil tercihi (locale/theme) `app_profiles.preferences`'a aktarılır
 *
 * Akış:
 *   1) Tüm guest tablo okumalarını yap (exercises/programs/program_days/workouts/sets/day_meta/profile)
 *   2) UUID regenerate (program_days workout_id veya exercise_ref FK olmadığı için kolay;
 *      sadece `app_exercises.id` ve `app_programs.id` regenere, `program_days` ona göre güncellenir)
 *   3) Insert sırasına dikkat — parent önce: exercises → programs → program_days →
 *      workouts → sets → day_meta. `app_workouts.exercise_ref` polymorphic — slug ise olduğu gibi,
 *      UUID ise yeni custom exercise UUID'siyle değiştirilir.
 *   4) Başarılı: clearAllGuestData + locale/theme `app_profiles`'a yedirilir (`upsert`).
 *   5) Hata: AsyncStorage'a dokunulmaz → partialCounts ile geri dön → UI retry.
 *
 * Insert stratejisi:
 *   - Tek tablo için tek `.insert(array)` çağrısı (Supabase batch). RLS `auth.uid()` = `userId`
 *     kontrolünden geçmek için `user_id` her satıra eklenir.
 *   - Hata: ilk başarısız tablo için partialCounts ile çık. clearAllGuestData ÇAĞRILMAZ.
 */
import { supabase } from './supabase';
import {
  clearAllGuestData,
  getGuestExercises,
  getGuestPrograms,
  getGuestProgramDays,
  getGuestWorkouts,
  getGuestSets,
  getGuestDayMetas,
  getGuestProfile,
} from './guest-storage';
import { uuidv4, isUuid } from './uuid';
import type {
  AppExercisesInsert,
  AppProgramsInsert,
  AppProgramDaysInsert,
  AppWorkoutsInsert,
  AppSetsInsert,
  AppDayMetaInsert,
  Json,
} from '../types/database';

export interface MigrationCounts {
  exercises: number;
  programs: number;
  program_days: number;
  workouts: number;
  sets: number;
  day_meta: number;
}

const ZERO_COUNTS: MigrationCounts = {
  exercises: 0,
  programs: 0,
  program_days: 0,
  workouts: 0,
  sets: 0,
  day_meta: 0,
};

export type MigrationResult =
  | { ok: true; counts: MigrationCounts; durationMs: number }
  | { ok: false; error: string; partialCounts: Partial<MigrationCounts>; durationMs: number };

/**
 * Misafir AsyncStorage verisini verilen `userId` ile Supabase `app_*` tablolarına
 * aktarır. Başarılı dönerse AsyncStorage'daki guest anahtarları temizlenir; hata
 * durumunda AsyncStorage'a dokunulmaz (rollback) ve retry mümkün kalır.
 */
export async function migrateGuestToAccount(userId: string): Promise<MigrationResult> {
  const start = Date.now();
  const partial: Partial<MigrationCounts> = {};

  try {
    // 1) Read all guest data
    const [exercises, programs, programDays, workouts, sets, dayMetas, profile] =
      await Promise.all([
        getGuestExercises(),
        getGuestPrograms(),
        getGuestProgramDays(),
        getGuestWorkouts(),
        getGuestSets(),
        getGuestDayMetas(),
        getGuestProfile(),
      ]);

    // Erken çıkış: hiçbir veri yoksa hızlı dönüş.
    if (
      exercises.length === 0 &&
      programs.length === 0 &&
      programDays.length === 0 &&
      workouts.length === 0 &&
      sets.length === 0 &&
      dayMetas.length === 0
    ) {
      // Yine de profile'i aktar (locale/theme).
      if (profile) {
        await syncProfile(userId, profile.locale, profile.theme, profile.preferences);
      }
      return { ok: true, counts: ZERO_COUNTS, durationMs: Date.now() - start };
    }

    // 2) ID re-mapping
    //   - exercises.id → yeni UUID
    //   - programs.id → yeni UUID
    //   - workouts.id → yeni UUID
    //   - sets.workout_id → yeni workout UUID
    //   - program_days.program_id → yeni program UUID
    //   - program_days.exercise_ref + workouts.exercise_ref polymorphic: slug ise aynen kalır,
    //     custom UUID ise yeni exercise UUID'siyle değiştirilir.
    const exerciseIdMap = new Map<string, string>();
    const programIdMap = new Map<string, string>();
    const workoutIdMap = new Map<string, string>();

    for (const e of exercises) exerciseIdMap.set(e.id, uuidv4());
    for (const p of programs) programIdMap.set(p.id, uuidv4());
    for (const w of workouts) workoutIdMap.set(w.id, uuidv4());

    const remapRef = (ref: string): string => {
      if (isUuid(ref)) return exerciseIdMap.get(ref) ?? ref;
      return ref; // slug
    };

    // 3) Build insert payloads
    const exerciseInserts: AppExercisesInsert[] = exercises.map((e) => ({
      id: exerciseIdMap.get(e.id)!,
      user_id: userId,
      name: e.name,
      categories: e.categories,
      notes: e.notes,
      created_at: e.created_at,
    }));

    const programInserts: AppProgramsInsert[] = programs.map((p) => ({
      id: programIdMap.get(p.id)!,
      user_id: userId,
      name: p.name,
      description: p.description,
      preset_origin: p.preset_origin,
      cycle_type: p.cycle_type,
      deload_every: p.deload_every,
      off_days: p.off_days,
      activated_at: p.activated_at,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));

    const programDayInserts: AppProgramDaysInsert[] = programDays.map((d) => ({
      program_id: programIdMap.get(d.program_id) ?? d.program_id,
      day_index: d.day_index,
      position: d.position,
      exercise_ref: remapRef(d.exercise_ref),
    }));

    const workoutInserts: AppWorkoutsInsert[] = workouts.map((w) => ({
      id: workoutIdMap.get(w.id)!,
      user_id: userId,
      workout_date: w.workout_date,
      exercise_ref: remapRef(w.exercise_ref),
      position: w.position,
      superset_group: w.superset_group,
      duration_minutes: w.duration_minutes,
      notes: w.notes,
      created_at: w.created_at,
      updated_at: w.updated_at,
    }));

    const setInserts: AppSetsInsert[] = sets.map((s) => ({
      id: uuidv4(),
      workout_id: workoutIdMap.get(s.workout_id) ?? s.workout_id,
      set_index: s.set_index,
      set_type: s.set_type,
      weight: s.weight,
      reps: s.reps,
      rir: s.rir,
      created_at: s.created_at,
    }));

    const dayMetaInserts: AppDayMetaInsert[] = dayMetas.map((d) => ({
      user_id: userId,
      workout_date: d.workout_date,
      day_note: d.day_note,
      total_duration_minutes: d.total_duration_minutes,
      skipped_exercise_ids: d.skipped_exercise_ids.map(remapRef),
      created_at: d.created_at,
      updated_at: d.updated_at,
    }));

    // 4) Batch insert in parent → child order
    if (exerciseInserts.length > 0) {
      const { error } = await supabase.from('app_exercises').insert(exerciseInserts);
      if (error) return fail('exercises', error.message, partial, start);
      partial.exercises = exerciseInserts.length;
    }
    if (programInserts.length > 0) {
      const { error } = await supabase.from('app_programs').insert(programInserts);
      if (error) return fail('programs', error.message, partial, start);
      partial.programs = programInserts.length;
    }
    if (programDayInserts.length > 0) {
      const { error } = await supabase.from('app_program_days').insert(programDayInserts);
      if (error) return fail('program_days', error.message, partial, start);
      partial.program_days = programDayInserts.length;
    }
    if (workoutInserts.length > 0) {
      const { error } = await supabase.from('app_workouts').insert(workoutInserts);
      if (error) return fail('workouts', error.message, partial, start);
      partial.workouts = workoutInserts.length;
    }
    if (setInserts.length > 0) {
      const { error } = await supabase.from('app_sets').insert(setInserts);
      if (error) return fail('sets', error.message, partial, start);
      partial.sets = setInserts.length;
    }
    if (dayMetaInserts.length > 0) {
      const { error } = await supabase.from('app_day_meta').insert(dayMetaInserts);
      if (error) return fail('day_meta', error.message, partial, start);
      partial.day_meta = dayMetaInserts.length;
    }

    // 5) Profile sync (§8.7) — best-effort, partial başarısızlığı migration'ı bozmaz.
    if (profile) {
      await syncProfile(userId, profile.locale, profile.theme, profile.preferences);
    }

    // 6) Success → AsyncStorage'ı temizle
    await clearAllGuestData();

    return {
      ok: true,
      counts: {
        exercises: partial.exercises ?? 0,
        programs: partial.programs ?? 0,
        program_days: partial.program_days ?? 0,
        workouts: partial.workouts ?? 0,
        sets: partial.sets ?? 0,
        day_meta: partial.day_meta ?? 0,
      },
      durationMs: Date.now() - start,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return fail('unknown', msg, partial, start);
  }
}

function fail(
  table: string,
  msg: string,
  partial: Partial<MigrationCounts>,
  start: number,
): MigrationResult {
  return {
    ok: false,
    error: `[${table}] ${msg}`,
    partialCounts: partial,
    durationMs: Date.now() - start,
  };
}

/** locale/theme/preferences → app_profiles.preferences upsert. Best-effort. */
async function syncProfile(
  userId: string,
  locale: string | null,
  theme: string | null,
  preferences: Json,
): Promise<void> {
  try {
    await supabase.from('app_profiles').upsert(
      {
        user_id: userId,
        locale,
        theme,
        preferences,
      },
      { onConflict: 'user_id' },
    );
  } catch (err) {
    // Profil migration başarısızlığı veri migration'ını bozmaz — sadece log.
    console.warn('[migration] syncProfile failed', err);
  }
}
