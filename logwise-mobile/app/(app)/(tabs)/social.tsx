/**
 * F2 Social placeholder (ADIM 6 — §3.1).
 */
import { Users } from 'lucide-react-native';
import PlaceholderScreen from '../../../components/shared/PlaceholderScreen';
import { useT } from '../../../lib/i18n';

export default function SocialScreen() {
  const t = useT();
  return (
    <PlaceholderScreen
      icon={Users}
      title={t('placeholder.socialTitle')}
      description={t('placeholder.socialDesc')}
    />
  );
}
