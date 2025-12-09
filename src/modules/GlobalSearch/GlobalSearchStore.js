/**
 * Global Search Store - Cross-module Search Functionality
 */

import store from '../../store/index.js';

// Add search state
if (!store.state.searchQuery) store.state.searchQuery = '';
if (!store.state.searchResults) store.state.searchResults = [];
if (!store.state.searchLoading) store.state.searchLoading = false;
if (!store.state.searchIndex) store.state.searchIndex = {};

// Mutations
store.registerMutation('SET_SEARCH_QUERY', (state, query) => {
    state.searchQuery = query;
});

store.registerMutation('SET_SEARCH_RESULTS', (state, results) => {
    state.searchResults = results;
});

store.registerMutation('SET_SEARCH_LOADING', (state, loading) => {
    state.searchLoading = loading;
});

store.registerMutation('SET_SEARCH_INDEX', (state, index) => {
    state.searchIndex = index;
});

// Actions
store.registerAction('buildSearchIndex', async ({ commit, state }) => {
    if (!state.db) throw new Error('Database not initialized');
    
    try {
        const [cases, cars, notes, pdfs, bailiffs] = await Promise.all([
            state.db.getAll('cases'),
            state.db.getAll('garage'),
            state.db.getAll('notes'),
            state.db.getAll('pdfs'),
            state.db.getAll('bailiffs')
        ]);

        const index = {
            cases: cases.map(case_ => ({
                id: case_.id,
                type: 'case',
                module: 'tracker',
                title: case_.no || 'Brak numeru',
                content: `${case_.debtor || ''} ${case_.unp || ''} ${case_.note || ''}`,
                metadata: {
                    status: case_.status,
                    urgent: case_.urgent,
                    date: case_.date,
                    favorite: case_.isFavorite
                },
                url: `#tracker?case=${case_.id}`
            })),
            cars: cars.map(car => ({
                id: car.id,
                type: 'car',
                module: 'cars',
                title: `${car.make || ''} ${car.model || ''} ${car.year || ''}`.trim() || 'Pojazd',
                content: `${car.plate || ''} ${car.vin || ''} ${car.caseNumber || ''}`,
                metadata: {
                    status: car.status,
                    favorite: car.favorite,
                    date: car.date,
                    value: car.value
                },
                url: `#cars?car=${car.id}`
            })),
            notes: notes.map(note => ({
                id: note.id,
                type: 'note',
                module: 'notes',
                title: note.title || 'Bez tytułu',
                content: note.content || '',
                metadata: {
                    date: note.date
                },
                url: `#notes?note=${note.id}`
            })),
            pdfs: pdfs.map(pdf => ({
                id: pdf.id,
                type: 'pdf',
                module: 'ai',
                title: pdf.name,
                content: pdf.text || '',
                metadata: {
                    size: pdf.size,
                    pages: pdf.pages,
                    uploadedAt: pdf.uploadedAt
                },
                url: `#ai`
            })),
            bailiffs: bailiffs.map(bailiff => ({
                id: bailiff.name,
                type: 'bailiff',
                module: 'registry',
                title: bailiff.name,
                content: `${bailiff.nip || ''} ${bailiff.address || ''} ${bailiff.epu || ''}`,
                metadata: {},
                url: `#registry`
            }))
        };

        commit('SET_SEARCH_INDEX', index);
        return index;
    } catch (error) {
        console.error('[GlobalSearch] Build index error:', error);
        throw error;
    }
});

store.registerAction('search', async ({ commit, state, dispatch }, query) => {
    if (!query || query.trim().length < 2) {
        commit('SET_SEARCH_RESULTS', []);
        commit('SET_SEARCH_QUERY', query);
        return [];
    }

    commit('SET_SEARCH_LOADING', true);
    commit('SET_SEARCH_QUERY', query);

    try {
        // Build index if not exists
        if (Object.keys(state.searchIndex).length === 0) {
            await dispatch('buildSearchIndex');
        }

        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        const allResults = [];

        // Search through all indexed items
        Object.values(state.searchIndex).flat().forEach(item => {
            const title = item.title.toLowerCase();
            const content = item.content.toLowerCase();
            
            // Calculate relevance score
            let score = 0;
            let matchedTerms = [];
            
            searchTerms.forEach(term => {
                if (title.includes(term)) {
                    score += 10; // Title matches are worth more
                    matchedTerms.push(term);
                }
                if (content.includes(term)) {
                    score += 5; // Content matches
                    matchedTerms.push(term);
                }
            });

            if (score > 0) {
                allResults.push({
                    ...item,
                    score,
                    matchedTerms: [...new Set(matchedTerms)]
                });
            }
        });

        // Sort by relevance score (descending)
        const sortedResults = allResults.sort((a, b) => b.score - a.score);
        
        // Limit results to prevent overwhelming UI
        const limitedResults = sortedResults.slice(0, 50);

        commit('SET_SEARCH_RESULTS', limitedResults);
        return limitedResults;
    } catch (error) {
        console.error('[GlobalSearch] Search error:', error);
        commit('SET_SEARCH_RESULTS', []);
        throw error;
    } finally {
        commit('SET_SEARCH_LOADING', false);
    }
});

