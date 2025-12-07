// --- MODULE: SECURITY ---
// Zabezpieczenie aplikacji PIN/hasłem

const SECURITY_CONFIG = {
    AUTO_LOCK_MINUTES: 15,
    MAX_ATTEMPTS: 3,
    LOCKOUT_MINUTES: 5
};

let lastActivityTime = Date.now();
let failedAttempts = 0;
let lockoutUntil = null;
let isLocked = false;
let autoLockTimer = null;

// Inicjalizacja modułu bezpieczeństwa
function initSecurity() {
    // Sprawdź czy użytkownik ma ustawiony PIN
    const hasPin = localStorage.getItem('app_pin_hash');
    
    if (!hasPin) {
        // Pierwsza konfiguracja - pokaż setup
        showPinSetup();
    } else {
        // Zablokuj aplikację przy starcie
        lockApp();
    }

    // Monitoruj aktywność użytkownika
    document.addEventListener('mousemove', resetActivityTimer);
    document.addEventListener('keypress', resetActivityTimer);
    document.addEventListener('click', resetActivityTimer);
    
    // Sprawdzaj auto-lock co minutę
    startAutoLockTimer();
}

function showPinSetup() {
    const modal = document.createElement('div');
    modal.id = 'pin-setup-modal';
    modal.className = 'fixed inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 z-[200] flex items-center justify-center';
    modal.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div class="text-center mb-8">
                <div class="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="lock" size="40" class="text-indigo-600 dark:text-indigo-400"></i>
                </div>
                <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-2">Zabezpiecz Aplikację</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400">Ustaw 4-cyfrowy PIN, aby chronić swoje dane</p>
            </div>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nowy PIN (4 cyfry)</label>
                    <input type="password" id="setup-pin" maxlength="4" pattern="[0-9]{4}" 
                        class="w-full px-4 py-3 text-center text-2xl tracking-widest border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:bg-slate-700 dark:text-white outline-none"
                        placeholder="••••">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Potwierdź PIN</label>
                    <input type="password" id="setup-pin-confirm" maxlength="4" pattern="[0-9]{4}"
                        class="w-full px-4 py-3 text-center text-2xl tracking-widest border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:bg-slate-700 dark:text-white outline-none"
                        placeholder="••••">
                </div>
                <div id="setup-error" class="text-sm text-red-600 text-center hidden"></div>
                <button onclick="savePin()" 
                    class="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="check" size="20"></i>
                    Ustaw PIN
                </button>
                <button onclick="skipPinSetup()" 
                    class="w-full text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-2">
                    Pomiń (niezalecane)
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) lucide.createIcons();
    
    // Auto-focus na pierwszy input
    setTimeout(() => document.getElementById('setup-pin')?.focus(), 100);
}

