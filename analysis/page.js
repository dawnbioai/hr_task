(function(){
  "use strict";
  function analysisFor(empId, month){
    const rows = DB.tasksFor(empId);
    let completed = rows.filter(t=>t.status==="done");
    if(month!=="all") completed = completed.filter(t=>H.monthKey(t.date)===month);
    const onTime = completed.filter(t=>t.date && t.date<=t.due).length;
    const late = completed.length - onTime;
    const overdueNow = rows.filter(t=>t.status!=="done" && H.daysBetween(t.due,DB.TODAY)<0).length;
    const rate = completed.length ? Math.round(onTime/completed.length*100) : null;
    const regular = overdueNow===0 && (rate===null || rate>=50);
    return {completed:completed.length, onTime, late, overdueNow, rate, regular};
  }
  let lastStats = [];
  function controls(){
    const sel = document.getElementById("analysis-division");
    sel.innerHTML = `<option value="all">All divisions</option>` + DB.DIVISIONS.filter(d=>DB.employees().some(e=>e.division===d)).map(d=>`<option value="${d}">${d}</option>`).join("");
    sel.addEventListener("change", render);
    const monthSel = document.getElementById("analysis-month");
    monthSel.innerHTML = H.monthOptionsHtml();
    monthSel.addEventListener("change", render);
    document.getElementById("analysis-export").addEventListener("click", ()=>{
      const rows = [["Employee","Division","Department","Completed","On-time","Late","Overdue now","On-time rate","Regularity"]];
      lastStats.forEach(({e,a})=>rows.push([e.name, e.division, e.dept, a.completed, a.onTime, a.late, a.overdueNow, a.rate===null?"":a.rate+"%", a.regular?"Regular":"Irregular"]));
      H.downloadCSV(`dob-team-hub-analysis_${sel.value}_${monthSel.value}.csv`, rows);
    });
  }
  function render(){
    const div = document.getElementById("analysis-division").value;
    const month = document.getElementById("analysis-month").value;
    const list = DB.employees().filter(e=> div==="all" || e.division===div);
    const stats = list.map(e=>({e, a:analysisFor(e.id, month)}));
    lastStats = stats;
    const regularCount = stats.filter(s=>s.a.regular).length;
    const overdueTotal = stats.reduce((s,x)=>s+x.a.overdueNow,0);
    const completedTotal = stats.reduce((s,x)=>s+x.a.completed,0);
    const periodLabel = month==="all" ? "all time" : H.monthLabel(month);
    document.getElementById("analysis-stats").innerHTML = `
      <div class="stat-card accent-teal"><div class="stat-num">${completedTotal}</div><div class="stat-label">Tasks completed (${periodLabel})</div></div>
      <div class="stat-card accent-teal"><div class="stat-num">${regularCount}/${list.length}</div><div class="stat-label">Regular employees</div></div>
      <div class="stat-card accent-coral"><div class="stat-num">${list.length-regularCount}</div><div class="stat-label">Flagged irregular</div></div>
      <div class="stat-card accent-amber"><div class="stat-num">${overdueTotal}</div><div class="stat-label">Tasks overdue right now</div></div>
    `;
    document.getElementById("analysis-count").textContent = `${list.length} employee${list.length===1?"":"s"}`;
    document.getElementById("analysis-body").innerHTML = stats.map(({e,a})=>{
      const bar = a.completed ? H.segBarHtml([{v:a.onTime,c:"var(--teal)"},{v:a.late,c:"var(--coral)"}]) : "";
      return `<tr>
        <td>${H.esc(e.name)}<div class="cell-sub">${H.esc(e.division)} · ${H.esc(e.dept)}</div></td>
        <td>${a.completed}</td>
        <td>${a.onTime}</td>
        <td>${a.late}</td>
        <td>${a.overdueNow ? `<span class="badge badge-over">${a.overdueNow}</span>` : "0"}</td>
        <td class="mini-bar">${a.rate===null ? "—" : a.rate+"%"} ${bar}</td>
        <td>${a.regular ? '<span class="badge badge-active">Regular</span>' : '<span class="badge badge-over">Irregular</span>'}</td>
      </tr>`;
    }).join("");
  }
  controls();
  render();
})();
