# 06 — DATABASE & AUTH

> Etiketler: `DOĞRULANDI` / `ÇIKARIM` / `BELİRSİZ` / `ESKİ OLABİLİR`. Kanıt = dosya + sembol/policy.
> **Uyarı:** `supabase_setup.sql` bir **kurulum anlık görüntüsüdür**. Repoda artık iki tarihli
> migration vardır (`supabase/migrations/20260628120000_restrict_user_data_select.sql` ve
> `…20260629120000_app_username_normalized_unique.sql`); genel bir migration geçmişi disiplini henüz
> tam değil. Bu yüzden aşağıdaki şema **canlı production ile birebir aynı olmayabilir**; farklar açıkça
> işaretlendi.
>
> **2026-06-29 — username normalize benzersizliği `REPO ÇÖZÜMÜ HAZIR — CANLI UYGULAMA BEKLİYOR`:**
> `app_profiles` için RPC `check_app_username_available` repoya kalıcılaştırıldı ve gövdesi normalize
> mantığa (`lower(btrim(...))` + null/boş reddi) getirildi; ayrıca eşleşen partial unique index
> (`app_profiles_username_normalized_key`) eklendi. **Canlıya henüz uygulanmadı** (index yok, canlı RPC
> gövdesi hâlâ eski). Detay: §4 + §6 + [10/R9](10-RISKS-AND-TECHNICAL-DEBT.md) + [11/D15](11-DECISION-HISTORY.md).
>
> **2026-06-28 — canlı RLS güvenlik düzeltmesi `DOĞRULANDI`:** `user_data` üzerindeki public okuma
> açığı canlıda salt-okunur denetimle doğrulandı ve giderildi (anon görünür satır 7 → 0). Snapshot
> ve migration bu güvenli son duruma getirildi. Detay: §3 dipnot ² + §7 + [10/R1](10-RISKS-AND-TECHNICAL-DEBT.md).

---

## 1. Tablo envanteri ve sınıflandırma

| Tablo | SQL'de tanımlı | Kodda sorgulanıyor | Generated type'ta | Sınıf |
|---|---|---|---|---|
| `user_data` | ✓ `supabase_setup.sql` | Web `.from("user_data")`; Mobil `countWebUserData` | `BELİRSİZ`¹ | **Web blob + köprü** `DOĞRULANDI` |
| `feedback` | ✓ | Web `.from("feedback")` | `BELİRSİZ`¹ | Web `DOĞRULANDI` |
| `profiles` | ✓ | Web `lib/db.js` `syncProfileRecord`, `profile.html` | — | Web `DOĞRULANDI` |
| `shared_workouts` | ✓ | Web `.from("shared_workouts")`, `share.html` | — | Web sosyal `DOĞRULANDI` |
| `shared_workout_comments` | ✓ | Web `components/comment-section.js` | — | Web sosyal `DOĞRULANDI` |
| `comment_likes` | ✓ | Web (yorum beğeni) | — | Web sosyal `DOĞRULANDI` |
| `user_prs` | ✓ | Web `.from("user_prs")` (`app.html`) | — | Web liderlik `DOĞRULANDI` |
| `follows` | ✓ | Web `.from("follows")` | — | Web sosyal `DOĞRULANDI` |
| `app_profiles` | ✓ | Mobil `queries/auth.ts`, `data-bridge.ts` | ✓ `database.generated.ts` | Mobil `DOĞRULANDI` |
| `app_exercises` | ✓ | Mobil `data-bridge.ts` | ✓ | Mobil `DOĞRULANDI` |
| `app_programs` | ✓ | Mobil `data-bridge.ts` | ✓ | Mobil `DOĞRULANDI` |
| `app_program_days` | ✓ | Mobil `data-bridge.ts` | ✓ | Mobil `DOĞRULANDI` |
| `app_workouts` | ✓ | Mobil `data-bridge.ts` | ✓ | Mobil `DOĞRULANDI` |
| `app_sets` | ✓ | Mobil `data-bridge.ts` | ✓ | Mobil `DOĞRULANDI` |
| `app_day_meta` | ✓ | Mobil `data-bridge.ts` | ✓ | Mobil `DOĞRULANDI` |

¹ `logwise-mobile/types/database.generated.ts` mobil `app_*` tipleri için; web tablolarını içerip
içermediği bu turda satır-satır doğrulanmadı. `BELİRSİZ`.

**Yalnız eski dokümanda geçen / kodda bulunamayan:** Bu turda SQL'de olup hiç sorgulanmayan tablo
saptanmadı. Tersine, **kodda çağrılıp SQL'de OLMAYAN** bir fonksiyon var (bkz. §5). `DOĞRULANDI`.

