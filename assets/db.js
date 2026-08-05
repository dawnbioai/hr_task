/* ================= DOB TEAM HUB — DATA LAYER =================
   Everything here lives in localStorage under DB_KEY. First run seeds
   from DEFAULT_DATA (same sample data as the original design preview).
   All pages read/write through the DB object so edits made in the
   Admin panel are immediately reflected on every View page.
================================================================= */
(function(global){
  "use strict";

  const DB_KEY = "dobhub_db_v1";
  const TODAY = new Date();
  TODAY.setHours(0,0,0,0);

  const DIVISIONS = ["General","Central Operation Division","Growth Division","DBS","IBAI","BSDS","DiLab"];

  const DEPARTMENTS = [
    "HR Dept.","Promotion & Content Dept.","Webapp Development Dept.","No Department",
    "Bioinformatics Research Dept.","Campus Co-ordination Dept.","Campus Leaders Management Dept.",
    "Chittagong Branch","Clinical Service Dept.","DOB National Fest Dept.","DiLab Project Dept.",
    "DiLab R&D Dept.","Finance Dept.","General Service Dept.","IBAI All Project Management Dept.",
    "IBAI All Trainer Dept.","Internship Management Dept.","Lead Management Dept.",
    "On Campus Seminar Dept.","Sales & Marketing Dept.","Short Course Management Dept.",
    "Social Media Ads Dept.","Thesis Support Management Dept.","Training Management Dept."
  ];

  const DEPARTMENT_DIVISION_MAP = {
    "HR Dept.":"Central Operation Division",
    "Promotion & Content Dept.":"Growth Division",
    "Webapp Development Dept.":"Central Operation Division",
    "No Department":"General",
    "Bioinformatics Research Dept.":"DBS",
    "Campus Co-ordination Dept.":"Growth Division",
    "Campus Leaders Management Dept.":"Growth Division",
    "Chittagong Branch":"Growth Division",
    "Clinical Service Dept.":"BSDS",
    "DOB National Fest Dept.":"Growth Division",
    "DiLab Project Dept.":"DiLab",
    "DiLab R&D Dept.":"DiLab",
    "Finance Dept.":"Central Operation Division",
    "General Service Dept.":"BSDS",
    "IBAI All Project Management Dept.":"IBAI",
    "IBAI All Trainer Dept.":"IBAI",
    "Internship Management Dept.":"Central Operation Division",
    "Lead Management Dept.":"Growth Division",
    "On Campus Seminar Dept.":"Growth Division",
    "Sales & Marketing Dept.":"Growth Division",
    "Short Course Management Dept.":"IBAI",
    "Social Media Ads Dept.":"Growth Division",
    "Thesis Support Management Dept.":"DBS",
    "Training Management Dept.":"IBAI"
  };

  function uid(prefix){ return prefix + "_" + Math.random().toString(36).slice(2,9); }

  function defaultData(){
    const EMPLOYEES = [
      {id:"mahin",   name:"Mahin Rahman",       role:"Bioinformatics Analyst",   division:"DBS",                       dept:"Bioinformatics Research Dept.",   bkash:"01712-334561", salary:28000,
        email:"mahin.rahman@dawnbio.org", phone:"+880 1712-334561",
        responsibilities:["Own QA for NGS and variant-calling pipelines before client delivery","Validate sequencing batches against reference standards","Maintain pipeline documentation and changelogs"]},
      {id:"tasnia",  name:"Tasnia Ferdous",     role:"Campus Coordinator",       division:"Growth Division",           dept:"Campus Co-ordination Dept.",      bkash:"01823-119045", salary:22000,
        email:"tasnia.ferdous@dawnbio.org", phone:"+880 1823-119045",
        responsibilities:["Plan and run on-campus seminars and outreach visits","Coordinate with campus leaders and local student chapters","Report attendance and engagement after each visit"]},
      {id:"rakibul", name:"Rakibul Islam",      role:"Full-Stack Developer",     division:"Central Operation Division",dept:"Webapp Development Dept.",        bkash:"01911-478820", salary:35000,
        email:"rakibul.islam@dawnbio.org", phone:"+880 1911-478820",
        responsibilities:["Build and maintain internal web applications, including this Team Hub","Own the Campus CRM and GetSuperviz codebases","Review deployment and backend integration work"]},
      {id:"sumaiya", name:"Sumaiya Chowdhury",  role:"HR Executive",             division:"Central Operation Division",dept:"HR Dept.",                        bkash:"01645-902213", salary:26000,
        email:"sumaiya.chowdhury@dawnbio.org", phone:"+880 1645-902213",
        responsibilities:["Process monthly payroll and bKash disbursements","Track contract renewals and onboarding paperwork","Coordinate recruitment interviews with hiring managers"]},
      {id:"arif",    name:"Arif Hossain",       role:"Research Assistant",       division:"DiLab",                     dept:"DiLab R&D Dept.",                  bkash:"01755-661038", salary:20000,
        email:"arif.hossain@dawnbio.org", phone:"+880 1755-661038",
        responsibilities:["Maintain the BMPPD phytochemical database","Run QC on genome batches submitted to DiLab","Support R&D data entry and validation"]},
      {id:"nusrat",  name:"Nusrat Jahan",       role:"Content & Promotion Lead", division:"Growth Division",           dept:"Promotion & Content Dept.",        bkash:"01512-887764", salary:24000,
        email:"nusrat.jahan@dawnbio.org", phone:"+880 1512-887764",
        responsibilities:["Plan the monthly content calendar for Kshudebarta","Coordinate social media promotion across channels","Track engagement and report monthly performance"]},
      {id:"farhan",  name:"Farhan Kabir",       role:"Trainer",                  division:"IBAI",                      dept:"IBAI All Trainer Dept.",           bkash:"01988-223390", salary:23000,
        email:"farhan.kabir@dawnbio.org", phone:"+880 1988-223390",
        responsibilities:["Deliver bioinformatics short-course modules","Onboard and mentor new trainers","Review and update course curriculum each term"]},
      {id:"labiba",  name:"Labiba Noor",        role:"Outreach Coordinator",     division:"BSDS",                      dept:"General Service Dept.",            bkash:"01678-540912", salary:19000,
        email:"labiba.noor@dawnbio.org", phone:"+880 1678-540912",
        responsibilities:["Run the KhudeBigyan outreach page and posting schedule","Coordinate weekly engagement reporting","Support general BSDS service requests"]}
    ];

    const TASKS = [
      {id:uid("task"), emp:"mahin",   task:"NGS pipeline validation — Client Batch #114",   status:"progress", due:"2026-08-10", date:null},
      {id:uid("task"), emp:"mahin",   task:"Variant calling pipeline QA — Batch #110",      status:"done",      due:"2026-07-25", date:"2026-07-28"},
      {id:uid("task"), emp:"mahin",   task:"Sequence alignment audit — Batch #98",          status:"done",      due:"2026-06-22", date:"2026-06-20"},

      {id:uid("task"), emp:"tasnia",  task:"NSTU campus seminar — logistics finalization",  status:"progress", due:"2026-08-08", date:null},
      {id:uid("task"), emp:"tasnia",  task:"CUET campus seminar — wrap-up report",          status:"done",      due:"2026-07-15", date:"2026-07-15"},
      {id:uid("task"), emp:"tasnia",  task:"Chittagong campus visit — attendance report",   status:"done",      due:"2026-06-15", date:"2026-06-18"},

      {id:uid("task"), emp:"rakibul", task:"Team Hub — backend API integration",            status:"progress", due:"2026-08-15", date:null},
      {id:uid("task"), emp:"rakibul", task:"Campus CRM — lead import module",               status:"done",      due:"2026-07-20", date:"2026-07-22"},
      {id:uid("task"), emp:"rakibul", task:"GetSuperviz — dashboard bugfix",                status:"done",      due:"2026-06-25", date:"2026-06-25"},

      {id:uid("task"), emp:"sumaiya", task:"August payroll reconciliation",                 status:"todo",      due:"2026-08-05", date:null},
      {id:uid("task"), emp:"sumaiya", task:"July payroll processing",                       status:"done",      due:"2026-07-31", date:"2026-07-31"},
      {id:uid("task"), emp:"sumaiya", task:"June payroll processing",                       status:"done",      due:"2026-06-30", date:"2026-06-30"},

      {id:uid("task"), emp:"arif",    task:"BMPPD database — phytochemical entry QA",       status:"progress", due:"2026-08-12", date:null},
      {id:uid("task"), emp:"arif",    task:"Shada Shapla genome — QC batch 2",              status:"done",      due:"2026-08-01", date:"2026-08-01"},
      {id:uid("task"), emp:"arif",    task:"BMPPD — data entry batch 1",                    status:"done",      due:"2026-06-14", date:"2026-06-10"},

      {id:uid("task"), emp:"nusrat",  task:"Kshudebarta — August content calendar",         status:"todo",      due:"2026-07-30", date:null},
      {id:uid("task"), emp:"nusrat",  task:"Kshudebarta — July content calendar",           status:"done",      due:"2026-07-28", date:"2026-07-30"},
      {id:uid("task"), emp:"nusrat",  task:"Kshudebarta — June content calendar",           status:"done",      due:"2026-06-25", date:"2026-06-29"},

      {id:uid("task"), emp:"farhan",  task:"Bioinformatics short course — module 3 prep",   status:"progress", due:"2026-08-06", date:null},
      {id:uid("task"), emp:"farhan",  task:"IELTS trainer onboarding session",              status:"done",      due:"2026-07-20", date:"2026-07-18"},
      {id:uid("task"), emp:"farhan",  task:"Short course — curriculum review",              status:"done",      due:"2026-06-05", date:"2026-06-05"},

      {id:uid("task"), emp:"labiba",  task:"KhudeBigyan — weekly post scheduling",          status:"todo",      due:"2026-07-25", date:null},
      {id:uid("task"), emp:"labiba",  task:"KhudeBigyan — page launch checklist",           status:"done",      due:"2026-07-12", date:"2026-07-10"},
      {id:uid("task"), emp:"labiba",  task:"KhudeBigyan — June engagement report",          status:"done",      due:"2026-06-20", date:"2026-06-28"}
    ];

    const CONTRACTS = [
      {emp:"mahin",   joined:"2025-02-10", lastRenewal:"2026-02-10", notes:"6-month cycle; NGS pipeline ownership agreed at joining."},
      {emp:"tasnia",  joined:"2026-05-04", lastRenewal:"2026-05-04", notes:"First cycle; campus season deliverables reviewed quarterly."},
      {emp:"rakibul", joined:"2025-01-20", lastRenewal:"2026-01-20", notes:"Webapp Dept. lead; renewal pending sign-off."},
      {emp:"sumaiya", joined:"2024-11-12", lastRenewal:"2026-02-12", notes:"HR Dept.; probation waived after first cycle."},
      {emp:"arif",    joined:"2026-06-01", lastRenewal:"2026-06-01", notes:"First cycle; DiLab R&D onboarding completed."},
      {emp:"nusrat",  joined:"2025-09-15", lastRenewal:"2026-03-15", notes:"Content calendar ownership confirmed at joining."},
      {emp:"farhan",  joined:"2025-03-01", lastRenewal:"2026-03-01", notes:"IBAI trainer pool; short-course load discussed."},
      {emp:"labiba",  joined:"2026-01-05", lastRenewal:"2026-01-05", notes:"BSDS outreach; renewal overdue, follow up with HR."}
    ];

    const MEETINGS = [
      {id:uid("mtg"), date:"2026-07-29", topic:"Q3 Division Sync — DBS & DiLab", division:"DBS, DiLab",
        points:["Batch #114 timeline confirmed for mid-August","DiLab R&D to share QC checklist with DBS","Shared server access approved for both teams"],
        absent:["Nusrat Jahan"]},
      {id:uid("mtg"), date:"2026-07-20", topic:"Growth Division — Campus Season Planning", division:"Growth Division",
        points:["August–October campus visit calendar drafted","New lead-capture form to launch with Campus CRM","Content calendar aligned with seminar schedule"],
        absent:[]},
      {id:uid("mtg"), date:"2026-07-10", topic:"HR & Payroll Review", division:"Central Operation Division",
        points:["July payroll closed on time for all 8 staff","Two contracts flagged for renewal in August","bKash disbursement process to move to weekly batching"],
        absent:["Rakibul Islam"]}
    ];

    const OPENINGS = [
      {id:uid("open"), dept:"Webapp Development Dept.",         division:"Central Operation Division", positions:2, status:"Interviewing"},
      {id:uid("open"), dept:"Bioinformatics Research Dept.",     division:"DBS",                       positions:1, status:"Open"},
      {id:uid("open"), dept:"IBAI All Trainer Dept.",            division:"IBAI",                      positions:1, status:"Interviewing"},
      {id:uid("open"), dept:"Campus Co-ordination Dept.",        division:"Growth Division",           positions:2, status:"On Hold"},
      {id:uid("open"), dept:"DiLab R&D Dept.",                   division:"DiLab",                     positions:1, status:"Open"}
    ];

    const RECRUITMENT_ROUNDS = [
      {id:uid("rnd"), position:"Full-Stack Developer — Webapp Development Dept.", date:"2026-08-07", time:"11:00 AM", meetLink:"https://meet.google.com/abc-defg-hij",
        candidates:[
          {id:uid("cand"), name:"Imran Kabir",    background:"3 yrs experience, MERN stack", university:"BUET", cv:""},
          {id:uid("cand"), name:"Farzana Akter",  background:"Fresh graduate, strong portfolio", university:"North South University", cv:""}
        ]},
      {id:uid("rnd"), position:"Bioinformatics Research Assistant — DBS", date:"2026-08-09", time:"3:30 PM", meetLink:"https://meet.google.com/klm-nopq-rst",
        candidates:[
          {id:uid("cand"), name:"Tanvir Ahmed",   background:"MSc Biotechnology", university:"NSTU", cv:""}
        ]},
      {id:uid("rnd"), position:"Trainer — IBAI All Trainer Dept.", date:"2026-08-12", time:"10:00 AM", meetLink:"https://meet.google.com/uvw-xyzk-lmn",
        candidates:[
          {id:uid("cand"), name:"Shreya Paul",       background:"IELTS 8.0, 2 yrs teaching experience", university:"Dhaka University", cv:""},
          {id:uid("cand"), name:"Naeem Chowdhury",   background:"Bioinformatics trainer, ex-BRAC", university:"BRAC University", cv:""}
        ]}
    ];

    const CERT_DOCS = [
      {id:"cert-employment", title:"Certificate of Employment", sub:"Confirms current employment status", kind:"PDF",
        body:["Certificate of Employment (Sample Template)","","This is to certify that <Employee Name> is employed at Dawn of Bioinformatics Ltd.","as <Designation>, <Division> Division, since <Join Date>.","","[Sample placeholder template — replace with approved wording during development.]"]},
      {id:"cert-internship", title:"Internship Completion Certificate", sub:"For interns finishing their term", kind:"PDF",
        body:["Internship Completion Certificate (Sample Template)","","This is to certify that <Intern Name> successfully completed an internship at","Dawn of Bioinformatics Ltd., <Department>, from <Start Date> to <End Date>.","","[Sample placeholder template — replace with approved wording during development.]"]},
      {id:"rec-intern", title:"Recommendation Letter — Research Intern", sub:"Reference letter for interns", kind:"PDF",
        body:["Recommendation Letter (Sample Template)","","To Whom It May Concern,","","<Intern Name> worked as a Research Intern under <Department> at Dawn of Bioinformatics Ltd.","","[Sample placeholder template — replace with approved wording during development.]"]},
      {id:"rec-staff", title:"Recommendation Letter — Full-Time Staff", sub:"Reference letter for employees", kind:"PDF",
        body:["Recommendation Letter (Sample Template)","","To Whom It May Concern,","","<Employee Name> worked as <Designation> at Dawn of Bioinformatics Ltd. from <Join Date>.","","[Sample placeholder template — replace with approved wording during development.]"]},
      {id:"exp-cert", title:"Experience Certificate", sub:"Full employment history summary", kind:"PDF",
        body:["Experience Certificate (Sample Template)","","This is to certify that <Employee Name> was employed at Dawn of Bioinformatics Ltd.","from <Join Date> to <End Date> as <Designation>.","","[Sample placeholder template — replace with approved wording during development.]"]},
      {id:"relieving", title:"Relieving / No-Objection Letter", sub:"On resignation or contract end", kind:"PDF",
        body:["Relieving Letter (Sample Template)","","This is to certify Dawn of Bioinformatics Ltd. has no objection to <Employee Name>","pursuing future opportunities, effective <Release Date>.","","[Sample placeholder template — replace with approved wording during development.]"]}
    ];

    const EMAIL_DOCS = [
      {id:"email-interview", title:"Interview Invitation", sub:"Send after shortlisting a candidate", kind:"TXT",
        body:["Subject: Interview Invitation — Dawn of Bioinformatics Ltd.","","Dear <Candidate Name>,","","Thank you for applying for the <Position> role at Dawn of Bioinformatics Ltd.","We would like to invite you for an interview on <Date> at <Time> via Google Meet: <Link>.","Please confirm your availability by replying to this email.","","Best regards,","HR Team, Dawn of Bioinformatics Ltd."]},
      {id:"email-offer", title:"Offer Letter Email", sub:"Send to selected candidates", kind:"TXT",
        body:["Subject: Offer of Employment — Dawn of Bioinformatics Ltd.","","Dear <Candidate Name>,","","We are pleased to offer you the position of <Designation> at Dawn of Bioinformatics Ltd.,","under the <Division> Division. Your start date will be <Join Date>.","Please find the attached offer letter for full details, and confirm by <Deadline>.","","Best regards,","HR Team, Dawn of Bioinformatics Ltd."]},
      {id:"email-onboard", title:"Onboarding Welcome Email", sub:"Send on the employee's first day", kind:"TXT",
        body:["Subject: Welcome to Dawn of Bioinformatics Ltd.!","","Dear <Employee Name>,","","Welcome aboard! We're excited to have you join <Department> as <Designation>.","Your first-week schedule and access details are attached. Reach out to HR any time.","","Best regards,","HR Team, Dawn of Bioinformatics Ltd."]},
      {id:"email-renewal", title:"Contract Renewal Notice", sub:"Send ahead of a 6-month renewal", kind:"TXT",
        body:["Subject: Contract Renewal — Dawn of Bioinformatics Ltd.","","Dear <Employee Name>,","","Your current contract cycle ends on <Contract End Date>. We would like to confirm your","renewal for the next 6-month term. Please review the attached terms and confirm.","","Best regards,","HR Team, Dawn of Bioinformatics Ltd."]},
      {id:"email-resign", title:"Resignation Acknowledgement", sub:"Reply when someone resigns", kind:"TXT",
        body:["Subject: Acknowledgement of Resignation","","Dear <Employee Name>,","","We acknowledge receipt of your resignation, with your last working day as <Last Working Day>.","We will share the exit and settlement process shortly. Thank you for your contributions.","","Best regards,","HR Team, Dawn of Bioinformatics Ltd."]}
    ];

    const GENERAL_RULES = [{id:"general-rules", title:"Employee Handbook — General Rules", sub:"Working hours, leave, conduct, confidentiality", kind:"PDF",
      body:["Dawn of Bioinformatics Ltd. — Employee Handbook (Sample Structure)","","Sections to include:","- Working hours & attendance","- Leave policy","- Code of conduct","- Confidentiality & IP","- Termination & notice period","","[Sample placeholder template — replace with approved policy content during development.]"]}];

    const DEPARTMENT_RULE_DOCS = DEPARTMENTS.map((dep,i)=>({
      id:"dept-rules-"+i, title:dep, sub:"Department-specific rules", kind:"PDF",
      body:[dep+" — Department-Specific Rules (Sample Structure)","","Sections to include:","- Role-specific responsibilities","- Reporting line","- Department-specific tools & access","","[Sample placeholder template — replace with approved content during development.]"]
    }));

    return {
      employees: EMPLOYEES,
      tasks: TASKS,
      contracts: CONTRACTS,
      meetings: MEETINGS,
      openings: OPENINGS,
      recruitmentRounds: RECRUITMENT_ROUNDS,
      certDocs: CERT_DOCS,
      emailDocs: EMAIL_DOCS,
      generalRules: GENERAL_RULES,
      departmentRuleDocs: DEPARTMENT_RULE_DOCS,
      payrollPaid: { }
    };
  }

  function normalize(s){
    (s.employees||[]).forEach(e=>{
      if(e.email===undefined) e.email = "";
      if(e.phone===undefined) e.phone = "";
      if(!Array.isArray(e.responsibilities)) e.responsibilities = e.responsibilities ? [e.responsibilities] : [];
    });
    (s.recruitmentRounds||[]).forEach(r=>{
      (r.candidates||[]).forEach(c=>{
        if(c.background===undefined) c.background = c.note || "";
        if(c.university===undefined) c.university = "";
        if(c.cv===undefined) c.cv = "";
      });
    });
    return s;
  }

  function load(){
    try{
      const raw = localStorage.getItem(DB_KEY);
      if(raw) return normalize(JSON.parse(raw));
    }catch(e){ console.warn("DOB Hub: could not read saved data, reseeding.", e); }
    const seeded = defaultData();
    save(seeded);
    return seeded;
  }
  function save(state){ localStorage.setItem(DB_KEY, JSON.stringify(state)); }

  let state = load();

  function persist(){ save(state); }

  const DB = {
    TODAY, DIVISIONS, DEPARTMENTS, DEPARTMENT_DIVISION_MAP,
    divisionForDept(dept){ return DEPARTMENT_DIVISION_MAP[dept] || "General"; },

    data(){ return state; },
    resetDemoData(){ state = defaultData(); persist(); },
    replaceAll(newState){ state = normalize(newState); persist(); },

    // ---------- employees ----------
    employees(){ return state.employees; },
    employee(id){ return state.employees.find(e=>e.id===id) || null; },
    addEmployee(e){
      e.id = e.id || uid("emp");
      state.employees.push(e); persist(); return e;
    },
    updateEmployee(id, patch){
      const e = this.employee(id); if(!e) return null;
      Object.assign(e, patch); persist(); return e;
    },
    deleteEmployee(id){
      state.employees = state.employees.filter(e=>e.id!==id);
      state.tasks = state.tasks.filter(t=>t.emp!==id);
      state.contracts = state.contracts.filter(c=>c.emp!==id);
      persist();
    },

    // ---------- tasks ----------
    tasks(){ return state.tasks; },
    tasksFor(empId){ return state.tasks.filter(t=>t.emp===empId); },
    addTask(t){ t.id = t.id || uid("task"); state.tasks.push(t); persist(); return t; },
    updateTask(id, patch){
      const t = state.tasks.find(x=>x.id===id); if(!t) return null;
      Object.assign(t, patch); persist(); return t;
    },
    deleteTask(id){ state.tasks = state.tasks.filter(t=>t.id!==id); persist(); },

    // ---------- contracts ----------
    contracts(){ return state.contracts; },
    contractFor(empId){ return state.contracts.find(c=>c.emp===empId) || null; },
    upsertContract(empId, patch){
      let c = this.contractFor(empId);
      if(!c){ c = {emp:empId, joined:"", lastRenewal:"", notes:""}; state.contracts.push(c); }
      Object.assign(c, patch); persist(); return c;
    },

    // ---------- meetings ----------
    meetings(){ return state.meetings; },
    addMeeting(m){ m.id = m.id || uid("mtg"); state.meetings.push(m); persist(); return m; },
    updateMeeting(id, patch){
      const m = state.meetings.find(x=>x.id===id); if(!m) return null;
      Object.assign(m, patch); persist(); return m;
    },
    deleteMeeting(id){ state.meetings = state.meetings.filter(m=>m.id!==id); persist(); },

    // ---------- openings ----------
    openings(){ return state.openings; },
    addOpening(o){ o.id = o.id || uid("open"); state.openings.push(o); persist(); return o; },
    updateOpening(id, patch){
      const o = state.openings.find(x=>x.id===id); if(!o) return null;
      Object.assign(o, patch); persist(); return o;
    },
    deleteOpening(id){ state.openings = state.openings.filter(o=>o.id!==id); persist(); },

    // ---------- recruitment rounds ----------
    rounds(){ return state.recruitmentRounds; },
    addRound(r){ r.id = r.id || uid("rnd"); r.candidates = r.candidates || []; state.recruitmentRounds.push(r); persist(); return r; },
    updateRound(id, patch){
      const r = state.recruitmentRounds.find(x=>x.id===id); if(!r) return null;
      Object.assign(r, patch); persist(); return r;
    },
    deleteRound(id){ state.recruitmentRounds = state.recruitmentRounds.filter(r=>r.id!==id); persist(); },
    addCandidate(roundId, cand){
      const r = state.recruitmentRounds.find(x=>x.id===roundId); if(!r) return null;
      cand.id = cand.id || uid("cand"); r.candidates.push(cand); persist(); return cand;
    },
    deleteCandidate(roundId, candId){
      const r = state.recruitmentRounds.find(x=>x.id===roundId); if(!r) return;
      r.candidates = r.candidates.filter(c=>c.id!==candId); persist();
    },

    // ---------- payroll ----------
    isPaid(empId, month){
      const key = empId+"|"+month;
      if(state.payrollPaid[key] === undefined) return month === "2026-07";
      return !!state.payrollPaid[key];
    },
    setPaid(empId, month, paid){
      state.payrollPaid[empId+"|"+month] = !!paid; persist();
    },

    // ---------- documents ----------
    docCategory(cat){ return state[cat] || []; },
    findDoc(id){
      return [...state.certDocs, ...state.emailDocs, ...state.generalRules, ...state.departmentRuleDocs].find(d=>d.id===id) || null;
    },
    addDoc(cat, doc){ doc.id = doc.id || uid("doc"); state[cat].push(doc); persist(); return doc; },
    updateDoc(cat, id, patch){
      const d = state[cat].find(x=>x.id===id); if(!d) return null;
      Object.assign(d, patch); persist(); return d;
    },
    deleteDoc(cat, id){ state[cat] = state[cat].filter(d=>d.id!==id); persist(); }
  };

  /* ================= SHARED HELPERS ================= */
  const STATUS_LABEL = {todo:"To-Do", progress:"In Progress", done:"Done"};
  const STATUS_CLASS = {todo:"status-todo", progress:"status-progress", done:"status-done"};
  const AVATAR_TINTS = ["#E3FBF8","#FDF1DF","#EFEBFB","#EEF1F5"];
  const AVATAR_TEXT  = ["#046B62","#946318","#5B4FA8","#42506B"];

  function initials(name){ return name.split(" ").map(p=>p[0]).slice(0,2).join(""); }
  function tintFor(name){ let h=0; for(const c of name) h+=c.charCodeAt(0); return h % AVATAR_TINTS.length; }
  function fmtDate(iso){ if(!iso) return "—"; const d=new Date(iso+"T00:00:00"); return d.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}); }
  function fmtMoney(n){ return "৳" + Number(n||0).toLocaleString("en-IN"); }
  function monthKey(iso){ return iso ? iso.slice(0,7) : null; }
  function monthLabel(key){ const [y,m]=key.split("-"); return new Date(y,m-1,1).toLocaleDateString("en-GB",{month:"long",year:"numeric"}); }
  function daysBetween(a,b){ return Math.round((new Date(a)-new Date(b))/(1000*60*60*24)); }
  function allMonths(){ return [...new Set(DB.tasks().filter(t=>t.status==="done" && t.date).map(t=>monthKey(t.date)))].sort().reverse(); }
  function monthOptionsHtml(){ return `<option value="all">All months</option>` + allMonths().map(m=>`<option value="${m}">${monthLabel(m)}</option>`).join(""); }

  function toCSV(rows){ return rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n"); }
  function downloadCSV(filename, rows){
    const blob = new Blob([toCSV(rows)], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  function downloadText(filename, content){
    const blob = new Blob([content], {type:"text/plain;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  function downloadPDF(filename, lines){
    if(!global.jspdf){ downloadText(filename.replace(/\.pdf$/i,".txt"), lines.join("\n")); return; }
    const { jsPDF } = global.jspdf;
    const doc = new jsPDF();
    doc.setDrawColor(0,196,180); doc.setLineWidth(1); doc.line(18,20,192,20);
    doc.setFont("helvetica","normal"); doc.setFontSize(10.5); doc.setTextColor(20,25,40);
    let y = 32;
    lines.forEach((line,i)=>{
      if(i===0){ doc.setFont("helvetica","bold"); doc.setFontSize(15); doc.text(line,18,y); doc.setFont("helvetica","normal"); doc.setFontSize(10.5); y+=11; return; }
      if(line===""){ y+=5; return; }
      doc.splitTextToSize(line,172).forEach(w=>{ doc.text(w,18,y); y+=6.5; });
    });
    doc.setFontSize(8.5); doc.setTextColor(150);
    doc.text("Generated from DOB Team Hub.",18,285);
    doc.save(filename);
  }
  function handleDocDownload(entry){
    if(entry.fileData){
      const a = document.createElement("a");
      a.href = entry.fileData; a.download = entry.fileName || (entry.title+".bin");
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      return;
    }
    if(entry.kind==="PDF") downloadPDF(entry.title.replace(/[\/\\]/g,"-")+".pdf", entry.body||[]);
    else downloadText(entry.title.replace(/[\/\\]/g,"-")+".txt", (entry.body||[]).join("\n"));
  }
  function parseCSV(text){
    const lines = text.split(/\r?\n/).map(l=>l.replace(/\r$/,"")).filter(l=>l.trim().length);
    const rows = lines.map(line=>{
      const cells = []; let cur = "", inQuotes = false;
      for(let i=0;i<line.length;i++){
        const ch = line[i];
        if(ch === '"'){ inQuotes = !inQuotes; continue; }
        if(ch === ',' && !inQuotes){ cells.push(cur.trim()); cur=""; continue; }
        cur += ch;
      }
      cells.push(cur.trim());
      return cells;
    });
    if(rows.length && /^name$/i.test(rows[0][0]||"")) rows.shift();
    return rows;
  }
  function truncate(str, n){ str = String(str||""); return str.length>n ? str.slice(0,n-1)+"…" : str; }
  function fileToDataURL(file){
    return new Promise((resolve,reject)=>{
      const reader = new FileReader();
      reader.onload = ()=>resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  function chip(text){ return `<span class="chip">${text}</span>`; }
  function statusChip(status){ return `<span class="chip ${STATUS_CLASS[status]}"><span class="status-dot"></span>${STATUS_LABEL[status]}</span>`; }
  function segBarHtml(segments){
    const total = segments.reduce((s,x)=>s+x.v,0) || 1;
    return `<div class="seg-bar">${segments.map(s=>`<div class="seg-bar-seg" style="width:${s.v/total*100}%;background:${s.c}"></div>`).join("")}</div>`;
  }
  function dueNoteHtml(task){
    if(!task) return "";
    const diff = daysBetween(task.due, TODAY);
    if(diff < 0) return `<div class="due-note late">Overdue by ${Math.abs(diff)} day${Math.abs(diff)===1?"":"s"}</div>`;
    if(diff <= 3) return `<div class="due-note soon">Due in ${diff} day${diff===1?"":"s"}</div>`;
    return `<div class="due-note ok">Due ${fmtDate(task.due)}</div>`;
  }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function currentTaskFor(empId){
    const open = DB.tasks().filter(t=>t.emp===empId && t.status!=="done").sort((a,b)=>a.due.localeCompare(b.due));
    return open[0] || null;
  }

  global.DB = DB;
  global.H = {
    STATUS_LABEL, STATUS_CLASS, AVATAR_TINTS, AVATAR_TEXT,
    initials, tintFor, fmtDate, fmtMoney, monthKey, monthLabel, daysBetween,
    allMonths, monthOptionsHtml, toCSV, downloadCSV, downloadText, downloadPDF,
    handleDocDownload, chip, statusChip, segBarHtml, dueNoteHtml, esc, currentTaskFor,
    parseCSV, truncate, fileToDataURL
  };
})(window);
