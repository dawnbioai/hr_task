import csv
import io
import secrets
import string
from datetime import date

from django import forms
from django.contrib import admin, messages
from django.contrib.auth import get_user_model
from django.shortcuts import redirect, render
from django.urls import path

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

admin.site.site_header = "DOB Team Hub Administration"
admin.site.site_title = "DOB Team Hub Admin"
admin.site.index_title = "Manage employees, tasks & records"

# Group models in a logical (non-alphabetical) order on the admin index page.
MODEL_ORDER = [
    "Employee", "Division", "Department", "Task", "Contract", "Meeting",
    "Opening", "Recruitment round", "Candidate", "Document", "Department monthly task",
]
_order_lookup = {name: i for i, name in enumerate(MODEL_ORDER)}
_get_app_list = admin.site.get_app_list


def _ordered_get_app_list(self, request, app_label=None):
    app_list = _get_app_list(request, app_label=app_label)
    for app in app_list:
        if app["app_label"] == "hub":
            app["models"].sort(key=lambda m: _order_lookup.get(m["name"], 999))
    return app_list


admin.site.get_app_list = _ordered_get_app_list.__get__(admin.site)


@admin.register(Division)
class DivisionAdmin(admin.ModelAdmin):
    list_display = ("name", "order", "department_count", "employee_count")
    list_editable = ("order",)
    search_fields = ("name",)

    def department_count(self, obj):
        return obj.departments.count()

    def employee_count(self, obj):
        return obj.employees.count()


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name", "division", "employee_count")
    list_filter = ("division",)
    search_fields = ("name",)

    def employee_count(self, obj):
        return obj.employees.count()


class TaskInline(admin.TabularInline):
    model = Task
    extra = 0


class ContractInline(admin.StackedInline):
    model = Contract
    extra = 0


@admin.action(description="Create login credentials for selected employees")
def create_login_credentials(modeladmin, request, queryset):
    User = get_user_model()
    for employee in queryset:
        if employee.user_id:
            modeladmin.message_user(
                request, f"{employee.name} already has a login ({employee.user.username}) — skipped.",
                level=messages.WARNING,
            )
            continue
        username = employee.slug
        password = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(10))
        user = User.objects.create_user(username=username, password=password, email=employee.email or "")
        employee.user = user
        employee.save(update_fields=["user"])
        modeladmin.message_user(
            request,
            f'Created login for {employee.name}: username "{username}", password "{password}" '
            f'— copy this now and hand it to them, it will not be shown again.',
            level=messages.SUCCESS,
        )


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("name", "role", "department", "division", "salary", "bkash", "has_login", "is_active")
    list_filter = ("division", "department", "is_active")
    search_fields = ("name", "role", "email", "phone", "bkash")
    prepopulated_fields = {"slug": ("name",)}
    autocomplete_fields = ("user",)
    inlines = [ContractInline, TaskInline]
    actions = [create_login_credentials]

    @admin.display(boolean=True, description="Has login")
    def has_login(self, obj):
        return bool(obj.user_id)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("description", "employee", "status", "due", "completed_date", "is_overdue")
    list_filter = ("status", "employee__division", "employee__department")
    search_fields = ("description", "employee__name")
    autocomplete_fields = ("employee",)
    date_hierarchy = "due"

    @admin.display(boolean=True)
    def is_overdue(self, obj):
        return obj.is_overdue


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ("employee", "joined", "last_renewal", "next_renewal")
    search_fields = ("employee__name", "notes")
    autocomplete_fields = ("employee",)
    readonly_fields = (
        "employee_role", "employee_division", "employee_department",
        "employee_salary", "employee_bkash", "employee_email", "employee_phone",
    )
    fieldsets = (
        (None, {"fields": ("employee", "joined", "last_renewal", "notes")}),
        ("Employee context (read-only)", {
            "fields": (
                "employee_role", "employee_division", "employee_department",
                "employee_salary", "employee_bkash", "employee_email", "employee_phone",
            ),
            "description": "Reference info from the Employee record — edit it from the Employee admin.",
        }),
    )

    @admin.display(description="Role")
    def employee_role(self, obj):
        return obj.employee.role if obj and obj.employee_id else "—"

    @admin.display(description="Division")
    def employee_division(self, obj):
        return obj.employee.division.name if obj and obj.employee_id else "—"

    @admin.display(description="Department")
    def employee_department(self, obj):
        return obj.employee.department.name if obj and obj.employee_id else "—"

    @admin.display(description="Salary")
    def employee_salary(self, obj):
        return f"৳{obj.employee.salary}" if obj and obj.employee_id else "—"

    @admin.display(description="bKash")
    def employee_bkash(self, obj):
        return obj.employee.bkash if obj and obj.employee_id else "—"

    @admin.display(description="Email")
    def employee_email(self, obj):
        return obj.employee.email if obj and obj.employee_id else "—"

    @admin.display(description="Phone")
    def employee_phone(self, obj):
        return obj.employee.phone if obj and obj.employee_id else "—"


