NAV_GROUPS = [
    {"label": "People", "items": [
        {"url": "directory", "title": "Directory", "icon": "👥"},
        {"url": "completed_tasks", "title": "Completed Tasks", "icon": "✅"},
        {"url": "analysis", "title": "Analysis", "icon": "📊"},
        {"url": "recruitment", "title": "Recruitment", "icon": "🧑‍💼"},
    ]},
    {"label": "Workload", "items": [
        {"url": "division_list", "title": "By Division", "icon": "🏢"},
        {"url": "department_list", "title": "By Department", "icon": "🗂️"},
        {"url": "department_monthly_todo", "title": "Dept. Monthly To-do", "icon": "📝"},
    ]},
    {"label": "Admin", "items": [
        {"url": "contracts_list", "title": "Contracts", "icon": "📄"},
        {"url": "documentation", "title": "Documentation", "icon": "📚"},
    ]},
    {"label": "Collaboration", "items": [
        {"url": "meetings_list", "title": "Meetings", "icon": "🗓️"},
    ]},
    {"label": "Tools", "items": [
        {"url": "crm_leads", "title": "Campus CRM", "icon": "🎓"},
    ]},
]


RESTRICTED_ALLOWED_URLS = {"directory", "analysis"}


def nav(request):
    user = getattr(request, "user", None)
    is_restricted = bool(
        user and user.is_authenticated and not user.is_staff
        and getattr(user, "employee_profile", None)
    )
    if not is_restricted:
        return {"nav_groups": NAV_GROUPS}

    groups = []
    for group in NAV_GROUPS:
        items = [item for item in group["items"] if item["url"] in RESTRICTED_ALLOWED_URLS]
        if items:
            groups.append({"label": group["label"], "items": items})
    return {"nav_groups": groups}
