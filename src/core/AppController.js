/**
 * AppController - Centralized Module Initialization and Management
 * Handles safe initialization of all modules after DOM is ready
 */

// Import all modules
import notesModule from '../modules/Notes/index.js';
import linksModule from '../modules/Links/index.js';
import registryModule from '../modules/Registry/index.js';
import financeModule from '../modules/Finance/index.js';
import generatorModule from '../modules/Generator/index.js';
import aiModule from '../modules/AI/index.js';
import statisticsModule from '../modules/Statistics/index.js';
import securityModule from '../modules/Security/index.js';
import globalSearchModule from '../modules/GlobalSearch/index.js';
import terrainModule from '../modules/Terrain/index.js';
import trackerModule from '../modules/tracker/index.js';

// Import main store for cross-module functionality
import store from '../store/index.js';

// Import PerformanceMonitor
import performanceMonitor from './PerformanceMonitor.js';

class AppController {
    constructor() {
        this.modules = {
            notes: notesModule,
            links: linksModule,
            registry: registryModule,
            finance: financeModule,
            generator: generatorModule,
            ai: aiModule,
            statistics: statisticsModule,
            security: securityModule,
            globalSearch: globalSearchModule,
            terrain: terrainModule,
            tracker: trackerModule
        };
        
        this.initializedModules = new Set();
        this.failedModules = new Set();
        this.isInitialized = false;
        
        // Add cross-module mutations to main store
        this.setupCrossModuleMutations();
    }

    /**
     * Setup mutations needed for cross-module functionality
     */
    setupCrossModuleMutations() {
        // Global search mutations
        store.registerMutation('SET_GLOBAL_SEARCH_RESULTS', (state, results) => {
            state.globalSearchResults = results;
        });

        store.registerMutation('SET_GLOBAL_SEARCH_LOADING', (state, loading) => {
            state.globalSearchLoading = loading;
        });

        store.registerMutation('SET_GLOBAL_SEARCH_FILTERS', (state, filters) => {
            state.globalSearchFilters = filters;
        });

        // Module-specific state mutations
        store.registerMutation('SET_AI_MESSAGES', (state, messages) => {
            state.aiMessages = messages;
        });

        store.registerMutation('SET_TERRAIN_SCANNING', (state, scanning) => {
            state.terrainScanning = scanning;
        });

        store.registerMutation('SET_TERRAIN_SCAN_RESULTS', (state, results) => {
            state.terrainScanResults = results;
        });

        store.registerMutation('SET_TRACKER_ACTIVE', (state, active) => {
            state.trackerActive = active;
        });

        store.registerMutation('SET_TRACKER_ACTIVITIES', (state, activities) => {
            state.trackerActivities = activities;
        });

        store.registerMutation('SET_TRACKER_STATISTICS', (state, statistics) => {
            state.trackerStatistics = statistics;
        });

        store.registerMutation('SET_SECURITY_SETTINGS', (state, settings) => {
            state.securitySettings = settings;
        });

        store.registerMutation('SET_STATISTICS', (state, statistics) => {
            state.statistics = statistics;
        });

        // Initialize state objects
        state.globalSearchResults = [];
        state.globalSearchLoading = false;
        state.globalSearchFilters = {};
        state.aiMessages = [];
        state.terrainScanning = false;
        state.terrainScanResults = [];
        state.trackerActive = false;
        state.trackerActivities = [];
        state.trackerStatistics = {};
        state.securitySettings = {};
        state.statistics = {};
    }

