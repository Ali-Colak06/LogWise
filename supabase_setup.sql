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
create policy "user_data_select" on user_data
  for select using (auth.uid() = user_id);

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

-- user_data: profili public VE show_profile_info=true olan kullanıcıların verisini herkes okuyabilir
create policy "user_data_select_public" on user_data
  for select using (
    exists (
      select 1 from profiles
      where profiles.user_id = user_data.user_id
      and profiles.is_public = true
      and profiles.show_profile_info = true
    )
  );

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