---

## 2. İki şema, tek proje — net ayrım

```
auth.users  ← PAYLAŞILAN Supabase Auth (web + mobil aynı kimlik)
   │
   ├── WEB ŞEMASI (blob + sosyal)
   │     user_data(data jsonb)  profiles  feedback  shared_workouts
   │     shared_workout_comments  comment_likes  user_prs  follows
   │
   └── MOBİL ŞEMASI (app_ namespace, normalize)
         app_profiles  app_exercises  app_programs  app_program_days
         app_workouts  app_sets  app_day_meta
```
- **Aynı projeyi kullanmak ≠ aynı veri modelini kullanmak.** Web kullanıcı verisi `user_data.data`
  JSON blob'unda; mobil aynı kavramları normalize `app_*` tablolarında tutar. Ortak olan **yalnız
  kimlik** (`auth.users`) ve tek köprü `user_data` okumasıdır. `DOĞRULANDI` — `supabase_setup.sql`
  yorumu ("Web tabloları ... DOKUNULMAZ. app_ prefix'i namespace çakışmasını önler").

### `user_data` köprüsü
Mobil `data-bridge.ts` `countWebUserData` yalnızca `user_data`'da satır **sayar** (head count) →
web kullanıcısını saptar (karşılama modalı). Mobil `user_data` içeriğini **okumaz/yazmaz/taşımaz**.
`DOĞRULANDI` — `data-bridge.ts` (`select('*', {count:'exact', head:true})`), `WebUserWelcomeModal.tsx`.

---

## 3. RLS — politika-politika (genelleme YOK)

> `auth.uid() = user_id` **her tabloda doğru değildir**; bazı tablolar `using (true)` (herkese açık
> okuma) ya da parent üzerinden sahiplik kullanır. Aşağıdaki tablo `supabase_setup.sql`'den birebir.

| Tablo | SELECT | INSERT/UPDATE/DELETE | Not |
|---|---|---|---|
| `user_data` | `auth.uid()=user_id` — **yalnız authenticated satır sahibi**² | sahip | ✅ public okuma açığı 2026-06-28'de giderildi² |
| `feedback` | sahip | insert: sahip (update/delete policy yok) | yalnız select+insert |
| `profiles` | `is_public=true OR sahip` | sahip | public profil okunur |
| `shared_workouts` | **`using(true)`** | insert/delete: sahip | herkese açık okuma (paylaşım) |
| `user_prs` | **`using(true)`** | sahip | herkese açık (liderlik) |
| `follows` | **`using(true)`** (drop+recreate ile) | insert/delete: `follower_id` | başta dar, sonra açıldı |
| `shared_workout_comments` | **`using(true)`** | insert/update: sahip; delete: sahip **veya** paylaşım sahibi | public feed |
| `comment_likes` | **`using(true)`** | insert/delete: sahip | beğeni sayısı |
| `app_profiles` | `auth.uid()=user_id` | sahip | tam owner-only |
| `app_exercises` | `auth.uid()=user_id` | sahip | owner-only |
| `app_programs` | `auth.uid()=user_id` | sahip | owner-only |
| `app_program_days` | **parent** `EXISTS app_programs.user_id=auth.uid()` | parent | user_id kolonu yok |
| `app_workouts` | `auth.uid()=user_id` | sahip | owner-only |
| `app_sets` | **parent** `EXISTS app_workouts.user_id=auth.uid()` | parent | workout_id üzerinden |
| `app_day_meta` | `auth.uid()=user_id` | sahip | owner-only |

² **`user_data` SELECT — public okuma açığı giderildi (2026-06-28):** Eskiden `user_data_select_public`
politikası, profili `is_public=true` **VE** `show_profile_info=true` olan kullanıcının **tüm
`user_data.data` blob'unu** (egzersizler, antrenmanlar, programlar, ölçümler...) **anon dahil herkese**
açıyordu (permissive SELECT'ler OR ile birleşir). Canlı denetim (salt-okunur, 2026-06-28) anon rolünün
**7 `user_data` satırı** gördüğünü doğruladı. Politika **owner-only authenticated** olacak şekilde
düzeltildi (`for select to authenticated using ((select auth.uid()) = user_id)`); düzeltme sonrası anon
görünür satır **0**. Smoke kontrolleri geçti: public profil sayfası **hatasız** açıldı ve temeller
(avatar, bio, PR, shared workouts, takipçi verisi) çalışmaya devam etti. **Beklenen güvenlik sonucu:**
ham `user_data`ya bağlı Programs/Badges/Measurements bölümü ziyaretçilere **artık yüklenmez** — bu tam
özellik parity'si DEĞİL, bilinçli bir daraltmadır (`profile.html:358-363` sorgusu 0 satır döndürür ve
hata sessizce yutulur, çökme yok). `DOĞRULANDI` — `supabase_setup.sql`,
`supabase/migrations/20260628120000_restrict_user_data_select.sql`.

