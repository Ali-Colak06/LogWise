/**
 * AuthHeader — auth ekranları üst barı (geri + segmented LangPill).
 *
 * Login / Register / Forgot / Verify ekranlarında ortak. Welcome kök ekran
 * olduğu için geri butonu yoktur; orada LangPill doğrudan kullanılır.
 *
 * Dil durumu store'dan kendi okur; ekranların ayrıca locale wire etmesi gerekmez.
 */
import { View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Button, HStack, Icon, LangPill } from '../ui';
import { useLocaleStore } from '../../lib/i18n';

export interface AuthHeaderProps {
  /** Geri butonu göster. Default true. */
  showBack?: boolean;
  /** Geri davranışı. Default router.back(). */
  onBack?: () => void;
  backAccessibilityLabel?: string;
}

export default function AuthHeader({ showBack = true, onBack, backAccessibilityLabel }: AuthHeaderProps) {
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  return (
    <HStack justify="space-between" align="center" paddingY="sm">
      {showBack ? (
        <Button
          variant="ghost"
          size="sm"
          icon={<Icon component={ChevronLeft} size={22} color="secondary" />}
          onPress={onBack ?? (() => router.back())}
          accessibilityLabel={backAccessibilityLabel}
        />
      ) : (
        <View />
      )}
      <LangPill value={locale} onChange={setLocale} />
    </HStack>
  );
}
