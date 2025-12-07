/**
 * Tracker Store - State Management dla modułu Tracker
 */

import store from '../../store/index.js';

// Rejestruj mutations dla Tracker
store.registerMutation('SET_TRACKER_CASES', (state, cases) => {
    state.cases = cases;
});

store.registerMutation('SET_CURRENT_CASE', (state, caseData) => {
    state.currentCase = caseData;
});

store.registerMutation('SET_TRACKER_VIEW_MODE', (state, mode) => {
    state.trackerViewMode = mode; // 'list' | 'detail'
});

store.registerMutation('SET_TRACKER_FILTERS', (state, filters) => {
    state.trackerFilters = { ...state.trackerFilters, ...filters };
});

store.registerMutation('TOGGLE_CASE_FAVORITE', (state, caseId) => {
    const caseIndex = state.cases.findIndex(c => c.id === caseId);
    if (caseIndex !== -1) {
        state.cases[caseIndex].isFavorite = !state.cases[caseIndex].isFavorite;
    }
});

// Rejestruj actions dla Tracker
store.registerAction('loadTrackerCases', async ({ commit, state }) => {
    if (!state.db) throw new Error('Database not initialized');
    
    commit('SET_LOADING', true);
    try {
        const cases = await state.db.getAll('cases');
        commit('SET_TRACKER_CASES', cases);
        return cases;
    } finally {
        commit('SET_LOADING', false);
    }
});

store.registerAction('saveTrackerCase', async ({ commit, state }, caseData) => {
    if (!state.db) throw new Error('Database not initialized');
    
    try {
        // Walidacja
        if (!caseData.no || !caseData.date) {
            throw new Error('Numer sprawy i data są wymagane');
        }
        
        // Walidacja terminu
        if (caseData.deadline && caseData.date) {
            const deadline = new Date(caseData.deadline);
            const date = new Date(caseData.date);
            if (deadline < date) {
                throw new Error('Termin nie może być wcześniejszy niż data wpływu');
            }
        }
        
        // Zapisz
        if (caseData.id) {
            await state.db.put('cases', caseData);
            commit('UPDATE_CASE', { id: caseData.id, data: caseData });
        } else {
            caseData.id = Date.now();
            caseData.createdAt = new Date().toISOString();
            caseData.isFavorite = false;
            await state.db.add('cases', caseData);
            commit('ADD_CASE', caseData);
        }
        
        commit('ADD_NOTIFICATION', {
            type: 'success',
            message: 'Sprawa została zapisana'
        });
        
        return caseData;
    } catch (error) {
        commit('ADD_NOTIFICATION', {
            type: 'error',
            message: error.message
        });
        throw error;
    }
});

store.registerAction('deleteTrackerCase', async ({ commit, state }, caseId) => {
    if (!state.db) throw new Error('Database not initialized');
    
    try {
        await state.db.delete('cases', caseId);
        commit('DELETE_CASE', caseId);
        
        commit('ADD_NOTIFICATION', {
            type: 'success',
            message: 'Sprawa została usunięta'
        });
    } catch (error) {
        commit('ADD_NOTIFICATION', {
            type: 'error',
            message: 'Błąd usuwania sprawy'
        });
        throw error;
    }
});

store.registerAction('toggleCaseFavorite', async ({ commit, state }, caseId) => {
    if (!state.db) throw new Error('Database not initialized');
    
    try {
        const caseData = state.cases.find(c => c.id === caseId);
        if (!caseData) return;
        
        caseData.isFavorite = !caseData.isFavorite;
        await state.db.put('cases', caseData);
        
        commit('TOGGLE_CASE_FAVORITE', caseId);
    } catch (error) {
        console.error('Error toggling favorite:', error);
    }
});

export default {
    loadCases: () => store.dispatch('loadTrackerCases'),
    saveCase: (caseData) => store.dispatch('saveTrackerCase', caseData),
    deleteCase: (caseId) => store.dispatch('deleteTrackerCase', caseId),
    toggleFavorite: (caseId) => store.dispatch('toggleCaseFavorite', caseId)
};
