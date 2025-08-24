#include "AlchemySystem.h"
#include "Items.h"
#include <iostream>
#include <cassert>

int main() {
    try {
        Game::AlchemySystem alchemySystem;

        // Test a valid recipe
        auto healthPotion = alchemySystem.craft("Crimson_Petal", "Blessed_Water");
        assert(healthPotion != nullptr);
        assert(healthPotion->getName() == "Health Potion");
        auto* hp = dynamic_cast<Game::HealthPotion*>(healthPotion.get());
        assert(hp != nullptr);
        assert(hp->getHealth() == 50);
        std::cout << "Health Potion test passed." << std::endl;

        // Test another valid recipe
        auto explosive = alchemySystem.craft("Volcanic_Rock", "Firefly_Gland");
        assert(explosive != nullptr);
        assert(explosive->getName() == "Explosive");
        auto* ex = dynamic_cast<Game::Explosive*>(explosive.get());
        assert(ex != nullptr);
        assert(ex->getDamage() == 100);
        assert(ex->getRadius() == 5);
        std::cout << "Explosive test passed." << std::endl;

        // Test an invalid recipe
        auto invalidItem = alchemySystem.craft("Stick", "Spider_Venom");
        assert(invalidItem == nullptr);
        std::cout << "Invalid recipe test passed." << std::endl;

        std::cout << "All alchemy tests passed!" << std::endl;

    } catch (const std::exception& e) {
        std::cerr << "Test failed: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}
