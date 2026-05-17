// LogWise — Calendar Home v2.1 Prototype
//
// Two views:
//   - Month: 6x7 grid, mini event chips, geometry from the original
//     calendar-home-prototype (font clamp, overflow clip — never "...").
//   - Week:  infinite vertical feed. 8 weeks rendered (4 past + 4 future)
//     so the user can scroll up/down freely. Each week has a header.
//     Top bar title syncs to the visible week via scroll position.
//     Tapping a day row expands it in place; only one open at a time.
//
// Demo state:
//   - TODAY    = "2026-09-17" (Rest)
//   - SELECTED = "2026-09-15" (Pull day) — pre-expanded in the 3rd phone.

(function () {
  "use strict";

  var TODAY_KEY    = "2026-09-17";
  var SELECTED_KEY = "2026-09-15";

  var DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DOW_LONG  = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // ----------------------------------------------------------------------
  // Plan templates — each event has a name + LogWise muscle `cat`
  // ----------------------------------------------------------------------
  var PLANS = {
    push: {
      type: "push", title: "Push",
      events: [
        { name: "Bench Press",         cat: "chest",    last: "82.5 kg × 6"  },
        { name: "Incline DB Press",    cat: "chest",    last: "30 kg × 10"   },
        { name: "Cable Fly",           cat: "chest",    last: "22 kg × 12"   },
        { name: "Lateral Raise",       cat: "shoulder", last: "12 kg × 15"   },
        { name: "Triceps Pushdown",    cat: "triceps",  last: "32 kg × 12"   }
      ]
    },
    pull: {
      type: "pull", title: "Pull",
      events: [
        { name: "Lat Pulldown",        cat: "back",     last: "70 kg × 10"   },
        { name: "Cable Row",           cat: "back",     last: "64 kg × 10"   },
        { name: "Rear Delt Fly",       cat: "shoulder", last: "16 kg × 14"   },
        { name: "Hammer Curl",         cat: "biceps",   last: "16 kg × 10"   },
        { name: "Cable Crunch",        cat: "core",     last: "40 kg × 15"   }
      ]
    },
    legs: {
      type: "legs", title: "Legs",
      events: [
        { name: "Back Squat",          cat: "leg",      last: "100 kg × 6"   },
        { name: "Romanian Deadlift",   cat: "leg",      last: "110 kg × 8"   },
        { name: "Leg Press",           cat: "leg",      last: "160 kg × 10"  },
        { name: "Standing Calf Raise", cat: "leg",      last: "80 kg × 15"   }
      ]
    },
    rest: { type: "rest", title: "Rest", events: [] },
    open: { type: "open", title: "—", events: [] }
  };

  // ----------------------------------------------------------------------
  // Month calendar (Sep 2026) — 42 cells
  // ----------------------------------------------------------------------
  var MONTH_CELLS = [
    c("2026-08-27", 27, "push", true),
    c("2026-08-28", 28, "pull", true),
    c("2026-08-29", 29, "legs", true),
    c("2026-08-30", 30, "open", true),
    c("2026-08-31", 31, "push", true),
    c("2026-09-01",  1, "pull"),
    c("2026-09-02",  2, "open"),

    c("2026-09-03",  3, "push"),
    c("2026-09-04",  4, "pull"),
    c("2026-09-05",  5, "legs"),
    c("2026-09-06",  6, "rest"),
    c("2026-09-07",  7, "push"),
    c("2026-09-08",  8, "pull"),
    c("2026-09-09",  9, "open"),

    c("2026-09-10", 10, "push"),
    c("2026-09-11", 11, "pull"),
    c("2026-09-12", 12, "legs"),
    c("2026-09-13", 13, "rest"),
    c("2026-09-14", 14, "push"),
    c("2026-09-15", 15, "pull"),
    c("2026-09-16", 16, "open"),

    c("2026-09-17", 17, "rest"),
    c("2026-09-18", 18, "push"),
    c("2026-09-19", 19, "pull"),
    c("2026-09-20", 20, "legs"),
    c("2026-09-21", 21, "rest"),
    c("2026-09-22", 22, "push"),
    c("2026-09-23", 23, "open"),

    c("2026-09-24", 24, "pull"),
    c("2026-09-25", 25, "legs"),
    c("2026-09-26", 26, "rest"),
    c("2026-09-27", 27, "push"),
    c("2026-09-28", 28, "pull"),
    c("2026-09-29", 29, "legs"),
    c("2026-09-30", 30, "open"),

    c("2026-10-01",  1, "push", true),
    c("2026-10-02",  2, "pull", true),
    c("2026-10-03",  3, "legs", true)
  ];

  function c(key, day, plan, muted) {
    return { key: key, day: day, plan: plan, muted: !!muted };
  }

  // ----------------------------------------------------------------------
  // Date helpers
  // ----------------------------------------------------------------------
  function dateFromKey(key) {
    var p = key.split("-");
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
  }

  function keyFromDate(d) {
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  function isoWeek(d) {
    var target = new Date(d.valueOf());
    var dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    var firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000);
  }

  // Plan cycle for the infinite week feed: Sun open, Mon push, Tue pull,
  // Wed legs, Thu rest, Fri push, Sat pull.
  var CYCLE = ["open", "push", "pull", "legs", "rest", "push", "pull"];

  function planForKey(key) {
    for (var i = 0; i < MONTH_CELLS.length; i++) {
      if (MONTH_CELLS[i].key === key) return PLANS[MONTH_CELLS[i].plan] || PLANS.open;
    }
    var d = dateFromKey(key);
    return PLANS[CYCLE[d.getDay()]] || PLANS.open;
  }

  function uniqueCats(events) {
    var seen = {}, out = [];
    for (var i = 0; i < events.length; i++) {
      var k = events[i].cat;
      if (!seen[k]) { seen[k] = 1; out.push(k); }
    }
    return out;
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // ----------------------------------------------------------------------
  // MONTH renderer
  // ----------------------------------------------------------------------
  function renderMonth() {
    var grid = document.getElementById("month-grid");
    if (!grid) return;
    var html = "";

    for (var i = 0; i < MONTH_CELLS.length; i++) {
      var cell = MONTH_CELLS[i];
      var plan = PLANS[cell.plan] || PLANS.open;
      var isToday    = cell.key === TODAY_KEY;
      var isSelected = cell.key === SELECTED_KEY;
      var isRest     = plan.type === "rest";

      var cls = "day-cell";
      if (cell.muted)             cls += " is-muted";
      if (isToday)                cls += " is-today";
      if (isSelected)             cls += " is-selected";
      if (isRest)                 cls += " is-rest";

      var chips = "";
      if (isRest) {
        chips = '<span class="event event-rest">Rest</span>';
      } else if (plan.events.length) {
        for (var e = 0; e < plan.events.length; e++) {
          var ev = plan.events[e];
          chips += '<span class="event cat-' + ev.cat + '">' + ev.name + '</span>';
        }
      }

      html +=
        '<button class="' + cls + '" type="button" data-key="' + cell.key + '">' +
          '<span class="day-num">' + cell.day + '</span>' +
          '<span class="event-stack">' + chips + '</span>' +
        '</button>';
    }
    grid.innerHTML = html;
  }

  // ----------------------------------------------------------------------
  // WEEK feed
  // ----------------------------------------------------------------------
  function sundayOfWeek(key) {
    var d = dateFromKey(key);
    var s = new Date(d);
    s.setDate(d.getDate() - d.getDay());
    return keyFromDate(s);
  }

  function getWeekDays(sundayKey) {
    var s = dateFromKey(sundayKey);
    var out = [];
    for (var i = 0; i < 7; i++) {
      var nx = new Date(s);
      nx.setDate(s.getDate() + i);
      out.push(keyFromDate(nx));
    }
    return out;
  }

  function rangeLabel(sundayKey) {
    var days = getWeekDays(sundayKey);
    var first = dateFromKey(days[0]);
    var last  = dateFromKey(days[6]);
    if (first.getMonth() === last.getMonth()) {
      return MONTH_SHORT[first.getMonth()] + " " + first.getDate() + " — " + last.getDate();
    }
    return MONTH_SHORT[first.getMonth()] + " " + first.getDate() + " — " +
           MONTH_SHORT[last.getMonth()] + " " + last.getDate();
  }

  function subLabel(sundayKey) {
    var d = dateFromKey(sundayKey);
    return "Week " + isoWeek(d) + " · " + d.getFullYear();
  }

  function renderWeekRowHTML(key, expandedKey, opts) {
    opts = opts || {};
    var plan = planForKey(key);
    var d = dateFromKey(key);
    var isToday    = key === TODAY_KEY;
    var isRest     = plan.type === "rest";
    var isExpanded = (expandedKey === key) || (opts.alwaysExpanded === true);
    var timerRunning = opts.timerKey === key;
    var timerValue   = opts.timerValue || "00:24:18";

    var cls = "week-row";
    if (isToday)    cls += " is-today";
    if (isRest)     cls += " is-rest";
    if (isExpanded) cls += " is-expanded";

    // --- Compact body ---
    var compactBody;
    if (isRest) {
      compactBody =
        '<div class="week-plan">' +
          '<h3>Rest day</h3>' +
          '<span class="week-meta">Recovery</span>' +
        '</div>';
    } else if (plan.events.length === 0) {
      compactBody =
        '<div class="week-plan">' +
          '<h3>No plan</h3>' +
          '<span class="week-meta">Open day</span>' +
        '</div>';
    } else {
      var cats = uniqueCats(plan.events);
      var chips = "";
      for (var j = 0; j < cats.length; j++) {
        chips +=
          '<span class="cat-chip cat-' + cats[j] + '">' +
            '<span class="dot" aria-hidden="true"></span>' + cap(cats[j]) +
          '</span>';
      }
      compactBody =
        '<div class="week-plan">' +
          '<h3>' + plan.title + ' day</h3>' +
          '<span class="week-meta">' +
            plan.events.length + ' ex' +
            '<span class="sep" aria-hidden="true"></span>' +
            (plan.events.length * 4) + ' sets' +
          '</span>' +
        '</div>' +
        '<div class="week-cats">' + chips + '</div>';
    }

    // --- Expanded body ---
    var dayLabel = isToday ? "Today" : DOW_LONG[d.getDay()];

    var planPill = "";
    if (isRest)                  planPill = '<span class="plan-pill">Rest</span>';
    else if (plan.events.length) planPill = '<span class="plan-pill">' + plan.title + ' day</span>';

    var expandedList;
    if (isRest) {
      expandedList =
        '<div class="empty-note">' +
          '<span class="moon" aria-hidden="true"></span>' +
          'Scheduled recovery — no workout planned.' +
        '</div>';
    } else if (plan.events.length === 0) {
      expandedList =
        '<div class="empty-note" style="color: var(--t-tertiary); font-style: normal;">' +
          'Open day — tap to plan exercises.' +
        '</div>';
    } else {
      expandedList = '<div class="exercise-list">';
      for (var x = 0; x < plan.events.length; x++) {
        var ev2 = plan.events[x];
        expandedList +=
          '<div class="ex-row cat-' + ev2.cat + '">' +
            '<span class="accent-bar" aria-hidden="true"></span>' +
            '<span class="ex-name">' + ev2.name + '</span>' +
            '<span class="ex-last">' + ev2.last + '</span>' +
          '</div>';
      }
      expandedList += '</div>';
    }

    var ctaRow;
    if (isRest) {
      ctaRow =
        '<div class="cta-row">' +
          '<button class="cta-secondary" type="button">Reschedule</button>' +
        '</div>';
    } else if (plan.events.length === 0) {
      ctaRow =
        '<div class="cta-row">' +
          '<button class="cta-primary" type="button">Plan workout</button>' +
        '</div>';
    } else if (timerRunning) {
      // Running state — single bar: live timer + pause + finish
      ctaRow =
        '<div class="timer-bar" role="group" aria-label="Workout in progress">' +
          '<span class="timer-pulse" aria-hidden="true"></span>' +
          '<span class="timer-value">' + timerValue + '</span>' +
          '<button class="timer-pause" type="button" aria-label="Pause workout">' +
            '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"></rect><rect x="14" y="5" width="4" height="14" rx="1"></rect></svg>' +
            'Durdur' +
          '</button>' +
          '<button class="timer-finish" type="button" aria-label="Finish workout">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
            'Bitir' +
          '</button>' +
        '</div>';
    } else {
      // Idle state — Start workout (primary) + Open day (secondary, smaller)
      ctaRow =
        '<div class="cta-row">' +
          '<button class="cta-primary" type="button">' +
            '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>' +
            'Start workout' +
          '</button>' +
          '<button class="cta-secondary" type="button">Open day</button>' +
        '</div>';
    }

    var expandedHTML =
      '<div class="week-head expanded-only">' +
        '<div class="dleft">' +
          '<span class="day-label">' + dayLabel + '</span>' +
          '<div class="day-line">' +
            '<h3>' + DOW_SHORT[d.getDay()] + ' ' + d.getDate() + '</h3>' +
            '<span class="day-date">' + MONTH_SHORT[d.getMonth()] + ' ' + d.getFullYear() + '</span>' +
          '</div>' +
        '</div>' +
        planPill +
      '</div>' +
      '<div class="expanded-only">' + expandedList + '</div>' +
      '<div class="expanded-only">' + ctaRow + '</div>';

    return (
      '<div class="' + cls + '" data-key="' + key + '" role="button" tabindex="0">' +
        '<div class="week-date compact-only">' +
          '<span class="dow">' + DOW_SHORT[d.getDay()] + '</span>' +
          '<span class="dnum">' + d.getDate() + '</span>' +
        '</div>' +
        '<div class="week-body compact-only">' + compactBody + '</div>' +
        '<div class="chev compact-only" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
            '<polyline points="6 9 12 15 18 9"></polyline>' +
          '</svg>' +
        '</div>' +
        expandedHTML +
      '</div>'
    );
  }

  function renderWeekFeed(feedEl, opts) {
    opts = opts || {};
    var expandedKey   = opts.expandedKey   || null;
    var expandedKeys  = opts.expandedKeys  || (expandedKey ? [expandedKey] : []);
    var timerKey      = opts.timerKey      || null;
    var timerValue    = opts.timerValue    || "00:24:18";
    var centerKey     = opts.centerKey     || SELECTED_KEY;
    var pastWeeks     = (typeof opts.pastWeeks   === "number") ? opts.pastWeeks   : 4;
    var futureWeeks   = (typeof opts.futureWeeks === "number") ? opts.futureWeeks : 4;

    var centerSunday = sundayOfWeek(centerKey);
    var start = dateFromKey(centerSunday);
    start.setDate(start.getDate() - 7 * pastWeeks);

    var totalWeeks = pastWeeks + 1 + futureWeeks;
    var html = "";

    for (var w = 0; w < totalWeeks; w++) {
      var weekStart = new Date(start);
      weekStart.setDate(start.getDate() + w * 7);
      var sundayKey = keyFromDate(weekStart);
      var days = getWeekDays(sundayKey);
      var totalEx = 0, restCount = 0;
      for (var di = 0; di < days.length; di++) {
        var pp = planForKey(days[di]);
        if (pp.type === "rest") restCount++;
        else totalEx += pp.events.length;
      }

      html +=
        '<section class="week-block" data-week="' + sundayKey + '" ' +
                 'data-title="' + rangeLabel(sundayKey) + '" ' +
                 'data-sub="' + subLabel(sundayKey) + '">' +
          '<header class="week-header">' +
            '<div class="wh-left">' +
              '<span class="wh-num">' + subLabel(sundayKey) + '</span>' +
              '<span class="wh-range">' + rangeLabel(sundayKey) + '</span>' +
            '</div>' +
            '<span class="wh-stats">' +
              totalEx + ' ex' +
              '<span class="sep" aria-hidden="true"></span>' +
              restCount + ' rest' +
            '</span>' +
          '</header>' +
          '<div class="week-strip">';

      for (var dd = 0; dd < days.length; dd++) {
        var dKey = days[dd];
        var rowOpts = {
          alwaysExpanded: expandedKeys.indexOf(dKey) !== -1,
          timerKey:       timerKey,
          timerValue:     timerValue
        };
        html += renderWeekRowHTML(dKey, expandedKey, rowOpts);
      }
      html += '</div></section>';
    }

    feedEl.innerHTML = html;
  }

  // ----------------------------------------------------------------------
  // Accordion
  // ----------------------------------------------------------------------
  function bindAccordion(feedEl, surfaceEl) {
    feedEl.addEventListener("click", function (ev) {
      var row = ev.target.closest(".week-row");
      if (!row) return;
      var alreadyOpen = row.classList.contains("is-expanded");
      var open = feedEl.querySelectorAll(".week-row.is-expanded");
      for (var i = 0; i < open.length; i++) open[i].classList.remove("is-expanded");
      if (!alreadyOpen) {
        row.classList.add("is-expanded");
        surfaceEl.dataset.expanded = row.getAttribute("data-key");
      } else {
        delete surfaceEl.dataset.expanded;
      }
    });

    feedEl.addEventListener("keydown", function (ev) {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      var row = ev.target.closest(".week-row");
      if (!row) return;
      ev.preventDefault();
      row.click();
    });
  }

  // ----------------------------------------------------------------------
  // Top-bar title sync via scroll
  // ----------------------------------------------------------------------
  function bindTitleSync(surfaceEl, titleEl, subEl) {
    var blocks = surfaceEl.querySelectorAll(".week-block");
    if (!blocks.length) return;

    function updateTitle() {
      var surfaceTop = surfaceEl.getBoundingClientRect().top;
      var picked = null;
      for (var i = 0; i < blocks.length; i++) {
        var b = blocks[i];
        var r = b.getBoundingClientRect();
        if (r.top - surfaceTop <= 12 && r.bottom - surfaceTop > 80) {
          picked = b;
        }
      }
      if (!picked) {
        for (var j = 0; j < blocks.length; j++) {
          var rj = blocks[j].getBoundingClientRect();
          if (rj.bottom - surfaceTop > 0) { picked = blocks[j]; break; }
        }
      }
      if (!picked) return;
      var newTitle = picked.getAttribute("data-title");
      var newSub   = picked.getAttribute("data-sub");
      if (titleEl && titleEl.textContent !== newTitle) titleEl.textContent = newTitle;
      if (subEl   && subEl.textContent   !== newSub)   subEl.textContent   = newSub;
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        updateTitle();
        ticking = false;
      });
    }

    surfaceEl.addEventListener("scroll", onScroll, { passive: true });
    updateTitle();
  }

  // ----------------------------------------------------------------------
  // Init
  // ----------------------------------------------------------------------

  renderMonth();

  // Week — default (phone 2)
  var feed2 = document.getElementById("week-feed-2");
  var surf2 = document.getElementById("week-surface-2");
  if (feed2 && surf2) {
    renderWeekFeed(feed2, { centerKey: SELECTED_KEY, pastWeeks: 4, futureWeeks: 4 });
    bindAccordion(feed2, surf2);
    bindTitleSync(surf2, document.getElementById("week-title-2"), document.getElementById("week-sub-2"));
    var center2 = feed2.querySelector('[data-week="' + sundayOfWeek(SELECTED_KEY) + '"]');
    if (center2) {
      requestAnimationFrame(function () {
        surf2.scrollTop = center2.offsetTop - 6;
      });
    }
  }

  // Week — pre-expanded day (phone 3)
  var feed3 = document.getElementById("week-feed-3");
  var surf3 = document.getElementById("week-surface-3");
  if (feed3 && surf3) {
    renderWeekFeed(feed3, {
      centerKey:    SELECTED_KEY,
      // Pre-expand two days side by side so both states are visible:
      //   Mon 14 → workout in progress (timer running)
      //   Tue 15 → idle (Start workout + Open day)
      expandedKeys: ["2026-09-14", "2026-09-15"],
      timerKey:     "2026-09-14",
      timerValue:   "00:24:18",
      pastWeeks:    4,
      futureWeeks:  4
    });
    bindAccordion(feed3, surf3);
    bindTitleSync(surf3, document.getElementById("week-title-3"), document.getElementById("week-sub-3"));
    var center3 = feed3.querySelector('[data-week="' + sundayOfWeek(SELECTED_KEY) + '"]');
    if (center3) {
      requestAnimationFrame(function () {
        var openRow = feed3.querySelector(".week-row.is-expanded");
        var target  = openRow || center3;
        var surfRect   = surf3.getBoundingClientRect();
        var targetRect = target.getBoundingClientRect();
        surf3.scrollTop = surf3.scrollTop + (targetRect.top - surfRect.top) - 80;
      });
    }
  }
}());
