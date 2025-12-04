// --- TRACKER MODULE ---

const trackerModule = (() => {
    let currentCaseId = null;
    let cases = [];
    let isArchivedView = false;
    let currentDate = new Date();
    let currentFilter = { date: null };
    const STORE_NAME = 'tracker';
    let currentCaseTags = [];
    const PREDEFINED_TAGS = [];

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

    function renderTagsUI() {
        const container = document.getElementById('trTagsContainer');
        const input = document.getElementById('trTagInput');
        if (!container || !input) return;

        const allTags = Array.from(new Set([...(PREDEFINED_TAGS || []), ...currentCaseTags]));
        container.innerHTML = allTags.map(tag => {
            const isActive = currentCaseTags.includes(tag);
            const base = 'px-2.5 py-1 rounded-full text-[11px] border cursor-pointer transition-colors';
            const activeClasses = 'bg-indigo-600 text-white border-indigo-600';
            const inactiveClasses = 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30';
            return `<button type="button" class="${base} ${isActive ? activeClasses : inactiveClasses}" data-tag="${tag}">${tag}</button>`;
        }).join('');

        Array.from(container.querySelectorAll('button[data-tag]')).forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.getAttribute('data-tag');
                if (!tag) return;
                if (currentCaseTags.includes(tag)) {
                    currentCaseTags = currentCaseTags.filter(t => t !== tag);
                } else {
                    currentCaseTags.push(tag);
                }
                renderTagsUI();
            });
        });

        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = input.value.trim();
                if (!value) return;
                if (!currentCaseTags.includes(value)) {
                    currentCaseTags.push(value);
                }
                input.value = '';
                renderTagsUI();
            }
        };
    }

    function renderTimelineUI() {
        const container = document.getElementById('trTimeline');
        const input = document.getElementById('trTimelineInput');
        if (!container || !input) return;

        const caseData = cases.find(c => c.id === currentCaseId);
        if (!caseData) return;

        container.innerHTML = (caseData.timeline || []).map(entry => {
            return `<div class="p-2 border rounded-lg text-xs bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">${entry}</div>`;
        }).join('');

        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = input.value.trim();
                if (!value) return;
                caseData.timeline = caseData.timeline || [];
                caseData.timeline.push(value);
                input.value = '';
                renderTimelineUI();
            }
        };

        const addBtn = document.getElementById('trTimelineAddBtn');
        if (addBtn) {
            addBtn.onclick = () => {
                const value = input.value.trim();
                if (!value) return;
                caseData.timeline = caseData.timeline || [];
                caseData.timeline.push(value);
                input.value = '';
                renderTimelineUI();
            };
        }
    }

    function renderFullTracker(filter = '') {
        const listEl = document.getElementById('tracker-list');
        if (!listEl) return;

        let filteredCases = cases.filter(c => c.archived === isArchivedView);
        
        if (filter) {
            const searchTerm = filter.toLowerCase();
            filteredCases = filteredCases.filter(c =>
                Object.values(c).some(val => String(val).toLowerCase().includes(searchTerm))
            );
        }

        listEl.innerHTML = filteredCases.length 
            ? filteredCases.map(c => {
                let folderClasses = 'case-folder';
                if (c.urgent) folderClasses += ' case-folder-urgent';
                if (c.isFavorite) folderClasses += ' case-folder-favorite';
                if (c.archived) folderClasses += ' case-folder-archived';

                return `
                    <div class="${folderClasses}" onclick="trackerModule.openCase(${c.id})">
                        <div class="case-label">Numer sprawy</div>
                        <div class="case-value font-bold">${c.no || 'Brak numeru'}</div>
                        
                        <div class="case-label">Zobowiązany</div>
                        <div class="case-value">${c.debtor || 'Brak danych'}</div>
                        
                        <div class="case-label">Termin</div>
                        <div class="case-value">${c.date ? new Date(c.date).toLocaleDateString() : 'Brak terminu'}</div>
                        
                        <div class="flex justify-between mt-2">
                            <span class="text-xs px-2 py-1 rounded ${c.status === 'new' ? 'bg-blue-100 text-blue-800' : c.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
                                ${c.status === 'new' ? 'Nowa' : c.status === 'in-progress' ? 'W toku' : 'Zakończona'}
                            </span>
                            <span class="text-xs text-slate-500">
                                ${Math.ceil((new Date(c.date) - new Date()) / (1000 * 60 * 60 * 24))} dni
                            </span>
                        </div>
                    </div>
                `;
            }).join('')
            : `<div class="col-span-3 flex flex-col items-center justify-center py-16 text-center">
                <div class="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <i data-lucide="folder-open" size="40" class="text-slate-300"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-600 mb-2">Brak teczek</h3>
                <p class="text-sm text-slate-400 mb-4">Dodaj pierwszą teczkę, aby rozpocząć</p>
                <button onclick="trackerModule.addNewCase()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors">
                    <i data-lucide="plus" size="16" class="inline mr-1"></i> Dodaj teczkę
                </button>
            </div>`;

        lucide.createIcons();
    }

    function showCaseTab(tabName) {
        ['details', 'documents', 'history'].forEach(tab => {
            const el = document.getElementById(`case-${tab}-tab`);
            if (el) el.classList.toggle('hidden', tab !== tabName);
        });
        
        const tabs = document.querySelectorAll('.case-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('case-tab-active', tab.textContent.toLowerCase().includes(tabName));
        });
    }

    function bulkUpdateStatus(newStatus) {
        const selectedCases = Array.from(document.querySelectorAll('input[type="checkbox"][data-case-id]:checked')).map(cb => cb.getAttribute('data-case-id'));
        selectedCases.forEach(async id => {
            const caseData = cases.find(c => c.id === parseInt(id, 10));
            if (caseData) {
                caseData.status = newStatus;
                await saveCaseToDB(caseData);
            }
        });
        renderFullTracker();
        if (window.Toast) Toast.success(`Status ustawiony na '${newStatus}' dla ${selectedCases.length} spraw.`);
    }

    function bulkToggleUrgent() {
        const selectedCases = Array.from(document.querySelectorAll('input[type="checkbox"][data-case-id]:checked')).map(cb => cb.getAttribute('data-case-id'));
        selectedCases.forEach(async id => {
            const caseData = cases.find(c => c.id === parseInt(id, 10));
            if (caseData) {
                caseData.urgent = !caseData.urgent;
                await saveCaseToDB(caseData);
            }
        });
        renderFullTracker();
        if (window.Toast) Toast.success(`Pilność przełączona dla ${selectedCases.length} spraw.`);
    }

    function openCase(id) {
        currentCaseId = id;
        window.currentCaseId = id; // Make available globally for attachments
        const caseData = cases.find(c => c.id === id);
        if (!caseData) return;

        document.getElementById('trNo').value = caseData.no || '';
        document.getElementById('trUnp').value = caseData.unp || '';
        document.getElementById('trDebtor').value = caseData.debtor || '';
        document.getElementById('trDate').value = caseData.date || '';
        document.getElementById('trStatus').value = caseData.status || 'new';
        document.getElementById('trUrgent').checked = caseData.urgent || false;
        const priorityEl = document.getElementById('trPriority');
        if (priorityEl) priorityEl.value = caseData.priority || 'medium';
        document.getElementById('trNote').value = caseData.note || '';
        document.getElementById('tracker-case-label').textContent = `Edycja: ${caseData.no}`;

        currentCaseTags = Array.isArray(caseData.tags) ? caseData.tags.slice() : [];
        renderTagsUI();
        renderTimelineUI();

        document.getElementById('tracker-grid-view').classList.add('-translate-x-full');
        document.getElementById('tracker-detail-view').classList.remove('translate-x-full');
        
        if (typeof renderAttachments === 'function') {
            renderAttachments(id);
        }
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
        const priorityEl = document.getElementById('trPriority');
        const caseData = {
            id: currentCaseId,
            no: document.getElementById('trNo').value.trim(),
            unp: document.getElementById('trUnp').value.trim(),
            debtor: document.getElementById('trDebtor').value.trim(),
            date: document.getElementById('trDate').value,
            status: status,
            urgent: document.getElementById('trUrgent').checked,
            priority: priorityEl ? priorityEl.value : 'medium',
            note: document.getElementById('trNote').value.trim(),
            archived: status === 'finished',
            tags: currentCaseTags.slice(),
            timeline: cases.find(c => c.id === currentCaseId).timeline || [],
        };

        if (!caseData.no || !caseData.date) {
            if (window.Toast) Toast.warning('Numer sprawy i data są wymagane.');
            else alert('Numer sprawy i data są wymagane.');
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

        if (window.Toast) Toast.success('Sprawa została zapisana');
        if (typeof checkNotifications === 'function') checkNotifications();
        if (typeof renderDashboardWidgets === 'function') renderDashboardWidgets();
    }

    async function deleteCase() {
        if (!currentCaseId) return;
        if (!confirm('Czy na pewno usunąć tę sprawę?')) return;
        
        await deleteCaseFromDB(currentCaseId);
        closeCase();
        await loadCases();
        if (window.Toast) Toast.info('Sprawa została usunięta');
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
        const priorityEl = document.getElementById('trPriority');
        if (priorityEl) priorityEl.value = 'medium';
        document.getElementById('trNote').value = '';
        currentCaseTags = [];
        renderTagsUI();
        renderTimelineUI();
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
        renderRemindersList();
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
            // Kliknięcie w dzień: filtruje sprawy po dacie ORAZ otwiera modal przypomnienia
            dayEl.onclick = () => {
                filterByDate(dateStr);
                openReminderModal(dateStr);
            };

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

    function focusDate(dateStr) {
        const parts = dateStr.split('-').map(p => parseInt(p, 10));
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            currentDate = new Date(parts[0], parts[1] - 1, 1);
        }
        renderCalendar();
        filterByDate(dateStr);
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
        const all = await getAllCases();
        cases = all.map(c => ({
            ...c,
            priority: c.priority || 'medium',
            tags: Array.isArray(c.tags) ? c.tags : [],
        }));
        renderFullTracker();
        renderCalendar();
    }

    function renderRemindersList() {
        const container = document.getElementById('tracker-reminders-list');
        if (!container) return;

        let reminders = {};
        try {
            reminders = JSON.parse(localStorage.getItem('tracker_reminders') || '{}');
        } catch (e) {
            reminders = {};
        }

        const rangeEl = document.getElementById('trRemindersRange');
        const futureOnlyEl = document.getElementById('trRemindersFutureOnly');

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let maxDate = null;
        const rangeValue = rangeEl ? rangeEl.value : '7';
        if (rangeValue !== 'all') {
            const days = parseInt(rangeValue, 10) || 7;
            maxDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
        }
        const futureOnly = !futureOnlyEl || futureOnlyEl.checked;

        let items = [];
        Object.entries(reminders).forEach(([dateStr, texts]) => {
            if (!Array.isArray(texts)) return;
            texts.forEach(text => {
                items.push({ date: dateStr, text });
            });
        });

        items = items.filter(item => {
            const d = new Date(item.date);
            if (isNaN(d.getTime())) return false;
            const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            if (futureOnly && dDate < today) return false;
            if (maxDate && dDate > maxDate) return false;
            return true;
        });

        items.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (items.length === 0) {
            container.innerHTML = '<div class="text-[11px] text-slate-400 text-center py-4">Brak przypomnień w wybranym zakresie</div>';
            return;
        }

        container.innerHTML = items.map(item => {
            const d = new Date(item.date);
            const dateLabel = isNaN(d.getTime()) ? item.date : d.toLocaleDateString('pl-PL');
            const safeText = item.text.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `
                <button type="button" class="w-full text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors" onclick="trackerModule.focusDate('${item.date}')">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[11px] font-mono text-slate-500">${dateLabel}</span>
                    </div>
                    <div class="text-[12px] text-slate-700 dark:text-slate-200 truncate">${safeText}</div>
                </button>
            `;
        }).join('');
    }

    async function initTracker() {
        await loadCases();
        
        const sortEl = document.getElementById('trSort');
        const searchEl = document.getElementById('trackerSearch');
        const saveBtn = document.getElementById('save-case-btn');
        const statusFilterEl = document.getElementById('trFilterStatus');
        const priorityFilterEl = document.getElementById('trFilterPriority');
        const urgentFilterEl = document.getElementById('trFilterUrgent');
        const favoriteFilterEl = document.getElementById('trFilterFavorite');
        const tagFilterEl = document.getElementById('trFilterTag');
        const remindersRangeEl = document.getElementById('trRemindersRange');
        const remindersFutureEl = document.getElementById('trRemindersFutureOnly');
        
        if (sortEl) sortEl.addEventListener('change', () => renderFullTracker());
        if (searchEl) searchEl.addEventListener('input', (e) => renderFullTracker(e.target.value));
        if (saveBtn) saveBtn.addEventListener('click', saveCase);
        const rerenderList = () => renderFullTracker(searchEl ? searchEl.value : '');
        if (statusFilterEl) statusFilterEl.addEventListener('change', rerenderList);
        if (priorityFilterEl) priorityFilterEl.addEventListener('change', rerenderList);
        if (urgentFilterEl) urgentFilterEl.addEventListener('change', rerenderList);
        if (favoriteFilterEl) favoriteFilterEl.addEventListener('change', rerenderList);
        if (tagFilterEl) tagFilterEl.addEventListener('change', rerenderList);

        if (remindersRangeEl) remindersRangeEl.addEventListener('change', renderRemindersList);
        if (remindersFutureEl) remindersFutureEl.addEventListener('change', renderRemindersList);

        renderRemindersList();
        
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
        focusDate,
        bulkUpdateStatus,
        bulkToggleUrgent,
    };
})();

// Expose to window for onclick handlers
window.trackerModule = trackerModule;

// Expose individual functions for global access
window.openReminderModal = trackerModule.openReminderModal;
window.closeReminderModal = trackerModule.closeReminderModal;
window.saveReminder = trackerModule.saveReminder;
