# 10 — RISKS & TECHNICAL DEBT

> Etiketler: `DOĞRULANDI` / `ÇIKARIM` / `BELİRSİZ` / `ESKİ OLABİLİR`. Kanıt = dosya + sembol.
> **Öncelik:** P0 (acil/güvenlik-veri) · P1 (yüksek) · P2 (orta) · P3 (düşük/temizlik).
> "Repository SQL'inde policy var" ≠ "canlı production açığı" — bu ayrım korunur.

---

## R1 — `user_data_select_public` ile antrenman blob'unun public okunabilirliği
- **Alan:** Web DB / gizlilik · **Öncelik:** repo-tasarımı **P1**, **canlıda doğrulanırsa P0**.
- **Kanıt:** `supabase_setup.sql line 193-201` policy: profili `is_public=true` **ve**
  `show_profile_info=true` olan kullanıcının `user_data` satırı `select` ile herkese açık.
- **Kanıt durumu / Production:**
  - `DOĞRULANDI`: Repo SQL'i bu policy'yi içeriyor.
  - `ÇIKARIM`: `user_data.data` **tüm** antrenman/egzersiz/program blob'unu içerdiğinden, policy
    beklenenden çok daha fazla kişisel veriyi açabilir (yalnız "profil özeti" değil).
  - `BELİRSİZ`: Aynı policy'nin **canlı production'da şu an aktif** olup olmadığı repodan doğrulanamaz
    (migration yok, canlı sorgu yapılmadı).
- **Olasılık:** Orta (public profil seçen kullanıcı sayısına bağlı) · **Etki:** Yüksek (gizlilik).
- **Kullanıcıya yansıma:** Public profilli kullanıcının tüm antrenman geçmişi 3. kişilerce okunabilir.
- **Önerilen çözüm:** Public okuma yüzeyini özel bir "public özet" view'ına daralt; ham blob'u asla
  public select'e açma. **Önce doğrula:** Canlı policy aktif mi + kaç public profil var.
- **Kapsam:** Küçük-orta (1 policy + olası view). 

## R2 — Web blob modelinde çoklu cihaz last-write-wins
- **Alan:** Web veri modeli · **Öncelik:** **P1**.
- **Kanıt:** `app.html` `debouncedSave` → `user_data` **tek blob** upsert; merge/conflict mantığı yok.
- **Kanıt durumu:** `DOĞRULANDI` (upsert) / `ÇIKARIM` (blob-granülerliğinde tüm-gün kaybı).
- **Olasılık:** Orta (aynı kullanıcı iki sekme/cihaz) · **Etki:** Yüksek (sessiz veri kaybı).
- **Yansıma:** İkinci cihaz tüm blob'u ezer → diğer cihazın o oturumdaki tüm değişiklikleri kaybolur.
- **Çözüm:** Alan-bazlı upsert veya `updated_at` tabanlı merge/uyarı. **Önce doğrula:** Gerçek
  çok-cihaz kullanım sıklığı. **Kapsam:** Büyük (veri modeli dokunuşu).

## R3 — Web offline veri desteğinin bulunmaması
- **Alan:** Web offline · **Öncelik:** **P2**.
- **Kanıt:** `sw.js` Supabase→503; ana veri localStorage'da değil (yalnız `gym-timer`/onboard).
- **Kanıt durumu:** `DOĞRULANDI`.
- **Olasılık:** Yüksek (salon Wi-Fi/mobil) · **Etki:** Orta-Yüksek.
- **Yansıma:** Offline'da web ne okur ne yazar; oturumda girilen veri reload'da kaybolabilir.
- **Çözüm:** localStorage draft + reconnect sync, ya da "offline" net uyarısı. **Kapsam:** Orta.

## R4 — Mobil authenticated offline mutation queue yokluğu
- **Alan:** Mobil offline · **Öncelik:** **P2**.
- **Kanıt:** `query-client.ts` `mutations.retry:0`; `queries/workouts.ts` `onError` rollback; kuyruk yok.
- **Kanıt durumu:** `DOĞRULANDI`.
- **Olasılık:** Yüksek · **Etki:** Orta.
- **Yansıma:** Offline yazma optimistic görünür sonra geri alınır; kullanıcı kaydının gitmediğini
  geç fark eder. **Çözüm:** Offline mutation queue + reconnect flush. **Kapsam:** Orta-Büyük.

## R5 — Guest→authenticated migration transaction değil
- **Alan:** Mobil migration · **Öncelik:** **P1**.
- **Kanıt:** `lib/migration.ts` `migrateGuestToAccount`: tablo-tablo ayrı `.insert(array)`; **DB
  transaction yok**. Hata anında `fail(table,...)` döner, **önceki tabloların satırları Supabase'de
  kalır** (silinmez). "Rollback" yalnızca **AsyncStorage'ın temizlenmemesidir** (uygulama-katmanı
  best-effort), DB rollback DEĞİL. `clearAllGuestData` yalnız **tam başarıda**.
