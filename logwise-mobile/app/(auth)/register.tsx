/**
 * A3 Register — kayıt ekranı (email doğrulaması AÇIK akışı).
 *
 * Spec: 05-screen-specs.md §A4 Register.
 * Karar kaynakları:
 *   §3.3 — display_name (fullname) zorunlu. Username web paritesi için eklendi
 *          (app_profiles.username UNIQUE; kayıttan önce RPC ile müsaitlik kontrolü).
 *   Email doğrulaması AÇIK (proje geneli, web ile ortak) → signUp session DÖNDÜRMEZ.
 *     Kayıt sonrası "mailini kontrol et" (Verify) ekranına gidilir; profil oluşturma
 *     + misafir→hesap migration'ı doğrulama+ilk girişten sonra `(app)/_layout`'ta
 *     yapılır (signup anında session yok → RLS engelliyor).
 *   §5 — Google OAuth YOK; email+password only.
 */
import { useState, useRef } from 'react';
import { Mail, Lock, User, AtSign } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { TextInput as RNTextInput, KeyboardAvoidingView, Keyboard, Platform } from 'react-native';
import { Button, HStack, Icon, Input, Screen, Text, VStack, useToast } from '../../components/ui';
import AuthHeader from '../../components/shared/AuthHeader';
import AuthBrand from '../../components/shared/AuthBrand';
import { useT } from '../../lib/i18n';
import { useAuthSignUp } from '../../queries/auth';
import { useAuthStore } from '../../stores/auth-store';
import { writePendingMigration } from '../../lib/guest-storage';

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

// Web ile aynı kural: 3-20 karakter, harf/rakam/alt çizgi.
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export default function RegisterScreen() {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const guestMode = useAuthStore((s) => s.mode);

  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const [fullnameErr, setFullnameErr] = useState<string | undefined>(undefined);
  const [usernameErr, setUsernameErr] = useState<string | undefined>(undefined);
  const [emailErr, setEmailErr] = useState<string | undefined>(undefined);
  const [pwErr, setPwErr] = useState<string | undefined>(undefined);
  const [confirmErr, setConfirmErr] = useState<string | undefined>(undefined);

  const usernameRef = useRef<RNTextInput | null>(null);
  const emailRef = useRef<RNTextInput | null>(null);
  const passwordRef = useRef<RNTextInput | null>(null);
  const confirmRef = useRef<RNTextInput | null>(null);

  const signUp = useAuthSignUp();

  const onSubmit = () => {
    let ok = true;
    setFullnameErr(undefined);
    setUsernameErr(undefined);
    setEmailErr(undefined);
    setPwErr(undefined);
    setConfirmErr(undefined);

    const trimmedName = fullname.trim();
    const trimmedUsername = username.trim();
    if (trimmedName.length < 2) {
      setFullnameErr(t('auth.errFullnameTooShort'));
      ok = false;
    }
    if (!trimmedUsername) {
      setUsernameErr(t('auth.errUsernameRequired'));
      ok = false;
    } else if (!USERNAME_RE.test(trimmedUsername)) {
      setUsernameErr(t('auth.errUsernameInvalid'));
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

    // Toast ekran altında; klavye açıkken arkasında kalmasın diye submit'te kapat.
    Keyboard.dismiss();
    signUp.mutate(
      { email, password, fullname: trimmedName, username: trimmedUsername },
      {
        onSuccess: async (result) => {
          // Misafir verisi varsa: doğrulama + ilk girişten sonra (app)/_layout migrate eder.
          if (guestMode === 'guest') {
            await writePendingMigration(true);
          }

          // Email doğrulaması AÇIK → signUp session döndürmez → "mailini kontrol et".
          if (!result.session) {
            toast.show({ message: t('auth.verifyEmailSent'), variant: 'success' });
            router.replace({ pathname: '/(auth)/verify', params: { email: email.trim() } });
            return;
          }

          // Defansif: doğrulama kapalıysa session döner. Profil + migration ilk girişte
          // (app)/_layout'ta işlenir; layout otomatik calendar'a yönlendirir.
          toast.show({ message: t('auth.accountCreated'), variant: 'success' });
        },
        onError: (err) => {
          const raw = err.message ?? '';
          // Username alınmış → inline alan hatası (toast değil).
          if (raw === 'USERNAME_TAKEN') {
            setUsernameErr(t('auth.errUsernameTaken'));
            return;
          }
          const msg = raw.toLowerCase();
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
      <AuthHeader backAccessibilityLabel={t('auth.backToLogin')} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <VStack gap="2xl" align="center" paddingY="2xl">
          {/* Brand */}
          <AuthBrand subhead={t('auth.subheadRegister')} />

          <VStack gap="md" width="100%">
            <Input
              value={fullname}
              onChangeText={setFullname}
              type="text"
              placeholder={t('auth.fullname')}
              iconLeft={<Icon component={User} size={18} color="secondary" />}
              autoComplete="name"
              returnKeyType="next"
              onSubmitEditing={() => usernameRef.current?.focus()}
              error={fullnameErr}
              testID="register-fullname"
            />

            <Input
              ref={usernameRef}
              value={username}
              onChangeText={(v) => setUsername(v.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
              type="username"
              placeholder={t('auth.username')}
              iconLeft={<Icon component={AtSign} size={18} color="secondary" />}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              error={usernameErr}
              testID="register-username"
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
    </Screen>
  );
}
