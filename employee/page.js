(function(){
  "use strict";
  const id = new URLSearchParams(location.search).get("id");
  const e = id ? DB.employee(id) : null;
  const root = document.getElementById("profile-root");

  if(!e){
    root.innerHTML = `<p style="color:var(--slate)">Employee not found. <a href="../directory/" style="text-decoration:underline">Back to Directory</a>.</p>`;
    return;
  }

  document.title = e.name + " — DOB Team Hub";
  const topbarTitle = document.querySelector(".topbar h1");
  const topbarSub = document.querySelector(".topbar p");
  if(topbarTitle) topbarTitle.textContent = e.name;
  if(topbarSub) topbarSub.textContent = e.role;

  const tint = H.tintFor(e.name);
  const tasks = DB.tasksFor(e.id);
  const running = tasks.filter(t=>t.status!=="done").sort((a,b)=>a.due.localeCompare(b.due));
  const done = tasks.filter(t=>t.status==="done").sort((a,b)=>(b.date||"").localeCompare(a.date||""));

  root.innerHTML = `
    <div class="profile-head">
      <div class="profile-avatar" style="background:${H.AVATAR_TINTS[tint]};color:${H.AVATAR_TEXT[tint]}">${H.initials(e.name)}</div>
      <div>
        <div class="profile-name">${H.esc(e.name)}</div>
        <div class="profile-role">${H.esc(e.role)}</div>
        <div class="profile-tags">${H.chip(H.esc(e.division))}${H.chip(H.esc(e.dept))}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-card"><div class="info-label">Email</div><div class="info-value">${e.email ? H.esc(e.email) : "—"}</div></div>
      <div class="info-card"><div class="info-label">Phone</div><div class="info-value">${e.phone ? H.esc(e.phone) : "—"}</div></div>
      <div class="info-card"><div class="info-label">Division</div><div class="info-value">${H.esc(e.division)}</div></div>
      <div class="info-card"><div class="info-label">Department</div><div class="info-value">${H.esc(e.dept)}</div></div>
    </div>

    <div class="profile-section-title">Key Responsibilities</div>
    ${e.responsibilities && e.responsibilities.length
      ? `<ul class="resp-list">${e.responsibilities.map(r=>`<li>${H.esc(r)}</li>`).join("")}</ul>`
      : `<p style="color:var(--slate);font-size:13px">No responsibilities on file yet.</p>`}

    <div class="profile-section-title">Running Tasks (${running.length})</div>
    <div id="profile-running"></div>

    <div class="profile-section-title">Completed Tasks (${done.length})</div>
    <div id="profile-done"></div>
  `;

  document.getElementById("profile-running").innerHTML = running.length ? running.map(t=>`
    <div class="task-mini-card">
      <div>
        <div style="font-weight:600;font-size:13.5px">${H.esc(t.task)}</div>
        ${H.dueNoteHtml(t)}
      </div>
      ${H.statusChip(t.status)}
    </div>`).join("") : `<p style="color:var(--slate);font-size:13px">No running tasks — all caught up.</p>`;

  document.getElementById("profile-done").innerHTML = done.length ? done.map(t=>`
    <div class="task-mini-card">
      <div style="font-weight:600;font-size:13.5px">${H.esc(t.task)}</div>
      <span class="chip mono">${H.fmtDate(t.date)}</span>
    </div>`).join("") : `<p style="color:var(--slate);font-size:13px">No completed tasks yet.</p>`;
})();
