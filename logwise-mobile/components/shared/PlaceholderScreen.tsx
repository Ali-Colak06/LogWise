/**
 * PlaceholderScreen — F1 Dashboard + F2 Social ortak component (ADIM 6 — §3.1).
 *
 * Sade "yakında" mesajı: icon + başlık + açıklama. CTA yok (kullanıcı kararı rev 6).
 */
import { StyleSheet, View } from 'react-native';
import type { ComponentType } from 'react';
import { Screen, Text } from '../ui';
import { useTheme } from '../../theme';
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
  return (
    <Screen scroll={false}>
      <View style={styles.center} testID={testID}>
        <Icon size={56} color={colors.text.tertiary} strokeWidth={1.5} />
        <View style={{ height: 16 }} />
        <Text variant="screenHeading" align="center" accessibilityRole="header">
          {title}
        </Text>
        <View style={{ height: 8 }} />
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
  desc: { maxWidth: 280 },
});
