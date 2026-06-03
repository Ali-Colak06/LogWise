/**
 * A3 Register — ADIM 4 final + ADIM 5 migration entegrasyon.
 *
 * Spec: 05-screen-specs.md §A4 Register.
 * Karar kaynakları:
 *   §3.3 — Username YOK (MVP); display_name (fullname) zorunlu
 *   §3.6 — Email confirmation KAPALI; signUp success -> session direkt doner -> calendar
 *   §3.9.1 — Misafir -> hesap migration (ADIM 5: gercek impl + overlay)
 *   §5    — Google OAuth YOK; email+password only
 */
import { useState, useRef } from 'react';
import { Mail, Lock, User, ChevronLeft, Globe } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { TextInput as RNTextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, HStack, Icon, Input, Screen, Text, VStack, useToast } from '../../components/ui';
import { useT, useLocaleStore } from '../../lib/i18n';
import { useAuthSignUp } from '../../queries/auth';
import { useAuthStore } from '../../stores/auth-store';
import { migrateGuestToAccount } from '../../lib/migration';
import { clearAllGuestData, writeGuestModeFlag } from '../../lib/guest-storage';
import MigrationLoadingOverlay from '../../components/auth/MigrationLoadingOverlay';

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export default function RegisterScreen() {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const guestMode = useAuthStore((s) => s.mode);
  const exitGuest = useAuthStore((s) => s.exitGuest);

  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const [fullnameErr, setFullnameErr] = useState<string | undefined>(undefined);
  const [emailErr, setEmailErr] = useState<string | undefined>(undefined);
  const [pwErr, setPwErr] = useState<string | undefined>(undefined);
  const [confirmErr, setConfirmErr] = useState<string | undefined>(undefined);

  const emailRef = useRef<RNTextInput | null>(null);
  const passwordRef = useRef<RNTextInput | null>(null);
  const confirmRef = useRef<RNTextInput | null>(null);

  const signUp = useAuthSignUp();
  const [migrating, setMigrating] = useState(false);

  const onSubmit = () => {
    let ok = true;
    setFullnameErr(undefined);
    setEmailErr(undefined);
    setPwErr(undefined);
    setConfirmErr(undefined);

    const trimmedName = fullname.trim();
    if (trimmedName.length < 2) {
      setFullnameErr(t('auth.errFullnameTooShort'));
      ok = false;
    }
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
    } else if (password.length < 8) {
      setPwErr(t('auth.errWeakPassword'));
      ok = false;
    }
    if (password !== confirmPw) {
      setConfirmErr(t('auth.errPasswordsMismatch'));
      ok = false;
    }
    if (!ok) return;

    signUp.mutate(
      { email, password, fullname: trimmedName },
      {
        onSuccess: async (result) => {
          toast.show({ message: t('auth.accountCreated'), variant: 'success' });

          if (guestMode === 'guest') {
            setMigrating(true);
            const res = await migrateGuestToAccount(result.userId);
            setMigrating(false);
            if (res.ok) {
              await clearAllGuestData();
              const ex = res.counts.exercises;
              const wk = res.counts.workouts;
              const msg = t('migration.successToast')
                .replace('%{ex}', String(ex))
                .replace('%{wk}', String(wk));
              toast.show({ message: msg, variant: 'success' });
            } else {
              console.warn('[register] migration fail', res.error);
              toast.show({ message: t('migration.errorToast'), variant: 'danger' });
            }
            await writeGuestModeFlag(false);
            exitGuest();
          }
        },
        onError: (err) => {
          const msg = err.message?.toLowerCase() ?? '';
          let key: 'errEmailTaken' | 'errWeakPassword' | 'errNetwork' | 'errRateLimit' = 'errEmailTaken';
          if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
            key = 'errEmailTaken';
          } else if (msg.includes('weak') || msg.includes('password')) {
            key = 'errWeakPassword';
          } else if (msg.includes('rate') || msg.includes('too many')) {
            key = 'errRateLimit';
          } else if (msg.includes('network') || msg.includes('fetch')) {
            key = 'errNetwork';
          }
          toast.show({ message: t(`auth.${key}`), variant: 'danger' });
        },
      },
    );
  };

  const isSubmitting = signUp.isPending;

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
          <VStack gap="xs" align="center">
            <Text variant="title" font="display" align="center">
              LogWise
            </Text>
            <Text variant="body" color="secondary" align="center">
              {t('auth.subheadRegister')}
            </Text>
          </VStack>

          <VStack gap="md" width="100%">
            <Input
              value={fullname}
              onChangeText={setFullname}
              type="text"
              placeholder={t('auth.fullname')}
              iconLeft={<Icon component={User} size={18} color="secondary" />}
              autoComplete="name"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              error={fullnameErr}
              testID="register-fullname"
            />

            <Input
              ref={emailRef}
              value={email}
              onChangeText={setEmail}
              type="email"
              placeholder={t('auth.email')}
              iconLeft={<Icon component={Mail} size={18} color="secondary" />}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={emailErr}
              testID="register-email"
            />

            <Input
              ref={passwordRef}
              value={password}
              onChangeText={setPassword}
              type="password"
              placeholder={t('auth.password')}
              iconLeft={<Icon component={Lock} size={18} color="secondary" />}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              error={pwErr}
              testID="register-password"
            />

            <Input
              ref={confirmRef}
              value={confirmPw}
              onChangeText={setConfirmPw}
              type="password"
              placeholder={t('auth.confirmPw')}
              iconLeft={<Icon component={Lock} size={18} color="secondary" />}
              autoComplete="new-password"
              returnKeyType="go"
              onSubmitEditing={onSubmit}
              error={confirmErr}
              testID="register-confirm"
            />

            <Button
              label={isSubmitting ? t('auth.submittingRegister') : t('auth.submitRegister')}
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting}
              loading={isSubmitting}
              onPress={onSubmit}
              testID="register-submit"
            />
          </VStack>

          <HStack gap="xs" align="center" wrap>
            <Text variant="body" color="secondary">
              {t('auth.hasAccount')}
            </Text>
            <Button
              label={t('auth.login')}
              variant="ghost"
              size="sm"
              onPress={() => router.replace('/(auth)/login')}
            />
          </HStack>

          <Text variant="caption" color="tertiary" align="center">
            {t('auth.legal')}
          </Text>
        </VStack>
      </KeyboardAvoidingView>

      <MigrationLoadingOverlay visible={migrating} />
    </Screen>
  );
}
