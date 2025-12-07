/**
 * Links Store - State Management (localStorage based)
 */

import store from '../../store/index.js';

// Add links to initial state
if (!store.state.links) store.state.links = [];
if (!store.state.editingLinkId) store.state.editingLinkId = null;

// Mutations
store.registerMutation('SET_LINKS', (state, links) => {
    state.links = links;
});

store.registerMutation('ADD_LINK', (state, link) => {
    state.links.push(link);
});

store.registerMutation('UPDATE_LINK', (state, { idx, data }) => {
    if (state.links[idx]) {
        state.links[idx] = { ...state.links[idx], ...data };
    }
});

store.registerMutation('DELETE_LINK', (state, idx) => {
    state.links.splice(idx, 1);
});

store.registerMutation('TOGGLE_LINK_FAVORITE', (state, idx) => {
    if (state.links[idx]) {
        state.links[idx].favorite = !state.links[idx].favorite;
    }
});

store.registerMutation('SET_EDITING_LINK', (state, idx) => {
    state.editingLinkId = idx;
});

// Actions
store.registerAction('loadLinks', async ({ commit }) => {
    try {
        const links = JSON.parse(localStorage.getItem('lex_links') || '[]');
        commit('SET_LINKS', links);
        return links;
    } catch (error) {
        console.error('[Links] Load error:', error);
        return [];
    }
});

store.registerAction('saveLink', async ({ commit, state }, linkData) => {
    try {
        let formattedUrl = linkData.url;
        if (!formattedUrl.startsWith('http')) {
            formattedUrl = 'https://' + formattedUrl;
        }

        const links = [...state.links];
        
        if (state.editingLinkId !== null) {
            // Update existing
            links[state.editingLinkId] = {
                ...links[state.editingLinkId],
                name: linkData.name,
                url: formattedUrl,
                category: linkData.category
            };
            commit('SET_EDITING_LINK', null);
        } else {
            // Add new
            links.push({
                name: linkData.name,
                url: formattedUrl,
                category: linkData.category,
                favorite: false
            });
        }

        localStorage.setItem('lex_links', JSON.stringify(links));
        commit('SET_LINKS', links);
        
        return true;
    } catch (error) {
        console.error('[Links] Save error:', error);
        throw error;
    }
});

store.registerAction('deleteLink', async ({ commit, state }, idx) => {
    try {
        const links = [...state.links];
        links.splice(idx, 1);
        localStorage.setItem('lex_links', JSON.stringify(links));
        commit('SET_LINKS', links);
    } catch (error) {
        console.error('[Links] Delete error:', error);
        throw error;
    }
});

store.registerAction('toggleLinkFavorite', async ({ commit, state }, idx) => {
    try {
        const links = [...state.links];
        if (links[idx]) {
            links[idx].favorite = !links[idx].favorite;
            localStorage.setItem('lex_links', JSON.stringify(links));
            commit('SET_LINKS', links);
        }
    } catch (error) {
        console.error('[Links] Toggle favorite error:', error);
    }
});

export default {
    load: () => store.dispatch('loadLinks'),
    save: (link) => store.dispatch('saveLink', link),
    delete: (idx) => store.dispatch('deleteLink', idx),
    toggleFavorite: (idx) => store.dispatch('toggleLinkFavorite', idx),
    setEditing: (idx) => store.commit('SET_EDITING_LINK', idx)
};
