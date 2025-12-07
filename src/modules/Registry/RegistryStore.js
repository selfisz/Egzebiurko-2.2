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

export default {
    load: () => store.dispatch('loadBailiffs'),
    import: (file) => store.dispatch('importBailiffs', file)
};
