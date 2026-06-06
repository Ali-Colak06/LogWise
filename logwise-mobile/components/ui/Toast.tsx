/**
 * Toast — basit overlay notification (ADIM 4).
 *
 * Tasarım:
 *   - `<ToastProvider>` root layout'a mount edilir (app/_layout.tsx).
 *   - `useToast()` hook'u `show({ message, variant?, durationMs? })` API'sini döner.
 *   - Toast ekranın alt kısmında 3 sn (default) görünür, sonra kaybolur.
 *   - Variant: 'primary' | 'success' | 'danger' | 'info'.
 *
 * Erişilebilirlik:
 *   - `accessibilityLiveRegion="polite"` ile ekran okuyucu duyurur.
 *   - Manuel dismiss yok (3 sn'lik kısa süre — kullanıcı dokunmaz). İleride
 *     `Pressable + onDismiss` eklenebilir.
 *
 * Animasyon:
 *   - MVP'de basit Animated.timing fade in/out (Reanimated kullanmıyoruz; native
 *     Animated yeterli).
 *
 * Sınır:
 *   - Aynı anda 1 toast — yeni toast eskisini değiştirir (queue yok).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import Text from './Text';

export type ToastVariant = 'primary' | 'success' | 'danger' | 'info';

export interface ToastOptions {
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastState extends Required<Omit<ToastOptions, 'durationMs'>> {
  durationMs: number;
  id: number;
}

interface ToastContextValue {
  show: (opts: ToastOptions) => void;
  hide: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Toast'ın o anki render state'i (mesaj + opacity). `ToastOutlet` bunu okuyup,
 * RN <Modal> kullanan bileşenlerin (AppBottomSheet vb.) KENDİ native window'u
 * içinde toast'ı tekrar render eder — böylece toast açık sheet'in üstünde görünür
 * (root ağaçtaki overlay zIndex ile ayrı native window'un üstüne çıkamaz).
 */
interface ToastRenderValue {
  toast: ToastState | null;
  opacity: Animated.Value;
}
const ToastRenderContext = createContext<ToastRenderValue | null>(null);

const DEFAULT_DURATION = 3000;
const FADE_DURATION = 200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const counter = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_DURATION,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [opacity]);

  const show = useCallback(
    (opts: ToastOptions) => {
      counter.current += 1;
      const next: ToastState = {
        id: counter.current,
        message: opts.message,
        variant: opts.variant ?? 'primary',
        durationMs: opts.durationMs ?? DEFAULT_DURATION,
      };
      setToast(next);

      if (hideTimer.current) clearTimeout(hideTimer.current);

      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start();

      hideTimer.current = setTimeout(() => {
        hide();
      }, next.durationMs);
    },
    [opacity, hide],
  );

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show, hide }), [show, hide]);
  const renderValue = useMemo<ToastRenderValue>(() => ({ toast, opacity }), [toast, opacity]);

  return (
    <ToastContext.Provider value={value}>
      <ToastRenderContext.Provider value={renderValue}>
        {children}
        {/* Root toast — normal (Modal'sız) ekranlar için. */}
        {toast ? <ToastView toast={toast} opacity={opacity} /> : null}
      </ToastRenderContext.Provider>
    </ToastContext.Provider>
  );
}

interface ToastViewProps {
  toast: ToastState;
  opacity: Animated.Value;
}

function ToastView({ toast, opacity }: ToastViewProps) {
  const { colors, tokens } = useTheme();

  // Variant -> bg + border + text
  let bg: string;
  let borderColor: string;
  switch (toast.variant) {
    case 'success':
      bg = colors.semantic.successMuted;
      borderColor = colors.semantic.success;
      break;
    case 'danger':
      bg = colors.semantic.dangerMuted;
      borderColor = colors.semantic.danger;
      break;
    case 'info':
      bg = colors.semantic.infoMuted;
      borderColor = colors.semantic.info;
      break;
    case 'primary':
    default:
      bg = colors.background.elevated;
      borderColor = colors.border.subtle;
      break;
  }

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.container,
        {
          opacity,
          bottom: 32 + tokens.layout.bottomTabHeight,
          paddingHorizontal: tokens.space.lg,
          paddingVertical: tokens.space.md,
          borderRadius: tokens.radius.md,
          backgroundColor: bg,
          borderColor,
          borderWidth: 1,
          ...tokens.shadows.dark.modal,
        },
      ]}
    >
      <Text variant="body" color="primary" align="center">
        {toast.message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 60,
  },
});

/**
 * ToastOutlet — RN <Modal> kullanan bileşenlerin (AppBottomSheet) modal ağacına
 * yerleştirilir. Aktif toast'ı, sheet ile AYNI native window içinde render eder →
 * toast sheet içeriğinin üstünde görünür. `ToastView` pointerEvents="none"
 * olduğundan dokunmaları yutmaz (sheet kullanılabilir kalır). Provider yoksa /
 * toast yoksa hiçbir şey çizmez.
 */
export function ToastOutlet() {
  const render = useContext(ToastRenderContext);
  if (!render || !render.toast) return null;
  return <ToastView toast={render.toast} opacity={render.opacity} />;
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (ctx) return ctx;
  // Fail-safe: provider yoksa no-op (geliştirici sürprizi yok)
  return {
    show: (opts) => console.warn('[Toast] provider yok:', opts.message),
    hide: () => undefined,
  };
}
