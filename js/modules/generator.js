// --- GENERATOR MODULE ---

function switchLibraryTab(t) {
    state.libraryTab = t;
    document.getElementById('lib-tab-templates').className = t === 'templates' ? 'flex-1 py-3 tab-item tab-active' : 'flex-1 py-3 tab-item tab-inactive';
    document.getElementById('lib-tab-drafts').className = t === 'drafts' ? 'flex-1 py-3 tab-item tab-active' : 'flex-1 py-3 tab-item tab-inactive';
    document.getElementById('templateActions').classList.toggle('hidden', t !== 'templates');
    document.getElementById('draftActions').classList.toggle('hidden', t !== 'drafts');
    loadLibrary();
}

async function loadLibrary() {
    const list = document.getElementById('libraryContainer'); if(!list) return; list.innerHTML = '';
    const items = await state.db.getAll(state.libraryTab);
    if(items.length===0) { list.innerHTML='<p class="text-slate-400 text-center mt-4 text-[10px]">Pusto</p>'; return; }
    items.forEach(i => {
        const div = document.createElement('div'); div.className = "p-2 hover:bg-red-50 cursor-pointer flex justify-between border-b rounded";
        const name = state.libraryTab === 'drafts' ? `${i.draftName} (${i.templateName})` : i.name;
        div.innerHTML = `<span onclick="${state.libraryTab==='templates' ? `loadTemplate('${i.name}')` : `loadDraft(${i.id})`}" class="truncate text-xs font-bold text-slate-700 w-full">${name}</span> <i onclick="delItem('${state.libraryTab}', '${state.libraryTab==='templates'?i.name:i.id}')" data-lucide="trash-2" class="w-3 h-3 text-slate-300 hover:text-red-500"></i>`;
        list.appendChild(div);
    });
    lucide.createIcons();
}

async function saveTemplateToDB() { if(state.docContent) { await state.db.put('templates', {name:state.currentFileName, blob:new Blob([state.docContent])}); alert("Zapisano"); loadLibrary(); } }

async function saveDraft() {
    if(!state.docContent) return; const n = prompt("Nazwa:"); if(!n) return;
    const v = {}; state.detectedVariables.forEach(x => { const e=document.getElementById(`var_${x}`); if(e) v[x]=e.value; });
    await state.db.put('drafts', {draftName:n, templateName:state.currentFileName, blob:new Blob([state.docContent]), values:v}); alert("Zapisano"); switchLibraryTab('drafts');
}

async function loadTemplate(n) { const t=await state.db.get('templates',n); if(t) procFile(t.blob, t.name); document.getElementById('draftActions').classList.remove('hidden'); }

async function loadDraft(id) {
    const d=await state.db.get('drafts',id); if(d) { procFile(d.blob, d.templateName); setTimeout(()=>{ for(const[k,v] of Object.entries(d.values)){ const e=document.getElementById(`var_${k}`); if(e) e.value=v; } },200); document.getElementById('draftActions').classList.remove('hidden'); }
}

async function delItem(s,k) { if(confirm("Usunąć?")) { await state.db.delete(s, s==='drafts'?parseInt(k):k); loadLibrary(); } }

function handleFileSelect(e) { const f=e.target.files[0]; if(f) { const r=new FileReader(); r.onload=(ev)=>procFile(ev.target.result, f.name); r.readAsBinaryString(f); } }

function procFile(c,n) {
    state.docContent = c; state.currentFileName = n.replace('.docx',''); 
    const fnEl = document.getElementById('fileName'); if(fnEl) fnEl.textContent = n;
    if(state.libraryTab==='templates') { document.getElementById('templateActions').classList.remove('hidden'); document.getElementById('draftActions').classList.remove('hidden'); }
    try {
        const zip = new PizZip(c); 
        const Docxtemplater = window.Docxtemplater || window.docxtemplater;
        const doc = new Docxtemplater(zip, { delimiters: { start: '[', end: ']' } });
        const txt = doc.getFullText(); const reg = /\[([a-zA-Z0-9_ĄŚŻŹĆŃŁÓĘąśżźćńłóę\s\.\-\/]+)\]/g;
        let m, matches=[]; while((m=reg.exec(txt))!==null) if(m[1].length>0) matches.push(m[1]);
        state.detectedVariables = [...new Set(matches)]; renderForm(state.detectedVariables);
    } catch(e) { alert("Błąd: "+e.message); }
}