**Önemli RLS gözlemleri:**
- `feedback` yalnız `select`+`insert` policy'sine sahip → `update`/`delete` **hiç kimseye açık değil**
  (RLS varsayılan reddi). `DOĞRULANDI`.
- Mobil `app_*` modeli **owner-only**; sosyal/public okuma yok (mobil sosyal ertelenmiş). `DOĞRULANDI`.
- Parent-tabanlı sahiplik (`app_program_days`, `app_sets`) doğru kurulmuş (alt satır parent'ın
  sahibine bağlı). `DOĞRULANDI`.

---

## 4. Authentication / session / ownership

- **Kimlik:** Supabase Auth (`auth.users`), web + mobil ortak. Web UMD supabase-js (`lib/db.js`);
  mobil `@supabase/supabase-js` + SecureStore (`lib/supabase.ts`). `DOĞRULANDI`.
- **Session:** Mobil token'lar SecureStore'da (chunk'lı, AsyncStorage'a sızmaz); `autoRefreshToken`,
  `persistSession`, `detectSessionInUrl:false`. Web supabase-js default (localStorage tabanlı). `DOĞRULANDI`.
- **Kayıt:** Mobil kayıt kodu **email doğrulaması bekleyen** akışı uygular (`register.tsx`,
  `verify.tsx`, `needsConfirmation = session===null`, `ensureAppProfile`, `(app)/_layout.tsx`
  finalize); `signUp` session dönerse koşullu doğrudan-devam yolu da vardır. "Confirmation kapalı,
  signUp her zaman session döndürür" ifadesi mevcut kodla **uyumsuz**dur; canlı Supabase Auth ayarı
  repodan doğrulanamaz (`BELİRSİZ`). Username benzersizliği RPC `check_app_username_available` ile
  ön-kontrol + `app_profiles.username unique`. **2026-06-29:** repoya ek olarak normalize partial unique
  index (`app_profiles_username_normalized_key on lower(btrim(username)) where username is not null`)
  yazıldı ve RPC gövdesi bununla eşleşecek şekilde güncellendi (`lower(btrim(...))` + null/boş `false`).
  Bu DB-seviyesi normalize garantisi **repoda hazır ama canlıya henüz uygulanmadı** (`REPO ÇÖZÜMÜ HAZIR
  — CANLI UYGULAMA BEKLİYOR` — bkz. [10/R9](10-RISKS-AND-TECHNICAL-DEBT.md)). `DOĞRULANDI` (kod akışı +
  repo SQL) / `BELİRSİZ` (canlı şema/ayar).
- **Ownership zinciri:** RLS her satırı `auth.uid()`'e bağlar; `auth.users` silinince tüm FK
  `on delete cascade` → kullanıcının tüm verisi silinir. `delete_own_account()` (security definer)
  `auth.uid()`'i siler → cascade. `DOĞRULANDI` — `supabase_setup.sql`; mobil `queries/account.ts`
  `rpc('delete_own_account')`.

### Güven sınırları (trust boundaries)
- **anon key** istemcide gömülü (web `lib/db.js` hardcoded; mobil `app.json extra`). Bu **gizli
  değildir** — güvenlik tamamen **RLS**'e dayanır. `DOĞRULANDI`.
- **service_role** repoda **yok** (olmamalı; bulunmadı). `DOĞRULANDI` (negatif kanıt).
- **Client-side kontrol ≠ yetkilendirme:** Duplicate guard, tek-aktif program gibi kurallar
  uygulama katmanındadır; DB onları zorlamaz → asıl koruma RLS + DB kısıtlarıdır. `DOĞRULANDI`.

---

## 5. Worker'ın token doğrulaması
`logwise-worker/src/worker.js`:
- Yazma (`PUT`/`DELETE`) için `Authorization: Bearer <token>` zorunlu.
- `verifyWithSupabase(token, SUPABASE_URL, ANON_KEY)` → `GET ${SUPABASE_URL}/auth/v1/user` çağrısı;
  200 + `user.id` dönerse geçerli. **JWT'yi worker kendi doğrulamaz**, Supabase'e sorar (algoritma-
  bağımsız). `DOĞRULANDI`.
