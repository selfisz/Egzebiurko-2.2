// --- MODULE: TERRAIN / FIELD MODE ---

let html5QrCode = null;
let terrainCases = [];
let currentCaseId = null;

// --- VIRTUAL FOLDER (BRIEFCASE) SECTION ---

function loadBriefcase() {
    const raw = localStorage.getItem('lex_terrain_cases');
    terrainCases = raw ? JSON.parse(raw) : [];
    renderBriefcase();
}

function renderBriefcase() {
    const list = document.getElementById('briefcase-list');
    if (!list) return;
    list.innerHTML = '';

    terrainCases.forEach(c => {
        const div = document.createElement('div');
        div.className = "flex flex-col p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all group relative shadow-sm h-40 justify-between";
        div.onclick = () => openCase(c.id);

        const nameLabel = (c.name || c.surname) ? `${c.name} ${c.surname}` : (c.company || `Sprawa #${c.id.slice(0,4)}`);
        const debtLabel = c.debtAmount ? `${parseFloat(c.debtAmount).toLocaleString('pl-PL')} PLN` : '';
        const addressLabel = c.address ? c.address.split(',')[0] : '';
        const isUrgent = (c.tags && c.tags.some(t => t.name === 'Pilne'));

        div.innerHTML = `
            <div class="flex justify-between items-start w-full">
                <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i data-lucide="folder"></i>
                </div>
                ${isUrgent ? '<div class="w-3 h-3 bg-red-500 rounded-full shadow-sm animate-pulse"></div>' : ''}
            </div>

            <div class="w-full mt-2">
                <div class="text-xs font-bold text-slate-700 dark:text-slate-200 truncate leading-tight">${nameLabel}</div>
                <div class="text-[10px] text-slate-400 truncate mt-0.5">${addressLabel}</div>
            </div>

            <div class="w-full text-right mt-auto pt-2 border-t border-slate-100 dark:border-slate-700/50">
                <div class="text-xs font-extrabold text-red-600 dark:text-red-400">${debtLabel}</div>
            </div>

            <button onclick="event.stopPropagation(); deleteCase('${c.id}')" class="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                <i data-lucide="x" size="14"></i>
            </button>
        `;
        list.appendChild(div);
    });

    if (window.lucide) lucide.createIcons();
}

function addNewCase() {
    const newCase = {
        id: Date.now().toString(),
        name: '',
        surname: '',
        company: '',
        address: '',
        phone: '',
        debtAmount: '',
        pesel: '',
        notes: '',
        arrearsHTML: null,
        tags: [],
        syncStatus: 'new',
        lastModified: new Date().toISOString()
    };
    terrainCases.push(newCase);
    saveCases();
    renderBriefcase();
    openCase(newCase.id);
}

function deleteCase(id) {
    if(!confirm("Czy na pewno usunąć te akta?")) return;
    terrainCases = terrainCases.filter(c => c.id !== id);
    saveCases();
    renderBriefcase();
}

function openCase(id) {
    currentCaseId = id;
    const c = terrainCases.find(x => x.id === id);
    if (!c) return;

    // UI Transition
    document.getElementById('briefcase-grid').classList.add('-translate-x-full');
    document.getElementById('briefcase-detail').classList.remove('translate-x-full');

    // Populate Fields
    document.getElementById('caseName').value = c.name || '';
    document.getElementById('caseSurname').value = c.surname || '';
    document.getElementById('caseCompany').value = c.company || '';
    document.getElementById('caseAddress').value = c.address || '';
    document.getElementById('casePhone').value = c.phone || '';
    document.getElementById('casePesel').value = c.pesel || '';
    document.getElementById('caseNotes').value = c.notes || '';
    document.getElementById('caseDebt').value = c.debtAmount || '';

    // Update Call Button
    const btnCall = document.getElementById('btnCall');
    btnCall.href = c.phone ? `tel:${c.phone}` : '#';
    if(!c.phone) btnCall.classList.add('opacity-50', 'pointer-events-none');
    else btnCall.classList.remove('opacity-50', 'pointer-events-none');

    // Label
    const label = (c.name || c.surname) ? `${c.name} ${c.surname}` : (c.company || 'Nowa Sprawa');
    document.getElementById('currentCaseLabel').innerText = label;

    // Render Tags
    renderTags(c.tags || []);

    // Arrears Tab
    const arrearsContainer = document.getElementById('arrearsTableContainer');
    const emptyState = document.getElementById('arrearsEmptyState');
    if (c.arrearsHTML) {
        arrearsContainer.innerHTML = c.arrearsHTML;
        arrearsContainer.classList.remove('hidden');
        emptyState.classList.add('hidden');
    } else {
        arrearsContainer.innerHTML = '';
        arrearsContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
    }

    switchFolderTab('info');
}

