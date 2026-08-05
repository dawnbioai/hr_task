(function(){
  "use strict";
  function render(){
    const openings = DB.openings();
    const rounds = DB.rounds();
    const totalPositions = openings.reduce((s,o)=>s+o.positions,0);
    const totalCandidates = rounds.reduce((s,r)=>s+r.candidates.length,0);
    document.getElementById("recruitment-stats").innerHTML = `
      <div class="stat-card accent-amber"><div class="stat-num">${totalPositions}</div><div class="stat-label">Open positions</div></div>
      <div class="stat-card"><div class="stat-num">${openings.length}</div><div class="stat-label">Departments hiring</div></div>
      <div class="stat-card accent-teal"><div class="stat-num">${rounds.length}</div><div class="stat-label">Interview rounds scheduled</div></div>
      <div class="stat-card"><div class="stat-num">${totalCandidates}</div><div class="stat-label">Candidates in pipeline</div></div>
    `;
    document.getElementById("openings-body").innerHTML = openings.map(o=>{
      const badgeClass = o.status==="Interviewing" ? "badge-soon" : o.status==="On Hold" ? "badge-over" : "badge-active";
      return `<tr><td>${H.esc(o.dept)}</td><td>${H.esc(o.division)}</td><td>${o.positions}</td><td><span class="badge ${badgeClass}">${H.esc(o.status)}</span></td></tr>`;
    }).join("") || `<tr><td colspan="4" style="color:var(--slate)">No open positions right now.</td></tr>`;
    function cvCell(cv){
      if(!cv) return "—";
      if(/^https?:\/\//i.test(cv)) return `<a href="${H.esc(cv)}" target="_blank" rel="noopener noreferrer" class="name-link">View CV</a>`;
      return H.esc(cv);
    }
    document.getElementById("recruitment-rounds").innerHTML = rounds.map(r=>`
      <div class="meeting-card">
        <div class="meeting-top">
          <div>
            <div class="meeting-date mono">${H.fmtDate(r.date)} · ${H.esc(r.time)}</div>
            <div class="meeting-topic">${H.esc(r.position)}</div>
          </div>
          <a class="meet-link" href="${H.esc(r.meetLink)}" target="_blank" rel="noopener noreferrer">Join Google Meet</a>
        </div>
        ${r.candidates.length ? `
        <table class="cand-table">
          <thead><tr><th>Name</th><th>Background</th><th>University</th><th>CV</th></tr></thead>
          <tbody>
            ${r.candidates.map(c=>`<tr><td>${H.esc(c.name)}</td><td>${H.esc(c.background)}</td><td>${H.esc(c.university)}</td><td>${cvCell(c.cv)}</td></tr>`).join("")}
          </tbody>
        </table>` : `<div class="recruit-candidates"><div class="candidate-note">No candidates in the pipeline yet.</div></div>`}
      </div>`).join("") || `<p style="color:var(--slate)">No recruitment rounds scheduled.</p>`;
  }
  render();
})();
