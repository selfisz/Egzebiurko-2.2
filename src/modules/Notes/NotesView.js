/**
 * Notes View - UI Rendering and User Interactions
 */

import store from '../../store/index.js';
import NotesStore from './NotesStore.js';

class NotesView {
    constructor() {
        this.container = null;
        this.searchInput = null;
        this.editor = null;
    }

    /**
     * Initialize Notes View
     */
    init() {
        console.log('[NotesView] Initializing...');
        
        // Get DOM elements - may not exist if module not loaded yet
        this.container = document.getElementById('notesList');
        this.searchInput = document.getElementById('notesSearch');
        this.editor = document.getElementById('notesEditor');
        
        // Only setup if container exists (module is loaded)
        if (!this.container) {
            console.log('[NotesView] Container not found - module not loaded yet');
            return;
        }

        // Setup event listeners
        this.setupEventListeners();
        
        // Subscribe to store changes
        this.setupStoreSubscriptions();
        
        console.log('[NotesView] Initialized successfully');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search functionality
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.filterNotes(e.target.value);
            });
        }

        // Editor controls
        if (this.editor.newBtn) {
            this.editor.newBtn.addEventListener('click', () => {
                this.createNewNote();
            });
        }

        if (this.editor.saveBtn) {
            this.editor.saveBtn.addEventListener('click', () => {
                this.saveCurrentNote();
            });
        }

        if (this.editor.deleteBtn) {
            this.editor.deleteBtn.addEventListener('click', () => {
                this.deleteCurrentNote();
            });
        }

        // Auto-save on content change
        if (this.editor.content) {
            this.editor.content.addEventListener('input', () => {
                this.autoSave();
            });
        }

        if (this.editor.title) {
            this.editor.title.addEventListener('input', () => {
                this.autoSave();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 's') {
                    e.preventDefault();
                    this.saveCurrentNote();
                }
                if (e.key === 'n') {
                    e.preventDefault();
                    this.createNewNote();
                }
            }
        });
    }

    /**
     * Setup store subscriptions
     */
    setupStoreSubscriptions() {
        // Subscribe to notes changes
        store.subscribe('notes', (notes) => {
            this.renderNotesList(notes);
        });

        // Subscribe to active note changes
        store.subscribe('activeNoteId', (noteId) => {
            this.highlightActiveNote(noteId);
        });
    }

    /**
     * Render notes list
     */
    renderNotesList(notes) {
        if (!this.container) return;

        this.container.innerHTML = '';

        if (notes.length === 0) {
            this.renderEmptyState();
            return;
        }

        notes.forEach(note => {
            const noteElement = this.createNoteElement(note);
            this.container.appendChild(noteElement);
        });

        // Re-initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Create note element
     */
    createNoteElement(note) {
        const div = document.createElement('div');
        div.className = `note-item p-3 rounded-xl cursor-pointer border transition-all ${
            store.get('activeNoteId') === note.id 
                ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' 
                : 'bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'
        }`;
        div.dataset.noteId = note.id;

        const title = note.title || 'Bez tytułu';
        const content = note.content ? note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '') : '...';
        const date = new Date(note.date).toLocaleDateString();

        div.innerHTML = `
            <div class="font-bold text-sm text-slate-800 dark:text-white truncate">${title}</div>
            <div class="text-[10px] text-slate-500 truncate mt-1">${content}</div>
            <div class="text-[10px] text-slate-400 mt-2 text-right">${date}</div>
        `;

        div.addEventListener('click', () => {
            this.selectNote(note.id);
        });

        return div;
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        this.container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8 text-center">
                <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 empty-state-icon">
                    <i data-lucide="sticky-note" size="28" class="text-slate-300 dark:text-slate-600"></i>
                </div>
                <p class="text-sm text-slate-400 dark:text-slate-500">Brak notatek</p>
                <button class="mt-3 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm" onclick="notesView.createNewNote()">
                    <i data-lucide="plus" size="16" class="inline mr-1"></i>
                    Dodaj pierwszą notatkę
                </button>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Select and display note
     */
    async selectNote(noteId) {
        try {
            await NotesStore.select(noteId);
            
            const note = store.get('notes').find(n => n.id === noteId);
            if (note) {
                this.loadNoteIntoEditor(note);
            }
        } catch (error) {
            console.error('[NotesView] Select note error:', error);
        }
    }

    /**
     * Load note into editor
     */
    loadNoteIntoEditor(note) {
        if (this.editor.title) {
            this.editor.title.value = note.title || '';
        }
        if (this.editor.content) {
            this.editor.content.value = note.content || '';
        }

        // Update delete button state
        if (this.editor.deleteBtn) {
            this.editor.deleteBtn.disabled = !note.id;
        }
    }

    /**
     * Create new note
     */
    async createNewNote() {
        try {
            const newNote = await NotesStore.create({
                title: '',
                content: '',
                date: new Date().toISOString()
            });

            await NotesStore.select(newNote.id);
            this.loadNoteIntoEditor(newNote);

            // Focus title field
            if (this.editor.title) {
                this.editor.title.focus();
            }
        } catch (error) {
            console.error('[NotesView] Create note error:', error);
        }
    }

    /**
     * Save current note
     */
    async saveCurrentNote() {
        try {
            const activeNoteId = store.get('activeNoteId');
            if (!activeNoteId) {
                await this.createNewNote();
                return;
            }

            const noteData = {
                title: this.editor.title?.value || '',
                content: this.editor.content?.value || ''
            };

            await NotesStore.update(activeNoteId, noteData);

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Notatka zapisana'
            });
        } catch (error) {
            console.error('[NotesView] Save note error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd zapisu notatki'
            });
        }
    }

    /**
     * Delete current note
     */
    async deleteCurrentNote() {
        try {
            const activeNoteId = store.get('activeNoteId');
            if (!activeNoteId) return;

            if (!confirm('Czy na pewno usunąć tę notatkę?')) return;

            await NotesStore.remove(activeNoteId);
            
            // Clear editor
            if (this.editor.title) this.editor.title.value = '';
            if (this.editor.content) this.editor.content.value = '';

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Notatka usunięta'
            });
        } catch (error) {
            console.error('[NotesView] Delete note error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd usuwania notatki'
            });
        }
    }

    /**
     * Auto-save with debounce
     */
    autoSave() {
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.saveCurrentNote();
        }, 1000);
    }

    /**
     * Filter notes
     */
    async filterNotes(query) {
        try {
            const notes = store.get('notes');
            
            if (!query.trim()) {
                this.renderNotesList(notes);
                return;
            }

            const filtered = notes.filter(note =>
                (note.title && note.title.toLowerCase().includes(query.toLowerCase())) ||
                (note.content && note.content.toLowerCase().includes(query.toLowerCase()))
            );

            this.renderNotesList(filtered);
        } catch (error) {
            console.error('[NotesView] Filter notes error:', error);
        }
    }

    /**
     * Highlight active note
     */
    highlightActiveNote(noteId) {
        if (!this.container) return;

        const noteElements = this.container.querySelectorAll('.note-item');
        noteElements.forEach(element => {
            if (element.dataset.noteId === noteId.toString()) {
                element.className = 'note-item p-3 rounded-xl cursor-pointer border transition-all bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800';
            } else {
                element.className = 'note-item p-3 rounded-xl cursor-pointer border transition-all bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700';
            }
        });
    }

    /**
     * Get current note data
     */
    getCurrentNoteData() {
        return {
            title: this.editor.title?.value || '',
            content: this.editor.content?.value || ''
        };
    }

    /**
     * Clear editor
     */
    clearEditor() {
        if (this.editor.title) this.editor.title.value = '';
        if (this.editor.content) this.editor.content.value = '';
        if (this.editor.deleteBtn) this.editor.deleteBtn.disabled = true;
    }
}

// Create and export singleton instance
const notesView = new NotesView();

export default notesView;