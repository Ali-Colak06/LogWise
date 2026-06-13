/**
 * AuthBrand — auth ekranları marka bloğu: BrandMark (gold L) + "LOG WISE" wordmark
 * + opsiyonel subhead. Login / Register / Forgot / Verify'da ortak.
 *
 * Prototip `.auth-brand`: çerçeveli logo (64) + gold wordmark (22) + subhead
 * (12px, secondary, hafif letter-spacing).
 */
import { Text, VStack } from '../ui';
import BrandMark from './BrandMark';
import Wordmark from './Wordmark';

export interface AuthBrandProps {
  /** Wordmark altında küçük açıklama (ör. "Giriş yap"). Yoksa gösterilmez. */
  subhead?: string;
  /** Logo çerçeve boyutu. Default 64. */
  markSize?: number;
  /** Wordmark fontSize. Default 22. */
  wordmarkSize?: number;
}

export default function AuthBrand({ subhead, markSize = 64, wordmarkSize = 22 }: AuthBrandProps) {
  return (
    <VStack gap="md" align="center">
      <BrandMark size={markSize} />
      <VStack gap="xs" align="center">
        <Wordmark size={wordmarkSize} />
        {subhead ? (
          <Text variant="caption" color="secondary" align="center" style={{ letterSpacing: 0.5 }}>
            {subhead}
          </Text>
        ) : null}
      </VStack>
    </VStack>
  );
}
