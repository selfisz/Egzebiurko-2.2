// Funkcja do przełączania zakładek w widoku szczegółów sprawy
function showCaseTab(tabName) {
    ['details', 'documents', 'history'].forEach(tab => {
        const el = document.getElementById(`case-${tab}-tab`);
        if (el) el.classList.toggle('hidden', tab !== tabName);
    });
    
    const tabs = document.querySelectorAll('.case-tab');
    tabs.forEach(tab => {
        tab.classList.toggle('case-tab-active', tab.textContent.toLowerCase().includes(tabName));
    });
}

// Dodaj funkcję do publicznego API
if (window.trackerModule) {
    window.trackerModule.showCaseTab = showCaseTab;
}
