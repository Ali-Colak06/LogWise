/**
 * NewProgramSheet — §8.4.1 sıfırdan program (ADIM 6 — D2).
 * Sadece "Program adı" zorunlu + opsiyonel "Açıklama". Save → parent insert + D3 push.
 */
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { AppBottomSheet, Text, Button } from '../ui';
import { useTheme } from '../../theme';
import { useT } from '../../lib/i18n';

export interface NewProgramSheetProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (input: { name: string; description?: string }) => void;
  submitting?: boolean;
}

export default function NewProgramSheet({ visible, onCancel, onSubmit, submitting }: NewProgramSheetProps) {
  const { colors } = useTheme();
  const t = useT();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const submit = () => {
    const n = name.trim();
    if (n.length === 0) return;
    onSubmit({ name: n, description: desc.trim() || undefined });
    setName('');
    setDesc('');
  };

  return (
    <AppBottomSheet visible={visible} onClose={onCancel} maxHeightRatio={0.6}>
      <Text variant="sectionHeading">{t('library.newProgramTitle')}</Text>
      <Text variant="caption" color="secondary" style={styles.label}>{t('library.programNameLabel')}</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t('library.programNamePlaceholder')}
        placeholderTextColor={colors.text.tertiary}
        style={[styles.input, { color: colors.text.primary, borderColor: colors.border.subtle, backgroundColor: colors.background.subtle }]}
      />
      <Text variant="caption" color="secondary" style={styles.label}>{t('library.programDescLabel')}</Text>
      <TextInput
        value={desc}
        onChangeText={setDesc}
        multiline
        placeholderTextColor={colors.text.tertiary}
        style={[styles.input, { height: 64, color: colors.text.primary, borderColor: colors.border.subtle, backgroundColor: colors.background.subtle }]}
      />
      <View style={styles.actions}>
        <Button variant="ghost" label={t('library.cancel')} onPress={onCancel} />
        <Button variant="primary" label={t('library.save')} onPress={submit} disabled={name.trim() === '' || submitting} />
      </View>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  label: { marginTop: 14, marginBottom: 4 },
  input: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, fontSize: 15 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
});
