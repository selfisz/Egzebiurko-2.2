/**
 * Cars View - UI Management for Garage Module
 */

import store from '../../store/index.js';
import CarsStore from './CarsStore.js';

class CarsView {
    constructor() {
        this.elements = {};
        this.activeCar = null;
        this.unsubscribe = null;
    }

    /**
     * Initialize the view
     */
    init() {
        this.setupElements();
        this.setupEventListeners();
        this.subscribe();
        this.render();
        
        console.log('[CarsView] Initialized');
    }

    /**
     * Setup DOM element references
     */
    setupElements() {
        this.elements = {
            container: document.getElementById('carsContainer'),
            list: document.getElementById('garageList'),
            addBtn: document.getElementById('addCarBtn'),
            
            // Add Car Modal
            addModal: document.getElementById('addCarModal'),
            addForm: {
                make: document.getElementById('acMake'),
                model: document.getElementById('acModel'),
                year: document.getElementById('acYear'),
                plate: document.getElementById('acPlate'),
                vin: document.getElementById('acVin'),
                caseNumber: document.getElementById('acCase'),
                forfeiture: document.getElementById('acForfeit'),
                value: document.getElementById('acValue'),
                status: document.getElementById('acStatus'),
                date: document.getElementById('acDate'),
                files: document.getElementById('acFiles'),
                // Valuation helpers
                p1: document.getElementById('acP1'),
                p2: document.getElementById('acP2'),
                p3: document.getElementById('acP3'),
                damaged: document.getElementById('acBad')
            },
            saveNewBtn: document.getElementById('saveNewCarBtn'),
            closeAddBtn: document.getElementById('closeAddCarBtn'),
            
            // Car Details Modal
            detailsModal: document.getElementById('carDetailsModal'),
            detailsForm: {
                id: document.getElementById('cdId'),
                make: document.getElementById('cdMake'),
                model: document.getElementById('cdModel'),
                year: document.getElementById('cdYear'),
                plate: document.getElementById('cdPlate'),
                vin: document.getElementById('cdVin'),
                caseNumber: document.getElementById('cdCase'),
                forfeiture: document.getElementById('cdForfeit'),
                value: document.getElementById('cdValue'),
                status: document.getElementById('cdStatus'),
                callPrice: document.getElementById('cdCallPrice'),
                checklistA: document.getElementById('checklistA'),
                checklistB: document.getElementById('checklistB'),
                checklistOther: document.getElementById('chk_other'),
                checklistOtherText: document.getElementById('checklistOtherText')
            },
            saveDetailsBtn: document.getElementById('saveCarDetailsBtn'),
            closeDetailsBtn: document.getElementById('closeCarDetailsBtn')
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add Car button
        if (this.elements.addBtn) {
            this.elements.addBtn.addEventListener('click', () => this.openAddCarModal());
        }

        // Add Car Modal
        if (this.elements.saveNewBtn) {
            this.elements.saveNewBtn.addEventListener('click', () => this.saveNewCar());
        }
        if (this.elements.closeAddBtn) {
            this.elements.closeAddBtn.addEventListener('click', () => this.closeAddCarModal());
        }

        // Car Details Modal
        if (this.elements.saveDetailsBtn) {
            this.elements.saveDetailsBtn.addEventListener('click', () => this.saveCarDetails());
        }
        if (this.elements.closeDetailsBtn) {
            this.elements.closeDetailsBtn.addEventListener('click', () => this.closeDetailsModal());
        }

        // Valuation calculator in Add Modal
        if (this.elements.addForm.p1) {
            ['p1', 'p2', 'p3', 'damaged'].forEach(field => {
                const el = this.elements.addForm[field];
                if (el) {
                    el.addEventListener('input', () => this.calculateModalValuation());
                }
            });
        }

        // Status change in Details Modal
        if (this.elements.detailsForm.status) {
            this.elements.detailsForm.status.addEventListener('change', () => this.updateCarValuation());
        }
        if (this.elements.detailsForm.value) {
            this.elements.detailsForm.value.addEventListener('input', () => this.updateCarValuation());
        }

        // Checklist "Other" toggle
        if (this.elements.detailsForm.checklistOther) {
            this.elements.detailsForm.checklistOther.addEventListener('change', (e) => {
                if (this.elements.detailsForm.checklistOtherText) {
                    this.elements.detailsForm.checklistOtherText.disabled = !e.target.checked;
                }
            });
        }
    }

    /**
     * Subscribe to store changes
     */
    subscribe() {
        this.unsubscribe = store.subscribe('cars', () => {
            this.renderCarsList();
        });
    }

    /**
     * Initial render
     */
    async render() {
        try {
            await CarsStore.load();
        } catch (error) {
            console.error('[CarsView] Load error:', error);
        }
    }

    /**
     * Render cars list
     */
    renderCarsList() {
        if (!this.elements.list) return;

        const cars = store.get('cars') || [];
        
        if (cars.length === 0) {
            this.elements.list.innerHTML = `
                <div class="col-span-full text-center text-slate-400 py-10">
                    <i data-lucide="car" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                    <p>Brak pojazdów w garażu.</p>
                    <p class="text-xs mt-1">Kliknij "Dodaj Pojazd" aby rozpocząć.</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        this.elements.list.innerHTML = '';
        
        cars.forEach(car => {
            const carEl = this.createCarElement(car);
            this.elements.list.appendChild(carEl);
        });

        if (window.lucide) window.lucide.createIcons();
    }

    /**
     * Create car element
     */
    createCarElement(car) {
        const div = document.createElement('div');
        div.className = "bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border dark:border-slate-600 relative group hover:shadow-md transition-all";
        
        // Title logic
        const titleClass = car.forfeiture 
            ? "font-bold text-red-700 dark:text-red-400 truncate pr-6 text-sm" 
            : "font-bold text-indigo-900 dark:text-white truncate pr-6 text-sm";
        
        // Display title
        let displayTitle = car.name || "Nieznany Pojazd";
        if (car.make || car.model) {
            displayTitle = `${car.make || ''} ${car.model || ''} ${car.year || ''}`.trim();
        }

        const favClass = car.favorite ? 'text-red-500 fill-red-500' : 'text-slate-300 group-hover:text-red-400';
        
        // Status badge
        const statusLabel = car.status 
            ? `<div class="text-[10px] uppercase font-bold text-slate-500 mt-2 bg-slate-200 dark:bg-slate-800 inline-block px-2 py-0.5 rounded">${car.status}</div>` 
            : '';

        // Case number subtitle
        const caseSubtitle = car.caseNumber 
            ? `<div class="text-[10px] text-slate-400 mt-0.5">Sygnatura: ${car.caseNumber}</div>` 
            : '';

        // Files info
        const filesInfo = car.fileCount 
            ? `<div class="text-[10px] text-indigo-400 mt-1 flex items-center gap-1"><i data-lucide="image" size="10"></i> ${car.fileCount} plików</div>` 
            : '';

        div.innerHTML = `
            <div class="${titleClass}">${displayTitle}</div>
            ${caseSubtitle}
            <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">${car.date || '-'}</div>
            ${statusLabel}
            ${filesInfo}
            <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style="z-index: 10;">
                <button class="car-fav-btn text-slate-300 hover:text-red-600" data-car-id="${car.id}" title="Ulubione">
                    <i data-lucide="heart" class="w-4 h-4 ${favClass}"></i>
                </button>
                <button class="car-del-btn text-slate-300 hover:text-red-600" data-car-id="${car.id}" title="Usuń">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
            <div class="absolute inset-0 z-0 cursor-pointer car-details-trigger" data-car-id="${car.id}"></div>
        `;

        // Event listeners
        const favBtn = div.querySelector('.car-fav-btn');
        const delBtn = div.querySelector('.car-del-btn');
        const detailsTrigger = div.querySelector('.car-details-trigger');

        if (favBtn) {
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(car.id);
            });
        }

        if (delBtn) {
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteCar(car.id);
            });
        }

        if (detailsTrigger) {
            detailsTrigger.addEventListener('click', () => {
                this.openCarDetails(car.id);
            });
        }

        return div;
    }

    /**
     * Toggle favorite
     */
    async toggleFavorite(carId) {
        try {
            await CarsStore.toggleFavorite(carId);
        } catch (error) {
            console.error('[CarsView] Toggle favorite error:', error);
        }
    }

    /**
     * Delete car
     */
    async deleteCar(carId) {
        if (!confirm('Czy na pewno usunąć ten pojazd?')) return;
        
        try {
            await CarsStore.delete(carId);
        } catch (error) {
            console.error('[CarsView] Delete error:', error);
        }
    }

    /**
     * Open Add Car Modal
     */
    openAddCarModal() {
        if (!this.elements.addModal) return;

        // Clear fields
        Object.keys(this.elements.addForm).forEach(key => {
            const el = this.elements.addForm[key];
            if (el) {
                if (el.type === 'checkbox') {
                    el.checked = false;
                } else {
                    el.value = '';
                }
            }
        });

        // Set date to today
        if (this.elements.addForm.date) {
            this.elements.addForm.date.value = new Date().toISOString().slice(0, 10);
        }

        // Populate status select
        if (this.elements.addForm.status) {
            this.elements.addForm.status.innerHTML = '';
            CarsStore.constants.CAR_STATUSES.forEach(status => {
                const opt = document.createElement('option');
                opt.value = status;
                opt.textContent = status;
                this.elements.addForm.status.appendChild(opt);
            });
            this.elements.addForm.status.value = "Zajęcie"; // Default
        }

        this.elements.addModal.classList.remove('hidden');
    }

    /**
     * Close Add Car Modal
     */
    closeAddCarModal() {
        if (this.elements.addModal) {
            this.elements.addModal.classList.add('hidden');
        }
    }

    /**
     * Save new car
     */
    async saveNewCar() {
        const form = this.elements.addForm;
        
        const make = form.make?.value || '';
        const plate = form.plate?.value || '';

        if (!make && !plate) {
            alert("Podaj chociaż Markę lub Rejestrację!");
            return;
        }

        const fileNames = [];
        if (form.files?.files) {
            for (let f of form.files.files) {
                fileNames.push(f.name);
            }
        }

        const newCar = {
            make,
            model: form.model?.value || '',
            year: form.year?.value || '',
            plate,
            vin: form.vin?.value || '',
            caseNumber: form.caseNumber?.value || '',
            forfeiture: form.forfeiture?.checked || false,
            estimatedValue: parseFloat(form.value?.value) || 0,
            callPrice: 0,
            status: form.status?.value || 'Zajęcie',
            date: form.date?.value || new Date().toISOString().slice(0, 10),
            fileCount: fileNames.length,
            fileNames: fileNames,
            checklist: {},
            checklistOtherText: '',
            favorite: false
        };

        try {
            await CarsStore.save(newCar);
            this.closeAddCarModal();
        } catch (error) {
            console.error('[CarsView] Save new car error:', error);
            alert('Błąd podczas zapisywania pojazdu');
        }
    }

    /**
     * Calculate modal valuation (average of 3 prices)
     */
    calculateModalValuation() {
        const form = this.elements.addForm;
        const p1 = parseFloat(form.p1?.value) || 0;
        const p2 = parseFloat(form.p2?.value) || 0;
        const p3 = parseFloat(form.p3?.value) || 0;
        const isDamaged = form.damaged?.checked || false;

        let avg = (p1 + p2 + p3) / 3;
        if (isDamaged) {
            avg *= 0.5; // 50% reduction for damaged
        }

        if (form.value) {
            form.value.value = avg.toFixed(2);
        }
    }

    /**
     * Open Car Details Modal
     */
    async openCarDetails(carId) {
        const cars = store.get('cars') || [];
        const car = cars.find(c => c.id === carId);
        
        if (!car || !this.elements.detailsModal) return;

        this.activeCar = car;
        const form = this.elements.detailsForm;

        // Fill basic info
        if (form.id) form.id.value = car.id;
        if (form.make) form.make.value = car.make || (car.name || '');
        if (form.model) form.model.value = car.model || '';
        if (form.year) form.year.value = car.year || '';
        if (form.plate) form.plate.value = car.plate || '';
        if (form.vin) form.vin.value = car.vin || '';
        if (form.caseNumber) form.caseNumber.value = car.caseNumber || '';
        if (form.forfeiture) form.forfeiture.checked = !!car.forfeiture;
        if (form.value) form.value.value = car.estimatedValue || '';

        // Status
        if (form.status) {
            form.status.innerHTML = '';
            CarsStore.constants.CAR_STATUSES.forEach(status => {
                const opt = document.createElement('option');
                opt.value = status;
                opt.textContent = status;
                if (car.status === status) opt.selected = true;
                form.status.appendChild(opt);
            });
        }

        // Checklists
        this.renderChecklist(CarsStore.constants.CHECKLIST_A, form.checklistA, car.checklist || {});
        this.renderChecklist(CarsStore.constants.CHECKLIST_B, form.checklistB, car.checklist || {});

        // Other checklist
        if (form.checklistOther && form.checklistOtherText) {
            if (car.checklist && car.checklist.other) {
                form.checklistOther.checked = true;
                form.checklistOtherText.disabled = false;
                form.checklistOtherText.value = car.checklistOtherText || '';
            } else {
                form.checklistOther.checked = false;
                form.checklistOtherText.disabled = true;
                form.checklistOtherText.value = '';
            }
        }

        // Call price
        if (form.callPrice) {
            form.callPrice.dataset.savedValue = car.callPrice || 0;
        }

        this.updateCarValuation();
        this.elements.detailsModal.classList.remove('hidden');
    }

    /**
     * Render checklist
     */
    renderChecklist(items, container, checklist) {
        if (!container) return;

        container.innerHTML = '';
        items.forEach(item => {
            const isChecked = checklist[item.id] || false;
            const div = document.createElement('div');
            div.className = "flex items-center gap-2";
            div.innerHTML = `
                <input type="checkbox" id="chk_${item.id}" class="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" ${isChecked ? 'checked' : ''}>
                <label for="chk_${item.id}" class="text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">${item.label}</label>
            `;
            container.appendChild(div);
        });
    }

    /**
     * Update car valuation (call price based on status)
     */
    updateCarValuation() {
        const form = this.elements.detailsForm;
        if (!form.value || !form.status || !form.callPrice) return;

        const val = parseFloat(form.value.value) || 0;
        const status = form.status.value;
        const priceInput = form.callPrice;
        
        let isEditable = false;
        let computedPrice = 0;

        if (status === "I Termin Licytacji") {
            computedPrice = val * 0.75;
        } else if (status === "II Termin Licytacji") {
            computedPrice = val * 0.50;
        } else if (status === "Sprzedaż z wolnej ręki" || status === "Inne") {
            isEditable = true;
            const currentVal = parseFloat(priceInput.value);
            const savedVal = parseFloat(priceInput.dataset.savedValue) || 0;
            
            if (priceInput.hasAttribute('readonly')) {
                computedPrice = savedVal > 0 ? savedVal : val;
            } else {
                computedPrice = isNaN(currentVal) ? savedVal : currentVal;
            }
        } else {
            computedPrice = 0;
        }

        if (isEditable) {
            priceInput.removeAttribute('readonly');
            priceInput.classList.remove('text-slate-400');
            priceInput.classList.add('border-b', 'border-indigo-300');
            if (document.activeElement !== priceInput) {
                priceInput.value = computedPrice.toFixed(2);
            }
        } else {
            priceInput.setAttribute('readonly', 'true');
            priceInput.classList.add('text-slate-400');
            priceInput.classList.remove('border-b', 'border-indigo-300');
            
            if (computedPrice > 0) {
                priceInput.value = computedPrice.toFixed(2);
                priceInput.classList.remove('text-slate-400');
            } else {
                priceInput.value = "-";
            }
        }
    }

    /**
     * Close Details Modal
     */
    closeDetailsModal() {
        if (this.elements.detailsModal) {
            this.elements.detailsModal.classList.add('hidden');
        }
        this.activeCar = null;
    }

    /**
     * Save car details
     */
    async saveCarDetails() {
        if (!this.activeCar) return;

        const form = this.elements.detailsForm;
        const carId = this.activeCar.id;

        const oldStatus = this.activeCar.status;
        const newStatus = form.status?.value || '';

        // Gather updated data
        const updatedCar = {
            id: carId,
            make: form.make?.value || '',
            model: form.model?.value || '',
            year: form.year?.value || '',
            plate: form.plate?.value || '',
            vin: form.vin?.value || '',
            caseNumber: form.caseNumber?.value || '',
            forfeiture: form.forfeiture?.checked || false,
            estimatedValue: parseFloat(form.value?.value) || 0,
            status: newStatus
        };

        // Call price
        const priceVal = parseFloat(form.callPrice?.value);
        if (!isNaN(priceVal)) {
            updatedCar.callPrice = priceVal;
        }

        // Checklist
        const newChecklist = {};
        [...CarsStore.constants.CHECKLIST_A, ...CarsStore.constants.CHECKLIST_B].forEach(item => {
            const cb = document.getElementById(`chk_${item.id}`);
            if (cb) newChecklist[item.id] = cb.checked;
        });

        // Other
        if (form.checklistOther?.checked) {
            newChecklist.other = true;
            updatedCar.checklistOtherText = form.checklistOtherText?.value || '';
        } else {
            newChecklist.other = false;
            updatedCar.checklistOtherText = '';
        }
        updatedCar.checklist = newChecklist;

        // Alert for sold status
        if (oldStatus !== "Sprzedane/Zakończone" && newStatus === "Sprzedane/Zakończone") {
            alert("⚠️ UWAGA!\n\nPamiętaj o uchyleniu zajęcia!");
        }

        try {
            await CarsStore.save(updatedCar);
            this.closeDetailsModal();
        } catch (error) {
            console.error('[CarsView] Save details error:', error);
            alert('Błąd podczas zapisywania zmian');
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        console.log('[CarsView] Destroyed');
    }
}

// Create singleton instance
const carsView = new CarsView();

export default carsView;
