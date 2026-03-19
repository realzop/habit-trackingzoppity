const MOOD_EMOJIS = ['', '😞', '😐', '🙂', '😊', '🤩'];
const MOOD_COLORS = ['', '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#00d4ff'];

async function renderDashboard() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="spinner" style="margin:40px auto;display:block"></div>';

    try {
        const [habits, todayData, todayNote] = await Promise.all([
            API.getHabitList(),
            API.getHabitsToday(),
            API.getTodayNote()
        ]);

        const activeHabits = habits.filter(h => h.active);
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        let completedCount = 0;
        activeHabits.forEach(h => {
            const val = todayData[h.key];
            if (h.key === 'mood') {
                if (val && parseInt(val) > 0) completedCount++;
            } else if (h.habit_type === 'boolean') {
                if (val === 'true') completedCount++;
            } else if (h.habit_type === 'number') {
                if (val && val !== '' && val !== '0') completedCount++;
            }
        });
        const pct = activeHabits.length > 0 ? Math.round((completedCount / activeHabits.length) * 100) : 0;

        app.innerHTML = `
            <div class="page-header">
                <div class="date-display">${dateStr}</div>
            </div>
            <div class="progress-container">
                <div class="progress-text">${completedCount}/${activeHabits.length} habits tracked &mdash; ${pct}%</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width:${pct}%"></div>
                </div>
            </div>
            <div id="habits-list"></div>
            <div class="card notes-card" style="margin-top:20px">
                <div class="notes-header">
                    <span class="notes-title">Daily Note</span>
                    <select id="note-tag" class="select note-tag-select">
                        <option value="Personal" ${(todayNote.tag || '') === 'Personal' ? 'selected' : ''}>Personal</option>
                        <option value="Bug" ${todayNote.tag === 'Bug' ? 'selected' : ''}>Bug</option>
                        <option value="Idea" ${todayNote.tag === 'Idea' ? 'selected' : ''}>Idea</option>
                        <option value="Custom" ${todayNote.tag && !['Personal','Bug','Idea'].includes(todayNote.tag) ? 'selected' : ''}>Custom</option>
                    </select>
                    <input type="text" id="note-tag-custom" class="input note-tag-custom ${todayNote.tag && !['Personal','Bug','Idea'].includes(todayNote.tag) ? '' : 'hidden'}" placeholder="Custom tag" value="${todayNote.tag && !['Personal','Bug','Idea'].includes(todayNote.tag) ? todayNote.tag : ''}">
                </div>
                <textarea id="note-text" class="input note-textarea" placeholder="Write a note for today..." rows="3">${todayNote.note || ''}</textarea>
                <div class="note-actions">
                    <span id="note-status" class="note-status"></span>
                </div>
            </div>
        `;

        const list = document.getElementById('habits-list');
        const state = { ...todayData };

        activeHabits.forEach(h => {
            const card = document.createElement('div');
            card.className = 'card habit-card';

            if (h.key === 'mood') {
                renderMoodCard(card, h, state);
            } else if (h.habit_type === 'boolean') {
                renderBooleanCard(card, h, state);
            } else if (h.habit_type === 'number') {
                renderNumberCard(card, h, state);
            }

            list.appendChild(card);
        });

        function updateCompletion() {
            let c = 0;
            activeHabits.forEach(h => {
                const val = state[h.key];
                if (h.key === 'mood') {
                    if (val && parseInt(val) > 0) c++;
                } else if (h.habit_type === 'boolean') {
                    if (val === 'true') c++;
                } else if (h.habit_type === 'number') {
                    if (val && val !== '' && val !== '0') c++;
                }
            });
            const p = activeHabits.length > 0 ? Math.round((c / activeHabits.length) * 100) : 0;
            document.querySelector('.progress-text').textContent = `${c}/${activeHabits.length} habits tracked — ${p}%`;
            document.querySelector('.progress-fill').style.width = `${p}%`;
        }

        async function save() {
            const entries = Object.entries(state).map(([k, v]) => ({
                habit_key: k, value: String(v)
            }));
            await API.saveHabitsToday(entries);
            updateCompletion();
        }

        function renderBooleanCard(card, h, state) {
            const isOn = state[h.key] === 'true';
            card.innerHTML = `
                <div class="habit-info">
                    <span class="habit-emoji">${h.emoji || ''}</span>
                    <span class="habit-name">${h.name}</span>
                </div>
                <div class="habit-toggle ${isOn ? 'on' : ''}"></div>
            `;
            if (isOn) card.classList.add('completed');

            card.addEventListener('click', async () => {
                const newVal = state[h.key] !== 'true';
                state[h.key] = String(newVal);
                card.querySelector('.habit-toggle').classList.toggle('on', newVal);
                card.classList.toggle('completed', newVal);
                await save();
            });
        }

        function renderNumberCard(card, h, state) {
            const val = state[h.key] || '';
            const hasVal = val !== '' && val !== '0';
            card.innerHTML = `
                <div class="habit-info">
                    <span class="habit-emoji">${h.emoji || ''}</span>
                    <span class="habit-name">${h.name}</span>
                </div>
                <div class="habit-number">
                    ${h.goal ? `<span class="habit-goal">Goal: ${h.goal}</span>` : ''}
                    <input type="number" min="0" max="100" value="${val}" placeholder="0">
                </div>
            `;
            if (hasVal) card.classList.add('completed');

            const input = card.querySelector('input');
            let debounce;
            input.addEventListener('input', () => {
                state[h.key] = input.value;
                card.classList.toggle('completed', input.value !== '' && input.value !== '0');
                clearTimeout(debounce);
                debounce = setTimeout(save, 500);
            });
            input.addEventListener('click', (e) => e.stopPropagation());
        }

        function renderMoodCard(card, h, state) {
            const val = parseInt(state[h.key]) || 0;
            card.innerHTML = `
                <div class="habit-info">
                    <span class="habit-emoji">${h.emoji || ''}</span>
                    <span class="habit-name">${h.name}</span>
                </div>
                <div class="mood-selector">
                    ${[1,2,3,4,5].map(i => `
                        <button class="mood-btn ${val === i ? 'selected' : ''}"
                                data-mood="${i}"
                                style="${val === i ? `border-color:${MOOD_COLORS[i]};background:${MOOD_COLORS[i]}22` : ''}">
                            ${MOOD_EMOJIS[i]}
                        </button>
                    `).join('')}
                </div>
            `;
            if (val > 0) card.classList.add('completed');

            card.querySelectorAll('.mood-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const mood = parseInt(btn.dataset.mood);
                    state[h.key] = String(mood);
                    card.querySelectorAll('.mood-btn').forEach(b => {
                        const m = parseInt(b.dataset.mood);
                        b.classList.toggle('selected', m === mood);
                        b.style.borderColor = m === mood ? MOOD_COLORS[m] : '';
                        b.style.background = m === mood ? MOOD_COLORS[m] + '22' : '';
                    });
                    card.classList.add('completed');
                    await save();
                });
            });
        }

        // Daily note save logic
        const noteTag = document.getElementById('note-tag');
        const noteCustom = document.getElementById('note-tag-custom');
        const noteText = document.getElementById('note-text');
        const noteStatus = document.getElementById('note-status');

        noteTag.addEventListener('change', () => {
            noteCustom.classList.toggle('hidden', noteTag.value !== 'Custom');
            saveNote();
        });

        let noteDebounce;
        noteText.addEventListener('input', () => {
            clearTimeout(noteDebounce);
            noteDebounce = setTimeout(saveNote, 800);
        });
        noteCustom.addEventListener('input', () => {
            clearTimeout(noteDebounce);
            noteDebounce = setTimeout(saveNote, 800);
        });

        async function saveNote() {
            const text = noteText.value.trim();
            if (!text) return;
            const tag = noteTag.value === 'Custom' ? (noteCustom.value.trim() || 'Custom') : noteTag.value;
            try {
                await API.saveNote({ note: text, tag });
                noteStatus.textContent = 'Saved';
                noteStatus.className = 'note-status saved';
                setTimeout(() => { noteStatus.textContent = ''; }, 2000);
            } catch (e) {
                noteStatus.textContent = 'Error saving';
                noteStatus.className = 'note-status error';
            }
        }

    } catch (e) {
        if (e.message !== 'Not authenticated') {
            app.innerHTML = `<div class="msg msg-error">${e.message}</div>`;
        }
    }
}
