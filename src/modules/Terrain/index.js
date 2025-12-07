/**
 * Terrain Module - Entry Point
 */

import TerrainStore from './TerrainStore.js';
import terrainView from './TerrainView.js';

export default {
    init: () => terrainView.init(),
    destroy: () => terrainView.destroy?.(),
    view: terrainView,
    store: TerrainStore
};
