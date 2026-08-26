from django.conf import settings
from django.shortcuts import redirect
from django.urls import Resolver404, resolve

# URL names a restricted employee login is allowed to reach. Everything else
# (division/department pages, completed tasks, contracts, meetings,
# recruitment, documentation, monthly to-do, Campus CRM, admin, ...) bounces
# back to the directory.
ALLOWED_URL_NAMES = {"directory", "analysis", "login", "logout"}


class RestrictEmployeeAccessMiddleware:
    """Confines employee-only logins (non-staff users linked to an Employee)
    to the Directory and Analysis pages — nothing else in the site is
    reachable for them, no matter the URL they try."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = request.user
        if user.is_authenticated and not user.is_staff and getattr(user, "employee_profile", None):
            path = request.path
            if not (path.startswith(settings.STATIC_URL) or path.startswith(settings.MEDIA_URL)):
                try:
                    url_name = resolve(path).url_name
                except Resolver404:
                    url_name = None
                if url_name not in ALLOWED_URL_NAMES:
                    return redirect("directory")
        return self.get_response(request)
