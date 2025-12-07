/**
 * Tracker View - Activity Tracking and Monitoring UI
 */

import store from '../../store/index.js';
import TrackerStore from './TrackerStore.js';

class TrackerView {
    constructor() {
        this.container = null;
        this.tabs = null;
        this.tracking = null;
        this.history = null;
        this.stats = null;
        this.activeTab = 'tracking';
    }

    /**
     * Initialize Tracker View
     */
    init() {
        console.log('[TrackerView] Initializing...');
        
        // Get DOM elements
        this.container = document.getElementById('trackerContainer');
        this.tabs = document.getElementById('trackerTabs');
        this.tracking = document.getElementById('trackingPanel');
        this.history = document.getElementById('trackingHistory');
        this.stats = document.getElementById('trackingStats');

        // Setup event listeners
        this.setupEventListeners();
        
        // Subscribe to store changes
        this.setupStoreSubscriptions();
        
        // Load initial data
        this.loadInitialData();
        
        console.log('[TrackerView] Initialized successfully');
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

        // Start/stop tracking
        const startBtn = document.getElementById('startTrackingBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startTracking();
            });
        }

        const stopBtn = document.getElementById('stopTrackingBtn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopTracking();
            });
        }

        // Add activity
        const addActivityBtn = document.getElementById('addActivityBtn');
        if (addActivityBtn) {
            addActivityBtn.addEventListener('click', () => {
                this.showAddActivityDialog();
            });
        }

        // Clear history
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                this.clearHistory();
            });
        }

        // Export data
        const exportBtn = document.getElementById('exportTrackerDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // Activity type filter
        const activityFilter = document.getElementById('activityTypeFilter');
        if (activityFilter) {
            activityFilter.addEventListener('change', (e) => {
                this.filterActivities(e.target.value);
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 't') {
                    e.preventDefault();
                    this.startTracking();
                }
                if (e.key === 's') {
                    e.preventDefault();
                    this.stopTracking();
                }
                if (e.key === 'e') {
                    e.preventDefault();
                    this.exportData();
                }
                if (e.key === '1') this.switchTab('tracking');
                if (e.key === '2') this.switchTab('history');
                if (e.key === '3') this.switchTab('stats');
            }
        });
    }

    /**
     * Setup store subscriptions
     */
    setupStoreSubscriptions() {
        // Subscribe to tracking state
        store.subscribe('trackerActive', (active) => {
            this.setTrackingState(active);
        });

        // Subscribe to activities
        store.subscribe('trackerActivities', (activities) => {
            this.renderActivities(activities);
        });

        // Subscribe to tracking statistics
        store.subscribe('trackerStatistics', (statistics) => {
            this.renderStatistics(statistics);
        });

        // Subscribe to loading state
        store.subscribe('trackerLoading', (loading) => {
            this.setLoading(loading);
        });
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            await Promise.all([
                TrackerStore.loadActivities(),
                TrackerStore.loadStatistics()
            ]);
        } catch (error) {
            console.error('[TrackerView] Load initial data error:', error);
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

        // Show/hide panels
        if (this.tracking) {
            this.tracking.classList.toggle('hidden', tabName !== 'tracking');
        }
        if (this.history) {
            this.history.classList.toggle('hidden', tabName !== 'history');
        }
        if (this.stats) {
            this.stats.classList.toggle('hidden', tabName !== 'stats');
        }

        this.activeTab = tabName;
    }

    /**
     * Start tracking
     */
    async startTracking() {
        try {
            await TrackerStore.startTracking();

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Śledzenie rozpoczęte'
            });
        } catch (error) {
            console.error('[TrackerView] Start tracking error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd rozpoczynania śledzenia'
            });
        }
    }

    /**
     * Stop tracking
     */
    async stopTracking() {
        try {
            await TrackerStore.stopTracking();

            store.commit('ADD_NOTIFICATION', {
                type: 'info',
                message: 'Śledzenie zatrzymane'
            });
        } catch (error) {
            console.error('[TrackerView] Stop tracking error:', error);
        }
    }

    /**
     * Show add activity dialog
     */
    showAddActivityDialog() {
        // This would open a modal/dialog for adding activities
        store.commit('ADD_NOTIFICATION', {
            type: 'info',
            message: 'Dialog dodawania aktywności - do zaimplementowania'
        });
    }

    /**
     * Clear history
     */
    async clearHistory() {
        try {
            if (!confirm('Czy na pewno wyczyścić historię śledzenia?')) return;

            await TrackerStore.clearHistory();

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Historia wyczyszczona'
            });
        } catch (error) {
            console.error('[TrackerView] Clear history error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd czyszczenia historii'
            });
        }
    }

    /**
     * Export data
     */
    async exportData() {
        try {
            await TrackerStore.exportData();

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Dane wyeksportowane'
            });
        } catch (error) {
            console.error('[TrackerView] Export data error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd eksportu danych'
            });
        }
    }

    /**
     * Filter activities
     */
    filterActivities(type) {
        const activities = store.get('trackerActivities') || [];
        
        if (!type || type === 'all') {
            this.renderActivities(activities);
            return;
        }

        const filtered = activities.filter(activity => activity.type === type);
        this.renderActivities(filtered);
    }

    /**
     * Render activities
     */
    renderActivities(activities) {
        if (!this.history) return;

        const container = this.history.querySelector('.activities-list');
        if (!container) return;

        container.innerHTML = '';

        if (!activities || activities.length === 0) {
            this.renderEmptyActivities(container);
            return;
        }

        // Group activities by date
        const groupedActivities = this.groupActivitiesByDate(activities);

        Object.entries(groupedActivities).forEach(([date, dateActivities]) => {
            const section = this.createActivitiesSection(date, dateActivities);
            container.appendChild(section);
        });

        // Re-initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Group activities by date
     */
    groupActivitiesByDate(activities) {
        return activities.reduce((groups, activity) => {
            const date = new Date(activity.timestamp).toLocaleDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(activity);
            return groups;
        }, {});
    }

    /**
     * Create activities section
     */
    createActivitiesSection(date, activities) {
        const section = document.createElement('div');
        section.className = 'mb-6';

        // Section header
        const header = document.createElement('div');
        header.className = 'flex items-center justify-between mb-3';
        header.innerHTML = `
            <h3 class="text-sm font-bold text-slate-700 dark:text-slate-300">${date}</h3>
            <span class="text-xs text-slate-500">${activities.length} aktywności</span>
        `;
        section.appendChild(header);

        // Activities list
        const list = document.createElement('div');
        list.className = 'space-y-2';

        activities.forEach(activity => {
            const activityElement = this.createActivityElement(activity);
            list.appendChild(activityElement);
        });

        section.appendChild(list);
        return section;
    }

    /**
     * Create activity element
     */
    createActivityElement(activity) {
        const div = document.createElement('div');
        div.className = 'p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer';
        div.dataset.activityId = activity.id;

        const icon = this.getActivityIcon(activity.type);
        const color = this.getActivityColor(activity.type);
        const time = new Date(activity.timestamp).toLocaleTimeString();

        div.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="w-8 h-8 ${color} rounded-lg flex items-center justify-center flex-shrink-0">
                    <i data-lucide="${icon}" class="w-4 h-4 text-white"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                        <h4 class="text-sm font-medium text-slate-800 dark:text-white">${activity.title || 'Aktywność'}</h4>
                        <span class="text-xs text-slate-500">${time}</span>
                    </div>
                    <div class="text-xs text-slate-600 dark:text-slate-400">
                        ${this.getActivityDescription(activity)}
                    </div>
                    ${activity.duration ? `
                        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <i data-lucide="clock" class="w-3 h-3 inline mr-1"></i>
                            Czas trwania: ${activity.duration}
                        </div>
                    ` : ''}
                </div>
                <div class="flex items-center space-x-1 ml-2">
                    <button onclick="event.stopPropagation(); trackerView.viewActivityDetails('${activity.id}')" class="p-1 text-slate-400 hover:text-indigo-600 transition-colors" title="Szczegóły">
                        <i data-lucide="info" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="event.stopPropagation(); trackerView.deleteActivity('${activity.id}')" class="p-1 text-slate-400 hover:text-red-600 transition-colors" title="Usuń">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </div>
        `;

        div.addEventListener('click', () => {
            this.viewActivityDetails(activity.id);
        });

        return div;
    }

    /**
     * Get activity icon
     */
    getActivityIcon(type) {
        const icons = {
            work: 'briefcase',
            break: 'coffee',
            meeting: 'users',
            travel: 'map-pin',
            exercise: 'activity',
            study: 'book',
            other: 'circle'
        };

        return icons[type] || 'circle';
    }

    /**
     * Get activity color
     */
    getActivityColor(type) {
        const colors = {
            work: 'bg-blue-500',
            break: 'bg-green-500',
            meeting: 'bg-purple-500',
            travel: 'bg-orange-500',
            exercise: 'bg-red-500',
            study: 'bg-indigo-500',
            other: 'bg-slate-500'
        };

        return colors[type] || 'bg-slate-500';
    }

    /**
     * Get activity description
     */
    getActivityDescription(activity) {
        const descriptions = {
            work: 'Praca',
            break: 'Przerwa',
            meeting: 'Spotkanie',
            travel: 'Podróż',
            exercise: 'Ćwiczenia',
            study: 'Nauka'
        };

        return descriptions[activity.type] || activity.type;
    }

    /**
     * Render empty activities
     */
    renderEmptyActivities(container) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-center">
                <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <i data-lucide="activity" size="28" class="text-slate-300 dark:text-slate-600"></i>
                </div>
                <h3 class="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">Brak aktywności</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Rozpocznij śledzenie aktywności</p>
                <button class="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm" onclick="trackerView.startTracking()">
                    <i data-lucide="play" class="w-4 h-4 inline mr-2"></i>
                    Rozpocznij śledzenie
                </button>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Render statistics
     */
    renderStatistics(statistics) {
        if (!this.stats) return;

        const container = this.stats.querySelector('.stats-container');
        if (!container) return;

        container.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <i data-lucide="activity" class="w-5 h-5 text-indigo-500"></i>
                        <span class="text-xs text-slate-500">Dziś</span>
                    </div>
                    <div class="text-2xl font-bold text-slate-800 dark:text-white">${statistics.todayActivities || 0}</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">Aktywności</div>
                </div>
                
                <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <i data-lucide="clock" class="w-5 h-5 text-green-500"></i>
                        <span class="text-xs text-slate-500">Dziś</span>
                    </div>
                    <div class="text-2xl font-bold text-slate-800 dark:text-white">${statistics.todayDuration || '0h'}</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">Czas trwania</div>
                </div>
                
                <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <i data-lucide="trending-up" class="w-5 h-5 text-blue-500"></i>
                        <span class="text-xs text-slate-500">Tydzień</span>
                    </div>
                    <div class="text-2xl font-bold text-slate-800 dark:text-white">${statistics.weekActivities || 0}</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">Aktywności</div>
                </div>
                
                <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <i data-lucide="calendar" class="w-5 h-5 text-orange-500"></i>
                        <span class="text-xs text-slate-500">Miesiąc</span>
                    </div>
                    <div class="text-2xl font-bold text-slate-800 dark:text-white">${statistics.monthActivities || 0}</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">Aktywności</div>
                </div>
            </div>
            
            <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Typy aktywności</h3>
                <div class="space-y-2">
                    ${Object.entries(statistics.activityTypes || {}).map(([type, count]) => 
                        this.renderActivityType(type, count, statistics.totalActivities || 0)
                    ).join('')}
                </div>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Render activity type
     */
    renderActivityType(type, count, total) {
        const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
        const color = this.getActivityColor(type);
        const description = this.getActivityDescription({ type });

        return `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 ${color} rounded-full"></div>
                    <span class="text-sm text-slate-600 dark:text-slate-400">${description}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="text-sm font-medium text-slate-800 dark:text-white">${count}</span>
                    <span class="text-xs text-slate-500">${percentage}%</span>
                </div>
            </div>
        `;
    }

    /**
     * Set tracking state
     */
    setTrackingState(active) {
        const startBtn = document.getElementById('startTrackingBtn');
        const stopBtn = document.getElementById('stopTrackingBtn');
        const status = document.getElementById('trackingStatus');

        if (startBtn) {
            startBtn.disabled = active;
            startBtn.classList.toggle('hidden', active);
        }

        if (stopBtn) {
            stopBtn.disabled = !active;
            stopBtn.classList.toggle('hidden', !active);
        }

        if (status) {
            status.innerHTML = active 
                ? '<span class="text-green-600"><i data-lucide="activity" class="w-4 h-4 inline mr-1"></i>Aktywne</span>'
                : '<span class="text-slate-500"><i data-lucide="circle" class="w-4 h-4 inline mr-1"></i>Gotowe</span>';
        }

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        const exportBtn = document.getElementById('exportTrackerDataBtn');
        if (exportBtn) {
            exportBtn.disabled = loading;
            exportBtn.innerHTML = loading 
                ? '<i data-lucide="loader-2" class="w-4 h-4 animate-spin mr-2"></i>Eksportowanie...'
                : '<i data-lucide="download" class="w-4 h-4 mr-2"></i>Eksportuj dane';
        }

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * View activity details
     */
    viewActivityDetails(activityId) {
        // This would show a modal with activity details
        console.log('Viewing activity details:', activityId);
    }

    /**
     * Delete activity
     */
    async deleteActivity(activityId) {
        try {
            if (!confirm('Czy na pewno usunąć tę aktywność?')) return;

            await TrackerStore.deleteActivity(activityId);

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Aktywność usunięta'
            });
        } catch (error) {
            console.error('[TrackerView] Delete activity error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd usuwania aktywności'
            });
        }
    }

    /**
     * Get tracking status
     */
    getTrackingStatus() {
        const active = store.get('trackerActive') || false;
        const activities = store.get('trackerActivities') || [];
        
        return {
            active,
            totalActivities: activities.length,
            todayActivities: activities.filter(a => {
                const today = new Date().toDateString();
                return new Date(a.timestamp).toDateString() === today;
            }).length
        };
    }
}

// Create and export singleton instance
const trackerView = new TrackerView();

export default trackerView;
