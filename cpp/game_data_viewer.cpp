// Dear ImGui: standalone example application for SDL2 + OpenGL3
// (SDL is a cross-platform general purpose library for handling windows, inputs, OpenGL/Vulkan/Metal graphics context creation, etc.)

#include "imgui.h"
#include "imgui_impl_sdl2.h"
#include "imgui_impl_opengl3.h"
#include <stdio.h>
#include <SDL.h>
#if defined(IMGUI_IMPL_OPENGL_ES2)
#include <SDL_opengles2.h>
#else
#include <SDL_opengl.h>
#endif

#include <fstream>
#include <iostream>
#include <string>
#include <vector>
#include <map>
#include "json.hpp"

using json = nlohmann::json;

struct Material {
    std::string name;
    double slash;
    double pierce;
    double blunt;
    double fire;
    double water;
    double wind;
    double earth;
    int toughness;
    double magic;
    double density;
};

using Tier = std::vector<Material>;
using Category = std::map<std::string, Tier>;
using Database = std::map<std::string, Category>;

// Function to load and parse the database
bool loadDatabase(Database& db, const std::string& filepath) {
    std::ifstream f(filepath);
    if (!f.is_open()) {
        std::cerr << "Error: Could not open database file: " << filepath << std::endl;
        return false;
    }

    try {
        json data = json::parse(f);
        for (auto const& [cat_key, cat_val] : data.items()) {
            for (auto const& [tier_key, tier_val] : cat_val.items()) {
                for (auto const& mat_val : tier_val) {
                    Material m;
                    m.name = mat_val.value("name", "Unknown");
                    m.slash = mat_val.value("slash", 0.0);
                    m.pierce = mat_val.value("pierce", 0.0);
                    m.blunt = mat_val.value("blunt", 0.0);
                    m.fire = mat_val.value("fire", 0.0);
                    m.water = mat_val.value("water", 0.0);
                    m.wind = mat_val.value("wind", 0.0);
                    m.earth = mat_val.value("earth", 0.0);
                    m.toughness = mat_val.value("toughness", 0);
                    m.magic = mat_val.value("magic", 0.0);
                    m.density = mat_val.value("density", 1.0);
                    db[cat_key][tier_key].push_back(m);
                }
            }
        }
    } catch (json::parse_error& e) {
        std::cerr << "Error parsing JSON: " << e.what() << std::endl;
        return false;
    }

    std::cout << "Database loaded successfully." << std::endl;
    return true;
}


// Main code
int main(int, char**)
{
    // Load the database
    Database db;
    if (!loadDatabase(db, "../../public/materials.json")) {
        return 1;
    }

    // Setup SDL
    if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_TIMER | SDL_INIT_GAMECONTROLLER) != 0)
    {
        printf("Error: %s\n", SDL_GetError());
        return -1;
    }

    // Decide GL+GLSL versions
