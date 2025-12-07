/**
 * Tracker Module - Case Management System
 */

import TrackerStore from './TrackerStore.js';

/**
 * Initialize Tracker module
 */
function init() {
    console.log('[Tracker] Module initialized');
}

export default {
    init,
    store: TrackerStore,
    ...TrackerStore
};
