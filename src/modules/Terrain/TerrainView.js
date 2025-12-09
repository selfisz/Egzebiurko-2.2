/**
 * Terrain View - Field Mode UI
 */

import store from '../../store/index.js';
import TerrainStore from './TerrainStore.js';

class TerrainView {
    constructor() {
        this.briefcaseList = null;
        this.briefcaseGrid = null;
        this.briefcaseDetail = null;
        this.currentCaseId = null;
    }

    /**
     * Initialize Terrain View
     */
    init() {
        console.log('[TerrainView] Initializing...');
        
        // Get DOM elements
        this.briefcaseList = document.getElementById('briefcase-list');
        this.briefcaseGrid = document.getElementById('briefcase-grid');
        this.briefcaseDetail = document.getElementById('briefcase-detail');

        // Setup event listeners
        this.setupEventListeners();
        
        // Subscribe to store changes
        this.setupStoreSubscriptions();
        
        // Load initial data
        this.loadInitialData();
        
        console.log('[TerrainView] Initialized successfully');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Case form fields
        const fields = [
            { id: 'caseName', field: 'name' },
            { id: 'caseSurname', field: 'surname' },
            { id: 'caseCompany', field: 'company' },
            { id: 'caseAddress', field: 'address' },
            { id: 'casePhone', field: 'phone' },
            { id: 'casePesel', field: 'pesel' },
            { id: 'caseNotes', field: 'notes' },
            { id: 'caseDebt', field: 'debtAmount' }
        ];

        fields.forEach(({ id, field }) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', (e) => {
                    this.updateCaseData(field, e.target.value);
                });
            }
        });
    }

    /**
     * Setup store subscriptions
     */
    setupStoreSubscriptions() {
        // Subscribe to terrain cases
        store.subscribe('terrainCases', (cases) => {
            this.renderBriefcase(cases);
        });

        // Subscribe to current case
        store.subscribe('currentTerrainCaseId', (caseId) => {
            this.currentCaseId = caseId;
        });
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            await TerrainStore.load();
            this.renderBriefcase(store.get('terrainCases'));
            this.loadCities();
            
            // Restore saved logistics data
            const saved = localStorage.getItem('lex_logistics_last');
            if (saved) {
                const data = JSON.parse(saved);
                const logDistance = document.getElementById('logDistance');
                if (data.distance && logDistance) logDistance.value = data.distance;
                this.calcLogistics();
            }
        } catch (error) {
            console.error('[TerrainView] Load initial data error:', error);
        }
    }

    /**
     * Render briefcase (list of terrain cases)
     */
    renderBriefcase(cases) {
        if (!this.briefcaseList) return;

        this.briefcaseList.innerHTML = '';

        if (!cases || cases.length === 0) {
            this.briefcaseList.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-12 text-center">
                    <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <i data-lucide="folder" size="28" class="text-slate-300 dark:text-slate-600"></i>
                    </div>
                    <h3 class="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">Brak spraw terenowych</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Dodaj nową sprawę, aby rozpocząć</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        cases.forEach(c => {
            const div = document.createElement('div');
            div.className = "flex flex-col p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all group relative shadow-sm h-40 justify-between";
            div.onclick = () => this.openCase(c.id);

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

                <button onclick="event.stopPropagation(); terrainView.deleteCase('${c.id}')" class="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                    <i data-lucide="x" size="14"></i>
                </button>
            `;
            this.briefcaseList.appendChild(div);
        });

        if (window.lucide) lucide.createIcons();
    }

    /**
     * Add new case
     */
    async addNewCase() {
        try {
            await TerrainStore.add();
        } catch (error) {
            console.error('[TerrainView] Add case error:', error);
        }
    }

    /**
     * Open case
     */
    async openCase(id) {
        try {
            await TerrainStore.open(id);
            this.populateCaseFields(id);
        } catch (error) {
            console.error('[TerrainView] Open case error:', error);
        }
    }

    /**
     * Close case
     */
    async closeCase() {
        try {
            await TerrainStore.close();
        } catch (error) {
            console.error('[TerrainView] Close case error:', error);
        }
    }

    /**
     * Delete case
     */
    async deleteCase(id) {
        try {
            if (!confirm('Czy na pewno usunąć te akta?')) return;
            await TerrainStore.delete(id);
        } catch (error) {
            console.error('[TerrainView] Delete case error:', error);
        }
    }

    /**
     * Update case data
     */
    async updateCaseData(field, value) {
        try {
            if (!this.currentCaseId) return;
            await TerrainStore.update(this.currentCaseId, { [field]: value });
            
            // Update UI elements
            if (field === 'name' || field === 'surname' || field === 'company') {
                const c = TerrainStore.getCurrentCase();
                if (c) {
                    const label = (c.name || c.surname) ? `${c.name} ${c.surname}` : (c.company || 'Nowa Sprawa');
                    const labelEl = document.getElementById('currentCaseLabel');
                    if (labelEl) labelEl.innerText = label;
                }
            }

            if (field === 'phone') {
                const btnCall = document.getElementById('btnCall');
                if (btnCall) {
                    btnCall.href = value ? `tel:${value}` : '#';
                    if (!value) btnCall.classList.add('opacity-50', 'pointer-events-none');
                    else btnCall.classList.remove('opacity-50', 'pointer-events-none');
                }
            }
        } catch (error) {
            console.error('[TerrainView] Update case error:', error);
        }
    }

    /**
     * Populate case fields
     */
    populateCaseFields(id) {
        const c = store.get('terrainCases').find(x => x.id === id);
        if (!c) return;

        const fields = [
            { id: 'caseName', value: c.name || '' },
            { id: 'caseSurname', value: c.surname || '' },
            { id: 'caseCompany', value: c.company || '' },
            { id: 'caseAddress', value: c.address || '' },
            { id: 'casePhone', value: c.phone || '' },
            { id: 'casePesel', value: c.pesel || '' },
            { id: 'caseNotes', value: c.notes || '' },
            { id: 'caseDebt', value: c.debtAmount || '' }
        ];

        fields.forEach(({ id, value }) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });

        // Update call button
        const btnCall = document.getElementById('btnCall');
        if (btnCall) {
            btnCall.href = c.phone ? `tel:${c.phone}` : '#';
            if (!c.phone) btnCall.classList.add('opacity-50', 'pointer-events-none');
            else btnCall.classList.remove('opacity-50', 'pointer-events-none');
        }

        // Label
        const label = (c.name || c.surname) ? `${c.name} ${c.surname}` : (c.company || 'Nowa Sprawa');
        const labelEl = document.getElementById('currentCaseLabel');
        if (labelEl) labelEl.innerText = label;

        // Render tags
        this.renderTags(c.tags || []);

        // Arrears tab
        const arrearsContainer = document.getElementById('arrearsTableContainer');
        const emptyState = document.getElementById('arrearsEmptyState');
        if (c.arrearsHTML) {
            if (arrearsContainer) {
                arrearsContainer.innerHTML = c.arrearsHTML;
                arrearsContainer.classList.remove('hidden');
            }
            if (emptyState) emptyState.classList.add('hidden');
        } else {
            if (arrearsContainer) {
                arrearsContainer.innerHTML = '';
                arrearsContainer.classList.add('hidden');
            }
            if (emptyState) emptyState.classList.remove('hidden');
        }
    }

    /**
     * Render tags
     */
    renderTags(tags) {
        const container = document.getElementById('caseTagsContainer');
        if (!container) return;
        container.innerHTML = '';

        tags.forEach(t => {
            const span = document.createElement('span');
            span.className = `px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1`;

            if (t.color === 'red') span.classList.add('bg-red-100', 'text-red-700', 'border-red-200');
            if (t.color === 'yellow') span.classList.add('bg-yellow-100', 'text-yellow-700', 'border-yellow-200');
            if (t.color === 'blue') span.classList.add('bg-blue-100', 'text-blue-700', 'border-blue-200');
            if (t.color === 'green') span.classList.add('bg-emerald-100', 'text-emerald-700', 'border-emerald-200');
            if (t.color === 'orange') span.classList.add('bg-orange-100', 'text-orange-700', 'border-orange-200');

            span.innerHTML = `${t.name} <button onclick="terrainView.toggleTag('${t.name}', '${t.color}')" class="hover:text-black ml-1">&times;</button>`;
            container.appendChild(span);
        });
    }

    /**
     * Toggle tag
     */
    async toggleTag(tagName, color) {
        try {
            if (!this.currentCaseId) return;
            const c = TerrainStore.getCurrentCase();
            if (!c) return;

            if (!c.tags) c.tags = [];

            const existing = c.tags.find(t => t.name === tagName);
            if (existing) {
                c.tags = c.tags.filter(t => t.name !== tagName);
            } else {
                c.tags.push({ name: tagName, color: color });
            }

            await TerrainStore.update(this.currentCaseId, { tags: c.tags });
            this.renderTags(c.tags);
        } catch (error) {
            console.error('[TerrainView] Toggle tag error:', error);
        }
    }

    /**
     * Open map
     */
    openMap() {
        const addr = document.getElementById('caseAddress')?.value;
        if (addr) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, '_blank');
        } else {
            alert('Wpisz adres.');
        }
    }

    /**
     * Start QR Scanner
     */
    async startScanner() {
        try {
            await TerrainStore.startQRScanner();
            const btnStart = document.getElementById('btnStartScan');
            const btnStop = document.getElementById('btnStopScan');
            const placeholder = document.getElementById('scannerPlaceholder');
            
            if (btnStart) btnStart.classList.add('hidden');
            if (btnStop) btnStop.classList.remove('hidden');
            if (placeholder) placeholder.classList.add('hidden');
        } catch (error) {
            console.error('[TerrainView] Start scanner error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd uruchamiania skanera QR'
            });
        }
    }

    /**
     * Stop QR Scanner
     */
    async stopScanner() {
        try {
            await TerrainStore.stopQRScanner();
            const btnStart = document.getElementById('btnStartScan');
            const btnStop = document.getElementById('btnStopScan');
            const placeholder = document.getElementById('scannerPlaceholder');
            
            if (btnStart) btnStart.classList.remove('hidden');
            if (btnStop) btnStop.classList.add('hidden');
            if (placeholder) placeholder.classList.remove('hidden');
        } catch (error) {
            console.error('[TerrainView] Stop scanner error:', error);
        }
    }

    /**
     * Synchronize with main DB
     */
    async synchronizeData() {
        try {
            const count = await TerrainStore.sync();
            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: `Zsynchronizowano ${count} spraw`
            });
        } catch (error) {
            console.error('[TerrainView] Sync error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd synchronizacji'
            });
        }
    }

    /**
     * Switch folder tab (arrears/info/notes)
     */
    switchFolderTab(tabName) {
        ['arrears', 'info', 'notes'].forEach(t => {
            const content = document.getElementById(`folder-content-${t}`);
            const btn = document.getElementById(`folder-tab-${t}`);
            if (content) content.classList.add('hidden');
            if (btn) {
                btn.classList.remove('border-b-2', 'border-indigo-600', 'text-indigo-600', 'dark:text-indigo-400');
                btn.classList.add('text-slate-500', 'dark:text-slate-400');
            }
        });

        const activeContent = document.getElementById(`folder-content-${tabName}`);
        const activeBtn = document.getElementById(`folder-tab-${tabName}`);
        if (activeContent) activeContent.classList.remove('hidden');
        if (activeBtn) {
            activeBtn.classList.remove('text-slate-500', 'dark:text-slate-400');
            activeBtn.classList.add('border-b-2', 'border-indigo-600', 'text-indigo-600', 'dark:text-indigo-400');
        }
    }

    /**
     * Add terrain note
     */
    addTerrainNote(text) {
        const note = document.getElementById('terrainNote');
        if (!note) return;
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        note.value += `[${timestamp}] ${text}\n`;
        note.scrollTop = note.scrollHeight;
    }

    /**
     * Calculate cash
     */
    calcCash() {
        let total = 0;
        const inputs = document.querySelectorAll('.cash-input');
        inputs.forEach(inp => {
            const count = parseFloat(inp.value) || 0;
            const nom = parseFloat(inp.dataset.nom);
            const subtotal = count * nom;

            const valDisplay = document.getElementById(`val-${inp.dataset.nom}`);
            if (valDisplay) valDisplay.innerText = subtotal.toFixed(2);

            total += subtotal;
        });
        const cashTotal = document.getElementById('cashTotal');
        if (cashTotal) cashTotal.innerText = total.toFixed(2) + " zł";
    }

    /**
     * Copy cash total
     */
    copyCashTotal() {
        const txt = document.getElementById('cashTotal')?.innerText;
        if (txt) {
            navigator.clipboard.writeText(txt).then(() => alert("Skopiowano kwotę!"));
        }
    }

    /**
     * Copy cash details
     */
    copyCashDetails() {
        let report = "WYLICZENIE GOTÓWKI:\n";
        const inputs = document.querySelectorAll('.cash-input');
        inputs.forEach(inp => {
            const count = parseInt(inp.value) || 0;
            if (count > 0) {
                const nom = inp.dataset.nom;
                const label = nom === '1' ? 'Bilon' : nom + ' zł';
                report += `${label} x ${count} = ${(count * parseFloat(nom)).toFixed(2)} zł\n`;
            }
        });
        report += `\nRAZEM: ${document.getElementById('cashTotal')?.innerText}`;
        navigator.clipboard.writeText(report).then(() => alert("Skopiowano szczegóły!"));
    }

    /**
     * Calculate logistics
     */
    calcLogistics() {
        const dist = parseFloat(document.getElementById('logDistance')?.value) || 0;
        const cost = dist * 1;
        const logCost = document.getElementById('logCost');
        if (logCost) logCost.value = cost.toFixed(2);
        localStorage.setItem('lex_logistics_last', JSON.stringify({ distance: dist }));
    }

    /**
     * Select city
     */
    selectCity(cityName) {
        if (!cityName) return;
        const db = this.getCityDB();
        const price = db[cityName];
        if (price) {
            const logDistance = document.getElementById('logDistance');
            if (logDistance) logDistance.value = price;
            this.calcLogistics();
        }
    }

    /**
     * Get city database
     */
    getCityDB() {
        const raw = localStorage.getItem('lex_city_db');
        return raw ? JSON.parse(raw) : {};
    }

    /**
     * Toggle city editor
     */
    toggleCityEditor() {
        const panel = document.getElementById('cityEditorPanel');
        if (!panel) return;
        if (panel.classList.contains('hidden')) {
            panel.classList.remove('hidden');
            this.renderCityEditor();
        } else {
            panel.classList.add('hidden');
        }
    }

    /**
     * Render city editor
     */
    renderCityEditor() {
        const container = document.getElementById('cityEditorList');
        if (!container) return;
        container.innerHTML = '';

        const db = this.getCityDB();
        const sorted = Object.keys(db).sort();

        sorted.forEach(city => {
            const price = db[city];
            const row = document.createElement('div');
            row.className = 'flex gap-2 items-center';

            row.innerHTML = `
                <input type="text" value="${city}" class="flex-1 p-2 border rounded text-xs dark:bg-slate-700 dark:text-white" onchange="terrainView.saveCityKey('${city}', this.value, null)">
                <input type="number" value="${price}" class="w-20 p-2 border rounded text-xs dark:bg-slate-700 dark:text-white" onchange="terrainView.saveCityKey('${city}', null, this.value)">
                <button onclick="terrainView.deleteCity('${city}')" class="p-2 text-red-500 hover:bg-red-50 rounded"><i data-lucide="trash-2" size="14"></i></button>
            `;
            container.appendChild(row);
        });

        if (window.lucide) lucide.createIcons();
    }

    /**
     * Save city key
     */
    saveCityKey(oldKey, newKey, newPrice) {
        const db = this.getCityDB();
        const currentPrice = db[oldKey];

        delete db[oldKey];

        const finalKey = newKey !== null ? newKey : oldKey;
        const finalPrice = newPrice !== null ? parseFloat(newPrice) : currentPrice;

        if (finalKey) {
            db[finalKey] = finalPrice;
        }

        localStorage.setItem('lex_city_db', JSON.stringify(db));
        this.loadCities();
    }

    /**
     * Delete city
     */
    deleteCity(key) {
        if (!confirm(`Czy usunąć ${key}?`)) return;
        const db = this.getCityDB();
        delete db[key];
        localStorage.setItem('lex_city_db', JSON.stringify(db));
        this.renderCityEditor();
        this.loadCities();
    }

    /**
     * Add new city
     */
    addNewCity() {
        const db = this.getCityDB();
        const newName = "Nowa Miejscowość " + Math.floor(Math.random() * 1000);
        db[newName] = 0;
        localStorage.setItem('lex_city_db', JSON.stringify(db));
        this.renderCityEditor();
        this.loadCities();
    }

    /**
     * Load cities
     */
    loadCities() {
        const select = document.getElementById('logCitySelect');
        if (!select) return;
        select.innerHTML = '<option value="">-- Wybierz lub wpisz --</option>';

        const db = this.getCityDB();
        const sorted = Object.keys(db).sort();

        sorted.forEach(city => {
            const opt = document.createElement('option');
            opt.value = city;
            opt.text = `${city} (${db[city]} zł)`;
            select.appendChild(opt);
        });
    }

    /**
     * Search external (Allegro/OLX)
     */
    searchExternal(site) {
        const query = document.getElementById('scanInput')?.value;
        if (!query) return alert("Wpisz nazwę przedmiotu lub kod.");

        let url = "";
        if (site === 'allegro') url = `https://allegro.pl/listing?string=${encodeURIComponent(query)}`;
        if (site === 'olx') url = `https://www.olx.pl/oferty/q-${encodeURIComponent(query)}/`;

        window.open(url, '_blank');
    }

    /**
     * Copy terrain report
     */
    copyTerrainReport() {
        const date = new Date().toLocaleDateString();
        const note = document.getElementById('terrainNote')?.value.trim();
        const distance = document.getElementById('logDistance')?.value;
        const cost = document.getElementById('logCost')?.value;
        const cash = document.getElementById('cashTotal')?.innerText;
        const item = document.getElementById('scanInput')?.value;

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
            alert("Błąd schowka");
        });
    }

    /**
     * Process arrears PDF
     */
    async processArrearsPDF(event) {
        const file = event.target.files[0];
        if (!file || !this.currentCaseId) return;

        const c = TerrainStore.getCurrentCase();
        if (!c) return;

        const btn = event.target.closest('label');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="loader-2" class="animate-spin"></i> Analizuję...`;

        try {
            // This would require AI integration - placeholder for now
            alert("Funkcja analizy PDF wymaga integracji z AI (Gemini/GPT)");
            btn.innerHTML = originalText;
        } catch (e) {
            console.error(e);
            alert("Błąd analizy: " + e.message);
            btn.innerHTML = originalText;
        }
    }

    /**
     * Import logistics file
     */
    async importLogisticsFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        alert("Funkcja importu cennika wymaga integracji z AI (Gemini/GPT)");
    }

    /**
     * Toggle terrain edit mode
     */
    toggleTerrainEditMode() {
        // Placeholder - would require Sortable.js integration
        alert("Funkcja edycji układu wymaga biblioteki Sortable.js");
    }

    /**
     * Destroy view
     */
    destroy() {
        console.log('[TerrainView] Destroying...');
        this.briefcaseList = null;
        this.briefcaseGrid = null;
        this.briefcaseDetail = null;
        this.currentCaseId = null;
    }
}

// Create and export singleton instance
const terrainView = new TerrainView();

export default terrainView;
