function toggleDarkMode() {
    const isDarkMode = document.documentElement.classList.toggle('dark');
    localStorage.setItem(CONFIG.THEME.DARK_MODE_KEY, isDarkMode);
    const theme = isDarkMode ? 'dark' : 'default';
    setTheme(theme);
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
        const db = await idb.openDB(CONFIG.DB_NAME, CONFIG.DB_VERSION);
        const cases = await db.getAll('tracker');

        const urgentCases = cases.filter(c => {
            const aWeekFromNow = new Date();
            aWeekFromNow.setDate(aWeekFromNow.getDate() + 7);
            const caseDate = new Date(c.date);
            return !c.archived && c.urgent && caseDate <= aWeekFromNow && caseDate >= new Date();
        });

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
        // --- FAVORITES WIDGET ---
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

        container.innerHTML = urgentCasesWidget + favoritesWidget;
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
    
    // Handle any additional options (e.g., caseId for tracker)
    if (options.caseId && window.trackerModule && window.trackerModule.openCase) {
        setTimeout(() => window.trackerModule.openCase(options.caseId), 100);
    }
}

function goHome() {
    goToModule('dashboard');
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
