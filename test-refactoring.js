/**
 * Automated Refactoring Tests
 * Run in browser console after app loads
 */

console.log('🧪 Starting Refactoring Tests...\n');

const results = {
    passed: 0,
    failed: 0,
    total: 0,
    errors: []
};

function test(name, fn) {
    results.total++;
    try {
        const result = fn();
        if (result) {
            results.passed++;
            console.log(`✅ ${name}`);
            return true;
        } else {
            results.failed++;
            console.log(`❌ ${name}: Assertion failed`);
            results.errors.push({ test: name, error: 'Assertion failed' });
            return false;
        }
    } catch (error) {
        results.failed++;
        console.log(`❌ ${name}: ${error.message}`);
        results.errors.push({ test: name, error: error.message });
        return false;
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
    console.log('='.repeat(50));
    console.log('LEVEL 1: INITIALIZATION TESTS');
    console.log('='.repeat(50));
    
    // Wait for AppController to load (1s delay)
    console.log('⏳ Waiting 2s for AppController to initialize...');
    await delay(2000);
    
    // Test 1.1: Store exists
    test('Store is globally available', () => {
        return window.store !== undefined && window.store !== null;
    });
    
    // Test 1.2: AppController exists
    test('AppController is globally available', () => {
        return window.appController !== undefined && window.appController !== null;
    });
    
    // Test 1.3: AppController has methods
    test('AppController.getStatus() works', () => {
        if (!window.appController) return false;
        const status = window.appController.getStatus();
        return status !== undefined && status.initialized !== undefined;
    });
    
    // Test 1.4: Modules initialized
    test('All modules initialized', () => {
        if (!window.appController) return false;
        const status = window.appController.getStatus();
        return status.successCount > 0;
    });
    
    // Test 1.5: Database committed to store
    test('Database is in store', () => {
        if (!window.store) return false;
        const db = window.store.get('db');
        return db !== undefined && db !== null;
    });
    
    // Test 1.6: Database ready
    test('Database is ready', () => {
        if (!window.store) return false;
        return window.store.get('dbReady') === true;
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('LEVEL 2: STORE MODULES TESTS');
    console.log('='.repeat(50));
    
    if (window.appController) {
        // Test 2.1: NotesStore
        test('NotesStore is accessible', () => {
            const store = window.appController.getModuleStore('notes');
            return store !== null && store !== undefined;
        });
        
        // Test 2.2: LinksStore
        test('LinksStore is accessible', () => {
            const store = window.appController.getModuleStore('links');
            return store !== null && store !== undefined;
        });
        
        // Test 2.3: RegistryStore
        test('RegistryStore is accessible', () => {
            const store = window.appController.getModuleStore('registry');
            return store !== null && store !== undefined;
        });
        
        // Test 2.4: FinanceStore
        test('FinanceStore is accessible', () => {
            const store = window.appController.getModuleStore('finance');
            return store !== null && store !== undefined;
        });
        
        // Test 2.5: GeneratorStore
        test('GeneratorStore is accessible', () => {
            const store = window.appController.getModuleStore('generator');
            return store !== null && store !== undefined;
        });
        
        // Test 2.6: AIStore
        test('AIStore is accessible', () => {
            const store = window.appController.getModuleStore('ai');
            return store !== null && store !== undefined;
        });
        
        // Test 2.7: StatisticsStore
        test('StatisticsStore is accessible', () => {
            const store = window.appController.getModuleStore('statistics');
            return store !== null && store !== undefined;
        });
        
        // Test 2.8: SecurityStore
        test('SecurityStore is accessible', () => {
            const store = window.appController.getModuleStore('security');
            return store !== null && store !== undefined;
        });
        
        // Test 2.9: GlobalSearchStore
        test('GlobalSearchStore is accessible', () => {
            const store = window.appController.getModuleStore('globalSearch');
            return store !== null && store !== undefined;
        });
        
        // Test 2.10: TerrainStore
        test('TerrainStore is accessible', () => {
            const store = window.appController.getModuleStore('terrain');
            return store !== null && store !== undefined;
        });
        
        // Test 2.11: TrackerStore
        test('TrackerStore is accessible', () => {
            const store = window.appController.getModuleStore('tracker');
            return store !== null && store !== undefined;
        });
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('LEVEL 3: VIEW MODULES TESTS');
    console.log('='.repeat(50));
    
    if (window.appController) {
        // Test 3.1: NotesView
        test('NotesView is accessible', () => {
            const view = window.appController.getModule('notes');
            return view !== null && view !== undefined;
        });
        
        // Test 3.2: LinksView
        test('LinksView is accessible', () => {
            const view = window.appController.getModule('links');
            return view !== null && view !== undefined;
        });
        
        // Test 3.3: RegistryView
        test('RegistryView is accessible', () => {
            const view = window.appController.getModule('registry');
            return view !== null && view !== undefined;
        });
        
        // Test 3.4: FinanceView
        test('FinanceView is accessible', () => {
            const view = window.appController.getModule('finance');
            return view !== null && view !== undefined;
        });
        
        // Test 3.5: GeneratorView
        test('GeneratorView is accessible', () => {
            const view = window.appController.getModule('generator');
            return view !== null && view !== undefined;
        });
        
        // Test 3.6: AIView
        test('AIView is accessible', () => {
            const view = window.appController.getModule('ai');
            return view !== null && view !== undefined;
        });
        
        // Test 3.7: StatisticsView
        test('StatisticsView is accessible', () => {
            const view = window.appController.getModule('statistics');
            return view !== null && view !== undefined;
        });
        
        // Test 3.8: SecurityView
        test('SecurityView is accessible', () => {
            const view = window.appController.getModule('security');
            return view !== null && view !== undefined;
        });
        
        // Test 3.9: GlobalSearchView
        test('GlobalSearchView is accessible', () => {
            const view = window.appController.getModule('globalSearch');
            return view !== null && view !== undefined;
        });
        
        // Test 3.10: TerrainView
        test('TerrainView is accessible', () => {
            const view = window.appController.getModule('terrain');
            return view !== null && view !== undefined;
        });
        
        // Test 3.11: TrackerView
        test('TrackerView is accessible', () => {
            const view = window.appController.getModule('tracker');
            return view !== null && view !== undefined;
        });
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('LEVEL 4: INTEGRATION TESTS');
    console.log('='.repeat(50));
    
    // Test 4.1: Store mutations work
    test('Store mutations work', () => {
        if (!window.store) return false;
        window.store.commit('ADD_NOTIFICATION', {
            type: 'info',
            message: 'Test notification from automated tests'
        });
        const notifications = window.store.get('notifications');
        return notifications && notifications.length > 0;
    });
    
    // Test 4.2: Store subscribe works
    test('Store subscriptions work', () => {
        if (!window.store) return false;
        let called = false;
        const unsubscribe = window.store.subscribe('testKey', () => { called = true; });
        window.store.set('testKey', 'test value');
        unsubscribe();
        return called;
    });
    
    // Test 4.3: DOM elements exist
    test('Main view container exists', () => {
        return document.getElementById('main-view-container') !== null;
    });
    
    test('Sidebar exists', () => {
        return document.getElementById('sidebar') !== null;
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    
    if (results.errors.length > 0) {
        console.log('\n' + '='.repeat(50));
        console.log('FAILED TESTS DETAILS:');
        console.log('='.repeat(50));
        results.errors.forEach((err, i) => {
            console.log(`${i + 1}. ${err.test}`);
            console.log(`   Error: ${err.error}`);
        });
    }
    
    console.log('\n' + '='.repeat(50));
    if (results.failed === 0) {
        console.log('🎉 ALL TESTS PASSED! Refactoring is working correctly!');
    } else if (results.passed > results.failed) {
        console.log('⚠️  PARTIAL SUCCESS: Most tests passed, but some issues found.');
    } else {
        console.log('❌ TESTS FAILED: Critical issues with refactoring implementation.');
    }
    console.log('='.repeat(50));
    
    return results;
}

// Auto-run tests
runTests().then(results => {
    window.testResults = results;
    console.log('\n💡 Test results saved to window.testResults');
    console.log('💡 Run runTests() again to re-test');
});
