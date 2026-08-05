(function(){
  "use strict";
  function controls(){
    const monthSel = document.getElementById("completed-month");
    monthSel.innerHTML = H.monthOptionsHtml();
    const empSel = document.getElementById("completed-employee");
    empSel.innerHTML = `<option value="all">All employees</option>` + DB.employees().map(e=>`<option value="${e.id}">${H.esc(e.name)}</option>`).join("");
    monthSel.addEventListener("change", render);
    empSel.addEventListener("change", render);
  }
  function render(){
    const month = document.getElementById("completed-month").value;
    const emp = document.getElementById("completed-employee").value;
    let rows = DB.tasks().filter(t=>t.status==="done");
    if(month!=="all") rows = rows.filter(t=>H.monthKey(t.date)===month);
    if(emp!=="all") rows = rows.filter(t=>t.emp===emp);
    rows.sort((a,b)=> (b.date||"").localeCompare(a.date||""));
    document.getElementById("completed-count").textContent = `${rows.length} task${rows.length===1?"":"s"} completed`;
    document.getElementById("completed-body").innerHTML = rows.map(r=>{
      const e = DB.employee(r.emp);
      if(!e) return "";
      return `<tr>
        <td>${H.esc(e.name)}<div class="cell-sub">${H.esc(e.role)}</div></td>
        <td>${H.esc(r.task)}</td>
        <td>${H.esc(e.division)}<div class="cell-sub">${H.esc(e.dept)}</div></td>
        <td class="mono">${H.fmtDate(r.date)}</td>
      </tr>`;
    }).join("") || `<tr><td colspan="4" style="color:var(--slate)">No completed tasks for this filter.</td></tr>`;
  }
  controls();
  render();
})();
