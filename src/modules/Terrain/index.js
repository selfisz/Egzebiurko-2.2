/**
 * Terrain Module - Entry Point
 */

import TerrainStore from './TerrainStore.js';
import { TerrainView } from './TerrainView.js';

const view = new TerrainView();

export default {
    init: () => view.init(),
    destroy: () => view.destroy(),
    store: TerrainStore
};
