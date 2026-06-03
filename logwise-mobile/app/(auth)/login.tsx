/**
 * A2 Login — ADIM 4 final implementation.
 *
 * Spec: 05-screen-specs.md §A3 Login.
 * Karar kaynakları:
 *   §3.6 — Auto-login aktif, login success → calendar
 *   §3.10 — Web kullanıcısı modal'ı B1 mount sonrası (burada handle etmez)
 *   §5 — Google OAuth YOK; email+password only
 *
 * Akış:
 *   - Form: email + password
 *   - Submit → useAuthSignIn mutation
 *   - Success → onAuthStateChange store günceller → (auth) layout redirect → /(app)/calendar
 *   - Error → toast (variant=danger)
 *
 * Validation (client-side, submit'te):
 *   - Email format (basit regex)
 *   - Password >=1 char (boş kabul etme)
 *   Daha detaylı validation gerekirse (rate-limit, password policy) backend döner.
 */
import { useState, useRef } from 'react';
import { Mail, Lock, ChevronLeft, Globe } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { TextInput as RNTextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, HStack, Icon, Input, Screen, Text, VStack, useToast } from '../../components/ui';
import { useT, useLocaleStore } from '../../lib/i18n';
import { useAuthSignIn } from '../../queries/auth';

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export default function LoginScreen() {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailErr, setEmailErr] = useState<string | undefined>(undefined);
  const [pwErr, setPwErr] = useState<string | undefined>(undefined);

  const passwordRef = useRef<RNTextInput | null>(null);
  const signIn = useAuthSignIn();

  const onSubmit = () => {
    let ok = true;
    setEmailErr(undefined);
    setPwErr(undefined);

    if (!email.trim()) {
      setEmailErr(t('auth.errEmailRequired'));
      ok = false;
    } else if (!isValidEmail(email)) {
      setEmailErr(t('auth.errInvalidEmail'));
      ok = false;
    }
    if (!password) {
      setPwErr(t('auth.errPasswordRequired'));
      ok = false;
    }
    if (!ok) return;

    signIn.mutate(
      { email, password },
      {
        onSuccess: () => {
          toast.show({ message: t('auth.welcomeBack'), variant: 'success' });
          // Auth gating redirect (auth)/_layout.tsx tarafından yapılır.
        },
        onError: (err) => {
          // Supabase'in döndüğü mesajı i18n'e mahcup map:
          const msg = err.message?.toLowerCase() ?? '';
          let key: 'errInvalidCredentials' | 'errNetwork' | 'errRateLimit' = 'errInvalidCredentials';
          if (msg.includes('rate') || msg.includes('too many')) key = 'errRateLimit';
          else if (msg.includes('network') || msg.includes('fetch')) key = 'errNetwork';
          toast.show({ message: t(`auth.${key}`), variant: 'danger' });
        },
      },
    );
  };

  const isSubmitting = signIn.isPending;

  return (
    <Screen variant="default" scroll={true}>
      {/* Top bar: back + lang pill */}
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
          <VStack gap="xs" align="center">
            <Text variant="title" font="display" align="center">
              LogWise
            </Text>
            <Text variant="body" color="secondary" align="center">
              {t('auth.subheadLogin')}
            </Text>
          </VStack>

          {/* Form */}
          <VStack gap="md" width="100%">
            <Input
              value={email}
              onChangeText={setEmail}
              type="email"
              placeholder={t('auth.email')}
              iconLeft={<Icon component={Mail} size={18} color="secondary" />}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={emailErr}
              testID="login-email"
            />

            <Input
              ref={passwordRef}
              value={password}
              onChangeText={setPassword}
              type="password"
              placeholder={t('auth.password')}
              iconLeft={<Icon component={Lock} size={18} color="secondary" />}
              returnKeyType="go"
              onSubmitEditing={onSubmit}
              error={pwErr}
              testID="login-password"
            />

            <View style={{ alignItems: 'flex-end' }}>
              <Button
                label={t('auth.forgotPasswordQ')}
                variant="ghost"
                size="sm"
                onPress={() => router.push('/(auth)/forgot-password')}
              />
            </View>

            <Button
              label={isSubmitting ? t('auth.submittingLogin') : t('auth.submitLogin')}
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting}
              loading={isSubmitting}
              onPress={onSubmit}
              testID="login-submit"
            />
          </VStack>

          {/* Swap row */}
          <HStack gap="xs" align="center" wrap>
            <Text variant="body" color="secondary">
              {t('auth.noAccount')}
            </Text>
            <Button
              label={t('auth.register')}
              variant="ghost"
              size="sm"
              onPress={() => router.replace('/(auth)/register')}
            />
          </HStack>

          {/* Legal */}
          <Text variant="caption" color="tertiary" align="center">
            {t('auth.legal')}
          </Text>
        </VStack>
      </KeyboardAvoidingView>
    </Screen>
  );
}
