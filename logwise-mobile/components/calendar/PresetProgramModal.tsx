/**
 * PresetProgramModal — "Hazir Program Sec" sheet (B1 + C1 paylasimli, ADIM 5).
 *
 * Karar kaynagi: §3.8 03-mvp.
 *   - 4 preset listesi; her satirda program ad + kisa aciklama
 *   - Tap satir -> preview (always expanded — her gunun tum egzersizleri)
 *   - Bottom CTA: "Bu Programi Baslat"
 *   - Alt link: "Daha sonra kendim ekleyecegim"
 *
 * Seçilince parent `onSelectPreset(presetSlug)` cagrilir; parent
 * `useCreateProgramFromPreset()` mutation'u ile kopyala + aktif et yapar.
 */
import { useState } from 'react';
import { Modal, ScrollView, View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Text, Button, VStack, HStack } from '../ui';
import { useT, useLocaleStore } from '../../lib/i18n';
import { PRESET_PROGRAMS, type PresetProgram } from '../../data/presets-programs';
import { getPresetDisplayName } from '../../data/presets-exercises';

export interface PresetProgramModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSelectPreset: (program: PresetProgram) => void;
  /** loading state — kopyala+aktif et mutation aktifken disabled */
  isSubmitting?: boolean;
}

export default function PresetProgramModal({
  visible,
  onDismiss,
  onSelectPreset,
  isSubmitting = false,
}: PresetProgramModalProps) {
  const { colors } = useTheme();
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const dayShort = locale === 'en'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  const selected = selectedSlug ? PRESET_PROGRAMS.find((p) => p.slug === selectedSlug) ?? null : null;

  const close = () => {
    setSelectedSlug(null);
    onDismiss();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={close}
    >
      <Pressable style={styles.scrim} onPress={close}>
        <Pressable onPress={() => undefined}>
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.background.elevated,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <VStack gap="md">
              <Text variant="screenHeading">{t('calendar.presetModalTitle')}</Text>
              <Text variant="body" color="secondary">
                {t('calendar.presetModalSubtitle')}
              </Text>

              <ScrollView style={{ maxHeight: 480 }}>
                {selected ? (
                  // Preview — always-expanded gun listesi
                  <VStack gap="md">
                    <Text variant="sectionHeading">
                      {locale === 'en' ? selected.nameEN : selected.name}
                    </Text>
                    <Text variant="body" color="secondary">
                      {locale === 'en' ? selected.descEN : selected.desc}
                    </Text>
                    {(Object.entries(selected.days) as Array<[string, string[]]>)
                      .filter(([, slugs]) => slugs.length > 0)
                      .map(([dayKey, slugs]) => {
                        const idx = parseInt(dayKey, 10);
                        return (
                          <View key={dayKey} style={[styles.dayBlock, { borderColor: colors.border.subtle }]}>
                            <Text variant="bodyStrong">{dayShort[idx] ?? dayKey}</Text>
                            <View style={{ height: 4 }} />
                            {slugs.map((slug) => (
                              <Text key={slug} variant="body" color="secondary">
                                • {getPresetDisplayName(slug, locale)}
                              </Text>
                            ))}
                          </View>
                        );
                      })}
                  </VStack>
                ) : (
                  // Liste — 4 program
                  <VStack gap="sm">
                    {PRESET_PROGRAMS.map((p) => (
                      <Pressable
                        key={p.slug}
                        onPress={() => setSelectedSlug(p.slug)}
                        style={({ pressed }) => [
                          styles.programRow,
                          {
                            borderColor: colors.border.subtle,
                            backgroundColor: pressed ? colors.background.hover : colors.background.subtle,
                          },
                        ]}
                      >
                        <Text variant="bodyStrong">
                          {locale === 'en' ? p.nameEN : p.name}
                        </Text>
                        <View style={{ height: 4 }} />
                        <Text variant="caption" color="secondary">
                          {locale === 'en' ? p.descEN : p.desc}
                        </Text>
                      </Pressable>
                    ))}
                  </VStack>
                )}
              </ScrollView>

              {selected ? (
                <HStack gap="sm">
                  <Button
                    variant="ghost"
                    label={t('common.cancel')}
                    onPress={() => setSelectedSlug(null)}
                  />
                  <Button
                    variant="primary"
                    label={t('calendar.presetCtaStart')}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    onPress={() => onSelectPreset(selected)}
                    fullWidth
                  />
                </HStack>
              ) : (
                <Pressable onPress={close} hitSlop={8}>
                  <Text variant="caption" color="secondary" align="center">
                    {t('calendar.presetCtaLater')}
                  </Text>
                </Pressable>
              )}
            </VStack>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 20,
    paddingBottom: 32,
  },
  programRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 14,
  },
  dayBlock: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 12,
  },
});
