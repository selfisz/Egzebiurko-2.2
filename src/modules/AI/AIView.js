/**
 * AI View - AI Assistant and Text Processing UI
 */

import store from '../../store/index.js';
import AIStore from './AIStore.js';

class AIView {
    constructor() {
        this.container = null;
        this.chat = null;
        this.input = null;
        this.sendBtn = null;
        this.clearBtn = null;
        this.apiKeyInput = null;
        this.saveKeyBtn = null;
        this.processBtn = null;
        this.processTextarea = null;
        this.init();
    }

    /**
     * Initialize AI View
     */
    init() {
        console.log('[AIView] Initializing...');
        
        // Get DOM elements
        this.container = document.getElementById('aiContainer');
        this.chat = document.getElementById('aiChat');
        this.input = document.getElementById('aiInput');
        this.sendBtn = document.getElementById('aiSendBtn');
        this.clearBtn = document.getElementById('aiClearBtn');
        this.apiKeyInput = document.getElementById('aiApiKey');
        this.saveKeyBtn = document.getElementById('aiSaveKeyBtn');
        this.processBtn = document.getElementById('aiProcessBtn');
        this.processTextarea = document.getElementById('aiProcessText');

        // Setup event listeners
        this.setupEventListeners();
        
        // Subscribe to store changes
        this.setupStoreSubscriptions();
        
        // Load initial data
        this.loadInitialData();
        
        console.log('[AIView] Initialized successfully');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Chat functionality
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => {
                this.sendMessage();
            });
        }

        if (this.input) {
            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => {
                this.clearChat();
            });
        }

        // API key management
        if (this.saveKeyBtn) {
            this.saveKeyBtn.addEventListener('click', () => {
                this.saveApiKey();
            });
        }

        if (this.apiKeyInput) {
            this.apiKeyInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.saveApiKey();
                }
            });
        }

        // Text processing
        if (this.processBtn) {
            this.processBtn.addEventListener('click', () => {
                this.processText();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.sendMessage();
                }
                if (e.key === 'l') {
                    e.preventDefault();
                    this.clearChat();
                }
            }
        });
    }

    /**
     * Setup store subscriptions
     */
    setupStoreSubscriptions() {
        // Subscribe to messages changes
        store.subscribe('aiMessages', (messages) => {
            this.renderMessages(messages);
        });

        // Subscribe to loading state
        store.subscribe('aiLoading', (loading) => {
            this.setLoading(loading);
        });

        // Subscribe to API key changes
        store.subscribe('aiApiKey', (apiKey) => {
            if (this.apiKeyInput) {
                this.apiKeyInput.value = apiKey || '';
            }
        });
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            await AIStore.loadMessages();
            await AIStore.loadApiKey();
        } catch (error) {
            console.error('[AIView] Load initial data error:', error);
        }
    }

    /**
     * Send message
     */
    async sendMessage() {
        if (!this.input) return;

        const message = this.input.value.trim();
        if (!message) return;

        try {
            await AIStore.sendMessage(message);
            
            // Clear input
            this.input.value = '';
            
            // Focus input
            this.input.focus();
        } catch (error) {
            console.error('[AIView] Send message error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: `Błąd wysyłania wiadomości: ${error.message}`
            });
        }
    }

    /**
     * Clear chat
     */
    async clearChat() {
        try {
            if (!confirm('Czy na pewno wyczyścić całą rozmowę?')) return;

            await AIStore.clearMessages();

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Rozmowa wyczyszczona'
            });
        } catch (error) {
            console.error('[AIView] Clear chat error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd czyszczenia rozmowy'
            });
        }
    }

    /**
     * Save API key
     */
    async saveApiKey() {
        if (!this.apiKeyInput) return;

        const apiKey = this.apiKeyInput.value.trim();
        if (!apiKey) {
            store.commit('ADD_NOTIFICATION', {
                type: 'warning',
                message: 'Wprowadź klucz API'
            });
            return;
        }

        try {
            await AIStore.saveApiKey(apiKey);

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Klucz API zapisany'
            });
        } catch (error) {
            console.error('[AIView] Save API key error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd zapisu klucza API'
            });
        }
    }

    /**
     * Process text
     */
    async processText() {
        if (!this.processTextarea) return;

        const text = this.processTextarea.value.trim();
        if (!text) {
            store.commit('ADD_NOTIFICATION', {
                type: 'warning',
                message: 'Wprowadź tekst do przetworzenia'
            });
            return;
        }

        try {
            await AIStore.processText(text);

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Tekst przetworzony'
            });
        } catch (error) {
            console.error('[AIView] Process text error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: `Błąd przetwarzania tekstu: ${error.message}`
            });
        }
    }

    /**
     * Render messages
     */
    renderMessages(messages) {
        if (!this.chat) return;

        this.chat.innerHTML = '';

        if (messages.length === 0) {
            this.renderEmptyChatState();
            return;
        }

        messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            this.chat.appendChild(messageElement);
        });

        // Scroll to bottom
        this.chat.scrollTop = this.chat.scrollHeight;

        // Re-initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Create message element
     */
    createMessageElement(message) {
        const div = document.createElement('div');
        const isUser = message.role === 'user';
        
        div.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`;
        
        div.innerHTML = `
            <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                isUser 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white'
            }">
                <div class="text-sm whitespace-pre-wrap">${message.content}</div>
                <div class="text-xs ${isUser ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'} mt-1">
                    ${new Date(message.timestamp).toLocaleTimeString()}
                </div>
            </div>
        `;

        return div;
    }

    /**
     * Render empty chat state
     */
    renderEmptyChatState() {
        this.chat.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-center">
                <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <i data-lucide="message-circle" size="28" class="text-slate-300 dark:text-slate-600"></i>
                </div>
                <h3 class="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">Rozpocznij rozmowę</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Zadaj pytanie asystentowi AI</p>
                <div class="space-y-2">
                    <button class="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm" onclick="aiView.focusInput()">
                        <i data-lucide="send" size="16" class="inline mr-2"></i>
                        Zadaj pytanie
                    </button>
                </div>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        if (this.sendBtn) {
            this.sendBtn.disabled = loading;
            this.sendBtn.innerHTML = loading 
                ? '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>'
                : '<i data-lucide="send" class="w-4 h-4"></i>';
        }

        if (this.processBtn) {
            this.processBtn.disabled = loading;
            this.processBtn.innerHTML = loading 
                ? '<i data-lucide="loader-2" class="w-4 h-4 animate-spin mr-2"></i>Przetwarzanie...'
                : '<i data-lucide="cpu" class="w-4 h-4 mr-2"></i>Przetwarzaj';
        }

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Focus input
     */
    focusInput() {
        if (this.input) {
            this.input.focus();
        }
    }

    /**
     * Get suggested prompts
     */
    getSuggestedPrompts() {
        return [
            'Wygeneruj podsumowanie sprawy',
            'Analizuj dokument prawny',
            'Pomóż napisać pismo do komornika',
            'Wyjaśnij procedurę egzekucyjną',
            'Przetwórz tekst dokumentu',
            'Znajdź kluczowe informacje w dokumencie'
        ];
    }

    /**
     * Render suggested prompts
     */
    renderSuggestedPrompts() {
        const container = document.getElementById('aiSuggestions');
        if (!container) return;

        const prompts = this.getSuggestedPrompts();
        
        let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-2">';
        prompts.forEach(prompt => {
            html += `
                <button onclick="aiView.usePrompt('${prompt.replace(/'/g, "\\'")}')" class="p-3 text-left text-sm bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <i data-lucide="sparkles" class="w-4 h-4 inline mr-2 text-indigo-500"></i>
                    ${prompt}
                </button>
            `;
        });
        html += '</div>';

        container.innerHTML = html;

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Use suggested prompt
     */
    usePrompt(prompt) {
        if (this.input) {
            this.input.value = prompt;
            this.input.focus();
        }
    }

    /**
     * Export chat history
     */
    exportChatHistory() {
        try {
            const messages = store.get('aiMessages');
            
            if (messages.length === 0) {
                store.commit('ADD_NOTIFICATION', {
                    type: 'warning',
                    message: 'Brak wiadomości do eksportu'
                });
                return;
            }

            const dataStr = JSON.stringify(messages, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ai_chat_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Historia rozmowy wyeksportowana'
            });
        } catch (error) {
            console.error('[AIView] Export error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd eksportu historii'
            });
        }
    }

    /**
     * Get AI statistics
     */
    getStatistics() {
        const messages = store.get('aiMessages');
        
        return {
            totalMessages: messages.length,
            userMessages: messages.filter(m => m.role === 'user').length,
            aiMessages: messages.filter(m => m.role === 'assistant').length,
            hasApiKey: !!store.get('aiApiKey')
        };
    }

    /**
     * Render statistics
     */
    renderStatistics() {
        const stats = this.getStatistics();
        const container = document.getElementById('aiStats');
        
        if (container) {
            container.innerHTML = `
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                        <div class="text-2xl font-bold text-slate-800 dark:text-white">${stats.totalMessages}</div>
                        <div class="text-xs text-slate-500 dark:text-slate-400">Wiadomości</div>
                    </div>
                    <div class="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                        <div class="text-2xl font-bold text-slate-800 dark:text-white">${stats.userMessages}</div>
                        <div class="text-xs text-slate-500 dark:text-slate-400">Użytkownik</div>
                    </div>
                    <div class="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                        <div class="text-2xl font-bold text-slate-800 dark:text-white">${stats.aiMessages}</div>
                        <div class="text-xs text-slate-500 dark:text-slate-400">AI</div>
                    </div>
                    <div class="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                        <div class="text-2xl font-bold text-slate-800 dark:text-white">${stats.hasApiKey ? '✓' : '✗'}</div>
                        <div class="text-xs text-slate-500 dark:text-slate-400">Klucz API</div>
                    </div>
                </div>
            `;
        }
    }
}

// Create and export singleton instance
const aiView = new AIView();

export default aiView;