/**
 * ConfirmModal — genel onay dialog'u (ADIM 6 — D2/D3 ortak).
 *
 * ActivateConfirmModal + DeleteProgramModal bunun üstüne kurulur (başlık/gövde/buton
 * etiketi prop). Merkez dialog (§3.10 modal stiliyle tutarlı), scrim.
 */
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { Text, Button } from '../ui';

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { colors, shadows } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={[styles.card, shadows.modal, { backgroundColor: colors.background.elevated }]}>
          <Text variant="sectionHeading">{title}</Text>
          {body ? (
            <Text variant="body" color="secondary" style={{ marginTop: 8 }}>{body}</Text>
          ) : null}
          <View style={styles.actions}>
            <Button variant="ghost" label={cancelLabel} onPress={onCancel} />
            <Button variant={danger ? 'danger' : 'primary'} label={confirmLabel} onPress={onConfirm} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 24 },
  card: { width: '100%', maxWidth: 360, borderRadius: 16, padding: 20 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
});
