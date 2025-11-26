// --- MODULE: CARS ---

const CAR_STATUSES = [
    "Zajęcie", 
    "Parking strzeżony", 
    "Oddane pod dozór", 
    "I Termin Licytacji", 
    "II Termin Licytacji", 
    "Sprzedaż z wolnej ręki", 
    "Inne", 
    "Sprzedane/Zakończone"
];

const CHECKLIST_A = [
    {id: 'protocol', label: 'Protokół zajęcia'},
    {id: 'notice', label: 'Zawiadomienie'},
    {id: 'transport', label: 'Zwózka'},
    {id: 'supervision', label: 'Dozór'},
    {id: 'call', label: 'Wezwanie o wskazanie miejsca parkowania'},
    {id: 'cepik', label: 'Rejestr zastawów'},
    {id: 'police', label: 'Policja'},
    {id: 'prosecutor', label: 'Prokuratura'},
    {id: 'sold_release', label: 'Wydano po sprzedaży'}
];

const CHECKLIST_B = [
    {id: 'keys', label: 'Kluczyki'},
    {id: 'oc', label: 'OC'},
    {id: 'review', label: 'Przegląd'},
    {id: 'registration', label: 'Dowód rejestracyjny'}
];

async function loadGarage() {
    const l = document.getElementById('garageList'); if(!l) return; l.innerHTML = '';
    const cars = await state.db.getAll('garage');
    
    // Default Sort: Date Descending
    cars.sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0));

    if(cars.length === 0) { 
        l.innerHTML = '<div class="col-span-full text-center text-slate-400 py-10">Brak pojazdów w garażu. Kliknij "Dodaj Pojazd".</div>'; 
        return; 
    }

    cars.forEach(car => {
        const div = document.createElement('div');
        div.className = "bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border dark:border-slate-600 relative group hover:shadow-md transition-all";
        
        // Title logic
        const titleClass = car.forfeiture 
            ? "font-bold text-red-700 dark:text-red-400 truncate pr-6 text-sm" 
            : "font-bold text-indigo-900 dark:text-white truncate pr-6 text-sm";
        
        // Make/Model/Year display. Fallback to 'name' if old data.
        let displayTitle = car.name || "Nieznany Pojazd";
        if(car.make || car.model) {
            displayTitle = `${car.make || ''} ${car.model || ''} ${car.year || ''}`.trim();
        }

        const favClass = car.favorite ? 'text-red-500 fill-red-500' : 'text-slate-300 group-hover:text-red-400';
        
        // Status Badge
        const statusLabel = car.status ? `<div class="text-[10px] uppercase font-bold text-slate-500 mt-2 bg-slate-200 dark:bg-slate-800 inline-block px-2 py-0.5 rounded">${car.status}</div>` : '';

        // Subtitle (Case Number)
        const caseSubtitle = car.caseNumber ? `<div class="text-[10px] text-slate-400 mt-0.5">Sygnatura: ${car.caseNumber}</div>` : '';

        // Files info
        const filesInfo = car.fileCount ? `<div class="text-[10px] text-indigo-400 mt-1 flex items-center gap-1"><i data-lucide="image" size="10"></i> ${car.fileCount} plików</div>` : '';

        div.innerHTML = `
            <div class="${titleClass}">${displayTitle}</div>
            ${caseSubtitle}
            <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">${car.date || '-'}</div>
            ${statusLabel}
            ${filesInfo}
            <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onclick="toggleFavorite('car', ${car.id})" title="Ulubione"><i data-lucide="heart" class="w-4 h-4 ${favClass} ${car.favorite?'fill-red-500':''}"></i></button>
                 <button onclick="delCar(${car.id})" class="text-slate-300 hover:text-red-600" title="Usuń"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
            <div class="absolute inset-0 z-0 cursor-pointer" onclick="openCarDetails(${car.id})"></div>
        `;
        // Note: The click handler is on a div layer to avoid conflict with buttons, 
        // but we need to ensure buttons are z-10 or higher.
        div.querySelector('.absolute.top-2').style.zIndex = "10";
        
        l.appendChild(div);
    });
    lucide.createIcons();
}

// --- MODAL: ADD NEW CAR ---

function openAddCarModal() {
    // Clear fields
    ['Make','Model','Year','Plate','Vin','Case','Forfeiture','Value','Files','P1','P2','P3','Bad'].forEach(id => {
        const el = document.getElementById('ac'+id);
        if(el) {
            if(el.type === 'checkbox') el.checked = false;
            else el.value = '';
        }
    });

    // Set Date to Today
    document.getElementById('acDate').value = new Date().toISOString().slice(0,10);

    // Populate Status Select
    const sel = document.getElementById('acStatus');
    sel.innerHTML = '';
    CAR_STATUSES.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.innerText = s;
        sel.appendChild(opt);
    });
    sel.value = "Zajęcie"; // Default

    document.getElementById('addCarModal').classList.remove('hidden');
}

