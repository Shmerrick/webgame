@echo off
REM Configure and build the core C++ library
cmake -S cpp -B build
cmake --build build
