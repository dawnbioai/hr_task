/* ================= DOB TEAM HUB — ADMIN GATE =================
   This site is fully static (no server), so this is a soft, client-side
   gate: fine for a small trusted team, NOT a real security boundary
   (anyone with browser dev tools can read this file or flip the flag).
   Change the password below before sharing this site with your team.
================================================================= */
(function(global){
  "use strict";
  const ADMIN_PASSWORD = "DOBadmin2026";
  const SESSION_KEY = "dobhub_admin_session";

  const Auth = {
    isAdmin(){ return sessionStorage.getItem(SESSION_KEY) === "1"; },
    login(password){
      if(password === ADMIN_PASSWORD){
        sessionStorage.setItem(SESSION_KEY, "1");
        return true;
      }
      return false;
    },
    logout(){ sessionStorage.removeItem(SESSION_KEY); }
  };

  global.Auth = Auth;
})(window);
