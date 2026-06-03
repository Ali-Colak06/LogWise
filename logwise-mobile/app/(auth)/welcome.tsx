/**
 * A1 Welcome — ADIM 4 final implementation.
 *
 * Spec: 05-screen-specs.md §A2 Welcome (anonim kullanıcının ilk gerçek temas noktası).
 * Karar kaynakları: §3.6 (auto-login), §3.9 (guest mode), §3.9.1 (guest -> hesap).
 *
 * Akış:
 *   - Login butonu  → router.push('/login')        (A2)
 *   - Register butonu → router.push('/register')   (A3)
 *   - Misafir butonu → enterGuest() + writeGuestModeFlag(true) + router.replace('/(app)/calendar')
 *
 * Layout (prototype'ta yok ama spec'te §A2 layout sketch'te tarif edildi):
 *   [Lang pill top-right] [BrandMark + Wordmark + Tagline center] [3 CTA buttons] [guest note]
 */
import { Globe } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Button, HStack, Icon, Screen, Text, VStack } from '../../components/ui';
import { useT, useLocaleStore } from '../../lib/i18n';
import { useAuthStore } from '../../stores/auth-store';
import { writeGuestModeFlag } from '../../lib/guest-storage';

export default function WelcomeScreen() {
  const t = useT();
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const enterGuest = useAuthStore((s) => s.enterGuest);

  const toggleLocale = () => setLocale(locale === 'tr' ? 'en' : 'tr');

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
      {/* Top-right lang pill */}
      <HStack
        style={{
          position: 'absolute',
          top: 8,
          right: 16,
          zIndex: 10,
        }}
        gap="xs"
      >
        <Button
          label={locale === 'tr' ? 'TR' : 'EN'}
          variant="ghost"
          size="sm"
          icon={<Icon component={Globe} size={16} color="secondary" />}
          onPress={toggleLocale}
        />
      </HStack>

      <VStack gap="4xl" align="center" width="100%" paddingY="4xl">
        {/* Brand block */}
        <VStack gap="sm" align="center">
          <Text variant="title" font="display" align="center">
            LogWise
          </Text>
          <Text variant="body" color="secondary" align="center">
            {t('auth.tagline')}
          </Text>
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
            variant="secondary"
            size="md"
            fullWidth
            onPress={handleGuest}
          />
        </VStack>

        {/* Guest note */}
        <Text variant="caption" color="tertiary" align="center">
          {t('guest.guestNote')}
        </Text>
      </VStack>
    </Screen>
  );
}
