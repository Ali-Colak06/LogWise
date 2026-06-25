/**
 * Theme store — Zustand
 *
 * Tek sorumluluk: kullanıcının seçtiği tema modunu (system/light/dark) tutar
 * ve `setMode()` ile değiştirir. `Appearance.getColorScheme()`'in dinlenmesi
 * `theme/index.ts` `ThemeProvider`'da yapılır.
 *
 * Persist stratejisi (ADIM 3'te basit):
 *   - Misafir kullanıcı: AsyncStorage `@logwise/guest/profile` JSON içindeki
 *     `theme` alanı (rev 10 GUEST_KEYS — §10.5). Bu adımda guest-storage.ts
 *     henüz yok, dolayısıyla persist sadece in-memory; AsyncStorage entegrasyonu
 *     ADIM 4'te `lib/guest-storage.ts` ile birlikte gelecek.
 *   - Auth'lu kullanıcı: `app_profiles.preferences.theme` (rev 13 §4.3). ADIM 5'te
 *     Supabase query/mutation ile bağlanacak.
 *
 * MVP-safe: store mount edildiğinde mode = 'system' (Appearance dinlenir).
 * Persistance'a kadar tema toggle sadece o session için yaşar — kabul edilebilir.
 */
import { create } from 'zustand';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeStoreState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /**
   * Sırayla geçer: system → light → dark → system. More menüde toggle pill için.
   */
  cycleMode: () => void;
}

const cycleNext: Record<ThemeMode, ThemeMode> = {
  system: 'light',
  light:  'dark',
  dark:   'system',
};

export const useThemeStore = create<ThemeStoreState>((set) => ({
  mode: 'system',
  setMode: (mode) => set({ mode }),
  cycleMode: () => set((state) => ({ mode: cycleNext[state.mode] })),
}));
