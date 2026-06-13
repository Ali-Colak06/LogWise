/**
 * Guest storage — AsyncStorage wrapper (ADIM 4).
 *
 * Karar kaynakları:
 *   §3.9 03-mvp — Misafir veri sadece cihazda (Supabase'e gitmez)
 *   §10.5 03-mvp — Anahtar format: `@logwise/guest/`, sub-key snake_case + DB tablo
 *     isimleriyle birebir eşleşir (`program_days`, `day_meta`).
 *   §3.9.1 — Guest → hesap migration sırasında bu anahtarlar okunur, sonra silinir.
 *
 * Tasarım:
 *   - `GUEST_KEYS` sabit obje — typo guard. Yeni bir guest tablosu eklenince buraya
 *     eklenir (ve DB tablosuyla isim eşleşir).
 *   - `readGuest<T>(key)` — JSON parse, fail durumunda `null` döner + console.warn.
 *   - `writeGuest<T>(key, value)` — JSON stringify, AsyncStorage'a set.
 *   - `removeGuest(key)` — anahtarı temizler.
 *   - `clearAllGuestData()` — tüm `@logwise/guest/*` anahtarlarını temizler (migration
 *     success sonrası). `AsyncStorage.getAllKeys()` + filter + multiRemove.
 *
 * ADIM 4 kapsamı:
 *   - GUEST_KEYS + readGuest/writeGuest/removeGuest + clearAllGuestData implementation.
 *   - `mode` anahtarı eklenmiş: `@logwise/guest/mode` = boolean flag (kullanıcının
 *     Welcome'da "Misafir Devam Et" seçtiğini app restart'lar arası hatırlama için).
 *
 * ADIM 5 kapsamı (sonra):
 *   - Bu module'un üzerine `migration.ts` real implementation eklenir.
 *   - `presets-exercises.ts`/`presets-programs.ts` port edilince guest mode tam çalışır.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Anahtar tablosu — §10.5 rev 10
// ============================================================================
// Format: `@logwise/guest/<table_name>`. Sub-key DB tablo ismiyle birebir.
// Versiyon prefix (`v1/`) MVP'de yok; ileride schema kırılırsa eklenir.

export const GUEST_PREFIX = '@logwise/guest/';

export const GUEST_KEYS = {
  mode:          '@logwise/guest/mode',            // 'true' flag — kullanıcı misafir modunda mı
  exercises:     '@logwise/guest/exercises',       // CustomExercise[]
  programs:      '@logwise/guest/programs',        // Program[]
  program_days:  '@logwise/guest/program_days',    // ProgramDay[]
  workouts:      '@logwise/guest/workouts',        // Workout[]
  sets:          '@logwise/guest/sets',            // Set[]
  day_meta:      '@logwise/guest/day_meta',        // DayMeta[]
  profile:       '@logwise/guest/profile',         // { locale, theme, ... }
} as const;

export type GuestKey = (typeof GUEST_KEYS)[keyof typeof GUEST_KEYS];

// ============================================================================
// Read / Write helpers
// ============================================================================

/**
 * AsyncStorage'dan JSON parse ederek tipli değer döner.
 * - Anahtar yoksa: `null`
 * - JSON parse hatası: `null` + console.warn (silent fail — UI patlatma)
 */
export async function readGuest<T>(key: GuestKey | string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn('[guest-storage] readGuest parse fail', key, err);
    return null;
  }
}

/**
 * Değeri JSON stringify ederek AsyncStorage'a yazar.
 * - Stringify hatası (circular ref vs.) → throw eder (geliştirici bug'u, sessiz geçilmez).
 */
export async function writeGuest<T>(key: GuestKey | string, value: T): Promise<void> {
  const raw = JSON.stringify(value);
  await AsyncStorage.setItem(key, raw);
}

/**
 * Tek anahtarı sil. Anahtar yoksa hata olmaz (AsyncStorage idempotent).
 */
