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

#include "ItemDatabase.h"
#include <iostream>

// Main code
int main(int argc, char** argv)
{
    // Load the database using the new ItemDatabase class
    std::string db_path = "cpp/item_database.json"; // Path relative to the repo root
    if (argc > 1) {
        db_path = argv[1];
    }

    Game::ItemDatabase itemDb(db_path);
    const auto& allItems = itemDb.getAllItems();
    if (allItems.empty()) {
        std::cerr << "Database is empty or failed to load." << std::endl;
        return 1;
    }

    // Group items by category for display
    std::map<std::string, std::vector<const Game::Item*>> categorizedItems;
    for(const auto* item : allItems) {
        // A bit of a hack to get the material category back for top-level grouping
        // This is because the Item class itself doesn't store the material category string
        // A better long-term solution might be to have the ItemDatabase provide this grouping
        if (const auto* armor = dynamic_cast<const Game::Armor*>(item)) {
             // This part is tricky without the material category on the item itself.
             // For now, we'll just group by item_type for verification.
        }
        categorizedItems[item->getItemType()].push_back(item);
    }


    // Setup SDL
    if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_TIMER | SDL_INIT_GAMECONTROLLER) != 0)
    {
        printf("Error: %s\n", SDL_GetError());
        return -1;
    }

    // GL 3.0 + GLSL 130
    const char* glsl_version = "#version 130";
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_FLAGS, 0);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_CORE);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 3);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 0);

    // Create window with graphics context
    SDL_GL_SetAttribute(SDL_GL_DOUBLEBUFFER, 1);
    SDL_GL_SetAttribute(SDL_GL_DEPTH_SIZE, 24);
    SDL_GL_SetAttribute(SDL_GL_STENCIL_SIZE, 8);
    SDL_WindowFlags window_flags = (SDL_WindowFlags)(SDL_WINDOW_OPENGL | SDL_WINDOW_RESIZABLE | SDL_WINDOW_ALLOW_HIGHDPI);
    SDL_Window* window = SDL_CreateWindow("Item Database Viewer", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, 1280, 720, window_flags);
    SDL_GLContext gl_context = SDL_GL_CreateContext(window);
    SDL_GL_MakeCurrent(window, gl_context);
    SDL_GL_SetSwapInterval(1); // Enable vsync

    // Setup Dear ImGui context
    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGuiIO& io = ImGui::GetIO(); (void)io;
    io.ConfigFlags |= ImGuiConfigFlags_NavEnableKeyboard;
    io.ConfigFlags |= ImGuiConfigFlags_NavEnableGamepad;

    ImGui::StyleColorsDark();

    ImGui_ImplSDL2_InitForOpenGL(window, gl_context);
    ImGui_ImplOpenGL3_Init(glsl_version);

    ImVec4 clear_color = ImVec4(0.1f, 0.1f, 0.15f, 1.00f);

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

        ImGui_ImplOpenGL3_NewFrame();
        ImGui_ImplSDL2_NewFrame();
        ImGui::NewFrame();

        if (ImGui::BeginMainMenuBar())
        {
            if (ImGui::BeginMenu("File"))
            {
                if (ImGui::MenuItem("Quit", "Alt+F4"))
                    done = true;
                ImGui::EndMenu();
            }
            ImGui::EndMainMenuBar();
        }

        {
            ImGui::Begin("Item Database Viewer");

            for (auto const& [category, items] : categorizedItems) {
                if (ImGui::TreeNode(category.c_str())) {
                    for (const auto* item : items) {
                        if (ImGui::TreeNode(item->getName().c_str())) {
                            ImGui::Text("ID: %s", item->getId().c_str());
                            ImGui::Text("Type: %s", item->getType().c_str());
                            ImGui::Text("Material Tier: %d", item->getMaterialTier());
                            ImGui::Text("Quality Tier: %d", item->getQualityTier());
                            ImGui::Text("Mass: %.2f kg", item->getMass());

                            if (const auto* armor = dynamic_cast<const Game::Armor*>(item)) {
                                const auto& stats = armor->getDefenseStats();
                                ImGui::Text("Slash Def: %.1f", stats.slash);
                                ImGui::Text("Pierce Def: %.1f", stats.pierce);
                                ImGui::Text("Blunt Def: %.1f", stats.blunt);
                                ImGui::Text("Magic Def: %.1f", stats.magic);
                            } else if (const auto* weapon = dynamic_cast<const Game::Weapon*>(item)) {
                                const auto& stats = weapon->getOffenseStats();
                                ImGui::Text("Slash Off: %.1f", stats.slash);
                                ImGui::Text("Pierce Off: %.1f", stats.pierce);
                                ImGui::Text("Blunt Off: %.1f", stats.blunt);
                            } else if (const auto* shield = dynamic_cast<const Game::Shield*>(item)) {
                                const auto& stats = shield->getDefenseStats();
                                ImGui::Text("Slash Def: %.1f", stats.slash);
                                ImGui::Text("Pierce Def: %.1f", stats.pierce);
                                ImGui::Text("Blunt Def: %.1f", stats.blunt);
                            }
                            ImGui::TreePop();
                        }
                    }
                    ImGui::TreePop();
                }
            }
            ImGui::End();
        }

        ImGui::Render();
        glViewport(0, 0, (int)io.DisplaySize.x, (int)io.DisplaySize.y);
        glClearColor(clear_color.x * clear_color.w, clear_color.y * clear_color.w, clear_color.z * clear_color.w, clear_color.w);
        glClear(GL_COLOR_BUFFER_BIT);
        ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());
        SDL_GL_SwapWindow(window);
    }

    ImGui_ImplOpenGL3_Shutdown();
    ImGui_ImplSDL2_Shutdown();
    ImGui::DestroyContext();

    SDL_GL_DeleteContext(gl_context);
    SDL_DestroyWindow(window);
    SDL_Quit();

    return 0;
}
