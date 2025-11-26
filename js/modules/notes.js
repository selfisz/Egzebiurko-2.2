// --- MODULE: NOTES ---

async function loadNotes() {
    const l = document.getElementById('notesList'); if(!l) return;
    l.innerHTML = '';
    const notes = await state.db.getAll('notes');
    notes.sort((a,b) => new Date(b.date) - new Date(a.date)); // Newest first

    if(notes.length === 0) { l.innerHTML = '<div class="text-center text-slate-400 mt-4 text-xs">Brak notatek.</div>'; return; }

    notes.forEach(n => {
        const div = document.createElement('div');
        div.className = `p-3 rounded-xl cursor-pointer border transition-all ${state.activeNoteId===n.id ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'}`;
        div.innerHTML = `
            <div class="font-bold text-sm text-slate-800 dark:text-white truncate">${n.title || 'Bez tytułu'}</div>
            <div class="text-[10px] text-slate-500 truncate mt-1">${n.content || '...'}</div>
            <div class="text-[10px] text-slate-400 mt-2 text-right">${new Date(n.date).toLocaleDateString()}</div>
        `;
        div.onclick = () => selectNote(n.id);
        l.appendChild(div);
    });
}

async function filterNotes(q) {
    const l = document.getElementById('notesList');
    if (!l) return;
    l.innerHTML = '';
    const notes = await state.db.getAll('notes');
    const filteredNotes = notes.filter(n =>
        (n.title && n.title.toLowerCase().includes(q.toLowerCase())) ||
        (n.content && n.content.toLowerCase().includes(q.toLowerCase()))
    );

    filteredNotes.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filteredNotes.length === 0) {
        l.innerHTML = '<div class="text-center text-slate-400 mt-4 text-xs">Brak pasujących notatek.</div>';
        return;
    }

    filteredNotes.forEach(n => {
        const div = document.createElement('div');
        div.className = `p-3 rounded-xl cursor-pointer border transition-all ${state.activeNoteId === n.id ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'}`;
        div.innerHTML = `
            <div class="font-bold text-sm text-slate-800 dark:text-white truncate">${n.title || 'Bez tytułu'}</div>
            <div class="text-[10px] text-slate-500 truncate mt-1">${n.content || '...'}</div>
            <div class="text-[10px] text-slate-400 mt-2 text-right">${new Date(n.date).toLocaleDateString()}</div>
        `;
        div.onclick = () => selectNote(n.id);
        l.appendChild(div);
    });
}

async function selectNote(id) {
    state.activeNoteId = id;
    const n = await state.db.get('notes', id);
    if(n) {
        document.getElementById('noteEditor').classList.remove('hidden');
        document.getElementById('noteEmptyState').classList.add('hidden');
        document.getElementById('noteTitle').value = n.title;
        document.getElementById('noteContent').value = n.content;
        document.getElementById('noteDate').innerText = new Date(n.date).toLocaleString();
        loadNotes(); // To update active state styling
    }
}

async function newNote() {
    const id = await state.db.add('notes', { title: '', content: '', date: new Date().toISOString() });
    selectNote(id);
    document.getElementById('noteTitle').focus();
}

async function saveNote() {
    if(!state.activeNoteId) return;
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    await state.db.put('notes', { id: state.activeNoteId, title, content, date: new Date().toISOString() });
    loadNotes();
}

async function deleteNote() {
    if(!state.activeNoteId) return;
    if(confirm("Usunąć notatkę?")) {
        await state.db.delete('notes', state.activeNoteId);
        state.activeNoteId = null;
        document.getElementById('noteEditor').classList.add('hidden');
        document.getElementById('noteEmptyState').classList.remove('hidden');
        loadNotes();
    }
}