- **Kanıt durumu:** `DOĞRULANDI` (kod akışı: `fail` erken çıkış, prior `partial.*` set edilmiş satırlar geri alınmaz).
- **Olasılık:** Düşük-Orta (ağ kesintisi/RLS hatası ortada) · **Etki:** Yüksek.
- **Yansıma:** Yarıda kalan migration → hesapta **kısmi** veri + guest hâlâ dolu.
- **Çözüm:** Tek RPC/transaction (server-side) veya idempotent upsert + işaretli "migrated" durumu.
  **Kapsam:** Orta (RPC yazımı).

## R6 — Migration retry'de duplicate ihtimali
- **Alan:** Mobil migration · **Öncelik:** **P1** (R5 ile bağlı).
- **Kanıt:** Retry `migrateGuestToAccount`'u baştan çağırır; her çağrı `uuidv4()` ile **yeni** id'ler
  üretir → daha önce eklenen `app_exercises`/`app_programs` satırları **tekrar** insert edilir
  (bu tablolarda benzersizlik kısıtı yok). `app_workouts` `UNIQUE(user_id,workout_date,exercise_ref)`
  retry'de unique ihlaliyle patlar → migration yine yarıda kalır, ama egzersiz/programlar çiftlenmiştir.
- **Kanıt durumu:** `DOĞRULANDI`/`ÇIKARIM` — `migration.ts` (`uuidv4` her çağrı yeni) + `supabase_setup.sql`
  (`app_exercises`/`app_programs` unique yok; `app_workouts` unique var).
- **Olasılık:** Orta (R5 tetiklenirse) · **Etki:** Yüksek · **Yansıma:** Çift program/egzersiz + takılan migration.
- **Çözüm:** Idempotent migration (deterministik id eşleme + upsert) veya transaction. **Kapsam:** Orta.

## R7 — Tek aktif program kuralının DB tarafından zorlanmaması
- **Alan:** Mobil DB · **Öncelik:** **P2**.
- **Kanıt:** `supabase_setup.sql` yorumu "uygulama katmanı garantisi"; `activated_at not null` için
  unique kısıt yok (yalnız partial index, unique değil).
- **Kanıt durumu:** `DOĞRULANDI`/`ÇIKARIM`.
- **Olasılık:** Düşük-Orta (yarış/çoklu cihaz) · **Etki:** Orta · **Yansıma:** İki aktif program → UI tutarsızlığı.
- **Çözüm:** Partial unique index (`user_id` where `activated_at is not null`). **Kapsam:** Küçük.

