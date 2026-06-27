# 07 — OFFLINE & SYNC

> Etiketler: `DOĞRULANDI` / `ÇIKARIM` / `BELİRSİZ` / `ESKİ OLABİLİR`. Kanıt = dosya + sembol.
> **Bir mekanizmanın YOKLUĞU da bulgudur.** Uygulanmamış bir şeyi varmış gibi anlatmıyoruz.
> PWA desteği ≠ offline veri senkronizasyonu; guest mode ≠ authenticated offline kullanımı.

---

## 1. Kavramları ayır (her biri ayrı şey)

| Kavram | Var mı? | Nerede | Kanıt |
|---|---|---|---|
| SW ile statik asset cache | ✅ Var | `sw.js` `PRECACHE_URLS` (app shell + statik) | `DOĞRULANDI` |
| Web localStorage persistence (guest ana veri) | ✅ Var (guest) | `localStorage["gym-log-v3"]` (oturumsuz); ayrıca tema/dil | `DOĞRULANDI` |
| Web localStorage persistence (authenticated ana veri) | ❌ Yok | authenticated ana veri `user_data` Supabase'de | `DOĞRULANDI` |
| Authenticated web verisi | ☁️ Online | `user_data` Supabase (debounced upsert) | `DOĞRULANDI` |
| Mobil React Query cache | ✅ Var (in-memory) | `query-client.ts` | `DOĞRULANDI` |
| Kalıcı OLMAYAN in-memory cache | ✅ | web React state + mobil RQ cache | `DOĞRULANDI` |
| Mobil guest storage | ✅ Yerel | `guest-storage.ts` AsyncStorage | `DOĞRULANDI` |
| Authenticated mobil Supabase verisi | ☁️ Online | `app_*` tablolar | `DOĞRULANDI` |
| Reconnect/refetch | ✅ (mobil) | `refetchOnReconnect:true` | `DOĞRULANDI` |
| Gerçek offline write queue | ❌ **Yok** | — | `DOĞRULANDI` (negatif) |
| Conflict resolution | ❌ **Yok** | — | `DOĞRULANDI` (negatif) |
| Çoklu cihaz senkron | ⚠️ Last-write-wins (örtük) | merge/algoritma yok | `ÇIKARIM` |

---

## 2. 13 soruya yanıt

**1) Web çevrimdışıyken workout kaydedebilir mi?** **Oturum durumuna bağlı — üç durumu ayır:**
- **Authenticated web:** ❌ **Hayır.** Ana veri `user_data` upsert'tir; SW Supabase isteğini
  offline'da 503 ile keser (`sw.js` `hostname.includes('supabase.co')` → 503). Okuma da Supabase'den
  gelir (`app.html line ~533`), offline'da 503. Offline mutation queue / authenticated yerel yedek
  **yok** → kullanıcı verisi açısından **online-only**. (`beforeunload` `localStorage["gym-log-v3"]`'e
  bir JSON yazar ama authenticated yükleme yolu bunu okumaz → yetim/orphan yazım, kullanılabilir yedek değil.)
- **Önceden yüklenmiş guest web** (SW cache'i oluşmuş): ✅ App shell açılır (cached) **ve** guest
  workout verisi `localStorage["gym-log-v3"]` üzerinden **ağsız okunup yazılabilir** (`app.html`
  `isGuest`, `line ~520/591`). Ağ gerektiren sosyal/auth/profil/Supabase özellikleri çalışmaz.
- **İlk ziyaret tamamen offline** (SW/cache henüz yok): ❌ Uygulamanın açılması beklenmez
  (app shell indirilemez).
`DOĞRULANDI` — `sw.js`, `app.html` (`isGuest`/`SK`, `.from("user_data")`).

**2) SW hangi dosya/istekleri cache'liyor?** App shell + statik (`/app.html`, `/`, landing,
learn/ogren/library, CSS/JS/görseller, CDN React/Supabase/Chart.js). Navigasyon: network-first →
cache fallback (`/app.html`). Statik: cache-first. `DOĞRULANDI` — `sw.js` `PRECACHE_URLS`, `fetch` handler.

**3) Supabase istekleri cache'leniyor mu?** ❌ Hayır. **Network-first**, başarısızsa 503
`{error:'offline'}` döner (cache'e yazılmaz). `DOĞRULANDI` — `sw.js`.

**4) Mobil authenticated offline değişiklik yapabilir mi?** ⚠️ **Kalıcı olarak hayır.** Mutasyon
optimistic cache'e yazar (kart dolar) ama `data-bridge` Supabase çağrısı offline'da başarısız →
`onError` **rollback** → değişiklik geri alınır. Kalıcı offline write **yok**, retry kuyruğu **yok**
(`mutations.retry:0`). `DOĞRULANDI`/`ÇIKARIM` — `queries/workouts.ts` (`onError` rollback),
`query-client.ts`.

**5) Guest mod tamamen local mı?** ✅ Evet. Tüm okuma/yazma `@logwise/guest/*` AsyncStorage; Supabase
çağrısı yok. İnternet gerekmez. `DOĞRULANDI` — `data-bridge.ts` guest dalları, `guest-storage.ts`.

**6) Guest verisi hesaba geçince gerçekten taşınıyor mu?** ✅ Evet (gerçek migration) — `migration.ts`
`migrateGuestToAccount`: oku → UUID remap → `app_*` batch insert → başarı: `clearAllGuestData`.
`DOĞRULANDI`. (Web→mobil ise taşıma DEĞİL — bkz. 05/06.)

**7) RQ cache uygulama kapanınca kalıcı mı?** ❌ Hayır. `query-client.ts`'te persister yok →
in-memory. Kapanışta cache gider, açılışta yeniden fetch. Guest verisi **AsyncStorage'da kalıcıdır**
(RQ cache değil, kaynak). `DOĞRULANDI` — `query-client.ts` (persist import yok).

