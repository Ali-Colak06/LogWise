/**
 * BottomTabBar — custom Expo Router tab bar (ADIM 6 — §3.1).
 *
 * 5 sekme: Calendar / Library / Dashboard / Social / More.
 * "More" sekmesi route'a gitmez → MoreSheet açar (onMorePress).
 * Aktif sekme: gold ikon + gold üst çizgi (underline).
 */
import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CalendarDays, Dumbbell, BarChart2, Users, Menu } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { useT } from '../../lib/i18n';
import type { LucideIconProps } from './Icon';
import Text from './Text';

type IconCmp = ComponentType<LucideIconProps>;

const ICONS: Record<string, IconCmp> = {
  calendar: CalendarDays,
  workout: Dumbbell,
  dashboard: BarChart2,
  social: Users,
  more: Menu,
};

const LABEL_KEYS: Record<string, string> = {
  calendar: 'nav.calendar',
  workout: 'nav.library',
  dashboard: 'nav.dashboard',
  social: 'nav.social',
  more: 'nav.more',
};

export interface AppBottomTabBarProps extends BottomTabBarProps {
  onMorePress: () => void;
}

export default function BottomTabBar({
  state,
  navigation,
  onMorePress,
}: AppBottomTabBarProps) {
  const { colors } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.background.elevated,
          borderTopColor: colors.border.subtle,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const Icon = ICONS[route.name] ?? Menu;
        const labelKey = LABEL_KEYS[route.name] ?? route.name;
        const isMore = route.name === 'more';
        const focused = !isMore && state.index === index;

        const onPress = () => {
          if (isMore) {
            onMorePress();
            return;
          }
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.item}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={t(labelKey as never)}
          >
            <View
              style={[
                styles.indicator,
                { backgroundColor: focused ? colors.accent.gold : 'transparent' },
              ]}
            />
            <Icon
              size={22}
              color={focused ? colors.accent.gold : colors.text.secondary}
              strokeWidth={2}
            />
            <Text
              variant="meta"
              color={focused ? 'primary' : 'secondary'}
              style={styles.label}
            >
              {t(labelKey as never)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  indicator: {
    position: 'absolute',
    top: -6,
    width: 28,
    height: 2.5,
    borderRadius: 2,
  },
  label: {
    marginTop: 1,
  },
});
