@echo off
setlocal

set BUILD_DIR=build
set "CMAKE_GENERATOR=Visual Studio 17 2022"

if exist "%BUILD_DIR%" (
    echo "Build directory already exists. Removing it."
    rmdir /s /q "%BUILD_DIR%"
)

mkdir "%BUILD_DIR%"
cd "%BUILD_DIR%"

echo "Configuring with CMake..."
cmake -G "%CMAKE_GENERATOR%" -A x64 ..
if %errorlevel% neq 0 (
    echo "CMake configuration failed."
    exit /b %errorlevel%
)

echo "Building with CMake..."
cmake --build . --config Release
if %errorlevel% neq 0 (
    echo "CMake build failed."
    exit /b %errorlevel%
)

echo "Build successful."
endlocal
