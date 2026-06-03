/**
 * TanStack Query — QueryClient instance (ADIM 4).
 *
 * Karar kaynakları:
 *   §2 03-mvp — Server state TanStack Query, UI state Zustand
 *   §4.2 03-mvp — Online-only MVP (offline-first değil); cache stratejisi orta düzeyde
 *
 * Defaults:
 *   - `staleTime: 60_000` (1 dakika) — kısa cache, salon Wi-Fi'sinde gereksiz refetch'i azaltır
 *     ama eski veri gözükmesini önler.
 *   - `gcTime: 5 * 60_000` (5 dakika) — query unmount sonrası garbage collect.
 *   - `retry: 1` — flaky network için tek retry; üst üste hata varsa kullanıcıya hata göster.
 *   - `refetchOnWindowFocus: false` — mobil'de "window focus" RN'de farklı; AppState değişiminde
 *     refetch istemiyoruz (manuel kontrol). Pull-to-refresh ayrıca aktif kalır.
 *   - `refetchOnReconnect: true` — network geri gelince stale query'leri tazele.
 *
 * Provider: `app/_layout.tsx` -> <QueryClientProvider client={queryClient}>{children}</...>.
 * Mutation hook'ları: `queries/auth.ts` (signIn/signUp/signOut/resetPassword) ile başlar; daha
 * sonra `queries/workouts.ts`, `queries/exercises.ts`, `queries/programs.ts`.
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default queryClient;
