from django.contrib import admin

from .models import Department, Lead


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "university", "department", "year", "source", "status", "created_at")
    list_filter = ("status", "source", "year", "university")
    search_fields = ("name", "email", "phone", "university", "department")
    date_hierarchy = "created_at"
