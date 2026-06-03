/**
 * Root index — uygulama acildiginda ilk gosterilen ekran (ADIM 4).
 *
 * Auth state'e gore yonlendirir:
 *   - mode === 'auth' veya 'guest' → /(app)/calendar
 *   - mode === 'unknown' → /(auth)/welcome
 *
 * Bootstrap (useAuth) tamamlanmadan once mode='unknown' oldugu icin welcome'a gider;
 * sonra session yuklenince (auth)/_layout otomatik calendar'a redirect eder.
 */
import { Redirect } from 'expo-router';
import { useAuthMode } from '@stores/auth-store';

export default function RootIndex() {
  const mode = useAuthMode();
  console.log('[RootIndex] mode=', mode);
  if (mode === 'auth' || mode === 'guest') {
    return <Redirect href="/(app)/calendar" />;
  }
  return <Redirect href="/(auth)/welcome" />;
}
