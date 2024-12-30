let currentDate = new Date(); // 현재 날짜
let events = {}; // 날짜별 일정 저장

// 월을 변경하는 함수
function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    generateCalendar();
}

// 현재 날짜에 해당하는 달력을 생성하는 함수
function generateCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0부터 시작하는 월
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // 해당 월의 마지막 날짜
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 해당 월의 첫 번째 날의 요일

    // 첫 번째 날을 월요일부터 시작하도록 조정
    const adjustedFirstDay = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1; // 일요일(0)을 6으로 바꾸고 나머지는 1일씩 뺌

    // 달력 헤더 업데이트
    const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
    document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;

    // 기존 달력 내용 지우기
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    // 첫 번째 날짜 앞에 빈 공간 추가
    for (let i = 0; i < adjustedFirstDay; i++) {
        const emptyCell = document.createElement('div');
        calendar.appendChild(emptyCell);
    }

    // 날짜 셀 추가
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day');
        dayDiv.dataset.date = `${year}-${month + 1}-${day}`;

        // 날짜 표시 (왼쪽 상단에 작게)
        const dateSpan = document.createElement('span');
        dateSpan.classList.add('date');
        dateSpan.textContent = day;
        dayDiv.appendChild(dateSpan);

        // 일정이 있는 경우 일정 표시
        const eventKey = `${year}-${month + 1}-${day}`;
        if (events[eventKey]) {
            const eventSpan = document.createElement('span');
            eventSpan.classList.add('event');
            eventSpan.textContent = events[eventKey];
            dayDiv.appendChild(eventSpan);
        }

        dayDiv.addEventListener('click', () => openAddEventForm(year, month + 1, day));
        calendar.appendChild(dayDiv);
    }
}

// 일정 추가 폼을 열기 위한 함수
function openAddEventForm(year, month, day) {
    const eventDate = `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
    document.getElementById('event-date').value = eventDate;
    document.getElementById('event-form').classList.remove('hidden');
}

// 일정 추가 폼을 닫는 함수
function closeAddEventForm() {
    document.getElementById('event-form').classList.add('hidden');
}

// 일정 추가 함수 (여기서는 알림만 보여줌)
function addEvent(event) {
    event.preventDefault();
    const date = document.getElementById('event-date').value;
    const name = document.getElementById('event-name').value;

    // 이벤트를 날짜별로 저장
    events[date] = name;

    // 달력을 다시 생성하여 일정 표시
    generateCalendar();
    closeAddEventForm();
}

// 페이지가 로드될 때 자동으로 달력 생성
window.onload = function() {
    generateCalendar();
};
