from django.db import models
from django.urls import reverse
from django.utils.text import slugify


class Division(models.Model):
    name = models.CharField(max_length=120, unique=True)
    order = models.PositiveSmallIntegerField(
        default=0, help_text="Controls display order everywhere (lower = first)."
    )

    class Meta:
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class Department(models.Model):
    name = models.CharField(max_length=150, unique=True)
    division = models.ForeignKey(Division, on_delete=models.PROTECT, related_name="departments")

    class Meta:
        ordering = ["division__order", "name"]

    def __str__(self):
        return self.name


class Employee(models.Model):
    slug = models.SlugField(max_length=60, unique=True, blank=True)
    name = models.CharField(max_length=150)
    role = models.CharField(max_length=150)
    division = models.ForeignKey(Division, on_delete=models.PROTECT, related_name="employees")
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name="employees")
    bkash = models.CharField("bKash number", max_length=30, blank=True)
    salary = models.PositiveIntegerField(help_text="Monthly salary in BDT")
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    responsibilities = models.TextField(blank=True, help_text="One responsibility per line")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)
            slug = base
            n = 1
            while Employee.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                n += 1
                slug = f"{base}-{n}"
            self.slug = slug
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse("employee_detail", args=[self.slug])

    def responsibilities_list(self):
        return [line for line in self.responsibilities.splitlines() if line.strip()]

    @property
    def current_task(self):
        return (
            self.tasks.exclude(status=Task.Status.DONE)
            .order_by("due")
            .first()
        )


class Task(models.Model):
    class Status(models.TextChoices):
        TODO = "todo", "To-Do"
        PROGRESS = "progress", "In Progress"
        DONE = "done", "Done"

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="tasks")
    description = models.CharField(max_length=255)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.TODO)
    due = models.DateField()
    completed_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["due"]

    def __str__(self):
        return f"{self.description} ({self.employee.name})"

    @property
    def is_overdue(self):
        from datetime import date
        return self.status != self.Status.DONE and self.due < date.today()

    @property
    def is_on_time(self):
        return self.status == self.Status.DONE and self.completed_date and self.completed_date <= self.due


class Contract(models.Model):
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name="contract")
    joined = models.DateField()
    last_renewal = models.DateField()
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Contract — {self.employee.name}"

    @property
    def next_renewal(self):
        from dateutil.relativedelta import relativedelta
        return self.last_renewal + relativedelta(months=6)


class Meeting(models.Model):
    date = models.DateField()
    topic = models.CharField(max_length=255)
    divisions = models.ManyToManyField(Division, related_name="meetings", blank=True)
    departments = models.ManyToManyField(Department, related_name="meetings", blank=True)
    points = models.TextField(blank=True, help_text="One discussion point per line")
    absent_employees = models.ManyToManyField(Employee, related_name="absent_meetings", blank=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return self.topic

    def points_list(self):
        return [line for line in self.points.splitlines() if line.strip()]


class Opening(models.Model):
    class Status(models.TextChoices):
        OPEN = "Open", "Open"
        INTERVIEWING = "Interviewing", "Interviewing"
        ON_HOLD = "On Hold", "On Hold"

    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="openings")
    positions = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)

    class Meta:
        ordering = ["department__division__order", "department__name"]

    def __str__(self):
        return f"{self.department.name} ({self.positions})"


class RecruitmentRound(models.Model):
    position = models.CharField(max_length=255)
    date = models.DateField()
    time = models.CharField(max_length=30, blank=True, help_text='e.g. "11:00 AM"')
    meet_link = models.URLField(blank=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.position} — {self.date}"


class Candidate(models.Model):
    class Status(models.TextChoices):
        WAITING = "waiting", "Waiting"
        SELECTED = "selected", "Selected"
        NOT_SELECTED = "not_selected", "Not Selected"

    round = models.ForeignKey(RecruitmentRound, on_delete=models.CASCADE, related_name="candidates")
    name = models.CharField(max_length=150)
    background = models.CharField(max_length=255, blank=True)
    university = models.CharField(max_length=150, blank=True)
    cv_link = models.URLField(blank=True)
    cv_file = models.FileField(upload_to="candidate_cvs/", blank=True, null=True)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.WAITING)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Document(models.Model):
    class Category(models.TextChoices):
        CERTIFICATE = "cert", "Certificate"
        EMAIL_TEMPLATE = "email", "Email Template"
        GENERAL_RULE = "general", "General Rule"
        DEPARTMENT_RULE = "dept_rule", "Department Rule"

    class Kind(models.TextChoices):
        PDF = "PDF", "PDF"
        TXT = "TXT", "TXT"

    category = models.CharField(max_length=12, choices=Category.choices)
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=255, blank=True)
    kind = models.CharField(max_length=4, choices=Kind.choices, default=Kind.PDF)
    body = models.TextField(blank=True, help_text="Placeholder content, one line per row")
    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name="rule_documents",
        null=True, blank=True, help_text="Only used for Department Rule documents",
    )
    file = models.FileField(upload_to="documents/", blank=True, null=True)

    class Meta:
        ordering = ["category", "title"]

    def __str__(self):
        return self.title

    def body_lines(self):
        return self.body.splitlines()


class DepartmentMonthlyTask(models.Model):
    """A recurring monthly obligation for a department.

    Set up once (department + task text + which day of the month it's due).
    Nothing regenerates every month — `last_completed_month` just tracks
    whether *this* calendar month's occurrence has been checked off yet;
    it naturally reads as "Due" again as soon as the month rolls over.
    """

    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="monthly_tasks")
    task = models.CharField(max_length=255)
    due_day = models.PositiveSmallIntegerField(
        default=28, help_text="Day of the month this is due (1-31)."
    )
    last_completed_month = models.DateField(
        null=True, blank=True,
        help_text="Set automatically to the 1st of the month it was last marked Complete.",
    )

    class Meta:
        unique_together = ("department", "task")
        ordering = ["due_day", "task"]

    def __str__(self):
        return f"{self.department.name} — {self.task}"

    def due_date_for(self, today):
        import calendar
        last_day = calendar.monthrange(today.year, today.month)[1]
        return today.replace(day=min(self.due_day, last_day))

    def is_complete_for(self, today):
        return bool(self.last_completed_month) and (
            self.last_completed_month.year == today.year
            and self.last_completed_month.month == today.month
        )
