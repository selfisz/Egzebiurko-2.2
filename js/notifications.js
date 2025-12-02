// --- NOTIFICATIONS MODULE ---

async function checkNotifications() {
    const notifBadge = document.getElementById('notifBadge');
    const notifList = document.getElementById('notifList');
    if (!notifList || !notifBadge) return;

    try {
        const db = await idb.openDB(CONFIG.DB_NAME, CONFIG.DB_VERSION);
        const cases = await db.getAll('tracker');
        const now = new Date();

        let notifs = [];

        cases.filter(c => !c.archived).forEach(c => {
            const caseDate = new Date(c.date);
            const daysLeft = Math.ceil((caseDate - now) / (1000 * 60 * 60 * 24));

            if (daysLeft >= 0 && daysLeft <= 7) {
                if (daysLeft <= 3) {
                    notifs.push({
                        id: c.id,
                        type: 'alert-triangle',
                        color: 'red',
                        text: `Sprawa ${c.no} - termin mija za ${daysLeft} dni!`,
                        action: () => goToModule('tracker')
                    });
                } else if (c.urgent) {
                    notifs.push({
                        id: c.id,
                        type: 'alert-triangle',
                        color: 'orange',
                        text: `Pilna sprawa ${c.no} - termin mija za ${daysLeft} dni.`,
                        action: () => goToModule('tracker')
                    });
                }
            }
        });

        // Remove duplicates by case id
        const uniqueNotifs = Array.from(new Map(notifs.map(n => [n.id, n])).values());

        // Render Badge
        if (uniqueNotifs.length > 0) {
            notifBadge.innerText = uniqueNotifs.length;
            notifBadge.classList.remove('hidden');
        } else {
            notifBadge.classList.add('hidden');
        }

        // Render List
        notifList.innerHTML = '';
        if (uniqueNotifs.length === 0) {
            notifList.innerHTML = '<div class="text-center p-4 text-slate-400 text-xs">Brak nowych powiadomień.</div>';
        } else {
            uniqueNotifs.forEach(n => {
                const div = document.createElement('div');
                div.className = "p-3 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex gap-3 items-start";
                div.innerHTML = `
                    <div class="text-${n.color}-500 mt-0.5"><i data-lucide="${n.type}" size="16"></i></div>
                    <div class="text-xs text-slate-600 dark:text-slate-300 font-medium">${n.text}</div>
                `;
                div.onclick = n.action;
                notifList.appendChild(div);
            });
            if (window.lucide) lucide.createIcons();
        }
    } catch (error) {
        console.error('Notifications error:', error);
    }
}

async function loadFavoritesList() {
    const favList = document.getElementById('favList');
    if (!favList) return;
    
    try {
        const db = await idb.openDB(CONFIG.DB_NAME, CONFIG.DB_VERSION);
        const cases = await db.getAll('tracker');
        const favorites = cases.filter(c => c.isFavorite && !c.archived);

        if (favorites.length > 0) {
            favList.innerHTML = favorites.map(c => `
                <div class="p-2 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs cursor-pointer" onclick="goToModule('tracker')">
                    <span class="font-bold">${c.no}</span>
                    <p class="text-slate-500 text-[10px]">${c.debtor || ''}</p>
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
