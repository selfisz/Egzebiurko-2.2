/**
 * Generator Module - Entry Point
 */

import GeneratorStore from './GeneratorStore.js';
import generatorView from './GeneratorView.js';

export default {
    init: () => generatorView.init(),
    destroy: () => generatorView.destroy?.(),
    view: generatorView,
    store: GeneratorStore
};
