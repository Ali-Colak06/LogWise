# 11 — DECISION HISTORY

> Etiketler: `DOĞRULANDI` / `ÇIKARIM` / `BELİRSİZ` / `ESKİ OLABİLİR`. Kanıt = dosya/commit + sembol.
> Kanıtı olmayan gerekçeyi kesin gerçek gibi yazmıyoruz. Kaynaklar: `git log`, `AGENTS.md §8`
> (Bölüm 28-89 özeti), `REFACTOR-GECMISI.md` (tarihli bölümler), kod yorumlarındaki spec atıfları
> (örn. `03-mvp-decisions.md §X` — bu **doküman** ayrıca okunmadı; atıf koddan alındı).

---

## D1 — Web "tek JSON blob" veri modeli (`user_data`)
- **Tarih/commit:** Projenin web kökeni (monorepo öncesi; `supabase_setup.sql` başlığı "GYM LOG").
- **Kanıt:** `supabase_setup.sql` `user_data(data jsonb)`; `lib/data-schema.js` `init()`/`migrateData()`.
- **Problem:** Hızlı, şemasız tek-kullanıcı veri saklama (erken ürün). 
- **Yaklaşım:** Tüm kullanıcı verisi tek `jsonb` satırında; istemci migrate eder.
- **Alternatifler:** İlk günden normalize tablolar.
- **Bugünkü etki:** Çoklu-cihaz LWW + offline kaybı riskleri buradan gelir (bkz. 10/R2, R3).
- **Geçerli mi?** Web için hâlâ kullanımda. **Yeniden değerlendirme:** Evet (ölçeklenme/çoklu-cihaz).
- **Güven:** Yüksek (`DOĞRULANDI` — kod). Gerekçe `ÇIKARIM`.

## D2 — Mobil normalize `app_*` tabloları
- **Tarih:** Mobil "ADIM 2, rev 15"; monorepo entegrasyonu `AGENTS.md §8` Bölüm 86.
- **Kanıt:** `supabase_setup.sql` "MOBILE — app_ namespace" bloğu; `data-bridge.ts`.
- **Problem:** İlişkisel sorgular (gün/ay/set), RLS, performans — blob'un sınırları.
- **Yaklaşım:** `app_workouts/app_sets/...` normalize; `exercise_ref` polymorphic soft-ref; preset'ler
  bundle'da (DB'ye kopyalanmaz).
- **Alternatifler:** Web blob modelini mobile taşımak.
- **Etki:** Web ↔ mobil iki ayrı veri evreni (köprü yok). **Geçerli mi?** Evet. **Güven:** Yüksek (`DOĞRULANDI`).

## D3 — Web ve mobilin AYRI veri modelleri olarak ilerlemesi
- **Tarih:** Bölüm 86 (monorepo); `supabase_setup.sql` "Web tabloları ... DOKUNULMAZ".
- **Kanıt:** İki ayrı tablo kümesi + tek kesişim `user_data` (sayım). `WebUserWelcomeModal.tsx`.
- **Problem:** Mevcut web'i bozmadan mobil MVP'yi hızla çıkarmak.
- **Yaklaşım:** `app_` namespace ile izolasyon; web→mobil **veri taşıma yok**, yalnız tespit.
- **Etki:** Aynı kullanıcı iki platformda farklı geçmiş görür (kabul edilmiş ödün).
- **Geçerli mi?** Evet (bilinçli). **Yeniden değerlendirme:** Birleşik veri hedeflenirse. **Güven:** Yüksek (`DOĞRULANDI`).

## D4 — Guest (misafir) modu
- **Tarih:** Mobil ADIM 4-5 (`03-mvp §3.9`).
- **Kanıt:** `lib/guest-storage.ts` (`@logwise/guest/*`), `data-bridge.ts` guest dalları, `auth-store.ts`;
  web `app.html` (`isGuest = !user`, `localStorage["gym-log-v3"]`).
- **Problem:** Kayıt sürtünmesi olmadan denemeye izin vermek.
- **Yaklaşım:** Mobil: tüm veri cihazda (AsyncStorage), Supabase'e hiç gitmez, DB tablo adlarıyla
  bire bir anahtar. Web: oturumsuz kullanıcı misafir sayılır, veri `localStorage` blob'unda.
- **Alternatifler:** Zorunlu kayıt.
- **Etki:** **Hem web hem mobilde var** (ayrı implementasyonlar — web localStorage blob'u ↔ mobil
  normalize `@logwise/guest/*`). **Geçerli mi?** Evet. **Güven:** Yüksek (`DOĞRULANDI`).

## D5 — Guest → hesap migration
- **Tarih:** Mobil ADIM 5 (`03-mvp §3.9.1`).
- **Kanıt:** `lib/migration.ts` `migrateGuestToAccount`.
- **Problem:** Misafir verisini kayıt sonrası kaybetmemek.
- **Yaklaşım:** Oku → UUID remap → parent→child batch insert → başarı: guest temizle; best-effort
  uygulama-katmanı rollback (DB transaction değil).
