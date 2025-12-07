/**
 * Terrain View - Terrain Scanning and Mapping UI
 */

import store from '../../store/index.js';
import TerrainStore from './TerrainStore.js';

class TerrainView {
    constructor() {
        this.container = null;
        this.map = null;
        this.scanner = null;
        this.results = null;
    }

    /**
     * Initialize Terrain View
     */
    init() {
        console.log('[TerrainView] Initializing...');
        
        // Get DOM elements
        this.container = document.getElementById('terrainContainer');
        this.map = document.getElementById('terrainMap');
        this.scanner = document.getElementById('terrainScanner');
        this.results = document.getElementById('terrainResults');

        // Setup event listeners
        this.setupEventListeners();
        
        // Subscribe to store changes
        this.setupStoreSubscriptions();
        
        // Load initial data
        this.loadInitialData();
        
        console.log('[TerrainView] Initialized successfully');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Start scanning
        const startScanBtn = document.getElementById('startTerrainScanBtn');
        if (startScanBtn) {
            startScanBtn.addEventListener('click', () => {
                this.startScanning();
            });
        }

        // Stop scanning
        const stopScanBtn = document.getElementById('stopTerrainScanBtn');
        if (stopScanBtn) {
            stopScanBtn.addEventListener('click', () => {
                this.stopScanning();
            });
        }

        // Clear results
        const clearBtn = document.getElementById('clearTerrainResultsBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearResults();
            });
        }

        // Export results
        const exportBtn = document.getElementById('exportTerrainResultsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportResults();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 's') {
                    e.preventDefault();
                    this.startScanning();
                }
                if (e.key === 'e') {
                    e.preventDefault();
                    this.exportResults();
                }
            }
        });
    }

    /**
     * Setup store subscriptions
     */
    setupStoreSubscriptions() {
        // Subscribe to scan results
        store.subscribe('terrainScanResults', (results) => {
            this.renderResults(results);
        });

        // Subscribe to scanning state
        store.subscribe('terrainScanning', (scanning) => {
            this.setScanningState(scanning);
        });
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            await TerrainStore.loadScannerSettings();
        } catch (error) {
            console.error('[TerrainView] Load initial data error:', error);
        }
    }

    /**
     * Start scanning
     */
    async startScanning() {
        try {
            await TerrainStore.startScanning();

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Skanowanie terenu rozpoczęte'
            });
        } catch (error) {
            console.error('[TerrainView] Start scanning error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd rozpoczynania skanowania'
            });
        }
    }

    /**
     * Stop scanning
     */
    async stopScanning() {
        try {
            await TerrainStore.stopScanning();

            store.commit('ADD_NOTIFICATION', {
                type: 'info',
                message: 'Skanowanie zatrzymane'
            });
        } catch (error) {
            console.error('[TerrainView] Stop scanning error:', error);
        }
    }

    /**
     * Clear results
     */
    async clearResults() {
        try {
            if (!confirm('Czy na pewno wyczyścić wyniki skanowania?')) return;

            await TerrainStore.clearResults();

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Wyniki wyczyszczone'
            });
        } catch (error) {
            console.error('[TerrainView] Clear results error:', error);
        }
    }

    /**
     * Export results
     */
    async exportResults() {
        try {
            await TerrainStore.exportResults();

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Wyniki wyeksportowane'
            });
        } catch (error) {
            console.error('[TerrainView] Export results error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd eksportu wyników'
            });
        }
    }

    /**
     * Render results
     */
    renderResults(results) {
        if (!this.results) return;

        this.results.innerHTML = '';

        if (!results || results.length === 0) {
            this.renderEmptyResults();
            return;
        }

        // Results summary
        const summary = document.createElement('div');
        summary.className = 'mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg';
        summary.innerHTML = `
            <div class="flex items-center justify-between">
                <h3 class="text-sm font-medium text-slate-700 dark:text-slate-300">Wyniki skanowania</h3>
                <span class="text-sm text-slate-500">${results.length} obiektów</span>
            </div>
        `;
        this.results.appendChild(summary);

        // Results list
        const list = document.createElement('div');
        list.className = 'space-y-2';

        results.forEach(result => {
            const resultElement = this.createResultElement(result);
            list.appendChild(resultElement);
        });

        this.results.appendChild(list);

        // Re-initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Create result element
     */
    createResultElement(result) {
        const div = document.createElement('div');
        div.className = 'p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer';
        div.dataset.resultId = result.id;

        div.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i data-lucide="map-pin" class="w-5 h-5 text-white"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="text-sm font-medium text-slate-800 dark:text-white">${result.name || 'Obiekt'}</h4>
                        <span class="text-xs text-slate-500">${result.distance || 'Brak'}</span>
                    </div>
                    <div class="text-xs text-slate-600 dark:text-slate-400">
                        <i data-lucide="map-pin" class="w-3 h-3 inline mr-1"></i>
                        ${result.coordinates || 'Brak współrzędnych'}
                    </div>
                </div>
                <div class="flex items-center space-x-1 ml-2">
                    <button onclick="event.stopPropagation(); terrainView.viewOnMap('${result.id}')" class="p-1 text-slate-400 hover:text-indigo-600 transition-colors" title="Pokaż na mapie">
                        <i data-lucide="map" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </div>
        `;

        return div;
    }

    /**
     * Render empty results
     */
    renderEmptyResults() {
        if (!this.results) return;

        this.results.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-center">
                <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <i data-lucide="search" size="28" class="text-slate-300 dark:text-slate-600"></i>
                </div>
                <h3 class="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">Brak wyników skanowania</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Rozpocznij skanowanie terenu</p>
                <button class="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm" onclick="terrainView.startScanning()">
                    <i data-lucide="radar" class="w-4 h-4 inline mr-2"></i>
                    Rozpocznij skanowanie
                </button>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Set scanning state
     */
    setScanningState(scanning) {
        const startBtn = document.getElementById('startTerrainScanBtn');
        const stopBtn = document.getElementById('stopTerrainScanBtn');

        if (startBtn) {
            startBtn.disabled = scanning;
            startBtn.classList.toggle('hidden', scanning);
        }

        if (stopBtn) {
            stopBtn.disabled = !scanning;
            stopBtn.classList.toggle('hidden', !scanning);
        }
    }

    /**
     * View on map
     */
    viewOnMap(resultId) {
        console.log('Viewing on map:', resultId);
    }
}

// Create and export singleton instance
const terrainView = new TerrainView();

export default terrainView;