function closeCase() {
    currentCaseId = null;
    document.getElementById('briefcase-grid').classList.remove('-translate-x-full');
    document.getElementById('briefcase-detail').classList.add('translate-x-full');
    renderBriefcase();
}

function updateCaseData(field, value) {
    if (!currentCaseId) return;
    const c = terrainCases.find(x => x.id === currentCaseId);
    if (!c) return;

    c[field] = value;

    // Update sync status if the case is not new
    if (c.syncStatus !== 'new') {
        c.syncStatus = 'modified';
    }
    c.lastModified = new Date().toISOString();

    if (field === 'name' || field === 'surname' || field === 'company') {
        const label = (c.name || c.surname) ? `${c.name} ${c.surname}` : (c.company || 'Nowa Sprawa');
        document.getElementById('currentCaseLabel').innerText = label;
    }

    if (field === 'phone') {
        const btnCall = document.getElementById('btnCall');
        btnCall.href = value ? `tel:${value}` : '#';
        if(!value) btnCall.classList.add('opacity-50', 'pointer-events-none');
        else btnCall.classList.remove('opacity-50', 'pointer-events-none');
    }

    saveCases();
}

function openMap() {
    const addr = document.getElementById('caseAddress').value;
    if(addr) {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, '_blank');
    } else {
        alert("Wpisz adres.");
    }
}

function toggleTag(tagName, color) {
    if (!currentCaseId) return;
    const c = terrainCases.find(x => x.id === currentCaseId);
    if (!c) return;

    if(!c.tags) c.tags = [];

    const existing = c.tags.find(t => t.name === tagName);
    if(existing) {
        c.tags = c.tags.filter(t => t.name !== tagName);
    } else {
        c.tags.push({ name: tagName, color: color });
    }

    saveCases();
    renderTags(c.tags);
}

function renderTags(tags) {
    const container = document.getElementById('caseTagsContainer');
    if (!container) return;
    container.innerHTML = '';

    tags.forEach(t => {
        const span = document.createElement('span');
        const colorClass = `bg-${t.color}-100 text-${t.color}-700 border-${t.color}-200`;
        // Manual mapping for tailwind safe classes if not using JIT or full build
        // Assuming standard palette: red, yellow, blue, emerald(green), orange
        // Just simplified inline style for robustness if class generation fails

        span.className = `px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1`;

        // Apply colors dynamically via style to be safe or specific classes
        if(t.color === 'red') span.classList.add('bg-red-100', 'text-red-700', 'border-red-200');
        if(t.color === 'yellow') span.classList.add('bg-yellow-100', 'text-yellow-700', 'border-yellow-200');
        if(t.color === 'blue') span.classList.add('bg-blue-100', 'text-blue-700', 'border-blue-200');
        if(t.color === 'green') span.classList.add('bg-emerald-100', 'text-emerald-700', 'border-emerald-200');
        if(t.color === 'orange') span.classList.add('bg-orange-100', 'text-orange-700', 'border-orange-200');

        span.innerHTML = `${t.name} <button onclick="toggleTag('${t.name}', '${t.color}')" class="hover:text-black ml-1">&times;</button>`;
        container.appendChild(span);
    });
}

function saveCases() {
    localStorage.setItem('lex_terrain_cases', JSON.stringify(terrainCases));
}

function switchFolderTab(tabName) {
    // Hide all
    ['arrears', 'info', 'notes'].forEach(t => {
        document.getElementById(`folder-content-${t}`).classList.add('hidden');
        const btn = document.getElementById(`folder-tab-${t}`);
        btn.classList.remove('border-b-2', 'border-indigo-600', 'text-indigo-600', 'dark:text-indigo-400');
        btn.classList.add('text-slate-500', 'dark:text-slate-400');
    });

    // Show active
    document.getElementById(`folder-content-${tabName}`).classList.remove('hidden');
    const activeBtn = document.getElementById(`folder-tab-${tabName}`);
    activeBtn.classList.remove('text-slate-500', 'dark:text-slate-400');
    activeBtn.classList.add('border-b-2', 'border-indigo-600', 'text-indigo-600', 'dark:text-indigo-400');
}

