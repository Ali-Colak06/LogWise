/**
 * Auth mutations — TanStack Query hooks (ADIM 4).
 *
 * Karar kaynakları:
 *   §3.6 03-mvp — Email confirmation KAPALI; signUp dönüşünde session var → auto-login
 *   §3.9.1 — Migration register sonrası tetiklenir; bu hook'lar migration'ı tetiklemez,
 *     UI (`A4 Register`) signUp success'inde manuel olarak `migrateGuestToAccount` çağırır
 *   §3.10 — Login sonrası "web kullanıcısı" check Calendar mount'unda yapılır
 *     (B1 spec'i — ADIM 5+)
 *
 * Hook'lar:
 *   - `useAuthSignIn` — email + password ile giriş
 *   - `useAuthSignUp` — email + password + fullname (display_name) ile kayıt
 *   - `useAuthSignOut` — logout
 *   - `useAuthResetPassword` — şifre sıfırlama maili gönder
 *
 * Tüm hook'lar `useMutation` döner — UI `mutate({ ... })` ile çağırır, `isPending` /
 * `error` / `isSuccess` state'leriyle render eder. Hata mesajları orijinal Supabase
 * error.message'i geçirir; UI tarafında i18n key'e map edilir (login -> "Email veya
 * şifre yanlış").
 */
import { useMutation } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { supabase } from '@lib/supabase';
import type { Session } from '@supabase/supabase-js';

// ============================================================================
// Sign in (email + password)
// ============================================================================

export interface SignInVars {
  email: string;
  password: string;
}

export interface SignInResult {
  session: Session;
}

export function useAuthSignIn() {
  return useMutation<SignInResult, Error, SignInVars>({
    mutationFn: async ({ email, password }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw new Error(error.message);
      if (!data.session) throw new Error('Session missing after signIn');
      return { session: data.session };
    },
  });
}

// ============================================================================
// Sign up (email + password + display_name)
// ============================================================================

export interface SignUpVars {
  email: string;
  password: string;
  fullname?: string;
}

export interface SignUpResult {
  session: Session | null;     // §3.6 email confirmation KAPALI -> session dolu döner
  userId: string;              // session olmasa bile user kaydedildi
  needsConfirmation: boolean;  // güvenli yan: Supabase ayarı yanlışsa true
}

export function useAuthSignUp() {
  return useMutation<SignUpResult, Error, SignUpVars>({
    mutationFn: async ({ email, password, fullname }) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: fullname ? { display_name: fullname.trim() } : undefined,
        },
      });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('User missing after signUp');
      return {
        session: data.session,
        userId: data.user.id,
        needsConfirmation: data.session === null,
      };
    },
  });
}

// ============================================================================
// Sign out
// ============================================================================

export function useAuthSignOut() {
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
    },
  });
}

// ============================================================================
// Reset password (forgot password)
// ============================================================================

export interface ResetPasswordVars {
  email: string;
}

export function useAuthResetPassword() {
  return useMutation<void, Error, ResetPasswordVars>({
    mutationFn: async ({ email }) => {
      // §A5 spec: Supabase her zaman 200 döner (security — email yoksa da). Hata
      // genelde rate-limit veya network sorunu olur.
      //
      // ADIM 8 BUG #6 fix: `redirectTo` parametresi verilmezse Supabase'in
      // Site URL'i (logwise.fit landing) kullanılır → kullanıcı şifre değiştirmek
      // için doğru sayfaya gidemez. Web reset sayfasına yönlendiriyoruz; mobile
      // deep link handler henüz yok. Yapılandırma:
      //   app.json `extra.resetPasswordRedirect` → web'in reset URL'i (örn:
      //   https://logwise.fit/reset-password). Dolu ise opt-in olur; boş ise
      //   eski davranış (Supabase default) korunur.
      //
      // ÖNEMLİ: Supabase Dashboard → Authentication → URL Configuration
      // → Redirect URLs listesine bu URL eklenmeli (whitelist).
      const extra = (Constants.expoConfig?.extra ?? {}) as { resetPasswordRedirect?: string };
      const redirectTo = extra.resetPasswordRedirect?.trim() || undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        ...(redirectTo ? { redirectTo } : {}),
      });
      if (error) throw new Error(error.message);
    },
  });
}
