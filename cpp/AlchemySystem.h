#ifndef ALCHEMY_SYSTEM_H
#define ALCHEMY_SYSTEM_H

#include "Items.h"
#include "Material.h"
#include <vector>
#include <string>
#include <fstream>
#include "json.hpp"
#include <stdexcept>
#include <algorithm>
#include <memory>

using json = nlohmann::json;

namespace Game {

struct Recipe {
    std::string name;
    std::string type;
    std::vector<std::string> ingredients;
    json properties;
};

class AlchemySystem {
public:
    AlchemySystem() {
        loadRecipes();
    }

    void loadRecipes() {
        std::ifstream f("../../public/alchemy_recipes.json");
        if (!f.is_open()) {
            throw std::runtime_error("Could not open alchemy_recipes.json");
        }
        json data = json::parse(f);
        for (const auto& item : data) {
            Recipe r;
            r.name = item.at("name");
            r.type = item.at("type");
            r.ingredients = item.at("ingredients").get<std::vector<std::string>>();
            r.properties = item.at("properties");
            recipes.push_back(r);
        }
    }

    std::unique_ptr<Item> craft(std::string ingredient1, std::string ingredient2) {
        for (const auto& recipe : recipes) {
            std::vector<std::string> sorted_ingredients = recipe.ingredients;
            std::sort(sorted_ingredients.begin(), sorted_ingredients.end());
            std::vector<std::string> provided_ingredients = {ingredient1, ingredient2};
            std::sort(provided_ingredients.begin(), provided_ingredients.end());

            if (sorted_ingredients == provided_ingredients) {
                if (recipe.type == "Potion") {
                    if (recipe.name == "Health Potion") {
                        return std::make_unique<HealthPotion>(recipe.name, recipe.properties.at("health"));
                    } else if (recipe.name == "Mana Potion") {
                        return std::make_unique<ManaPotion>(recipe.name, recipe.properties.at("mana"));
                    } else if (recipe.name == "Stamina Potion") {
                        return std::make_unique<StaminaPotion>(recipe.name, recipe.properties.at("stamina"));
                    }
                } else if (recipe.type == "Explosive") {
                    return std::make_unique<Explosive>(recipe.name, recipe.properties.at("damage"), recipe.properties.at("radius"));
                } else if (recipe.type == "Poison") {
                    return std::make_unique<Poison>(recipe.name, recipe.properties.at("damage_per_second"), recipe.properties.at("duration"));
                } else if (recipe.type == "AOEEffect") {
                    return std::make_unique<AOEHealingEffect>(recipe.name, recipe.properties.at("health"), recipe.properties.at("radius"));
                } else if (recipe.type == "FlammableLiquid") {
                    return std::make_unique<FlammableLiquid>(recipe.name, recipe.properties.at("damage_per_second"), recipe.properties.at("duration"));
                }
                // Other types can be added here
            }
        }
        return nullptr; // No recipe found
    }

private:
    std::vector<Recipe> recipes;
};

} // namespace Game

#endif // ALCHEMY_SYSTEM_H