- **Etki:** Transaction olmaması → kısmi insert + retry duplikasyonu riski (bkz. 10/R5, R6).
- **Geçerli mi?** Evet ama kırılgan. **Yeniden değerlendirme:** Evet (idempotent/transaction). **Güven:** Yüksek (`DOĞRULANDI`).

## D6 — Expo Router (dosya-tabanlı routing)
- **Tarih:** Mobil ADIM 3-4.
- **Kanıt:** `package.json` `"main":"expo-router/entry"`, `app/` ağacı, `app/_layout.tsx`.
- **Problem:** Standart, deep-link uyumlu navigasyon.
- **Yaklaşım:** `(auth)`/`(app)/(tabs)` grupları; gating grup layout'larında `Redirect`.
- **Alternatifler:** React Navigation manuel.
- **Geçerli mi?** Evet. **Güven:** Yüksek (`DOĞRULANDI`).

## D7 — TanStack Query + `data-bridge` (mode-aware veri katmanı)
- **Tarih:** ADIM 4-5; FAZ 1-2 perf.
- **Kanıt:** `lib/query-client.ts`, `lib/data-bridge.ts` (`useDataCtx`), `queries/*.ts` (optimistic).
- **Problem:** Server-state cache + guest/auth tek dispatch + perf (waterfall kırma, seed).
- **Yaklaşım:** RQ server-state; zustand UI-state; her query mode-aware köprüden geçer; mutasyonlar optimistic.
- **Etki:** Offline mutation queue yok (kapsam dışı bırakıldı — online-only MVP §4.2).
- **Geçerli mi?** Evet. **Güven:** Yüksek (`DOĞRULANDI`).

## D8 — Ortak veriye codegen'e geçiş
- **Tarih:** `AGENTS.md §8` Bölüm 87-89; commits `25a7eee` (preset codegen), `e0b4912` (ex-content),
  `7c47cbd` (CI drift).
- **Kanıt:** `scripts/build-presets-exercises.js`, `build-ex-guides.js`, `check-codegen.js`, `codegen-check.yml`.
- **Problem:** Web `.js` ↔ mobil `.ts` aynı veriyi elle iki kez tutma → drift.
- **Yaklaşım:** Kanonik JSON → tek generator → iki çıktı + `--check` + CI.
- **Alternatifler:** Elle senkron (hâlâ `presets-programs`/`i18n` için geçerli — drift riski R11).
- **Geçerli mi?** Evet (kısmen — kapsam genişletilmeli). **Güven:** Yüksek (`DOĞRULANDI`).

