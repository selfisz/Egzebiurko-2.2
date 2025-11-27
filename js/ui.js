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

    const db = await idb.openDB('EgzeBiurkoDB', 1);
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
}

async function renderDashboardWidgets() {
    const container = document.getElementById('dashboard-widgets');
    if (!container) return;

    const db = await idb.openDB('EgzeBiurkoDB', 1);
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
}
