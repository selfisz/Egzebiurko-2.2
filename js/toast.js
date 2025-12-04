// TOAST NOTIFICATION SYSTEM

const Toast = {
    container: null,
    
    init() {
        if (this.container) return;
        
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none';
        document.body.appendChild(this.container);
    },
    
    show(message, type = 'info', duration = 4000) {
        this.init();
        
        const icons = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'alert-triangle',
            info: 'info'
        };
        
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-amber-500',
            info: 'bg-indigo-500'
        };
        
        const bgColors = {
            success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
            error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
            warning: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
            info: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800'
        };
        
        const textColors = {
            success: 'text-green-800 dark:text-green-200',
            error: 'text-red-800 dark:text-red-200',
            warning: 'text-amber-800 dark:text-amber-200',
            info: 'text-indigo-800 dark:text-indigo-200'
        };
        
        const toast = document.createElement('div');
        toast.className = `
            pointer-events-auto
            flex items-center gap-3 
            px-4 py-3 
            rounded-xl 
            border
            shadow-lg
            backdrop-blur-sm
            ${bgColors[type]}
            animate-toast-in
            min-w-[280px]
            max-w-[400px]
        `;
        
        toast.innerHTML = `
            <div class="w-8 h-8 rounded-lg ${colors[type]} flex items-center justify-center flex-shrink-0">
                <i data-lucide="${icons[type]}" size="18" class="text-white"></i>
            </div>
            <div class="flex-1 ${textColors[type]} text-sm font-medium">${message}</div>
            <button onclick="this.closest('.pointer-events-auto').remove()" class="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${textColors[type]}">
                <i data-lucide="x" size="16"></i>
            </button>
        `;
        
        this.container.appendChild(toast);
        if (window.lucide) lucide.createIcons();
        
        // Auto remove
        setTimeout(() => {
            toast.classList.add('animate-toast-out');
            setTimeout(() => toast.remove(), 300);
        }, duration);
        
        return toast;
    },
    
    success(message, duration) {
        return this.show(message, 'success', duration);
    },
    
    error(message, duration) {
        return this.show(message, 'error', duration);
    },
    
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    },
    
    info(message, duration) {
        return this.show(message, 'info', duration);
    }
};

// Make globally available
window.Toast = Toast;
