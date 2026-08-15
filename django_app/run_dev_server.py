"""Dev-server launcher that binds to whatever port the harness assigns via
the PORT environment variable, falling back to 8000 for a plain manual run.
manage.py runserver doesn't read PORT itself, so this wrapper builds the
address:port argument for it.
"""

import os
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
port = os.environ.get("PORT", "8000")

subprocess.run(
    [sys.executable, "manage.py", "runserver", f"127.0.0.1:{port}"],
    cwd=BASE_DIR,
    check=True,
)