export async function removeGuest(key: GuestKey | string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

/**
 * Tüm `@logwise/guest/*` anahtarlarını sil.
 * Migration success sonrası (§3.9.1 adım 7) ve "guest mode'dan çık" akışlarında çağrılır.
 */
export async function clearAllGuestData(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const guestKeys = allKeys.filter((k) => k.startsWith(GUEST_PREFIX));
  if (guestKeys.length > 0) {
    await AsyncStorage.multiRemove(guestKeys);
  }
}

// ============================================================================
// Convenience: guest mode flag
// ============================================================================

/**
 * Kullanıcının misafir modunda olup olmadığını okur (boot sırasında çağrılır).
 */
export async function readGuestModeFlag(): Promise<boolean> {
  const v = await readGuest<boolean>(GUEST_KEYS.mode);
  return v === true;
}

/**
 * Misafir mode flag'ini set eder (`enterGuest()` ile birlikte çağrılır).
 */
export async function writeGuestModeFlag(active: boolean): Promise<void> {
  await writeGuest(GUEST_KEYS.mode, active);
}

// ============================================================================
// Bekleyen migration bayrağı (email doğrulaması AÇIK akışı)
// ============================================================================
// Misafir kullanıcı kayıt olduğunda doğrulama açık olduğu için signUp session
// döndürmez → migration o an yapılamaz. Bu bayrak set edilir; kullanıcı maili
// onaylayıp ilk kez giriş yapınca `(app)/_layout` migration'ı çalıştırır.
// NOT: GUEST_PREFIX dışında bir anahtar → clearAllGuestData onu silmez; açıkça
// `writePendingMigration(false)` ile temizlenir (migration başarılı olunca).

const PENDING_MIGRATION_KEY = '@logwise/pending_migration';

export async function readPendingMigration(): Promise<boolean> {
  const v = await readGuest<boolean>(PENDING_MIGRATION_KEY);
  return v === true;
}

export async function writePendingMigration(active: boolean): Promise<void> {
  await writeGuest(PENDING_MIGRATION_KEY, active);
}

// ============================================================================
// ADIM 5 — Tip iskeleti: misafir tablolari `app_*` Row sekline cok yakin
// ============================================================================
// Misafir tablolari Supabase'e gitmez ama migration sirasinda 1-1 map edilebilmesi
// icin alanlar DB Row tipleriyle ayni (timestamps + nullable kurallari dahil).
// Bu sayede migration kodunda map yapmaya gerek yok — sadece `user_id` enjekte +
// UUID regenerate.

import { uuidv4 } from './uuid';
import type {
  AppExercisesRow,
  AppProgramsRow,
  AppProgramDaysRow,
  AppWorkoutsRow,
  AppSetsRow,
  AppDayMetaRow,
  AppProfilesRow,
  CycleType,
  DayIndex,
  SetType,
  RirValue,
} from '../types/database';

// Misafir Row tipleri = DB Row'larin `user_id` opsiyonel kopyasi.
// Misafir cihaza yazarken user_id 'guest' string'i ile sabittir; migration'da
// gercek auth.uid degeriyle degisir.

export type GuestExerciseRow      = Omit<AppExercisesRow, 'user_id'>      & { user_id: 'guest' };
export type GuestProgramRow       = Omit<AppProgramsRow, 'user_id'>       & { user_id: 'guest' };
export type GuestProgramDayRow    = AppProgramDaysRow;
export type GuestWorkoutRow       = Omit<AppWorkoutsRow, 'user_id'>       & { user_id: 'guest' };
export type GuestSetRow           = AppSetsRow;
export type GuestDayMetaRow       = Omit<AppDayMetaRow, 'user_id'>        & { user_id: 'guest' };
export type GuestProfileRow       = Omit<AppProfilesRow, 'user_id' | 'created_at' | 'updated_at'> & { user_id: 'guest' };

// ============================================================================
// Generic CRUD primitives — readArray + writeArray + mutate helpers
// ============================================================================

async function readArray<T>(key: GuestKey): Promise<T[]> {
  const v = await readGuest<T[]>(key);
  return Array.isArray(v) ? v : [];
}

async function writeArray<T>(key: GuestKey, items: T[]): Promise<void> {
  await writeGuest(key, items);
}

// ============================================================================
// app_exercises — custom egzersizler
// ============================================================================

export async function getGuestExercises(): Promise<GuestExerciseRow[]> {
  return readArray<GuestExerciseRow>(GUEST_KEYS.exercises);
}

export async function addGuestExercise(input: {
  name: string;
  categories?: string[];
  notes?: string;
}): Promise<GuestExerciseRow> {
  const now = new Date().toISOString();
  const row: GuestExerciseRow = {
    id: uuidv4(),
    user_id: 'guest',
    name: input.name,
    categories: input.categories ?? ['Diğer'],
    notes: input.notes ?? '',
    created_at: now,
  };
  const list = await getGuestExercises();
  list.push(row);
  await writeArray(GUEST_KEYS.exercises, list);
  return row;
}

export async function updateGuestExercise(
  id: string,
  patch: Partial<Omit<GuestExerciseRow, 'id' | 'user_id' | 'created_at'>>,
): Promise<GuestExerciseRow | null> {
  const list = await getGuestExercises();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const next: GuestExerciseRow = { ...list[idx]!, ...patch };
  list[idx] = next;
  await writeArray(GUEST_KEYS.exercises, list);
  return next;
}

export async function deleteGuestExercise(id: string): Promise<boolean> {
  const list = await getGuestExercises();
  const next = list.filter((r) => r.id !== id);
  if (next.length === list.length) return false;
  await writeArray(GUEST_KEYS.exercises, next);
  return true;
}

// ============================================================================
// app_programs
// ============================================================================

export async function getGuestPrograms(): Promise<GuestProgramRow[]> {
  return readArray<GuestProgramRow>(GUEST_KEYS.programs);
}

export async function getGuestActiveProgram(): Promise<GuestProgramRow | null> {
  const list = await getGuestPrograms();
  return list.find((p) => p.activated_at !== null) ?? null;
}

export async function addGuestProgram(input: {
  name: string;
  description?: string;
  preset_origin?: string | null;
  cycle_type?: CycleType;
  deload_every?: number | null;
  off_days?: number[];
  activated_at?: string | null;
}): Promise<GuestProgramRow> {
  const now = new Date().toISOString();
  const row: GuestProgramRow = {
    id: uuidv4(),
    user_id: 'guest',
    name: input.name,
    description: input.description ?? '',
    preset_origin: input.preset_origin ?? null,
    cycle_type: input.cycle_type ?? 'weekly',
    deload_every: input.deload_every ?? null,
    off_days: input.off_days ?? [],
    activated_at: input.activated_at ?? null,
    created_at: now,
    updated_at: now,
  };
  const list = await getGuestPrograms();
  list.push(row);
  await writeArray(GUEST_KEYS.programs, list);
  return row;
}

export async function updateGuestProgram(
  id: string,
  patch: Partial<Omit<GuestProgramRow, 'id' | 'user_id' | 'created_at'>>,
): Promise<GuestProgramRow | null> {
  const list = await getGuestPrograms();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const next: GuestProgramRow = {
    ...list[idx]!,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  list[idx] = next;
  await writeArray(GUEST_KEYS.programs, list);
  return next;
}

/** Tek aktif program kurali — diger tum programlari pasif, target'i aktif et. */
export async function activateGuestProgram(id: string): Promise<GuestProgramRow | null> {
  const list = await getGuestPrograms();
  const now = new Date().toISOString();
  let found: GuestProgramRow | null = null;
  const next = list.map((p) => {
    if (p.id === id) {
      const updated: GuestProgramRow = { ...p, activated_at: now, updated_at: now };
      found = updated;
      return updated;
    }
    return p.activated_at !== null
      ? { ...p, activated_at: null, updated_at: now }
      : p;
  });
  if (!found) return null;
  await writeArray(GUEST_KEYS.programs, next);
  return found;
}

export async function deleteGuestProgram(id: string): Promise<boolean> {
  const list = await getGuestPrograms();
  const next = list.filter((r) => r.id !== id);
  if (next.length === list.length) return false;
  await writeArray(GUEST_KEYS.programs, next);
  // Cascade: ilgili program_days satirlarini da temizle.
  const days = await getGuestProgramDays();
  const daysNext = days.filter((d) => d.program_id !== id);
  if (daysNext.length !== days.length) {
    await writeArray(GUEST_KEYS.program_days, daysNext);
  }
  return true;
}

// ============================================================================
// app_program_days
// ============================================================================

export async function getGuestProgramDays(programId?: string): Promise<GuestProgramDayRow[]> {
  const all = await readArray<GuestProgramDayRow>(GUEST_KEYS.program_days);
  return programId ? all.filter((d) => d.program_id === programId) : all;
}

export async function setGuestProgramDays(
  programId: string,
  rows: Array<Omit<GuestProgramDayRow, 'program_id'>>,
): Promise<GuestProgramDayRow[]> {
  // Programa ait tum satirlari sil, yenilerini koy (atomic replace).
  const all = await readArray<GuestProgramDayRow>(GUEST_KEYS.program_days);
  const kept = all.filter((d) => d.program_id !== programId);
  const fresh: GuestProgramDayRow[] = rows.map((r) => ({ ...r, program_id: programId }));
  const next = kept.concat(fresh);
  await writeArray(GUEST_KEYS.program_days, next);
  return fresh;
}

export async function addGuestProgramDayExercise(input: {
  program_id: string;
  day_index: DayIndex;
  exercise_ref: string;
}): Promise<GuestProgramDayRow> {
  const all = await readArray<GuestProgramDayRow>(GUEST_KEYS.program_days);
  const sameDay = all.filter(
    (d) => d.program_id === input.program_id && d.day_index === input.day_index,
  );
  const nextPosition = sameDay.length === 0
    ? 0
    : Math.max(...sameDay.map((d) => d.position)) + 1;
  const row: GuestProgramDayRow = {
    program_id: input.program_id,
    day_index: input.day_index,
    position: nextPosition,
    exercise_ref: input.exercise_ref,
  };
  all.push(row);
  await writeArray(GUEST_KEYS.program_days, all);
  return row;
}

// ============================================================================
// app_workouts
// ============================================================================

export async function getGuestWorkouts(): Promise<GuestWorkoutRow[]> {
  return readArray<GuestWorkoutRow>(GUEST_KEYS.workouts);
}

export async function getGuestWorkoutsByDate(dateISO: string): Promise<GuestWorkoutRow[]> {
  const all = await getGuestWorkouts();
  return all.filter((w) => w.workout_date === dateISO).sort((a, b) => a.position - b.position);
}

export async function getGuestWorkoutsByMonth(year: number, month1to12: number): Promise<GuestWorkoutRow[]> {
  const prefix = `${year.toString().padStart(4, '0')}-${month1to12.toString().padStart(2, '0')}-`;
  const all = await getGuestWorkouts();
  return all.filter((w) => w.workout_date.startsWith(prefix));
}

export async function addGuestWorkout(input: {
  workout_date: string;
  exercise_ref: string;
  position?: number;
  notes?: string;
}): Promise<GuestWorkoutRow> {
  const now = new Date().toISOString();
  const sameDay = await getGuestWorkoutsByDate(input.workout_date);
  const nextPosition = input.position
    ?? (sameDay.length === 0 ? 0 : Math.max(...sameDay.map((w) => w.position)) + 1);
  const row: GuestWorkoutRow = {
    id: uuidv4(),
    user_id: 'guest',
    workout_date: input.workout_date,
    exercise_ref: input.exercise_ref,
    position: nextPosition,
    superset_group: null,
    duration_minutes: null,
    notes: input.notes ?? '',
    created_at: now,
    updated_at: now,
  };
  const all = await getGuestWorkouts();
  all.push(row);
  await writeArray(GUEST_KEYS.workouts, all);
  return row;
}

export async function updateGuestWorkout(
  id: string,
  patch: Partial<Omit<GuestWorkoutRow, 'id' | 'user_id' | 'created_at'>>,
): Promise<GuestWorkoutRow | null> {
  const all = await getGuestWorkouts();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const next: GuestWorkoutRow = {
    ...all[idx]!,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  all[idx] = next;
  await writeArray(GUEST_KEYS.workouts, all);
  return next;
}

export async function deleteGuestWorkout(id: string): Promise<boolean> {
  const all = await getGuestWorkouts();
  const next = all.filter((r) => r.id !== id);
  if (next.length === all.length) return false;
  await writeArray(GUEST_KEYS.workouts, next);
  // Cascade: bu workout'a bagli set'leri sil.
  const sets = await getGuestSets();
  const setsNext = sets.filter((s) => s.workout_id !== id);
  if (setsNext.length !== sets.length) {
    await writeArray(GUEST_KEYS.sets, setsNext);
  }
  return true;
}

// ============================================================================
// app_sets
// ============================================================================

export async function getGuestSets(): Promise<GuestSetRow[]> {
  return readArray<GuestSetRow>(GUEST_KEYS.sets);
}

export async function getGuestSetsByWorkout(workoutId: string): Promise<GuestSetRow[]> {
  const all = await getGuestSets();
  return all
    .filter((s) => s.workout_id === workoutId)
    .sort((a, b) => a.set_index - b.set_index);
}

export async function addGuestSet(input: {
  workout_id: string;
  set_index?: number;
  set_type?: SetType;
  weight?: number | null;
  reps?: number | null;
  rir?: RirValue | null;
}): Promise<GuestSetRow> {
  const same = await getGuestSetsByWorkout(input.workout_id);
  const setIndex = input.set_index ?? (same.length === 0 ? 0 : same[same.length - 1]!.set_index + 1);
  const row: GuestSetRow = {
    id: uuidv4(),
    workout_id: input.workout_id,
    set_index: setIndex,
    set_type: input.set_type ?? 'working',
    weight: input.weight ?? null,
    reps: input.reps ?? null,
    rir: input.rir ?? null,
    created_at: new Date().toISOString(),
  };
  const all = await getGuestSets();
  all.push(row);
  await writeArray(GUEST_KEYS.sets, all);
  return row;
}

export async function updateGuestSet(
  id: string,
  patch: Partial<Omit<GuestSetRow, 'id' | 'workout_id' | 'created_at'>>,
): Promise<GuestSetRow | null> {
  const all = await getGuestSets();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const next: GuestSetRow = { ...all[idx]!, ...patch };
  all[idx] = next;
  await writeArray(GUEST_KEYS.sets, all);
  return next;
}

export async function deleteGuestSet(id: string): Promise<boolean> {
  const all = await getGuestSets();
  const next = all.filter((r) => r.id !== id);
  if (next.length === all.length) return false;
  await writeArray(GUEST_KEYS.sets, next);
  return true;
}

// ============================================================================
// app_day_meta
// ============================================================================

export async function getGuestDayMetas(): Promise<GuestDayMetaRow[]> {
  return readArray<GuestDayMetaRow>(GUEST_KEYS.day_meta);
}

export async function getGuestDayMeta(dateISO: string): Promise<GuestDayMetaRow | null> {
  const all = await getGuestDayMetas();
  return all.find((d) => d.workout_date === dateISO) ?? null;
}

export async function upsertGuestDayMeta(input: {
  workout_date: string;
  day_note?: string;
  total_duration_minutes?: number | null;
  skipped_exercise_ids?: string[];
}): Promise<GuestDayMetaRow> {
  const all = await getGuestDayMetas();
  const idx = all.findIndex((d) => d.workout_date === input.workout_date);
  const now = new Date().toISOString();
  if (idx === -1) {
    const row: GuestDayMetaRow = {
      user_id: 'guest',
      workout_date: input.workout_date,
      day_note: input.day_note ?? '',
      total_duration_minutes: input.total_duration_minutes ?? null,
      skipped_exercise_ids: input.skipped_exercise_ids ?? [],
      created_at: now,
      updated_at: now,
    };
    all.push(row);
    await writeArray(GUEST_KEYS.day_meta, all);
    return row;
  }
  const next: GuestDayMetaRow = {
    ...all[idx]!,
    ...(input.day_note !== undefined ? { day_note: input.day_note } : {}),
    ...(input.total_duration_minutes !== undefined ? { total_duration_minutes: input.total_duration_minutes } : {}),
    ...(input.skipped_exercise_ids !== undefined ? { skipped_exercise_ids: input.skipped_exercise_ids } : {}),
    updated_at: now,
  };
  all[idx] = next;
  await writeArray(GUEST_KEYS.day_meta, all);
  return next;
}

// ============================================================================
// Profile (locale/theme/seen_hint_card vb. — JSON tek satir)
// ============================================================================

export async function getGuestProfile(): Promise<GuestProfileRow | null> {
  return readGuest<GuestProfileRow>(GUEST_KEYS.profile);
}

export async function setGuestProfile(patch: Partial<GuestProfileRow>): Promise<GuestProfileRow> {
  const prev = await getGuestProfile();
  const next: GuestProfileRow = {
    user_id: 'guest',
    username: prev?.username ?? null,
    display_name: prev?.display_name ?? 'Misafir',
    avatar: prev?.avatar ?? '',
    locale: prev?.locale ?? 'tr',
    theme: prev?.theme ?? 'light',
    preferences: prev?.preferences ?? {},
    active_program_id: prev?.active_program_id ?? null,
    ...patch,
  };
  await writeGuest(GUEST_KEYS.profile, next);
  return next;
}
