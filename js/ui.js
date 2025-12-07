function toggleDarkMode() {
    const isDarkMode = document.documentElement.classList.toggle('dark');
    localStorage.setItem(CONFIG.THEME.DARK_MODE_KEY, isDarkMode);
    const theme = isDarkMode ? 'dark' : 'default';
    setTheme(theme);
}

// --- DASHBOARD STATS ---
async function renderDashboardStats() {
    const container = document.getElementById('dashboard-stats');
    if (!container) return;
    
    try {
        // Use existing database from state instead of reopening
        if (!state.db) {
            console.warn('Database not ready yet for dashboard stats');
            return;
        }
        
        const db = state.db;
        const cases = await db.getAll('tracker');
        const cars = db.objectStoreNames.contains('garage') ? await db.getAll('garage') : [];
        const notes = db.objectStoreNames.contains('notes') ? await db.getAll('notes') : [];
        
        // Calculate stats
        const activeCases = cases.filter(c => !c.archived);
        const urgentCases = activeCases.filter(c => c.urgent);
        const favoriteCases = activeCases.filter(c => c.isFavorite);
        
        // Get upcoming deadlines (next 7 days)
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const upcomingDeadlines = activeCases.filter(c => {
            if (!c.date) return false;
            const caseDate = new Date(c.date);
            return caseDate >= now && caseDate <= weekFromNow;
        });
        
        const stats = [
            {
                label: 'Aktywne sprawy',
                value: activeCases.length,
                icon: 'briefcase',
                color: 'indigo',
                onClick: "goToModule('tracker')"
            },
            {
                label: 'Pilne',
                value: urgentCases.length,
                icon: 'alert-triangle',
                color: 'red',
                onClick: "goToModule('tracker')"
            },
            {
                label: 'Terminy (7 dni)',
                value: upcomingDeadlines.length,
                icon: 'calendar',
                color: 'amber',
                onClick: "goToModule('tracker')"
            },
            {
                label: 'Pojazdy',
                value: cars.length,
                icon: 'car',
                color: 'blue',
                onClick: "goToModule('cars')"
            }
        ];
        
        container.innerHTML = stats.map(stat => `
            <div onclick="${stat.onClick}" class="stat-card glass-panel p-4 rounded-2xl cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 text-${stat.color}-600 dark:text-${stat.color}-400">
                <div class="flex items-center justify-between mb-2">
                    <div class="w-10 h-10 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-500/20 flex items-center justify-center">
                        <i data-lucide="${stat.icon}" size="20"></i>
                    </div>
                    <span class="text-2xl font-bold">${stat.value}</span>
                </div>
                <div class="text-xs font-medium text-slate-600 dark:text-slate-400">${stat.label}</div>
            </div>
        `).join('');
        
        if (window.lucide) lucide.createIcons();
    } catch (error) {
        console.error('Dashboard stats error:', error);
        container.innerHTML = '<div class="col-span-4 text-center text-slate-400 text-sm py-4">Błąd ładowania statystyk</div>';
    }
}

function setTheme(theme) {
    // This function can be expanded to handle multiple themes
    // For now, it's just a placeholder.
    console.log(`Theme set to ${theme}`);
}

function toggleSidebarMode() {
    const sidebar = document.getElementById('sidebar');
    const btn = document.getElementById('sidebarPinBtn');
    if (sidebar.classList.contains('sidebar-collapsed')) {
        sidebar.classList.remove('sidebar-collapsed');
        localStorage.setItem('lex_sidebar_collapsed', 'false');
        btn.innerHTML = '<i data-lucide="pin" size="16"></i>';
        btn.classList.add('text-indigo-400');
    } else {
        sidebar.classList.add('sidebar-collapsed');
        localStorage.setItem('lex_sidebar_collapsed', 'true');
        btn.innerHTML = '<i data-lucide="pin-off" size="16"></i>';
        btn.classList.remove('text-indigo-400');
    }
    lucide.createIcons();
}

