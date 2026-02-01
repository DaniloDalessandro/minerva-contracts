@echo off
REM Setup script for Minerva Docker environment (Windows)
REM This script helps configure the backend .env file for Docker usage

setlocal enabledelayedexpansion

set BACKEND_DIR=backend_minerva
set ENV_FILE=%BACKEND_DIR%\.env
set ENV_EXAMPLE=%BACKEND_DIR%\.env.example

echo =========================================
echo Minerva Docker Environment Setup
echo =========================================
echo.

REM Check if .env already exists
if exist "%ENV_FILE%" (
    echo Warning: %ENV_FILE% already exists.
    set /p REPLY="Do you want to backup and recreate it? (y/N): "
    if /i not "!REPLY!"=="y" (
        echo Setup cancelled.
        exit /b 0
    )
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set DATE=%%c%%a%%b)
    for /f "tokens=1-2 delims=/: " %%a in ('time /t') do (set TIME=%%a%%b)
    move "%ENV_FILE%" "%ENV_FILE%.backup.!DATE!_!TIME!"
    echo Backed up existing .env file
)

REM Copy example file
if not exist "%ENV_EXAMPLE%" (
    echo Error: %ENV_EXAMPLE% not found!
    exit /b 1
)

copy "%ENV_EXAMPLE%" "%ENV_FILE%" > nul
echo Created %ENV_FILE% from example

echo.
echo Please enter your Gemini API Key (or press Enter to set it later):
set /p GEMINI_KEY="GEMINI_API_KEY: "

echo.
echo Configuring for Docker environment...

REM Create temporary Python script to generate SECRET_KEY
echo import secrets > temp_gen_key.py
echo print(''.join(secrets.choice('abcdefghijklmnopqrstuvwxyz0123456789!@#$%%^&*(-_=+)') for i in range(50))) >> temp_gen_key.py

for /f "delims=" %%i in ('python temp_gen_key.py 2^>nul') do set SECRET_KEY=%%i
del temp_gen_key.py

REM Update .env file using PowerShell
powershell -Command "(gc '%ENV_FILE%') -replace 'SECRET_KEY=.*', 'SECRET_KEY=%SECRET_KEY%' | Out-File -encoding ASCII '%ENV_FILE%.tmp'"
move /y "%ENV_FILE%.tmp" "%ENV_FILE%" > nul

powershell -Command "(gc '%ENV_FILE%') -replace 'ALLOWED_HOSTS=.*', 'ALLOWED_HOSTS=localhost,127.0.0.1,backend' | Out-File -encoding ASCII '%ENV_FILE%.tmp'"
move /y "%ENV_FILE%.tmp" "%ENV_FILE%" > nul

powershell -Command "(gc '%ENV_FILE%') -replace 'DATABASE_ENGINE=django.db.backends.sqlite3', '# DATABASE_ENGINE=django.db.backends.sqlite3' | Out-File -encoding ASCII '%ENV_FILE%.tmp'"
move /y "%ENV_FILE%.tmp" "%ENV_FILE%" > nul

powershell -Command "(gc '%ENV_FILE%') -replace 'DATABASE_NAME=db.sqlite3', '# DATABASE_NAME=db.sqlite3' | Out-File -encoding ASCII '%ENV_FILE%.tmp'"
move /y "%ENV_FILE%.tmp" "%ENV_FILE%" > nul

powershell -Command "(gc '%ENV_FILE%') -replace '# DATABASE_ENGINE=django.db.backends.postgresql', 'DATABASE_ENGINE=django.db.backends.postgresql' | Out-File -encoding ASCII '%ENV_FILE%.tmp'"
move /y "%ENV_FILE%.tmp" "%ENV_FILE%" > nul

powershell -Command "(gc '%ENV_FILE%') -replace '# DATABASE_NAME=minerva_db', 'DATABASE_NAME=minerva_db' | Out-File -encoding ASCII '%ENV_FILE%.tmp'"
move /y "%ENV_FILE%.tmp" "%ENV_FILE%" > nul

powershell -Command "(gc '%ENV_FILE%') -replace '# DATABASE_USER=your_db_user', 'DATABASE_USER=minerva_user' | Out-File -encoding ASCII '%ENV_FILE%.tmp'"
move /y "%ENV_FILE%.tmp" "%ENV_FILE%" > nul

powershell -Command "(gc '%ENV_FILE%') -replace '# DATABASE_PASSWORD=your_db_password', 'DATABASE_PASSWORD=minerva_password' | Out-File -encoding ASCII '%ENV_FILE%.tmp'"
move /y "%ENV_FILE%.tmp" "%ENV_FILE%" > nul

powershell -Command "(gc '%ENV_FILE%') -replace '# DATABASE_HOST=localhost', 'DATABASE_HOST=db' | Out-File -encoding ASCII '%ENV_FILE%.tmp'"
move /y "%ENV_FILE%.tmp" "%ENV_FILE%" > nul

powershell -Command "(gc '%ENV_FILE%') -replace '# DATABASE_PORT=5432', 'DATABASE_PORT=5432' | Out-File -encoding ASCII '%ENV_FILE%.tmp'"
move /y "%ENV_FILE%.tmp" "%ENV_FILE%" > nul

if not "!GEMINI_KEY!"=="" (
    powershell -Command "(gc '%ENV_FILE%') -replace 'GEMINI_API_KEY=.*', 'GEMINI_API_KEY=!GEMINI_KEY!' | Out-File -encoding ASCII '%ENV_FILE%.tmp'"
    move /y "%ENV_FILE%.tmp" "%ENV_FILE%" > nul
)

echo.
echo =========================================
echo Setup Complete!
echo =========================================
echo.
echo Configuration summary:
echo   - SECRET_KEY: Generated
echo   - DEBUG: True
echo   - Database: PostgreSQL (Docker)
echo   - Database Host: db
echo   - Database Name: minerva_db
echo   - Database User: minerva_user
echo.

if "!GEMINI_KEY!"=="" (
    echo IMPORTANT: Don't forget to set your GEMINI_API_KEY in %ENV_FILE%
    echo.
)

echo Next steps:
echo   1. Edit %ENV_FILE% and verify/add your GEMINI_API_KEY
echo   2. Run: docker-compose -f docker-compose.dev.yml up --build
echo   3. Create superuser: docker-compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser
echo.
echo For production, run this script again and manually set DEBUG=False
echo =========================================

pause
