from django.contrib import admin

from .models import Lead


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "university", "department", "year", "source", "status", "created_at")
    list_filter = ("status", "source", "year", "university")
    search_fields = ("name", "email", "phone", "university", "department")
    date_hierarchy = "created_at"
