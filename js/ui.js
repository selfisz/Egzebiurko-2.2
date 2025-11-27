// --- UI UTILS ---

// We import render functions to call them when switching views,
// BUT this creates circular dependency if those modules import UI.
// So we will rely on dynamic imports or the global window functions attached by bridge.js.
// Since we are moving to modules, we should import them.
// However, to avoid circular deps in this refactor step, we can use dynamic imports inside goToModule.

/**
 * Navigates to the Dashboard view.
 */
function goHome() {
    goToModule('dashboard');
}

/**
 * Main navigation handler. Switches views and loads necessary module data.
 * @param {string} n - Module name (e.g., 'tracker', 'generator')
 */
async function goToModule(n) {
    // Load the HTML content for the view
    await loadView(n);

    updateActiveNav(n); 
    
    // Logic specific to modules is now handled largely by loadView triggering globals,
    // OR we can move it here using imports.
    // For cleaner architecture, UI shouldn't know about specific module loading logic if possible.
    // But for this transition, let's keep the logic here or in loader.
    // The loader.js handles the `window.functionCall()` part.
    // So we just update the nav UI here.
}

function showView(n) {
    // Deprecated in favor of loadView which replaces content
    // But we might need to toggle classes if we were keeping all views in DOM.
    // Since we are now injecting, this is less relevant, but let's keep logic if needed.
    // Actually, loadView replaces innerHTML of container, so no hiding/showing needed.
}

function updateActiveNav(n) {
    document.querySelectorAll('[id^="nav-"]').forEach(el => {
        el.classList.remove('bg-slate-800', 'text-white');
        el.classList.add('hover:bg-slate-800', 'hover:text-white');
        const icon = el.querySelector('i');
        if(icon) icon.classList.remove('text-indigo-400');
    });
    const active = document.getElementById(`nav-${n}`);
    if(active) {
        active.classList.add('bg-slate-800', 'text-white');
        active.classList.remove('hover:bg-slate-800', 'hover:text-white');
        const icon = active.querySelector('i');
        if(icon) icon.classList.add('text-indigo-400');
    }
}

function toggleSidebarMode() {
    const sb = document.getElementById('sidebar');
    const btn = document.getElementById('sidebarPinBtn');
    sb.classList.toggle('sidebar-collapsed');
    
    const isCollapsed = sb.classList.contains('sidebar-collapsed');
    localStorage.setItem('lex_sidebar_collapsed', isCollapsed);
    
    if(btn) {
        btn.classList.toggle('text-indigo-400', !isCollapsed);
        btn.classList.toggle('text-slate-500', isCollapsed);
        btn.innerHTML = isCollapsed ? '<i data-lucide="pin-off" size="16"></i>' : '<i data-lucide="pin" size="16"></i>';
        lucide.createIcons();
    }
}

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem(CONFIG.THEME.DARK_MODE_KEY, document.documentElement.classList.contains('dark'));
}

function setTheme(themeName) {
    document.body.classList.remove('theme-ocean', 'theme-sunset', 'theme-minimal');
    document.body.classList.add('theme-default');
    localStorage.setItem(CONFIG.THEME.STORAGE_KEY, 'default');
}

// --- GLOBAL SEARCH ---
function toggleSearch() {
    const m = document.getElementById('searchModal');
    const inp = document.getElementById('globalSearchInput');
    m.classList.toggle('hidden');
    if(!m.classList.contains('hidden')) setTimeout(()=>inp.focus(), 100);
    else { inp.value=''; document.getElementById('searchResults').innerHTML=''; }
}

