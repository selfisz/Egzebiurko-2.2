/**
 * Automated Module Testing Script
 * Run in browser console after app loads
 */

const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    errors: [],
    summary: { passed: 0, failed: 0, skipped: 0 }
};

function logTest(module, test, status, details = '') {
    const result = { module, test, status, details };
    testResults.tests.push(result);
    testResults.summary[status]++;
    console.log(`[${status.toUpperCase()}] ${module} - ${test}`, details);
}

async function testRegistry() {
    console.log('\n=== Testing Registry Module ===');
    
    try {
        // Check if module exists
        if (!window.AppController?.modules?.registry) {
            logTest('Registry', 'Module availability', 'skipped', 'AppController not in DEV mode');
            return;
        }
        
        const registry = window.AppController.modules.registry;
        
        // Test 1: Check store
        if (registry.RegistryStore) {
            logTest('Registry', 'Store exists', 'passed');
        } else {
            logTest('Registry', 'Store exists', 'failed', 'RegistryStore not found');
        }
        
        // Test 2: Load bailiffs
        try {
            await registry.RegistryStore.load();
            logTest('Registry', 'Load bailiffs', 'passed');
        } catch (e) {
            logTest('Registry', 'Load bailiffs', 'failed', e.message);
        }
        
        // Test 3: Check DOM elements
        const searchInput = document.getElementById('bailiffSearch');
        if (searchInput) {
            logTest('Registry', 'Search input exists', 'passed');
        } else {
            logTest('Registry', 'Search input exists', 'failed', 'Element not found');
        }
        
    } catch (error) {
        logTest('Registry', 'General test', 'failed', error.message);
        testResults.errors.push({ module: 'Registry', error: error.message });
    }
}

async function testFinance() {
    console.log('\n=== Testing Finance Module ===');
    
    try {
        if (!window.AppController?.modules?.finance) {
            logTest('Finance', 'Module availability', 'skipped', 'AppController not in DEV mode');
            return;
        }
        
        const finance = window.AppController.modules.finance;
        
        // Test 1: Check store
        if (finance.FinanceStore) {
            logTest('Finance', 'Store exists', 'passed');
        } else {
            logTest('Finance', 'Store exists', 'failed', 'FinanceStore not found');
        }
        
        // Test 2: Test balance calculator
        try {
            const result = finance.FinanceStore.calculateBalance(1000, 500, 200);
            if (result === 300) {
                logTest('Finance', 'Balance calculator', 'passed', `Result: ${result}`);
            } else {
                logTest('Finance', 'Balance calculator', 'failed', `Expected 300, got ${result}`);
            }
        } catch (e) {
            logTest('Finance', 'Balance calculator', 'failed', e.message);
        }
        
        // Test 3: Check DOM elements
        const financeContainer = document.getElementById('financeContainer');
        if (financeContainer) {
            logTest('Finance', 'Container exists', 'passed');
        } else {
            logTest('Finance', 'Container exists', 'failed', 'Element not found');
        }
        
    } catch (error) {
        logTest('Finance', 'General test', 'failed', error.message);
        testResults.errors.push({ module: 'Finance', error: error.message });
    }
}

async function testAI() {
    console.log('\n=== Testing AI Module ===');
    
    try {
        if (!window.AppController?.modules?.ai) {
            logTest('AI', 'Module availability', 'skipped', 'AppController not in DEV mode');
            return;
        }
        
        const ai = window.AppController.modules.ai;
        
        // Test 1: Check store
        if (ai.AIStore) {
            logTest('AI', 'Store exists', 'passed');
        } else {
            logTest('AI', 'Store exists', 'failed', 'AIStore not found');
        }
        
        // Test 2: Check messages state
        try {
            const messages = ai.AIStore.getMessages();
            logTest('AI', 'Get messages', 'passed', `Messages count: ${messages?.length || 0}`);
        } catch (e) {
            logTest('AI', 'Get messages', 'failed', e.message);
        }
        
        // Test 3: Check DOM elements
        const aiInput = document.getElementById('aiInput');
        if (aiInput) {
            logTest('AI', 'Input exists', 'passed');
        } else {
            logTest('AI', 'Input exists', 'failed', 'Element not found');
        }
        
    } catch (error) {
        logTest('AI', 'General test', 'failed', error.message);
        testResults.errors.push({ module: 'AI', error: error.message });
    }
}

async function testStatistics() {
    console.log('\n=== Testing Statistics Module ===');
    
    try {
        if (!window.AppController?.modules?.statistics) {
            logTest('Statistics', 'Module availability', 'skipped', 'Module not registered or not in DEV');
            return;
        }
        
        const statistics = window.AppController.modules.statistics;
        
        // Test 1: Check store
        if (statistics.StatisticsStore) {
            logTest('Statistics', 'Store exists', 'passed');
        } else {
            logTest('Statistics', 'Store exists', 'failed', 'StatisticsStore not found');
        }
        
        // Test 2: Generate statistics
        try {
            await statistics.StatisticsStore.loadStatistics();
            logTest('Statistics', 'Load statistics', 'passed');
        } catch (e) {
            logTest('Statistics', 'Load statistics', 'failed', e.message);
        }
        
    } catch (error) {
        logTest('Statistics', 'General test', 'failed', error.message);
        testResults.errors.push({ module: 'Statistics', error: error.message });
    }
}

async function runAllTests() {
    console.clear();
    console.log('🧪 Starting Module Tests...\n');
    
    // Wait for app to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testRegistry();
    await testFinance();
    await testAI();
    await testStatistics();
    
    console.log('\n=== Test Summary ===');
    console.log(`✅ Passed: ${testResults.summary.passed}`);
    console.log(`❌ Failed: ${testResults.summary.failed}`);
    console.log(`⏭️  Skipped: ${testResults.summary.skipped}`);
    
    if (testResults.errors.length > 0) {
        console.log('\n=== Errors ===');
        testResults.errors.forEach(err => {
            console.error(`${err.module}: ${err.error}`);
        });
    }
    
    return testResults;
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    window.runModuleTests = runAllTests;
    console.log('Test script loaded. Run: runModuleTests()');
}
