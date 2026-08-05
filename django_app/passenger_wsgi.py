"""
Entry point for cPanel's Phusion Passenger Python App hosting.

cPanel's "Setup Python App" looks for a file named exactly `passenger_wsgi.py`
in the application's root directory (the same directory as manage.py) and
imports an `application` callable from it. This just forwards to Django's
real WSGI application in dobhub/wsgi.py.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dobhub.settings")

from dobhub.wsgi import application  # noqa: E402
