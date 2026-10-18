-- ============================================================
-- GYM LOG — Supabase Kurulum SQL
-- Supabase Dashboard → SQL Editor → Çalıştır
-- ============================================================

-- 1. Kullanıcı verileri (egzersizler, antrenmanlar, programlar)
create table if not exists user_data (
  user_id uuid references auth.users(id) on delete cascade primary key,
  data jsonb not null default '{"exercises":[],"workouts":{},"programs":{},"activeProgram":null}',
  updated_at timestamptz default now()
);

-- 2. Geri bildirimler (developer için ayrı tablo)
create table if not exists feedback (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  msg text not null,
  cat text not null default 'general',
  rating int default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security — her kullanıcı sadece kendi verisini görür
-- ============================================================

alter table user_data enable row level security;
alter table feedback enable row level security;

-- user_data politikaları
-- SELECT yalnız authenticated satır sahibine açıktır. Ham user_data blob'u
-- (egzersizler/antrenmanlar/programlar/ölçümler) public/anon'a ASLA açılmaz.
-- (2026-06-28 RLS güvenlik düzeltmesi — bkz. supabase/migrations/20260628120000_*.)
create policy "user_data_select" on user_data
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "user_data_insert" on user_data
  for insert with check (auth.uid() = user_id);

create policy "user_data_update" on user_data
  for update using (auth.uid() = user_id);

create policy "user_data_delete" on user_data
  for delete using (auth.uid() = user_id);

-- feedback politikaları
create policy "feedback_select" on feedback
  for select using (auth.uid() = user_id);

create policy "feedback_insert" on feedback
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- İSTEĞE BAĞLI: updated_at otomatik güncelleme
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger user_data_updated_at
  before update on user_data
  for each row execute function update_updated_at();

-- ============================================================
-- Hesap Silme Fonksiyonu
-- Kullanıcının kendi hesabını silmesini sağlar
-- ============================================================
create or replace function delete_own_account()
returns void language sql security definer as $$
  delete from auth.users where id = auth.uid();
$$;

-- ============================================================
-- SOSYAL ÖZELLİKLER — Kategori 8
-- ============================================================

-- 3. Kullanıcı profilleri (bio, avatar, gizlilik)
create table if not exists profiles (
  user_id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  display_name text default '',
  bio text default '',
  avatar text default '',
  is_public boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Username unique index (case insensitive)
create unique index if not exists profiles_username_lower_idx on profiles (lower(username));

-- 4. Paylaşılan antrenmanlar (public link ile paylaşım)
create table if not exists shared_workouts (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  workout_date text not null,
  workout_data jsonb not null default '[]',
  exercise_names jsonb default '[]',
  caption text default '',
  created_at timestamptz default now()
);

-- 5. Kullanıcı PR'ları (liderlik tablosu için denormalize)
create table if not exists user_prs (
  user_id uuid references auth.users(id) on delete cascade,
  exercise_name text not null,
  max_weight numeric default 0,
  max_reps int default 0,
  estimated_1rm numeric default 0,
  updated_at timestamptz default now(),
  primary key (user_id, exercise_name)
);

-- 6. Takip sistemi (tek yönlü, Instagram tarzı)
create table if not exists follows (
  follower_id uuid references auth.users(id) on delete cascade,
  following_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

-- ============================================================
-- Sosyal Tablolar — Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table shared_workouts enable row level security;
alter table user_prs enable row level security;
alter table follows enable row level security;

-- profiles: herkes public profilleri okuyabilir, sadece sahibi düzenleyebilir
create policy "profiles_select_public" on profiles
  for select using (is_public = true or auth.uid() = user_id);

create policy "profiles_insert" on profiles
  for insert with check (auth.uid() = user_id);

create policy "profiles_update" on profiles
  for update using (auth.uid() = user_id);

create policy "profiles_delete" on profiles
  for delete using (auth.uid() = user_id);

-- shared_workouts: herkes okuyabilir, sadece sahibi yazabilir/silebilir
create policy "shared_workouts_select" on shared_workouts
  for select using (true);

create policy "shared_workouts_insert" on shared_workouts
  for insert with check (auth.uid() = user_id);

create policy "shared_workouts_delete" on shared_workouts
  for delete using (auth.uid() = user_id);

-- user_prs: herkes okuyabilir (liderlik tablosu), sadece sahibi yazabilir
create policy "user_prs_select" on user_prs
  for select using (true);

create policy "user_prs_insert" on user_prs
  for insert with check (auth.uid() = user_id);

create policy "user_prs_update" on user_prs
  for update using (auth.uid() = user_id);

create policy "user_prs_delete" on user_prs
  for delete using (auth.uid() = user_id);

-- follows: takip eden kişi ve takip edilen kişi okuyabilir, takip eden yazabilir/silebilir
create policy "follows_select" on follows
  for select using (auth.uid() = follower_id or auth.uid() = following_id);

create policy "follows_insert" on follows
  for insert with check (auth.uid() = follower_id);

create policy "follows_delete" on follows
  for delete using (auth.uid() = follower_id);

-- profiles updated_at trigger
create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- user_prs updated_at trigger
create trigger user_prs_updated_at
  before update on user_prs
  for each row execute function update_updated_at();

-- ============================================================
-- PROFIL BİLGİLERİ GÖRÜNÜRLÜĞü — show_profile_info
-- ============================================================

-- profiles tablosuna show_profile_info kolonu ekle (default true)
alter table profiles add column if not exists show_profile_info boolean default true;

-- GÜVENLİK NOTU (2026-06-28): Eskiden burada `user_data_select_public` adlı bir
-- SELECT politikası vardı; profili is_public=true VE show_profile_info=true olan
-- kullanıcının TÜM user_data blob'unu (egzersiz/antrenman/program/ölçüm) anon
-- dahil herkese açıyordu. Permissive SELECT politikaları OR ile birleştiğinden bu,
-- ham antrenman geçmişini dünyaya açıyordu. Canlı denetimde (read-only) anon rolü
-- 7 user_data satırı görebiliyordu. Politika KALDIRILDI; user_data SELECT artık
-- yalnız authenticated satır sahibine açık (yukarı bkz.). Public profiller yalnız
-- `profiles` temellerini ve public `user_prs` / `shared_workouts`'u yüzeyler —
-- ham `user_data` blob'unu DEĞİL. Bu blob'u public select'e tekrar AÇMA; gelecekte
-- public istatistik gerekirse sınırlı bir view / RPC / ayrı tablo tasarla.
-- Tekrar üretilebilir kayıt: supabase/migrations/20260628120000_restrict_user_data_select.sql.

-- follows: takip listelerini herkes görebilir (profil sayfasında takipçi/takip listesi için)
drop policy if exists "follows_select" on follows;
create policy "follows_select" on follows
  for select using (true);

-- ============================================================
-- YORUM SİSTEMİ — Bölüm 44
-- Paylaşılan antrenmanlara yorum yapma + beğenme + yanıtlama
-- ============================================================

-- 7. Paylaşım yorumları (tek seviye thread destekli)
create table if not exists shared_workout_comments (
  id text primary key,
  post_id text not null references shared_workouts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id text references shared_workout_comments(id) on delete cascade,
  content text not null,
  edited boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Performans index'leri
create index if not exists comments_post_idx on shared_workout_comments(post_id, created_at desc);
create index if not exists comments_parent_idx on shared_workout_comments(parent_id);
create index if not exists comments_user_idx on shared_workout_comments(user_id);

-- 8. Yorum beğenileri (composite primary key — bir kullanıcı bir yorumu sadece 1 kez beğenebilir)
create table if not exists comment_likes (
  comment_id text not null references shared_workout_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (comment_id, user_id)
);

create index if not exists comment_likes_comment_idx on comment_likes(comment_id);

-- ============================================================
-- Yorum Tabloları — Row Level Security
-- ============================================================

alter table shared_workout_comments enable row level security;
alter table comment_likes enable row level security;

-- shared_workout_comments: herkes okuyabilir (public feed),
-- sadece giriş yapmış kullanıcılar yazabilir,
-- yorum sahibi düzenleyebilir/silebilir,
-- paylaşım sahibi de kendi paylaşımındaki yorumları silebilir
create policy "comments_select" on shared_workout_comments
  for select using (true);

create policy "comments_insert" on shared_workout_comments
  for insert with check (auth.uid() = user_id);

create policy "comments_update" on shared_workout_comments
  for update using (auth.uid() = user_id);

create policy "comments_delete" on shared_workout_comments
  for delete using (
    auth.uid() = user_id
    or exists (
      select 1 from shared_workouts sw
      where sw.id = shared_workout_comments.post_id
      and sw.user_id = auth.uid()
    )
  );

-- comment_likes: herkes okuyabilir (beğeni sayısı için),
-- sadece giriş yapmış kullanıcı kendi beğenisini ekleyebilir/silebilir
create policy "comment_likes_select" on comment_likes
  for select using (true);

create policy "comment_likes_insert" on comment_likes
  for insert with check (auth.uid() = user_id);

create policy "comment_likes_delete" on comment_likes
  for delete using (auth.uid() = user_id);

-- Düzenleme izi için updated_at otomatik güncelleme
create trigger shared_workout_comments_updated_at
  before update on shared_workout_comments
  for each row execute function update_updated_at();

-- ============================================================
-- ============================================================
-- MOBILE — app_ namespace (LogWise Mobile MVP)
-- Eklenme: ADIM 2 (rev 15 — 03-mvp-decisions.md §4.3 + §4.4)
--
-- Bu blok mobil uygulama için yeni tablolar tanımlar.
-- Web tabloları (user_data, profiles, feedback, shared_workouts,
-- user_prs, follows, shared_workout_comments, comment_likes)
-- DOKUNULMAZ. app_ prefix'i namespace çakışmasını önler.
--
-- Sözleşme:
--   - Preset 145 hareket Supabase'e KOPYALANMAZ (bundle'da statik veri).
--     app_exercises sadece KULLANICI CUSTOM egzersizleri için.
--   - exercise_ref POLYMORPHIC text alanı: preset slug ("bench-press")
--     VEYA custom UUID — FK DEĞİL (soft reference, §8.9 rev 13).
--   - RIR enum: 'F' | '-' | '1' | '2' | '3' | '4+'  (§8.8 rev 12 —
--     "F" = Failure; web'deki "0" yerine; UI ile DB tek dil).
--   - Set type enum: 'working' | 'warmup' | 'drop'  (MVP — §8.8 rev 12;
--     'superset' MVP sonrası). superset_group field şemada kalır
--     (yer tutar).
--   - Misafir kullanıcı bu tablolara dokunmaz (sadece AsyncStorage).
--   - Tek aktif program kuralı: app_programs.activated_at not null
--     olan bir kullanıcı için yalnızca bir satır olmalı (uygulama
--     katmanı garantisi — §8.4.1 + §8.9).
-- ============================================================

-- ----------------------------------------------------------------
-- app_profiles — kullanıcı tercihleri + aktif program referansı
-- ----------------------------------------------------------------
create table if not exists app_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text default '',
  avatar text default '',
  locale text default 'tr',
  theme text default 'dark',
  preferences jsonb not null default '{}'::jsonb,
  active_program_id uuid,                       -- FK eklemesi aşağıda (forward ref)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Username normalize benzersizlik (case-insensitive + dış boşluk) — RPC
-- check_app_username_available'in lower(btrim(...)) mantığıyla EŞLEŞİR (trim == btrim).
-- 'Ali'/'ali'/'ALI '/' ali' aynı kabul edilir; partial WHERE ile NULL'a izin verilir.
-- (Web `profiles` tablosundaki profiles_username_lower_idx precedent'inin daha katı mobil sürümü.)
-- Mevcut inline `username text unique` (app_profiles_username_key) kasıten korunur.
-- Migration: supabase/migrations/20260629120000_app_username_normalized_unique.sql
create unique index if not exists app_profiles_username_normalized_key
  on app_profiles (lower(btrim(username)))
  where username is not null;

-- ----------------------------------------------------------------
-- app_exercises — SADECE kullanıcı custom egzersizleri
-- (preset hareketler bundle'da; bu tabloya kopyalanmaz)
-- ----------------------------------------------------------------
create table if not exists app_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  categories text[] not null default '{}',      -- ["Göğüs","Triceps"]
  notes text default '',
  created_at timestamptz not null default now()
);

create index if not exists app_exercises_user_idx
  on app_exercises(user_id);

-- ----------------------------------------------------------------
-- app_programs — kullanıcı programları (preset'ten kopyalanmış veya custom)
-- ----------------------------------------------------------------
create table if not exists app_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  preset_origin text,                           -- preset'ten kopyalandıysa slug (opsiyonel)
  cycle_type text not null default 'weekly'
    check (cycle_type in ('none','weekly','deload')),
  deload_every int,                             -- cycle_type='deload' iken 3..8
  off_days int[] not null default '{}',         -- 0=Pzt ... 6=Paz (örn. [5,6])
  activated_at timestamptz,                     -- null = pasif, set = aktif (tek aktif kuralı §8.9)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_programs_user_idx
  on app_programs(user_id);
create index if not exists app_programs_user_active_idx
  on app_programs(user_id) where activated_at is not null;

-- app_profiles.active_program_id forward FK (programlar tablosu artık var)
alter table app_profiles
  drop constraint if exists app_profiles_active_program_fk;
alter table app_profiles
  add constraint app_profiles_active_program_fk
  foreign key (active_program_id) references app_programs(id) on delete set null;

-- ----------------------------------------------------------------
-- app_program_days — programın haftalık günlerinin egzersiz dizilimi
-- exercise_ref POLYMORPHIC: slug VEYA UUID (FK DEĞİL — bundle preset'leri DB'de yok)
-- ----------------------------------------------------------------
create table if not exists app_program_days (
  program_id uuid not null references app_programs(id) on delete cascade,
  day_index int not null check (day_index between 0 and 6),  -- 0=Pzt ... 6=Paz
  position int not null check (position >= 0),               -- gün içindeki sıra
  exercise_ref text not null,                                -- POLYMORPHIC: slug | uuid
  primary key (program_id, day_index, position)
);

create index if not exists app_program_days_program_idx
  on app_program_days(program_id);

-- ----------------------------------------------------------------
-- app_workouts — bir günde bir egzersiz için yapılan antrenman başlığı
-- exercise_ref POLYMORPHIC + UNIQUE (user_id, workout_date, exercise_ref)
-- superset_group MVP'de YAZILMAZ (§8.8 rev 12 — yer tutar)
-- ----------------------------------------------------------------
create table if not exists app_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null,                  -- YYYY-MM-DD (local günle eşleştirme app katmanında)
  exercise_ref text not null,                  -- POLYMORPHIC: slug | uuid (soft ref §8.9)
  position int not null default 0,             -- gün içindeki sıra
  superset_group int,                          -- MVP'de yazılmaz; gelecek için (§8.8)
  duration_minutes int,                        -- MVP'de yazılmaz; gelecek için
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, workout_date, exercise_ref)
);

create index if not exists app_workouts_user_date_idx
  on app_workouts(user_id, workout_date);
create index if not exists app_workouts_user_ref_idx
  on app_workouts(user_id, exercise_ref);

-- ----------------------------------------------------------------
-- app_sets — en yoğun yazılan tablo
-- set_type: 'working' | 'warmup' | 'drop'  (superset MVP'de YOK — §8.8 rev 12)
-- rir: 'F' | '-' | '1' | '2' | '3' | '4+'  ("F" = Failure; UI+DB tek dil — §8.8 rev 12)
-- ----------------------------------------------------------------
create table if not exists app_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references app_workouts(id) on delete cascade,
  set_index int not null check (set_index >= 0),
  set_type text not null default 'working'
    check (set_type in ('working','warmup','drop')),
  weight numeric,
  reps int,
  rir text check (rir in ('F','-','1','2','3','4+')),
  created_at timestamptz not null default now()
);

create index if not exists app_sets_workout_idx
  on app_sets(workout_id);

-- ----------------------------------------------------------------
-- app_day_meta — gün-bazlı meta (not, süre, "sadece bugün skip" listesi)
-- skipped_exercise_ids: slug VEYA uuid string'leri (§4.3 + §8.8)
-- ----------------------------------------------------------------
create table if not exists app_day_meta (
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null,
  day_note text default '',
  total_duration_minutes int,                  -- MVP'de yazılmaz
  skipped_exercise_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, workout_date)
);

-- ============================================================
-- Mobile — Row Level Security
-- Her tabloda RLS aktif; her satır user_id'siyle eşleşmeli.
-- Policy: auth.uid() = user_id  (her kullanıcı sadece kendi verisi)
-- ============================================================

alter table app_profiles      enable row level security;
alter table app_exercises     enable row level security;
alter table app_programs      enable row level security;
alter table app_program_days  enable row level security;
alter table app_workouts      enable row level security;
alter table app_sets          enable row level security;
alter table app_day_meta      enable row level security;

-- app_profiles
create policy "app_profiles_select" on app_profiles
  for select using (auth.uid() = user_id);
create policy "app_profiles_insert" on app_profiles
  for insert with check (auth.uid() = user_id);
create policy "app_profiles_update" on app_profiles
  for update using (auth.uid() = user_id);
create policy "app_profiles_delete" on app_profiles
  for delete using (auth.uid() = user_id);

-- app_exercises
create policy "app_exercises_select" on app_exercises
  for select using (auth.uid() = user_id);
create policy "app_exercises_insert" on app_exercises
  for insert with check (auth.uid() = user_id);
create policy "app_exercises_update" on app_exercises
  for update using (auth.uid() = user_id);
create policy "app_exercises_delete" on app_exercises
  for delete using (auth.uid() = user_id);

-- app_programs
create policy "app_programs_select" on app_programs
  for select using (auth.uid() = user_id);
create policy "app_programs_insert" on app_programs
  for insert with check (auth.uid() = user_id);
create policy "app_programs_update" on app_programs
  for update using (auth.uid() = user_id);
create policy "app_programs_delete" on app_programs
  for delete using (auth.uid() = user_id);

-- app_program_days — user_id yok; sahiplik program_id üzerinden çözülür
create policy "app_program_days_select" on app_program_days
  for select using (
    exists (
      select 1 from app_programs p
      where p.id = app_program_days.program_id
      and p.user_id = auth.uid()
    )
  );
create policy "app_program_days_insert" on app_program_days
  for insert with check (
    exists (
      select 1 from app_programs p
      where p.id = app_program_days.program_id
      and p.user_id = auth.uid()
    )
  );
create policy "app_program_days_update" on app_program_days
  for update using (
    exists (
      select 1 from app_programs p
      where p.id = app_program_days.program_id
      and p.user_id = auth.uid()
    )
  );
create policy "app_program_days_delete" on app_program_days
  for delete using (
    exists (
      select 1 from app_programs p
      where p.id = app_program_days.program_id
      and p.user_id = auth.uid()
    )
  );

-- app_workouts
create policy "app_workouts_select" on app_workouts
  for select using (auth.uid() = user_id);
create policy "app_workouts_insert" on app_workouts
  for insert with check (auth.uid() = user_id);
create policy "app_workouts_update" on app_workouts
  for update using (auth.uid() = user_id);
create policy "app_workouts_delete" on app_workouts
  for delete using (auth.uid() = user_id);

-- app_sets — user_id yok; sahiplik workout_id üzerinden çözülür
create policy "app_sets_select" on app_sets
  for select using (
    exists (
      select 1 from app_workouts w
      where w.id = app_sets.workout_id
      and w.user_id = auth.uid()
    )
  );
create policy "app_sets_insert" on app_sets
  for insert with check (
    exists (
      select 1 from app_workouts w
      where w.id = app_sets.workout_id
      and w.user_id = auth.uid()
    )
  );
create policy "app_sets_update" on app_sets
  for update using (
    exists (
      select 1 from app_workouts w
      where w.id = app_sets.workout_id
      and w.user_id = auth.uid()
    )
  );
create policy "app_sets_delete" on app_sets
  for delete using (
    exists (
      select 1 from app_workouts w
      where w.id = app_sets.workout_id
      and w.user_id = auth.uid()
    )
  );

-- app_day_meta
create policy "app_day_meta_select" on app_day_meta
  for select using (auth.uid() = user_id);
create policy "app_day_meta_insert" on app_day_meta
  for insert with check (auth.uid() = user_id);
create policy "app_day_meta_update" on app_day_meta
  for update using (auth.uid() = user_id);
create policy "app_day_meta_delete" on app_day_meta
  for delete using (auth.uid() = user_id);

-- ============================================================
-- Mobile — updated_at triggers
-- (web'in update_updated_at() fonksiyonu yukarıda zaten tanımlı)
-- ============================================================

drop trigger if exists app_profiles_updated_at on app_profiles;
create trigger app_profiles_updated_at
  before update on app_profiles
  for each row execute function update_updated_at();

drop trigger if exists app_programs_updated_at on app_programs;
create trigger app_programs_updated_at
  before update on app_programs
  for each row execute function update_updated_at();

drop trigger if exists app_workouts_updated_at on app_workouts;
create trigger app_workouts_updated_at
  before update on app_workouts
  for each row execute function update_updated_at();

drop trigger if exists app_day_meta_updated_at on app_day_meta;
create trigger app_day_meta_updated_at
  before update on app_day_meta
  for each row execute function update_updated_at();

-- ============================================================
-- Mobile — check_app_username_available RPC
-- (app_profiles tablosuna başvurur → bu tablo tanımından SONRA gelmeli)
-- Kayıt sırasında istemci ön-kontrolü (RLS-safe): app_profiles "own only" olduğundan
-- istemci başkalarının username'ini doğrudan göremez. RPC SECURITY DEFINER ile boolean döner.
-- Gövde, app_profiles_username_normalized_key index'iyle birebir aynı normalize mantığı kullanır
-- (lower(btrim(...)); null/boş -> false). Migration:
-- supabase/migrations/20260629120000_app_username_normalized_unique.sql
-- ============================================================
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

revoke all
  on function public.check_app_username_available(text)
  from public;
grant execute
  on function public.check_app_username_available(text)
  to anon, authenticated, service_role;

-- ============================================================
-- Mobile — Sonu (ADIM 2)
-- Sonraki migration buranın altına eklenir.
-- ============================================================

-- Private habit calendar — snapshot addition (2026-10-18)
-- Private habit calendar for the verified @itisci account.
-- Apply with an administrator connection / Supabase SQL Editor; never from the browser client.
-- Identity was verified via the public profiles API on 2026-10-18.
begin;

create table public.private_habit_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  singleton boolean not null default true unique check (singleton)
);
create table public.private_habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index private_habits_user_created on public.private_habits (user_id, created_at, id);
create table public.private_habit_days (
  habit_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_on date not null check (completed_on <= (now() at time zone 'Europe/Istanbul')::date),
  primary key (habit_id, completed_on),
  foreign key (habit_id, user_id) references public.private_habits(id, user_id) on delete cascade
);
create index private_habit_days_user on public.private_habit_days (user_id);

alter table public.private_habit_access enable row level security;
alter table public.private_habits enable row level security;
alter table public.private_habit_days enable row level security;

revoke all on public.private_habit_access, public.private_habits, public.private_habit_days
  from public, anon, authenticated;
grant select on public.private_habit_access to authenticated;
grant select, insert, update, delete on public.private_habits, public.private_habit_days to authenticated;
grant all on public.private_habit_access, public.private_habits, public.private_habit_days to service_role;

create policy private_habit_access_self on public.private_habit_access
  for select to authenticated using (user_id = (select auth.uid()));
create policy private_habits_owner on public.private_habits
  for all to authenticated
  using (user_id = (select auth.uid()) and exists (
    select 1 from public.private_habit_access a where a.user_id = (select auth.uid())
  ))
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.private_habit_access a where a.user_id = (select auth.uid())
  ));
create policy private_habit_days_owner on public.private_habit_days
  for all to authenticated
  using (user_id = (select auth.uid()) and exists (
    select 1 from public.private_habit_access a where a.user_id = (select auth.uid())
  ))
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.private_habit_access a where a.user_id = (select auth.uid())
  ));

-- One immutable account binding; clients have no INSERT/UPDATE/DELETE access to this table.
insert into public.private_habit_access (user_id) values ('ba569072-755d-4e68-b470-d78bacbdf0c6');

commit;
