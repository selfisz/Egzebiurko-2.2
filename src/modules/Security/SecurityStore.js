/**
 * Security Store - PIN Protection and App Locking
 */

import store from '../../store/index.js';

// Add security state
if (!store.state.securityEnabled) store.state.securityEnabled = false;
if (!store.state.securityPin) store.state.securityPin = null;
if (!store.state.securityLocked) store.state.securityLocked = false;
if (!store.state.securityAttempts) store.state.securityAttempts = 0;

// Constants
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

// Mutations
store.registerMutation('SET_SECURITY_ENABLED', (state, enabled) => {
    state.securityEnabled = enabled;
});

store.registerMutation('SET_SECURITY_PIN', (state, pin) => {
    state.securityPin = pin;
});

store.registerMutation('SET_SECURITY_LOCKED', (state, locked) => {
    state.securityLocked = locked;
});

store.registerMutation('SET_SECURITY_ATTEMPTS', (state, attempts) => {
    state.securityAttempts = attempts;
});

store.registerMutation('RESET_SECURITY_STATE', (state) => {
    state.securityLocked = false;
    state.securityAttempts = 0;
});

// Actions
store.registerAction('enableSecurity', async ({ commit }, pin) => {
    try {
        // Validate PIN});

        if (!pin || pin.length < 4) {
            throw new Error('PIN musi mieć co najmniej 4 cyfry');
        }

        // Hash and store PIN (in real app, use proper hashing)
        const hashedPin = btoa(pin); // Simple encoding for demo
        
        commit('SET_SECURITY_PIN', hashedPin);
        commit('SET_SECURITY_ENABLED', true);
        
        localStorage.setItem('security_enabled', 'true');
        localStorage.setItem('security_pin', hashedPin);
        
        commit('ADD_NOTIFICATION', {
            type: 'success',
            message: 'Ochrona PIN/hasłem została włączona'
        });
        
        return true;
    } catch (error) {
        console.error('[Security] Enable error:', error);
        throw error;
    }
});

store.registerAction('disableSecurity', async ({ commit }) => {
    try {
        commit('SET_SECURITY_ENABLED', false);
        commit('SET_SECURITY_PIN', null);
        commit('RESET_SECURITY_STATE');
        
        localStorage.removeItem('security_enabled');
        localStorage.removeItem('security_pin');
        
        commit('ADD_NOTIFICATION', {
            type: 'success',
            message: 'Ochrona została wyłączona'
        });
        
        return true;
    } catch (error) {
        console.error('[Security] Disable error:', error);
        throw error;
    }
});

store.registerAction('verifyPin', async ({ commit, state }, pin) => {
    try {
        if (!state.securityPin) {
            throw new Error('Ochrona nie jest włączona');
        }

        if (state.securityLocked) {
            const lockoutEnd = parseInt(localStorage.getItem('security_lockout_end') || '0');
            if (Date.now() < lockoutEnd) {
                const remaining = Math.ceil((lockoutEnd - Date.now()) / 60000);
                throw new Error(`Zablokowano. Spróbuj ponownie za ${remaining} minut`);
            } else {
                commit('RESET_SECURITY_STATE');
                localStorage.removeItem('security_lockout_end');
            }
        }

        const hashedInput = btoa(pin);
        const isValid = hashedInput === state.securityPin;

        if (isValid) {
            commit('RESET_SECURITY_STATE');
            commit('SET_SECURITY_LOCKED', false);
            localStorage.removeItem('security_attempts');
            localStorage.removeItem('security_lockout_end');
            
            return true;
        } else {
            const newAttempts = (state.securityAttempts || 0) + 1;
            commit('SET_SECURITY_ATTEMPTS', newAttempts);
            localStorage.setItem('security_attempts', newAttempts.toString());

            if (newAttempts >= MAX_ATTEMPTS) {
                const lockoutEnd = Date.now() + LOCKOUT_DURATION;
                commit('SET_SECURITY_LOCKED', true);
                localStorage.setItem('security_lockout_end', lockoutEnd.toString());
                
                throw new Error('Zbyt wiele nieprawidłowych prób. Aplikacja zablokowana na 5 minut.');
            }

            const remaining = MAX_ATTEMPTS - newAttempts;
            throw new Error(`Nieprawidłowy PIN. Pozostało prób: ${remaining}`);
        }
    } catch (error) {
        console.error('[Security] Verify PIN error:', error);
        throw error;
    }
});

