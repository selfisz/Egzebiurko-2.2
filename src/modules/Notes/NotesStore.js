/**
 * Notes Store - State Management
 */

import store from '../../store/index.js';

// Add notes to initial state
if (!store.state.notes) store.state.notes = [];
if (!store.state.activeNoteId) store.state.activeNoteId = null;

// Mutations
store.registerMutation('SET_NOTES', (state, notes) => {
    state.notes = notes;
});

// Id-based helpers built on top of existing actions
store.registerAction('createNote', async ({ dispatch }, noteData) => {
    // Delegate to existing saveNote, which handles id/date generation
    return dispatch('saveNote', noteData);
});

store.registerAction('updateNote', async ({ dispatch }, { id, data }) => {
    // Reuse saveNote update path
    return dispatch('saveNote', { ...data, id });
});

store.registerAction('selectNote', async ({ commit }, noteId) => {
    commit('SET_ACTIVE_NOTE', noteId);
    return noteId;
});

store.registerAction('removeNote', async ({ dispatch }, noteId) => {
    return dispatch('deleteNote', noteId);
});

store.registerMutation('SET_ACTIVE_NOTE', (state, noteId) => {
    state.activeNoteId = noteId;
});

store.registerMutation('ADD_NOTE', (state, note) => {
    state.notes.unshift(note);
});

store.registerMutation('UPDATE_NOTE', (state, { id, data }) => {
    const index = state.notes.findIndex(n => n.id === id);
    if (index !== -1) {
        state.notes[index] = { ...state.notes[index], ...data };
    }
});

store.registerMutation('DELETE_NOTE', (state, id) => {
    state.notes = state.notes.filter(n => n.id !== id);
});

// Actions
store.registerAction('loadNotes', async ({ commit, state }) => {
    if (!state.db) throw new Error('Database not initialized');
    
    try {
        const notes = await state.db.getAll('notes');
        notes.sort((a, b) => new Date(b.date) - new Date(a.date));
        commit('SET_NOTES', notes);
        return notes;
    } catch (error) {
        console.error('[Notes] Load error:', error);
        throw error;
    }
});

store.registerAction('saveNote', async ({ commit, state }, noteData) => {
    if (!state.db) throw new Error('Database not initialized');
    
    try {
        noteData.date = new Date().toISOString();
        
        if (noteData.id) {
            await state.db.put('notes', noteData);
            commit('UPDATE_NOTE', { id: noteData.id, data: noteData });
        } else {
            noteData.id = Date.now();
            await state.db.add('notes', noteData);
            commit('ADD_NOTE', noteData);
        }
        
        return noteData;
    } catch (error) {
        console.error('[Notes] Save error:', error);
        throw error;
    }
});

store.registerAction('deleteNote', async ({ commit, state }, noteId) => {
    if (!state.db) throw new Error('Database not initialized');
    
    try {
        await state.db.delete('notes', noteId);
        commit('DELETE_NOTE', noteId);
        commit('SET_ACTIVE_NOTE', null);
    } catch (error) {
        console.error('[Notes] Delete error:', error);
        throw error;
    }
});

export default {
    // Core id-based API used by NotesView
    load: () => store.dispatch('loadNotes'),
    create: (note) => store.dispatch('createNote', note),
    update: (id, data) => store.dispatch('updateNote', { id, data }),
    select: (id) => store.dispatch('selectNote', id),
    remove: (id) => store.dispatch('removeNote', id),

    // Backward-compatible helpers
    save: (note) => store.dispatch('saveNote', note),
    delete: (id) => store.dispatch('deleteNote', id)
};
