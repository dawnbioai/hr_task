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
]


def nav(request):
    return {"nav_groups": NAV_GROUPS}
