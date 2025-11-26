// --- ROUTING ---
window.addEventListener('hashchange', handleRouteChange);

function handleRouteChange() {
    const hash = window.location.hash.substring(1);
    // If hash is empty or just '#', default to 'dashboard'
    const moduleName = hash || 'dashboard';
    goToModule(moduleName);
}

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    handleRouteChange(); // Initial route handler
    lucide.createIcons();
    
    // Restore Sidebar State
    if(localStorage.getItem('lex_sidebar_collapsed') === 'true') {
        document.getElementById('sidebar').classList.add('sidebar-collapsed');
        const btn = document.getElementById('sidebarPinBtn');
        if(btn) btn.innerHTML = '<i data-lucide="pin-off" size="16"></i>';
    } else {
        const btn = document.getElementById('sidebarPinBtn');
        if(btn) btn.classList.add('text-indigo-400');
    }
    
    // Restore Dark Mode
    if(localStorage.getItem(CONFIG.THEME.DARK_MODE_KEY) === 'true') document.documentElement.classList.add('dark');

    // Restore Theme
    setTheme('default');

    applySidebarOrder();
});

// --- KEYBOARD SHORTCUTS ---
document.addEventListener('keydown',(e)=>{ 
    if(e.key==="Escape") {
        document.querySelectorAll('[id$="Modal"], [id$="Form"]').forEach(m=>m.classList.add('hidden'));
        document.getElementById('notifPopover').classList.add('hidden');
        document.getElementById('searchModal').classList.add('hidden');
    }
    // Spotlight shortcut (Cmd+K or Ctrl+K)
    if((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
    }
});

// --- GLOBAL VALIDATION ---
document.addEventListener('input', (e) => {
    const id = e.target.id ? e.target.id.toLowerCase() : '';
    if (id.includes('nip')) validateInput(e.target, 'nip');
    if (id.includes('pesel')) validateInput(e.target, 'pesel');
});

function validateInput(el, type) {
    const val = el.value.replace(/[\s-]/g, ''); // Clean formatting
    let valid = false;

    if (type === 'nip') {
        valid = /^\d{10}$/.test(val) && isValidNIP(val);
    } else if (type === 'pesel') {
        valid = /^\d{11}$/.test(val) && isValidPESEL(val);
    }

    // Only show error if value is not empty (and not partial if focused... simplistic approach here)
    // Actually, show error if length is full but invalid, or remove error if valid.
    if (val.length > 0) {
        if (!valid) {
            el.classList.add('border-red-500', 'bg-red-50', 'dark:bg-red-900/10');
            el.classList.remove('border-green-500');
        } else {
            el.classList.remove('border-red-500', 'bg-red-50', 'dark:bg-red-900/10');
            el.classList.add('border-green-500');
        }
    } else {
        el.classList.remove('border-red-500', 'bg-red-50', 'dark:bg-red-900/10', 'border-green-500');
    }
}

function isValidNIP(nip) {
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(nip[i]) * weights[i];
    return (sum % 11) === parseInt(nip[9]);
}

function isValidPESEL(pesel) {
    const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(pesel[i]) * weights[i];
    const control = (10 - (sum % 10)) % 10;
    return control === parseInt(pesel[10]);
}

// --- PDF WORKER SETUP ---
if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// Make sure global search is attached if not handled by bridge/onclicks (it is handled by onclicks mostly)
window.runGlobalSearch = runGlobalSearch;

// --- SIDEBAR EDIT MODE ---
let sidebarSortable = null;
let isSidebarEditMode = false;

function toggleSidebarEditMode() {
    isSidebarEditMode = !isSidebarEditMode;
    const moduleList = document.getElementById('module-list');
    const btn = document.getElementById('edit-sidebar-btn');

    if (isSidebarEditMode) {
        btn.innerHTML = '<i data-lucide="check" size="14"></i> Zapisz';
        btn.classList.add('text-green-500');

        sidebarSortable = new Sortable(moduleList, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function (evt) {
                const order = Array.from(moduleList.children).map(item => item.dataset.moduleId);
                localStorage.setItem('sidebarOrder', JSON.stringify(order));
            }
        });
    } else {
        btn.innerHTML = '<i data-lucide="move" size="14"></i> Edytuj';
        btn.classList.remove('text-green-500');
        if (sidebarSortable) {
            sidebarSortable.destroy();
            sidebarSortable = null;
        }
    }
    lucide.createIcons();
}

function applySidebarOrder() {
    const savedOrder = JSON.parse(localStorage.getItem('sidebarOrder'));
    if (savedOrder) {
        const moduleList = document.getElementById('module-list');
        const items = Array.from(moduleList.children);
        const sortedItems = savedOrder.map(id => items.find(item => item.dataset.moduleId === id));

        sortedItems.forEach(item => {
            if (item) moduleList.appendChild(item);
        });
    }
}

// --- DASHBOARD EDIT MODE ---
let dashboardSortable = null;
let isDashboardEditMode = false;

function toggleDashboardEditMode() {
    isDashboardEditMode = !isDashboardEditMode;
    const grid = document.getElementById('dashboard-grid');
    const btn = document.getElementById('edit-dashboard-btn');

    if (isDashboardEditMode) {
        btn.innerHTML = '<i data-lucide="check" class="inline-block mr-2"></i> Zapisz układ';
        btn.classList.add('bg-green-500', 'text-white');
        grid.classList.add('edit-mode');

        dashboardSortable = new Sortable(grid, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function (evt) {
                const order = Array.from(grid.children).map(item => item.dataset.moduleId);
                localStorage.setItem('dashboardOrder', JSON.stringify(order));
            }
        });
    } else {
        btn.innerHTML = '<i data-lucide="move" class="inline-block mr-2"></i> Edytuj układ';
        btn.classList.remove('bg-green-500', 'text-white');
        grid.classList.remove('edit-mode');
        dashboardSortable.destroy();
        dashboardSortable = null;
    }
    lucide.createIcons();
}

function applyDashboardOrder() {
    const savedOrder = JSON.parse(localStorage.getItem('dashboardOrder'));
    if (savedOrder) {
        const grid = document.getElementById('dashboard-grid');
        const items = Array.from(grid.children);
        const sortedItems = savedOrder.map(id => items.find(item => item.dataset.moduleId === id));

        // Append sorted items, any new items will be at the end
        sortedItems.forEach(item => {
            if(item) grid.appendChild(item);
        });
    }
}
