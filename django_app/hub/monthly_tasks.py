import calendar

PRIORITY_DEPARTMENTS = ["HR Dept.", "Finance Dept."]

TEMPLATES = {
    "HR Dept.": [
        ("Process monthly payroll & bKash disbursement", 5),
        ("Update employee attendance & leave log", 3),
        ("Track contract renewals due this month", 10),
    ],
    "Finance Dept.": [
        ("Close monthly accounts & reconcile ledgers", 5),
        ("Submit expense report to management", 7),
    ],
    "Webapp Development Dept.": [
        ("Deploy monthly Team Hub updates", 28),
        ("Review and close resolved bug tickets", 25),
    ],
    "Bioinformatics Research Dept.": [
        ("Submit monthly QA/QC summary report", 30),
        ("Archive completed pipeline batches", 28),
    ],
    "Promotion & Content Dept.": [
        ("Publish monthly content calendar", 28),
        ("Compile engagement performance report", 30),
    ],
    "Campus Co-ordination Dept.": [
        ("Submit campus visit summary report", 28),
        ("Confirm next month's seminar calendar", 25),
    ],
    "IBAI All Trainer Dept.": [
        ("Submit trainer performance review", 28),
        ("Update course curriculum log", 25),
    ],
    "DiLab R&D Dept.": [
        ("Submit R&D progress report", 28),
        ("Update BMPPD database changelog", 25),
    ],
}

DEFAULT_TEMPLATE = [
    ("Submit monthly department status report", 28),
    ("Review and update pending task list", 25),
]


def get_template(department_name):
    return TEMPLATES.get(department_name, DEFAULT_TEMPLATE)


def ensure_monthly_tasks(month_date):
    """Idempotently create this month's checklist rows for every department."""
    from .models import Department, DepartmentMonthlyTask

    last_day = calendar.monthrange(month_date.year, month_date.month)[1]
    for dept in Department.objects.all():
        for task_desc, day in get_template(dept.name):
            due_date = month_date.replace(day=min(day, last_day))
            DepartmentMonthlyTask.objects.get_or_create(
                department=dept, month=month_date, task=task_desc,
                defaults={"due_date": due_date},
            )


def ordered_departments(queryset):
    def sort_key(d):
        if d.name in PRIORITY_DEPARTMENTS:
            return (0, PRIORITY_DEPARTMENTS.index(d.name), "")
        return (1, 0, d.name)

    return sorted(queryset, key=sort_key)
