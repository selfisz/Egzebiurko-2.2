/**
 * Statistics View - Data Analytics and Reporting UI
 */

import store from '../../store/index.js';
import StatisticsStore from './StatisticsStore.js';

class StatisticsView {
    constructor() {
        this.container = null;
        this.tabs = null;
        this.charts = {
            overview: null,
            cases: null,
            finance: null,
            performance: null
        };
        this.activeTab = 'overview';
        this.dateRange = null;
        this.exportBtn = null;
    }

    /**
     * Initialize Statistics View
     */
    init() {
        console.log('[StatisticsView] Initializing...');
        
        // Get DOM elements
        this.container = document.getElementById('statisticsContainer');
        this.tabs = document.getElementById('statisticsTabs');
        this.charts.overview = document.getElementById('overviewChart');
        this.charts.cases = document.getElementById('casesChart');
        this.charts.finance = document.getElementById('financeChart');
        this.charts.performance = document.getElementById('performanceChart');
        this.dateRange = document.getElementById('statisticsDateRange');
        this.exportBtn = document.getElementById('exportStatisticsBtn');

        // Setup event listeners
        this.setupEventListeners();
        
        // Subscribe to store changes
        this.setupStoreSubscriptions();
        
        // Load initial data
        this.loadInitialData();
        
        console.log('[StatisticsView] Initialized successfully');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Tab switching
        if (this.tabs) {
            this.tabs.addEventListener('click', (e) => {
                const tab = e.target.closest('[data-tab]');
                if (tab) {
                    this.switchTab(tab.dataset.tab);
                }
            });
        }

        // Date range change
        if (this.dateRange) {
            this.dateRange.addEventListener('change', () => {
                this.updateStatistics();
            });
        }

        // Export functionality
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => {
                this.exportStatistics();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshStatisticsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshStatistics();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'r') {
                    e.preventDefault();
                    this.refreshStatistics();
                }
                if (e.key === 'e') {
                    e.preventDefault();
                    this.exportStatistics();
                }
                if (e.key === '1') this.switchTab('overview');
                if (e.key === '2') this.switchTab('cases');
                if (e.key === '3') this.switchTab('finance');
                if (e.key === '4') this.switchTab('performance');
            }
        });
    }

    /**
     * Setup store subscriptions
     */
    setupStoreSubscriptions() {
        // Subscribe to statistics changes
        store.subscribe('statistics', (statistics) => {
            this.renderStatistics(statistics);
        });

        // Subscribe to loading state
        store.subscribe('statisticsLoading', (loading) => {
            this.setLoading(loading);
        });
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            await StatisticsStore.loadStatistics();
        } catch (error) {
            console.error('[StatisticsView] Load initial data error:', error);
        }
    }

    /**
     * Switch tab
     */
    switchTab(tabName) {
        if (!this.tabs) return;

        // Update tab buttons
        const tabButtons = this.tabs.querySelectorAll('[data-tab]');
        tabButtons.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.className = 'px-4 py-2 text-sm font-medium bg-indigo-500 text-white rounded-lg';
            } else {
                btn.className = 'px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors';
            }
        });

        // Show/hide chart sections
        Object.entries(this.charts).forEach(([name, container]) => {
            if (container) {
                container.classList.toggle('hidden', name !== tabName);
            }
        });

        this.activeTab = tabName;
        
        // Update chart for active tab
        this.updateActiveChart();
    }

    /**
     * Update statistics
     */
    async updateStatistics() {
        try {
            const dateRange = this.dateRange?.value || 'month';
            await StatisticsStore.updateStatistics(dateRange);
        } catch (error) {
            console.error('[StatisticsView] Update statistics error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd aktualizacji statystyk'
            });
        }
    }

    /**
     * Refresh statistics
     */
    async refreshStatistics() {
        try {
            await StatisticsStore.refreshStatistics();
            
            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Statystyki odświeżone'
            });
        } catch (error) {
            console.error('[StatisticsView] Refresh statistics error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd odświeżania statystyk'
            });
        }
    }

    /**
     * Render statistics
     */
    renderStatistics(statistics) {
        if (!statistics) return;

        // Render overview statistics
        this.renderOverviewStatistics(statistics.overview);
        
        // Render cases statistics
        this.renderCasesStatistics(statistics.cases);
        
        // Render finance statistics
        this.renderFinanceStatistics(statistics.finance);
        
        // Render performance statistics
        this.renderPerformanceStatistics(statistics.performance);
    }

    /**
     * Render overview statistics
     */
    renderOverviewStatistics(data) {
        const container = document.getElementById('overviewStats');
        if (!container) return;

        container.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <i data-lucide="file-text" class="w-5 h-5 text-blue-500"></i>
                        <span class="text-xs text-slate-500">+${data.newCases || 0}</span>
                    </div>
                    <div class="text-2xl font-bold text-slate-800 dark:text-white">${data.totalCases || 0}</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">Sprawy</div>
                </div>
                
                <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <i data-lucide="users" class="w-5 h-5 text-green-500"></i>
                        <span class="text-xs text-slate-500">+${data.newClients || 0}</span>
                    </div>
                    <div class="text-2xl font-bold text-slate-800 dark:text-white">${data.totalClients || 0}</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">Klienci</div>
                </div>
                
                <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <i data-lucide="trending-up" class="w-5 h-5 text-indigo-500"></i>
                        <span class="text-xs text-green-500">+${data.growthRate || 0}%</span>
                    </div>
                    <div class="text-2xl font-bold text-slate-800 dark:text-white">${data.revenue || 0} PLN</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">Przychód</div>
                </div>
                
                <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <i data-lucide="clock" class="w-5 h-5 text-orange-500"></i>
                        <span class="text-xs text-slate-500">${data.avgTime || 0} dni</span>
                    </div>
                    <div class="text-2xl font-bold text-slate-800 dark:text-white">${data.efficiency || 0}%</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">Efektywność</div>
                </div>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Render cases statistics
     */
    renderCasesStatistics(data) {
        const container = document.getElementById('casesStats');
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-4">
                <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Status spraw</h3>
                    <div class="space-y-2">
                        ${this.renderProgressBar('Aktywne', data.active || 0, data.total || 0, 'blue')}
                        ${this.renderProgressBar('Zakończone', data.completed || 0, data.total || 0, 'green')}
                        ${this.renderProgressBar('W toku', data.pending || 0, data.total || 0, 'yellow')}
                    </div>
                </div>
                
                <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Typy spraw</h3>
                    <div class="space-y-2">
                        ${Object.entries(data.types || {}).map(([type, count]) => 
                            this.renderProgressBar(type, count, data.total || 0, 'indigo')
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render finance statistics
     */
    renderFinanceStatistics(data) {
        const container = document.getElementById('financeStats');
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-4">
                <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Przychody</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <div class="text-2xl font-bold text-green-600">${data.income || 0} PLN</div>
                            <div class="text-xs text-slate-500">Przychód</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-red-600">${data.expenses || 0} PLN</div>
                            <div class="text-xs text-slate-500">Wydatki</div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Zysk netto</h3>
                    <div class="text-3xl font-bold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}">
                        ${data.profit || 0} PLN
                    </div>
                    <div class="text-xs text-slate-500 mt-1">
                        Marża: ${data.margin || 0}%
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render performance statistics
     */
    renderPerformanceStatistics(data) {
        const container = document.getElementById('performanceStats');
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-4">
                <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Wydajność</h3>
                    <div class="space-y-3">
                        ${this.renderMetric('Średni czas sprawy', `${data.avgCaseTime || 0} dni`, 'clock')}
                        ${this.renderMetric('Sprawy/tydzień', data.casesPerWeek || 0, 'trending-up')}
                        ${this.renderMetric('Wskaźnik sukcesu', `${data.successRate || 0}%`, 'target')}
                    </div>
                </div>
                
                <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Aktywność</h3>
                    <div class="space-y-3">
                        ${this.renderMetric('Notatki', data.notesCount || 0, 'sticky-note')}
                        ${this.renderMetric('Dokumenty', data.documentsCount || 0, 'file-text')}
                        ${this.renderMetric('Zadania', data.tasksCount || 0, 'check-square')}
                    </div>
                </div>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Render progress bar
     */
    renderProgressBar(label, value, total, color) {
        const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0;
        const colorClasses = {
            blue: 'bg-blue-500',
            green: 'bg-green-500',
            yellow: 'bg-yellow-500',
            indigo: 'bg-indigo-500'
        };

        return `
            <div class="flex items-center justify-between">
                <span class="text-sm text-slate-600 dark:text-slate-400">${label}</span>
                <span class="text-sm font-medium text-slate-800 dark:text-white">${value}</span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div class="${colorClasses[color]} h-2 rounded-full transition-all" style="width: ${percentage}%"></div>
            </div>
        `;
    }

    /**
     * Render metric
     */
    renderMetric(label, value, icon) {
        return `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <i data-lucide="${icon}" class="w-4 h-4 text-slate-500"></i>
                    <span class="text-sm text-slate-600 dark:text-slate-400">${label}</span>
                </div>
                <span class="text-sm font-medium text-slate-800 dark:text-white">${value}</span>
            </div>
        `;
    }

    /**
     * Update active chart
     */
    updateActiveChart() {
        // This would integrate with a charting library like Chart.js
        // For now, we'll just update the data display
        const statistics = store.get('statistics');
        if (statistics) {
            switch (this.activeTab) {
                case 'overview':
                    this.renderOverviewChart(statistics.overview);
                    break;
                case 'cases':
                    this.renderCasesChart(statistics.cases);
                    break;
                case 'finance':
                    this.renderFinanceChart(statistics.finance);
                    break;
                case 'performance':
                    this.renderPerformanceChart(statistics.performance);
                    break;
            }
        }
    }

    /**
     * Render overview chart
     */
    renderOverviewChart(data) {
        const container = this.charts.overview?.querySelector('.chart-container');
        if (!container) return;

        // Simple chart representation - would use Chart.js in production
        container.innerHTML = `
            <div class="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div class="text-center">
                    <i data-lucide="bar-chart-2" class="w-12 h-12 text-slate-400 mx-auto mb-2"></i>
                    <p class="text-sm text-slate-500">Wykres przeglądowy</p>
                    <p class="text-xs text-slate-400 mt-1">Integracja z Chart.js</p>
                </div>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Render cases chart
     */
    renderCasesChart(data) {
        const container = this.charts.cases?.querySelector('.chart-container');
        if (!container) return;

        container.innerHTML = `
            <div class="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div class="text-center">
                    <i data-lucide="pie-chart" class="w-12 h-12 text-slate-400 mx-auto mb-2"></i>
                    <p class="text-sm text-slate-500">Wykres spraw</p>
                    <p class="text-xs text-slate-400 mt-1">Integracja z Chart.js</p>
                </div>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Render finance chart
     */
    renderFinanceChart(data) {
        const container = this.charts.finance?.querySelector('.chart-container');
        if (!container) return;

        container.innerHTML = `
            <div class="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div class="text-center">
                    <i data-lucide="line-chart" class="w-12 h-12 text-slate-400 mx-auto mb-2"></i>
                    <p class="text-sm text-slate-500">Wykres finansowy</p>
                    <p class="text-xs text-slate-400 mt-1">Integracja z Chart.js</p>
                </div>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Render performance chart
     */
    renderPerformanceChart(data) {
        const container = this.charts.performance?.querySelector('.chart-container');
        if (!container) return;

        container.innerHTML = `
            <div class="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div class="text-center">
                    <i data-lucide="activity" class="w-12 h-12 text-slate-400 mx-auto mb-2"></i>
                    <p class="text-sm text-slate-500">Wykres wydajności</p>
                    <p class="text-xs text-slate-400 mt-1">Integracja z Chart.js</p>
                </div>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Export statistics
     */
    async exportStatistics() {
        try {
            await StatisticsStore.exportStatistics();

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Statystyki wyeksportowane'
            });
        } catch (error) {
            console.error('[StatisticsView] Export error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd eksportu statystyk'
            });
        }
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        if (this.exportBtn) {
            this.exportBtn.disabled = loading;
            this.exportBtn.innerHTML = loading 
                ? '<i data-lucide="loader-2" class="w-4 h-4 animate-spin mr-2"></i>Eksportowanie...'
                : '<i data-lucide="download" class="w-4 h-4 mr-2"></i>Eksportuj';
        }

        const refreshBtn = document.getElementById('refreshStatisticsBtn');
        if (refreshBtn) {
            refreshBtn.disabled = loading;
            refreshBtn.innerHTML = loading 
                ? '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>'
                : '<i data-lucide="refresh-cw" class="w-4 h-4"></i>';
        }

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Get statistics summary
     */
    getStatisticsSummary() {
        const statistics = store.get('statistics');
        
        return {
            totalCases: statistics.overview?.totalCases || 0,
            totalRevenue: statistics.finance?.income || 0,
            efficiency: statistics.performance?.successRate || 0,
            lastUpdated: new Date().toLocaleString()
        };
    }
}

// Create and export singleton instance
const statisticsView = new StatisticsView();

export default statisticsView;
