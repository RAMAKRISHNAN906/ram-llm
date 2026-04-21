@echo off
title RAM LLM - Build Installer
echo Building RAM LLM Desktop Installer...
echo.

cd /d "%~dp0"

:: Install all deps
echo [1/4] Installing root dependencies...
npm install

echo [2/4] Installing backend dependencies...
cd backend && npm install && cd ..

echo [3/4] Installing frontend dependencies...
cd frontend && npm install

echo [4/4] Building frontend...
npm run build
cd ..

echo.
echo Packaging into installer...
npm run dist

echo.
echo Done! Installer is in the dist-app folder.
pause
