@echo off
title PrimeSYS TV Backend
echo =========================================
echo    Starting PrimeSYS Backend Server...
echo =========================================
echo.
cd backend
node server.js
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org
)
echo.
pause
