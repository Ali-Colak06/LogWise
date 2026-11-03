// Isolated PostgreSQL test for Faz 4 / F6; no production connection, credentials or records.
// npm install --prefix <temporary-directory> --no-save @electric-sql/pglite
// node scripts/test-private-profile-rls.js <temporary-directory>/node_modules/@electric-sql/pglite
//
// Kurulum, supabase_setup.sql'deki profiles / shared_workouts / user_prs tablolarını ve
// ESKİ (herkese açık) SELECT politikalarını kurar, sonra migration'ı uygular ve sonucu doğrular.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require(process.argv[2] || '@electric-sql/pglite');

const pub = '00000000-0000-4000-8000-000000000001';
const priv = '00000000-0000-4000-8000-000000000002';
const viewer = '00000000-0000-4000-8000-000000000003';

async function main() {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create table auth.users (id uuid primary key);
      insert into auth.users values ('${pub}'), ('${priv}'), ('${viewer}');
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema public, auth to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;

      create table profiles (
        user_id uuid references auth.users(id) on delete cascade primary key,
        username text unique, is_public boolean default true
      );
      create table shared_workouts (
        id text primary key, user_id uuid references auth.users(id) on delete cascade,
        workout_date text not null, workout_data jsonb not null default '[]',
        exercise_names jsonb default '[]', caption text default '', created_at timestamptz default now()
      );
      create table user_prs (
        user_id uuid references auth.users(id) on delete cascade, exercise_name text not null,
        max_weight numeric default 0, max_reps int default 0, estimated_1rm numeric default 0,
        updated_at timestamptz default now(), primary key (user_id, exercise_name)
      );
      alter table profiles enable row level security;
      alter table shared_workouts enable row level security;
      alter table user_prs enable row level security;
      create policy "profiles_select_public" on profiles for select using (is_public = true or auth.uid() = user_id);
      create policy "shared_workouts_select" on shared_workouts for select using (true);
      create policy "user_prs_select" on user_prs for select using (true);
      grant select on profiles, shared_workouts, user_prs to anon, authenticated;

      insert into profiles values ('${pub}', 'pub', true), ('${priv}', 'priv', false);
      insert into user_prs (user_id, exercise_name, max_weight) values ('${pub}', 'Bench', 80), ('${priv}', 'Bench', 90), ('${viewer}', 'Bench', 70);
      insert into shared_workouts (id, user_id, workout_date) values ('p1', '${pub}', '2026-11-01'), ('s1', '${priv}', '2026-11-02');
    `);
    async function as(role, id, sql, params = []) {
      await db.exec('begin');
      try {
        await db.exec('set local role ' + role);
        await db.query("select set_config('request.jwt.claim.sub', $1, true)", [id || '']);
        const result = await db.query(sql, params);
        await db.exec('commit');
        return result.rows;
      } catch (error) { await db.exec('rollback'); throw error; }
    }
    // Önce: gizli profilin PR'ı ve paylaşımı herkese açık (açığın kanıtı)
    assert.equal((await as('anon', null, 'select * from user_prs')).length, 3);
    assert.equal((await as('anon', null, 'select * from shared_workouts')).length, 2);

    const mig = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20261103120000_private_profile_prs_shares.sql'), 'utf8');
    await db.exec(mig);
    await db.exec(mig); // idempotent

    const prs = async (role, id) => (await as(role, id, 'select user_id from user_prs order by user_id')).map(r => r.user_id);
    assert.deepEqual(await prs('anon', null), [pub]);
    assert.deepEqual(await prs('authenticated', viewer), [pub, viewer]); // profil satırı olmayan kendi satırını görür
    assert.deepEqual(await prs('authenticated', priv), [pub, priv]);     // gizli profil kendi PR'ını görür

    const shares = async (role, id) => (await as(role, id, 'select id from shared_workouts order by id')).map(r => r.id);
    assert.deepEqual(await shares('anon', null), ['p1']);
    assert.deepEqual(await shares('authenticated', viewer), ['p1']);
    assert.deepEqual(await shares('authenticated', priv), ['p1', 's1']);
    // Bağlantıyla tek paylaşım: gizli profilinki de açılır, liste dönmez
    assert.deepEqual((await as('anon', null, "select id from get_shared_workout('s1')")).map(r => r.id), ['s1']);
    assert.equal((await as('anon', null, "select id from get_shared_workout('nope')")).length, 0);
    // Profil herkese açık yapılınca görünür olur
    await db.exec(`update profiles set is_public = true where user_id = '${priv}'`);
    assert.deepEqual(await prs('anon', null), [pub, priv]);
    console.log('private profile RLS tests passed');
  } finally {
    await db.close();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
