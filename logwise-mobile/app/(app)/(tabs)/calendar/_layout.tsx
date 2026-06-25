/**
 * calendar/ Stack layout — tab route iç navigasyonu.
 *
 * (tabs) altında "calendar" tek bir tab route'u olarak görünür;
 * index + day/[date] bu Stack içinde navigate edilir.
 */
import { Stack } from 'expo-router';

export default function CalendarStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
