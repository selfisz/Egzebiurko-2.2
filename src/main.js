/**
 * Main Entry Point - Egzebiurko 3.0
 * ES6 Modules Architecture
 */

import store from './store/index.js';
import db from './utils/db.js';

// Import all migrated modules
import quickActionsModule from './modules/quickActions/index.js';
import notesModule from './modules/Notes/index.js';
import linksModule from './modules/Links/index.js';
import registryModule from './modules/Registry/index.js';
import financeModule from './modules/Finance/index.js';
import carsModule from './modules/Cars/index.js';
import generatorModule from './modules/Generator/index.js';
import aiModule from './modules/AI/index.js';
import statisticsModule from './modules/Statistics/index.js';
import securityModule from './modules/Security/index.js';
import globalSearchModule from './modules/GlobalSearch/index.js';
import terrainModule from './modules/Terrain/index.js';
import trackerModule from './modules/tracker/index.js';
import testModule from './modules/TestModule/index.js';

console.log('[App] Starting Egzebiurko 3.0 (SRC Mode)...');

/**
 * Inicjalizacja aplikacji
 */
async function initApp() {
    try {
        // 1. Inicjalizuj bazę danych
        console.log('[App] Initializing database...');
        await db.init();
        
        // 2. Załaduj dane do store
        console.log('[App] Loading initial data...');
        await Promise.all([
            store.dispatch('loadCases'),
            notesModule.load(),
            linksModule.load(),
            registryModule.load(),
            carsModule.load(),
            terrainModule.load(),
            trackerModule.load()
        ]);
        
        // 3. Inicjalizuj moduły
        console.log('[App] Initializing modules...');
        quickActionsModule.init();
        notesModule.init();
        linksModule.init();
        registryModule.init();
        financeModule.init();
        carsModule.init();
        generatorModule.init();
        aiModule.init();
        statisticsModule.init();
        securityModule.init();
        globalSearchModule.init();
        terrainModule.init();
        trackerModule.init();
        testModule.init(); // TEST MODULE - powinien pokazać alert
        
        // Export views to window for legacy HTML compatibility
        window.terrainView = terrainModule.view;
        window.trackerView = trackerModule.view;

        // Legacy Notes HTML (views_bundle.js) używa globalnych funkcji
        window.notesView = notesModule.view;
        window.newNote = () => notesModule.view.createNewNote();
        window.saveNote = () => notesModule.view.saveCurrentNote();
        window.deleteNote = () => notesModule.view.deleteCurrentNote();
        window.filterNotes = (query) => notesModule.view.filterNotes(query || '');

        // Bridges for GlobalSearch navigation
        // Re-implement goToModule directly to ensure it works in SRC mode
        window.goToModule = (moduleName, options = {}) => {
            window.location.hash = `#${moduleName}`;

            // Update active nav state
            document.querySelectorAll('[id^="nav-"]').forEach(btn => {
                btn.classList.remove('bg-white/10', 'text-white');
            });
            const activeBtn = document.getElementById(`nav-${moduleName}`);
            if (activeBtn) {
                activeBtn.classList.add('bg-white/10', 'text-white');
            }

            // Load view logic if needed (handled by hashchange usually, but explicit call helps)
            // Note: hashchange listener in js/loader.js handles the actual view injection

            // Handle options
            if (options.caseId && window.trackerModule && window.trackerModule.openCase) {
                setTimeout(() => window.trackerModule.openCase(options.caseId), 100);
            }
        };

        // UI Helpers
        window.toggleSearch = () => {
             const modal = document.getElementById('searchModal');
             if (modal) {
                 modal.classList.toggle('hidden');
                 if (!modal.classList.contains('hidden')) {
                     setTimeout(() => document.getElementById('globalSearchInput')?.focus(), 50);
                 }
             }
        };

        window.closeGlobalSearch = () => {
             const modal = document.getElementById('searchModal');
             if (modal) modal.classList.add('hidden');
        };

        // --- GLOBAL SEARCH BRIDGE ---
        window.runGlobalSearch = (query) => {
             // Sync input if called from oninput="runGlobalSearch(this.value)"
             const input = document.getElementById('globalSearchInput');
             if (input && input.value !== query) {
                 input.value = query;
             }
             // Trigger search in module
             // Using view's debounce or direct search
             if (globalSearchModule.view) {
                 globalSearchModule.view.debounceSearch(query);
             }
        };

        // Tracker Bridges
        window.trackerModule = window.trackerModule || {};
        window.trackerModule.openCase = (caseId) => {
            console.log('[Bridge] Opening case via ES6 TrackerView:', caseId);
            trackerModule.view.openCase(caseId);
        };
        // Ensure other tracker functions used in HTML are available
        // Example: toggleTodayQuickPlan is called in index.html header
        window.trackerModule.toggleTodayQuickPlan = () => trackerModule.view.toggleTodayQuickPlan();
        window.trackerModule.closeDayPlanModal = () => trackerModule.view.closeDayPlanModal();
        window.trackerModule.addTaskFromModal = () => trackerModule.view.addTaskFromModal();
        window.trackerModule.addReminderFromModal = () => trackerModule.view.addReminderFromModal();
        // Bridge legacy render functions if used by loader
        window.trackerModule.initTracker = () => trackerModule.view.render();


        // Cars Bridges
        window.carsModule = window.carsModule || {};
        window.carsModule.openCar = (carId) => {
            console.log('[Bridge] Opening car via ES6 CarsView:', carId);
            carsModule.carsView.openCarDetails(carId);
        };
        window.openCar = (carId) => {
            console.log('[Bridge] Opening car via ES6 CarsView (direct):', carId);
            carsModule.carsView.openCarDetails(carId);
        };
        // Loader hook
        window.loadGarage = () => carsModule.carsView.renderCarsList();

        
        // 4. Setup UI
        console.log('[App] Setting up UI...');
        setupUI();
        
        // 5. Restore user preferences
        restorePreferences();
        
        console.log('[App] ✅ Application initialized successfully!');
        
        // Notify user
        store.commit('ADD_NOTIFICATION', {
            type: 'success',
            message: 'Aplikacja załadowana pomyślnie (SRC)!'
        });
        
    } catch (error) {
        console.error('[App] ❌ Initialization failed:', error);
        
        store.commit('ADD_NOTIFICATION', {
            type: 'error',
            message: `Błąd inicjalizacji: ${error.message}`
        });
    }
}

