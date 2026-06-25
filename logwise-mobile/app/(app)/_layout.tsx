/**
 * App route grubu layout — Stack sarmalayıcı (ADIM 6).
 *
 * Yapı:
 *   (app)/_layout.tsx          → Stack (auth gating burada)
 *     ├── (tabs)/_layout.tsx   → Tabs + custom BottomTabBar (5 sekme)
 *     └── program/[id]/edit    → D3 Program Edit (TAM EKRAN, bottom nav GİZLİ §8.10)
 *
 * Auth gating:
 *   - mode === 'auth' | 'guest' → Stack render
 *   - mode === 'unknown'        → /(auth)/welcome redirect
 *
 * Post-auth bootstrap (email doğrulaması AÇIK akışı):
 *   Kullanıcı authenticated olur olmaz (login / signup-session / session-restore)
 *   burada TEK SEFER: (1) app_profiles satırını garanti et (signup'ta session
 *   olmadığı için yazılamamıştı), (2) bekleyen misafir→hesap migration'ı çalıştır.
 *   Bu, login ekranının yönlendirmeyle unmount olma yarışından bağımsızdır —
 *   yönlendirmenin İNDİĞİ katman burası.
 */
import { useEffect, useRef, useState } from 'react';
import { Stack, Redirect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthMode, useAuthSession } from '@stores/auth-store';
import { useTheme } from '../../theme';
import { useToast } from '../../components/ui';
import { useT } from '../../lib/i18n';
import { ensureAppProfile } from '../../lib/account';
import { migrateGuestToAccount } from '../../lib/migration';
import {
  readPendingMigration,
  writePendingMigration,
  clearAllGuestData,
  writeGuestModeFlag,
} from '../../lib/guest-storage';
import MigrationLoadingOverlay from '../../components/auth/MigrationLoadingOverlay';

export default function AppLayout() {
  const mode = useAuthMode();
  const session = useAuthSession();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const t = useT();

  const [migrating, setMigrating] = useState(false);
  const finalizedRef = useRef(false);

  useEffect(() => {
    if (mode !== 'auth' || !session || finalizedRef.current) return;
    finalizedRef.current = true;
    const userId = session.user.id;
    void (async () => {
      // 1) Profil satırını garanti et (doğrulama-açık akışında signup'ta yazılamadı).
      await ensureAppProfile();
      // 2) Bekleyen misafir→hesap migration'ı (kayıt sırasında işaretlendi).
      if (!(await readPendingMigration())) return;
      setMigrating(true);
      const res = await migrateGuestToAccount(userId);
      if (res.ok) {
        await clearAllGuestData();
        await writePendingMigration(false);
        await writeGuestModeFlag(false);
        await qc.invalidateQueries();
        const msg = t('migration.successToast')
          .replace('%{ex}', String(res.counts.exercises))
          .replace('%{wk}', String(res.counts.workouts));
        toast.show({ message: msg, variant: 'success' });
      } else {
        // Bayrağı bırak → sonraki açılışta tekrar denenir.
        console.warn('[app-layout] migration fail', res.error);
        toast.show({ message: t('migration.errorToast'), variant: 'danger' });
      }
      setMigrating(false);
    })();
  }, [mode, session, qc, toast, t]);

  if (mode === 'unknown') {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background.app },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="program/[id]/edit" />
      </Stack>
      <MigrationLoadingOverlay visible={migrating} />
    </>
  );
}
