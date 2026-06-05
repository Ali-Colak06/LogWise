/**
 * AppBottomSheet — Genel amaçlı bottom sheet (ADIM 6).
 *
 * plain RN Modal + Reanimated slide-up + scrim.
 * Drag-to-dismiss: react-native-gesture-handler Gesture.Pan().
 *
 * KRİTİK (Android): RN <Modal> ayrı bir native window'da render olur ve kök
 * <GestureHandlerRootView> (app/_layout.tsx) ağacının DIŞINDADIR. Bu yüzden
 * gesture-handler / PanResponder Modal içinde Android'de çalışmaz. Çözüm:
 * Modal içeriğini KENDİ <GestureHandlerRootView>'una sarmak. Aşağıdaki
 * `<GestureHandlerRootView style={styles.root}>` tam olarak bunun için var —
 * silmeyin.
 *
 * Scroll + drag birlikte: ScrollView'un native gesture'ı ile Pan gesture
 * `simultaneousWithExternalGesture` ile eşleştirilir; sheet yalnızca scroll
 * en tepedeyken (scrollOffset <= 0) ve aşağı sürüklenirken hareket eder.
 */
import { useEffect, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

export interface AppBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeightRatio?: number;
  /**
   * Sheet'in ekran yüksekliğine oranlı **minimum** yüksekliği (0-1). Kısa içerikli
   * sheet'lerin (NewProgram, ProgramAction, CustomExerciseEdit) içeriğe göre büzülüp
   * fazla alçak kalmasını önler — örn. 0.5 → en az yarım ekran. Verilmezse min yok
   * (sheet içerik kadar). `maxHeightRatio`'dan büyük olmamalı.
   */
  minHeightRatio?: number;
  contentStyle?: ViewStyle;
  footer?: React.ReactNode;
  testID?: string;
}

const DISMISS_THRESHOLD = 80; // px sürükleme
const DISMISS_VELOCITY = 500; // px/s (reanimated velocity px cinsinden)

export default function AppBottomSheet({
  visible,
  onClose,
  children,
  maxHeightRatio = 0.85,
  minHeightRatio,
  contentStyle,
  footer,
  testID,
}: AppBottomSheetProps) {
  const { colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();

  // Sheet kapalıyken bu kadar aşağıda. Ekran yüksekliği kadar → her boyutta tam gizli.
  const HIDDEN = screenH;

  const sheetY = useSharedValue(HIDDEN);
  const scrim = useSharedValue(0);
  const scrollOffset = useSharedValue(0);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const callClose = () => onCloseRef.current();

  // Giriş / çıkış animasyonu
  useEffect(() => {
    if (visible) {
      sheetY.value = HIDDEN;
      scrollOffset.value = 0;
      sheetY.value = withTiming(0, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });
      scrim.value = withTiming(1, { duration: 250 });
    } else {
      sheetY.value = HIDDEN;
      scrim.value = 0;
    }
  }, [visible, HIDDEN, sheetY, scrim, scrollOffset]);

  // ScrollView konumunu UI thread'de takip et (drag gate için)
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollOffset.value = e.contentOffset.y;
  });

  // İç ScrollView'un native gesture'ı — Pan ile aynı anda çalışsın.
  const nativeGesture = Gesture.Native();

  const panGesture = Gesture.Pan()
    // Sadece aşağı yönde 10px sonra aktive ol → yatay/yukarı scroll'a karışma
    .activeOffsetY(10)
    .simultaneousWithExternalGesture(nativeGesture)
    .onUpdate((e) => {
      'worklet';
      // Sadece scroll en tepedeyken ve aşağı çekilirken sheet'i taşı
      if (scrollOffset.value <= 0 && e.translationY > 0) {
        sheetY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      'worklet';
      const shouldDismiss =
        scrollOffset.value <= 0 &&
        (e.translationY > DISMISS_THRESHOLD || e.velocityY > DISMISS_VELOCITY);

      if (shouldDismiss) {
        sheetY.value = withTiming(
          HIDDEN,
          { duration: 200, easing: Easing.in(Easing.cubic) },
          (finished) => {
            if (finished) runOnJS(callClose)();
          },
        );
      } else {
        sheetY.value = withSpring(0, { damping: 18, stiffness: 180 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: scrim.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      testID={testID}
    >
      {/* KRİTİK: Modal kendi native window'unda → kendi GH root'u şart (Android). */}
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[styles.scrim, scrimStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityLabel="close"
          />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
          pointerEvents="box-none"
        >
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                styles.sheet,
                shadows.modal,
                {
                  backgroundColor: colors.background.elevated,
                  maxHeight: `${Math.round(maxHeightRatio * 100)}%`,
                  ...(minHeightRatio ? { minHeight: Math.round(screenH * minHeightRatio) } : null),
                  paddingBottom: insets.bottom + 12,
                },
                sheetStyle,
                contentStyle,
              ]}
            >
              <View style={styles.handleWrap}>
                <View style={[styles.handle, { backgroundColor: colors.border.strong }]} />
              </View>

              <GestureDetector gesture={nativeGesture}>
                <Animated.ScrollView
                  style={{ flexShrink: 1 }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ flexGrow: 1 }}
                  onScroll={scrollHandler}
                  scrollEventThrottle={16}
                >
                  {children}
                </Animated.ScrollView>
              </GestureDetector>

              {footer && <View style={styles.footer}>{footer}</View>}
            </Animated.View>
          </GestureDetector>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
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
    paddingTop: 0,
  },
  handleWrap: {
    paddingTop: 12,
    paddingBottom: 10,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  footer: { paddingTop: 8 },
});