/**
 * Setup UI - event listeners, theme, etc.
 */
function setupUI() {
    // Dark mode toggle
    const darkModeBtn = document.getElementById('darkModeBtn');
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', () => {
            const currentMode = store.get('darkMode');
            store.commit('SET_DARK_MODE', !currentMode);
        });
    }
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            store.commit('TOGGLE_SIDEBAR');
        });
    }
    
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape - close modals
        if (e.key === 'Escape') {
            closeAllModals();
            window.closeGlobalSearch();
            document.getElementById('notifPopover')?.classList.add('hidden');
        }

        // Ctrl+K / Cmd+K - Global Search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            window.toggleSearch();
        }
    });

    // Routing - Handle Back/Forward buttons
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1) || 'dashboard';
        // Only load if not already active (optional optimization, but loader handles it)
        if (typeof window.loadView === 'function') {
            window.loadView(hash);

            // Update sidebar active state
            document.querySelectorAll('[id^="nav-"]').forEach(btn => {
                btn.classList.remove('bg-white/10', 'text-white');
            });
            const activeBtn = document.getElementById(`nav-${hash}`);
            if (activeBtn) {
                activeBtn.classList.add('bg-white/10', 'text-white');
            }
        }
    });
    
    // Initial Route
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        const hash = window.location.hash.substring(1) || 'dashboard';
        if (typeof window.goToModule === 'function') {
            window.goToModule(hash);
        }
    }

    // PDF Worker
    if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    // Legacy Edit Modes (Sidebar/Dashboard)
    window.toggleSidebarEditMode = () => {
        // Simple toggle for now, full sortable logic requires SortableJS loaded
        const btn = document.getElementById('edit-sidebar-btn');
        if (btn) {
            const isEditing = btn.textContent.includes('Zapisz');
            if (isEditing) {
                btn.innerHTML = '<i data-lucide="move" size="14"></i> Edytuj';
                btn.classList.remove('text-green-500');
                // Save logic would go here
            } else {
                btn.innerHTML = '<i data-lucide="check" size="14"></i> Zapisz';
                btn.classList.add('text-green-500');
                // Init sortable if available
                if (window.Sortable) {
                     new Sortable(document.getElementById('module-list'), {
                        animation: 150,
                        ghostClass: 'sortable-ghost',
                        onEnd: function (evt) {
                            const order = Array.from(document.getElementById('module-list').children).map(item => item.dataset.moduleId);
                            localStorage.setItem('sidebarOrder', JSON.stringify(order));
                        }
                    });
                }
            }
            if (window.lucide) lucide.createIcons();
        }
    };

    window.toggleDashboardEditMode = () => {
        const grid = document.getElementById('dashboard-grid');
        const btn = document.getElementById('edit-dashboard-btn');
        if (!grid || !btn) return;

        const isEditing = grid.classList.contains('edit-mode');
        if (isEditing) {
            btn.innerHTML = '<i data-lucide="move" class="inline-block mr-2"></i> Edytuj układ';
            btn.classList.remove('bg-green-500', 'text-white');
            grid.classList.remove('edit-mode');
        } else {
            btn.innerHTML = '<i data-lucide="check" class="inline-block mr-2"></i> Zapisz układ';
            btn.classList.add('bg-green-500', 'text-white');
            grid.classList.add('edit-mode');

            if (window.Sortable) {
                new Sortable(grid, {
                    animation: 150,
                    ghostClass: 'sortable-ghost',
                    onEnd: function (evt) {
                        const order = Array.from(grid.children).map(item => item.dataset.moduleId);
                        localStorage.setItem('dashboardOrder', JSON.stringify(order));
                    }
                });
            }
        }
        if (window.lucide) lucide.createIcons();
    };

    // Apply saved sidebar order on load
    try {
        const savedOrder = JSON.parse(localStorage.getItem('sidebarOrder'));
        if (savedOrder) {
            const moduleList = document.getElementById('module-list');
            if (moduleList) {
                const items = Array.from(moduleList.children);
                const sortedItems = savedOrder.map(id => items.find(item => item.dataset.moduleId === id)).filter(Boolean);
                sortedItems.forEach(item => moduleList.appendChild(item));
                // Append any new items not in saved order
                items.filter(item => !sortedItems.includes(item)).forEach(item => moduleList.appendChild(item));
            }
        }
    } catch (e) { console.error('Sidebar order error', e); }

    // Subscribe to notifications
    store.subscribe('notifications', (notifications) => {
        renderNotifications(notifications);
    });
}

