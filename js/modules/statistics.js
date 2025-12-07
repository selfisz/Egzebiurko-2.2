// --- MODULE: STATISTICS & REPORTS ---
// Statystyki i raporty dla aplikacji

async function generateStatistics() {
    const stats = {
        cases: await getCasesStatistics(),
        cars: await getCarsStatistics(),
        notes: await getNotesStatistics(),
        terrain: getTerrainStatistics(),
        overall: {}
    };

    stats.overall = {
        totalItems: stats.cases.total + stats.cars.total + stats.notes.total + stats.terrain.total,
        activeWork: stats.cases.active + stats.cars.active,
        completedWork: stats.cases.completed + stats.cars.completed
    };

    return stats;
}

async function getCasesStatistics() {
    const cases = await state.db.getAll('cases');
    const now = new Date();
    
    return {
        total: cases.length,
        active: cases.filter(c => c.status !== 'finished').length,
        completed: cases.filter(c => c.status === 'finished').length,
        urgent: cases.filter(c => c.urgent).length,
        overdue: cases.filter(c => {
            const deadline = new Date(c.deadline || c.date);
            return deadline < now && c.status !== 'finished';
        }).length,
        thisWeek: cases.filter(c => {
            const deadline = new Date(c.deadline || c.date);
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            return deadline >= now && deadline <= weekFromNow && c.status !== 'finished';
        }).length,
        byStatus: {
            new: cases.filter(c => c.status === 'new').length,
            inProgress: cases.filter(c => c.status === 'in-progress').length,
            finished: cases.filter(c => c.status === 'finished').length
        },
        byPriority: {
            low: cases.filter(c => c.priority === 'low').length,
            medium: cases.filter(c => c.priority === 'medium').length,
            high: cases.filter(c => c.priority === 'high').length
        }
    };
}

