/**
 * (tabs) layout — Tabs + custom BottomTabBar (ADIM 6 — §3.1).
 *
 * Route'lar: calendar / workout (Library) / dashboard / social / more.
 * "more" sekmesi route'a gitmez → MoreSheet açar (BottomTabBar onMorePress).
 * "social" route KAYITLI ama bar'da GİZLİ (launch §3.11 — v2'ye ertelendi;
 * BottomTabBar HIDDEN_TABS ile atlar). Görünür 4 sekme.
 * ADIM 8 fix: initialRouteName="calendar" (geri tuşu Calendar'a döner).
 */
import { useState } from 'react';
import { Tabs } from 'expo-router';
import BottomTabBar from '../../../components/ui/BottomTabBar';
import MoreSheet from '../../../components/shared/MoreSheet';

export default function TabsLayout() {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <Tabs
        initialRouteName="calendar"
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <BottomTabBar {...props} onMorePress={() => setMoreOpen(true)} />}
      >
        <Tabs.Screen name="calendar" />
        <Tabs.Screen name="workout" />
        <Tabs.Screen name="dashboard" />
        <Tabs.Screen name="social" />
        <Tabs.Screen name="more" />
      </Tabs>
      <MoreSheet visible={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
