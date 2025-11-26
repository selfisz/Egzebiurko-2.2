// --- MODULE: TRACKER ---
// Note: renderCalendar might be circular if UI imports tracker.
// We defined renderCalendar in tracker in the old code, but UI calls it.
// Let's keep renderCalendar logic IN tracker, but export it for UI.


async function addCase() {
    const no=document.getElementById('trNo').value;
    const date=document.getElementById('trDate').value;
    const unp=document.getElementById('trUnp').value;
    const debtor=document.getElementById('trDebtor').value;
    const note=document.getElementById('trNote').value;
    const urgent = document.getElementById('trUrgent').checked;

    if(!no||!date) return alert("Podaj Nr Sprawy i Datę!"); 
    
    if(state.editingId && state.editingType === 'case') {
        const item = await state.db.get('cases', state.editingId);
        item.no = no; item.date = date; item.unp = unp; item.debtor = debtor; item.note = note; item.urgent = urgent;
        await state.db.put('cases', item);
        state.editingId = null; state.editingType = null;
        document.querySelector('button[onclick="addCase()"]').innerHTML = '<i data-lucide="plus"></i> Nowa Sprawa';
        document.getElementById('trNo').classList.remove('border-indigo-500', 'ring-2', 'ring-indigo-200');
    } else {
        await state.db.add('cases',{no, date, unp, debtor, note, urgent, favorite: false, archived: false}); 
    }
    
    document.getElementById('trNo').value='';
    document.getElementById('trUnp').value='';
    document.getElementById('trDebtor').value='';
    document.getElementById('trNote').value='';
    document.getElementById('trUrgent').checked=false;
    
    renderFullTracker();
    if(window.checkNotifications) window.checkNotifications(); // Use window version if circular dep issue
    renderCalendar();
    if(window.renderDashboardWidgets) window.renderDashboardWidgets();
}

async function editCase(id) {
    const item = await state.db.get('cases', id);
    if(item) {
        document.getElementById('trNo').value = item.no;
        document.getElementById('trDate').value = item.date;
        document.getElementById('trUnp').value = item.unp || '';
        document.getElementById('trDebtor').value = item.debtor || '';
        document.getElementById('trNote').value = item.note || '';
        document.getElementById('trUrgent').checked = item.urgent || false;
        
        state.editingId = id;
        state.editingType = 'case';
        const btn = document.querySelector('button[onclick="addCase()"]');
        btn.innerText = "Zapisz Zmiany";
        
        document.getElementById('trNo').focus();
        document.getElementById('trNo').classList.add('border-indigo-500', 'ring-2', 'ring-indigo-200');
    }
}

async function renderFullTracker() {
    const l=document.getElementById('trList'); 
    if(!l) return;
    l.innerHTML=''; 
    const c=await state.db.getAll('cases');
    
    // Add controls if not present
    const header = document.querySelector('#view-tracker h2')?.parentElement;
    if(header && !document.getElementById('archiveToggleBtn')) {
        const controls = document.createElement('div');
        controls.className = "flex gap-4 mt-2 items-center";
        
        const btn = document.createElement('button');
        btn.id = 'archiveToggleBtn';
        btn.className = "text-xs font-bold text-slate-500 hover:text-indigo-600 underline";
        btn.onclick = () => { state.showArchived = !state.showArchived; renderFullTracker(); };
        
        const sortSel = document.createElement('select');
        sortSel.className = "text-xs border rounded p-1 dark:bg-slate-700 dark:text-white outline-none";
        sortSel.innerHTML = `
            <option value="deadline">Sort: Termin</option>
            <option value="added">Sort: Data dodania</option>
            <option value="no">Sort: Sygnatura</option>
        `;
        sortSel.onchange = (e) => { state.trackerSort = e.target.value; renderFullTracker(); };
        
        controls.appendChild(btn);
        controls.appendChild(sortSel);
        header.appendChild(controls);
    }
    
    const arcBtn = document.getElementById('archiveToggleBtn');
    if(arcBtn) arcBtn.innerText = state.showArchived ? "Pokaż Aktywne" : "Pokaż Archiwum";

    const filtered = c.filter(x => state.showArchived ? x.archived : !x.archived);
    const proc = filtered.map(x=>{ const d=new Date(x.date); d.setDate(d.getDate()+30); return {...x, dl:d, left:Math.ceil((d-new Date())/86400000)}; });
    
    if(state.trackerSort === 'deadline') proc.sort((a,b)=>a.left-b.left);
    else if(state.trackerSort === 'added') proc.sort((a,b)=>new Date(b.date) - new Date(a.date));
    else if(state.trackerSort === 'no') proc.sort((a,b)=>a.no.localeCompare(b.no));

    if(proc.length === 0) {
        l.innerHTML = `<div class="text-center text-slate-400 mt-10">Brak ${state.showArchived ? 'zarchiwizowanych' : 'aktywnych'} spraw.</div>`;
        return;
    }

    proc.forEach(x=>{
        let cl="bg-green-100 border-green-300 text-green-900"; 
        if(x.left<8) cl="bg-yellow-100 border-yellow-300 text-yellow-900"; 
        if(x.left<2) cl="bg-red-100 border-red-300 text-red-900";
        if(x.archived) cl="bg-slate-100 border-slate-300 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"; 

        const d=document.createElement('div'); 
        d.className=`p-3 mb-2 rounded border-l-4 ${cl} flex justify-between items-start text-xs relative group transition-all`;
        
        const details = `
            <div class="font-bold text-sm flex items-center gap-2">
                ${x.no} 
                <span class="font-normal text-slate-500 text-[10px] bg-white/50 px-1.5 rounded">UNP: ${x.unp||'-'}</span>
            </div>
            <div class="font-bold text-slate-600 dark:text-slate-300 mt-1">${x.debtor || 'Brak zobowiązanego'}</div>
            <div class="italic text-slate-500 mt-0.5">${x.note || ''}</div>
            <div class="opacity-75 mt-1 text-[10px]">Termin mija: ${x.dl.toISOString().slice(0,10)}</div>
        `;

        const favClass = x.favorite ? 'text-red-500 fill-red-500' : 'text-slate-400 hover:text-red-400';
        const archiveIcon = x.archived ? 'refresh-ccw' : 'archive';
        
        d.innerHTML=`
            <div class="flex-1">${details}</div>
            <div class="text-right font-bold ml-2 whitespace-nowrap flex flex-col items-end gap-1">
                <span>${x.left} dni</span>
                <div class="flex gap-1 mt-1 bg-white/50 dark:bg-black/20 p-1 rounded-lg backdrop-blur-sm">
                    <button onclick="downloadICS('${x.no} - ${x.debtor}', '${x.dl.toISOString().slice(0,10)}', '${x.note||''} UNP:${x.unp}')" class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition-all" title="Dodaj do Kalendarza Outlook/Google">
                        <i data-lucide="calendar-plus" class="w-4 h-4"></i>
                    </button>
                    <div class="w-px bg-slate-300 mx-1"></div>
                    <button onclick="toggleFavorite('case', ${x.id})" class="p-1.5 hover:bg-white rounded transition-all"><i data-lucide="heart" class="w-4 h-4 ${favClass} ${x.favorite?'fill-red-500':''}"></i></button>
                    <button onclick="editTr(${x.id})" class="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-white rounded transition-all"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                    <button onclick="toggleArchiveTr(${x.id})" class="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-white rounded transition-all"><i data-lucide="${archiveIcon}" class="w-4 h-4"></i></button>
                    <button onclick="delTr(${x.id})" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded transition-all"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </div>`;
        l.appendChild(d);
    });
    lucide.createIcons();
}

