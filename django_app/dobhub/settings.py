"""
Django settings for dobhub project.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/6.0/ref/settings/
"""

from pathlib import Path
from urllib.parse import urlparse

import environ

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env")


# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env("SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env.bool("DEBUG", default=False)

# The public URL the site is served from. Used to derive ALLOWED_HOSTS and
# CSRF_TRUSTED_ORIGINS below, and anywhere the app needs an absolute link.
SITE_URL = env("SITE_URL", default="http://127.0.0.1:8000")
_site_host = urlparse(SITE_URL).hostname or "127.0.0.1"

ALLOWED_HOSTS = list(dict.fromkeys(
    [_site_host, *env.list("ALLOWED_HOSTS", default=["127.0.0.1", "localhost"])]
))

CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[SITE_URL])


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'tailwind',
    'theme',
    'hub',
    'campus_crm',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'dobhub.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'hub.context_processors.nav',
            ],
        },
    },
]

WSGI_APPLICATION = 'dobhub.wsgi.application'


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / env("DATABASE_NAME", default="db.sqlite3"),
    }
}


# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = env("TIME_ZONE", default="Asia/Dhaka")

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = 'static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Always use the hashed/manifest storage — not conditional on DEBUG. Making
# this depend on DEBUG was a bug: if `collectstatic` gets run while DEBUG=True
# in .env, it silently builds the wrong (unmanifested) output, and then
# switching to DEBUG=False finds no manifest and 500s on every page. Local
# `runserver` doesn't consult this at all (it serves static files straight
# from source with its own dev-only handler), so this is safe in dev too —
# it only matters for `collectstatic`, which should always be run before
# any DEBUG=False deploy.
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# Media files (uploaded documents / CVs)
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# django-tailwind
TAILWIND_APP_NAME = 'theme'
INTERNAL_IPS = ['127.0.0.1']

LOGIN_URL = 'login'
LOGIN_REDIRECT_URL = 'directory'
LOGOUT_REDIRECT_URL = 'login'

# HTTPS-only hardening — keyed off whether SITE_URL is actually https://, not
# off DEBUG. A production site with no SSL certificate yet (plain http://)
# must NOT get Secure-only cookies or an SSL redirect: browsers refuse to
# send a Secure cookie back over plain HTTP, which breaks every POST
# (including login) with "CSRF cookie not set". Once the domain has a real
# certificate, switch SITE_URL to https:// and these turn on automatically.
SITE_IS_HTTPS = SITE_URL.startswith("https://")

if SITE_IS_HTTPS:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