#if defined(IMGUI_IMPL_OPENGL_ES2)
    // GL ES 2.0 + GLSL 100
    const char* glsl_version = "#version 100";
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_FLAGS, 0);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_ES);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 2);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 0);
#elif defined(__APPLE__)
    // GL 3.2 Core + GLSL 150
    const char* glsl_version = "#version 150";
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_FLAGS, SDL_GL_CONTEXT_FORWARD_COMPATIBLE_FLAG); // Always required on Mac
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_CORE);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 3);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 2);
#else
    // GL 3.0 + GLSL 130
    const char* glsl_version = "#version 130";
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_FLAGS, 0);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_CORE);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 3);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 0);
#endif

    // Create window with graphics context
    SDL_GL_SetAttribute(SDL_GL_DOUBLEBUFFER, 1);
    SDL_GL_SetAttribute(SDL_GL_DEPTH_SIZE, 24);
    SDL_GL_SetAttribute(SDL_GL_STENCIL_SIZE, 8);
    SDL_WindowFlags window_flags = (SDL_WindowFlags)(SDL_WINDOW_OPENGL | SDL_WINDOW_RESIZABLE | SDL_WINDOW_ALLOW_HIGHDPI);
    SDL_Window* window = SDL_CreateWindow("Dear ImGui SDL2+OpenGL3 example", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, 1280, 720, window_flags);
    SDL_GLContext gl_context = SDL_GL_CreateContext(window);
    SDL_GL_MakeCurrent(window, gl_context);
    SDL_GL_SetSwapInterval(1); // Enable vsync

    // Setup Dear ImGui context
    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGuiIO& io = ImGui::GetIO(); (void)io;
    io.ConfigFlags |= ImGuiConfigFlags_NavEnableKeyboard;     // Enable Keyboard Controls
    io.ConfigFlags |= ImGuiConfigFlags_NavEnableGamepad;      // Enable Gamepad Controls

    // Setup Dear ImGui style
    ImGui::StyleColorsDark();
    //ImGui::StyleColorsLight();

    // Setup Platform/Renderer backends
    ImGui_ImplSDL2_InitForOpenGL(window, gl_context);
    ImGui_ImplOpenGL3_Init(glsl_version);

    // Our state
    ImVec4 clear_color = ImVec4(0.45f, 0.55f, 0.60f, 1.00f);

    // Main loop
    bool done = false;
    while (!done)
    {
        SDL_Event event;
        while (SDL_PollEvent(&event))
        {
            ImGui_ImplSDL2_ProcessEvent(&event);
            if (event.type == SDL_QUIT)
                done = true;
            if (event.type == SDL_WINDOWEVENT && event.window.event == SDL_WINDOWEVENT_CLOSE && event.window.windowID == SDL_GetWindowID(window))
                done = true;
        }

        // Start the Dear ImGui frame
        ImGui_ImplOpenGL3_NewFrame();
        ImGui_ImplSDL2_NewFrame();
        ImGui::NewFrame();

        {
            ImGui::Begin("Material Database");

            for (auto const& [cat_key, cat_val] : db) {
                if (ImGui::TreeNode(cat_key.c_str())) {
                    for (auto const& [tier_key, tier_val] : cat_val) {
                        if (ImGui::TreeNode(tier_key.c_str())) {
                            for (auto const& mat : tier_val) {
                                if (ImGui::TreeNode(mat.name.c_str())) {
                                    ImGui::Text("Slash: %.4f", mat.slash);
                                    ImGui::Text("Pierce: %.4f", mat.pierce);
                                    ImGui::Text("Blunt: %.4f", mat.blunt);
                                    ImGui::Text("Magic: %.4f", mat.magic);
                                    ImGui::Text("Fire: %.4f", mat.fire);
                                    ImGui::Text("Water: %.4f", mat.water);
                                    ImGui::Text("Wind: %.4f", mat.wind);
                                    ImGui::Text("Earth: %.4f", mat.earth);
                                    ImGui::Text("Toughness: %d", mat.toughness);
                                    ImGui::Text("Density: %.2f", mat.density);
                                    ImGui::TreePop();
                                }
                            }
                            ImGui::TreePop();
                        }
                    }
                    ImGui::TreePop();
                }
            }

            ImGui::End();
        }

        // Rendering
        ImGui::Render();
        glViewport(0, 0, (int)io.DisplaySize.x, (int)io.DisplaySize.y);
        glClearColor(clear_color.x * clear_color.w, clear_color.y * clear_color.w, clear_color.z * clear_color.w, clear_color.w);
        glClear(GL_COLOR_BUFFER_BIT);
        ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());
        SDL_GL_SwapWindow(window);
    }

    // Cleanup
    ImGui_ImplOpenGL3_Shutdown();
    ImGui_ImplSDL2_Shutdown();
    ImGui::DestroyContext();

    SDL_GL_DeleteContext(gl_context);
    SDL_DestroyWindow(window);
    SDL_Quit();

    return 0;
}
