// --- FINANCE ---

function calculateBalance() {
    const om = parseFloat(document.getElementById('bOldM').value) || 0;
    const oi = parseFloat(document.getElementById('bOldI').value) || 0;
    const nm = parseFloat(document.getElementById('bNewM').value) || 0;
    
    document.getElementById('bSum').innerText = (om + oi).toFixed(2);
    
    let ni = 0;
    if(om !== 0) {
        ni = (oi * nm) / om;
    }
    
    document.getElementById('bNewI').innerText = ni.toFixed(2);
    
    const diff = oi - ni;
    if(om !== 0 && nm !== 0) {
        document.getElementById('bDiff').innerText = "Różnica: " + diff.toFixed(2);
    } else {
         document.getElementById('bDiff').innerText = "";
    }
}

function calcKPA() {
    const inputDate = document.getElementById('awizoDate').value;
    if(!inputDate) return;
    
    let d = new Date(inputDate);
    // Add 14 days
    d.setDate(d.getDate() + 14);
    
    const originalDate = new Date(d);
    
    const checkHoliday = (dateObj) => {
        const year = dateObj.getFullYear();
        const mmdd = dateObj.toISOString().slice(5, 10);

        if(typeof getPolishHolidays === 'function') {
             const h = getPolishHolidays(year);
             if(h.includes(mmdd)) return true;
        }
        return false;
    };

    while(true) {
        const day = d.getDay();
        const isWeekend = (day === 0 || day === 6); // Sun or Sat
        const isHoliday = checkHoliday(d);
        
        if(!isWeekend && !isHoliday) break;
        d.setDate(d.getDate() + 1);
    }
    
    const nextBusinessDay = d.toISOString().slice(0, 10);
    
    document.getElementById('kpaResult').innerText = nextBusinessDay;
    document.getElementById('kpaNote').innerText = d.getTime() !== originalDate.getTime() ? "(Przesunięto na dzień roboczy)" : "";
}

function calcFinanceCarValuation() {
    const p1 = document.getElementById('fcP1').value;
    const p2 = document.getElementById('fcP2').value;
    const p3 = document.getElementById('fcP3').value;
    const isDamaged = document.getElementById('fcBad').checked;

    const avg = calculateAverageCarValue([p1, p2, p3], isDamaged);

    document.getElementById('fcResult').innerText = avg.toFixed(2) + " zł";
}
let isFinanceEditMode = false;

function initFinanceModule() {
    applyFinanceLayout();
    setupFinanceCollapsiblePanels();
}

function toggleFinanceEditMode() {
    isFinanceEditMode = !isFinanceEditMode;
    const panelsContainer = document.getElementById('finance-panels');
    const btn = document.getElementById('edit-finance-btn');

    if (isFinanceEditMode) {
        btn.innerHTML = '<i data-lucide="check" class="inline-block mr-2"></i> Zapisz układ';
        btn.classList.add('bg-green-500', 'text-white');
        panelsContainer.classList.add('edit-mode');

        financeSortable = new Sortable(panelsContainer, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            handle: '.collapsible-header',
            onEnd: function (evt) {
                const order = Array.from(panelsContainer.children).map(item => item.dataset.panelId);
                localStorage.setItem('financePanelOrder', JSON.stringify(order));
            }
        });
    } else {
        btn.innerHTML = '<i data-lucide="move" class="inline-block mr-2"></i> Edytuj układ';
        btn.classList.remove('bg-green-500', 'text-white');
        panelsContainer.classList.remove('edit-mode');
        if (financeSortable) {
            financeSortable.destroy();
            financeSortable = null;
        }
    }
    if(window.lucide) lucide.createIcons();
}

function setupFinanceCollapsiblePanels() {
    document.querySelectorAll('#finance-panels .collapsible-header').forEach(header => {
        header.addEventListener('click', () => {
            if (isFinanceEditMode) return;

            const content = header.nextElementSibling;
            const panelId = header.closest('.sortable-item').dataset.panelId;
            const isCollapsed = content.classList.toggle('hidden');
            header.querySelector('.chevron-icon').classList.toggle('rotate-180', isCollapsed);

            const collapsedState = JSON.parse(localStorage.getItem('financePanelState')) || {};
            collapsedState[panelId] = isCollapsed;
            localStorage.setItem('financePanelState', JSON.stringify(collapsedState));
        });
    });
}

function applyFinanceLayout() {
    const panelsContainer = document.getElementById('finance-panels');
    if (!panelsContainer) return;
    
    // Apply order
    const savedOrder = JSON.parse(localStorage.getItem('financePanelOrder'));
    if (savedOrder) {
        const items = Array.from(panelsContainer.children);
        const sortedItems = savedOrder.map(id => items.find(item => item.dataset.panelId === id));
        sortedItems.forEach(item => {
            if (item) panelsContainer.appendChild(item);
        });
    }

    // Apply collapsed state
    const collapsedState = JSON.parse(localStorage.getItem('financePanelState')) || {};
    Object.keys(collapsedState).forEach(panelId => {
        const panel = document.querySelector(`#finance-panels [data-panel-id="${panelId}"]`);
        if (panel && collapsedState[panelId]) {
            panel.querySelector('.collapsible-content').classList.add('hidden');
            panel.querySelector('.chevron-icon').classList.add('rotate-180');
        }
    });
}

// Global Exports for the view
window.calculateBalance = calculateBalance;
window.calcKPA = calcKPA;
window.calcFinanceCarValuation = calcFinanceCarValuation;
window.toggleFinanceEditMode = toggleFinanceEditMode;
window.initFinanceModule = initFinanceModule;
