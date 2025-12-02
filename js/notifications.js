async function checkNotifications() {
    const notifList = document.getElementById('notifList');
    const notifBadge = document.getElementById('notifBadge');
    if (!notifList || !notifBadge) return;

    const db = await idb.openDB('EgzeBiurkoDB', 1);
    const cases = await db.getAll('tracker');

    const upcomingCases = cases.filter(c => {
        const aWeekFromNow = new Date();
        aWeekFromNow.setDate(aWeekFromNow.getDate() + 7);
        const caseDate = new Date(c.date);
        return !c.archived && caseDate > new Date() && caseDate <= aWeekFromNow;
    });

    const urgentAlerts = upcomingCases.filter(c => c.urgent);
    const deadlineAlerts = upcomingCases.filter(c => {
        const caseDate = new Date(c.date);
        const today = new Date();
        const diffDays = Math.ceil((caseDate - today) / (1000 * 60 * 60 * 24));
        return diffDays === 7 || diffDays === 3;
    });

    // Combine and remove duplicates
    const allAlerts = [...new Map([...urgentAlerts, ...deadlineAlerts].map(item => [item.id, item])).values()];
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
    
    if (allAlerts.length > 0) {
        notifBadge.textContent = allAlerts.length;
        notifBadge.classList.remove('hidden');
        notifList.innerHTML = allAlerts.map(c => `
            <div class="p-2 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs">
                <span class="font-bold">${c.no}</span> - termin za ${Math.ceil((new Date(c.date) - new Date()) / (1000 * 60 * 60 * 24))} dni.
            </div>
        `).join('');
    } else {
        notifBadge.classList.add('hidden');
        notifList.innerHTML = '<div class="p-4 text-center text-xs text-slate-400">Brak powiadomień.</div>';
    }
}
