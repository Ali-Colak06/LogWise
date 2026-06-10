/**
 * queries/profile — app_profiles.preferences + web user detection (ADIM 6).
 *
 * seen_web_welcome (§3.10) + seen_hint_card (§8.8 B1) bayrakları burada.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchProfilePreferences,
  setProfilePreference,
  countWebUserData,
  useDataCtx,
  type DataCtx,
} from '../lib/data-bridge';

const prefKeys = {
  all: (ctx: DataCtx) => ['profilePrefs', ctx.mode, ctx.userId ?? 'guest'] as const,
  webCount: (ctx: DataCtx) => ['webUserCount', ctx.mode, ctx.userId ?? 'guest'] as const,
};

export function useProfilePreferences() {
  const ctx = useDataCtx();
  return useQuery<Record<string, unknown>>({
    queryKey: prefKeys.all(ctx),
    queryFn: () => fetchProfilePreferences(ctx),
  });
}

export function useSetProfilePreference() {
  const ctx = useDataCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { key: string; value: unknown }) =>
      setProfilePreference(ctx, input.key, input.value),
    onSuccess: () => qc.invalidateQueries({ queryKey: prefKeys.all(ctx) }),
  });
}

/**
 * §3.10 — auth kullanıcının web tarafında verisi var mı (user_data count > 0).
 * FAZ 2.2: `enabled` param ile lazy — web-welcome modal mantığı gerekene kadar
 * (prefs yüklendi + seen_web_welcome=false) çalışmaz; her Calendar açılışında
 * gereksiz round-trip atmaz.
 */
export function useWebUserCount(enabled = true) {
  const ctx = useDataCtx();
  return useQuery<number>({
    queryKey: prefKeys.webCount(ctx),
    queryFn: () => countWebUserData(ctx),
    enabled: ctx.mode === 'auth' && enabled,
  });
}
