/**
 * Main Module - ES6 Entry Point
 * Properly loads refactored modules using ES6 imports
 */

// Import Store and AppController directly (ES6 modules)
import store from '../src/store/index.js';
import appController from '../src/core/AppController.js';

console.log('[Main Module] Starting Egzebiurko with ES6 Modules...');

// Make store globally available for legacy code compatibility
window.store = store;
window.appController = appController;

// --- ROUTING ---
window.addEventListener('hashchange', handleRouteChange);

function handleRouteChange() {
    const hash = window.location.hash.substring(1);
    const moduleName = hash || 'dashboard';
    
    if (typeof goToModule === 'function') {
        goToModule(moduleName);
    }

    if (typeof checkNotifications === 'function') checkNotifications();
    if (typeof renderDashboardWidgets === 'function') renderDashboardWidgets();
}

// Export to global scope for HTML onclick handlers
window.handleRouteChange = handleRouteChange;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    // PIN check
    try {
        const storedPin = localStorage.getItem('lex_pin');
        if (storedPin) {
            const overlay = document.getElementById('pinLockOverlay');
            const input = document.getElementById('pinInput');
            const errorEl = document.getElementById('pinError');
            if (overlay) overlay.classList.remove('hidden');
            if (input) {
                input.value = '';
                input.focus();
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && typeof submitPin === 'function') {
                        submitPin();
                    }
                });
            }
            if (errorEl) errorEl.textContent = '';

            // Wait for correct PIN before starting
            const originalSubmitPin = window.submitPin;
            window.submitPin = () => {
                const beforeHidden = overlay.classList.contains('hidden');
                if (originalSubmitPin) originalSubmitPin();
                if (overlay.classList.contains('hidden') && !beforeHidden) {
                    startApp();
                    window.submitPin = originalSubmitPin;
                }
            };
            return;
        }
    } catch (e) {
        console.error('[Main Module] PIN init error:', e);
    }

    startApp();
});

async function startApp() {
    console.log('[Main Module] Starting application...');
    
    // 1. Initialize database (legacy function)
    if (typeof initDB === 'function') {
        await initDB();
        console.log('[Main Module] ✅ Database initialized');
    }
    
    // 2. Commit database to store
    if (window.store && typeof state !== 'undefined' && state.db) {
        window.store.commit('SET_DB', state.db);
        console.log('[Main Module] ✅ Database committed to store');
    }
    
    // 3. Initialize AppController (modular architecture)
    try {
        await appController.initialize();
        console.log('[Main Module] ✅ AppController initialized successfully');
    } catch (error) {
        console.error('[Main Module] ❌ AppController initialization error:', error);
    }
    
    // 4. Handle initial route
    handleRouteChange();
    
    // 5. Create Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // 6. Restore UI state
    restoreUIState();
    
    // 7. Initialize legacy modules (for backward compatibility)
    initLegacyModules();
    
    console.log('[Main Module] ✅ Application started successfully!');
}

function restoreUIState() {
    // Restore Sidebar State
    if (localStorage.getItem('lex_sidebar_collapsed') === 'true') {
        const sidebar = document.getElementById('sidebar');
        const btn = document.getElementById('sidebarPinBtn');
        if (sidebar) sidebar.classList.add('sidebar-collapsed');
        if (btn) btn.innerHTML = '<i data-lucide="pin-off" size="16"></i>';
    } else {
        const btn = document.getElementById('sidebarPinBtn');
        if (btn) btn.classList.add('text-indigo-400');
    }
    
    // Restore Dark Mode
    if (typeof CONFIG !== 'undefined' && localStorage.getItem(CONFIG.THEME.DARK_MODE_KEY) === 'true') {
        document.documentElement.classList.add('dark');
    }
    
    // Restore Theme
    if (typeof setTheme === 'function') {
        setTheme('default');
    }
    
    // Apply sidebar order
    if (typeof applySidebarOrder === 'function') {
        applySidebarOrder();
    }
    
    // Update PIN status
    if (typeof updatePinStatus === 'function') {
        updatePinStatus();
    }
    
    // Initialize backup reminder
    if (typeof initBackupReminder === 'function') {
        initBackupReminder();
    }
}

function initLegacyModules() {
    // Quick Actions
    if (typeof quickActionsModule !== 'undefined' && quickActionsModule.init) {
        quickActionsModule.init();
    }
    
    // Security (if enabled)
    if (typeof securityModule !== 'undefined' && localStorage.getItem('security_enabled') === 'true') {
        if (securityModule.init) securityModule.init();
    }
}

// --- KEYBOARD SHORTCUTS ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('[id$="Modal"], [id$="Form"]').forEach(m => m.classList.add('hidden'));
        const notifPopover = document.getElementById('notifPopover');
        const searchModal = document.getElementById('searchModal');
        if (notifPopover) notifPopover.classList.add('hidden');
        if (searchModal) searchModal.classList.add('hidden');
    }
    // Spotlight shortcut (Cmd+K or Ctrl+K)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (typeof toggleSearch === 'function') toggleSearch();
    }
});

// --- GLOBAL VALIDATION ---
document.addEventListener('input', (e) => {
    const id = e.target.id ? e.target.id.toLowerCase() : '';
    if (id.includes('nip') && typeof validateInput === 'function') validateInput(e.target, 'nip');
    if (id.includes('pesel') && typeof validateInput === 'function') validateInput(e.target, 'pesel');
});

// --- PDF WORKER SETUP ---
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// Export runGlobalSearch
if (typeof runGlobalSearch === 'function') {
    window.runGlobalSearch = runGlobalSearch;
}

console.log('[Main Module] ES6 module loaded successfully');