function renderForm(vars) {
    const c = document.getElementById('formContainer'); c.innerHTML = '';
    vars.filter(v=>!v.toLowerCase().includes('_reszta')).forEach(v => {
        const div = document.createElement('div'); div.className = "relative mb-3 group";
        const lbl = document.createElement('label'); lbl.className = "block text-[10px] font-bold text-slate-500 uppercase mb-1"; lbl.innerText = v.replace(/_/g,' ');
        let inp; const vl = v.toLowerCase();
        if(vl.includes('adresat_nazwa')) { inp=document.createElement('textarea'); inp.rows=3; lbl.innerText="ADRESAT"; }
        else if(vl.includes('data')) { inp=document.createElement('input'); inp.type='date'; inp.value=new Date().toISOString().split('T')[0]; }
        else { inp=document.createElement('input'); inp.type='text'; }
        inp.id=`var_${v}`; inp.className="w-full border border-slate-300 rounded p-2 text-sm focus:border-red-500 outline-none shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white";
        div.appendChild(lbl); div.appendChild(inp);
        if(vl.includes('adresat_nazwa')) addBtn(div, 'addresses', v);
        if(vl.includes('podpis')) addBtn(div, 'signatures', v);
        c.appendChild(div);
    });
    lucide.createIcons();
}

function addBtn(p,t,v) {
    const b = document.createElement('button'); b.className = "absolute right-2 top-6 text-slate-400 hover:text-red-600 p-1";
    b.innerHTML = `<i data-lucide="${t==='addresses'?'book-user':'pen-tool'}" width="16"></i>`;
    b.onclick = (e) => openPicker(e,t,v); p.appendChild(b);
}

function clearFormValues() { if(confirm("Wyczyścić?")) document.querySelectorAll('#formContainer input, #formContainer textarea').forEach(e=>{if(e.type!=='date')e.value=''}); }

// --- DICTIONARIES ---
function switchTab(t) { state.activeTab=t; document.getElementById('tab-addresses').className=t==='addresses'?'flex-1 py-2 tab-active':'flex-1 py-2 tab-inactive'; document.getElementById('tab-signatures').className=t==='signatures'?'flex-1 py-2 tab-active':'flex-1 py-2 tab-inactive'; renderDictList(); }

function getDict(t) { return JSON.parse(localStorage.getItem(`lex_${t}`)||'[]'); }

function renderDictList() {
    const l = document.getElementById('dictListContainer'); if(!l) return; 
    const d = getDict(state.activeTab); l.innerHTML='';
    if(d.length===0) { l.innerHTML='<p class="text-slate-400 text-center mt-4 text-[10px]">Pusto</p>'; return; }
    d.forEach((i,idx)=>{
        const div=document.createElement('div'); div.className="p-2 border-b hover:bg-red-50 flex justify-between group dark:border-slate-700";
        div.innerHTML=`<div class="truncate w-32 text-xs font-bold dark:text-slate-200">${i.key}</div><button onclick="rmDict(${idx})" class="opacity-0 group-hover:opacity-100 text-red-400"><i data-lucide="x" size="12"></i></button>`;
        l.appendChild(div);
    }); lucide.createIcons();
}

function toggleAddForm() { document.getElementById('addDictForm').classList.toggle('hidden'); }

function saveDictItemFromPanel() {
    const k=document.getElementById('newDictKey').value, v=document.getElementById('newDictValue').value;
    if(k&&v) { const d=getDict(state.activeTab); d.push({key:k,val:v}); localStorage.setItem(`lex_${state.activeTab}`, JSON.stringify(d)); toggleAddForm(); renderDictList(); }
}

