// Main App Entry Point (LEGACY)
// Uwaga: Aplikacja działa wyłącznie na kodzie z folderu /js (legacy).
// Folder /src jest odłączony i służy tylko jako magazyn/archiwum.

// --- ROUTING ---
window.addEventListener('hashchange', handleRouteChange);

function handleRouteChange() {
    const hash = window.location.hash.substring(1);
    // If hash is empty or just '#', default to 'dashboard'
    const moduleName = hash || 'dashboard';
    goToModule(moduleName);

    // Always check notifications and widgets on route change
    if (typeof checkNotifications === 'function') checkNotifications();
    if (typeof renderDashboardWidgets === 'function') renderDashboardWidgets();
}

// Prosty legacy router – przełączanie modułów przez loader.js i podświetlanie sidebaru
function goToModule(moduleName) {
    try {
        const current = (window.location.hash || '').substring(1) || 'dashboard';

        // Jeśli wywołanie pochodzi z kliknięcia w sidebar – ustaw hash i pozwól hashchange obsłużyć resztę
        if (current !== moduleName) {
            window.location.hash = `#${moduleName}`;
            return;
        }

        // Gdy hash już jest poprawny (np. wywołanie z handleRouteChange) – załaduj widok
        if (typeof loadView === 'function') {
            loadView(moduleName);
        }

        // Podświetl aktywny przycisk w sidebarze
        const navButtons = document.querySelectorAll('[id^="nav-"]');
        navButtons.forEach(btn => btn.classList.remove('bg-white/10', 'text-white'));
        const activeBtn = document.getElementById(`nav-${moduleName}`);
        if (activeBtn) {
            activeBtn.classList.add('bg-white/10', 'text-white');
        }
    } catch (e) {
        console.error('goToModule error:', e);
    }
}

// Export to global scope for HTML onclick handlers
window.handleRouteChange = handleRouteChange;
window.goToModule = goToModule;

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', async () => {
    // PIN: jeśli ustawiony, pokaż overlay przed inicjalizacją
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
                    if (e.key === 'Enter') {
                        submitPin();
                    }
                });
            }
            if (errorEl) errorEl.textContent = '';

            // Opóźnij pełną inicjalizację do momentu poprawnego PIN-u
            const originalSubmitPin = window.submitPin;
            window.submitPin = () => {
                const beforeHidden = overlay.classList.contains('hidden');
                originalSubmitPin();
                // jeśli po wywołaniu overlay jest ukryty, znaczy że PIN poprawny -> inicjalizujemy
                if (overlay.classList.contains('hidden') && !beforeHidden) {
                    startApp();
                    window.submitPin = originalSubmitPin; // przywróć oryginalną funkcję
                }
            };
            return; // nie inicjalizuj dalej, czekaj na PIN
        }
    } catch (e) {
        console.error('PIN init error:', e);
    }

    // Jeśli PIN nie jest ustawiony, od razu startujemy aplikację
    startApp();
});

async function startApp() {
    // Legacy-only start: nie korzystamy z /src ani modułowego store.
    await initDB();
    
    handleRouteChange(); // Initial route handler
    lucide.createIcons();
    
    // Restore Sidebar State
    if(localStorage.getItem('lex_sidebar_collapsed') === 'true') {
        document.getElementById('sidebar').classList.add('sidebar-collapsed');
        const btn = document.getElementById('sidebarPinBtn');
        if(btn) btn.innerHTML = '<i data-lucide="pin-off" size="16"></i>';
    } else {
        const btn = document.getElementById('sidebarPinBtn');
        if(btn) btn.classList.add('text-indigo-400');
    }
    
    // Restore Dark Mode
    if(localStorage.getItem(CONFIG.THEME.DARK_MODE_KEY) === 'true') document.documentElement.classList.add('dark');

    // Restore Theme
    setTheme('default');

    applySidebarOrder();
    
    // Zaktualizuj status PIN w Ustawieniach (jeśli widok będzie otwarty później)
    if (typeof updatePinStatus === 'function') {
        updatePinStatus();
    }
    
    // Inicjalizuj przypomnienia o backupie (sprawdzanie o 17:00)
    if (typeof initBackupReminder === 'function') {
        initBackupReminder();
    }
    
    // ===== NOWE MODUŁY =====
    // Inicjalizuj moduł szybkich akcji
    if (typeof quickActionsModule !== 'undefined') {
        quickActionsModule.init();
    }
    
    // Inicjalizuj moduł bezpieczeństwa (jeśli włączony)
    if (typeof securityModule !== 'undefined' && localStorage.getItem('security_enabled') === 'true') {
        securityModule.init();
    }
}

