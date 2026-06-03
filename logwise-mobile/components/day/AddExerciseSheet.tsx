/**
 * AddExerciseSheet — C4 Add Exercise modal (ADIM 6 — §3.7).
 *
 * 3 tab: Kütüphanem (custom + tarihçe preset) / Hazır Hareketler (54 preset) / Yeni Özel.
 * Single-tap = anında ekle + kapan; long-press = multi-select. Kategori filtre + search.
 *
 * Ortak component: Day FAB (mode='day'), D1 "+New" (mode='library', initialTab='new'),
 * D3 "+Egzersiz" (mode='program-day'). Callback davranışı parent'ta.
 *
 * NOT: @shopify/flash-list yüklü değil → ScrollView + map (54 preset + N custom kabul
 * edilebilir; virtualization ADIM 7'de eklenebilir).
 */
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Search, X, Check } from 'lucide-react-native';
import { AppBottomSheet, Button, SegmentedTabs, Text } from '../ui';
import { useTheme } from '../../theme';
import { useT, useLocaleStore } from '../../lib/i18n';
import { PRESET_EXERCISES, getPresetDisplayName } from '../../data/presets-exercises';
import { useCustomExercises, useAddCustomExercise } from '../../queries/exercises';
import { resolveExerciseRef, buildCustomMap, turkishCatToKey } from '../../lib/exercise-resolve';
import type { CategoryKey } from '../../lib/exercise-resolve';

type Tab = 'library' | 'presets' | 'new';

export interface AddExerciseSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Seçilen ref'leri ekle (1 veya N). */
  onAddRefs: (refs: string[]) => void;
  initialTab?: Tab;
  /** Tarihçede kullanılmış preset slug'lar (Kütüphanem kapsamı — §8.8). */
  usedPresetSlugs?: string[];
}

const CATS: Array<CategoryKey | 'all'> = [
  'all', 'chest', 'back', 'shoulder', 'biceps', 'triceps', 'leg', 'core', 'cardio',
];

function lc(s: string): string {
  return s.toLocaleLowerCase('tr');
}

interface Row {
  ref: string;
  name: string;
  cat: CategoryKey;
  isPreset: boolean;
}

