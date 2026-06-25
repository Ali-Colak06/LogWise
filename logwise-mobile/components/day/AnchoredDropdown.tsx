/**
 * AnchoredDropdown — native `<select>` benzeri açılır menü (Day set grid Type/RIR).
 *
 * Kapalı: tetikleyici hücre ("Working ⌄"). Tap → hücrenin HEMEN ALTINA, içeriğin
 * üstüne binen dikey seçenek listesi açılır (seçili = gold vurgulu). Dışarı tap kapatır.
 * Konum `measureInWindow` ile ölçülür; ekranın altına taşarsa yukarı açılır (flip).
 *
 * Modal overlay kullanır → kart/ScrollView clipping ve Android zIndex sorunlarına takılmaz.
 */
import { useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Text } from '../ui';

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
  /** Opsiyonel — seçenek metin rengi (set tipi renkleri gibi). */
  color?: string;
}

export interface AnchoredDropdownProps<T extends string> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (v: T) => void;
  /** Tetikleyici hücre genişliği. */
  width: number;
  triggerBg: string;
  triggerBorder: string;
  triggerColor: string;
  triggerFontSize?: number;
  triggerUppercase?: boolean;
  accessibilityLabel?: string;
}

const ITEM_H = 32;

export default function AnchoredDropdown<T extends string>({
  value,
  options,
  onChange,
  width,
  triggerBg,
  triggerBorder,
  triggerColor,
  triggerFontSize = 9,
  triggerUppercase = false,
  accessibilityLabel,
}: AnchoredDropdownProps<T>) {
  const { colors } = useTheme();
  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const selected = options.find((o) => o.value === value);
  const menuWidth = width;

  const openMenu = () => {
    const node = triggerRef.current;
    if (!node) return;
    node.measureInWindow((x, y, w, h) => {
      setAnchor({ x, y, w, h });
      setOpen(true);
    });
  };

  let top = 0;
  let left = 0;
  if (anchor) {
    const screen = Dimensions.get('window');
    left = Math.max(8, Math.min(anchor.x, screen.width - menuWidth - 8));
    const below = anchor.y + anchor.h + 2;
    const menuH = options.length * ITEM_H + 8;
    top = below + menuH > screen.height - 24 ? Math.max(8, anchor.y - menuH - 2) : below;
  }

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={openMenu}
        style={[styles.trigger, { width, backgroundColor: triggerBg, borderColor: open ? colors.accent.gold : triggerBorder }]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: open }}
      >
        <Text
          font="mono"
          numberOfLines={1}
          style={[styles.triggerLabel, { color: triggerColor, fontSize: triggerFontSize, textTransform: triggerUppercase ? 'uppercase' : 'none' }]}
        >
          {selected?.label ?? value}
        </Text>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <ChevronDown size={11} color={triggerColor} />
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
        {anchor && (
          <View
            style={[
              styles.menu,
              { top, left, width: menuWidth, backgroundColor: colors.background.elevated, borderColor: colors.border.strong },
            ]}
          >
            {options.map((o) => {
              const sel = o.value === value;
              return (
                <Pressable
                  key={o.value}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.item,
                    sel && { backgroundColor: colors.accent.goldMuted },
                    pressed && { backgroundColor: colors.background.hover },
                  ]}
                >
                  <Text font="mono" numberOfLines={1} style={{ color: o.color ?? colors.text.primary, fontSize: 12, fontWeight: sel ? '700' : '500' }}>
                    {o.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 5,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  triggerLabel: {
    flexShrink: 1,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  menu: {
    position: 'absolute',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  item: {
    height: ITEM_H,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});
