// ─── CSRF ───────────────────────────────────────────────────────
function getCookie(name) {
  const match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return match ? match.pop() : '';
}
const CSRF_TOKEN = getCookie('csrftoken');

// ─── DATA ───────────────────────────────────────────────────────
let leads = [];
let departments = [];

// ─── STATE ──────────────────────────────────────────────────────
let filteredLeads = [...leads];
let emailMode = false;
let selectedEmails = new Set();
let statusTargetId = null;
let chosenStatus = null;

// multi-select state
const msState = { uni: new Set(), src: new Set() };

const SOURCES = ['On Campus Seminar','Campus Co-ordinators','Workshop','Research Talk','Training Program'];
const SOURCE_COLORS = ['#00C4B4','#7B6FFF','#FFB547','#FF5C7A','#60C8FF'];

// ─── UTILS ──────────────────────────────────────────────────────
function initials(name){ return (name||'').split(' ').filter(Boolean).map(w=>w[0]).join('').slice(0,2).toUpperCase(); }
function getScore(s){ return s==='hot'?{label:'🔥 Hot',cls:'hot'}:s==='warm'?{label:'⚡ Warm',cls:'warm'}:{label:'❄️ Cold',cls:'cold'}; }
function showToast(msg,dur=2600){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),dur);}
function pct(n,total){ return total===0?0:Math.round(n/total*100); }
function findLead(id){ return leads.find(l=>l.id===id); }

// ─── LOAD LEADS FROM SERVER ───────────────────────────────────────
async function loadLeads(){
  const res = await fetch('/crm/api/leads/');
  const data = await res.json();
  leads = data.leads;
  filteredLeads = [...leads];
}

async function loadDepartments(){
  const res = await fetch('/crm/api/departments/');
  const data = await res.json();
  departments = data.departments;
}

// ─── ADD DEPARTMENT MODAL ────────────────────────────────────────
function openAddDepartment(){ document.getElementById('add-dept-modal').classList.add('show'); }
function closeAddDepartment(force){
  if(force===true||force.target===document.getElementById('add-dept-modal'))
    document.getElementById('add-dept-modal').classList.remove('show');
}
async function submitAddDepartment(){
  const nameInput = document.getElementById('ad-name');
  const name = nameInput.value.trim();
  if(!name){ showToast('⚠ Department name is required'); return; }
  const res = await fetch('/crm/api/departments/', {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'X-CSRFToken': CSRF_TOKEN},
    body: JSON.stringify({name}),
  });
  const data = await res.json();
  if(!res.ok){ showToast('⚠ '+(data.error||'Could not add department')); return; }
  departments.push(data.department);
  nameInput.value = '';
  closeAddDepartment(true);
  showToast('✓ Department added!');
  if(typeof buildMultiSelects === 'function' && document.getElementById('filter-dept')) buildMultiSelects();
}

// ─── DASHBOARD ──────────────────────────────────────────────────
function renderDashboard(){
  const total = leads.length;
  const hot   = leads.filter(l=>l.status==='hot').length;
  const warm  = leads.filter(l=>l.status==='warm').length;
  const cold  = leads.filter(l=>l.status==='cold').length;
  document.getElementById('sc-total').textContent = total;
  document.getElementById('sc-hot').textContent   = hot;
  document.getElementById('sc-warm').textContent  = warm;
  document.getElementById('sc-cold').textContent  = cold;
  document.getElementById('fn-hot').textContent   = hot;
  document.getElementById('fn-warm').textContent  = warm;
  document.getElementById('fn-cold').textContent  = cold;

  // Uni chart
  const uniMap = {};
  leads.forEach(l=>{ if(l.university) uniMap[l.university]=(uniMap[l.university]||0)+1; });
  const sorted = Object.entries(uniMap).sort((a,b)=>b[1]-a[1]);
  const max = sorted[0]?.[1]||1;
  document.getElementById('uni-badge').textContent = sorted.length+' universities';
  document.getElementById('uni-chart').innerHTML = sorted.slice(0,8).map(([u,c])=>`
    <div class="uni-row">
      <div class="uni-name">${u}</div>
      <div class="uni-wrap"><div class="uni-bar" style="width:${Math.round(c/max*100)}%"></div></div>
      <div class="uni-cnt">${c}</div>
    </div>`).join('');

  // Seminar coverage
  const srcSet = new Set(leads.map(l=>l.source).filter(Boolean));
  document.getElementById('sem-uni').textContent = sorted.length;
  document.getElementById('sem-src').textContent = srcSet.size;
}

