/**
 * Profile — sade hesap ekranı (§3.11 launch fazı). Tam ekran route (tabs dışı,
 * (app) Stack altında — program edit ile aynı kalıp). Auth-only; misafir erişirse
 * Calendar'a yönlenir.
 *
 * Ad düzenlenebilir (blur'da commit → auth metadata + app_profiles); username +
 * email read-only. Dil/Tema More'da kalır (§8.14 rol ayrımı). Tehlikeli bölge
 * (hesap silme) CP2'de eklenir.
 */
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { Screen, Text, Button, HStack, useToast } from '../../components/ui';
import { useTheme } from '../../theme';
import { useT } from '../../lib/i18n';
import { useAuthSession } from '../../stores/auth-store';
import { useUpdateDisplayName, useDeleteAccount } from '../../queries/account';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const t = useT();
  const toast = useToast();
  const session = useAuthSession();
  const updateName = useUpdateDisplayName();

  const meta = (session?.user.user_metadata ?? {}) as { display_name?: string; username?: string };
  const email = session?.user.email ?? '';
  const username = typeof meta.username === 'string' ? meta.username : '';
  const serverName =
    typeof meta.display_name === 'string' && meta.display_name.length > 0
      ? meta.display_name
      : email.split('@')[0] ?? '';

  const [name, setName] = useState<string | null>(null);
  const deleteAccount = useDeleteAccount();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const nameVal = name ?? serverName;
  const initials = (nameVal.slice(0, 2) || 'LW').toUpperCase();

  // Misafirin hesabı yok → Profile'a erişemez.
  if (!session) return <Redirect href="/(app)/(tabs)/calendar" />;

  const commitName = () => {
    const trimmed = nameVal.trim();
    if (trimmed.length === 0 || trimmed === serverName) return;
    updateName.mutate(trimmed, {
      onSuccess: () => toast.show({ message: t('profile.nameSaved'), variant: 'success' }),
    });
  };

  const confirmWord = t('profile.deleteConfirmWord');
  const canDelete = confirmText.trim() === confirmWord && !deleteAccount.isPending;
  const closeDelete = () => {
    if (deleteAccount.isPending) return;
    setDeleteOpen(false);
    setConfirmText('');
  };
  const onConfirmDelete = () => {
    if (!canDelete) return;
    deleteAccount.mutate(undefined, {
      onSuccess: () => router.replace('/(auth)/welcome'),
      onError: () => toast.show({ message: t('profile.deleteError'), variant: 'danger' }),
    });
  };

  return (
    <Screen scroll={false}>
      {/* App bar */}
      <HStack gap="sm" align="center" style={styles.appBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn} accessibilityLabel={t('day.back')}>
          <ArrowLeft size={22} color={colors.text.primary} />
        </Pressable>
        <Text variant="bodyStrong" style={{ flex: 1 }}>{t('profile.title')}</Text>
      </HStack>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: colors.accent.goldMuted }]}>
            <Text variant="title" style={{ color: colors.accent.gold }}>{initials}</Text>
          </View>
        </View>

        {/* Account */}
        <Text variant="caption" color="secondary" style={styles.sectionLabel}>{t('profile.account')}</Text>

        <Text variant="caption" color="secondary" style={styles.fieldLabel}>{t('profile.nameLabel')}</Text>
        <TextInput
          value={nameVal}
          onChangeText={setName}
          onBlur={commitName}
          placeholder={t('profile.namePlaceholder')}
          placeholderTextColor={colors.text.tertiary}
          maxLength={40}
          style={[styles.input, { color: colors.text.primary, borderColor: colors.border.subtle, backgroundColor: colors.background.subtle }]}
        />

        {username.length > 0 && (
          <View style={[styles.readonlyRow, { borderColor: colors.border.subtle }]}>
            <Text variant="caption" color="secondary">{t('profile.usernameLabel')}</Text>
            <Text variant="body" font="mono">@{username}</Text>
          </View>
        )}
        <View style={[styles.readonlyRow, { borderColor: colors.border.subtle }]}>
          <Text variant="caption" color="secondary">{t('profile.emailLabel')}</Text>
          <Text variant="body" numberOfLines={1}>{email}</Text>
        </View>

        {/* Tehlikeli bölge */}
        <Text variant="caption" style={[styles.sectionLabel, { color: colors.semantic.danger }]}>
          {t('profile.dangerZone')}
        </Text>
        <Pressable
          onPress={() => setDeleteOpen(true)}
          style={[styles.deleteRow, { borderColor: colors.semantic.danger }]}
        >
          <Trash2 size={18} color={colors.semantic.danger} />
          <Text variant="bodyStrong" style={{ color: colors.semantic.danger }}>{t('profile.deleteCta')}</Text>
        </Pressable>
      </ScrollView>

      {/* "SİL" yaz onay modalı */}
      <Modal visible={deleteOpen} transparent animationType="fade" onRequestClose={closeDelete}>
        <Pressable style={styles.scrim} onPress={closeDelete}>
          <Pressable
            onPress={() => undefined}
            style={[styles.modalCard, { backgroundColor: colors.background.elevated, borderColor: colors.border.subtle }]}
          >
            <Text variant="sectionHeading">{t('profile.deleteTitle')}</Text>
            <Text variant="body" color="secondary" style={{ marginTop: 8 }}>{t('profile.deleteBody')}</Text>
            <Text variant="caption" color="secondary" style={{ marginTop: 14 }}>
              {t('profile.deleteConfirmHint', { vars: { word: confirmWord } })}
            </Text>
            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder={confirmWord}
              placeholderTextColor={colors.text.tertiary}
              editable={!deleteAccount.isPending}
              style={[styles.input, { marginTop: 6, color: colors.text.primary, borderColor: colors.border.subtle, backgroundColor: colors.background.subtle }]}
            />
            <View style={styles.modalBtns}>
              <View style={{ flex: 1 }}>
                <Button variant="secondary" label={t('library.cancel')} onPress={closeDelete} disabled={deleteAccount.isPending} fullWidth />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  variant="danger"
                  label={deleteAccount.isPending ? t('profile.deleting') : t('profile.delete')}
                  onPress={onConfirmDelete}
                  disabled={!canDelete}
                  loading={deleteAccount.isPending}
                  fullWidth
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  appBar: { paddingHorizontal: 8, paddingVertical: 6 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { alignItems: 'center', marginTop: 12, marginBottom: 8 },
  avatar: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { marginTop: 16, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  fieldLabel: { marginTop: 8, marginBottom: 4 },
  input: { paddingVertical: 11, paddingHorizontal: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, fontSize: 15 },
  readonlyRow: { marginTop: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, gap: 3 },
  deleteRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  modalCard: { width: '100%', maxWidth: 360, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 20 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 18 },
});
