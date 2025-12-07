/**
 * Date Utilities - ES6 Module
 * Operacje na datach, święta, dni robocze
 */

/**
 * Polskie święta (stałe i ruchome)
 * @param {number} year - Rok
 * @returns {string[]} - Tablica dat w formacie YYYY-MM-DD
 */
export function getPolishHolidays(year) {
    const holidays = [
        `${year}-01-01`, // Nowy Rok
        `${year}-01-06`, // Trzech Króli
        `${year}-05-01`, // Święto Pracy
        `${year}-05-03`, // Święto Konstytucji 3 Maja
        `${year}-08-15`, // Wniebowzięcie NMP
        `${year}-11-01`, // Wszystkich Świętych
        `${year}-11-11`, // Niepodległości
        `${year}-12-25`, // Boże Narodzenie
        `${year}-12-26`  // Drugi dzień Bożego Narodzenia
    ];

    // Wielkanoc (algorytm Gaussa)
    const easter = calculateEaster(year);
    const easterStr = formatDate(easter);
    
    // Poniedziałek Wielkanocny
    const easterMonday = new Date(easter);
    easterMonday.setDate(easterMonday.getDate() + 1);
    
    // Boże Ciało (60 dni po Wielkanocy)
    const corpusChristi = new Date(easter);
    corpusChristi.setDate(corpusChristi.getDate() + 60);

    holidays.push(easterStr);
    holidays.push(formatDate(easterMonday));
    holidays.push(formatDate(corpusChristi));

    return holidays.sort();
}

/**
 * Oblicz datę Wielkanocy (algorytm Gaussa)
 * @param {number} year - Rok
 * @returns {Date} - Data Wielkanocy
 */
export function calculateEaster(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
}

/**
 * Sprawdź czy data jest świętem
 * @param {Date|string} date - Data do sprawdzenia
 * @returns {boolean} - true jeśli święto
 */
export function isHoliday(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const year = dateObj.getFullYear();
    const dateStr = formatDate(dateObj);
    
    const holidays = getPolishHolidays(year);
    return holidays.includes(dateStr);
}

/**
 * Sprawdź czy data jest weekendem
 * @param {Date|string} date - Data do sprawdzenia
 * @returns {boolean} - true jeśli weekend
 */
export function isWeekend(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const day = dateObj.getDay();
    return day === 0 || day === 6; // Niedziela lub sobota
}

/**
 * Sprawdź czy data jest dniem roboczym
 * @param {Date|string} date - Data do sprawdzenia
 * @returns {boolean} - true jeśli dzień roboczy
 */
export function isBusinessDay(date) {
    return !isWeekend(date) && !isHoliday(date);
}

/**
 * Znajdź następny dzień roboczy
 * @param {Date|string} date - Data startowa
 * @returns {Date} - Następny dzień roboczy
 */
export function getNextBusinessDay(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    
    do {
        dateObj.setDate(dateObj.getDate() + 1);
    } while (!isBusinessDay(dateObj));
    
    return dateObj;
}

/**
 * Dodaj dni robocze do daty
 * @param {Date|string} date - Data startowa
 * @param {number} days - Liczba dni roboczych do dodania
 * @returns {Date} - Wynikowa data
 */
export function addBusinessDays(date, days) {
    let dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    let addedDays = 0;
    
    while (addedDays < days) {
        dateObj.setDate(dateObj.getDate() + 1);
        if (isBusinessDay(dateObj)) {
            addedDays++;
        }
    }
    
    return dateObj;
}

/**
 * Oblicz różnicę w dniach między datami
 * @param {Date|string} date1 - Pierwsza data
 * @param {Date|string} date2 - Druga data
 * @returns {number} - Różnica w dniach
 */
