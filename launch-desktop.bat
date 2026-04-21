@echo off
title RAM LLM Desktop
echo.
echo  Starting RAM LLM Desktop...
echo  Make sure Ollama is running: ollama serve
echo.

cd /d "%~dp0"

if not exist node_modules (
  echo Installing dependencies...
  npm install
)
if not exist backend\node_modules (
  cd backend && npm install && cd ..
)
if not exist frontend\node_modules (
  cd frontend && npm install && cd ..
)

npm run dev
