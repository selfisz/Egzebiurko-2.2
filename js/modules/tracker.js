const trackerModule = (() => {
    let currentCaseId = null;
    let cases = [];
    let isArchivedView = false;
    let currentDate = new Date();
    const STORE_NAME = 'tracker';

    async function getDB() {
        if (!state.db) await initDB();
        return state.db;
    }

    async function getAllCases() {
        const db = await getDB();
        return db.transaction(STORE_NAME).store.getAll();
    }

    async function getCase(id) {
        const db = await getDB();
        return db.transaction(STORE_NAME).store.get(id);
    }

    async function saveCaseToDB(caseData) {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        await tx.store.put(caseData);
        await tx.done;
        return caseData;
    }

    async function deleteCaseFromDB(id) {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        await tx.store.delete(id);
        await tx.done;
    }

    function createCaseBinder(caseData) {
        const statusLabels = { new: 'Nowa', 'in-progress': 'W toku', finished: 'Zakończona' };
        
        const urgentStyle = caseData.urgent ? 'border-red-200 dark:border-red-700' : 'border-slate-200 dark:border-slate-700';
        
        const daysRemaining = Math.ceil((new Date(caseData.date) - new Date()) / (1000 * 60 * 60 * 24));
        let deadlineText = '';
        if (daysRemaining < 0) deadlineText = `<span class="font-bold text-red-500">${Math.abs(daysRemaining)} dni po terminie</span>`;
        else if (daysRemaining === 0) deadlineText = `<span class="font-bold text-orange-500">Termin dzisiaj</span>`;
        else deadlineText = `${daysRemaining} dni`;

        const favoriteIcon = `<i data-lucide="star" class="${caseData.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'} hover:text-yellow-400" onclick="event.stopPropagation(); trackerModule.toggleFavorite(${caseData.id})"></i>`;

        return `
            <div
                class="case-binder flex items-center p-3 rounded-xl border ${urgentStyle} bg-white dark:bg-slate-800 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 cursor-pointer transition-all"
            >
                <div class="flex-1 min-w-0" onclick="trackerModule.openCase(${caseData.id})">
                    <div class="flex items-center gap-3">
                        <div class="font-bold text-slate-800 dark:text-white truncate">${caseData.no}</div>
                        <div class="text-xs text-slate-400 font-mono">${caseData.unp || ''}</div>
                    </div>
                    <div class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">${caseData.debtor || 'Brak danych zobowiązanego'}</div>
                </div>
                <div class="flex items-center gap-4 text-xs text-right ml-4">
                    <div class="w-24">
                        <div class="font-bold text-slate-600 dark:text-slate-300">${new Date(caseData.date).toLocaleDateString()}</div>
                        <div class="text-[10px] text-slate-400">${deadlineText}</div>
                    </div>
                    <div class="w-20 px-2 py-1 text-center font-bold rounded bg-slate-50 dark:bg-opacity-20 text-slate-600">${statusLabels[caseData.status]}</div>
                    ${favoriteIcon}
                </div>
            </div>
        `;
    }

    function renderFullTracker(filter = '') {
        const listEl = document.getElementById('tracker-list');
        const countEl = document.getElementById('tracker-case-count');
        if (!listEl || !countEl) return;

        const filteredCases = cases.filter(c => {
            return c.archived === isArchivedView;
        }).filter(c => {
            if (!filter) return true;
            const searchTerm = filter.toLowerCase();
            return Object.values(c).some(val =>
                String(val).toLowerCase().includes(searchTerm)
            );
        });

        const sortMethod = document.getElementById('trSort').value;
        filteredCases.sort((a, b) => {
            if (a.urgent !== b.urgent) return b.urgent - a.urgent; // Urgent cases first
            switch (sortMethod) {
                case 'deadline': return new Date(a.date) - new Date(b.date);
                case 'added': return new Date(b.createdAt) - new Date(a.createdAt);
                case 'no': return a.no.localeCompare(b.no);
                default: return 0;
            }
        });
        
        listEl.innerHTML = filteredCases.length ? filteredCases.map(createCaseBinder).join('') : '<div class="text-center text-slate-400 py-10">Brak spraw.</div>';
        countEl.textContent = `${filteredCases.length} spraw`;
        lucide.createIcons();
    }

    function openCase(id) {
        currentCaseId = id;
        const caseData = cases.find(c => c.id === id);
        if (!caseData) return;

        document.getElementById('trNo').value = caseData.no;
        document.getElementById('trUnp').value = caseData.unp;
        document.getElementById('trDebtor').value = caseData.debtor;
        document.getElementById('trDate').value = caseData.date;
        document.getElementById('trStatus').value = caseData.status;
        document.getElementById('trUrgent').checked = caseData.urgent;
        document.getElementById('trNote').value = caseData.note;
        document.getElementById('tracker-case-label').textContent = `Edycja: ${caseData.no}`;

        document.getElementById('tracker-grid-view').classList.add('-translate-x-full');
        document.getElementById('tracker-detail-view').classList.remove('translate-x-full');
    }

    async function toggleFavorite(caseId) {
        const caseData = cases.find(c => c.id === caseId);
        if (caseData) {
            caseData.isFavorite = !caseData.isFavorite;
            await saveCaseToDB(caseData);
            renderFullTracker(); // Re-render to show favorite status
            // Optionally, update favorites popover if it's open
        }
    }

    async function getNextCaseNumber() {
        const allCases = await getAllCases();
        const year = new Date().getFullYear().toString().slice(-2);
        const prefix1 = `1228-SEE-7/${year}`;
        const prefix2 = `1228-25-${year}`;

        let maxNum1 = 0;
        let maxNum2 = 0;

        allCases.forEach(c => {
            if (c.no.startsWith(prefix1)) {
                const num = parseInt(c.no.split('-').pop(), 10);
                if (num > maxNum1) maxNum1 = num;
            } else if (c.no.startsWith(prefix2)) {
                const num = parseInt(c.no.split('-').pop(), 10);
                if (num > maxNum2) maxNum2 = num;
            }
        });

        // Default to the most common prefix
        return `${prefix1}-${maxNum1 + 1}`;
    }

    function closeCase() {
        currentCaseId = null;
        document.getElementById('tracker-grid-view').classList.remove('-translate-x-full');
        document.getElementById('tracker-detail-view').classList.add('translate-x-full');
    }

    async function saveCase() {
        const status = document.getElementById('trStatus').value;
        const caseData = {
            id: currentCaseId,
            no: document.getElementById('trNo').value.trim(),
            unp: document.getElementById('trUnp').value.trim(),
            debtor: document.getElementById('trDebtor').value.trim(),
            date: document.getElementById('trDate').value,
            status: status,
            urgent: document.getElementById('trUrgent').checked,
            note: document.getElementById('trNote').value.trim(),
            archived: status === 'finished',
        };

        if (!caseData.no || !caseData.date) {
            alert('Numer sprawy i data są wymagane.');
            return;
        }

        if (currentCaseId) {
            const existingCase = cases.find(c => c.id === currentCaseId);
            caseData.createdAt = existingCase.createdAt;
        } else {
            caseData.id = Date.now();
            caseData.createdAt = new Date().toISOString();
        }

        await saveCaseToDB(caseData);

        closeCase();
        await loadCases();

        // Po załadowaniu danych sprawdzamy powiadomienia i widżety
        if (typeof checkNotifications === 'function') {
            checkNotifications();
        }
        if (typeof renderDashboardWidgets === 'function') {
            renderDashboardWidgets();
        }
    }
    
    async function addNewCase() {
        currentCaseId = null;
        const nextCaseNumber = await getNextCaseNumber();
        const caseNoInput = document.getElementById('trNo');
        caseNoInput.value = nextCaseNumber;

        caseNoInput.ondblclick = async () => {
            const allCases = await getAllCases();
            const year = new Date().getFullYear().toString().slice(-2);
            const prefix2 = `1228-25-${year}`;
            let maxNum2 = 0;
            allCases.forEach(c => {
                if (c.no.startsWith(prefix2)) {
                    const num = parseInt(c.no.split('-').pop(), 10);
                    if (num > maxNum2) maxNum2 = num;
                }
            });
            caseNoInput.value = `${prefix2}-${maxNum2 + 1}`;
        };

        document.getElementById('trUnp').value = '';
        document.getElementById('trDebtor').value = '';
        document.getElementById('trDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('trStatus').value = 'new';
        document.getElementById('trUrgent').checked = false;
        document.getElementById('trNote').value = '';
        document.getElementById('tracker-case-label').textContent = 'Nowa Sprawa';

        document.getElementById('tracker-grid-view').classList.add('-translate-x-full');
        document.getElementById('tracker-detail-view').classList.remove('translate-x-full');
    }

    function showArchived(show) {
        isArchivedView = show;
        const archiveBtn = document.getElementById('archiveBtn');
        if (show) {
            archiveBtn.textContent = 'Aktywne';
            archiveBtn.onclick = () => showArchived(false);
        } else {
            archiveBtn.textContent = 'Archiwum';
            archiveBtn.onclick = () => showArchived(true);
        }
        renderFullTracker();
    }

    function openReminderModal(date) {
        document.getElementById('reminderDateInput').value = date;
        document.getElementById('reminderDateDisplay').textContent = new Date(date).toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('reminderModal').classList.remove('hidden');
    }

    function closeReminderModal() {
        document.getElementById('reminderModal').classList.add('hidden');
    }

    function renderCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        const calendarMonthEl = document.getElementById('calendarMonth');
        if (!calendarGrid || !calendarMonthEl) return;

        calendarGrid.innerHTML = '';
        calendarMonthEl.textContent = currentDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const daysInMonth = lastDay.getDate();
        let startDay = firstDay.getDay();
        startDay = (startDay === 0) ? 6 : startDay - 1;

        ['PN', 'WT', 'ŚR', 'CZ', 'PT', 'SB', 'ND'].forEach(day => {
            calendarGrid.innerHTML += `<div class="font-bold text-slate-400">${day}</div>`;
        });
        
        for (let i = 0; i < startDay; i++) calendarGrid.innerHTML += '<div></div>';

        const reminders = JSON.parse(localStorage.getItem('tracker_reminders') || '{}');

        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            dayEl.textContent = i;
            dayEl.className = 'p-1 cursor-pointer rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors relative';

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            dayEl.onclick = () => openReminderModal(dateStr);

            const today = new Date();
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayEl.classList.add('bg-indigo-600', 'text-white', 'font-bold');
            }

            const casesOnDay = cases.filter(c => {
                const caseDate = new Date(c.date);
                return caseDate.getDate() === i && caseDate.getMonth() === month && caseDate.getFullYear() === year;
            });

            if (casesOnDay.length) {
                const dot = document.createElement('div');
                dot.className = 'absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full';
                dot.classList.add(caseData.urgent ? 'bg-red-500' : 'bg-blue-500');
                dayEl.appendChild(dot);
            }

            if (reminders[dateStr]) {
                const reminderDot = document.createElement('div');
                reminderDot.className = 'absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-green-500';
                dayEl.appendChild(reminderDot);
            }

            calendarGrid.appendChild(dayEl);
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

    async function saveReminder() {
        const date = document.getElementById('reminderDateInput').value;
        const text = document.getElementById('reminderText').value.trim();
        if (!text) return;

        let reminders = JSON.parse(localStorage.getItem('tracker_reminders') || '{}');
        if (!reminders[date]) reminders[date] = [];
        reminders[date].push(text);
        localStorage.setItem('tracker_reminders', JSON.stringify(reminders));

        closeReminderModal();
        renderCalendar();
    }

    function changeMonth(offset) {
        currentDate.setMonth(currentDate.getMonth() + offset);
        renderCalendar();
    }

    async function loadCases() {
        cases = await getAllCases();
        renderFullTracker();
        renderCalendar();
    }

    async function initTracker() {
        await loadCases();
        document.getElementById('trSort').addEventListener('change', () => renderFullTracker());
        document.getElementById('trackerSearch').addEventListener('input', (e) => renderFullTracker(e.target.value));
        document.getElementById('save-case-btn').addEventListener('click', saveCase);
        showArchived(false); // Reset to default view
    }

    return {
        initTracker,
        openCase,
        closeCase,
        saveCase,
        addNewCase,
        showArchived,
        changeMonth,
        renderFullTracker,
        toggleFavorite,
        openReminderModal,
        closeReminderModal,
        saveReminder,
    };
})();
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
