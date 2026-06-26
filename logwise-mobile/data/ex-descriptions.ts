/**
 * LogWise Mobile — Hareket Kısa Açıklamaları (wrapper).
 *
 * `EX_DESCS` artık kanonik data/ex-guides.json → generated/ex-content.ts
 * projection'ından (`summary`) türetilir. Eski elle-port emekliye ayrıldı; public
 * API (EX_DESCS, ExDescription) DEĞİŞMEDEN korunur.
 *
 * Kullanım: ExPreviewModal'da uzun açıklama yoksa fallback; Day Detail kartlarında
 * "ne yapar?" mini tooltipi. Custom egzersizlerde karşılık yok → fallback `''` veya
 * `app_exercises.notes`.
 */
import { EX_CONTENT } from './generated/ex-content';

export type ExDescription = readonly [tr: string, en: string];

export const EX_DESCS: Readonly<Record<string, ExDescription>> = Object.fromEntries(
  Object.entries(EX_CONTENT).map(([slug, c]): [string, ExDescription] => [slug, c.summary]),
);

/**
 * Locale-aware lookup. Slug bulunamazsa boş string döner.
 */
export function getExDesc(slug: string, locale: 'tr' | 'en' = 'tr'): string {
  const entry = EX_DESCS[slug];
  if (!entry) return '';
  return locale === 'en' ? entry[1] : entry[0];
}
