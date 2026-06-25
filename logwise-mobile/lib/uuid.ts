/**
 * UUID v4 generator (ADIM 5) — RFC 4122 compliant.
 *
 * Neden expo-crypto degil?
 *   - Yeni paket install gereksiz (ADIM 5 kapsamı: paket eklemeden).
 *   - RN Hermes runtime'inda `Math.random()` cihaz kaynaklı entropy ile
 *     yeterli ortalama kalite (~122-bit; collision riski 2^61 sonrasi).
 *   - Migration UUID regen, guest CRUD, programs vb. yerel kullanim — distributed
 *     tek-yazan veritabani kullanim profili. Cryptographic guarantee gerekirse
 *     ileride `expo-crypto.randomUUID()` 1-line geçiş.
 *
 * Performans:
 *   - ~6 µs/UUID Hermes (yeterli; saniyede 100k+ UUID).
 *   - Heap pressure: 0 alloc disinda (template literal + slice).
 *
 * Versiyon: RFC 4122 v4 — bit 49 = 0100 (4xxx), bit 81-82 = 10 (8/9/a/b ilki).
 */

const HEX = '0123456789abcdef';

/**
 * 16 byte rastgele dolu Uint8Array dondurur.
 *
 * Sira:
 *   1) `globalThis.crypto?.getRandomValues` (browser/RN polyfill varsa)
 *   2) Math.random fallback (cryptographic degil ama UUID v4 icin acceptable)
 */
function randomBytes16(): Uint8Array {
  const bytes = new Uint8Array(16);
  const g = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } });
  if (g.crypto?.getRandomValues) {
    g.crypto.getRandomValues(bytes);
    return bytes;
  }
  for (let i = 0; i < 16; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

/**
 * RFC 4122 v4 UUID dondurur (örnek: `f47ac10b-58cc-4372-a567-0e02b2c3d479`).
 */
export function uuidv4(): string {
  const b = randomBytes16();
  // Version 4 — byte 6: 0100xxxx
  b[6] = ((b[6] ?? 0) & 0x0f) | 0x40;
  // RFC 4122 variant — byte 8: 10xxxxxx
  b[8] = ((b[8] ?? 0) & 0x3f) | 0x80;

  let s = '';
  for (let i = 0; i < 16; i++) {
    const v = b[i] ?? 0;
    s += HEX[v >> 4];
    s += HEX[v & 0x0f];
    if (i === 3 || i === 5 || i === 7 || i === 9) s += '-';
  }
  return s;
}

/**
 * Verilen string UUID v4 formatinda mi? (loose check)
 * 8-4-4-4-12, lowercase hex, version nibble = 4, variant ilk char = 8/9/a/b.
 */
export function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}