store.registerAction('changePin', async ({ commit, state }, { oldPin, newPin }) => {
    try {
        if (!state.securityPin) {
            throw new Error('Ochrona nie jest włączona');
        }

        // Verify old PIN
        const hashedOld = btoa(oldPin);
        if (hashedOld !== state.securityPin) {
            throw new Error('Nieprawidłowe stare PIN/hasło');
        }

        // Validate new PIN
        if (!newPin || newPin.length < 4) {
            throw new Error('Nowe PIN musi mieć co najmniej 4 cyfry');
        }

        // Update PIN
        const hashedNew = btoa(newPin);
        commit('SET_SECURITY_PIN', hashedNew);
        localStorage.setItem('security_pin', hashedNew);
        
        commit('ADD_NOTIFICATION', {
            type: 'success',
            message: 'PIN został zmieniony'
        });
        
        return true;
    } catch (error) {
        console.error('[Security] Change PIN error:', error);
        throw error;
    }
});

store.registerAction('checkSecurityStatus', async ({ commit }) => {
    try {
        const enabled = localStorage.getItem('security_enabled') === 'true';
        const pin = localStorage.getItem('security_pin') || null;
        const attempts = parseInt(localStorage.getItem('security_attempts') || '0', 10);
        const lockoutEnd = parseInt(localStorage.getItem('security_lockout_end') || '0', 10);
        
        commit('SET_SECURITY_ENABLED', enabled);
        commit('SET_SECURITY_PIN', pin);
        commit('SET_SECURITY_ATTEMPTS', attempts);
        
        // Check if still locked
        if (enabled && attempts >= MAX_ATTEMPTS && Date.now() < lockoutEnd) {
            commit('SET_SECURITY_LOCKED', true);
        }
        
        return {
            enabled,
            locked: enabled && attempts >= MAX_ATTEMPTS && Date.now() < lockoutEnd,
            attempts,
            lockoutEnd
        };
    } catch (error) {
        console.error('[Security] Check status error:', error);
        throw error;
    }
});

store.registerAction('lockApp', async ({ commit }) => {
    try {
        commit('SET_SECURITY_LOCKED', true);
        
        // Show lock screen
        const lockScreen = document.getElementById('securityLockScreen');
        if (lockScreen) {
            lockScreen.classList.remove('hidden');
        }
        
        return true;
    } catch (error) {
        console.error('[Security] Lock error:', error);
        throw error;
    }
});

store.registerAction('unlockApp', async ({ commit, dispatch }, pin) => {
    try {
        await dispatch('verifyPin', pin);
        
        // Hide lock screen
        const lockScreen = document.getElementById('securityLockScreen');
        if (lockScreen) {
            lockScreen.classList.add('hidden');
        }
        
        commit('ADD_NOTIFICATION', {
            type: 'success',
            message: 'Aplikacja odblokowana'
        });
        
        return true;
    } catch (error) {
        throw error;
    }
});

// === Helper methods used by SecurityView ===

function getDefaultSecuritySettings() {
    return {
        enabled: false,
        passwordProtection: false,
        autoLockTimer: 30,
        encryptionEnabled: false,
        accessControl: {}
    };
}

// Load settings from localStorage into store
async function loadSecuritySettings() {
    try {
        const raw = localStorage.getItem('security_settings');
        const parsed = raw ? JSON.parse(raw) : null;
        const settings = parsed || store.get('securitySettings') || getDefaultSecuritySettings();

        store.commit('SET_SECURITY_SETTINGS', settings);
        store.commit('SET_SECURITY_ENABLED', !!settings.enabled);

        return settings;
    } catch (error) {
        console.error('[Security] loadSecuritySettings error:', error);
        throw error;
    }
}

