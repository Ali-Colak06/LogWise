/**
 * ProfilePopover — Avatar (Calendar app bar) tap'i ile açılan sol-üst floating panel.
 *
 * E1 More sheet'ten AYRI bir giriş noktası (kullanıcı kararı, ADIM 8 bug fix turu Adim 5).
 * İçerik: profil özeti + Dil/Tema toggle + Çıkış Yap (auth) / Hesap Aç (guest).
 * MoreSheet (alt nav) şimdilik korunuyor; çakışma bilinçli (ileride düzenlenecek).
 *
 * Konumlanma: anchor (avatar'ın measureInWindow rect'i) altında açılır kart;
 * arkada scrim, dışarı tap ile kapanır.
 */
import { Alert, Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Globe, Moon, LogOut, Sparkles } from 'lucide-react-native';
import { Text, useToast } from '../ui';
import { useTheme } from '../../theme';
import { useT, useLocaleStore } from '../../lib/i18n';
import { useThemeStore } from '../../lib/theme-store';
import { useAuthMode, useAuthSession, useAuthStore } from '../../stores/auth-store';
import { supabase } from '../../lib/supabase';

export interface AnchorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProfilePopoverProps {
  visible: boolean;
  anchor: AnchorRect | null;
  onClose: () => void;
}

const CARD_WIDTH = 248;
const GAP = 8;
const EDGE_MARGIN = 8;

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

export default function ProfilePopover({ visible, anchor, onClose }: ProfilePopoverProps) {
  const { colors } = useTheme();
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const mode = useAuthMode();
  const session = useAuthSession();
  const setSession = useAuthStore((s) => s.setSession);

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
    router.push('/(auth)/register');
    onClose();
  };

  // Kartı anchor'ın sol-altına yerleştir; ekran kenarından taşmasın diye clamp.
  const screenW = Dimensions.get('window').width;
  const left = anchor
    ? Math.min(Math.max(EDGE_MARGIN, anchor.x), screenW - CARD_WIDTH - EDGE_MARGIN)
    : EDGE_MARGIN;
  const top = anchor ? anchor.y + anchor.height + GAP : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        {/* Kart: scrim tap'i kart içinde yutulur (stopPropagation) */}
        <Pressable
          onPress={() => undefined}
          style={[
            styles.card,
            {
              left,
              top,
              backgroundColor: colors.background.elevated,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          {/* Header */}
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
            <Globe size={18} color={colors.text.secondary} />
            <Text variant="body" style={styles.rowLabel}>{t('more.lang')}</Text>
            <TogglePill
              options={[{ key: 'tr', label: 'TR' }, { key: 'en', label: 'EN' }]}
              value={locale}
              onChange={(k) => setLocale(k as 'tr' | 'en')}
            />
          </View>

          {/* Theme */}
          <View style={styles.row}>
            <Moon size={18} color={colors.text.secondary} />
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

          {/* Logout (auth) vs Register (guest) */}
          {isGuest ? (
            <Pressable style={styles.row} onPress={onRegister}>
              <Sparkles size={18} color={colors.accent.gold} />
              <Text variant="bodyStrong" style={[styles.rowLabel, { color: colors.accent.gold }]}>
                {t('more.register')}
              </Text>
            </Pressable>
          ) : (
            <Pressable style={styles.row} onPress={onLogout}>
              <LogOut size={18} color={colors.semantic.danger} />
              <Text variant="bodyStrong" style={[styles.rowLabel, { color: colors.semantic.danger }]}>
                {t('more.logout')}
              </Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sep: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  rowLabel: { flex: 1 },
  pill: { flexDirection: 'row', borderRadius: 8, padding: 2, gap: 2 },
  pillSeg: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
});
