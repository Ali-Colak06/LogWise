// LogWise — Day View Prototype
//
// Two phones rendered from the same exercise data:
//   - Idle:   no sets entered yet (all inputs empty, placeholders from last time)
//   - Active: first 2 exercises completed (sets filled, highlighted), the
//             3rd exercise is the one currently in progress (first set filled,
//             rest timer counting down), exercises 4-5 still empty
//
// Set entry mirrors the web app's 6-column grid:
//   # | type | KG | REPS | RIR | × (delete)
// Set types: working (gold), warmup (orange), drop (purple), superset (indigo)
// RIR options: "-", "0" (= F failure), "1", "2", "3", "4+"

(function () {
  "use strict";

  var RIR_OPTIONS = ["-", "F", "1", "2", "3", "4+"];
  var SET_TYPES   = ["working", "warmup", "drop", "superset"];
  var TYPE_LABELS = { working: "Work", warmup: "Warm", drop: "Drop", superset: "SS" };

  // ----------------------------------------------------------------------
  // Pull-day workout — 5 exercises, 20 sets total
  // ----------------------------------------------------------------------
  var EXERCISES = [
    {
      id: "lat-pulldown",
      name: "Lat Pulldown",
      cats: ["back"],
      lastTime: "70 kg × 10",
      planned: [
        { type: "warmup",  weight: 40, reps: 12, rir: "4+" },
        { type: "working", weight: 70, reps: 10, rir: "2"  },
        { type: "working", weight: 72.5, reps: 9, rir: "1" },
        { type: "working", weight: 72.5, reps: 8, rir: "1" }
      ]
    },
    {
      id: "cable-row",
      name: "Cable Row",
      cats: ["back"],
      lastTime: "64 kg × 10",
      planned: [
        { type: "working", weight: 64, reps: 10, rir: "2" },
        { type: "working", weight: 66, reps: 9,  rir: "1" },
        { type: "working", weight: 66, reps: 8,  rir: "1" },
        { type: "drop",    weight: 50, reps: 12, rir: "0" }
      ]
    },
    {
      id: "rear-delt-fly",
      name: "Rear Delt Fly",
      cats: ["shoulder"],
      lastTime: "16 kg × 14",
      planned: [
        { type: "working", weight: 16, reps: 14, rir: "2" },
        { type: "working", weight: 16, reps: 13, rir: "1" },
        { type: "working", weight: 16, reps: 12, rir: "1" }
      ]
    },
    {
      id: "hammer-curl",
      name: "Hammer Curl",
      cats: ["biceps"],
      lastTime: "16 kg × 10",
      planned: [
        { type: "working", weight: 16, reps: 10, rir: "2" },
        { type: "working", weight: 16, reps: 9,  rir: "1" },
        { type: "working", weight: 16, reps: 8,  rir: "1" }
      ]
    },
    {
      id: "cable-crunch",
      name: "Cable Crunch",
      cats: ["core"],
      lastTime: "40 kg × 15",
      planned: [
        { type: "working", weight: 40, reps: 15, rir: "2" },
        { type: "working", weight: 40, reps: 14, rir: "1" },
        { type: "working", weight: 40, reps: 12, rir: "0" }
      ]
    }
  ];

  // ----------------------------------------------------------------------
  // Templates
  // ----------------------------------------------------------------------
  function escapeAttr(s) { return String(s).replace(/"/g, "&quot;"); }

  function renderSetRow(ex, setIdx, set, mode) {
    // mode: "empty" (idle — show placeholders only) or "filled" (active — show value)
    var isFilled = mode === "filled";

    var weightStr = isFilled ? String(set.weight) : "";
    var repsStr   = isFilled ? String(set.reps)   : "";
    var rirStr    = isFilled ? set.rir            : "-";

    // RIR option list
    var rirOptions = "";
    for (var i = 0; i < RIR_OPTIONS.length; i++) {
      var v = RIR_OPTIONS[i];
      var selected = v === rirStr ? " selected" : "";
      rirOptions += '<option value="' + v + '"' + selected + '>' + v + '</option>';
    }

    // Set-type select
    var typeOptions = "";
    for (var t = 0; t < SET_TYPES.length; t++) {
      var tt = SET_TYPES[t];
      var sel = tt === set.type ? " selected" : "";
      typeOptions += '<option value="' + tt + '"' + sel + '>' + TYPE_LABELS[tt] + '</option>';
    }

    // Previous-set placeholder (empty mode shows it inside the placeholder text)
    var ph = '';
    if (!isFilled) {
      ph = ' placeholder="' + set.weight + '"';
    }
    var phReps = !isFilled ? ' placeholder="' + set.reps + '"' : '';

    var filledCls = isFilled ? ' is-filled' : '';
    var rirFilledCls = isFilled ? ' is-filled' : '';

    return (
      '<div class="set-row type-' + set.type + '">' +
        '<span class="set-num">' + (setIdx + 1) + '</span>' +
        '<select class="set-type" aria-label="Set type">' + typeOptions + '</select>' +
        '<input class="set-input' + filledCls + '" type="number" inputmode="decimal" value="' + escapeAttr(weightStr) + '"' + ph + ' aria-label="Weight kg">' +
        '<input class="set-input' + filledCls + '" type="number" inputmode="numeric" value="' + escapeAttr(repsStr) + '"' + phReps + ' aria-label="Reps">' +
        '<select class="set-rir' + rirFilledCls + '" aria-label="RIR">' + rirOptions + '</select>' +
        '<button class="set-del" type="button" aria-label="Delete set">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<line x1="6" y1="6" x2="18" y2="18"></line>' +
            '<line x1="18" y1="6" x2="6" y2="18"></line>' +
          '</svg>' +
        '</button>' +
      '</div>'
    );
  }

  function renderCatChips(cats) {
    var out = "";
    for (var i = 0; i < cats.length; i++) {
      out +=
        '<span class="cat-chip cat-' + cats[i] + '">' +
          '<span class="dot" aria-hidden="true"></span>' +
          cap(cats[i]) +
        '</span>';
    }
    return out;
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function renderExerciseCard(ex, opts) {
    opts = opts || {};
    // opts.completedSets: how many sets are pre-filled (0 = idle, all = done)
    // opts.isActive: true if this exercise is currently being worked on
    var completed = (typeof opts.completedSets === "number") ? opts.completedSets : 0;
    var isActive  = !!opts.isActive;

    var rows = "";
    for (var i = 0; i < ex.planned.length; i++) {
      rows += renderSetRow(ex, i, ex.planned[i], i < completed ? "filled" : "empty");
    }

    var cardCls = "ex-card" + (isActive ? " is-active" : "");

    return (
      '<article class="' + cardCls + '" data-ex="' + ex.id + '">' +
        '<div class="ex-head">' +
          '<div class="ex-title">' +
            '<h3>' + ex.name + '</h3>' +
            '<div class="ex-meta">' +
              renderCatChips(ex.cats) +
              '<span class="last-time">Last: ' + ex.lastTime + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="ex-actions">' +
            '<button class="icon-btn" type="button" aria-label="Exercise preview">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>' +
                '<circle cx="12" cy="12" r="3"></circle>' +
              '</svg>' +
            '</button>' +
            '<button class="icon-btn" type="button" aria-label="More options">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<circle cx="5" cy="12" r="1.6"></circle>' +
                '<circle cx="12" cy="12" r="1.6"></circle>' +
                '<circle cx="19" cy="12" r="1.6"></circle>' +
              '</svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="set-grid">' +
          '<div class="set-grid-head">' +
            '<span>#</span><span>Type</span><span>KG</span><span>Reps</span><span>RIR</span><span></span>' +
          '</div>' +
          rows +
        '</div>' +
        '<div class="add-set-row">' +
          '<button class="add-set-btn" type="button" aria-label="Add set">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
              '<line x1="12" y1="5" x2="12" y2="19"></line>' +
              '<line x1="5" y1="12" x2="19" y2="12"></line>' +
            '</svg>' +
            'Add set' +
          '</button>' +
          '<button class="note-btn icon-btn" type="button" aria-label="Add note">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
              '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>' +
              '<polyline points="14 2 14 8 20 8"></polyline>' +
            '</svg>' +
          '</button>' +
        '</div>' +
      '</article>'
    );
  }

  // ----------------------------------------------------------------------
  // Renderers — per phone state
  // ----------------------------------------------------------------------
  function renderIdle() {
    var body = document.getElementById("idle-body");
    if (!body) return;
    var html = "";
    for (var i = 0; i < EXERCISES.length; i++) {
      html += renderExerciseCard(EXERCISES[i], { completedSets: 0, isActive: false });
    }
    body.innerHTML = html;
  }

  function renderActive() {
    var body = document.getElementById("active-body");
    if (!body) return;

    // Active progress:
    //  - Lat Pulldown:  4/4 sets done
    //  - Cable Row:     4/4 sets done
    //  - Rear Delt Fly: 1/3 sets done — currently active (resting after set 1)
    //  - Hammer Curl:   0/3
    //  - Cable Crunch:  0/3
    var progress = [4, 4, 1, 0, 0];
    var activeIdx = 2;

    var html = "";
    for (var i = 0; i < EXERCISES.length; i++) {
      html += renderExerciseCard(EXERCISES[i], {
        completedSets: progress[i],
        isActive: i === activeIdx
      });
    }
    body.innerHTML = html;

    // Start rest-timer countdown demo
    startRestCountdown();
  }

  // ----------------------------------------------------------------------
  // Rest timer demo countdown (for the active phone)
  // ----------------------------------------------------------------------
  function startRestCountdown() {
    var valueEl = document.getElementById("rest-value");
    var timerEl = document.getElementById("rest-timer");
    if (!valueEl) return;

    var remaining = 72; // 1:12
    function tick() {
      if (remaining < 0) {
        // Auto-stop and reset display
        valueEl.textContent = "Done";
        timerEl.classList.remove("is-warning");
        return;
      }
      var m = Math.floor(remaining / 60);
      var s = remaining % 60;
      valueEl.textContent =
        String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
      if (remaining <= 10) timerEl.classList.add("is-warning");
      remaining -= 1;
      setTimeout(tick, 1000);
    }
    tick();
  }

  // ----------------------------------------------------------------------
  // Workout elapsed clock demo (active phone)
  // ----------------------------------------------------------------------
  function startWorkoutClock() {
    var el = document.getElementById("active-clock");
    if (!el) return;
    // Starts from 00:24:18
    var seconds = 24 * 60 + 18;
    function tick() {
      var h = Math.floor(seconds / 3600);
      var m = Math.floor((seconds % 3600) / 60);
      var s = seconds % 60;
      el.textContent =
        String(h).padStart(2, "0") + ":" +
        String(m).padStart(2, "0") + ":" +
        String(s).padStart(2, "0");
      seconds += 1;
      setTimeout(tick, 1000);
    }
    tick();
  }

  // ----------------------------------------------------------------------
  // Init
  // ----------------------------------------------------------------------
  renderIdle();
  renderActive();
  startWorkoutClock();
}());
