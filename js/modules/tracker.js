// --- MODULE: TRACKER ---

let currentCaseId = null;
let isArchivedView = false;
let currentFilter = { date: null, sort: 'deadline', search: '' };

async function initTracker() {
    await renderFullTracker();
    await renderCalendar();

    // Event listener for sorting
    const sortSelect = document.getElementById('trSort');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentFilter.sort = e.target.value;
            renderFullTracker();
        });
    }
    
    // Event listener for searching
    const searchInput = document.getElementById('trackerSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentFilter.search = e.target.value.toLowerCase();
            renderFullTracker();
        });
    }
}

function openCase(id) {
    currentCaseId = id;
    const gridView = document.getElementById('tracker-grid-view');
    const detailView = document.getElementById('tracker-detail-view');

    gridView.classList.add('-translate-x-full');
    detailView.classList.remove('translate-x-full');

    populateCaseDetails(id);
}

function closeCase() {
    currentCaseId = null;
    const gridView = document.getElementById('tracker-grid-view');
    const detailView = document.getElementById('tracker-detail-view');

    gridView.classList.remove('-translate-x-full');
    detailView.classList.add('translate-x-full');
}

async function populateCaseDetails(id) {
    const c = await state.db.get('cases', id);
    if (!c) return;

    document.getElementById('trNo').value = c.no || '';
    document.getElementById('trUnp').value = c.unp || '';
    document.getElementById('trDebtor').value = c.debtor || '';
    document.getElementById('trDate').value = c.date || '';
    document.getElementById('trStatus').value = c.status || 'new';
    document.getElementById('trPriority').value = c.priority || 'medium';
    document.getElementById('trNote').value = c.note || '';
    document.getElementById('tracker-case-label').innerText = `Edycja: ${c.no}`;
}

async function addNewCase() {
    const newCase = {
        no: '1228-SEE-7',
        date: new Date().toISOString().slice(0, 10),
        debtor: '',
        note: '',
        unp: '1228-25-',
        status: 'new',
        priority: 'medium',
        archived: false,
        lastModified: new Date().toISOString()
    };

    const newId = await state.db.add('cases', newCase);
    await renderFullTracker();
    openCase(newId);
}

async function saveCase() {
    if (!currentCaseId) return;

    const c = await state.db.get('cases', currentCaseId);
    if (!c) return;

    c.no = document.getElementById('trNo').value;
    c.unp = document.getElementById('trUnp').value;
    c.debtor = document.getElementById('trDebtor').value;
    c.date = document.getElementById('trDate').value;
    c.status = document.getElementById('trStatus').value;
    c.priority = document.getElementById('trPriority').value;
    c.note = document.getElementById('trNote').value;
    c.lastModified = new Date().toISOString();

    if (c.status === 'finished') {
        c.archived = true;
    } else {
        c.archived = false;
    }

    await state.db.put('cases', c);
    await renderFullTracker();
    closeCase();
}


async function renderFullTracker() {
    const list = document.getElementById('tracker-list');
    if (!list) return;
    list.innerHTML = '<div class="text-slate-400 p-4">Ładuję sprawy...</div>';

    const allCases = await state.db.getAll('cases');
    let filteredCases = allCases.filter(c => c.archived === isArchivedView);
    
    // Search filtering
    if (currentFilter.search) {
        filteredCases = filteredCases.filter(c => {
            const searchTerm = currentFilter.search;
            return (
                (c.no && c.no.toLowerCase().includes(searchTerm)) ||
                (c.unp && c.unp.toLowerCase().includes(searchTerm)) ||
                (c.debtor && c.debtor.toLowerCase().includes(searchTerm)) ||
                (c.note && c.note.toLowerCase().includes(searchTerm))
            );
        });
    }

    // Date filtering
    let casesToRender = filteredCases;
    if (currentFilter.date) {
        casesToRender = filteredCases.filter(c => {
            const caseDeadline = new Date(c.date);
            caseDeadline.setDate(caseDeadline.getDate() + 30);
            return caseDeadline.toISOString().slice(0,10) === currentFilter.date;
        });
    }

    // Sorting
    const proc = casesToRender.map(x => {
        const d = new Date(x.date);
        d.setDate(d.getDate() + 30);
        return { ...x, dl: d, left: Math.ceil((d - new Date()) / 86400000) };
    });

    const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
    if (currentFilter.sort === 'deadline') proc.sort((a, b) => a.left - b.left);
    else if (currentFilter.sort === 'added') proc.sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (currentFilter.sort === 'no') proc.sort((a, b) => a.no.localeCompare(b.no));
    else if (currentFilter.sort === 'priority') proc.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    list.innerHTML = '';
    
    if (proc.length === 0) {
        list.innerHTML = `<div class="text-slate-400 p-4 col-span-full text-center">Brak spraw.</div>`;
    } else {
        proc.forEach(c => list.appendChild(createCaseBinder(c)));
    }

    document.getElementById('tracker-case-count').innerText = `${proc.length} spraw`;
    if (window.lucide) lucide.createIcons();
}