// --- ARREARS AI PROCESSING ---
async function processArrearsPDF(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!currentCaseId) return;
    const c = terrainCases.find(x => x.id === currentCaseId);

    const btn = event.target.closest('label');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="animate-spin"></i> Analizuję...`;

    try {
        let textToAnalyze = "";

        if (file.type === "application/pdf") {
            const ab = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(ab).promise;
            for (let i = 1; i <= pdf.numPages; i++) {
                const p = await pdf.getPage(i);
                const txt = await p.getTextContent();
                textToAnalyze += txt.items.map(x => x.str).join(" ") + "\n";
            }
            const prompt = "To jest wyciąg zaległości w egzekucji administracyjnej. Stwórz z tego tabelę HTML (<table>...</table>) z kolumnami: Tytuł wykonawczy, Rodzaj należności, Kwota Główna, Odsetki, Koszty. Użyj stylów Tailwind CSS (w-full, text-xs, border, p-2). Zwróć TYLKO kod HTML tabeli, bez markdowna.";
            const response = await analyzeText(textToAnalyze, prompt);
            saveArrearsTable(response, c);

        } else if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result;
                const prompt = "To jest zdjęcie dokumentu z zaległościami. Stwórz tabelę HTML z kolumnami: Tytuł/Sygnatura, Kwota, Opis. Użyj Tailwind CSS. Zwróć TYLKO kod HTML.";
                const response = await analyzeImage(base64, prompt);
                saveArrearsTable(response, c);
                btn.innerHTML = originalText;
                if(window.lucide) lucide.createIcons();
            };
            return;
        }

        btn.innerHTML = originalText;
        if(window.lucide) lucide.createIcons();

    } catch (e) {
        console.error(e);
        alert("Błąd analizy: " + e.message);
        btn.innerHTML = originalText;
    }
}

function saveArrearsTable(html, caseObj) {
    // Clean
    const cleanHTML = html.replace(/```html/g, '').replace(/```/g, '').trim();
    caseObj.arrearsHTML = cleanHTML;
    saveCases();

    // Render immediately
    const arrearsContainer = document.getElementById('arrearsTableContainer');
    const emptyState = document.getElementById('arrearsEmptyState');

    arrearsContainer.innerHTML = cleanHTML;
    arrearsContainer.classList.remove('hidden');
    emptyState.classList.add('hidden');
}


// --- NOTES SECTION (GLOBAL) ---
function addTerrainNote(text) {
    const note = document.getElementById('terrainNote');
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    note.value += `[${timestamp}] ${text}\n`;
    note.scrollTop = note.scrollHeight;
}

// --- LOGISTICS SECTION ---
async function initTerrain() {
    loadBriefcase(); // Init briefcase
    loadCities();
    renderCityEditor();
    // Restore saved logistics data if any
    const saved = localStorage.getItem('lex_logistics_last');
    if (saved) {
        const data = JSON.parse(saved);
        if(data.distance) document.getElementById('logDistance').value = data.distance;
        calcLogistics();
    }

    applyTerrainLayout();
    setupCollapsiblePanels();
}

function loadCities() {
    const select = document.getElementById('logCitySelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- Wybierz lub wpisz --</option>';

    const db = getCityDB();
    const sorted = Object.keys(db).sort();

    sorted.forEach(city => {
        const opt = document.createElement('option');
        opt.value = city;
        opt.text = `${city} (${db[city]} zł)`;
        select.appendChild(opt);
    });
}

function getCityDB() {
    const raw = localStorage.getItem('lex_city_db');
    return raw ? JSON.parse(raw) : {};
}

function selectCity(cityName) {
    if (!cityName) return;
    const db = getCityDB();
    const price = db[cityName];
    if (price) {
        document.getElementById('logDistance').value = price;
        calcLogistics();
    }
}

function calcLogistics() {
    const dist = parseFloat(document.getElementById('logDistance').value) || 0;
    const cost = dist * 1;
    document.getElementById('logCost').value = cost.toFixed(2);
    localStorage.setItem('lex_logistics_last', JSON.stringify({ distance: dist }));
}

function toggleCityEditor() {
    const panel = document.getElementById('cityEditorPanel');
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        renderCityEditor();
    } else {
        panel.classList.add('hidden');
    }
}

function renderCityEditor() {
    const container = document.getElementById('cityEditorList');
    if (!container) return;
    container.innerHTML = '';

    const db = getCityDB();
    const sorted = Object.keys(db).sort();

    sorted.forEach(city => {
        const price = db[city];
        const row = document.createElement('div');
        row.className = 'flex gap-2 items-center';

        row.innerHTML = `
            <input type="text" value="${city}" class="flex-1 p-2 border rounded text-xs dark:bg-slate-700 dark:text-white" onchange="saveCityKey('${city}', this.value, null)">
            <input type="number" value="${price}" class="w-20 p-2 border rounded text-xs dark:bg-slate-700 dark:text-white" onchange="saveCityKey('${city}', null, this.value)">
            <button onclick="deleteCity('${city}')" class="p-2 text-red-500 hover:bg-red-50 rounded"><i data-lucide="trash-2" size="14"></i></button>
        `;
        container.appendChild(row);
    });

    if (window.lucide) lucide.createIcons();
}

function saveCityKey(oldKey, newKey, newPrice) {
    const db = getCityDB();
    const currentPrice = db[oldKey];

    delete db[oldKey];

    const finalKey = newKey !== null ? newKey : oldKey;
    const finalPrice = newPrice !== null ? parseFloat(newPrice) : currentPrice;

    if (finalKey) {
        db[finalKey] = finalPrice;
    }

    localStorage.setItem('lex_city_db', JSON.stringify(db));
    loadCities();
}

function deleteCity(key) {
    if(!confirm(`Czy usunąć ${key}?`)) return;
    const db = getCityDB();
    delete db[key];
    localStorage.setItem('lex_city_db', JSON.stringify(db));
    renderCityEditor();
    loadCities();
}

function addNewCity() {
    const db = getCityDB();
    const newName = "Nowa Miejscowość " + Math.floor(Math.random() * 1000);
    db[newName] = 0;
    localStorage.setItem('lex_city_db', JSON.stringify(db));
    renderCityEditor();
    loadCities();
}

async function importLogisticsFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const btn = event.target.parentElement.querySelector('span');
    const originalText = btn.innerText;
    btn.innerText = "Analizuję (AI)...";

    try {
        let textToAnalyze = "";

        if (file.type === "application/pdf") {
            const ab = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(ab).promise;
            for (let i = 1; i <= pdf.numPages; i++) {
                const p = await pdf.getPage(i);
                const c = await p.getTextContent();
                textToAnalyze += c.items.map(x => x.str).join(" ") + "\n";
            }
            const prompt = "Wydobądź listę miejscowości i cen (ryczałtów) z tego tekstu. Zwróć TYLKO czysty JSON w formacie: {\"Miasto\": 50, \"Miasto2\": 120}.";
            const response = await analyzeText(textToAnalyze, prompt);
            await parseAndSaveCities(response);

        } else if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result;
                const prompt = "To jest zdjęcie cennika/wykazu miejscowości. Wydobądź pary Miejscowość - Cena. Zwróć TYLKO czysty JSON: {\"Miasto\": 50}.";
                const response = await analyzeImage(base64, prompt);
                await parseAndSaveCities(response);
                btn.innerText = originalText;
            };
            return;
        }

        btn.innerText = originalText;

    } catch (e) {
        console.error(e);
        alert("Błąd importu: " + e.message);
        btn.innerText = originalText;
    }
}

async function parseAndSaveCities(jsonString) {
    try {
        const clean = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
        const newCities = JSON.parse(clean);

        const currentDB = getCityDB();
        const updatedDB = { ...currentDB, ...newCities };

        localStorage.setItem('lex_city_db', JSON.stringify(updatedDB));
        loadCities();
        if(document.getElementById('cityEditorPanel') && !document.getElementById('cityEditorPanel').classList.contains('hidden')) {
            renderCityEditor();
        }
        alert(`Zaimportowano ${Object.keys(newCities).length} miejscowości!`);
    } catch (e) {
        throw new Error("Nie udało się odczytać JSON od AI. Spróbuj ponownie.");
    }
}

// --- CASH SECTION ---
function calcCash() {
    let total = 0;
    const inputs = document.querySelectorAll('.cash-input');
    inputs.forEach(inp => {
        const count = parseFloat(inp.value) || 0;
        const nom = parseFloat(inp.dataset.nom);
        const subtotal = count * nom;

        // Update individual row value display (e.g., id="val-200")
        const valDisplay = document.getElementById(`val-${inp.dataset.nom}`);
        if(valDisplay) {
            valDisplay.innerText = subtotal.toFixed(2);
        }

        total += subtotal;
    });
    document.getElementById('cashTotal').innerText = total.toFixed(2) + " zł";
}

function copyCashTotal() {
    const txt = document.getElementById('cashTotal').innerText;
    navigator.clipboard.writeText(txt).then(() => alert("Skopiowano kwotę!"));
}

function copyCashDetails() {
    let report = "WYLICZENIE GOTÓWKI:\n";
    const inputs = document.querySelectorAll('.cash-input');
    inputs.forEach(inp => {
        const count = parseInt(inp.value) || 0;
        if(count > 0) {
            const nom = inp.dataset.nom;
            const label = nom === '1' ? 'Bilon' : nom + ' zł';
            report += `${label} x ${count} = ${(count * parseFloat(nom)).toFixed(2)} zł\n`;
        }
    });
    report += `\nRAZEM: ${document.getElementById('cashTotal').innerText}`;
    navigator.clipboard.writeText(report).then(() => alert("Skopiowano szczegóły!"));
}

// --- SCANNER SECTION ---
function startScanner() {
    if (html5QrCode) {
        stopScanner();
    }

    document.getElementById('scannerPlaceholder').style.display = 'none';
    document.getElementById('btnStartScan').classList.add('hidden');
    document.getElementById('btnStopScan').classList.remove('hidden');

    html5QrCode = new Html5Qrcode("qr-reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess)
    .catch(err => {
        alert("Błąd kamery: " + err);
        stopScanner();
    });
}

function stopScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
            html5QrCode = null;
        }).catch(err => console.log(err));
    }
    document.getElementById('scannerPlaceholder').style.display = 'flex';
    document.getElementById('btnStartScan').classList.remove('hidden');
    document.getElementById('btnStopScan').classList.add('hidden');
}

function onScanSuccess(decodedText, decodedResult) {
    document.getElementById('scanInput').value = decodedText;
    stopScanner();
    if(navigator.vibrate) navigator.vibrate(200);
}

function searchExternal(site) {
    const query = document.getElementById('scanInput').value;
    if (!query) return alert("Wpisz nazwę przedmiotu lub kod.");

    let url = "";
    if (site === 'allegro') url = `https://allegro.pl/listing?string=${encodeURIComponent(query)}`;
    if (site === 'olx') url = `https://www.olx.pl/oferty/q-${encodeURIComponent(query)}/`;

    window.open(url, '_blank');
}

