// DATABASE UTILS
// Actually, index.html has <script src="https://unpkg.com/idb@7.1.1/build/umd.js"></script>, which exposes `idb` global.
// So we can just use `idb.openDB`.


async function initDB() {
    state.db = await idb.openDB(CONFIG.DB_NAME, CONFIG.DB_VERSION, {
        upgrade(db, oldVersion, newVersion, tx) {
            // Standard object stores
            if (!db.objectStoreNames.contains('templates')) db.createObjectStore('templates', { keyPath: 'name' });
            if (!db.objectStoreNames.contains('drafts')) db.createObjectStore('drafts', { keyPath: 'id', autoIncrement: true });
            if (!db.objectStoreNames.contains('garage')) db.createObjectStore('garage', { keyPath: 'id', autoIncrement: true });
            if (!db.objectStoreNames.contains('bailiffs')) db.createObjectStore('bailiffs', { keyPath: 'id', autoIncrement: true });
            if (!db.objectStoreNames.contains('notes')) db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
            if (!db.objectStoreNames.contains('pdfs')) db.createObjectStore('pdfs', { keyPath: 'name' });
            if (!db.objectStoreNames.contains('reminders')) db.createObjectStore('reminders', { keyPath: 'id', autoIncrement: true });
            if (!db.objectStoreNames.contains('terrain_cases')) db.createObjectStore('terrain_cases', { keyPath: 'id', autoIncrement: true });
            if (!db.objectStoreNames.contains('attachments')) db.createObjectStore('attachments', { keyPath: 'id', autoIncrement: true });

            // Migration from 'cases' to 'tracker'
            if (oldVersion < 5) {
                if (!db.objectStoreNames.contains('tracker')) {
                    db.createObjectStore('tracker', { keyPath: 'id', autoIncrement: true });
                }
                if (db.objectStoreNames.contains('cases')) {
                    const casesStore = tx.objectStore('cases');
                    const trackerStore = tx.objectStore('tracker');

                    casesStore.getAll().then(cases => {
                        for (const caseItem of cases) {
                            // Ensure new fields have default values
                            caseItem.urgent = caseItem.urgent || false;
                            caseItem.isFavorite = caseItem.isFavorite || false;
                            trackerStore.put(caseItem);
                        }
                    });

                    db.deleteObjectStore('cases');
                }
            }
        }
    });
    
    // TODO: Store integration will be added when AppController is properly loaded
    console.log('[DB] Database initialized');
}

// Data Management
async function exportData() {
    const data = {
        tracker: await state.db.getAll('tracker'),
        garage: await state.db.getAll('garage'),
        notes: await state.db.getAll('notes'),
        links: JSON.parse(localStorage.getItem('lex_links') || '[]'),
        dicts: {
            addresses: JSON.parse(localStorage.getItem('lex_addresses') || '[]'),
            signatures: JSON.parse(localStorage.getItem('lex_signatures') || '[]')
        }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type : 'application/json'});
    saveAs(blob, `egzebiurko_backup_${new Date().toISOString().slice(0,10)}.json`);
}

async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (confirm("To nadpisze obecne dane. Kontynuować?")) {
                const tx = state.db.transaction(['tracker', 'garage', 'notes'], 'readwrite');

                // Support both old 'cases' and new 'tracker' format
                const trackerData = data.tracker || data.cases || [];
                if (trackerData.length > 0) {
                    await tx.objectStore('tracker').clear();
                    for (const i of trackerData) await tx.objectStore('tracker').put(i);
                }
                if (data.garage) {
                    await tx.objectStore('garage').clear();
                    for (const i of data.garage) await tx.objectStore('garage').put(i);
                }
                if (data.notes) {
                    await tx.objectStore('notes').clear();
                    for (const i of data.notes) await tx.objectStore('notes').put(i);
                }

                if (data.links) localStorage.setItem('lex_links', JSON.stringify(data.links));
                if (data.dicts) {
                    localStorage.setItem('lex_addresses', JSON.stringify(data.dicts.addresses || []));
                    localStorage.setItem('lex_signatures', JSON.stringify(data.dicts.signatures || []));
                }

                alert("Przywrócono dane!");
                location.reload();
            }
        } catch (err) {
            alert("Błąd pliku: " + err.message);
        }
    };
    reader.readAsText(file);
}

async function wipeData() {
    if (confirm("Czy na pewno usunąć WSZYSTKIE dane? Tego nie da się cofnąć!")) {
        const stores = ['tracker', 'garage', 'notes', 'templates', 'drafts', 'bailiffs', 'pdfs', 'reminders', 'terrain_cases'];
        const tx = state.db.transaction(stores, 'readwrite');
        for (const s of stores) {
            if (state.db.objectStoreNames.contains(s)) {
                await tx.objectStore(s).clear();
            }
        }
        localStorage.clear();
        alert("Wyczyszczono.");
        location.reload();
    }
}
