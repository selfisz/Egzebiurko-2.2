/**
 * Finance Store - Kalkulatory finansowe
 */

import store from '../../store/index.js';
import { addBusinessDays, isHoliday, isWeekend } from '../../utils/dates.js';

// Finance nie potrzebuje state w store - to są tylko kalkulatory
// Ale dodajemy helper functions

/**
 * Kalkulator salda
 */
export function calculateBalance(oldMain, oldInterest, newMain) {
    const om = parseFloat(oldMain) || 0;
    const oi = parseFloat(oldInterest) || 0;
    const nm = parseFloat(newMain) || 0;
    
    const sum = om + oi;
    
    let newInterest = 0;
    if (om !== 0) {
        newInterest = (oi * nm) / om;
    }
    
    const diff = oi - newInterest;
    
    return {
        sum: sum.toFixed(2),
        newInterest: newInterest.toFixed(2),
        diff: (om !== 0 && nm !== 0) ? diff.toFixed(2) : null
    };
}

/**
 * Kalkulator KPA (Koszty Postępowania Administracyjnego)
 * Dodaje 14 dni roboczych do daty
 */
export function calculateKPA(inputDate) {
    if (!inputDate) return null;
    
    let date = new Date(inputDate);
    date.setDate(date.getDate() + 14);
    
    const originalDate = new Date(date);
    
    // Przesuń na dzień roboczy
    while (isWeekend(date) || isHoliday(date)) {
        date.setDate(date.getDate() + 1);
    }
    
    const wasAdjusted = date.getTime() !== originalDate.getTime();
    
    return {
        date: date.toISOString().slice(0, 10),
        wasAdjusted,
        note: wasAdjusted ? "(Przesunięto na dzień roboczy)" : ""
    };
}

/**
 * Kalkulator wyceny pojazdu
 * Średnia z 3 wycen, z redukcją dla uszkodzonych
 */
export function calculateCarValuation(price1, price2, price3, isDamaged = false) {
    const p1 = parseFloat(price1) || 0;
    const p2 = parseFloat(price2) || 0;
    const p3 = parseFloat(price3) || 0;
    
    let avg = (p1 + p2 + p3) / 3;
    
    // Redukcja dla uszkodzonych (np. 20%)
    if (isDamaged) {
        avg = avg * 0.8;
    }
    
    return avg.toFixed(2);
}

/**
 * Kalkulator odsetek
 */
export function calculateInterest(principal, rate, days) {
    const p = parseFloat(principal) || 0;
    const r = parseFloat(rate) || 0;
    const d = parseInt(days) || 0;
    
    // Odsetki = Kapitał * Stopa * Dni / 365
    const interest = (p * r * d) / 36500; // rate jest w procentach
    
    return interest.toFixed(2);
}

/**
 * Kalkulator kosztów egzekucyjnych
 */
export function calculateExecutionCosts(amount) {
    const amt = parseFloat(amount) || 0;
    
    // Przykładowa skala kosztów (dostosuj do aktualnych przepisów)
    let costs = 0;
    
    if (amt <= 500) {
        costs = amt * 0.15; // 15%
    } else if (amt <= 1500) {
        costs = 75 + (amt - 500) * 0.10; // 75 + 10%
    } else if (amt <= 5000) {
        costs = 175 + (amt - 1500) * 0.075; // 175 + 7.5%
    } else {
        costs = 437.50 + (amt - 5000) * 0.05; // 437.50 + 5%
    }
    
    return costs.toFixed(2);
}

// Export wszystkich kalkulatorów
export default {
    calculateBalance,
    calculateKPA,
    calculateCarValuation,
    calculateInterest,
    calculateExecutionCosts
};
