@echo off
rem ============================================================================
rem run-backend.bat - local AppScript mock server on http://localhost:3001
rem   Serves appscript_files\tools\local-appscript-server.js (GET/POST /exec, /health).
rem   It mocks the core entities plus read-only Phase 10.0 / approval-path data for
rem   dev-user-123 (profile types, role types, getUserProfile, canUserApprove, ...).
rem   POST accepts the flat body the frontend sends (or { action, payload }).
rem   Set MOCK_PORT to run a second copy on another port.
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
