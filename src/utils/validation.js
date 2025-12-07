/**
 * Validation Utilities - ES6 Module
 * Walidacja NIP, PESEL, email, phone, etc.
 */

/**
 * Walidacja NIP (Numer Identyfikacji Podatkowej)
 * @param {string} nip - NIP do walidacji
 * @returns {boolean} - true jeśli poprawny
 */
export function validateNIP(nip) {
    if (!nip) return false;
    
    // Usuń spacje, myślniki
    const cleaned = nip.replace(/[\s-]/g, '');
    
    // Sprawdź długość
    if (!/^\d{10}$/.test(cleaned)) return false;
    
    // Algorytm walidacji NIP
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    let sum = 0;
    
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleaned[i]) * weights[i];
    }
    
    const checksum = sum % 11;
    const lastDigit = parseInt(cleaned[9]);
    
    return checksum === lastDigit;
}

/**
 * Walidacja PESEL
 * @param {string} pesel - PESEL do walidacji
 * @returns {boolean} - true jeśli poprawny
 */
export function validatePESEL(pesel) {
    if (!pesel) return false;
    
    // Usuń spacje, myślniki
    const cleaned = pesel.replace(/[\s-]/g, '');
    
    // Sprawdź długość
    if (!/^\d{11}$/.test(cleaned)) return false;
    
    // Algorytm walidacji PESEL
    const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
    let sum = 0;
    
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleaned[i]) * weights[i];
    }
    
    const control = (10 - (sum % 10)) % 10;
    const lastDigit = parseInt(cleaned[10]);
    
    return control === lastDigit;
}

/**
 * Walidacja email
 * @param {string} email - Email do walidacji
 * @returns {boolean} - true jeśli poprawny
 */
export function validateEmail(email) {
    if (!email) return false;
    
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Walidacja numeru telefonu (polski format)
 * @param {string} phone - Numer telefonu
 * @returns {boolean} - true jeśli poprawny
 */
export function validatePhone(phone) {
    if (!phone) return false;
    
    // Usuń spacje, myślniki, nawiasy
    const cleaned = phone.replace(/[\s\-()]/g, '');
    
    // Polski numer: 9 cyfr lub +48 + 9 cyfr
    return /^(\+48)?[0-9]{9}$/.test(cleaned);
}

/**
 * Walidacja kodu pocztowego (polski format)
 * @param {string} postalCode - Kod pocztowy
 * @returns {boolean} - true jeśli poprawny
 */
export function validatePostalCode(postalCode) {
    if (!postalCode) return false;
    
    // Format: XX-XXX
    return /^\d{2}-\d{3}$/.test(postalCode);
}

/**
 * Walidacja VIN (Vehicle Identification Number)
 * @param {string} vin - VIN do walidacji
 * @returns {boolean} - true jeśli poprawny
 */
export function validateVIN(vin) {
    if (!vin) return false;
    
    // VIN ma 17 znaków, bez I, O, Q
    const cleaned = vin.toUpperCase().trim();
    
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleaned)) return false;
    
    // Opcjonalnie: pełna walidacja z checksum (skomplikowana)
    return true;
}

/**
 * Walidacja numeru rejestracyjnego (polski format)
 * @param {string} plates - Numer rejestracyjny
 * @returns {boolean} - true jeśli poprawny
 */
export function validatePlates(plates) {
    if (!plates) return false;
    
    const cleaned = plates.toUpperCase().replace(/[\s-]/g, '');
    
    // Różne formaty polskich tablic
    const formats = [
        /^[A-Z]{2,3}[0-9]{4,5}$/,  // Standardowe
        /^[A-Z]{2}[0-9]{5}$/,       // Nowe
        /^[A-Z]{3}[0-9]{4}$/        // Stare
    ];
    
    return formats.some(regex => regex.test(cleaned));
}

/**
 * Walidacja kwoty (liczba dodatnia)
 * @param {string|number} amount - Kwota
 * @returns {boolean} - true jeśli poprawna
 */
export function validateAmount(amount) {
    if (amount === null || amount === undefined || amount === '') return false;
    
    const num = parseFloat(amount);
    return !isNaN(num) && num >= 0;
}

/**
 * Walidacja daty (format YYYY-MM-DD)
 * @param {string} date - Data
 * @returns {boolean} - true jeśli poprawna
 */
