/**
 * GlobalSearch Module - Cross-module Search Functionality
 */

import GlobalSearchStore from './GlobalSearchStore.js';

/**
 * Initialize GlobalSearch module
 */
function init() {
    console.log('[GlobalSearch] Module initialized');
}

export default {
    init,
    store: GlobalSearchStore,
    ...GlobalSearchStore
};
