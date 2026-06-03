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
 */
import { Stack, Redirect } from 'expo-router';
import { useAuthMode } from '@stores/auth-store';
import { useTheme } from '../../theme';

export default function AppLayout() {
  const mode = useAuthMode();
  const { colors } = useTheme();

  if (mode === 'unknown') {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.app },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="program/[id]/edit" />
    </Stack>
  );
}
