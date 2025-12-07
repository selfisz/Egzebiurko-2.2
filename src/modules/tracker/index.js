/**
 * Tracker Module - Entry Point
 */

import TrackerStore from './TrackerStore.js';
import trackerView from './TrackerView.js';

export default {
    init: () => trackerView.init(),
    destroy: () => trackerView.destroy?.(),
    view: trackerView,
    store: TrackerStore
};
