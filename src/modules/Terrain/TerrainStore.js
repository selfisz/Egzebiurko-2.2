/**
 * Terrain Store - Field Mode and QR Scanning
 */

import store from '../../store/index.js';

// Add terrain state
if (!store.state.terrainCases) store.state.terrainCases = [];
if (!store.state.currentTerrainCaseId) store.state.currentTerrainCaseId = null;
if (!store.state.qrScannerActive) store.state.qrScannerActive = false;

// Mutations
store.registerMutation('SET_TERRAIN_CASES', (state, cases) => {
    state.terrainCases = cases;
});

store.registerMutation('ADD_TERRAIN_CASE', (state, case_) => {
    state.terrainCases.push(case_);
});

store.registerMutation('UPDATE_TERRAIN_CASE', (state, { id, data }) => {
    const index = state.terrainCases.findIndex(c => c.id === id);
    if (index !== -1) {
        state.terrainCases[index] = { ...state.terrainCases[index], ...data };
    }
});

store.registerMutation('DELETE_TERRAIN_CASE', (state, id) => {
    state.terrainCases = state.terrainCases.filter(c => c.id !== id);
});

store.registerMutation('SET_CURRENT_TERRAIN_CASE', (state, caseId) => {
    state.currentTerrainCaseId = caseId;
});

store.registerMutation('SET_QR_SCANNER_ACTIVE', (state, active) => {
    state.qrScannerActive = active;
});

// Actions
store.registerAction('loadTerrainCases', async ({ commit }) => {
    try {
        const raw = localStorage.getItem('lex_terrain_cases');
        const cases = raw ? JSON.parse(raw) : [];
        commit('SET_TERRAIN_CASES', cases);
        return cases;
    } catch (error) {
        console.error('[Terrain] Load cases error:', error);
        throw error;
    }
});

store.registerAction('saveTerrainCases', async ({ state }) => {
    try {
        localStorage.setItem('lex_terrain_cases', JSON.stringify(state.terrainCases));
    } catch (error) {
        console.error('[Terrain] Save cases error:', error);
        throw error;
    }
});

store.registerAction('addNewTerrainCase', async ({ commit, dispatch }) => {
    try {
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

        commit('ADD_TERRAIN_CASE', newCase);
        await dispatch('saveTerrainCases');
        await dispatch('openTerrainCase', newCase.id);
        
        return newCase;
    } catch (error) {
        console.error('[Terrain] Add case error:', error);
        throw error;
    }
});

store.registerAction('updateTerrainCase', async ({ commit, dispatch }, { id, data }) => {
    try {
        const updatedData = {
            ...data,
            lastModified: new Date().toISOString(),
            syncStatus: 'modified'
        };

        commit('UPDATE_TERRAIN_CASE', { id, data: updatedData });
        await dispatch('saveTerrainCases');
        
        return updatedData;
    } catch (error) {
        console.error('[Terrain] Update case error:', error);
        throw error;
    }
});

store.registerAction('deleteTerrainCase', async ({ commit, dispatch }, id) => {
    try {
        commit('DELETE_TERRAIN_CASE', id);
        await dispatch('saveTerrainCases');
        
        commit('ADD_NOTIFICATION', {
            type: 'success',
            message: 'Akta zostały usunięte'
        });
    } catch (error) {
        console.error('[Terrain] Delete case error:', error);
        throw error;
    }
});

store.registerAction('openTerrainCase', async ({ commit }, id) => {
    try {
        commit('SET_CURRENT_TERRAIN_CASE', id);
        
        // UI Transition
        const briefcaseGrid = document.getElementById('briefcase-grid');
        const briefcaseDetail = document.getElementById('briefcase-detail');
        
        if (briefcaseGrid && briefcaseDetail) {
            briefcaseGrid.classList.add('-translate-x-full');
            briefcaseDetail.classList.remove('translate-x-full');
        }
        
        // Populate fields
        const terrainCase = store.state.terrainCases.find(c => c.id === id);
        if (terrainCase) {
            const fields = [
                'caseName', 'caseSurname', 'caseCompany', 'caseAddress', 
                'casePhone', 'caseDebtAmount', 'casePesel', 'caseNotes'
            ];
            
            fields.forEach(fieldId => {
                const element = document.getElementById(fieldId);
                if (element) {
                    const fieldName = fieldId.replace('case', '').toLowerCase();
                    element.value = terrainCase[fieldName] || '';
                }
            });
        }
    } catch (error) {
        console.error('[Terrain] Open case error:', error);
        throw error;
    }
});

store.registerAction('closeTerrainCase', async ({ commit }) => {
    try {
        commit('SET_CURRENT_TERRAIN_CASE', null);
        
        // UI Transition
        const briefcaseGrid = document.getElementById('briefcase-grid');
        const briefcaseDetail = document.getElementById('briefcase-detail');
        
        if (briefcaseGrid && briefcaseDetail) {
            briefcaseGrid.classList.remove('-translate-x-full');
            briefcaseDetail.classList.add('translate-x-full');
        }
    } catch (error) {
        console.error('[Terrain] Close case error:', error);
        throw error;
    }
});

