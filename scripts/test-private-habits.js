// Isolated PostgreSQL tests; no production connection, credentials or records.
// npm install --prefix <temporary-directory> --no-save @electric-sql/pglite
// node scripts/test-private-habits.js <temporary-directory>/node_modules/@electric-sql/pglite
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require(process.argv[2] || '@electric-sql/pglite');
const owner = 'ba569072-755d-4e68-b470-d78bacbdf0c6';
const other = '00000000-0000-4000-8000-000000000002';
async function main() {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users (id uuid primary key);
      insert into auth.users values ('${owner}'), ('${other}');
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema public, auth to anon, authenticated, service_role;
      grant execute on function auth.uid() to anon, authenticated, service_role;
    `);
    await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations/20261018120000_private_habits.sql'), 'utf8'));
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
    const auth = (sql, params) => as('authenticated', owner, sql, params);
    const denied = async (role, id, sql, params) => {
      await assert.rejects(as(role, id, sql, params), error => error.code === '42501');
    };
    assert.equal((await auth('select * from private_habit_access')).length, 1);
    const [habit] = await auth('insert into private_habits (user_id,name) values ($1,$2) returning id', [owner, 'Read']);
    const [second] = await auth('insert into private_habits (user_id,name) values ($1,$2) returning id', [owner, 'Walk']);
    await auth('update private_habits set name=$1 where id=$2', ['Read daily', habit.id]);
    const day = (await db.query("select (now() at time zone 'Europe/Istanbul')::date::text as day")).rows[0].day;
    await auth('insert into private_habit_days (habit_id,user_id,completed_on) values ($1,$2,$3)', [habit.id, owner, day]);
    await auth('insert into private_habit_days (habit_id,user_id,completed_on) values ($1,$2,$3) on conflict (habit_id,completed_on) do update set completed_on=excluded.completed_on', [habit.id, owner, day]);
    assert.equal((await auth('select * from private_habit_days')).length, 1);
    assert.equal((await auth('select * from private_habit_days where habit_id=$1', [second.id])).length, 0);
    await assert.rejects(auth("insert into private_habit_days values ($1,$2,((now() at time zone 'Europe/Istanbul')::date + 1))", [habit.id, owner]), e => e.code === '23514');
    await assert.rejects(auth('insert into private_habits (user_id,name) values ($1,$2)', [owner, '  ']), e => e.code === '23514');

    for (const table of ['private_habit_access', 'private_habits', 'private_habit_days']) {
      await denied('anon', '', `select * from ${table}`);
      assert.equal((await as('authenticated', other, `select * from ${table}`)).length, 0);
    }
    await denied('authenticated', other, 'insert into private_habits (user_id,name) values ($1,$2)', [other, 'Unauthorized']);
    await denied('authenticated', other, 'insert into private_habits (user_id,name) values ($1,$2)', [owner, 'Spoof']);
    await denied('authenticated', other, 'insert into private_habit_days values ($1,$2,$3)', [habit.id, owner, day]);
    await denied('authenticated', owner, 'update private_habit_access set user_id=$1', [other]);
    await denied('authenticated', other, 'insert into private_habit_access (user_id) values ($1)', [other]);
    assert.equal((await as('authenticated', other, 'delete from private_habits returning id')).length, 0);
    assert.equal((await as('authenticated', other, "update private_habits set name='Hacked' returning id")).length, 0);
    assert.equal((await auth('select name from private_habits where id=$1', [habit.id]))[0].name, 'Read daily');
    // Even an allowlisted account cannot reassign ownership.
    await denied('authenticated', owner, 'update private_habits set user_id=$1 where id=$2', [other, habit.id]);
    await denied('authenticated', owner, 'insert into private_habit_days values ($1,$2,$3)', [second.id, other, day]);
    await auth('delete from private_habits where id=$1', [habit.id]);
    assert.equal((await auth('select * from private_habit_days')).length, 0);
    // Removing access takes effect on existing records, not just new inserts.
    await db.query('delete from private_habit_access where user_id=$1', [owner]);
    assert.equal((await auth('select * from private_habits')).length, 0);
    await denied('authenticated', owner, 'insert into private_habits (user_id,name) values ($1,$2)', [owner, 'Revoked']);
    console.log('Private habit PostgreSQL checks passed: owner CRUD, isolation, anon/other denial, spoof prevention, immutable access, date constraints, cascade and revocation.');
  } finally { await db.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
