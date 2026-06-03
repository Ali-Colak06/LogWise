/**
 * ProgramActionSheet — pasif programa tap (ADIM 6 — D2).
 * Aktif Et / Düzenle / Sil (danger). Program meta üstte.
 */
import { StyleSheet, View, Pressable } from 'react-native';
import { AppBottomSheet, Text } from '../ui';
import { useTheme } from '../../theme';
import { useT } from '../../lib/i18n';
import type { AppProgramsRow } from '../../types/database';

export interface ProgramActionSheetProps {
  visible: boolean;
  program: AppProgramsRow | null;
  onClose: () => void;
  onActivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ProgramActionSheet({
  visible,
  program,
  onClose,
  onActivate,
  onEdit,
  onDelete,
}: ProgramActionSheetProps) {
  const { colors } = useTheme();
  const t = useT();
  return (
    <AppBottomSheet visible={visible} onClose={onClose} maxHeightRatio={0.5}>
      {program && (
        <View>
          <Text variant="sectionHeading" numberOfLines={2}>{program.name}</Text>
          {program.description ? (
            <Text variant="caption" color="secondary" style={{ marginTop: 4 }}>{program.description}</Text>
          ) : null}
          <View style={{ height: 16 }} />
          <Pressable onPress={onActivate} style={[styles.row, { backgroundColor: colors.accent.gold }]}>
            <Text variant="bodyStrong" color="onAccent" align="center">{t('library.activate')}</Text>
          </Pressable>
          <Pressable onPress={onEdit} style={[styles.row, { backgroundColor: colors.background.subtle }]}>
            <Text variant="bodyStrong" align="center">{t('library.edit')}</Text>
          </Pressable>
          <Pressable onPress={onDelete} style={styles.delRow} hitSlop={6}>
            <Text variant="body" align="center" style={{ color: colors.semantic.danger }}>{t('library.delete')}</Text>
          </Pressable>
        </View>
      )}
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 14, borderRadius: 12, marginBottom: 8 },
  delRow: { paddingVertical: 12, marginTop: 4 },
});
