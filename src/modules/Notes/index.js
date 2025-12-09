/**
 * Notes Module - Entry Point
 */

import NotesStore from './NotesStore.js';
import notesView from './NotesView.js';

export default {
    // Ładowanie notatek z IndexedDB do store
    load: () => NotesStore.load(),

    // Inicjalizacja widoku
    init: () => notesView.init(),
    destroy: () => notesView.destroy?.(),
    view: notesView,
    store: NotesStore
};
