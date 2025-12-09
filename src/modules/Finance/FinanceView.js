/**
 * Finance View - Financial Calculators UI
 */

import store from '../../store/index.js';
import FinanceStore from './FinanceStore.js';

class FinanceView {
    constructor() {
        this.container = null;
        this.tabs = null;
        this.calculators = {
            balance: null,
            kpa: null,
            valuation: null,
            interest: null,
            costs: null
        };
        this.activeTab = 'balance';
    }

    /**
     * Initialize Finance View
     */
    init() {
        console.log('[FinanceView] Initializing...');
        
        // Get DOM elements
        this.container = document.getElementById('financeContainer');
        this.tabs = document.getElementById('financeTabs');
        
        // Get calculator containers
        this.calculators.balance = document.getElementById('balanceCalculator');
        this.calculators.kpa = document.getElementById('kpaCalculator');
        this.calculators.valuation = document.getElementById('valuationCalculator');
        this.calculators.interest = document.getElementById('interestCalculator');
        this.calculators.costs = document.getElementById('costsCalculator');

        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize calculators
        this.initializeCalculators();
        
        console.log('[FinanceView] Initialized successfully');
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

        // Calculator form inputs
        this.setupCalculatorListeners();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === '1') this.switchTab('balance');
                if (e.key === '2') this.switchTab('kpa');
                if (e.key === '3') this.switchTab('valuation');
                if (e.key === '4') this.switchTab('interest');
                if (e.key === '5') this.switchTab('costs');
            }
        });
    }

    /**
     * Setup calculator event listeners
     */
    setupCalculatorListeners() {
        // Balance Calculator
        const balanceForm = document.getElementById('balanceForm');
        if (balanceForm) {
            balanceForm.addEventListener('input', () => this.calculateBalance());
        }

        // KPA Calculator
        const kpaForm = document.getElementById('kpaForm');
        if (kpaForm) {
            kpaForm.addEventListener('input', () => this.calculateKPA());
        }

        // Valuation Calculator
        const valuationForm = document.getElementById('valuationForm');
        if (valuationForm) {
            valuationForm.addEventListener('input', () => this.calculateValuation());
        }

        // Interest Calculator
        const interestForm = document.getElementById('interestForm');
        if (interestForm) {
            interestForm.addEventListener('input', () => this.calculateInterest());
        }

        // Costs Calculator
        const costsForm = document.getElementById('costsForm');
        if (costsForm) {
            costsForm.addEventListener('input', () => this.calculateCosts());
        }
    }

    /**
     * Initialize calculators
     */
    initializeCalculators() {
        this.switchTab('balance');
        this.calculateBalance();
        this.calculateKPA();
        this.calculateValuation();
        this.calculateInterest();
        this.calculateCosts();
    }

    /**
     * Switch tab
     */
    switchTab(tabName) {
        if (!this.tabs || !this.calculators[tabName]) return;

        // Update tab buttons
        const tabButtons = this.tabs.querySelectorAll('[data-tab]');
        tabButtons.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.className = 'px-4 py-2 text-sm font-medium bg-indigo-500 text-white rounded-lg';
            } else {
                btn.className = 'px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors';
            }
        });

        // Show/hide calculator containers
        Object.entries(this.calculators).forEach(([name, container]) => {
            if (container) {
                container.classList.toggle('hidden', name !== tabName);
            }
        });

        this.activeTab = tabName;

        // Focus first input in active calculator
        const firstInput = this.calculators[tabName]?.querySelector('input');
        if (firstInput) {
            firstInput.focus();
        }
    }

    /**
     * Calculate balance
     */
    calculateBalance() {
        try {
            const om = document.getElementById('bOldM')?.value || 0;
            const oi = document.getElementById('bOldI')?.value || 0;
            const nm = document.getElementById('bNewM')?.value || 0;
            
            const result = FinanceStore.calculateBalance(om, oi, nm);
            
            // Display individual results
            const sumEl = document.getElementById('bSum');
            const newIEl = document.getElementById('bNewI');
            const diffEl = document.getElementById('bDiff');
            
            if (sumEl) sumEl.innerText = result.sum;
            if (newIEl) newIEl.innerText = result.newInterest;
            if (diffEl) diffEl.innerText = result.diff ? `Różnica: ${result.diff}` : '';
        } catch (error) {
            console.error('[FinanceView] Balance calculation error:', error);
        }
    }

    /**
     * Calculate KPA
     */
    calculateKPA() {
        try {
            const dateInput = document.getElementById('awizoDate')?.value;
            if (!dateInput) return;
            
            const result = FinanceStore.calculateKPA(dateInput);
            
            const resultEl = document.getElementById('kpaResult');
            const noteEl = document.getElementById('kpaNote');
            
            if (resultEl) resultEl.innerText = result.date;
            if (noteEl) noteEl.innerText = result.note;
        } catch (error) {
            console.error('[FinanceView] KPA calculation error:', error);
        }
    }

    /**
     * Calculate vehicle valuation
     */
    calculateValuation() {
        try {
            const p1 = document.getElementById('fcP1')?.value || 0;
            const p2 = document.getElementById('fcP2')?.value || 0;
            const p3 = document.getElementById('fcP3')?.value || 0;
            const isDamaged = document.getElementById('fcBad')?.checked || false;
            
            const result = FinanceStore.calculateCarValuation(p1, p2, p3, isDamaged);
            
            const resultEl = document.getElementById('fcResult');
            if (resultEl) resultEl.innerText = `${result} zł`;
        } catch (error) {
            console.error('[FinanceView] Valuation calculation error:', error);
        }
    }

    /**
     * Calculate interest
     */
    calculateInterest() {
        try {
            const principal = document.getElementById('intPrincipal')?.value || 0;
            const rate = document.getElementById('intRate')?.value || 0;
            const days = document.getElementById('intDays')?.value || 0;
            
            const result = FinanceStore.calculateInterest(principal, rate, days);
            
            const resultEl = document.getElementById('intResult');
            if (resultEl) resultEl.innerText = `${result} zł`;
        } catch (error) {
            console.error('[FinanceView] Interest calculation error:', error);
        }
    }

    /**
     * Calculate execution costs
     */
    calculateCosts() {
        try {
            const amount = document.getElementById('costsAmount')?.value || 0;
            
            const result = FinanceStore.calculateExecutionCosts(amount);
            
            const resultEl = document.getElementById('costsResult');
            if (resultEl) resultEl.innerText = `${result} zł`;
        } catch (error) {
            console.error('[FinanceView] Costs calculation error:', error);
        }
    }

    /**
     * Get form data
     */
    getFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return {};

        const formData = {};
        const inputs = form.querySelectorAll('input, select, textarea');

        inputs.forEach(input => {
            const value = input.value.trim();
            
            if (input.type === 'number') {
                formData[input.name] = value ? parseFloat(value) : 0;
            } else if (input.type === 'checkbox') {
                formData[input.name] = input.checked;
            } else {
                formData[input.name] = value;
            }
        });

        return formData;
    }

    /**
     * Display calculation result
     */
    displayResult(containerId, result) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (typeof result === 'object') {
            let html = '<div class="space-y-3">';
            
            Object.entries(result).forEach(([key, value]) => {
                const label = this.formatLabel(key);
                const formattedValue = this.formatValue(value, key);
                
                html += `
                    <div class="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <span class="text-sm font-medium text-slate-700 dark:text-slate-300">${label}</span>
                        <span class="text-sm font-bold text-slate-900 dark:text-white">${formattedValue}</span>
                    </div>
                `;
            });
            
            html += '</div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = `
                <div class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div class="text-lg font-bold text-green-800 dark:text-green-300">
                        ${this.formatValue(result, 'amount')}
                    </div>
                </div>
            `;
        }
    }

    /**
     * Display error
     */
    displayError(containerId, message) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div class="text-sm text-red-800 dark:text-red-300">
                    <i data-lucide="alert-circle" class="w-4 h-4 inline mr-2"></i>
                    ${message}
                </div>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Format label
     */
    formatLabel(key) {
        const labels = {
            balance: 'Saldo',
            totalIncome: 'Suma przychodów',
            totalExpenses: 'Suma wydatków',
            kpa: 'KPA',
            baseAmount: 'Kwota bazowa',
            percentage: 'Procent',
            marketValue: 'Wartość rynkowa',
            forcedSaleValue: 'Wartość sprzedaży przymusowej',
            executionValue: 'Wartość egzekucyjna',
            principal: 'Kapitał',
            interestAmount: 'Kwota odsetek',
            totalAmount: 'Suma',
            baseCosts: 'Koszty podstawowe',
            additionalCosts: 'Koszty dodatkowe',
            totalCosts: 'Koszty całkowite'
        };

        return labels[key] || key;
    }

    /**
     * Format value
     */
    formatValue(value, type) {
        if (typeof value === 'number') {
            if (type.includes('percentage')) {
                return `${value.toFixed(2)}%`;
            }
            return `${value.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PLN`;
        }
        
        if (typeof value === 'boolean') {
            return value ? 'Tak' : 'Nie';
        }
        
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value, null, 2);
        }
        
        return value || '-';
    }

    /**
     * Reset calculator
     */
    resetCalculator(calculatorName) {
        const form = document.getElementById(`${calculatorName}Form`);
        if (form) {
            form.reset();
            
            // Trigger calculation
            switch (calculatorName) {
                case 'balance':
                    this.calculateBalance();
                    break;
                case 'kpa':
                    this.calculateKPA();
                    break;
                case 'valuation':
                    this.calculateValuation();
                    break;
                case 'interest':
                    this.calculateInterest();
                    break;
                case 'costs':
                    this.calculateCosts();
                    break;
            }
        }
    }

    /**
     * Save calculation to history
     */
    async saveCalculation(calculatorName, data, result) {
        try {
            const calculation = {
                id: Date.now().toString(),
                type: calculatorName,
                data,
                result,
                date: new Date().toISOString()
            };

            // Save to localStorage for now (could be moved to store)
            const history = JSON.parse(localStorage.getItem('financeCalculations') || '[]');
            history.unshift(calculation);
            
            // Keep only last 50 calculations
            if (history.length > 50) {
                history.splice(50);
            }
            
            localStorage.setItem('financeCalculations', JSON.stringify(history));

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Obliczenie zapisane w historii'
            });
        } catch (error) {
            console.error('[FinanceView] Save calculation error:', error);
        }
    }

    /**
     * Load calculation history
     */
    loadCalculationHistory() {
        try {
            const history = JSON.parse(localStorage.getItem('financeCalculations') || '[]');
            return history;
        } catch (error) {
            console.error('[FinanceView] Load history error:', error);
            return [];
        }
    }

    /**
     * Export calculations
     */
    exportCalculations() {
        try {
            const history = this.loadCalculationHistory();
            
            if (history.length === 0) {
                store.commit('ADD_NOTIFICATION', {
                    type: 'warning',
                    message: 'Brak obliczeń do eksportu'
                });
                return;
            }

            const dataStr = JSON.stringify(history, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `finance_calculations_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            store.commit('ADD_NOTIFICATION', {
                type: 'success',
                message: 'Obliczenia wyeksportowane'
            });
        } catch (error) {
            console.error('[FinanceView] Export error:', error);
            store.commit('ADD_NOTIFICATION', {
                type: 'error',
                message: 'Błąd eksportu obliczeń'
            });
        }
    }

    /**
     * Get active calculator
     */
    getActiveCalculator() {
        return this.activeTab;
    }

    /**
     * Set calculator theme
     */
    setTheme(theme) {
        // Could be used to apply different themes to calculators
        if (this.container) {
            this.container.className = `finance-container theme-${theme}`;
        }
    }
}

// Create and export singleton instance
const financeView = new FinanceView();

export default financeView;