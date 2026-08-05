# Deploying to cPanel

This app runs under cPanel's "Setup Python App" (Phusion Passenger).

## One-time setup

1. In cPanel, **Setup Python App** → create an app pointing its
   **Application root** at this `django_app/` folder, and note the
   **Application startup file**: it must be `passenger_wsgi.py` (already in
   this repo) and the **Application Entry point** / callable is `application`.
2. cPanel creates a virtualenv and shows an activation command like:
   ```
   source /home/<user>/virtualenv/django_app/3.12/bin/activate
   ```
   Copy that path into `VENV_ACTIVATE` in `deploy.sh`.
3. Create `.env` in `django_app/` (copy `.env.example`) with real production
   values — **`DEBUG=False`**, a real `SECRET_KEY`, the real `SITE_URL`.
4. Run the first deploy (see below).
5. Create the admin account: `python manage.py createsuperuser`.

## Every deploy (after `git pull`)

```bash
cd ~/path/to/django_app
bash deploy.sh
```

This installs any new dependencies, runs migrations, runs `collectstatic`
(required — with `DEBUG=False` the app serves static files through a hashed
manifest that only exists after this step; skipping it is what causes a
500 error on every page), and touches `tmp/restart.txt` so Passenger picks
up the change on the next request.

## If you use cPanel's Git Version Control (auto-deploy on pull)

That feature runs a `.cpanel.yml` file if present — this repo doesn't ship
one because the deploy path differs per account. If you want that wired up,
share your cPanel username and the app's deploy path and it can be added.
