"""
URL configuration for dobhub project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.urls import include, path
from django.views.static import serve as serve_static

from django.contrib import admin

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('hub.urls')),
]

# Serve uploaded documents/CVs unconditionally (not just when DEBUG=True).
# This is a small internal tool on shared hosting with no separate media
# server/CDN, so Django serving MEDIA directly is the pragmatic choice here
# — Django's own docs flag this as unsuitable for high-traffic production,
# which doesn't apply to this app's scale.
urlpatterns += [
    path(
        f"{settings.MEDIA_URL.lstrip('/')}<path:path>",
        serve_static,
        {"document_root": settings.MEDIA_ROOT},
    ),
]
