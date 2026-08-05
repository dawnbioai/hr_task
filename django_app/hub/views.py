from datetime import date

from dateutil.relativedelta import relativedelta
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.http import Http404, HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from .models import (
    Candidate,
    Contract,
    Department,
    DepartmentMonthlyTask,
    Division,
    Document,
    Employee,
    Meeting,
    Opening,
    RecruitmentRound,
    Task,
)
from .monthly_tasks import PRIORITY_DEPARTMENTS, ensure_monthly_tasks, ordered_departments


def home(request):
    return redirect("directory")


def _completed_months():
    tasks = Task.objects.filter(status=Task.Status.DONE).exclude(completed_date=None)
    return sorted({t.completed_date.strftime("%Y-%m") for t in tasks}, reverse=True)


def _status_counts(tasks):
    return {
        "todo": sum(1 for t in tasks if t.status == Task.Status.TODO),
        "progress": sum(1 for t in tasks if t.status == Task.Status.PROGRESS),
        "done": sum(1 for t in tasks if t.status == Task.Status.DONE),
    }


def _filter_by_month(tasks, month):
    if month == "all":
        return tasks
    return [
        t for t in tasks
        if t.status == Task.Status.DONE and t.completed_date
        and t.completed_date.strftime("%Y-%m") == month
    ]


@login_required
def directory(request):
    q = request.GET.get("q", "").strip()
    today = date.today()

    employees = Employee.objects.select_related("division", "department").filter(is_active=True)
    if q:
        employees = employees.filter(
            Q(name__icontains=q) | Q(role__icontains=q)
            | Q(department__name__icontains=q) | Q(division__name__icontains=q)
        )
    employees = employees.order_by("division__name", "department__name", "name")

    divisions = {}
    for emp in employees:
        divisions.setdefault(emp.division, []).append(emp)

    all_tasks = Task.objects.all()
    stats = {
        "employees": Employee.objects.filter(is_active=True).count(),
        "in_progress": all_tasks.filter(status=Task.Status.PROGRESS).count(),
        "todo": all_tasks.filter(status=Task.Status.TODO).count(),
        "overdue": all_tasks.exclude(status=Task.Status.DONE).filter(due__lt=today).count(),
    }

    open_tasks = Task.objects.exclude(status=Task.Status.DONE).select_related("employee").order_by("due")
    buckets = {"progress": [], "due_soon": [], "overdue": []}
    for t in open_tasks:
        diff = (t.due - today).days
        if diff < 0:
            buckets["overdue"].append(t)
        elif diff <= 2:
            buckets["due_soon"].append(t)
        else:
            buckets["progress"].append(t)

    recent_completed = list(
        Task.objects.filter(status=Task.Status.DONE)
        .select_related("employee").order_by("-completed_date")[:8]
    )

    task_overview = [
        {"key": "progress", "label": "In Progress", "dot": "#F0A93A", "bg": "#FDF1DF", "items": buckets["progress"]},
        {"key": "due_soon", "label": "Due Soon", "dot": "#F0A93A", "bg": "#FDF1DF", "items": buckets["due_soon"]},
        {"key": "completed", "label": "Completed", "dot": "#00C4B4", "bg": "#E3FBF8", "items": recent_completed},
        {"key": "overdue", "label": "Overdue", "dot": "#E8615C", "bg": "#FCE8E7", "items": buckets["overdue"]},
    ]

    all_employees = Employee.objects.filter(is_active=True).order_by("name")

    return render(request, "hub/directory.html", {
        "divisions": divisions,
        "q": q,
        "total": employees.count(),
        "stats": stats,
        "task_overview": task_overview,
        "today": today,
        "all_employees": all_employees,
    })


@require_POST
@login_required
def task_create(request):
    if not request.user.is_staff:
        raise Http404
    employee = get_object_or_404(Employee, pk=request.POST.get("employee"))
    description = (request.POST.get("description") or "").strip()
    status = request.POST.get("status") or Task.Status.TODO
    due = request.POST.get("due")
    if description and due:
        Task.objects.create(employee=employee, description=description, status=status, due=due)
    return redirect(request.POST.get("next") or "directory")


TASK_MOVE_TARGETS = {
    "progress": {"status": Task.Status.PROGRESS, "due_offset": 7, "completed_date": False},
    "completed": {"status": Task.Status.DONE, "due_offset": None, "completed_date": True},
    "due_soon": {"status": Task.Status.PROGRESS, "due_offset": 2, "completed_date": False},
    "overdue": {"status": Task.Status.PROGRESS, "due_offset": -2, "completed_date": False},
}


