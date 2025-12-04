// BACKUP & ENCRYPTION MODULE

// Check if daily backup reminder should be shown (at 17:00)
function checkBackupReminder() {
    const now = new Date();
    const lastBackup = localStorage.getItem('lex_last_backup_date');
    const today = now.toISOString().slice(0, 10);
    const currentHour = now.getHours();
    
    // Show reminder at 17:00 or later, if no backup was made today
    if (currentHour >= 17 && lastBackup !== today) {
        const reminderShown = sessionStorage.getItem('backup_reminder_shown_today');
        if (!reminderShown) {
            showBackupReminderNotification();
            sessionStorage.setItem('backup_reminder_shown_today', 'true');
        }
    }
}

// Show backup reminder notification
function showBackupReminderNotification() {
    const container = document.createElement('div');
    container.className = 'fixed top-20 right-4 z-[100] glass-panel p-4 rounded-xl shadow-2xl max-w-sm animate-slide-in-right';
    container.innerHTML = `
        <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <i data-lucide="hard-drive-download" class="text-amber-500" size="20"></i>
            </div>
            <div class="flex-1">
                <div class="font-bold text-sm text-slate-800 dark:text-white mb-1">Przypomnienie o kopii zapasowej</div>
                <div class="text-xs text-slate-600 dark:text-slate-400 mb-3">Nie wykonałeś dzisiaj backupu. Zabezpiecz swoje dane!</div>
                <div class="flex gap-2">
                    <button onclick="goToModule('settings'); this.closest('.fixed').remove();" class="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg font-bold transition-colors">
                        Przejdź do backupu
                    </button>
                    <button onclick="this.closest('.fixed').remove();" class="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs rounded-lg font-bold transition-colors">
                        Później
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(container);
    if (window.lucide) lucide.createIcons();
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
        if (container.parentNode) container.remove();
    }, 30000);
}

// Simple AES-256 encryption using Web Crypto API
async function encryptData(data, password) {
    const encoder = new TextEncoder();
    const dataString = JSON.stringify(data);
    const dataBuffer = encoder.encode(dataString);
    
    // Derive key from password
    const passwordBuffer = encoder.encode(password);
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );
    
    // Generate salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Derive encryption key
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        passwordKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
    );
    
    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        dataBuffer
    );
    
    // Combine salt + iv + encrypted data
    const resultBuffer = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
    resultBuffer.set(salt, 0);
    resultBuffer.set(iv, salt.length);
    resultBuffer.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);
    
    // Convert to base64
    return btoa(String.fromCharCode(...resultBuffer));
}

// Decrypt data
async function decryptData(encryptedBase64, password) {
    try {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        
        // Decode base64
        const encryptedBuffer = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
        
        // Extract salt, iv, and encrypted data
        const salt = encryptedBuffer.slice(0, 16);
        const iv = encryptedBuffer.slice(16, 28);
        const data = encryptedBuffer.slice(28);
        
        // Derive key from password
        const passwordBuffer = encoder.encode(password);
        const passwordKey = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );
        
        // Derive decryption key
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            passwordKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );
        
        // Decrypt
        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            data
        );
        
        // Convert to string and parse JSON
        const decryptedString = decoder.decode(decryptedBuffer);
        return JSON.parse(decryptedString);
    } catch (error) {
        throw new Error('Nieprawidłowe hasło lub uszkodzony plik');
    }
}

// Export with optional encryption
async function exportDataSecure() {
    const encryptCheckbox = document.getElementById('encryptBackup');
    const passwordInput = document.getElementById('backupPassword');
    
    const data = {
        tracker: await state.db.getAll('tracker'),
        garage: await state.db.getAll('garage'),
        notes: await state.db.getAll('notes'),
        links: JSON.parse(localStorage.getItem('lex_links') || '[]'),
        dicts: {
            addresses: JSON.parse(localStorage.getItem('lex_addresses') || '[]'),
            signatures: JSON.parse(localStorage.getItem('lex_signatures') || '[]')
        }
    };
    
    let fileContent;
    let fileName = `egzebiurko_backup_${new Date().toISOString().slice(0,10)}`;
    
    if (encryptCheckbox && encryptCheckbox.checked) {
        const password = passwordInput ? passwordInput.value : '';
        if (!password || password.length < 4) {
            alert('Proszę podać hasło (min. 4 znaki) do zaszyfrowania backupu.');
            return;
        }
        
        try {
            const encrypted = await encryptData(data, password);
            fileContent = JSON.stringify({ encrypted: true, data: encrypted }, null, 2);
            fileName += '_encrypted.json';
        } catch (error) {
            alert('Błąd szyfrowania: ' + error.message);
            return;
        }
    } else {
        fileContent = JSON.stringify(data, null, 2);
        fileName += '.json';
    }
    
    const blob = new Blob([fileContent], {type : 'application/json'});
    saveAs(blob, fileName);
    
    // Update last backup date
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('lex_last_backup_date', today);
    
    // Show success message
    showBackupSuccessMessage();
}

// Import with decryption support
async function importDataSecure(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const fileData = JSON.parse(e.target.result);
            let data;
            
            // Check if encrypted
            if (fileData.encrypted) {
                const password = prompt('Podaj hasło do odszyfrowania backupu:');
                if (!password) return;
                
                try {
                    data = await decryptData(fileData.data, password);
                } catch (error) {
                    alert(error.message);
                    return;
                }
            } else {
                data = fileData;
            }
            
            if (confirm("To nadpisze obecne dane. Kontynuować?")) {
                const tx = state.db.transaction(['tracker', 'garage', 'notes'], 'readwrite');

                // Support both old 'cases' and new 'tracker' format
                const trackerData = data.tracker || data.cases || [];
                if (trackerData.length > 0) {
                    await tx.objectStore('tracker').clear();
                    for (const i of trackerData) await tx.objectStore('tracker').put(i);
                }
                if (data.garage) {
                    await tx.objectStore('garage').clear();
                    for (const i of data.garage) await tx.objectStore('garage').put(i);
                }
                if (data.notes) {
                    await tx.objectStore('notes').clear();
                    for (const i of data.notes) await tx.objectStore('notes').put(i);
                }

                if (data.links) localStorage.setItem('lex_links', JSON.stringify(data.links));
                if (data.dicts) {
                    localStorage.setItem('lex_addresses', JSON.stringify(data.dicts.addresses || []));
                    localStorage.setItem('lex_signatures', JSON.stringify(data.dicts.signatures || []));
                }

                alert("Przywrócono dane!");
                location.reload();
            }
        } catch (err) {
            alert("Błąd pliku: " + err.message);
        }
    };
    reader.readAsText(file);
}

// Show success message after backup
function showBackupSuccessMessage() {
    const container = document.createElement('div');
    container.className = 'fixed top-20 right-4 z-[100] glass-panel p-4 rounded-xl shadow-2xl max-w-sm animate-slide-in-right';
    container.innerHTML = `
        <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <i data-lucide="check-circle" class="text-green-500" size="20"></i>
            </div>
            <div class="flex-1">
                <div class="font-bold text-sm text-slate-800 dark:text-white mb-1">Kopia zapasowa utworzona</div>
                <div class="text-xs text-slate-600 dark:text-slate-400">Twoje dane zostały bezpiecznie zapisane.</div>
            </div>
            <button onclick="this.closest('.fixed').remove();" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i data-lucide="x" size="16"></i>
            </button>
        </div>
    `;
    document.body.appendChild(container);
    if (window.lucide) lucide.createIcons();
    
    setTimeout(() => {
        if (container.parentNode) container.remove();
    }, 5000);
}

// Initialize backup reminder check (run every hour)
function initBackupReminder() {
    checkBackupReminder();
    setInterval(checkBackupReminder, 60 * 60 * 1000); // Check every hour
}
