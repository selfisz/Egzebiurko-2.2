// --- TRACKER MODULE ---

const trackerModule = (() => {
    let currentCaseId = null;
    let cases = [];
    let isArchivedView = false;
    let currentDate = new Date();
    let currentFilter = { date: null };
    const STORE_NAME = 'tracker';

    async function getDB() {
        if (!state.db) await initDB();
        return state.db;
    }

    async function getAllCases() {
        const db = await getDB();
        return db.transaction(STORE_NAME).store.getAll();
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
            <div class="case-binder flex items-center p-3 rounded-xl border ${urgentStyle} bg-white dark:bg-slate-800 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 cursor-pointer transition-all">
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
                    <div class="w-20 px-2 py-1 text-center font-bold rounded bg-slate-50 dark:bg-opacity-20 text-slate-600">${statusLabels[caseData.status] || 'Nowa'}</div>
                    ${favoriteIcon}
                </div>
            </div>
        `;
    }

    function renderFullTracker(filter = '') {
        const listEl = document.getElementById('tracker-list');
        const countEl = document.getElementById('tracker-case-count');
        if (!listEl || !countEl) return;

        let filteredCases = cases.filter(c => c.archived === isArchivedView);
        
        // Filter by date if set
        if (currentFilter.date) {
            filteredCases = filteredCases.filter(c => c.date === currentFilter.date);
        }
        
        // Filter by search term
        if (filter) {
            const searchTerm = filter.toLowerCase();
            filteredCases = filteredCases.filter(c =>
                Object.values(c).some(val => String(val).toLowerCase().includes(searchTerm))
            );
        }

        const sortEl = document.getElementById('trSort');
        const sortMethod = sortEl ? sortEl.value : 'deadline';
        filteredCases.sort((a, b) => {
            if (a.urgent !== b.urgent) return b.urgent - a.urgent;
            switch (sortMethod) {
                case 'deadline': return new Date(a.date) - new Date(b.date);
                case 'added': return new Date(b.createdAt) - new Date(a.createdAt);
                case 'no': return (a.no || '').localeCompare(b.no || '');
                default: return 0;
            }
        });
        
        listEl.innerHTML = filteredCases.length 
            ? filteredCases.map(createCaseBinder).join('') 
            : '<div class="text-center text-slate-400 py-10">Brak spraw.</div>';
        countEl.textContent = `${filteredCases.length} spraw`;
        if (window.lucide) lucide.createIcons();
    }

    function openCase(id) {
        currentCaseId = id;
        const caseData = cases.find(c => c.id === id);
        if (!caseData) return;

        document.getElementById('trNo').value = caseData.no || '';
        document.getElementById('trUnp').value = caseData.unp || '';
        document.getElementById('trDebtor').value = caseData.debtor || '';
        document.getElementById('trDate').value = caseData.date || '';
        document.getElementById('trStatus').value = caseData.status || 'new';
        document.getElementById('trUrgent').checked = caseData.urgent || false;
        document.getElementById('trNote').value = caseData.note || '';
        document.getElementById('tracker-case-label').textContent = `Edycja: ${caseData.no}`;

        document.getElementById('tracker-grid-view').classList.add('-translate-x-full');
        document.getElementById('tracker-detail-view').classList.remove('translate-x-full');
    }

    async function toggleFavorite(caseId) {
        const caseData = cases.find(c => c.id === caseId);
        if (caseData) {
            caseData.isFavorite = !caseData.isFavorite;
            await saveCaseToDB(caseData);
            renderFullTracker();
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
            if (c.no && c.no.startsWith(prefix1)) {
                const num = parseInt(c.no.split('-').pop(), 10);
                if (num > maxNum1) maxNum1 = num;
            } else if (c.no && c.no.startsWith(prefix2)) {
                const num = parseInt(c.no.split('-').pop(), 10);
                if (num > maxNum2) maxNum2 = num;
            }
        });

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
            caseData.createdAt = existingCase ? existingCase.createdAt : new Date().toISOString();
            caseData.isFavorite = existingCase ? existingCase.isFavorite : false;
        } else {
            caseData.id = Date.now();
            caseData.createdAt = new Date().toISOString();
            caseData.isFavorite = false;
        }

        await saveCaseToDB(caseData);
        closeCase();
        await loadCases();

        if (typeof checkNotifications === 'function') checkNotifications();
        if (typeof renderDashboardWidgets === 'function') renderDashboardWidgets();
    }

    async function deleteCase() {
        if (!currentCaseId) return;
        if (!confirm('Czy na pewno usunąć tę sprawę?')) return;
        
        await deleteCaseFromDB(currentCaseId);
        closeCase();
        await loadCases();
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
                if (c.no && c.no.startsWith(prefix2)) {
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
        if (archiveBtn) {
            archiveBtn.textContent = show ? 'Aktywne' : 'Archiwum';
            archiveBtn.onclick = () => showArchived(!show);
        }
        renderFullTracker();
    }

    function openReminderModal(date) {
        const dateInput = document.getElementById('reminderDateInput');
        const dateDisplay = document.getElementById('reminderDateDisplay');
        const modal = document.getElementById('reminderModal');
        if (dateInput) dateInput.value = date;
        if (dateDisplay) dateDisplay.textContent = new Date(date).toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (modal) modal.classList.remove('hidden');
    }

    function closeReminderModal() {
        const modal = document.getElementById('reminderModal');
        if (modal) modal.classList.add('hidden');
    }

    async function saveReminder() {
        const date = document.getElementById('reminderDateInput').value;
        const text = document.getElementById('reminderText').value.trim();
        if (!text) {
            alert('Proszę wpisać treść przypomnienia.');
            return;
        }
        if (!date) {
            alert('Proszę wybrać datę.');
            return;
        }

        let reminders = {};
        try {
            reminders = JSON.parse(localStorage.getItem('tracker_reminders') || '{}');
        } catch (e) {
            console.error('Error parsing reminders:', e);
            reminders = {};
        }
        
        if (!reminders[date]) reminders[date] = [];
        reminders[date].push(text);
        localStorage.setItem('tracker_reminders', JSON.stringify(reminders));

        document.getElementById('reminderText').value = '';
        closeReminderModal();
        renderCalendar();
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
            calendarGrid.innerHTML += `<div class="font-bold text-slate-400 text-[10px]">${day}</div>`;
        });
        
        for (let i = 0; i < startDay; i++) calendarGrid.innerHTML += '<div></div>';

        let reminders = {};
        try {
            reminders = JSON.parse(localStorage.getItem('tracker_reminders') || '{}');
        } catch (e) {
            reminders = {};
        }

        const today = new Date();

        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            dayEl.textContent = i;
            dayEl.className = 'p-1 cursor-pointer rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors relative text-center text-sm';

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            dayEl.onclick = () => filterByDate(dateStr);

            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayEl.classList.add('bg-indigo-600', 'text-white', 'font-bold');
            }

            if (currentFilter.date === dateStr) {
                dayEl.classList.add('ring-2', 'ring-indigo-500');
            }

            const casesOnDay = cases.filter(c => c.date === dateStr && !c.archived);
            if (casesOnDay.length > 0) {
                const hasUrgent = casesOnDay.some(c => c.urgent);
                const dot = document.createElement('div');
                dot.className = `absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${hasUrgent ? 'bg-red-500' : 'bg-blue-500'}`;
                dayEl.appendChild(dot);
            }

            if (reminders[dateStr]) {
                const reminderDot = document.createElement('div');
                reminderDot.className = 'absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-green-500';
                dayEl.appendChild(reminderDot);
            }

            calendarGrid.appendChild(dayEl);
        }
    }

    function changeMonth(offset) {
        currentDate.setMonth(currentDate.getMonth() + offset);
        renderCalendar();
    }

    function filterByDate(dateStr) {
        if (currentFilter.date === dateStr) {
            currentFilter.date = null;
        } else {
            currentFilter.date = dateStr;
        }
        renderCalendar();
        renderFullTracker();
    }

    async function loadCases() {
        cases = await getAllCases();
        renderFullTracker();
        renderCalendar();
    }

    async function initTracker() {
        await loadCases();
        
        const sortEl = document.getElementById('trSort');
        const searchEl = document.getElementById('trackerSearch');
        const saveBtn = document.getElementById('save-case-btn');
        
        if (sortEl) sortEl.addEventListener('change', () => renderFullTracker());
        if (searchEl) searchEl.addEventListener('input', (e) => renderFullTracker(e.target.value));
        if (saveBtn) saveBtn.addEventListener('click', saveCase);
        
        showArchived(false);
    }

    // Public API
    return {
        initTracker,
        openCase,
        closeCase,
        saveCase,
        deleteCase,
        addNewCase,
        showArchived,
        changeMonth,
        renderFullTracker,
        toggleFavorite,
        openReminderModal,
        closeReminderModal,
        saveReminder,
        filterByDate,
    };
})();

// Expose to window for onclick handlers
window.trackerModule = trackerModule;

// Expose individual functions for global access
window.openReminderModal = trackerModule.openReminderModal;
window.closeReminderModal = trackerModule.closeReminderModal;
window.saveReminder = trackerModule.saveReminder;
