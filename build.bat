@echo off
setlocal
cd /d "%~dp0cpp" || exit /b 1
call build.bat %*
set EXIT_CODE=%ERRORLEVEL%
cd /d "%~dp0"
endlocal & exit /b %EXIT_CODE%
