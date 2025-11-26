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
    const c = document.getElementById('dashboard-widgets');
    if(!c) return;
    c.innerHTML = '';
    
    // Urgent Cases Widget
    const allCases = await state.db.getAll('cases');
    const now = new Date();
    const urgentCases = allCases.filter(x => {
        let isUrgent = x.urgent;
        if(x.date) {
            const d = new Date(x.date); d.setDate(d.getDate()+30);
            const daysLeft = Math.ceil((d - now) / 86400000);
            if(daysLeft <= 7 && daysLeft >= 0) isUrgent = true;
        }
        return isUrgent;
    }).slice(0, 5); // Max 5

    const w1 = document.createElement('div');
    w1.className = "glass-panel p-6 rounded-2xl shadow-lg flex flex-col";
    w1.innerHTML = `<h3 class="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><i data-lucide="alert-circle" class="text-red-500"></i> Pilne Sprawy</h3>`;
    
    if(urgentCases.length === 0) {
        w1.innerHTML += `<div class="text-sm text-slate-400 flex-1 flex items-center justify-center">Brak pilnych spraw.</div>`;
    } else {
        const ul = document.createElement('div');
        ul.className = "space-y-2 flex-1 overflow-y-auto custom-scroll max-h-64";
        urgentCases.forEach(u => {
            const d = new Date(u.date); d.setDate(d.getDate()+30);
            const days = Math.ceil((d - now) / 86400000);
            ul.innerHTML += `
                <div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 rounded-lg flex justify-between items-center cursor-pointer hover:bg-red-100 transition-colors" onclick="goToModule('tracker')">
                    <div>
                        <div class="font-bold text-xs text-red-800 dark:text-red-200">${u.no}</div>
                        <div class="text-[10px] text-red-600 dark:text-red-400">${u.debtor || '-'}</div>
                    </div>
                    <div class="text-xs font-bold ${days<3?'text-red-600 animate-pulse':'text-red-500'}">${days} dni</div>
                </div>`;
        });
        w1.appendChild(ul);
    }
    c.appendChild(w1);

    // Favorites Widget
    const cars = await state.db.getAll('garage');
    const links = JSON.parse(localStorage.getItem('lex_links') || '[]');
    
    const favs = [
        ...allCases.filter(x=>x.favorite).map(x=>({...x, _type:'case'})),
        ...cars.filter(x=>x.favorite).map(x=>({...x, _type:'car'})),
        ...links.filter(x=>x.favorite).map(x=>({...x, _type:'link'}))
    ].slice(0, 6);

    const w2 = document.createElement('div');
    w2.className = "glass-panel p-6 rounded-2xl shadow-lg flex flex-col";
    w2.innerHTML = `<h3 class="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><i data-lucide="briefcase" class="text-indigo-500"></i> Teczka (Ulubione)</h3>`;
    
    if(favs.length === 0) {
        w2.innerHTML += `<div class="text-sm text-slate-400 flex-1 flex items-center justify-center">Brak elementów w teczce.</div>`;
    } else {
        const grid = document.createElement('div');
        grid.className = "grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 content-start";
        favs.forEach(f => {
            let icon = 'help-circle';
            let title = '';
            let sub = '';
            let click = null;

            if(f._type === 'case') { icon='calendar-clock'; title=f.no; sub=f.debtor; click=()=>goToModule('tracker'); }
            if(f._type === 'car') { icon='car'; title=f.name; sub=f.date; click=()=>goToModule('cars'); }
            if(f._type === 'link') { icon='link'; title=f.name; sub='Link'; click=()=>window.open(f.url); }

            const el = document.createElement('div');
            el.className = "p-2 bg-slate-50 dark:bg-slate-700/50 border dark:border-slate-700 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors";
            el.innerHTML = `
                <div class="p-1.5 bg-white dark:bg-slate-800 rounded shadow-sm text-indigo-500"><i data-lucide="${icon}" size="14"></i></div>
                <div class="overflow-hidden">
                    <div class="font-bold text-xs text-slate-700 dark:text-slate-200 truncate">${title}</div>
                    <div class="text-[10px] text-slate-500 dark:text-slate-400 truncate">${sub}</div>
                </div>
            `;
            el.onclick = click;
            grid.appendChild(el);
        });
        w2.appendChild(grid);
    }
    c.appendChild(w2);
    lucide.createIcons();
}
