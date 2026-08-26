from django.conf import settings
from django.core.mail import send_mail

BUCKET_LABELS = {
    "progress": "In Progress",
    "due_soon": "Due Soon",
    "overdue": "Overdue",
    "completed": "Completed",
}

BUCKET_MESSAGES = {
    "progress": "This task has been assigned to you and is now in progress.",
    "due_soon": "This task is coming up soon — please make sure it is completed on time.",
    "overdue": "This task is now overdue. Please complete it as soon as possible.",
    "completed": "This task has been marked as completed. Thank you for your work.",
}


def send_task_status_email(task, bucket):
    """Notify the assigned employee that their task moved to a new status.
    Silently does nothing if the employee has no email on file, or if the
    mail server is unreachable — a notification failure must never block
    the underlying task action."""
    employee = task.employee
    label = BUCKET_LABELS.get(bucket)
    if not employee.email or not label:
        return

    subject = f"Task Update: {task.description} — {label}"
    message = (
        f"Dear {employee.name},\n\n"
        f"{BUCKET_MESSAGES[bucket]}\n\n"
        f"Task: {task.description}\n"
        f"Status: {label}\n"
        f"Due date: {task.due.strftime('%d %B %Y')}\n\n"
        "You can review your task status anytime by logging into the DOB Team Hub.\n\n"
        "Best regards,\n"
        "HR Team\n"
        "Dawn of Bioinformatics Ltd."
    )
    send_mail(
        subject, message, settings.DEFAULT_FROM_EMAIL, [employee.email],
        fail_silently=True,
    )
