/**
 * Registry View - Bailiffs Management UI
 */

import store from '../../store/index.js';
import RegistryStore from './RegistryStore.js';

class RegistryView {
    constructor() {
        this.container = null;
        this.bailiffsList = null;
        this.searchInput = null;
        this.uploadBtn = null;
        this.fileInput = null;
        this.activeBailiffId = null;
    }

    /**
     * Initialize Registry View
     */
    init() {
        console.log('[RegistryView] Initializing...');
        
        // Get DOM elements
        this.container = document.getElementById('registryList');
        this.searchInput = document.getElementById('registrySearch');
        this.importBtn = document.getElementById('importBailiffsBtn');
        this.fileInput = document.getElementById('bailiffsFileInput');
        this.loadingState = document.getElementById('registryLoading');

        // Setup event listeners
        this.setupEventListeners();
        
        // Subscribe to store changes
        this.setupStoreSubscriptions();
        
        console.log('[RegistryView] Initialized successfully');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search functionality
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.filterBailiffs(e.target.value);
            });
        }

        // Import functionality
        if (this.importBtn) {
            this.importBtn.addEventListener('click', () => {
                this.openFileSelector();
            });
        }

        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => {
                this.handleFileImport(e.target.files[0]);
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'o') {
                    e.preventDefault();
                    this.openFileSelector();
                }
            }
        });
    }

    /**
     * Setup store subscriptions
     */
    setupStoreSubscriptions() {
        // Subscribe to bailiffs changes
        store.subscribe('bailiffs', (bailiffs) => {
            this.renderBailiffsList(bailiffs);
        });
    }

    /**
     * Render bailiffs list
     */
    renderBailiffsList(bailiffs) {
        if (!this.container) return;

        this.container.innerHTML = '';

        if (bailiffs.length === 0) {
            this.renderEmptyState();
            return;
        }

        bailiffs.forEach(bailiff => {
            const bailiffElement = this.createBailiffElement(bailiff);
            this.container.appendChild(bailiffElement);
        });

        // Re-initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Create bailiff element
     */
    createBailiffElement(bailiff) {
        const div = document.createElement('div');
        div.className = 'p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer';
        div.dataset.bailiffId = bailiff.name;

        const address = bailiff.address || 'Brak adresu';
        const nip = bailiff.nip || 'Brak NIP';
        const epu = bailiff.epu || 'Brak EPU';

        div.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2 mb-2">
                        <div class="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i data-lucide="building" class="w-4 h-4 text-indigo-600 dark:text-indigo-400"></i>
                        </div>
                        <h3 class="text-sm font-bold text-slate-800 dark:text-white truncate">${bailiff.name}</h3>
                    </div>
                    
                    <div class="space-y-1">
                        <div class="flex items-center text-xs text-slate-600 dark:text-slate-400">
                            <i data-lucide="map-pin" class="w-3 h-3 mr-1.5 flex-shrink-0"></i>
                            <span class="truncate">${address}</span>
                        </div>
                        
                        <div class="flex items-center text-xs text-slate-600 dark:text-slate-400">
                            <i data-lucide="credit-card" class="w-3 h-3 mr-1.5 flex-shrink-0"></i>
                            <span>NIP: ${nip}</span>
                        </div>
                        
                        <div class="flex items-center text-xs text-slate-600 dark:text-slate-400">
                            <i data-lucide="gavel" class="w-3 h-3 mr-1.5 flex-shrink-0"></i>
                            <span>EPU: ${epu}</span>
                        </div>
                    </div>
                </div>
                
                <div class="flex items-center space-x-1 ml-3">
                    <button onclick="event.stopPropagation(); registryView.copyBailiffInfo('${bailiff.name}')" class="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors" title="Kopiuj dane">
                        <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="event.stopPropagation(); registryView.deleteBailiff('${bailiff.name}')" class="p-1.5 text-slate-400 hover:text-red-600 transition-colors" title="Usuń">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </div>
        `;

        div.addEventListener('click', () => {
            this.selectBailiff(bailiff);
        });

        return div;
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        this.container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-center">
                <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <i data-lucide="building" size="28" class="text-slate-300 dark:text-slate-600"></i>
                </div>
                <h3 class="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">Brak komorników</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Importuj listę komorników z pliku Excel</p>
                <button class="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm flex items-center space-x-2" onclick="registryView.openFileSelector()">
                    <i data-lucide="upload" size="16" class="inline"></i>
                    <span>Importuj komorników</span>
                </button>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Select bailiff
     */
    selectBailiff(bailiff) {
        // Copy bailiff info to clipboard
        const info = `${bailiff.name}\n${bailiff.address || ''}\nNIP: ${bailiff.nip || ''}\nEPU: ${bailiff.epu || ''}`;

        navigator.clipboard.writeText(info).then(() => {
            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Dane komornika skopiowane do schowka'
            });
        }).catch(() => {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = info;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Dane komornika skopiowane do schowka'
            });
        });
    }

    /**
     * Copy bailiff info
     */
    copyBailiffInfo(bailiffName) {
        const bailiff = store.get('bailiffs').find(b => b.name === bailiffName);
        if (bailiff) {
            this.selectBailiff(bailiff);
        }
    }

    /**
     * Delete bailiff
     */
    async deleteBailiff(bailiffName) {
        try {
            if (!confirm('Czy na pewno usunąć tego komornika?')) return;

            await RegistryStore.remove(bailiffName);

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Komornik usunięty'
            });
        } catch (error) {
            console.error('[RegistryView] Delete bailiff error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd usuwania komornika'
            });
        }
    }

    /**
     * Filter bailiffs
     */
    filterBailiffs(query) {
        try {
            const bailiffs = store.get('bailiffs');
            
            if (!query.trim()) {
                this.renderBailiffsList(bailiffs);
                return;
            }

            const filtered = bailiffs.filter(bailiff =>
                (bailiff.name && bailiff.name.toLowerCase().includes(query.toLowerCase())) ||
                (bailiff.address && bailiff.address.toLowerCase().includes(query.toLowerCase())) ||
                (bailiff.nip && bailiff.nip.toLowerCase().includes(query.toLowerCase())) ||
                (bailiff.epu && bailiff.epu.toLowerCase().includes(query.toLowerCase()))
            );

            this.renderBailiffsList(filtered);
        } catch (error) {
            console.error('[RegistryView] Filter bailiffs error:', error);
        }
    }

    /**
     * Open file selector
     */
    openFileSelector() {
        if (this.fileInput) {
            this.fileInput.click();
        }
    }

    /**
     * Handle file import
     */
    async handleFileImport(file) {
        if (!file) return;

        // Validate file type
        if (!file.name.match(/\.(xlsx|xls)$/)) {
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Proszę wybrać plik Excel (.xlsx lub .xls)'
            });
            return;
        }

        try {
            this.setLoading(true);

            await RegistryStore.importFromExcel(file);

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Komornicy zaimportowani pomyślnie'
            });

            // Clear file input
            if (this.fileInput) {
                this.fileInput.value = '';
            }
        } catch (error) {
            console.error('[RegistryView] Import error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: `Błąd importu: ${error.message}`
            });
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        if (this.loadingState) {
            this.loadingState.classList.toggle('hidden', !loading);
        }

        if (this.importBtn) {
            this.importBtn.disabled = loading;
            this.importBtn.innerHTML = loading 
                ? '<i data-lucide="loader-2" class="w-4 h-4 animate-spin mr-2"></i>Importowanie...'
                : '<i data-lucide="upload" class="w-4 h-4 mr-2"></i>Importuj komorników';
        }

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Export bailiffs to Excel
     */
    async exportBailiffs() {
        try {
            const bailiffs = store.get('bailiffs');
            
            if (bailiffs.length === 0) {
                store.commit('ADD', {
                    type: 'warning',
                    message: 'Brak komorników do eksportu'
                });
                return;
            }

            await RegistryStore.exportToExcel();

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Komornicy wyeksportowani pomyślnie'
            });
        } catch (error) {
            console.error('[RegistryView] Export error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: `Błąd eksportu: ${error.message}`
            });
        }
    }

    /**
     * Get bailiff statistics
     */
    getStatistics() {
        const bailiffs = store.get('bailiffs');
        
        return {
            total: bailiffs.length,
            withNIP: bailiffs.filter(b => b.nip).length,
            withAddress: bailiffs.filter(b => b.address).length,
            withEPU: bailiffs.filter(b => b.epu).length
        };
    }

    /**
     * Render statistics
     */
    renderStatistics() {
        const stats = this.getStatistics();
        const statsContainer = document.getElementById('registryStats');
        
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                        <div class="text-2xl font-bold text-slate-800 dark:text-white">${stats.total}</div>
                        <div class="text-xs text-slate-500 dark:text-slate-400">Łącznie</div>
                    </div>
                    <div class="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                        <div class="text-2xl font-bold text-slate-800 dark:text-white">${stats.withNIP}</div>
                        <div class="text-xs text-slate-500 dark:text-slate-400">Z NIP</div>
                    </div>
                    <div class="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                        <div class="text-2xl font-bold text-slate-800 dark:text-white">${stats.withAddress}</div>
                        <div class="text-xs text-slate-500 dark:text-slate-400">Z adresem</div>
                    </div>
                    <div class="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                        <div class="text-2xl font-bold text-slate-800 dark:text-white">${stats.withEPU}</div>
                        <div class="text-xs text-slate-500 dark:text-slate-400">Z EPU</div>
                    </div>
                </div>
            `;
        }
    }
}

// Create and export singleton instance
const registryView = new RegistryView();

export default registryView;