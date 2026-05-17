(function () {
  const todayKey = "2026-09-17";
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const longDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fullMonthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const planTemplates = {
    push: {
      type: "push",
      title: "Push",
      label: "Push Day",
      events: [
        { name: "Chest Press", color: "push", previous: "Last time: 60 kg x 10" },
        { name: "Chest Fly", color: "push", previous: "Last time: 22 kg x 12" },
        { name: "Rear Delt Fly", color: "push", previous: "Last time: 18 kg x 14" },
        { name: "Cable Lateral Raise", color: "arms", previous: "Last time: 12 kg x 15" },
        { name: "Triceps Pushdown", color: "arms", previous: "Last time: 32 kg x 12" }
      ]
    },
    pull: {
      type: "pull",
      title: "Pull",
      label: "Pull Day",
      events: [
        { name: "Lat Pulldown", color: "pull", previous: "Last time: 70 kg x 10" },
        { name: "Rope Pullover", color: "pull", previous: "Last time: 35 kg x 12" },
        { name: "Cable Row", color: "pull", previous: "Last time: 64 kg x 10" },
        { name: "Cable Crunch", color: "arms", previous: "Last time: 40 kg x 15" },
        { name: "One Arm Curl", color: "arms", previous: "Last time: 16 kg x 10" },
        { name: "Reverse Curl", color: "legs", previous: "Last time: 22 kg x 12" }
      ]
    },
    legs: {
      type: "legs",
      title: "Legs",
      label: "Leg Day",
      events: [
        { name: "Leg Press", color: "legs", previous: "Last time: 160 kg x 10" },
        { name: "Squat", color: "legs", previous: "Last time: 100 kg x 6" }
      ]
    },
    rest: {
      type: "rest",
      title: "Rest",
      label: "Rest Day",
      events: []
    },
    open: {
      type: "open",
      title: "Open",
      label: "No Plan",
      events: []
    }
  };

  const monthCells = [
    cell("2026-08-27", 27, "push", true),
    cell("2026-08-28", 28, "pull", true),
    cell("2026-08-29", 29, "legs", true),
    cell("2026-08-30", 30, "open", true),
    cell("2026-09-01", 1, "push"),
    cell("2026-09-02", 2, "pull"),
    cell("2026-09-03", 3, "open"),

    cell("2026-09-04", 4, "push"),
    cell("2026-09-05", 5, "pull"),
    cell("2026-09-06", 6, "legs"),
    cell("2026-09-07", 7, "open"),
    cell("2026-09-08", 8, "push"),
    cell("2026-09-09", 9, "pull"),
    cell("2026-09-10", 10, "open"),

    cell("2026-09-11", 11, "push"),
    cell("2026-09-12", 12, "pull"),
    cell("2026-09-13", 13, "legs"),
    cell("2026-09-14", 14, "open"),
    cell("2026-09-15", 15, "push"),
    cell("2026-09-16", 16, "pull"),
    cell("2026-09-17", 17, "rest"),

    cell("2026-09-18", 18, "push"),
    cell("2026-09-19", 19, "pull"),
    cell("2026-09-20", 20, "legs"),
    cell("2026-09-21", 21, "open"),
    cell("2026-09-22", 22, "push"),
    cell("2026-09-23", 23, "pull"),
    cell("2026-09-24", 24, "open"),

    cell("2026-09-25", 25, "push"),
    cell("2026-09-26", 26, "pull"),
    cell("2026-09-27", 27, "legs"),
    cell("2026-09-28", 28, "open"),
    cell("2026-09-29", 29, "push"),
    cell("2026-09-30", 30, "pull"),
    cell("2026-09-31", 31, "open"),

    cell("2026-10-01", 1, "push", true),
    cell("2026-10-02", 2, "pull", true),
    cell("2026-10-03", 3, "legs", true),
    cell("2026-10-04", 4, "open", true),
    cell("2026-10-05", 5, "push", true),
    cell("2026-10-06", 6, "pull", true),
    cell("2026-10-07", 7, "open", true)
  ];

  const titleEl = document.querySelector(".month-title h1");
  const subtitleEl = document.querySelector(".month-title p");
  const monthView = document.getElementById("month-view");
  const weekView = document.getElementById("week-view");
  const threeDayView = document.getElementById("three-day-view");
  const grid = document.getElementById("calendar-grid");
  const todayButton = document.querySelector(".today-button");
  const viewButton = document.querySelector(".view-button");
  const viewMenu = document.querySelector(".view-menu");
  const moreButton = document.querySelector(".more-button");
  const moreMenu = document.querySelector(".more-menu");
  const profileButton = document.querySelector(".profile-button");
  let selectedDateKey = "2026-09-15";
  let currentView = "Month";

  function cell(key, day, planType, muted) {
    const template = planTemplates[planType] || planTemplates.open;
    return {
      key: key,
      day: day,
      muted: Boolean(muted),
      planType: template.type
    };
  }

  function getPlan(key) {
    const found = monthCells.find(function (item) {
      return item.key === key;
    });
    if (!found) return planTemplates.open;
    return planTemplates[found.planType] || planTemplates.open;
  }

  function getDateParts(key) {
    const parts = key.split("-").map(Number);
    return { year: parts[0], month: parts[1], day: parts[2] };
  }

  function asDate(key) {
    const parts = getDateParts(key);
    return new Date(parts.year, parts.month - 1, parts.day);
  }

  function keyFromDate(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function formatMonthDay(key, full) {
    const date = asDate(key);
    const month = full ? fullMonthNames[date.getMonth()] : monthNames[date.getMonth()];
    return month + " " + date.getDate();
  }

  function formatWeekday(key, long) {
    const date = asDate(key);
    return (long ? longDayNames : dayNames)[date.getDay()];
  }

  function getWeekKeys(key) {
    const date = asDate(key);
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    return Array.from({ length: 7 }, function (_, index) {
      const next = new Date(start);
      next.setDate(start.getDate() + index);
      return keyFromDate(next);
    });
  }

  function getThreeDayKeys(key) {
    const start = asDate(key);
    return Array.from({ length: 3 }, function (_, index) {
      const next = new Date(start);
      next.setDate(start.getDate() + index);
      return keyFromDate(next);
    });
  }

  function eventClass(color) {
    return "event-" + color;
  }

  function renderEvent(event, className) {
    return '<span class="' + className + " " + eventClass(event.color) + '">' + event.name + "</span>";
  }

  function renderMonth() {
    grid.innerHTML = "";
    monthCells.forEach(function (item) {
      const plan = getPlan(item.key);
      const day = document.createElement("button");
      day.type = "button";
      day.className = "day-cell";
      if (item.muted) day.classList.add("is-muted");
      if (item.key === todayKey) day.classList.add("is-today");
      if (item.key === selectedDateKey) day.classList.add("is-selected");
      day.setAttribute("aria-label", formatMonthDay(item.key, true) + " workout plan");

      const eventMarkup = plan.events.map(function (event) {
        return renderEvent(event, "event");
      }).join("");

      day.innerHTML =
        '<span class="day-number">' + item.day + "</span>" +
        '<span class="event-stack">' + eventMarkup + "</span>";

      day.addEventListener("click", function () {
        selectedDateKey = item.key;
        renderAll();
      });

      grid.appendChild(day);
    });
  }

  function renderWeek() {
    renderCalendarRange(weekView, getWeekKeys(selectedDateKey), "week-strip");
  }

  function renderThreeDay() {
    renderCalendarRange(threeDayView, getThreeDayKeys(selectedDateKey), "three-day-grid");
  }

  function renderCalendarRange(container, keys, wrapperClass) {
    container.innerHTML =
      '<div class="' + wrapperClass + '">' +
      keys.map(function (key) {
        const plan = getPlan(key);
        const parts = getDateParts(key);
        const isSelected = key === selectedDateKey ? " is-selected" : "";
        const isToday = key === todayKey ? " is-today" : "";
        const events = plan.events.length
          ? plan.events.map(function (event) { return renderEvent(event, "week-event"); }).join("")
          : '<span class="week-event event-rest">' + (plan.type === "rest" ? "Rest" : "No planned workout") + "</span>";
        return (
          '<article class="week-day-card' + isSelected + isToday + '" role="button" tabindex="0" data-range-day="' + key + '">' +
            '<span class="week-day-top">' +
              '<span class="week-day-name">' + formatWeekday(key, false) + "</span>" +
              '<span class="week-day-number">' + parts.day + "</span>" +
            "</span>" +
            '<p class="week-plan-title">' + plan.title + "</p>" +
            '<span class="week-events">' + events + "</span>" +
          "</article>"
        );
      }).join("") +
      "</div>";

    container.querySelectorAll("[data-range-day]").forEach(function (button) {
      button.addEventListener("click", function () {
        selectedDateKey = button.getAttribute("data-range-day");
        renderAll();
      });
      button.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectedDateKey = button.getAttribute("data-range-day");
          renderAll();
        }
      });
    });
  }

  function updateTopBar() {
    if (currentView === "Month") {
      titleEl.textContent = "September";
      subtitleEl.textContent = "2026";
      return;
    }

    if (currentView === "Week") {
      const weekKeys = getWeekKeys(selectedDateKey);
      titleEl.textContent = formatMonthDay(weekKeys[0], false) + " - " + formatMonthDay(weekKeys[6], false);
      subtitleEl.textContent = "2026";
      return;
    }

    const threeDayKeys = getThreeDayKeys(selectedDateKey);
    titleEl.textContent = formatMonthDay(threeDayKeys[0], false) + " - " + formatMonthDay(threeDayKeys[2], false);
    subtitleEl.textContent = "2026";
  }

  function setView(view) {
    currentView = view;
    viewButton.firstChild.nodeValue = view + " ";
    viewMenu.querySelectorAll("button").forEach(function (button) {
      button.classList.toggle("selected", button.textContent === view);
    });
    closeMenus();
    renderAll();
  }

  function renderAll() {
    monthView.hidden = currentView !== "Month";
    weekView.hidden = currentView !== "Week";
    threeDayView.hidden = currentView !== "3 Day";
    updateTopBar();
    renderMonth();
    if (currentView === "Week") renderWeek();
    if (currentView === "3 Day") renderThreeDay();
  }

  function closeMenus() {
    viewMenu.classList.remove("open");
    moreMenu.classList.remove("open");
    viewButton.setAttribute("aria-expanded", "false");
    moreButton.setAttribute("aria-expanded", "false");
  }

  viewButton.addEventListener("click", function (event) {
    event.stopPropagation();
    const isOpen = viewMenu.classList.toggle("open");
    moreMenu.classList.remove("open");
    viewButton.setAttribute("aria-expanded", String(isOpen));
    moreButton.setAttribute("aria-expanded", "false");
  });

  viewMenu.querySelectorAll("button").forEach(function (button) {
    button.addEventListener("click", function () {
      setView(button.textContent);
    });
  });

  todayButton.addEventListener("click", function () {
    selectedDateKey = todayKey;
    renderAll();
  });

  moreButton.addEventListener("click", function (event) {
    event.stopPropagation();
    const isOpen = moreMenu.classList.toggle("open");
    viewMenu.classList.remove("open");
    moreButton.setAttribute("aria-expanded", String(isOpen));
    viewButton.setAttribute("aria-expanded", "false");
  });

  profileButton.addEventListener("click", function (event) {
    event.stopPropagation();
    const isOpen = moreMenu.classList.toggle("open");
    viewMenu.classList.remove("open");
    moreButton.setAttribute("aria-expanded", String(isOpen));
    viewButton.setAttribute("aria-expanded", "false");
  });

  document.addEventListener("click", closeMenus);

  renderAll();
}());
