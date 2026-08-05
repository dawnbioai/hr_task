/* ================= DOB TEAM HUB — SHARED NAV/TOPBAR =================
   Each page sets window.ROOT (relative path back to the site root),
   window.PAGE_ID (which nav link is active), window.PAGE_TITLE and
   window.PAGE_SUBTITLE before including this script.
======================================================================= */
(function(){
  "use strict";
  const ROOT = window.ROOT || "./";
  const PAGE_ID = window.PAGE_ID || "";
  const isAdmin = window.Auth ? window.Auth.isAdmin() : false;

  const NAV_GROUPS = [
    {label:"People", items:[
      {id:"directory", href:"directory/", title:"Directory", icon:'<rect x="3" y="4" width="7" height="7" rx="1.5"/><rect x="14" y="4" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'},
      {id:"completed", href:"completed/", title:"Completed Tasks", icon:'<path d="M4 6h11M4 12h7M4 18h11"/><path d="M17 15l2.5 2.5L23 13"/>'},
      {id:"analysis", href:"analysis/", title:"Analysis", icon:'<path d="M4 19V10M11 19V5M18 19v-7"/><path d="M2.5 19h19"/>'},
      {id:"recruitment", href:"recruitment/", title:"Recruitment", icon:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6"/><path d="M18 8h4M20 6v4"/>'}
    ]},
    {label:"Workload", items:[
      {id:"division", href:"division/", title:"By Division", icon:'<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>'},
      {id:"department", href:"department/", title:"By Department", icon:'<path d="M3 7l3-3h5l2 2h8v12a1 1 0 01-1 1H4a1 1 0 01-1-1V7z"/>'}
    ]},
    {label:"Admin", items:[
      {id:"payroll", href:"payroll/", title:"Payroll", icon:'<rect x="2.5" y="6" width="19" height="13" rx="2"/><circle cx="12" cy="12.5" r="2.6"/>'},
      {id:"contracts", href:"contracts/", title:"Contracts", icon:'<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M8 2.5v3M16 2.5v3M4 9.5h16"/>'},
      {id:"documentation", href:"documentation/", title:"Documentation", icon:'<path d="M6 3h9l4 4v14a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M14 3v4h4M8 12h8M8 16h8M8 8h3"/>'}
    ]},
    {label:"Collaboration", items:[
      {id:"meetings", href:"meetings/", title:"Meetings", icon:'<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M2.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5"/><path d="M14.7 15.2c2.4.3 4.3 2.2 4.3 4.8"/>'}
    ]}
  ];

  function navHtml(){
    return NAV_GROUPS.map(g=>`
      <div class="nav-group">
        <div class="nav-group-label">${g.label}</div>
        ${g.items.map(item=>`
          <a class="nav-link${item.id===PAGE_ID?" active":""}" href="${ROOT}${item.href}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${item.icon}</svg>
            <span>${item.title}</span>
          </a>`).join("")}
      </div>`).join("");
  }

  function sidebarHtml(){
    return `
    <aside class="sidebar">
      <a class="brand" href="${ROOT}directory/" style="cursor:pointer">
        <div class="brand-mark">D</div>
        <div class="brand-text">
          <div class="brand-word">DOB Team Hub</div>
          <div class="brand-sub">Employee &amp; Task Management</div>
        </div>
      </a>
      <nav class="navlist">${navHtml()}</nav>
      ${isAdmin
        ? `<div class="mode-pill mode-admin">Admin mode <a href="${ROOT}admin/panel/">Panel</a></div>`
        : `<div class="mode-pill mode-view">View mode <a href="${ROOT}admin/">Admin login</a></div>`}
      <div class="sidebar-foot mono">DOB Team Hub · v1.0</div>
    </aside>`;
  }

  function topbarHtml(){
    const title = window.PAGE_TITLE || "";
    const subtitle = window.PAGE_SUBTITLE || "";
    const todayStr = DB.TODAY.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
    return `
    <header class="topbar">
      <div>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>
      <div class="today-pill mono">Today · ${todayStr}</div>
    </header>`;
  }

  // This script tag sits after #sidebar-mount/#topbar-mount in the DOM, so
  // both elements already exist by the time this runs — no need to wait
  // for DOMContentLoaded (and doing so risks missing it, since the event
  // can only fire once, after this very script has finished executing).
  const sidebarMount = document.getElementById("sidebar-mount");
  const topbarMount = document.getElementById("topbar-mount");
  if(sidebarMount) sidebarMount.outerHTML = sidebarHtml();
  if(topbarMount) topbarMount.outerHTML = topbarHtml();
})();