async function runGlobalSearch(q) {
    const resContainer = document.getElementById('searchResults');
    const footer = document.getElementById('searchFooter');
    if(q.length < 2) { resContainer.innerHTML = ''; footer.classList.remove('hidden'); return; }
    footer.classList.add('hidden');
    resContainer.innerHTML = '';

    const results = [];
    q = q.toLowerCase();

    // 1. Templates
    const templates = await state.db.getAll('templates');
    templates.forEach(t => {
        if(t.name.toLowerCase().includes(q)) results.push({type: 'file-text', title: t.name, subtitle: 'Szablon', action: ()=> { toggleSearch(); goToModule('generator'); setTimeout(()=>window.loadTemplate(t.name), 500); } });
    });

    // 2. Cases
    const cases = await state.db.getAll('cases');
    cases.forEach(c => {
        if((c.no && c.no.toLowerCase().includes(q)) || (c.debtor && c.debtor.toLowerCase().includes(q)) || (c.note && c.note.toLowerCase().includes(q)) || (c.unp && c.unp.toLowerCase().includes(q))) {
            results.push({type: 'calendar-clock', title: `${c.no} (${c.debtor||''})`, subtitle: `Sprawa (Termin: ${c.date})`, action: ()=> { toggleSearch(); goToModule('tracker'); }});
        }
    });

    // 3. Garage
    const cars = await state.db.getAll('garage');
    cars.forEach(c => {
        if(c.name.toLowerCase().includes(q)) results.push({type: 'car', title: c.name, subtitle: `Ruchomość (Data: ${c.date})`, action: ()=> { toggleSearch(); goToModule('cars'); }});
    });

    // 4. Bailiffs
    if (state.bailiffs) {
        state.bailiffs.forEach(b => {
            if(b.name.toLowerCase().includes(q) || (b.nip && b.nip.includes(q))) {
                results.push({type: 'gavel', title: b.name, subtitle: `${b.nip || ''} ${b.address || ''}`, action: ()=> { toggleSearch(); goToModule('registry'); setTimeout(()=>window.searchBailiff(q), 500); }});
            }
        });
    }

    // 5. Links
    const links = JSON.parse(localStorage.getItem('lex_links') || '[]');
    links.forEach(l => {
        if(l.name.toLowerCase().includes(q) || l.url.toLowerCase().includes(q)) {
            results.push({type: 'link', title: l.name, subtitle: l.url, action: ()=> { toggleSearch(); window.open(l.url); }});
        }
    });

    if(results.length === 0) {
        resContainer.innerHTML = '<div class="p-4 text-center text-slate-400 text-sm">Brak wyników</div>';
    } else {
        results.forEach(r => {
            const div = document.createElement('div');
            div.className = "p-3 mb-1 flex items-center gap-4 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-xl cursor-pointer group transition-colors";
            div.innerHTML = `
                <div class="p-2 bg-white dark:bg-slate-800 rounded-lg text-slate-500 group-hover:text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-600">
                    <i data-lucide="${r.type}" size="20"></i>
                </div>
                <div>
                    <div class="font-bold text-sm text-slate-800 dark:text-white">${r.title}</div>
                    <div class="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">${r.subtitle}</div>
                </div>
                <div class="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <i data-lucide="arrow-right" class="text-slate-300" size="16"></i>
                </div>
            `;
            div.onclick = r.action;
            resContainer.appendChild(div);
        });
        lucide.createIcons();
    }
}



// --- DASHBOARD WIDGETS ---
async function renderDashboardWidgets() {
    const container = document.getElementById('dashboard-widgets');
    if (!container) return;

    // --- URGENT CASES WIDGET ---
    const cases = await state.db.getAll('cases');
    const now = new Date();
    const urgentCases = cases
        .filter(c => !c.archived && c.priority === 'high')
        .map(c => {
            const d = new Date(c.date);
            d.setDate(d.getDate() + 30);
            return { ...c, daysLeft: Math.ceil((d - now) / 86400000) };
        })
        .filter(c => c.daysLeft >= 0)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 5); // Limit to top 5

    let widgetHTML = `
        <div class="glass-panel p-6 rounded-2xl shadow-sm">
            <h3 class="font-bold text-slate-700 dark:text-white flex items-center gap-2 text-sm uppercase mb-4">
                <i data-lucide="alert-triangle" class="text-red-500"></i> Pilne Sprawy
            </h3>
            <div class="space-y-3">
    `;

    if (urgentCases.length === 0) {
        widgetHTML += `<p class="text-xs text-slate-400 text-center py-4">Brak pilnych spraw.</p>`;
    } else {
        urgentCases.forEach(c => {
            widgetHTML += `
                <div onclick="goToModule('tracker')" class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 cursor-pointer">
                    <div>
                        <div class="font-bold text-xs text-slate-800 dark:text-white">${c.no}</div>
                        <div class="text-[10px] text-slate-500">${c.debtor}</div>
                    </div>
                    <div class="text-xs font-bold text-red-500">${c.daysLeft} dni</div>
                </div>
            `;
        });
    }

    widgetHTML += `</div></div>`;
    container.innerHTML = widgetHTML;

    if (window.lucide) lucide.createIcons();
}