async function toggleArchiveCase(id) {
    const item = await state.db.get('cases', id);
    if(item) {
        item.archived = !item.archived;
        await state.db.put('cases', item);
        renderFullTracker();
        if(window.checkNotifications) window.checkNotifications();
    }
}

async function deleteCase(i) {
    if(confirm("Usunąć?")) {
        await state.db.delete('cases',i);
        renderFullTracker();
        if(window.checkNotifications) window.checkNotifications();
        renderCalendar();
        if(window.renderDashboardWidgets) window.renderDashboardWidgets();
    }
}

// Calendar Logic
function changeMonth(d) {
    state.currentMonth += d;
    if(state.currentMonth > 11) { state.currentMonth = 0; state.currentYear++; }
    if(state.currentMonth < 0) { state.currentMonth = 11; state.currentYear--; }
    renderCalendar();
}

async function renderCalendar() {
    const m = state.currentMonth, y = state.currentYear;
    const monthNames = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
    const elMonth = document.getElementById('calendarMonth');
    if(elMonth) elMonth.innerText = `${monthNames[m]} ${y}`;

    const grid = document.getElementById('calendarGrid');
    if(!grid) return;
    grid.innerHTML = '';

    const firstDay = new Date(y, m, 1).getDay(); 
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    
    let startOffset = firstDay - 1;
    if(startOffset < 0) startOffset = 6;

    ['Pn','Wt','Śr','Cz','Pt','Sb','Nd'].forEach(d => {
        const h = document.createElement('div'); h.className = "text-[10px] font-bold text-slate-400 uppercase mb-1"; h.innerText = d;
        grid.appendChild(h);
    });

    for(let i=0; i<startOffset; i++) {
        const d = document.createElement('div'); d.className = "calendar-day other-month";
        grid.appendChild(d);
    }

    const cases = await state.db.getAll('cases');
    const reminders = await state.db.getAll('reminders');
    const today = new Date();

    for(let i=1; i<=daysInMonth; i++) {
        const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        
        const targetEntryDate = new Date(dateStr); targetEntryDate.setDate(targetEntryDate.getDate() - 30);
        const targetEntryStr = targetEntryDate.toISOString().slice(0,10);
        
        const expiringCases = cases.filter(c => c.date === targetEntryStr);
        const dayReminders = reminders.filter(r => r.date === dateStr);
        
        const d = document.createElement('div');
        d.className = "calendar-day dark:text-slate-200";
        if(today.getDate()===i && today.getMonth()===m && today.getFullYear()===y) d.classList.add('today');
        
        d.innerHTML = `<span>${i}</span>`;
        
        if(expiringCases.length > 0) d.innerHTML += `<div class="calendar-dot bg-red-500" title="${expiringCases.length} terminów mija"></div>`;
        if(dayReminders.length > 0) d.innerHTML += `<div class="calendar-dot bg-indigo-500" title="${dayReminders.length} przypomnień"></div>`;

        d.onclick = () => openReminderModal(dateStr);
        grid.appendChild(d);
    }
}

function openReminderModal(date) {
    document.getElementById('reminderDateInput').value = date;
    document.getElementById('reminderDateDisplay').innerText = date;
    document.getElementById('reminderText').value = '';
    document.getElementById('reminderModal').classList.remove('hidden');
}

function closeReminderModal() { document.getElementById('reminderModal').classList.add('hidden'); }

async function saveReminder() {
    const date = document.getElementById('reminderDateInput').value;
    const text = document.getElementById('reminderText').value;
    if(date && text) {
        await state.db.add('reminders', {date, text});
        closeReminderModal();
        renderCalendar();
        if(window.checkNotifications) window.checkNotifications();
    }
}
