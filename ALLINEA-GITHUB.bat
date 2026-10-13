@echo off
chcp 65001 >nul
title AncheCasa - Allinea ANCHECASA-PULITO con GitHub
cd /d "%~dp0"
echo === 1/3 Salvo il lavoro del PC ===
git add -A || goto errore
git commit -m "Allineamento PC: SuperMastro solo video, Vedi cosa so fare, comandi Cursor (13.10.2026)" || echo Niente di nuovo da salvare.
echo === 2/3 Prendo le novita da GitHub ===
git pull --rebase origin main || goto errore
echo === 3/3 Invio su GitHub ===
git push origin main || goto errore
git status -sb > "%~dp0allinea-esito.txt"
git log -1 --format=%%H >> "%~dp0allinea-esito.txt"
git rev-parse origin/main >> "%~dp0allinea-esito.txt"
echo FATTO>> "%~dp0allinea-esito.txt"
echo.
echo FATTO: PC e GitHub sono uguali.
pause
exit /b 0
:errore
echo ERRORE>> "%~dp0allinea-esito.txt"
echo.
echo ERRORE: copia il testo qui sopra e mandalo a Claude.
pause
exit /b 1
