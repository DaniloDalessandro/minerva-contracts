#!/bin/bash
# Setup script for Minerva Docker environment
# This script helps configure the backend .env file for Docker usage

set -e

BACKEND_DIR="backend_minerva"
ENV_FILE="$BACKEND_DIR/.env"
ENV_EXAMPLE="$BACKEND_DIR/.env.example"

echo "========================================="
echo "Minerva Docker Environment Setup"
echo "========================================="
echo ""

# Check if .env already exists
if [ -f "$ENV_FILE" ]; then
    echo "Warning: $ENV_FILE already exists."
    read -p "Do you want to backup and recreate it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
    mv "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "Backed up existing .env file"
fi

# Copy example file
if [ ! -f "$ENV_EXAMPLE" ]; then
    echo "Error: $ENV_EXAMPLE not found!"
    exit 1
fi

cp "$ENV_EXAMPLE" "$ENV_FILE"
echo "Created $ENV_FILE from example"

# Generate SECRET_KEY
echo ""
echo "Generating Django SECRET_KEY..."
SECRET_KEY=$(python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())" 2>/dev/null || \
             python3 -c "import secrets; print(''.join(secrets.choice('abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)') for i in range(50)))")

# Update .env file for Docker
echo "Configuring for Docker environment..."

# Use sed to update the file (cross-platform compatible)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|SECRET_KEY=.*|SECRET_KEY=$SECRET_KEY|" "$ENV_FILE"
    sed -i '' "s|DEBUG=True|DEBUG=True|" "$ENV_FILE"
    sed -i '' "s|ALLOWED_HOSTS=.*|ALLOWED_HOSTS=localhost,127.0.0.1,backend|" "$ENV_FILE"
    sed -i '' "s|DATABASE_ENGINE=django.db.backends.sqlite3|# DATABASE_ENGINE=django.db.backends.sqlite3|" "$ENV_FILE"
    sed -i '' "s|DATABASE_NAME=db.sqlite3|# DATABASE_NAME=db.sqlite3|" "$ENV_FILE"
    sed -i '' "s|# DATABASE_ENGINE=django.db.backends.postgresql|DATABASE_ENGINE=django.db.backends.postgresql|" "$ENV_FILE"
    sed -i '' "s|# DATABASE_NAME=minerva_db|DATABASE_NAME=minerva_db|" "$ENV_FILE"
    sed -i '' "s|# DATABASE_USER=your_db_user|DATABASE_USER=minerva_user|" "$ENV_FILE"
    sed -i '' "s|# DATABASE_PASSWORD=your_db_password|DATABASE_PASSWORD=minerva_password|" "$ENV_FILE"
    sed -i '' "s|# DATABASE_HOST=localhost|DATABASE_HOST=db|" "$ENV_FILE"
    sed -i '' "s|# DATABASE_PORT=5432|DATABASE_PORT=5432|" "$ENV_FILE"
else
    # Linux/Windows Git Bash
    sed -i "s|SECRET_KEY=.*|SECRET_KEY=$SECRET_KEY|" "$ENV_FILE"
    sed -i "s|DEBUG=True|DEBUG=True|" "$ENV_FILE"
    sed -i "s|ALLOWED_HOSTS=.*|ALLOWED_HOSTS=localhost,127.0.0.1,backend|" "$ENV_FILE"
    sed -i "s|DATABASE_ENGINE=django.db.backends.sqlite3|# DATABASE_ENGINE=django.db.backends.sqlite3|" "$ENV_FILE"
    sed -i "s|DATABASE_NAME=db.sqlite3|# DATABASE_NAME=db.sqlite3|" "$ENV_FILE"
    sed -i "s|# DATABASE_ENGINE=django.db.backends.postgresql|DATABASE_ENGINE=django.db.backends.postgresql|" "$ENV_FILE"
    sed -i "s|# DATABASE_NAME=minerva_db|DATABASE_NAME=minerva_db|" "$ENV_FILE"
    sed -i "s|# DATABASE_USER=your_db_user|DATABASE_USER=minerva_user|" "$ENV_FILE"
    sed -i "s|# DATABASE_PASSWORD=your_db_password|DATABASE_PASSWORD=minerva_password|" "$ENV_FILE"
    sed -i "s|# DATABASE_HOST=localhost|DATABASE_HOST=db|" "$ENV_FILE"
    sed -i "s|# DATABASE_PORT=5432|DATABASE_PORT=5432|" "$ENV_FILE"
fi

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Configuration summary:"
echo "  - SECRET_KEY: Generated"
echo "  - DEBUG: True"
echo "  - Database: PostgreSQL (Docker)"
echo "  - Database Host: db"
echo "  - Database Name: minerva_db"
echo "  - Database User: minerva_user"
echo ""
echo "IMPORTANT: Don't forget to set your GEMINI_API_KEY in $ENV_FILE"
echo ""
echo "Next steps:"
echo "  1. Edit $ENV_FILE and add your GEMINI_API_KEY"
echo "  2. Run: docker-compose -f docker-compose.dev.yml up --build"
echo "  3. Create superuser: docker-compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser"
echo ""
echo "For production, run this script again and manually set DEBUG=False"
echo "========================================="
