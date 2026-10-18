// LogWise — Habit controls inside the existing App calendar. Database permissions are enforced by RLS.
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

  function HabitTracker({ user, L, onSnapshot }) {
    const U = window.LOGWISE_HABIT_UTILS;
    const DB = window.LOGWISE_HABITS_DB;
    const [today, setToday] = React.useState(U.todayKey);
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
        if (dialog === 'add') { setHabits(items => [...items, result]); setSelected(result.id); }
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
    // Publish the selected habit to the existing App month grid and sidebar mini calendar.
    // Layout effect prevents a previous habit's marks from appearing for a frame after selection.
    React.useLayoutEffect(() => {
      onSnapshot({ userId: user.id, ready, busy, days, today, toggle });
    }, [user.id, ready, busy, days, today, selected, onSnapshot]);
    React.useEffect(() => () => onSnapshot(null), [onSnapshot]);
    return React.createElement('section', { className: 'habit-controls', 'aria-label': L.title, 'aria-busy': loading || daysLoading || busy },
      React.createElement('div', { className: 'habit-toolbar' },
        habits.length ? React.createElement(React.Fragment, null,
          React.createElement('label', { htmlFor: 'habit-select', className: 'sr-only' }, L.choose),
          React.createElement('select', { id: 'habit-select', value: selected, disabled: busy || loading,
            onChange: event => { setDaysLoading(true); setSelected(event.target.value); setNotice(''); }
          }, habits.map(item => React.createElement('option', { key: item.id, value: item.id }, item.name)))) :
          React.createElement('span', { className: 'habit-toolbar-title' }, L.title),
        React.createElement('div', { className: 'habit-toolbar-actions' },
          button('+ ' + L.add, () => openDialog('add'), 'habit-primary', busy || loading || loadFailed),
          habit && button(L.edit, () => openDialog('edit')),
          habit && React.cloneElement(button('×', () => openDialog('delete'), 'habit-icon-delete'), { 'aria-label': L.delete, title: L.delete }))),
      loading ? React.createElement('p', { className: 'habit-inline-state', role: 'status' }, L.loading) :
        loadFailed ? React.createElement('div', { className: 'habit-inline-state', role: 'alert' }, L.loadError,
          button(L.retry, () => setRevision(value => value + 1))) :
        !habits.length ? React.createElement('p', { className: 'habit-inline-state' }, L.emptyText) :
          React.createElement('div', { className: 'habit-summary' },
            [[L.current, stats.current], [L.thisMonth, stats.thisMonth], [L.longest, stats.longest]].map(([label, value]) =>
              React.createElement('div', { key: label, className: 'habit-summary-item' },
                React.createElement('span', null, label), React.createElement('strong', null, ready ? value : '—'),
                React.createElement('span', null, L.dayUnit))),
            React.createElement('p', { className: 'habit-summary-hint' }, ready && (done.has(today) ? L.currentDoneHint : stats.current ? L.currentHint : L.startHint))),
      daysFailed && React.createElement('div', { className: 'habit-inline-state', role: 'alert' }, L.loadError,
        button(L.retry, () => setRevision(value => value + 1))),
      error && !dialog && React.createElement('p', { className: 'habit-error', role: 'alert' }, error),
      React.createElement('div', { className: 'habit-notice', role: 'status', 'aria-live': 'polite' }, notice),
      dialog && React.createElement(HabitDialog, { mode: dialog, habit, L, busy, error,
        onClose: () => { setDialog(null); setError(''); }, onSave: saveHabit }));
  }
  window.LOGWISE_COMPONENTS = window.LOGWISE_COMPONENTS || {};
  window.LOGWISE_COMPONENTS.HabitTracker = HabitTracker;
})();
