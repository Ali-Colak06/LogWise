/**
 * MoreSheet — E1 More panel (ADIM 6 — §3.1, §3.6, §3.9, §8.5).
 *
 * Bottom sheet; auth varyantı (profil özeti + Çıkış Yap) vs guest varyantı
 * (Misafir başlık + Hesap Aç). Dil + Tema toggle (anında). Disabled placeholder
 * satırlar (Profil/Ayarlar/Veri/Geri Bildirim) → "Çok yakında!" toast.
 */
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  User as UserIcon,
  Settings,
  Database,
  MessageSquare,
  Globe,
  Moon,
  LogOut,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import { AppBottomSheet, Text, useToast } from '../ui';
import { useTheme } from '../../theme';
import { useT, useLocaleStore } from '../../lib/i18n';
import { useThemeStore } from '../../lib/theme-store';
import { useAuthMode, useAuthSession, useAuthStore } from '../../stores/auth-store';
import { supabase } from '../../lib/supabase';

export interface MoreSheetProps {
  visible: boolean;
  onClose: () => void;
}

function TogglePill({
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

export default function MoreSheet({ visible, onClose }: MoreSheetProps) {
  const { colors } = useTheme();
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const mode = useAuthMode();
  const session = useAuthSession();
  const setSession = useAuthStore((s) => s.setSession);
  const exitGuest = useAuthStore((s) => s.exitGuest);

  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);

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
    // Sheet'i hemen kapat + route navigation. Modal kapanma animasyonu (250ms)
    // ile router.push race condition yapıyordu — push'u önce yapıyoruz, sheet
    // navigation tamamlanırken kapanır.
    router.push('/(auth)/register');
    onClose();
  };

  const comingSoon = () => toast.show({ message: t('more.comingSoon'), variant: 'info' });

  const disabledRows: Array<{ icon: typeof UserIcon; key: string }> = [
    { icon: UserIcon, key: 'more.rowProfile' },
    { icon: Settings, key: 'more.rowSettings' },
    { icon: Database, key: 'more.rowData' },
    { icon: MessageSquare, key: 'more.rowFeedback' },
  ];

  return (
    <AppBottomSheet visible={visible} onClose={onClose} maxHeightRatio={0.8}>
      {/* User header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.accent.goldMuted }]}>
          <Text variant="bodyStrong" style={{ color: colors.accent.gold }}>
            {initials}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {isGuest ? t('more.guestTitle') : displayName}
          </Text>
          <Text variant="caption" color="secondary" numberOfLines={1}>
            {isGuest ? t('more.guestSubtitle') : email}
          </Text>
        </View>
      </View>

      <View style={[styles.sep, { backgroundColor: colors.border.subtle }]} />

      {/* Language */}
      <View style={styles.row}>
        <Globe size={20} color={colors.text.secondary} />
        <Text variant="body" style={styles.rowLabel}>{t('more.lang')}</Text>
        <TogglePill
          options={[{ key: 'tr', label: 'TR' }, { key: 'en', label: 'EN' }]}
          value={locale}
          onChange={(k) => setLocale(k as 'tr' | 'en')}
        />
      </View>

      {/* Theme */}
      <View style={styles.row}>
        <Moon size={20} color={colors.text.secondary} />
        <Text variant="body" style={styles.rowLabel}>{t('more.theme')}</Text>
        <TogglePill
          options={[
            { key: 'dark', label: t('more.themeDark') },
            { key: 'light', label: t('more.themeLight') },
          ]}
          value={effectiveTheme}
          onChange={(k) => setThemeMode(k as 'dark' | 'light')}
        />
      </View>

      <View style={[styles.sep, { backgroundColor: colors.border.subtle }]} />

      {/* Disabled placeholder rows */}
      {disabledRows.map(({ icon: RowIcon, key }) => (
        <Pressable key={key} style={styles.row} onPress={comingSoon}>
          <RowIcon size={20} color={colors.text.tertiary} />
          <Text variant="body" color="tertiary" style={styles.rowLabel}>
            {t(key as never)}
          </Text>
          <ChevronRight size={18} color={colors.text.tertiary} />
        </Pressable>
      ))}

      <View style={[styles.sep, { backgroundColor: colors.border.subtle }]} />

      {/* Debug row — auth durumunu göstermek için (geçici, ADIM 8 bug fix) */}
      <View style={styles.row}>
        <Text variant="caption" color="tertiary" style={styles.rowLabel}>
          mode={mode} · email={email || '(none)'}
        </Text>
      </View>

      {/* Logout (auth) vs Register (guest) — auth durumunda her zaman göster */}
      {mode === 'guest' ? (
        <Pressable style={styles.row} onPress={onRegister}>
          <Sparkles size={20} color={colors.accent.gold} />
          <Text variant="bodyStrong" style={[styles.rowLabel, { color: colors.accent.gold }]}>
            {t('more.register')}
          </Text>
        </Pressable>
      ) : (
        <Pressable style={styles.row} onPress={onLogout}>
          <LogOut size={20} color={colors.semantic.danger} />
          <Text variant="bodyStrong" style={[styles.rowLabel, { color: colors.semantic.danger }]}>
            {t('more.logout')}
          </Text>
        </Pressable>
      )}
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sep: { height: StyleSheet.hairlineWidth, marginVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowLabel: { flex: 1 },
  pill: { flexDirection: 'row', borderRadius: 8, padding: 2, gap: 2 },
  pillSeg: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
});
