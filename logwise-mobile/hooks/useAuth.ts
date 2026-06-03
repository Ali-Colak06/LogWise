/**
 * useAuth — Supabase session listener bridge (ADIM 4 + ADIM 5 fix).
 *
 * Tek sorumluluk: Supabase auth state'ini Zustand store'una senkronlar +
 * splash gizlemek icin `ready` flag'i saglar.
 *
 * Akis:
 *   1) Mount sirasinda `supabase.auth.getSession()` (cache'den restore).
 *   2) Sonra `supabase.auth.onAuthStateChange` subscribe — login/logout/refresh
 *      eventlerinde store gunceller.
 *   3) Misafir mode flag'ini (AsyncStorage) okuyup session yoksa store mode='guest'
 *      set eder (boot restore).
 *   4) Bitince (basari/hata fark etmez) local `ready=true` set edilir.
 *
 * BUG FIX (ADIM 5): Onceki versiyon `ready = mode !== 'unknown'` ile turetiyordu;
 * yeni kullanici icin mode 'unknown' kaldigi durumda splash sonsuza dek aciliyordu.
 * Local `ready` state + 5sn safety timeout ile kilitlenme tamamen kaldirildi.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@stores/auth-store';
import { readGuestModeFlag } from '@lib/guest-storage';

export function useAuthBootstrap(): { ready: boolean } {
  const setSession = useAuthStore((s) => s.setSession);
  const setMode = useAuthStore((s) => s.setMode);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Guvenlik: ne olursa olsun 5 sn icinde ready degilse zorla ac.
    const safetyTimer = setTimeout(() => {
      if (!cancelled) {
        console.warn('[useAuth] bootstrap safety timeout — forcing ready');
        setReady(true);
      }
    }, 5000);

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;

        if (error) {
          console.warn('[useAuth] getSession error', error.message);
        }

        const session = data.session ?? null;
        if (session) {
          setSession(session);
        } else {
          const isGuest = await readGuestModeFlag();
          if (cancelled) return;

          if (isGuest) {
            setMode('guest');
          } else {
            setSession(null);
            setMode('unknown');
          }
        }
      } catch (err) {
        console.warn('[useAuth] bootstrap fail', err);
        if (!cancelled) {
          setSession(null);
          setMode('unknown');
        }
      } finally {
        if (!cancelled) {
          clearTimeout(safetyTimer);
          setReady(true);
        }
      }
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
    });

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
      subscription.subscription.unsubscribe();
    };
  }, [setSession, setMode]);

  return { ready };
}
