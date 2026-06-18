/**
 * ReorderableCardList — Day Detail persisted egzersiz kartları için PAKETSİZ custom
 * drag-sort (C2 — §8.8 / §3.2). Reanimated 4 + gesture-handler (AppBottomSheet ile aynı
 * stack); `react-native-draggable-flatlist` EKLENMEDİ (RNA4 uyumu doğrulanmadı, Expo Go
 * bundle riski — kullanıcı kararı 2026-06-18).
 *
 * Model (değişken kart yüksekliği güvenli, "flash"sız):
 *   - Kartlar normal akışta (flex column + gap). Her kart bir Animated.View; görsel konum
 *     = doğal slot + translateY.
 *   - translateY = offsetOf(liveOrder) − offsetOf(committedIds): id-bazlı. Sürükleme
 *     bitince commit edilen sıra (ids) liveOrder ile örtüşür → translateY 0; yeniden-
 *     indeksleme "flash"ı YOK (index-bazlı modelin aksine).
 *   - Tetik SADECE handle'da (long-press → Pan): SetRow TextInput'larına bulaşmaz (§3.2).
 *
 * Reorder yalnızca persisted kartlarda; lazy program kartları bu listenin DIŞINDA render
 * edilir (lazy-write korunur — §8.11). Tek persisted kart varsa handle gösterilmez.
 *
 * NOT (MVP sınırı): kenar autoscroll YOK — viewport dışına sürükleme desteklenmez. Tipik
 * gün birkaç kart olduğundan yeterli; uzun listeler için autoscroll ileride eklenebilir.
 */
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { GripVertical } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { useT } from '../../lib/i18n';

const GAP = 8; // VStack gap="sm" ile aynı (kart arası boşluk)
const FALLBACK_H = 132; // ölçülmeden önceki tahmini kart yüksekliği
const LONG_PRESS_MS = 220;
const SPRING = { damping: 22, stiffness: 240, mass: 0.7 } as const;

/** `arr` içinde `id`'nin üstündeki kartların toplam yüksekliği (slot top'u). */
function offsetOf(arr: string[], heights: Record<string, number>, id: string): number {
  'worklet';
  let acc = 0;
  for (let i = 0; i < arr.length; i++) {
    const k = arr[i];
    if (k === undefined) continue;
    if (k === id) return acc;
    acc += (heights[k] ?? FALLBACK_H) + GAP;
  }
  return acc;
}

/**
 * Aktif kartı DIŞLAYARAK (diğerleri kompakt dizilmiş varsayımıyla) `center` px'inin
 * gireceği insertion index'i döndürür — moveItem(order, ci, idx) için doğru hedef.
 * Aktif kartı dahil etmek, kart tutulduğu an (dy=0) kendi slot orta noktasına denk
 * gelip yanlış takas (off-by-one) üretiyordu; bu yüzden aktif atlanır.
 */
function insertionIndexForCenter(
  arr: string[],
  activeId: string,
  heights: Record<string, number>,
  center: number,
): number {
  'worklet';
  let acc = 0;
  let idx = 0;
  for (let i = 0; i < arr.length; i++) {
    const k = arr[i];
    if (k === undefined || k === activeId) continue;
    const h = heights[k] ?? FALLBACK_H;
    if (center < acc + h / 2) return idx;
    acc += h + GAP;
    idx++;
  }
  return idx;
}

