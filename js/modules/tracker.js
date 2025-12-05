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
    let kanbanSortables = [];
    let bulkMode = false;
    let dailyPlan = []; // Plan dnia: tablica zadań { id, date, text, done, caseId (opcjonalnie) }

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

        const favoriteIcon = `<i data-lucide="star" class="case-action-icon ${caseData.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'} hover:text-yellow-400" onclick="event.stopPropagation(); trackerModule.toggleFavorite(${caseData.id})"></i>`;
        const planIcon = `<i data-lucide="calendar-plus" class="case-action-icon text-slate-300 hover:text-green-500" onclick="event.stopPropagation(); trackerModule.addCaseToDailyPlan(${caseData.id})" title="Dodaj do planu dnia"></i>`;

        // Tagi
        const tagsHTML = Array.isArray(caseData.tags) && caseData.tags.length > 0
            ? `<div class="flex flex-wrap gap-1 mt-1.5">
                ${caseData.tags.map(tag => `<span class="px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">${tag}</span>`).join('')}
               </div>`
            : '';

        // Klasy dla efektu teczki
        let folderClasses = 'case-binder kanban-item';
        if (caseData.urgent) folderClasses += ' urgent';
        if (caseData.isFavorite) folderClasses += ' favorite';

        return `
            <div class="${folderClasses} flex items-center py-3 pl-3 pr-6 rounded-xl border ${urgentStyle} cursor-pointer" data-case-no="${caseData.no}" data-case-id="${caseData.id}" data-status="${caseData.status || 'new'}">
                <input type="checkbox" class="case-checkbox hidden mr-3 w-5 h-5 text-indigo-600 rounded" data-case-id="${caseData.id}" onclick="event.stopPropagation(); trackerModule.toggleCaseSelection(${caseData.id})">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3">
                        <div class="font-bold text-slate-800 dark:text-white truncate">${caseData.no}</div>
                        <div class="text-xs text-slate-400 font-mono">${caseData.unp || ''}</div>
                    </div>
                    <div class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">${caseData.debtor || 'Brak danych zobowiązanego'}</div>
                    ${tagsHTML}
                </div>
                <div class="flex items-center gap-3 text-xs text-right ml-4 justify-end">
                    <div class="flex items-center gap-2 mr-2">
                        ${planIcon}
                        ${favoriteIcon}
                    </div>
                    <div class="w-24">
                        <div class="font-bold text-slate-600 dark:text-slate-300">${new Date(caseData.date).toLocaleDateString()}</div>
                        <div class="text-[10px] text-slate-400">${deadlineText}</div>
                    </div>
                    <div class="w-20 px-2 py-1 text-center font-bold rounded bg-slate-50 dark:bg-opacity-20 text-slate-600">${statusLabels[caseData.status] || 'Nowa'}</div>
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

    let caseListClickBound = false;

    function renderFullTracker(filter = '') {
        const listEl = document.getElementById('tracker-list');
        const countEl = document.getElementById('tracker-case-count');
        if (!listEl || !countEl) return;

        const statusFilterEl = document.getElementById('trFilterStatus');
        const priorityFilterEl = document.getElementById('trFilterPriority');
        const urgentFilterEl = document.getElementById('trFilterUrgent');
        const favoriteFilterEl = document.getElementById('trFilterFavorite');
        const tagFilterEl = document.getElementById('trFilterTag');

        let filteredCases = cases.filter(c => c.archived === isArchivedView);
        
        if (filter) {
            const searchTerm = filter.toLowerCase();
            filteredCases = filteredCases.filter(c =>
                Object.values(c).some(val => String(val).toLowerCase().includes(searchTerm))
            );
        }

        if (statusFilterEl && statusFilterEl.value !== 'all') {
            filteredCases = filteredCases.filter(c => (c.status || 'new') === statusFilterEl.value);
        }

        if (priorityFilterEl && priorityFilterEl.value !== 'all') {
            filteredCases = filteredCases.filter(c => (c.priority || 'medium') === priorityFilterEl.value);
        }

        if (urgentFilterEl && urgentFilterEl.checked) {
            filteredCases = filteredCases.filter(c => c.urgent);
        }

        if (favoriteFilterEl && favoriteFilterEl.checked) {
            filteredCases = filteredCases.filter(c => c.isFavorite);
        }

        if (tagFilterEl) {
            const previousValue = tagFilterEl.value || 'all';
            const tagSet = new Set();
            cases.forEach(c => {
                if (Array.isArray(c.tags)) {
                    c.tags.forEach(t => tagSet.add(t));
                }
            });
            const options = ['<option value="all">Wszystkie tagi</option>']
                .concat(Array.from(tagSet).sort().map(tag => `<option value="${tag}">${tag}</option>`));
            tagFilterEl.innerHTML = options.join('');
            if (previousValue !== 'all' && tagSet.has(previousValue)) {
                tagFilterEl.value = previousValue;
            } else {
                tagFilterEl.value = 'all';
            }
            if (tagFilterEl.value !== 'all') {
                const selectedTag = tagFilterEl.value;
                filteredCases = filteredCases.filter(c => Array.isArray(c.tags) && c.tags.includes(selectedTag));
            }
        }

        const sortEl = document.getElementById('trSort');
        const sortMethod = sortEl ? sortEl.value : 'deadline';
        const priorityOrder = { low: 0, medium: 1, high: 2 };
        filteredCases.sort((a, b) => {
            if (a.urgent !== b.urgent) return b.urgent - a.urgent;
            switch (sortMethod) {
                case 'deadline': return new Date(a.date) - new Date(b.date);
                case 'added': return new Date(b.createdAt) - new Date(a.createdAt);
                case 'priority':
                    return (priorityOrder[(b.priority || 'medium')] || 0) - (priorityOrder[(a.priority || 'medium')] || 0);
                case 'no': return (a.no || '').localeCompare(b.no || '');
                default: return 0;
            }
        });

        if (!filteredCases.length) {
            listEl.innerHTML = `<div class="flex flex-col items-center justify-center py-16 text-center">
                <div class="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 empty-state-icon">
                    <i data-lucide="folder-open" size="40" class="text-slate-300 dark:text-slate-600"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-600 dark:text-slate-400 mb-2">Brak spraw</h3>
                <p class="text-sm text-slate-400 dark:text-slate-500 mb-4">Dodaj pierwszą sprawę, aby rozpocząć</p>
            </div>`;
            countEl.textContent = '0 spraw';
            if (window.lucide) lucide.createIcons();
            return;
        }

        // ARCHIWUM: zwykła lista, bez kanbana i drag & drop
        if (isArchivedView) {
            listEl.innerHTML = filteredCases.map(createCaseBinder).join('');
            countEl.textContent = `${filteredCases.length} spraw`;
            if (window.lucide) lucide.createIcons();
            return;
        }

        // AKTYWNE: trzy kolumny kanban (Nowe, W toku, Pilne)
        listEl.innerHTML = `
            <div id="tracker-kanban" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div class="kanban-column" data-column="new">
                    <div class="kanban-column-header flex items-center justify-between text-xs text-slate-500 dark:text-slate-300 uppercase">
                        <span>Nowe</span>
                    </div>
                    <div id="tracker-col-new" class="space-y-3" data-column="new"></div>
                </div>
                <div class="kanban-column" data-column="in-progress">
                    <div class="kanban-column-header flex items-center justify-between text-xs text-slate-500 dark:text-slate-300 uppercase">
                        <span>W toku</span>
                    </div>
                    <div id="tracker-col-in-progress" class="space-y-3" data-column="in-progress"></div>
                </div>
                <div class="kanban-column" data-column="urgent">
                    <div class="kanban-column-header flex items-center justify-between text-xs text-slate-500 dark:text-slate-300 uppercase">
                        <span>Pilne</span>
                    </div>
                    <div id="tracker-col-urgent" class="space-y-3" data-column="urgent"></div>
                </div>
            </div>`;

        const colNew = document.getElementById('tracker-col-new');
        const colInProgress = document.getElementById('tracker-col-in-progress');
        const colUrgent = document.getElementById('tracker-col-urgent');

        const buckets = {
            new: [],
            'in-progress': [],
            urgent: [],
        };

        filteredCases.forEach(c => {
            if (c.urgent) {
                buckets.urgent.push(c);
            } else if ((c.status || 'new') === 'in-progress') {
                buckets['in-progress'].push(c);
            } else {
                buckets.new.push(c);
            }
        });

        if (colNew) colNew.innerHTML = (buckets.new || []).map(createCaseBinder).join('');
        if (colInProgress) colInProgress.innerHTML = (buckets['in-progress'] || []).map(createCaseBinder).join('');
        if (colUrgent) colUrgent.innerHTML = (buckets.urgent || []).map(createCaseBinder).join('');

        countEl.textContent = `${filteredCases.length} spraw`;

        if (window.lucide) lucide.createIcons();
        initKanbanDragAndDrop();

        // Jedno globalne nasłuchiwanie kliknięcia na teczkę
        if (!caseListClickBound) {
            listEl.addEventListener('click', (e) => {
                // Jeśli kliknięto w checkbox, nie rób nic (obsługuje własny onclick)
                if (e.target.classList.contains('case-checkbox')) return;
                
                const item = e.target.closest('.case-binder');
                if (!item) return;
                const idAttr = item.getAttribute('data-case-id');
                if (!idAttr) return;
                const id = parseInt(idAttr, 10);
                if (Number.isNaN(id)) return;
                
                // W trybie masowym: zaznacz zamiast otwierać
                if (bulkMode) {
                    toggleCaseSelection(id);
                } else {
                    openCase(id, false);
                }
            });
            caseListClickBound = true;
        }
    }

    function initKanbanDragAndDrop() {
        if (!window.Sortable) return;

        // Usuń poprzednie instancje
        kanbanSortables.forEach(s => s.destroy());
        kanbanSortables = [];

        ['new', 'in-progress', 'urgent'].forEach(column => {
            const col = document.getElementById(`tracker-col-${column}`);
            if (!col) return;

            const sortable = new Sortable(col, {
                group: 'tracker-kanban',
                animation: 150,
                delay: 0,
                delayOnTouchOnly: false,
                touchStartThreshold: 3,
                ghostClass: 'opacity-30',
                dragClass: 'dragging',
                chosenClass: 'chosen',
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                forceFallback: false,
                fallbackTolerance: 3,
                onEnd: handleKanbanDrop,
            });

            kanbanSortables.push(sortable);
        });
    }

    async function handleKanbanDrop(evt) {
        const itemEl = evt.item;
        if (!itemEl) return;

        const caseIdAttr = itemEl.getAttribute('data-case-id');
        const targetColumn = evt.to && evt.to.getAttribute('data-column');
        if (!caseIdAttr || !targetColumn) return;

        const caseId = parseInt(caseIdAttr, 10);
        if (Number.isNaN(caseId)) return;

        const caseData = cases.find(c => c.id === caseId);
        if (!caseData) return;

        // Aktualizacja statusu / pilności w zależności od kolumny
        if (targetColumn === 'urgent') {
            caseData.urgent = true;
            if (!caseData.status) caseData.status = 'in-progress';
        } else {
            caseData.status = targetColumn; // 'new' lub 'in-progress'
            caseData.urgent = false;
        }

        await saveCaseToDB(caseData);
        
        // Szybsze odświeżenie bez pełnego re-renderu
        await loadCases();
        renderFullTracker(document.getElementById('trackerSearch')?.value || '');
        
        if (window.Toast) {
            const label = targetColumn === 'new'
                ? 'Nowa'
                : targetColumn === 'in-progress'
                    ? 'W toku'
                    : 'Pilna';
            window.Toast.info('Zmieniono status sprawy na: ' + label);
        }
    }

    let isEditMode = false;

    function openCase(id, editMode = false) {
        currentCaseId = id;
        window.currentCaseId = id; // Make available globally for attachments
        const caseData = cases.find(c => c.id === id);
        if (!caseData) return;

        isEditMode = editMode;

        document.getElementById('trNo').value = caseData.no || '';
        document.getElementById('trUnp').value = caseData.unp || '';
        document.getElementById('trDebtor').value = caseData.debtor || '';
        document.getElementById('trDate').value = caseData.date || '';
        document.getElementById('trStatus').value = caseData.status || 'new';
        document.getElementById('trUrgent').checked = caseData.urgent || false;
        const priorityEl = document.getElementById('trPriority');
        if (priorityEl) priorityEl.value = caseData.priority || 'medium';
        document.getElementById('trNote').value = caseData.note || '';
        
        // Ustaw tryb podglądu lub edycji
        setViewMode(editMode);
        
        document.getElementById('tracker-case-label').textContent = editMode ? `Edycja: ${caseData.no}` : `Podgląd: ${caseData.no}`;

        currentCaseTags = Array.isArray(caseData.tags) ? caseData.tags.slice() : [];
        renderTagsUI();

        document.getElementById('tracker-grid-view').classList.add('-translate-x-full');
        document.getElementById('tracker-detail-view').classList.remove('translate-x-full');
        
        if (typeof renderAttachments === 'function') {
            renderAttachments(id);
        }
    }

    function setViewMode(editMode) {
        const fields = ['trNo', 'trUnp', 'trDebtor', 'trDate', 'trStatus', 'trPriority', 'trUrgent', 'trNote'];
        const saveBtn = document.getElementById('save-case-btn');
        const editBtn = document.getElementById('edit-case-btn');
        const tagInput = document.getElementById('trTagInput');
        
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.disabled = !editMode;
                if (!editMode) {
                    el.classList.add('bg-slate-50', 'dark:bg-slate-800/50', 'cursor-not-allowed');
                } else {
                    el.classList.remove('bg-slate-50', 'dark:bg-slate-800/50', 'cursor-not-allowed');
                }
            }
        });

        if (tagInput) tagInput.disabled = !editMode;
        
        if (saveBtn) saveBtn.classList.toggle('hidden', !editMode);
        if (editBtn) editBtn.classList.toggle('hidden', editMode);
        
        // Wyłącz przyciski tagów w trybie podglądu
        const tagButtons = document.querySelectorAll('#trTagsContainer button');
        tagButtons.forEach(btn => {
            btn.disabled = !editMode;
            if (!editMode) {
                btn.classList.add('cursor-not-allowed', 'opacity-60');
            } else {
                btn.classList.remove('cursor-not-allowed', 'opacity-60');
            }
        });
    }

    function toggleEditMode() {
        isEditMode = !isEditMode;
        setViewMode(isEditMode);
        const caseData = cases.find(c => c.id === currentCaseId);
        if (caseData) {
            document.getElementById('tracker-case-label').textContent = isEditMode ? `Edycja: ${caseData.no}` : `Podgląd: ${caseData.no}`;
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

    // Operacje masowe
    let selectedCases = new Set();

    function toggleCaseSelection(caseId) {
        if (selectedCases.has(caseId)) {
            selectedCases.delete(caseId);
        } else {
            selectedCases.add(caseId);
        }
        updateBulkActionsBar();
    }

    function selectAllCases(forceChecked) {
        const checkboxes = document.querySelectorAll('.case-checkbox');
        let targetChecked;

        if (typeof forceChecked === 'boolean') {
            targetChecked = forceChecked;
        } else {
            const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked);
            targetChecked = !allChecked;
        }
        
        checkboxes.forEach(cb => {
            const caseId = parseInt(cb.getAttribute('data-case-id'));
            cb.checked = targetChecked;
            if (targetChecked) {
                selectedCases.add(caseId);
            } else {
                selectedCases.delete(caseId);
            }
        });
        updateBulkActionsBar();
        
        // Zamknij menu po wyborze opcji
        const menu = document.getElementById('bulk-select-menu');
        if (menu) menu.classList.add('hidden');
    }

    function toggleBulkMenu() {
        const menu = document.getElementById('bulk-select-menu');
        
        if (bulkMode) {
            // Jeśli tryb masowy jest włączony, tylko przełącz menu
            if (menu) {
                menu.classList.toggle('hidden');
            }
        } else {
            // Włącz tryb masowy
            bulkMode = true;
            const checkboxes = document.querySelectorAll('.case-checkbox');
            checkboxes.forEach(cb => cb.classList.remove('hidden'));
            if (menu) menu.classList.remove('hidden');
        }
    }
    
    function exitBulkMode() {
        bulkMode = false;
        const menu = document.getElementById('bulk-select-menu');
        const checkboxes = document.querySelectorAll('.case-checkbox');
        
        checkboxes.forEach(cb => {
            cb.classList.add('hidden');
            cb.checked = false;
        });
        if (menu) menu.classList.add('hidden');
        selectedCases.clear();
        updateBulkActionsBar();
    }

    function updateBulkActionsBar() {
        const bar = document.getElementById('bulk-actions-bar');
        const count = document.getElementById('bulk-selected-count');
        
        if (bar && count) {
            if (selectedCases.size > 0) {
                bar.classList.remove('hidden');
                count.textContent = selectedCases.size;
            } else {
                bar.classList.add('hidden');
            }
        }
    }

    async function bulkUpdateStatus(newStatus) {
        for (const caseId of selectedCases) {
            const caseData = cases.find(c => c.id === caseId);
            if (caseData) {
                caseData.status = newStatus;
                caseData.archived = newStatus === 'finished';
                await saveCaseToDB(caseData);
            }
        }
        selectedCases.clear();
        await loadCases();
        if (window.Toast) Toast.success(`Zaktualizowano status ${selectedCases.size} spraw`);
    }

    async function bulkToggleUrgent() {
        for (const caseId of selectedCases) {
            const caseData = cases.find(c => c.id === caseId);
            if (caseData) {
                caseData.urgent = !caseData.urgent;
                await saveCaseToDB(caseData);
            }
        }
        selectedCases.clear();
        await loadCases();
        if (window.Toast) Toast.success(`Przełączono pilność ${selectedCases.size} spraw`);
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
        isEditMode = true; // Nowa sprawa zawsze w trybie edycji
        
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
        document.getElementById('tracker-case-label').textContent = 'Nowa sprawa';
        currentCaseTags = [];
        renderTagsUI();
        
        // Ustaw tryb edycji
        setViewMode(true);
        document.getElementById('tracker-case-label').textContent = 'Nowa Sprawa';

        document.getElementById('tracker-grid-view').classList.add('-translate-x-full');
        document.getElementById('tracker-detail-view').classList.remove('translate-x-full');
    }

    function showArchived(show) {
        isArchivedView = show;
        const archiveBtn = document.getElementById('archiveBtn');
        const addCaseBtn = document.getElementById('addCaseBtn');
        if (archiveBtn) {
            archiveBtn.textContent = show ? 'Aktywne' : 'Archiwum';
            archiveBtn.onclick = () => showArchived(!show);
        }
        if (addCaseBtn) {
            addCaseBtn.classList.toggle('hidden', show);
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

    function loadTrackerReminders() {
        let reminders = {};
        try {
            const raw = localStorage.getItem('tracker_reminders');
            reminders = raw ? JSON.parse(raw) : {};
        } catch (e) {
            console.error('Error parsing reminders:', e);
            reminders = {};
        }

        // Normalizuj: każda wartość musi być tablicą stringów
        let changed = false;
        Object.entries(reminders).forEach(([date, value]) => {
            if (Array.isArray(value)) return;
            if (typeof value === 'string' && value.trim()) {
                reminders[date] = [value];
                changed = true;
            } else {
                delete reminders[date];
                changed = true;
            }
        });

        if (changed) {
            try {
                localStorage.setItem('tracker_reminders', JSON.stringify(reminders));
            } catch (e) {
                console.error('Error saving normalized reminders:', e);
            }
        }

        return reminders;
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

        const reminders = loadTrackerReminders();
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

        const reminders = loadTrackerReminders();

        const today = new Date();

        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            dayEl.textContent = i;
            dayEl.className = 'p-1 cursor-pointer rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors relative text-center text-sm';

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            // Kliknięcie w dzień: otwiera modal planu dnia
            dayEl.onclick = () => {
                openDayPlanModal(dateStr);
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

            // Zielona kropka dla zadań
            const tasksOnDay = getTasksForDate(dateStr);
            if (tasksOnDay.length > 0) {
                const taskDot = document.createElement('div');
                taskDot.className = 'absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-green-500';
                dayEl.appendChild(taskDot);
            }

            if (reminders[dateStr]) {
                const reminderDot = document.createElement('div');
                reminderDot.className = 'absolute top-0 left-0 w-1.5 h-1.5 rounded-full bg-yellow-500';
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

    // === PLAN DNIA ===
    function loadDailyPlan() {
        const stored = localStorage.getItem('dailyPlan');
        dailyPlan = stored ? JSON.parse(stored) : [];
    }

    function saveDailyPlan() {
        localStorage.setItem('dailyPlan', JSON.stringify(dailyPlan));
    }

    function addTaskToPlan(text, date = null, caseId = null) {
        const task = {
            id: Date.now(),
            date: date || new Date().toISOString().split('T')[0],
            text,
            done: false,
            caseId,
        };
        dailyPlan.push(task);
        saveDailyPlan();
        return task;
    }

    function toggleTaskDone(taskId) {
        const task = dailyPlan.find(t => t.id === taskId);
        if (task) {
            task.done = !task.done;
            saveDailyPlan();
        }
    }

    function deleteTask(taskId) {
        dailyPlan = dailyPlan.filter(t => t.id !== taskId);
        saveDailyPlan();
    }

    function getTasksForDate(dateStr) {
        return dailyPlan.filter(t => t.date === dateStr);
    }

    function getCasesForDate(dateStr) {
        // Sprawy na ten dzień: połączenie spraw z terminem = data
        // oraz spraw ręcznie dodanych do planu dnia (dailyPlan z caseId)
        const baseCases = cases.filter(c => c.date === dateStr && !c.archived);
        const plannedCaseTasks = dailyPlan.filter(t => t.date === dateStr && t.caseId);
        const plannedCases = plannedCaseTasks
            .map(t => cases.find(c => c.id === t.caseId))
            .filter(c => c && !c.archived);

        const seenIds = new Set(baseCases.map(c => c.id));
        const mergedCases = [...baseCases];
        for (const c of plannedCases) {
            if (!seenIds.has(c.id)) {
                mergedCases.push(c);
                seenIds.add(c.id);
            }
        }

        return mergedCases;
    }

    function addCaseToDailyPlan(caseId) {
        const caseData = cases.find(c => c.id === caseId);
        if (!caseData) return;
        
        const text = `Sprawa: ${caseData.no} - ${caseData.debtor || 'Brak danych'}`;
        addTaskToPlan(text, new Date().toISOString().split('T')[0], caseId);
        
        if (window.Toast) {
            window.Toast.success('Dodano sprawę do planu dnia');
        }
    }

    function openDayPlanModal(dateStr) {
        const modal = document.getElementById('dayPlanModal');
        const dateDisplay = document.getElementById('dayPlanDateDisplay');
        const dateInput = document.getElementById('dayPlanDateInput');
        const casesContainer = document.getElementById('dayPlanCases');
        const tasksContainer = document.getElementById('dayPlanTasks');
        const remindersContainer = document.getElementById('dayPlanReminders');
        
        if (!modal || !dateDisplay || !dateInput || !casesContainer || !tasksContainer || !remindersContainer) return;
        
        dateInput.value = dateStr;
        const d = new Date(dateStr);
        dateDisplay.textContent = `Plan na ${d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}`;
        
        const casesOnDay = getCasesForDate(dateStr);
        if (casesOnDay.length === 0) {
            casesContainer.innerHTML = '<p class="text-xs text-slate-400 italic">Brak spraw na ten dzień</p>';
        } else {
            casesContainer.innerHTML = casesOnDay.map(c => `
                <div class="p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 flex items-center justify-between">
                    <div class="flex-1">
                        <div class="font-bold text-sm dark:text-white">${c.no}</div>
                        <div class="text-xs text-slate-500 dark:text-slate-400">${c.debtor || 'Brak danych'}</div>
                    </div>
                    <button onclick="trackerModule.openCase(${c.id}, false); trackerModule.closeDayPlanModal();" class="text-xs text-indigo-600 hover:text-indigo-800 font-bold">Otwórz</button>
                </div>
            `).join('');
        }
        
        // Zadania na ten dzień
        renderDayPlanTasks(dateStr);
        
        // Przypomnienia na ten dzień
        renderDayPlanReminders(dateStr);
        
        modal.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    }

    function renderDayPlanTasks(dateStr) {
        const tasksContainer = document.getElementById('dayPlanTasks');
        if (!tasksContainer) return;
        
        // Zadania w tej sekcji: tylko wpisy NIE powiązane bezpośrednio ze sprawą
        const tasks = getTasksForDate(dateStr).filter(t => !t.caseId);
        if (tasks.length === 0) {
            tasksContainer.innerHTML = '<p class="text-xs text-slate-400 italic">Brak zadań na ten dzień</p>';
        } else {
            tasksContainer.innerHTML = tasks.map(task => `
                <div class="p-3 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 flex items-center gap-3">
                    <input type="checkbox" ${task.done ? 'checked' : ''} onchange="trackerModule.toggleTaskDone(${task.id}); trackerModule.renderDayPlanTasks('${dateStr}')" class="w-4 h-4 text-green-600 rounded">
                    <div class="flex-1 ${task.done ? 'line-through text-slate-400' : 'dark:text-white'}">
                        <div class="text-sm">${task.text}</div>
                    </div>
                    <button onclick="trackerModule.deleteTask(${task.id}); trackerModule.renderDayPlanTasks('${dateStr}')" class="text-red-500 hover:text-red-700">
                        <i data-lucide="trash-2" size="16"></i>
                    </button>
                </div>
            `).join('');
        }
        if (window.lucide) lucide.createIcons();
    }

    function closeDayPlanModal() {
        const modal = document.getElementById('dayPlanModal');
        if (modal) modal.classList.add('hidden');
        renderCalendar(); // Odśwież kalendarz, żeby pokazać kropki zadań
    }

    function addTaskFromModal() {
        const input = document.getElementById('newTaskInput');
        const dateInput = document.getElementById('dayPlanDateInput');
        if (!input || !dateInput) return;
        
        const text = input.value.trim();
        const dateStr = dateInput.value;
        
        if (!text) {
            if (window.Toast) window.Toast.error('Wpisz treść zadania');
            return;
        }
        
        addTaskToPlan(text, dateStr);
        input.value = '';
        renderDayPlanTasks(dateStr);
        
        if (window.Toast) window.Toast.success('Dodano zadanie');
    }

    function renderDayPlanReminders(dateStr) {
        const remindersContainer = document.getElementById('dayPlanReminders');
        if (!remindersContainer) return;
        
        const reminders = loadTrackerReminders();
        const items = Array.isArray(reminders[dateStr]) ? reminders[dateStr] : [];

        if (!items.length) {
            remindersContainer.innerHTML = '<p class="text-xs text-slate-400 italic">Brak przypomnień na ten dzień</p>';
        } else {
            remindersContainer.innerHTML = items.map((text, idx) => `
                <div class="p-3 border dark:border-slate-600 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-between mb-2 last:mb-0">
                    <div class="flex-1 text-sm dark:text-white">${text}</div>
                    <div class="flex items-center gap-2">
                        <button onclick="trackerModule.deleteSingleReminder('${dateStr}', ${idx}); trackerModule.renderDayPlanReminders('${dateStr}')" class="text-red-500 hover:text-red-700">
                            <i data-lucide="trash-2" size="16"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
        if (window.lucide) lucide.createIcons();
    }

    function addReminderFromModal() {
        const input = document.getElementById('newReminderInput');
        const dateInput = document.getElementById('dayPlanDateInput');
        if (!input || !dateInput) return;
        
        const text = input.value.trim();
        const dateStr = dateInput.value;
        
        if (!text) {
            if (window.Toast) window.Toast.error('Wpisz treść przypomnienia');
            return;
        }
        
        const reminders = loadTrackerReminders();
        if (!reminders[dateStr]) reminders[dateStr] = [];
        reminders[dateStr].push(text);
        localStorage.setItem('tracker_reminders', JSON.stringify(reminders));
        
        input.value = '';
        renderDayPlanReminders(dateStr);
        renderCalendar();
        
        if (window.Toast) window.Toast.success('Dodano przypomnienie');
    }

    function deleteReminder(dateStr) {
        const reminders = loadTrackerReminders();
        delete reminders[dateStr];
        localStorage.setItem('tracker_reminders', JSON.stringify(reminders));
        renderCalendar();
        
        if (window.Toast) window.Toast.success('Usunięto przypomnienie');
    }

    function deleteSingleReminder(dateStr, index) {
        const reminders = loadTrackerReminders();
        if (!Array.isArray(reminders[dateStr])) return;
        reminders[dateStr].splice(index, 1);
        if (!reminders[dateStr].length) {
            delete reminders[dateStr];
        }
        localStorage.setItem('tracker_reminders', JSON.stringify(reminders));
        renderCalendar();

        if (window.Toast) window.Toast.success('Usunięto przypomnienie');
    }

    // Szybka lista zadań "Plan na dziś" w nagłówku
    function renderTodayQuickPlan() {
        const listEl = document.getElementById('todayPlanList');
        if (!listEl) return;

        const todayStr = new Date().toISOString().split('T')[0];
        const todayCases = getCasesForDate(todayStr);
        const tasks = getTasksForDate(todayStr).filter(t => !t.caseId);

        if (!todayCases.length && !tasks.length) {
            listEl.innerHTML = '<p class="text-xs text-slate-400 italic px-2 py-1">Brak planu na dziś</p>';
            return;
        }

        const casesHTML = todayCases.length
            ? `
                <div class="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">Sprawy</div>
                ${todayCases.map(c => `
                    <button onclick="trackerModule.openCase(${c.id}, false); document.getElementById('todayPlanPopover').classList.add('hidden');" class="w-full text-left px-2 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs">
                        <div class="flex-1 min-w-0 mr-2">
                            <div class="font-bold text-slate-700 dark:text-slate-100 truncate">${c.no}</div>
                            <div class="text-[10px] text-slate-400 truncate">${c.debtor || 'Brak danych'}</div>
                        </div>
                        <span class="text-[10px] text-slate-400">otwórz</span>
                    </button>
                `).join('')}
            `
            : '';

        const tasksHTML = tasks.length
            ? `
                <div class="px-2 pt-2 pb-1 text-[10px] font-bold uppercase text-slate-400">Zadania</div>
                ${tasks.map(task => `
                    <label class="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs">
                        <input type="checkbox" ${task.done ? 'checked' : ''} onchange="trackerModule.toggleTaskDone(${task.id}); trackerModule.renderTodayQuickPlan();" class="w-4 h-4 text-green-600 rounded">
                        <span class="flex-1 ${task.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-100'} truncate">${task.text}</span>
                    </label>
                `).join('')}
            `
            : '';

        listEl.innerHTML = casesHTML + tasksHTML;
    }

    function toggleTodayQuickPlan() {
        const popover = document.getElementById('todayPlanPopover');
        if (!popover) return;

        const isHidden = popover.classList.contains('hidden');
        if (isHidden) {
            renderTodayQuickPlan();
            popover.classList.remove('hidden');
        } else {
            popover.classList.add('hidden');
        }

        if (window.lucide) lucide.createIcons();
    }

    async function initTracker() {
        await loadCases();
        loadDailyPlan();
        
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
        toggleEditMode,
        toggleCaseSelection,
        selectAllCases,
        toggleBulkMenu,
        exitBulkMode,
        bulkUpdateStatus,
        bulkToggleUrgent,
        openReminderModal,
        closeReminderModal,
        saveReminder,
        filterByDate,
        focusDate,
        addCaseToDailyPlan,
        addTaskToPlan,
        toggleTaskDone,
        deleteTask,
        getTasksForDate,
        openDayPlanModal,
        closeDayPlanModal,
        renderDayPlanTasks,
        renderDayPlanReminders,
        addTaskFromModal,
        addReminderFromModal,
        deleteReminder,
        deleteSingleReminder,
        renderTodayQuickPlan,
        toggleTodayQuickPlan,
    };
})();

// Expose to window for onclick handlers
window.trackerModule = trackerModule;

// Expose individual functions for global access
window.openReminderModal = trackerModule.openReminderModal;
window.closeReminderModal = trackerModule.closeReminderModal;
window.saveReminder = trackerModule.saveReminder;
