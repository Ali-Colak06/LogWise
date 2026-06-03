/**
 * A5 Verify Email — ADIM 4 placeholder.
 *
 * Spec: auth-prototype/index.html Section 4 + 05-screen-specs.md §A5 referansi.
 * Karar kaynagi: §3.6 03-mvp — Email confirmation **KAPALI** MVP'de.
 *
 * Bu route MVP'de pratikte hic mount edilmez — signUp dogrudan session doner ve
 * (auth)/_layout otomatik calendar'a yonlendirir. Yine de:
 *   - Supabase admin ayari yanlissa ve email_confirmed_at=null user donerse buraya
 *     yonlendirilebilir (defensive).
 *   - Future-proof: confirmation aktive edildiginde ekran zaten hazir.
 *
 * Su anki UI:
 *   - "E-posta dogrulamasi MVP'de kapali" mesaji
 *   - [Calendar'a git] CTA → /(app)/calendar replace
 *   - Back to login link
 */
import { MailCheck, ChevronLeft, Globe } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Button, HStack, Icon, Screen, Text, VStack } from '../../components/ui';
import { useT, useLocaleStore } from '../../lib/i18n';

export default function VerifyScreen() {
  const t = useT();
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  return (
    <Screen variant="default" scroll={true}>
      <HStack justify="space-between" align="center" paddingY="sm">
        <Button
          variant="ghost"
          size="sm"
          icon={<Icon component={ChevronLeft} size={22} color="secondary" />}
          onPress={() => router.back()}
        />
        <Button
          label={locale === 'tr' ? 'TR' : 'EN'}
          variant="ghost"
          size="sm"
          icon={<Icon component={Globe} size={16} color="secondary" />}
          onPress={() => setLocale(locale === 'tr' ? 'en' : 'tr')}
        />
      </HStack>

      <VStack gap="2xl" align="center" paddingY="4xl">
        <Text variant="title" font="display" align="center">
          LogWise
        </Text>

        <VStack gap="md" align="center">
          <Icon component={MailCheck} size={48} accent />
          <Text variant="screenHeading" font="display" align="center">
            {t('auth.verifyTitle')}
          </Text>
          <Text variant="body" color="secondary" align="center">
            {t('auth.verifySubtitle')}
          </Text>
        </VStack>

        <Text variant="body" color="primary" align="center">
          {t('auth.verifyContinue')}
        </Text>

        <VStack gap="md" width="100%">
          <Button
            label={t('auth.goToCalendar')}
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => router.replace('/(app)/calendar')}
          />
          <Button
            label={t('auth.backToLogin')}
            variant="ghost"
            size="md"
            fullWidth
            onPress={() => router.replace('/(auth)/login')}
          />
        </VStack>
      </VStack>
    </Screen>
  );
}
