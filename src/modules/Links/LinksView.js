/**
 * Links View - UI Rendering and User Interactions
 */

import store from '../../store/index.js';
import LinksStore from './LinksStore.js';

class LinksView {
    constructor() {
        this.container = null;
        this.linksList = null;
        this.modal = null;
        this.categoryFilter = null;
        this.searchInput = null;
        this.activeLinkId = null;
    }

    /**
     * Initialize Links View
     */
    init() {
        console.log('[LinksView] Initializing...');
        
        // Get DOM elements
        this.container = document.getElementById('linksList');
        this.searchInput = document.getElementById('linksSearch');
        this.categoryFilter = document.getElementById('linksCategoryFilter');
        this.modal = document.getElementById('linkModal');
        this.editor = {
            title: document.getElementById('linkTitle'),
            url: document.getElementById('linkUrl'),
            category: document.getElementById('linkCategory'),
            description: document.getElementById('linkDescription'),
            saveBtn: document.getElementById('saveLinkBtn'),
            newBtn: document.getElementById('newLinkBtn'),
            cancelBtn: document.getElementById('cancelLinkBtn'),
            favoriteBtn: document.getElementById('favoriteLinkBtn')
        };

        // Setup event listeners
        this.setupEventListeners();
        
        // Subscribe to store changes
        this.setupStoreSubscriptions();
        
        console.log('[LinksView] Initialized successfully');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search functionality
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.filterLinks();
            });
        }

        // Category filter
        if (this.categoryFilter) {
            this.categoryFilter.addEventListener('change', (e) => {
                this.filterLinks();
            });
        }

        // Modal controls
        if (this.editor.newBtn) {
            this.editor.newBtn.addEventListener('click', () => {
                this.openModal();
            });
        }

        if (this.editor.saveBtn) {
            this.editor.saveBtn.addEventListener('click', () => {
                this.saveCurrentLink();
            });
        }

        if (this.editor.cancelBtn) {
            this.editor.cancelBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        if (this.editor.favoriteBtn) {
            this.editor.favoriteBtn.addEventListener('click', () => {
                this.toggleFavorite();
            });
        }

        // Close modal on outside click
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeModal();
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 's') {
                    e.preventDefault();
                    this.saveCurrentLink();
                }
                if (e.key === 'n') {
                    e.preventDefault();
                    this.openModal();
                }
            }
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // URL.createURL validation
        if (this.editor.url) {
            this.editor.url.addEventListener('input', () => {
                this.validateURL();
            });
        }
    }

    /**
     * Setup store subscriptions
     */
    setupStoreSubscriptions() {
        // Subscribe to links changes
        store.subscribe('links', (links) => {
            this.renderLinksList(links);
        });

        // Subscribe to editing link changes
        store.subscribe('editingLink', (link) => {
            if (link) {
                this.loadLinkIntoEditor(link);
            }
        });
    }

    /**
     * Render links list
     */
    renderLinksList(links) {
        if (!this.container) return;

        this.container.innerHTML = '';

        if (links.length === 0) {
            this.renderEmptyState();
            return;
        }

        // Group by category
        const groupedLinks = this.groupByCategory(links);

        Object.entries(groupedLinks).forEach(([category, categoryLinks]) => {
            const categorySection = this.createCategorySection(category, categoryLinks);
            this.container.appendChild(categorySection);
        });

        // Re-initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Group links by category
     */
    groupByCategory(links) {
        return links.reduce((groups, link) => {
            const category = link.category || 'Bez kategorii';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(link);
            return groups;
        }, {});
    }

    /**
     * Create category section
     */
    createCategorySection(category, links) {
        const section = document.createElement('div');
        section.className = 'mb-6';

        // Category header
        const header = document.createElement('div');
        header.className = 'flex items-center justify-between mb-3';
        header.innerHTML = `
            <h3 class="text-sm font-bold text-slate-700 dark:text-slate-300">${category}</h3>
            <span class="text-xs text-slate-500">${links.length} linków</span>
        `;
        section.appendChild(header);

        // Links grid
        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-1 gap-2';

        links.forEach(link => {
            const linkElement = this.createLinkElement(link);
            grid.appendChild(linkElement);
        });

        section.appendChild(grid);
        return section;
    }

    /**
     * Create link element
     */
    createLinkElement(link) {
        const div = document.createElement('div');
        div.className = `p-3 rounded-lg border transition-all cursor-pointer ${
            link.favorite 
                ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
        }`;
        div.dataset.linkId = link.id;

        const favicon = this.getFavicon(link.url);
        const domain = this.getDomain(link.url);

        div.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex items-start space-x-3 flex-1">
                    <img src="${favicon}" alt="" class="w-5 h-5 rounded-sm flex-shrink-0 mt-0.5" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22><path stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1%22/%22></svg>'">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center space-x-2">
                            <h4 class="text-sm font-medium text-slate-800 dark:text-white truncate">${link.title || 'Bez tytułu'}</h4>
                            ${link.favorite ? '<i data-lucide="star" class="w-3 h-3 text-yellow-500 fill-yellow-500"></i>' : ''}
                        </div>
                        <p class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">${domain}</p>
                        ${link.description ? `<p class="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">${link.description}</p>` : ''}
                    </div>
                </div>
                <div class="flex items-center space-x-1 ml-2">
                    <button onclick="event.stopPropagation(); linksView.editLink('${link.id}')" class="p-1 text-slate-400 hover:text-indigo-600 transition-colors">
                        <i data-lucide="edit-2" class="w-3 h-3"></i>
                    </button>
                    <button onclick="event.stopPropagation(); linksView.deleteLink('${link.id}')" class="p-1 text-slate-400 hover:text-red-600 transition-colors">
                        <i data-lucide="trash-2" class="w-3 h-3"></i>
                    </button>
                </div>
            </div>
        `;

        div.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                this.openLink(link.url);
            }
        });

        return div;
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        this.container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8 text-center">
                <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                    <i data-lucide="link" size="28" class="text-slate-300 dark:text-slate-600"></i>
                </div>
                <p class="text-sm text-slate-400 dark:text-slate-500">Brak linków</p>
                <button class="mt-3 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm" onclick="linksView.openModal()">
                    <i data-lucide="plus" size="16" class="inline mr-1"></i>
                    Dodaj pierwszy link
                </button>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Open modal
     */
    openModal(link = null) {
        if (this.modal) {
            this.modal.classList.remove('hidden');
            
            if (link) {
                LinksStore.edit(link.id);
            } else {
                this.clearEditor();
            }

            // Focus title field
            setTimeout(() => {
                if (this.editor.title) {
                    this.editor.title.focus();
                }
            }, 100);
        }
    }

    /**
     * Close modal
     */
    closeModal() {
        if (this.modal) {
            this.modal.classList.add('hidden');
            this.clearEditor();
            LinksStore.edit(null);
        }
    }

    /**
     * Load link into editor
     */
    loadLinkIntoEditor(link) {
        if (!link) return;

        if (this.editor.title) this.editor.title.value = link.title || '';
        if (this.editor.url) this.editor.url.value = link.url || '';
        if (this.editor.category) this.editor.category.value = link.category || '';
        if (this.editor.description) this.editor.description.value = link.description || '';

        // Update favorite button
        if (this.editor.favoriteBtn) {
            this.editor.favoriteBtn.innerHTML = link.favorite 
                ? '<i data-lucide="star" class="w-4 h-4 text-yellow-500 fill-yellow-500"></i>'
                : '<i data-lucide="star" class="w-4 h-4 text-slate-400"></i>';
        }

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Clear editor
     */
    clearEditor() {
        if (this.editor.title) this.editor.title.value = '';
        if (this.editor.url) this.editor.url.value = '';
        if (this.editor.category) this.editor.category.value = '';
        if (this.editor.description) this.editor.description.value = '';
        
        if (this.editor.favoriteBtn) {
            this.editor.favoriteBtn.innerHTML = '<i data-lucide="star" class="w-4 h-4 text-slate-400"></i>';
        }
    }

    /**
     * Save current link
     */
    async saveCurrentLink() {
        try {
            const editingLink = store.get('editingLink');
            const linkData = {
                title: this.editor.title?.value || '',
                url: this.editor.url?.value || '',
                category: this.editor.category?.value || '',
                description: this.editor.description?.value || ''
            };

            if (!linkData.url) {
                store.commit('ADD_NOTIFICATION', {
                    type: 'error',
                    message: 'URL URL.createURL jest wymagany'
                });
                return;
            }

            if (!this.isValidURL(linkData.url)) {
                store.commit('ADD_NOTIFICATION', {
                    type: 'error',
                    message: 'Podaj poprawny adres URL'
                });
                return;
            }

            if (editingLink) {
                await LinksStore.update(editingLink.id, linkData);
            } else {
                await LinksStore.create(linkData);
            }

            this.closeModal();

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Link zapisany'
            });
        } catch (error) {
            console.error('[LinksView] Save link error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd zapisu linku'
            });
        }
    }

    /**
     * Edit link
     */
    editLink(linkId) {
        const link = store.get('links').find(l => l.id === linkId);
        if (link) {
            this.openModal(link);
        }
    }

    /**
     * Delete link
     */
    async deleteLink(linkId) {
        try {
            if (!confirm('Czy na pewno usunąć ten link?')) return;

            await LinksStore.remove(linkId);

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Link usunięty'
            });
        } catch (error) {
            console.error('[LinksView] Delete link error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd usuwania linku'
            });
        }
    }

    /**
     * Toggle favorite
     */
    async toggleFavorite() {
        try {
            const editingLink = store.get('editingLink');
            if (!editingLink) return;

            await LinksStore.toggleFavorite(editingLink.id);
            
            // Update button
            const updated = store.get('links').find(l => l.id === editingLink.id);
            if (updated && this.editor.favoriteBtn) {
                this.editor.favoriteBtn.innerHTML = updated.favorite 
                    ? '<i data-lucide="star" class="w-4 h-4 text-yellow-500 fill-yellow-500"></i>'
                    : '<i data-lucide="star" class="w-4 h-4 text-slate-400"></i>';
            }

            if (window.lucide) {
                lucide.createIcons();
            }
        } catch (error) {
            console.error('[LinksView] Toggle favorite error:', error);
        }
    }

    /**
     * Filter links
     */
    filterLinks() {
        try {
            const links = store.get('links');
            const searchQuery = this.searchInput?.value || '';
            const selectedCategory = this.categoryFilter?.value || '';

            let filtered = links;

            // Filter by search query
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                filtered = filtered.filter(link =>
                    (link.title && link.title.toLowerCase().includes(query)) ||
                    (link.description && link.description.toLowerCase().includes(query)) ||
                    (link.url && link.url.toLowerCase().includes(query)) ||
                    (link.category && link.category.toLowerCase().includes(query))
                );
            }

            // Filter by category
            if (selectedCategory) {
                filtered = filtered.filter(link => 
                    (link.category || 'Bez kategorii') === selectedCategory
                );
            }

            this.renderLinksList(filtered);
        } catch (error) {
            console.error('[LinksView] Filter links error:', error);
        }
    }

    /**
     * Open link in new tab
     */
    openLink(url) {
        if (!url) return;
        
        // Ensure URL has protocol
        let finalUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            finalUrl = 'https://' + url;
        }
        
        window.open(finalUrl, '_blank');
    }

    /**
     * Validate URL.createURL format
     */
    validateURL() {
        if (!this.editor.url) return;

        const url = this.editor.url.value;
        const isValid = this.isValidURL(url);

        this.editor.url.classList.toggle('border-red-500', url && !isValid);
        this.editor.url.classList.toggle('border-green-500', url && isValid);
    }

    /**
     * Check if URL.createURL is valid
     */
    isValidURL(url) {
        if (!url) return false;
        
        try {
            new URL(url.startsWith('http') ? url : 'https://' + url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get favicon URL URL.createURL
     */
    getFavicon(url) {
        if (!url) return '';
        
        try {
            const domain = new URL(url.startsWith('http') ? url : 'https://' + url).origin;
            return `${domain}/favicon.ico`;
        } catch {
            return '';
        }
    }

    /**
     * Get domain from URL.createURL
     */
    getDomain(url) {
        if (!url) return '';
        
        try {
            const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
            return urlObj.hostname;
        } catch {
            return url;
        }
    }

    /**
     * Update category filter options
     */
    updateCategoryFilter() {
        if (!this.categoryFilter) return;

        const links = store.get('links');
        const categories = [...new Set(links.map(link => link.category || 'Bez kategorii'))];
        
        // Clear existing options except first one
        while (this.categoryFilter.children.length > 1) {
            this.categoryFilter.removeChild(this.categoryFilter.lastChild);
        }

        // Add category options
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            this.categoryFilter.appendChild(option);
        });
    }
}

// Create and export singleton instance
const linksView = new LinksView();

export default linksView;