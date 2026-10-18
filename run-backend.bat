@echo off
rem ============================================================================
rem run-backend.bat - local AppScript mock server on http://localhost:3001
rem   Serves appscript_files\tools\local-appscript-server.js (GET/POST /exec, /health).
rem   It mocks the core reads only (ping, companies, roles, dropdowns, ticket types,
rem   custom fields): no Phase 10.0 actions, and its POST handler expects
rem   { action, payload } while the frontend sends the fields flat.
rem   The real backend is the deployed Apps Script; see run-frontend.bat (live).
rem ============================================================================
title JARVISbyERP Backend (local mock :3001)
cd /d "%~dp0"

if not exist node_modules (
  echo node_modules not found - running npm install...
  call npm install
  if errorlevel 1 goto :fail
)

node appscript_files\tools\local-appscript-server.js
if errorlevel 1 goto :fail
goto :eof

:fail
echo.
echo Backend stopped with an error.
pause
exit /b 1
