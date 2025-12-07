/**
 * Statistics Module - Data Analysis and Reporting
 */

import StatisticsStore from './StatisticsStore.js';

/**
 * Initialize Statistics module
 */
function init() {
    console.log('[Statistics] Module initialized');
}

export default {
    init,
    store: StatisticsStore,
    ...StatisticsStore
};
