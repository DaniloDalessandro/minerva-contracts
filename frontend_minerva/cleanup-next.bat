@echo off
echo Limpando arquivos do Next.js...

REM Mata processos Node.js
taskkill /f /im node.exe >nul 2>&1

REM Espera um pouco
timeout /t 2 /nobreak >nul

REM Remove pasta .next
if exist .next (
    echo Removendo .next...
    rmdir /s /q .next >nul 2>&1
)

REM Remove node_modules
if exist node_modules (
    echo Removendo node_modules...
    rmdir /s /q node_modules >nul 2>&1
)

REM Limpa cache npm
npm cache clean --force

REM Reinstala dependências
echo Reinstalando dependências...
npm install

echo Limpeza concluída!
echo Execute: npm run dev
pause