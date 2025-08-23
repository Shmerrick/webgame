cmake_minimum_required(VERSION 3.10)
project(GameDataViewer)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(SDL2 REQUIRED)
find_package(OpenGL REQUIRED)

add_executable(game_data_viewer
    game_data_viewer.cpp
    imgui/imgui.cpp
    imgui/imgui_draw.cpp
    imgui/imgui_tables.cpp
    imgui/imgui_widgets.cpp
    imgui/imgui_impl_sdl2.cpp
    imgui/imgui_impl_opengl3.cpp
)

target_include_directories(game_data_viewer PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/imgui
    ${SDL2_INCLUDE_DIRS}
    ${OPENGL_INCLUDE_DIR}
)

target_link_libraries(game_data_viewer PRIVATE SDL2::SDL2 ${OPENGL_LIBRARIES})