// --- KEYBOARD SHORTCUTS ---
document.addEventListener('keydown',(e)=>{ 
    if(e.key==="Escape") {
        document.querySelectorAll('[id$="Modal"], [id$="Form"]').forEach(m=>m.classList.add('hidden'));
        document.getElementById('notifPopover').classList.add('hidden');
        document.getElementById('searchModal').classList.add('hidden');
    }
    // Spotlight shortcut (Cmd+K or Ctrl+K)
    if((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
    }
});

// --- GLOBAL VALIDATION ---
document.addEventListener('input', (e) => {
    const id = e.target.id ? e.target.id.toLowerCase() : '';
    if (id.includes('nip')) validateInput(e.target, 'nip');
    if (id.includes('pesel')) validateInput(e.target, 'pesel');
});

function validateInput(el, type) {
    const val = el.value.replace(/[\s-]/g, ''); // Clean formatting
    let valid = false;

    if (type === 'nip') {
        valid = /^\d{10}$/.test(val) && isValidNIP(val);
    } else if (type === 'pesel') {
        valid = /^\d{11}$/.test(val) && isValidPESEL(val);
    }

    // Only show error if value is not empty (and not partial if focused... simplistic approach here)
    // Actually, show error if length is full but invalid, or remove error if valid.
    if (val.length > 0) {
        if (!valid) {
            el.classList.add('border-red-500', 'bg-red-50', 'dark:bg-red-900/10');
            el.classList.remove('border-green-500');
        } else {
            el.classList.remove('border-red-500', 'bg-red-50', 'dark:bg-red-900/10');
            el.classList.add('border-green-500');
        }
    } else {
        el.classList.remove('border-red-500', 'bg-red-50', 'dark:bg-red-900/10', 'border-green-500');
    }
}

function isValidNIP(nip) {
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(nip[i]) * weights[i];
    return (sum % 11) === parseInt(nip[9]);
}

function isValidPESEL(pesel) {
    const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(pesel[i]) * weights[i];
    const control = (10 - (sum % 10)) % 10;
    return control === parseInt(pesel[10]);
}

// --- PDF WORKER SETUP ---
if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// Adapter dla globalnej wyszukiwarki wywoływanej z HTML (oninput="runGlobalSearch(this.value)")
window.runGlobalSearch = function(query) {
    try {
        if (window.globalSearchModule && typeof window.globalSearchModule.search === 'function') {
            window.globalSearchModule.search(query || '');
        }
    } catch (e) {
        console.error('runGlobalSearch error:', e);
    }
};

// --- MISSING LEGACY FUNCTIONS ---

// Prosty ustawiacz motywu (theme)
function setTheme(themeName) {
    try {
        if (typeof CONFIG !== 'undefined' && CONFIG.THEME && CONFIG.THEME.DEFAULT_THEME_KEY) {
            localStorage.setItem(CONFIG.THEME.DEFAULT_THEME_KEY, themeName);
        } else {
            localStorage.setItem('lex_theme', themeName);
        }
        console.log('[Theme] Set to:', themeName);
    } catch (e) {
        console.error('setTheme error:', e);
    }
}

// Przejdź do pulpitu (dashboard)
function goHome() {
    try {
        goToModule('dashboard');
    } catch (e) {
        console.error('goHome error:', e);
    }
}

// Przełącznik wyszukiwania (global search modal)
function toggleSearch() {
    try {
        if (window.globalSearchModule && typeof window.globalSearchModule.open === 'function') {
            window.globalSearchModule.open();
        } else {
            console.warn('toggleSearch: globalSearchModule not available');
        }
    } catch (e) {
        console.error('toggleSearch error:', e);
    }
}

// Export funkcji globalnych
window.setTheme = setTheme;
window.goHome = goHome;
window.toggleSearch = toggleSearch;

// Funkcja do odświeżania widgetów pulpitu (używana przez cars.js)
function renderDashboardWidgets() {
    try {
        // Placeholder - w legacy ta funkcja nie jest potrzebna
        // Moduły odświeżają się automatycznie przy przełączaniu
        console.log('[Dashboard] Widgets refresh requested');
    } catch (e) {
        console.error('renderDashboardWidgets error:', e);
    }
}

// Export dla kompatybilności
window.renderDashboardWidgets = renderDashboardWidgets;

// Funkcja do przełączania trybu sidebaru (zwijanie/rozwijanie)
function toggleSidebarMode() {
    try {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
            console.log('[Sidebar] Mode toggled');
        }
    } catch (e) {
        console.error('toggleSidebarMode error:', e);
    }
}

