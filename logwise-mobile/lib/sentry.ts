/**
 * Sentry crash-only integration — LogWise Mobile (ADIM 7)
 *
 * Karar kaynağı: 03-mvp-decisions.md §10.1 — Sentry crash-only (perf tracing kapalı,
 * breadcrumb minimal, beforeSend ile dev build'lerde event drop). PII gönderilmez.
 *
 * DSN kaynağı: app.json -> expo.extra.sentryDsn. Boş ise Sentry **hiç başlatılmaz**
 * (no-op) — geliştirme akışını bloklamaz. Production build'de değer atanır.
 *
 * Paket: `@sentry/react-native`. ADIM 7 itibarıyla yüklü DEĞİL — kullanıcı kursun:
 *   npx expo install @sentry/react-native
 * (Expo prebuild gerekirse `eas build` akışı sırasında otomatik native link yapılır.)
 *
 * Paket yokken bu modül tip güvenli no-op davranır (require sarmalı + try/catch).
 */

import Constants from 'expo-constants';

let initialized = false;

interface SentryExtras {
  sentryDsn?: string;
}

function readDsn(): string | null {
  const fromExpoConfig = (Constants.expoConfig?.extra ?? {}) as SentryExtras;
  const fromManifest = ((Constants.manifest as { extra?: SentryExtras } | null)?.extra ??
    {}) as SentryExtras;
  const dsn = fromExpoConfig.sentryDsn ?? fromManifest.sentryDsn ?? '';
  return dsn.trim().length > 0 ? dsn.trim() : null;
}

/**
 * Init Sentry — idempotent. Çağrı sırası: `app/_layout.tsx` en üstte (provider'lardan
 * önce). DSN boşsa veya `@sentry/react-native` yoksa no-op.
 */
export function initSentry(): void {
  if (initialized) return;
  const dsn = readDsn();
  if (!dsn) {
    // DSN yok — sessiz no-op (dev modu için normal).
    return;
  }

  try {
    // Dinamik require: paket yoksa burada throw eder ve aşağıdaki catch yutar.
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/react-native') as {
      init: (opts: SentryInitOptions) => void;
      captureException?: (e: unknown) => void;
    };

    Sentry.init({
      dsn,
      // Crash-only: performance/transaction tracing kapalı.
      tracesSampleRate: 0,
      // Otomatik breadcrumb minimal — XHR/console kapatılmaz (default), debug log değil.
      enableAutoSessionTracking: false,
      // Native crash + JS error yakalansın yeter.
      enableNative: true,
      enableNativeCrashHandling: true,
      // PII: e-mail / IP / kullanıcı adı gönderme.
      sendDefaultPii: false,
      attachStacktrace: true,
      // Dev build'de event drop. __DEV__ true ise return null.
      beforeSend(event) {
        if (__DEV__) return null;
        return event;
      },
    });

    initialized = true;
  } catch {
    // @sentry/react-native yüklü değil veya import patladı — sessiz no-op.
    // Bu durumda crash raporu gönderilmez; uygulama normal akışına devam eder.
  }
}

/**
 * Manuel hata gönder — crash dışında bir yerden çağırmak isterseniz.
 * Init edilmemişse no-op.
 */
export function captureException(err: unknown): void {
  if (!initialized) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/react-native') as {
      captureException?: (e: unknown) => void;
    };
    Sentry.captureException?.(err);
  } catch {
    /* no-op */
  }
}

// ----------------------------------------------------------------
// Sentry init options — @sentry/react-native'in beklediği şekille
// uyumlu (paket yüklü değil; biz tipi minimal tutuyoruz).
// ----------------------------------------------------------------

interface SentryInitOptions {
  dsn: string;
  tracesSampleRate?: number;
  enableAutoSessionTracking?: boolean;
  enableNative?: boolean;
  enableNativeCrashHandling?: boolean;
  sendDefaultPii?: boolean;
  attachStacktrace?: boolean;
  beforeSend?: (event: unknown) => unknown | null;
}
