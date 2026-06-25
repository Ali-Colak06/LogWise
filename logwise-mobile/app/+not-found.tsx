/**
 * +not-found — Expo Router 404 ekranı.
 * Bilinmeyen route'a navigate edilirse buraya düşer.
 */
import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>404</Text>
        <Text style={styles.subtitle}>Bu sayfa bulunamadı.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Ana sayfaya dön</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  title: { fontSize: 48, color: '#f0c040', fontWeight: '700' },
  subtitle: { fontSize: 16, color: '#fff', marginTop: 8 },
  link: { marginTop: 24 },
  linkText: { color: '#f0c040', fontSize: 14, textDecorationLine: 'underline' },
});
