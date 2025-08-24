#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define the build directory.
BUILD_DIR="build"

# Check if the build directory exists and remove it if it does.
if [ -d "$BUILD_DIR" ]; then
    echo "Build directory already exists. Removing it."
    rm -rf "$BUILD_DIR"
fi

# Create the build directory.
mkdir "$BUILD_DIR"

# Change to the build directory.
cd "$BUILD_DIR"

# Configure with CMake.
echo "Configuring with CMake..."
cmake ..

# Build with make.
echo "Building with make..."
make

echo "Build successful."