// ─── MULTI-SELECT BUILD ─────────────────────────────────────────
function buildMultiSelects(){
  const unis = [...new Set(leads.map(l=>l.university).filter(Boolean))].sort();
  buildMs('ms-uni','ms-uni-drop','ms-uni-label', unis, msState.uni, 'All Universities');
  buildMs('ms-src','ms-src-drop','ms-src-label', SOURCES, msState.src, 'All Sources');

  // Dept filter — registered departments plus any legacy free-text values
  // already in use on existing leads, deduped.
  const depts = [...new Set([...departments, ...leads.map(l=>l.department).filter(Boolean)])].sort();
  const dsel = document.getElementById('filter-dept');
  const cur = dsel.value;
  dsel.innerHTML = '<option value="">All Departments</option>' + depts.map(d=>`<option value="${d}" ${d===cur?'selected':''}>${d}</option>`).join('');
}

function buildMs(wrapId, dropId, labelId, options, stateSet, placeholder){
  const drop = document.getElementById(dropId);
  drop.innerHTML = options.map(o=>`
    <div class="ms-option ${stateSet.has(o)?'selected':''}" onclick="toggleMsOption('${wrapId}','${dropId}','${labelId}',this,'${o}')">
      <div class="ms-checkbox"><span class="ms-check">✓</span></div>
      ${o}
    </div>`).join('')
    + `<div class="ms-footer">
        <button class="ms-footer-btn clear" onclick="clearMs('${wrapId}','${dropId}','${labelId}','${placeholder}')">Clear</button>
        <button class="ms-footer-btn apply" onclick="toggleMs('${wrapId}'); applyFilters()">Apply</button>
       </div>`;
}

function toggleMs(wrapId){
  document.querySelectorAll('.ms-dropdown').forEach(d=>{
    const parentWrap = d.closest('.ms-wrap');
    if(!parentWrap || parentWrap.id !== wrapId) d.classList.remove('open');
  });
  const drop = document.querySelector('#'+wrapId+' .ms-dropdown');
  drop.classList.toggle('open');
}

function toggleMsOption(wrapId, dropId, labelId, el, val){
  const stateKey = wrapId==='ms-uni'?'uni':'src';
  if(msState[stateKey].has(val)) msState[stateKey].delete(val);
  else msState[stateKey].add(val);
  el.classList.toggle('selected', msState[stateKey].has(val));
  const placeholder = wrapId==='ms-uni'?'All Universities':'All Sources';
  updateMsLabel(labelId, msState[stateKey], placeholder);
}

function updateMsLabel(labelId, stateSet, placeholder){
  const lbl = document.getElementById(labelId);
  if(stateSet.size===0) lbl.textContent=placeholder;
  else if(stateSet.size===1) lbl.textContent=[...stateSet][0];
  else lbl.textContent=stateSet.size+' selected';
}

function clearMs(wrapId, dropId, labelId, placeholder){
  const stateKey=wrapId==='ms-uni'?'uni':'src';
  msState[stateKey].clear();
  document.querySelectorAll('#'+dropId+' .ms-option').forEach(o=>o.classList.remove('selected'));
  document.getElementById(labelId).textContent=placeholder;
}

document.addEventListener('click', e=>{
  if(!e.target.closest('.ms-wrap')) document.querySelectorAll('.ms-dropdown').forEach(d=>d.classList.remove('open'));
});

// ─── FILTER & RENDER LEADS ──────────────────────────────────────
function applyFilters(){
  const q    = document.getElementById('search-input').value.toLowerCase();
  const stat = document.getElementById('filter-status').value;
  const dept = document.getElementById('filter-dept').value;
  filteredLeads = leads.filter(l=>{
    const matchQ   = !q || (l.name||'').toLowerCase().includes(q)||(l.email||'').toLowerCase().includes(q)||(l.phone||'').includes(q);
    const matchSt  = !stat || l.status===stat;
    const matchDep = !dept || l.department===dept;
    const matchUni = msState.uni.size===0 || msState.uni.has(l.university);
    const matchSrc = msState.src.size===0 || msState.src.has(l.source);
    return matchQ && matchSt && matchDep && matchUni && matchSrc;
  });
  renderLeads();
}

