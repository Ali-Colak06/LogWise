/**
 * exercise-resolve — Polymorphic exercise_ref → görünür ad + kategori (ADIM 6).
 *
 * §4.3: `exercise_ref` slug (preset) VEYA UUID (custom). UI'da her iki kaynaktan
 * çözülmeli. Custom egzersiz silinmişse (soft reference — rev 13) fallback display.
 *
 * CategoryKey = theme `colors.category` token anahtarı (chest/back/...). Preset/custom
 * Türkçe kategori adları buraya map'lenir (accent bar + chip renkleri için).
 */
import {
  getPresetExerciseBySlug,
  getPresetDisplayName,
  isPresetSlug,
} from '../data/presets-exercises';
import type { AppExercisesRow } from '../types/database';

export type CategoryKey =
  | 'chest' | 'back' | 'shoulder' | 'biceps' | 'triceps'
  | 'leg' | 'core' | 'cardio' | 'other';

/** Türkçe kategori adı → theme CategoryKey. */
export function turkishCatToKey(cat: string): CategoryKey {
  switch (cat) {
    case 'Göğüs': return 'chest';
    case 'Sırt': return 'back';
    case 'Omuz':
    case 'Trapez':
      return 'shoulder';
    case 'Biceps': return 'biceps';
    case 'Triceps': return 'triceps';
    case 'Bacak':
    case 'Kalça':
    case 'Kalf':
      return 'leg';
    case 'Karın': return 'core';
    case 'Kardiyo': return 'cardio';
    default: return 'other';
  }
}

export interface ResolvedExercise {
  ref: string;
  name: string;
  categories: CategoryKey[];   // primary = [0]
  rawCategories: string[];     // orijinal TR adlar (chip etiketi için)
  isPreset: boolean;
  isMissing: boolean;          // soft-ref resolve fail
  notes?: string;
}

/**
 * Bir ref'i çöz. `customById` = app_exercises map (UUID → row).
 */
export function resolveExerciseRef(
  ref: string,
  customById: Map<string, AppExercisesRow>,
  locale: 'tr' | 'en' = 'tr',
): ResolvedExercise {
  if (isPresetSlug(ref)) {
    const preset = getPresetExerciseBySlug(ref);
    if (preset) {
      const cats = preset.categories.map((c) => turkishCatToKey(c));
      return {
        ref,
        name: getPresetDisplayName(ref, locale),
        categories: cats.length > 0 ? cats : ['other'],
        rawCategories: preset.categories,
        isPreset: true,
        isMissing: false,
      };
    }
    // Bilinmeyen slug (eski/rename) → fallback
    return {
      ref,
      name: `(${ref})`,
      categories: ['other'],
      rawCategories: ['Diğer'],
      isPreset: true,
      isMissing: true,
    };
  }
  // UUID → custom
  const custom = customById.get(ref);
  if (custom) {
    const cats = (custom.categories ?? []).map((c) => turkishCatToKey(c));
    return {
      ref,
      name: custom.name,
      categories: cats.length > 0 ? cats : ['other'],
      rawCategories: custom.categories ?? ['Diğer'],
      isPreset: false,
      isMissing: false,
      notes: custom.notes || undefined,
    };
  }
  // Custom silinmiş (soft reference — rev 13)
  return {
    ref,
    name: '(silinmiş egzersiz)',
    categories: ['other'],
    rawCategories: ['Diğer'],
    isPreset: false,
    isMissing: true,
  };
}

export function buildCustomMap(rows: AppExercisesRow[]): Map<string, AppExercisesRow> {
  const m = new Map<string, AppExercisesRow>();
  for (const r of rows) m.set(r.id, r);
  return m;
}
