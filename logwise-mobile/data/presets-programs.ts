/**
 * LogWise Mobile — Hazır Program Şablonları (ADIM 5).
 *
 * Web `data/presets-programs.js` port. 4 program; her gün dizisi `presets-exercises`
 * slug'larına referans verir.
 *
 * Günler: 0=Pzt, 1=Sal, 2=Çar, 3=Per, 4=Cum, 5=Cmt, 6=Paz (DB `day_index` ile aynı).
 *
 * Kullanım: PresetProgramModal'da gösterilir → kullanıcı seçince `app_programs` +
 * `app_program_days` tablolarına kopyalanır (§3.8: kopyala + hemen aktif et).
 * `app_programs.preset_origin` alanı `slug` olarak yazılır (slug = name'den türeyen
 * kebab-case; örn "push-pull-legs-ppl" — opsiyonel, MVP'de string id yeterli).
 */
import { isPresetSlug } from './presets-exercises';

export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface PresetProgram {
  /** Stabil slug — `app_programs.preset_origin` alanına yazılır. */
  slug: string;
  /** Türkçe ad (varsayılan UI display). */
  name: string;
  nameEN: string;
  desc: string;
  descEN: string;
  /** day_index → exercise slug listesi. Boş array = off-day. */
  days: Record<'0' | '1' | '2' | '3' | '4' | '5' | '6', string[]>;
}

export const PRESET_PROGRAMS: PresetProgram[] = [
  {
    slug: 'push-pull-legs-ppl',
    name: 'Push Pull Legs (PPL)',
    nameEN: 'Push Pull Legs (PPL)',
    desc: 'Haftada 6 gün, push/pull/legs döngüsü. Orta-ileri seviye.',
    descEN: '6 days/week push/pull/legs. Intermediate-advanced.',
    days: {
      '0': ['bench-press', 'overhead-press', 'lateral-raise', 'triceps-pushdown', 'cable-crossover'],
      '1': ['barbell-row', 'lat-pulldown', 'cable-row', 'biceps-curl', 'rear-delt-fly'],
      '2': ['squat', 'leg-press', 'leg-curl', 'leg-extension', 'calf-raise'],
      '3': ['dumbell-press', 'shoulder-press', 'dumbell-fly', 'overhead-triceps-extension'],
      '4': ['deadlift', 'pull-up', 'dumbell-row', 'hammer-curl', 'shrug'],
      '5': ['leg-press', 'lunge', 'hip-thrust', 'leg-curl', 'calf-raise'],
      '6': [],
    },
  },
  {
    slug: 'upper-lower-split',
    name: 'Üst / Alt Bölünme',
    nameEN: 'Upper / Lower Split',
    desc: 'Haftada 4 gün, üst ve alt vücut dönüşümlü. Orta seviye.',
    descEN: '4 days/week upper/lower alternating. Intermediate.',
    days: {
      '0': ['bench-press', 'barbell-row', 'overhead-press', 'biceps-curl', 'triceps-pushdown'],
      '1': ['squat', 'deadlift', 'leg-press', 'leg-curl', 'calf-raise'],
      '2': [],
      '3': ['dumbell-press', 'lat-pulldown', 'lateral-raise', 'hammer-curl', 'skull-crusher'],
      '4': ['leg-press', 'lunge', 'hip-thrust', 'leg-extension', 'calf-raise'],
      '5': [],
      '6': [],
    },
  },
  {
    slug: 'full-body',
    name: 'Full Body',
    nameEN: 'Full Body',
    desc: 'Haftada 3 gün, tüm vücut. Yeni başlayanlar için ideal.',
    descEN: '3 days/week full body. Ideal for beginners.',
    days: {
      '0': ['bench-press', 'barbell-row', 'squat', 'overhead-press', 'biceps-curl'],
      '1': [],
      '2': ['deadlift', 'dumbell-press', 'lat-pulldown', 'leg-press', 'triceps-pushdown'],
      '3': [],
      '4': ['squat', 'cable-row', 'shoulder-press', 'leg-curl', 'hammer-curl'],
      '5': [],
      '6': [],
    },
  },
  {
    slug: 'bro-split-5d',
    name: 'Bro Split (5 Gün)',
    nameEN: 'Bro Split (5 Days)',
    desc: 'Her gün farklı kas grubu. Klasik bölünme.',
    descEN: 'Each day different muscle group. Classic split.',
    days: {
      '0': ['bench-press', 'incline-dumbell-press', 'cable-crossover', 'dumbell-fly'],
      '1': ['barbell-row', 'lat-pulldown', 'cable-row', 'dumbell-row', 'shrug'],
      '2': ['overhead-press', 'lateral-raise', 'front-raise', 'rear-delt-fly'],
      '3': ['biceps-curl', 'hammer-curl', 'preacher-curl', 'triceps-pushdown', 'skull-crusher'],
      '4': ['squat', 'leg-press', 'leg-curl', 'leg-extension', 'calf-raise'],
      '5': [],
      '6': [],
    },
  },
];

/**
 * Off-day index'lerini hesapla: o günkü array boşsa off.
 * Programı `app_programs.off_days` alanına yazarken bu kullanılır.
 */
export function computeOffDays(program: PresetProgram): DayIndex[] {
  const off: DayIndex[] = [];
  const order: DayIndex[] = [0, 1, 2, 3, 4, 5, 6];
  for (const idx of order) {
    const key = String(idx) as '0' | '1' | '2' | '3' | '4' | '5' | '6';
    if (program.days[key].length === 0) off.push(idx);
  }
  return off;
}

/** Slug → preset lookup. */
export function getPresetProgramBySlug(slug: string): PresetProgram | undefined {
  return PRESET_PROGRAMS.find((p) => p.slug === slug);
}

/**
 * Tüm exercise_ref'lerin geçerli slug olduğunu doğrular (development sanity check).
 * Pure helper; runtime'da çağrılmaz.
 */
export function validatePresetProgramRefs(program: PresetProgram): { ok: boolean; bad: string[] } {
  const bad: string[] = [];
  for (const refs of Object.values(program.days)) {
    for (const ref of refs) {
      if (!isPresetSlug(ref)) bad.push(ref);
    }
  }
  return { ok: bad.length === 0, bad };
}
