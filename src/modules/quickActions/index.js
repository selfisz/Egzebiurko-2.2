/**
 * Quick Actions Module - Refactored Version
 * ES6 Module z integracją Store
 */

import store from '../../store/index.js';

const QUICK_ACTIONS = [
    {
        id: 'new-case',
        icon: 'file-plus',
        label: 'Nowa sprawa',
        shortcut: 'Ctrl+N',
        module: 'tracker',
        action: 'addNewCase'
    },
    {
        id: 'new-car',
        icon: 'car',
        label: 'Dodaj pojazd',
        shortcut: 'Ctrl+Shift+C',
        module: 'cars',
        action: 'newCar'
    },
    {
        id: 'generate-doc',
        icon: 'file-text',
        label: 'Generuj pismo',
        shortcut: 'Ctrl+G',
        module: 'generator',
        action: null
    },
    {
        id: 'daily-report',
        icon: 'clipboard-list',
        label: 'Raport dzienny',
        shortcut: 'Ctrl+R',
        module: 'statistics',
        action: 'generateDailyReport'
    },
    {
        id: 'search-bailiff',
        icon: 'search',
        label: 'Szukaj komornika',
        shortcut: 'Ctrl+K',
        module: 'registry',
        action: null
    },
    {
        id: 'backup',
        icon: 'download',
        label: 'Backup danych',
        shortcut: 'Ctrl+B',
        module: null,
        action: 'exportAllData'
    },
    {
        id: 'global-search',
        icon: 'search',
        label: 'Szukaj wszędzie',
        shortcut: 'Ctrl+F',
        module: null,
        action: 'openGlobalSearch'
    }
];

export class QuickActionsModule {
    constructor() {
        this.visible = false;
        this.floatingButton = null;
        this.panel = null;
        this.unsubscribe = null;
    }

    /**
     * Inicjalizacja modułu
     */
    init() {
        this.createFloatingButton();
        this.createPanel();
        this.setupKeyboardShortcuts();
        this.subscribeToStore();
        
        console.log('[QuickActions] Module initialized');
    }

    /**
     * Subskrybuj zmiany w store
     */
    subscribeToStore() {
        // Nasłuchuj zmian modułu - możesz dostosować UI
        this.unsubscribe = store.subscribe('currentModule', (newModule) => {
            console.log('[QuickActions] Module changed to:', newModule);
        });
    }

    /**
     * Utwórz floating button
     */
    createFloatingButton() {
        this.floatingButton = document.createElement('button');
        this.floatingButton.id = 'quick-actions-btn';
        this.floatingButton.className = 'fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-indigo-500/50 hover:scale-110 transition-all z-50 flex items-center justify-center group';
        this.floatingButton.innerHTML = '<i data-lucide="zap" class="group-hover:rotate-12 transition-transform"></i>';
        this.floatingButton.onclick = () => this.toggle();
        
        document.body.appendChild(this.floatingButton);
    }

    /**
     * Utwórz panel akcji
     */
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'quick-actions-panel';
        this.panel.className = 'fixed bottom-24 right-6 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 hidden transform transition-all';
        
        this.panel.innerHTML = `
            <div class="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div class="flex items-center justify-between">
                    <h3 class="font-bold flex items-center gap-2">
                        <i data-lucide="zap" size="18"></i>
                        Szybkie Akcje
                    </h3>
                    <button class="hover:bg-white/20 rounded-lg p-1 transition-colors" data-action="close">
                        <i data-lucide="x" size="18"></i>
                    </button>
                </div>
            </div>
            <div class="p-2 max-h-96 overflow-y-auto custom-scroll">
                ${this.renderActions()}
            </div>
            <div class="p-3 bg-slate-50 dark:bg-slate-900/50 border-t dark:border-slate-700">
                <button class="w-full text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-2" data-action="settings">
                    <i data-lucide="settings" size="14"></i>
                    Dostosuj akcje
                </button>
            </div>
        `;
        
        // Event delegation dla przycisków
        this.panel.addEventListener('click', (e) => this.handlePanelClick(e));
        
        document.body.appendChild(this.panel);
    }

    /**
     * Renderuj listę akcji
     */
    renderActions() {
        return QUICK_ACTIONS.map(action => `
            <button data-action-id="${action.id}" 
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
        `).join('');
    }

    /**
     * Obsługa kliknięć w panelu
     */
    handlePanelClick(e) {
        const button = e.target.closest('button');
        if (!button) return;

        const actionType = button.dataset.action;
        const actionId = button.dataset.actionId;

        if (actionType === 'close') {
            this.toggle();
        } else if (actionType === 'settings') {
            this.openSettings();
        } else if (actionId) {
            this.executeAction(actionId);
        }
    }

    /**
     * Toggle widoczności panelu
     */
    toggle() {
        this.visible = !this.visible;
        
        if (this.visible) {
            this.panel.classList.remove('hidden');
            this.panel.classList.add('animate-slide-up');
            this.floatingButton.classList.add('rotate-90');
        } else {
            this.panel.classList.add('hidden');
            this.panel.classList.remove('animate-slide-up');
            this.floatingButton.classList.remove('rotate-90');
        }

        // Refresh icons
        if (window.lucide) window.lucide.createIcons();
    }

    /**
     * Wykonaj akcję
     */
    async executeAction(actionId) {
        const action = QUICK_ACTIONS.find(a => a.id === actionId);
        if (!action) return;

        this.toggle(); // Zamknij panel

        try {
            // Jeśli akcja wymaga zmiany modułu
            if (action.module) {
                store.commit('SET_CURRENT_MODULE', action.module);
                
                // Poczekaj na załadowanie modułu
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Wykonaj akcję modułu
            if (action.action) {
                if (typeof window[action.action] === 'function') {
                    window[action.action]();
                } else {
                    console.warn(`Action ${action.action} not found`);
                }
            }
        } catch (error) {
            console.error(`Error executing action ${actionId}:`, error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: `Błąd wykonania akcji: ${error.message}`
            });
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignoruj jeśli jesteśmy w input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            QUICK_ACTIONS.forEach(action => {
                if (this.matchesShortcut(e, action.shortcut)) {
                    e.preventDefault();
                    this.executeAction(action.id);
                }
            });
        });
    }

    /**
     * Sprawdź czy event pasuje do skrótu
     */
    matchesShortcut(event, shortcut) {
        const keys = shortcut.toLowerCase().split('+');
        const ctrl = keys.includes('ctrl') && (event.ctrlKey || event.metaKey);
        const shift = keys.includes('shift') && event.shiftKey;
        const key = keys[keys.length - 1];

        if (keys.includes('shift')) {
            return ctrl && shift && event.key.toLowerCase() === key;
        } else {
            return ctrl && !event.shiftKey && event.key.toLowerCase() === key;
        }
    }

    /**
     * Otwórz ustawienia
     */
    openSettings() {
        store.commit('ADD_NOTIFICATION', {
            type: 'info',
            message: 'Ustawienia szybkich akcji - wkrótce!'
        });
    }

    /**
     * Cleanup przy niszczeniu modułu
     */
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        
        if (this.floatingButton) {
            this.floatingButton.remove();
        }
        
        if (this.panel) {
            this.panel.remove();
        }
        
        console.log('[QuickActions] Module destroyed');
    }
}

// Export singleton instance
const quickActionsModule = new QuickActionsModule();
export default quickActionsModule;
