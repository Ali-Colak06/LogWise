-- 20260629120000 — app_profiles kullanıcı adı: normalize benzersizlik + RPC normalize paritesi.
--
-- Durum: GİDERİLDİ — CANLIDA UYGULANDI VE DOĞRULANDI (2026-06-29).
--   Production'da 2026-06-29 tarihinde manuel olarak uygulandı. Index (indisready/indisvalid/
--   indisunique = true; UNIQUE + lower(btrim(username)) + WHERE username IS NOT NULL) ve RPC gövdesi
--   (NULL/boş -> false; lower(btrim(...)) karşılaştırma; anon/authenticated/service_role EXECUTE)
--   canlıda doğrulandı. Migration, repository geçmişi ve yeni ortamların tekrar üretilebilirliği için
--   korunuyor (daha önce canlıya uygulandığından SQL gövdesi ve dosya adı DEĞİŞTİRİLMEZ).
--
-- Amaç:
--   1) check_app_username_available RPC'sini repoya kalıcılaştır VE gövdesini normalize index ile
--      birebir aynı mantığa getir: kolon + parametre lower(btrim(...)); null/boş girdi -> false
--      (boş kullanıcı adı asla "müsait" değildir). Bu, canlı RPC gövdesini (lower(trim) /
--      lower(username), guard'sız) GÜNCELLER — kasıtlı iyileştirme, no-op DEĞİL (R9 / 06 §6).
--   2) RPC ile EŞLEŞEN normalize unique index ekle → 'Ali'/'ali'/'ALI '/' ali' DB seviyesinde aynı
--      kabul edilir (yarış-güvenli; RPC ön-kontrolü tek başına yeterli değildir).
--
-- Sınırlar / re-run (tekrar çalıştırılabilirlik):
--   * create or replace function       → idempotent.
--   * revoke/grant                     → idempotent (açık least-privilege).
--   * create unique index if not exists → yalnız AD çakışmasına bakar; AYNI ADLI ama YANLIŞ TANIMLI
--     bir index'i DÜZELTMEZ. Apply sonrası pg_indexes ile tanım doğrulanmalı (UNIQUE +
--     lower(btrim(username)) + WHERE (username IS NOT NULL)).
--   * Index BUILD aşaması, apply anında normalize-duplicate VARSA hata verir ve TÜM işlem geri
--     alınır (begin/commit) — kasıtlı güvenlik kapısı. Canlı denetim (2026-06-28, read-only):
--     normalize-duplicate grubu 0, NULL 1, boş 0 → güvenli.
--   * NULL username korunur (partial: where username is not null → çoklu NULL'a izin; akış nullable
--     kalır, username NOT NULL YAPILMAZ).
--   * Mevcut app_profiles_username_key UNIQUE(username) KASITEN korunur (bu turda kaldırılmaz;
--     hiçbir uygulama kodu constraint adına bağlı değil).
--
-- Lock notu: Düz CREATE UNIQUE INDEX (CONCURRENTLY değil) tabloda SHARE kilidi alır (ACCESS EXCLUSIVE
--   DEĞİL): okumalar sürer, yazmalar (insert/update/delete) build boyunca bekleyebilir. Tablo çok
--   küçük olduğundan build alt-saniyedir → düz index uygundur. CONCURRENTLY transaction bloğunda
--   çalışamadığı için bu migration'da kullanılmaz.

begin;

-- 1) RPC — normalize paritesi: kolon ve parametre lower(btrim(...)); null/boş -> false.
create or replace function public.check_app_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select
    case
      when p_username is null or btrim(p_username) = '' then false
      else not exists (
        select 1
        from public.app_profiles
        where lower(btrim(username)) = lower(btrim(p_username))
      )
    end;
$function$;

-- 2) Açık least-privilege EXECUTE (PUBLIC default grant'i kaldır, yalnız hedef rollere ver).
revoke all
  on function public.check_app_username_available(text)
  from public;
grant execute
  on function public.check_app_username_available(text)
  to anon, authenticated, service_role;

-- 3) Normalize benzersizlik — RPC ile aynı mantık (trim == btrim); NULL'a izin verir.
create unique index if not exists app_profiles_username_normalized_key
  on public.app_profiles (lower(btrim(username)))
  where username is not null;

commit;
