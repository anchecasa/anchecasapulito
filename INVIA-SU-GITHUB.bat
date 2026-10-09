@echo off
chcp 65001 >nul
title AncheCasa - Invia ANCHECASA-PULITO su GitHub (anchecasa/anchecasapulito)
cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
  echo.
  echo ERRORE: Git non trovato. Installalo da https://git-scm.com/download/win e riavvia questo file.
  echo.
  pause
  exit /b 1
)

rem automazione Supabase per GitHub Actions
if not exist ".github\workflows" mkdir ".github\workflows"
copy /y "scripts\supabase-workflow.yml" ".github\workflows\supabase.yml" >nul

if not exist ".git" (
  git init -b main
  git remote add origin https://github.com/anchecasa/anchecasapulito.git
) else (
  git remote get-url origin >nul 2>&1
  if errorlevel 1 (
    git remote add origin https://github.com/anchecasa/anchecasapulito.git
  ) else (
    git remote set-url origin https://github.com/anchecasa/anchecasapulito.git
  )
)

git config user.name >nul 2>&1 || git config user.name "AncheCasa"
git config user.email >nul 2>&1 || git config user.email "palumbofernando12@gmail.com"

git add -A
git commit -m "Aggiornamento AncheCasa pulito %date% %time%" >nul 2>&1
echo.
echo Invio su GitHub: anchecasa/anchecasapulito (ramo main).
echo Se e' la prima volta si apre una finestra per entrare in GitHub.
echo.
git push -u origin main
set EXITCODE=%ERRORLEVEL%
echo.
if %EXITCODE%==0 (
  echo Fatto. Apri https://github.com/anchecasa/anchecasapulito per controllare.
) else (
  echo Invio non riuscito. Codice errore: %EXITCODE%
  echo Controlla di avere accesso al repository anchecasa/anchecasapulito.
)
echo.
pause
