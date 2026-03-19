async function renderNotes() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="spinner" style="margin:40px auto;display:block"></div>';

    try {
        const notes = await API.getNotes();

        // Collect unique tags
        const allTags = ['all', ...new Set(notes.map(n => n.tag || 'Untagged'))];

        app.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Notes</h1>
                <p class="page-subtitle">${notes.length} note${notes.length !== 1 ? 's' : ''} total</p>
            </div>
            <div class="notes-toolbar">
                <div class="notes-filter">
                    <label class="input-label" style="margin-bottom:0;margin-right:8px">Filter</label>
                    <select id="notes-filter-tag" class="select">
                        ${allTags.map(t => `<option value="${t}">${t === 'all' ? 'All Tags' : t}</option>`).join('')}
                    </select>
                </div>
                <div class="notes-export">
                    <button id="export-csv" class="btn btn-secondary notes-export-btn">Export CSV</button>
                    <button id="export-txt" class="btn btn-secondary notes-export-btn">Export TXT</button>
                </div>
            </div>
            <div id="notes-list"></div>
        `;

        function renderNotesList(filter) {
            const filtered = filter === 'all' ? notes : notes.filter(n => (n.tag || 'Untagged') === filter);
            const list = document.getElementById('notes-list');
            if (filtered.length === 0) {
                list.innerHTML = '<div class="card" style="text-align:center;color:var(--text-dim);padding:32px">No notes found</div>';
                return;
            }
            list.innerHTML = filtered.map(n => `
                <div class="card note-entry">
                    <div class="note-entry-header">
                        <span class="note-entry-date">${formatNoteDate(n.log_date)}</span>
                        <span class="note-entry-tag tag-${(n.tag || 'Untagged').toLowerCase().replace(/[^a-z]/g, '')}">${n.tag || 'Untagged'}</span>
                    </div>
                    <div class="note-entry-content">${escapeHtml(n.note)}</div>
                </div>
            `).join('');
        }

        renderNotesList('all');

        document.getElementById('notes-filter-tag').addEventListener('change', (e) => {
            renderNotesList(e.target.value);
        });

        document.getElementById('export-csv').addEventListener('click', async () => {
            const tag = document.getElementById('notes-filter-tag').value;
            await downloadExport(tag, 'csv');
        });

        document.getElementById('export-txt').addEventListener('click', async () => {
            const tag = document.getElementById('notes-filter-tag').value;
            await downloadExport(tag, 'txt');
        });

    } catch (e) {
        if (e.message !== 'Not authenticated') {
            app.innerHTML = `<div class="msg msg-error">${e.message}</div>`;
        }
    }
}

function formatNoteDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
}

async function downloadExport(tag, format) {
    try {
        const res = await API.exportNotes(tag, format);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `daycore_notes.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error('Export failed:', e);
    }
}
