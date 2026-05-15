(function () {
  const workoutEvents = {
    chest: [
      ["Chest Press", "push"],
      ["Chest Fly", "push"],
      ["Rear Delt Fly", "push"],
      ["Cable Lateral", "arms"],
      ["Triceps Pushdown", "arms"]
    ],
    pull: [
      ["Lat Pulldown", "pull"],
      ["Rope Pullover", "pull"],
      ["Cable Row", "pull"],
      ["Cable Crunch", "arms"],
      ["One Arm Curl", "arms"],
      ["Reverse Curl", "legs"]
    ],
    legs: [
      ["Leg Press", "legs"],
      ["Squat", "legs"]
    ],
    rest: [
      ["Rest", "rest"]
    ]
  };

  const cells = [
    { day: 27, muted: true, events: workoutEvents.chest },
    { day: 28, muted: true, events: workoutEvents.pull },
    { day: 29, muted: true, events: workoutEvents.legs },
    { day: 30, muted: true, events: [] },
    { day: 1, events: workoutEvents.chest },
    { day: 2, events: workoutEvents.pull },
    { day: 3, events: [] },

    { day: 4, events: workoutEvents.chest },
    { day: 5, events: workoutEvents.pull },
    { day: 6, events: workoutEvents.legs },
    { day: 7, events: [] },
    { day: 8, events: workoutEvents.chest },
    { day: 9, events: workoutEvents.pull },
    { day: 10, events: [] },

    { day: 11, events: workoutEvents.chest },
    { day: 12, events: workoutEvents.pull },
    { day: 13, events: workoutEvents.legs },
    { day: 14, events: [] },
    { day: 15, events: workoutEvents.chest },
    { day: 16, events: workoutEvents.pull },
    { day: 17, today: true, events: workoutEvents.rest },

    { day: 18, events: workoutEvents.chest },
    { day: 19, events: workoutEvents.pull },
    { day: 20, events: workoutEvents.legs },
    { day: 21, events: [] },
    { day: 22, events: workoutEvents.chest },
    { day: 23, events: workoutEvents.pull },
    { day: 24, events: [] },

    { day: 25, events: workoutEvents.chest },
    { day: 26, events: workoutEvents.pull },
    { day: 27, events: workoutEvents.legs },
    { day: 28, events: [] },
    { day: 29, events: workoutEvents.chest },
    { day: 30, events: workoutEvents.pull },
    { day: 31, events: [] },

    { day: 1, muted: true, events: workoutEvents.chest },
    { day: 2, muted: true, events: workoutEvents.pull },
    { day: 3, muted: true, events: workoutEvents.legs },
    { day: 4, muted: true, events: [] },
    { day: 5, muted: true, events: workoutEvents.chest },
    { day: 6, muted: true, events: workoutEvents.pull },
    { day: 7, muted: true, events: [] }
  ];

  const grid = document.getElementById("calendar-grid");
  const todayButton = document.querySelector(".today-button");
  const viewButton = document.querySelector(".view-button");
  const viewMenu = document.querySelector(".view-menu");
  const moreButton = document.querySelector(".more-button");
  const moreMenu = document.querySelector(".more-menu");
  const profileButton = document.querySelector(".profile-button");
  let selectedIndex = 18;

  function renderCalendar() {
    grid.innerHTML = "";
    cells.forEach(function (cell, index) {
      const day = document.createElement("button");
      day.type = "button";
      day.className = "day-cell";
      if (cell.muted) day.classList.add("is-muted");
      if (cell.today) day.classList.add("is-today");
      if (index === selectedIndex) day.classList.add("is-selected");
      day.setAttribute("aria-label", "September " + cell.day + " workout plan");

      const eventMarkup = cell.events.map(function (event) {
        return '<span class="event event-' + event[1] + '">' + event[0] + "</span>";
      }).join("");

      day.innerHTML =
        '<span class="day-number">' + cell.day + "</span>" +
        '<span class="event-stack">' + eventMarkup + "</span>";

      day.addEventListener("click", function () {
        selectedIndex = index;
        renderCalendar();
      });

      grid.appendChild(day);
    });
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
      viewMenu.querySelector(".selected").classList.remove("selected");
      button.classList.add("selected");
      viewButton.firstChild.nodeValue = button.textContent + " ";
      closeMenus();
    });
  });

  todayButton.addEventListener("click", function () {
    const todayIndex = cells.findIndex(function (cell) {
      return cell.today;
    });
    if (todayIndex > -1) {
      selectedIndex = todayIndex;
      renderCalendar();
    }
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

  renderCalendar();
}());
