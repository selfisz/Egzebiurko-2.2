/**
 * Global Search View - Universal Search Across All Modules
 */

import store from '../../store/index.js';
import GlobalSearchStore from './GlobalSearchStore.js';

class GlobalSearchView {
    constructor() {
        this.container = null;
        this.searchInput = null;
        this.resultsContainer = null;
        this.filters = null;
        this.loading = null;
        this.init();
    }

    /**
     * Initialize Global Search View
     */
    init() {
        console.log('[GlobalSearchView] Initializing...');
        
        // Get DOM elements
        this.container = document.getElementById('globalSearchContainer');
        this.searchInput = document.getElementById('globalSearchInput');
        this.resultsContainer = document.getElementById('globalSearchResults');
        this.filters = document.getElementById('globalSearchFilters');
        this.loading = document.getElementById('globalSearchLoading');

        // Setup event listeners
        this.setupEventListeners();
        
        // Subscribe to store changes
        this.setupStoreSubscriptions();
        
        console.log('[GlobalSearchView] Initialized successfully');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search input
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.debounceSearch(e.target.value);
            });

            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch();
                }
                if (e.key === 'Escape') {
                    this.clearSearch();
                }
            });

            // Focus search on Ctrl+K
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    this.searchInput?.focus();
                }
            });
        }

        // Filter changes
        if (this.filters) {
            this.filters.addEventListener('change', () => {
                this.performSearch();
            });
        }

        // Clear search button
        const clearBtn = document.getElementById('clearSearchBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }

        // Export results button
        const exportBtn = document.getElementById('exportSearchResultsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportResults();
            });
        }
    }

    /**
     * Setup store subscriptions
     */
    setupStoreSubscriptions() {
        // Subscribe to search results
        store.subscribe('globalSearchResults', (results) => {
            this.renderResults(results);
        });

        // Subscribe to search loading state
        store.subscribe('globalSearchLoading', (loading) => {
            this.setLoading(loading);
        });

        // Subscribe to search filters
        store.subscribe('globalSearchFilters', (filters) => {
            this.updateFilters(filters);
        });
    }

    /**
     * Debounce search
     */
    debounceSearch(query) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.performSearch();
        }, 300);
    }

    /**
     * Perform search
     */
    async performSearch() {
        if (!this.searchInput) return;

        const query = this.searchInput.value.trim();
        if (!query) {
            this.renderResults([]);
            return;
        }

        try {
            const filters = this.getActiveFilters();
            await GlobalSearchStore.search(query, filters);
        } catch (error) {
            console.error('[GlobalSearchView] Search error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd wyszukiwania'
            });
        }
    }

    /**
     * Get active filters
     */
    getActiveFilters() {
        if (!this.filters) return {};

        const filters = {};
        const checkboxes = this.filters.querySelectorAll('input[type="checkbox"]');
        
        checkboxes.forEach(checkbox => {
            filters[checkbox.name] = checkbox.checked;
        });

        const selects = this.filters.querySelectorAll('select');
        selects.forEach(select => {
            filters[select.name] = select.value;
        });

        return filters;
    }

    /**
     * Clear search
     */
    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        
        store.commit('SET_GLOBAL_SEARCH_RESULTS', []);
        
        // Reset filters
        if (this.filters) {
            const checkboxes = this.filters.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
            });
        }
    }

    /**
     * Render results
     */
    renderResults(results) {
        if (!this.resultsContainer) return;

        this.resultsContainer.innerHTML = '';

        if (!results || results.length === 0) {
            this.renderEmptyState();
            return;
        }

        // Group results by module
        const groupedResults = this.groupResultsByModule(results);

        Object.entries(groupedResults).forEach(([module, moduleResults]) => {
            const section = this.createResultsSection(module, moduleResults);
            this.resultsContainer.appendChild(section);
        });

        // Re-initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Group results by module
     */
    groupResultsByModule(results) {
        return results.reduce((groups, result) => {
            const module = result.module || 'Inne';
            if (!groups[module]) {
                groups[module] = [];
            }
            groups[module].push(result);
            return groups;
        }, {});
    }

    /**
     * Create results section
     */
    createResultsSection(module, results) {
        const section = document.createElement('div');
        section.className = 'mb-6';

        // Section header
        const header = document.createElement('div');
        header.className = 'flex items-center justify-between mb-3';
        header.innerHTML = `
            <h3 class="text-sm font-bold text-slate-700 dark:text-slate-300">${this.getModuleDisplayName(module)}</h3>
            <span class="text-xs text-slate-500">${results.length} wyników</span>
        `;
        section.appendChild(header);

        // Results list
        const list = document.createElement('div');
        list.className = 'space-y-2';

        results.forEach(result => {
            const resultElement = this.createResultElement(result);
            list.appendChild(resultElement);
        });

        section.appendChild(list);
        return section;
    }

    /**
     * Create result element
     */
    createResultElement(result) {
        const div = document.createElement('div');
        div.className = 'p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer';
        div.dataset.resultId = result.id;

        const icon = this.getModuleIcon(result.module);
        const title = this.highlightMatch(result.title || 'Bez tytułu', result.match);
        const content = this.highlightMatch(result.content || '', result.match);

        div.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i data-lucide="${icon}" class="w-4 h-4 text-slate-600 dark:text-slate-400"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                        <h4 class="text-sm font-medium text-slate-800 dark:text-white truncate">${title}</h4>
                        <span class="text-xs text-slate-500">${this.formatDate(result.date)}</span>
                    </div>
                    <p class="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">${content}</p>
                    ${result.tags ? `
                        <div class="flex items-center space-x-1 mt-2">
                            ${result.tags.map(tag => `
                                <span class="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                                    ${tag}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="flex items-center space-x-1 ml-2">
                    <button onclick="event.stopPropagation(); globalSearchView.openResult('${result.id}')" class="p-1 text-slate-400 hover:text-indigo-600 transition-colors" title="Otwórz">
                        <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="event.stopPropagation(); globalSearchView.copyResult('${result.id}')" class="p-1 text-slate-400 hover:text-green-600 transition-colors" title="Kopiuj">
                        <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </div>
        `;

        div.addEventListener('click', () => {
            this.openResult(result.id);
        });

        return div;
    }

    /**
     * Highlight match in text
     */
    highlightMatch(text, match) {
        if (!text || !match) return text;

        const regex = new RegExp(`(${match})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">$1</mark>');
    }

    /**
     * Get module display name
     */
    getModuleDisplayName(module) {
        const names = {
            notes: 'Notatki',
            links: 'Linki',
            registry: 'Rejestr',
            finance: 'Finanse',
            generator: 'Generator',
            ai: 'AI',
            statistics: 'Statystyki',
            security: 'Bezpieczeństwo',
            terrain: 'Teren',
            tracker: 'Tracker',
            cars: 'Pojazdy'
        };

        return names[module] || module;
    }

    /**
     * Get module icon
     */
    getModuleIcon(module) {
        const icons = {
            notes: 'sticky-note',
            links: 'link',
            registry: 'building',
            finance: 'trending-up',
            generator: 'file-text',
            ai: 'cpu',
            statistics: 'bar-chart-2',
            security: 'shield',
            terrain: 'map',
            tracker: 'activity',
            cars: 'car'
        };

        return icons[module] || 'file';
    }

    /**
     * Format date
     */
    formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString();
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        if (!this.resultsContainer) return;

        const hasQuery = this.searchInput?.value.trim();

        this.resultsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-center">
                <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <i data-lucide="search" size="28" class="text-slate-300 dark:text-slate-600"></i>
                </div>
                <h3 class="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                    ${hasQuery ? 'Brak wyników' : 'Wyszukaj wszystko'}
                </h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    ${hasQuery ? 'Spróbuj inne słowa kluczowe lub filtry' : 'Wpisz zapytanie, aby przeszukać wszystkie moduły'}
                </p>
                ${!hasQuery ? `
                    <div class="space-y-2 text-left bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                        <p class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Wskazówki:</p>
                        <ul class="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                            <li>• Użyj Ctrl+K aby szybko otworzyć wyszukiwanie</li>
                            <li>• Filtruj wyniki według modułów</li>
                            <li>• Wyszukuj w tytułach, treści i tagach</li>
                            <li>• Eksportuj wyniki do analizy</li>
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Open result
     */
    openResult(resultId) {
        try {
            const results = store.get('globalSearchResults') || [];
            const result = results.find(r => r.id === resultId);
            
            if (!result) return;

            // Navigate to the result based on module
            this.navigateToResult(result);

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Otwarto wynik wyszukiwania'
            });
        } catch (error) {
            console.error('[GlobalSearchView] Open result error:', error);
        }
    }

    /**
     * Navigate to result
     */
    navigateToResult(result) {
        // This would integrate with the routing system
        console.log('Navigating to result:', result);
        
        // For now, just copy the result content
        this.copyResult(result.id);
    }

    /**
     * Copy result
     */
    copyResult(resultId) {
        try {
            const results = store.get('globalSearchResults') || [];
            const result = results.find(r => r.id === resultId);
            
            if (!result) return;

            const text = `${result.title || ''}\n${result.content || ''}`;

            navigator.clipboard.writeText(text).then(() => {
                store.commit('ADD_NOTIFICATION', {
                    type: 'success',
                    message: 'Skopiowano do schowka'
                });
            }).catch(() => {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);

                store.commit('ADD_NOTIFICATION', {
                    type: 'success',
                    message: 'Skopiowano do schowka'
                });
            });
        } catch (error) {
            console.error('[GlobalSearchView] Copy result error:', error);
        }
    }

    /**
     * Export results
     */
    exportResults() {
        try {
            const results = store.get('globalSearchResults') || [];
            
            if (results.length === 0) {
                store.commit('ADD_NOTIFICATION', {
                    type: 'warning',
                    message: 'Brak wyników do eksportu'
                });
                return;
            }

            const dataStr = JSON.stringify(results, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `search_results_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Wyniki wyszukiwania wyeksportowane'
            });
        } catch (error) {
            console.error('[GlobalSearchView] Export error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd eksportu wyników'
            });
        }
    }

    /**
     * Update filters
     */
    updateFilters(filters) {
        if (!this.filters) return;

        // Update filter checkboxes
        Object.entries(filters).forEach(([name, value]) => {
            const checkbox = this.filters.querySelector(`input[name="${name}"]`);
            if (checkbox && checkbox.type === 'checkbox') {
                checkbox.checked = value;
            }

            const select = this.filters.querySelector(`select[name="${name}"]`);
            if (select) {
                select.value = value;
            }
        });
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        if (this.loading) {
            this.loading.classList.toggle('hidden', !loading);
        }

        if (this.searchInput) {
            this.searchInput.disabled = loading;
        }

        // Show loading spinner in results
        if (loading && this.resultsContainer) {
            this.resultsContainer.innerHTML = `
                <div class="flex items-center justify-center py-12">
                    <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-slate-400"></i>
                </div>
            `;

            if (window.lucide) {
                lucide.createIcons();
            }
        }
    }

    /**
     * Get search statistics
     */
    getSearchStatistics() {
        const results = store.get('globalSearchResults') || [];
        
        return {
            totalResults: results.length,
            modules: [...new Set(results.map(r => r.module))].length,
            hasQuery: !!this.searchInput?.value.trim(),
            lastSearch: new Date().toLocaleString()
        };
    }
}

// Create and export singleton instance
const globalSearchView = new GlobalSearchView();

export default globalSearchView;