function moveItem(arr: string[], from: number, to: number): string[] {
  'worklet';
  const next = arr.slice();
  const item = next[from];
  if (item === undefined) return arr;
  next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function sameOrder(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export interface ReorderableCardListProps {
  /** Persisted workout id'leri, commit edilmiş (position) sırada. */
  ids: string[];
  /** id + handle → kart JSX'i. handle null ise ExerciseCard handle göstermez (lazy/tek kart). */
  renderCard: (id: string, dragHandle: ReactNode) => ReactNode;
  /** Yeni sıra (id dizisi) — optimistic mutation tetikler. */
  onReorder: (orderedIds: string[]) => void;
  /** Sürükleme başl./bit. → parent ScrollView scroll'unu gate'lemek için. */
  onActiveChange?: (active: boolean) => void;
}

export default function ReorderableCardList({
  ids,
  renderCard,
  onReorder,
  onActiveChange,
}: ReorderableCardListProps) {
  const order = useSharedValue<string[]>(ids);
  const heights = useSharedValue<Record<string, number>>({});
  const activeId = useSharedValue<string | null>(null);
  const activeStart = useSharedValue(0);
  const dy = useSharedValue(0);

  const heightsRef = useRef<Record<string, number>>({});
  const idsRef = useRef<string[]>(ids);
  idsRef.current = ids;

  // ids dış kaynaktan değişirse (ekle/sil) ve sürükleme yoksa liveOrder'ı senkronla.
  // Kendi optimistic reorder'ımız zaten order.value'yu finalOrder'a eşitliyor → no-op.
  useEffect(() => {
    if (activeId.value === null && !sameOrder(order.value, ids)) {
      order.value = ids;
    }
  }, [ids, order, activeId]);

  // STABİL render sırası (ref'e göre sıralı). Reorder aynı kümeyi permüte eder → sort
  // SONUCU değişmez → React çocuk sırası (native flow) reorder commit'inde DEĞİŞMEZ.
  // Görsel sıra tamamen translateY (order.value) ile sürülür; böylece bırakınca "eski
  // konum 1-frame flash"ı olmaz (flow ile display sırası ayrıştırıldı).
  const baseOrder = useMemo(() => [...ids].sort(), [ids]);

  // Handle her kartta görünür (tek kart dahil — kullanıcı kararı 2026-06-18). Tek kartta
  // sürükleme zararsız no-op (tek slot) → geri yerine oturur, mutation tetiklenmez.
  const reorderable = ids.length > 0;

  const notifyActive = useCallback(
    (active: boolean) => {
      onActiveChange?.(active);
    },
    [onActiveChange],
  );

  const onMeasure = useCallback(
    (id: string, h: number) => {
      if (heightsRef.current[id] === h) return;
      heightsRef.current[id] = h;
      heights.value = { ...heightsRef.current };
    },
    [heights],
  );

  const finishDrop = useCallback(() => {
    const finalOrder = order.value.slice();
    activeId.value = null;
    notifyActive(false);
    if (!sameOrder(finalOrder, idsRef.current)) onReorder(finalOrder);
  }, [order, activeId, notifyActive, onReorder]);

  const cancelDrop = useCallback(() => {
    activeId.value = null;
    notifyActive(false);
  }, [activeId, notifyActive]);

  return (
    <View style={styles.list}>
      {baseOrder.map((id) => (
        <DraggableCard
          key={id}
          id={id}
          ids={ids}
          baseOrder={baseOrder}
          reorderable={reorderable}
          order={order}
          heights={heights}
          activeId={activeId}
          activeStart={activeStart}
          dy={dy}
          notifyActive={notifyActive}
          finishDrop={finishDrop}
          cancelDrop={cancelDrop}
          onMeasure={onMeasure}
          renderCard={renderCard}
        />
      ))}
    </View>
  );
}

interface DraggableCardProps {
  id: string;
  ids: string[];
  baseOrder: string[];
  reorderable: boolean;
  order: SharedValue<string[]>;
  heights: SharedValue<Record<string, number>>;
  activeId: SharedValue<string | null>;
  activeStart: SharedValue<number>;
  dy: SharedValue<number>;
  notifyActive: (active: boolean) => void;
  finishDrop: () => void;
  cancelDrop: () => void;
  onMeasure: (id: string, h: number) => void;
  renderCard: (id: string, dragHandle: ReactNode) => ReactNode;
}

function DraggableCard({
  id,
  ids,
  baseOrder,
  reorderable,
  order,
  heights,
  activeId,
  activeStart,
  dy,
  notifyActive,
  finishDrop,
  cancelDrop,
  onMeasure,
  renderCard,
}: DraggableCardProps) {
  const { colors } = useTheme();
  const t = useT();

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(reorderable)
        .activateAfterLongPress(LONG_PRESS_MS)
        .onStart(() => {
          'worklet';
          activeId.value = id;
          activeStart.value = offsetOf(order.value, heights.value, id);
          dy.value = 0;
          runOnJS(notifyActive)(true);
        })
        .onUpdate((e) => {
          'worklet';
          if (activeId.value !== id) return;
          dy.value = e.translationY;
          const h = heights.value[id] ?? FALLBACK_H;
          const center = activeStart.value + e.translationY + h / 2;
          const ni = insertionIndexForCenter(order.value, id, heights.value, center);
          const ci = order.value.indexOf(id);
          if (ni >= 0 && ni !== ci) order.value = moveItem(order.value, ci, ni);
        })
        .onEnd(() => {
          'worklet';
          if (activeId.value !== id) return;
          const landTY = offsetOf(order.value, heights.value, id) - activeStart.value;
          dy.value = withSpring(landTY, SPRING, (finished) => {
            if (finished) runOnJS(finishDrop)();
          });
        })
        .onFinalize((_e, success) => {
          'worklet';
          if (success) return; // başarılı bitişi onEnd işliyor
          if (activeId.value !== id) return;
          order.value = ids; // iptal → sırayı geri al
          dy.value = withSpring(0, SPRING, (finished) => {
            if (finished) runOnJS(cancelDrop)();
          });
        }),
    [id, ids, reorderable, order, heights, activeId, activeStart, dy, notifyActive, finishDrop, cancelDrop],
  );

  const animStyle = useAnimatedStyle(() => {
    // Akış (flow) konumu STABİL baseOrder'a göre; görsel konum order.value (display) ile.
    // translateY her zaman display − flow → React çocuk sırası (baseOrder) reorder commit'inde
    // değişmediği için bırakınca "flash" yok.
    const flow = offsetOf(baseOrder, heights.value, id);
    if (activeId.value === id) {
      // Aktif kart parmağı takip eder: display-başlangıç slotu (activeStart) − flow + dy.
      return {
        transform: [{ translateY: activeStart.value - flow + dy.value }, { scale: 1.03 }],
        zIndex: 30,
        elevation: 12,
        opacity: 0.98,
      };
    }
    const target = offsetOf(order.value, heights.value, id) - flow;
    return {
      transform: [
        { translateY: activeId.value === null ? target : withSpring(target, SPRING) },
        { scale: 1 },
      ],
      zIndex: 0,
      elevation: 0,
      opacity: 1,
    };
  }, [id, baseOrder]);

  const dragHandle = reorderable ? (
    <GestureDetector gesture={pan}>
      <View style={styles.handle} accessibilityLabel={t('dayExtra.reorderHandle')}>
        <GripVertical size={18} color={colors.text.tertiary} />
      </View>
    </GestureDetector>
  ) : null;

  return (
    <Animated.View style={animStyle} onLayout={(e) => onMeasure(id, e.nativeEvent.layout.height)}>
      {renderCard(id, dragHandle)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  list: { gap: GAP },
  handle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
});
