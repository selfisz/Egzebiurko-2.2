/**
 * Main Entry Point - Egzebiurko 3.0
 * ES6 Modules Architecture
 */

import store from './store/index.js';
import db from './utils/db.js';
import quickActionsModule from './modules/quickActions/index.js';

console.log('[App] Starting Egzebiurko 3.0...');

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
        await store.dispatch('loadCases');
        
        // 3. Inicjalizuj moduły
        console.log('[App] Initializing modules...');
        quickActionsModule.init();
        
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
    // TODO: Implement notification UI
    console.log('[App] Notifications:', notifications);
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