## D9 — Egzersiz rehberlerinin kanonik JSON'a alınması
- **Tarih:** Bölüm 61-85 (enrichment batch'leri, çoğu `2026-06-19`); commits `a8716d0`, `45b2ca9`, batch'ler.
- **Kanıt:** `data/ex-guides.json`, `docs/EXERCISE-GUIDE-SCHEMA.md`, `build-ex-guides.js`.
- **Problem:** Platform-nötr, doğrulanabilir egzersiz içeriği (145/145 kapsam).
- **Yaklaşım:** Kanonik JSON + schema + readiness/medya doğrulama + web wrapper + mobil projection.
- **Geçerli mi?** Evet. **Güven:** Yüksek (`DOĞRULANDI`).

## D10 — Worker / R2 medya sistemi
- **Tarih:** Bölüm 62; commit `626aaf6` (media delivery checks).
- **Kanıt:** `logwise-worker/src/worker.js`, `wrangler.toml`, `r2-exercise-media-cors.json`,
  `scripts/validate-exercise-media.js`.
- **Problem:** Kullanıcı görselleri (avatar/foto) + egzersiz medyası için ayrı, ucuz, public CDN.
- **Yaklaşım:** R2 + Worker (auth'lu upload, public serve) + ayrı `media.logwise.fit` (read-only).
- **Etki:** Web profil kullanır; mobil entegrasyon belirsiz (R15). **Geçerli mi?** Evet (web). **Güven:** Orta-Yüksek (`DOĞRULANDI`/`BELİRSİZ`).

## D11 — Mobil sosyal sekmenin ertelenmesi
- **Tarih:** Launch fazı (`§3.11`).
- **Kanıt:** `(tabs)/_layout.tsx` ("social ... GİZLİ; v2'ye ertelendi", `HIDDEN_TABS`).
- **Problem:** "Solo-tamamla, sosyali ertele" — yayını hızlandırmak.
- **Yaklaşım:** Route kayıtlı ama bar'da gizli (kod silinmeden ertelendi).
- **Etki:** Web'de sosyal canlı, mobilde yok (parity farkı). **Geçerli mi?** Evet. **Güven:** Yüksek (`DOĞRULANDI`).

## D12 — `app.html` monolitinin (şimdilik) korunması
- **Tarih:** Aşama 1-2 (Bölüm 28-41) veri/lib/component ayırdı; Aşama 3 (view extraction) **başlamadı**.
- **Kanıt:** `AGENTS.md §8` ("Aşama 3 ... henüz başlamadı"); `app.html` ~293 KB.
- **Problem:** Refactor riski vs hız — yeniden-kullanılabilir parçalar çıkarıldı, App view'ları monolitte kaldı.
- **Yaklaşım:** Kademeli ayrıştırma; view extraction ertelendi.
- **Etki:** Bakım/test zorluğu (R13). **Geçerli mi?** Evet ama borç. **Yeniden değerlendirme:** Evet. **Güven:** Yüksek (`DOĞRULANDI`).

## D13 — Worktree + `web/work` çoklu-ajan çalışma modeli
- **Tarih:** commits `3a444f7`, `8df1e74`, `8700724` (AGENTS §3.5).
- **Kanıt:** `AGENTS.md §3.5` tablo (Claude=master/mobil, Codex=web/work).
- **Problem:** Tek repo + iki ajanın çakışmadan paralel çalışması.
- **Yaklaşım:** Ayrı worktree/dal sabit roller; `origin/master` ortak doğruluk; server-side ff iniş.
- **Geçerli mi?** Evet (aktif düzen). **Güven:** Yüksek (`DOĞRULANDI`).

## D14 — `user_data` public profil erişiminin kaldırılması (RLS güvenlik düzeltmesi)
- **Tarih:** 2026-06-28. Canlıda manuel uygulandı; repoya migration + snapshot olarak kaydedildi.
- **Kanıt:** `supabase/migrations/20260628120000_restrict_user_data_select.sql`; `supabase_setup.sql`
  (eski `user_data_select_public` kaldırıldı, `user_data_select` owner-only authenticated). Tersine
  döndürdüğü bağlam: `REFACTOR-GECMISI.md` Bölüm 23 (2026-04-12, `user_data_select_public` eklenmişti).
- **Problem:** Public profil açıldığında (`is_public=true` + `show_profile_info=true`) kullanıcının **ham
  `user_data` blob'u** (antrenman/egzersiz/program/ölçüm geçmişi) **anon dahil herkese** okunabiliyordu;
  canlı denetimde anon rolü **7 `user_data` satırı** görüyordu.
- **Karar / Yaklaşım:** `user_data` SELECT yalnız authenticated satır sahibine açılır
  (`to authenticated using ((select auth.uid()) = user_id)`). `DROP IF EXISTS + CREATE` ile hem repo
  (iki policy) hem canlı (tek birleşik policy) başlangıç durumu aynı güvenli sonuca yakınsar.
- **Alternatifler:** Public okuma yüzeyini ayrı bir "public özet" view/RPC'ye daraltmak (gelecek iş;
  ham blob asla public select'e açılmaz).
- **Etki:** Düzeltme sonrası anon görünür satır **0**. Public profil **temel** akışları smoke testte
  çalışmaya devam etti (sayfa hatasız açıldı; avatar/bio/PR/shared workouts/takipçi verisi sürüyor).
  Ham `user_data`ya bağlı **Programs/Badges/Measurements** bölümü ziyaretçilere artık yüklenmez —
  **tam özellik parity'si korunmadı**, bilinçli güvenlik daraltması (`profile.html` değiştirilmedi;
  sorgu 0 satır döndürür, hata sessizce yutulur).
- **Gelecek:** Public istatistik gerekirse ayrı ve sınırlı bir veri yüzeyi (view/RPC/ayrı tablo).
- **Geçerli mi?** Evet. **Güven:** Yüksek (`DOĞRULANDI`).

---

## Kararların bugünkü durumu (özet)
| Karar | Durum | Yeniden değerlendir? |
|---|---|---|
| D1 Web blob | Aktif | Evet (çoklu-cihaz/offline) |
| D2 Mobil normalize | Aktif | Hayır |
| D3 Ayrı modeller | Bilinçli ödün | Birleşik veri istenirse |
| D5 Guest migration | Aktif/kırılgan | **Evet** (transaction/idempotent) |
| D8 Codegen | Aktif/kısmi | Evet (kapsam genişlet) |
| D11 Sosyal erteleme | Aktif | v2'de |
| D12 Monolit | Borç | Evet (Aşama 3) |
| D14 `user_data` public erişim kaldırıldı | Aktif (güvenlik) | Public özet istenirse (sınırlı view/RPC) |

> **Belirsizlik:** Mobil kararların gerekçeleri `03-mvp-decisions.md`'ye atıfta bulunur; bu doküman
> bu turda okunmadı → gerekçeler "koddaki atıf" düzeyinde `DOĞRULANDI`, içerik detayı `BELİRSİZ`.
