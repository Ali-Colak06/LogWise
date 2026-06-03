/**
 * A4 Forgot Password — ADIM 4 final implementation.
 *
 * Spec: 05-screen-specs.md §A5 Forgot Password.
 * Karar kaynakları:
 *   §A5 — Supabase resetPasswordForEmail; her zaman 200 (security)
 *   §A5 — Deep link MVP'de yok — mail tarayicida acilir, user app'e doner ve A2'de gir
 *
 * Akış:
 *   - Email input + submit
 *   - Submit → useAuthResetPassword mutation
 *   - Success → form yerine inline success message (✓ icon + email pill + tip)
 *               + countdown ile "Yeniden gonder" (60sn)
 *               + back-link
 *   - Error (rate-limit / network) → toast
 *
 * MVP'de SUCCESS state'i:
 *   - Form alanı kalkar
 *   - Lock icon → MailCheck icon (gold)
 *   - "E-posta gönderildi." message
 *   - 60sn countdown + "Yeniden gönder"
 *   - Back-link (Login'e dön)
 */
import { useEffect, useState } from 'react';
import { Mail, Lock, MailCheck, ChevronLeft, ArrowLeft, Globe, Info } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { Button, HStack, Icon, Input, Screen, Text, VStack, useToast } from '../../components/ui';
import { useT, useLocaleStore } from '../../lib/i18n';
import { useAuthResetPassword } from '../../queries/auth';

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

const RESEND_SECONDS = 60;

export default function ForgotPasswordScreen() {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const [email, setEmail] = useState('');
  const [emailErr, setEmailErr] = useState<string | undefined>(undefined);
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const resetPassword = useAuthResetPassword();

  // Countdown tick
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const onSubmit = () => {
    setEmailErr(undefined);

    if (!email.trim()) {
      setEmailErr(t('auth.errEmailRequired'));
      return;
    }
    if (!isValidEmail(email)) {
      setEmailErr(t('auth.errInvalidEmail'));
      return;
    }

    resetPassword.mutate(
      { email },
      {
        onSuccess: () => {
          setSent(true);
          setCountdown(RESEND_SECONDS);
          toast.show({ message: t('auth.resetEmailSent'), variant: 'success' });
        },
        onError: (err) => {
          const msg = err.message?.toLowerCase() ?? '';
          if (msg.includes('rate') || msg.includes('too many')) {
            toast.show({ message: t('auth.errRateLimit'), variant: 'danger' });
          } else {
            toast.show({ message: t('auth.errNetwork'), variant: 'danger' });
          }
        },
      },
    );
  };

  const isSubmitting = resetPassword.isPending;
  const formatCountdown = (n: number) => `0:${n.toString().padStart(2, '0')}`;

  return (
    <Screen variant="default" scroll={true}>
      <HStack justify="space-between" align="center" paddingY="sm">
        <Button
          variant="ghost"
          size="sm"
          icon={<Icon component={ChevronLeft} size={22} color="secondary" />}
          onPress={() => router.back()}
          accessibilityLabel={t('auth.backToLogin')}
        />
        <Button
          label={locale === 'tr' ? 'TR' : 'EN'}
          variant="ghost"
          size="sm"
          icon={<Icon component={Globe} size={16} color="secondary" />}
          onPress={() => setLocale(locale === 'tr' ? 'en' : 'tr')}
        />
      </HStack>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <VStack gap="2xl" align="center" paddingY="2xl">
          {/* Brand */}
          <Text variant="title" font="display" align="center">
            LogWise
          </Text>

          {/* Big icon + section title */}
          <VStack gap="md" align="center">
            <Icon component={sent ? MailCheck : Lock} size={48} accent />
            <Text variant="screenHeading" font="display" align="center">
              {sent ? t('auth.forgotSent') : t('auth.forgotTitle')}
            </Text>
            {!sent && (
              <Text variant="body" color="secondary" align="center">
                {t('auth.forgotSubtitle')}
              </Text>
            )}
          </VStack>

          {!sent ? (
            <>
              <VStack gap="md" width="100%">
                <Input
                  value={email}
                  onChangeText={setEmail}
                  type="email"
                  autoFocus
                  placeholder={t('auth.email')}
                  iconLeft={<Icon component={Mail} size={18} color="secondary" />}
                  returnKeyType="go"
                  onSubmitEditing={onSubmit}
                  error={emailErr}
                  testID="forgot-email"
                />

                <Button
                  label={isSubmitting ? t('auth.submittingLogin') : t('auth.forgotSubmit')}
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  onPress={onSubmit}
                  testID="forgot-submit"
                />
              </VStack>

              {/* Info tip */}
              <HStack gap="sm" align="flex-start" paddingX="sm">
                <Icon component={Info} size={16} color="tertiary" />
                <Text variant="caption" color="tertiary" style={{ flex: 1 }}>
                  {t('auth.forgotTip')}
                </Text>
              </HStack>
            </>
          ) : (
            <>
              {/* Success: email pill + resend countdown */}
              <Text variant="body" color="primary" align="center">
                {email}
              </Text>

              <HStack gap="sm" align="flex-start" paddingX="sm">
                <Icon component={Info} size={16} color="tertiary" />
                <Text variant="caption" color="tertiary" style={{ flex: 1 }}>
                  {t('auth.forgotTip')}
                </Text>
              </HStack>

              <Button
                label={
                  countdown > 0
                    ? `${t('auth.forgotSubmit')} (${formatCountdown(countdown)})`
                    : t('auth.forgotSubmit')
                }
                variant="secondary"
                size="md"
                fullWidth
                disabled={countdown > 0 || isSubmitting}
                onPress={onSubmit}
              />
            </>
          )}

          {/* Back-link */}
          <Button
            label={t('auth.backToLogin')}
            variant="ghost"
            size="sm"
            icon={<Icon component={ArrowLeft} size={16} color="secondary" />}
            onPress={() => router.replace('/(auth)/login')}
          />
        </VStack>
      </KeyboardAvoidingView>
    </Screen>
  );
}
