// --- MODULE: GLOBAL SEARCH ---
// Wyszukiwanie we wszystkich modułach aplikacji

let searchResults = [];
let searchModalVisible = false;

async function openGlobalSearch() {
    searchModalVisible = true;
    showSearchModal();
}

function showSearchModal() {
    // Sprawdź czy modal już istnieje
    let modal = document.getElementById('global-search-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'global-search-modal';
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-start justify-center pt-20 hidden';
        modal.innerHTML = `
            <div class="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-slide-down">
                <div class="p-4 border-b dark:border-slate-700">
                    <div class="relative">
                        <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size="20"></i>
                        <input 
                            type="text" 
                            id="global-search-input" 
                            placeholder="Szukaj w sprawach, pojazdach, notatkach, linkach..." 
                            class="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border-0 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                            oninput="performGlobalSearch(this.value)"
                        >
                        <button onclick="closeGlobalSearch()" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <i data-lucide="x" size="20"></i>
                        </button>
                    </div>
                </div>
                <div id="global-search-results" class="max-h-96 overflow-y-auto custom-scroll p-4">
                    <div class="text-center text-slate-400 py-8">
                        <i data-lucide="search" size="48" class="mx-auto mb-3 opacity-30"></i>
                        <p class="text-sm">Zacznij pisać, aby wyszukać...</p>
                    </div>
                </div>
                <div class="p-3 bg-slate-50 dark:bg-slate-900/50 border-t dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
                    <div class="flex gap-3">
                        <span><kbd class="kbd">↑↓</kbd> Nawigacja</span>
                        <span><kbd class="kbd">Enter</kbd> Otwórz</span>
                        <span><kbd class="kbd">Esc</kbd> Zamknij</span>
                    </div>
                    <div id="search-stats"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Zamknij po kliknięciu w tło
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeGlobalSearch();
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', handleSearchKeyboard);
    }
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('global-search-input')?.focus();
        if (window.lucide) lucide.createIcons();
    }, 100);
}

function closeGlobalSearch() {
    const modal = document.getElementById('global-search-modal');
    if (modal) modal.classList.add('hidden');
    searchModalVisible = false;
}

async function performGlobalSearch(query) {
    if (!query || query.length < 2) {
        document.getElementById('global-search-results').innerHTML = `
            <div class="text-center text-slate-400 py-8">
                <i data-lucide="search" size="48" class="mx-auto mb-3 opacity-30"></i>
                <p class="text-sm">Wpisz minimum 2 znaki</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    const results = await searchAllModules(query.toLowerCase());
    searchResults = results;
    renderSearchResults(results);
}

async function searchAllModules(query) {
    const results = [];

    // 1. Szukaj w Tracker (sprawy)
    if (typeof trackerModule !== 'undefined') {
        const cases = await state.db.getAll('tracker');
        cases.forEach(c => {
            const searchText = `${c.no} ${c.debtor} ${c.unp} ${c.note}`.toLowerCase();
            if (searchText.includes(query)) {
                results.push({
                    module: 'tracker',
                    type: 'Sprawa',
                    icon: 'calendar-clock',
                    title: c.no,
                    subtitle: c.debtor || 'Brak danych zobowiązanego',
                    meta: `Status: ${c.status || 'nowa'} | ${new Date(c.date).toLocaleDateString()}`,
                    action: () => {
                        goToModule('tracker');
                        setTimeout(() => trackerModule.openCase(c.id), 100);
                    }
                });
            }
        });
    }

    // 2. Szukaj w Garaż (pojazdy)
    const cars = await state.db.getAll('garage');
    cars.forEach(car => {
        const searchText = `${car.make} ${car.model} ${car.year} ${car.vin} ${car.plates} ${car.caseNumber}`.toLowerCase();
        if (searchText.includes(query)) {
            results.push({
                module: 'cars',
                type: 'Pojazd',
                icon: 'car',
                title: `${car.make || ''} ${car.model || ''} ${car.year || ''}`.trim() || 'Nieznany pojazd',
                subtitle: car.plates || car.vin || '',
                meta: `Status: ${car.status || 'brak'} | ${car.caseNumber || ''}`,
                action: () => {
                    goToModule('cars');
                    setTimeout(() => openCar(car.id), 100);
                }
            });
        }
    });

    // 3. Szukaj w Notatki
    const notes = await state.db.getAll('notes');
    notes.forEach(note => {
        const searchText = `${note.title} ${note.content}`.toLowerCase();
        if (searchText.includes(query)) {
            results.push({
                module: 'notes',
                type: 'Notatka',
                icon: 'sticky-note',
                title: note.title || 'Bez tytułu',
                subtitle: (note.content || '').substring(0, 100) + '...',
                meta: new Date(note.date).toLocaleDateString(),
                action: () => {
                    goToModule('notes');
                    setTimeout(() => selectNote(note.id), 100);
                }
            });
        }
    });

    // 4. Szukaj w Links
    const links = JSON.parse(localStorage.getItem('lex_links') || '[]');
    links.forEach((link, idx) => {
        const searchText = `${link.name} ${link.url} ${link.category}`.toLowerCase();
        if (searchText.includes(query)) {
            results.push({
                module: 'links',
                type: 'Link',
                icon: 'link',
                title: link.name,
                subtitle: link.url,
                meta: link.category || 'Inne',
                action: () => window.open(link.url, '_blank')
            });
        }
    });

    // 5. Szukaj w Teren (teczki)
    const terrainCases = JSON.parse(localStorage.getItem('lex_terrain_cases') || '[]');
    terrainCases.forEach(tc => {
        const searchText = `${tc.name} ${tc.surname} ${tc.company} ${tc.address} ${tc.pesel}`.toLowerCase();
        if (searchText.includes(query)) {
            const name = (tc.name || tc.surname) ? `${tc.name} ${tc.surname}` : (tc.company || `Sprawa #${tc.id.slice(0,4)}`);
            results.push({
                module: 'terrain',
                type: 'Teczka',
                icon: 'folder',
                title: name,
                subtitle: tc.address || '',
                meta: `Dług: ${tc.debtAmount || '0'} PLN`,
                action: () => {
                    goToModule('terrain');
                    setTimeout(() => openCase(tc.id), 100);
                }
            });
        }
    });

    // 6. Szukaj w Rejestr (komorniki)
    if (state.bailiffs) {
        state.bailiffs.forEach(b => {
            const searchText = `${b.name} ${b.nip} ${b.address} ${b.epu}`.toLowerCase();
            if (searchText.includes(query)) {
                results.push({
                    module: 'registry',
                    type: 'Komornik',
                    icon: 'user',
                    title: b.name || 'Brak nazwy',
                    subtitle: b.address || '',
                    meta: `NIP: ${b.nip || 'brak'} | EPU: ${b.epu || 'brak'}`,
                    action: () => {
                        goToModule('registry');
                        setTimeout(() => {
                            document.getElementById('bailiffSearch').value = query;
                            searchBailiff(query);
                        }, 100);
                    }
                });
            }
        });
    }

    return results;
}

function renderSearchResults(results) {
    const container = document.getElementById('global-search-results');
    const stats = document.getElementById('search-stats');
    
    stats.textContent = `Znaleziono: ${results.length}`;

    if (results.length === 0) {
        container.innerHTML = `
            <div class="text-center text-slate-400 py-8">
                <i data-lucide="search-x" size="48" class="mx-auto mb-3 opacity-30"></i>
                <p class="text-sm">Brak wyników</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    // Grupuj wyniki po module
    const grouped = {};
    results.forEach(r => {
        if (!grouped[r.type]) grouped[r.type] = [];
        grouped[r.type].push(r);
    });

    let html = '';
    for (const [type, items] of Object.entries(grouped)) {
        html += `
            <div class="mb-4">
                <h4 class="text-xs font-bold text-slate-400 uppercase mb-2 px-2">${type} (${items.length})</h4>
                <div class="space-y-1">
                    ${items.map((item, idx) => `
                        <button onclick="executeSearchResult(${results.indexOf(item)})" 
                            class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors text-left group">
                            <div class="w-10 h-10 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center flex-shrink-0">
                                <i data-lucide="${item.icon}" size="20"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="font-semibold text-sm text-slate-800 dark:text-white truncate">${item.title}</div>
                                <div class="text-xs text-slate-500 truncate">${item.subtitle}</div>
                                <div class="text-xs text-slate-400 mt-0.5">${item.meta}</div>
                            </div>
                            <i data-lucide="arrow-right" size="16" class="text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex-shrink-0"></i>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
}

function executeSearchResult(index) {
    if (searchResults[index]) {
        searchResults[index].action();
        closeGlobalSearch();
    }
}

function handleSearchKeyboard(e) {
    if (!searchModalVisible) return;
    
    if (e.key === 'Escape') {
        e.preventDefault();
        closeGlobalSearch();
    }
}

// Export funkcji
window.globalSearchModule = {
    open: openGlobalSearch,
    close: closeGlobalSearch,
    search: performGlobalSearch
};
