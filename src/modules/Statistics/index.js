/**
 * Statistics Module - Entry Point
 */

import StatisticsStore from './StatisticsStore.js';
import statisticsView from './StatisticsView.js';

export default {
    init: () => statisticsView.init(),
    destroy: () => statisticsView.destroy?.(),
    view: statisticsView,
    store: StatisticsStore
};
