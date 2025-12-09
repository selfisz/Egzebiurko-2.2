/**
 * Test Module - Entry Point
 */

import testView from './TestView.js';

export default {
    init: () => testView.init(),
    destroy: () => testView.destroy(),
    view: testView
};
