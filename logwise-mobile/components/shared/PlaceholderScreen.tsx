/**
 * PlaceholderScreen — F1 Dashboard + F2 Social ortak component (ADIM 6 — §3.1).
 *
 * Sade "yakında" mesajı: goldMuted halka içinde gold ikon + "ÇOK YAKINDA" rozeti +
 * başlık + açıklama. CTA yok (kullanıcı kararı rev 6); rozet bilgi amaçlı, aksiyon değil.
 */
import { StyleSheet, View } from 'react-native';
import type { ComponentType } from 'react';
import { Screen, Text } from '../ui';
import { useTheme } from '../../theme';
import { useT } from '../../lib/i18n';
import type { LucideIconProps } from '../ui/Icon';

export interface PlaceholderScreenProps {
  icon: ComponentType<LucideIconProps>;
  title: string;
  description: string;
  testID?: string;
}

export default function PlaceholderScreen({
  icon: Icon,
  title,
  description,
  testID,
}: PlaceholderScreenProps) {
  const { colors } = useTheme();
  const t = useT();
  return (
    <Screen scroll={false}>
      <View style={styles.center} testID={testID}>
        <View style={[styles.iconHalo, { backgroundColor: colors.accent.goldMuted }]}>
          <Icon size={40} color={colors.accent.gold} strokeWidth={1.5} />
        </View>
        <View style={[styles.badge, { backgroundColor: colors.accent.goldMuted }]}>
          <Text font="mono" style={[styles.badgeText, { color: colors.accent.gold }]}>
            {t('placeholder.soon').toUpperCase()}
          </Text>
        </View>
        <Text variant="screenHeading" align="center" accessibilityRole="header" style={{ marginTop: 14 }}>
          {title}
        </Text>
        <Text variant="body" color="secondary" align="center" style={styles.desc}>
          {description}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconHalo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  desc: { maxWidth: 280, marginTop: 8 },
});
