from django.db import migrations

DIVISION_ORDER = [
    "General",
    "Central Operation Division",
    "Growth Division",
    "DBS",
    "IBAI",
    "DiLab",
    "BSDS",
]


def set_division_order(apps, schema_editor):
    Division = apps.get_model('hub', 'Division')
    for index, name in enumerate(DIVISION_ORDER):
        Division.objects.filter(name=name).update(order=index)


class Migration(migrations.Migration):

    dependencies = [
        ('hub', '0007_seed_default_monthly_tasks'),
    ]

    operations = [
        migrations.RunPython(set_division_order, migrations.RunPython.noop),
    ]
