async function loadView(viewName) {
    const mainContainer = document.getElementById('main-view-container');
    if (!mainContainer) return;

    try {
        // Load from global bundle (js/views_bundle.js) to ensure file:// compatibility
        // fetch() and dynamic import() often fail with CORS on local file systems.
        const html = window.APP_VIEWS ? window.APP_VIEWS[viewName] : null;

        if (!html) {
            throw new Error(`View not found in bundle: ${viewName}. Make sure js/views_bundle.js is loaded.`);
        }

        mainContainer.innerHTML = html;

        // Re-initialize icons for the new content
        if (window.lucide) window.lucide.createIcons();

        // Trigger specific init logic based on view
        switch(viewName) {
            case 'dashboard':
                if(window.renderDashboardWidgets) window.renderDashboardWidgets();
                if(window.applyDashboardOrder) window.applyDashboardOrder();
                break;
            case 'tracker': if(window.renderFullTracker) { window.renderFullTracker(); window.renderCalendar(); } break;
            case 'registry': if(window.loadBailiffs) window.loadBailiffs(); break;
            case 'links': if(window.renderLinksList) window.renderLinksList(); break;
            case 'generator': if(window.loadLibrary) { window.loadLibrary(); window.renderDictList(); } break;
            case 'cars': if(window.loadGarage) window.loadGarage(); break;
            case 'notes': if(window.loadNotes) window.loadNotes(); break;
            case 'ai': if(window.loadPdfList) window.loadPdfList(); break;
            case 'terrain': if(window.initTerrain) window.initTerrain(); break;
            case 'settings':
                if(document.getElementById('apiKeyPage') && window.state && window.state.GEMINI_API_KEY) {
                    document.getElementById('apiKeyPage').value = window.state.GEMINI_API_KEY;
                }
                break;
        }

    } catch (error) {
        console.error('View load error:', error);
        mainContainer.innerHTML = `<div class="p-10 text-center text-red-500">
            <h2 class="text-xl font-bold mb-2">Błąd ładowania widoku</h2>
            <p>${error.message}</p>
            <p class="text-xs mt-4 text-slate-400">Jeśli uruchamiasz plik lokalnie, upewnij się, że plik js/views_bundle.js istnieje.</p>
        </div>`;
    }
}
