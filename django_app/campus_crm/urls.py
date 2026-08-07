from django.urls import path

from . import views

urlpatterns = [
    path("", views.leads_page, name="crm_leads"),
    path("analytics/", views.analytics_page, name="crm_analytics"),
    path("settings/", views.settings_page, name="crm_settings"),

    path("api/leads/", views.api_lead_list_create, name="crm_api_lead_list_create"),
    path("api/leads/<int:pk>/status/", views.api_lead_status_update, name="crm_api_lead_status_update"),
    path("api/leads/upload-csv/", views.api_lead_csv_upload, name="crm_api_lead_upload_csv"),
]
