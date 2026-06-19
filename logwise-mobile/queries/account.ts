/**
 * queries/account — auth hesap işlemleri (Profile ekranı, §3.11 launch fazı).
 *
 * `useUpdateDisplayName`: ad'ı `auth.users.user_metadata.display_name`'e yazar
 * (onAuthStateChange USER_UPDATED → store session tazelenir → More/popover/profile
 * anında günceller) + `app_profiles.display_name` aynalanır (tablo tutarlılığı).
 *
 * Hesap silme (CP2) buraya `useDeleteAccount` olarak eklenir.
 */
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth-store';

export function useUpdateDisplayName() {
  return useMutation({
    mutationFn: async (name: string) => {
      const trimmed = name.trim();
      if (trimmed.length === 0) return;
      const { error } = await supabase.auth.updateUser({ data: { display_name: trimmed } });
      if (error) throw error;
      // app_profiles aynası (best-effort — UI auth metadata'dan okuyor, bu tablo tutarlılığı için).
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id;
      if (uid) {
        await supabase
          .from('app_profiles')
          .update({ display_name: trimmed, updated_at: new Date().toISOString() })
          .eq('user_id', uid);
      }
    },
  });
}

/**
 * Hesabı kalıcı sil (§3.11 + Apple 5.1.1(v)). Mevcut `delete_own_account()` RPC'si
 * (SECURITY DEFINER, search_path='', authenticated'a grant'li) `auth.users` satırını
 * siler → tüm `app_*` + web verisi auth.users FK CASCADE'leriyle otomatik temizlenir.
 * Sonra signOut + session temizlenir → auth gating welcome'a atar.
 */
export function useDeleteAccount() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('delete_own_account');
      if (error) throw error;
      try {
        await supabase.auth.signOut();
      } catch {
        /* kullanıcı zaten silindi → local token'ı temizlemeye çalış, hatayı yut */
      }
    },
    onSuccess: () => setSession(null),
  });
}
