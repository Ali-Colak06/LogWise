# 01 — PRODUCT MAP: LogWise Ne Yapıyor?

> Etiketler: `DOĞRULANDI` / `ÇIKARIM` / `BELİRSİZ` / `ESKİ OLABİLİR`. Kanıt = dosya + sembol.
> LogWise bir **antrenman günlüğü** (workout tracker) ürünüdür: kullanıcı programlar kurar,
> günlük antrenmanlarını set/tekrar/ağırlık olarak kaydeder, ilerlemesini takip eder.

---

## 1. Ürün yüzeyleri (üst düzey)

| Yüzey | Nerede | Rol | Kanıt |
|---|---|---|---|
| **Web uygulaması (PWA)** | `/app` → `app.html` | Tam özellikli ürün | `_redirects` / `wrangler.jsonc` (Cloudflare; `/app/*`→`app.html`) `DOĞRULANDI` |
| **Mobil uygulama** | `logwise-mobile/` (Expo) | iOS/Android ürün | `logwise-mobile/app/` `DOĞRULANDI` |
| **Landing / SEO** | `/` (`index.html`), `/tr` (`tr.html`) | Pazarlama + edinim | `AGENTS.md §3.2`, `index.html` `DOĞRULANDI` |
| **Learn / Öğren** | `/learn`, `/ogren` | İçerik SEO (blog) | `learn/` (6 dosya), `ogren/` (4) `DOĞRULANDI` |
| **Library / Tools** | `/library`, `/tools` + hesaplayıcılar | Programmatic SEO | `library/` (6 html), `tools.html` `DOĞRULANDI` |
| **Resim Worker (upload)** | `…workers.dev` (upload) + ayrı `media.logwise.fit` (read-only medya) | Avatar/antrenman fotoğrafı | `logwise-worker/src/worker.js`, `profile.html` (`WORKER_URL`) `DOĞRULANDI` |

---

## 2. Web uygulaması özellikleri

Web SPA tek dosyada (`app.html`) `setView(...)` ile geçiş yapan view'lardan oluşur. Doğrulanan
view kümesi: **`calendar`, `day`, `dashboard`, `exercises`, `programs`, `social`, `feedback`,
`data`**. `DOĞRULANDI` — `app.html` (`setView("...")`, `view === "..."`).

| Özellik | View / yer | Durum | Kanıt |
|---|---|---|---|
| Takvim (ay/gün) | `calendar`, `day` | **Tamam** | `app.html` `setView("calendar"/"day")` `DOĞRULANDI` |
| Günlük antrenman + set kaydı | `day` | **Tamam** | `app.html` (`day` view 8+ geçiş) `DOĞRULANDI` |
| Programlar | `programs` | **Tamam** | `app.html` `setView("programs")` + `data/presets-programs.js` `DOĞRULANDI` |
| Egzersiz kütüphanesi/yönetimi | `exercises` | **Tamam** | `app.html` `setView("exercises")` + `lib/exercise-utils.js` `DOĞRULANDI` |
| Dashboard / istatistik | `dashboard` | **Tamam** | `app.html` `setView("dashboard")` + `components/dash-chart.js` `DOĞRULANDI` |
| PR + 1RM hesapları | hesap katmanı | **Tamam** | `lib/calc.js` + `user_prs` tablosu; `app.html` 1RM/PR ~24 referans `DOĞRULANDI` |
| Rozetler (badges) | profil/dashboard | **Tamam** | `data/badges.js` (30 rozet), `lib/badge-logic.js` `DOĞRULANDI` |
| Profil sayfası | `profile.html` | **Tamam** | `profile.html`, `lib/profile-utils.js` `DOĞRULANDI` |
| Sosyal: takip + paylaşım | `social`, `share.html`, `program.html` | **Tamam (web)** | `.from("follows")`, `.from("shared_workouts")`, `components/comment-section.js` `DOĞRULANDI` |
| Geri bildirim | `feedback` | **Tamam** | `app.html` `setView("feedback")` + `.from("feedback")` `DOĞRULANDI` |
| Veri dışa/içe aktarma | `data` | **Var** | `app.html` `setView("data")` `DOĞRULANDI`; kapsam Tur 2 `BELİRSİZ` |
| Şifre sıfırlama | `reset-password.html` | **Tamam** | dosya mevcut `DOĞRULANDI` |
| Offline/PWA | `sw.js` (app shell cache) | **Var (offline-first DEĞİL)** | `sw.js` (`logwise-v49`); veri online — bkz. [07](07-OFFLINE-AND-SYNC.md) `DOĞRULANDI` |

