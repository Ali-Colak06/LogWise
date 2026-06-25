/**
 * RestDayBanner — C3b off-day banner (ADIM 6 — §3.2 + C3).
 * Info/cyan tonu. "Yine de ekle" → C4 modal.
 */
import { StyleSheet, View, Pressable } from 'react-native';
import { Moon } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Text } from '../ui';
import { useT } from '../../lib/i18n';

export interface RestDayBannerProps {
  onAddAnyway: () => void;
}

export default function RestDayBanner({ onAddAnyway }: RestDayBannerProps) {
  const { colors } = useTheme();
  const t = useT();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.semantic.infoMuted, borderColor: colors.semantic.info },
      ]}
    >
      <Moon size={36} color={colors.semantic.info} strokeWidth={1.5} />
      <Text variant="sectionHeading" align="center" style={{ marginTop: 8 }}>
        {t('dayExtra.restDayTitle')}
      </Text>
      <Text variant="body" color="secondary" align="center" style={{ marginTop: 4 }}>
        {t('dayExtra.restDayBody')}
      </Text>
      <Pressable onPress={onAddAnyway} hitSlop={8} style={{ marginTop: 12 }}>
        <Text variant="caption" color="secondary">
          {t('dayExtra.restDayAddAnyway')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
});
