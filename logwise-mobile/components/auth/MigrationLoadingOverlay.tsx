/**
 * MigrationLoadingOverlay — Full-screen loading overlay during guest→account migration (ADIM 5).
 *
 * Karar kaynagi: §3.9.1 rev 11 — Full-screen modal + sade gold spinner.
 *   - Tam ekran scrim (siyah, opacity ~0.75)
 *   - Ortada gold ActivityIndicator + altinda "Verileriniz aktariliyor..." metni
 *   - 15+ saniye gectikten sonra alt metin degisir ("Islem biraz uzadi, lutfen bekleyin...")
 *   - Kullanici dismiss EDEMEZ (modal `onRequestClose` no-op + hardware back yutulur).
 *   - Basari veya hata uzerinden kapanir (parent component `visible={false}` set eder).
 *
 * Token: gold = `colors.accent.gold`, scrim siyah hardcode (cunku dark/light her
 * iki tema icin de tam ekran scrim siyah olmalidir).
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, View, BackHandler, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from '../ui';
import { useT } from '../../lib/i18n';

export interface MigrationLoadingOverlayProps {
  visible: boolean;
  /** Long-mode esik suresi (ms) — default 15 sn. */
  longThresholdMs?: number;
}

export default function MigrationLoadingOverlay({
  visible,
  longThresholdMs = 15000,
}: MigrationLoadingOverlayProps) {
  const { colors } = useTheme();
  const t = useT();
  const [isLong, setIsLong] = useState(false);

  useEffect(() => {
    if (!visible) {
      setIsLong(false);
      return;
    }
    const timer = setTimeout(() => setIsLong(true), longThresholdMs);
    return () => clearTimeout(timer);
  }, [visible, longThresholdMs]);

  // Hardware back yutulur (Android).
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        /* dismiss yok */
      }}
    >
      <View style={styles.scrim}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent.gold} />
          <View style={{ height: 16 }} />
          <Text variant="bodyStrong" color="onSuccessStrong" align="center">
            {t('migration.overlayTitle')}
          </Text>
          <View style={{ height: 6 }} />
          <Text variant="body" color="onSuccessStrong" align="center">
            {isLong ? t('migration.overlayLong') : t('migration.overlaySubtitle')}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 320,
  },
});