> Not: `AGENTS.md §8` Aşama 3'te web view'larını "dashboard/history/stats/programs/exercises/settings"
> diye anar; gerçek kodda view adları `calendar/day/dashboard/...` biçimindedir (history/stats
> büyük olasılıkla `dashboard` içinde). Adlandırma farkı için kodu esas al. `ESKİ OLABİLİR` (§8 metni).

---

## 3. Mobil uygulama özellikleri

Mobil expo-router ile çalışır; alt sekme bar'ı özel (`BottomTabBar`). Görünür 4 sekme + gizli
sosyal + "More" sheet. `DOĞRULANDI` — `logwise-mobile/app/(app)/(tabs)/_layout.tsx`.

| Özellik | Route / ekran | Durum | Kanıt |
|---|---|---|---|
| Auth (giriş/kayıt/doğrula/şifre) | `app/(auth)/{welcome,login,register,verify,forgot-password}.tsx` | **Tamam** | dosyalar + `queries/auth.ts` `DOĞRULANDI` |
| Misafir (guest) modu | tüm akış | **Tamam** | `lib/guest-storage.ts`, `data-bridge.ts` guest dalları `DOĞRULANDI` |
| Takvim (ay/hafta) | `(tabs)/calendar/index.tsx` | **Tamam** | + `components/calendar/CalendarMonth.tsx`, `CalendarWeek.tsx` `DOĞRULANDI` |
| Gün detayı (antrenman kaydı) | `(tabs)/calendar/day/[date].tsx` | **Tamam** | + `components/day/*` (`ExerciseCard`, `SetRow`) `DOĞRULANDI` |
| Kütüphane (Workout sekmesi) | `(tabs)/workout/index.tsx` | **Tamam** | sekme `_layout` "workout (Library)" `DOĞRULANDI` |
| Dashboard | `(tabs)/dashboard.tsx` | **Var** | + `lib/dashboard.ts` (`computeDashboard`) `DOĞRULANDI`; içerik olgunluğu Tur 2 `BELİRSİZ` |
| Program oluştur/düzenle | `app/(app)/program/[id]/edit.tsx` | **Tamam** | + `components/workout/NewProgramSheet.tsx` `DOĞRULANDI` |
| Preset programdan başlatma | `components/calendar/PresetProgramModal.tsx` | **Tamam** | + `data-bridge.ts` `createProgramFromPreset` `DOĞRULANDI` |
| Profil + hesap silme | `app/(app)/profile.tsx` | **Tamam** | + `lib/account.ts`, `queries/account.ts` `DOĞRULANDI` |
| "More" menüsü | `components/shared/MoreSheet.tsx` | **Tamam** | sekme bar `onMorePress` `DOĞRULANDI` |
| Sosyal | `(tabs)/social.tsx` | **Prototip / gizli** | `_layout.tsx` "social ... GİZLİ; v2'ye ertelendi" `DOĞRULANDI` |
| Web kullanıcısı **tespiti** | `data-bridge.ts` `countWebUserData` | **Tamam (implement edildi)** | `user_data` satır sayımı + karşılama modalı `DOĞRULANDI` |
| Web→mobil **veri aktarımı** | — | **Yok (implement EDİLMEDİ)** | `WebUserWelcomeModal.tsx` yalnız bilgilendirir; blob taşımaz `DOĞRULANDI` |
| Guest→authenticated **migration** | `lib/migration.ts` `migrateGuestToAccount` | **Tamam (implement edildi)** | UUID remap + `app_*` batch insert + rollback `DOĞRULANDI` |
| Antrenman kronometresi | `components/day/WorkoutTimerBar.tsx` | **Var, kalıcı değil** | bilinçli geçici (oturum içi) `ÇIKARIM` (bileşen + proje notu) |