// --- TERRAIN LAYOUT CUSTOMIZATION ---
let terrainSortable = null;
let isTerrainEditMode = false;

function toggleTerrainEditMode() {
    isTerrainEditMode = !isTerrainEditMode;
    const panelsContainer = document.getElementById('terrain-panels');
    const btn = document.getElementById('edit-terrain-btn');

    if (isTerrainEditMode) {
        btn.innerHTML = '<i data-lucide="check" class="inline-block mr-2"></i> Zapisz układ';
        btn.classList.add('bg-green-500', 'text-white');
        panelsContainer.classList.add('edit-mode');

        terrainSortable = new Sortable(panelsContainer, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            handle: '.collapsible-header',
            onEnd: function (evt) {
                const order = Array.from(panelsContainer.children).map(item => item.dataset.panelId);
                localStorage.setItem('terrainPanelOrder', JSON.stringify(order));
            }
        });
    } else {
        btn.innerHTML = '<i data-lucide="move" class="inline-block mr-2"></i> Edytuj układ';
        btn.classList.remove('bg-green-500', 'text-white');
        panelsContainer.classList.remove('edit-mode');
        terrainSortable.destroy();
        terrainSortable = null;
    }
    lucide.createIcons();
}

function setupCollapsiblePanels() {
    document.querySelectorAll('.collapsible-header').forEach(header => {
        header.addEventListener('click', () => {
            if (isTerrainEditMode) return; // Disable collapse in edit mode

            const content = header.nextElementSibling;
            const panelId = header.closest('.sortable-item').dataset.panelId;
            const isCollapsed = content.classList.toggle('hidden');
            header.querySelector('.chevron-icon').classList.toggle('rotate-180', isCollapsed);

            // Save state
            const collapsedState = JSON.parse(localStorage.getItem('terrainPanelState')) || {};
            collapsedState[panelId] = isCollapsed;
            localStorage.setItem('terrainPanelState', JSON.stringify(collapsedState));
        });
    });
}