export function validateDate(date) {
    if (!date) return false;
    
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) return false;
    
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj);
}

/**
 * Walidacja zakresu dat (deadline >= startDate)
 * @param {string} startDate - Data początkowa
 * @param {string} endDate - Data końcowa
 * @returns {boolean} - true jeśli poprawny zakres
 */
export function validateDateRange(startDate, endDate) {
    if (!validateDate(startDate) || !validateDate(endDate)) return false;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return end >= start;
}

/**
 * Formatuj NIP (dodaj myślniki)
 * @param {string} nip - NIP
 * @returns {string} - Sformatowany NIP
 */
export function formatNIP(nip) {
    const cleaned = nip.replace(/[\s-]/g, '');
    if (cleaned.length !== 10) return nip;
    
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8)}`;
}

/**
 * Formatuj PESEL (dodaj myślniki)
 * @param {string} pesel - PESEL
 * @returns {string} - Sformatowany PESEL
 */
export function formatPESEL(pesel) {
    const cleaned = pesel.replace(/[\s-]/g, '');
    if (cleaned.length !== 11) return pesel;
    
    return `${cleaned.slice(0, 6)}-${cleaned.slice(6)}`;
}

/**
 * Formatuj numer telefonu
 * @param {string} phone - Numer telefonu
 * @returns {string} - Sformatowany numer
 */
export function formatPhone(phone) {
    const cleaned = phone.replace(/[\s\-()]/g, '');
    
    if (cleaned.startsWith('+48')) {
        const number = cleaned.slice(3);
        return `+48 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
    } else if (cleaned.length === 9) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    
    return phone;
}

/**
 * Waliduj pole input i dodaj wizualne feedback
 * @param {HTMLInputElement} input - Element input
 * @param {Function} validator - Funkcja walidująca
 * @returns {boolean} - true jeśli poprawny
 */
export function validateInput(input, validator) {
    if (!input || !validator) return false;
    
    const value = input.value.trim();
    const isValid = validator(value);
    
    // Usuń poprzednie klasy
    input.classList.remove('border-red-500', 'border-green-500', 'bg-red-50', 'dark:bg-red-900/10');
    
    if (value.length === 0) {
        // Puste pole - neutralny stan
        return true;
    }
    
    if (isValid) {
        input.classList.add('border-green-500');
    } else {
        input.classList.add('border-red-500', 'bg-red-50', 'dark:bg-red-900/10');
    }
    
    return isValid;
}

/**
 * Setup auto-walidacji dla formularza
 * @param {HTMLFormElement} form - Formularz
 * @param {Object} validators - Mapa: { inputId: validatorFunction }
 */
export function setupFormValidation(form, validators) {
    if (!form || !validators) return;
    
    Object.entries(validators).forEach(([inputId, validator]) => {
        const input = form.querySelector(`#${inputId}`);
        if (!input) return;
        
        input.addEventListener('blur', () => {
            validateInput(input, validator);
        });
        
        input.addEventListener('input', () => {
            // Waliduj tylko jeśli pole było już touched
            if (input.classList.contains('border-red-500') || input.classList.contains('border-green-500')) {
                validateInput(input, validator);
            }
        });
    });
}

/**
 * Sprawdź czy cały formularz jest poprawny
 * @param {HTMLFormElement} form - Formularz
 * @param {Object} validators - Mapa: { inputId: validatorFunction }
 * @returns {boolean} - true jeśli wszystkie pola poprawne
 */
export function validateForm(form, validators) {
    if (!form || !validators) return false;
    
    let isValid = true;
    
    Object.entries(validators).forEach(([inputId, validator]) => {
        const input = form.querySelector(`#${inputId}`);
        if (!input) return;
        
        if (!validateInput(input, validator)) {
            isValid = false;
        }
    });
    
    return isValid;
}

// Export wszystkich funkcji jako default object
export default {
    validateNIP,
    validatePESEL,
    validateEmail,
    validatePhone,
    validatePostalCode,
    validateVIN,
    validatePlates,
    validateAmount,
    validateDate,
    validateDateRange,
    formatNIP,
    formatPESEL,
    formatPhone,
    validateInput,
    setupFormValidation,
    validateForm
};
