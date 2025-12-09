/**
 * AI Store - Gemini API Integration and PDF Processing
 */

import store from '../../store/index.js';

// Add AI state
if (!store.state.aiApiKey) store.state.aiApiKey = null;
if (!store.state.aiHistory) store.state.aiHistory = [];
if (!store.state.aiMessages) store.state.aiMessages = [];
if (typeof store.state.aiLoading === 'undefined') store.state.aiLoading = false;
if (!store.state.pdfList) store.state.pdfList = [];

// Mutations
store.registerMutation('SET_AI_API_KEY', (state, apiKey) => {
    state.aiApiKey = apiKey;
});

store.registerMutation('ADD_AI_MESSAGE', (state, message) => {
    const entry = {
        ...message,
        timestamp: message.timestamp || new Date().toISOString()
    };
    state.aiHistory.push(entry);
    // Keep aiMessages (used by AIView) in sync with history
    state.aiMessages = state.aiHistory.slice();
});

store.registerMutation('CLEAR_AI_HISTORY', (state) => {
    state.aiHistory = [];
    state.aiMessages = [];
});

store.registerMutation('SET_AI_LOADING', (state, loading) => {
    state.aiLoading = !!loading;
});

store.registerMutation('SET_PDF_LIST', (state, pdfList) => {
    state.pdfList = pdfList;
});

store.registerMutation('ADD_PDF', (state, pdf) => {
    state.pdfList.push(pdf);
});