function savePin() {
    const pin = document.getElementById('setup-pin').value;
    const pinConfirm = document.getElementById('setup-pin-confirm').value;
    const errorDiv = document.getElementById('setup-error');
    
    // Walidacja
    if (!/^\d{4}$/.test(pin)) {
        errorDiv.textContent = 'PIN musi składać się z 4 cyfr';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    if (pin !== pinConfirm) {
        errorDiv.textContent = 'PINy nie są identyczne';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    // Zapisz hash PIN (prosty hash dla demo, w produkcji użyj bcrypt/scrypt)
    const pinHash = simpleHash(pin);
    localStorage.setItem('app_pin_hash', pinHash);
    localStorage.setItem('security_enabled', 'true');
    
    // Usuń modal
    document.getElementById('pin-setup-modal')?.remove();
    
    if (window.Toast) Toast.success('PIN został ustawiony!');
}

function skipPinSetup() {
    if (confirm('Czy na pewno chcesz pominąć zabezpieczenie? Twoje dane nie będą chronione.')) {
        localStorage.setItem('security_enabled', 'false');
        document.getElementById('pin-setup-modal')?.remove();
    }
}

function lockApp() {
    if (!localStorage.getItem('app_pin_hash')) return;
    
    isLocked = true;
    showLockScreen();
}

function showLockScreen() {
    // Ukryj całą aplikację
    const appContent = document.getElementById('app-content');
    if (appContent) appContent.style.display = 'none';
    
    let modal = document.getElementById('lock-screen');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'lock-screen';
        modal.className = 'fixed inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 z-[200] flex items-center justify-center';
        modal.innerHTML = `
            <div class="text-center">
                <div class="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                    <i data-lucide="lock" size="64" class="text-white"></i>
                </div>
                <h2 class="text-3xl font-bold text-white mb-2">Aplikacja Zablokowana</h2>
                <p class="text-white/60 mb-8">Wprowadź PIN, aby odblokować</p>
                
                <div class="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-sm mx-auto">
                    <div class="flex justify-center gap-3 mb-6">
                        <div class="pin-dot w-4 h-4 rounded-full bg-white/30"></div>
                        <div class="pin-dot w-4 h-4 rounded-full bg-white/30"></div>
                        <div class="pin-dot w-4 h-4 rounded-full bg-white/30"></div>
                        <div class="pin-dot w-4 h-4 rounded-full bg-white/30"></div>
                    </div>
                    
                    <input type="password" id="unlock-pin" maxlength="4" pattern="[0-9]{4}"
                        class="w-full px-4 py-3 text-center text-2xl tracking-widest bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white placeholder-white/50 focus:border-white focus:ring-2 focus:ring-white/50 outline-none mb-4"
                        placeholder="••••"
                        onkeyup="if(this.value.length === 4) unlockApp()">
                    
                    <div id="unlock-error" class="text-sm text-red-300 mb-4 hidden"></div>
                    
                    <button onclick="unlockApp()" 
                        class="w-full bg-white text-indigo-900 py-3 rounded-xl font-bold hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
                        <i data-lucide="unlock" size="20"></i>
                        Odblokuj
                    </button>
                    
                    <div class="mt-4 text-xs text-white/40" id="lockout-message"></div>
                </div>
                
                <div class="mt-8 text-sm text-white/40">
                    ${new Date().toLocaleString('pl-PL')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    if (window.lucide) lucide.createIcons();
    
    // Auto-focus
    setTimeout(() => {
        document.getElementById('unlock-pin')?.focus();
        updatePinDots();
    }, 100);
    
    // Sprawdź lockout
    checkLockout();
}

function unlockApp() {
    // Sprawdź lockout
    if (lockoutUntil && Date.now() < lockoutUntil) {
        const remainingMinutes = Math.ceil((lockoutUntil - Date.now()) / 60000);
        showUnlockError(`Zbyt wiele prób. Spróbuj za ${remainingMinutes} min`);
        return;
    }
    
    const pin = document.getElementById('unlock-pin').value;
    const pinHash = localStorage.getItem('app_pin_hash');
    
    if (!/^\d{4}$/.test(pin)) {
        showUnlockError('PIN musi składać się z 4 cyfr');
        return;
    }
    
    if (simpleHash(pin) === pinHash) {
        // Poprawny PIN
        isLocked = false;
        failedAttempts = 0;
        lockoutUntil = null;
        
        document.getElementById('lock-screen')?.remove();
        const appContent = document.getElementById('app-content');
        if (appContent) appContent.style.display = 'block';
        
        resetActivityTimer();
        
        if (window.Toast) Toast.success('Odblokowano!');
    } else {
        // Niepoprawny PIN
        failedAttempts++;
        
        if (failedAttempts >= SECURITY_CONFIG.MAX_ATTEMPTS) {
            lockoutUntil = Date.now() + (SECURITY_CONFIG.LOCKOUT_MINUTES * 60 * 1000);
            showUnlockError(`Zbyt wiele prób! Zablokowano na ${SECURITY_CONFIG.LOCKOUT_MINUTES} minut`);
            document.getElementById('unlock-pin').disabled = true;
        } else {
            const remaining = SECURITY_CONFIG.MAX_ATTEMPTS - failedAttempts;
            showUnlockError(`Niepoprawny PIN. Pozostało prób: ${remaining}`);
        }
        
        document.getElementById('unlock-pin').value = '';
        updatePinDots();
    }
}

function showUnlockError(message) {
    const errorDiv = document.getElementById('unlock-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        
        // Animacja shake
        const input = document.getElementById('unlock-pin');
        if (input) {
            input.classList.add('animate-shake');
            setTimeout(() => input.classList.remove('animate-shake'), 500);
        }
    }
}

function updatePinDots() {
    const input = document.getElementById('unlock-pin');
    const dots = document.querySelectorAll('.pin-dot');
    
    if (input && dots.length) {
        const length = input.value.length;
        dots.forEach((dot, idx) => {
            if (idx < length) {
                dot.classList.add('bg-white');
                dot.classList.remove('bg-white/30');
            } else {
                dot.classList.remove('bg-white');
                dot.classList.add('bg-white/30');
            }
        });
    }
}

function checkLockout() {
    if (lockoutUntil && Date.now() < lockoutUntil) {
        const input = document.getElementById('unlock-pin');
        const message = document.getElementById('lockout-message');
        
        if (input) input.disabled = true;
        
        const updateCountdown = () => {
            if (Date.now() >= lockoutUntil) {
                if (input) input.disabled = false;
                if (message) message.textContent = '';
                failedAttempts = 0;
                return;
            }
            
            const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
            if (message) message.textContent = `Odblokowanie za ${remaining}s`;
            setTimeout(updateCountdown, 1000);
        };
        
        updateCountdown();
    }
}

function resetActivityTimer() {
    lastActivityTime = Date.now();
}

function startAutoLockTimer() {
    if (autoLockTimer) clearInterval(autoLockTimer);
    
    autoLockTimer = setInterval(() => {
        const securityEnabled = localStorage.getItem('security_enabled') === 'true';
        if (!securityEnabled || isLocked) return;
        
        const inactiveMinutes = (Date.now() - lastActivityTime) / 60000;
        
        if (inactiveMinutes >= SECURITY_CONFIG.AUTO_LOCK_MINUTES) {
            lockApp();
        }
    }, 60000); // Sprawdzaj co minutę
}

function changePIN() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
                <i data-lucide="key"></i>
                Zmień PIN
            </h3>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Obecny PIN</label>
                    <input type="password" id="change-current-pin" maxlength="4" pattern="[0-9]{4}"
                        class="w-full px-4 py-3 text-center text-xl tracking-widest border-2 rounded-xl focus:border-indigo-500 dark:bg-slate-700 dark:text-white outline-none"
                        placeholder="••••">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nowy PIN</label>
                    <input type="password" id="change-new-pin" maxlength="4" pattern="[0-9]{4}"
                        class="w-full px-4 py-3 text-center text-xl tracking-widest border-2 rounded-xl focus:border-indigo-500 dark:bg-slate-700 dark:text-white outline-none"
                        placeholder="••••">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Potwierdź nowy PIN</label>
                    <input type="password" id="change-confirm-pin" maxlength="4" pattern="[0-9]{4}"
                        class="w-full px-4 py-3 text-center text-xl tracking-widest border-2 rounded-xl focus:border-indigo-500 dark:bg-slate-700 dark:text-white outline-none"
                        placeholder="••••">
                </div>
                <div id="change-error" class="text-sm text-red-600 hidden"></div>
                
                <div class="flex gap-3 pt-4">
                    <button onclick="confirmChangePIN()" 
                        class="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700">
                        Zmień
                    </button>
                    <button onclick="this.closest('.fixed').remove()" 
                        class="flex-1 bg-slate-200 dark:bg-slate-700 py-3 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600">
                        Anuluj
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) lucide.createIcons();
}

function confirmChangePIN() {
    const currentPin = document.getElementById('change-current-pin').value;
    const newPin = document.getElementById('change-new-pin').value;
    const confirmPin = document.getElementById('change-confirm-pin').value;
    const errorDiv = document.getElementById('change-error');
    const currentHash = localStorage.getItem('app_pin_hash');
    
    if (simpleHash(currentPin) !== currentHash) {
        errorDiv.textContent = 'Niepoprawny obecny PIN';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    if (!/^\d{4}$/.test(newPin)) {
        errorDiv.textContent = 'Nowy PIN musi składać się z 4 cyfr';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    if (newPin !== confirmPin) {
        errorDiv.textContent = 'Nowe PINy nie są identyczne';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    localStorage.setItem('app_pin_hash', simpleHash(newPin));
    document.querySelector('.fixed')?.remove();
    
    if (window.Toast) Toast.success('PIN został zmieniony!');
}

function disableSecurity() {
    if (confirm('Czy na pewno chcesz wyłączyć zabezpieczenie? Twoje dane nie będą chronione.')) {
        localStorage.removeItem('app_pin_hash');
        localStorage.setItem('security_enabled', 'false');
        
        if (window.Toast) Toast.info('Zabezpieczenie wyłączone');
    }
}

// Prosty hash (w produkcji użyj bcrypt/scrypt)
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

// Dodaj event listener dla input PIN
document.addEventListener('input', (e) => {
    if (e.target.id === 'unlock-pin') {
        updatePinDots();
    }
});

// Export funkcji
window.securityModule = {
    init: initSecurity,
    lock: lockApp,
    changePIN: changePIN,
    disable: disableSecurity
};
