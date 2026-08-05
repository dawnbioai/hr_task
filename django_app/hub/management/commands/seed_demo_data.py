from django.core.management.base import BaseCommand
from django.db import transaction

from hub.models import (
    Candidate,
    Contract,
    Department,
    Division,
    Document,
    Employee,
    Meeting,
    Opening,
    RecruitmentRound,
    Task,
)

DIVISIONS = [
    "General", "Central Operation Division", "Growth Division",
    "DBS", "IBAI", "BSDS", "DiLab",
]

DEPARTMENT_DIVISION_MAP = {
    "HR Dept.": "Central Operation Division",
    "Promotion & Content Dept.": "Growth Division",
    "Webapp Development Dept.": "Central Operation Division",
    "No Department": "General",
    "Bioinformatics Research Dept.": "DBS",
    "Campus Co-ordination Dept.": "Growth Division",
    "Campus Leaders Management Dept.": "Growth Division",
    "Chittagong Branch": "Growth Division",
    "Clinical Service Dept.": "BSDS",
    "DOB National Fest Dept.": "Growth Division",
    "DiLab Project Dept.": "DiLab",
    "DiLab R&D Dept.": "DiLab",
    "Finance Dept.": "Central Operation Division",
    "General Service Dept.": "BSDS",
    "IBAI All Project Management Dept.": "IBAI",
    "IBAI All Trainer Dept.": "IBAI",
    "Internship Management Dept.": "Central Operation Division",
    "Lead Management Dept.": "Growth Division",
    "On Campus Seminar Dept.": "Growth Division",
    "Sales & Marketing Dept.": "Growth Division",
    "Short Course Management Dept.": "IBAI",
    "Social Media Ads Dept.": "Growth Division",
    "Thesis Support Management Dept.": "DBS",
    "Training Management Dept.": "IBAI",
}

EMPLOYEES = [
    dict(slug="mahin", name="Mahin Rahman", role="Bioinformatics Analyst", division="DBS",
         dept="Bioinformatics Research Dept.", bkash="01712-334561", salary=28000,
         email="mahin.rahman@dawnbio.org", phone="+880 1712-334561",
         responsibilities=[
             "Own QA for NGS and variant-calling pipelines before client delivery",
             "Validate sequencing batches against reference standards",
             "Maintain pipeline documentation and changelogs",
         ]),
    dict(slug="tasnia", name="Tasnia Ferdous", role="Campus Coordinator", division="Growth Division",
         dept="Campus Co-ordination Dept.", bkash="01823-119045", salary=22000,
         email="tasnia.ferdous@dawnbio.org", phone="+880 1823-119045",
         responsibilities=[
             "Plan and run on-campus seminars and outreach visits",
             "Coordinate with campus leaders and local student chapters",
             "Report attendance and engagement after each visit",
         ]),
    dict(slug="rakibul", name="Rakibul Islam", role="Full-Stack Developer", division="Central Operation Division",
         dept="Webapp Development Dept.", bkash="01911-478820", salary=35000,
         email="rakibul.islam@dawnbio.org", phone="+880 1911-478820",
         responsibilities=[
             "Build and maintain internal web applications, including this Team Hub",
             "Own the Campus CRM and GetSuperviz codebases",
             "Review deployment and backend integration work",
         ]),
    dict(slug="sumaiya", name="Sumaiya Chowdhury", role="HR Executive", division="Central Operation Division",
         dept="HR Dept.", bkash="01645-902213", salary=26000,
         email="sumaiya.chowdhury@dawnbio.org", phone="+880 1645-902213",
         responsibilities=[
             "Process monthly payroll and bKash disbursements",
             "Track contract renewals and onboarding paperwork",
             "Coordinate recruitment interviews with hiring managers",
         ]),
    dict(slug="arif", name="Arif Hossain", role="Research Assistant", division="DiLab",
         dept="DiLab R&D Dept.", bkash="01755-661038", salary=20000,
         email="arif.hossain@dawnbio.org", phone="+880 1755-661038",
         responsibilities=[
             "Maintain the BMPPD phytochemical database",
             "Run QC on genome batches submitted to DiLab",
             "Support R&D data entry and validation",
         ]),
    dict(slug="nusrat", name="Nusrat Jahan", role="Content & Promotion Lead", division="Growth Division",
         dept="Promotion & Content Dept.", bkash="01512-887764", salary=24000,
         email="nusrat.jahan@dawnbio.org", phone="+880 1512-887764",
         responsibilities=[
             "Plan the monthly content calendar for Kshudebarta",
             "Coordinate social media promotion across channels",
             "Track engagement and report monthly performance",
         ]),
    dict(slug="farhan", name="Farhan Kabir", role="Trainer", division="IBAI",
         dept="IBAI All Trainer Dept.", bkash="01988-223390", salary=23000,
         email="farhan.kabir@dawnbio.org", phone="+880 1988-223390",
         responsibilities=[
             "Deliver bioinformatics short-course modules",
             "Onboard and mentor new trainers",
             "Review and update course curriculum each term",
         ]),
    dict(slug="labiba", name="Labiba Noor", role="Outreach Coordinator", division="BSDS",
         dept="General Service Dept.", bkash="01678-540912", salary=19000,
         email="labiba.noor@dawnbio.org", phone="+880 1678-540912",
         responsibilities=[
             "Run the KhudeBigyan outreach page and posting schedule",
             "Coordinate weekly engagement reporting",
             "Support general BSDS service requests",
         ]),
]