---

## 4. Web ↔ Mobil özellik farkları (kritik)

| Konu | Web | Mobil | Etiket |
|---|---|---|---|
| **Veri modeli** | Tek JSON blob (`user_data`) + localStorage | Normalize `app_*` tablolar | `DOĞRULANDI` |
| **Misafir modu** | Var (oturumsuz; `localStorage["gym-log-v3"]`) | Var (AsyncStorage `@logwise/guest/*`) | `DOĞRULANDI` (web `app.html` `isGuest`; mobil `data-bridge.ts`) |
| **Sosyal (takip/paylaşım)** | Canlı | Ertelendi (gizli) | `DOĞRULANDI` |
| **Render** | `React.createElement` (JSX yok) | TSX | `DOĞRULANDI` (`AGENTS.md §3.1`) |
| **Egzersiz rehberi içeriği** | `ex-guides.js` (web wrapper) | `data/generated/ex-content.ts` | `DOĞRULANDI` (ortak JSON'dan) |
| **Resim yükleme (avatar/foto)** | Worker'a yazar `ÇIKARIM` | Worker'a yazar `ÇIKARIM` | Worker auth her ikisini de Supabase token ile doğrular `DOĞRULANDI` (`worker.js`) |
| **Offline** | PWA cache + localStorage | Online-only (MVP) + guest local | `DOĞRULANDI` (`supabase.ts` "§4.2 Online-only") |

> **Önemli:** Web ve mobilin "aynı işi yapması" (ör. ikisinde de program oluşturma) **ortak kod**
> demek değildir. Program oluşturma web'de `app.html` içinde, mobilde `data-bridge.ts
> createProgramFromPreset` içinde **ayrı ayrı** kodlanmıştır. Gerçek ortaklık yalnızca
> `data/presets-*.json` / `data/ex-guides.json` kanonik verisindedir. `DOĞRULANDI`.

---

## 5. Worker + statik SEO yüzeyinin ürün içindeki rolü

- **Worker (`logwise-worker/`)** ürün veritabanından bağımsız bir **resim/medya katmanıdır**:
  `GET /<key>` public serve, `PUT /avatars/<uid>/*` & `PUT /workouts/<uid>/*` (auth'lu yükleme,
  5 MB limit), `DELETE` (yalnız kendi klasörü). Token doğrulaması Supabase `/auth/v1/user`
  endpoint'ine sorularak yapılır → JWT algoritmasından bağımsız. `DOĞRULANDI` — `worker.js`
  (`verifyWithSupabase`, `isOwned`).
- **Statik SEO yüzeyi** ürün uygulamasının dışında, **edinim/organik trafik** içindir:
  landing (`index.html`/`tr.html`), Learn/Öğren blog (`blog-content/*.md` → `learn/`+`ogren/`),
  Library + Tools (programmatic). Hepsi build script'leriyle üretilir. `DOĞRULANDI` —
  `scripts/build-blog.js`, `scripts/build-programmatic-seo.js`; `AGENTS.md §8` (Bölüm 45–60).

---

## 6. Olgunluk özeti

- **Tamamlanmış çekirdek (web + mobil):** auth, takvim/gün, antrenman+set kaydı, programlar,
  egzersiz kütüphanesi, dashboard temel. `DOĞRULANDI`.
- **Web'de tam, mobilde ertelenmiş:** sosyal (takip/paylaşım/yorum). `DOĞRULANDI`.
- **Her iki platformda:** misafir modu (web oturumsuz `localStorage["gym-log-v3"]`; mobil `@logwise/guest/*`). `DOĞRULANDI`.
- **Netleşti (Tur 2):** web→mobil veri taşıma **yoktur** (yalnız tespit + karşılama); guest→auth
  migration **vardır**. `DOĞRULANDI`.
- **Kısmi/belirsiz:** mobil dashboard içerik zenginliği, web `data` (içe/dışa aktarma) kapsamı,
  mobil rozet sistemi. `BELİRSİZ` → 04/09'da ele alındı.
