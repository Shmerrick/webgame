#!/bin/bash
set -e
rm -rf cpp/build
mkdir -p cpp/build
cd cpp/build
cmake ..
make