TASKS = [
    ("mahin", "NGS pipeline validation — Client Batch #114", "progress", "2026-08-10", None),
    ("mahin", "Variant calling pipeline QA — Batch #110", "done", "2026-07-25", "2026-07-28"),
    ("mahin", "Sequence alignment audit — Batch #98", "done", "2026-06-22", "2026-06-20"),
    ("tasnia", "NSTU campus seminar — logistics finalization", "progress", "2026-08-08", None),
    ("tasnia", "CUET campus seminar — wrap-up report", "done", "2026-07-15", "2026-07-15"),
    ("tasnia", "Chittagong campus visit — attendance report", "done", "2026-06-15", "2026-06-18"),
    ("rakibul", "Team Hub — backend API integration", "progress", "2026-08-15", None),
    ("rakibul", "Campus CRM — lead import module", "done", "2026-07-20", "2026-07-22"),
    ("rakibul", "GetSuperviz — dashboard bugfix", "done", "2026-06-25", "2026-06-25"),
    ("sumaiya", "August payroll reconciliation", "todo", "2026-08-05", None),
    ("sumaiya", "July payroll processing", "done", "2026-07-31", "2026-07-31"),
    ("sumaiya", "June payroll processing", "done", "2026-06-30", "2026-06-30"),
    ("arif", "BMPPD database — phytochemical entry QA", "progress", "2026-08-12", None),
    ("arif", "Shada Shapla genome — QC batch 2", "done", "2026-08-01", "2026-08-01"),
    ("arif", "BMPPD — data entry batch 1", "done", "2026-06-14", "2026-06-10"),
    ("nusrat", "Kshudebarta — August content calendar", "todo", "2026-07-30", None),
    ("nusrat", "Kshudebarta — July content calendar", "done", "2026-07-28", "2026-07-30"),
    ("nusrat", "Kshudebarta — June content calendar", "done", "2026-06-25", "2026-06-29"),
    ("farhan", "Bioinformatics short course — module 3 prep", "progress", "2026-08-06", None),
    ("farhan", "IELTS trainer onboarding session", "done", "2026-07-20", "2026-07-18"),
    ("farhan", "Short course — curriculum review", "done", "2026-06-05", "2026-06-05"),
    ("labiba", "KhudeBigyan — weekly post scheduling", "todo", "2026-07-25", None),
    ("labiba", "KhudeBigyan — page launch checklist", "done", "2026-07-12", "2026-07-10"),
    ("labiba", "KhudeBigyan — June engagement report", "done", "2026-06-20", "2026-06-28"),

    ("mahin", "Draft Q4 NGS roadmap notes", "todo", "2026-08-28", None),
    ("rakibul", "Team Hub — write onboarding docs", "todo", "2026-08-30", None),
    ("sumaiya", "May payroll processing", "done", "2026-05-31", "2026-05-31"),
    ("nusrat", "Kshudebarta — May content calendar", "done", "2026-05-28", "2026-05-30"),
    ("farhan", "IBAI trainer pool — May check-in", "done", "2026-05-15", "2026-05-15"),
]

