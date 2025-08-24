# Game Simulator

**Version:** 16.0

This project contains a web-based game simulator and a C++ tool to view the game data. It relies solely on C++ and web
tooling—no Python is required.

## Running the Webpage

The webpage needs to be served by a local web server for all features to work correctly. Opening the `index.html` file directly in your browser from the file system will not work.

1.  **Navigate to the `public` directory:**
    ```bash
    cd public
    ```

2.  **Start a simple web server:**
    Use any static file server. With Node.js installed, the [`serve`](https://www.npmjs.com/package/serve) package is the
    easiest option:
    ```bash
    npx serve -l 3000
    ```

3.  **Open the webpage in your browser:**
    Open your web browser and go to the following address (replace the port if you used a different one):
    [http://localhost:3000](http://localhost:3000)

    You should now see the website, and the simulator should be fully functional.

## C++ Game Data Viewer

This ImGui-based GUI tool displays the contents of the material database.

### Compiling the Game Data Viewer

The C++ project uses CMake. On Windows, a convenience script is provided to generate the Visual Studio solution and build the project.

#### Compiling with the Build Script (Windows)

From the root directory of the project, run:
```
build.bat
```
This will generate a Visual Studio solution and place the compiled executable in `cpp/build`.

#### Compiling Manually

If you cannot use the build script, you can compile manually.

1.  **Create a build directory:**
    ```bash
    mkdir -p cpp/build
    cd cpp/build
    ```

2.  **Run CMake to generate the build files:**
    ```bash
    cmake ..
    ```

3.  **Run make to compile the program:**
    ```bash
    make
    ```

    This will create an executable file named `game_data_viewer` in the `cpp/build` directory.

### Running the Game Data Viewer

After compiling, you must run the viewer from within the `cpp/build` directory for it to find the data files correctly:

```bash
cd cpp/build
./game_data_viewer
```

This will launch a GUI window displaying the contents of `public/materials.json`.

## C++ Game Simulator

An experimental ImGui-based application that exposes the core C++ character logic
outside of Unreal Engine. It allows tweaking base attributes and seeing the
resulting effective stats for a prototype character.

### Compiling the Game Simulator

Follow the same setup steps as the data viewer. After running `cmake ..` from the
`cpp/build` directory, build the simulator target:

```bash
make game_simulator
```

### Running the Game Simulator

Launch from the `cpp/build` directory:

```bash
./game_simulator
```

This opens a window where you can adjust race and stats and immediately see the
computed values using the shared game formulas.
