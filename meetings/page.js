(function(){
  "use strict";
  document.getElementById("meetings-toolbar").innerHTML = Auth.isAdmin()
    ? `<a class="btn-primary" href="../admin/panel/#meetings" style="display:inline-block">+ Log meeting</a>`
    : `<span class="toolbar-label">Log new meetings from the Admin panel.</span>`;

  function renderStats(){
    const meetings = DB.meetings();
    const divCounts = {};
    const absenceCounts = {};
    meetings.forEach(m=>{
      (m.division||"").split(",").map(s=>s.trim()).filter(Boolean).forEach(d=>{ divCounts[d] = (divCounts[d]||0)+1; });
      (m.absent||[]).forEach(name=>{ absenceCounts[name] = (absenceCounts[name]||0)+1; });
    });
    const totalAbsences = Object.values(absenceCounts).reduce((a,b)=>a+b,0);
    document.getElementById("meetings-stats").innerHTML = `
      <div class="stat-card accent-teal"><div class="stat-num">${meetings.length}</div><div class="stat-label">Meetings logged</div></div>
      <div class="stat-card"><div class="stat-num">${Object.keys(divCounts).length}</div><div class="stat-label">Divisions covered</div></div>
      <div class="stat-card accent-coral"><div class="stat-num">${totalAbsences}</div><div class="stat-label">Total absences logged</div></div>
    `;
    const divRows = Object.entries(divCounts).sort((a,b)=>b[1]-a[1]);
    const absRows = Object.entries(absenceCounts).sort((a,b)=>b[1]-a[1]);
    document.getElementById("meetings-breakdown").innerHTML = `
      <div class="info-card">
        <div class="info-label">Meetings by Division</div>
        ${divRows.length ? divRows.map(([d,c])=>`<div class="absence-row"><span>${H.esc(d)}</span><span class="mono">${c}</span></div>`).join("") : `<div class="task-overview-empty">No meetings logged yet.</div>`}
      </div>
      <div class="info-card">
        <div class="info-label">Attendance — Most Absences</div>
        ${absRows.length ? absRows.map(([n,c])=>`<div class="absence-row"><span>${H.esc(n)}</span><span class="absence-count">${c}</span></div>`).join("") : `<div class="task-overview-empty">No absences logged.</div>`}
      </div>
    `;
  }

  function render(){
    const rows = [...DB.meetings()].sort((a,b)=>b.date.localeCompare(a.date));
    document.getElementById("meetings-list").innerHTML = rows.map(m=>`
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
        </div>
      </div>`).join("") || `<p style="color:var(--slate)">No meetings logged yet.</p>`;
  }
  renderStats();
  render();
})();
