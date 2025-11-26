// --- FINANCE ---

function calculateBalance() {
    const om = parseFloat(document.getElementById('bOldM').value) || 0;
    const oi = parseFloat(document.getElementById('bOldI').value) || 0;
    const nm = parseFloat(document.getElementById('bNewM').value) || 0;
    
    document.getElementById('bSum').innerText = (om + oi).toFixed(2);
    
    let ni = 0;
    if(om !== 0) {
        ni = (oi * nm) / om;
    }
    
    document.getElementById('bNewI').innerText = ni.toFixed(2);
    
    const diff = oi - ni;
    if(om !== 0 && nm !== 0) {
        document.getElementById('bDiff').innerText = "Różnica: " + diff.toFixed(2);
    } else {
         document.getElementById('bDiff').innerText = "";
    }
}

function calcKPA() {
    const inputDate = document.getElementById('awizoDate').value;
    if(!inputDate) return;
    
    let d = new Date(inputDate);
    // Add 14 days
    d.setDate(d.getDate() + 14);
    
    const originalDate = new Date(d);
    
    const checkHoliday = (dateObj) => {
        const year = dateObj.getFullYear();
        const mmdd = dateObj.toISOString().slice(5, 10);

        if(typeof getPolishHolidays === 'function') {
             const h = getPolishHolidays(year);
             if(h.includes(mmdd)) return true;
        }
        return false;
    };

    while(true) {
        const day = d.getDay();
        const isWeekend = (day === 0 || day === 6); // Sun or Sat
        const isHoliday = checkHoliday(d);
        
        if(!isWeekend && !isHoliday) break;
        d.setDate(d.getDate() + 1);
    }
    
    const nextBusinessDay = d.toISOString().slice(0, 10);
    
    document.getElementById('kpaResult').innerText = nextBusinessDay;
    document.getElementById('kpaNote').innerText = d.getTime() !== originalDate.getTime() ? "(Przesunięto na dzień roboczy)" : "";
}

function calcFinanceCarValuation() {
    const p1 = document.getElementById('fcP1').value;
    const p2 = document.getElementById('fcP2').value;
    const p3 = document.getElementById('fcP3').value;
    const isDamaged = document.getElementById('fcBad').checked;

    const avg = calculateAverageCarValue([p1, p2, p3], isDamaged);

    document.getElementById('fcResult').innerText = avg.toFixed(2) + " zł";
}
