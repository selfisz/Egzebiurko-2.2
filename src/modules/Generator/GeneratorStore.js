/**
 * Generator Store - Document Templates and Drafts Management
 */

import store from '../../store/index.js';

// Add generator state
if (!store.state.libraryTab) store.state.libraryTab = 'templates';
if (!store.state.docContent) store.state.docContent = null;
if (!store.state.currentFileName) store.state.currentFileName = '';
if (!store.state.detectedVariables) store.state.detectedVariables = [];

// Mutations
store.registerMutation('SET_LIBRARY_TAB', (state, tab) => {
    state.libraryTab = tab;
});

store.registerMutation('SET_DOC_CONTENT', (state, content) => {
    state.docContent = content;
});

store.registerMutation('SET_CURRENT_FILENAME', (state, filename) => {
    state.currentFileName = filename;
});

store.registerMutation('SET_DETECTED_VARIABLES', (state, variables) => {
    state.detectedVariables = variables;
});

// Actions
store.registerAction('switchLibraryTab', async ({ commit }, tab) => {
    commit('SET_LIBRARY_TAB', tab);
    
    // Update UI tabs
    const templatesTab = document.getElementById('lib-tab-templates');
    const draftsTab = document.getElementById('lib-tab-drafts');
    const templateActions = document.getElementById('templateActions');
    const draftActions = document.getElementById('draftActions');
    
    if (templatesTab && draftsTab) {
        templatesTab.className = tab === 'templates' 
            ? 'flex-1 py-3 tab-item tab-active' 
            : 'flex-1 py-3 tab-item tab-inactive';
        draftsTab.className = tab === 'drafts' 
            ? 'flex-1 py-3 tab-item tab-active' 
            : 'flex-1 py-3 tab-item tab-inactive';
    }
    
    if (templateActions && draftActions) {
        templateActions.classList.toggle('hidden', tab !== 'templates');
        draftActions.classList.toggle('hidden', tab !== 'drafts');
    }
    
    // Reload library
    await store.dispatch('loadLibrary');
});

store.registerAction('loadLibrary', async ({ commit, state }) => {
    if (!state.db) throw new Error('Database not initialized');
    
    const list = document.getElementById('libraryContainer');
    if (!list) return;
    
    list.innerHTML = '';
    
    try {
        const items = await state.db.getAll(state.libraryTab);
        
        if (items.length === 0) {
            list.innerHTML = '<p class="text-slate-400 text-center mt-4 text-[10px]">Pusto</p>';
            return;
        }
        
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = "p-2 hover:bg-red-50 cursor-pointer flex justify-between border-b rounded";
            
            const name = state.libraryTab === 'drafts' 
                ? `${item.draftName} (${item.templateName})` 
                : item.name;
            
            const clickHandler = state.libraryTab === 'templates'
                ? `store.dispatch('loadTemplate', '${item.name}')`
                : `store.dispatch('loadDraft', ${item.id})`;
            
            div.innerHTML = `
                <span onclick="${clickHandler}" class="truncate text-xs font-bold text-slate-700 w-full">${name}</span>
                <i onclick="store.dispatch('deleteItem', '${state.libraryTab}', '${state.libraryTab === 'templates' ? item.name : item.id}')" 
                   data-lucide="trash-2" class="w-3 h-3 text-slate-300 hover:text-red-500"></i>
            `;
            list.appendChild(div);
        });
        
        if (window.lucide) lucide.createIcons();
    } catch (error) {
        console.error('[Generator] Load library error:', error);
    }
});

store.registerAction('saveTemplate', async ({ commit, state }) => {
    if (!state.db) throw new Error('Database not initialized');
    if (!state.docContent) return;
    
    try {
        await state.db.put('templates', {
            name: state.currentFileName,
            blob: new Blob([state.docContent])
        });
        
        commit('ADD_NOTIFICATION', {
            type: 'success',
            message: 'Szablon został zapisany'
        });
        
        await store.dispatch('loadLibrary');
    } catch (error) {
        console.error('[Generator] Save template error:', error);
        throw error;
    }
});

store.registerAction('saveDraft', async ({ commit, state }, draftName) => {
    if (!state.db) throw new Error('Database not initialized');
    if (!state.docContent) return;
    
    try {
        // Collect variable values
        const values = {};
        state.detectedVariables.forEach(variable => {
            const element = document.getElementById(`var_${variable}`);
            if (element) {
                values[variable] = element.value;
            }
        });
        
        await state.db.put('drafts', {
            draftName,
            templateName: state.currentFileName,
            blob: new Blob([state.docContent]),
            values
        });
        
        commit('ADD_NOTIFICATION', {
            type: 'success',
            message: 'Projekt został zapisany'
        });
        
        await store.dispatch('switchLibraryTab', 'drafts');
    } catch (error) {
        console.error('[Generator] Save draft error:', error);
        throw error;
    }
});

store.registerAction('loadTemplate', async ({ commit, state }, templateName) => {
    if (!state.db) throw new Error('Database not initialized');
    
    try {
        const template = await state.db.get('templates', templateName);
        if (template) {
            await store.dispatch('processFile', { content: template.blob, filename: template.name });
            
            const draftActions = document.getElementById('draftActions');
            if (draftActions) draftActions.classList.remove('hidden');
        }
    } catch (error) {
        console.error('[Generator] Load template error:', error);
    }
});