function applyTerrainLayout() {
    // Apply order
    const savedOrder = JSON.parse(localStorage.getItem('terrainPanelOrder'));
    if (savedOrder) {
        const panelsContainer = document.getElementById('terrain-panels');
        const items = Array.from(panelsContainer.children);
        const sortedItems = savedOrder.map(id => items.find(item => item.dataset.panelId === id));

        sortedItems.forEach(item => {
            if(item) panelsContainer.appendChild(item);
        });
    }

    // Apply collapsed state
    const collapsedState = JSON.parse(localStorage.getItem('terrainPanelState')) || {};
    Object.keys(collapsedState).forEach(panelId => {
        const panel = document.querySelector(`[data-panel-id="${panelId}"]`);
        if (panel && collapsedState[panelId]) {
            panel.querySelector('.collapsible-content').classList.add('hidden');
            panel.querySelector('.chevron-icon').classList.add('rotate-180');
        }
    });
}

// --- AGGREGATE REPORT ---
function copyTerrainReport() {
    const date = new Date().toLocaleDateString();
    const note = document.getElementById('terrainNote').value.trim();
    const distance = document.getElementById('logDistance').value;
    const cost = document.getElementById('logCost').value;
    const cash = document.getElementById('cashTotal').innerText;
    const item = document.getElementById('scanInput').value;

    const report = `RAPORT TERENOWY - ${date}
--------------------------------
1. NOTATKA:
${note || "Brak"}

2. LOGISTYKA:
Dystans: ${distance} km
Koszt przejazdu: ${cost} PLN

3. GOTÓWKA:
Pobrana kwota: ${cash}

4. PRZEDMIOTY (Ostatni skan):
${item || "Brak"}
--------------------------------
Wygenerowano w EgzeBiurko (Field Mode)`;

    navigator.clipboard.writeText(report).then(() => {
        alert("Raport skopiowany do schowka!");
    }).catch(err => {
        console.error(err);
        alert("Błąd schowka (nieobsługiwane w iframe/file protocol?)");
    });
}

