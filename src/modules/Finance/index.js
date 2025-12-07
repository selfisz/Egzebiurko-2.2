/**
 * Finance Module - Entry Point
 */

import FinanceStore from './FinanceStore.js';
import { FinanceView } from './FinanceView.js';

const view = new FinanceView();

export default {
    init: () => view.init(),
    destroy: () => view.destroy(),
    store: FinanceStore
};
