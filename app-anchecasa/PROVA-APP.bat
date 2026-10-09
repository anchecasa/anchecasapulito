@echo off
rem Prova dell app AncheCasa con dati di esempio (non tocca il database)
cd /d "%~dp0"
start "" http://localhost:8790/index.html?prova
python -m http.server 8790 || py -m http.server 8790