**8) Reconnect'te otomatik refetch?** ✅ `refetchOnReconnect:true`. `refetchOnWindowFocus:false`
(manuel/pull-to-refresh). `DOĞRULANDI`.

**9) Optimistic update?** ✅ Mobil tüm yazma mutasyonları optimistic + rollback. Web: `debouncedSave`
React state'i hemen günceller (optimistic benzeri) ama cloud upsert debounced. `DOĞRULANDI`.

**10) Offline mutation queue / retry?** ❌ **Yok.** Ne web ne mobilde kalıcı kuyruk; `mutations.retry:0`.
`DOĞRULANDI` (negatif).

**11) Aynı hesap iki cihazda?** ⚠️ **Last-write-wins, koruma yok.**
- **Web:** `user_data` **tek blob** upsert → son yazan cihaz **tüm blob'u** ezer; diğer cihazın
  o oturumdaki değişiklikleri kaybolur (blob-granülerliğinde LWW — en riskli). `DOĞRULANDI`/`ÇIKARIM`.
- **Mobil:** satır-bazlı insert/update → LWW satır granülerliğinde; merge/conflict yok. `ÇIKARIM`.

**12) Last-write-wins / merge / conflict resolution?** Yalnız **örtük last-write-wins**; açık merge
veya conflict resolution **yok**. `DOĞRULANDI` (negatif — kodda conflict mantığı bulunamadı).

**13) Silme/güncelleme çakışmasında veri kaybı?** ✅ Mümkün. Örn. cihaz A workout siler (`app_sets`
cascade), cihaz B aynı workout'un set'ini düzenler → B'nin yazımı yetim/başarısız; ya da web'de iki
cihaz blob ezişmesi → tüm gün kaybı. `ÇIKARIM`.

---

## 3. Net özet: LogWise "offline-first" DEĞİL (ama web guest sınırlı offline çalışır)
- **Web (authenticated):** Kullanıcı verisi tamamen **online** (`user_data` Supabase); offline'da
  veri ne okunur ne yazılır, offline mutation queue/yerel yedek yok. `DOĞRULANDI`.
- **Web (guest):** Önceden yüklenmiş (SW cache'i olan) uygulamada guest workout verisi
  `localStorage["gym-log-v3"]` üzerinden **ağsız** okunup yazılabilir; ağ gerektiren özellikler
  çalışmaz; ilk ziyaret offline ise uygulama açılmaz. `DOĞRULANDI`.
- **Mobil:** Authenticated = **online-only** (offline değişiklik rollback'lenir). **Guest = tam
  yerel** (offline çalışır ama tek cihaz, bulut yok). `DOĞRULANDI` — `supabase.ts` "§4.2 Online-only MVP".

---

## 4. Senaryolar

**A) Başarılı online authenticated kayıt:** optimistic yaz → Supabase insert başarılı → temp id
reconcile. Veri kalıcı. `DOĞRULANDI`.

**B) Guest modda yerel kayıt:** AsyncStorage'a yaz, internet yok → kalıcı (cihazda). Hesap açılana
kadar buluta gitmez. `DOĞRULANDI`.

**C) İnternet kesintisinde authenticated kayıt denemesi:** Kart anında dolar (optimistic) →
Supabase çağrısı başarısız → **rollback** → kart eski haline döner. Kullanıcı kaydının gitmediğini
ancak rollback'le anlar; kuyruk yok. `DOĞRULANDI`/`ÇIKARIM`.

**D) Uygulama kapat/aç (cache/storage):**
- Mobil RQ cache uçar → açılışta yeniden fetch (auth) / AsyncStorage'dan oku (guest).
- Web (authenticated): SW shell'i cache'ten verir; ana veri Supabase'den yeniden çekilir.
- Web (guest): ana veri `localStorage["gym-log-v3"]`'ten geri yüklenir (kalıcı).
- Web tema (`gym-log-theme`), dil (`gym-log-lang`), `gym-timer` ve onboarding bayrağı
  (`logwise-onboard-done`) localStorage'da kalır. `DOĞRULANDI`.

**E) İki cihazda aynı workout:** LWW. Mobil satır-bazlı (daha az yıkıcı); web blob-bazlı (tüm
değişiklik kaybı olası). Uyarı/merge yok. `ÇIKARIM`.

**F) Guest→auth geçişinde olası veri kaybı:** Migration batch tablo-bazlı; bir tabloda hata olursa
önceki tablolar Supabase'e yazılmış kalır ama `clearAllGuestData` **çağrılmaz** → kullanıcı retry
ederse **duplikasyon** riski (guest hâlâ dolu + kısmi cloud). Tam başarı dışında atomiklik yok.
`ÇIKARIM` — `migration.ts` (`fail` erken çıkış, `clearAllGuestData` yalnız tam başarıda).

---

## 5. Bu turdaki yokluk kanıtları (önemli)
- Repoda offline mutation queue / background sync / `persistQueryClient` / `BackgroundSync` API **yok**.
- Conflict resolution / vector clock / `updated_at` tabanlı merge mantığı **yok**.
- **Authenticated** web `user_data` için **kullanılabilir** localStorage yedeği / offline draft **yok**: `beforeunload` `localStorage["gym-log-v3"]`'e yazsa da authenticated yükleme yolu bunu okumaz (yetim/orphan yazım) → restore edilmez. (Guest verisi ise zaten `localStorage["gym-log-v3"]`'tedir.)
`DOĞRULANDI` (negatif kanıt — ilgili semboller/araçlar kodda bulunamadı).
