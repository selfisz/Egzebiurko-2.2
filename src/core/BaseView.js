/**
 * BaseView - Abstract base class for all View modules
 * Provides common functionality to reduce code duplication
 */

import store from '../store/index.js';

export class BaseView {
    constructor() {
        this.container = null;
        this.subscriptions = [];
        this.eventListeners = [];
        this.isInitialized = false;
    }

    /**
     * Initialize view - override in subclass
     */
    init() {
        if (this.isInitialized) {
            console.warn(`[${this.constructor.name}] Already initialized`);
            return;
        }

        console.log(`[${this.constructor.name}] Initializing...`);
        
        // Get DOM elements
        this.setupDOM();
        
        // Only proceed if container exists
        if (!this.container) {
            console.log(`[${this.constructor.name}] Container not found - module not loaded yet`);
            return;
        }

        // Setup event listeners
        this.setupEventListeners();
        
        // Subscribe to store changes
        this.setupStoreSubscriptions();
        
        // Load initial data
        this.loadInitialData();
        
        this.isInitialized = true;
        console.log(`[${this.constructor.name}] Initialized successfully`);
    }

    /**
     * Setup DOM elements - override in subclass
     */
    setupDOM() {
        // Override in subclass
        throw new Error('setupDOM() must be implemented in subclass');
    }

    /**
     * Setup event listeners - override in subclass
     */
    setupEventListeners() {
        // Override in subclass
    }

    /**
     * Setup store subscriptions - override in subclass
     */
    setupStoreSubscriptions() {
        // Override in subclass
    }

    /**
     * Load initial data - override in subclass
     */
    loadInitialData() {
        // Override in subclass
    }

    /**
     * Render view - override in subclass
     */
    render() {
        // Override in subclass
    }

    /**
     * Helper: Add event listener with tracking
     */
    addEventListener(element, event, handler, options) {
        if (!element) return;
        
        element.addEventListener(event, handler, options);
        this.eventListeners.push({ element, event, handler, options });
    }

    /**
     * Helper: Subscribe to store with tracking
     */
    subscribe(key, callback) {
        const unsubscribe = store.subscribe(key, callback);
        this.subscriptions.push(unsubscribe);
        return unsubscribe;
    }

    /**
     * Helper: Show loading state
     */
    showLoading(message = 'Ładowanie...') {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="flex items-center justify-center p-8">
                <div class="text-center">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p class="text-slate-600 dark:text-slate-400">${message}</p>
                </div>
            </div>
        `;
    }

    /**
     * Helper: Show error state
     */
    showError(message = 'Wystąpił błąd') {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="flex items-center justify-center p-8">
                <div class="text-center text-red-500">
                    <i data-lucide="alert-circle" class="w-12 h-12 mx-auto mb-4"></i>
                    <p class="font-medium">${message}</p>
                </div>
            </div>
        `;
        
        if (window.lucide) window.lucide.createIcons();
    }

    /**
     * Helper: Show empty state
     */
    showEmpty(message = 'Brak danych', icon = 'inbox') {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="flex items-center justify-center p-8">
                <div class="text-center text-slate-400">
                    <i data-lucide="${icon}" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
                    <p>${message}</p>
                </div>
            </div>
        `;
        
        if (window.lucide) window.lucide.createIcons();
    }

    /**
     * Helper: Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Helper: Format date
     */
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            ...options
        };
        
        return new Date(date).toLocaleDateString('pl-PL', defaultOptions);
    }

    /**
     * Helper: Format time
     */
    formatTime(date, options = {}) {
        const defaultOptions = {
            hour: '2-digit',
            minute: '2-digit',
            ...options
        };
        
        return new Date(date).toLocaleTimeString('pl-PL', defaultOptions);
    }

    /**
     * Helper: Format currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN'
        }).format(amount);
    }

    /**
     * Helper: Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Helper: Commit to store with error handling
     */
    commit(mutation, payload) {
        try {
            store.commit(mutation, payload);
        } catch (error) {
            console.error(`[${this.constructor.name}] Store commit error:`, error);
            this.showNotification('error', 'Błąd zapisu danych');
        }
    }

    /**
     * Helper: Dispatch action with error handling
     */
    async dispatch(action, payload) {
        try {
            return await store.dispatch(action, payload);
        } catch (error) {
            console.error(`[${this.constructor.name}] Store dispatch error:`, error);
            this.showNotification('error', 'Błąd operacji');
            throw error;
        }
    }

    /**
     * Helper: Show notification
     */
    showNotification(type, message) {
        store.commit('ADD_NOTIFICATION', { type, message });
    }

    /**
     * Cleanup - remove event listeners and subscriptions
     */
    destroy() {
        console.log(`[${this.constructor.name}] Destroying...`);
        
        // Unsubscribe from store
        this.subscriptions.forEach(unsubscribe => unsubscribe());
        this.subscriptions = [];
        
        // Remove event listeners
        this.eventListeners.forEach(({ element, event, handler, options }) => {
            element.removeEventListener(event, handler, options);
        });
        this.eventListeners = [];
        
        this.isInitialized = false;
        console.log(`[${this.constructor.name}] Destroyed`);
    }
}

export default BaseView;