// Funkcja do otwierania pojazdu z globalnej wyszukiwarki
function openCar(carId) {
    try {
        goToModule('cars');
        setTimeout(() => {
            // Spróbuj otworzyć pojazd przez carsModule
            if (window.carsModule && typeof window.carsModule.openCar === 'function') {
                window.carsModule.openCar(carId);
            } else {
                console.warn('openCar: carsModule not available');
            }
        }, 150);
    } catch (e) {
        console.error('openCar error:', e);
    }
}

// Export funkcji globalnych
window.toggleSidebarMode = toggleSidebarMode;
window.openCar = openCar;

// --- SIDEBAR EDIT MODE ---
let sidebarSortable = null;
let isSidebarEditMode = false;

function toggleSidebarEditMode() {
    isSidebarEditMode = !isSidebarEditMode;
    const moduleList = document.getElementById('module-list');
    const btn = document.getElementById('edit-sidebar-btn');

    if (isSidebarEditMode) {
        btn.innerHTML = '<i data-lucide="check" size="14"></i> Zapisz';
        btn.classList.add('text-green-500');

        sidebarSortable = new Sortable(moduleList, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function (evt) {
                const order = Array.from(moduleList.children).map(item => item.dataset.moduleId);
                localStorage.setItem('sidebarOrder', JSON.stringify(order));
            }
        });
    } else {
        btn.innerHTML = '<i data-lucide="move" size="14"></i> Edytuj';
        btn.classList.remove('text-green-500');
        if (sidebarSortable) {
            sidebarSortable.destroy();
            sidebarSortable = null;
        }
    }
    lucide.createIcons();
}

function applySidebarOrder() {
    const savedOrder = JSON.parse(localStorage.getItem('sidebarOrder'));
    if (savedOrder) {
        const moduleList = document.getElementById('module-list');
        const items = Array.from(moduleList.children);
        const sortedItems = savedOrder.map(id => items.find(item => item.dataset.moduleId === id));

        sortedItems.forEach(item => {
            if (item) moduleList.appendChild(item);
        });
    }
}

// --- DASHBOARD EDIT MODE ---
let dashboardSortable = null;
let isDashboardEditMode = false;

function toggleDashboardEditMode() {
    isDashboardEditMode = !isDashboardEditMode;
    const grid = document.getElementById('dashboard-grid');
    const btn = document.getElementById('edit-dashboard-btn');

    if (isDashboardEditMode) {
        btn.innerHTML = '<i data-lucide="check" class="inline-block mr-2"></i> Zapisz układ';
        btn.classList.add('bg-green-500', 'text-white');
        grid.classList.add('edit-mode');

        dashboardSortable = new Sortable(grid, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function (evt) {
                const order = Array.from(grid.children).map(item => item.dataset.moduleId);
                localStorage.setItem('dashboardOrder', JSON.stringify(order));
            }
        });
    } else {
        btn.innerHTML = '<i data-lucide="move" class="inline-block mr-2"></i> Edytuj układ';
        btn.classList.remove('bg-green-500', 'text-white');
        grid.classList.remove('edit-mode');
        dashboardSortable.destroy();
        dashboardSortable = null;
    }
    lucide.createIcons();
}

function applyDashboardOrder() {
    const savedOrder = JSON.parse(localStorage.getItem('dashboardOrder'));
    if (savedOrder) {
        const grid = document.getElementById('dashboard-grid');
        const items = Array.from(grid.children);
        const sortedItems = savedOrder.map(id => items.find(item => item.dataset.moduleId === id));

        // Append sorted items, any new items will be at the end
        sortedItems.forEach(item => {
            if(item) grid.appendChild(item);
        });
    }
}