    /**
     * Initialize all modules after DOM is ready
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('[AppController] Already initialized');
            return;
        }

        console.log('[AppController] Starting module initialization...');

        // Wait for DOM to be ready
        await this.waitForDOM();

        // Initialize modules in sequence to catch dependency issues
        const moduleOrder = [
            'security',     // Security first - may affect other modules
            'globalSearch', // Global search - used by others
            'notes',
            'links', 
            'registry',
            'finance',
            'generator',
            'ai',
            'statistics',
            'terrain',
            'tracker'
        ];

        for (const moduleName of moduleOrder) {
            await this.initializeModule(moduleName);
        }

        this.isInitialized = true;
        this.logInitializationSummary();
        
        // Start automatic performance monitoring
        performanceMonitor.startMonitoring();
    }

    /**
     * Wait for DOM to be ready
     */
    async waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    /**
     * Initialize a single module with error handling
     */
    async initializeModule(moduleName) {
        const module = this.modules[moduleName];
        if (!module) {
            console.error(`[AppController] Module ${moduleName} not found`);
            this.failedModules.add(moduleName);
            return false;
        }

        try {
            console.log(`[AppController] Initializing ${moduleName}...`);
            
            // Start performance tracking
            performanceMonitor.startModuleLoad(moduleName);
            
            // Initialize the module
            await module.init();
            
            // End performance tracking
            performanceMonitor.endModuleLoad(moduleName);
            
            this.initializedModules.add(moduleName);
            console.log(`[AppController] ${moduleName} initialized successfully`);
            
            return true;
        } catch (error) {
            console.error(`[AppController] Failed to initialize ${moduleName}:`, error);
            this.failedModules.add(moduleName);
            
            // Log error to performance monitor
            performanceMonitor.logError(error, { module: moduleName });
            
            // Add notification about module failure
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: `Błąd inicjalizacji modułu ${moduleName}: ${error.message}`
            });
            
            return false;
        }
    }

    /**
     * Log initialization summary
     */
    logInitializationSummary() {
        console.log('[AppController] Initialization Summary:');
        console.log(`✅ Successfully initialized: ${Array.from(this.initializedModules).join(', ')}`);
        
        if (this.failedModules.size > 0) {
            console.log(`❌ Failed to initialize: ${Array.from(this.failedModules).join(', ')}`);
        }
        
        console.log(`📊 Total: ${this.initializedModules.size}/${Object.keys(this.modules).length} modules initialized`);

        // Add success notification if all modules initialized
        if (this.failedModules.size === 0) {
            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Wszystkie moduły zostały pomyślnie zainicjalizowane'
            });
        }
    }

    /**
     * Reinitialize a failed module
     */
    async reinitializeModule(moduleName) {
        if (!this.failedModules.has(moduleName)) {
            console.warn(`[AppController] Module ${moduleName} is not in failed list`);
            return false;
        }

        console.log(`[AppController] Reinitializing ${moduleName}...`);
        
        // Remove from failed list temporarily
        this.failedModules.delete(moduleName);
        
        const success = await this.initializeModule(moduleName);
        
        if (success) {
            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: `Moduł ${moduleName} został ponownie zainicjalizowany`
            });
        }
        
        return success;
    }

    /**
     * Get module instance
     */
    getModule(moduleName) {
        return this.modules[moduleName]?.view || null;
    }

    /**
     * Get module store
     */
    getModuleStore(moduleName) {
        return this.modules[moduleName]?.store || null;
    }

    /**
     * Check if module is initialized
     */
    isModuleInitialized(moduleName) {
        return this.initializedModules.has(moduleName);
    }

    /**
     * Get initialization status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            successfulModules: Array.from(this.initializedModules),
            failedModules: Array.from(this.failedModules),
            totalModules: Object.keys(this.modules).length,
            successCount: this.initializedModules.size,
            failureCount: this.failedModules.size
        };
    }

    /**
     * Get performance report
     */
    getPerformanceReport() {
        return performanceMonitor.getReport();
    }

    /**
     * Destroy all modules
     */
    async destroy() {
        console.log('[AppController] Destroying all modules...');
        
        for (const moduleName of Object.keys(this.modules)) {
            try {
                const module = this.modules[moduleName];
                if (module.destroy && typeof module.destroy === 'function') {
                    await module.destroy();
                    console.log(`[AppController] ${moduleName} destroyed`);
                }
            } catch (error) {
                console.error(`[AppController] Error destroying ${moduleName}:`, error);
            }
        }
        
        this.initializedModules.clear();
        this.failedModules.clear();
        this.isInitialized = false;
    }

    /**
     * Handle critical errors
     */
    handleCriticalError(error) {
        console.error('[AppController] Critical error:', error);
        
        store.commit('ADD_NOTIFICATION', {
            type: 'error',
            message: 'Krytyczny błąd aplikacji - odśwież stronę'
        });
    }
}

// Create and export singleton instance
const appController = new AppController();

export default appController;
