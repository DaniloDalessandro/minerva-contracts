@echo off
echo ========================================
echo Seed de 50 Auxilios - Sistema Minerva
echo ========================================
echo.

set /p EMAIL="Digite seu email: "
set /p PASSWORD="Digite sua senha: "

echo.
echo Executando script...
echo.

node scripts/seed-auxilios-auto.js %EMAIL% %PASSWORD%

echo.
pause
