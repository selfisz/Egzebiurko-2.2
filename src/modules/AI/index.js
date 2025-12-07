/**
 * AI Module - Entry Point
 */

import AIStore from './AIStore.js';
import aiView from './AIView.js';

export default {
    init: () => aiView.init(),
    destroy: () => aiView.destroy?.(),
    view: aiView,
    store: AIStore
};
