/**
 * Cars Module - Entry Point
 */

import CarsStore from './CarsStore.js';
import carsView from './CarsView.js';

/**
 * Bridge global functions for legacy HTML compatibility
 */
const bridgeLegacyFunctions = () => {
    // Modal operations
    window.openAddCarModal = () => carsView.openAddCarModal();
    window.saveNewCar = () => carsView.saveNewCar();
    window.closeAddCarModal = () => carsView.closeAddCarModal();

    // Calculator in Add Modal
    window.calcModalValuation = () => carsView.calculateModalValuation();

    // Car Details operations
    // Note: openCarDetails is handled via window.openCar in main.js bridge or click listeners
    window.saveCarDetails = () => carsView.saveCarDetails();
    window.closeCarDetailsModal = () => carsView.closeDetailsModal();
    window.updateCarValuation = () => carsView.updateCarValuation();

    // Copy helper (might be in utils, but ensure it's available)
    window.copyToClipboard = (elementId) => {
        const el = document.getElementById(elementId);
        if (el) {
            navigator.clipboard.writeText(el.value || el.textContent)
                .then(() => alert('Skopiowano do schowka!'))
                .catch(err => console.error('Błąd kopiowania:', err));
        }
    };

    // Ensure constants are available if HTML relies on them (unlikely for logic, but possible)
    window.CAR_STATUSES = CarsStore.constants.CAR_STATUSES;
};

export default {
    load: () => CarsStore.load(),
    init: () => {
        carsView.init();
        bridgeLegacyFunctions();
    },
    destroy: () => carsView.destroy(),
    carsView,
    CarsStore
};
