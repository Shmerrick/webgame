#include <iostream>
#include "CraftingSystem.h"
#include "Material.h"
#include "DataTypes.h"

int main() {
    try {
        // Load materials using the singleton MaterialDatabase
        Game::MaterialDatabase& db = Game::MaterialDatabase::getInstance();
        bool loaded = db.loadFromFile("../../public/materials.json");

        if (!loaded) {
            std::cerr << "Failed to load material database." << std::endl;
            return 1;
        }

        const Game::Material* outer = db.getMaterialByName("Steel 1020");
        const Game::Material* inner = db.getMaterialByName("Cowhide/Pigskin");
        const Game::Material* binding = db.getMaterialByName("Linen");

        if (!outer || !inner || !binding) {
            std::cerr << "Failed to find one or more materials." << std::endl;
            if (!outer) std::cerr << "Could not find Steel 1020" << std::endl;
            if (!inner) std::cerr << "Could not find Cowhide/Pigskin" << std::endl;
            if (!binding) std::cerr << "Could not find Linen" << std::endl;
            return 1;
        }

        std::vector<const Game::Material*> materials = {outer, inner, binding};

        // Test armor crafting
        Game::Armor helmet = Game::CraftingSystem::CraftArmor(materials, Game::ArmorClass::Heavy, "Helmet", 1);
        std::cout << "Successfully crafted " << helmet.getName() << std::endl;
        std::cout << "Mass: " << helmet.getMass() << " kg" << std::endl;
        std::cout << "Durability: " << helmet.getDurability() << "/" << helmet.getMaxDurability() << std::endl;

        // Test jewelry crafting
        auto ring = Game::CraftingSystem::CraftJewelry(Game::JewelryType::Ring, outer, 1);
        if (ring) {
            std::cout << "Successfully crafted " << ring->getName() << std::endl;
            std::cout << "Durability: " << ring->getDurability() << "/" << ring->getMaxDurability() << std::endl;
        }

    } catch (const std::exception& e) {
        std::cerr << "An error occurred: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}
