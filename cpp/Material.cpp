#include "Material.h"
#include "json.hpp"
#include <fstream>
#include <iostream>

using json = nlohmann::json;

namespace Game {

bool MaterialDatabase::loadFromFile(const std::string& filepath) {
    std::ifstream file(filepath);
    if (!file.is_open()) {
        std::cerr << "Could not open material file: " << filepath << std::endl;
        return false;
    }

    json data = json::parse(file);

    for (auto& [category, tiers] : data.items()) {
        for (auto& [tier_str, materials_in_tier] : tiers.items()) {
            for (auto& mat_json : materials_in_tier) {
                Material new_mat;
                new_mat.id = mat_json.value("rowName", "");
                new_mat.name = mat_json.value("name", "");
                new_mat.family = category;

                // Extract tier number from string like "T5"
                if (!tier_str.empty() && (tier_str[0] == 'T' || tier_str[0] == 't')) {
                    try {
                        new_mat.tier = std::stoi(tier_str.substr(1));
                    } catch (const std::invalid_argument& e) {
                        new_mat.tier = 0;
                    }
                }

                new_mat.offense_slash = mat_json.value("slash", 0.0);
                new_mat.offense_pierce = mat_json.value("pierce", 0.0);
                new_mat.offense_blunt = mat_json.value("blunt", 0.0);
                new_mat.defense_slash = mat_json.value("slash", 0.0); // Assuming defense is same as offense for now
                new_mat.defense_pierce = mat_json.value("pierce", 0.0);
                new_mat.defense_blunt = mat_json.value("blunt", 0.0);
                new_mat.element_fire = mat_json.value("fire", 0.0);
                new_mat.element_water = mat_json.value("water", 0.0);
                new_mat.element_wind = mat_json.value("wind", 0.0);
                new_mat.element_earth = mat_json.value("earth", 0.0);
                new_mat.density = mat_json.value("density", 0.0);
                new_mat.toughness = mat_json.value("toughness", 0.0);

                materials[new_mat.name] = new_mat;
            }
        }
    }

    return true;
}

} // namespace Game
