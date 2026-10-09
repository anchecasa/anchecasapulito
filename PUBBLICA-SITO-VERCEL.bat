@echo off
chcp 65001 >nul
title AncheCasa - Pubblica il sito su Vercel (anchecasa-pulito)
cd /d "%~dp0sito"

rem Node: prima quello di sistema, altrimenti quello portatile del progetto anchecasa
where node >nul 2>&1
if errorlevel 1 set "PATH=C:\Users\palum\Projects\anchecasa\.tools\node\node-v22.16.0-win-x64;%PATH%"
where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo ERRORE: Node.js non trovato. Installalo da https://nodejs.org e riprova.
  echo.
  pause
  exit /b 1
)

if not exist ".vercel\project.json" (
  echo.
  echo ERRORE: la cartella sito non e' collegata al progetto Vercel anchecasa-pulito.
  echo.
  pause
  exit /b 1
)

echo.
echo Pubblico la cartella "sito" sul progetto Vercel anchecasa-pulito (produzione).
echo Se e' la prima volta, si apre il browser per entrare nel tuo account Vercel.
echo.
call npx --yes vercel@latest deploy --prod --yes
set EXITCODE=%ERRORLEVEL%
echo.
if %EXITCODE%==0 (
  echo Fatto. Il sito e' pubblicato: controlla la pagina /magazine.
) else (
  echo Pubblicazione non riuscita. Codice errore: %EXITCODE%
  echo Se chiede l'accesso, scrivi:  npx vercel login   e poi riavvia questo file.
)
echo.
pause
