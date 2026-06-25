/**
 * F1 Dashboard — gerçek istatistik ekranı (§3.11 launch fazı; placeholder kaldırıldı).
 *
 * App bar (avatar + başlık, Calendar/Library ile tutarlı) + 4 özet stat kartı +
 * haftalık hacim trendi (CP2) + kas dağılımı (CP2) + öne çıkanlar/PR (CP3). Veri:
 * `useDashboardSets` (ham) → `computeDashboard` (saf). Hiç set yoksa empty state.
 */
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Dumbbell } from 'lucide-react-native';
import { Screen, Text, Button, HStack } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { useT } from '../../../lib/i18n';
import { useAuthMode, useAuthSession } from '../../../stores/auth-store';
import ProfilePopover, { type AnchorRect } from '../../../components/shared/ProfilePopover';
import { useDashboardSets } from '../../../queries/dashboard';
import { computeDashboard, compactNumber } from '../../../lib/dashboard';

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
    .getDate()
    .toString()
    .padStart(2, '0')}`;
}

export default function DashboardScreen() {
  const { colors, tokens } = useTheme();
  const t = useT();
  const router = useRouter();

  // App bar avatar → ProfilePopover (Calendar/Library app bar ile aynı kalıp).
  const mode = useAuthMode();
  const session = useAuthSession();
  const avatarInitials = useMemo(() => {
    if (mode === 'guest') return 'M';
    const email = session?.user.email ?? '';
    const displayName =
      (session?.user.user_metadata?.display_name as string | undefined) ??
      email.split('@')[0] ??
      'LogWise';
    return displayName.slice(0, 2).toUpperCase();
  }, [mode, session]);
  const avatarRef = useRef<View | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarRect, setAvatarRect] = useState<AnchorRect | null>(null);
  const openProfile = () => {
    avatarRef.current?.measureInWindow((x, y, width, height) => {
      setAvatarRect({ x, y, width, height });
      setProfileOpen(true);
    });
  };

  const setsQ = useDashboardSets();
  const today = todayISO();
  const data = useMemo(
    () => computeDashboard(setsQ.data ?? [], today),
    [setsQ.data, today],
  );

  const stats: Array<{ value: string; label: string }> = [
    { value: `${data.totalWorkouts}`, label: t('dashboard.statWorkouts') },
    { value: compactNumber(data.totalVolumeKg), label: t('dashboard.statVolumeKg') },
    { value: `${data.thisWeekWorkouts}`, label: t('dashboard.statThisWeek') },
    { value: `${data.totalSets}`, label: t('dashboard.statSets') },
  ];

  return (
    <Screen scroll={false}>
      {/* App bar */}
      <HStack gap="sm" align="center" style={styles.appBar}>
        <Pressable
          ref={avatarRef}
          onPress={openProfile}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={t('more.rowProfile')}
          style={[styles.avatar, { borderColor: colors.border.subtle, backgroundColor: colors.background.subtle }]}
        >
          <Text style={{ color: colors.accent.gold, fontFamily: tokens.fonts.displayBold, fontSize: 13 }}>
            {avatarInitials}
          </Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{t('dashboard.title')}</Text>
        </View>
      </HStack>

      {!setsQ.isLoading && !data.hasData ? (
        <View style={styles.emptyBody}>
          <Dumbbell size={48} color={colors.text.tertiary} strokeWidth={1.5} />
          <Text variant="sectionHeading" align="center" style={{ marginTop: 16 }}>{t('dashboard.emptyTitle')}</Text>
          <Text variant="body" color="secondary" align="center" style={styles.emptyDesc}>{t('dashboard.emptyDesc')}</Text>
          <View style={{ height: 18 }} />
          <Button
            variant="primary"
            label={t('dashboard.emptyCta')}
            onPress={() => router.push({ pathname: '/calendar/day/[date]', params: { date: today } })}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 12 }}>
          {/* Özet stat kartları (2×2) */}
          <View style={styles.statGrid}>
            {stats.map((s) => (
              <View
                key={s.label}
                style={[styles.statCard, { borderColor: colors.border.subtle, backgroundColor: colors.background.elevated }]}
              >
                <Text style={{ color: colors.accent.gold, fontFamily: tokens.fonts.monoBold, fontSize: 22 }}>
                  {s.value}
                </Text>
                <Text variant="meta" color="secondary" style={{ marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* CP2: Haftalık hacim trendi + Kas dağılımı */}
          {/* CP3: Öne çıkanlar (PR) */}
        </ScrollView>
      )}

      <ProfilePopover visible={profileOpen} anchor={avatarRect} onClose={() => setProfileOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  appBar: { paddingHorizontal: 12, paddingVertical: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  emptyBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyDesc: { maxWidth: 280, marginTop: 8 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  statCard: {
    flexGrow: 1,
    flexBasis: '47%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
});
