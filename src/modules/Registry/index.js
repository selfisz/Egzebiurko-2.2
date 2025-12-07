/**
 * Registry Module - Entry Point
 */

import RegistryStore from './RegistryStore.js';
import { RegistryView } from './RegistryView.js';

const view = new RegistryView();

export default {
    init: () => view.init(),
    destroy: () => view.destroy(),
    store: RegistryStore
};
