# Agent Instructions

This document provides guidance for AI software engineers working on this repository.

## Project Design Intention

As clarified by the project owner:

*   **Primary Goal:** The C++ code in the `cpp/` directory is the core of the project. It contains the game logic and systems that are intended to be integrated into an Unreal Engine project in the future. All new game systems should be implemented here.

*   **Website's Role:** The web application in the `public/` directory serves as a public-facing character builder and simulator. It is a companion tool to the main game engine code. Its purpose is to model the systems defined in the C++ code.

*   **Workflow:** When implementing a new feature, the primary task is to build the fully functional component in C++. The website should then be updated to reflect the existence and rules of this new system, but it does not need to contain the core logic itself. The `game_data_viewer` executable is a standalone tool for inspecting game data files and is not part of the main game logic build process.
