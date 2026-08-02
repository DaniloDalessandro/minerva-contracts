#!/bin/sh
set -e

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput || echo "WARNING: collectstatic failed (volume permission issue?)"

if [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "Criando superusuário se não existir..."
    python manage.py createsuperuser --noinput --email "$DJANGO_SUPERUSER_EMAIL" || echo "Superusuário já existe."
fi

exec "$@"
