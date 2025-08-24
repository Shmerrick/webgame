cmake_minimum_required(VERSION 3.10)
project(GameDataViewer)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# SDL2 and OpenGL are optional; if unavailable the viewer target is skipped.
find_package(SDL2)
find_package(OpenGL)

if (SDL2_FOUND AND OPENGL_FOUND)
add_executable(game_data_viewer
    game_data_viewer.cpp
    ItemDatabase.cpp
    Material.cpp
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
else()
message(WARNING "SDL2 or OpenGL not found; skipping game_data_viewer target")
endif()

