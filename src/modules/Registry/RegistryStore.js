/**
 * Registry Store - State Management
 */

import store from '../../store/index.js';

// Add bailiffs to initial state
if (!store.state.bailiffs) store.state.bailiffs = [];

// Mutations
store.registerMutation('SET_BAILIFFS', (state, bailiffs) => {
    state.bailiffs = bailiffs;
});

store.registerMutation('CLEAR_BAILIFFS', (state) => {
    state.bailiffs = [];
});

// Actions
store.registerAction('loadBailiffs', async ({ commit, state }) => {
    if (!state.db) throw new Error('Database not initialized');
    
    try {
        const bailiffs = await state.db.getAll('bailiffs');
        commit('SET_BAILIFFS', bailiffs);
        return bailiffs;
    } catch (error) {
        console.error('[Registry] Load error:', error);
        throw error;
    }
});

store.registerAction('importBailiffs', async ({ commit, state }, file) => {
    if (!state.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
                
                const bailiffsToSave = [];
                for (let i = 1; i < json.length; i++) {
                    const row = json[i];
                    if (row && row.length > 0) {
                        bailiffsToSave.push({
                            name: row[0] || "",
                            nip: row[1] || "",
                            address: row[2] || "",
                            epu: row[3] || ""
                        });
                    }
                }
                
                if (bailiffsToSave.length > 0) {
                    // Clear and import
                    await state.db.clear('bailiffs');
                    
                    for (const bailiff of bailiffsToSave) {
                        await state.db.add('bailiffs', bailiff);
                    }
                    
                    // Reload
                    const bailiffs = await state.db.getAll('bailiffs');
                    commit('SET_BAILIFFS', bailiffs);
                    
                    commit('ADD_NOTIFICATION', {
                        type: 'success',
                        message: `Zaimportowano ${bailiffsToSave.length} komorników`
                    });
                    
                    resolve(bailiffsToSave.length);
                }
            } catch (err) {
                console.error('[Registry] Import error:', err);
                commit('ADD_NOTIFICATION', {
                    type: 'error',
                    message: `Błąd importu: ${err.message}`
                });
                reject(err);
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsArrayBuffer(file);
    });
});

store.registerAction('removeBailiff', async ({ commit, state }, bailiffName) => {
    if (!state.db) throw new Error('Database not initialized');
    
    try {
        // Find bailiff by name and delete
        const bailiffs = await state.db.getAll('bailiffs');
        const bailiff = bailiffs.find(b => b.name === bailiffName);
        
        if (bailiff && bailiff.id) {
            await state.db.delete('bailiffs', bailiff.id);
        }
        
        // Reload
        const updatedBailiffs = await state.db.getAll('bailiffs');
        commit('SET_BAILIFFS', updatedBailiffs);
        
        return true;
    } catch (error) {
        console.error('[Registry] Remove error:', error);
        throw error;
    }
});

store.registerAction('exportBailiffs', async ({ state }) => {
    if (!state.bailiffs || state.bailiffs.length === 0) {
        throw new Error('No bailiffs to export');
    }
    
    try {
        // Prepare data for Excel
        const data = [
            ['Nazwa', 'NIP', 'Adres', 'EPU'], // Header
            ...state.bailiffs.map(b => [
                b.name || '',
                b.nip || '',
                b.address || '',
                b.epu || ''
            ])
        ];
        
        // Create workbook
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Komornicy');
        
        // Download
        const filename = `komornicy_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
        
        return true;
    } catch (error) {
        console.error('[Registry] Export error:', error);
        throw error;
    }
});

export default {
    load: () => store.dispatch('loadBailiffs'),
    importFromExcel: (file) => store.dispatch('importBailiffs', file),
    remove: (bailiffName) => store.dispatch('removeBailiff', bailiffName),
    exportToExcel: () => store.dispatch('exportBailiffs')
};
