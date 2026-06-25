/**
 * A1 Welcome — anonim kullanıcının ilk gerçek temas noktası.
 *
 * Spec: 05-screen-specs.md §A2 Welcome. Karar kaynakları: §3.6, §3.9, §3.9.1.
 *
 * Akış:
 *   - Hesap Oluştur → /(auth)/register  (primary)
 *   - Giriş Yap     → /(auth)/login     (secondary)
 *   - Misafir       → enterGuest() + writeGuestModeFlag(true) + /(app)/calendar (tertiary)
 *
 * Marka bloğu (BrandMark + Wordmark) ve LangPill auth ekranlarında ortaktır.
 */
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, LangPill, Screen, Text, VStack } from '../../components/ui';
import BrandMark from '../../components/shared/BrandMark';
import Wordmark from '../../components/shared/Wordmark';
import { space } from '../../theme/tokens';
import { useT, useLocaleStore } from '../../lib/i18n';
import { useAuthStore } from '../../stores/auth-store';
import { writeGuestModeFlag } from '../../lib/guest-storage';

export default function WelcomeScreen() {
  const t = useT();
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const enterGuest = useAuthStore((s) => s.enterGuest);

  const handleGuest = async () => {
    enterGuest();
    try {
      await writeGuestModeFlag(true);
    } catch (err) {
      console.warn('[welcome] writeGuestModeFlag fail', err);
    }
    router.replace('/(app)/calendar');
  };

  return (
    <Screen variant="centered" scroll={false}>
      {/* Üst sağ: segmented EN|TR */}
      <View style={{ position: 'absolute', top: 8, right: 16, zIndex: 10 }}>
        <LangPill value={locale} onChange={setLocale} />
      </View>

      <VStack gap="4xl" align="center" width="100%" paddingY="4xl">
        {/* Marka bloğu */}
        <VStack gap="lg" align="center">
          <BrandMark size={80} />
          <VStack gap="xs" align="center">
            <Wordmark size={26} />
            <Text variant="body" color="secondary" align="center">
              {t('auth.tagline')}
            </Text>
          </VStack>
        </VStack>

        {/* CTA stack */}
        <VStack gap="md" align="stretch" width="100%" paddingX="lg">
          <Button
            label={t('auth.register')}
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => router.push('/(auth)/register')}
          />
          <Button
            label={t('auth.login')}
            variant="secondary"
            size="lg"
            fullWidth
            onPress={() => router.push('/(auth)/login')}
          />
          <Button
            label={t('guest.continueAsGuest')}
            variant="ghost"
            size="md"
            fullWidth
            onPress={handleGuest}
            style={{ marginTop: space.sm }}
          />
        </VStack>

        {/* Misafir notu */}
        <Text variant="caption" color="tertiary" align="center">
          {t('guest.guestNote')}
        </Text>
      </VStack>
    </Screen>
  );
}
