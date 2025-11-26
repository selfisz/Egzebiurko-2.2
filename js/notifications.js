// --- NOTIFICATIONS ---

async function checkNotifications() {
    const cases = await state.db.getAll('cases');
    const now = new Date();

    let notifs = [];

    cases.filter(c => !c.archived).forEach(c => {
        const d = new Date(c.date);
        d.setDate(d.getDate() + 30);
        const daysLeft = Math.ceil((d - now) / 86400000);

        const key = `${c.id}-${daysLeft}`;

        if (daysLeft >= 0) {
            if (daysLeft <= 3) {
                notifs.push({
                    key: key,
                    type: 'alert-triangle',
                    color: 'red',
                    text: `Sprawa ${c.no} - termin mija za ${daysLeft} dni!`,
                    action: () => goToModule('tracker')
                });
            } else if (daysLeft <= 7 && c.priority === 'high') {
                notifs.push({
                    key: key,
                    type: 'alert-triangle',
                    color: 'orange',
                    text: `Pilna sprawa ${c.no} - termin mija za ${daysLeft} dni.`,
                    action: () => goToModule('tracker')
                });
            }
        }
    });

    // Remove duplicates, keeping the most urgent one (e.g. 3-day is more urgent than 7-day)
    const uniqueNotifs = Array.from(new Map(notifs.map(n => [n.key.split('-')[0], n])).values());

    // Render Badge
    const badge = document.getElementById('notifBadge');
    if(uniqueNotifs.length > 0) {
        badge.innerText = uniqueNotifs.length;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    // Render List
    const list = document.getElementById('notifList');
    list.innerHTML = '';
    if(uniqueNotifs.length === 0) {
        list.innerHTML = '<div class="text-center p-4 text-slate-400 text-xs">Brak nowych powiadomień.</div>';
    } else {
        uniqueNotifs.forEach(n => {
            const div = document.createElement('div');
            div.className = "p-3 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex gap-3 items-start";
            div.innerHTML = `
                <div class="text-${n.color}-500 mt-0.5"><i data-lucide="${n.type}" size="16"></i></div>
                <div class="text-xs text-slate-600 dark:text-slate-300 font-medium">${n.text}</div>
            `;
            div.onclick = n.action;
            list.appendChild(div);
        });
        lucide.createIcons();
    }
}

function toggleNotifications() {
    const p = document.getElementById('notifPopover');
    p.classList.toggle('hidden');
    document.getElementById('favPopover').classList.add('hidden');
    checkNotifications();
}

function toggleFavorites() {
    const p = document.getElementById('favPopover');
    p.classList.toggle('hidden');
    document.getElementById('notifPopover').classList.add('hidden');
    loadFavoritesList();
}

async function loadFavoritesList() {
    const l = document.getElementById('favList');
    l.innerHTML = '';
    
    const cases = await state.db.getAll('cases');
    const cars = await state.db.getAll('garage');
    const links = JSON.parse(localStorage.getItem('lex_links') || '[]');

    const favs = [
        ...cases.filter(x=>x.favorite).map(x=>({...x, _type:'case', title: x.no, sub: x.debtor})),
        ...cars.filter(x=>x.favorite).map(x=>({...x, _type:'car', title: x.name, sub: x.date})),
        ...links.filter(x=>x.favorite).map(x=>({...x, _type:'link', title: x.name, sub: 'Link'}))
    ];

    if(favs.length === 0) {
        l.innerHTML = '<div class="text-center p-4 text-slate-400 text-xs">Pusto w teczce.</div>';
        return;
    }

    favs.forEach(f => {
        const div = document.createElement('div');
        div.className = "p-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-3 border-b dark:border-slate-700 last:border-0";
        let icon = 'help-circle';
        if(f._type === 'case') icon = 'calendar-clock';
        if(f._type === 'car') icon = 'car';
        if(f._type === 'link') icon = 'link';

        div.innerHTML = `
            <div class="text-indigo-500"><i data-lucide="${icon}" size="14"></i></div>
            <div class="overflow-hidden">
                <div class="font-bold text-xs text-slate-700 dark:text-slate-200 truncate">${f.title}</div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 truncate">${f.sub}</div>
            </div>
        `;
        div.onclick = () => {
             if(f._type === 'case') goToModule('tracker');
             if(f._type === 'car') goToModule('cars');
             if(f._type === 'link') window.open(f.url);
             toggleFavorites();
        };
        l.appendChild(div);
    });
    lucide.createIcons();
}

async function toggleFavorite(type, id) {
    if(type === 'case') {
        const item = await state.db.get('cases', id);
        item.favorite = !item.favorite;
        await state.db.put('cases', item);
        if(window.renderFullTracker) window.renderFullTracker();
    }
    if(type === 'car') {
        const item = await state.db.get('garage', id);
        item.favorite = !item.favorite;
        await state.db.put('garage', item);
        if(window.loadGarage) window.loadGarage();
    }
    if(type === 'link') {
        // Links are in localStorage, id is index
        const links = JSON.parse(localStorage.getItem('lex_links') || '[]');
        if(links[id]) {
            links[id].favorite = !links[id].favorite;
            localStorage.setItem('lex_links', JSON.stringify(links));
            if(window.renderLinksList) window.renderLinksList();
        }
    }
    // Update Widgets
    if(window.renderDashboardWidgets) window.renderDashboardWidgets();
}

// Make toggleFavorite global as it is used in HTML onclicks
window.toggleFavorite = toggleFavorite;
window.toggleLinkFavorite = (id) => toggleFavorite('link', id);
window.toggleNotifications = toggleNotifications;
window.toggleFavorites = toggleFavorites;
