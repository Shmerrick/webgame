@echo off
setlocal

set BUILD_DIR=build
set "CMAKE_GENERATOR=Visual Studio 17 2022"
set "LOG_FILE=build.log"

if exist "%LOG_FILE%" del "%LOG_FILE%"

call :log "Starting build"

if exist "%BUILD_DIR%" (
    call :log "Build directory already exists. Removing it."
    rmdir /s /q "%BUILD_DIR%"
)

mkdir "%BUILD_DIR%"
cd "%BUILD_DIR%"

call :log "Configuring with CMake..."
cmake -G "%CMAKE_GENERATOR%" -A x64 .. >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    call :log "CMake configuration failed."
    exit /b %errorlevel%
)

call :log "Building with CMake..."
cmake --build . --config Release >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    call :log "CMake build failed."
    exit /b %errorlevel%
)

call :log "Build successful."
endlocal
exit /b 0

:log
echo %~1
echo %~1>> "%LOG_FILE%"
exit /b 0
