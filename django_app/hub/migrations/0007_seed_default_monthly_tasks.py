from django.db import migrations


def seed_default_tasks(apps, schema_editor):
    from hub.monthly_tasks import get_template

    Department = apps.get_model('hub', 'Department')
    DepartmentMonthlyTask = apps.get_model('hub', 'DepartmentMonthlyTask')

    for dept in Department.objects.all():
        for task_desc, day in get_template(dept.name):
            DepartmentMonthlyTask.objects.get_or_create(
                department=dept, task=task_desc,
                defaults={"due_day": day},
            )


class Migration(migrations.Migration):

    dependencies = [
        ('hub', '0006_alter_department_options_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_default_tasks, migrations.RunPython.noop),
    ]
