// --- MODULE: AI CHAT & VISION ---

// Shared helper to call Gemini API
async function callGemini(payload, model = null) {
    if (!state.GEMINI_API_KEY) throw new Error("Brak klucza API Gemini. Ustaw go w ustawieniach.");

    // Default to config model, but allow override (e.g. for vision if needed)
    // Note: gemini-1.5-flash is recommended for both text and vision now.
    // If the user has 'gemini-pro' (legacy) in config, it might not work for images.
    // We will try to use the config model, but strictly speaking 'gemini-pro' is text-only.
    // Ideally, we should switch to 'gemini-1.5-flash' in config, but I'll use a fallback here for images if needed.
    let modelName = model || CONFIG.GEMINI.MODEL;

    // Auto-switch to flash if we detect image data and the model is the old text-only pro
    if (JSON.stringify(payload).includes("image") && modelName === 'gemini-pro') {
        modelName = 'gemini-1.5-flash';
    }

    const url = `${CONFIG.GEMINI.BASE_URL}${modelName}:generateContent?key=${state.GEMINI_API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// --- PUBLIC API EXPORTS (attached to window or state if needed, but functions are global in this app) ---

async function analyzeText(text, prompt) {
    const payload = {
        contents: [{
            parts: [
                { text: prompt },
                { text: text }
            ]
        }]
    };
    return await callGemini(payload);
}

async function analyzeImage(base64Image, prompt) {
    // base64Image should be the raw base64 string without data:image/png;base64 prefix if possible,
    // or we strip it here. Gemini API expects raw base64.
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const payload = {
        contents: [{
            parts: [
                { text: prompt },
                {
                    inlineData: {
                        mimeType: "image/jpeg", // We assume jpeg/png, API is forgiving usually
                        data: cleanBase64
                    }
                }
            ]
        }]
    };
    // Force a vision-capable model if the config is set to legacy gemini-pro
    return await callGemini(payload, 'gemini-1.5-flash');
}

// --- LEGACY/UI FUNCTIONS ---

async function handlePdfUpload(e) {
    const f = e.target.files;
    if (!f.length) return;
    for (let file of f) {
        const ab = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(ab).promise;
        let txt = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const p = await pdf.getPage(i);
            const c = await p.getTextContent();
            txt += c.items.map(x => x.str).join(" ") + "\n";
        }
        await state.db.put('pdfs', {
            name: file.name,
            text: txt
        });
    }
    loadPdfList();
    alert("Wgrano!");
}

async function loadPdfList() {
    const l = document.getElementById('pdfList');
    if(!l) return;
    l.innerHTML = '';
    const p = await state.db.getAll('pdfs');
    state.currentPdfText = p.map(x => `--- ${x.name} ---\n${x.text}`).join("\n\n");
    if (p.length === 0) l.innerHTML = '<div class="text-center text-slate-300 mt-4">Brak dokumentów</div>';
    p.forEach(x => {
        const d = document.createElement('div');
        d.className = "flex justify-between p-1 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 mb-1 rounded";
        d.innerHTML = `<span class="truncate w-32">${x.name}</span> <button onclick="delPdf('${x.name}')" class="text-red-500">x</button>`;
        l.appendChild(d);
    });
    if(window.lucide) lucide.createIcons();
}

async function delPdf(n) {
    await state.db.delete('pdfs', n);
    loadPdfList();
}

async function runAI() {
    if (!state.GEMINI_API_KEY) return window.toggleSettings ? window.toggleSettings() : goToModule('settings');
    const q = document.getElementById('aiInput').value;
    const ctx = document.getElementById('caseContext').value;
    const chat = document.getElementById('aiChat');
    const btn = document.getElementById('aiBtn');

    if (!q) return;

    chat.innerHTML += `<div class="text-right mb-2"><span class="bg-purple-100 text-purple-900 px-3 py-2 rounded-lg inline-block text-xs font-medium">${q}</span></div>`;
    chat.scrollTop = chat.scrollHeight;
    document.getElementById('aiInput').value = '';
    btn.disabled = true;
    btn.innerHTML = '...';

    try {
        const prompt = `Jesteś asystentem prawnym. BAZA:\n${state.currentPdfText ? state.currentPdfText.substring(0,50000) : ''}\nKONTEKST:\n${ctx}\nPYTANIE:\n${q}`;
        const ansText = await callGemini({
            contents: [{ parts: [{ text: prompt }] }]
        });
        const ans = marked.parse(ansText);

        chat.innerHTML += `<div class="text-left prose prose-sm max-w-none"><div class="bg-white dark:bg-slate-700 dark:text-slate-200 border dark:border-slate-600 p-3 rounded-lg shadow-sm text-xs">${ans}</div></div>`;
        chat.scrollTop = chat.scrollHeight;
    } catch (e) {
        chat.innerHTML += `<div class="text-center text-red-500 text-xs">Błąd: ${e.message}</div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="send"></i>';
        if(window.lucide) lucide.createIcons();
    }
}

// --- MAGIC FILL (AI) ---
function saveSettingsPage() {
    state.GEMINI_API_KEY = document.getElementById('apiKeyPage').value;
    localStorage.setItem(CONFIG.GEMINI.STORAGE_KEY, state.GEMINI_API_KEY);
    alert('Zapisano klucz API');
}

function openMagicFill() {
    if (!state.GEMINI_API_KEY) {
        alert("Ustaw klucz API w Ustawieniach");
        goToModule('settings');
        return;
    }
    if (state.detectedVariables.length === 0) return alert("Wczytaj szablon");
    document.getElementById('magicFillModal').classList.remove('hidden');
}

function closeMagicFill() {
    document.getElementById('magicFillModal').classList.add('hidden');
}

async function runGeminiMagic() {
    const text = document.getElementById('magicInput').value;
    if (!text) return;
    const btn = document.getElementById('magicBtn');
    const oldText = btn.innerHTML;
    btn.innerHTML = 'Analizuję...';
    btn.disabled = true;

    try {
        const fields = state.detectedVariables.filter(v => !v.toLowerCase().includes('_reszta')).join(', ');
        const prompt = `Jesteś urzędnikiem. Wyciągnij dane z tekstu do json: {${fields}}. Tekst: "${text}". Formatuj daty YYYY-MM-DD. Zwróć czysty JSON.`;

        const rawText = await callGemini({
            contents: [{ parts: [{ text: prompt }] }]
        });

        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Nie znaleziono poprawnego JSON w odpowiedzi AI");
        const json = JSON.parse(jsonMatch[0]);

        for (const [k, v] of Object.entries(json)) {
            const el = document.getElementById(`var_${k}`);
            if (el && v) {
                el.value = v;
                el.classList.add('bg-green-100');
                setTimeout(() => el.classList.remove('bg-green-100'), 1000);
            }
        }
        closeMagicFill();
    } catch (e) {
        alert("Błąd AI: " + e.message);
    } finally {
        btn.innerHTML = oldText;
        btn.disabled = false;
        if(window.lucide) lucide.createIcons();
    }
}
