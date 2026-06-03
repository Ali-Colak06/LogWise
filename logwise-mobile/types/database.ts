/**
 * Supabase Database types — LogWise Mobile (app_ namespace) — KÖPRÜ DOSYASI
 *
 * ADIM 7 (rev 16): Bu dosya artık `database.generated.ts`'in (Supabase MCP /
 * `supabase gen types typescript` çıktısı) üzerine kurulu **köprü**dür. Eski
 * "manuel iskelet" tipler kaldırıldı; tüm Row/Insert/Update tipleri auto-gen
 * `Database` üzerinden `Tables<...>` / `TablesInsert<...>` / `TablesUpdate<...>`
 * yardımcılarıyla türetilir.
 *
 * Uygulama-katmanı semantik union'lar (CycleType / SetType / RirValue / DayIndex)
 * DB CHECK constraint'leriyle eşleşen daraltılmış literal tiplerdir; auto-gen
 * `string` döndürdüğü için bu literal tipleri **explicit cast** ile elde ederiz
 * (`as CycleType`). UI tarafı bu daraltılmış tiplere güvenir; DB sözleşmesi
 * (cycle_type CHECK ('none','weekly','deload') gibi) ihlal edilirse cast hatalı
 * dönmüş olur — DB yazma noktalarında sadece izin verilen değerler kullanılır.
 *
 * Auto-gen'i tekrar üretmek için:
 *   npx supabase gen types typescript \
 *     --project-id czbxujioufhmvoajqwzp \
 *     --schema public \
 *     > types/database.generated.ts
 *
 * Sözleşme (DB ile birebir tutmaya dikkat):
 *   - app_workouts.exercise_ref ve app_program_days.exercise_ref text —
 *     POLYMORPHIC slug | uuid (FK DEĞİL).
 *   - app_sets.rir text in ('F','-','1','2','3','4+').
 *   - app_sets.set_type text in ('working','warmup','drop').
 *   - app_programs.cycle_type text in ('none','weekly','deload').
 *   - app_programs.activated_at null = pasif; tek aktif kuralı uygulama
 *     katmanında (DB partial index destekler).
 *   - app_workouts.superset_group MVP'de NULL kalır.
 *
 * Web tabloları (user_data, profiles, feedback, shared_workouts, vs.)
 * auto-gen'de mevcut ama mobil katmandan kullanılmıyor — sadece app_ aliasları
 * burada export edilir.
 */

import type {
  Database as GeneratedDatabase,
  Tables,
  TablesInsert,
  TablesUpdate,
} from './database.generated';

export type { Json } from './database.generated';
export type Database = GeneratedDatabase;

// ----------------------------------------------------------------
// Enum benzeri literal union'lar — DB CHECK constraint'leriyle eşleşmeli
// ----------------------------------------------------------------

export type CycleType = 'none' | 'weekly' | 'deload';
export type SetType = 'working' | 'warmup' | 'drop';
export type RirValue = 'F' | '-' | '1' | '2' | '3' | '4+';

// Day index 0=Pzt ... 6=Paz (DB: int check (0..6))
export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// ----------------------------------------------------------------
// Row tipleri — auto-gen'den türetilir; literal union'lar override edilir.
// ----------------------------------------------------------------

// Generated raw row aliases (string-typed enum-like alanlarla)
type _AppProfilesRowRaw = Tables<'app_profiles'>;
type _AppExercisesRowRaw = Tables<'app_exercises'>;
type _AppProgramsRowRaw = Tables<'app_programs'>;
type _AppProgramDaysRowRaw = Tables<'app_program_days'>;
type _AppWorkoutsRowRaw = Tables<'app_workouts'>;
type _AppSetsRowRaw = Tables<'app_sets'>;
type _AppDayMetaRowRaw = Tables<'app_day_meta'>;

// Row'larda literal union daraltma + uygulama-katmanı semantik:
// - app_programs.cycle_type: string → CycleType
// - app_program_days.day_index: number → DayIndex
// - app_sets.set_type: string → SetType, rir: string|null → RirValue|null

export type AppProfilesRow = _AppProfilesRowRaw;
export type AppExercisesRow = _AppExercisesRowRaw;

export type AppProgramsRow = Omit<_AppProgramsRowRaw, 'cycle_type'> & {
  cycle_type: CycleType;
};

export type AppProgramDaysRow = Omit<_AppProgramDaysRowRaw, 'day_index'> & {
  day_index: DayIndex;
};

export type AppWorkoutsRow = _AppWorkoutsRowRaw;

export type AppSetsRow = Omit<_AppSetsRowRaw, 'set_type' | 'rir'> & {
  set_type: SetType;
  rir: RirValue | null;
};

export type AppDayMetaRow = _AppDayMetaRowRaw;

// ----------------------------------------------------------------
// Insert tipleri — auto-gen'den; literal alanlar opsiyonel olarak daraltılır
// ----------------------------------------------------------------

type _AppProfilesInsertRaw = TablesInsert<'app_profiles'>;
type _AppExercisesInsertRaw = TablesInsert<'app_exercises'>;
type _AppProgramsInsertRaw = TablesInsert<'app_programs'>;
type _AppProgramDaysInsertRaw = TablesInsert<'app_program_days'>;
type _AppWorkoutsInsertRaw = TablesInsert<'app_workouts'>;
type _AppSetsInsertRaw = TablesInsert<'app_sets'>;
type _AppDayMetaInsertRaw = TablesInsert<'app_day_meta'>;

export type AppProfilesInsert = _AppProfilesInsertRaw;
export type AppExercisesInsert = _AppExercisesInsertRaw;

export type AppProgramsInsert = Omit<_AppProgramsInsertRaw, 'cycle_type'> & {
  cycle_type?: CycleType;
};

export type AppProgramDaysInsert = Omit<_AppProgramDaysInsertRaw, 'day_index'> & {
  day_index: DayIndex;
};

export type AppWorkoutsInsert = _AppWorkoutsInsertRaw;

export type AppSetsInsert = Omit<_AppSetsInsertRaw, 'set_type' | 'rir'> & {
  set_type?: SetType;
  rir?: RirValue | null;
};

export type AppDayMetaInsert = _AppDayMetaInsertRaw;

// ----------------------------------------------------------------
// Update tipleri — Partial(Insert) eski sözleşme; auto-gen TablesUpdate de aynı
// ----------------------------------------------------------------

export type AppProfilesUpdate = TablesUpdate<'app_profiles'>;
export type AppExercisesUpdate = TablesUpdate<'app_exercises'>;
export type AppProgramsUpdate = Omit<TablesUpdate<'app_programs'>, 'cycle_type'> & {
  cycle_type?: CycleType;
};
export type AppProgramDaysUpdate = Omit<TablesUpdate<'app_program_days'>, 'day_index'> & {
  day_index?: DayIndex;
};
export type AppWorkoutsUpdate = TablesUpdate<'app_workouts'>;
export type AppSetsUpdate = Omit<TablesUpdate<'app_sets'>, 'set_type' | 'rir'> & {
  set_type?: SetType;
  rir?: RirValue | null;
};
export type AppDayMetaUpdate = TablesUpdate<'app_day_meta'>;