- Sahiplik: `key.startsWith('avatars/${userId}/')` veya `workouts/${userId}/` → kullanıcı yalnız
  kendi klasörüne yazar/siler; aksi 403. Boyut limiti 5 MB. `DOĞRULANDI`.
- **Not:** GET (okuma) **public** — herhangi bir `key` auth'suz servis edilir (resimler public CDN).
  `DOĞRULANDI`.

---

## 6. Repository ↔ canlı production boşlukları (kesin bilgi gibi yazma!)

| Bulgu | Durum | Kanıt |
|---|---|---|
| `check_app_username_available` RPC: kod çağırır + `database.generated.ts` içerir; **2026-06-29 itibarıyla `supabase_setup.sql` + migration'da TANIMLI** (önceden eksikti) | RPC artık repoda; ANCAK repo gövdesi normalize'a güncellendi, **canlı gövde hâlâ eski** → repo↔canlı farkı *uygulamaya kadar* sürüyor | `queries/auth.ts` `rpc('check_app_username_available')`, `database.generated.ts` (`:526`), `supabase_setup.sql` (mobil RPC bloğu) + `migrations/20260629120000_*` `DOĞRULANDI` (repo) / `BELİRSİZ` (canlı) |
| `supabase/migrations/` dizini yok; tek `supabase_setup.sql` snapshot | Şema geçmişi izlenmiyor | `find` (yalnız `supabase_setup.sql`) `DOĞRULANDI` |
| SQL'deki şema = canlı şema? | Doğrulanamaz | `BELİRSİZ` (canlı sorgu yapılmadı) |
| `database.generated.ts` güncel mi / neyi kapsıyor? | Üreten komut repoda görünmedi | `ESKİ OLABİLİR` (üretim adımı doğrulanamadı) |
| Web `user_prs.estimated_1rm` üretimi | Web `getAllPRs`→upsert | `DOĞRULANDI` |

---

## 7. En ciddi auth/DB riskleri (detay 10'da)
1. **`user_data_select_public` ile tüm antrenman blob'unun public okunabilirliği — GİDERİLDİ (2026-06-28).**
   Canlıda doğrulandı (anon 7 satır görüyordu), owner-only authenticated'a düzeltildi (anon 0 satır),
   snapshot + migration güncellendi. Kalan: repo↔canlı tekrar ayrışması / migration uygulanmaması / eski
   policy'nin geri gelmesi (bkz. [10/R1](10-RISKS-AND-TECHNICAL-DEBT.md), R8). `DOĞRULANDI`.
2. **`user_prs`/`shared_workouts`/`follows` `using(true)`** — denormalize PR + paylaşımlar dünyaya
   açık (tasarım gereği, ama beklenti yönetilmeli). `DOĞRULANDI`.
3. **Repo SQL ≠ canlı şema garantisi yok** (migration yok, RPC eksik) → deploy/denetim güçleşir.
   `DOĞRULANDI`.
4. **anon key client'ta** → güvenlik tamamen RLS'e bağlı; bir tabloda yanlış policy = veri sızıntısı.
   `DOĞRULANDI`.

---

## 8. Canlı doğrulama gerektiren açık sorular (read-only önerilir, otomatik çalıştırılmadı)
- Canlı şema `supabase_setup.sql` ile aynı mı? (örn. `app_*` üzerinde ek kolon/policy var mı?)
- `check_app_username_available` canlıda hangi gövdeye sahip? (RLS-safe mi?) **Kısmi yanıt (2026-06-29):**
  repoya normalize gövde (`lower(btrim(...))` + null/boş `false`, `SECURITY DEFINER`, `search_path=''`)
  yazıldı; **canlı gövde doğrulaması migration apply sonrası** `pg_get_functiondef(...)` ile yapılacak
  (bkz. [09 §doğrulama](09-QUALITY-TESTING.md), [10/R9](10-RISKS-AND-TECHNICAL-DEBT.md)).
- `database.generated.ts` canlı şemayla güncel mi?
- ~~`user_data_select_public` production'da aktif mi (kasıtlı mı)?~~ **Yanıtlandı (2026-06-28):**
  canlıda aktifti, doğrulandı (anon 7 satır) ve **kaldırıldı**; user_data SELECT artık owner-only
  authenticated (bkz. §3 dipnot ² + [10/R1](10-RISKS-AND-TECHNICAL-DEBT.md)).