function toggleSearch() {
    const modal = document.getElementById('searchModal');
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) {
        document.getElementById('globalSearchInput').focus();
    }
}

function toggleNotifications() {
    document.getElementById('notifPopover').classList.toggle('hidden');
}

function toggleFavorites() {
    document.getElementById('favPopover').classList.toggle('hidden');
    renderFavorites(); // Re-render on open
}

async function renderFavorites() {
    const favList = document.getElementById('favList');
    if (!favList) return;

    try {
        const db = await idb.openDB(CONFIG.DB_NAME, CONFIG.DB_VERSION);
        const cases = await db.getAll('tracker');
        const favoriteCases = cases.filter(c => c.isFavorite && !c.archived);

        if (favoriteCases.length > 0) {
            favList.innerHTML = favoriteCases.map(c => `
                <div class="p-2 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs cursor-pointer" onclick="goToModule('tracker', { caseId: ${c.id} })">
                    <span class="font-bold">${c.no}</span>
                    <p class="text-slate-500 text-[10px]">${c.debtor}</p>
                </div>
            `).join('');
        } else {
            favList.innerHTML = '<div class="p-4 text-center text-xs text-slate-400">Brak ulubionych spraw.</div>';
        }
    } catch (error) {
        console.error('Favorites error:', error);
        favList.innerHTML = '<div class="p-4 text-center text-xs text-red-400">Błąd ładowania.</div>';
    }
}



