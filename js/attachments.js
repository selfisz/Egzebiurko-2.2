// ATTACHMENTS MODULE - File management with compression and limits

const ATTACHMENT_CONFIG = {
    MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB per file
    MAX_TOTAL_SIZE: 50 * 1024 * 1024, // 50MB total storage
    MAX_IMAGE_WIDTH: 1200, // Max width for image compression
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
};

// Get current storage usage
async function getStorageUsage() {
    try {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            return {
                used: estimate.usage || 0,
                quota: estimate.quota || ATTACHMENT_CONFIG.MAX_TOTAL_SIZE,
                percentage: ((estimate.usage || 0) / (estimate.quota || ATTACHMENT_CONFIG.MAX_TOTAL_SIZE)) * 100
            };
        }
    } catch (error) {
        console.error('Storage estimate error:', error);
    }
    return { used: 0, quota: ATTACHMENT_CONFIG.MAX_TOTAL_SIZE, percentage: 0 };
}

// Compress image before storing
async function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Resize if too large
                if (width > ATTACHMENT_CONFIG.MAX_IMAGE_WIDTH) {
                    height = (height * ATTACHMENT_CONFIG.MAX_IMAGE_WIDTH) / width;
                    width = ATTACHMENT_CONFIG.MAX_IMAGE_WIDTH;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to blob with compression
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Compression failed'));
                    }
                }, 'image/jpeg', 0.85); // 85% quality
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Add attachment to case
async function addAttachment(caseId, file) {
    try {
        // Check file type
        if (!ATTACHMENT_CONFIG.ALLOWED_TYPES.includes(file.type)) {
            throw new Error('Nieobsługiwany typ pliku. Dozwolone: JPG, PNG, WEBP, PDF');
        }
        
        // Check file size
        if (file.size > ATTACHMENT_CONFIG.MAX_FILE_SIZE) {
            throw new Error(`Plik zbyt duży. Maksymalny rozmiar: ${ATTACHMENT_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`);
        }
        
        // Check storage quota
        const storage = await getStorageUsage();
        if (storage.percentage > 90) {
            throw new Error('Brak miejsca. Usuń stare załączniki lub wykonaj backup.');
        }
        
        // Compress image if needed
        let processedFile = file;
        if (file.type.startsWith('image/')) {
            processedFile = await compressImage(file);
        }
        
        // Convert to base64
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = async () => {
                const attachment = {
                    id: Date.now(),
                    caseId: caseId,
                    name: file.name,
                    type: file.type,
                    size: processedFile.size,
                    data: reader.result,
                    createdAt: new Date().toISOString()
                };
                
                // Save to IndexedDB
                const db = await idb.openDB(CONFIG.DB_NAME, CONFIG.DB_VERSION);
                if (!db.objectStoreNames.contains('attachments')) {
                    console.warn('Attachments store not found');
                    reject(new Error('Database not ready'));
                    return;
                }
                
                await db.add('attachments', attachment);
                resolve(attachment);
            };
            reader.onerror = reject;
            reader.readAsDataURL(processedFile);
        });
    } catch (error) {
        throw error;
    }
}

// Get attachments for a case
async function getAttachments(caseId) {
    try {
        const db = await idb.openDB(CONFIG.DB_NAME, CONFIG.DB_VERSION);
        if (!db.objectStoreNames.contains('attachments')) {
            return [];
        }
        
        const allAttachments = await db.getAll('attachments');
        return allAttachments.filter(a => a.caseId === caseId);
    } catch (error) {
        console.error('Get attachments error:', error);
        return [];
    }
}

// Delete attachment
async function deleteAttachment(attachmentId) {
    try {
        const db = await idb.openDB(CONFIG.DB_NAME, CONFIG.DB_VERSION);
        if (!db.objectStoreNames.contains('attachments')) {
            return;
        }
        
        await db.delete('attachments', attachmentId);
    } catch (error) {
        console.error('Delete attachment error:', error);
        throw error;
    }
}

