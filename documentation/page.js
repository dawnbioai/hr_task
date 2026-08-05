(function(){
  "use strict";
  function docCardHtml(entry){
    const kindLabel = entry.fileName ? (entry.fileName.split(".").pop()||"FILE").toUpperCase() : entry.kind;
    return `<div class="doc-card">
      <div class="doc-card-head">
        <div><div class="doc-title">${H.esc(entry.title)}</div><div class="doc-sub">${H.esc(entry.sub)}</div></div>
        <span class="chip">${kindLabel}</span>
      </div>
      <button class="doc-download-btn" data-doc-id="${entry.id}">Download</button>
    </div>`;
  }
  function render(){
    document.getElementById("cert-docs").innerHTML = DB.docCategory("certDocs").map(docCardHtml).join("");
    document.getElementById("email-docs").innerHTML = DB.docCategory("emailDocs").map(docCardHtml).join("");
    document.getElementById("general-rules-doc").innerHTML = DB.docCategory("generalRules").map(docCardHtml).join("");
    document.getElementById("department-rules-body").innerHTML = DB.docCategory("departmentRuleDocs").map(d=>
      `<tr><td>${H.esc(d.title)}</td><td style="text-align:right"><button class="btn-mini" data-doc-id="${d.id}">Download PDF</button></td></tr>`
    ).join("");
  }
  document.getElementById("doc-admin-note").textContent = Auth.isAdmin()
    ? "You're in Admin mode — add, edit or remove templates from the Admin panel."
    : "All documents here are sample placeholders — ask an Admin to replace them with approved files.";
  document.body.addEventListener("click", e=>{
    const btn = e.target.closest("[data-doc-id]");
    if(!btn) return;
    const entry = DB.findDoc(btn.dataset.docId);
    if(entry) H.handleDocDownload(entry);
  });
  render();
})();