store.registerAction('loadDraft', async ({ commit, state }, draftId) => {
    if (!state.db) throw new Error('Database not initialized');
    
    try {
        const draft = await state.db.get('drafts', draftId);
        if (draft) {
            await store.dispatch('processFile', { content: draft.blob, filename: draft.templateName });
            
            // Set variable values after a delay
            setTimeout(() => {
                for (const [key, value] of Object.entries(draft.values)) {
                    const element = document.getElementById(`var_${key}`);
                    if (element) element.value = value;
                }
            }, 200);
            
            const draftActions = document.getElementById('draftActions');
            if (draftActions) draftActions.classList.remove('hidden');
        }
    } catch (error) {
        console.error('[Generator] Load draft error:', error);
    }
});

store.registerAction('deleteItem', async ({ commit, state }, { type, key }) => {
    if (!state.db) throw new Error('Database not initialized');
    
    try {
        const id = type === 'drafts' ? parseInt(key) : key;
        await state.db.delete(type, id);
        
        commit('ADD_NOTIFICATION', {
            type: 'success',
            message: 'Element został usunięty'
        });
        
        await store.dispatch('loadLibrary');
    } catch (error) {
        console.error('[Generator] Delete item error:', error);
    }
});

store.registerAction('processFile', async ({ commit }, { content, filename }) => {
    try {
        const cleanFilename = filename.replace('.docx', '');
        
        commit('SET_DOC_CONTENT', content);
        commit('SET_CURRENT_FILENAME', cleanFilename);
        
        const filenameElement = document.getElementById('fileName');
        if (filenameElement) {
            filenameElement.textContent = filename;
        }
        
        // Show actions
        if (store.state.libraryTab === 'templates') {
            const templateActions = document.getElementById('templateActions');
            const draftActions = document.getElementById('draftActions');
            if (templateActions) templateActions.classList.remove('hidden');
            if (draftActions) draftActions.classList.remove('hidden');
        }
        
        // Process docx file
        const zip = new PizZip(content);
        const Docxtemplater = window.Docxtemplater || window.docxtemplater;
        const doc = new Docxtemplater(zip, { delimiters: { start: '[', end: ']' } });
        
        const text = doc.getFullText();
        const regex = /\[([a-zA-Z0-9_ĄŚŻŹĆŃŁÓĘąśżźćńłóę\s\.\-\/]+)\]/g;
        
        let match, variables = [];
        while ((match = regex.exec(text)) !== null) {
            if (match[1].length > 0) {
                variables.push(match[1]);
            }
        }
        
        const uniqueVariables = [...new Set(variables)];
        commit('SET_DETECTED_VARIABLES', uniqueVariables);
        
        // Render form
        store.dispatch('renderForm', uniqueVariables);
        
    } catch (error) {
        console.error('[Generator] Process file error:', error);
        commit('ADD_NOTIFICATION', {
            type: 'error',
            message: `Błąd przetwarzania pliku: ${error.message}`
        });
    }
});

store.registerAction('renderForm', ({ state }, variables) => {
    const container = document.getElementById('formContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    variables
        .filter(variable => !variable.toLowerCase().includes('_reszta'))
        .forEach(variable => {
            const div = document.createElement('div');
            div.className = "relative mb-3 group";
            
            const label = document.createElement('label');
            label.className = "block text-[10px] font-bold text-slate-500 uppercase mb-1";
            label.innerText = variable.replace(/_/g, ' ');
            
            let input;
            const lowerVariable = variable.toLowerCase();
            
            if (lowerVariable.includes('adresat_nazwa')) {
                input = document.createElement('textarea');
                input.rows = 3;
                label.innerText = "ADRESAT";
            } else if (lowerVariable.includes('data')) {
                input = document.createElement('input');
                input.type = 'date';
                input.value = new Date().toISOString().split('T')[0];
            } else {
                input = document.createElement('input');
                input.type = 'text';
            }
            
            input.id = `var_${variable}`;
            input.className = "w-full border border-slate-300 rounded p-2 text-sm focus:border-red-500 outline-none shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white";
            
            div.appendChild(label);
            div.appendChild(input);
            
            // Add buttons for specific variables
            if (lowerVariable.includes('adresat_nazwa')) {
                store.dispatch('addButton', { parent: div, type: 'addresses', variable });
            }
            if (lowerVariable.includes('podpis')) {
                store.dispatch('addButton', { parent: div, type: 'signatures', variable });
            }
            
            container.appendChild(div);
        });
    
    if (window.lucide) lucide.createIcons();
});

store.registerAction('addButton', ({ state }, { parent, type, variable }) => {
    const button = document.createElement('button');
    button.className = "absolute right-2 top-6 text-slate-400 hover:text-red-600 p-1";
    
    const icon = type === 'addresses' ? 'book-user' : 'pen-tool';
    button.innerHTML = `<i data-lucide="${icon}" width="16"></i>`;
    
    button.onclick = (event) => {
        // This would open a picker - implement as needed
        console.log(`Open ${type} picker for ${variable}`);
    };
    
    parent.appendChild(button);
});

export default {
    switchTab: (tab) => store.dispatch('switchLibraryTab', tab),
    loadLibrary: () => store.dispatch('loadLibrary'),
    saveTemplate: () => store.dispatch('saveTemplate'),
    saveDraft: (name) => store.dispatch('saveDraft', name),
    loadTemplate: (name) => store.dispatch('loadTemplate', name),
    loadDraft: (id) => store.dispatch('loadDraft', id),
    deleteItem: (type, key) => store.dispatch('deleteItem', { type, key }),
    processFile: (content, filename) => store.dispatch('processFile', { content, filename }),
    renderForm: (variables) => store.dispatch('renderForm', variables)
};