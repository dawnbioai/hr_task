(function(){
  "use strict";
  function renderStats(){
    const tasks = DB.tasks();
    const active = tasks.filter(t=>t.status==="progress").length;
    const todo = tasks.filter(t=>t.status==="todo").length;
    const overdue = tasks.filter(t=>t.status!=="done" && H.daysBetween(t.due,DB.TODAY)<0).length;
    document.getElementById("directory-stats").innerHTML = `
      <div class="stat-card"><div class="stat-num">${DB.employees().length}</div><div class="stat-label">Employees</div></div>
      <div class="stat-card accent-amber"><div class="stat-num">${active}</div><div class="stat-label">Tasks in progress</div></div>
      <div class="stat-card"><div class="stat-num">${todo}</div><div class="stat-label">Tasks to-do</div></div>
      <div class="stat-card accent-coral"><div class="stat-num">${overdue}</div><div class="stat-label">Needs attention (overdue)</div></div>
    `;
  }

  function renderTaskOverview(){
    const open = DB.tasks().filter(t=>t.status!=="done");
    const buckets = {overdue:[], due:[], progress:[], todo:[]};
    open.forEach(t=>{
      const diff = H.daysBetween(t.due, DB.TODAY);
      if(diff < 0) buckets.overdue.push(t);
      else if(diff <= 3) buckets.due.push(t);
      else if(t.status==="progress") buckets.progress.push(t);
      else buckets.todo.push(t);
    });
    const cols = [
      {key:"progress", label:"In Progress", color:"var(--amber)", list:buckets.progress},
      {key:"todo",     label:"To-Do",       color:"var(--slate)", list:buckets.todo},
      {key:"due",      label:"Due Soon",    color:"var(--amber)", list:buckets.due},
      {key:"overdue",  label:"Overdue",     color:"var(--coral)", list:buckets.overdue}
    ];
    document.getElementById("task-overview").innerHTML = cols.map(col=>`
      <div class="task-overview-col">
        <div class="task-overview-head"><i style="background:${col.color}"></i>${col.label} (${col.list.length})</div>
        ${col.list.length ? col.list.map(t=>{
          const e = DB.employee(t.emp);
          return `<div class="task-overview-row">
            <div class="task-overview-emp">${e?H.esc(e.name):"—"}</div>
            <div class="task-overview-task" title="${H.esc(t.task)}">${H.esc(H.truncate(t.task, 42))}</div>
          </div>`;
        }).join("") : `<div class="task-overview-empty">Nothing here.</div>`}
      </div>`).join("");
  }

  function render(filter){
    const q = (filter||"").trim().toLowerCase();
    const matches = e => !q || e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q) || e.dept.toLowerCase().includes(q);
    let shown = 0;
    const groupsHtml = DB.DIVISIONS.map(div=>{
      const list = DB.employees().filter(e=>e.division===div && matches(e));
      if(!list.length) return "";
      shown += list.length;
      const cards = list.map(e=>{
        const t = H.currentTaskFor(e.id);
        const tint = H.tintFor(e.name);
        return `
        <a class="emp-card-link" href="../employee/?id=${encodeURIComponent(e.id)}">
        <div class="emp-card">
          <div class="emp-head">
            <div class="avatar" style="background:${H.AVATAR_TINTS[tint]};color:${H.AVATAR_TEXT[tint]}">${H.initials(e.name)}</div>
            <div>
              <div class="card-name">${H.esc(e.name)}</div>
              <div class="card-role">${H.esc(e.role)}</div>
            </div>
          </div>
          <div class="emp-tags">${H.chip(H.esc(e.dept))}</div>
          <div class="emp-divider"></div>
          <div class="eyebrow">Current task</div>
          <div class="task-line">${t ? H.esc(t.task) : "No active task assigned"}</div>
          ${t ? H.statusChip(t.status) : ""}
          ${H.dueNoteHtml(t)}
        </div>
        </a>`;
      }).join("");
      return `<div class="division-group">
        <div class="division-group-head"><h3>${div}</h3><div class="division-group-line"></div><span class="division-group-count">${list.length} employee${list.length===1?"":"s"}</span></div>
        <div class="card-grid">${cards}</div>
      </div>`;
    }).join("");
    document.getElementById("directory-count").textContent = `${shown} of ${DB.employees().length} employees`;
    document.getElementById("directory-groups").innerHTML = groupsHtml || `<p style="color:var(--slate)">No employees match "${H.esc(filter)}".</p>`;
  }

  renderStats();
  renderTaskOverview();
  render("");
  document.getElementById("directory-search").addEventListener("input", e=>render(e.target.value));
})();
