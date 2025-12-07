// --- MODULE: QUICK ACTIONS ---
// Moduł szybkich akcji - floating button z najczęściej używanymi funkcjami

const QUICK_ACTIONS = [
    {
        id: 'new-case',
        icon: 'file-plus',
        label: 'Nowa sprawa',
        shortcut: 'Ctrl+N',
        action: () => {
            goToModule('tracker');
            setTimeout(() => trackerModule.addNewCase(), 100);
        }
    },
    {
        id: 'new-car',
        icon: 'car',
        label: 'Dodaj pojazd',
        shortcut: 'Ctrl+Shift+C',
        action: () => {
            goToModule('cars');
            setTimeout(() => newCar(), 100);
        }
    },
    {
        id: 'generate-doc',
        icon: 'file-text',
        label: 'Generuj pismo',
        shortcut: 'Ctrl+G',
        action: () => goToModule('generator')
    },
    {
        id: 'daily-report',
        icon: 'clipboard-list',
        label: 'Raport dzienny',
        shortcut: 'Ctrl+R',
        action: () => generateDailyReport()
    },
    {
        id: 'search-bailiff',
        icon: 'search',
        label: 'Szukaj komornika',
        shortcut: 'Ctrl+K',
        action: () => {
            goToModule('registry');
            setTimeout(() => document.getElementById('bailiffSearch')?.focus(), 100);
        }
    },
    {
        id: 'backup',
        icon: 'download',
        label: 'Backup danych',
        shortcut: 'Ctrl+B',
        action: () => exportAllData()
    },
    {
        id: 'global-search',
        icon: 'search',
        label: 'Szukaj wszędzie',
        shortcut: 'Ctrl+F',
        action: () => openGlobalSearch()
    }
];

let quickActionsVisible = false;

function initQuickActions() {
    // Dodaj floating button
    const floatingBtn = document.createElement('button');
    floatingBtn.id = 'quick-actions-btn';
    floatingBtn.className = 'fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-indigo-500/50 hover:scale-110 transition-all z-50 flex items-center justify-center group';
    floatingBtn.innerHTML = '<i data-lucide="zap" class="group-hover:rotate-12 transition-transform"></i>';
    floatingBtn.onclick = toggleQuickActions;
    document.body.appendChild(floatingBtn);

    // Dodaj panel akcji
    const panel = document.createElement('div');
    panel.id = 'quick-actions-panel';
    panel.className = 'fixed bottom-24 right-6 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 hidden transform transition-all';
    panel.innerHTML = `
        <div class="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div class="flex items-center justify-between">
                <h3 class="font-bold flex items-center gap-2">
                    <i data-lucide="zap" size="18"></i>
                    Szybkie Akcje
                </h3>
                <button onclick="toggleQuickActions()" class="hover:bg-white/20 rounded-lg p-1 transition-colors">
                    <i data-lucide="x" size="18"></i>
                </button>
            </div>
        </div>
        <div class="p-2 max-h-96 overflow-y-auto custom-scroll">
            ${QUICK_ACTIONS.map(action => `
                <button onclick="executeQuickAction('${action.id}')" 
                    class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors text-left group">
                    <div class="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <i data-lucide="${action.icon}" size="20"></i>
                    </div>
                    <div class="flex-1">
                        <div class="font-semibold text-sm text-slate-800 dark:text-white">${action.label}</div>
                        <div class="text-xs text-slate-400">${action.shortcut}</div>
                    </div>
                    <i data-lucide="chevron-right" size="16" class="text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"></i>
                </button>
            `).join('')}
        </div>
        <div class="p-3 bg-slate-50 dark:bg-slate-900/50 border-t dark:border-slate-700">
            <button onclick="openQuickActionsSettings()" class="w-full text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-2">
                <i data-lucide="settings" size="14"></i>
                Dostosuj akcje
            </button>
        </div>
    `;
    document.body.appendChild(panel);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleQuickActionShortcuts);

    // Inicjalizuj ikony
    if (window.lucide) lucide.createIcons();
}

function toggleQuickActions() {
    quickActionsVisible = !quickActionsVisible;
    const panel = document.getElementById('quick-actions-panel');
    const btn = document.getElementById('quick-actions-btn');
    
    if (quickActionsVisible) {
        panel.classList.remove('hidden');
        panel.classList.add('animate-slide-up');
        btn.classList.add('rotate-90');
    } else {
        panel.classList.add('hidden');
        panel.classList.remove('animate-slide-up');
        btn.classList.remove('rotate-90');
    }
}

function executeQuickAction(actionId) {
    const action = QUICK_ACTIONS.find(a => a.id === actionId);
    if (action) {
        action.action();
        toggleQuickActions();
    }
}

function handleQuickActionShortcuts(e) {
    // Sprawdź czy nie jesteśmy w input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    QUICK_ACTIONS.forEach(action => {
        const keys = action.shortcut.toLowerCase().split('+');
        const ctrl = keys.includes('ctrl') && (e.ctrlKey || e.metaKey);
        const shift = keys.includes('shift') && e.shiftKey;
        const key = keys[keys.length - 1];

        if (ctrl && (!shift || (shift && keys.includes('shift'))) && e.key.toLowerCase() === key) {
            e.preventDefault();
            action.action();
        }
    });
}

function openQuickActionsSettings() {
    // TODO: Modal do dostosowania akcji
    if (window.Toast) Toast.info('Ustawienia szybkich akcji - wkrótce!');
}

// Export funkcji
window.quickActionsModule = {
    init: initQuickActions,
    toggle: toggleQuickActions,
    execute: executeQuickAction
};
