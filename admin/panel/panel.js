(function(){
  "use strict";
  if(!Auth.isAdmin()) return; // already redirecting via the inline guard script in index.html

  /* ---------- tabs ---------- */
  function activateTab(tab){
    document.querySelectorAll(".panel-tab").forEach(b=>b.classList.toggle("active", b.dataset.tab===tab));
    document.querySelectorAll(".panel-section").forEach(s=>s.classList.toggle("active", s.id==="tab-"+tab));
  }
  document.getElementById("panel-tabs").addEventListener("click", e=>{
    const btn = e.target.closest(".panel-tab");
    if(!btn) return;
    activateTab(btn.dataset.tab);
    history.replaceState(null,"","#"+btn.dataset.tab);
  });
  if(location.hash){ activateTab(location.hash.slice(1)); }

  document.getElementById("logout-link").addEventListener("click", e=>{
    e.preventDefault();
    Auth.logout();
    location.href = "../";
  });

  const formData2obj = form => Object.fromEntries(new FormData(form).entries());

  /* ================= EMPLOYEES ================= */
  function fillDivDeptSelects(form){
    form.division.innerHTML = DB.DIVISIONS.map(d=>`<option>${d}</option>`).join("");
    form.dept.innerHTML = DB.DEPARTMENTS.map(d=>`<option>${d}</option>`).join("");
  }
  function renderEmployees(){
    document.getElementById("employees-body").innerHTML = DB.employees().map(e=>`
      <tr data-emp-row="${e.id}">
        <td>${H.esc(e.name)}<div class="cell-sub">${H.esc(e.role)}</div></td>
        <td>${H.esc(e.division)}</td>
        <td>${H.esc(e.dept)}</td>
        <td class="mono">${H.fmtMoney(e.salary)}</td>
        <td class="row-actions">
          <button class="btn-mini" data-edit-emp="${e.id}">Edit</button>
          <button class="btn-mini danger" data-del-emp="${e.id}">Delete</button>
        </td>
      </tr>
      <tr class="inline-edit-row" data-emp-edit="${e.id}" style="display:none"><td colspan="5"></td></tr>
    `).join("") || `<tr><td colspan="5" style="color:var(--slate)">No employees yet.</td></tr>`;
  }
  document.getElementById("employee-form").addEventListener("submit", e=>{
    e.preventDefault();
    const f = formData2obj(e.target);
    f.salary = Number(f.salary)||0;
    DB.addEmployee(f);
    e.target.reset(); fillDivDeptSelects(e.target);
    renderEmployees(); refreshEmployeeDependentSelects();
  });
  document.getElementById("employees-body").addEventListener("click", e=>{
    const editBtn = e.target.closest("[data-edit-emp]");
    const delBtn = e.target.closest("[data-del-emp]");
    if(delBtn){
      if(confirm("Delete this employee? Their tasks and contract will be removed too.")){
        DB.deleteEmployee(delBtn.dataset.delEmp);
        renderEmployees(); refreshEmployeeDependentSelects(); renderTasks(); renderContracts();
      }
      return;
    }
    if(editBtn){
      const id = editBtn.dataset.editEmp;
      const row = document.querySelector(`[data-emp-edit="${id}"]`);
      const isOpen = row.style.display !== "none";
      document.querySelectorAll(".inline-edit-row").forEach(r=>r.style.display="none");
      if(isOpen) return;
      const e2 = DB.employee(id);
      row.querySelector("td").innerHTML = `
        <div class="inline-edit">
          <div class="form-grid">
            <div class="form-field"><label>Full name</label><input type="text" data-f="name" value="${H.esc(e2.name)}"></div>
            <div class="form-field"><label>Role</label><input type="text" data-f="role" value="${H.esc(e2.role)}"></div>
            <div class="form-field"><label>Division</label><select data-f="division">${DB.DIVISIONS.map(d=>`<option ${d===e2.division?"selected":""}>${d}</option>`).join("")}</select></div>
            <div class="form-field"><label>Department</label><select data-f="dept">${DB.DEPARTMENTS.map(d=>`<option ${d===e2.dept?"selected":""}>${d}</option>`).join("")}</select></div>
            <div class="form-field"><label>bKash number</label><input type="text" data-f="bkash" value="${H.esc(e2.bkash)}"></div>
            <div class="form-field"><label>Salary</label><input type="number" data-f="salary" value="${e2.salary}"></div>
          </div>
          <div class="form-actions">
            <button class="btn-primary" data-save-emp="${id}">Save</button>
            <button class="btn-secondary" data-cancel-emp>Cancel</button>
          </div>
        </div>`;
      row.style.display = "";
    }
    const saveBtn = e.target.closest("[data-save-emp]");
    if(saveBtn){
      const id = saveBtn.dataset.saveEmp;
      const row = document.querySelector(`[data-emp-edit="${id}"]`);
      const patch = {};
      row.querySelectorAll("[data-f]").forEach(f=>{ patch[f.dataset.f] = f.tagName==="SELECT" ? f.value : (f.type==="number" ? Number(f.value)||0 : f.value); });
      DB.updateEmployee(id, patch);
      renderEmployees(); refreshEmployeeDependentSelects(); renderTasks(); renderContracts();
    }
    if(e.target.closest("[data-cancel-emp]")){
      document.querySelectorAll(".inline-edit-row").forEach(r=>r.style.display="none");
    }
  });

  /* ================= TASKS ================= */
  function fillEmpSelect(select, includeAll){
    select.innerHTML = (includeAll ? `<option value="all">All employees</option>` : "") +
      DB.employees().map(e=>`<option value="${e.id}">${H.esc(e.name)}</option>`).join("");
  }
  function refreshEmployeeDependentSelects(){
    fillEmpSelect(document.getElementById("task-form").emp, false);
    fillEmpSelect(document.getElementById("tasks-filter-emp"), true);
  }
  function renderTasks(){
    const filterEmp = document.getElementById("tasks-filter-emp").value || "all";
    const rows = DB.tasks().filter(t=> filterEmp==="all" || t.emp===filterEmp);
    document.getElementById("tasks-count").textContent = `${rows.length} task${rows.length===1?"":"s"}`;
    document.getElementById("tasks-body").innerHTML = rows.map(t=>{
      const e = DB.employee(t.emp);
      return `<tr data-task-row="${t.id}">
        <td>${e?H.esc(e.name):"(removed)"}</td>
        <td>${H.esc(t.task)}</td>
        <td>${H.statusChip(t.status)}</td>
        <td class="mono">${H.fmtDate(t.due)}</td>
        <td class="mono">${H.fmtDate(t.date)}</td>
        <td class="row-actions">
          <button class="btn-mini" data-edit-task="${t.id}">Edit</button>
          <button class="btn-mini danger" data-del-task="${t.id}">Delete</button>
        </td>
      </tr>
      <tr class="inline-edit-row" data-task-edit="${t.id}" style="display:none"><td colspan="6"></td></tr>`;
    }).join("") || `<tr><td colspan="6" style="color:var(--slate)">No tasks yet.</td></tr>`;
  }
  document.getElementById("task-form").addEventListener("submit", e=>{
    e.preventDefault();
    const f = formData2obj(e.target);
    if(f.status !== "done") f.date = null;
    DB.addTask(f);
    e.target.reset();
    renderTasks();
  });
  document.getElementById("tasks-filter-emp").addEventListener("change", renderTasks);
  document.getElementById("tasks-body").addEventListener("click", e=>{
    const delBtn = e.target.closest("[data-del-task]");
    if(delBtn){
      if(confirm("Delete this task?")){ DB.deleteTask(delBtn.dataset.delTask); renderTasks(); }
      return;
    }
    const editBtn = e.target.closest("[data-edit-task]");
    if(editBtn){
      const id = editBtn.dataset.editTask;
      const row = document.querySelector(`[data-task-edit="${id}"]`);
      const isOpen = row.style.display !== "none";
      document.querySelectorAll(".inline-edit-row").forEach(r=>r.style.display="none");
      if(isOpen) return;
      const t = DB.tasks().find(x=>x.id===id);
      row.querySelector("td").innerHTML = `
        <div class="inline-edit">
          <div class="form-grid">
            <div class="form-field" style="grid-column:1/-1"><label>Task description</label><input type="text" data-f="task" value="${H.esc(t.task)}"></div>
            <div class="form-field"><label>Status</label><select data-f="status">
              <option value="todo" ${t.status==="todo"?"selected":""}>To-Do</option>
              <option value="progress" ${t.status==="progress"?"selected":""}>In Progress</option>
              <option value="done" ${t.status==="done"?"selected":""}>Done</option>
            </select></div>
            <div class="form-field"><label>Due date</label><input type="date" data-f="due" value="${t.due||""}"></div>
            <div class="form-field"><label>Completed date</label><input type="date" data-f="date" value="${t.date||""}"></div>
          </div>
          <div class="form-actions">
            <button class="btn-primary" data-save-task="${id}">Save</button>
            <button class="btn-secondary" data-cancel-task>Cancel</button>
          </div>
        </div>`;
      row.style.display = "";
    }
    const saveBtn = e.target.closest("[data-save-task]");
    if(saveBtn){
      const id = saveBtn.dataset.saveTask;
      const row = document.querySelector(`[data-task-edit="${id}"]`);
      const patch = {};
      row.querySelectorAll("[data-f]").forEach(f=>{ patch[f.dataset.f] = f.value || null; });
      if(patch.status !== "done") patch.date = null;
      DB.updateTask(id, patch);
      renderTasks();
    }
    if(e.target.closest("[data-cancel-task]")){
      document.querySelectorAll(".inline-edit-row").forEach(r=>r.style.display="none");
    }
  });

  /* ================= CONTRACTS ================= */
  function renderContracts(){
    document.getElementById("contracts-body").innerHTML = DB.employees().map(e=>{
      const c = DB.contractFor(e.id) || {joined:"",lastRenewal:"",notes:""};
      return `<tr data-contract-row="${e.id}">
        <td>${H.esc(e.name)}</td>
        <td><input type="date" data-f="joined" value="${c.joined||""}"></td>
        <td><input type="date" data-f="lastRenewal" value="${c.lastRenewal||""}"></td>
        <td><input type="text" data-f="notes" value="${H.esc(c.notes||"")}" style="width:100%"></td>
        <td><button class="btn-mini" data-save-contract="${e.id}">Save</button></td>
      </tr>`;
    }).join("") || `<tr><td colspan="5" style="color:var(--slate)">No employees yet.</td></tr>`;
  }
  document.getElementById("contracts-body").addEventListener("click", e=>{
    const btn = e.target.closest("[data-save-contract]");
    if(!btn) return;
    const empId = btn.dataset.saveContract;
    const row = document.querySelector(`[data-contract-row="${empId}"]`);
    const patch = {};
    row.querySelectorAll("[data-f]").forEach(f=>{ patch[f.dataset.f] = f.value; });
    DB.upsertContract(empId, patch);
    btn.textContent = "Saved ✓";
    setTimeout(()=>{ btn.textContent = "Save"; }, 1200);
  });

  /* ================= RECRUITMENT: OPENINGS ================= */
  function fillOpeningSelects(form){
    form.dept.innerHTML = DB.DEPARTMENTS.map(d=>`<option>${d}</option>`).join("");
    form.division.innerHTML = DB.DIVISIONS.map(d=>`<option>${d}</option>`).join("");
  }
  function renderOpenings(){
    document.getElementById("openings-body").innerHTML = DB.openings().map(o=>`
      <tr data-open-row="${o.id}">
        <td>${H.esc(o.dept)}</td><td>${H.esc(o.division)}</td><td>${o.positions}</td>
        <td>
          <select data-open-status="${o.id}">
            ${["Open","Interviewing","On Hold"].map(s=>`<option ${s===o.status?"selected":""}>${s}</option>`).join("")}
          </select>
        </td>
        <td><button class="btn-mini danger" data-del-open="${o.id}">Delete</button></td>
      </tr>`).join("") || `<tr><td colspan="5" style="color:var(--slate)">No openings yet.</td></tr>`;
  }
  document.getElementById("opening-form").addEventListener("submit", e=>{
    e.preventDefault();
    const f = formData2obj(e.target);
    f.positions = Number(f.positions)||1;
    DB.addOpening(f);
    e.target.reset(); fillOpeningSelects(e.target);
    renderOpenings();
  });
  document.getElementById("openings-body").addEventListener("click", e=>{
    const del = e.target.closest("[data-del-open]");
    if(del && confirm("Delete this hiring need?")){ DB.deleteOpening(del.dataset.delOpen); renderOpenings(); }
  });
  document.getElementById("openings-body").addEventListener("change", e=>{
    const sel = e.target.closest("[data-open-status]");
    if(sel){ DB.updateOpening(sel.dataset.openStatus, {status: sel.value}); }
  });

  /* ================= RECRUITMENT: ROUNDS ================= */
  function renderRounds(){
    document.getElementById("rounds-list").innerHTML = DB.rounds().map(r=>`
      <div class="meeting-card" data-round-card="${r.id}">
        <div class="meeting-top">
          <div>
            <div class="meeting-date mono">${H.fmtDate(r.date)} · ${H.esc(r.time||"")}</div>
            <div class="meeting-topic">${H.esc(r.position)}</div>
          </div>
          <button class="btn-mini danger" data-del-round="${r.id}">Delete round</button>
        </div>
        ${r.candidates.length ? `
        <table class="cand-table">
          <thead><tr><th>Name</th><th>Background</th><th>University</th><th>CV</th><th></th></tr></thead>
          <tbody>
            ${r.candidates.map(c=>`<tr>
              <td>${H.esc(c.name)}</td><td>${H.esc(c.background)}</td><td>${H.esc(c.university)}</td><td>${c.cv?H.esc(c.cv):"—"}</td>
              <td><button class="btn-mini danger" data-del-cand="${r.id}|${c.id}">Remove</button></td>
            </tr>`).join("")}
          </tbody>
        </table>` : `<div class="form-note" style="margin-top:10px">No candidates yet — upload a CSV below.</div>`}
        <form class="csv-upload-box" data-round-manage="${r.id}">
          <div class="form-grid">
            <div class="form-field" style="grid-column:1/-1"><label>Google Meet link</label><input type="text" name="meetLink" value="${H.esc(r.meetLink||"")}" placeholder="https://meet.google.com/..."></div>
            <div class="form-field" style="grid-column:1/-1">
              <label>Import candidates from CSV (columns: name, background, university, cv) — replaces the table above</label>
              <input type="file" name="csv" accept=".csv,text/csv">
            </div>
          </div>
          <div class="form-actions"><button type="submit" class="btn-mini">Save changes</button></div>
        </form>
      </div>`).join("") || `<p style="color:var(--slate)">No interview rounds scheduled.</p>`;
  }
  document.getElementById("round-form").addEventListener("submit", e=>{
    e.preventDefault();
    const f = formData2obj(e.target);
    f.candidates = [];
    DB.addRound(f);
    e.target.reset();
    renderRounds();
  });
  document.getElementById("rounds-list").addEventListener("click", e=>{
    const delRound = e.target.closest("[data-del-round]");
    if(delRound && confirm("Delete this interview round and its candidates?")){ DB.deleteRound(delRound.dataset.delRound); renderRounds(); return; }
    const delCand = e.target.closest("[data-del-cand]");
    if(delCand){
      const [roundId, candId] = delCand.dataset.delCand.split("|");
      DB.deleteCandidate(roundId, candId);
      renderRounds();
    }
  });
  document.getElementById("rounds-list").addEventListener("submit", e=>{
    const form = e.target.closest("[data-round-manage]");
    if(!form) return;
    e.preventDefault();
    const roundId = form.dataset.roundManage;
    const meetLink = form.meetLink.value;
    const file = form.csv.files[0];
    const finish = ()=>{ DB.updateRound(roundId, {meetLink}); renderRounds(); };
    if(file){
      const reader = new FileReader();
      reader.onload = () => {
        const rows = H.parseCSV(reader.result);
        const candidates = rows.filter(r=>r[0]).map(r=>({
          id: "cand_" + Math.random().toString(36).slice(2,9),
          name: r[0]||"", background: r[1]||"", university: r[2]||"", cv: r[3]||""
        }));
        DB.updateRound(roundId, {candidates});
        finish();
      };
      reader.readAsText(file);
    } else {
      finish();
    }
  });

  /* ================= MEETINGS ================= */
  function renderMeetingsAdmin(){
    const rows = [...DB.meetings()].sort((a,b)=>b.date.localeCompare(a.date));
    document.getElementById("meetings-admin-list").innerHTML = rows.map(m=>`
      <div class="meeting-card">
        <div class="meeting-top">
          <div>
            <div class="meeting-date mono">${H.fmtDate(m.date)}</div>
            <div class="meeting-topic">${H.esc(m.topic)}</div>
          </div>
          ${H.chip(H.esc(m.division))}
        </div>
        <ul class="meeting-points">${m.points.map(p=>`<li>${H.esc(p)}</li>`).join("")}</ul>
        <div class="meeting-foot">
          <span>Absent:</span>
          ${m.absent.length ? m.absent.map(a=>`<span class="absent-chip">${H.esc(a)}</span>`).join("") : "<span>None</span>"}
          <button class="btn-mini danger" style="margin-left:auto" data-del-meeting="${m.id}">Delete</button>
        </div>
      </div>`).join("") || `<p style="color:var(--slate)">No meetings logged yet.</p>`;
  }
  document.getElementById("meeting-form").addEventListener("submit", e=>{
    e.preventDefault();
    const f = formData2obj(e.target);
    f.points = (f.points||"").split("\n").map(s=>s.trim()).filter(Boolean);
    f.absent = (f.absent||"").split(",").map(s=>s.trim()).filter(Boolean);
    DB.addMeeting(f);
    e.target.reset();
    renderMeetingsAdmin();
  });
  document.getElementById("meetings-admin-list").addEventListener("click", e=>{
    const del = e.target.closest("[data-del-meeting]");
    if(del && confirm("Delete this meeting log?")){ DB.deleteMeeting(del.dataset.delMeeting); renderMeetingsAdmin(); }
  });

  /* ================= DOCUMENTS ================= */
  function docKindLabel(d){
    if(d.fileName){ const ext = d.fileName.split(".").pop(); return ext ? ext.toUpperCase() : "FILE"; }
    return d.kind;
  }
  function renderDocs(){
    const cat = document.getElementById("doc-category").value;
    document.getElementById("docs-list").innerHTML = DB.docCategory(cat).map(d=>`
      <div class="doc-card" data-doc-card="${d.id}">
        <div class="doc-card-head">
          <div><div class="doc-title">${H.esc(d.title)}</div><div class="doc-sub">${H.esc(d.sub)}${d.fileName?" · "+H.esc(d.fileName):""}</div></div>
          <span class="chip">${docKindLabel(d)}</span>
        </div>
        <div class="doc-card-actions">
          <button class="btn-mini" data-edit-doc="${d.id}">Edit</button>
          <button class="btn-mini danger" data-del-doc="${d.id}">Delete</button>
        </div>
        <div class="inline-edit" data-doc-edit="${d.id}" style="display:none"></div>
      </div>`).join("") || `<p style="color:var(--slate)">No documents in this category yet.</p>`;
  }
  document.getElementById("doc-category").addEventListener("change", renderDocs);
  document.getElementById("doc-form").addEventListener("submit", async e=>{
    e.preventDefault();
    const form = e.target;
    const f = formData2obj(form);
    f.body = (f.body||"").split("\n");
    const file = form.file.files[0];
    if(file){
      if(file.size > 4*1024*1024){ alert("Please keep uploaded files under 4MB (this site stores them in the browser)."); return; }
      f.fileData = await H.fileToDataURL(file);
      f.fileName = file.name;
      f.fileType = file.type;
    }
    delete f.file;
    DB.addDoc(document.getElementById("doc-category").value, f);
    form.reset();
    renderDocs();
  });
  document.getElementById("docs-list").addEventListener("click", e=>{
    const cat = document.getElementById("doc-category").value;
    const del = e.target.closest("[data-del-doc]");
    if(del && confirm("Delete this document template?")){ DB.deleteDoc(cat, del.dataset.delDoc); renderDocs(); return; }
    const edit = e.target.closest("[data-edit-doc]");
    if(edit){
      const id = edit.dataset.editDoc;
      const d = DB.docCategory(cat).find(x=>x.id===id);
      const box = document.querySelector(`[data-doc-edit="${id}"]`);
      const isOpen = box.style.display !== "none";
      document.querySelectorAll("[data-doc-edit]").forEach(b=>b.style.display="none");
      if(isOpen) return;
      box.innerHTML = `
        <div class="form-grid">
          <div class="form-field"><label>Title</label><input type="text" data-f="title" value="${H.esc(d.title)}"></div>
          <div class="form-field"><label>Subtitle</label><input type="text" data-f="sub" value="${H.esc(d.sub)}"></div>
          <div class="form-field"><label>File type (used if no file uploaded)</label><select data-f="kind"><option ${d.kind==="PDF"?"selected":""}>PDF</option><option ${d.kind==="TXT"?"selected":""}>TXT</option></select></div>
        </div>
        ${d.fileName ? `<div class="form-note" style="margin-bottom:8px">Currently attached: ${H.esc(d.fileName)}</div>` : ""}
        <div class="form-field" style="margin-bottom:12px"><label>Replace/attach file (optional)</label><input type="file" data-replace-file></div>
        <div class="form-field" style="margin-bottom:12px"><label>Body (used only if no file attached)</label><textarea data-f="body" rows="5">${H.esc((d.body||[]).join("\n"))}</textarea></div>
        <div class="form-actions">
          <button class="btn-primary" data-save-doc="${id}">Save</button>
          <button class="btn-secondary" data-cancel-doc>Cancel</button>
        </div>`;
      box.style.display = "";
    }
    const save = e.target.closest("[data-save-doc]");
    if(save){
      const id = save.dataset.saveDoc;
      const box = document.querySelector(`[data-doc-edit="${id}"]`);
      const patch = {};
      box.querySelectorAll("[data-f]").forEach(f=>{ patch[f.dataset.f] = f.dataset.f==="body" ? f.value.split("\n") : f.value; });
      const fileInput = box.querySelector("[data-replace-file]");
      const file = fileInput && fileInput.files[0];
      const applyAndRender = ()=>{ DB.updateDoc(cat, id, patch); renderDocs(); };
      if(file){
        if(file.size > 4*1024*1024){ alert("Please keep uploaded files under 4MB (this site stores them in the browser)."); return; }
        H.fileToDataURL(file).then(dataUrl=>{
          patch.fileData = dataUrl; patch.fileName = file.name; patch.fileType = file.type;
          applyAndRender();
        });
      } else {
        applyAndRender();
      }
    }
    if(e.target.closest("[data-cancel-doc]")){
      document.querySelectorAll("[data-doc-edit]").forEach(b=>b.style.display="none");
    }
  });

  /* ================= DATA: BACKUP / RESTORE / RESET ================= */
  document.getElementById("export-json").addEventListener("click", ()=>{
    const blob = new Blob([JSON.stringify(DB.data(), null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `dob-team-hub-backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
  document.getElementById("import-file").addEventListener("change", e=>{
    const file = e.target.files[0];
    if(!file) return;
    if(!confirm("This replaces ALL current data with the contents of this file. Continue?")){ e.target.value=""; return; }
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const parsed = JSON.parse(reader.result);
        if(!parsed.employees || !Array.isArray(parsed.employees)) throw new Error("Missing employees list");
        DB.replaceAll(parsed);
        alert("Backup restored. Reloading the panel now.");
        location.reload();
      }catch(err){
        alert("Could not import this file: " + err.message);
      }
    };
    reader.readAsText(file);
  });
  document.getElementById("reset-data").addEventListener("click", ()=>{
    if(confirm("This wipes everything and restores the original sample data. This cannot be undone. Continue?")){
      DB.resetDemoData();
      location.reload();
    }
  });

  /* ================= INIT ================= */
  fillDivDeptSelects(document.getElementById("employee-form"));
  fillOpeningSelects(document.getElementById("opening-form"));
  refreshEmployeeDependentSelects();
  renderEmployees();
  renderTasks();
  renderContracts();
  renderOpenings();
  renderRounds();
  renderMeetingsAdmin();
  renderDocs();
})();
