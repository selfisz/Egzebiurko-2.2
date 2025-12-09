/**
 * Links Store - State Management (localStorage based)
 */

import store from '../../store/index.js';

// Add links to initial state
if (!store.state.links) store.state.links = [];
// Keep editingLinkId only if it already exists to avoid overwriting
if (typeof store.state.editingLinkId === 'undefined') store.state.editingLinkId = null;
// New: full editingLink object used by LinksView
if (typeof store.state.editingLink === 'undefined') store.state.editingLink = null;

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

store.registerMutation('SET_EDITING_LINK', (state, payload) => {
	// Accept: null, index, id or full link object
	if (payload === null || typeof payload === 'undefined') {
		state.editingLinkId = null;
		state.editingLink = null;
		return;
	}

	let link = null;

	if (typeof payload === 'number') {
		// Index in links array
		state.editingLinkId = payload;
		link = (state.links || [])[payload] || null;
	} else if (typeof payload === 'string') {
		// Link id
		link = (state.links || []).find(l => l.id === payload) || null;
		state.editingLinkId = link ? state.links.indexOf(link) : null;
	} else if (payload && typeof payload === 'object') {
		// Full link object
		link = (state.links || []).find(l => l.id === payload.id) || payload;
		state.editingLinkId = state.links.indexOf(link);
	}

	state.editingLink = link;
});

// Helper: map raw localStorage entries to view-model links
function mapRawToLinks(raw) {
	return (raw || []).map((link, idx) => ({
		id: link.id ?? String(idx),
		// Keep both legacy name and new title in sync
		name: link.name ?? link.title ?? '',
		title: link.title ?? link.name ?? '',
		url: link.url ?? '',
		category: link.category ?? '',
		description: link.description ?? '',
		favorite: !!link.favorite
	}));
}

// Helper: persist view-model links back to localStorage in legacy-compatible format
function persistLinksToLocalStorage(links) {
	const serialized = (links || []).map(link => ({
		// Legacy fields used by js/modules/links.js
		name: link.name ?? link.title ?? '',
		url: link.url ?? '',
		category: link.category ?? '',
		favorite: !!link.favorite,
		// Extra fields for ES6 LinksView (legacy will ignore them)
		id: link.id,
		title: link.title ?? link.name ?? '',
		description: link.description ?? ''
	}));
	localStorage.setItem('lex_links', JSON.stringify(serialized));
}

// Actions
store.registerAction('loadLinks', async ({ commit }) => {
	try {
		const raw = JSON.parse(localStorage.getItem('lex_links') || '[]');
		const links = mapRawToLinks(raw);
		commit('SET_LINKS', links);
		return links;
	} catch (error) {
		console.error('[Links] Load error:', error);
		commit('SET_LINKS', []);
		return [];
	}
});

store.registerAction('createLink', async ({ commit, state }, link) => {
	try {
		const newLink = {
			...link,
			id: String(Date.now()),
			favorite: false
		};
		const links = [...state.links];
		links.push(newLink);
		persistLinksToLocalStorage(links);
		commit('SET_LINKS', links);
		return newLink;
	} catch (error) {
		console.error('[Links] Create error:', error);
		throw error;
	}
});

store.registerAction('updateLink', async ({ commit, state }, { id, data }) => {
	try {
		const links = [...state.links];
		const idx = links.findIndex(link => link.id === id);
		if (idx !== -1) {
			links[idx] = { ...links[idx], ...data };
			persistLinksToLocalStorage(links);
			commit('SET_LINKS', links);
		}
	} catch (error) {
		console.error('[Links] Update error:', error);
	}
});

store.registerAction('removeLink', async ({ commit, state }, id) => {
	try {
		const links = [...state.links];
		const idx = links.findIndex(link => link.id === id);
		if (idx !== -1) {
			links.splice(idx, 1);
			persistLinksToLocalStorage(links);
			commit('SET_LINKS', links);
		}
	} catch (error) {
		console.error('[Links] Remove error:', error);
	}
});

store.registerAction('toggleLinkFavoriteById', async ({ commit, state }, id) => {
	try {
		const links = [...state.links];
		const idx = links.findIndex(link => link.id === id);
		if (idx !== -1) {
			links[idx].favorite = !links[idx].favorite;
			persistLinksToLocalStorage(links);
			commit('SET_LINKS', links);
		}
	} catch (error) {
		console.error('[Links] Toggle favorite error:', error);
	}
});

// Legacy-style save by index (used only by old API) – now a thin wrapper
store.registerAction('saveLink', async ({ state, dispatch, commit }, linkData) => {
	try {
		let formattedUrl = linkData.url;
		if (!formattedUrl.startsWith('http')) {
			formattedUrl = 'https://' + formattedUrl;
		}

		if (state.editingLinkId !== null) {
			const existing = (state.links || [])[state.editingLinkId];
			if (!existing) return true;
			await dispatch('updateLink', {
				id: existing.id,
				data: {
					name: linkData.name,
					title: linkData.name,
					url: formattedUrl,
					category: linkData.category
				}
			});
			commit('SET_EDITING_LINK', null);
		} else {
			await dispatch('createLink', {
				name: linkData.name,
				title: linkData.name,
				url: formattedUrl,
				category: linkData.category
			});
		}

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
        persistLinksToLocalStorage(links);
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
            persistLinksToLocalStorage(links);
            commit('SET_LINKS', links);
        }
    } catch (error) {
        console.error('[Links] Toggle favorite error:', error);
    }
});

export default {
	// Core id-based API used by LinksView
	load: () => store.dispatch('loadLinks'),
	create: (link) => store.dispatch('createLink', link),
	update: (id, data) => store.dispatch('updateLink', { id, data }),
	remove: (id) => store.dispatch('removeLink', id),
	toggleFavorite: (id) => store.dispatch('toggleLinkFavoriteById', id),
	edit: (idOrLink) => store.commit('SET_EDITING_LINK', idOrLink),

	// Backward-compatible index-based API (used nowhere in new code, but kept for safety)
	save: (link) => store.dispatch('saveLink', link),
	delete: (idx) => store.dispatch('deleteLink', idx),
	setEditing: (idx) => store.commit('SET_EDITING_LINK', idx)
};
