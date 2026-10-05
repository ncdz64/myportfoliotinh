@echo off
title TFT Mythic Arena Portfolio Server
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