## R8 — Repository SQL ile canlı Supabase şemasının ayrışması
- **Alan:** DB/operasyon · **Öncelik:** **P1**.
- **Kanıt:** `supabase/migrations/` yok; tek `supabase_setup.sql` snapshot ("Sonraki migration buranın
  altına eklenir"). Aşağıdaki R9 kanıtı ayrışmanın **gerçekleştiğini** gösterir.
- **Kanıt durumu:** `DOĞRULANDI` (migration yok) / `BELİRSİZ` (canlı fark kapsamı).
- **Olasılık:** Yüksek · **Etki:** Yüksek (yanlış güvenlik/şema varsayımı).
- **Çözüm:** Migration disiplinine geç (Supabase CLI migrations). **Kapsam:** Orta (süreç).

## R9 — Repoda bulunmayan `check_app_username_available` RPC
- **Alan:** DB/auth · **Öncelik:** **P2**.
- **Kanıt:** `queries/auth.ts` `supabase.rpc('check_app_username_available')` çağırır; `supabase_setup.sql`'de
  **tanımlı değil** (yalnız `update_updated_at`, `delete_own_account`).
- **Kanıt durumu:** `DOĞRULANDI` (kod çağrısı + SQL eksikliği).
- **Olasılık:** — (kanıtlı) · **Etki:** Orta · **Yansıma:** Fonksiyon canlıda bozulursa kayıt kırılır,
  repodan yeniden kurulamaz. **Çözüm:** RPC tanımını repoya ekle. **Kapsam:** Küçük.

## R10 — Generated database type'ın güncelliğinin bilinmemesi
- **Alan:** Mobil tip güvenliği · **Öncelik:** **P3**.
- **Kanıt:** `logwise-mobile/types/database.generated.ts` var; üreten komut repoda görünmedi.
- **Kanıt durumu:** `ESKİ OLABİLİR` (üretim adımı doğrulanamadı).
- **Olasılık:** Orta · **Etki:** Düşük-Orta (tipler şema gerisinde kalabilir). **Çözüm:** Üretim komutunu
  scriptle + CI'ye `--check`. **Kapsam:** Küçük.

## R11 — `presets-programs` ve i18n codegen-dışı drift
- **Alan:** Ortak veri · **Öncelik:** **P2**.
- **Kanıt:** `check-codegen.js` `CHECKS` yalnız presets-exercises + ex-guides; `presets-programs`
  (web `.js` ↔ mobil `.ts` "port") ve `i18n` elle senkron.
- **Kanıt durumu:** `DOĞRULANDI`.
- **Olasılık:** Orta-Yüksek · **Etki:** Orta · **Yansıma:** Web/mobil farklı program/metin gösterir.
- **Çözüm:** Bunları da kanonik JSON → codegen'e al (veya `--check`). **Kapsam:** Orta.

## R12 — Web–mobil PR ve 1RM anlam farkı
- **Alan:** Hesap/parity · **Öncelik:** **P3**.
- **Kanıt:** Web `lib/calc.js` est1RM (Epley/Brzycki) + `user_prs`; mobil `lib/calc.ts` `calcPRDisplay`
  = max(weight×reps), 1RM yok.
- **Kanıt durumu:** `DOĞRULANDI`.
- **Olasılık:** — · **Etki:** Düşük-Orta · **Yansıma:** Aynı kullanıcı iki platformda farklı "PR" görür.
- **Çözüm:** Ortak tanım + (gerekirse) ortak hesap modülü. **Kapsam:** Orta.

## R13 — Web `app.html` monoliti
- **Alan:** Web bakım · **Öncelik:** **P2**.
- **Kanıt:** `app.html` ~293 KB tek dosya; Aşama 3 (view extraction) `AGENTS.md §8`'de "henüz başlamadı".
- **Kanıt durumu:** `DOĞRULANDI`.
- **Olasılık:** — · **Etki:** Orta (bakım/regresyon riski, test zorluğu). **Çözüm:** Kademeli view extraction.
  **Kapsam:** Büyük.

## R14 — Duplicate / eski dosyalar
- **Alan:** Repo hijyeni · **Öncelik:** **P3**.
- **Kanıt:** `landing_page_tr_localized.html` (referanssız), `logwise-mobile/data/*.bak.adim8`, boş/duplicate
  `local-server*.bat`. Bkz. [03 §4.5](03-REPOSITORY-GUIDE.md).
- **Kanıt durumu:** `ESKİ OLABİLİR`.
- **Etki:** Düşük (kafa karışıklığı). **Çözüm:** Doğrula + sil. **Kapsam:** Küçük.

## R15 — Worker'ın aktiflik / operasyon belirsizliği
- **Alan:** Worker/ops · **Öncelik:** **P2**.
- **Kanıt:** Web `profile.html` worker'ı kullanır (avatar); **mobilde çağrı yok**; `wrangler.toml`
  secret yorumları kodla uyuşmuyor (`SUPABASE_JWT_SECRET` vs `SUPABASE_URL/ANON_KEY`).
- **Kanıt durumu:** `DOĞRULANDI` (web kullanım + config tutarsızlığı) / `BELİRSİZ` (mobil entegrasyon, canlı durum).
- **Etki:** Orta (yanlış config → upload kırılır). **Çözüm:** Config yorumlarını koda hizala; mobil
  entegrasyonu netleştir. **Kapsam:** Küçük-Orta.

## R16 — Test ve monitoring boşlukları
- **Alan:** Kalite · **Öncelik:** **P1**.
- **Kanıt:** `__tests__/` boş (0 test); CI yalnız codegen (`codegen-check.yml`); web'de error monitoring
  yok (Sentry yalnız mobil, crash-only).
- **Kanıt durumu:** `DOĞRULANDI`.
- **Olasılık:** Yüksek · **Etki:** Yüksek (regresyonlar/sızıntılar erken yakalanmaz).
- **Çözüm:** Saf fonksiyon birim testleri + RLS dumanı testi + typecheck'i CI'ye al; web error
  raporlama ekle. **Kapsam:** Orta (kademeli).

---

## Öncelik özeti
| P | Riskler |
|---|---|
| **P0 (koşullu)** | R1 (canlı policy repo ile eşleşirse) |
| **P1** | R1 (repo-tasarımı), R2, R5, R6, R8, R16 |
| **P2** | R3, R4, R7, R9, R11, R13, R15 |
| **P3** | R10, R12, R14 |

## En çok "önce doğrula" gerektirenler (canlı, read-only)
- R1: `user_data_select_public` canlıda aktif mi? · R8/R9: canlı şema + `check_app_username_available`
  gövdesi · R10: generated type güncel mi? · R2: gerçek çok-cihaz kullanım hacmi.