CONTRACTS = [
    ("mahin", "2025-02-10", "2026-02-10", "6-month cycle; NGS pipeline ownership agreed at joining."),
    ("tasnia", "2026-05-04", "2026-05-04", "First cycle; campus season deliverables reviewed quarterly."),
    ("rakibul", "2025-01-20", "2026-01-20", "Webapp Dept. lead; renewal pending sign-off."),
    ("sumaiya", "2024-11-12", "2026-02-12", "HR Dept.; probation waived after first cycle."),
    ("arif", "2026-06-01", "2026-06-01", "First cycle; DiLab R&D onboarding completed."),
    ("nusrat", "2025-09-15", "2026-03-15", "Content calendar ownership confirmed at joining."),
    ("farhan", "2025-03-01", "2026-03-01", "IBAI trainer pool; short-course load discussed."),
    ("labiba", "2026-01-05", "2026-01-05", "BSDS outreach; renewal overdue, follow up with HR."),
]

MEETINGS = [
    dict(date="2026-07-29", topic="Q3 Division Sync — DBS & DiLab", divisions=["DBS", "DiLab"],
         departments=["Bioinformatics Research Dept.", "DiLab R&D Dept."],
         points=[
             "Batch #114 timeline confirmed for mid-August",
             "DiLab R&D to share QC checklist with DBS",
             "Shared server access approved for both teams",
         ],
         absent=["Nusrat Jahan"]),
    dict(date="2026-07-20", topic="Growth Division — Campus Season Planning", divisions=["Growth Division"],
         departments=["Campus Co-ordination Dept.", "Promotion & Content Dept."],
         points=[
             "August–October campus visit calendar drafted",
             "New lead-capture form to launch with Campus CRM",
             "Content calendar aligned with seminar schedule",
         ],
         absent=[]),
    dict(date="2026-07-10", topic="HR & Payroll Review", divisions=["Central Operation Division"],
         departments=["HR Dept.", "Finance Dept."],
         points=[
             "July payroll closed on time for all 8 staff",
             "Two contracts flagged for renewal in August",
             "bKash disbursement process to move to weekly batching",
         ],
         absent=["Rakibul Islam"]),
    dict(date="2026-06-28", topic="IBAI Trainer Pool — Short Course Review", divisions=["IBAI"],
         departments=["IBAI All Trainer Dept.", "Short Course Management Dept."],
         points=[
             "Module 3 curriculum sign-off targeted for August",
             "New trainer onboarding checklist finalized",
             "Short-course load rebalanced across trainers",
         ],
         absent=["Farhan Kabir"]),
    dict(date="2026-07-05", topic="BSDS Outreach Check-in", divisions=["BSDS"],
         departments=["General Service Dept."],
         points=[
             "KhudeBigyan weekly posting cadence confirmed",
             "General Service Dept. requests logged and triaged",
             "Outreach reporting template updated",
         ],
         absent=["Labiba Noor", "Rakibul Islam"]),
]

OPENINGS = [
    ("Webapp Development Dept.", 2, "Interviewing"),
    ("Bioinformatics Research Dept.", 1, "Open"),
    ("IBAI All Trainer Dept.", 1, "Interviewing"),
    ("Campus Co-ordination Dept.", 2, "On Hold"),
    ("DiLab R&D Dept.", 1, "Open"),
]

RECRUITMENT_ROUNDS = [
    dict(position="Full-Stack Developer — Webapp Development Dept.", date="2026-08-07", time="11:00 AM",
         meet_link="https://meet.google.com/abc-defg-hij",
         candidates=[
             ("Imran Kabir", "3 yrs experience, MERN stack", "BUET", "selected"),
             ("Farzana Akter", "Fresh graduate, strong portfolio", "North South University", "waiting"),
         ]),
    dict(position="Bioinformatics Research Assistant — DBS", date="2026-08-09", time="3:30 PM",
         meet_link="https://meet.google.com/klm-nopq-rst",
         candidates=[
             ("Tanvir Ahmed", "MSc Biotechnology", "NSTU", "selected"),
         ]),
    dict(position="Trainer — IBAI All Trainer Dept.", date="2026-08-12", time="10:00 AM",
         meet_link="https://meet.google.com/uvw-xyzk-lmn",
         candidates=[
             ("Shreya Paul", "IELTS 8.0, 2 yrs teaching experience", "Dhaka University", "waiting"),
             ("Naeem Chowdhury", "Bioinformatics trainer, ex-BRAC", "BRAC University", "not_selected"),
         ]),
]

