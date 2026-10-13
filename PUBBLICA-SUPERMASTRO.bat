@echo off
chcp 65001 >nul
title AncheCasa - Pubblica SuperMastro (app + anchecasa.it/supermastro)
cd /d "%~dp0supermastro-sos"
where node >nul 2>&1
if errorlevel 1 set "PATH=C:\Users\palum\Projects\anchecasa\.tools\node\node-v22.16.0-win-x64;%PATH%"
if not exist "web\.env.local" (
  echo Copio le chiavi da 04-SuperMastro\web\.env.local
  copy /y "%USERPROFILE%\Desktop\04-SuperMastro\web\.env.local" "web\.env.local" >nul || goto errore
)
echo === 1/3 Installo i pacchetti (qualche minuto) ===
pushd web
if not exist node_modules\next call npm ci --no-audit --no-fund || (popd & goto errore)
popd
echo === Accesso a Cloudflare: si apre il browser, premi Allow / Consenti ===
pushd web
call npx wrangler login || (popd & goto errore)
popd
echo === 2/3 Build e pubblicazione app SuperMastro, con le chiavi ===
node scripts\redeploy-worker.mjs > "%~dp0supermastro-sos\pubblica-log.txt" 2>&1 || (type "%~dp0supermastro-sos\pubblica-log.txt" & goto errore)
type "%~dp0supermastro-sos\pubblica-log.txt"
echo Controllo che la pagina del video risponda...
timeout /t 15 /nobreak >nul
for /f %%c in ('curl -s -o nul -w "%%{http_code}" https://supermastro.anchecasa.it/supermastro/video') do set CODICE=%%c
echo Pagina video: %CODICE%
if not "%CODICE%"=="200" (echo La pagina del video non risponde 200: il sito NON viene cambiato. & goto errore)
echo === 3/3 Pubblico il sito anchecasa.it con il collegamento a SuperMastro ===
cd /d "%~dp0sito"
call npx --yes vercel@latest deploy --prod --yes || goto errore
echo.
echo FATTO. Apri anchecasa.it/supermastro dal telefono.
echo FATTO> "%~dp0supermastro-sos\pubblica-esito.txt"
pause
exit /b 0
:errore
echo.
echo ERRORE: copia il testo qui sopra e mandalo a Claude.
echo ERRORE> "%~dp0supermastro-sos\pubblica-esito.txt"
pause
exit /b 1
