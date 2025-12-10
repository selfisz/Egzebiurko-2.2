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

console.log('[App] Starting Egzebiurko 3.0...');

// Helper: safely call optional load() on modules
function safeLoad(module, name) {
    try {
        if (module && typeof module.load === 'function') {
            console.log(`[App] Loading module data: ${name}...`);
            return module.load();
        }
        console.warn(`[App] Module ${name} has no load() - skipping initial data load`);
        return Promise.resolve();
    } catch (e) {
        console.error(`[App] Error while calling ${name}.load():`, e);
        return Promise.resolve();
    }
}

/**
 * Inicjalizacja aplikacji
 */
async function initApp() {
    try {
        // 1. Inicjalizuj bazę danych
        console.log('[App] Initializing database...');
        await db.init();
        
        // 2. Załaduj dane do store (bezpiecznie – nie zakładaj, że każdy moduł ma load())
        console.log('[App] Loading initial data...');
        await Promise.all([
            store.dispatch('loadCases'),
            safeLoad(notesModule, 'notes'),
            safeLoad(linksModule, 'links'),
            safeLoad(registryModule, 'registry'),
            safeLoad(carsModule, 'cars'),
            safeLoad(terrainModule, 'terrain'),
            safeLoad(trackerModule, 'tracker')
        ]);
        
        // 3. Inicjalizuj moduły
        console.log('[App] Initializing modules...');
        
        console.log('[App] Init: quickActions');
        quickActionsModule.init();
        
        console.log('[App] Init: notes');
        notesModule.init();
        
        console.log('[App] Init: links');
        linksModule.init();
        
        console.log('[App] Init: registry');
        registryModule.init();
        
        console.log('[App] Init: finance');
        financeModule.init();
        
        console.log('[App] Init: cars');
        carsModule.init();
        
        console.log('[App] Init: generator');
        generatorModule.init();
        
        console.log('[App] Init: ai');
        aiModule.init();
        
        console.log('[App] Init: statistics');
        statisticsModule.init();
        
        console.log('[App] Init: security');
        securityModule.init();
        
        console.log('[App] Init: globalSearch');
        globalSearchModule.init();
        
        console.log('[App] Init: terrain');
        terrainModule.init();
        
        console.log('[App] Init: tracker');
        trackerModule.init();
        
        console.log('[App] Init: testModule');
        testModule.init(); // TEST MODULE - powinien pokazać alert
        
        // Export views to window for legacy HTML compatibility
        window.terrainView = terrainModule.view;
        window.trackerView = trackerModule.view;

        // Legacy Notes HTML (views_bundle.js) używa globalnych funkcji
        // newNote/saveNote/deleteNote/filterNotes. Przekierowujemy je
        // na ES6 NotesView, aby korzystała z NotesStore i głównego store'a.
        window.notesView = notesModule.view;
        window.newNote = () => notesModule.view.createNewNote();
        window.saveNote = () => notesModule.view.saveCurrentNote();
        window.deleteNote = () => notesModule.view.deleteCurrentNote();
        window.filterNotes = (query) => notesModule.view.filterNotes(query || '');

        // Bridges for GlobalSearch navigation
        // Always override/provide these functions so ES6 GlobalSearch can navigate properly.
        // Legacy goToModule from js/ui.js will be used if available, otherwise fallback.
        if (typeof window.goToModule !== 'function') {
            window.goToModule = (moduleName) => {
                window.location.hash = `#${moduleName}`;
            };
        }

        // Tracker: ALWAYS expose openCase and addNewCase for GlobalSearch/UI buttons
        // This ensures ES6 GlobalSearch can open cases via ES6 TrackerView.
        window.trackerModule = window.trackerModule || {};
        window.trackerModule.openCase = (caseId) => {
            console.log('[Bridge] Opening case via ES6 TrackerView:', caseId);
            trackerModule.view.openCase(caseId);
        };
        window.trackerModule.addNewCase = () => {
            console.log('[Bridge] Adding new case via ES6 TrackerView');
            trackerModule.view.addNewCase();
        };

        // Cars: ALWAYS expose openCar for GlobalSearch, overriding legacy if needed.
        // This ensures ES6 GlobalSearch can open car details via ES6 CarsView.
        window.carsModule = window.carsModule || {};
        window.carsModule.openCar = (carId) => {
            console.log('[Bridge] Opening car via ES6 CarsView:', carId);
            carsModule.carsView.openCarDetails(carId);
        };
        window.openCar = (carId) => {
            console.log('[Bridge] Opening car via ES6 CarsView (direct):', carId);
            carsModule.carsView.openCarDetails(carId);
        };
        
        // 4. Setup UI
        console.log('[App] Setting up UI...');
        setupUI();
        
        // 5. Restore user preferences
        restorePreferences();
        
        console.log('[App] ✅ Application initialized successfully!');
        
        // Notify user
        store.commit('ADD_NOTIFICATION', {
            type: 'success',
            message: 'Aplikacja załadowana pomyślnie!'
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
        // Escape - zamknij modals
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
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
