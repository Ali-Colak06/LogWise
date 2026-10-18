// LogWise — Private habits. All permissions are enforced independently by PostgreSQL RLS.
(function () {
  async function unwrap(query) {
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
  async function hasAccess(userId) {
    const row = await unwrap(window.LOGWISE_DB.sb.from('private_habit_access')
      .select('user_id').eq('user_id', userId).maybeSingle());
    return !!row;
  }
  function list(userId) {
    return unwrap(window.LOGWISE_DB.sb.from('private_habits').select('id,name,created_at')
      .eq('user_id', userId).order('created_at').order('id'));
  }
  function create(userId, name) {
    return unwrap(window.LOGWISE_DB.sb.from('private_habits')
      .insert({ user_id: userId, name: name.trim() }).select('id,name,created_at').single());
  }
  function rename(userId, id, name) {
    return unwrap(window.LOGWISE_DB.sb.from('private_habits').update({ name: name.trim() })
      .eq('user_id', userId).eq('id', id).select('id,name,created_at').single());
  }
  function remove(userId, id) {
    return unwrap(window.LOGWISE_DB.sb.from('private_habits').delete()
      .eq('user_id', userId).eq('id', id).select('id').single());
  }
  async function days(userId, habitId) {
    // PostgREST caps a single response: page the complete history for all-time records.
    const result = [];
    for (let start = 0; ; start += 500) {
      const page = await unwrap(window.LOGWISE_DB.sb.from('private_habit_days').select('completed_on')
        .eq('user_id', userId).eq('habit_id', habitId).order('completed_on').range(start, start + 499));
      result.push(...page.map(row => row.completed_on));
      if (page.length < 500) return result;
    }
  }
  async function setDay(userId, habitId, day, completed) {
    const table = window.LOGWISE_DB.sb.from('private_habit_days');
    if (completed) {
      await unwrap(table.upsert({ user_id: userId, habit_id: habitId, completed_on: day },
        { onConflict: 'habit_id,completed_on' }).select('completed_on').single());
    } else {
      await unwrap(table.delete().eq('user_id', userId).eq('habit_id', habitId)
        .eq('completed_on', day));
    }
  }
  window.LOGWISE_HABITS_DB = { hasAccess, list, create, rename, remove, days, setDay };
})();
