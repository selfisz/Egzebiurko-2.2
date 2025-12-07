/**
 * Security Module - PIN Protection and App Locking
 */

import SecurityStore from './SecurityStore.js';

/**
 * Initialize Security module
 */
function init() {
    console.log('[Security] Module initialized');
}

export default {
    init,
    store: SecurityStore,
    ...SecurityStore
};
