CXX = g++
CXXFLAGS = -std=c++17 -I/usr/include/SDL2 -I./imgui `sdl2-config --cflags`
LDFLAGS = `sdl2-config --libs` -lGL

SRCS = game_data_viewer.cpp imgui/imgui.cpp imgui/imgui_draw.cpp imgui/imgui_tables.cpp imgui/imgui_widgets.cpp imgui/backends/imgui_impl_sdl2.cpp imgui/backends/imgui_impl_opengl3.cpp
OBJS = $(SRCS:.cpp=.o)

TARGET = game_data_viewer

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CXX) $(OBJS) -o $(TARGET) $(LDFLAGS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	rm -f $(OBJS) $(TARGET)