@require_POST
@login_required
def task_move(request, pk, column):
    if not request.user.is_staff:
        raise Http404
    task = get_object_or_404(Task, pk=pk)
    target = TASK_MOVE_TARGETS.get(column)
    if not target:
        raise Http404
    today = date.today()
    task.status = target["status"]
    if target["due_offset"] is not None:
        task.due = today + relativedelta(days=target["due_offset"])
    task.completed_date = today if target["completed_date"] else None
    task.save()
    return JsonResponse({"ok": True})


@login_required
def division_list(request):
    month = request.GET.get("month", "all")
    months = _completed_months()
    all_tasks = list(Task.objects.select_related("employee__division"))

    cards = []
    for div in Division.objects.all():
        rows = _filter_by_month(
            [t for t in all_tasks if t.employee.division_id == div.id], month
        )
        counts = _status_counts(rows)
        cards.append({"division": div, "counts": counts, "total": sum(counts.values())})

    return render(request, "hub/division_list.html", {
        "cards": cards, "months": months, "selected_month": month,
    })


@login_required
def division_detail(request, pk):
    division = get_object_or_404(Division, pk=pk)
    month = request.GET.get("month", "all")
    months = _completed_months()

    tasks = list(
        Task.objects.filter(employee__division=division)
        .select_related("employee", "employee__department")
        .order_by("due")
    )
    tasks = _filter_by_month(tasks, month)
    counts = _status_counts(tasks)

    return render(request, "hub/division_detail.html", {
        "division": division, "tasks": tasks, "counts": counts, "total": sum(counts.values()),
        "months": months, "selected_month": month,
    })


@login_required
def department_list(request):
    month = request.GET.get("month", "all")
    months = _completed_months()
    all_tasks = list(Task.objects.select_related("employee__department__division"))

    groups = []
    for div in Division.objects.all():
        depts = list(div.departments.all())
        if not depts:
            continue
        cards = []
        for dept in depts:
            rows = _filter_by_month(
                [t for t in all_tasks if t.employee.department_id == dept.id], month
            )
            counts = _status_counts(rows)
            cards.append({"department": dept, "counts": counts, "total": sum(counts.values())})
        groups.append({"division": div, "cards": cards})

    return render(request, "hub/department_list.html", {
        "groups": groups, "months": months, "selected_month": month,
    })


@login_required
def department_detail(request, pk):
    department = get_object_or_404(Department, pk=pk)
    month = request.GET.get("month", "all")
    months = _completed_months()

    tasks = list(
        Task.objects.filter(employee__department=department)
        .select_related("employee")
        .order_by("due")
    )
    tasks = _filter_by_month(tasks, month)
    counts = _status_counts(tasks)
    openings = department.openings.all()

    return render(request, "hub/department_detail.html", {
        "department": department, "tasks": tasks, "counts": counts, "total": sum(counts.values()),
        "openings": openings, "months": months, "selected_month": month,
    })


@login_required
def employee_detail(request, slug):
    employee = get_object_or_404(
        Employee.objects.select_related("division", "department", "contract"), slug=slug
    )
    tasks = employee.tasks.order_by("-due")
    return render(request, "hub/employee_detail.html", {
        "employee": employee, "tasks": tasks, "current_task": employee.current_task,
        "today": date.today(),
    })


@login_required
def completed_tasks(request):
    month = request.GET.get("month", "all")
    employee_id = request.GET.get("employee", "all")

    tasks = Task.objects.filter(status=Task.Status.DONE).select_related(
        "employee", "employee__division", "employee__department"
    ).order_by("-completed_date")
    months = _completed_months()
    employees = Employee.objects.filter(is_active=True).order_by("name")

    if month != "all":
        year, mon = map(int, month.split("-"))
        tasks = tasks.filter(completed_date__year=year, completed_date__month=mon)
    if employee_id != "all":
        tasks = tasks.filter(employee_id=employee_id)

    return render(request, "hub/completed.html", {
        "tasks": tasks, "months": months, "employees": employees,
        "selected_month": month, "selected_employee": employee_id, "count": tasks.count(),
    })