export default function AddExerciseSheet({
  visible,
  onClose,
  onAddRefs,
  initialTab = 'library',
  usedPresetSlugs = [],
}: AddExerciseSheetProps) {
  const { colors } = useTheme();
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<CategoryKey | 'all'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [multi, setMulti] = useState(false);

  // New-custom form
  const [newName, setNewName] = useState('');
  const [newCats, setNewCats] = useState<Set<string>>(new Set());
  const [newNote, setNewNote] = useState('');

  const customQ = useCustomExercises();
  const addCustom = useAddCustomExercise();
  const customRows = customQ.data ?? [];
  const customMap = useMemo(() => buildCustomMap(customRows), [customRows]);

  const presetRows: Row[] = useMemo(
    () =>
      PRESET_EXERCISES.map((p) => ({
        ref: p.id,
        name: getPresetDisplayName(p.id, locale),
        cat: p.categories[0] ? turkishCatToKey(p.categories[0]) : 'other',
        isPreset: true,
      })),
    [locale],
  );

  const libraryRows: Row[] = useMemo(() => {
    const out: Row[] = [];
    for (const c of customRows) {
      const r = resolveExerciseRef(c.id, customMap, locale);
      out.push({ ref: c.id, name: r.name, cat: r.categories[0] ?? 'other', isPreset: false });
    }
    const seen = new Set<string>();
    for (const slug of usedPresetSlugs) {
      if (seen.has(slug)) continue;
      seen.add(slug);
      const r = resolveExerciseRef(slug, customMap, locale);
      out.push({ ref: slug, name: r.name, cat: r.categories[0] ?? 'other', isPreset: true });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name, locale));
  }, [customRows, customMap, usedPresetSlugs, locale]);

  const activeRows = tab === 'presets' ? presetRows : libraryRows;
  const filtered = useMemo(() => {
    const q = lc(query.trim());
    return activeRows
      .filter((r) => (cat === 'all' ? true : r.cat === cat))
      .filter((r) => (q === '' ? true : lc(r.name).includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name, locale));
  }, [activeRows, cat, query, locale]);

  const reset = () => {
    setSelected(new Set());
    setMulti(false);
    setQuery('');
    setNewName('');
    setNewCats(new Set());
    setNewNote('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const onRowTap = (ref: string) => {
    if (multi) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(ref)) next.delete(ref);
        else next.add(ref);
        return next;
      });
    } else {
      onAddRefs([ref]);
      close();
    }
  };

  const onRowLong = (ref: string) => {
    setMulti(true);
    setSelected(new Set([ref]));
  };

  const confirmMulti = () => {
    if (selected.size === 0) return;
    onAddRefs(Array.from(selected));
    close();
  };

  const submitNew = (alsoAdd: boolean) => {
    const name = newName.trim();
    if (name.length === 0) return;
    const cats = newCats.size > 0 ? Array.from(newCats) : ['Diğer'];
    addCustom.mutate(
      { name, categories: cats, notes: newNote.trim() || undefined },
      {
        onSuccess: (row) => {
          if (alsoAdd && row?.id) {
            onAddRefs([row.id]);
            close();
          } else {
            setNewName('');
            setNewCats(new Set());
            setNewNote('');
            setTab('library');
          }
        },
      },
    );
  };

  return (
    <AppBottomSheet visible={visible} onClose={close} maxHeightRatio={0.9}>
      {/* Header: search + close */}
      <View style={styles.headerRow}>
        {multi ? (
          <>
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              {t('dayExtra.multiAddCta', { vars: { n: selected.size } })}
            </Text>
            <Pressable onPress={() => { setMulti(false); setSelected(new Set()); }} hitSlop={8}>
              <Text variant="caption" color="secondary">{t('library.cancel')}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={[styles.search, { backgroundColor: colors.background.subtle, borderColor: colors.border.subtle }]}>
              <Search size={16} color={colors.text.tertiary} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t('library.searchPlaceholder')}
                placeholderTextColor={colors.text.tertiary}
                style={[styles.searchInput, { color: colors.text.primary }]}
              />
            </View>
            <Pressable onPress={close} hitSlop={8} style={{ paddingLeft: 8 }}>
              <X size={22} color={colors.text.secondary} />
            </Pressable>
          </>
        )}
      </View>

      <View style={{ height: 10 }} />
      <SegmentedTabs<Tab>
        options={[
          { key: 'library', label: t('dayExtra.tabLibrary') },
          { key: 'presets', label: t('dayExtra.tabPresets') },
          { key: 'new', label: t('dayExtra.tabNew') },
        ]}
        value={tab}
        onChange={(v) => { setTab(v); setMulti(false); setSelected(new Set()); }}
      />

      {tab === 'new' ? (
        <ScrollView keyboardShouldPersistTaps="handled" style={styles.body}>
          <Text variant="caption" color="secondary" style={styles.label}>{t('dayExtra.newExName')}</Text>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder={t('dayExtra.newExName')}
            placeholderTextColor={colors.text.tertiary}
            style={[styles.formInput, { color: colors.text.primary, borderColor: colors.border.subtle, backgroundColor: colors.background.subtle }]}
          />
          <Text variant="caption" color="secondary" style={styles.label}>{t('dayExtra.newExCategory')}</Text>
          <View style={styles.catWrap}>
            {(['Göğüs', 'Sırt', 'Omuz', 'Biceps', 'Triceps', 'Bacak', 'Karın', 'Kardiyo'] as const).map((c) => {
              const on = newCats.has(c);
              return (
                <Pressable
                  key={c}
                  onPress={() =>
                    setNewCats((prev) => {
                      const n = new Set(prev);
                      if (n.has(c)) n.delete(c); else n.add(c);
                      return n;
                    })
                  }
                  style={[styles.catChip, { borderColor: on ? colors.accent.gold : colors.border.subtle, backgroundColor: on ? colors.accent.goldMuted : 'transparent' }]}
                >
                  <Text variant="meta" color={on ? 'primary' : 'secondary'}>{c}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text variant="caption" color="secondary" style={styles.label}>{t('dayExtra.newExNote')}</Text>
          <TextInput
            value={newNote}
            onChangeText={setNewNote}
            placeholder={t('dayExtra.newExNote')}
            placeholderTextColor={colors.text.tertiary}
            multiline
            style={[styles.formInput, { height: 70, color: colors.text.primary, borderColor: colors.border.subtle, backgroundColor: colors.background.subtle }]}
          />
          <View style={{ height: 12 }} />
          <Button variant="primary" label={t('dayExtra.createAndAdd')} onPress={() => submitNew(true)} fullWidth disabled={newName.trim() === ''} />
          <View style={{ height: 8 }} />
          <Button variant="ghost" label={t('dayExtra.libraryOnly')} onPress={() => submitNew(false)} fullWidth disabled={newName.trim() === ''} />
        </ScrollView>
      ) : (
        <>
          {/* Category strip */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catStrip} contentContainerStyle={{ gap: 6 }}>
            {CATS.map((c) => {
              const on = c === cat;
              const label = c === 'all' ? t('dayExtra.catAll') : c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCat(c)}
                  style={[styles.catChip, { borderColor: on ? colors.accent.gold : colors.border.subtle, backgroundColor: on ? colors.accent.goldMuted : 'transparent' }]}
                >
                  <Text variant="meta" color={on ? 'primary' : 'secondary'}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {filtered.length === 0 ? (
              <Text variant="body" color="secondary" align="center" style={{ paddingVertical: 24 }}>
                {t('library.noResults')}
              </Text>
            ) : (
              filtered.map((r) => {
                const sel = selected.has(r.ref);
                return (
                  <Pressable
                    key={r.ref}
                    onPress={() => onRowTap(r.ref)}
                    onLongPress={() => onRowLong(r.ref)}
                    delayLongPress={400}
                    style={({ pressed }) => [
                      styles.exRow,
                      { borderColor: colors.border.subtle },
                      sel && { backgroundColor: colors.accent.goldMuted },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    {multi && (
                      <View style={[styles.checkbox, { borderColor: sel ? colors.accent.gold : colors.border.strong }]}>
                        {sel && <Check size={14} color={colors.accent.gold} />}
                      </View>
                    )}
                    <View style={[styles.catDot, { backgroundColor: colors.category[r.cat] }]} />
                    <Text variant="body" style={{ flex: 1 }}>{r.name}</Text>
                    {!r.isPreset && (
                      <Text variant="meta" color="tertiary">{t('library.customBadge')}</Text>
                    )}
                  </Pressable>
                );
              })
            )}
            <View style={{ height: 16 }} />
          </ScrollView>

          {multi && (
            <Button
              variant="primary"
              label={t('dayExtra.multiAddCta', { vars: { n: selected.size } })}
              onPress={confirmMulti}
              disabled={selected.size === 0}
              fullWidth
            />
          )}
        </>
      )}
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  body: { marginTop: 8, maxHeight: 420 },
  catStrip: { marginTop: 10, flexGrow: 0 },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
  },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { marginTop: 14, marginBottom: 4 },
  formInput: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 15,
  },
});