// Actions
store.registerAction('callGemini', async ({ state }, { payload, model = null }) => {
    if (!state.aiApiKey) {
        throw new Error("Brak klucza API Gemini. Ustaw go w ustawieniach.");
    }

    // Get model from config or use default
    let modelName = model || (CONFIG?.GEMINI?.MODEL || 'gemini-1.5-flash');

    // Auto-switch to flash if we detect image data and the model is the old text-only pro
    if (JSON.stringify(payload).includes("image") && modelName === 'gemini-pro') {
        modelName = 'gemini-1.5-flash';
    }

    const url = `${CONFIG?.GEMINI?.BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/models/'}${modelName}:generateContent?key=${state.aiApiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('[AI] Gemini API error:', error);
        throw error;
    }
});

store.registerAction('analyzeText', async ({ dispatch }, { text, prompt }) => {
    try {
        const payload = {
            contents: [{
                parts: [
                    { text: prompt },
                    { text: text }
                ]
            }]
        };

        const result = await dispatch('callGemini', { payload });
        
        // Add to history
        store.commit('ADD_AI_MESSAGE', {
            type: 'text-analysis',
            prompt,
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            result
        });

        return result;
    } catch (error) {
        console.error('[AI] Text analysis error:', error);
        throw error;
    }
});

store.registerAction('analyzeImage', async ({ dispatch }, { base64Image, prompt }) => {
    try {
        // Clean base64 string - remove data URL prefix if present
        const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

        const payload = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: cleanBase64
                        }
                    }
                ]
            }]
        };

        // Force a vision-capable model
        const result = await dispatch('callGemini', { payload, model: 'gemini-1.5-flash' });
        
        // Add to history
        store.commit('ADD_AI_MESSAGE', {
            type: 'image-analysis',
            prompt,
            result
        });

        return result;
    } catch (error) {
        console.error('[AI] Image analysis error:', error);
        throw error;
    }
});

store.registerAction('processPdf', async ({ commit, state, dispatch }, file) => {
    if (!file) return;

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        let fullText = "";
        const numPages = pdf.numPages;
        
        // Extract text from all pages
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ');
            fullText += pageText + '\n';
        }

        // Save PDF info to database
        const pdfInfo = {
            id: Date.now(),
            name: file.name,
            size: file.size,
            pages: numPages,
            text: fullText,
            uploadedAt: new Date().toISOString()
        };

        if (state.db) {
            await state.db.add('pdfs', pdfInfo);
        }

        commit('ADD_PDF', pdfInfo);

        return {
            pdfInfo,
            text: fullText
        };
    } catch (error) {
        console.error('[AI] PDF processing error:', error);
        throw error;
    }
});

store.registerAction('analyzePdf', async ({ dispatch }, { pdfId, prompt }) => {
    try {
        const pdfInfo = await store.state.db.get('pdfs', pdfId);
        if (!pdfInfo) {
            throw new Error('PDF not found');
        }

        const result = await dispatch('analyzeText', {
            text: pdfInfo.text,
            prompt: prompt || 'Analizuj ten dokument PDF i podaj kluczowe informacje'
        });

        // Add to history with PDF reference
        store.commit('ADD_AI_MESSAGE', {
            type: 'pdf-analysis',
            pdfName: pdfInfo.name,
            pdfId,
            prompt,
            result
        });

        return result;
    } catch (error) {
        console.error('[AI] PDF analysis error:', error);
        throw error;
    }
});

store.registerAction('loadPdfList', async ({ commit, state }) => {
    if (!state.db) return;

    try {
        const pdfList = await state.db.getAll('pdfs');
        pdfList.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        commit('SET_PDF_LIST', pdfList);
        return pdfList;
    } catch (error) {
        console.error('[AI] Load PDF list error:', error);
        throw error;
    }
});

store.registerAction('deletePdf', async ({ commit, state }, pdfId) => {
    if (!state.db) return;

    try {
        await state.db.delete('pdfs', pdfId);
        
        const updatedList = state.pdfList.filter(pdf => pdf.id !== pdfId);
        commit('SET_PDF_LIST', updatedList);

        store.commit('ADD_NOTIFICATION', {
            type: 'success',
            message: 'PDF został usunięty'
        });
    } catch (error) {
        console.error('[AI] Delete PDF error:', error);
        throw error;
    }
});

store.registerAction('setApiKey', ({ commit }, apiKey) => {
    commit('SET_AI_API_KEY', apiKey);
    localStorage.setItem('ai_api_key', apiKey);
});

store.registerAction('loadApiKey', ({ commit }) => {
    const savedKey = localStorage.getItem('ai_api_key');
    if (savedKey) {
        commit('SET_AI_API_KEY', savedKey);
    }
    return savedKey;
});

// Initialize API key on module load
store.dispatch('loadApiKey');

// --- Helper functions used by AIView ---

async function sendChatMessage(message) {
    const text = (message || '').trim();
    if (!text) return null;

    // Add user message to history
    store.commit('ADD_AI_MESSAGE', {
        role: 'user',
        content: text
    });

    store.commit('SET_AI_LOADING', true);

    try {
        const prompt = `Jesteś asystentem prawnym. Odpowiadaj po polsku, jasno i konkretnie.\n\nPytanie:\n${text}`;

        const payload = {
            contents: [{
                parts: [{ text: prompt }]
            }]
        };

        const result = await store.dispatch('callGemini', { payload });

        const aiMessage = {
            role: 'assistant',
            content: result
        };

        store.commit('ADD_AI_MESSAGE', aiMessage);

        return aiMessage;
    } finally {
        store.commit('SET_AI_LOADING', false);
    }
}

function clearMessages() {
    store.commit('CLEAR_AI_HISTORY');
}

function loadMessages() {
    // Ensure aiMessages is at least an empty array
    const messages = store.get('aiMessages') || [];
    // Trigger subscribers explicitly (even if already set)
    store.commit('SET_AI_MESSAGES', messages);
    return messages;
}

async function saveApiKey(apiKey) {
    await store.dispatch('setApiKey', apiKey);
}

async function processText(text) {
    const content = (text || '').trim();
    if (!content) return null;

    const prompt = 'Przetwórz ten tekst, podsumuj kluczowe informacje i wypunktuj najważniejsze rzeczy po polsku.';
    return store.dispatch('analyzeText', { text: content, prompt });
}

export default {
    // Low-level API
    analyzeText: (text, prompt) => store.dispatch('analyzeText', { text, prompt }),
    analyzeImage: (base64Image, prompt) => store.dispatch('analyzeImage', { base64Image, prompt }),
    processPdf: (file) => store.dispatch('processPdf', file),
    analyzePdf: (pdfId, prompt) => store.dispatch('analyzePdf', { pdfId, prompt }),
    loadPdfList: () => store.dispatch('loadPdfList'),
    deletePdf: (pdfId) => store.dispatch('deletePdf', pdfId),
    setApiKey: (apiKey) => store.dispatch('setApiKey', apiKey),
    loadApiKey: () => store.dispatch('loadApiKey'),
    clearHistory: () => store.commit('CLEAR_AI_HISTORY'),
    getHistory: () => store.get('aiHistory'),
    getPdfList: () => store.get('pdfList'),

    // High-level API used by AIView
    sendMessage: (message) => sendChatMessage(message),
    clearMessages: () => clearMessages(),
    loadMessages: () => loadMessages(),
    saveApiKey: (apiKey) => saveApiKey(apiKey),
    processText: (text) => processText(text)
};