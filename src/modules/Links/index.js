/**
 * Links Module - Entry Point
 */

import LinksStore from './LinksStore.js';
import linksView from './LinksView.js';

export default {
    init: () => linksView.init(),
    destroy: () => linksView.destroy?.(),
    view: linksView,
    store: LinksStore
};
