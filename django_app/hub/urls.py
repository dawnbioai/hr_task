from django.contrib.auth import views as auth_views
from django.urls import path

from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("directory/", views.directory, name="directory"),
    path("tasks/add/", views.task_create, name="task_create"),
    path("tasks/<int:pk>/move/<str:column>/", views.task_move, name="task_move"),

    path("division/", views.division_list, name="division_list"),
    path("division/<int:pk>/", views.division_detail, name="division_detail"),

    path("department/", views.department_list, name="department_list"),
    path("department/<int:pk>/", views.department_detail, name="department_detail"),
    path("department-monthly-todo/", views.department_monthly_todo, name="department_monthly_todo"),
    path("department-monthly-todo/<int:pk>/update/", views.department_monthly_todo_update, name="department_monthly_todo_update"),

    path("employee/<slug:slug>/", views.employee_detail, name="employee_detail"),

    path("completed/", views.completed_tasks, name="completed_tasks"),
    path("analysis/", views.analysis, name="analysis"),
    path("contracts/", views.contracts_list, name="contracts_list"),
    path("meetings/", views.meetings_list, name="meetings_list"),
    path("meetings/add/", views.meeting_create, name="meeting_create"),
    path("recruitment/", views.recruitment, name="recruitment"),
    path("recruitment/candidate/<int:pk>/status/", views.candidate_status_update, name="candidate_status_update"),
    path("recruitment/opening/<int:pk>/status/", views.opening_status_update, name="opening_status_update"),

    path("documentation/", views.documentation, name="documentation"),
    path("documentation/add/", views.document_create, name="document_create"),
    path("documentation/<int:pk>/download/", views.document_download, name="document_download"),

    path("login/", auth_views.LoginView.as_view(template_name="hub/login.html"), name="login"),
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),
]
