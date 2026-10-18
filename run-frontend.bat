@echo off
rem ============================================================================
rem run-frontend.bat [live|local] - React dev server (npm start) on http://localhost:3000
rem   live  (default) - API URL from REACT_APP_API_BASE_URL_DEV in .env.local, else the
rem                     Vercel proxy to the deployed Apps Script (src\config\apiConfig.js)
rem   local           - the mock server started by run-backend.bat (http://localhost:3001/exec)
rem ============================================================================
setlocal
cd /d "%~dp0"

set "MODE=%~1"
if "%MODE%"=="" set "MODE=live"

if /i "%MODE%"=="live" goto :start
if /i "%MODE%"=="local" (
  set "REACT_APP_API_BASE_URL_DEV=http://localhost:3001/exec"
  goto :start
)
echo Unknown mode "%MODE%". Usage: run-frontend.bat [live^|local]
pause
exit /b 1

:start
title JARVISbyERP Frontend (:3000, %MODE% API)
echo Frontend API mode: %MODE%

if not exist node_modules (
  echo node_modules not found - running npm install...
  call npm install
  if errorlevel 1 goto :fail
)

call npm start
if errorlevel 1 goto :fail
goto :eof

:fail
echo.
echo Frontend stopped with an error.
pause
exit /b 1