store.registerAction('searchByType', async ({ commit, state, dispatch }, { query, type }) => {
    try {
        // Build index if not exists
        if (Object.keys(state.searchIndex).length === 0) {
            await dispatch('buildSearchIndex');
        }

        const typeResults = state.searchIndex[type] || [];
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        const results = [];

        typeResults.forEach(item => {
            const title = item.title.toLowerCase();
            const content = item.content.toLowerCase();
            
            let score = 0;
            searchTerms.forEach(term => {
                if (title.includes(term)) score += 10;
                if (content.includes(term)) score += 5;
            });

            if (score > 0) {
                results.push({ ...item, score });
            }
        });

        const sortedResults = results.sort((a, b) => b.score - a.score);
        return sortedResults;
    } catch (error) {
        console.error('[GlobalSearch] Search by type error:', error);
        throw error;
    }
});

store.registerAction('getRecentSearches', async ({ commit }) => {
    try {
        const recent = JSON.parse(localStorage.getItem('recent_searches') || '[]');
        return recent.slice(0, 10); // Return last 10 searches
    } catch (error) {
        console.error('[GlobalSearch] Get recent searches error:', error);
        return [];
    }
});

store.registerAction('saveRecentSearch', async ({ commit }, query) => {
    if (!query || query.trim().length < 2) return;

    try {
        const recent = JSON.parse(localStorage.getItem('recent_searches') || '[]');
        const cleaned = query.trim();
        
        // Remove if already exists
        const filtered = recent.filter(item => item !== cleaned);
        
        // Add to beginning
        filtered.unshift(cleaned);
        
        // Keep only last 10
        const limited = filtered.slice(0, 10);
        
        localStorage.setItem('recent_searches', JSON.stringify(limited));
    } catch (error) {
        console.error('[GlobalSearch] Save recent search error:', error);
    }
});

store.registerAction('clearRecentSearches', async ({ commit }) => {
    try {
        localStorage.removeItem('recent_searches');
    } catch (error) {
        console.error('[GlobalSearch] Clear recent searches error:', error);
    }
});

store.registerAction('openSearchModal', async ({ commit }) => {
    try {
        const modal = document.getElementById('globalSearchModal');
        if (modal) {
            modal.classList.remove('hidden');
            // Focus search input
            setTimeout(() => {
                const input = document.getElementById('globalSearchInput');
                if (input) input.focus();
            }, 100);
        }
    } catch (error) {
        console.error('[GlobalSearch] Open modal error:', error);
    }
});

store.registerAction('closeSearchModal', async ({ commit }) => {
    try {
        const modal = document.getElementById('globalSearchModal');
        if (modal) {
            modal.classList.add('hidden');
            commit('SET_SEARCH_QUERY', '');
            commit('SET_SEARCH_RESULTS', []);
        }
    } catch (error) {
        console.error('[GlobalSearch] Close modal error:', error);
    }
});

export default {
    search: (query) => store.dispatch('search', query),
    searchByType: (query, type) => store.dispatch('searchByType', { query, type }),
    buildIndex: () => store.dispatch('buildSearchIndex'),
    getRecent: () => store.dispatch('getRecentSearches'),
    saveRecent: (query) => store.dispatch('saveRecentSearch', query),
    clearRecent: () => store.dispatch('clearRecentSearches'),
    openModal: () => store.dispatch('openSearchModal'),
    closeModal: () => store.dispatch('closeSearchModal'),
    getResults: () => store.get('searchResults'),
    getQuery: () => store.get('searchQuery'),
    isLoading: () => store.get('searchLoading')
};
