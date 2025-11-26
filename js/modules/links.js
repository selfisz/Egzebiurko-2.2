// --- MODULE: LINKS (INTRANET) ---

function renderLinksList() {
    const l = document.getElementById('fullLinksList'); if(!l) return;
    l.innerHTML = '';
    l.className = "space-y-6 mb-8";
    
    const links = JSON.parse(localStorage.getItem('lex_links') || '[]');
    if(links.length === 0) { l.innerHTML = '<div class="text-center text-slate-400">Brak dodanych linków.</div>'; return; }

    const groups = {};
    links.forEach((link, idx) => {
        const cat = link.category || 'Inne';
        if(!groups[cat]) groups[cat] = [];
        groups[cat].push({...link, originalIdx: idx});
    });

    for(const [category, groupItems] of Object.entries(groups)) {
        const catHeader = document.createElement('h3');
        catHeader.className = "text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1";
        catHeader.innerText = category;
        
        const grid = document.createElement('div');
        grid.className = "grid grid-cols-1 md:grid-cols-2 gap-4";

        groupItems.forEach(link => {
            const div = document.createElement('div');
            div.className = "p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors";
            const favClass = link.favorite ? 'text-red-500 fill-red-500' : 'text-slate-300 group-hover:text-red-400';
            
            const faviconUrl = `https://www.google.com/s2/favicons?domain=${link.url}&sz=64`;

            div.innerHTML = `
                <div class="flex items-center gap-3 overflow-hidden cursor-pointer flex-1" onclick="window.open('${link.url}')">
                    <img src="${faviconUrl}" class="w-8 h-8 rounded-lg bg-slate-50 object-contain p-0.5" onerror="this.src='poborca.jpg'">
                    <div class="truncate">
                        <div class="font-bold text-slate-800 dark:text-white text-sm">${link.name}</div>
                        <div class="text-[10px] text-slate-400 truncate">${link.url}</div>
                    </div>
                </div>
                <div class="flex gap-2 pl-2 border-l dark:border-slate-700 ml-2">
                     <button onclick="toggleLinkFavorite(${link.originalIdx})"><i data-lucide="heart" class="w-4 h-4 ${favClass} ${link.favorite?'fill-red-500':''}"></i></button>
                     <button onclick="editLink(${link.originalIdx})" class="text-indigo-400 hover:text-indigo-600"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                     <button onclick="delLink(${link.originalIdx})" class="text-slate-300 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            `;
            grid.appendChild(div);
        });
        
        l.appendChild(catHeader);
        l.appendChild(grid);
    }
    lucide.createIcons();
}

function saveLinkMain() {
    const name = document.getElementById('mainLinkName').value;
    const url = document.getElementById('mainLinkUrl').value;
    const cat = document.getElementById('mainLinkCat').value;

    if(!name || !url) return alert("Podaj nazwę i URL");
    
    let formattedUrl = url;
    if(!url.startsWith('http')) formattedUrl = 'https://' + url;

    const links = JSON.parse(localStorage.getItem('lex_links') || '[]');

    if(state.editingId !== null && state.editingType === 'link') {
        links[state.editingId].name = name;
        links[state.editingId].url = formattedUrl;
        links[state.editingId].category = cat;
        state.editingId = null; 
        state.editingType = null;
        document.getElementById('linkSaveBtn').innerText = "Dodaj";
        document.getElementById('mainLinkName').classList.remove('border-indigo-500', 'ring-2', 'ring-indigo-200');
    } else {
        links.push({name, url: formattedUrl, category: cat, favorite: false});
    }

    localStorage.setItem('lex_links', JSON.stringify(links));
    document.getElementById('mainLinkName').value = '';
    document.getElementById('mainLinkUrl').value = '';
    renderLinksList(); renderDashboardWidgets();
}

function editLink(idx) {
    const links = JSON.parse(localStorage.getItem('lex_links') || '[]');
    if(links[idx]) {
        document.getElementById('mainLinkName').value = links[idx].name;
        document.getElementById('mainLinkUrl').value = links[idx].url;
        state.editingId = idx;
        state.editingType = 'link';
        document.getElementById('linkSaveBtn').innerText = "Zapisz";
        document.getElementById('mainLinkName').focus();
        document.getElementById('mainLinkName').classList.add('border-indigo-500', 'ring-2', 'ring-indigo-200');
    }
}

function delLink(idx) {
    if(confirm("Usunąć link?")) {
        const links = JSON.parse(localStorage.getItem('lex_links') || '[]');
        links.splice(idx, 1);
        localStorage.setItem('lex_links', JSON.stringify(links));
        renderLinksList(); renderDashboardWidgets();
    }
}
