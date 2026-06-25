/**
 * LogWise Mobile — i18n
 *
 * Tek API: `t('namespace.key', vars?)`. Dil store'u (`useLocaleStore`) ile aktif
 * lokalize seçilir.
 *
 * Davranış:
 *   - `t('exercise.add')` → "Hareket Ekle" (TR aktifse) / "Add Exercise" (EN)
 *   - `t('comments.showReplies', { n: 3 })` → "3 yanıtı göster"
 *   - Eksik anahtar → EN fallback → console.warn → anahtar string'i döner (UI patlamaz)
 *   - Array değerler (days/months/cats): `t('days')` dize **yerine** dizi döner
 *     — `useTranslations().days` (raw access) çağırılır, `t()` arrays döndürmez
 *     (string tip imzasına uymadığı için). Aşağıda `getArray()` helper'ı.
 *
 * Locale algılaması (ilk mount):
 *   - `expo-localization` ile cihaz dili tespit edilir.
 *   - Cihaz dili `tr-*` → TR, aksi halde EN.
 *   - Kullanıcı `setLocale()` ile değiştirebilir (persist ADIM 4'te).
 */
import { create } from 'zustand';
import * as Localization from 'expo-localization';
import { tr } from '../data/i18n-tr';
import { en } from '../data/i18n-en';
import type { Locale, Translations } from '../data/i18n-types';

// ============================================================================
// Dictionary registry
// ============================================================================

const dictionaries: Record<Locale, Translations> = { tr, en };

// ============================================================================
// Locale store
// ============================================================================

export interface LocaleStoreState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

/**
 * Cihaz dilinden ilk locale'i belirler. `Localization.getLocales()` API'si
 * SDK 49+'da array döner; ilk öğenin `languageCode`'u kontrol edilir.
 */
function detectInitialLocale(): Locale {
  try {
    const locales = Localization.getLocales();
    const first = locales[0];
    const code = first?.languageCode ?? '';
    return code === 'tr' ? 'tr' : 'en';
  } catch {
    return 'en';
  }
}

export const useLocaleStore = create<LocaleStoreState>((set) => ({
  locale: detectInitialLocale(),
  setLocale: (locale) => set({ locale }),
}));

// ============================================================================
// Dot-path key types — type-safe `t()` çağrıları
// ============================================================================

// Iç içe objelerden dot-path string union'ı üretir (yapraklar = leaf string'leri).
// `t('exercise.add')` derlenir, `t('exercise.invalid')` derlenmez.
type PathOf<T> = T extends string
  ? ''
  : T extends readonly unknown[]
    ? ''
    : {
        [K in keyof T & string]: PathOf<T[K]> extends '' ? K : `${K}.${PathOf<T[K]>}`;
      }[keyof T & string];

export type TranslationKey = PathOf<Translations>;

// ============================================================================
// Resolve + interpolate
// ============================================================================

/**
 * Verilen dot-path'i sözlükte resolve eder. Bulamazsa `undefined` döner.
 */
function resolve(dict: unknown, path: string): unknown {
  const parts = path.split('.');
  let cursor: unknown = dict;
  for (const part of parts) {
    if (cursor === null || cursor === undefined) return undefined;
    if (typeof cursor !== 'object') return undefined;
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return cursor;
}

/**
 * `"Merhaba, {name}"` + `{ name: 'Ali' }` → `"Merhaba, Ali"`
 * Eşleşmeyen placeholder'lar olduğu gibi kalır.
 */
function interpolate(template: string, vars: Record<string, string | number> | undefined): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key];
    return value === undefined ? match : String(value);
  });
}

// ============================================================================
// t() — ana API
// ============================================================================

export interface TOptions {
  /** Override locale (test/debug için) */
  locale?: Locale;
  /** Interpolation değişkenleri */
  vars?: Record<string, string | number>;
}

/**
 * `t('exercise.add')` veya `t('comments.showReplies', { vars: { n: 3 } })`
 *
 * Açıklama: Bu fonksiyon `useLocaleStore.getState()` çağırarak hook olmadan
 * çalışır — module-level çağrılarda da güvenli. Locale değişiminde re-render
 * için React component'lar `useT()` (hook varyantı) kullanmalı.
 */
export function t(key: TranslationKey, options?: TOptions): string;
export function t(key: string, options?: TOptions): string;
export function t(key: string, options?: TOptions): string {
  const locale = options?.locale ?? useLocaleStore.getState().locale;
  const primary = dictionaries[locale];
  let resolved = resolve(primary, key);

  // Fallback → EN
  if (typeof resolved !== 'string') {
    if (locale !== 'en') {
      const fallback = resolve(dictionaries.en, key);
      if (typeof fallback === 'string') {
        return interpolate(fallback, options?.vars);
      }
    }
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(`[i18n] missing key: "${key}" (locale: ${locale})`);
    }
    return key;
  }

  return interpolate(resolved, options?.vars);
}

// ============================================================================
// React hook — re-render on locale change
// ============================================================================

/**
 * useT() — locale değişiminde re-render'lı `t()`. UI'da bu hook tercih edilir;
 * locale değiştiğinde otomatik yeniden çevirir.
 *
 * Kullanım:
 *   const t = useT();
 *   return <Text>{t('exercise.add')}</Text>;
 */
export function useT(): (key: TranslationKey, options?: TOptions) => string {
  const locale = useLocaleStore((s) => s.locale);
  return (key, options) => t(key as string, { ...options, locale: options?.locale ?? locale });
}

/**
 * useTranslations() — aktif locale için tüm sözlük objesini döner.
 * Array alanlara (`days`, `months`, `cats`) erişmek için gerekir.
 *
 *   const dict = useTranslations();
 *   const dayName = dict.daysFull[weekday];
 */
export function useTranslations(): Translations {
  const locale = useLocaleStore((s) => s.locale);
  return dictionaries[locale];
}

// ============================================================================
// Helpers — array erişimi (t() string döner, array için bu kullanılır)
// ============================================================================

/**
 * `getArray('days')` → ['Pzt', 'Sal', ...] aktif locale'de.
 * Type-safe değil (TS array path desteklemiyor); runtime kontrol var.
 */
export function getArray(
  key: 'days' | 'daysFull' | 'months' | 'cats',
  locale?: Locale,
): readonly string[] {
  const loc = locale ?? useLocaleStore.getState().locale;
  return dictionaries[loc][key];
}

// Re-exports
export type { Locale, Translations } from '../data/i18n-types';
