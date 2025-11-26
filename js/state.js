
const state = {
    db: null,
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    editingId: null,
    editingType: null, // 'case', 'link', 'note'
    trackerSort: 'deadline', // deadline, added, no
    showArchived: false,

    // Generator State
    docContent: null,
    currentFileName: '',
    detectedVariables: [],
    libraryTab: 'templates', // templates, drafts
    activeTab: 'addresses', // addresses, signatures

    // Notes State
    activeNoteId: null,

    // AI State
    currentPdfText: '',
    GEMINI_API_KEY: localStorage.getItem(CONFIG.GEMINI.STORAGE_KEY) || ''
};

// Expose state to window for legacy functions (if any) or debugging
window.state = state;