@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ("topic", "date", "division_list", "department_list")
    list_filter = ("divisions", "departments")
    search_fields = ("topic", "points")
    filter_horizontal = ("divisions", "departments", "absent_employees")
    date_hierarchy = "date"

    def division_list(self, obj):
        return ", ".join(d.name for d in obj.divisions.all())

    def department_list(self, obj):
        return ", ".join(d.name for d in obj.departments.all())


@admin.register(Opening)
class OpeningAdmin(admin.ModelAdmin):
    list_display = ("department", "positions", "status")
    list_filter = ("status", "department__division")
    search_fields = ("department__name",)


class CandidateInline(admin.TabularInline):
    model = Candidate
    extra = 0


class RecruitmentRoundAdminForm(forms.ModelForm):
    candidates_csv = forms.FileField(
        required=False,
        help_text="Optional CSV with columns: name, background, university, cv — bulk-adds candidates to this round.",
    )

    class Meta:
        model = RecruitmentRound
        fields = "__all__"


@admin.register(RecruitmentRound)
class RecruitmentRoundAdmin(admin.ModelAdmin):
    form = RecruitmentRoundAdminForm
    list_display = ("position", "date", "time", "candidate_count")
    search_fields = ("position",)
    date_hierarchy = "date"
    inlines = [CandidateInline]
    fields = ("position", "date", "time", "meet_link", "candidates_csv")

    def candidate_count(self, obj):
        return obj.candidates.count()

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        csv_file = form.cleaned_data.get("candidates_csv")
        if not csv_file:
            return
        decoded = csv_file.read().decode("utf-8-sig")
        rows = list(csv.reader(io.StringIO(decoded)))
        if rows and rows[0] and rows[0][0].strip().lower() == "name":
            rows = rows[1:]
        for row in rows:
            if not row or not row[0].strip():
                continue
            name = row[0].strip()
            background = row[1].strip() if len(row) > 1 else ""
            university = row[2].strip() if len(row) > 2 else ""
            cv = row[3].strip() if len(row) > 3 else ""
            kwargs = dict(round=obj, name=name, background=background, university=university)
            if cv.lower().startswith("http"):
                kwargs["cv_link"] = cv
            Candidate.objects.create(**kwargs)


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ("name", "round", "university", "background", "status")
    list_filter = ("status",)
    search_fields = ("name", "university", "background")
    autocomplete_fields = ("round",)


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "kind", "department")
    list_filter = ("category", "kind")
    search_fields = ("title", "subtitle")


@admin.register(DepartmentMonthlyTask)
class DepartmentMonthlyTaskAdmin(admin.ModelAdmin):
    list_display = ("department", "task", "due_day", "is_complete_this_month")
    list_filter = ("department__division",)
    search_fields = ("task", "department__name")
    autocomplete_fields = ("department",)
    fields = ("department", "task", "due_day")
    change_list_template = "admin/hub/departmentmonthlytask/change_list.html"

    @admin.display(boolean=True, description="Done this month")
    def is_complete_this_month(self, obj):
        return obj.is_complete_for(date.today())

    def get_urls(self):
        custom = [
            path(
                "bulk-add/",
                self.admin_site.admin_view(self.bulk_add_view),
                name="hub_departmentmonthlytask_bulk_add",
            ),
        ]
        return custom + super().get_urls()

    def bulk_add_view(self, request):
        departments = Department.objects.order_by("division__order", "name")

        if request.method == "POST":
            dept = Department.objects.filter(pk=request.POST.get("department")).first()
            lines = (request.POST.get("tasks") or "").splitlines()

            if dept:
                created = 0
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    if "|" in line:
                        task_text, day_text = line.rsplit("|", 1)
                        task_text = task_text.strip()
                        try:
                            day = max(1, min(31, int(day_text.strip())))
                        except ValueError:
                            day = 28
                    else:
                        task_text, day = line, 28
                    DepartmentMonthlyTask.objects.update_or_create(
                        department=dept, task=task_text,
                        defaults={"due_day": day},
                    )
                    created += 1
                if created:
                    self.message_user(request, f"Added/updated {created} task(s) for {dept.name}.")
                    return redirect("admin:hub_departmentmonthlytask_changelist")
                self.message_user(request, "Enter at least one task line.", level=messages.ERROR)
            else:
                self.message_user(request, "Choose a department.", level=messages.ERROR)

        context = dict(
            self.admin_site.each_context(request),
            title="Bulk add monthly tasks",
            departments=departments,
            opts=self.model._meta,
        )
        return render(request, "admin/hub/departmentmonthlytask/bulk_add.html", context)
