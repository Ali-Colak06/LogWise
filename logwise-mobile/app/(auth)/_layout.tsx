/**
 * Auth route grubu layout — A1-A5 ekranlari icin (ADIM 4 + ADIM 8 fix).
 *
 * Auth gating:
 *   - mode === 'auth'  → /(app)/calendar redirect (login zaten yapilmis)
 *   - mode === 'guest' → Stack render edilir ANCAK welcome ekranını GIZLE
 *     (misafir kullanıcı tekrar welcome'a düşmesin; register/login'e direkt
 *     push edilir More menüden veya direkt URL ile)
 *   - mode === 'unknown' → Stack render (welcome/login/register dahil hepsi açık)
 *
 * BUG FIX (ADIM 8 v2): Misafir mode'da auth ekranları açılabilir olsun, ama
 * welcome bypass et. Aksi halde tekrar 'misafir devam et' tıklatıyoruz, akış kafa karıştırıcı.
 */
import { Stack, Redirect } from 'expo-router';
import { useAuthMode } from '@stores/auth-store';

export default function AuthLayout() {
  const mode = useAuthMode();

  if (mode === 'auth') {
    return <Redirect href="/(app)/calendar" />;
  }

  return (
    <Stack
      initialRouteName="welcome"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: '#000000' },
      }}
    />
  );
}
