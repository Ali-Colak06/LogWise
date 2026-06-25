/**
 * Supabase client — LogWise Mobile
 *
 * Karar kaynakları (03-mvp-decisions.md):
 *   §2   Stack: @supabase/supabase-js + AsyncStorage + expo-secure-store
 *   §4.1 Aynı Supabase projesi (web ile ortak), mobil tablolar app_ prefix'iyle
 *   §4.2 Online-only MVP (offline-first değil)
 *   §4.4 RLS aktif her tabloda; auth.uid()=user_id policy
 *   §5   Misafir mod: bu client'a HİÇ GİTMEZ; misafir verisi AsyncStorage'da
 *        (@logwise/guest/* prefix). Bu modülü misafir kodu IMPORT EDEBİLİR
 *        (Supabase çağrısı yapmaz) ama auth.signIn/signUp ÇAĞIRMAZ.
 *
 * Storage stratejisi:
 *   - Hassas oturum bilgisi (refresh_token, access_token) -> expo-secure-store
 *     (iOS Keychain / Android Keystore). Token blob 2KB'ı geçerse otomatik
 *     parçalanır VE AsyncStorage fallback'e düşmez (gizlilik üzerinden DRY).
 *   - "Hassas olmayan" Supabase iç verileri (örn. cache anahtarları) için
 *     fallback gerekirse AsyncStorage kullanılır. MVP'de bu yol kullanılmaz.
 *
 * URL polyfill:
 *   - react-native-url-polyfill/auto Supabase fetch'inin RN ortamında
 *     URL.searchParams kullanabilmesi için zorunlu (üst seviyede import edilir;
 *     side-effect import).
 */

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import type { Database } from '@app-types/database';

// ----------------------------------------------------------------
// Config — app.json `extra` üzerinden okunur (build-time embed).
// extra.supabaseAnonKey kullanıcı tarafından "REPLACE_ME_BEFORE_BUILD"
// placeholder'ı ile değiştirilir; çalışma zamanında placeholder hâlâ
// görünürse açıkça hata fırlatırız (sessiz fail yok).
// ----------------------------------------------------------------

type SupabaseExtras = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const ANON_KEY_PLACEHOLDER = 'REPLACE_ME_BEFORE_BUILD';

function readExtras(): SupabaseExtras {
  // expoConfig (yeni SDK) > manifest (legacy) — her ikisini de yokla
  const fromExpoConfig = (Constants.expoConfig?.extra ?? {}) as SupabaseExtras;
  const fromManifest = ((Constants.manifest as { extra?: SupabaseExtras } | null)?.extra ?? {}) as SupabaseExtras;
  return {
    supabaseUrl: fromExpoConfig.supabaseUrl ?? fromManifest.supabaseUrl,
    supabaseAnonKey: fromExpoConfig.supabaseAnonKey ?? fromManifest.supabaseAnonKey,
  };
}

const { supabaseUrl, supabaseAnonKey } = readExtras();

if (!supabaseUrl) {
  throw new Error(
    '[supabase] extra.supabaseUrl yok. app.json -> expo.extra.supabaseUrl alanını doldur.',
  );
}
if (!supabaseAnonKey || supabaseAnonKey === ANON_KEY_PLACEHOLDER) {
  throw new Error(
    '[supabase] extra.supabaseAnonKey ayarlanmamış (placeholder). ' +
      'app.json -> expo.extra.supabaseAnonKey alanına gerçek anon key yaz.',
  );
}

// ----------------------------------------------------------------
// SecureStore adapter — Supabase'in beklediği SupportedStorage arayüzü
// SecureStore item başına ~2048 byte sınırı taşır; sınırı aşan değerleri
// kaba bir "chunk" stratejisiyle parçalara böler. Chunk metadata da
// SecureStore'da kalır (AsyncStorage'a sızdırma yok).
// ----------------------------------------------------------------

const SECURE_CHUNK_SIZE = 1800; // 2048'in altı; UTF-8 multi-byte için marj
const CHUNK_META_SUFFIX = '__chunks';

function chunkKey(base: string, idx: number): string {
  return `${base}__c${idx}`;
}

function isAvailable(): boolean {
  // expo-secure-store web'de yok; native'de var. RN tarafında
  // isAvailableAsync sync fallback olmadığından, native'de true varsayıyoruz.
  // Web build için Constants.platform üzerinden gating eklenmeli (MVP: web yok).
  return true;
}

const secureStorage: SupportedStorage = {
  async getItem(key: string): Promise<string | null> {
    if (!isAvailable()) return null;
    const meta = await SecureStore.getItemAsync(`${key}${CHUNK_META_SUFFIX}`);
    if (!meta) {
      // Parçalanmamış — direkt oku
      return SecureStore.getItemAsync(key);
    }
    const count = parseInt(meta, 10);
    if (!Number.isFinite(count) || count <= 0) return null;
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(chunkKey(key, i));
      if (part === null) {
        // Eksik parça — bozuk state; temizle ve null dön.
        await this.removeItem(key);
        return null;
      }
      parts.push(part);
    }
    return parts.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    if (!isAvailable()) return;
    // Eski state'i temizle (chunked'tan tekli'ye veya tersine geçişler için)
    await this.removeItem(key);

    if (value.length <= SECURE_CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    const count = Math.ceil(value.length / SECURE_CHUNK_SIZE);
    for (let i = 0; i < count; i++) {
      const slice = value.slice(i * SECURE_CHUNK_SIZE, (i + 1) * SECURE_CHUNK_SIZE);
      await SecureStore.setItemAsync(chunkKey(key, i), slice);
    }
    await SecureStore.setItemAsync(`${key}${CHUNK_META_SUFFIX}`, String(count));
  },

  async removeItem(key: string): Promise<void> {
    if (!isAvailable()) return;
    const meta = await SecureStore.getItemAsync(`${key}${CHUNK_META_SUFFIX}`);
    if (meta) {
      const count = parseInt(meta, 10);
      if (Number.isFinite(count) && count > 0) {
        for (let i = 0; i < count; i++) {
          await SecureStore.deleteItemAsync(chunkKey(key, i));
        }
      }
      await SecureStore.deleteItemAsync(`${key}${CHUNK_META_SUFFIX}`);
    }
    await SecureStore.deleteItemAsync(key);
  },
};

// ----------------------------------------------------------------
// AsyncStorage fallback (referans olarak export edilir; MVP'de
// Supabase oturumu SecureStore'da. Geliştirici override etmek isterse
// `storage: asyncStorage` ile client'ı kendi kurabilir.)
// ----------------------------------------------------------------

export const asyncStorage: SupportedStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

// ----------------------------------------------------------------
// Client
// ----------------------------------------------------------------

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    // RN'de URL-bazlı OAuth flow yok (MVP'de OAuth da yok — §5); kapalı.
    detectSessionInUrl: false,
  },
  // global.headers, db.schema gibi alanlar default kalır.
});

// ----------------------------------------------------------------
// Yardımcı tipler — kod tüketicileri için yeniden ihraç
// ----------------------------------------------------------------

export type { Database } from '@app-types/database';
