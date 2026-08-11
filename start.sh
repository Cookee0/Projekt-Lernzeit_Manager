#!/bin/sh
set -e
. /app/.venv/bin/activate
cd backend
FLASK_APP=wsgi flask db upgrade
exec gunicorn wsgi:application -w 2 -b "0.0.0.0:${PORT:-8000}"