// --- DASHBOARD WIDGETS ---
async function renderDashboardWidgets() {
    const container = document.getElementById('dashboard-widgets');
    if (!container) return;

    try {
        // Use existing database from state instead of reopening
        if (!state.db) {
            console.warn('Database not ready yet');
            return;
        }
        
        const db = state.db;
        const cases = await db.getAll('tracker');
        
        // === WIDGET STATYSTYK ===
        let statisticsWidget = '';
        if (typeof statisticsModule !== 'undefined') {
            const stats = await statisticsModule.generate();
            statisticsWidget = `
                <div class="glass-panel p-6 rounded-2xl shadow-sm lg:col-span-2">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                            <i data-lucide="bar-chart-3"></i> Statystyki
                        </h3>
                        <button onclick="goToModule('statistics')" class="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1">
                            Zobacz więcej <i data-lucide="arrow-right" size="14"></i>
                        </button>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div class="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <div class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${stats.cases.total}</div>
                            <div class="text-xs text-slate-600 dark:text-slate-400">Spraw</div>
                        </div>
                        <div class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <div class="text-2xl font-bold text-red-600 dark:text-red-400">${stats.cases.overdue}</div>
                            <div class="text-xs text-slate-600 dark:text-slate-400">Przeterminowane</div>
                        </div>
                        <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div class="text-2xl font-bold text-green-600 dark:text-green-400">${stats.cars.total}</div>
                            <div class="text-xs text-slate-600 dark:text-slate-400">Pojazdów</div>
                        </div>
                        <div class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">${stats.terrain.total}</div>
                            <div class="text-xs text-slate-600 dark:text-slate-400">Teczek</div>
                        </div>
                    </div>
                </div>
            `;
        }

        // --- PILNE SPRAWY --- (wszystkie sprawy oznaczone jako pilne, bez ograniczenia 7 dni)
        const urgentCases = cases.filter(c => !c.archived && c.urgent);

        let urgentCasesWidget = '';
        if (urgentCases.length > 0) {
            urgentCasesWidget = `
                <div class="glass-panel p-6 rounded-2xl shadow-sm">
                    <h3 class="font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2"><i data-lucide="alert-triangle"></i> Pilne Sprawy</h3>
                    <div class="space-y-3">
                        ${urgentCases.map(c => `
                            <div class="text-xs p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900">
                                <div class="flex justify-between items-center">
                                    <span class="font-bold text-red-800 dark:text-red-300">${c.no}</span>
                                    <span class="text-red-500 font-mono">${new Date(c.date).toLocaleDateString()}</span>
                                </div>
                                <p class="text-slate-600 dark:text-slate-400 mt-1">${c.debtor}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // --- ULUBIONE SPRAWY ---
        const favoriteCases = cases.filter(c => c.isFavorite && !c.archived);
        let favoritesWidget = '';
        if (favoriteCases.length > 0) {
            favoritesWidget = `
                <div class="glass-panel p-6 rounded-2xl shadow-sm">
                    <h3 class="font-bold text-yellow-600 dark:text-yellow-400 mb-4 flex items-center gap-2"><i data-lucide="star"></i> Teczka (Ulubione)</h3>
                    <div class="space-y-3">
                        ${favoriteCases.slice(0, 5).map(c => `
                            <div class="text-xs p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900 cursor-pointer hover:bg-yellow-100" onclick="goToModule('tracker', { caseId: ${c.id} })">
                                <div class="flex justify-between items-center">
                                    <span class="font-bold text-yellow-800 dark:text-yellow-300">${c.no}</span>
                                </div>
                                <p class="text-slate-600 dark:text-slate-400 mt-1">${c.debtor}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // --- POWIADOMIENIA (PANEL NA PULPICIE) ---
        let notificationsWidget = '';
        try {
            const now = new Date();
            let notifs = [];

            // Terminy spraw (jak w notifications.js)
            cases.filter(c => !c.archived).forEach(c => {
                const caseDate = new Date(c.date);
                const daysLeft = Math.ceil((caseDate - now) / (1000 * 60 * 60 * 24));
                if (daysLeft >= 0 && daysLeft <= 7) {
                    const urgent = daysLeft <= 3 || c.urgent;
                    notifs.push({
                        id: `case-${c.id}`,
                        kind: 'Sprawa',
                        icon: 'alert-triangle',
                        color: urgent ? 'red' : 'orange',
                        text: `Sprawa ${c.no} za ${daysLeft} dni`,
                    });
                }
            });

            // Przypomnienia kalendarza
            try {
                const rawReminders = localStorage.getItem('tracker_reminders');
                if (rawReminders) {
                    const reminders = JSON.parse(rawReminders);
                    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const sevenDaysAhead = new Date(startOfToday);
                    sevenDaysAhead.setDate(sevenDaysAhead.getDate() + 7);

                    Object.entries(reminders).forEach(([dateStr, items]) => {
                        const dateObj = new Date(dateStr + 'T00:00:00');
                        if (isNaN(dateObj)) return;
                        if (dateObj >= startOfToday && dateObj <= sevenDaysAhead) {
                            const daysDiff = Math.round((dateObj - startOfToday) / (1000 * 60 * 60 * 24));
                            const prettyDate = dateObj.toLocaleDateString('pl-PL');
                            const arr = Array.isArray(items)
                                ? items
                                : (typeof items === 'string' && items.trim() ? [items] : []);
                            arr.forEach((text, idx) => {
                                const whenText = daysDiff === 0
                                    ? 'DZIŚ'
                                    : daysDiff === 1
                                        ? 'jutro'
                                        : `za ${daysDiff} dni`;
                                notifs.push({
                                    id: `rem-${dateStr}-${idx}`,
                                    kind: 'Przyp.',
                                    icon: 'bell',
                                    color: 'green',
                                    text: `${prettyDate} (${whenText}): ${text}`,
                                });
                            });
                        }
                    });
                }
            } catch (e) {
                console.error('Dashboard reminders parse error:', e);
            }

            // Respect dismissed IDs
            let dismissedCount = 0;
            if (typeof getDismissedNotificationIds === 'function') {
                const dismissed = getDismissedNotificationIds();
                dismissedCount = dismissed.size;
                if (dismissedCount > 0) {
                    notifs = notifs.filter(n => !dismissed.has(n.id));
                }
            }

            // Unique & top 6
            const unique = Array.from(new Map(notifs.map(n => [n.id, n])).values()).slice(0, 6);
            if (unique.length > 0) {
                notificationsWidget = `
                    <div class="glass-panel p-6 rounded-2xl shadow-sm">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="font-bold text-sky-600 dark:text-sky-400 flex items-center gap-2"><i data-lucide="bell"></i> Powiadomienia</h3>
                            ${dismissedCount > 0 ? `<span class=\"text-[10px] text-slate-400\">Ukryte: ${dismissedCount}</span>` : ''}
                        </div>
                        <div class="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden text-[11px]">
                            <div class="grid grid-cols-12 bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold px-3 py-1.5">
                                <div class="col-span-2">Typ</div>
                                <div class="col-span-10">Treść</div>
                            </div>
                            <div class="max-h-40 overflow-y-auto custom-scroll bg-white dark:bg-slate-900/40">
                                ${unique.map(n => `
                                    <div class="grid grid-cols-12 items-start px-3 py-1.5 border-t border-slate-100 dark:border-slate-800 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800" onclick=\"goToModule('tracker')\">
                                        <div class="col-span-2 flex items-center gap-1 text-${n.color}-500">
                                            <i data-lucide="${n.icon}" size="14"></i>
                                            <span>${n.kind}</span>
                                        </div>
                                        <div class="col-span-10 text-slate-700 dark:text-slate-200 truncate">
                                            ${n.text}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (e) {
            console.error('Dashboard notifications error:', e);
        }

        container.innerHTML = statisticsWidget + urgentCasesWidget + favoritesWidget + notificationsWidget;
        lucide.createIcons();
    } catch (error) {
        console.error('Dashboard widgets error:', error);
        container.innerHTML = '<div class="glass-panel p-6 rounded-2xl shadow-sm text-center text-red-400">Błąd ładowania widgetów.</div>';
    }
}

// --- NAVIGATION FUNCTIONS ---
function goToModule(moduleName, options = {}) {
    // Update URL hash
    window.location.hash = `#${moduleName}`;
    
    // Update active nav state
    document.querySelectorAll('[id^="nav-"]').forEach(btn => {
        btn.classList.remove('bg-white/10', 'text-white');
    });
    
    const activeBtn = document.getElementById(`nav-${moduleName}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-white/10', 'text-white');
    }
    
    // Load the view
    if (typeof loadView === 'function') {
        loadView(moduleName);
    }
    
    // Load note templates and storage usage when opening settings
    if (moduleName === 'settings') {
        setTimeout(() => {
            if (typeof loadNoteTemplates === 'function') loadNoteTemplates();
            if (typeof renderStorageUsage === 'function') renderStorageUsage();
        }, 100);
    }
    
    // Load dashboard stats when opening dashboard
    if (moduleName === 'dashboard') {
        setTimeout(() => {
            if (typeof renderDashboardStats === 'function') renderDashboardStats();
        }, 100);
    }
    
    // Handle any additional options (e.g., caseId for tracker)
    if (options.caseId && window.trackerModule && window.trackerModule.openCase) {
        setTimeout(() => window.trackerModule.openCase(options.caseId), 100);
    }
}

function goHome() {
    goToModule('dashboard');
}

// --- PIN LOCK / SETTINGS ---
function getStoredPin() {
    try {
        return localStorage.getItem('lex_pin') || '';
    } catch (e) {
        console.error('PIN read error:', e);
        return '';
    }
}

function setStoredPin(pin) {
    try {
        if (pin) {
            localStorage.setItem('lex_pin', pin);
        } else {
            localStorage.removeItem('lex_pin');
        }
    } catch (e) {
        console.error('PIN save error:', e);
    }
}

function updatePinStatus() {
    const statusEl = document.getElementById('pinStatus');
    if (!statusEl) return;
    const pin = getStoredPin();
    if (pin) {
        statusEl.textContent = 'PIN jest ustawiony.';
    } else {
        statusEl.textContent = 'PIN nie jest ustawiony.';
    }
}

function savePinSettings() {
    const pinNewEl = document.getElementById('pinNew');
    const pinConfirmEl = document.getElementById('pinConfirm');
    if (!pinNewEl || !pinConfirmEl) return;

    const p1 = (pinNewEl.value || '').trim();
    const p2 = (pinConfirmEl.value || '').trim();

    if (!/^\d{4}$/.test(p1) || !/^\d{4}$/.test(p2)) {
        alert('PIN musi składać się z dokładnie 4 cyfr.');
        return;
    }
    if (p1 !== p2) {
        alert('PIN i powtórzenie PIN muszą być takie same.');
        return;
    }

    setStoredPin(p1);
    pinNewEl.value = '';
    pinConfirmEl.value = '';
    updatePinStatus();
    alert('PIN został zapisany.');
}

function clearPinSettings() {
    setStoredPin('');
    const pinNewEl = document.getElementById('pinNew');
    const pinConfirmEl = document.getElementById('pinConfirm');
    if (pinNewEl) pinNewEl.value = '';
    if (pinConfirmEl) pinConfirmEl.value = '';
    updatePinStatus();
    alert('PIN został usunięty.');
}

function lockScreen() {
    const pin = getStoredPin();
    if (!pin) {
        alert('PIN nie jest ustawiony. Ustaw go najpierw w Ustawieniach.');
        return;
    }
    const overlay = document.getElementById('pinLockOverlay');
    const input = document.getElementById('pinInput');
    const errorEl = document.getElementById('pinError');
    if (overlay) overlay.classList.remove('hidden');
    if (input) {
        input.value = '';
        input.focus();
    }
    if (errorEl) errorEl.textContent = '';
}

function submitPin() {
    const input = document.getElementById('pinInput');
    const errorEl = document.getElementById('pinError');
    const overlay = document.getElementById('pinLockOverlay');
    if (!input || !overlay) return;

    const entered = (input.value || '').trim();
    const stored = getStoredPin();

    if (!stored) {
        // Jeśli z jakiegoś powodu brak PIN-u, po prostu odblokuj
        overlay.classList.add('hidden');
        return;
    }

    if (entered === stored) {
        overlay.classList.add('hidden');
        input.value = '';
        if (errorEl) errorEl.textContent = '';
    } else {
        if (errorEl) errorEl.textContent = 'Nieprawidłowy PIN.';
        input.value = '';
        input.focus();
    }
}

// --- GLOBAL SEARCH ---
async function runGlobalSearch(query) {
    const resultsContainer = document.getElementById('searchResults');
    const footer = document.getElementById('searchFooter');
    
    if (!query || query.trim().length < 2) {
        resultsContainer.innerHTML = '';
        footer.classList.remove('hidden');
        return;
    }
    
    footer.classList.add('hidden');
    const q = query.toLowerCase();
    let results = [];
    
    try {
        const db = await idb.openDB(CONFIG.DB_NAME, CONFIG.DB_VERSION);
        
        // Search in tracker (cases)
        if (db.objectStoreNames.contains('tracker')) {
            const cases = await db.getAll('tracker');
            cases.forEach(c => {
                if ((c.no && c.no.toLowerCase().includes(q)) || 
                    (c.debtor && c.debtor.toLowerCase().includes(q)) || 
                    (c.creditor && c.creditor.toLowerCase().includes(q))) {
                    results.push({
                        type: 'Sprawa',
                        icon: 'calendar-clock',
                        title: c.no,
                        subtitle: c.debtor,
                        action: () => { toggleSearch(); goToModule('tracker'); }
                    });
                }
            });
        }
        
        // Search in templates
        if (db.objectStoreNames.contains('templates')) {
            const templates = await db.getAll('templates');
            templates.forEach(t => {
                if (t.name && t.name.toLowerCase().includes(q)) {
                    results.push({
                        type: 'Szablon',
                        icon: 'file-text',
                        title: t.name,
                        subtitle: 'Generator Pism',
                        action: () => { toggleSearch(); goToModule('generator'); }
                    });
                }
            });
        }
        
        // Search in garage (cars)
        if (db.objectStoreNames.contains('garage')) {
            const cars = await db.getAll('garage');
            cars.forEach(car => {
                if ((car.make && car.make.toLowerCase().includes(q)) || 
                    (car.model && car.model.toLowerCase().includes(q)) || 
                    (car.plate && car.plate.toLowerCase().includes(q)) || 
                    (car.vin && car.vin.toLowerCase().includes(q))) {
                    results.push({
                        type: 'Pojazd',
                        icon: 'car',
                        title: `${car.make} ${car.model}`,
                        subtitle: car.plate || car.vin,
                        action: () => { toggleSearch(); goToModule('cars'); }
                    });
                }
            });
        }
        
        // Search in bailiffs
        if (db.objectStoreNames.contains('bailiffs')) {
            const bailiffs = await db.getAll('bailiffs');
            bailiffs.forEach(b => {
                if ((b.name && b.name.toLowerCase().includes(q)) || 
                    (b.court && b.court.toLowerCase().includes(q))) {
                    results.push({
                        type: 'Komornik',
                        icon: 'gavel',
                        title: b.name,
                        subtitle: b.court,
                        action: () => { toggleSearch(); goToModule('registry'); }
                    });
                }
            });
        }
        
        // Search in notes
        if (db.objectStoreNames.contains('notes')) {
            const notes = await db.getAll('notes');
            notes.forEach(n => {
                if ((n.title && n.title.toLowerCase().includes(q)) || 
                    (n.content && n.content.toLowerCase().includes(q))) {
                    results.push({
                        type: 'Notatka',
                        icon: 'sticky-note',
                        title: n.title || 'Bez tytułu',
                        subtitle: (n.content || '').substring(0, 50) + '...',
                        action: () => { toggleSearch(); goToModule('notes'); }
                    });
                }
            });
        }
        
        // Search in links (localStorage)
        try {
            const links = JSON.parse(localStorage.getItem('lex_links') || '[]');
            links.forEach(link => {
                if ((link.name && link.name.toLowerCase().includes(q)) || 
                    (link.url && link.url.toLowerCase().includes(q))) {
                    results.push({
                        type: 'Link',
                        icon: 'link',
                        title: link.name,
                        subtitle: link.url,
                        action: () => { toggleSearch(); goToModule('links'); }
                    });
                }
            });
        } catch (e) {}
        
        // Search in terrain cases
        if (db.objectStoreNames.contains('terrain_cases')) {
            const terrainCases = await db.getAll('terrain_cases');
            terrainCases.forEach(tc => {
                if ((tc.address && tc.address.toLowerCase().includes(q)) || 
                    (tc.debtor && tc.debtor.toLowerCase().includes(q)) ||
                    (tc.notes && tc.notes.toLowerCase().includes(q))) {
                    results.push({
                        type: 'Teren',
                        icon: 'map-pin',
                        title: tc.debtor || tc.address || 'Sprawa terenowa',
                        subtitle: tc.address || '',
                        action: () => { toggleSearch(); goToModule('terrain'); }
                    });
                }
            });
        }
        
        // Search in reminders (localStorage)
        try {
            const reminders = JSON.parse(localStorage.getItem('tracker_reminders') || '{}');
            Object.entries(reminders).forEach(([date, texts]) => {
                texts.forEach(text => {
                    if (text.toLowerCase().includes(q)) {
                        results.push({
                            type: 'Przypomnienie',
                            icon: 'bell',
                            title: text.substring(0, 40) + (text.length > 40 ? '...' : ''),
                            subtitle: `Data: ${date}`,
                            action: () => { toggleSearch(); goToModule('tracker'); }
                        });
                    }
                });
            });
        } catch (e) {}
        
        // Render results
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="p-8 text-center text-slate-400 text-sm">Brak wyników dla "' + query + '"</div>';
        } else {
            resultsContainer.innerHTML = results.slice(0, 20).map(r => `
                <div class="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer flex items-center gap-3 transition-colors" onclick='(${r.action.toString()})()'>
                    <div class="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i data-lucide="${r.icon}" class="text-indigo-600 dark:text-indigo-400" size="18"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-bold text-sm text-slate-800 dark:text-white truncate">${r.title}</div>
                        <div class="text-xs text-slate-500 truncate">${r.subtitle}</div>
                    </div>
                    <div class="text-[10px] font-bold text-slate-400 uppercase px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">${r.type}</div>
                </div>
            `).join('');
            
            if (window.lucide) lucide.createIcons();
        }
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = '<div class="p-8 text-center text-red-400 text-sm">Błąd wyszukiwania</div>';
    }
}

// --- NOTE TEMPLATES MANAGEMENT ---
function loadNoteTemplates() {
    const templates = JSON.parse(localStorage.getItem('lex_note_templates') || '[]');
    const container = document.getElementById('noteTemplatesList');
    if (!container) return;
    
    if (templates.length === 0) {
        container.innerHTML = '<div class="text-xs text-slate-400 text-center py-4">Brak szablonów. Dodaj pierwszy!</div>';
        return;
    }
    
    container.innerHTML = templates.map((template, index) => `
        <div class="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <div class="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">${template}</div>
            <button onclick="deleteNoteTemplate(${index})" class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Usuń">
                <i data-lucide="trash-2" size="14"></i>
            </button>
        </div>
    `).join('');
    
    if (window.lucide) lucide.createIcons();
}

function addNoteTemplate() {
    const input = document.getElementById('newNoteTemplate');
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) {
        alert('Proszę wpisać treść szablonu.');
        return;
    }
    
    const templates = JSON.parse(localStorage.getItem('lex_note_templates') || '[]');
    templates.push(text);
    localStorage.setItem('lex_note_templates', JSON.stringify(templates));
    
    input.value = '';
    loadNoteTemplates();
}

function deleteNoteTemplate(index) {
    if (!confirm('Usunąć ten szablon?')) return;
    
    const templates = JSON.parse(localStorage.getItem('lex_note_templates') || '[]');
    templates.splice(index, 1);
    localStorage.setItem('lex_note_templates', JSON.stringify(templates));
    
    loadNoteTemplates();
}

function showNoteTemplateMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const templates = JSON.parse(localStorage.getItem('lex_note_templates') || '[]');
    
    if (templates.length === 0) {
        alert('Brak szablonów. Dodaj je w Ustawieniach.');
        return;
    }
    
    // Remove existing menu if any
    const existingMenu = document.getElementById('noteTemplateMenu');
    if (existingMenu) existingMenu.remove();
    
    // Create dropdown menu
    const menu = document.createElement('div');
    menu.id = 'noteTemplateMenu';
    menu.className = 'fixed z-[100] glass-panel rounded-xl shadow-2xl p-2 max-h-60 overflow-y-auto custom-scroll';
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    
    menu.innerHTML = templates.map((template, index) => `
        <button onclick="insertNoteTemplate(${index})" class="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors whitespace-nowrap">
            ${template}
        </button>
    `).join('');
    
    document.body.appendChild(menu);
    
    // Close menu on outside click
    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        });
    }, 100);
}

function insertNoteTemplate(index) {
    const templates = JSON.parse(localStorage.getItem('lex_note_templates') || '[]');
    const template = templates[index];
    if (!template) return;
    
    const noteField = document.getElementById('trNote');
    if (!noteField) return;
    
    const currentValue = noteField.value;
    const newValue = currentValue ? currentValue + '\n\n' + template : template;
    noteField.value = newValue;
    noteField.focus();
    
    // Remove menu
    const menu = document.getElementById('noteTemplateMenu');
    if (menu) menu.remove();
}
