/**
 * ProfilePopover — Avatar (Calendar + Library D1 app bar) tap'i ile açılan sol-üst
 * floating panel. Hızlı menü: profil özeti + Dil/Tema toggle + Çıkış Yap (auth) /
 * Hesap Aç (guest). Disabled placeholder satırları YOK — o tam hub MoreSheet'tedir
 * (bottom-nav). Rol ayrımı bilinçli; paylaşılan parçalar `profile-menu`'de (rev 21).
 *
 * Konumlanma: anchor (avatar'ın measureInWindow rect'i) altında açılır kart;
 * arkada scrim, dışarı tap ile kapanır.
 */
import { Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Globe, Moon, LogOut, LogIn, Sparkles } from 'lucide-react-native';
import { Text } from '../ui';
import { useTheme } from '../../theme';
import { useT } from '../../lib/i18n';
import { useProfileMenu, TogglePill, ProfileMenuHeader } from './profile-menu';

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

export default function ProfilePopover({ visible, anchor, onClose }: ProfilePopoverProps) {
  const { colors } = useTheme();
  const t = useT();
  const m = useProfileMenu(onClose);

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
            { left, top, backgroundColor: colors.background.elevated, borderColor: colors.border.subtle },
          ]}
        >
          <ProfileMenuHeader
            initials={m.initials}
            title={m.isGuest ? t('more.guestTitle') : m.displayName}
            subtitle={m.isGuest ? t('more.guestSubtitle') : m.email}
            avatarSize={40}
          />

          <View style={[styles.sep, { backgroundColor: colors.border.subtle }]} />

          {/* Language */}
          <View style={styles.row}>
            <Globe size={18} color={colors.text.secondary} />
            <Text variant="body" style={styles.rowLabel}>{t('more.lang')}</Text>
            <TogglePill
              options={[{ key: 'tr', label: 'TR' }, { key: 'en', label: 'EN' }]}
              value={m.locale}
              onChange={m.setLocale}
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
              value={m.effectiveTheme}
              onChange={m.setThemeMode}
            />
          </View>

          <View style={[styles.sep, { backgroundColor: colors.border.subtle }]} />

          {/* Misafir: Giriş Yap + Hesap Aç — auth: Çıkış Yap */}
          {m.isGuest ? (
            <>
              <Pressable style={styles.row} onPress={m.onLogin}>
                <LogIn size={18} color={colors.text.secondary} />
                <Text variant="body" style={styles.rowLabel}>{t('auth.login')}</Text>
              </Pressable>
              <Pressable style={styles.row} onPress={m.onRegister}>
                <Sparkles size={18} color={colors.accent.gold} />
                <Text variant="bodyStrong" style={[styles.rowLabel, { color: colors.accent.gold }]}>
                  {t('more.register')}
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.row} onPress={m.onLogout}>
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
  sep: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  rowLabel: { flex: 1 },
});
