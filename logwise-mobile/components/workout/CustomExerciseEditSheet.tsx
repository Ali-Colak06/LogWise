/**
 * CustomExerciseEditSheet — D1 custom egzersiz düzenleme (ADIM 6).
 * name + kategoriler + not. Save → app_exercises UPDATE.
 */
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppBottomSheet, Text, Button } from '../ui';
import { useTheme } from '../../theme';
import { useT, useTranslations } from '../../lib/i18n';
import { catLabel, turkishCatToKey } from '../../lib/exercise-resolve';
import type { AppExercisesRow } from '../../types/database';

const CAT_OPTIONS = ['Göğüs', 'Sırt', 'Omuz', 'Biceps', 'Triceps', 'Bacak', 'Karın', 'Kardiyo'] as const;

export interface CustomExerciseEditSheetProps {
  visible: boolean;
  exercise: AppExercisesRow | null;
  onCancel: () => void;
  onSave: (patch: { name: string; categories: string[]; notes: string }) => void;
}

export default function CustomExerciseEditSheet({ visible, exercise, onCancel, onSave }: CustomExerciseEditSheetProps) {
  const { colors } = useTheme();
  const t = useT();
  const dict = useTranslations();
  const [name, setName] = useState('');
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [note, setNote] = useState('');

  useEffect(() => {
    if (exercise) {
      setName(exercise.name);
      setCats(new Set(exercise.categories ?? []));
      setNote(exercise.notes ?? '');
    }
  }, [exercise]);

  const save = () => {
    const n = name.trim();
    if (n.length === 0) return;
    onSave({ name: n, categories: cats.size > 0 ? Array.from(cats) : ['Diğer'], notes: note.trim() });
  };

  return (
    <AppBottomSheet visible={visible} onClose={onCancel} maxHeightRatio={0.7} minHeightRatio={0.5}>
      <Text variant="sectionHeading">{t('library.edit')}</Text>
      <Text variant="caption" color="secondary" style={styles.label}>{t('dayExtra.newExName')}</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholderTextColor={colors.text.tertiary}
        style={[styles.input, { color: colors.text.primary, borderColor: colors.border.subtle, backgroundColor: colors.background.subtle }]}
      />
      <Text variant="caption" color="secondary" style={styles.label}>{t('dayExtra.newExCategory')}</Text>
      <View style={styles.catWrap}>
        {CAT_OPTIONS.map((c) => {
          const on = cats.has(c);
          return (
            <Pressable
              key={c}
              onPress={() => setCats((prev) => { const n = new Set(prev); if (n.has(c)) n.delete(c); else n.add(c); return n; })}
              style={[styles.chip, { borderColor: on ? colors.accent.gold : colors.border.subtle, backgroundColor: on ? colors.accent.goldMuted : 'transparent' }]}
            >
              <Text variant="meta" color={on ? 'primary' : 'secondary'}>{catLabel(turkishCatToKey(c), dict.cats)}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text variant="caption" color="secondary" style={styles.label}>{t('dayExtra.newExNote')}</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        multiline
        placeholderTextColor={colors.text.tertiary}
        style={[styles.input, { height: 64, color: colors.text.primary, borderColor: colors.border.subtle, backgroundColor: colors.background.subtle }]}
      />
      <View style={styles.actions}>
        <Button variant="ghost" label={t('library.cancel')} onPress={onCancel} />
        <Button variant="primary" label={t('library.save')} onPress={save} disabled={name.trim() === ''} />
      </View>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  label: { marginTop: 14, marginBottom: 4 },
  input: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, fontSize: 15 },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
});
