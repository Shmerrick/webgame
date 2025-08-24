cmake_minimum_required(VERSION 3.10)
project(GameCore)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(game_core STATIC
    ItemDatabase.cpp
    Material.cpp
)

target_include_directories(game_core PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
