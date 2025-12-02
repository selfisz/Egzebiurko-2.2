window.APP_VIEWS = {
    'ai': `<div class="flex h-full gap-6 max-w-[1800px] mx-auto">
    <div class="w-80 glass-panel rounded-2xl shadow-sm p-6 flex flex-col">
        <div class="flex justify-between mb-6 items-center">
            <h3 class="font-bold dark:text-white flex items-center gap-2"><i data-lucide="files"></i> Dokumenty</h3>
            <label class="cursor-pointer bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-bold hover:bg-purple-100">+ Dodaj <input type="file" accept=".pdf" class="hidden" onchange="handlePdfUpload(event)" multiple></label>
        </div>
        <div id="pdfList" class="flex-1 overflow-y-auto space-y-2 text-xs dark:text-slate-400 custom-scroll mb-4"></div>
        <div class="mt-auto pt-4 border-t dark:border-slate-700">
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-2">Kontekst Sprawy</label>
            <textarea id="caseContext" class="w-full h-32 border rounded-xl p-3 text-xs dark:bg-slate-700 dark:text-white resize-none focus:border-purple-500 outline-none" placeholder="Wklej tutaj treść pisma lub notatki..."></textarea>
        </div>
    </div>

    <div class="flex-1 flex flex-col glass-panel rounded-2xl shadow-sm overflow-hidden">
        <div class="h-16 border-b dark:border-slate-700 flex items-center px-6 bg-slate-50/50 dark:bg-slate-900/50">
            <div class="flex items-center gap-2">
                <div class="p-1.5 bg-purple-100 text-purple-600 rounded-lg"><i data-lucide="bot"></i></div>
                <span class="font-bold text-slate-700 dark:text-white">Asystent Prawny</span>
            </div>
        </div>
        <div id="aiChat" class="flex-1 p-6 overflow-y-auto custom-scroll space-y-4"></div>
        <div class="p-4 border-t dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3">
             <input id="aiInput" class="flex-1 p-4 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-purple-500 outline-none transition-colors" placeholder="Zadaj pytanie dotyczące wgranych ustaw..." onkeypress="if(event.key==='Enter') runAI()">
             <button onclick="runAI()" id="aiBtn" class="bg-purple-600 text-white px-6 rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 dark:shadow-none transition-all active:scale-95"><i data-lucide="send"></i></button>
        </div>
    </div>
</div>`,
    'links': `<div class="max-w-6xl mx-auto glass-panel p-8 rounded-2xl shadow-sm min-h-[60vh] mt-10">
      <div class="flex justify-between items-center mb-8">
          <div>
              <h2 class="text-2xl font-bold dark:text-white">Intranet</h2>
              <p class="text-slate-500">Baza przydatnych linków i systemów.</p>
          </div>
          <div class="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg"><i data-lucide="link" class="text-slate-400"></i></div>
      </div>

      <div id="fullLinksList" class="space-y-6 mb-8"></div>

      <div class="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
          <h3 class="font-bold text-sm text-slate-700 dark:text-white mb-4">Dodaj nowy link</h3>
          <div class="flex flex-col md:flex-row gap-3">
              <select id="mainLinkCat" class="p-3 border rounded-lg dark:bg-slate-700 dark:text-white outline-none focus:border-indigo-500 text-xs font-bold w-full md:w-48">
                  <option value="Urzędy">🏛️ Urzędy</option>
                  <option value="Sądy">⚖️ Sądy / EPU</option>
                  <option value="Mapy">🗺️ Mapy / Geoportal</option>
                  <option value="Banki">💰 Banki / Ognivo</option>
                  <option value="Inne" selected>🔗 Inne</option>
              </select>
              <input id="mainLinkName" placeholder="Nazwa systemu" class="flex-1 p-3 border rounded-lg dark:bg-slate-700 dark:text-white outline-none focus:border-indigo-500">
              <input id="mainLinkUrl" placeholder="Adres URL (https://...)" class="flex-1 p-3 border rounded-lg dark:bg-slate-700 dark:text-white outline-none focus:border-indigo-500">
              <button onclick="saveLinkMain()" id="linkSaveBtn" class="bg-indigo-600 text-white px-6 py-3 md:py-0 rounded-lg font-bold hover:bg-indigo-700 transition-colors">Dodaj</button>
          </div>
      </div>
  </div>`,
    'notes': `<div class="max-w-7xl mx-auto h-full flex gap-6">
    <div class="w-1/3 glass-panel rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div class="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <h3 class="font-bold text-slate-700 dark:text-white">Twoje Notatki</h3>
            <button onclick="newNote()" class="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"><i data-lucide="plus" size="18"></i></button>
        </div>
        <div class="p-2">
             <input oninput="filterNotes(this.value)" placeholder="Szukaj notatki..." class="w-full p-2 border rounded-lg text-xs dark:bg-slate-700 dark:text-white outline-none focus:border-indigo-500">
        </div>
        <div id="notesList" class="flex-1 overflow-y-auto custom-scroll p-2 space-y-2"></div>
    </div>

    <div class="flex-1 glass-panel rounded-2xl shadow-sm flex flex-col overflow-hidden relative">
         <div id="noteEditor" class="hidden flex flex-col h-full">
            <div class="p-4 border-b dark:border-slate-700 flex items-center gap-4 bg-white/50 dark:bg-slate-800/50">
                <input id="noteTitle" class="flex-1 text-lg font-bold bg-transparent outline-none text-slate-800 dark:text-white placeholder-slate-400" placeholder="Tytuł notatki...">
                <span id="noteDate" class="text-xs text-slate-400 font-mono"></span>
                <button onclick="saveNote()" class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300" title="Zapisz"><i data-lucide="save"></i></button>
                <button onclick="deleteNote()" class="text-slate-400 hover:text-red-500" title="Usuń"><i data-lucide="trash-2"></i></button>
            </div>
            <textarea id="noteContent" class="flex-1 p-6 bg-transparent outline-none resize-none text-sm leading-relaxed dark:text-slate-200 custom-scroll" placeholder="Treść notatki..."></textarea>
         </div>

         <div id="noteEmptyState" class="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
             <i data-lucide="sticky-note" size="64" class="mb-4 opacity-20"></i>
             <p class="text-sm">Wybierz notatkę lub utwórz nową.</p>
         </div>
    </div>
</div>`,
    'cars': `<div class="max-w-7xl mx-auto flex flex-col gap-6 h-full">
    <div class="glass-panel p-6 rounded-2xl shadow-sm flex flex-col flex-1">
        <div class="flex justify-between items-center mb-6 border-b dark:border-slate-700 pb-4">
             <h2 class="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2"><i data-lucide="warehouse"></i> Garaż / Ruchomości</h2>
             <button onclick="openAddCarModal()" class="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2">
                <i data-lucide="plus-circle"></i> Dodaj Pojazd
             </button>
        </div>
        <div id="garageList" class="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start custom-scroll"></div>
    </div>
</div>`,
    'dashboard': `<div id="view-dashboard" class="view-active h-full overflow-y-auto custom-scroll p-8">
    <div class="max-w-7xl mx-auto mt-4">
        <div class="mb-10 text-center relative">
            <h2 class="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Witaj w EgzeBiurko 2.0</h2>
            <p class="text-slate-500 dark:text-slate-400 mt-2 max-w-xl mx-auto">Twoje centrum dowodzenia. Wybierz moduł, aby rozpocząć pracę.</p>
            <button id="edit-dashboard-btn" onclick="toggleDashboardEditMode()" class="absolute top-0 right-0 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                <i data-lucide="move" class="inline-block mr-2"></i> Edytuj układ
            </button>
        </div>

        <div id="dashboard-grid" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div data-module-id="terrain" onclick="goToModule('terrain')" class="sortable-item glass-panel p-6 rounded-2xl hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1 group">
                <div class="w-14 h-14 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <i data-lucide="map-pin" size="28"></i>
                </div>
                <h3 class="font-bold text-slate-800 dark:text-white text-lg">Teren</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Tryb terenowy, szybkie notatki i logistyka.</p>
            </div>

            <div data-module-id="generator" onclick="goToModule('generator')" class="sortable-item glass-panel p-6 rounded-2xl hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1 group">
                <div class="w-14 h-14 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <i data-lucide="file-text" size="28"></i>
                </div>
                <h3 class="font-bold text-slate-800 dark:text-white text-lg">Generator Pism</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Szablony, edycja i szybki wydruk dokumentów.</p>
            </div>

            <div data-module-id="tracker" onclick="goToModule('tracker')" class="sortable-item glass-panel p-6 rounded-2xl hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1 group">
                <div class="w-14 h-14 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <i data-lucide="calendar-clock" size="28"></i>
                </div>
                <h3 class="font-bold text-slate-800 dark:text-white text-lg">Terminarz</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Monitorowanie terminów spraw i awiz.</p>
            </div>

            <div data-module-id="cars" onclick="goToModule('cars')" class="sortable-item glass-panel p-6 rounded-2xl hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1 group">
                <div class="w-14 h-14 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <i data-lucide="car" size="28"></i>
                </div>
                <h3 class="font-bold text-slate-800 dark:text-white text-lg">Ruchomości</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Wycena średniej wartości i garaż zajętych pojazdów.</p>
            </div>

            <div data-module-id="finance" onclick="goToModule('finance')" class="sortable-item glass-panel p-6 rounded-2xl hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1 group">
                <div class="w-14 h-14 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <i data-lucide="calculator" size="28"></i>
                </div>
                <h3 class="font-bold text-slate-800 dark:text-white text-lg">Kalkulatory</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Balanser odsetek i kalkulator awiz.</p>
            </div>

            <div data-module-id="registry" onclick="goToModule('registry')" class="sortable-item glass-panel p-6 rounded-2xl hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1 group">
                <div class="w-14 h-14 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <i data-lucide="gavel" size="28"></i>
                </div>
                <h3 class="font-bold text-slate-800 dark:text-white text-lg">Rejestr</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Baza kancelarii i rewiry komornicze.</p>
            </div>

            <div data-module-id="ai" onclick="goToModule('ai')" class="sortable-item glass-panel p-6 rounded-2xl hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1 group">
                <div class="w-14 h-14 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <i data-lucide="brain-circuit" size="28"></i>
                </div>
                <h3 class="font-bold text-slate-800 dark:text-white text-lg">AI Asystent</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Analiza dokumentów i PDF.</p>
            </div>

            <div data-module-id="links" onclick="goToModule('links')" class="sortable-item glass-panel p-6 rounded-2xl hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1 group">
                <div class="w-14 h-14 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <i data-lucide="link" size="28"></i>
                </div>
                <h3 class="font-bold text-slate-800 dark:text-white text-lg">Intranet</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Baza przydatnych linków i systemów.</p>
            </div>

            <div data-module-id="notes" onclick="goToModule('notes')" class="sortable-item glass-panel p-6 rounded-2xl hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1 group">
                <div class="w-14 h-14 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <i data-lucide="sticky-note" size="28"></i>
                </div>
                <h3 class="font-bold text-slate-800 dark:text-white text-lg">Notatnik</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Twoje osobiste notatki i zapiski.</p>
            </div>
        </div>

        <div id="dashboard-widgets" class="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8"></div>
    </div>
</div>`,
    'registry': `<div class="max-w-5xl mx-auto glass-panel rounded-2xl shadow-sm flex flex-col h-[80vh]">
     <div class="p-6 border-b dark:border-slate-700 flex justify-between items-center">
        <div>
             <h2 class="text-xl font-bold dark:text-white">Rejestr Komorników</h2>
             <p class="text-sm text-slate-500">Baza teleadresowa i rewiry.</p>
        </div>
        <label class="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-bold cursor-pointer hover:bg-amber-200 transition-colors text-sm flex items-center gap-2">
            <i data-lucide="upload"></i> Import Excel <input type="file" accept=".ods,.xlsx" class="hidden" onchange="handleBailiffImport(event)">
        </label>
     </div>
     <div class="p-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div class="relative">
            <i data-lucide="search" class="absolute left-3 top-3 text-slate-400" size="18"></i>
            <input oninput="searchBailiff(this.value)" placeholder="Szukaj po nazwisku, mieście, NIP..." class="w-full pl-10 p-2.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-amber-500 transition-colors">
        </div>
     </div>
     <div class="flex-1 overflow-y-auto custom-scroll">
         <table class="w-full text-sm text-left dark:text-slate-300">
             <thead class="bg-slate-100 dark:bg-slate-900 sticky top-0 text-xs uppercase text-slate-500 font-bold">
                 <tr><th class="p-4">Nazwa</th><th class="p-4">NIP</th><th class="p-4">Adres</th><th class="p-4">EPU</th></tr>
             </thead>
             <tbody id="bailiffTable" class="divide-y dark:divide-slate-700"></tbody>
         </table>
     </div>
     <div class="p-3 text-right text-xs text-slate-400 border-t dark:border-slate-700">Rekordów: <span id="bailiffTotal">0</span></div>
 </div>`,
    'finance': `<div class="max-w-6xl mx-auto mt-4">
     <div class="mb-6 flex justify-between items-center">
        <div>
            <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Kalkulatory</h2>
            <p class="text-slate-500 text-sm">Narzędzia pomocnicze.</p>
        </div>
        <button id="edit-finance-btn" onclick="toggleFinanceEditMode()" class="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
            <i data-lucide="move" class="inline-block mr-2"></i> Edytuj układ
        </button>
    </div>

    <div id="finance-panels" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div data-panel-id="balance" class="sortable-item glass-panel rounded-2xl shadow-lg flex flex-col">
            <div class="collapsible-header p-4 cursor-pointer flex justify-between items-center border-b dark:border-slate-700">
                <h3 class="font-bold text-slate-700 dark:text-white flex items-center gap-2 text-sm uppercase"><i data-lucide="scale"></i> Balanser Odsetek</h3>
                <i data-lucide="chevron-down" class="chevron-icon transition-transform"></i>
            </div>
            <div class="collapsible-content p-6 flex flex-col gap-4">
                <p class="text-slate-500 text-xs mb-2">Przelicz proporcje wpłaty na należność główną.</p>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Stara Główna</label>
                        <input id="bOldM" type="number" class="w-full p-3 border rounded-xl dark:bg-slate-700 dark:text-white text-right font-mono" oninput="calculateBalance()">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Stare Odsetki</label>
                        <input id="bOldI" type="number" class="w-full p-3 border rounded-xl dark:bg-slate-700 dark:text-white text-right font-mono" oninput="calculateBalance()">
                    </div>
                </div>
                <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg flex justify-between items-center">
                    <span class="text-xs font-bold text-slate-500">SUMA CAŁKOWITA</span>
                    <span id="bSum" class="font-mono font-bold text-slate-700 dark:text-slate-200">0.00</span>
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-indigo-600 uppercase mb-1">Nowa Należność Główna</label>
                    <input id="bNewM" type="number" class="w-full p-4 border-2 border-indigo-100 focus:border-indigo-500 outline-none dark:border-slate-600 rounded-xl text-xl dark:bg-slate-700 dark:text-white text-right font-mono shadow-inner" placeholder="0.00" oninput="calculateBalance()">
                </div>
                <div class="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl text-center border border-indigo-100 dark:border-indigo-900">
                    <p class="text-xs uppercase font-bold text-indigo-800 dark:text-indigo-300">Nowe Odsetki (Wynik)</p>
                    <p id="bNewI" class="text-4xl font-bold text-indigo-600 dark:text-indigo-400 font-mono my-2">0.00</p>
                    <p id="bDiff" class="text-xs text-indigo-400 h-4 font-mono"></p>
                </div>
            </div>
        </div>

        <div data-panel-id="notice" class="sortable-item glass-panel rounded-2xl shadow-lg flex flex-col">
            <div class="collapsible-header p-4 cursor-pointer flex justify-between items-center border-b dark:border-slate-700">
                <h3 class="font-bold text-slate-700 dark:text-white flex items-center gap-2 text-sm uppercase"><i data-lucide="mail-warning"></i> Kalkulator Awiza</h3>
                <i data-lucide="chevron-down" class="chevron-icon transition-transform"></i>
            </div>
            <div class="collapsible-content p-6 flex flex-col gap-4">
                 <p class="text-slate-500 text-xs mb-2">Oblicza termin fikcji doręczenia (14 dni).</p>
                 <div class="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-xl border border-amber-100 dark:border-amber-800 mb-2">
                     <p class="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">Uwzględnia dni wolne od pracy oraz święta zgodnie z Art. 57 § 4 KPA.</p>
                 </div>
                 <label class="block text-xs font-bold text-slate-500 mb-2 uppercase">Data I Awiza</label>
                 <input id="awizoDate" type="date" class="w-full p-3 border rounded-xl mb-4 dark:bg-slate-700 dark:text-white" onchange="calcKPA()">
                 <div class="text-center">
                     <p class="text-xs text-slate-400 uppercase font-bold">Skuteczne Doręczenie</p>
                     <div id="kpaResult" class="text-4xl font-bold text-slate-800 dark:text-white my-3">-</div>
                     <div id="kpaNote" class="text-xs text-red-500 font-bold h-4"></div>
                 </div>
            </div>
        </div>

        <div data-panel-id="valuation" class="sortable-item glass-panel rounded-2xl shadow-lg flex flex-col">
            <div class="collapsible-header p-4 cursor-pointer flex justify-between items-center border-b dark:border-slate-700">
                <h3 class="font-bold text-slate-700 dark:text-white flex items-center gap-2 text-sm uppercase"><i data-lucide="car"></i> Wycena Pojazdu</h3>
                <i data-lucide="chevron-down" class="chevron-icon transition-transform"></i>
            </div>
            <div class="collapsible-content p-6 flex flex-col gap-3">
                 <p class="text-slate-500 text-xs mb-2">Średnia wartość rynkowa.</p>
                 <div>
                     <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cena 1 (OLX)</label>
                     <input id="fcP1" type="number" class="w-full p-2 border rounded-lg dark:bg-slate-700 dark:text-white" oninput="calcFinanceCarValuation()">
                 </div>
                 <div>
                     <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cena 2 (OtoMoto)</label>
                     <input id="fcP2" type="number" class="w-full p-2 border rounded-lg dark:bg-slate-700 dark:text-white" oninput="calcFinanceCarValuation()">
                 </div>
                 <div>
                     <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cena 3 (Inne)</label>
                     <input id="fcP3" type="number" class="w-full p-2 border rounded-lg dark:bg-slate-700 dark:text-white" oninput="calcFinanceCarValuation()">
                 </div>
                 <label class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer pt-2">
                     <input type="checkbox" id="fcBad" class="w-4 h-4 text-blue-600 rounded" onchange="calcFinanceCarValuation()">
                     Uszkodzony / Zły stan (-20%)
                 </label>
                 <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center border border-blue-100 dark:border-blue-800">
                     <p class="text-[10px] uppercase font-bold text-blue-400">Średnia Wartość</p>
                     <p id="fcResult" class="text-3xl font-bold text-blue-700 dark:text-blue-300 font-mono my-1">0.00 zł</p>
                 </div>
            </div>
        </div>
    </div>
</div>`,
    'settings': `<div class="max-w-6xl mx-auto glass-panel p-8 rounded-2xl shadow-sm min-h-[60vh] mt-6">
      <div class="mb-10 text-center">
          <h2 class="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Ustawienia Systemu</h2>
          <p class="text-slate-500 dark:text-slate-400 mt-2">Zarządzanie danymi i konfiguracja.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="glass-panel p-8 rounded-2xl shadow-lg flex flex-col gap-6 bg-white/50 dark:bg-slate-800/50">
               <div class="flex items-center gap-4 border-b border-slate-200/50 dark:border-slate-700/50 pb-4">
                   <div class="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                       <i data-lucide="database" size="24"></i>
                   </div>
                   <div>
                       <h3 class="font-bold text-lg text-slate-800 dark:text-white">Dane i Kopia Zapasowa</h3>
                       <p class="text-xs text-slate-500">Eksportuj lub przywróć bazę.</p>
                   </div>
               </div>

               <div class="space-y-4">
                   <button onclick="exportData()" class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-indigo-200 dark:shadow-none transition-transform active:scale-95 group">
                       <i data-lucide="download-cloud" class="group-hover:animate-bounce"></i> Pobierz Kopię Zapasową (.json)
                   </button>

                   <div class="relative">
                       <input type="file" id="importInputPage" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".json" onchange="importData(event)">
                       <button class="w-full py-4 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 hover:text-indigo-600 text-slate-600 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-3 transition-colors">
                           <i data-lucide="upload-cloud"></i> Przywróć z pliku
                       </button>
                   </div>

                   <button onclick="wipeData()" class="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors mt-4">
                       <i data-lucide="trash-2" size="14" class="inline mr-1"></i> Wyczyść wszystkie dane
                   </button>
               </div>
          </div>

          <div class="flex flex-col gap-8">
              <div class="glass-panel p-8 rounded-2xl shadow-lg flex flex-col gap-6 bg-white/50 dark:bg-slate-800/50">
                   <div class="flex items-center gap-4 border-b border-slate-200/50 dark:border-slate-700/50 pb-4">
                       <div class="p-3 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl">
                           <i data-lucide="key" size="24"></i>
                       </div>
                       <div>
                           <h3 class="font-bold text-lg text-slate-800 dark:text-white">Konfiguracja AI</h3>
                           <p class="text-xs text-slate-500">Google Gemini API.</p>
                       </div>
                   </div>

                   <div class="space-y-4">
                       <div>
                           <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Klucz API</label>
                           <input id="apiKeyPage" type="password" class="w-full p-3 border rounded-xl dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:border-purple-500 transition-colors" placeholder="AIzaSy...">
                       </div>
                       <button onclick="saveSettingsPage()" class="w-full py-3 bg-slate-800 dark:bg-purple-900/30 text-white dark:text-purple-300 rounded-xl font-bold hover:bg-slate-900 transition-colors">
                           Zapisz Klucz
                       </button>
                   </div>
              </div>

          </div>
      </div>

      <div class="mt-8 text-center">
          <p class="text-xs text-slate-400">EgzeBiurko v22.2 (Glass Edition) &copy; 2024</p>
      </div>
  </div>`,
    'generator': `<div class="h-full max-w-[1920px] mx-auto flex flex-col lg:flex-row gap-6">
    <div class="lg:w-1/4 space-y-6 flex flex-col">
        <div class="glass-panel p-5 rounded-2xl shadow-sm">
             <h2 class="font-bold text-xs text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                <i data-lucide="file-plus" size="14" class="text-indigo-600 dark:text-indigo-400"></i> Źródło
            </h2>
            <div class="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-6 text-center hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all cursor-pointer relative group">
                <input type="file" id="fileInput" accept=".docx" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onchange="handleFileSelect(event)">
                <i data-lucide="upload-cloud" class="mx-auto mb-2 text-slate-400 group-hover:text-indigo-500 transition-colors" size="24"></i>
                <p id="fileName" class="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-indigo-700 truncate">Wybierz plik .docx</p>
            </div>
        </div>
         <div class="glass-panel p-0 rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden">
             <div class="flex border-b dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-900/50">
                <button onclick="switchLibraryTab('templates')" id="lib-tab-templates" class="flex-1 py-3 tab-item tab-active">Szablony</button>
                <button onclick="switchLibraryTab('drafts')" id="lib-tab-drafts" class="flex-1 py-3 tab-item tab-inactive">Szkice</button>
            </div>
            <div id="libraryContainer" class="flex-1 overflow-y-auto text-xs space-y-1 p-3 custom-scroll"></div>
            <div id="templateActions" class="p-3 border-t dark:border-slate-700 hidden">
                <button onclick="saveTemplateToDB()" class="w-full bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 text-xs py-2 rounded-lg font-bold border border-indigo-200 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-slate-700 shadow-sm transition-colors">
                    + Dodaj do bazy
                </button>
            </div>
            <div id="draftActions" class="p-3 border-t dark:border-slate-700 hidden">
                <button onclick="saveDraft()" class="w-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs py-2 rounded-lg font-bold border border-amber-200 dark:border-amber-800 hover:bg-amber-100 shadow-sm flex items-center justify-center gap-2">
                    <i data-lucide="save" size="12"></i> Zapisz stan
                </button>
            </div>
        </div>
    </div>
    <div class="lg:w-2/4 flex flex-col h-full">
        <div class="glass-panel p-6 rounded-2xl shadow-sm flex-1 flex flex-col relative overflow-hidden">
            <div class="flex justify-between items-center border-b dark:border-slate-700 pb-4 mb-4">
                <h2 class="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white">
                    <i data-lucide="edit-3" class="text-indigo-600 dark:text-indigo-400"></i> Edycja Danych
                </h2>
                <div class="flex gap-2">
                    <button onclick="openMagicFill()" class="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg flex gap-1.5 items-center transition-colors shadow-sm font-medium"><i data-lucide="sparkles" size="14"></i> Auto-Fill</button>
                    <button onclick="clearFormValues()" class="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400 px-2 py-1.5 rounded-lg transition-colors"><i data-lucide="eraser" size="14"></i></button>
                </div>
            </div>
             <div id="formContainer" class="space-y-4 flex-1 overflow-y-auto pr-2 custom-scroll">
                <div class="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 space-y-4">
                    <div class="bg-slate-50 dark:bg-slate-900 p-4 rounded-full"><i data-lucide="arrow-left" size="32" class="opacity-50"></i></div>
                    <p>Wybierz szablon z lewej strony.</p>
                </div>
            </div>
            <div id="picker" class="hidden absolute bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-600 rounded-xl w-72 max-h-64 overflow-y-auto z-50 animate-fade"></div>
        </div>
    </div>
    <div class="lg:w-1/4 space-y-6 flex flex-col">
        <div class="glass-panel p-5 rounded-2xl shadow-sm">
            <h2 class="font-bold text-xs text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                <i data-lucide="check-circle" class="text-emerald-600 dark:text-emerald-400"></i> Akcje
            </h2>
            <div class="flex flex-col gap-3">
                <button onclick="generateDOCX()" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none text-sm active:scale-95 transition-all">
                    <i data-lucide="download" size="18"></i> Pobierz Plik
                </button>
                <button onclick="generatePreview()" class="w-full py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 text-sm active:scale-95 transition-all">
                    <i data-lucide="eye" size="18"></i> Odśwież Podgląd
                </button>
            </div>
        </div>
        <div class="glass-panel p-0 rounded-2xl shadow-sm flex flex-col h-[250px] overflow-hidden">
            <div class="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                <h2 class="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Słowniki</h2>
                <button onclick="toggleAddForm()" class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold">+ Nowy</button>
            </div>
            <div class="flex border-b dark:border-slate-700 text-xs bg-white dark:bg-slate-800">
                <button onclick="switchTab('addresses')" id="tab-addresses" class="flex-1 py-2 tab-item tab-active transition-colors">Adresaci</button>
                <button onclick="switchTab('signatures')" id="tab-signatures" class="flex-1 py-2 tab-item tab-inactive transition-colors">Podpisy</button>
            </div>
            <div id="dictListContainer" class="flex-1 overflow-y-auto text-xs space-y-2 p-3 custom-scroll"></div>
            <div id="addDictForm" class="hidden bg-indigo-50 dark:bg-indigo-900/20 p-3 border-t border-indigo-100 dark:border-indigo-900 animate-fade">
                <input id="newDictKey" placeholder="Skrót" class="w-full p-2 border border-indigo-200 dark:border-slate-600 rounded-lg mb-2 text-xs outline-none bg-white dark:bg-slate-800 dark:text-white">
                <textarea id="newDictValue" rows="2" placeholder="Treść" class="w-full p-2 border border-indigo-200 dark:border-slate-600 rounded-lg mb-2 text-xs outline-none bg-white dark:bg-slate-800 dark:text-white"></textarea>
                <div class="flex gap-2">
                    <button onclick="saveDictItemFromPanel()" class="flex-1 bg-indigo-600 text-white py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700">Zapisz</button>
                    <button onclick="toggleAddForm()" class="flex-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 py-1.5 rounded-lg text-xs hover:bg-slate-50">Anuluj</button>
                </div>
            </div>
        </div>
        <div class="glass-panel p-1 rounded-xl flex-1 flex flex-col overflow-hidden relative shadow-inner min-h-[200px]">
            <div id="previewContainer" class="flex-1 overflow-auto bg-white w-full h-full text-xs rounded-lg p-4">
                <div class="flex items-center justify-center h-full text-slate-300 flex-col gap-2">
                    <i data-lucide="scan-search" size="40" class="opacity-50"></i>
                    <p>Podgląd wydruku</p>
                </div>
            </div>
             <button onclick="printPreview()" id="printBtn" class="hidden absolute bottom-4 right-4 bg-slate-900 text-white px-4 py-2 rounded-full shadow-xl hover:bg-black font-bold flex items-center gap-2 text-xs transition-transform hover:scale-105 z-10">
                <i data-lucide="printer" size="14"></i> Drukuj
            </button>
        </div>
    </div>
</div>`,
    'tracker': `<div class="flex flex-col h-full gap-6 lg:flex-row">
    <div id="reminderModal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl w-96 shadow-2xl animate-fade">
             <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold dark:text-white">Dodaj Przypomnienie</h3>
                <button onclick="trackerModule.closeReminderModal()" class="text-slate-400 hover:text-red-500"><i data-lucide="x"></i></button>
            </div>
            <p id="reminderDateDisplay" class="text-xs text-indigo-600 font-bold mb-3 uppercase tracking-wider"></p>
            <input type="hidden" id="reminderDateInput">

            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Treść</label>
            <textarea id="reminderText" rows="3" class="w-full border p-3 rounded-lg text-sm dark:bg-slate-700 dark:text-white focus:border-indigo-500 outline-none mb-4" placeholder="Np. Wyślij pismo..."></textarea>

            <button onclick="trackerModule.saveReminder()" class="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">Zapisz</button>
        </div>
    </div>
    <!-- Main content area -->
    <div class="relative flex-1 overflow-hidden glass-panel rounded-2xl shadow-sm">
        <!-- Grid View (List of cases) -->
        <div id="tracker-grid-view" class="absolute inset-0 flex flex-col transition-transform duration-300 bg-white dark:bg-slate-900">
            <div class="flex items-center justify-between p-4 border-b bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/50">
                <h3 class="flex items-center gap-2 text-sm font-bold uppercase dark:text-white"><i data-lucide="book-marked"></i> Segregator Spraw</h3>
                <div class="flex items-center gap-2">
                    <div class="relative">
                        <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size="16"></i>
                        <input id="trackerSearch" type="text" placeholder="Szukaj w sprawach..." class="pl-9 pr-3 py-2 text-xs border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white w-48 focus:border-indigo-500 outline-none transition-colors" oninput="trackerModule.renderFullTracker(this.value)">
                    </div>
                    <div class="text-xs font-bold text-slate-500" id="tracker-case-count">Ładuję...</div>
                    <div class="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
                    <button onclick="trackerModule.showArchived(true)" class="px-3 py-1 text-xs font-bold text-slate-500 hover:text-indigo-600" id="archiveBtn">Archiwum</button>
                    <button onclick="trackerModule.addNewCase()" class="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-2"><i data-lucide="plus"></i> Dodaj Sprawę</button>
                </div>
            </div>
            <div id="tracker-list" class="flex-1 p-4 space-y-4 overflow-y-auto custom-scroll">
            <div id="tracker-list" class="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 overflow-y-auto custom-scroll content-start">
                <!-- Case binders will be injected here -->
            </div>
        </div>

        <!-- Detail View (Editing a case) -->
        <div id="tracker-detail-view" class="absolute inset-0 flex flex-col transition-transform duration-300 translate-x-full bg-white dark:bg-slate-800">
             <div class="flex items-center pr-2 text-xs border-b bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/50">
                <button onclick="trackerModule.closeCase()" class="px-4 py-3 mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-r dark:border-slate-700"><i data-lucide="arrow-left"></i></button>
                <div id="tracker-case-label" class="font-mono text-slate-400">Edycja sprawy...</div>
                <button id="save-case-btn" onclick="trackerModule.saveCase()" class="px-4 py-2 ml-auto text-xs font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm flex items-center gap-2"><i data-lucide="save" size="14"></i> Zapisz</button>
                <button onclick="trackerModule.saveCase()" class="px-4 py-2 ml-auto text-xs font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm flex items-center gap-2"><i data-lucide="save" size="14"></i> Zapisz</button>
             </div>
            <div class="flex-1 p-6 overflow-y-auto custom-scroll">
                 <div class="max-w-2xl mx-auto space-y-4">
                    <!-- Case Form Fields -->
                    <div class="grid grid-cols-3 gap-4">
                        <div class="col-span-2">
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nr Sprawy</label>
                            <input id="trNo" class="w-full p-2.5 border rounded-lg text-sm dark:bg-slate-700 dark:text-white font-bold">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">UNP</label>
                            <input id="trUnp" class="w-full p-2.5 border rounded-lg text-sm dark:bg-slate-700 dark:text-white">
                        </div>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Zobowiązany</label>
                        <input id="trDebtor" class="w-full p-2.5 border rounded-lg text-sm dark:bg-slate-700 dark:text-white">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data Wpływu</label>
                        <input id="trDate" type="date" class="w-full p-2.5 border rounded-lg text-sm dark:bg-slate-700 dark:text-white">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
                            <select id="trStatus" class="w-full p-2.5 border rounded-lg text-sm dark:bg-slate-700 dark:text-white">
                                <option value="new">Nowa</option>
                                <option value="in-progress">W toku</option>
                                <option value="finished">Zakończona</option>
                            </select>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900">
                        <input type="checkbox" id="trUrgent" class="w-5 h-5 text-red-600 rounded focus:ring-red-500">
                        <label for="trUrgent" class="text-sm font-bold text-red-700 dark:text-red-400 cursor-pointer">Sprawa Pilna</label>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Priorytet</label>
                            <select id="trPriority" class="w-full p-2.5 border rounded-lg text-sm dark:bg-slate-700 dark:text-white">
                                <option value="low">Niski</option>
                                <option value="medium" selected>Normalny</option>
                                <option value="high">Wysoki</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Notatka</label>
                        <textarea id="trNote" rows="4" class="w-full p-2.5 border rounded-lg text-sm dark:bg-slate-700 dark:text-white resize-y"></textarea>
                    </div>
                 </div>
            </div>
        </div>
    </div>

    <!-- Right column with Calendar & Filters -->
    <div class="lg:w-80 flex flex-col gap-6">
        <div class="p-6 glass-panel rounded-2xl shadow-sm h-fit">
            <div class="flex items-center justify-between">
                <button onclick="trackerModule.changeMonth(-1)" class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"><i data-lucide="chevron-left"></i></button>
                <h3 id="calendarMonth" class="font-bold capitalize dark:text-white">...</h3>
                <button onclick="trackerModule.changeMonth(1)" class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"><i data-lucide="chevron-right"></i></button>
            </div>
            <div id="calendarGrid" class="grid grid-cols-7 gap-1 mt-4 text-xs text-center"></div>
        </div>
        <div class="p-6 glass-panel rounded-2xl shadow-sm h-fit">
            <h3 class="flex items-center gap-2 mb-4 text-sm font-bold uppercase"><i data-lucide="filter"></i> Filtruj i Sortuj</h3>
            <div class="space-y-3">
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sortuj po</label>
                    <select id="trSort" class="w-full p-2 text-xs border rounded-lg dark:bg-slate-700 dark:text-white">
                        <option value="deadline">Termin</option>
                        <option value="added">Data dodania</option>
                        <option value="priority">Priorytet</option>
                        <option value="no">Sygnatura</option>
                    </select>
                </div>
            </div>
        </div>
    </div>
</div>`,
    'terrain': `<div id="view-terrain" class="max-w-7xl mx-auto h-full flex flex-col gap-6">
    <div class="flex justify-between items-end mb-2">
        <div>
            <h2 class="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Tryb Terenowy</h2>
            <p class="text-slate-500 dark:text-slate-400 mt-1">Szybkie czynności, wyceny i logistyka.</p>
        </div>
        <div class="flex gap-2">
             <button id="edit-terrain-btn" onclick="terrainModule.toggleTerrainEditMode()" class="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                <i data-lucide="move" class="inline-block mr-2"></i> Edytuj układ
            </button>
            <button onclick="terrainModule.copyTerrainReport()" class="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2">
                <i data-lucide="clipboard-copy"></i> Kopiuj Cały Raport
            </button>
        </div>
    </div>

    <!-- WIRTUALNA TECZKA (AKTÓWKA) -->
    <div class="glass-panel p-0 rounded-2xl shadow-sm overflow-hidden flex flex-col h-96 relative">
        <!-- VIEW 1: BRIEFCASE GRID -->
        <div id="briefcase-grid" class="absolute inset-0 flex flex-col bg-white dark:bg-slate-900 transition-transform duration-300 z-10">
            <div class="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <h3 class="font-bold text-slate-700 dark:text-white flex items-center gap-2 text-sm uppercase"><i data-lucide="briefcase"></i> Aktówka Terenowa</h3>
                <div class="flex gap-2">
                    <button onclick="terrainModule.synchronizeData()" class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm flex items-center gap-2"><i data-lucide="refresh-cw"></i> Synchronizuj</button>
                    <button onclick="terrainModule.addNewCase()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-2"><i data-lucide="plus"></i> Dodaj Akta</button>
                </div>
            </div>
            <div id="briefcase-list" class="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto custom-scroll content-start">
                <!-- JS will inject folders here -->
            </div>
        </div>

        <!-- VIEW 2: CASE DETAILS -->
        <div id="briefcase-detail" class="absolute inset-0 flex flex-col bg-white dark:bg-slate-900 transition-transform duration-300 translate-x-full z-20">
             <div class="flex border-b dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-900/50 items-center pr-2">
                <button onclick="terrainModule.closeCase()" class="px-4 py-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-r dark:border-slate-700 mr-2"><i data-lucide="arrow-left"></i></button>

                <button onclick="terrainModule.switchFolderTab('arrears')" id="folder-tab-arrears" class="px-4 py-3 font-bold border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400">Stan Zaległości</button>
                <button onclick="terrainModule.switchFolderTab('info')" id="folder-tab-info" class="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700">Informacje</button>
                <button onclick="terrainModule.switchFolderTab('notes')" id="folder-tab-notes" class="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700">Notatnik</button>

                <div class="ml-auto text-xs font-mono text-slate-400" id="currentCaseLabel">Sprawa...</div>
            </div>

            <!-- TAB 1: STAN ZALEGŁOŚCI (AI TABLE) -->
            <div id="folder-content-arrears" class="flex-1 p-6 overflow-y-auto custom-scroll flex flex-col">
                <div id="arrearsEmptyState" class="flex flex-col items-center justify-center flex-1 text-slate-400">
                    <i data-lucide="file-spreadsheet" size="48" class="mb-3 opacity-20"></i>
                    <p class="text-xs mb-4">Wgraj zestawienie należności (PDF/Obraz).</p>
                    <label class="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold cursor-pointer text-indigo-600 transition-colors flex items-center gap-2">
                        <i data-lucide="upload"></i> Wybierz Plik i Analizuj
                        <input type="file" class="hidden" accept="application/pdf,image/*" onchange="terrainModule.processArrearsPDF(event)">
                    </label>
                </div>
                <div id="arrearsTableContainer" class="hidden w-full h-full"></div>
            </div>

            <!-- TAB 2: INFORMACJE (FORM) -->
            <div id="folder-content-info" class="hidden flex-1 p-6 overflow-y-auto custom-scroll">
                 <div class="space-y-4 max-w-2xl mx-auto">
                    <!-- Podstawowe Dane -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Imię</label>
                            <input id="caseName" class="w-full p-2.5 border rounded-lg text-sm dark:bg-slate-700 dark:text-white font-bold" oninput="terrainModule.updateCaseData('name', this.value)">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nazwisko</label>
                            <input id="caseSurname" class="w-full p-2.5 border rounded-lg text-sm dark:bg-slate-700 dark:text-white font-bold" oninput="terrainModule.updateCaseData('surname', this.value)">
                        </div>
                    </div>

                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nazwa Firmy / Dodatkowe Dane</label>
                        <input id="caseCompany" class="w-full p-2.5 border rounded-lg text-sm dark:bg-slate-700 dark:text-white" oninput="terrainModule.updateCaseData('company', this.value)">
                    </div>

                    <!-- Adres z Mapą -->
                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Adres Czynności</label>
                        <div class="flex gap-2">
                            <input id="caseAddress" class="flex-1 p-2.5 border rounded-lg text-sm dark:bg-slate-700 dark:text-white" oninput="terrainModule.updateCaseData('address', this.value)">
                            <button onclick="terrainModule.openMap()" class="px-3 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200"><i data-lucide="map-pin"></i></button>
                        </div>
                    </div>

                    <!-- Kontakt -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Telefon Kontaktowy</label>
                            <div class="flex gap-2">
                                <input id="casePhone" type="tel" class="flex-1 p-2.5 border rounded-lg text-sm dark:bg-slate-700 dark:text-white" oninput="terrainModule.updateCaseData('phone', this.value)">
                                <a id="btnCall" href="#" class="px-3 py-2 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200 flex items-center justify-center"><i data-lucide="phone"></i></a>
                            </div>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">PESEL / NIP</label>
                            <input id="casePesel" class="w-full p-2.5 border rounded-lg text-sm dark:bg-slate-700 dark:text-white" oninput="terrainModule.updateCaseData('pesel', this.value)">
                        </div>
                    </div>

                    <!-- Kwota Zaległości (Ręczna edycja do widoku kafelka) -->
                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Łączna Kwota Zaległości (PLN)</label>
                        <input id="caseDebt" type="number" class="w-full p-2.5 border rounded-lg text-lg font-bold text-red-600 dark:bg-slate-700 dark:text-red-400" oninput="terrainModule.updateCaseData('debtAmount', this.value)" placeholder="0.00">
                    </div>

                    <!-- Tagi / Ostrzeżenia -->
                    <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mt-4">
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-2">Ostrzeżenia i Tagi</label>
                        <div class="flex flex-wrap gap-2 mb-3" id="caseTagsContainer"></div>
                        <div class="flex gap-2 text-xs overflow-x-auto pb-2">
                            <button onclick="terrainModule.toggleTag('Agresor', 'red')" class="px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 font-bold whitespace-nowrap">+ Agresor</button>
                            <button onclick="terrainModule.toggleTag('Pies', 'yellow')" class="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 font-bold whitespace-nowrap">+ Pies</button>
                            <button onclick="terrainModule.toggleTag('Chory', 'blue')" class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 font-bold whitespace-nowrap">+ Chory</button>
                            <button onclick="terrainModule.toggleTag('Ugoda', 'green')" class="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 font-bold whitespace-nowrap">+ Ugoda</button>
                            <button onclick="terrainModule.toggleTag('Pilne', 'orange')" class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 font-bold whitespace-nowrap">+ Pilne</button>
                        </div>
                    </div>
                 </div>
            </div>

            <!-- TAB 3: NOTATNIK -->
            <div id="folder-content-notes" class="hidden flex-1 p-6 flex flex-col">
                <textarea id="caseNotes" class="flex-1 w-full p-4 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm resize-none focus:border-indigo-500 outline-none" placeholder="Notatki służbowe do sprawy..." oninput="terrainModule.updateCaseData('notes', this.value)"></textarea>
            </div>
        </div>
    </div>

    <div id="terrain-panels" class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto custom-scroll pb-4">

        <!-- SEKCJA A: SZYBKIE NOTATKI (OGÓLNE) -->
        <div data-panel-id="notes" class="sortable-item glass-panel rounded-2xl shadow-sm flex flex-col">
            <div class="collapsible-header p-4 cursor-pointer flex justify-between items-center border-b dark:border-slate-700">
                <h3 class="font-bold text-slate-700 dark:text-white flex items-center gap-2 text-sm uppercase"><i data-lucide="sticky-note"></i> Szybkie Notatki</h3>
                <i data-lucide="chevron-down" class="chevron-icon transition-transform"></i>
            </div>
            <div class="collapsible-content p-6 flex flex-col gap-4">
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="window.terrainModule.addTerrainNote('Drzwi zamknięte, brak domowników.')" class="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors">Drzwi Zamknięte</button>
                    <button onclick="window.terrainModule.addTerrainNote('Zostawiono awizo w skrzynce oddawczej.')" class="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors">Zostawiono Awizo</button>
                    <button onclick="window.terrainModule.addTerrainNote('Rozmowa z dłużnikiem, zobowiązał się do wpłaty.')" class="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors">Rozmowa z Dłużnikiem</button>
                    <button onclick="window.terrainModule.addTerrainNote('Ustalono składniki majątkowe (pojazdy).')" class="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors">Ustalono Majątek</button>
                </div>
                <textarea id="terrainNote" class="flex-1 w-full p-4 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm resize-none focus:border-indigo-500 outline-none" placeholder="Treść notatki z czynności..."></textarea>
            </div>
        </div>

        <!-- SEKCJA B: LOGISTYKA -->
        <div data-panel-id="logistics" class="sortable-item glass-panel rounded-2xl shadow-sm flex flex-col">
            <div class="collapsible-header p-4 cursor-pointer flex justify-between items-center border-b dark:border-slate-700">
                <h3 class="font-bold text-slate-700 dark:text-white flex items-center gap-2 text-sm uppercase"><i data-lucide="map"></i> Logistyka & Koszty</h3>
                <i data-lucide="chevron-down" class="chevron-icon transition-transform"></i>
            </div>
            <div class="collapsible-content p-6 flex flex-col gap-4">
                <div class="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <div class="flex justify-between items-center mb-2">
                        <label class="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase">Miejscowość (Baza)</label>
                        <button onclick="window.terrainModule.toggleCityEditor()" class="text-[10px] font-bold text-indigo-600 hover:underline">Zarządzaj / Edytuj</button>
                    </div>
                    <select id="logCitySelect" onchange="window.terrainModule.selectCity(this.value)" class="w-full p-2 border rounded-lg text-sm font-bold dark:bg-slate-800 dark:text-white mb-2"></select>

                    <!-- EDITOR PANEL -->
                    <div id="cityEditorPanel" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
                            <div class="p-4 border-b dark:border-slate-700 flex justify-between items-center">
                                 <h3 class="font-bold text-lg dark:text-white">Zarządzanie Bazą Miejscowości</h3>
                                 <button onclick="window.terrainModule.toggleCityEditor()" class="text-slate-400 hover:text-red-500"><i data-lucide="x"></i></button>
                            </div>
                            <div class="p-4 bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                                 <p class="text-[10px] text-slate-500 mb-2 font-bold uppercase">Importuj z AI</p>
                                 <label class="flex items-center justify-center w-full p-3 border-2 border-dashed border-indigo-300 rounded-lg cursor-pointer hover:bg-white/50 transition-colors">
                                    <input type="file" class="hidden" accept="image/*,application/pdf" onchange="window.terrainModule.importLogisticsFile(event)">
                                    <div class="text-center">
                                        <i data-lucide="upload-cloud" class="mx-auto text-indigo-500 mb-1"></i>
                                        <span class="text-xs font-bold text-indigo-700">Wgraj zdjęcie cennika / PDF</span>
                                    </div>
                                </label>
                            </div>
                            <div id="cityEditorList" class="flex-1 overflow-y-auto p-4 space-y-2 custom-scroll">
                                <!-- Injected JS Items -->
                            </div>
                            <div class="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                                 <button onclick="window.terrainModule.addNewCity()" class="w-full py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 flex items-center justify-center gap-2"><i data-lucide="plus"></i> Dodaj Nową</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dystans (km)</label>
                        <input id="logDistance" type="number" class="w-full p-3 border rounded-xl dark:bg-slate-700 dark:text-white font-mono font-bold text-right" oninput="window.terrainModule.calcLogistics()" value="0">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Koszt (PLN)</label>
                        <input id="logCost" readonly class="w-full p-3 border rounded-xl bg-slate-100 dark:bg-slate-800 dark:text-white font-mono font-bold text-right text-indigo-600" value="0.00">
                    </div>
                </div>

                <hr class="dark:border-slate-700">

            <!-- CASH CALCULATOR WRAPPER -->
            <div class="flex flex-col flex-1 min-h-0">
                <h3 class="font-bold text-slate-700 dark:text-white flex items-center gap-2 text-sm uppercase mb-2 flex-shrink-0"><i data-lucide="banknote"></i> Liczarka Gotówki</h3>

                <!-- Headers -->
                <div class="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-400 uppercase text-center mb-1 flex-shrink-0">
                    <div>Nominał</div>
                    <div>Ilość</div>
                    <div>Wartość</div>
                </div>

                <div class="space-y-2 overflow-y-auto custom-scroll pr-2 flex-grow">
                    <!-- 500 PLN -->
                    <div class="grid grid-cols-3 gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div class="font-bold text-slate-700 dark:text-slate-300 text-right pr-4">500 zł</div>
                        <input type="number" class="cash-input text-center p-1.5 border rounded bg-white dark:bg-slate-900 dark:text-white dark:border-slate-600 text-sm focus:border-indigo-500 outline-none" data-nom="500" oninput="window.terrainModule.calcCash()">
                        <div id="val-500" class="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right text-sm">0.00</div>
                    </div>
                    <!-- 200 PLN -->
                    <div class="grid grid-cols-3 gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div class="font-bold text-slate-700 dark:text-slate-300 text-right pr-4">200 zł</div>
                        <input type="number" class="cash-input text-center p-1.5 border rounded bg-white dark:bg-slate-900 dark:text-white dark:border-slate-600 text-sm focus:border-indigo-500 outline-none" data-nom="200" oninput="window.terrainModule.calcCash()">
                        <div id="val-200" class="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right text-sm">0.00</div>
                    </div>
                    <!-- 100 PLN -->
                    <div class="grid grid-cols-3 gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div class="font-bold text-slate-700 dark:text-slate-300 text-right pr-4">100 zł</div>
                        <input type="number" class="cash-input text-center p-1.5 border rounded bg-white dark:bg-slate-900 dark:text-white dark:border-slate-600 text-sm focus:border-indigo-500 outline-none" data-nom="100" oninput="window.terrainModule.calcCash()">
                        <div id="val-100" class="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right text-sm">0.00</div>
                    </div>
                    <!-- 50 PLN -->
                    <div class="grid grid-cols-3 gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div class="font-bold text-slate-700 dark:text-slate-300 text-right pr-4">50 zł</div>
                        <input type="number" class="cash-input text-center p-1.5 border rounded bg-white dark:bg-slate-900 dark:text-white dark:border-slate-600 text-sm focus:border-indigo-500 outline-none" data-nom="50" oninput="window.terrainModule.calcCash()">
                        <div id="val-50" class="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right text-sm">0.00</div>
                    </div>
                    <!-- 20 PLN -->
                    <div class="grid grid-cols-3 gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div class="font-bold text-slate-700 dark:text-slate-300 text-right pr-4">20 zł</div>
                        <input type="number" class="cash-input text-center p-1.5 border rounded bg-white dark:bg-slate-900 dark:text-white dark:border-slate-600 text-sm focus:border-indigo-500 outline-none" data-nom="20" oninput="window.terrainModule.calcCash()">
                        <div id="val-20" class="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right text-sm">0.00</div>
                    </div>
                    <!-- 10 PLN -->
                    <div class="grid grid-cols-3 gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div class="font-bold text-slate-700 dark:text-slate-300 text-right pr-4">10 zł</div>
                        <input type="number" class="cash-input text-center p-1.5 border rounded bg-white dark:bg-slate-900 dark:text-white dark:border-slate-600 text-sm focus:border-indigo-500 outline-none" data-nom="10" oninput="window.terrainModule.calcCash()">
                        <div id="val-10" class="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right text-sm">0.00</div>
                    </div>
                    <!-- Bilon -->
                    <div class="grid grid-cols-3 gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div class="font-bold text-slate-700 dark:text-slate-300 text-right pr-4">Bilon</div>
                        <input type="number" step="0.01" class="cash-input text-center p-1.5 border rounded bg-white dark:bg-slate-900 dark:text-white dark:border-slate-600 text-sm focus:border-indigo-500 outline-none" data-nom="1" oninput="window.terrainModule.calcCash()">
                        <div id="val-1" class="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right text-sm">0.00</div>
                    </div>
                </div>

                <div class="mt-auto bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl flex flex-col gap-3 border border-emerald-100 dark:border-emerald-800 shadow-lg backdrop-blur-sm flex-shrink-0">
                    <div class="flex justify-between items-center">
                        <span class="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-widest">RAZEM</span>
                        <span id="cashTotal" class="text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">0.00 zł</span>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="window.terrainModule.copyCashDetails()" class="py-2 bg-emerald-100 dark:bg-emerald-800/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors">Kopiuj Szczegóły</button>
                        <button onclick="window.terrainModule.copyCashTotal()" class="py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200 dark:shadow-none">Kopiuj Kwotę</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- SEKCJA C: SKANER -->
        <div data-panel-id="scanner" class="sortable-item glass-panel rounded-2xl shadow-sm flex flex-col">
            <div class="collapsible-header p-4 cursor-pointer flex justify-between items-center border-b dark:border-slate-700">
                <h3 class="font-bold text-slate-700 dark:text-white flex items-center gap-2 text-sm uppercase"><i data-lucide="scan-barcode"></i> Szybka Wycena</h3>
                <i data-lucide="chevron-down" class="chevron-icon transition-transform"></i>
            </div>
            <div class="collapsible-content p-6 flex flex-col gap-4">
                <div id="scannerContainer" class="w-full h-48 bg-black rounded-xl overflow-hidden relative group">
                    <div id="qr-reader" class="w-full h-full"></div>
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none" id="scannerPlaceholder">
                        <p class="text-slate-500 text-xs">Kliknij 'Skanuj', aby uruchomić kamerę.</p>
                    </div>
                    <button onclick="window.terrainModule.startScanner()" id="btnStartScan" class="absolute bottom-2 right-2 bg-white/90 text-black px-3 py-1 rounded-lg text-xs font-bold shadow-lg hover:bg-white">Skanuj</button>
                    <button onclick="window.terrainModule.stopScanner()" id="btnStopScan" class="hidden absolute bottom-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg hover:bg-red-600">Stop</button>
                </div>

                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Przedmiot / Kod EAN</label>
                    <input id="scanInput" class="w-full p-3 border rounded-xl dark:bg-slate-700 dark:text-white font-bold" placeholder="Wpisz lub zeskanuj...">
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <button onclick="window.terrainModule.searchExternal('allegro')" class="py-3 bg-[#ff5a00] hover:bg-[#e04e00] text-white rounded-xl font-bold text-xs shadow-lg shadow-orange-200 dark:shadow-none transition-transform active:scale-95">
                        Szukaj Allegro
                    </button>
                    <button onclick="window.terrainModule.searchExternal('olx')" class="py-3 bg-[#002f34] hover:bg-[#002f34]/90 text-white rounded-xl font-bold text-xs shadow-lg shadow-slate-300 dark:shadow-none transition-transform active:scale-95">
                        Szukaj OLX
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>`,
};