function createCaseBinder(c) {
    const div = document.createElement('div');
    const daysLeft = c.left;

    let borderColor = 'border-slate-200 dark:border-slate-700';
    if (!c.archived) {
        if (daysLeft < 3) borderColor = 'border-red-500';
        else if (daysLeft < 8) borderColor = 'border-yellow-500';
    }

    const statusColors = {
        'new': 'bg-blue-100 text-blue-700',
        'in-progress': 'bg-amber-100 text-amber-700',
        'finished': 'bg-emerald-100 text-emerald-700'
    };
    const statusText = { 'new': 'Nowa', 'in-progress': 'W toku', 'finished': 'Zakończona' };
    const priorityIcons = { 'high': 'chevrons-up', 'medium': 'equal', 'low': 'chevrons-down' };
    const priorityColors = { 'high': 'text-red-500', 'medium': 'text-slate-400', 'low': 'text-green-500' };

    div.className = `relative flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer group border border-slate-200 dark:border-slate-700`;
    div.onclick = () => openCase(c.id);

    // Simulating a binder spine
    const binderSpine = document.createElement('div');
    binderSpine.className = `absolute left-0 top-0 bottom-0 w-2 rounded-l-lg ${borderColor.replace('border-', 'bg-')}`;
    div.appendChild(binderSpine);

    const content = document.createElement('div');
    content.className = "flex-1 pl-4 flex items-center justify-between";
    content.innerHTML = `
        <div class="flex items-center gap-4">
            <div class="flex-shrink-0 w-12 text-center">
                <div class="text-lg font-bold ${daysLeft < 3 ? 'text-red-500 animate-pulse' : 'text-slate-800 dark:text-white'}">${daysLeft}</div>
                <div class="text-[10px] text-slate-400 uppercase">Dni</div>
            </div>
            <div class="w-px h-10 bg-slate-200 dark:bg-slate-700"></div>
            <div>
                 <div class="font-bold text-sm text-slate-800 dark:text-white truncate group-hover:text-indigo-600">${c.no}</div>
                 <div class="text-xs text-slate-500 truncate">${c.debtor || 'Brak danych'}</div>
                 <div class="text-xs text-slate-400">UNP: ${c.unp || '-'}</div>
            </div>
        </div>
        <div class="flex items-center gap-4">
             <span class="text-[10px] px-3 py-1 rounded-full font-bold ${statusColors[c.status]}">${statusText[c.status]}</span>
             <i data-lucide="${priorityIcons[c.priority]}" size="18" class="${priorityColors[c.priority]}"></i>
             <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onclick="event.stopPropagation(); trackerModule.deleteCase(${c.id})" class="p-2 text-slate-400 hover:text-red-500 rounded-md"><i data-lucide="trash-2" size="16"></i></button>
                 <button onclick="event.stopPropagation(); trackerModule.toggleArchive(${c.id})" class="p-2 text-slate-400 hover:text-amber-500 rounded-md"><i data-lucide="${c.archived ? 'unarchive' : 'archive'}" size="16"></i></button>
            </div>
        </div>
    `;
    div.appendChild(content);
    return div;
}

async function deleteCase(id) {
    if (!confirm("Czy na pewno chcesz usunąć tę sprawę? Tej akcji nie można cofnąć.")) return;
    await state.db.delete('cases', id);
    await renderFullTracker();
    await renderCalendar();
}

async function toggleArchive(id) {
    const c = await state.db.get('cases', id);
    if (c) {
        c.archived = !c.archived;
        c.lastModified = new Date().toISOString();
        await state.db.put('cases', c);
        await renderFullTracker();
    }
}

function showArchived(show) {
    isArchivedView = show;
    const btn = document.getElementById('archiveBtn');
    if (show) {
        btn.innerText = 'Aktywne';
        btn.onclick = () => showArchived(false);
    } else {
        btn.innerText = 'Archiwum';
        btn.onclick = () => showArchived(true);
    }
    renderFullTracker();
}

// Calendar Logic
function changeMonth(d) {
    state.currentMonth += d;
    if (state.currentMonth > 11) { state.currentMonth = 0; state.currentYear++; }
    if (state.currentMonth < 0) { state.currentMonth = 11; state.currentYear--; }
    renderCalendar();
}

async function renderCalendar() {
    const m = state.currentMonth, y = state.currentYear;
    const monthNames = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
    const elMonth = document.getElementById('calendarMonth');
    if (elMonth) elMonth.innerText = `${monthNames[m]} ${y}`;

    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    let startOffset = firstDay === 0 ? 6 : firstDay - 1;

    ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].forEach(d => {
        const h = document.createElement('div');
        h.className = "text-[10px] font-bold text-slate-400 uppercase mb-1";
        h.innerText = d;
        grid.appendChild(h);
    });

    for (let i = 0; i < startOffset; i++) grid.appendChild(document.createElement('div'));

    const cases = await state.db.getAll('cases');
    const today = new Date();

    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const expiringCases = cases.filter(c => {
            const deadline = new Date(c.date);
            deadline.setDate(deadline.getDate() + 30);
            return deadline.toISOString().slice(0, 10) === dateStr && !c.archived;
        });

        const d = document.createElement('div');
        d.className = "calendar-day dark:text-slate-200 p-1 flex items-center justify-center cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-full transition-colors relative aspect-square";
        if (today.getDate() === i && today.getMonth() === m && today.getFullYear() === y) d.classList.add('bg-indigo-500', 'text-white', 'font-bold');
        if (currentFilter.date === dateStr) d.classList.add('ring-2', 'ring-indigo-500');

        d.innerHTML = `<span>${i}</span>`;
        if (expiringCases.length > 0) d.innerHTML += `<div class="absolute bottom-0 w-1.5 h-1.5 bg-red-500 rounded-full"></div>`;

        d.onclick = () => filterByDate(dateStr);
        grid.appendChild(d);
    }
}

function filterByDate(dateStr) {
    if (currentFilter.date === dateStr) {
        currentFilter.date = null; // Toggle off
    } else {
        currentFilter.date = dateStr;
    }
    renderCalendar();
    renderFullTracker();
}


// --- MODULE EXPORT ---
window.trackerModule = {
    initTracker,
    addNewCase,
    openCase,
    closeCase,
    saveCase,
    deleteCase,
    toggleArchive,
    showArchived,
    changeMonth
};
