@echo off
chcp 65001 >nul
title Invia l'appunto per Francesco su GitHub
cd /d "%~dp0"
git add APPUNTI-FRANCESCO-EMAIL-ASSOARMA.md || goto errore
git commit -m "Appunto per Francesco: email di benvenuto Assoarma (Resend + Cloudflare)" -- APPUNTI-FRANCESCO-EMAIL-ASSOARMA.md || goto errore
git push origin main || goto errore
echo.
echo FATTO: l'appunto e' su GitHub. Francesco fa "git pull" e lo trova nella cartella principale.
pause
exit /b 0
:errore
echo.
echo ERRORE: copia il testo qui sopra e mandalo a Claude.
pause
exit /b 1
