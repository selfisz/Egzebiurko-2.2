/**
 * Cars Module - Entry Point
 */

import CarsStore from './CarsStore.js';
import carsView from './CarsView.js';

export default {
    load: () => CarsStore.load(),
    init: () => carsView.init(),
    destroy: () => carsView.destroy(),
    carsView,
    CarsStore
};
