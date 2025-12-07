#!/bin/bash
# Script do automatycznego generowania struktury modułu ES6

if [ -z "$1" ]; then
    echo "Usage: ./generate-module.sh ModuleName"
    exit 1
fi

MODULE_NAME=$1
MODULE_PATH="src/modules/$MODULE_NAME"

# Utwórz folder
mkdir -p $MODULE_PATH

# index.js
cat > $MODULE_PATH/index.js << EOF
/**
 * $MODULE_NAME Module - Entry Point
 */

import ${MODULE_NAME}Store from './${MODULE_NAME}Store.js';
import { ${MODULE_NAME}View } from './${MODULE_NAME}View.js';

const view = new ${MODULE_NAME}View();

export default {
    init: () => view.init(),
    destroy: () => view.destroy(),
    store: ${MODULE_NAME}Store
};
EOF

# Store
cat > $MODULE_PATH/${MODULE_NAME}Store.js << EOF
/**
 * $MODULE_NAME Store - State Management
 */

import store from '../../store/index.js';

// Mutations
store.registerMutation('SET_${MODULE_NAME}_DATA', (state, data) => {
    state.${MODULE_NAME,,}Data = data;
});

// Actions
store.registerAction('load${MODULE_NAME}Data', async ({ commit, state }) => {
    if (!state.db) throw new Error('Database not initialized');
    
    commit('SET_LOADING', true);
    try {
        const data = await state.db.getAll('${MODULE_NAME,,}');
        commit('SET_${MODULE_NAME}_DATA', data);
        return data;
    } finally {
        commit('SET_LOADING', false);
    }
});

export default {
    loadData: () => store.dispatch('load${MODULE_NAME}Data')
};
EOF

# View
cat > $MODULE_PATH/${MODULE_NAME}View.js << EOF
/**
 * $MODULE_NAME View - UI Logic
 */

import store from '../../store/index.js';

export class ${MODULE_NAME}View {
    constructor() {
        this.container = null;
        this.unsubscribe = null;
    }
    
    init() {
        console.log('[$MODULE_NAME] Initializing...');
        
        this.container = document.getElementById('${MODULE_NAME,,}-view');
        if (!this.container) {
            console.error('[$MODULE_NAME] Container not found');
            return;
        }
        
        this.render();
        this.setupEventListeners();
        this.subscribeToStore();
    }
    
    render() {
        // TODO: Implement rendering logic
        const data = store.get('${MODULE_NAME,,}Data') || [];
        console.log('[$MODULE_NAME] Rendering with data:', data);
    }
    
    setupEventListeners() {
        // TODO: Add event listeners
    }
    
    subscribeToStore() {
        this.unsubscribe = store.subscribe('${MODULE_NAME,,}Data', (data) => {
            console.log('[$MODULE_NAME] Data updated:', data);
            this.render();
        });
    }
    
    destroy() {
        console.log('[$MODULE_NAME] Destroying...');
        
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        
        // TODO: Remove event listeners
        // TODO: Clear container
    }
}
EOF

echo "✅ Module $MODULE_NAME created at $MODULE_PATH"
echo ""
echo "Files created:"
echo "  - $MODULE_PATH/index.js"
echo "  - $MODULE_PATH/${MODULE_NAME}Store.js"
echo "  - $MODULE_PATH/${MODULE_NAME}View.js"
echo ""
echo "Next steps:"
echo "  1. Implement logic in ${MODULE_NAME}View.js"
echo "  2. Add mutations/actions in ${MODULE_NAME}Store.js"
echo "  3. Import in src/main.js"
echo "  4. Test: npm run dev"