export function daysBetween(date1, date2) {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

/**
 * Oblicz różnicę w dniach roboczych
 * @param {Date|string} startDate - Data początkowa
 * @param {Date|string} endDate - Data końcowa
 * @returns {number} - Liczba dni roboczych
 */
export function businessDaysBetween(startDate, endDate) {
    let start = typeof startDate === 'string' ? new Date(startDate) : new Date(startDate);
    const end = typeof endDate === 'string' ? new Date(endDate) : new Date(endDate);
    
    let count = 0;
    
    while (start <= end) {
        if (isBusinessDay(start)) {
            count++;
        }
        start.setDate(start.getDate() + 1);
    }
    
    return count;
}

/**
 * Formatuj datę do YYYY-MM-DD
 * @param {Date} date - Data
 * @returns {string} - Sformatowana data
 */
export function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * Formatuj datę do polskiego formatu (DD.MM.YYYY)
 * @param {Date|string} date - Data
 * @returns {string} - Sformatowana data
 */
export function formatDatePL(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pl-PL');
}

/**
 * Formatuj datę i czas do polskiego formatu
 * @param {Date|string} date - Data
 * @returns {string} - Sformatowana data i czas
 */
export function formatDateTimePL(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('pl-PL');
}

/**
 * Parsuj datę z różnych formatów
 * @param {string} dateStr - String z datą
 * @returns {Date|null} - Obiekt Date lub null
 */
export function parseDate(dateStr) {
    if (!dateStr) return null;
    
    // Spróbuj różne formaty
    const formats = [
        /^(\d{4})-(\d{2})-(\d{2})$/,        // YYYY-MM-DD
        /^(\d{2})\.(\d{2})\.(\d{4})$/,      // DD.MM.YYYY
        /^(\d{2})\/(\d{2})\/(\d{4})$/,      // DD/MM/YYYY
        /^(\d{2})-(\d{2})-(\d{4})$/         // DD-MM-YYYY
    ];
    
    for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
            if (format === formats[0]) {
                // YYYY-MM-DD
                return new Date(match[1], match[2] - 1, match[3]);
            } else {
                // DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
                return new Date(match[3], match[2] - 1, match[1]);
            }
        }
    }
    
    // Fallback - spróbuj Date.parse
    const date = new Date(dateStr);
    return isNaN(date) ? null : date;
}

/**
 * Pobierz początek dnia (00:00:00)
 * @param {Date|string} date - Data
 * @returns {Date} - Data z czasem 00:00:00
 */
export function startOfDay(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    return dateObj;
}

/**
 * Pobierz koniec dnia (23:59:59)
 * @param {Date|string} date - Data
 * @returns {Date} - Data z czasem 23:59:59
 */
export function endOfDay(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    dateObj.setHours(23, 59, 59, 999);
    return dateObj;
}

/**
 * Sprawdź czy data jest dzisiaj
 * @param {Date|string} date - Data
 * @returns {boolean} - true jeśli dzisiaj
 */
export function isToday(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    
    return dateObj.getDate() === today.getDate() &&
           dateObj.getMonth() === today.getMonth() &&
           dateObj.getFullYear() === today.getFullYear();
}

/**
 * Sprawdź czy data jest w przeszłości
 * @param {Date|string} date - Data
 * @returns {boolean} - true jeśli przeszłość
 */
export function isPast(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj < new Date();
}

/**
 * Sprawdź czy data jest w przyszłości
 * @param {Date|string} date - Data
 * @returns {boolean} - true jeśli przyszłość
 */
export function isFuture(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj > new Date();
}

/**
 * Relatywny opis daty (np. "za 3 dni", "wczoraj")
 * @param {Date|string} date - Data
 * @returns {string} - Opis relatywny
 */
export function relativeDate(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = startOfDay(new Date());
    const targetDate = startOfDay(dateObj);
    
    const diffDays = Math.round((targetDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Dzisiaj';
    if (diffDays === 1) return 'Jutro';
    if (diffDays === -1) return 'Wczoraj';
    if (diffDays > 1 && diffDays <= 7) return `Za ${diffDays} dni`;
    if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} dni temu`;
    if (diffDays > 7) return formatDatePL(dateObj);
    if (diffDays < -7) return formatDatePL(dateObj);
    
    return formatDatePL(dateObj);
}

// Export wszystkich funkcji jako default object
export default {
    getPolishHolidays,
    calculateEaster,
    isHoliday,
    isWeekend,
    isBusinessDay,
    getNextBusinessDay,
    addBusinessDays,
    daysBetween,
    businessDaysBetween,
    formatDate,
    formatDatePL,
    formatDateTimePL,
    parseDate,
    startOfDay,
    endOfDay,
    isToday,
    isPast,
    isFuture,
    relativeDate
};
