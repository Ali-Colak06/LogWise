/**
 * Screen — AppScreen primitive (§6 02-design-system).
 *
 * Sorumluluklar:
 *   - SafeAreaView ile system inset'leri (notch, home indicator) hesaba katar
 *   - `colors.background.app` arka planı uygular
 *   - StatusBar style'ını aktif tema ile senkronlar (dark → light icons; light → dark icons)
 *   - Opsiyonel scroll (`scroll` prop) — content screen'ler için ScrollView wrap
 *   - Variant: default | centered | modal
 *
 * Kullanım:
 *   <Screen>
 *     <Text variant="screenHeading">Hareketler</Text>
 *     {body...}
 *   </Screen>
 *
 *   <Screen variant="centered" scroll={false}>{...}</Screen>  // Auth/Welcome
 */
import { ScrollView, View, type ViewStyle, type ScrollViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { useTheme } from '../../theme';

export type ScreenVariant = 'default' | 'centered' | 'modal';

export interface ScreenProps {
  children: ReactNode;
  variant?: ScreenVariant;
  /** Default true; auth/welcome gibi tek viewport ekranda false ver */
  scroll?: boolean;
  /** Horizontal padding override (default: tokens.layout.screenHPadding) */
  hPadding?: number;
  /** Hangi safe-area kenarları uygulanacak. Default: ['top', 'left', 'right'] */
  edges?: readonly Edge[];
  /** ScrollView içerik stilini ekstra prop'la (sticky button vs. için) */
  scrollContentStyle?: ViewStyle;
  /** ScrollView ekstra props */
  scrollProps?: Omit<ScrollViewProps, 'children' | 'contentContainerStyle'>;
  testID?: string;
}

export default function Screen({
  children,
  variant = 'default',
  scroll = true,
  hPadding,
  edges = ['top', 'left', 'right'],
  scrollContentStyle,
  scrollProps,
  testID,
}: ScreenProps) {
  const { colors, scheme, tokens } = useTheme();
  const horizontalPadding = hPadding ?? tokens.layout.screenHPadding;

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background.app,
  };

  const contentStyle: ViewStyle = {
    flex: scroll ? undefined : 1,
    paddingHorizontal: horizontalPadding,
    ...(variant === 'centered'
      ? { justifyContent: 'center', alignItems: 'center', flexGrow: 1 }
      : {}),
    ...(variant === 'modal' ? { paddingTop: tokens.space.lg } : {}),
  };

  // StatusBar — tema ile senkron (dark theme → açık icon, light theme → koyu icon)
  const statusBarStyle = scheme === 'dark' ? 'light' : 'dark';

  return (
    <SafeAreaView
      edges={edges}
      style={containerStyle}
      testID={testID}
    >
      <StatusBar style={statusBarStyle} />
      {scroll ? (
        <ScrollView
          contentContainerStyle={[contentStyle, scrollContentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={contentStyle}>{children}</View>
      )}
    </SafeAreaView>
  );
}
