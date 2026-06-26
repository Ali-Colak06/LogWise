/**
 * ex-content.types — Mobil egzersiz içeriği projection tipi (codegen DIŞI).
 *
 * Veri `generated/ex-content.ts`'te codegen ile kanonik data/ex-guides.json'dan
 * üretilir (ince projection). `ex-descriptions.ts` (EX_DESCS) ve `ex-preview.ts`
 * (EX_PREVIEW) wrapper'ları bu projection'dan türetilir.
 */
export interface ExContent {
  /** Kısa açıklama [TR, EN] — kanonik `summary`. */
  summary: readonly [tr: string, en: string];
  /** Uzun açıklama [TR, EN] — kanonik `description`. */
  description: readonly [tr: string, en: string];
  /** İpuçları [[TR, EN], ...] — kanonik `tips`. */
  tips: ReadonlyArray<readonly [tr: string, en: string]>;
  /** Animasyon URL'si veya null (kanonik media.demoMp4/demoWebm; MVP'de null). */
  gif: string | null;
  /** Web rehber sayfası URL'si — kanonik `webGuideUrl`. */
  webGuideUrl: string;
}