async function synchronizeData() {
    try {
        const terrainCasesRaw = localStorage.getItem('lex_terrain_cases');
        const terrainCases = terrainCasesRaw ? JSON.parse(terrainCasesRaw) : [];
        const dbCases = await state.db.getAll('cases');

        let newCount = 0, modifiedCount = 0, conflictCount = 0, syncedFromDB = 0;

        const dbCasesByTerrainId = new Map(dbCases.filter(c => c.terrainId).map(c => [c.terrainId, c]));

        // --- Sync from Terrain to DB ---
        for (const tCase of terrainCases) {
            const now = new Date().toISOString();

            if (tCase.syncStatus === 'new') {
                const newDbCase = {
                    no: `TEREN-${tCase.id.slice(-4)}`,
                    date: now.slice(0, 10),
                    debtor: `${tCase.name} ${tCase.surname}`.trim() || tCase.company,
                    note: `[TEREN] Adres: ${tCase.address}\nTelefon: ${tCase.phone}\nPESEL/NIP: ${tCase.pesel}\nNotatki: ${tCase.notes}`,
                    urgent: tCase.tags.some(t => t.name === 'Pilne'),
                    favorite: false, archived: false,
                    terrainId: tCase.id,
                    lastModified: now
                };
                await state.db.add('cases', newDbCase);
                tCase.syncStatus = 'synced';
                tCase.lastModified = now;
                newCount++;
            } else if (tCase.syncStatus === 'modified') {
                const dbCase = dbCasesByTerrainId.get(tCase.id);
                if (dbCase) {
                    const tDate = new Date(tCase.lastModified);
                    const dbDate = new Date(dbCase.lastModified);

                    // Conflict detection (if DB is newer by more than a few seconds)
                    if (dbDate > tDate && (dbDate - tDate > 2000)) {
                        conflictCount++;
                        if (confirm(`Konflikt! Sprawa "${dbCase.debtor}" została zmieniona w obu miejscach.\n\nNaciśnij OK, aby zachować wersję z terenu (nadpisze zmiany w biurze).\nNaciśnij Anuluj, aby zachować wersję z biura (nadpisze zmiany w terenie).`)) {
                            // Keep terrain version
                            dbCase.debtor = `${tCase.name} ${tCase.surname}`.trim() || tCase.company;
                            dbCase.note = `[TEREN] Adres: ${tCase.address}\nTelefon: ${tCase.phone}\nPESEL/NIP: ${tCase.pesel}\nNotatki: ${tCase.notes}`;
                            dbCase.urgent = tCase.tags.some(t => t.name === 'Pilne');
                            dbCase.lastModified = now;
                            await state.db.put('cases', dbCase);
                            tCase.syncStatus = 'synced';
                            tCase.lastModified = now;
                            modifiedCount++;
                        } else {
                            // Keep DB version - update terrain case
                            tCase.name = dbCase.debtor.split(' ')[0] || '';
                            tCase.surname = dbCase.debtor.split(' ').slice(1).join(' ') || '';
                            tCase.notes = dbCase.note;
                            tCase.tags = dbCase.urgent ? [{ name: 'Pilne', color: 'orange' }] : [];
                            tCase.syncStatus = 'synced';
                            tCase.lastModified = dbCase.lastModified;
                        }
                    } else {
                        // No conflict, just update DB
                        dbCase.debtor = `${tCase.name} ${tCase.surname}`.trim() || tCase.company;
                        dbCase.note = `[TEREN] Adres: ${tCase.address}\nTelefon: ${tCase.phone}\nPESEL/NIP: ${tCase.pesel}\nNotatki: ${tCase.notes}`;
                        dbCase.urgent = tCase.tags.some(t => t.name === 'Pilne');
                        dbCase.lastModified = now;
                        await state.db.put('cases', dbCase);
                        tCase.syncStatus = 'synced';
                        tCase.lastModified = now;
                        modifiedCount++;
                    }
                }
            }
        }

        // --- Sync from DB to Terrain ---
        for (const dbCase of dbCases) {
            // Check if a terrain case already exists that is linked to this dbCase
            const existingTCase = terrainCases.find(t => t.terrainId === dbCase.id.toString());

            if (!existingTCase) {
                const newTCase = {
                    id: `DB-${dbCase.id}-${Date.now()}`, // More unique ID
                    terrainId: dbCase.id.toString(),      // Link to the original DB record
                    name: (dbCase.debtor || '').split(' ')[0],
                    surname: (dbCase.debtor || '').split(' ').slice(1).join(' '),
                    company: '', // DB schema doesn't have this
                    address: '', // DB schema doesn't have this
                    phone: '', // DB schema doesn't have this
                    pesel: '', // DB schema doesn't have this
                    debtAmount: '', // DB schema doesn't have this
                    notes: dbCase.note || '',
                    tags: dbCase.urgent ? [{ name: 'Pilne', color: 'orange' }] : [],
                    syncStatus: 'synced',
                    lastModified: dbCase.lastModified
                };
                terrainCases.push(newTCase);
                syncedFromDB++;
            }
        }

        localStorage.setItem('lex_terrain_cases', JSON.stringify(terrainCases));
        alert(`Synchronizacja zakończona!\n\n- Nowe sprawy (teren -> biuro): ${newCount}\n- Zaktualizowane sprawy (teren -> biuro): ${modifiedCount}\n- Nowe sprawy (biuro -> teren): ${syncedFromDB}\n- Wykryte konflikty: ${conflictCount}`);

        renderBriefcase(); // Refresh the view with new statuses
        if (window.renderFullTracker) renderFullTracker(); // Refresh tracker if visible

    } catch (error) {
        console.error("Synchronization failed:", error);
        alert("Błąd synchronizacji: " + error.message);
    }
}

// --- MODULE EXPORT ---
window.terrainModule = {
    initTerrain,
    synchronizeData,
    switchFolderTab,
    addTerrainNote,
    selectCity,
    toggleCityEditor,
    addNewCity,
    saveCityKey,
    deleteCity,
    importLogisticsFile,
    calcCash,
    copyCashTotal,
    copyCashDetails,
    startScanner,
    stopScanner,
    searchExternal,
    copyTerrainReport,
    calcLogistics,
    addNewCase,
    deleteCase,
    openCase,
    closeCase,
    updateCaseData,
    processArrearsPDF,
    openMap,
    toggleTag,
    toggleTerrainEditMode
};
