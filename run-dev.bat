@echo off
rem ============================================================================
rem run-dev.bat [live|local] - opens the backend and frontend in two windows
rem   local (default) - local mock backend (:3001) + frontend pointed at it (:3000)
rem   live            - frontend only, against the deployed Apps Script; the local
rem                     mock isn't used, so no backend window opens
rem ============================================================================
setlocal
set "MODE=%~1"
if "%MODE%"=="" set "MODE=local"

if /i "%MODE%"=="local" (
  start "JARVISbyERP Backend" cmd /k call "%~dp0run-backend.bat"
  start "JARVISbyERP Frontend" cmd /k call "%~dp0run-frontend.bat" local
  goto :eof
)
if /i "%MODE%"=="live" (
  start "JARVISbyERP Frontend" cmd /k call "%~dp0run-frontend.bat" live
  goto :eof
)
echo Unknown mode "%MODE%". Usage: run-dev.bat [local^|live]
pause
exit /b 1
