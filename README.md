# Game Simulator

**Version:** 16.0

This project contains a web-based game simulator and a C++ tool to view the game data.

## Running the Webpage

The webpage needs to be served by a local web server for all features to work correctly. Opening the `index.html` file directly in your browser from the file system will not work.

1.  **Navigate to the `public` directory:**
    ```bash
    cd public
    ```

2.  **Start a simple web server:**
    If you have Python 3, you can use its built-in web server. The automated tests run on port 3000, so it's a good choice.
    ```bash
    python3 -m http.server 3000
    ```
    If you need to use a different port, you can specify it. For example, for port 8000:
    ```bash
    python3 -m http.server 8000
    ```
    Alternatively, if you have Node.js and npm installed, you can use the `serve` package.
    ```bash
    npx serve -l 3000
    ```

3.  **Open the webpage in your browser:**
    Open your web browser and go to the following address (replace the port if you used a different one):
    [http://localhost:3000](http://localhost:3000)

    You should now see the website, and the simulator should be fully functional.

## C++ Game Data Viewer

This is a GUI tool to display the contents of the material database.

### Compiling the Game Data Viewer

The C++ project uses CMake. The easiest way to compile on Linux or macOS is to use the provided build script.

#### Compiling with the Build Script (Recommended for Linux/macOS)

From the root directory of the project, run:
```bash
./build.sh
```
This will create the executable at `cpp/build/game_data_viewer`.

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
