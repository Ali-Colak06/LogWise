// LogWise — Private habit calendar. Auth gate and database authorization are independent.
(function () {
  function HabitDialog({ mode, habit, L, busy, error, onClose, onSave }) {
    const dialogRef = React.useRef(null);
    const [name, setName] = React.useState(mode === 'edit' ? habit.name : '');
    const [invalid, setInvalid] = React.useState(false);
    React.useEffect(() => {
      const dialog = dialogRef.current;
      const previous = document.activeElement;
      dialog.showModal();
      return () => { dialog.close(); if (previous?.isConnected) previous.focus(); };
    }, []);
    const deleting = mode === 'delete';
    return React.createElement('dialog', {
      ref: dialogRef, className: 'habit-dialog', 'aria-labelledby': 'habit-dialog-title',
      onCancel: event => { event.preventDefault(); if (!busy) onClose(); }
    }, React.createElement('form', {
      onSubmit: event => {
        event.preventDefault();
        if (!deleting && (!name.trim() || name.trim().length > 80)) { setInvalid(true); return; }
        onSave(name.trim());
      }
    }, React.createElement('span', { className: 'habit-kicker' }, L.privateLabel),
    React.createElement('h2', { id: 'habit-dialog-title' }, deleting ? L.deleteTitle : mode === 'edit' ? L.editTitle : L.addTitle),
    deleting ? React.createElement('p', null, L.deleteText.replace('{name}', habit.name)) :
      React.createElement('label', { className: 'habit-field' }, L.name,
        React.createElement('input', {
          value: name, onChange: event => { setName(event.target.value); setInvalid(false); },
          placeholder: L.placeholder, maxLength: 80, required: true, autoFocus: true,
          disabled: busy, 'aria-invalid': invalid, 'aria-describedby': invalid ? 'habit-name-error' : undefined
        })),
    invalid && React.createElement('p', { id: 'habit-name-error', role: 'alert', className: 'habit-error' }, L.nameError),
    error && React.createElement('p', { role: 'alert', className: 'habit-error' }, error),
    React.createElement('div', { className: 'habit-dialog-actions' },
      React.createElement('button', { type: 'button', className: 'habit-button', disabled: busy, autoFocus: deleting, onClick: onClose }, L.cancel),
      React.createElement('button', { type: 'submit', className: 'habit-button ' + (deleting ? 'habit-danger' : 'habit-primary'), disabled: busy },
        busy ? L.loading : deleting ? L.delete : L.save))));
  }

  function HabitCalendar({ user, lang, L }) {
    const U = window.LOGWISE_HABIT_UTILS;
    const DB = window.LOGWISE_HABITS_DB;
    const [today, setToday] = React.useState(U.todayKey);
    const [month, setMonth] = React.useState(() => U.todayKey().slice(0, 7));
    const [habits, setHabits] = React.useState([]);
    const [selected, setSelected] = React.useState('');
    const [days, setDays] = React.useState([]);
    const [daysHabitId, setDaysHabitId] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [daysLoading, setDaysLoading] = React.useState(true);
    const [loadFailed, setLoadFailed] = React.useState(false);
    const [daysFailed, setDaysFailed] = React.useState(false);
    const [revision, setRevision] = React.useState(0);
    const [busy, setBusy] = React.useState(false);
    const lock = React.useRef(false);
    const alive = React.useRef(true);
    const [error, setError] = React.useState('');
    const [notice, setNotice] = React.useState('');
    const [dialog, setDialog] = React.useState(null);
    const habit = habits.find(item => item.id === selected);
    const done = new Set(days);
    const stats = U.statistics(days, today);
    const locale = lang === 'tr' ? 'tr-TR' : 'en-GB';
    const monthTitle = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(month + '-01T12:00:00Z'));
    React.useEffect(() => {
      alive.current = true;
      const refresh = () => {
        setToday(U.todayKey());
        if (!lock.current && document.visibilityState === 'visible') setRevision(value => value + 1);
      };
      const timer = setInterval(() => setToday(U.todayKey()), 30000);
      window.addEventListener('focus', refresh);
      document.addEventListener('visibilitychange', refresh);
      return () => {
        alive.current = false; clearInterval(timer);
        window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh);
      };
    }, []);
    React.useEffect(() => {
      let active = true;
      setLoading(true); setLoadFailed(false);
      DB.list(user.id).then(rows => {
        if (!active) return;
        setHabits(rows);
        setSelected(id => rows.some(row => row.id === id) ? id : rows[0]?.id || '');
      }).catch(() => { if (active) setLoadFailed(true); })
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, [user.id, revision]);
    React.useEffect(() => {
      let active = true;
      setDays([]); setDaysLoading(true); setDaysFailed(false); setError('');
      if (!selected) { setDaysLoading(false); return; }
      DB.days(user.id, selected).then(rows => { if (active) { setDays(rows); setDaysHabitId(selected); } })
        .catch(() => { if (active) setDaysFailed(true); })
        .finally(() => { if (active) setDaysLoading(false); });
      return () => { active = false; };
    }, [user.id, selected, revision]);
    React.useEffect(() => {
      if (!notice) return;
      const timer = setTimeout(() => setNotice(''), 4000);
      return () => clearTimeout(timer);
    }, [notice]);

    async function mutate(action, success) {
      if (lock.current) return;
      lock.current = true; setBusy(true); setError(''); setNotice('');
      try { await action(); if (alive.current) success(); }
      catch (_) { if (alive.current) setError(L.saveError); }
      finally { lock.current = false; if (alive.current) setBusy(false); }
    }
    function toggle(day) {
      if (lock.current || !ready || !habit || day > U.todayKey()) return;
      const wasDone = done.has(day);
      mutate(() => DB.setDay(user.id, selected, day, !wasDone), () => {
        setDays(previous => wasDone ? previous.filter(value => value !== day) : [...previous, day]);
        setNotice(wasDone ? L.removed : L.saved);
      });
    }
    function saveHabit(name) {
      const action = dialog === 'add' ? () => DB.create(user.id, name) : dialog === 'edit' ?
        () => DB.rename(user.id, selected, name) : () => DB.remove(user.id, selected);
      let result;
      mutate(async () => { result = await action(); }, () => {
        if (dialog === 'add') { setHabits(items => [...items, result]); setSelected(result.id); setMonth(today.slice(0, 7)); }
        if (dialog === 'edit') setHabits(items => items.map(item => item.id === selected ? result : item));
        if (dialog === 'delete') {
          const remaining = habits.filter(item => item.id !== selected);
          setHabits(remaining); setSelected(remaining[0]?.id || '');
        }
        setNotice(dialog === 'add' ? L.created : dialog === 'edit' ? L.renamed : L.deleted);
        setDialog(null);
      });
    }
    const button = (text, onClick, className = '', disabled = busy) => React.createElement('button', {
      type: 'button', className: 'habit-button ' + className, onClick, disabled
    }, text);
    const openDialog = mode => { setError(''); setDialog(mode); };
    const ready = !loading && !daysLoading && !daysFailed && daysHabitId === selected;
    return React.createElement(React.Fragment, null,
      React.createElement('section', { className: 'habit-intro' },
        React.createElement('div', null, React.createElement('span', { className: 'habit-kicker' }, L.privateLabel),
          React.createElement('h1', null, L.heading, React.createElement('br'), React.createElement('span', null, L.headingAccent)),
          React.createElement('p', null, L.intro)),
        button('+ ' + L.add, () => openDialog('add'), 'habit-primary', busy || loading || loadFailed)),
      loading ? React.createElement('p', { className: 'habit-state', role: 'status' }, L.loading) :
        loadFailed ? React.createElement('div', { className: 'habit-state', role: 'alert' }, L.loadError,
          button(L.retry, () => setRevision(value => value + 1))) :
        !habits.length ? React.createElement('section', { className: 'habit-empty' },
          React.createElement('div', { className: 'habit-empty-mark', 'aria-hidden': true }, '✓'),
          React.createElement('h2', null, L.emptyTitle), React.createElement('p', null, L.emptyText),
          button('+ ' + L.add, () => openDialog('add'), 'habit-primary')) :
          React.createElement(React.Fragment, null,
            React.createElement('section', { className: 'habit-selection' },
              React.createElement('div', { className: 'habit-selection-main' },
                React.createElement('label', { htmlFor: 'habit-select', className: 'sr-only' }, L.choose),
                React.createElement('select', { id: 'habit-select', value: selected, disabled: busy,
                  onChange: event => { setDaysLoading(true); setSelected(event.target.value); setNotice(''); }
                }, habits.map(item => React.createElement('option', { key: item.id, value: item.id }, item.name))),
                React.createElement('p', null, L.daily)),
              React.createElement('div', { className: 'habit-selection-actions' },
                button(L.edit, () => openDialog('edit')), React.cloneElement(button('×', () => openDialog('delete'), 'habit-icon-delete'), { 'aria-label': L.delete, title: L.delete }))),
            React.createElement('section', { className: 'habit-stats', 'aria-label': L.title },
              [[L.current, stats.current, ready && done.has(today) ? L.currentDoneHint : stats.current ? L.currentHint : L.startHint],
                [L.thisMonth, stats.thisMonth, L.monthHint], [L.longest, stats.longest, L.longestHint]]
                .map(([label, value, hint], index) => React.createElement('article', { key: label, className: 'habit-stat' + (!index ? ' habit-stat-gold' : '') },
                  React.createElement('h2', null, label), React.createElement('div', { className: 'habit-stat-value' }, ready ? value : '—',
                    React.createElement('span', null, L.dayUnit)), React.createElement('p', null, hint)))),
            React.createElement('section', { className: 'habit-calendar', 'aria-label': L.title, 'aria-busy': busy || daysLoading },
              React.createElement('div', { className: 'habit-calendar-toolbar' },
                React.createElement('h2', { id: 'habit-month', 'aria-live': 'polite' }, monthTitle),
                React.createElement('div', { className: 'habit-month-actions' },
                  button(L.today, () => setMonth(today.slice(0, 7))),
                  React.createElement('button', { type: 'button', className: 'habit-button habit-arrow', 'aria-label': L.previous,
                    onClick: () => setMonth(U.shiftMonth(month, -1)) }, '‹'),
                  React.createElement('button', { type: 'button', className: 'habit-button habit-arrow', 'aria-label': L.next,
                    onClick: () => setMonth(U.shiftMonth(month, 1)), disabled: month >= today.slice(0, 7) }, '›'))),
              React.createElement('div', { className: 'habit-weekdays', 'aria-hidden': true },
                Array.from({ length: 7 }, (_, index) => React.createElement('div', { key: index },
                  new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 0, 5 + index)))))),
              React.createElement('div', { className: 'habit-days', 'aria-labelledby': 'habit-month' },
                U.monthCells(month).map((day, index) => {
                  if (!day) return React.createElement('div', { key: 'empty-' + index, className: 'habit-day habit-day-empty', 'aria-hidden': true });
                  const completed = ready && done.has(day), isToday = day === today, future = day > today;
                  const fullDate = new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(day + 'T12:00:00Z'));
                  return React.createElement('button', { key: day, type: 'button',
                    className: 'habit-day' + (completed ? ' is-complete' : '') + (isToday ? ' is-today' : '') + (future ? ' is-future' : ''),
                    disabled: busy || !ready || future, 'aria-pressed': completed, 'aria-current': isToday ? 'date' : undefined,
                    'aria-label': fullDate + ' · ' + (completed ? L.done + ' · ' + L.undo : future ? L.future : L.mark),
                    title: fullDate + ' · ' + (completed ? L.done : future ? L.future : L.notDone), onClick: () => toggle(day)
                  }, React.createElement('span', { className: 'habit-day-number' }, Number(day.slice(8))),
                  completed && React.createElement('span', { className: 'habit-day-check', 'aria-hidden': true }, '✓'),
                  isToday && React.createElement('span', { className: 'habit-day-today' }, L.today));
                })),
              React.createElement('div', { className: 'habit-calendar-footer' },
                React.createElement('span', { className: 'habit-legend' }, React.createElement('i', { 'aria-hidden': true }), L.done),
                React.createElement('p', null, L.calendarHelp)),
              daysLoading && React.createElement('p', { className: 'habit-calendar-status', role: 'status' }, L.loading),
              daysFailed && React.createElement('div', { className: 'habit-calendar-status', role: 'alert' }, L.loadError,
                button(L.retry, () => setRevision(value => value + 1)))),
            ready && React.createElement('p', { className: 'habit-motivation' }, stats.thisMonth ? L.monthMessage.replace('{n}', stats.thisMonth) : L.zeroMessage)),
      error && !dialog && React.createElement('p', { className: 'habit-error', role: 'alert' }, error),
      React.createElement('div', { className: 'habit-notice', role: 'status', 'aria-live': 'polite' }, notice),
      React.createElement('p', { className: 'habit-timezone' }, L.timezone),
      dialog && React.createElement(HabitDialog, { mode: dialog, habit, L, busy, error,
        onClose: () => { setDialog(null); setError(''); }, onSave: saveHabit }));
  }

  function HabitsPage() {
    const [lang, setLang] = React.useState(() => localStorage.getItem('gym-log-lang') === 'en' ? 'en' : 'tr');
    const [theme, setTheme] = React.useState(() => localStorage.getItem('gym-log-theme') === 'light' ? 'light' : 'dark');
    const [user, setUser] = React.useState(null);
    const [sessionReady, setSessionReady] = React.useState(false);
    const [authError, setAuthError] = React.useState(false);
    const [access, setAccess] = React.useState({ userId: null, state: 'checking' });
    const [retry, setRetry] = React.useState(0);
    const L = (lang === 'tr' ? window.LOGWISE_TR : window.LOGWISE_EN).habits;
    React.useEffect(() => {
      document.documentElement.lang = lang;
      document.title = L.title + ' · LogWise';
      localStorage.setItem('gym-log-lang', lang);
    }, [lang]);
    React.useEffect(() => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('gym-log-theme', theme);
    }, [theme]);
    React.useEffect(() => {
      let active = true, authEvent = false;
      const { data: { subscription } } = window.LOGWISE_DB.sb.auth.onAuthStateChange((_event, session) => {
        if (!active) return;
        authEvent = true; setAuthError(false); setUser(session?.user || null); setSessionReady(true);
      });
      window.LOGWISE_DB.sb.auth.getSession().then(({ data, error }) => {
        if (active && !authEvent) { setAuthError(!!error); setUser(data.session?.user || null); setSessionReady(true); }
      }).catch(() => { if (active && !authEvent) { setAuthError(true); setSessionReady(true); } });
      return () => { active = false; subscription.unsubscribe(); };
    }, [retry]);
    React.useEffect(() => {
      let active = true;
      setAccess({ userId: user?.id || null, state: 'checking' });
      if (!user) return;
      window.LOGWISE_HABITS_DB.hasAccess(user.id).then(allowed => { if (active) setAccess({ userId: user.id, state: allowed ? 'allowed' : 'denied' }); })
        .catch(() => { if (active) setAccess({ userId: user.id, state: 'error' }); });
      return () => { active = false; };
    }, [user?.id, retry]);
    const state = !sessionReady ? 'checking' : authError ? 'error' : !user ? 'login' : access.userId === user.id ? access.state : 'checking';
    return React.createElement('div', { className: 'habits-shell' },
      React.createElement('header', { className: 'habit-header' },
        React.createElement('a', { href: window.LOGWISE_DB.appRoute(), className: 'habit-brand', 'aria-label': L.back },
          React.createElement(window.LOGWISE_COMPONENTS.BrandMark, { size: 36, pad: 5, radius: 10 }),
          React.createElement('span', null, 'LOGWISE'), React.createElement('span', { className: 'habit-header-divider', 'aria-hidden': true }, '/'),
          React.createElement('span', { className: 'habit-header-title' }, L.title)),
        React.createElement('div', { className: 'habit-header-actions' },
          React.createElement('button', { className: 'habit-button', type: 'button', 'aria-label': L.language, onClick: () => setLang(lang === 'tr' ? 'en' : 'tr') }, lang === 'tr' ? 'EN' : 'TR'),
          React.createElement('button', { className: 'habit-button', type: 'button', 'aria-label': L.theme, onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark') }, theme === 'dark' ? '☼' : '☾'))),
      React.createElement('main', { className: 'habit-main' }, state === 'allowed' ?
        React.createElement(HabitCalendar, { key: user.id, user, lang, L }) :
        React.createElement('section', { className: 'habit-gate', role: state === 'error' ? 'alert' : 'status' },
          React.createElement('span', { className: 'habit-kicker' }, L.privateLabel),
          React.createElement('h1', null, state === 'checking' ? L.loading : state === 'login' ? L.loginTitle : state === 'denied' ? L.deniedTitle : L.loadError),
          (state === 'login' || state === 'denied') && React.createElement('p', null, state === 'login' ? L.loginText : L.deniedText),
          state === 'error' ? React.createElement('button', { type: 'button', className: 'habit-button habit-primary', onClick: () => setRetry(value => value + 1) }, L.retry) :
            state !== 'checking' && React.createElement('a', { className: 'habit-button habit-primary', href: window.LOGWISE_DB.appRoute() }, state === 'login' ? L.login : L.back))));
  }
  window.LOGWISE_COMPONENTS = window.LOGWISE_COMPONENTS || {};
  window.LOGWISE_COMPONENTS.HabitsPage = HabitsPage;
})();
