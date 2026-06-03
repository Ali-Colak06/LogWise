/**
 * F1 Dashboard placeholder (ADIM 6 — §3.1).
 */
import { BarChart2 } from 'lucide-react-native';
import PlaceholderScreen from '../../../components/shared/PlaceholderScreen';
import { useT } from '../../../lib/i18n';

export default function DashboardScreen() {
  const t = useT();
  return (
    <PlaceholderScreen
      icon={BarChart2}
      title={t('placeholder.dashboardTitle')}
      description={t('placeholder.dashboardDesc')}
    />
  );
}
