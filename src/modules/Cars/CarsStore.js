/**
 * Cars Store - State Management
 */

import store from '../../store/index.js';

// Constants
export const CAR_STATUSES = [
    "Zajęcie", 
    "Parking strzeżony", 
    "Oddane pod dozór", 
    "I Termin Licytacji", 
    "II Termin Licytacji", 
    "Sprzedaż z wolnej ręki", 
    "Inne", 
    "Sprzedane/Zakończone"
];

export const CHECKLIST_A = [
    {id: 'protocol', label: 'Protokół zajęcia'},
    {id: 'notice', label: 'Zawiadomienie'},
    {id: 'transport', label: 'Zwózka'},
    {id: 'supervision', label: 'Dozór'},
    {id: 'call', label: 'Wezwanie o wskazanie miejsca parkowania'},
    {id: 'cepik', label: 'Rejestr zastawów'},
    {id: 'police', label: 'Policja'},
    {id: 'prosecutor', label: 'Prokuratura'},
    {id: 'sold_release', label: 'Wydano po sprzedaży'}
];

export const CHECKLIST_B = [
    {id: 'keys', label: 'Kluczyki'},
    {id: 'oc', label: 'OC'},
    {id: 'review', label: 'Przegląd'},
    {id: 'registration', label: 'Dowód rejestracyjny'}
];

// Add cars to initial state
if (!store.state.cars) store.state.cars = [];
if (!store.state.activeCarId) store.state.activeCarId = null;

// Mutations
store.registerMutation('SET_CARS', (state, cars) => {
    state.cars = cars;
});

store.registerMutation('ADD_CAR', (state, car) => {
    state.cars.unshift(car);
});

store.registerMutation('UPDATE_CAR', (state, { id, data }) => {
    const index = state.cars.findIndex(c => c.id === id);
    if (index !== -1) {
        state.cars[index] = { ...state.cars[index], ...data };
    }
});

store.registerMutation('DELETE_CAR', (state, id) => {
    state.cars = state.cars.filter(c => c.id !== id);
});

store.registerMutation('TOGGLE_CAR_FAVORITE', (state, id) => {
    const car = state.cars.find(c => c.id === id);
    if (car) {
        car.favorite = !car.favorite;
    }
});

store.registerMutation('SET_ACTIVE_CAR', (state, carId) => {
    state.activeCarId = carId;
});

// Actions
store.registerAction('loadCars', async ({ commit, state }) => {
    if (!state.db) throw new Error('Database not initialized');
    
    try {
        const cars = await state.db.getAll('garage');
        cars.sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0));
        commit('SET_CARS', cars);
        return cars;
    } catch (error) {
        console.error('[Cars] Load error:', error);
        throw error;
    }
});

store.registerAction('saveCar', async ({ commit, state }, carData) => {
    if (!state.db) throw new Error('Database not initialized');
    
    try {
        carData.date = new Date().toISOString();
        
        if (carData.id) {
            await state.db.put('garage', carData);
            commit('UPDATE_CAR', { id: carData.id, data: carData });
        } else {
            carData.id = Date.now();
            await state.db.add('garage', carData);
            commit('ADD_CAR', carData);
        }
        
        return carData;
    } catch (error) {
        console.error('[Cars] Save error:', error);
        throw error;
    }
});

store.registerAction('deleteCar', async ({ commit, state }, carId) => {
    if (!state.db) throw new Error('Database not initialized');
    
    try {
        await state.db.delete('garage', carId);
        commit('DELETE_CAR', carId);
        
        commit('ADD_NOTIFICATION', {
            type: 'success',
            message: 'Pojazd został usunięty'
        });
    } catch (error) {
        console.error('[Cars] Delete error:', error);
        throw error;
    }
});

store.registerAction('toggleCarFavorite', async ({ commit, state }, carId) => {
    if (!state.db) throw new Error('Database not initialized');
    
    try {
        const car = state.cars.find(c => c.id === carId);
        if (!car) return;
        
        car.favorite = !car.favorite;
        await state.db.put('garage', car);
        
        commit('TOGGLE_CAR_FAVORITE', carId);
    } catch (error) {
        console.error('[Cars] Toggle favorite error:', error);
    }
});

export default {
    load: () => store.dispatch('loadCars'),
    save: (car) => store.dispatch('saveCar', car),
    delete: (id) => store.dispatch('deleteCar', id),
    toggleFavorite: (id) => store.dispatch('toggleCarFavorite', id),
    constants: {
        CAR_STATUSES,
        CHECKLIST_A,
        CHECKLIST_B
    }
};