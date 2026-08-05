(function(){
  "use strict";
  function render(){
    document.getElementById("contracts-body").innerHTML = DB.contracts().map(c=>{
      const e = DB.employee(c.emp);
      if(!e) return "";
      const next = new Date(c.lastRenewal);
      next.setMonth(next.getMonth()+6);
      const daysLeft = Math.round((next-DB.TODAY)/(1000*60*60*24));
      let badge;
      if(daysLeft < 0) badge = `<span class="badge badge-over">Overdue ${Math.abs(daysLeft)}d</span>`;
      else if(daysLeft <= 14) badge = `<span class="badge badge-soon">Due in ${daysLeft}d</span>`;
      else badge = `<span class="badge badge-active">Active</span>`;
      return `<tr>
        <td><a class="name-link" href="../employee/?id=${encodeURIComponent(e.id)}">${H.esc(e.name)}</a><div class="cell-sub">${H.esc(e.division)} · ${H.esc(e.dept)}</div></td>
        <td class="mono">${H.fmtDate(c.joined)}</td>
        <td class="mono">${next.toISOString().slice(0,10)}</td>
        <td>${badge}</td>
        <td style="max-width:280px">${H.esc(c.notes)}</td>
      </tr>`;
    }).join("") || `<tr><td colspan="5" style="color:var(--slate)">No contracts on file.</td></tr>`;
  }
  render();
})();
