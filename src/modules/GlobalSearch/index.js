/**
 * Global Search Module - Entry Point
 */

import GlobalSearchStore from './GlobalSearchStore.js';
import globalSearchView from './GlobalSearchView.js';

export default {
    init: () => globalSearchView.init(),
    destroy: () => globalSearchView.destroy?.(),
    view: globalSearchView,
    store: GlobalSearchStore
};
