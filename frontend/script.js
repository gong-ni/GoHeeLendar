document.addEventListener("DOMContentLoaded", async () => {
  const { db, collection, getDocs, setDoc, doc, deleteDoc } = window.myFirebase;
  let currentUser = [];
  let currentDate = new Date();
  let events = {};

  document.addEventListener('click', () => {
    const contextMenu = document.getElementById('context-menu');
    if (contextMenu) {
      contextMenu.classList.add('hidden');
      contextMenu.remove();
    }
  });

  document.addEventListener("contextmenu", (e) => {
    if (e.target.closest(".calendar-day")) {
      e.preventDefault();
      const cell = e.target.closest(".calendar-day");
      const dateStr = cell.dataset.date;
      openContextMenu(e.pageX, e.pageY, dateStr);
    }
  });

  async function fetchEventsFromServer() {
    try {
      const snapshot = await getDocs(collection(db, "events"));
      const newEvents = {};
      snapshot.forEach(docSnap => {
        newEvents[docSnap.id] = docSnap.data().list;
      });
      events = newEvents;
      updateTheme();
      generateCalendar();
    } catch (err) {
      console.error("Firebase에서 일정 불러오기 실패:", err);
    }
  }

  function cleanEvents(data) {
    const cleaned = {};
    for (const [date, list] of Object.entries(data)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const filtered = list.filter(e => e.name && e.user);
      if (filtered.length > 0) cleaned[date] = filtered;
    }
    return cleaned;
  }

  async function saveEventToServer(eventsData) {
    try {
      const promises = Object.entries(eventsData).map(([date, list]) =>
        setDoc(doc(db, "events", date), { list })
      );
      await Promise.all(promises);
    } catch (err) {
      console.error("Firebase에 일정 저장 실패:", err);
      alert("저장에 실패했습니다.");
    }
  }

  async function deleteEventFromServer(dateKey, eventIndex) {
    if (!events[dateKey]) return;

    events[dateKey].splice(eventIndex, 1);

    if (events[dateKey].length === 0) {
      delete events[dateKey];
      try {
        await deleteDoc(doc(db, "events", dateKey));
      } catch (err) {
        console.error("문서 삭제 실패:", err);
      }
    } else {
      const cleanedEvents = cleanEvents(events);
      await saveEventToServer(cleanedEvents);
      events = cleanedEvents;
    }

    generateCalendar();
  }

  function updateTheme() {
    const body = document.body;
    body.classList.remove("goeun-active", "heesoo-active", "both-active");

    if (currentUser.length === 2) {
      body.classList.add("both-active");
    } else if (currentUser.includes("goeun")) {
      body.classList.add("goeun-active");
    } else if (currentUser.includes("heesoo")) {
      body.classList.add("heesoo-active");
    }
  }

  document.getElementById("prev-month").addEventListener("click", () => changeMonth(-1));
  document.getElementById("next-month").addEventListener("click", () => changeMonth(1));

  function generateCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    document.getElementById("current-month").textContent = `${year}년 ${month + 1}월`;

    const calendar = document.getElementById("calendar");
    calendar.innerHTML = "";

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    for (let i = 0; i < (firstDayOfMonth + 6) % 7; i++) {
      const emptyCell = document.createElement("div");
      emptyCell.classList.add("empty-cell");
      calendar.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const dayDiv = document.createElement("div");
      dayDiv.classList.add("calendar-day");
      dayDiv.dataset.date = dateStr;
      dayDiv.innerHTML = `<span class='date'>${day}</span>`;

      dayDiv.addEventListener("click", () => openAddEventForm(year, month + 1, day));
      dayDiv.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        openContextMenu(e.pageX, e.pageY, dateStr);
      });

      if (events[dateStr]) {
        events[dateStr].forEach((event, idx) => {
          const eventSpan = document.createElement("div");
          eventSpan.classList.add("event", event.user);
          eventSpan.textContent = event.name;
          eventSpan.addEventListener("contextmenu", (e) => {
            e.stopPropagation();
            e.preventDefault();
            openEventContextMenu(e.pageX, e.pageY, dateStr, idx);
          });
          dayDiv.appendChild(eventSpan);
        });
      }

      calendar.appendChild(dayDiv);
    }
  }

  function openAddEventForm(year, month, day) {
    document.getElementById("event-date").value = `${year}년 ${month}월 ${day}일`;
    document.getElementById("event-name").value = "";
    document.getElementById("event-form").classList.remove("hidden");

    setTimeout(() => {
      document.getElementById("event-name").focus();
    }, 100);
  }

  document.querySelectorAll(".user-btn").forEach((button) => {
    button.addEventListener("click", function () {
      this.classList.toggle("active");
      currentUser = Array.from(document.querySelectorAll(".user-btn.active")).map(
        (btn) => btn.dataset.user
      );
      updateTheme();
      generateCalendar();
    });
  });

  document.getElementById("add-event-btn").addEventListener("click", async () => {
    const dateValue = document.getElementById("event-date").value;
    const dateParts = dateValue.match(/(\d+)년\s+(\d+)월\s+(\d+)일/);
    if (!dateParts) {
      alert("날짜 형식이 올바르지 않습니다.");
      return;
    }
    const year = dateParts[1];
    const month = dateParts[2].padStart(2, "0");
    const day = dateParts[3].padStart(2, "0");
    const dateKey = `${year}-${month}-${day}`;

    const name = document.getElementById("event-name").value.trim();
    if (!name) {
      alert("일정 이름을 입력해주세요.");
      return;
    }

    if (!events[dateKey]) events[dateKey] = [];

    const isGoeunActive = document.querySelector(".user-btn.goeun").classList.contains("active");
    const isHeesooActive = document.querySelector(".user-btn.heesoo").classList.contains("active");

    let userToSave = null;
    if (isGoeunActive && isHeesooActive) {
      userToSave = "both";
    } else if (isGoeunActive) {
      userToSave = "goeun";
    } else if (isHeesooActive) {
      userToSave = "heesoo";
    } else {
      alert("일정을 추가할 사용자를 선택해주세요.");
      return;
    }

    const newEvent = { name, user: userToSave };
    events[dateKey].push(newEvent);

    const cleanedEvents = cleanEvents(events);
    await saveEventToServer(cleanedEvents);
    events = cleanedEvents;
    generateCalendar();
    document.getElementById("event-form").classList.add("hidden");
  });

  document.getElementById("close-event-form").addEventListener("click", () => {
    document.getElementById("event-form").classList.add("hidden");
  });

  window.changeMonth = function (delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    generateCalendar();
  };

  function openContextMenu(x, y, dateStr) {
    closeContextMenu();
    const menu = document.createElement("div");
    menu.id = "context-menu";
    menu.style.top = y + "px";
    menu.style.left = x + "px";
    menu.style.position = "absolute";
    menu.style.backgroundColor = "#fff";
    menu.style.border = "1px solid #ccc";
    menu.style.padding = "5px";
    menu.style.zIndex = 1000;
    menu.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
    menu.style.borderRadius = "4px";
    menu.style.minWidth = "100px";

    const deleteOption = document.createElement("div");
    deleteOption.textContent = "일정 전체 삭제";
    deleteOption.style.cursor = "pointer";
    deleteOption.style.padding = "5px";
    deleteOption.addEventListener("click", async () => {
      if (confirm(`${dateStr}의 모든 일정을 삭제할까요?`)) {
        delete events[dateStr];

        try {
          await deleteDoc(doc(db, "events", dateStr)); // 이 부분이 수정된 핵심!
        } catch (err) {
          console.error("문서 삭제 실패:", err);
        }

        generateCalendar();
      }
      closeContextMenu();
    });
    menu.appendChild(deleteOption);

    document.body.appendChild(menu);

    menu.style.display = "block";

    setTimeout(() => {
      document.addEventListener("click", closeContextMenu, { once: true });
    }, 0);
  }

  function openEventContextMenu(x, y, dateStr, eventIndex) {
    closeContextMenu();
    const menu = document.createElement("div");
    menu.id = "context-menu";
    menu.style.top = y + "px";
    menu.style.left = x + "px";
    menu.style.position = "absolute";
    menu.style.backgroundColor = "#fff";
    menu.style.border = "1px solid #ccc";
    menu.style.padding = "5px";
    menu.style.zIndex = 1000;
    menu.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
    menu.style.borderRadius = "4px";
    menu.style.minWidth = "100px";

    const editOption = document.createElement("div");
    editOption.textContent = "수정";
    editOption.style.cursor = "pointer";
    editOption.style.padding = "5px";
    editOption.addEventListener("click", () => {
      const event = events[dateStr][eventIndex];
      const [year, month, day] = dateStr.split("-");

      document.getElementById("event-date").value = `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
      document.getElementById("event-name").value = event.name;
      document.getElementById("event-form").classList.remove("hidden");

      editingDateKey = dateStr;
      editingIndex = eventIndex;

      setTimeout(() => {
        document.getElementById("event-name").focus();
      }, 100);

      closeContextMenu();
    });
    menu.appendChild(editOption);

    const deleteOption = document.createElement("div");
    deleteOption.textContent = "삭제";
    deleteOption.style.cursor = "pointer";
    deleteOption.style.padding = "5px";
    deleteOption.addEventListener("click", async () => {
      if (confirm("선택한 일정을 삭제할까요?")) {
        await deleteEventFromServer(dateStr, eventIndex);
      }
      closeContextMenu();
    });
    menu.appendChild(deleteOption);

    document.body.appendChild(menu);

    setTimeout(() => {
      document.addEventListener("click", closeContextMenu, { once: true });
    }, 0);
  }

  function closeContextMenu() {
    const existingMenu = document.getElementById("context-menu");
    if (existingMenu) existingMenu.remove();
  }

  fetchEventsFromServer();
});
