// --- MODULE: REGISTRY ---
async function loadBailiffs() {
    if (state.db) state.bailiffs = await state.db.getAll('bailiffs');
}

function searchBailiff(q) {
    const t = document.getElementById('bailiffTable');
    t.innerHTML = '';
    const res = state.bailiffs.filter(b => JSON.stringify(b).toLowerCase().includes(q.toLowerCase())).slice(0, 50);
    document.getElementById('bailiffTotal').innerText = state.bailiffs.length;
    res.forEach(b => {
        const r = document.createElement('tr');
        r.className = "border-b hover:bg-amber-50 dark:hover:bg-slate-700 dark:border-slate-700";
        const v = Object.values(b).slice(0, 4).join(" | ");
        r.innerHTML = `<td class="p-2">${v}</td>`;
        t.appendChild(r);
    });
}

function handleBailiffImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {
                type: 'array'
            });
            const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
                header: 1
            });
            const bailiffsToSave = [];
            for (let i = 1; i < json.length; i++) {
                const row = json[i];
                if (row && row.length > 0) {
                    bailiffsToSave.push({
                        name: row[0] || "",
                        nip: row[1] || "",
                        address: row[2] || "",
                        epu: row[3] || ""
                    });
                }
            }
            if (bailiffsToSave.length > 0) {
                const tx = state.db.transaction('bailiffs', 'readwrite');
                await tx.objectStore('bailiffs').clear();
                for (const b of bailiffsToSave) {
                    await tx.objectStore('bailiffs').add(b);
                }
                await tx.done;
                loadBailiffs();
                alert(`Zaimportowano ${bailiffsToSave.length} komorników.`);
            }
        } catch (err) {
            alert("Błąd importu: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}
