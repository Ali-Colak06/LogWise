/**
 * "more" tab placeholder route (ADIM 6).
 *
 * Bottom nav "More" tap'i route'a gitmez → MoreSheet açar (BottomTabBar onMorePress).
 * Bu route yine de bir screen gerektirir (Tabs.Screen target). Kullanıcı buraya
 * doğrudan düşerse Calendar'a yönlendir (sheet zaten layout seviyesinde).
 */
import { Redirect } from 'expo-router';

export default function MoreRoute() {
  return <Redirect href="/(app)/(tabs)/calendar" />;
}
