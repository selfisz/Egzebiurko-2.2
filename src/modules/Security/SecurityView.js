/**
 * Security View - Application Security and Access Control UI
 */

import store from '../../store/index.js';
import SecurityStore from './SecurityStore.js';

class SecurityView {
    constructor() {
        this.container = null;
        this.tabs = null;
        this.settings = {
            general: null,
            access: null,
            encryption: null,
            audit: null
        };
        this.activeTab = 'general';
        this.init();
    }

    /**
     * Initialize Security View
     */
    init() {
        console.log('[SecurityView] Initializing...');
        
        // Get DOM elements
        this.container = document.getElementById('securityContainer');
        this.tabs = document.getElementById('securityTabs');
        this.settings.general = document.getElementById('generalSecurity');
        this.settings.access = document.getElementById('accessControl');
        this.settings.encryption = document.getElementById('encryptionSettings');
        this.settings.audit = document.getElementById('auditLog');

        // Setup event listeners
        this.setupEventListeners();
        
        // Subscribe to store changes
        this.setupStoreSubscriptions();
        
        // Load initial data
        this.loadInitialData();
        
        console.log('[SecurityView] Initialized successfully');
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

        // Security settings
        this.setupSecuritySettingsListeners();

        // Access control
        this.setupAccessControlListeners();

        // Encryption settings
        this.setupEncryptionListeners();

        // Audit log
        this.setupAuditLogListeners();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === '1') this.switchTab('general');
                if (e.key === '2') this.switchTab('access');
                if (e.key === '3') this.switchTab('encryption');
                if (e.key === '4') this.switchTab('audit');
                if (e.key === 's') {
                    e.preventDefault();
                    this.saveSecuritySettings();
                }
            }
        });
    }

    /**
     * Setup security settings listeners
     */
    setupSecuritySettingsListeners() {
        // Enable/disable security
        const enableSecurity = document.getElementById('enableSecurity');
        if (enableSecurity) {
            enableSecurity.addEventListener('change', (e) => {
                this.toggleSecurity(e.target.checked);
            });
        }

        // Password protection
        const passwordProtection = document.getElementById('passwordProtection');
        if (passwordProtection) {
            passwordProtection.addEventListener('change', (e) => {
                this.togglePasswordProtection(e.target.checked);
            });
        }

        // Auto-lock timer
        const autoLockTimer = document.getElementById('autoLockTimer');
        if (autoLockTimer) {
            autoLockTimer.addEventListener('change', (e) => {
                this.updateAutoLockTimer(e.target.value);
            });
        }

        // Save settings button
        const saveSettingsBtn = document.getElementById('saveSecuritySettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSecuritySettings();
            });
        }
    }

    /**
     * Setup access control listeners
     */
    setupAccessControlListeners() {
        // Add user
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                this.showAddUserDialog();
            });
        }

        // Role management
        const roleSelect = document.getElementById('roleSelect');
        if (roleSelect) {
            roleSelect.addEventListener('change', (e) => {
                this.filterUsersByRole(e.target.value);
            });
        }

        // Permission toggles
        const permissionToggles = document.querySelectorAll('.permission-toggle');
        permissionToggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                this.updatePermission(e.target.dataset.userId, e.target.dataset.permission, e.target.checked);
            });
        });
    }

    /**
     * Setup encryption listeners
     */
    setupEncryptionListeners() {
        // Enable encryption
        const enableEncryption = document.getElementById('enableEncryption');
        if (enableEncryption) {
            enableEncryption.addEventListener('change', (e) => {
                this.toggleEncryption(e.target.checked);
            });
        }

        // Generate key
        const generateKeyBtn = document.getElementById('generateKeyBtn');
        if (generateKeyBtn) {
            generateKeyBtn.addEventListener('click', () => {
                this.generateEncryptionKey();
            });
        }

        // Backup key
        const backupKeyBtn = document.getElementById('backupKeyBtn');
        if (backupKeyBtn) {
            backupKeyBtn.addEventListener('click', () => {
                this.backupEncryptionKey();
            });
        }

        // Encrypt data
        const encryptDataBtn = document.getElementById('encryptDataBtn');
        if (encryptDataBtn) {
            encryptDataBtn.addEventListener('click', () => {
                this.encryptSensitiveData();
            });
        }
    }

    /**
     * Setup audit log listeners
     */
    setupAuditLogListeners() {
        // Clear log
        const clearLogBtn = document.getElementById('clearAuditLogBtn');
        if (clearLogBtn) {
            clearLogBtn.addEventListener('click', () => {
                this.clearAuditLog();
            });
        }

        // Export log
        const exportLogBtn = document.getElementById('exportAuditLogBtn');
        if (exportLogBtn) {
            exportLogBtn.addEventListener('click', () => {
                this.exportAuditLog();
            });
        }

        // Filter log
        const logFilter = document.getElementById('auditLogFilter');
        if (logFilter) {
            logFilter.addEventListener('change', (e) => {
                this.filterAuditLog(e.target.value);
            });
        }
    }

    /**
     * Setup store subscriptions
     */
    setupStoreSubscriptions() {
        // Subscribe to security settings changes
        store.subscribe('securitySettings', (settings) => {
            this.renderSecuritySettings(settings);
        });

        // Subscribe to users changes
        store.subscribe('users', (users) => {
            this.renderUsers(users);
        });

        // Subscribe to audit log changes
        store.subscribe('auditLog', (log) => {
            this.renderAuditLog(log);
        });

        // Subscribe to loading state
        store.subscribe('securityLoading', (loading) => {
            this.setLoading(loading);
        });
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            await Promise.all([
                SecurityStore.loadSecuritySettings(),
                SecurityStore.loadUsers(),
                SecurityStore.loadAuditLog()
            ]);
        } catch (error) {
            console.error('[SecurityView] Load initial data error:', error);
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

        // Show/hide settings sections
        Object.entries(this.settings).forEach(([name, container]) => {
            if (container) {
                container.classList.toggle('hidden', name !== tabName);
            }
        });

        this.activeTab = tabName;
    }

    /**
     * Render security settings
     */
    renderSecuritySettings(settings) {
        if (!settings) return;

        // Update general settings
        const enableSecurity = document.getElementById('enableSecurity');
        if (enableSecurity) {
            enableSecurity.checked = settings.enabled || false;
        }

        const passwordProtection = document.getElementById('passwordProtection');
        if (passwordProtection) {
            passwordProtection.checked = settings.passwordProtection || false;
        }

        const autoLockTimer = document.getElementById('autoLockTimer');
        if (autoLockTimer) {
            autoLockTimer.value = settings.autoLockTimer || 30;
        }

        // Update encryption settings
        const enableEncryption = document.getElementById('enableEncryption');
        if (enableEncryption) {
            enableEncryption.checked = settings.encryptionEnabled || false;
        }

        // Update access control
        this.renderAccessControl(settings.accessControl || {});
    }

    /**
     * Render access control
     */
    renderAccessControl(accessControl) {
        const container = document.getElementById('accessControlList');
        if (!container) return;

        const users = store.get('users') || [];
        
        if (users.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i data-lucide="users" class="w-12 h-12 text-slate-300 mx-auto mb-2"></i>
                    <p class="text-sm text-slate-500">Brak użytkowników</p>
                    <button class="mt-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm" onclick="securityView.showAddUserDialog()">
                        Dodaj użytkownika
                    </button>
                </div>
            `;
        } else {
            let html = '<div class="space-y-2">';
            users.forEach(user => {
                html += this.createUserElement(user);
            });
            html += '</div>';
            container.innerHTML = html;
        }

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Create user element
     */
    createUserElement(user) {
        const roleColors = {
            admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            user: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            viewer: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
        };

        return `
            <div class="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                            <i data-lucide="user" class="w-5 h-5 text-slate-600 dark:text-slate-400"></i>
                        </div>
                        <div>
                            <div class="font-medium text-slate-800 dark:text-white">${user.name}</div>
                            <div class="text-sm text-slate-500 dark:text-slate-400">${user.email}</div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${roleColors[user.role] || roleColors.user}">
                            ${user.role}
                        </span>
                        <button onclick="securityView.editUser('${user.id}')" class="p-1 text-slate-400 hover:text-indigo-600 transition-colors">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="securityView.deleteUser('${user.id}')" class="p-1 text-slate-400 hover:text-red-600 transition-colors">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render audit log
     */
    renderAuditLog(log) {
        const container = document.getElementById('auditLogList');
        if (!container) return;

        if (!log || log.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i data-lucide="file-text" class="w-12 h-12 text-slate-300 mx-auto mb-2"></i>
                    <p class="text-sm text-slate-500">Brak wpisów w logu</p>
                </div>
            `;
            return;
        }

        let html = '<div class="space-y-2">';
        log.slice(0, 50).forEach(entry => { // Show last 50 entries
            html += this.createLogEntry(entry);
        });
        html += '</div>';
        container.innerHTML = html;

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Create log entry
     */
    createLogEntry(entry) {
        const typeColors = {
            login: 'text-green-600',
            logout: 'text-red-600',
            access: 'text-blue-600',
            error: 'text-red-600',
            warning: 'text-yellow-600'
        };

        return `
            <div class="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <i data-lucide="circle" class="w-2 h-2 ${typeColors[entry.type] || 'text-slate-600'}"></i>
                        <div>
                            <div class="text-sm font-medium text-slate-800 dark:text-white">${entry.action}</div>
                            <div class="text-xs text-slate-500 dark:text-slate-400">
                                ${entry.user || 'System'} • ${new Date(entry.timestamp).toLocaleString()}
                            </div>
                        </div>
                    </div>
                    <div class="text-xs text-slate-400">
                        ${entry.ip || 'N/A'}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Toggle security
     */
    async toggleSecurity(enabled) {
        try {
            await SecurityStore.updateSecuritySettings({ enabled });
            
            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: enabled ? 'Bezpieczeństwo włączone' : 'Bezpieczeństwo wyłączone'
            });
        } catch (error) {
            console.error('[SecurityView] Toggle security error:', error);
        }
    }

    /**
     * Toggle password protection
     */
    async togglePasswordProtection(enabled) {
        try {
            await SecurityStore.updateSecuritySettings({ passwordProtection: enabled });
            
            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: enabled ? 'Ochrona hasłem włączona' : 'Ochrona hasłem wyłączona'
            });
        } catch (error) {
            console.error('[SecurityView] Toggle password protection error:', error);
        }
    }

    /**
     * Update auto-lock timer
     */
    async updateAutoLockTimer(minutes) {
        try {
            await SecurityStore.updateSecuritySettings({ autoLockTimer: parseInt(minutes) });
            
            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: `Timer automatycznej blokady: ${minutes} min`
            });
        } catch (error) {
            console.error('[SecurityView] Update auto-lock timer error:', error);
        }
    }

    /**
     * Save security settings
     */
    async saveSecuritySettings() {
        try {
            const settings = {
                enabled: document.getElementById('enableSecurity')?.checked || false,
                passwordProtection: document.getElementById('passwordProtection')?.checked || false,
                autoLockTimer: parseInt(document.getElementById('autoLockTimer')?.value || 30),
                encryptionEnabled: document.getElementById('enableEncryption')?.checked || false
            };

            await SecurityStore.saveSecuritySettings(settings);

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Ustawienia bezpieczeństwa zapisane'
            });
        } catch (error) {
            console.error('[SecurityView] Save settings error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd zapisu ustawień'
            });
        }
    }

    /**
     * Show add user dialog
     */
    showAddUserDialog() {
        // This would open a modal/dialog for adding users
        store.commit('ADD_NOTIFICATION', {
            type: 'info',
            message: 'Dialog dodawania użytkownika - do zaimplementowania'
        });
    }

    /**
     * Edit user
     */
    editUser(userId) {
        // This would open a modal/dialog for editing users
        store.commit('ADD_NOTIFICATION', {
            type: 'info',
            message: 'Dialog edycji użytkownika - do zaimplementowania'
        });
    }

    /**
     * Delete user
     */
    async deleteUser(userId) {
        try {
            if (!confirm('Czy na pewno usunąć tego użytkownika?')) return;

            await SecurityStore.deleteUser(userId);

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Użytkownik usunięty'
            });
        } catch (error) {
            console.error('[SecurityView] Delete user error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd usuwania użytkownika'
            });
        }
    }

    /**
     * Toggle encryption
     */
    async toggleEncryption(enabled) {
        try {
            await SecurityStore.updateSecuritySettings({ encryptionEnabled: enabled });
            
            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: enabled ? 'Szyfrowanie włączone' : 'Szyfrowanie wyłączone'
            });
        } catch (error) {
            console.error('[SecurityView] Toggle encryption error:', error);
        }
    }

    /**
     * Generate encryption key
     */
    async generateEncryptionKey() {
        try {
            await SecurityStore.generateEncryptionKey();
            
            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Klucz szyfrowania wygenerowany'
            });
        } catch (error) {
            console.error('[SecurityView] Generate key error:', error);
        }
    }

    /**
     * Backup encryption key
     */
    async backupEncryptionKey() {
        try {
            await SecurityStore.backupEncryptionKey();
            
            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Klucz szyfrowania zapisany'
            });
        } catch (error) {
            console.error('[SecurityView] Backup key error:', error);
        }
    }

    /**
     * Encrypt sensitive data
     */
    async encryptSensitiveData() {
        try {
            await SecurityStore.encryptSensitiveData();
            
            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Dane zaszyfrowane'
            });
        } catch (error) {
            console.error('[SecurityView] Encrypt data error:', error);
        }
    }

    /**
     * Clear audit log
     */
    async clearAuditLog() {
        try {
            if (!confirm('Czy na pewno wyczyścić log audytu?')) return;

            await SecurityStore.clearAuditLog();

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Log audytu wyczyszczony'
            });
        } catch (error) {
            console.error('[SecurityView] Clear audit log error:', error);
        }
    }

    /**
     * Export audit log
     */
    async exportAuditLog() {
        try {
            await SecurityStore.exportAuditLog();
            
            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Log audytu wyeksportowany'
            });
        } catch (error) {
            console.error('[SecurityView] Export audit log error:', error);
        }
    }

    /**
     * Filter audit log
     */
    filterAuditLog(filter) {
        const log = store.get('auditLog') || [];
        
        if (!filter || filter === 'all') {
            this.renderAuditLog(log);
            return;
        }

        const filtered = log.filter(entry => entry.type === filter);
        this.renderAuditLog(filtered);
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        const saveBtn = document.getElementById('saveSecuritySettingsBtn');
        if (saveBtn) {
            saveBtn.disabled = loading;
            saveBtn.innerHTML = loading 
                ? '<i data-lucide="loader-2" class="w-4 h-4 animate-spin mr-2"></i>Zapisywanie...'
                : '<i data-lucide="save" class="w-4 h-4 mr-2"></i>Zapisz ustawienia';
        }

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Get security status
     */
    getSecurityStatus() {
        const settings = store.get('securitySettings') || {};
        const users = store.get('users') || [];
        
        return {
            enabled: settings.enabled || false,
            encrypted: settings.encryptionEnabled || false,
            userCount: users.length,
            lastAuditEntry: store.get('auditLog')?.[0]?.timestamp || null
        };
    }
}

// Create and export singleton instance
const securityView = new SecurityView();

export default securityView;
