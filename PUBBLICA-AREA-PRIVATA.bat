@echo off
chcp 65001 >nul
title AncheCasa - Invia su GitHub e pubblica l'area privata
cd /d "%~dp0"

echo.
echo 1/2  Invio su GitHub (anchecasa/anchecasapulito, ramo main)...
git push origin main
if errorlevel 1 (
  echo.
  echo Invio su GitHub non riuscito. Pubblicazione fermata.
  pause
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 set "PATH=C:\Users\palum\Projects\anchecasa\.tools\node\node-v22.16.0-win-x64;%PATH%"

echo.
echo 2/2  Pubblico la cartella "area-privata" sul progetto Vercel area-privata-produzione...
cd /d "%~dp0area-privata"
call npx --yes vercel@latest deploy --prod --yes
set EXITCODE=%ERRORLEVEL%
echo.
if %EXITCODE%==0 (
  echo Fatto. Apri https://areaprivata.anchecasa.it/dashboard/#/admin/software
) else (
  echo Pubblicazione non riuscita. Codice errore: %EXITCODE%
  echo Se chiede l'accesso, scrivi:  npx vercel login   e poi riavvia questo file.
)
echo.
pause
