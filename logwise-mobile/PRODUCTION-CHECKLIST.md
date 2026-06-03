# LogWise Mobile — Production Checklist (ADIM 7)

> Beta dağıtım (TestFlight / Play Internal) öncesi tamamlanması gereken adımlar.
> Sırayla geçerek doğrula; her madde için "✅" işaretle.

---

## 1. Build / Config

- [ ] `app.json` icon + adaptiveIcon + splash bağlı (ADIM 7 ✅)
- [ ] `app.json` `extra.supabaseUrl` + `supabaseAnonKey` gerçek değer (✅)
- [ ] `app.json` `extra.sentryDsn` doldurulmuş (production DSN — Sentry projesi oluşturulduktan sonra)
- [ ] `app.json` `version` semver güncellenmiş (örn. 0.2.0)
- [ ] `app.json` `ios.bundleIdentifier` + `android.package` = `fit.logwise.mobile` (✅)
- [ ] `eas.json` profilleri tanımlı: development / preview / production (✅)
- [ ] `eas.json` `submit.production.ios.{ascAppId, appleId, appleTeamId}` doldurulmuş
- [ ] `eas.json` `submit.production.android.serviceAccountKeyPath` Play Service Account JSON yolu
- [ ] `.env.example`'da gerçekten gerekli değişkenler var; gizli değer YOK

## 2. Paketler (kullanıcı kurulumu — ADIM 7'de yüklü değil)

- [ ] `@sentry/react-native` — crash raporu (DSN yoksa no-op)
  ```
  npx expo install @sentry/react-native
  ```
- [ ] (Opsiyonel) `react-native-draggable-flatlist` — drag/reorder (D3)
- [ ] (Opsiyonel) `@gorhom/bottom-sheet` — sheet polish
- [ ] (Opsiyonel) `@shopify/flash-list` — virtualization
- [ ] (Opsiyonel) `expo-haptics` — UI feedback

## 3. EAS / Expo

- [ ] `eas-cli` yüklü: `npm install -g eas-cli`
- [ ] `eas login` yapıldı
- [ ] `eas project:init` çalıştırıldı (project ID `app.json` `extra.eas.projectId`'e yazılır)
- [ ] iOS: Apple Developer Program üyeliği aktif
- [ ] Android: Google Play Console hesabı + Service Account JSON

## 4. Build smoke

- [ ] `eas build --profile development --platform android` çalışıyor
- [ ] `eas build --profile preview --platform ios` (Apple ID gerekli)
- [ ] `eas build --profile production --platform all` final build

## 5. Manuel test (development client veya preview build üzerinde)

- [ ] Auth A1-A5: signUp / signIn / signOut / forgot / guest geçişler
- [ ] Calendar B1: gün seçimi, hint dismiss, today border, week feed
- [ ] Day C1-C4: rest day, ex card, set ekle/sil/düzenle, FAB, AddExerciseSheet
- [ ] Library D1-D3: program listele, ActiveProgramCard, program edit (collapsible, off-day, activate, delete)
- [ ] Program preset seç: duplicate guard (ikinci kez seçince toast)
- [ ] Migration: guest data ile başla → signUp → guest→hesap migration başarılı
- [ ] More E1: dil/tema toggle, logout/register
- [ ] Placeholder F1/F2: çökmüyor

## 6. Telemetri / Hata izleme

- [ ] Sentry production DSN aktif, dev build'de event drop (`__DEV__` guard)
- [ ] Test crash: `Sentry.captureException(new Error('test'))` → dashboard'da görünüyor
- [ ] PII gönderilmiyor (sendDefaultPii: false)

## 7. Performans / kalite

- [ ] `npx tsc -p tsconfig.check.json --noEmit` → 0 hata (ADIM 7 ✅)
- [ ] Production build boyutu makul (< 50MB)
- [ ] İlk açılış < 3s (cihazda)
- [ ] Memory leak yok (10 dk kullanım sonrası)

## 8. Store

- [ ] App Store / Play Store ekran görüntüleri (her dil için)
- [ ] App Store / Play Store metni (TR + EN)
- [ ] Privacy policy URL
- [ ] Terms of service URL
- [ ] Support email
- [ ] App category seçildi

## 9. Sonrası

- [ ] Beta tester listesi (TestFlight internal + Play Internal Track)
- [ ] Feedback toplama kanalı (form / e-mail)
- [ ] Bir sonraki sprint backlog'u hazır

---

## EAS komutları (referans)

```bash
# Development build (telefonda dev client)
eas build --profile development --platform android
eas build --profile development --platform ios

# Preview build (internal dağıtım, simulator dahil)
eas build --profile preview --platform all

# Production build
eas build --profile production --platform all

# Store submission
eas submit --profile production --platform ios
eas submit --profile production --platform android

# OTA update (binary değişmemişse)
eas update --branch production --message "fix: ..."
```

## ADIM 7 sonu durumu

- TypeScript: 0 hata ✅
- DB types: auto-gen + cast temizliği ✅
- App icon + splash: bağlı ✅
- Sentry: kod entegre, DSN boş (production'da doldurulacak) ✅
- EAS: eas.json hazır, submit credentials kullanıcı doldurmalı ✅
- fetchUsedExerciseRefs: ADIM 7'de eklendi ✅
- Görsel tur: ADIM 7B (kullanıcı kararı)
