/**
 * profile-menu — E1 MoreSheet (bottom-nav) ile avatar ProfilePopover'ın PAYLAŞILAN
 * parçaları (rev 21). Kod tekrarını bitirir; **davranış değişmez**. Rol ayrımı korunur:
 * MoreSheet = tam hub (+ disabled gelecek satırları), ProfilePopover = hızlı menü.
 *
 * - `useProfileMenu(onClose)`: türetilmiş profil state'i + Çıkış/Hesap-Aç handler'ları.
 * - `TogglePill`: dil/tema segmented pill.
 * - `ProfileMenuHeader`: avatar + ad/email başlığı (avatarSize ile kompakt/normal).
 */
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../ui';
import { useTheme } from '../../theme';
import { useT, useLocaleStore } from '../../lib/i18n';
import { useThemeStore } from '../../lib/theme-store';
import { useAuthMode, useAuthSession, useAuthStore } from '../../stores/auth-store';
import { supabase } from '../../lib/supabase';

export function useProfileMenu(onClose: () => void) {
  const t = useT();
  const router = useRouter();
  const mode = useAuthMode();
  const session = useAuthSession();
  const setSession = useAuthStore((s) => s.setSession);

  const locale = useLocaleStore((s) => s.locale);
  const setLocaleRaw = useLocaleStore((s) => s.setLocale);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeModeRaw = useThemeStore((s) => s.setMode);

  const isGuest = mode === 'guest';
  const email = session?.user.email ?? '';
  const displayName =
    (session?.user.user_metadata?.display_name as string | undefined) ??
    email.split('@')[0] ??
    'LogWise';
  const initials = (isGuest ? 'M' : displayName.slice(0, 2)).toUpperCase();
  // Tema toggle: store 'system|light|dark'. UI sadece dark/light gösterir; seçim
  // doğrudan light/dark yazar (system bırakılmaz — kullanıcı bilinçli seçti).
  const effectiveTheme = themeMode === 'light' ? 'light' : 'dark';

  const onLogout = () => {
    Alert.alert(t('more.logoutConfirmTitle'), t('more.logoutConfirmBody'), [
      { text: t('library.cancel'), style: 'cancel' },
      {
        text: t('more.logout'),
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.auth.signOut();
          } catch {
            /* offline: yine de local temizle */
          }
          setSession(null);
          onClose();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  const onRegister = () => {
    // Sheet'i hemen kapat + route navigation. Modal kapanma animasyonu (250ms) ile
    // router.push race condition yapıyordu — push'u önce yap, sheet kapanırken navigate.
    router.push('/(auth)/register');
    onClose();
  };

  const onLogin = () => {
    // Misafir zaten hesabı varsa giriş yapabilir (kayıt tek yol değil).
    router.push('/(auth)/login');
    onClose();
  };

  return {
    isGuest,
    email,
    displayName,
    initials,
    locale,
    effectiveTheme,
    setLocale: (k: string) => setLocaleRaw(k as 'tr' | 'en'),
    setThemeMode: (k: string) => setThemeModeRaw(k as 'dark' | 'light'),
    onLogout,
    onRegister,
    onLogin,
  };
}

export function TogglePill({
  options,
  value,
  onChange,
}: {
  options: Array<{ key: string; label: string }>;
  value: string;
  onChange: (k: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: colors.background.subtle }]}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={[styles.pillSeg, active && { backgroundColor: colors.accent.gold }]}
          >
            <Text variant="meta" color={active ? 'onAccent' : 'secondary'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProfileMenuHeader({
  initials,
  title,
  subtitle,
  avatarSize = 44,
}: {
  initials: string;
  title: string;
  subtitle: string;
  avatarSize?: number;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      <View
        style={[
          styles.avatar,
          { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, backgroundColor: colors.accent.goldMuted },
        ]}
      >
        <Text variant="bodyStrong" style={{ color: colors.accent.gold }}>
          {initials}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" color="secondary" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', borderRadius: 8, padding: 2, gap: 2 },
  pillSeg: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
});
