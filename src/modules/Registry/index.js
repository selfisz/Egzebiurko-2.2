/**
 * Registry Module - Entry Point
 */

import RegistryStore from './RegistryStore.js';
import registryView from './RegistryView.js';

export default {
    // Ładowanie danych (bailiffs) do store
    load: () => RegistryStore.load(),
    
    // Inicjalizacja widoku
    init: () => registryView.init(),
    destroy: () => registryView.destroy?.(),
    view: registryView,
    store: RegistryStore
};
