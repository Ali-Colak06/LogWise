-- 20261103120000 — Faz 4 / F6: gizli profillerin PR'ları ve paylaşımları herkese açık olmasın.
--
-- Önceki durum (supabase_setup.sql): `user_prs_select` ve `shared_workouts_select`
-- politikaları `using (true)` idi. Profilini gizli yapan (profiles.is_public = false)
-- birinin rekorları liderlik tablosunda ve REST API'de, paylaşımları da profil/akış
-- sorgularında herkese görünüyordu (yalnız adı "User" olarak çıkıyordu).
--
-- Yeni durum:
--   * user_prs: satır sahibi her zaman kendi satırını görür; başkaları yalnız profili
--     public olan kullanıcının satırlarını görür. Profil satırı olmayan kullanıcı da
--     gizli sayılır (liderlik tablosunda görünmez).
--   * shared_workouts: aynı kural listeleme sorgularına uygulanır (profil sayfası, akış).
--     Gizli profilin TEK bir paylaşım bağlantısı yine çalışsın diye `get_shared_workout(id)`
--     RPC'si eklendi: kimliği bilinen tek satırı döndürür (liste/arama yapmaz). Paylaşım
--     kimlikleri zaman damgası + 6 rastgele base36 karakterdir; "listelenmemiş bağlantı" gibi davranır.
--   * Yorumlar (shared_workout_comments) bu migration'da değişmedi.
--
-- İstemci: share.html önce RPC'yi çağırır, RPC yoksa (migration henüz uygulanmamışsa)
-- eski doğrudan sorguya düşer. Bu yüzden migration istemciden önce veya sonra uygulanabilir.
--
-- PR değerleri istemcide hesaplanıp yazılıyor; tarayıcı konsolundan uydurma değer yazılabilir.
-- Bu migration bunu çözmez — liderlik tablosu için bilinçli olarak kabul edilen risk olarak kalır.
--
-- DROP IF EXISTS + CREATE: tekrar çalıştırılabilir (idempotent).

begin;

drop policy if exists "user_prs_select" on public.user_prs;
create policy "user_prs_select"
on public.user_prs
for select
using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.profiles p
    where p.user_id = user_prs.user_id
      and p.is_public = true
  )
);

drop policy if exists "shared_workouts_select" on public.shared_workouts;
create policy "shared_workouts_select"
on public.shared_workouts
for select
using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.profiles p
    where p.user_id = shared_workouts.user_id
      and p.is_public = true
  )
);

-- Paylaşım bağlantısı: kimliği bilinen tek paylaşımı döndürür (gizli profiller dahil).
create or replace function public.get_shared_workout(p_id text)
returns setof public.shared_workouts
language sql
stable
security definer
set search_path = public
as $$
  select * from public.shared_workouts where id = p_id limit 1
$$;

revoke all on function public.get_shared_workout(text) from public;
grant execute on function public.get_shared_workout(text) to anon, authenticated;

create index if not exists shared_workouts_user_idx on public.shared_workouts (user_id);

commit;
