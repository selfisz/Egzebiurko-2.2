/**
 * Generator View - Document Templates and Generation UI
 */

import store from '../../store/index.js';
import GeneratorStore from './GeneratorStore.js';

class GeneratorView {
    constructor() {
        this.container = null;
        this.tabs = null;
        this.library = {
            templates: null,
            projects: null
        };
        this.editor = null;
        this.activeTab = 'templates';
    }

    /**
     * Initialize Generator View
     */
    init() {
        console.log('[GeneratorView] Initializing...');
        
        // Get DOM elements
        this.container = document.getElementById('generatorContainer');
        this.tabs = document.getElementById('generatorTabs');
        this.library.templates = document.getElementById('templatesLibrary');
        this.library.projects = document.getElementById('projectsLibrary');
        this.editor = document.getElementById('templateEditor');

        // Setup event listeners
        this.setupEventListeners();
        
        // Subscribe to store changes
        this.setupStoreSubscriptions();
        
        // Load initial data
        this.loadInitialData();
        
        console.log('[GeneratorView] Initialized successfully');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Tab switching
        if (this.tabs) {
            this.tabs.addEventListener('click', (e) => {
                const tab = e.target.closest('[data-tab]');
                if (tab) {
                    this.switchTab(tab.dataset.tab);
                }
            });
        }

        // Template upload
        const uploadBtn = document.getElementById('uploadTemplateBtn');
        const fileInput = document.getElementById('templateFileInput');
        
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                fileInput?.click();
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleTemplateUpload(e.target.files[0]);
            });
        }

        // New template
        const newTemplateBtn = document.getElementById('newTemplateBtn');
        if (newTemplateBtn) {
            newTemplateBtn.addEventListener('click', () => {
                this.createNewTemplate();
            });
        }

        // Generate document
        const generateBtn = document.getElementById('generateDocumentBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateDocument();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'n') {
                    e.preventDefault();
                    this.createNewTemplate();
                }
                if (e.key === 'o') {
                    e.preventDefault();
                    fileInput?.click();
                }
                if (e.key === 'g') {
                    e.preventDefault();
                    this.generateDocument();
                }
            }
        });
    }

    /**
     * Setup store subscriptions
     */
    setupStoreSubscriptions() {
        // Subscribe to templates changes
        store.subscribe('templates', (templates) => {
            this.renderTemplates(templates);
        });

        // Subscribe to projects changes
        store.subscribe('projects', (projects) => {
            this.renderProjects(projects);
        });

        // Subscribe to active template changes
        store.subscribe('activeTemplate', (template) => {
            if (template) {
                this.loadTemplateIntoEditor(template);
            }
        });
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            await Promise.all([
                GeneratorStore.loadTemplates(),
                GeneratorStore.loadProjects()
            ]);
        } catch (error) {
            console.error('[GeneratorView] Load initial data error:', error);
        }
    }

    /**
     * Switch tab
     */
    switchTab(tabName) {
        if (!this.tabs) return;

        // Update tab buttons
        const tabButtons = this.tabs.querySelectorAll('[data-tab]');
        tabButtons.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.className = 'px-4 py-2 text-sm font-medium bg-indigo-500 text-white rounded-lg';
            } else {
                btn.className = 'px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors';
            }
        });

        // Show/hide library sections
        if (this.library.templates) {
            this.library.templates.classList.toggle('hidden', tabName !== 'templates');
        }
        if (this.library.projects) {
            this.library.projects.classList.toggle('hidden', tabName !== 'projects');
        }

        this.activeTab = tabName;
    }

    /**
     * Render templates
     */
    renderTemplates(templates) {
        if (!this.library.templates) return;

        const container = this.library.templates.querySelector('.templates-grid');
        if (!container) return;

        container.innerHTML = '';

        if (templates.length === 0) {
            this.renderEmptyTemplatesState(container);
            return;
        }

        templates.forEach(template => {
            const templateElement = this.createTemplateElement(template);
            container.appendChild(templateElement);
        });

        // Re-initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Render projects
     */
    renderProjects(projects) {
        if (!this.library.projects) return;

        const container = this.library.projects.querySelector('.projects-grid');
        if (!container) return;

        container.innerHTML = '';

        if (projects.length === 0) {
            this.renderEmptyProjectsState(container);
            return;
        }

        projects.forEach(project => {
            const projectElement = this.createProjectElement(project);
            container.appendChild(projectElement);
        });

        // Re-initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Create template element
     */
    createTemplateElement(template) {
        const div = document.createElement('div');
        div.className = 'p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer';
        div.dataset.templateId = template.id;

        const variables = template.variables ? Object.keys(template.variables).length : 0;
        const date = new Date(template.createdAt).toLocaleDateString();

        div.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2 mb-2">
                        <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i data-lucide="file-text" class="w-4 h-4 text-blue-600 dark:text-blue-400"></i>
                        </div>
                        <h3 class="text-sm font-bold text-slate-800 dark:text-white truncate">${template.name}</h3>
                    </div>
                    
                    <div class="space-y-1">
                        <div class="text-xs text-slate-600 dark:text-slate-400">
                            <i data-lucide="hash" class="w-3 h-3 inline mr-1"></i>
                            ${variables} zmiennych
                        </div>
                        <div class="text-xs text-slate-500 dark:text-slate-400">
                            <i data-lucide="calendar" class="w-3 h-3 inline mr-1"></i>
                            ${date}
                        </div>
                    </div>
                </div>
                
                <div class="flex items-center space-x-1 ml-3">
                    <button onclick="event.stopPropagation(); generatorView.editTemplate('${template.id}')" class="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors" title="Edytuj">
                        <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="event.stopPropagation(); generatorView.deleteTemplate('${template.id}')" class="p-1.5 text-slate-400 hover:text-red-600 transition-colors" title="Usuń">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </div>
        `;

        div.addEventListener('click', () => {
            this.selectTemplate(template.id);
        });

        return div;
    }

    /**
     * Create project element
     */
    createProjectElement(project) {
        const div = document.createElement('div');
        div.className = 'p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer';
        div.dataset.projectId = project.id;

        const date = new Date(project.createdAt).toLocaleDateString();

        div.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2 mb-2">
                        <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i data-lucide="folder" class="w-4 h-4 text-green-600 dark:text-green-400"></i>
                        </div>
                        <h3 class="text-sm font-bold text-slate-800 dark:text-white truncate">${project.name}</h3>
                    </div>
                    
                    <div class="space-y-1">
                        <div class="text-xs text-slate-600 dark:text-slate-400">
                            <i data-lucide="file-text" class="w-3 h-3 inline mr-1"></i>
                            Szablon: ${project.templateName || 'Nieznany'}
                        </div>
                        <div class="text-xs text-slate-500 dark:text-slate-400">
                            <i data-lucide="calendar" class="w-3 h-3 inline mr-1"></i>
                            ${date}
                        </div>
                    </div>
                </div>
                
                <div class="flex items-center space-x-1 ml-3">
                    <button onclick="event.stopPropagation(); generatorView.editProject('${project.id}')" class="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors" title="Edytuj">
                        <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="event.stopPropagation(); generatorView.deleteProject('${project.id}')" class="p-1.5 text-slate-400 hover:text-red-600 transition-colors" title="Usuń">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </div>
        `;

        div.addEventListener('click', () => {
            this.selectProject(project.id);
        });

        return div;
    }

    /**
     * Render empty templates state
     */
    renderEmptyTemplatesState(container) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-center">
                <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <i data-lucide="file-text" size="28" class="text-slate-300 dark:text-slate-600"></i>
                </div>
                <h3 class="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">Brak szablonów</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Dodaj szablon dokumentu .docx</p>
                <button class="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm flex items-center space-x-2" onclick="generatorView.openTemplateUpload()">
                    <i data-lucide="upload" size="16" class="inline"></i>
                    <span>Dodaj szablon</span>
                </button>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Render empty projects state
     */
    renderEmptyProjectsState(container) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-center">
                <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <i data-lucide="folder" size="28" class="text-slate-300 dark:text-slate-600"></i>
                </div>
                <h3 class="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">Brak projektów</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Utwórz projekt na podstawie szablonu</p>
                <button class="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm flex items-center space-x-2" onclick="generatorView.createNewProject()">
                    <i data-lucide="plus" size="16" class="inline"></i>
                    <span>Nowy projekt</span>
                </button>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Select template
     */
    async selectTemplate(templateId) {
        try {
            await GeneratorStore.selectTemplate(templateId);
        } catch (error) {
            console.error('[GeneratorView] Select template error:', error);
        }
    }

    /**
     * Select project
     */
    async selectProject(projectId) {
        try {
            await GeneratorStore.selectProject(projectId);
        } catch (error) {
            console.error('[GeneratorView] Select project error:', error);
        }
    }

    /**
     * Edit template
     */
    editTemplate(templateId) {
        this.selectTemplate(templateId);
        this.switchTab('templates');
    }

    /**
     * Edit project
     */
    editProject(projectId) {
        this.selectProject(projectId);
        this.switchTab('projects');
    }

    /**
     * Delete template
     */
    async deleteTemplate(templateId) {
        try {
            if (!confirm('Czy na pewno usunąć ten szablon?')) return;

            await GeneratorStore.deleteTemplate(templateId);

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Szablon usunięty'
            });
        } catch (error) {
            console.error('[GeneratorView] Delete template error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd usuwania szablonu'
            });
        }
    }

    /**
     * Delete project
     */
    async deleteProject(projectId) {
        try {
            if (!confirm('Czy na pewno usunąć ten projekt?')) return;

            await GeneratorStore.deleteProject(projectId);

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Projekt usunięty'
            });
        } catch (error) {
            console.error('[GeneratorView] Delete project error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd usuwania projektu'
            });
        }
    }

    /**
     * Open template upload
     */
    openTemplateUpload() {
        const fileInput = document.getElementById('templateFileInput');
        fileInput?.click();
    }

    /**
     * Handle template upload
     */
    async handleTemplateUpload(file) {
        if (!file) return;

        // Validate file type
        if (!file.name.endsWith('.docx')) {
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Proszę wybrać plik .docx'
            });
            return;
        }

        try {
            await GeneratorStore.uploadTemplate(file);

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Szablon załadowany pomyślnie'
            });

            // Clear file input
            const fileInput = document.getElementById('templateFileInput');
            if (fileInput) fileInput.value = '';
        } catch (error) {
            console.error('[GeneratorView] Upload template error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: `Błąd ładowania szablonu: ${error.message}`
            });
        }
    }

    /**
     * Create new template
     */
    async createNewTemplate() {
        try {
            const template = {
                id: Date.now().toString(),
                name: 'Nowy szablon',
                content: '',
                variables: {},
                createdAt: new Date().toISOString()
            };

            await GeneratorStore.createTemplate(template);
            await GeneratorStore.selectTemplate(template.id);
        } catch (error) {
            console.error('[GeneratorView] Create template error:', error);
        }
    }

    /**
     * Create new project
     */
    async createNewProject() {
        try {
            const templates = store.get('templates');
            if (templates.length === 0) {
                store.commit('ADD_NOTIFICATION', {
                    type: 'warning',
                    message: 'Najpierw dodaj szablon'
                });
                return;
            }

            const project = {
                id: Date.now().toString(),
                name: 'Nowy projekt',
                templateId: templates[0].id,
                templateName: templates[0].name,
                data: {},
                createdAt: new Date().toISOString()
            };

            await GeneratorStore.createProject(project);
            await GeneratorStore.selectProject(project.id);
        } catch (error) {
            console.error('[GeneratorView] Create project error:', error);
        }
    }

    /**
     * Load template into editor
     */
    loadTemplateIntoEditor(template) {
        if (!this.editor) return;

        // Show editor
        this.editor.classList.remove('hidden');

        // Load template content
        const nameInput = this.editor.querySelector('#templateName');
        const contentArea = this.editor.querySelector('#templateContent');

        if (nameInput) nameInput.value = template.name || '';
        if (contentArea) contentArea.value = template.content || '';

        // Show variables if any
        this.renderVariables(template.variables || {});
    }

    /**
     * Render variables
     */
    renderVariables(variables) {
        const variablesContainer = document.getElementById('templateVariables');
        if (!variablesContainer) return;

        const variableNames = Object.keys(variables);
        
        if (variableNames.length === 0) {
            variablesContainer.innerHTML = '<p class="text-sm text-slate-500">Brak zmiennych w szablonie</p>';
            return;
        }

        let html = '<div class="space-y-2">';
        variableNames.forEach(varName => {
            html += `
                <div class="flex items-center space-x-2">
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">${varName}:</label>
                    <input type="text" name="${varName}" class="flex-1 px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-sm" placeholder="Wartość...">
                </div>
            `;
        });
        html += '</div>';

        variablesContainer.innerHTML = html;
    }

    /**
     * Generate document
     */
    async generateDocument() {
        try {
            const activeTemplate = store.get('activeTemplate');
            if (!activeTemplate) {
                store.commit('ADD_NOTIFICATION', {
                    type: 'warning',
                    message: 'Wybierz szablon'
                });
                return;
            }

            // Collect variable values
            const variableInputs = document.querySelectorAll('#templateVariables input');
            const data = {};
            variableInputs.forEach(input => {
                data[input.name] = input.value;
            });

            await GeneratorStore.generateDocument(activeTemplate.id, data);

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Dokument wygenerowany pomyślnie'
            });
        } catch (error) {
            console.error('[GeneratorView] Generate document error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: `Błąd generowania: ${error.message}`
            });
        }
    }
}

// Create and export singleton instance
const generatorView = new GeneratorView();

export default generatorView;