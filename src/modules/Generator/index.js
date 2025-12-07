/**
 * Generator Module - Entry Point
 */

import GeneratorStore from './GeneratorStore.js';
import { GeneratorView } from './GeneratorView.js';

const view = new GeneratorView();

export default {
    init: () => view.init(),
    destroy: () => view.destroy(),
    store: GeneratorStore
};
