(function(){
  "use strict";
  let activeDepartment = "HR Dept.";
  let activeMonth = "all";

  function statusCounts(rows){
    return {todo:rows.filter(r=>r.status==="todo").length, progress:rows.filter(r=>r.status==="progress").length, done:rows.filter(r=>r.status==="done").length};
  }
  function statusSegBar(counts){
    return H.segBarHtml([{v:counts.todo,c:"var(--slate)"},{v:counts.progress,c:"var(--amber)"},{v:counts.done,c:"var(--teal)"}]);
  }
  function filterByMonth(rows, month){
    if(month==="all") return rows;
    return rows.filter(r=>r.status==="done" && H.monthKey(r.date)===month);
  }
  function controls(){
    const sel = document.getElementById("department-month");
    sel.innerHTML = H.monthOptionsHtml();
    sel.addEventListener("change", ()=>{ activeMonth = sel.value; renderSummary(); renderTable(); });
  }
  function departmentCardHtml(dep){
    const empIds = DB.employees().filter(e=>e.dept===dep).map(e=>e.id);
    const rows = filterByMonth(DB.tasks().filter(t=>empIds.includes(t.emp)), activeMonth);
    const counts = statusCounts(rows);
    const total = counts.todo+counts.progress+counts.done;
    return `<div class="pulse-card ${dep===activeDepartment?'selected':''}" data-dep="${H.esc(dep)}">
      <div class="pulse-card-head"><span class="pulse-name">${dep}</span><span class="pulse-total">${total} task${total===1?"":"s"}</span></div>
      ${statusSegBar(counts)}
      <div class="pulse-legend">
        <span><i style="background:var(--slate)"></i>${counts.todo} to-do</span>
        <span><i style="background:var(--amber)"></i>${counts.progress} active</span>
        <span><i style="background:var(--teal)"></i>${counts.done} done</span>
      </div>
    </div>`;
  }
  function renderSummary(){
    const summary = document.getElementById("department-summary");
    summary.innerHTML = DB.DIVISIONS.map(div=>{
      const depts = DB.DEPARTMENTS.filter(d=>DB.divisionForDept(d)===div);
      if(!depts.length) return "";
      return `<div class="division-group">
        <div class="division-group-head"><h3>${div}</h3><div class="division-group-line"></div><span class="division-group-count">${depts.length} department${depts.length===1?"":"s"}</span></div>
        <div class="pulse-grid">${depts.map(departmentCardHtml).join("")}</div>
      </div>`;
    }).join("");
    summary.querySelectorAll(".pulse-card").forEach(card=>{
      card.addEventListener("click", ()=>{ activeDepartment = card.dataset.dep; renderSummary(); renderTable(); });
    });
  }
  function renderTable(){
    document.getElementById("department-active-name").textContent = activeDepartment;
    const empIds = DB.employees().filter(e=>e.dept===activeDepartment).map(e=>e.id);
    const rows = filterByMonth(DB.tasks().filter(t=>empIds.includes(t.emp)), activeMonth);
    document.getElementById("department-body").innerHTML = rows.map(r=>{
      const e = DB.employee(r.emp);
      return `<tr><td>${H.esc(e.name)}</td><td>${H.esc(r.task)}</td><td>${H.esc(e.division)}</td><td>${H.statusChip(r.status)}</td></tr>`;
    }).join("") || `<tr><td colspan="4" style="color:var(--slate)">No tasks recorded for this department${activeMonth==="all"?" yet":" in "+H.monthLabel(activeMonth)}.</td></tr>`;
  }
  controls(); renderSummary(); renderTable();
})();
