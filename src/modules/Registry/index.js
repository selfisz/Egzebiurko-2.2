/**
 * Registry Module - Entry Point
 */

import RegistryStore from './RegistryStore.js';
import registryView from './RegistryView.js';

export default {
    init: () => registryView.init(),
    destroy: () => registryView.destroy?.(),
    view: registryView,
    store: RegistryStore
};
