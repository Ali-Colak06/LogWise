/**
 * LogWise Mobile — Hareket Önizleme (Gif + Uzun Açıklama + İpucu) (wrapper).
 *
 * `EX_PREVIEW` artık kanonik data/ex-guides.json → generated/ex-content.ts
 * projection'ından türetilir (desc=description, tips, gif). Eski elle-port emekliye
 * ayrıldı; public API (EX_PREVIEW, ExPreview) DEĞİŞMEDEN korunur.
 *
 * Kullanım: ExPreviewModal (D1 / C2-C4 ortak component). gif MVP'de hep null →
 * UI yer tutucu gösterir ve `previewImgSoon` i18n stringi ile bilgilendirir.
 */
import { EX_CONTENT } from './generated/ex-content';

export interface ExPreview {
  /** Animasyon URL'si veya null (MVP'de hep null). */
  gif: string | null;
  /** [TR uzun açıklama, EN uzun açıklama] */
  desc: readonly [tr: string, en: string];
  /** [[TR ipucu, EN ipucu], ...] */
  tips: ReadonlyArray<readonly [tr: string, en: string]>;
}

export const EX_PREVIEW: Readonly<Record<string, ExPreview>> = Object.fromEntries(
  Object.entries(EX_CONTENT).map(([slug, c]): [string, ExPreview] => [
    slug,
    { gif: c.gif, desc: c.description, tips: c.tips },
  ]),
);

export function getExPreview(slug: string): ExPreview | null {
  return EX_PREVIEW[slug] ?? null;
}
