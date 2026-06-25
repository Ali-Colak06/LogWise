/**
 * Auth store — Zustand (ADIM 4).
 *
 * Tek sorumluluk: session + mode (auth/guest/unknown) tutar.
 * Supabase `onAuthStateChange` listener'ı `hooks/useAuth.ts`'te store'u günceller.
 *
 * Mode anlamı:
 *   - `unknown` (default): boot sırasında Supabase getSession() henüz çözülmedi.
 *     Auth gating bu state'te splash/skeleton göstermeli (anlık redirect değil).
 *   - `auth`: session var, kullanıcı login.
 *   - `guest`: kullanıcı Welcome'da "Misafir Olarak Devam Et" seçti. AsyncStorage'de
 *     veri tutulur, Supabase'e çağrı yapılmaz (§3.9).
 *
 * Persist:
 *   - Session: Supabase client zaten SecureStore'da tutuyor → restore otomatik.
 *   - Guest mode: AsyncStorage `@logwise/guest/mode` (rev 10 §10.5). `enterGuest()`
 *     çağrısı bu flag'i yazar; app yeniden açılışta `hooks/useAuth.ts` bunu okur ve
 *     mode='guest' set eder. (Bu okuma ADIM 5'te `guest-storage.ts`'in full impl ile
 *     genişler; şimdi sadece flag yazılır/okunur.)
 *
 * Tüketim:
 *   - `useAuthMode()` → 'auth' | 'guest' | 'unknown'
 *   - `useAuthSession()` → Session | null
 */
import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';

export type AuthMode = 'auth' | 'guest' | 'unknown';

export interface AuthStoreState {
  session: Session | null;
  mode: AuthMode;
  /** Supabase getSession()/onAuthStateChange ile çağrılır. */
  setSession: (session: Session | null) => void;
  /** Welcome ekranında "Misafir Devam Et" tıklanınca. */
  enterGuest: () => void;
  /** Misafir → hesap geçişi (signUp success) veya guest mode'dan çıkış. */
  exitGuest: () => void;
  /** Boot çözümleme bitince başka bir mode aktif değilse 'unknown' → kullanıcı yönelendirilir. */
  setMode: (mode: AuthMode) => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  session: null,
  mode: 'unknown',

  setSession: (session) =>
    set((state) => ({
      session,
      // Session geldiyse mode auto -> 'auth'.
      // Session null + mode 'guest' ise guest mode korunur.
      // Aksi halde 'unknown' (Welcome'a redirect).
      mode: session ? 'auth' : state.mode === 'guest' ? 'guest' : 'unknown',
    })),

  enterGuest: () => set({ mode: 'guest', session: null }),

  exitGuest: () =>
    set((state) => ({
      mode: state.session ? 'auth' : 'unknown',
    })),

  setMode: (mode) => set({ mode }),
}));

// Convenience selectors (re-render minimize)
export const useAuthSession = () => useAuthStore((s) => s.session);
export const useAuthMode = () => useAuthStore((s) => s.mode);
