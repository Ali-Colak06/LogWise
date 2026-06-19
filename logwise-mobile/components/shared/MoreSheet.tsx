/**
 * MoreSheet — E1 More panel (ADIM 6 — §3.1, §3.6, §3.9, §8.5).
 *
 * Bottom-nav "More" girişi → tam hub: profil özeti + Dil/Tema toggle + disabled
 * placeholder satırlar ("Yakında" çipi + "Çok yakında!" toast) + Çıkış Yap (auth) /
 * Hesap Aç (guest). Paylaşılan parçalar `profile-menu`'de (avatar ProfilePopover ile
 * ortak — rol ayrımı korunur; rev 21).
 */
import { Pressable, StyleSheet, View } from 'react-native';
import {
  User as UserIcon,
  Settings,
  Database,
  MessageSquare,
  Globe,
  Moon,
  LogOut,
  LogIn,
  Sparkles,
} from 'lucide-react-native';
import { AppBottomSheet, Text, useToast } from '../ui';
import { useTheme } from '../../theme';
import { useT } from '../../lib/i18n';
import { useProfileMenu, TogglePill, ProfileMenuHeader } from './profile-menu';

export interface MoreSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function MoreSheet({ visible, onClose }: MoreSheetProps) {
  const { colors } = useTheme();
  const t = useT();
  const toast = useToast();
  const m = useProfileMenu(onClose);

  const comingSoon = () => toast.show({ message: t('more.comingSoon'), variant: 'info' });

  const disabledRows: Array<{ icon: typeof UserIcon; key: string }> = [
    { icon: UserIcon, key: 'more.rowProfile' },
    { icon: Settings, key: 'more.rowSettings' },
    { icon: Database, key: 'more.rowData' },
    { icon: MessageSquare, key: 'more.rowFeedback' },
  ];

  return (
    <AppBottomSheet visible={visible} onClose={onClose} maxHeightRatio={0.8}>
      <ProfileMenuHeader
        initials={m.initials}
        title={m.isGuest ? t('more.guestTitle') : m.displayName}
        subtitle={m.isGuest ? t('more.guestSubtitle') : m.email}
      />

      <View style={[styles.sep, { backgroundColor: colors.border.subtle }]} />

      {/* Language */}
      <View style={styles.row}>
        <Globe size={20} color={colors.text.secondary} />
        <Text variant="body" style={styles.rowLabel}>{t('more.lang')}</Text>
        <TogglePill
          options={[{ key: 'tr', label: 'TR' }, { key: 'en', label: 'EN' }]}
          value={m.locale}
          onChange={m.setLocale}
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
          value={m.effectiveTheme}
          onChange={m.setThemeMode}
        />
      </View>

      <View style={[styles.sep, { backgroundColor: colors.border.subtle }]} />

      {/* Disabled placeholder rows — "Yakında" çipi + bilgi toast */}
      {disabledRows.map(({ icon: RowIcon, key }) => (
        <Pressable key={key} style={styles.row} onPress={comingSoon}>
          <RowIcon size={20} color={colors.text.tertiary} />
          <Text variant="body" color="tertiary" style={styles.rowLabel}>
            {t(key as never)}
          </Text>
          <View style={[styles.soonChip, { backgroundColor: colors.background.subtle }]}>
            <Text variant="meta" color="tertiary" style={styles.soonChipText}>
              {t('placeholder.soon')}
            </Text>
          </View>
        </Pressable>
      ))}

      <View style={[styles.sep, { backgroundColor: colors.border.subtle }]} />

      {/* Misafir: Giriş Yap + Hesap Aç — auth: Çıkış Yap */}
      {m.isGuest ? (
        <>
          <Pressable style={styles.row} onPress={m.onLogin}>
            <LogIn size={20} color={colors.text.secondary} />
            <Text variant="body" style={styles.rowLabel}>{t('auth.login')}</Text>
          </Pressable>
          <Pressable style={styles.row} onPress={m.onRegister}>
            <Sparkles size={20} color={colors.accent.gold} />
            <Text variant="bodyStrong" style={[styles.rowLabel, { color: colors.accent.gold }]}>
              {t('more.register')}
            </Text>
          </Pressable>
        </>
      ) : (
        <Pressable style={styles.row} onPress={m.onLogout}>
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
  sep: { height: StyleSheet.hairlineWidth, marginVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowLabel: { flex: 1 },
  soonChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  soonChipText: { fontSize: 10, letterSpacing: 0.3 },
});