function renderLeads(){
  const tbody = document.getElementById('leads-tbody');
  tbody.innerHTML = filteredLeads.map((l)=>{
    const s = getScore(l.status);
    const isChecked = selectedEmails.has(l.email);
    return `<tr class="${isChecked?'row-selected':''}" onclick="handleRowClick(event,${l.id})">
      <td style="display:flex;align-items:center;white-space:nowrap;"><span class="avatar">${initials(l.name)}</span>${l.name}</td>
      <td>
        <div class="email-cell">
          ${emailMode?`<div class="email-cb ${isChecked?'checked':''}" onclick="toggleEmail(event,'${(l.email||'').replace(/'/g,"\\'")}',this)"></div>`:''}
          <span class="email-text">${l.email||''}</span>
        </div>
      </td>
      <td style="color:var(--muted);font-size:11.5px;">${l.phone||''}</td>
      <td style="font-size:12px;">${l.university||''}</td>
      <td style="font-size:11.5px;color:var(--muted);">${l.department||''}</td>
      <td style="font-size:11.5px;">${l.year||''}</td>
      <td style="font-size:11px;color:var(--muted);">${l.source||''}</td>
      <td><span class="score-pill ${s.cls}">${s.label}</span></td>
      <td><button class="btn btn-outline btn-sm" style="font-size:10px;padding:4px 9px;" onclick="openStatusModal(event,${l.id})">Change</button></td>
    </tr>`;
  }).join('');
  document.getElementById('leads-count-label').textContent = filteredLeads.length + ' lead' + (filteredLeads.length!==1?'s':'') + ' found';
  updateEmailBar();
  updateSelAllRow();
}

function handleRowClick(e, id){
  if(e.target.closest('button')||e.target.closest('.email-cb')) return;
}

function filterByStatus(s){
  document.getElementById('filter-status').value = s;
  applyFilters();
}

// ─── EMAIL SELECTION ────────────────────────────────────────────
function toggleEmailMode(){
  emailMode = !emailMode;
  document.getElementById('email-mode-hint').textContent = emailMode ? '✓ select ON' : '☐ select';
  document.getElementById('sel-all-row').classList.toggle('show', emailMode);
  if(!emailMode){ selectedEmails.clear(); }
  renderLeads();
  updateEmailBar();
}

function toggleEmail(e, email, cb){
  e.stopPropagation();
  if(selectedEmails.has(email)) selectedEmails.delete(email);
  else selectedEmails.add(email);
  cb.classList.toggle('checked', selectedEmails.has(email));
  cb.closest('tr').classList.toggle('row-selected', selectedEmails.has(email));
  updateEmailBar();
  updateSelAllRow();
}

function toggleSelectAll(){
  const cb = document.getElementById('sel-all-cb');
  const allSel = filteredLeads.every(l=>selectedEmails.has(l.email));
  if(allSel) filteredLeads.forEach(l=>selectedEmails.delete(l.email));
  else filteredLeads.forEach(l=>selectedEmails.add(l.email));
  renderLeads();
  updateEmailBar();
}

function updateSelAllRow(){
  const row = document.getElementById('sel-all-row');
  row.classList.toggle('show', emailMode);
  const allSel = filteredLeads.length>0 && filteredLeads.every(l=>selectedEmails.has(l.email));
  document.getElementById('sel-all-cb').classList.toggle('checked', allSel);
  document.getElementById('sel-all-lbl').textContent = allSel ? `All ${filteredLeads.length} emails selected` : 'Select all emails on this page';
}

function updateEmailBar(){
  const bar = document.getElementById('email-copy-bar');
  const count = selectedEmails.size;
  if(count===0){ bar.classList.remove('show'); return; }
  bar.classList.add('show');
  document.getElementById('ecb-count').textContent = count + ' email'+(count!==1?'s':'')+' selected';
  const arr = [...selectedEmails];
  document.getElementById('ecb-preview').textContent = arr.slice(0,3).join(', ') + (arr.length>3?' ...':'');
}

function copyEmails(){
  const text = [...selectedEmails].join(', ');
  navigator.clipboard.writeText(text).then(()=>showToast('✓ '+selectedEmails.size+' emails copied!')).catch(()=>{
    const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    showToast('✓ '+selectedEmails.size+' emails copied!');
  });
}

function clearEmailSel(){ selectedEmails.clear(); renderLeads(); updateEmailBar(); }

// ─── STATUS CHANGE ───────────────────────────────────────────────
function openStatusModal(e, id){
  e.stopPropagation();
  statusTargetId = id;
  const lead = findLead(id);
  chosenStatus = lead.status;
  document.getElementById('sm-name').textContent = lead.name;
  ['hot','warm','cold'].forEach(s=>{
    document.getElementById('so-'+s).classList.toggle('selected', s===chosenStatus);
  });
  document.getElementById('status-modal').classList.add('show');
}

function pickStatus(s){
  chosenStatus = s;
  ['hot','warm','cold'].forEach(x=>document.getElementById('so-'+x).classList.toggle('selected',x===s));
}

async function applyStatus(){
  if(statusTargetId===null||chosenStatus===null) return;
  const lead = findLead(statusTargetId);
  const old = lead.status;
  const res = await fetch(`/crm/api/leads/${statusTargetId}/status/`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'X-CSRFToken': CSRF_TOKEN},
    body: JSON.stringify({status: chosenStatus}),
  });
  if(res.ok){
    lead.status = chosenStatus;
    closeStatusModal(true);
    if(old!==chosenStatus) showToast('✓ Status updated to '+chosenStatus.toUpperCase());
    applyFilters();
    renderDashboard();
  } else {
    showToast('⚠ Could not update status');
  }
}

function closeStatusModal(force){
  if(force===true||force.target===document.getElementById('status-modal'))
    document.getElementById('status-modal').classList.remove('show');
}

// ─── ADD LEAD MODAL ─────────────────────────────────────────────
function openAddLead(){ document.getElementById('add-lead-modal').classList.add('show'); }
function closeAddLead(force){
  if(force===true||force.target===document.getElementById('add-lead-modal'))
    document.getElementById('add-lead-modal').classList.remove('show');
}
async function submitAddLead(){
  const name=document.getElementById('al-name').value.trim();
  if(!name){showToast('⚠ Name is required');return;}
  const payload = {
    name, email:document.getElementById('al-email').value.trim(),
    phone:document.getElementById('al-phone').value.trim(),
    university:document.getElementById('al-uni').value.trim(),
    department:document.getElementById('al-dept').value.trim(),
    year:document.getElementById('al-year').value,
    source:document.getElementById('al-source').value,
    status:document.getElementById('al-status').value,
  };
  const res = await fetch('/crm/api/leads/', {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'X-CSRFToken': CSRF_TOKEN},
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if(!res.ok){ showToast('⚠ '+(data.error||'Could not add lead')); return; }
  leads.unshift(data.lead);
  closeAddLead(true);
  showToast('✓ Lead added!');
  renderDashboard();
  buildMultiSelects();
  applyFilters();
  ['al-name','al-email','al-phone','al-uni','al-dept'].forEach(id=>document.getElementById(id).value='');
}

// ─── UPLOAD LEADS MODAL ─────────────────────────────────────────
function openUploadModal(){ document.getElementById('upload-modal').classList.add('show'); }
function closeUploadModal(force){
  if(force===true||force.target===document.getElementById('upload-modal'))
    document.getElementById('upload-modal').classList.remove('show');
}

function triggerFileSelect(){
  document.getElementById('csv-file-input').click();
}

async function handleCsvFile(input){
  const file = input.files[0];
  if(!file) return;
  closeUploadModal(true);
  showToast('📥 Importing leads from CSV...', 1800);

  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/crm/api/leads/upload-csv/', {
    method: 'POST',
    headers: {'X-CSRFToken': CSRF_TOKEN},
    body: formData,
  });
  const data = await res.json();
  input.value = '';

  if(!res.ok){ showToast('⚠ '+(data.error||'Import failed')); return; }

  leads = data.leads.concat(leads);
  renderDashboard();
  buildMultiSelects();
  applyFilters();
  const notes = [];
  if(data.skipped) notes.push(`${data.skipped} skipped — missing name`);
  if(data.duplicates) notes.push(`${data.duplicates} duplicate${data.duplicates!==1?'s':''} skipped — same Email + Source`);
  const noteMsg = notes.length ? ` (${notes.join(', ')})` : '';
  setTimeout(()=>showToast(`✓ ${data.created} new lead${data.created!==1?'s':''} imported successfully!${noteMsg}`), 300);
}

// ─── ANALYTICS ──────────────────────────────────────────────────
function renderAnalytics(){
  const total=leads.length, hot=leads.filter(l=>l.status==='hot').length, warm=leads.filter(l=>l.status==='warm').length, cold=leads.filter(l=>l.status==='cold').length;
  const unis=new Set(leads.map(l=>l.university).filter(Boolean)).size;
  document.getElementById('ana-total').textContent=total;
  document.getElementById('ana-hot-rate').textContent=pct(hot,total)+'%';
  document.getElementById('ana-warm-rate').textContent=pct(warm,total)+'%';
  document.getElementById('ana-unis').textContent=unis;

  // Lead growth — real monthly counts from created_at, last 11 months + current
  const now = new Date();
  const months = [];
  for(let i=10;i>=0;i--){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    months.push({key: d.getFullYear()+'-'+d.getMonth(), label: d.toLocaleDateString('en-US',{month:'short'}), count:0});
  }
  leads.forEach(l=>{
    const d = new Date(l.created_at);
    const key = d.getFullYear()+'-'+d.getMonth();
    const bucket = months.find(m=>m.key===key);
    if(bucket) bucket.count++;
  });
  const maxCount = Math.max(1, ...months.map(m=>m.count));
  const wrap = document.getElementById('growth-bars');
  wrap.innerHTML = months.map((m,i)=>{
    const isLast = i===months.length-1;
    const heightPct = Math.round(m.count/maxCount*100);
    return `<div class="bar-col"><div class="bar-fill" style="height:${Math.max(heightPct,2)}%;${isLast?'border-top-color:var(--teal);background:rgba(0,196,180,.25);':''}"></div><div class="bar-lbl" ${isLast?'style="color:var(--teal);"':''}>${m.label}</div></div>`;
  }).join('');
  const thisMonth = months[months.length-1].count;
  document.getElementById('ana-this-month').textContent = thisMonth + ' leads';

  // Distribution bars
  setTimeout(()=>{
    document.getElementById('dist-hot-pct').textContent=pct(hot,total)+'%';
    document.getElementById('dist-warm-pct').textContent=pct(warm,total)+'%';
    document.getElementById('dist-cold-pct').textContent=pct(cold,total)+'%';
    document.getElementById('dist-hot-bar').style.width=pct(hot,total)+'%';
    document.getElementById('dist-warm-bar').style.width=pct(warm,total)+'%';
    document.getElementById('dist-cold-bar').style.width=pct(cold,total)+'%';
  },80);

  // Source breakdown
  const srcMap={};
  leads.forEach(l=>{ if(l.source) srcMap[l.source]=(srcMap[l.source]||0)+1; });
  const srcSorted=Object.entries(srcMap).sort((a,b)=>b[1]-a[1]);
  const srcMax=srcSorted[0]?.[1]||1;
  document.getElementById('source-list').innerHTML=srcSorted.map(([s,c],i)=>`
    <div class="src-row">
      <div class="src-dot" style="background:${SOURCE_COLORS[i%SOURCE_COLORS.length]};"></div>
      <div class="src-name">${s}</div>
      <div class="src-bar-wrap"><div class="src-bar" style="width:${Math.round(c/srcMax*100)}%; background:${SOURCE_COLORS[i%SOURCE_COLORS.length]};"></div></div>
      <div class="src-pct">${c}</div>
    </div>`).join('');

  // Top unis
  const uniMap={};
  leads.forEach(l=>{ if(l.university) uniMap[l.university]=(uniMap[l.university]||0)+1; });
  const uniSorted=Object.entries(uniMap).sort((a,b)=>b[1]-a[1]);
  const uMax=uniSorted[0]?.[1]||1;
  document.getElementById('ana-uni-chart').innerHTML=uniSorted.slice(0,6).map(([u,c])=>`
    <div class="uni-row">
      <div class="uni-name">${u}</div>
      <div class="uni-wrap"><div class="uni-bar" style="width:${Math.round(c/uMax*100)}%"></div></div>
      <div class="uni-cnt">${c}</div>
    </div>`).join('');
}

// ─── EXPORT ─────────────────────────────────────────────────────
function exportCSV(){
  const hdr='Name,Email,Phone,University,Department,Year,Source,Status';
  const rows=filteredLeads.map(l=>[l.name,l.email,l.phone,l.university,l.department,l.year,l.source,l.status].map(v=>`"${(v||'').toString().replace(/"/g,'""')}"`).join(','));
  const csv=[hdr,...rows].join('\n');
  const a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download='dob_leads_export.csv'; a.click();
  showToast('✓ CSV exported!');
}
