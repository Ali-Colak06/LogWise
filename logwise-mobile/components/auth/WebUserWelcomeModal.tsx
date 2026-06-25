/**
 * WebUserWelcomeModal — Web kullanicisi tek seferlik "Hos geldin" dialog (ADIM 5).
 *
 * Karar kaynagi: §3.10 03-mvp + rev 11 (B4 + B5):
 *   - Merkez modal (orta boy, max-width ~340pt)
 *   - Scrim siyah ~60% opacity
 *   - Icerik sirasi: marka mark (kucuk), baslik, 2-3 paragraf, web link, 2 buton
 *     ([Mobil'e Basla] primary gold + [Web'e Git] secondary ghost), en altta toggle
 *   - "Bu mesaji bir daha gosterme" toggle default `true` (B5 karari)
 *   - Hardware back = iptal (bayrak set ETMEZ) — §B1 rev 3
 *
 * Modal `visible` parent-controlled. `app_profiles.preferences.seen_web_welcome`
 * bayragi parent tarafindan yazilir (Calendar mount logic'i bunu kontrol eder).
 */
import { useState } from 'react';
import { Modal, View, StyleSheet, Switch, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { Text, Button, VStack, HStack } from '../ui';
import { useT } from '../../lib/i18n';

export interface WebUserWelcomeModalProps {
  visible: boolean;
  /** Aktif kapatma — [Mobil'e Basla] tap. Bayrak set olur (parent uygular). */
  onContinueMobile: (dontShowAgain: boolean) => void;
  /** [Web'e Git] tap — Linking.openURL parent'ta cagrilir; bayrak da set olur. */
  onOpenWeb: (dontShowAgain: boolean) => void;
  /** Hardware back / scrim tap = iptal (bayrak set ETMEZ; bir sonraki Calendar mount'ta tekrar acilir). */
  onDismiss?: () => void;
}

export default function WebUserWelcomeModal({
  visible,
  onContinueMobile,
  onOpenWeb,
  onDismiss,
}: WebUserWelcomeModalProps) {
  const { colors } = useTheme();
  const t = useT();
  const [dontShow, setDontShow] = useState<boolean>(true); // B5 karari: default isaretli

  const cancel = () => {
    onDismiss?.();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={cancel}
    >
      <Pressable style={styles.scrim} onPress={cancel}>
        {/* Inner pressable swallow — scrim tap kapatir, kart tap kapatmaz */}
        <Pressable onPress={() => undefined}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.background.elevated,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <VStack gap="md">
              {/* Marka mark (kucuk gold dot — gerçek BrandMark ADIM 6'da) */}
              <View
                style={[
                  styles.brandDot,
                  { backgroundColor: colors.accent.gold },
                ]}
              />

              <Text variant="screenHeading" align="center">
                {t('web.welcomeTitle')}
              </Text>

              <Text variant="body" color="secondary" align="center">
                {t('web.welcomeBody1')}
              </Text>
              <Text variant="body" color="secondary" align="center">
                {t('web.welcomeBody2')}
              </Text>

              <Text variant="caption" color="tertiary" align="center">
                {t('web.welcomeOpenUrlLabel')}
              </Text>

              <VStack gap="sm">
                <Button
                  variant="primary"
                  label={t('web.welcomeCtaStart')}
                  onPress={() => onContinueMobile(dontShow)}
                  fullWidth
                />
                <Button
                  variant="ghost"
                  label={t('web.welcomeCtaOpenWeb')}
                  onPress={() => onOpenWeb(dontShow)}
                  fullWidth
                />
              </VStack>

              <HStack gap="sm" align="center">
                <Switch
                  value={dontShow}
                  onValueChange={setDontShow}
                  trackColor={{ false: colors.border.subtle, true: colors.accent.gold }}
                  thumbColor={colors.background.elevated}
                />
                <Text variant="caption" color="secondary" style={{ flex: 1 }}>
                  {t('web.welcomeDontShowAgain')}
                </Text>
              </HStack>
            </VStack>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
  },
  brandDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignSelf: 'center',
  },
});
