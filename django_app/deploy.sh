#!/usr/bin/env bash
# Run this on the cPanel server (via SSH or the cPanel "Terminal" app) after
# every `git pull`. cPanel's Passenger hosting has no automatic build/release
# hook, so collectstatic and migrate have to be triggered by hand.
#
# Usage:
#   1. Edit VENV_ACTIVATE below to match the path cPanel's "Setup Python App"
#      screen showed you (Environment section -> the `source .../bin/activate`
#      command it gives you to enter the virtualenv).
#   2. From the django_app/ directory: bash deploy.sh

set -euo pipefail
cd "$(dirname "$0")"

# --- EDIT THIS to the venv activation command cPanel gave you ---
VENV_ACTIVATE="$HOME/virtualenv/django_app/3.12/bin/activate"
# ------------------------------------------------------------------

if [ -f "$VENV_ACTIVATE" ]; then
    source "$VENV_ACTIVATE"
else
    echo "WARNING: $VENV_ACTIVATE not found — edit VENV_ACTIVATE in deploy.sh, or"
    echo "activate the venv yourself before running this script."
fi

pip install -r requirements.txt
python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Passenger convention: touching this file tells it to restart the app.
mkdir -p tmp
touch tmp/restart.txt

echo "Deploy steps done. Passenger will restart the app on the next request."
