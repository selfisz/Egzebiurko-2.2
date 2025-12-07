/**
 * Notes Module - Entry Point
 */

import NotesStore from './NotesStore.js';
import { NotesView } from './NotesView.js';

const view = new NotesView();

export default {
    init: () => view.init(),
    destroy: () => view.destroy(),
    store: NotesStore
};