CERT_DOCS = [
    ("Certificate of Employment", "Confirms current employment status",
     ["Certificate of Employment (Sample Template)", "",
      "This is to certify that <Employee Name> is employed at Dawn of Bioinformatics Ltd.",
      "as <Designation>, <Division> Division, since <Join Date>.", "",
      "[Sample placeholder template — replace with approved wording during development.]"]),
    ("Internship Completion Certificate", "For interns finishing their term",
     ["Internship Completion Certificate (Sample Template)", "",
      "This is to certify that <Intern Name> successfully completed an internship at",
      "Dawn of Bioinformatics Ltd., <Department>, from <Start Date> to <End Date>.", "",
      "[Sample placeholder template — replace with approved wording during development.]"]),
    ("Recommendation Letter — Research Intern", "Reference letter for interns",
     ["Recommendation Letter (Sample Template)", "", "To Whom It May Concern,", "",
      "<Intern Name> worked as a Research Intern under <Department> at Dawn of Bioinformatics Ltd.", "",
      "[Sample placeholder template — replace with approved wording during development.]"]),
    ("Recommendation Letter — Full-Time Staff", "Reference letter for employees",
     ["Recommendation Letter (Sample Template)", "", "To Whom It May Concern,", "",
      "<Employee Name> worked as <Designation> at Dawn of Bioinformatics Ltd. from <Join Date>.", "",
      "[Sample placeholder template — replace with approved wording during development.]"]),
    ("Experience Certificate", "Full employment history summary",
     ["Experience Certificate (Sample Template)", "",
      "This is to certify that <Employee Name> was employed at Dawn of Bioinformatics Ltd.",
      "from <Join Date> to <End Date> as <Designation>.", "",
      "[Sample placeholder template — replace with approved wording during development.]"]),
    ("Relieving / No-Objection Letter", "On resignation or contract end",
     ["Relieving Letter (Sample Template)", "",
      "This is to certify Dawn of Bioinformatics Ltd. has no objection to <Employee Name>",
      "pursuing future opportunities, effective <Release Date>.", "",
      "[Sample placeholder template — replace with approved wording during development.]"]),
]

EMAIL_DOCS = [
    ("Interview Invitation", "Send after shortlisting a candidate",
     ["Subject: Interview Invitation — Dawn of Bioinformatics Ltd.", "", "Dear <Candidate Name>,", "",
      "Thank you for applying for the <Position> role at Dawn of Bioinformatics Ltd.",
      "We would like to invite you for an interview on <Date> at <Time> via Google Meet: <Link>.",
      "Please confirm your availability by replying to this email.", "",
      "Best regards,", "HR Team, Dawn of Bioinformatics Ltd."]),
    ("Offer Letter Email", "Send to selected candidates",
     ["Subject: Offer of Employment — Dawn of Bioinformatics Ltd.", "", "Dear <Candidate Name>,", "",
      "We are pleased to offer you the position of <Designation> at Dawn of Bioinformatics Ltd.,",
      "under the <Division> Division. Your start date will be <Join Date>.",
      "Please find the attached offer letter for full details, and confirm by <Deadline>.", "",
      "Best regards,", "HR Team, Dawn of Bioinformatics Ltd."]),
    ("Onboarding Welcome Email", "Send on the employee's first day",
     ["Subject: Welcome to Dawn of Bioinformatics Ltd.!", "", "Dear <Employee Name>,", "",
      "Welcome aboard! We're excited to have you join <Department> as <Designation>.",
      "Your first-week schedule and access details are attached. Reach out to HR any time.", "",
      "Best regards,", "HR Team, Dawn of Bioinformatics Ltd."]),
    ("Contract Renewal Notice", "Send ahead of a 6-month renewal",
     ["Subject: Contract Renewal — Dawn of Bioinformatics Ltd.", "", "Dear <Employee Name>,", "",
      "Your current contract cycle ends on <Contract End Date>. We would like to confirm your",
      "renewal for the next 6-month term. Please review the attached terms and confirm.", "",
      "Best regards,", "HR Team, Dawn of Bioinformatics Ltd."]),
    ("Resignation Acknowledgement", "Reply when someone resigns",
     ["Subject: Acknowledgement of Resignation", "", "Dear <Employee Name>,", "",
      "We acknowledge receipt of your resignation, with your last working day as <Last Working Day>.",
      "We will share the exit and settlement process shortly. Thank you for your contributions.", "",
      "Best regards,", "HR Team, Dawn of Bioinformatics Ltd."]),
]

