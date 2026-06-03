/**
 * AppBottomSheet — Genel amaçlı bottom sheet (ADIM 6).
 *
 * @gorhom/bottom-sheet yuklu degil → plain RN Modal + Animated slide-up + scrim.
 * Scrim tap dismiss, slide animasyonu (250ms). Drag-to-dismiss MVP'de yok
 * (paket bagimliligi olmadan basit/guvenli). Klavye acilinca KeyboardAvoidingView.
 */
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

export interface AppBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Sheet maksimum yukseklik orani (0-1). Default 0.85. */
  maxHeightRatio?: number;
  contentStyle?: ViewStyle;
  testID?: string;
}

export default function AppBottomSheet({
  visible,
  onClose,
  children,
  maxHeightRatio = 0.85,
  contentStyle,
  testID,
}: AppBottomSheetProps) {
  const { colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(600)).current;
  const scrim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scrim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      translateY.setValue(600);
      scrim.setValue(0);
    }
  }, [visible, translateY, scrim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.scrim, { opacity: scrim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="close" />
        </Animated.View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.sheet,
              shadows.modal,
              {
                backgroundColor: colors.background.elevated,
                maxHeight: `${Math.round(maxHeightRatio * 100)}%`,
                paddingBottom: insets.bottom + 12,
                transform: [{ translateY }],
              },
              contentStyle,
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border.strong }]} />
            {/* Content scrollable — uzun listelerde son row erişilebilir kalır */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1 }}
            >
              {children}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  kav: { justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
});
