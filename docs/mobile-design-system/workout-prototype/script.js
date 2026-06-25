// LogWise — Workout (Exercises & Programs) Prototype
//
// Two phones, two tabs of the same screen:
//   - Phone 1: Exercises tab — search, category filter, A-Z grouped list
//   - Phone 2: Programs tab — featured active program + compact other rows

(function () {
  "use strict";

  // ----------------------------------------------------------------------
  // Exercises library
  //   - id, name, cats[], pr (best set), lastUsed (relative)
  // ----------------------------------------------------------------------
  var EXERCISES = [
    { id: "back-squat",            name: "Back Squat",            cats: ["leg"],              pr: "120 kg × 6",  lastUsed: "2 days ago"  },
    { id: "bench-press",           name: "Bench Press",           cats: ["chest"],            pr: "90 kg × 5",   lastUsed: "yesterday"   },
    { id: "bicep-curl",            name: "Bicep Curl",            cats: ["biceps"],           pr: "18 kg × 10",  lastUsed: "3 days ago"  },
    { id: "cable-crunch",          name: "Cable Crunch",          cats: ["core"],             pr: "45 kg × 15",  lastUsed: "yesterday"   },
    { id: "cable-fly",             name: "Cable Fly",             cats: ["chest"],            pr: "22 kg × 12",  lastUsed: "4 days ago"  },
    { id: "cable-row",             name: "Cable Row",             cats: ["back"],             pr: "68 kg × 10",  lastUsed: "today"       },
    { id: "deadlift",              name: "Deadlift",              cats: ["back", "leg"],      pr: "140 kg × 5",  lastUsed: "1 week ago"  },
    { id: "dumbbell-press",        name: "Dumbbell Press",        cats: ["chest"],            pr: "32 kg × 8",   lastUsed: "5 days ago"  },
    { id: "face-pull",             name: "Face Pull",             cats: ["shoulder"],         pr: "28 kg × 14",  lastUsed: "2 days ago"  },
    { id: "front-squat",           name: "Front Squat",           cats: ["leg"],              pr: "85 kg × 6",   lastUsed: "1 week ago"  },
    { id: "hammer-curl",           name: "Hammer Curl",           cats: ["biceps"],           pr: "18 kg × 10",  lastUsed: "today"       },
    { id: "incline-db-press",      name: "Incline DB Press",      cats: ["chest"],            pr: "30 kg × 10",  lastUsed: "yesterday"   },
    { id: "lat-pulldown",          name: "Lat Pulldown",          cats: ["back"],             pr: "75 kg × 10",  lastUsed: "today"       },
    { id: "lateral-raise",         name: "Lateral Raise",         cats: ["shoulder"],         pr: "14 kg × 15",  lastUsed: "yesterday"   },
    { id: "leg-press",             name: "Leg Press",             cats: ["leg"],              pr: "180 kg × 10", lastUsed: "3 days ago"  },
    { id: "overhead-press",        name: "Overhead Press",        cats: ["shoulder"],         pr: "55 kg × 6",   lastUsed: "4 days ago"  },
    { id: "pull-up",               name: "Pull-up",               cats: ["back"],             pr: "BW × 12",     lastUsed: "2 days ago"  },
    { id: "rear-delt-fly",         name: "Rear Delt Fly",         cats: ["shoulder"],         pr: "16 kg × 14",  lastUsed: "today"       },
    { id: "romanian-deadlift",     name: "Romanian Deadlift",     cats: ["leg"],              pr: "110 kg × 8",  lastUsed: "3 days ago"  },
    { id: "russian-twist",         name: "Russian Twist",         cats: ["core"],             pr: "20 kg × 20",  lastUsed: "yesterday"   },
    { id: "skull-crusher",         name: "Skull Crusher",         cats: ["triceps"],          pr: "30 kg × 10",  lastUsed: "5 days ago"  },
    { id: "standing-calf-raise",   name: "Standing Calf Raise",   cats: ["leg"],              pr: "80 kg × 15",  lastUsed: "3 days ago"  },
    { id: "triceps-pushdown",      name: "Triceps Pushdown",      cats: ["triceps"],          pr: "32 kg × 12",  lastUsed: "yesterday"   },
    { id: "weighted-plank",        name: "Weighted Plank",        cats: ["core"],             pr: "20 kg × 60s", lastUsed: "4 days ago"  }
  ];

  // ----------------------------------------------------------------------
  // Programs (the active one is featured at the top of the Programs tab)
  // ----------------------------------------------------------------------
  var ACTIVE_PROGRAM = {
    name: "Pull / Push / Legs",
    type: "weekly",
    weekIndex: 3,
    weekTotal: 6,
    cycleType: "linear",
    compliance: 87,
    streak: 12,
    days: {
      // 0 = Sun … 6 = Sat (LogWise web app convention)
      0: 0, 1: 5, 2: 5, 3: 4, 4: 0, 5: 5, 6: 5
    },
    todayDow: 2 // Tue
  };

  var OTHER_PROGRAMS = [
    { id: "ppl-deload",  name: "PPL — Deload Week",      type: "weekly", meta: "6 ex / day · 3 days" },
    { id: "upper-lower", name: "Upper / Lower Split",    type: "weekly", meta: "4 days · 32 sets" },
    { id: "core-burner", name: "Core Burner",            type: "daily",  meta: "6 ex · 18 sets" }
  ];

  // ----------------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------------
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function renderCatChip(cat) {
    return (
      '<span class="cat-chip cat-' + cat + '">' +
        '<span class="dot" aria-hidden="true"></span>' +
        cap(cat) +
      '</span>'
    );
  }

  function renderChev() {
    return (
      '<span class="row-chev" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
          '<polyline points="9 18 15 12 9 6"></polyline>' +
        '</svg>' +
      '</span>'
    );
  }

  // ----------------------------------------------------------------------
  // Exercises renderer — A-Z grouped
  // ----------------------------------------------------------------------
  function renderExercises() {
    var list = document.getElementById("ex-list");
    if (!list) return;

    // Sort alphabetically
    var sorted = EXERCISES.slice().sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });

    var html = "";
    var currentLetter = "";
    for (var i = 0; i < sorted.length; i++) {
      var ex = sorted[i];
      var firstLetter = ex.name.charAt(0).toUpperCase();
      if (firstLetter !== currentLetter) {
        currentLetter = firstLetter;
        html += '<div class="letter-head">' + currentLetter + '</div>';
      }

      var primaryCat = ex.cats[0];
      html +=
        '<button class="ex-row cat-' + primaryCat + '" type="button" data-ex="' + ex.id + '">' +
          '<span class="accent-bar" aria-hidden="true"></span>' +
          '<div class="ex-body">' +
            '<span class="ex-name">' + ex.name + '</span>' +
            '<span class="ex-sub">' +
              ex.cats.map(renderCatChip).join("") +
              '<span class="ex-meta">' + ex.lastUsed + '</span>' +
            '</span>' +
          '</div>' +
          '<span class="pr">' +
            '<span class="pr-val">' + ex.pr + '</span>' +
            '<span class="pr-label">PR</span>' +
          '</span>' +
          renderChev() +
        '</button>';
    }
    list.innerHTML = html;

    // Update count sub
    var sub = document.getElementById("ex-count-sub");
    if (sub) sub.textContent = EXERCISES.length + " exercises";
  }

  // ----------------------------------------------------------------------
  // Programs renderer
  // ----------------------------------------------------------------------
  function renderPrograms() {
    var body = document.getElementById("pg-body");
    if (!body) return;

    var dowShort = ["S", "M", "T", "W", "T", "F", "S"];
    var dowLong  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // ----- Active program featured card -----
    var dayChipsHtml = "";
    for (var d = 0; d < 7; d++) {
      var ct = ACTIVE_PROGRAM.days[d] || 0;
      var isRest = ct === 0;
      var isToday = d === ACTIVE_PROGRAM.todayDow;
      var cls = "ap-day";
      if (isRest)  cls += " is-rest";
      if (isToday) cls += " is-today";
      dayChipsHtml +=
        '<div class="' + cls + '">' +
          '<span class="dow">' + dowShort[d] + '</span>' +
          '<span class="ct">' + (isRest ? "—" : ct + " ex") + '</span>' +
        '</div>';
    }

    var activeHtml =
      '<article class="active-program">' +
        '<div class="ap-head">' +
          '<div class="ap-title">' +
            '<span class="ap-kicker">Active program</span>' +
            '<h3>' + ACTIVE_PROGRAM.name + '</h3>' +
            '<span class="ap-meta">' +
              cap(ACTIVE_PROGRAM.type) +
              '<span class="sep" aria-hidden="true"></span>' +
              'Week ' + ACTIVE_PROGRAM.weekIndex + ' / ' + ACTIVE_PROGRAM.weekTotal +
              '<span class="sep" aria-hidden="true"></span>' +
              cap(ACTIVE_PROGRAM.cycleType) +
            '</span>' +
          '</div>' +
          '<div class="ap-actions">' +
            '<button class="icon-btn" type="button" aria-label="Edit program">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
            '</button>' +
            '<button class="icon-btn" type="button" aria-label="More">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5" cy="12" r="1.6"></circle><circle cx="12" cy="12" r="1.6"></circle><circle cx="19" cy="12" r="1.6"></circle></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="ap-stats">' +
          '<div class="stat is-gold">' +
            '<span class="k">Compliance</span>' +
            '<span class="v">' + ACTIVE_PROGRAM.compliance + '%</span>' +
          '</div>' +
          '<div class="stat">' +
            '<span class="k">Streak</span>' +
            '<span class="v">' + ACTIVE_PROGRAM.streak + 'd</span>' +
          '</div>' +
          '<div class="stat">' +
            '<span class="k">Next</span>' +
            '<span class="v">' + dowLong[ACTIVE_PROGRAM.todayDow] + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="ap-days">' + dayChipsHtml + '</div>' +
        '<div class="ap-cta-row">' +
          '<button class="btn primary" type="button">' +
            '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>' +
            "Today's workout" +
          '</button>' +
          '<button class="btn secondary" type="button">View week</button>' +
        '</div>' +
      '</article>';

    // ----- Other programs section -----
    var othersHtml = "";
    if (OTHER_PROGRAMS.length) {
      othersHtml +=
        '<div class="section-head">' +
          '<h4>Other programs</h4>' +
          '<span class="count">' + OTHER_PROGRAMS.length + ' saved</span>' +
        '</div>';
      for (var p = 0; p < OTHER_PROGRAMS.length; p++) {
        var pg = OTHER_PROGRAMS[p];
        othersHtml +=
          '<button class="pg-row" type="button" data-pg="' + pg.id + '">' +
            '<div class="pg-body">' +
              '<span class="pg-name">' + pg.name + '</span>' +
              '<span class="pg-meta">' + pg.meta + '</span>' +
            '</div>' +
            '<span class="pg-type is-' + pg.type + '">' + pg.type + '</span>' +
            renderChev() +
          '</button>';
      }
    }

    body.innerHTML = activeHtml + othersHtml;
  }

  // ----------------------------------------------------------------------
  // Init
  // ----------------------------------------------------------------------
  renderExercises();
  renderPrograms();
}());
