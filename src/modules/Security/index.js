/**
 * Security Module - PIN Protection and App Locking
 */

import SecurityStore from './SecurityStore.js';
import securityView from './SecurityView.js';

/**
 * Initialize Security module
 */
function init() {
    console.log('[Security] Module initialized');
}

export default {
    init: () => securityView.init(),
    destroy: () => securityView.destroy?.(),
    view: securityView,
    store: SecurityStore
};
