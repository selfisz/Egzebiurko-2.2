/**
 * Links Module - Entry Point
 */

import LinksStore from './LinksStore.js';
import linksView from './LinksView.js';

export default {
    // Ładowanie linków z localStorage do store
    load: () => LinksStore.load(),

    // Inicjalizacja widoku
    init: () => linksView.init(),
    destroy: () => linksView.destroy?.(),
    view: linksView,
    store: LinksStore
};
