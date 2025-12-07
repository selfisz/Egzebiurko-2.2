/**
 * Centralny State Management dla aplikacji Egzebiurko
 * Prosty store inspirowany Vuex/Redux, ale lżejszy
 */

class Store {
  constructor(initialState = {}) {
    this.state = this.createReactiveState(initialState);
    this.listeners = new Map();
    this.mutations = new Map();
    this.actions = new Map();
  }

  /**
   * Tworzy reaktywny state używając Proxy
   */
  createReactiveState(state) {
    const self = this;
    return new Proxy(state, {
      set(target, property, value) {
        const oldValue = target[property];
        target[property] = value;
        
        // Powiadom subskrybentów o zmianie
        if (oldValue !== value) {
          self.notify(property, value, oldValue);
        }
        
        return true;
      }
    });
  }

  /**
   * Subskrybuj zmiany w state
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    
    // Zwróć funkcję do unsubscribe
    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Powiadom subskrybentów o zmianie
   */
  notify(key, newValue, oldValue) {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          console.error(`Error in listener for ${key}:`, error);
        }
      });
    }
    
    // Powiadom również globalnych listenerów
    const globalListeners = this.listeners.get('*');
    if (globalListeners) {
      globalListeners.forEach(callback => {
        try {
          callback(key, newValue, oldValue);
        } catch (error) {
          console.error('Error in global listener:', error);
        }
      });
    }
  }

  /**
   * Rejestruj mutację (synchroniczna zmiana state)
   */
  registerMutation(name, mutationFn) {
    this.mutations.set(name, mutationFn);
  }

  /**
   * Wykonaj mutację
   */
  commit(mutationName, payload) {
    const mutation = this.mutations.get(mutationName);
    if (!mutation) {
      console.error(`Mutation ${mutationName} not found`);
      return;
    }
    
    try {
      mutation(this.state, payload);
    } catch (error) {
      console.error(`Error in mutation ${mutationName}:`, error);
    }
  }

  /**
   * Rejestruj akcję (asynchroniczna operacja)
   */
  registerAction(name, actionFn) {
    this.actions.set(name, actionFn);
  }

  /**
   * Wykonaj akcję
   */
  async dispatch(actionName, payload) {
    const action = this.actions.get(actionName);
    if (!action) {
      console.error(`Action ${actionName} not found`);
      return;
    }
    
    try {
      return await action({
        state: this.state,
        commit: this.commit.bind(this),
        dispatch: this.dispatch.bind(this)
      }, payload);
    } catch (error) {
      console.error(`Error in action ${actionName}:`, error);
      throw error;
    }
  }

  /**
   * Pobierz wartość ze state
   */
  get(key) {
    return this.state[key];
  }

  /**
   * Ustaw wartość w state (bezpośrednio - używaj ostrożnie!)
   */
  set(key, value) {
    this.state[key] = value;
  }
}

// Inicjalizacja głównego store
const store = new Store({
  // UI State
  currentModule: 'dashboard',
  sidebarCollapsed: false,
  darkMode: false,
  
  // User State
  user: null,
  users: [],
  isAuthenticated: false,
  securityEnabled: false,
  securitySettings: {
    enabled: false,
    passwordProtection: false,
    autoLockTimer: 30,
    encryptionEnabled: false,
    accessControl: {}
  },
  
  // Data State
  cases: [],
  cars: [],
  notes: [],
  links: [],
  terrainCases: [],
  bailiffs: [],
  auditLog: [],
  
  // App State
  loading: false,
  notifications: [],
  searchQuery: '',
  
  // Database
  db: null,
  dbReady: false
});

// === MUTATIONS ===

store.registerMutation('SET_CURRENT_MODULE', (state, moduleName) => {
  state.currentModule = moduleName;
});

store.registerMutation('TOGGLE_SIDEBAR', (state) => {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  localStorage.setItem('lex_sidebar_collapsed', state.sidebarCollapsed);
});

store.registerMutation('SET_DARK_MODE', (state, enabled) => {
  state.darkMode = enabled;
  if (enabled) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('darkMode', enabled);
});

store.registerMutation('SET_CASES', (state, cases) => {
  state.cases = cases;
});

store.registerMutation('ADD_CASE', (state, caseData) => {
  state.cases.push(caseData);
});

store.registerMutation('UPDATE_CASE', (state, { id, data }) => {
  const index = state.cases.findIndex(c => c.id === id);
  if (index !== -1) {
    state.cases[index] = { ...state.cases[index], ...data };
  }
});

store.registerMutation('DELETE_CASE', (state, id) => {
  state.cases = state.cases.filter(c => c.id !== id);
});

store.registerMutation('SET_LOADING', (state, loading) => {
  state.loading = loading;
});

store.registerMutation('SET_DB', (state, db) => {
  state.db = db;
  state.dbReady = true;
});

store.registerMutation('ADD_NOTIFICATION', (state, notification) => {
  state.notifications.push({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    ...notification
  });
});

store.registerMutation('REMOVE_NOTIFICATION', (state, id) => {
  state.notifications = state.notifications.filter(n => n.id !== id);
});

// === SECURITY MUTATIONS ===

store.registerMutation('SET_SECURITY_SETTINGS', (state, settings) => {
  state.securitySettings = {
    ...(state.securitySettings || {}),
    ...settings
  };
});

store.registerMutation('SET_USERS', (state, users) => {
  state.users = Array.isArray(users) ? users : [];
});

store.registerMutation('SET_AUDIT_LOG', (state, log) => {
  state.auditLog = Array.isArray(log) ? log : [];
});

store.registerMutation('ADD_AUDIT_ENTRY', (state, entry) => {
  if (!Array.isArray(state.auditLog)) state.auditLog = [];
  state.auditLog.unshift({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    ...entry
  });
});

// === ACTIONS ===

store.registerAction('loadCases', async ({ commit, state }) => {
  if (!state.db) throw new Error('Database not initialized');
  
  commit('SET_LOADING', true);
  try {
    const cases = await state.db.getAll('cases');
    commit('SET_CASES', cases);
    return cases;
  } finally {
    commit('SET_LOADING', false);
  }
});

store.registerAction('saveCase', async ({ commit, state }, caseData) => {
  if (!state.db) throw new Error('Database not initialized');
  
  try {
    if (caseData.id) {
      await state.db.put('cases', caseData);
      commit('UPDATE_CASE', { id: caseData.id, data: caseData });
    } else {
      caseData.id = Date.now();
      await state.db.add('cases', caseData);
      commit('ADD_CASE', caseData);
    }
    
    commit('ADD_NOTIFICATION', {
      type: 'success',
      message: 'Sprawa została zapisana'
    });
    
    return caseData;
  } catch (error) {
    commit('ADD_NOTIFICATION', {
      type: 'error',
      message: 'Błąd zapisu sprawy: ' + error.message
    });
    throw error;
  }
});

store.registerAction('deleteCase', async ({ commit, state }, id) => {
  if (!state.db) throw new Error('Database not initialized');
  
  try {
    await state.db.delete('cases', id);
    commit('DELETE_CASE', id);
    commit('ADD_NOTIFICATION', {
      type: 'success',
      message: 'Sprawa została usunięta'
    });
  } catch (error) {
    commit('ADD_NOTIFICATION', {
      type: 'error',
      message: 'Błąd usuwania sprawy: ' + error.message
    });
    throw error;
  }
});

export default store;
export { Store };