async function saveNewCar() {
    const make = document.getElementById('acMake').value;
    const model = document.getElementById('acModel').value;
    const year = document.getElementById('acYear').value;
    const plate = document.getElementById('acPlate').value;
    const vin = document.getElementById('acVin').value;
    const caseNum = document.getElementById('acCase').value;
    const forfeit = document.getElementById('acForfeit').checked;
    const val = parseFloat(document.getElementById('acValue').value) || 0;
    const status = document.getElementById('acStatus').value;
    const date = document.getElementById('acDate').value;
    const fileInput = document.getElementById('acFiles');

    if(!make && !plate) { alert("Podaj chociaż Markę lub Rejestrację!"); return; }

    const fileNames = [];
    if(fileInput.files) {
        for(let f of fileInput.files) fileNames.push(f.name);
    }

    const newCar = {
        make, model, year, plate, vin, 
        caseNumber: caseNum,
        forfeiture: forfeit,
        estimatedValue: val,
        callPrice: 0, // Initial call price
        status: status,
        date: date,
        fileCount: fileNames.length,
        fileNames: fileNames, // Metadata only
        checklist: {},
        checklistOtherText: '',
        favorite: false
    };

    await state.db.add('garage', newCar);
    document.getElementById('addCarModal').classList.add('hidden');
    loadGarage();
    renderDashboardWidgets(); // Update counters if any
}

// --- MODAL: CAR DETAILS ---

async function openCarDetails(id) {
    const car = await state.db.get('garage', id);
    if(!car) return;

    document.getElementById('cdId').value = car.id;
    
    // Fill Basic Info (Handle old data structure too)
    document.getElementById('cdMake').value = car.make || ''; 
    document.getElementById('cdModel').value = car.model || ''; 
    document.getElementById('cdYear').value = car.year || ''; 
    
    // If old data had 'name' but no make/model, try to be smart or just leave blank
    if(!car.make && car.name) {
        // Just put old name in make for visibility
        document.getElementById('cdMake').value = car.name; 
    }

    document.getElementById('cdPlate').value = car.plate || ''; 
    document.getElementById('cdVin').value = car.vin || ''; 
    document.getElementById('cdCase').value = car.caseNumber || ''; 
    document.getElementById('cdForfeit').checked = !!car.forfeiture;
    document.getElementById('cdValue').value = car.estimatedValue || '';
    
    // Status
    const sel = document.getElementById('cdStatus');
    sel.innerHTML = '';
    CAR_STATUSES.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.innerText = s;
        if(car.status === s) opt.selected = true;
        sel.appendChild(opt);
    });

    // Checklist Generation
    const renderChecklist = (items, containerId) => {
        const c = document.getElementById(containerId);
        c.innerHTML = '';
        items.forEach(item => {
            const isChecked = car.checklist && car.checklist[item.id];
            const div = document.createElement('div');
            div.className = "flex items-center gap-2";
            div.innerHTML = `
                <input type="checkbox" id="chk_${item.id}" class="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" ${isChecked ? 'checked' : ''}>
                <label for="chk_${item.id}" class="text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">${item.label}</label>
            `;
            c.appendChild(div);
        });
    };

    renderChecklist(CHECKLIST_A, 'checklistA');
    renderChecklist(CHECKLIST_B, 'checklistB');

    // Handle "Other" (Inne)
    const chkOther = document.getElementById('chk_other');
    const txtOther = document.getElementById('checklistOtherText');
    if(car.checklist && car.checklist.other) {
        chkOther.checked = true;
        txtOther.disabled = false;
        txtOther.value = car.checklistOtherText || '';
    } else {
        chkOther.checked = false;
        txtOther.disabled = true;
        txtOther.value = '';
    }

    // Call Price Logic
    const priceInput = document.getElementById('cdCallPrice');
    priceInput.dataset.savedValue = car.callPrice || 0;
    
    updateCarValuation(); 
    document.getElementById('carDetailsModal').classList.remove('hidden');
}

