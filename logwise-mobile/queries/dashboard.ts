/**
 * queries/dashboard — F1 Dashboard veri hook'u (§3.11 launch fazı).
 *
 * Ham `DashboardSet[]` çeker; ekran `computeDashboard` ile metrikleri türetir
 * (resolve/locale ekranda → cache locale-agnostik kalır).
 */
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardSets, useDataCtx, type DataCtx } from '../lib/data-bridge';
import type { DashboardSet } from '../lib/dashboard';

const dashKeys = {
  sets: (ctx: DataCtx) => ['dashboardSets', ctx.mode, ctx.userId ?? 'guest'] as const,
};

export function useDashboardSets() {
  const ctx = useDataCtx();
  return useQuery<DashboardSet[]>({
    queryKey: dashKeys.sets(ctx),
    queryFn: () => fetchDashboardSets(ctx),
  });
}
