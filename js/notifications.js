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