function updateCarValuation() {
    const val = parseFloat(document.getElementById('cdValue').value) || 0;
    const status = document.getElementById('cdStatus').value;
    const priceInput = document.getElementById('cdCallPrice');
    
    let isEditable = false;
    let computedPrice = 0;

    if(status === "I Termin Licytacji") {
        computedPrice = val * 0.75;
    } else if(status === "II Termin Licytacji") {
        computedPrice = val * 0.50;
    } else if(status === "Sprzedaż z wolnej ręki" || status === "Inne") {
        isEditable = true;
        const currentVal = parseFloat(priceInput.value);
        const savedVal = parseFloat(priceInput.dataset.savedValue) || 0;
        
        if(priceInput.hasAttribute('readonly')) {
             computedPrice = savedVal > 0 ? savedVal : val;
        } else {
             computedPrice = isNaN(currentVal) ? savedVal : currentVal;
        }
    } else {
        computedPrice = 0;
    }

    if(isEditable) {
        priceInput.removeAttribute('readonly');
        priceInput.classList.remove('text-slate-400');
        priceInput.classList.add('border-b', 'border-indigo-300');
        if(document.activeElement !== priceInput) {
             priceInput.value = computedPrice.toFixed(2);
        }
    } else {
        priceInput.setAttribute('readonly', 'true');
        priceInput.classList.add('text-slate-400');
        priceInput.classList.remove('border-b', 'border-indigo-300');
        
        if(computedPrice > 0) {
            priceInput.value = computedPrice.toFixed(2);
            priceInput.classList.remove('text-slate-400');
        } else {
            priceInput.value = "-";
        }
    }
}

async function saveCarDetails() {
    const id = parseInt(document.getElementById('cdId').value);
    const car = await state.db.get('garage', id);
    if(!car) return;

    const oldStatus = car.status;
    const newStatus = document.getElementById('cdStatus').value;

    // Gather standard fields
    car.make = document.getElementById('cdMake').value;
    car.model = document.getElementById('cdModel').value;
    car.year = document.getElementById('cdYear').value;
    car.plate = document.getElementById('cdPlate').value;
    car.vin = document.getElementById('cdVin').value;
    car.caseNumber = document.getElementById('cdCase').value;
    car.forfeiture = document.getElementById('cdForfeit').checked;
    car.estimatedValue = parseFloat(document.getElementById('cdValue').value) || 0;
    car.status = newStatus;

    // Call Price Logic
    const priceInput = document.getElementById('cdCallPrice');
    const priceVal = parseFloat(priceInput.value);
    if(!isNaN(priceVal)) {
        car.callPrice = priceVal;
    }

    // Checklist
    const newChecklist = {};
    [...CHECKLIST_A, ...CHECKLIST_B].forEach(i => {
        const cb = document.getElementById(`chk_${i.id}`);
        if(cb) newChecklist[i.id] = cb.checked;
    });

    // Handle "Other"
    const chkOther = document.getElementById('chk_other');
    if(chkOther && chkOther.checked) {
        newChecklist.other = true;
        car.checklistOtherText = document.getElementById('checklistOtherText').value;
    } else {
        newChecklist.other = false;
        car.checklistOtherText = '';
    }
    car.checklist = newChecklist;

    // Alert Logic
    if(oldStatus !== "Sprzedane/Zakończone" && newStatus === "Sprzedane/Zakończone") {
        alert("⚠️ UWAGA!\n\nPamiętaj o uchyleniu zajęcia!");
    }

    await state.db.put('garage', car);
    document.getElementById('carDetailsModal').classList.add('hidden');
    loadGarage();
}

async function delCar(id) {
    if(confirm("Czy na pewno usunąć ten pojazd?")) { 
        await state.db.delete('garage', id); 
        loadGarage(); 
    } 
}

function calcModalValuation() {
    const p1 = parseFloat(document.getElementById('acP1').value) || 0;
    const p2 = parseFloat(document.getElementById('acP2').value) || 0;
    const p3 = parseFloat(document.getElementById('acP3').value) || 0;
    
    let count = 0;
    let sum = 0;
    
    if(p1 > 0) { sum += p1; count++; }
    if(p2 > 0) { sum += p2; count++; }
    if(p3 > 0) { sum += p3; count++; }
    
    if(count === 0) return;
    
    let avg = sum / count;
    
    if(document.getElementById('acBad').checked) {
        avg *= 0.8; // -20%
    }
    
    document.getElementById('acValue').value = avg.toFixed(2);
}

// Helper for Copy
function copyToClipboard(elementId) {
    const el = document.getElementById(elementId);
    if(!el || !el.value) return;
    
    navigator.clipboard.writeText(el.value).then(() => {
        const originalBg = el.style.backgroundColor;
        el.style.backgroundColor = "rgba(99, 102, 241, 0.2)";
        setTimeout(() => {
            el.style.backgroundColor = originalBg;
        }, 200);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}
