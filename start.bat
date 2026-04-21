@echo off
echo Starting RAM LLM...
echo.

:: Start backend
cd /d "%~dp0backend"
start "RAM LLM Backend" cmd /k "npm install && npm start"

:: Wait a moment then start frontend
timeout /t 3 /nobreak >nul
cd /d "%~dp0frontend"
start "RAM LLM Frontend" cmd /k "npm install && npm run dev"

echo.
echo RAM LLM is starting...
echo  - Backend:  http://localhost:3001
echo  - Frontend: http://localhost:3000
echo.
echo Make sure Ollama is running: ollama serve
echo Make sure llama3 is pulled: ollama pull llama3
pause
