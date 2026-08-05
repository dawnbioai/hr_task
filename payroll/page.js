(function(){
  "use strict";
  const isAdmin = Auth.isAdmin();

  function controls(){
    const sel = document.getElementById("payroll-month");
    const months = new Set(["2026-08","2026-07"]);
    H.allMonths().forEach(m=>months.add(m));
    const sorted = [...months].sort().reverse();
    sel.innerHTML = sorted.map(m=>`<option value="${m}">${H.monthLabel(m)}</option>`).join("");
    sel.addEventListener("change", render);
    document.getElementById("payroll-export").addEventListener("click", ()=>{
      const month = sel.value;
      const rows = [["Employee","Division","bKash Number","Salary","Paid"]];
      DB.employees().forEach(e=>rows.push([e.name, e.division, e.bkash, e.salary, DB.isPaid(e.id,month)?"Paid":"Pending"]));
      H.downloadCSV(`dob-team-hub-payroll_${month}.csv`, rows);
    });
    document.getElementById("payroll-note").textContent = isAdmin
      ? "You're in Admin mode — toggling Paid/Pending here updates the record immediately."
      : "View mode — paid status is read-only here. Log in as Admin to update payroll.";
  }

  function render(){
    const month = document.getElementById("payroll-month").value;
    let paidCount = 0;
    document.getElementById("payroll-body").innerHTML = DB.employees().map(e=>{
      const paid = DB.isPaid(e.id, month);
      if(paid) paidCount++;
      const toggle = isAdmin
        ? `<label class="paid-toggle"><input type="checkbox" data-emp="${e.id}" ${paid?"checked":""}> ${paid?"Paid":"Pending"}</label>`
        : `<span class="badge ${paid?"badge-active":"badge-soon"}">${paid?"Paid":"Pending"}</span>`;
      return `<tr>
        <td>${H.esc(e.name)}<div class="cell-sub">${H.esc(e.division)}</div></td>
        <td class="mono">${H.esc(e.bkash)}</td>
        <td class="mono">${H.fmtMoney(e.salary)}</td>
        <td>${toggle}</td>
      </tr>`;
    }).join("");
    document.getElementById("payroll-count").textContent = `${paidCount} of ${DB.employees().length} paid`;
    if(isAdmin){
      document.querySelectorAll("[data-emp]").forEach(cb=>{
        cb.addEventListener("change", ()=>{ DB.setPaid(cb.dataset.emp, month, cb.checked); render(); });
      });
    }
  }
  controls();
  render();
})();
