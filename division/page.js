(function(){
  "use strict";
  let activeDivision = "General";
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
    const sel = document.getElementById("division-month");
    sel.innerHTML = H.monthOptionsHtml();
    sel.addEventListener("change", ()=>{ activeMonth = sel.value; renderSummary(); renderTable(); });
  }
  function renderSummary(){
    const summary = document.getElementById("division-summary");
    summary.innerHTML = DB.DIVISIONS.map(div=>{
      const empIds = DB.employees().filter(e=>e.division===div).map(e=>e.id);
      const rows = filterByMonth(DB.tasks().filter(t=>empIds.includes(t.emp)), activeMonth);
      const counts = statusCounts(rows);
      const total = counts.todo+counts.progress+counts.done;
      return `<div class="pulse-card ${div===activeDivision?'selected':''}" data-div="${H.esc(div)}">
        <div class="pulse-card-head"><span class="pulse-name">${div}</span><span class="pulse-total">${total} task${total===1?"":"s"}</span></div>
        ${statusSegBar(counts)}
        <div class="pulse-legend">
          <span><i style="background:var(--slate)"></i>${counts.todo} to-do</span>
          <span><i style="background:var(--amber)"></i>${counts.progress} active</span>
          <span><i style="background:var(--teal)"></i>${counts.done} done</span>
        </div>
      </div>`;
    }).join("");
    summary.querySelectorAll(".pulse-card").forEach(card=>{
      card.addEventListener("click", ()=>{ activeDivision = card.dataset.div; renderSummary(); renderTable(); });
    });
  }
  function renderTable(){
    document.getElementById("division-active-name").textContent = activeDivision;
    const empIds = DB.employees().filter(e=>e.division===activeDivision).map(e=>e.id);
    const rows = filterByMonth(DB.tasks().filter(t=>empIds.includes(t.emp)), activeMonth);
    document.getElementById("division-body").innerHTML = rows.map(r=>{
      const e = DB.employee(r.emp);
      return `<tr><td>${H.esc(e.name)}</td><td>${H.esc(r.task)}</td><td>${H.esc(e.dept)}</td><td>${H.statusChip(r.status)}</td></tr>`;
    }).join("") || `<tr><td colspan="4" style="color:var(--slate)">No tasks recorded for this division${activeMonth==="all"?" yet":" in "+H.monthLabel(activeMonth)}.</td></tr>`;
  }
  controls(); renderSummary(); renderTable();
})();
