/**
 * Test View - Pusty moduł testowy
 */

class TestView {
    constructor() {
        console.log('[TestView] Constructor called');
    }

    init() {
        console.log('[TestView] ✅ Init called - moduł działa!');
        
        // Wyświetl alert żeby było widać na stronie
        setTimeout(() => {
            alert('TestModule załadowany poprawnie! ES6 działa na Vercel.');
        }, 1000);
    }

    destroy() {
        console.log('[TestView] Destroy called');
    }
}

const testView = new TestView();

export default testView;
