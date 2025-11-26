// --- UTILS ---

// POLISH HOLIDAYS (Dynamic)
function getPolishHolidays(year) {
    const holidays = [
        '01-01', // New Year
        '01-06', // Epiphany
        '05-01', // Labor Day
        '05-03', // Constitution Day
        '08-15', // Army Day
        '11-01', // All Saints
        '11-11', // Independence Day
        '12-25', // Xmas 1
        '12-26'  // Xmas 2
    ];

    // Easter Calculation (Meeus/Jones/Butcher's algorithm)
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

    const pad = (n) => String(n).padStart(2,'0');
    const easterStr = `${pad(month)}-${pad(day)}`;
    
    // Easter Monday is +1 day
    const easterDate = new Date(year, month - 1, day);
    easterDate.setDate(easterDate.getDate() + 1);
    const easterMondayStr = `${pad(easterDate.getMonth()+1)}-${pad(easterDate.getDate())}`;

    // Corpus Christi is +60 days from Easter
    const corpusDate = new Date(year, month - 1, day);
    corpusDate.setDate(corpusDate.getDate() + 60);
    const corpusStr = `${pad(corpusDate.getMonth()+1)}-${pad(corpusDate.getDate())}`;

    holidays.push(easterStr, easterMondayStr, corpusStr);
    return holidays;
}

function downloadICS(summary, date, description) {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EgzeBiurko//EN
BEGIN:VEVENT
UID:${Date.now()}@egzebiurko.pl
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART;VALUE=DATE:${date.replace(/-/g, '')}
SUMMARY:${summary}
DESCRIPTION:${description}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    saveAs(blob, `termin_${date}.ics`);
}

// --- CAR VALUATION ---
function calculateAverageCarValue(prices, isDamaged) {
    let sum = 0;
    let count = 0;
    prices.forEach(p => {
        const price = parseFloat(p);
        if (price > 0) {
            sum += price;
            count++;
        }
    });

    if (count === 0) return 0;

    let avg = sum / count;
    if (isDamaged) {
        avg *= 0.8; // -20%
    }
    return avg;
}

// Make global
window.getPolishHolidays = getPolishHolidays;
window.downloadICS = downloadICS;
window.calculateAverageCarValue = calculateAverageCarValue;