async function getCarsStatistics() {
    const cars = await state.db.getAll('garage');
    
    return {
        total: cars.length,
        active: cars.filter(c => c.status !== 'Sprzedane/Zakończone').length,
        completed: cars.filter(c => c.status === 'Sprzedane/Zakończone').length,
        forfeiture: cars.filter(c => c.forfeiture).length,
        favorites: cars.filter(c => c.favorite).length,
        byStatus: cars.reduce((acc, car) => {
            const status = car.status || 'Inne';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {})
    };
}

async function getNotesStatistics() {
    const notes = await state.db.getAll('notes');
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return {
        total: notes.length,
        thisWeek: notes.filter(n => new Date(n.date) >= weekAgo).length,
        avgLength: notes.length > 0 
            ? Math.round(notes.reduce((sum, n) => sum + (n.content?.length || 0), 0) / notes.length)
            : 0
    };
}

function getTerrainStatistics() {
    const terrainCases = JSON.parse(localStorage.getItem('lex_terrain_cases') || '[]');
    
    return {
        total: terrainCases.length,
        withDebt: terrainCases.filter(tc => tc.debtAmount && parseFloat(tc.debtAmount) > 0).length,
        totalDebt: terrainCases.reduce((sum, tc) => sum + (parseFloat(tc.debtAmount) || 0), 0),
        urgent: terrainCases.filter(tc => tc.tags?.some(t => t.name === 'Pilne')).length
    };
}

async function renderStatisticsDashboard() {
    const stats = await generateStatistics();
    
    const container = document.getElementById('statistics-dashboard');
    if (!container) return;

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <!-- Overall Stats -->
            <div class="glass-panel p-6 rounded-2xl">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-sm font-bold text-slate-600 dark:text-slate-300">Wszystkie Elementy</h3>
                    <div class="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
                        <i data-lucide="database"></i>
                    </div>
                </div>
                <div class="text-3xl font-bold text-slate-800 dark:text-white mb-1">${stats.overall.totalItems}</div>
                <div class="text-xs text-slate-500">Łącznie w bazie</div>
            </div>

            <!-- Active Work -->
            <div class="glass-panel p-6 rounded-2xl">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-sm font-bold text-slate-600 dark:text-slate-300">Aktywne</h3>
                    <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center">
                        <i data-lucide="activity"></i>
                    </div>
                </div>
                <div class="text-3xl font-bold text-slate-800 dark:text-white mb-1">${stats.overall.activeWork}</div>
                <div class="text-xs text-slate-500">W toku</div>
            </div>

            <!-- Completed -->
            <div class="glass-panel p-6 rounded-2xl">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-sm font-bold text-slate-600 dark:text-slate-300">Zakończone</h3>
                    <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                        <i data-lucide="check-circle"></i>
                    </div>
                </div>
                <div class="text-3xl font-bold text-slate-800 dark:text-white mb-1">${stats.overall.completedWork}</div>
                <div class="text-xs text-slate-500">Ukończone</div>
            </div>

            <!-- Urgent -->
            <div class="glass-panel p-6 rounded-2xl">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-sm font-bold text-slate-600 dark:text-slate-300">Pilne</h3>
                    <div class="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center">
                        <i data-lucide="alert-circle"></i>
                    </div>
                </div>
                <div class="text-3xl font-bold text-slate-800 dark:text-white mb-1">${stats.cases.urgent + stats.terrain.urgent}</div>
                <div class="text-xs text-slate-500">Wymaga uwagi</div>
            </div>
        </div>

        <!-- Cases Details -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="glass-panel p-6 rounded-2xl">
                <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                    <i data-lucide="calendar-clock"></i>
                    Sprawy (Tracker)
                </h3>
                <div class="space-y-3">
                    <div class="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <span class="text-sm text-slate-600 dark:text-slate-300">Przeterminowane</span>
                        <span class="font-bold text-red-600">${stats.cases.overdue}</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <span class="text-sm text-slate-600 dark:text-slate-300">W tym tygodniu</span>
                        <span class="font-bold text-orange-600">${stats.cases.thisWeek}</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <span class="text-sm text-slate-600 dark:text-slate-300">Nowe</span>
                        <span class="font-bold text-blue-600">${stats.cases.byStatus.new}</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <span class="text-sm text-slate-600 dark:text-slate-300">W toku</span>
                        <span class="font-bold text-indigo-600">${stats.cases.byStatus.inProgress}</span>
                    </div>
                </div>
            </div>

            <div class="glass-panel p-6 rounded-2xl">
                <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                    <i data-lucide="car"></i>
                    Pojazdy (Garaż)
                </h3>
                <div class="space-y-3">
                    <div class="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <span class="text-sm text-slate-600 dark:text-slate-300">Aktywne</span>
                        <span class="font-bold text-green-600">${stats.cars.active}</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <span class="text-sm text-slate-600 dark:text-slate-300">Przepadek</span>
                        <span class="font-bold text-red-600">${stats.cars.forfeiture}</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <span class="text-sm text-slate-600 dark:text-slate-300">Sprzedane</span>
                        <span class="font-bold text-blue-600">${stats.cars.completed}</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <span class="text-sm text-slate-600 dark:text-slate-300">Ulubione</span>
                        <span class="font-bold text-yellow-600">${stats.cars.favorites}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Terrain Stats -->
        <div class="glass-panel p-6 rounded-2xl mb-6">
            <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                <i data-lucide="map-pin"></i>
                Tryb Terenowy
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div class="text-2xl font-bold text-slate-800 dark:text-white mb-1">${stats.terrain.total}</div>
                    <div class="text-xs text-slate-500">Teczek w portfelu</div>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div class="text-2xl font-bold text-green-600 mb-1">${stats.terrain.totalDebt.toLocaleString('pl-PL')} PLN</div>
                    <div class="text-xs text-slate-500">Łączna wartość długów</div>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div class="text-2xl font-bold text-red-600 mb-1">${stats.terrain.urgent}</div>
                    <div class="text-xs text-slate-500">Pilne sprawy</div>
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
            <button onclick="generateDailyReport()" class="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                <i data-lucide="file-text"></i>
                Generuj Raport Dzienny
            </button>
            <button onclick="exportStatistics()" class="flex-1 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                <i data-lucide="download"></i>
                Eksportuj Statystyki
            </button>
        </div>
    `;

    if (window.lucide) lucide.createIcons();
}

async function generateDailyReport() {
    const stats = await generateStatistics();
    const now = new Date();
    const dateStr = now.toLocaleDateString('pl-PL');
    
    const report = `
═══════════════════════════════════════════════════════
        RAPORT DZIENNY - ${dateStr}
═══════════════════════════════════════════════════════

📊 PODSUMOWANIE OGÓLNE
─────────────────────────────────────────────────────
Wszystkie elementy w bazie:     ${stats.overall.totalItems}
Aktywne sprawy/pojazdy:         ${stats.overall.activeWork}
Zakończone:                     ${stats.overall.completedWork}

📁 SPRAWY (TRACKER)
─────────────────────────────────────────────────────
Łącznie spraw:                  ${stats.cases.total}
├─ Przeterminowane:             ${stats.cases.overdue} ⚠️
├─ W tym tygodniu:              ${stats.cases.thisWeek}
├─ Pilne:                       ${stats.cases.urgent}
└─ Status:
   ├─ Nowe:                     ${stats.cases.byStatus.new}
   ├─ W toku:                   ${stats.cases.byStatus.inProgress}
   └─ Zakończone:               ${stats.cases.byStatus.finished}

🚗 POJAZDY (GARAŻ)
─────────────────────────────────────────────────────
Łącznie pojazdów:               ${stats.cars.total}
├─ Aktywne:                     ${stats.cars.active}
├─ Przepadek:                   ${stats.cars.forfeiture}
└─ Sprzedane:                   ${stats.cars.completed}

🗺️ TRYB TERENOWY
─────────────────────────────────────────────────────
Teczek w portfelu:              ${stats.terrain.total}
Łączna wartość długów:          ${stats.terrain.totalDebt.toLocaleString('pl-PL')} PLN
Pilne sprawy:                   ${stats.terrain.urgent}

📝 NOTATKI
─────────────────────────────────────────────────────
Łącznie notatek:                ${stats.notes.total}
Dodane w tym tygodniu:          ${stats.notes.thisWeek}

═══════════════════════════════════════════════════════
Wygenerowano: ${now.toLocaleString('pl-PL')}
═══════════════════════════════════════════════════════
    `.trim();

    // Skopiuj do schowka
    navigator.clipboard.writeText(report).then(() => {
        if (window.Toast) Toast.success('Raport skopiowany do schowka!');
    });

    // Pokaż w modalu
    showReportModal(report);
}

function showReportModal(report) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div class="p-6 border-b dark:border-slate-700 flex items-center justify-between">
                <h3 class="text-xl font-bold flex items-center gap-2">
                    <i data-lucide="file-text"></i>
                    Raport Dzienny
                </h3>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="p-6 overflow-y-auto custom-scroll max-h-[60vh]">
                <pre class="text-xs font-mono bg-slate-50 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">${report}</pre>
            </div>
            <div class="p-6 border-t dark:border-slate-700 flex gap-3">
                <button onclick="navigator.clipboard.writeText(\`${report.replace(/`/g, '\\`')}\`).then(() => Toast.success('Skopiowano!'))" 
                    class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center gap-2">
                    <i data-lucide="copy" size="16"></i>
                    Kopiuj
                </button>
                <button onclick="this.closest('.fixed').remove()" 
                    class="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-300 dark:hover:bg-slate-600">
                    Zamknij
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) lucide.createIcons();
}

async function exportStatistics() {
    const stats = await generateStatistics();
    const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statystyki_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    if (window.Toast) Toast.success('Statystyki wyeksportowane!');
}

// Export funkcji
window.statisticsModule = {
    generate: generateStatistics,
    render: renderStatisticsDashboard,
    dailyReport: generateDailyReport,
    export: exportStatistics
};
