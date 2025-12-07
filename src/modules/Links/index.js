/**
 * Links Module - Entry Point
 */

import LinksStore from './LinksStore.js';
import { LinksView } from './LinksView.js';

const view = new LinksView();

export default {
    init: () => view.init(),
    destroy: () => view.destroy(),
    store: LinksStore
};