/**
 * Restore user preferences from localStorage
 */
function restorePreferences() {
    // Dark mode
    const darkMode = localStorage.getItem('darkMode') === 'true';
    store.commit('SET_DARK_MODE', darkMode);
    
    // Sidebar
    const sidebarCollapsed = localStorage.getItem('lex_sidebar_collapsed') === 'true';
    if (sidebarCollapsed) {
        store.commit('TOGGLE_SIDEBAR');
    }
}

/**
 * Close all modals
 */
function closeAllModals() {
    document.querySelectorAll('[id$="Modal"], [id$="Form"]').forEach(modal => {
        modal.classList.add('hidden');
    });
}

/**
 * Render notifications
 */
function renderNotifications(notifications) {
    const container = document.getElementById('notifList');
    if (!container) return;
    
    if (!notifications || notifications.length === 0) {
        container.innerHTML = `
            <div class="p-4 text-center text-slate-400 text-sm">
                <i data-lucide="bell-off" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                <p>Brak powiadomień</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
    }
    
    // Sort by timestamp (newest first)
    const sorted = [...notifications].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    container.innerHTML = sorted.map(notif => {
        const typeColors = {
            success: 'bg-green-50 dark:bg-green-900/20 text-green-600',
            error: 'bg-red-50 dark:bg-red-900/20 text-red-600',
            warning: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600',
            info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
        };
        
        const typeIcons = {
            success: 'check-circle',
            error: 'alert-circle',
            warning: 'alert-triangle',
            info: 'info'
        };
        
        const color = typeColors[notif.type] || typeColors.info;
        const icon = typeIcons[notif.type] || typeIcons.info;
        const time = new Date(notif.timestamp).toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="p-3 ${color} rounded-lg mb-2 relative group">
                <div class="flex items-start gap-2">
                    <i data-lucide="${icon}" class="w-4 h-4 mt-0.5 flex-shrink-0"></i>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium break-words">${notif.message}</p>
                        <p class="text-xs opacity-70 mt-1">${time}</p>
                    </div>
                    <button 
                        onclick="window.store?.commit('REMOVE_NOTIFICATION', ${notif.id})"
                        class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/10 rounded"
                        title="Usuń"
                    >
                        <i data-lucide="x" class="w-3 h-3"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    if (window.lucide) window.lucide.createIcons();
}

/**
 * Export all data (backup)
 */
export async function exportAllData() {
    try {
        await db.backup();
        store.commit('ADD_NOTIFICATION', {
            type: 'success',
            message: 'Backup utworzony pomyślnie!'
        });
    } catch (error) {
        console.error('[App] Backup failed:', error);
        store.commit('ADD_NOTIFICATION', {
            type: 'error',
            message: `Błąd backupu: ${error.message}`
        });
    }
}

/**
 * Import data (restore)
 */
export async function importData(file) {
    try {
        await db.restore(file);
        await store.dispatch('loadCases');
        
        store.commit('ADD_NOTIFICATION', {
            type: 'success',
            message: 'Dane przywrócone pomyślnie!'
        });
    } catch (error) {
        console.error('[App] Restore failed:', error);
        store.commit('ADD_NOTIFICATION', {
            type: 'error',
            message: `Błąd przywracania: ${error.message}`
        });
    }
}

// Start aplikacji po załadowaniu DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Export dla backward compatibility
window.exportAllData = exportAllData;
window.importData = importData;
window.store = store;
window.db = db;

console.log('[App] Main module loaded');
