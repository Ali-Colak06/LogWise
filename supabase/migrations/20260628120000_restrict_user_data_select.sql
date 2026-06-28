-- 20260628120000 — Restrict user_data SELECT to authenticated row owner.
-- Removes public exposure of the raw user_data blob via public profiles.
--
-- Production'da 2026-06-28 tarihinde manuel olarak uygulanmıştır.
-- Bu migration repository geçmişi, yeni ortamlar ve tekrar üretilebilirlik için eklenmiştir.
--
-- Live audit 2026-06-28 (read-only): the `anon` role could SELECT the raw
-- user_data blob (exercises/workouts/programs/measurements) for any owner whose
-- profile had is_public = true AND show_profile_info = true. Anon-visible
-- user_data rows: 7. After this policy: anon-visible rows 0. Authenticated-web,
-- authenticated-mobile and public-profile smoke checks passed (public profile
-- page opens without error; basics — avatar, bio, PRs, shared workouts and
-- follower data — keep working; the raw-user_data-backed Programs/Badges/
-- Measurements section no longer loads for visitors, which is the intended
-- security outcome, not full feature parity). See docs 06 §3 / 10 R1 / 11 D14.
--
-- DROP IF EXISTS + CREATE is used because the two valid starting states differ:
--   * Repo snapshot: TWO select policies — owner-only `user_data_select`
--     PLUS public `user_data_select_public`.
--   * Live (pre-fix): a SINGLE merged `user_data_select` (owner OR public).
-- Dropping both names first, then recreating one owner-only policy, converges
-- both states to the same secure result and is safe to re-run (idempotent).

begin;

drop policy if exists user_data_select_public on public.user_data;
drop policy if exists user_data_select        on public.user_data;

create policy user_data_select
on public.user_data
for select
to authenticated
using (
  (select auth.uid()) = user_id
);

commit;