@login_required
def analysis(request):
    today = date.today()
    division_id = request.GET.get("division", "all")
    month = request.GET.get("month", "all")
    months = _completed_months()
    divisions = Division.objects.filter(employees__isnull=False).distinct().order_by("name")

    employees = Employee.objects.filter(is_active=True).order_by("name")
    if division_id != "all":
        employees = employees.filter(division_id=division_id)

    rows = []
    for emp in employees:
        tasks = list(emp.tasks.all())
        completed = [t for t in tasks if t.status == Task.Status.DONE]
        if month != "all":
            completed = [
                t for t in completed
                if t.completed_date and t.completed_date.strftime("%Y-%m") == month
            ]
        on_time = [t for t in completed if t.completed_date and t.completed_date <= t.due]
        late = [t for t in completed if t not in on_time]
        overdue_now = [t for t in tasks if t.status != Task.Status.DONE and t.due < today]
        rate = round(len(on_time) / len(completed) * 100) if completed else None
        regular = len(overdue_now) == 0 and (rate is None or rate >= 50)
        rows.append({
            "employee": emp, "completed": len(completed), "on_time": len(on_time),
            "late": len(late), "overdue_now": len(overdue_now), "rate": rate, "regular": regular,
        })

    regular_count = sum(1 for r in rows if r["regular"])
    overdue_total = sum(r["overdue_now"] for r in rows)
    completed_total = sum(r["completed"] for r in rows)
    period_label = "all time" if month == "all" else month

    return render(request, "hub/analysis.html", {
        "rows": rows, "divisions": divisions, "selected_division": division_id,
        "months": months, "selected_month": month,
        "stats": {
            "completed_total": completed_total, "regular_count": regular_count,
            "irregular_count": len(rows) - regular_count, "overdue_total": overdue_total,
            "employee_count": len(rows), "period_label": period_label,
        },
    })


@login_required
def contracts_list(request):
    contracts = Contract.objects.select_related("employee").order_by("employee__name")
    today = date.today()
    rows = []
    for c in contracts:
        days_left = (c.next_renewal - today).days
        rows.append({"contract": c, "days_left": days_left})
    return render(request, "hub/contracts.html", {"rows": rows, "today": today})


@login_required
def meetings_list(request):
    all_meetings = Meeting.objects.prefetch_related("divisions", "departments", "absent_employees").all()

    div_counts = {}
    absence_counts = {}
    for m in all_meetings:
        for d in m.divisions.all():
            div_counts[d.name] = div_counts.get(d.name, 0) + 1
        for e in m.absent_employees.all():
            absence_counts[e.name] = absence_counts.get(e.name, 0) + 1

    div_rows = sorted(div_counts.items(), key=lambda kv: -kv[1])
    abs_rows = sorted(absence_counts.items(), key=lambda kv: -kv[1])

    months = sorted({m.date.strftime("%Y-%m") for m in all_meetings}, reverse=True)
    departments = Department.objects.order_by("name")

    month = request.GET.get("month", "all")
    department_id = request.GET.get("department", "all")

    meetings = all_meetings
    if month != "all":
        year, mon = map(int, month.split("-"))
        meetings = meetings.filter(date__year=year, date__month=mon)
    if department_id != "all":
        meetings = meetings.filter(departments__id=department_id).distinct()

    return render(request, "hub/meetings.html", {
        "meetings": meetings,
        "stats": {
            "count": all_meetings.count(),
            "divisions_covered": len(div_counts),
            "total_absences": sum(absence_counts.values()),
        },
        "div_rows": div_rows, "abs_rows": abs_rows,
        "months": months, "departments": departments,
        "selected_month": month, "selected_department": department_id,
        "all_divisions": Division.objects.order_by("name"),
        "all_employees": Employee.objects.filter(is_active=True).order_by("name"),
    })


@require_POST
@login_required
def meeting_create(request):
    if not request.user.is_staff:
        raise Http404
    topic = (request.POST.get("topic") or "").strip()
    meeting_date = request.POST.get("date")
    points = (request.POST.get("points") or "").strip()
    division_ids = request.POST.getlist("divisions")
    absent_ids = request.POST.getlist("absent_employees")

    if topic and meeting_date:
        meeting = Meeting.objects.create(date=meeting_date, topic=topic, points=points)
        meeting.divisions.set(division_ids)
        meeting.absent_employees.set(absent_ids)
    return redirect("meetings_list")


