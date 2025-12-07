/**
 * Notes Module - Entry Point
 */

import NotesStore from './NotesStore.js';
import notesView from './NotesView.js';

export default {
    init: () => notesView.init(),
    destroy: () => notesView.destroy?.(),
    view: notesView,
    store: NotesStore
};
