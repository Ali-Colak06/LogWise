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