def _month_range_options(back=5, forward=1):
    center = date.today().replace(day=1)
    months = [(center + relativedelta(months=i)).strftime("%Y-%m") for i in range(-back, forward + 1)]
    return sorted(set(months), reverse=True)


@login_required
def department_monthly_todo(request):
    month_str = request.GET.get("month", date.today().strftime("%Y-%m"))
    try:
        year, mon = map(int, month_str.split("-"))
        month_date = date(year, mon, 1)
    except (ValueError, TypeError):
        month_date = date.today().replace(day=1)
        month_str = month_date.strftime("%Y-%m")

    ensure_monthly_tasks(month_date)

    months = _month_range_options()
    if month_str not in months:
        months.insert(0, month_str)
        months.sort(reverse=True)

    groups = []
    for dept in ordered_departments(Department.objects.all()):
        tasks = DepartmentMonthlyTask.objects.filter(department=dept, month=month_date).order_by("due_date")
        groups.append({
            "department": dept, "tasks": tasks,
            "priority": dept.name in PRIORITY_DEPARTMENTS,
        })

    return render(request, "hub/department_monthly_todo.html", {
        "groups": groups, "months": months, "selected_month": month_str,
        "month_label": month_date.strftime("%B %Y"),
    })


@require_POST
@login_required
def department_monthly_todo_update(request, pk):
    if not request.user.is_staff:
        raise Http404
    item = get_object_or_404(DepartmentMonthlyTask, pk=pk)
    status = request.POST.get("status")
    if status in DepartmentMonthlyTask.Status.values:
        item.status = status
        item.save()
    next_url = request.POST.get("next") or "department_monthly_todo"
    return redirect(next_url)


@login_required
def recruitment(request):
    openings = Opening.objects.select_related("department", "department__division").all()
    rounds = RecruitmentRound.objects.prefetch_related("candidates").order_by("-date")
    return render(request, "hub/recruitment.html", {"openings": openings, "rounds": rounds})


@require_POST
@login_required
def candidate_status_update(request, pk):
    if not request.user.is_staff:
        raise Http404
    candidate = get_object_or_404(Candidate, pk=pk)
    status = request.POST.get("status")
    if status in Candidate.Status.values:
        candidate.status = status
        candidate.save()
    return redirect(request.POST.get("next") or "recruitment")


@require_POST
@login_required
def opening_status_update(request, pk):
    if not request.user.is_staff:
        raise Http404
    opening = get_object_or_404(Opening, pk=pk)
    status = request.POST.get("status")
    if status in Opening.Status.values:
        opening.status = status
        opening.save()
    return redirect(request.POST.get("next") or "recruitment")


@login_required
def documentation(request):
    groups = [
        {"key": key, "label": label,
         "docs": Document.objects.filter(category=key).select_related("department")}
        for key, label in Document.Category.choices
    ]
    departments = Department.objects.order_by("name")
    return render(request, "hub/documentation.html", {
        "groups": groups, "categories": Document.Category.choices, "departments": departments,
    })


@require_POST
@login_required
def document_create(request):
    if not request.user.is_staff:
        raise Http404
    category = request.POST.get("category")
    title = (request.POST.get("title") or "").strip()
    subtitle = (request.POST.get("subtitle") or "").strip()
    uploaded = request.FILES.get("file")

    if category not in Document.Category.values or not title:
        return redirect("documentation")

    kind = Document.Kind.PDF
    if uploaded and uploaded.name.lower().endswith(".txt"):
        kind = Document.Kind.TXT

    if category == Document.Category.DEPARTMENT_RULE:
        department = get_object_or_404(Department, pk=request.POST.get("department"))
        doc, _ = Document.objects.update_or_create(
            category=category, department=department,
            defaults={"title": title, "subtitle": subtitle, "kind": kind},
        )
        if uploaded:
            if doc.file:
                doc.file.delete(save=False)
            doc.file = uploaded
            doc.save()
    else:
        Document.objects.create(
            category=category, title=title, subtitle=subtitle, kind=kind,
            file=uploaded,
        )
    return redirect("documentation")


@login_required
def document_download(request, pk):
    doc = get_object_or_404(Document, pk=pk)
    if doc.file:
        return redirect(doc.file.url)
    content = "\n".join(doc.body_lines())
    safe_title = doc.title.replace("/", "-").replace("\\", "-")
    response = HttpResponse(content, content_type="text/plain; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{safe_title}.txt"'
    return response
