(function () {
  const monthData = [
    {
      label: "April 2026",
      previous: "March",
      next: "May",
      days: [
        { n: 30, muted: true, labels: ["Rest"] },
        { n: 31, muted: true, labels: ["Upper"] },
        { n: 1, labels: ["Push"] },
        { n: 2, labels: ["Pull"] },
        { n: 3, labels: ["Legs"] },
        { n: 4, labels: ["Rest"], rest: true },
        { n: 5, labels: ["Upper"] },
        { n: 6, labels: ["Bench", "Triceps"] },
        { n: 7, labels: ["Back", "Biceps"] },
        { n: 8, labels: ["Squat"] },
        { n: 9, labels: ["Rest"], rest: true },
        { n: 10, labels: ["Push"] },
        { n: 11, labels: ["Pull"] },
        { n: 12, labels: ["Lower"] },
        { n: 13, labels: ["Upper"] },
        { n: 14, labels: ["Rest"], rest: true },
        { n: 15, labels: ["Push"] },
        { n: 16, labels: ["Pull"] },
        { n: 17, labels: ["Legs"] },
        { n: 18, labels: ["Rest"], rest: true },
        { n: 19, labels: ["Bench"] },
        { n: 20, labels: ["Back"] },
        { n: 21, labels: ["Squat"] },
        { n: 22, labels: ["Rest"], rest: true },
        { n: 23, labels: ["Upper"] },
        { n: 24, labels: ["Lower"] },
        { n: 25, labels: ["Push"] },
        { n: 26, labels: ["Pull"] },
        { n: 27, labels: ["Legs"] },
        { n: 28, labels: ["Rest"], rest: true },
        { n: 29, labels: ["Upper"] },
        { n: 30, labels: ["Lower"] },
        { n: 1, muted: true, labels: ["Push"] },
        { n: 2, muted: true, labels: ["Pull"] },
        { n: 3, muted: true, labels: ["Rest"] }
      ],
      selected: 18
    },
    {
      label: "May 2026",
      previous: "April",
      next: "June",
      days: [
        { n: 27, muted: true, labels: ["Push"] },
        { n: 28, muted: true, labels: ["Pull"] },
        { n: 29, muted: true, labels: ["Legs"] },
        { n: 30, muted: true, labels: ["Rest"] },
        { n: 1, labels: ["Upper"] },
        { n: 2, labels: ["Lower"] },
        { n: 3, labels: ["Rest"], rest: true },
        { n: 4, labels: ["Push"] },
        { n: 5, labels: ["Back", "Biceps"] },
        { n: 6, labels: ["Squat"] },
        { n: 7, labels: ["Rest"], rest: true },
        { n: 8, labels: ["Bench", "Triceps"] },
        { n: 9, labels: ["Pull"] },
        { n: 10, labels: ["Lower"] },
        { n: 11, labels: ["Upper"] },
        { n: 12, labels: ["Rest"], rest: true },
        { n: 13, labels: ["Pull"] },
        { n: 14, today: true, labels: ["Bench", "Triceps"], fullPlan: ["Bench Press", "Incline Dumbbell Press", "Triceps Pushdown", "Lateral Raise"] },
        { n: 15, labels: ["Legs"] },
        { n: 16, labels: ["Rest"], rest: true },
        { n: 17, labels: ["Upper"] },
        { n: 18, labels: ["Back", "Biceps"] },
        { n: 19, labels: ["Squat"] },
        { n: 20, labels: ["Rest"], rest: true },
        { n: 21, labels: ["Push"] },
        { n: 22, labels: ["Pull"] },
        { n: 23, labels: ["Lower"] },
        { n: 24, labels: ["Rest"], rest: true },
        { n: 25, labels: ["Bench"] },
        { n: 26, labels: ["Back"] },
        { n: 27, labels: ["Squat"] },
        { n: 28, labels: ["Rest"], rest: true },
        { n: 29, labels: ["Upper"] },
        { n: 30, labels: ["Lower"] },
        { n: 31, labels: ["Rest"], rest: true }
      ],
      selected: 14
    },
    {
      label: "June 2026",
      previous: "May",
      next: "July",
      days: [
        { n: 1, labels: ["Push"] },
        { n: 2, labels: ["Pull"] },
        { n: 3, labels: ["Legs"] },
        { n: 4, labels: ["Rest"], rest: true },
        { n: 5, labels: ["Bench", "Triceps"] },
        { n: 6, labels: ["Back"] },
        { n: 7, labels: ["Rest"], rest: true },
        { n: 8, labels: ["Upper"] },
        { n: 9, labels: ["Lower"] },
        { n: 10, labels: ["Push"] },
        { n: 11, labels: ["Rest"], rest: true },
        { n: 12, labels: ["Pull"] },
        { n: 13, labels: ["Squat"] },
        { n: 14, labels: ["Rest"], rest: true },
        { n: 15, labels: ["Bench"] },
        { n: 16, labels: ["Back", "Biceps"] },
        { n: 17, labels: ["Legs"] },
        { n: 18, labels: ["Rest"], rest: true },
        { n: 19, labels: ["Push"] },
        { n: 20, labels: ["Pull"] },
        { n: 21, labels: ["Upper"] },
        { n: 22, labels: ["Lower"] },
        { n: 23, labels: ["Rest"], rest: true },
        { n: 24, labels: ["Squat"] },
        { n: 25, labels: ["Bench", "Triceps"] },
        { n: 26, labels: ["Pull"] },
        { n: 27, labels: ["Rest"], rest: true },
        { n: 28, labels: ["Upper"] },
        { n: 29, labels: ["Lower"] },
        { n: 30, labels: ["Rest"], rest: true },
        { n: 1, muted: true, labels: ["Push"] },
        { n: 2, muted: true, labels: ["Pull"] },
        { n: 3, muted: true, labels: ["Legs"] },
        { n: 4, muted: true, labels: ["Rest"] },
        { n: 5, muted: true, labels: ["Upper"] }
      ],
      selected: 5
    }
  ];

  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const monthNames = ["April", "May", "June"];
  const grid = document.getElementById("calendar-grid");
  const title = document.getElementById("month-title");
  const selectedDate = document.getElementById("selected-date");
  const plannedList = document.getElementById("planned-list");
  const previousLabel = document.getElementById("previous-month-label");
  const nextLabel = document.getElementById("next-month-label");
  const profileTrigger = document.querySelector(".profile-trigger");
  const profileMenu = document.querySelector(".profile-menu");
  const todayButton = document.querySelector(".today-button");
  const previousButton = document.querySelector(".month-nav-left");
  const nextButton = document.querySelector(".month-nav-right");
  let monthIndex = 1;
  let selectedNumber = monthData[monthIndex].selected;

  function renderMonth(direction) {
    const month = monthData[monthIndex];
    title.textContent = month.label;
    previousLabel.textContent = month.previous;
    nextLabel.textContent = month.next;
    grid.classList.remove("shift-left", "shift-right");

    if (direction) {
      grid.classList.add(direction === "next" ? "shift-left" : "shift-right");
      window.setTimeout(function () {
        grid.classList.remove("shift-left", "shift-right");
      }, 190);
    }

    grid.innerHTML = "";
    month.days.forEach(function (day, index) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "day-cell";
      if (day.muted) button.classList.add("is-muted");
      if (day.today) button.classList.add("is-today");
      if (day.rest) button.classList.add("is-rest");
      if (!day.rest && day.labels.length) button.classList.add("has-workout");
      if (!day.muted && day.n === selectedNumber) button.classList.add("is-selected");

      button.dataset.index = String(index);
      button.innerHTML =
        '<span class="date-number">' + day.n + '</span>' +
        '<span class="day-plan">' +
        day.labels.map(function (label) {
          return "<span>" + label + "</span>";
        }).join("") +
        "</span>";

      button.addEventListener("click", function () {
        selectedNumber = day.n;
        renderMonth();
        updateDetail(day, index);
      });

      grid.appendChild(button);
    });

    const selectedIndex = month.days.findIndex(function (day) {
      return !day.muted && day.n === selectedNumber;
    });
    updateDetail(month.days[selectedIndex > -1 ? selectedIndex : 0], selectedIndex > -1 ? selectedIndex : 0);
  }

  function updateDetail(day, index) {
    const month = monthData[monthIndex];
    const weekDay = dayNames[index % 7];
    const monthName = month.label.split(" ")[0];
    selectedDate.textContent = weekDay + ", " + monthName + " " + day.n;

    const plan = day.fullPlan || expandPlan(day.labels);
    plannedList.innerHTML = plan.map(function (item) {
      return "<span>" + item + "</span>";
    }).join("");
  }

  function expandPlan(labels) {
    if (labels.length === 1 && labels[0] === "Rest") {
      return ["Rest day", "Mobility", "Light walk", "Plan tomorrow"];
    }
    const expanded = {
      Push: ["Bench Press", "Overhead Press", "Triceps Pushdown", "Lateral Raise"],
      Pull: ["Lat Pulldown", "Seated Row", "Face Pull", "Biceps Curl"],
      Legs: ["Back Squat", "Leg Press", "Romanian Deadlift", "Calf Raise"],
      Upper: ["Bench Press", "Barbell Row", "Shoulder Press", "Pull-up"],
      Lower: ["Squat", "Deadlift", "Leg Curl", "Split Squat"],
      Squat: ["Back Squat", "Pause Squat", "Leg Extension", "Core"],
      Bench: ["Bench Press", "Close Grip Bench", "Triceps Pushdown", "Rear Delt"],
      Back: ["Barbell Row", "Lat Pulldown", "Cable Row", "Face Pull"]
    };
    return expanded[labels[0]] || labels.concat(["Warm-up", "Work sets"]).slice(0, 4);
  }

  function setMonth(nextIndex, direction) {
    monthIndex = Math.max(0, Math.min(monthData.length - 1, nextIndex));
    selectedNumber = monthData[monthIndex].selected;
    renderMonth(direction);
  }

  profileTrigger.addEventListener("click", function () {
    const isOpen = profileMenu.classList.toggle("open");
    profileTrigger.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", function (event) {
    if (!profileMenu.contains(event.target) && !profileTrigger.contains(event.target)) {
      profileMenu.classList.remove("open");
      profileTrigger.setAttribute("aria-expanded", "false");
    }
  });

  todayButton.addEventListener("click", function () {
    const direction = monthIndex > 1 ? "previous" : "next";
    setMonth(1, monthIndex === 1 ? undefined : direction);
    selectedNumber = 14;
    renderMonth();
  });

  previousButton.addEventListener("click", function () {
    setMonth(monthIndex - 1, "previous");
  });

  nextButton.addEventListener("click", function () {
    setMonth(monthIndex + 1, "next");
  });

  renderMonth();
}());
