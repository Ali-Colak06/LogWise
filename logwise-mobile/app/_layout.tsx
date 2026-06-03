/**
 * Root layout — uygulamanin en ust seviye sarmalayicisi (ADIM 4).
 *
 * Sorumluluklar:
 *  - GestureHandlerRootView + SafeAreaProvider + ThemeProvider (ADIM 3)
 *  - QueryClientProvider (TanStack Query — ADIM 4)
 *  - ToastProvider (overlay notification — ADIM 4)
 *  - useFonts() + expo-splash-screen ile Inter font yukleme (ADIM 4)
 *  - useAuthBootstrap() — Supabase session restore + onAuthStateChange (ADIM 4)
 *  - Stack(auth)/Stack(app) route grupları
 *
 * Auth gating bu seviyede DEGIL — (auth)/_layout ve (app)/_layout kendi Redirect'lerini
 * yapar (mode'a gore). Bu yaklasim Expo Router idiomatik.
 *
 * Font stratejisi (§2 03-mvp hibrit):
 *   - Inter bundle'a yuklenir (`@expo-google-fonts/inter`)
 *   - Display + Mono = system fallback (Space Grotesk + JetBrains Mono ship edilmedi)
 *
 * NOT: `@expo-google-fonts/inter` paketinin yuklu olmasi GEREKIR. Yoksa import patlar.
 * Kullanici `npm install @expo-google-fonts/inter expo-splash-screen --legacy-peer-deps`
 * calistirmali (package.json'a eklendi).
 */
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

import { ThemeProvider } from '../theme';
import { ToastProvider } from '../components/ui';
import { queryClient } from '../lib/query-client';
import { useAuthBootstrap } from '../hooks/useAuth';
import { initSentry } from '../lib/sentry';

// Sentry crash-only init (DSN yoksa no-op) — provider'lardan ÖNCE çağrılır
// ki erken initialization sırasındaki crash'ler de yakalansın. §10.1 03-mvp.
initSentry();

// Splash screen'i JS bundle yuklenince native splash'tan devral.
// fontlar + auth bootstrap bitince hideAsync().
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore: zaten gizliyse */
});

function BootstrapBridge({ children }: { children: React.ReactNode }) {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
  });
  const { ready: authReady } = useAuthBootstrap();

  useEffect(() => {
    // Font yuklendi (veya hata) + auth bootstrap tamamlandi → splash gizle.
    // Font error olsa bile devam et (system fallback) — kullaniciya beyaz ekran gosterme.
    if ((fontsLoaded || fontError) && authReady) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, fontError, authReady]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ToastProvider>
              <BootstrapBridge>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                  }}
                >
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(app)" />
                </Stack>
              </BootstrapBridge>
            </ToastProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