GENERAL_RULES = [
    ("Employee Handbook — General Rules", "Working hours, leave, conduct, confidentiality",
     ["Dawn of Bioinformatics Ltd. — Employee Handbook (Sample Structure)", "", "Sections to include:",
      "- Working hours & attendance", "- Leave policy", "- Code of conduct",
      "- Confidentiality & IP", "- Termination & notice period", "",
      "[Sample placeholder template — replace with approved policy content during development.]"]),
]


class Command(BaseCommand):
    help = "Seed the database with the original DOB Team Hub demo data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush", action="store_true",
            help="Delete existing hub data before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["flush"]:
            for model in [Candidate, RecruitmentRound, Opening, Meeting, Contract, Task,
                          Document, Employee, Department, Division]:
                model.objects.all().delete()
            self.stdout.write(self.style.WARNING("Cleared existing hub data."))

        divisions = {}
        for name in DIVISIONS:
            div, _ = Division.objects.get_or_create(name=name)
            divisions[name] = div

        departments = {}
        for dept_name, div_name in DEPARTMENT_DIVISION_MAP.items():
            dept, _ = Department.objects.get_or_create(
                name=dept_name, defaults={"division": divisions[div_name]}
            )
            departments[dept_name] = dept

        employees = {}
        for e in EMPLOYEES:
            emp, _ = Employee.objects.update_or_create(
                slug=e["slug"],
                defaults=dict(
                    name=e["name"], role=e["role"],
                    division=divisions[e["division"]], department=departments[e["dept"]],
                    bkash=e["bkash"], salary=e["salary"], email=e["email"], phone=e["phone"],
                    responsibilities="\n".join(e["responsibilities"]),
                ),
            )
            employees[e["slug"]] = emp

        for emp_slug, desc, status, due, completed in TASKS:
            Task.objects.get_or_create(
                employee=employees[emp_slug], description=desc, due=due,
                defaults={"status": status, "completed_date": completed},
            )

        for emp_slug, joined, last_renewal, notes in CONTRACTS:
            Contract.objects.update_or_create(
                employee=employees[emp_slug],
                defaults={"joined": joined, "last_renewal": last_renewal, "notes": notes},
            )

        for m in MEETINGS:
            meeting, _ = Meeting.objects.get_or_create(
                date=m["date"], topic=m["topic"],
                defaults={"points": "\n".join(m["points"])},
            )
            meeting.divisions.set([divisions[d] for d in m["divisions"]])
            meeting.departments.set([departments[d] for d in m.get("departments", [])])
            absent_qs = Employee.objects.filter(name__in=m["absent"])
            meeting.absent_employees.set(absent_qs)

        for dept_name, positions, status in OPENINGS:
            Opening.objects.get_or_create(
                department=departments[dept_name],
                defaults={"positions": positions, "status": status},
            )

        for r in RECRUITMENT_ROUNDS:
            round_obj, _ = RecruitmentRound.objects.get_or_create(
                position=r["position"], date=r["date"],
                defaults={"time": r["time"], "meet_link": r["meet_link"]},
            )
            for name, background, university, status in r["candidates"]:
                Candidate.objects.get_or_create(
                    round=round_obj, name=name,
                    defaults={"background": background, "university": university, "status": status},
                )

        for title, sub, body in CERT_DOCS:
            Document.objects.get_or_create(
                category=Document.Category.CERTIFICATE, title=title,
                defaults={"subtitle": sub, "kind": Document.Kind.PDF, "body": "\n".join(body)},
            )
        for title, sub, body in EMAIL_DOCS:
            Document.objects.get_or_create(
                category=Document.Category.EMAIL_TEMPLATE, title=title,
                defaults={"subtitle": sub, "kind": Document.Kind.TXT, "body": "\n".join(body)},
            )
        for title, sub, body in GENERAL_RULES:
            Document.objects.get_or_create(
                category=Document.Category.GENERAL_RULE, title=title,
                defaults={"subtitle": sub, "kind": Document.Kind.PDF, "body": "\n".join(body)},
            )
        for dept_name, dept in departments.items():
            body = [
                f"{dept_name} — Department-Specific Rules (Sample Structure)", "",
                "Sections to include:", "- Role-specific responsibilities", "- Reporting line",
                "- Department-specific tools & access", "",
                "[Sample placeholder template — replace with approved content during development.]",
            ]
            Document.objects.get_or_create(
                category=Document.Category.DEPARTMENT_RULE, title=dept_name, department=dept,
                defaults={"subtitle": "Department-specific rules", "kind": Document.Kind.PDF,
                          "body": "\n".join(body)},
            )

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))