function rmDict(i) { if(confirm("Usunąć?")) { const d=getDict(state.activeTab); d.splice(i,1); localStorage.setItem(`lex_${state.activeTab}`, JSON.stringify(d)); renderDictList(); } }

function openPicker(e,t,v) {
    const d=getDict(t); if(d.length===0) return alert("Baza pusta");
    const p=document.getElementById('picker'); p.innerHTML='';
    d.forEach(i => {
        const div=document.createElement('div'); div.className="p-2 border-b hover:bg-red-50 cursor-pointer text-xs dark:border-slate-700 dark:hover:bg-slate-700";
        div.innerHTML=`<b class="dark:text-white">${i.key}</b><br><span class="dark:text-slate-400">${i.val.substring(0,30)}...</span>`;
        div.onclick=()=>{document.getElementById(`var_${v}`).value=i.val; p.classList.add('hidden');};
        p.appendChild(div);
    });
    const r=e.target.getBoundingClientRect(); p.style.top=(window.scrollY+r.bottom)+'px'; p.style.left=(window.scrollX+r.left-250)+'px'; p.classList.remove('hidden');
    setTimeout(()=>document.addEventListener('click', clP),100);
}

function clP(e) { const p=document.getElementById('picker'); if(!p.contains(e.target)) { p.classList.add('hidden'); document.removeEventListener('click',clP); } }

// --- OUTPUT ---
const mo = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
function getFD() {
    const d={}; state.detectedVariables.forEach(v=>{
        if(v.toLowerCase().includes('_reszta')) return;
        const e=document.getElementById(`var_${v}`); let val=e?e.value:'';
        if(e && e.type==='date') {
            const dt=new Date(val);
            if(v.toLowerCase().includes('pisania')||v.toLowerCase().includes('miejscowość')) val=`${dt.getDate()} ${mo[dt.getMonth()]} ${dt.getFullYear()}`;
            else val=`${String(dt.getDate()).padStart(2,'0')}.${String(dt.getMonth()+1).padStart(2,'0')}.${dt.getFullYear()} r.`;
        }
        if(v.toLowerCase().includes('adresat_nazwa')) {
            const l=val.split('\n'); d[v]=l[0]||'';
            const r=state.detectedVariables.find(k=>k.toLowerCase().includes('adresat_reszta')); if(r) d[r]=l.slice(1).join('\n');
        } else d[v]=val;
    }); return d;
}

function generateDOCX() { if(state.docContent) { try { const z=new PizZip(state.docContent); const Docxtemplater = window.Docxtemplater || window.docxtemplater; const d=new Docxtemplater(z,{paragraphLoop:true,linebreaks:true,delimiters:{start:'[',end:']'}}); d.render(getFD()); saveAs(d.getZip().generate({type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}), `${state.currentFileName}_Gotowe.docx`); } catch(e){alert(e.message);} } }

function generatePreview() { if(state.docContent) { const c=document.getElementById('previewContainer'); c.innerHTML='Generuję...'; setTimeout(()=>{ try { const z=new PizZip(state.docContent); const Docxtemplater = window.Docxtemplater || window.docxtemplater; const d=new Docxtemplater(z,{paragraphLoop:true,linebreaks:true,delimiters:{start:'[',end:']'}}); d.render(getFD()); docx.renderAsync(d.getZip().generate({type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}), c).then(()=>{document.getElementById('printBtn').classList.remove('hidden');}).catch(e=>c.innerHTML='Błąd podglądu'); } catch(e){c.innerHTML='Błąd danych';} },100); } }

function printPreview() { const c=document.getElementById('previewContainer').innerHTML; const w=window.open('','','height=800,width=1000'); w.document.write('<html><body>'+c+'</body></html>'); w.document.close(); setTimeout(()=>w.print(),1000); }
