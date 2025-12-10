/**
 * Tracker View - Case Tracker UI (Terminarz)
 */

import store from '../../store/index.js';
import TrackerStore from './TrackerStore.js';

const DEFAULT_DEADLINE_DAYS = 30;

class TrackerView {
    constructor() {
        this.container = null;
        this.trackerList = null;
        this.isArchivedView = false;
        this.currentFilter = '';
    }

    /**
     * Initialize Tracker View
     */
    init() {
        console.log('[TrackerView] Initializing...');
        
        // Get DOM elements
        this.container = document.getElementById('trackerContainer');
        this.trackerList = document.getElementById('tracker-list');

        // Setup event listeners
        this.setupEventListeners();
        
        // Subscribe to store changes
        this.setupStoreSubscriptions();
        
        // Load initial data
        this.loadInitialData();
        
        console.log('[TrackerView] Initialized successfully');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search filter
        const searchInput = document.getElementById('trSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilter = e.target.value;
                this.renderFullTracker(this.currentFilter);
            });
        }

        // Status filter
        const statusFilter = document.getElementById('trFilterStatus');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.renderFullTracker(this.currentFilter);
            });
        }

        // Priority filter
        const priorityFilter = document.getElementById('trFilterPriority');
        if (priorityFilter) {
            priorityFilter.addEventListener('change', () => {
                this.renderFullTracker(this.currentFilter);
            });
        }

        // Urgent filter
        const urgentFilter = document.getElementById('trFilterUrgent');
        if (urgentFilter) {
            urgentFilter.addEventListener('change', () => {
                this.renderFullTracker(this.currentFilter);
            });
        }

        // Favorite filter
        const favoriteFilter = document.getElementById('trFilterFavorite');
        if (favoriteFilter) {
            favoriteFilter.addEventListener('change', () => {
                this.renderFullTracker(this.currentFilter);
            });
        }

        // Tag filter
        const tagFilter = document.getElementById('trFilterTag');
        if (tagFilter) {
            tagFilter.addEventListener('change', () => {
                this.renderFullTracker(this.currentFilter);
            });
        }

        // Sort
        const sortSelect = document.getElementById('trSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.renderFullTracker(this.currentFilter);
            });
        }

        // Case list click handler
        if (this.trackerList) {
            this.trackerList.addEventListener('click', (e) => {
                const caseBinder = e.target.closest('.case-binder');
                if (caseBinder) {
                    const caseId = parseInt(caseBinder.dataset.caseId);
                    if (caseId) this.openCase(caseId);
                }
            });
        }
    }

    /**
     * Setup store subscriptions
     */
    setupStoreSubscriptions() {
        // Subscribe to cases
        store.subscribe('cases', (cases) => {
            this.renderFullTracker(this.currentFilter);
        });
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            await TrackerStore.loadCases();
            this.renderFullTracker(this.currentFilter);
        } catch (error) {
            console.error('[TrackerView] Load initial data error:', error);
        }
    }

    /**
     * Render full tracker (list or Kanban)
     */
    renderFullTracker(filter = '') {
        if (!this.trackerList) return;

        const countEl = document.getElementById('tracker-case-count');
        let cases = TrackerStore.getCases();

        // Filter by archived view
        cases = cases.filter(c => c.archived === this.isArchivedView);

        // Apply search filter
        if (filter) {
            const searchTerm = filter.toLowerCase();
            cases = cases.filter(c =>
                Object.values(c).some(val => String(val).toLowerCase().includes(searchTerm))
            );
        }

        // Apply status filter
        const statusFilterEl = document.getElementById('trFilterStatus');
        if (statusFilterEl && statusFilterEl.value !== 'all') {
            cases = cases.filter(c => (c.status || 'new') === statusFilterEl.value);
        }

        // Apply priority filter
        const priorityFilterEl = document.getElementById('trFilterPriority');
        if (priorityFilterEl && priorityFilterEl.value !== 'all') {
            cases = cases.filter(c => (c.priority || 'medium') === priorityFilterEl.value);
        }

        // Apply urgent filter
        const urgentFilterEl = document.getElementById('trFilterUrgent');
        if (urgentFilterEl && urgentFilterEl.checked) {
            cases = cases.filter(c => c.urgent);
        }

        // Apply favorite filter
        const favoriteFilterEl = document.getElementById('trFilterFavorite');
        if (favoriteFilterEl && favoriteFilterEl.checked) {
            cases = cases.filter(c => c.isFavorite);
        }

        // Apply tag filter
        const tagFilterEl = document.getElementById('trFilterTag');
        if (tagFilterEl && tagFilterEl.value !== 'all') {
            const selectedTag = tagFilterEl.value;
            cases = cases.filter(c => Array.isArray(c.tags) && c.tags.includes(selectedTag));
        }

        // Sort cases
        const sortEl = document.getElementById('trSort');
        const sortMethod = sortEl ? sortEl.value : 'deadline';
        const priorityOrder = { low: 0, medium: 1, high: 2 };
        cases.sort((a, b) => {
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

        // Empty state
        if (!cases.length) {
            this.trackerList.innerHTML = `
                <div class=\"flex flex-col items-center justify-center py-16 text-center\">
                    <div class=\"w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4\">
                        <i data-lucide=\"folder-open\" size=\"40\" class=\"text-slate-300 dark:text-slate-600\"></i>
                    </div>
                    <h3 class=\"text-lg font-bold text-slate-600 dark:text-slate-400 mb-2\">Brak spraw</h3>
                    <p class=\"text-sm text-slate-400 dark:text-slate-500 mb-4\">Dodaj pierwszą sprawę, aby rozpocząć</p>
                </div>`;
            if (countEl) countEl.textContent = '0 spraw';
            if (window.lucide) lucide.createIcons();
            return;
        }

        // Archived view: simple list
        if (this.isArchivedView) {
            this.trackerList.innerHTML = cases.map(c => this.createCaseBinder(c)).join('');
            if (countEl) countEl.textContent = `${cases.length} spraw`;
            if (window.lucide) lucide.createIcons();
            return;
        }

        // Active view: Kanban (3 columns: Nowe, W toku, Pilne)
        this.trackerList.innerHTML = `
            <div id=\"tracker-kanban\" class=\"grid grid-cols-1 lg:grid-cols-3 gap-4\">
                <div class=\"kanban-column\" data-column=\"new\">
                    <div class=\"kanban-column-header flex items-center justify-between text-xs text-slate-500 dark:text-slate-300 uppercase\">
                        <span>Nowe</span>
                    </div>
                    <div id=\"tracker-col-new\" class=\"space-y-3\" data-column=\"new\"></div>
                </div>
                <div class=\"kanban-column\" data-column=\"in-progress\">
                    <div class=\"kanban-column-header flex items-center justify-between text-xs text-slate-500 dark:text-slate-300 uppercase\">
                        <span>W toku</span>
                    </div>
                    <div id=\"tracker-col-in-progress\" class=\"space-y-3\" data-column=\"in-progress\"></div>
                </div>
                <div class=\"kanban-column\" data-column=\"urgent\">
                    <div class=\"kanban-column-header flex items-center justify-between text-xs text-slate-500 dark:text-slate-300 uppercase\">
                        <span>Pilne</span>
                    </div>
                    <div id=\"tracker-col-urgent\" class=\"space-y-3\" data-column=\"urgent\"></div>
                </div>
            </div>`;

        const colNew = document.getElementById('tracker-col-new');
        const colInProgress = document.getElementById('tracker-col-in-progress');
        const colUrgent = document.getElementById('tracker-col-urgent');

        const buckets = { new: [], 'in-progress': [], urgent: [] };

        cases.forEach(c => {
            if (c.urgent) {
                buckets.urgent.push(c);
            } else if ((c.status || 'new') === 'in-progress') {
                buckets['in-progress'].push(c);
            } else {
                buckets.new.push(c);
            }
        });

        if (colNew) colNew.innerHTML = (buckets.new || []).map(c => this.createCaseBinder(c)).join('');
        if (colInProgress) colInProgress.innerHTML = (buckets['in-progress'] || []).map(c => this.createCaseBinder(c)).join('');
        if (colUrgent) colUrgent.innerHTML = (buckets.urgent || []).map(c => this.createCaseBinder(c)).join('');

        if (countEl) countEl.textContent = `${cases.length} spraw`;
        if (window.lucide) lucide.createIcons();
    }

    /**
     * Create case binder (card)
     */
    createCaseBinder(caseData) {
        const statusLabels = { new: 'Nowa', 'in-progress': 'W toku', finished: 'Zakończona' };
        const urgentStyle = caseData.urgent ? 'border-red-200 dark:border-red-700' : 'border-slate-200 dark:border-slate-700';

        // Calculate days remaining
        const deadlineDate = new Date(caseData.deadline || caseData.date);
        const daysRemaining = Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24));
        let deadlineText = '';
        let deadlineColor = '';

        if (daysRemaining < 0) {
            deadlineText = `Przeterminowane ${Math.abs(daysRemaining)} dni`;
            deadlineColor = 'text-red-500';
        } else if (daysRemaining === 0) {
            deadlineText = 'Termin dzisiaj';
            deadlineColor = 'text-orange-500';
        } else if (daysRemaining <= 7) {
            deadlineText = `${daysRemaining} dni`;
            deadlineColor = 'text-orange-500';
        } else if (daysRemaining <= 14) {
            deadlineText = `${daysRemaining} dni`;
            deadlineColor = 'text-blue-500';
        } else {
            deadlineText = `${daysRemaining} dni`;
            deadlineColor = 'text-green-500';
        }

        const favoriteIcon = `<i data-lucide=\"star\" class=\"favorite-icon ${caseData.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'} hover:text-yellow-400\" onclick=\"event.stopPropagation(); trackerView.toggleFavorite(${caseData.id})\"></i>`;

        // Tags
        const tagsHTML = Array.isArray(caseData.tags) && caseData.tags.length > 0
            ? `<div class=\"flex flex-wrap gap-1 mt-1.5\">
                ${caseData.tags.map(tag => `<span class=\"px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300\">${tag}</span>`).join('')}
               </div>`
            : '';

        let folderClasses = 'case-binder kanban-item';
        if (caseData.urgent) folderClasses += ' urgent';
        if (caseData.isFavorite) folderClasses += ' favorite';

        return `
            <div class=\"${folderClasses} flex items-center py-3 pl-3 pr-5 rounded-xl border ${urgentStyle} cursor-pointer\" data-case-no=\"${caseData.no}\" data-case-id=\"${caseData.id}\" data-status=\"${caseData.status || 'new'}\">
                <div class=\"flex-1 min-w-0\">
                    <div class=\"flex items-center gap-3\">
                        <div class=\"font-bold text-slate-800 dark:text-white truncate\">${caseData.no}</div>
                        <div class=\"text-xs text-slate-400 font-mono\">${caseData.unp || ''}</div>
                    </div>
                    <div class=\"text-xs text-slate-500 dark:text-slate-400 mt-1 truncate\">${caseData.debtor || 'Brak danych zobowiązanego'}</div>
                    ${tagsHTML}
                </div>
                <div class=\"flex items-center gap-2 text-xs text-right ml-2 justify-end\">
                    <div class=\"w-28\">
                        <div class=\"font-bold text-slate-600 dark:text-slate-300\">${new Date(caseData.date).toLocaleDateString()}</div>
                        <div class=\"text-[10px] font-bold ${deadlineColor}\">${deadlineText}</div>
                        ${caseData.deadline ? `<div class=\"text-[9px] text-slate-500\">Termin: ${new Date(caseData.deadline).toLocaleDateString()}</div>` : ''}
                    </div>
                    <div class=\"tracker-status-badge w-20 text-xs font-bold rounded bg-slate-50 dark:bg-opacity-20 text-slate-600\">${statusLabels[caseData.status] || 'Nowa'}</div>
                    <div class=\"flex items-center gap-1 icon-container\">
                        <div class=\"icon-wrapper\">${favoriteIcon}</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Toggle favorite
     */
    async toggleFavorite(caseId) {
        try {
            await TrackerStore.toggleFavorite(caseId);
        } catch (error) {
            console.error('[TrackerView] Toggle favorite error:', error);
        }
    }

    /**
     * Open case
     */
    openCase(caseId, editMode = false) {
        try {
            const cases = TrackerStore.getCases();
            const caseData = cases.find(c => c.id === caseId);
            if (!caseData) {
                console.warn('[TrackerView] Case not found for id:', caseId);
                return;
            }

            // Zapamiętaj aktualną sprawę (dla załączników, itd.)
            this.currentCaseId = caseId;
            window.currentCaseId = caseId;

            // Wypełnij pola formularza
            const noInput = document.getElementById('trNo');
            const unpInput = document.getElementById('trUnp');
            const debtorInput = document.getElementById('trDebtor');
            const dateInput = document.getElementById('trDate');
            const deadlineInput = document.getElementById('trDeadline');
            const statusSelect = document.getElementById('trStatus');
            const urgentCheckbox = document.getElementById('trUrgent');
            const prioritySelect = document.getElementById('trPriority');
            const noteInput = document.getElementById('trNote');

            if (noInput) noInput.value = caseData.no || '';
            if (unpInput) unpInput.value = caseData.unp || '';
            if (debtorInput) debtorInput.value = caseData.debtor || '';
            if (dateInput) dateInput.value = caseData.date || '';

            if (deadlineInput) {
                deadlineInput.value = caseData.deadline || '';
                if (!deadlineInput.value && caseData.date) {
                    this.updateDeadlineFromDate();
                }
            }

            if (statusSelect) statusSelect.value = caseData.status || 'new';
            if (urgentCheckbox) urgentCheckbox.checked = !!caseData.urgent;
            if (prioritySelect) prioritySelect.value = caseData.priority || 'medium';
            if (noteInput) noteInput.value = caseData.note || '';

            // Ustaw tryb podglądu/edycji
            this.setViewMode(editMode, caseData);

            // Zaktualizuj label nagłówka
            const labelEl = document.getElementById('tracker-case-label');
            if (labelEl) {
                labelEl.textContent = editMode
                    ? `Edycja: ${caseData.no}`
                    : `Podgląd: ${caseData.no}`;
            }

            // Przełącz widok grid -> szczegóły
            const gridView = document.getElementById('tracker-grid-view');
            const detailView = document.getElementById('tracker-detail-view');
            if (gridView) gridView.classList.add('-translate-x-full');
            if (detailView) detailView.classList.remove('translate-x-full');

            // Załączniki (jeśli istnieje globalna funkcja)
            if (typeof window.renderAttachments === 'function') {
                window.renderAttachments(caseId);
            }
        } catch (error) {
            console.error('[TrackerView] openCase error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd otwierania sprawy'
            });
        }
    }

    /**
     * Update deadline based on date input (similar to legacy)
     */
    updateDeadlineFromDate() {
        const dateInput = document.getElementById('trDate');
        const deadlineInput = document.getElementById('trDeadline');
        if (!dateInput || !deadlineInput || !dateInput.value) return;

        const baseDate = new Date(dateInput.value);
        if (Number.isNaN(baseDate.getTime())) return;

        baseDate.setDate(baseDate.getDate() + DEFAULT_DEADLINE_DAYS);
        deadlineInput.value = baseDate.toISOString().split('T')[0];
    }

    /**
     * Set view mode (view vs edit) similar to legacy setViewMode
     */
    setViewMode(editMode, caseData) {
        const fieldIds = ['trNo', 'trUnp', 'trDebtor', 'trDate', 'trDeadline', 'trStatus', 'trPriority', 'trUrgent', 'trNote'];
        const saveBtn = document.getElementById('save-case-btn');
        const editBtn = document.getElementById('edit-case-btn');

        fieldIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.disabled = !editMode;
            if (!editMode) {
                el.classList.add('bg-slate-50', 'dark:bg-slate-800/50', 'cursor-not-allowed');
            } else {
                el.classList.remove('bg-slate-50', 'dark:bg-slate-800/50', 'cursor-not-allowed');
            }
        });

        if (saveBtn) saveBtn.classList.toggle('hidden', !editMode);
        if (editBtn) editBtn.classList.toggle('hidden', editMode);

        // Tagi & input tagów – na razie tylko blokowanie w trybie podglądu
        const tagInput = document.getElementById('trTagInput');
        if (tagInput) tagInput.disabled = !editMode;

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

    /**
     * Add new case
     */
    addNewCase() {
        try {
            this.currentCaseId = null;
            const isEditMode = true;

            // Clear all fields
            const noInput = document.getElementById('trNo');
            const unpInput = document.getElementById('trUnp');
            const debtorInput = document.getElementById('trDebtor');
            const dateInput = document.getElementById('trDate');
            const deadlineInput = document.getElementById('trDeadline');
            const statusSelect = document.getElementById('trStatus');
            const urgentCheckbox = document.getElementById('trUrgent');
            const prioritySelect = document.getElementById('trPriority');
            const noteInput = document.getElementById('trNote');

            // Set default values
            if (noInput) noInput.value = 'Nowa sprawa'; // User can change this
            if (unpInput) unpInput.value = '';
            if (debtorInput) debtorInput.value = '';
            
            const today = new Date().toISOString().split('T')[0];
            if (dateInput) dateInput.value = today;
            if (deadlineInput) {
                this.updateDeadlineFromDate();
            }
            
            if (statusSelect) statusSelect.value = 'new';
            if (urgentCheckbox) urgentCheckbox.checked = false;
            if (prioritySelect) prioritySelect.value = 'medium';
            if (noteInput) noteInput.value = '';

            // Set edit mode
            this.setViewMode(isEditMode);

            // Update label
            const labelEl = document.getElementById('tracker-case-label');
            if (labelEl) labelEl.textContent = 'Nowa Sprawa';

            // Switch view
            const gridView = document.getElementById('tracker-grid-view');
            const detailView = document.getElementById('tracker-detail-view');
            if (gridView) gridView.classList.add('-translate-x-full');
            if (detailView) detailView.classList.remove('translate-x-full');

            console.log('[TrackerView] New case form opened');
        } catch (error) {
            console.error('[TrackerView] addNewCase error:', error);
        }
    }

    /**
     * Destroy view
     */
    destroy() {
        console.log('[TrackerView] Destroying...');
        this.container = null;
        this.trackerList = null;
        this.currentCaseId = null;
    }
}

// Create and export singleton instance
const trackerView = new TrackerView();

export default trackerView;
