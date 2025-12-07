/**
 * AI Module - Entry Point
 */

import AIStore from './AIStore.js';
import { AIView } from './AIView.js';

const view = new AIView();

export default {
    init: () => view.init(),
    destroy: () => view.destroy(),
    store: AIStore
};
