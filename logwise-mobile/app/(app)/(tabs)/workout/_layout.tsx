/**
 * workout/ Stack layout — tab route iç navigasyonu.
 *
 * (tabs) altında "workout" tek bir tab route'u olarak görünür;
 * index ve gelecekteki iç route'lar bu Stack içinde navigate edilir.
 */
import { Stack } from 'expo-router';

export default function WorkoutStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
