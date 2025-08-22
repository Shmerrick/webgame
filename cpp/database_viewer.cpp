#include <iostream>
#include <fstream>
#include <iomanip>
#include "json.hpp"

using json = nlohmann::json;

void display_material(const json& material) {
    std::cout << std::left << std::setw(30) << material["name"].get<std::string>()
              << std::setw(10) << std::fixed << std::setprecision(5) << material["slash"].get<double>()
              << std::setw(10) << material["pierce"].get<double>()
              << std::setw(10) << material["blunt"].get<double>()
              << std::setw(10) << material["magic"].get<double>() << std::endl;
}

int main() {
    std::ifstream f("../public/db.json");
    if (!f) {
        std::cerr << "Could not open file public/db.json" << std::endl;
        return 1;
    }

    json data = json::parse(f);

    std::cout << "--- Material Database ---" << std::endl;

    for (auto& [category, tiers] : data.items()) {
        std::cout << "\n// " << category << std::endl;
        for (auto& [tier_name, materials] : tiers.items()) {
            std::cout << "  " << tier_name << ":" << std::endl;
            std::cout << "  " << std::left << std::setw(30) << "Name"
                      << std::setw(10) << "Slash"
                      << std::setw(10) << "Pierce"
                      << std::setw(10) << "Blunt"
                      << std::setw(10) << "Magic" << std::endl;
            std::cout << "  " << std::string(70, '-') << std::endl;
            for (const auto& material : materials) {
                std::cout << "  ";
                display_material(material);
            }
        }
    }

    return 0;
}
