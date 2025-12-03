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

        // --- Powiadomienia ze spraw (terminy) ---
        cases.filter(c => !c.archived).forEach(c => {
            const caseDate = new Date(c.date);
            const daysLeft = Math.ceil((caseDate - now) / (1000 * 60 * 60 * 24));

            if (daysLeft >= 0 && daysLeft <= 7) {
                if (daysLeft <= 3) {
                    notifs.push({
                        id: `case-${c.id}`,
                        type: 'alert-triangle',
                        color: 'red',
                        text: `Sprawa ${c.no} - termin mija za ${daysLeft} dni!`,
                        action: () => goToModule('tracker')
                    });
                } else if (c.urgent) {
                    notifs.push({
                        id: `case-${c.id}`,
                        type: 'alert-triangle',
                        color: 'orange',
                        text: `Pilna sprawa ${c.no} - termin mija za ${daysLeft} dni.`,
                        action: () => goToModule('tracker')
                    });
                }
            }
        });

        // --- Powiadomienia z przypomnień kalendarza ---
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

                        items.forEach((text, idx) => {
                            const whenText = daysDiff === 0
                                ? 'DZIŚ'
                                : daysDiff === 1
                                    ? 'jutro'
                                    : `za ${daysDiff} dni`;

                            notifs.push({
                                id: `rem-${dateStr}-${idx}`,
                                type: 'bell',
                                color: 'green',
                                text: `Przypomnienie na ${prettyDate} (${whenText}): ${text}`,
                                action: () => goToModule('tracker')
                            });
                        });
                    }
                });
            }
        } catch (e) {
            console.error('Reminders parse error:', e);
        }

        // Remove duplicates by id
        let uniqueNotifs = Array.from(new Map(notifs.map(n => [n.id, n])).values());

        // Filter out powiadomienia oznaczone jako ukryte
        const dismissed = getDismissedNotificationIds();
        const dismissedCount = dismissed.size;
        if (dismissedCount > 0) {
            uniqueNotifs = uniqueNotifs.filter(n => !dismissed.has(n.id));
        }

        // Render Badge
        if (uniqueNotifs.length > 0) {
            notifBadge.innerText = uniqueNotifs.length;
            notifBadge.classList.remove('hidden');
        } else {
            notifBadge.classList.add('hidden');
        }

        // Render List (sekcje: terminy i przypomnienia)
        notifList.innerHTML = '';
        if (uniqueNotifs.length === 0) {
            notifList.innerHTML = '<div class="text-center p-4 text-slate-400 text-xs">Brak nowych powiadomień.</div>';
        } else {
            const caseNotifs = uniqueNotifs.filter(n => n.id.startsWith('case-'));
            const remNotifs = uniqueNotifs.filter(n => n.id.startsWith('rem-'));

            const appendHeader = (label) => {
                const h = document.createElement('div');
                h.className = 'px-3 pt-2 pb-1 text-[10px] font-bold uppercase text-slate-400';
                h.textContent = label;
                notifList.appendChild(h);
            };

            const appendNotif = (n) => {
                const div = document.createElement('div');
                div.className = 'p-3 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex gap-3 items-start';

                const iconWrap = document.createElement('div');
                iconWrap.className = `text-${n.color}-500 mt-0.5`;
                iconWrap.innerHTML = `<i data-lucide="${n.type}" size="16"></i>`;

                const textWrap = document.createElement('div');
                textWrap.className = 'flex-1 text-xs text-slate-600 dark:text-slate-300 font-medium';
                textWrap.textContent = n.text;

                const closeBtn = document.createElement('button');
                closeBtn.type = 'button';
                closeBtn.className = 'ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200';
                closeBtn.innerHTML = '<i data-lucide="x" size="14"></i>';
                closeBtn.onclick = (e) => {
                    e.stopPropagation();
                    dismissNotification(n.id);
                };

                div.onclick = n.action;
                div.appendChild(iconWrap);
                div.appendChild(textWrap);
                div.appendChild(closeBtn);

                notifList.appendChild(div);
            };

            if (caseNotifs.length > 0) {
                appendHeader('Terminy spraw');
                caseNotifs.forEach(appendNotif);
            }

            if (remNotifs.length > 0) {
                appendHeader('Przypomnienia');
                remNotifs.forEach(appendNotif);
            }

            // Footer: opcja pokazania ukrytych powiadomień
            if (dismissedCount > 0) {
                const footer = document.createElement('div');
                footer.className = 'px-3 py-2 text-[10px] text-slate-400 flex items-center justify-between bg-slate-50 dark:bg-slate-900/40';
                const info = document.createElement('span');
                info.textContent = `Ukryte powiadomienia: ${dismissedCount}`;
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'text-indigo-600 dark:text-indigo-400 font-bold hover:underline';
                btn.textContent = 'Pokaż ukryte';
                btn.onclick = (e) => {
                    e.stopPropagation();
                    resetDismissedNotifications();
                };
                footer.appendChild(info);
                footer.appendChild(btn);
                notifList.appendChild(footer);
            }

            if (window.lucide) lucide.createIcons();
        }
    } catch (error) {
        console.error('Notifications error:', error);
    }
}

function getDismissedNotificationIds() {
    try {
        const raw = localStorage.getItem('lex_dismissed_notifs');
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return new Set();
        return new Set(arr);
    } catch (e) {
        console.error('Dismissed notifs parse error:', e);
        return new Set();
    }
}

function saveDismissedNotificationIds(set) {
    try {
        localStorage.setItem('lex_dismissed_notifs', JSON.stringify(Array.from(set)));
    } catch (e) {
        console.error('Dismissed notifs save error:', e);
    }
}

function dismissNotification(id) {
    const dismissed = getDismissedNotificationIds();
    dismissed.add(id);
    saveDismissedNotificationIds(dismissed);
    checkNotifications();
    if (typeof renderDashboardWidgets === 'function') {
        renderDashboardWidgets();
    }
}

function resetDismissedNotifications() {
    try {
        localStorage.removeItem('lex_dismissed_notifs');
    } catch (e) {
        console.error('Dismissed notifs reset error:', e);
    }
    checkNotifications();
    if (typeof renderDashboardWidgets === 'function') {
        renderDashboardWidgets();
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
