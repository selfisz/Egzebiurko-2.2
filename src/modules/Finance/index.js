/**
 * Finance Module - Entry Point
 */

import FinanceStore from './FinanceStore.js';
import financeView from './FinanceView.js';

export default {
    init: () => financeView.init(),
    destroy: () => financeView.destroy?.(),
    view: financeView,
    store: FinanceStore
};
