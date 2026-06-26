/**
 * LogWise Mobile — Preset (Hazır) Hareket Listesi (wrapper).
 *
 * Veri artık `data/presets-exercises.json` kanonik kaynağından codegen ile üretilir
 * → `generated/presets-exercises.ts`. Bu dosya: tip + üretilmiş veriyi re-export eder
 * ve helper'ları (codegen DIŞI) barındırır. Tüm mevcut
 * `import ... from '../data/presets-exercises'` çağrıları DEĞİŞMEDEN çalışır.
 */
export type { PresetCategory, PresetExercise } from './presets-exercises.types';
import type { PresetExercise } from './presets-exercises.types';
import { PRESET_EXERCISES } from './generated/presets-exercises';

export { PRESET_EXERCISES };

// ---------- Helper'lar ----------

/**
 * Slug → PresetExercise lookup. Bulunamazsa `undefined`.
 * Hot path için `Map` cache (5 + ms tasarruf).
 */
let _slugMap: Map<string, PresetExercise> | null = null;
function _buildSlugMap(): Map<string, PresetExercise> {
  if (_slugMap) return _slugMap;
  _slugMap = new Map();
  for (const ex of PRESET_EXERCISES) _slugMap.set(ex.id, ex);
  return _slugMap;
}

export function getPresetExerciseBySlug(slug: string): PresetExercise | undefined {
  return _buildSlugMap().get(slug);
}

/**
 * Bir slug için locale'e göre display name döner. Preset değilse `slug` kendisi.
 */
export function getPresetDisplayName(slug: string, locale: 'tr' | 'en' = 'tr'): string {
  const ex = getPresetExerciseBySlug(slug);
  if (!ex) return slug;
  if (locale === 'en') return ex.nameEN ?? ex.name;
  return ex.name;
}

/**
 * Slug formatına benziyor mu? (kebab-case + en az 1 tire içeren)
 * UUID'den ayırt etmek için kullanılır (§4.3 polymorphic ref).
 * UUID: 8-4-4-4-12 hex (içinde tire VAR ama 36 char tam uzunluk).
 */
export function isPresetSlug(ref: string): boolean {
  // UUID: 36 char, tireler 8,13,18,23. Diğer her şey slug sayılır.
  if (ref.length === 36 && /^[0-9a-f-]+$/i.test(ref) &&
      ref[8] === '-' && ref[13] === '-' && ref[18] === '-' && ref[23] === '-') {
    return false;
  }
  return /^[a-z0-9-]+$/.test(ref);
}
