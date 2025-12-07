/**
 * Cars Module - Entry Point
 */

import CarsStore from './CarsStore.js';
import { CarsView } from './CarsView.js';

const view = new CarsView();

export default {
    init: () => view.init(),
    destroy: () => view.destroy(),
    store: CarsStore
};
