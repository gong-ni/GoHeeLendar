document.addEventListener("DOMContentLoaded", () => {
    let currentUser = [];
    let currentDate = new Date();
    let events = {};
    const serverUrl = "https://goheelendar.onrender.com";
  
    // 서버에서 일정 가져오기
    async function fetchEventsFromServer() {
      try {
        const res = await fetch(`${serverUrl}/events`);
        const data = await res.json();
        events = data;
        generateCalendar();
      } catch (err) {
        console.error("서버에서 데이터를 가져오는 데 실패함:", err);
      }
    }
  
    // 서버에 일정 저장하기
    async function saveEventToServer(eventsData) {
      try {
        await fetch(`${serverUrl}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventsData),
        });
      } catch (err) {
        console.error("서버에 데이터를 저장하는 데 실패함:", err);
        alert("서버 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    }
  
    // 빈 이벤트 필터링 함수
    function cleanEvents(eventsData) {
      const cleaned = {};
      for (const date in eventsData) {
        if (!Array.isArray(eventsData[date])) continue;
  
        const filteredEvents = eventsData[date].filter(
          (event) => event && event.name && event.user
        );
        if (filteredEvents.length > 0) {
          cleaned[date] = filteredEvents;
        }
      }
      return cleaned;
    }
  
    // 테마 업데이트 (사용자 버튼 상태 반영)
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
  
    // 달력 생성
    function generateCalendar() {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      document.getElementById("current-month").textContent = `${year}년 ${month + 1}월`;
  
      const calendar = document.getElementById("calendar");
      calendar.innerHTML = "";
  
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayOfMonth = new Date(year, month, 1).getDay();
  
      // 빈 칸 채우기 (월요일부터 시작)
      for (let i = 0; i < (firstDayOfMonth + 6) % 7; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.classList.add("empty-cell");
        calendar.appendChild(emptyCell);
      }
  
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${day
          .toString()
          .padStart(2, "0")}`;
  
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("calendar-day");
        dayDiv.dataset.date = dateStr;
        dayDiv.innerHTML = `<span class='date'>${day}</span>`;
        dayDiv.addEventListener("click", () => openAddEventForm(year, month + 1, day));
  
        if (events[dateStr]) {
          events[dateStr].forEach((event) => {
            const eventSpan = document.createElement("div");
            eventSpan.classList.add("event", event.user);
            eventSpan.textContent = event.name;
            dayDiv.appendChild(eventSpan);
          });
        }
  
        calendar.appendChild(dayDiv);
      }
    }
  
    // 일정 추가 폼 열기
    function openAddEventForm(year, month, day) {
      document.getElementById("event-date").value = `${year}년 ${month}월 ${day}일`;
      document.getElementById("event-name").value = "";
      document.getElementById("event-form").classList.remove("hidden");
  
      setTimeout(() => {
        document.getElementById("event-name").focus();
      }, 100);
    }
  
    // 사용자 버튼 클릭 이벤트
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
  
    // 일정 추가 버튼 클릭
    document.getElementById("add-event-btn").addEventListener("click", async () => {
      const dateValue = document.getElementById("event-date").value;
      const name = document.getElementById("event-name").value.trim();
  
      if (!name) {
        alert("일정명을 입력하세요.");
        return;
      }
      if (currentUser.length === 0) {
        alert("사용자를 선택하세요.");
        return;
      }
  
      // dateValue가 "YYYY년 M월 D일" 형태니까 YYYY-MM-DD로 변환
      const [y, m, d] = dateValue.match(/\d+/g);
      const dateKey = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  
      // events 객체에 배열이 없으면 생성
      if (!events[dateKey]) {
        events[dateKey] = [];
      }
  
      // 현재 선택된 사용자들 모두에 대해 일정 추가
      currentUser.forEach((user) => {
        events[dateKey].push({ name, user });
      });
  
      // 빈 이벤트 정리 후 서버 저장
      try {
        const cleanedEvents = cleanEvents(events);
        await saveEventToServer(cleanedEvents);
        events = cleanedEvents; // 서버 저장 후 클린된 이벤트로 갱신
      } catch (err) {
        // alert 이미 saveEventToServer에서 처리됨
        return;
      }
  
      generateCalendar();
      document.getElementById("event-form").classList.add("hidden");
    });
  
    // 폼 닫기 버튼
    document.getElementById("close-event-form").addEventListener("click", () => {
      document.getElementById("event-form").classList.add("hidden");
    });
  
    // 월 변경 함수
    window.changeMonth = function (delta) {
      currentDate.setMonth(currentDate.getMonth() + delta);
      generateCalendar();
    };
  
    // 초기 실행
    fetchEventsFromServer();
  });
  