// Download attachment
function downloadAttachment(attachment) {
    const link = document.createElement('a');
    link.href = attachment.data;
    link.download = attachment.name;
    link.click();
}

// Render attachments list
async function renderAttachments(caseId) {
    const container = document.getElementById('attachmentsList');
    if (!container) return;
    
    const attachments = await getAttachments(caseId);
    
    if (attachments.length === 0) {
        container.innerHTML = '<div class="text-xs text-slate-400 text-center py-4">Brak załączników</div>';
        return;
    }
    
    container.innerHTML = attachments.map(att => {
        const sizeKB = (att.size / 1024).toFixed(1);
        const isImage = att.type.startsWith('image/');
        const icon = isImage ? 'image' : 'file-text';
        
        return `
            <div class="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div class="w-8 h-8 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <i data-lucide="${icon}" size="16" class="text-indigo-600 dark:text-indigo-400"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">${att.name}</div>
                    <div class="text-[10px] text-slate-500">${sizeKB} KB</div>
                </div>
                <button onclick="downloadAttachment(${JSON.stringify(att).replace(/"/g, '&quot;')})" class="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors" title="Pobierz">
                    <i data-lucide="download" size="14"></i>
                </button>
                <button onclick="deleteAttachmentWithConfirm(${att.id}, ${caseId})" class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Usuń">
                    <i data-lucide="trash-2" size="14"></i>
                </button>
            </div>
        `;
    }).join('');
    
    if (window.lucide) lucide.createIcons();
}

// Delete with confirmation
async function deleteAttachmentWithConfirm(attachmentId, caseId) {
    if (!confirm('Usunąć załącznik?')) return;
    
    try {
        await deleteAttachment(attachmentId);
        await renderAttachments(caseId);
        showAttachmentMessage('Załącznik usunięty', 'success');
    } catch (error) {
        showAttachmentMessage('Błąd usuwania: ' + error.message, 'error');
    }
}

// Handle file upload
async function handleAttachmentUpload(event, caseId) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        showAttachmentMessage('Przetwarzanie...', 'info');
        await addAttachment(caseId, file);
        await renderAttachments(caseId);
        showAttachmentMessage('Załącznik dodany', 'success');
        event.target.value = ''; // Reset input
    } catch (error) {
        showAttachmentMessage(error.message, 'error');
        event.target.value = '';
    }
}

// Show message
function showAttachmentMessage(message, type = 'info') {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-indigo-500'
    };
    
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 z-[100] ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg text-sm font-bold animate-slide-in-right`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

// Render storage usage indicator
async function renderStorageUsage() {
    const container = document.getElementById('storageUsage');
    if (!container) return;
    
    const storage = await getStorageUsage();
    const usedMB = (storage.used / 1024 / 1024).toFixed(1);
    const quotaMB = (storage.quota / 1024 / 1024).toFixed(0);
    const percentage = Math.min(storage.percentage, 100);
    
    let colorClass = 'bg-green-500';
    if (percentage > 80) colorClass = 'bg-red-500';
    else if (percentage > 60) colorClass = 'bg-amber-500';
    
    container.innerHTML = `
        <div class="text-xs text-slate-600 dark:text-slate-400 mb-2">
            Zajętość pamięci: <span class="font-bold">${usedMB} MB / ${quotaMB} MB</span>
        </div>
        <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div class="${colorClass} h-full transition-all duration-300" style="width: ${percentage}%"></div>
        </div>
    `;
}

// Make functions globally available
window.addAttachment = addAttachment;
window.getAttachments = getAttachments;
window.deleteAttachment = deleteAttachment;
window.downloadAttachment = downloadAttachment;
window.renderAttachments = renderAttachments;
window.deleteAttachmentWithConfirm = deleteAttachmentWithConfirm;
window.handleAttachmentUpload = handleAttachmentUpload;
window.renderStorageUsage = renderStorageUsage;
window.getStorageUsage = getStorageUsage;
