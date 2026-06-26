/**
 * presets-exercises.types — Preset hareket tip tanımları (codegen DIŞI).
 *
 * Veri (`PRESET_EXERCISES`) `generated/presets-exercises.ts`'te codegen ile üretilir
 * ve bu tipleri kullanır; helper'lar `presets-exercises.ts` wrapper'ında.
 */

export type PresetCategory =
  | 'Göğüs' | 'Omuz' | 'Triceps' | 'Biceps' | 'Bilek'
  | 'Sırt' | 'Bacak' | 'Kalça' | 'Kalf' | 'Trapez'
  | 'Karın' | 'Kardiyo';

export interface PresetExercise {
  /** Slug id (kebab-case). `app_workouts.exercise_ref`'te bu kullanılır. */
  id: string;
  /** Türkçe ad (varsayılan UI display). */
  name: string;
  /** İngilizce ad — yoksa `name` aynı (TR ad zaten İngilizce dahi olabilir). */
  nameEN?: string;
  /** 1+ kategori. İlk kategori chip rengi olarak kullanılır. */
  categories: PresetCategory[];
}
