/**
 * A5 Verify Email — kayıt sonrası "mailini kontrol et" ekranı.
 *
 * Email doğrulaması AÇIK (proje geneli). signUp session döndürmediği için kayıt
 * sonrası buraya yönlendirilir. Kullanıcı maildeki bağlantıyı (tarayıcıda) onaylar,
 * sonra uygulamaya dönüp GİRİŞ yapar → `(app)/_layout` profil + migration'ı halleder.
 *
 * Mobil deep link MVP'de yok → onay tarayıcıda olur, kullanıcı app'e dönüp login olur.
 */
import { useEffect, useState } from 'react';
import { MailCheck, Info } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button, HStack, Icon, Screen, Text, VStack, useToast } from '../../components/ui';
import AuthHeader from '../../components/shared/AuthHeader';
import AuthBrand from '../../components/shared/AuthBrand';
import { useT } from '../../lib/i18n';
import { useAuthResendSignup } from '../../queries/auth';

const RESEND_SECONDS = 60;

export default function VerifyScreen() {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' ? params.email : '';

  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const resend = useAuthResendSignup();

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const onResend = () => {
    if (!email) return;
    resend.mutate(
      { email },
      {
        onSuccess: () => {
          setCountdown(RESEND_SECONDS);
          toast.show({ message: t('auth.verifyResent'), variant: 'success' });
        },
        onError: (err) => {
          const msg = err.message?.toLowerCase() ?? '';
          const key = msg.includes('rate') || msg.includes('too many') ? 'errRateLimit' : 'errNetwork';
          toast.show({ message: t(`auth.${key}`), variant: 'danger' });
        },
      },
    );
  };

  const formatCountdown = (n: number) => `0:${n.toString().padStart(2, '0')}`;
  const resendLabel =
    countdown > 0 ? `${t('auth.verifyResend')} (${formatCountdown(countdown)})` : t('auth.verifyResend');

  return (
    <Screen variant="default" scroll={true}>
      <AuthHeader
        onBack={() => router.replace('/(auth)/login')}
        backAccessibilityLabel={t('auth.backToLogin')}
      />

      <VStack gap="2xl" align="center" paddingY="2xl">
        {/* Brand */}
        <AuthBrand />

        <VStack gap="md" align="center">
          <Icon component={MailCheck} size={48} accent />
          <Text variant="screenHeading" font="display" align="center">
            {t('auth.verifyTitle')}
          </Text>
          <Text variant="body" color="secondary" align="center">
            {t('auth.verifySubtitle')}
          </Text>
          {email ? (
            <Text variant="bodyStrong" color="primary" align="center">
              {email}
            </Text>
          ) : null}
          <Text variant="caption" color="tertiary" align="center">
            {t('auth.verifyAfterConfirm')}
          </Text>
        </VStack>

        <VStack gap="md" width="100%">
          {/* Onaydan sonra giriş yap */}
          <Button
            label={t('auth.login')}
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => router.replace('/(auth)/login')}
          />
          {/* Doğrulama mailini yeniden gönder (countdown) */}
          <Button
            label={resendLabel}
            variant="secondary"
            size="md"
            fullWidth
            disabled={countdown > 0 || resend.isPending || !email}
            onPress={onResend}
          />
        </VStack>

        {/* Spam/gereksiz klasörü ipucu */}
        <HStack gap="sm" align="flex-start" paddingX="sm">
          <Icon component={Info} size={16} color="tertiary" />
          <Text variant="caption" color="tertiary" style={{ flex: 1 }}>
            {t('auth.verifySpamTip')}
          </Text>
        </HStack>
      </VStack>
    </Screen>
  );
}