store.registerAction('startQRScanner', async ({ commit }) => {
    try {
        if (!window.Html5Qrcode) {
            throw new Error('HTML5 QR Code library not loaded');
        }

        commit('SET_QR_SCANNER_ACTIVE', true);
        
        const qrCodeSuccessCallback = (decodedText, decodedResult) => {
            console.log('QR Code scanned:', decodedText);
            store.dispatch('processQRResult', decodedText);
        };

        const config = { 
            fps: 10, 
            qrbox: { width: 250, height: 250 } 
        };

        // Start scanner
        const html5QrCode = new Html5Qrcode("qr-reader");
        await html5QrCode.start(
            { facingMode: "environment" }, 
            config, 
            qrCodeSuccessCallback
        );

        return html5QrCode;
    } catch (error) {
        console.error('[Terrain] Start QR scanner error:', error);
        commit('SET_QR_SCANNER_ACTIVE', false);
        throw error;
    }
});

store.registerAction('stopQRScanner', async ({ commit }) => {
    try {
        if (window.html5QrCode) {
            await window.html5QrCode.stop();
            window.html5QrCode = null;
        }
        
        commit('SET_QR_SCANNER_ACTIVE', false);
    } catch (error) {
        console.error('[Terrain] Stop QR scanner error:', error);
        throw error;
    }
});

store.registerAction('processQRResult', async ({ dispatch }, decodedText) => {
    try {
        // Try to parse different QR code formats
        let caseData = {};
        
        // Check if it's a JSON format
        if (decodedText.startsWith('{')) {
            try {
                caseData = JSON.parse(decodedText);
            } catch (e) {
                // Invalid JSON, treat as plain text
                caseData = { notes: decodedText };
            }
        } else {
            // Plain text - try to extract common patterns
            caseData = extractCaseFromText(decodedText);
        }

        // Add to current case or create new one
        const currentCaseId = store.get('currentTerrainCaseId');
        if (currentCaseId) {
            await dispatch('updateTerrainCase', { 
                id: currentCaseId, 
                data: caseData 
            });
        } else {
            const newCase = await dispatch('addNewTerrainCase');
            await dispatch('updateTerrainCase', { 
                id: newCase.id, 
                data: caseData 
            });
        }

        // Stop scanner after successful scan
        await dispatch('stopQRScanner');
        
        commit('ADD_NOTIFICATION', {
            type: 'success',
            message: 'Dane z kodu QR zostały wczytane'
        });
    } catch (error) {
        console.error('[Terrain] Process QR result error:', error);
        throw error;
    }
});

store.registerAction('syncWithMainDB', async ({ commit, state }) => {
    try {
        if (!state.db) {
            throw new Error('Database not available');
        }

        let syncedCount = 0;
        
        for (const terrainCase of state.terrainCases) {
            if (terrainCase.syncStatus === 'new' || terrainCase.syncStatus === 'modified') {
                // Convert to main DB format and save
                const mainCase = {
                    no: `T-${terrainCase.id.slice(-6)}`,
                    debtor: `${terrainCase.name} ${terrainCase.surname}`.trim() || terrainCase.company,
                    unp: terrainCase.pesel,
                    date: terrainCase.lastModified,
                    status: 'new',
                    note: terrainCase.notes,
                    source: 'terrain',
                    terrainId: terrainCase.id
                };

                await state.db.put('cases', mainCase);
                
                // Update sync status
                await dispatch('updateTerrainCase', {
                    id: terrainCase.id,
                    data: { syncStatus: 'synced' }
                });
                
                syncedCount++;
            }
        }

        commit('ADD_NOTIFICATION', {
            type: 'success',
            message: `Zsynchronizowano ${syncedCount} spraw`
        });

        return syncedCount;
    } catch (error) {
        console.error('[Terrain] Sync error:', error);
        throw error;
    }
});

// Helper function to extract case data from text
function extractCaseFromText(text) {
    const data = {};
    
    // Extract NIP/PESEL patterns
    const nipMatch = text.match(/\b\d{10}\b/);
    if (nipMatch) data.unp = nipMatch[0];
    
    const peselMatch = text.match(/\b\d{11}\b/);
    if (peselMatch) data.pesel = peselMatch[0];
    
    // Extract phone numbers
    const phoneMatch = text.match(/(?:\+48|48)?\s*?\d{3}\s*?\d{3}\s*?\d{3}/);
    if (phoneMatch) data.phone = phoneMatch[0].replace(/\s/g, '');
    
    // Extract amounts
    const amountMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:PLN|zł)/);
    if (amountMatch) data.debtAmount = amountMatch[1].replace(',', '.');
    
    // Remaining text as notes
    data.notes = text;
    
    return data;
}

export default {
    load: () => store.dispatch('loadTerrainCases'),
    add: () => store.dispatch('addNewTerrainCase'),
    update: (id, data) => store.dispatch('updateTerrainCase', { id, data }),
    delete: (id) => store.dispatch('deleteTerrainCase', id),
    open: (id) => store.dispatch('openTerrainCase', id),
    close: () => store.dispatch('closeTerrainCase'),
    startQRScanner: () => store.dispatch('startQRScanner'),
    stopQRScanner: () => store.dispatch('stopQRScanner'),
    sync: () => store.dispatch('syncWithMainDB'),
    getCases: () => store.get('terrainCases'),
    getCurrentCase: () => {
        const caseId = store.get('currentTerrainCaseId');
        return store.get('terrainCases').find(c => c.id === caseId);
    },
    isQRScannerActive: () => store.get('qrScannerActive')
};