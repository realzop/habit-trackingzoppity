async function renderHistory() {
    const app = document.getElementById('app');
    let currentDate = new Date();

    async function render() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
        const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        app.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">History</h1>
            </div>
            <div class="card">
                <div class="cal-nav">
                    <button class="cal-nav-btn" id="cal-prev">&larr;</button>
                    <span class="cal-month">${monthName}</span>
                    <button class="cal-nav-btn" id="cal-next">&rarr;</button>
                </div>
                <div class="calendar" id="calendar">
                    <div class="cal-header">Mon</div>
                    <div class="cal-header">Tue</div>
                    <div class="cal-header">Wed</div>
                    <div class="cal-header">Thu</div>
                    <div class="cal-header">Fri</div>
                    <div class="cal-header">Sat</div>
                    <div class="cal-header">Sun</div>
                </div>
            </div>
        `;

        try {
            const [history, habits] = await Promise.all([
                API.getHistory(monthStr),
                API.getHabitList()
            ]);

            const activeHabits = habits.filter(h => h.active);
            const cal = document.getElementById('calendar');
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const today = new Date();

            // Monday-based: getDay() returns 0=Sun, we want 0=Mon
            let startDow = firstDay.getDay() - 1;
            if (startDow < 0) startDow = 6;

            for (let i = 0; i < startDow; i++) {
                const empty = document.createElement('div');
                empty.className = 'cal-day empty';
                cal.appendChild(empty);
            }

            for (let d = 1; d <= lastDay.getDate(); d++) {
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const dayEl = document.createElement('div');
                dayEl.className = 'cal-day';
                dayEl.textContent = d;

                const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
                if (isToday) dayEl.classList.add('today');

                const dayData = history[dateKey];
                if (dayData && activeHabits.length > 0) {
                    let completed = 0;
                    activeHabits.forEach(h => {
                        const val = dayData[h.key];
                        if (h.key === 'mood') {
                            if (val && parseInt(val) > 0) completed++;
                        } else if (h.habit_type === 'boolean') {
                            if (val === 'true') completed++;
                        } else if (h.habit_type === 'number') {
                            if (val && val !== '' && val !== '0') completed++;
                        }
                    });
                    const pct = completed / activeHabits.length;
                    const color = pctToColor(pct);
                    dayEl.style.background = color;
                    dayEl.style.color = pct > 0.5 ? '#fff' : 'var(--text)';
                } else {
                    dayEl.style.background = 'var(--bg)';
                }

                dayEl.addEventListener('click', () => {
                    if (dayData) showDayModal(dateKey, dayData, habits);
                });

                cal.appendChild(dayEl);
            }
        } catch (e) {
            if (e.message !== 'Not authenticated') {
                app.innerHTML += `<div class="msg msg-error">${e.message}</div>`;
            }
        }

        document.getElementById('cal-prev').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            render();
        });
        document.getElementById('cal-next').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            render();
        });
    }

    await render();
}

function pctToColor(pct) {
    if (pct === 0) return 'rgba(255,255,255,0.03)';
    // Red to yellow to green
    const r = pct < 0.5 ? 220 : Math.round(220 - (pct - 0.5) * 2 * 180);
    const g = pct < 0.5 ? Math.round(60 + pct * 2 * 140) : 200;
    const b = 40;
    return `rgba(${r},${g},${b},0.6)`;
}

function showDayModal(dateKey, data, habits) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');

    const dateLabel = new Date(dateKey + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const habitMap = {};
    habits.forEach(h => { habitMap[h.key] = h; });

    let entries = '';
    for (const [key, val] of Object.entries(data)) {
        const h = habitMap[key];
        if (!h) continue;
        let display;
        if (h.key === 'mood') {
            const m = parseInt(val);
            display = MOOD_EMOJIS[m] || val;
        } else if (h.habit_type === 'boolean') {
            display = val === 'true' ? '&#10003;' : '&#10007;';
        } else {
            display = val;
        }
        entries += `<div class="modal-habit"><span>${h.emoji || ''} ${h.name}</span><span>${display}</span></div>`;
    }

    content.innerHTML = `
        <h3>${dateLabel}</h3>
        ${entries || '<p style="color:var(--text-dim)">No data for this day</p>'}
        <button class="btn btn-secondary modal-close" id="modal-close-btn">Close</button>
    `;

    overlay.classList.remove('hidden');

    document.getElementById('modal-close-btn').addEventListener('click', () => {
        overlay.classList.add('hidden');
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.add('hidden');
    });
}