// Save full settings object
async function saveSecuritySettings(settings) {
    const current = store.get('securitySettings') || getDefaultSecuritySettings();
    const merged = { ...current, ...settings };

    store.commit('SET_SECURITY_SETTINGS', merged);
    store.commit('SET_SECURITY_ENABLED', !!merged.enabled);

    localStorage.setItem('security_settings', JSON.stringify(merged));
    localStorage.setItem('security_enabled', merged.enabled ? 'true' : 'false');

    return merged;
}

// Update partial settings
async function updateSecuritySettings(partialSettings) {
    const current = store.get('securitySettings') || getDefaultSecuritySettings();
    const merged = { ...current, ...partialSettings };
    return saveSecuritySettings(merged);
}

// Users helpers
async function loadUsers() {
    try {
        const raw = localStorage.getItem('security_users');
        const users = raw ? JSON.parse(raw) : (store.get('users') || []);
        store.commit('SET_USERS', users);
        return users;
    } catch (error) {
        console.error('[Security] loadUsers error:', error);
        throw error;
    }
}

async function deleteUser(userId) {
    const users = (store.get('users') || []).filter(u => u.id !== userId);
    store.commit('SET_USERS', users);
    localStorage.setItem('security_users', JSON.stringify(users));
}

// Audit log helpers
async function loadAuditLog() {
    try {
        const raw = localStorage.getItem('security_audit_log');
        const log = raw ? JSON.parse(raw) : (store.get('auditLog') || []);
        store.commit('SET_AUDIT_LOG', log);
        return log;
    } catch (error) {
        console.error('[Security] loadAuditLog error:', error);
        throw error;
    }
}

async function clearAuditLog() {
    store.commit('SET_AUDIT_LOG', []);
    localStorage.removeItem('security_audit_log');
}

async function exportAuditLog() {
    const log = store.get('auditLog') || [];
    const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security_audit_log_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Encryption helpers (demo only, no real crypto)
async function generateEncryptionKey() {
    const key = (crypto && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    localStorage.setItem('security_encryption_key', key);
    store.commit('ADD_AUDIT_ENTRY', {
        type: 'security',
        action: 'Generated encryption key',
        user: 'System'
    });
}

async function backupEncryptionKey() {
    const key = localStorage.getItem('security_encryption_key') || '';
    const blob = new Blob([key], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'security_encryption_key.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function encryptSensitiveData() {
    // Demo: just log audit entry; real implementation would encrypt IndexedDB
    store.commit('ADD_AUDIT_ENTRY', {
        type: 'security',
        action: 'Encrypt sensitive data (demo)',
        user: 'System'
    });
}

// Initialize security status on app start
store.dispatch('checkSecurityStatus');

export default {
    enable: (pin) => store.dispatch('enableSecurity', pin),
    disable: () => store.dispatch('disableSecurity'),
    verify: (pin) => store.dispatch('verifyPin', pin),
    changePin: (oldPin, newPin) => store.dispatch('changePin', { oldPin, newPin }),
    checkStatus: () => store.dispatch('checkSecurityStatus'),
    lock: () => store.dispatch('lockApp'),
    unlock: (pin) => store.dispatch('unlockApp', pin),
    isEnabled: () => store.get('securityEnabled'),
    isLocked: () => store.get('securityLocked'),
    getAttempts: () => store.get('securityAttempts'),
    // New helpers used by SecurityView
    loadSecuritySettings,
    saveSecuritySettings,
    updateSecuritySettings,
    loadUsers,
    deleteUser,
    loadAuditLog,
    clearAuditLog,
    exportAuditLog,
    generateEncryptionKey,
    backupEncryptionKey,
    encryptSensitiveData
};
