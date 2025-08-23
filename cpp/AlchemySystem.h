#ifndef ALCHEMY_SYSTEM_H
#define ALCHEMY_SYSTEM_H

#include "Items.h"
#include "Material.h"
#include <vector>
#include <string>

namespace Game {

class Potion : public Item {
public:
    Potion(const std::string& name, const std::string& effect) {
        this->name = name;
        this->effect = effect;
    }

    const std::string& getEffect() const { return effect; }

private:
    std::string effect;
};

class AlchemySystem {
public:
    static Potion CraftPotion(const std::vector<const Material*>& ingredients) {
        // Basic implementation: effect is determined by the first ingredient
        if (ingredients.empty()) {
            throw std::runtime_error("Cannot craft a potion with no ingredients.");
        }
        std::string potionName = "Potion of " + ingredients[0]->getName();
        std::string effect = "A magical effect based on " + ingredients[0]->getName();
        return Potion(potionName, effect);
    }
};

} // namespace Game

#endif // ALCHEMY_SYSTEM_H
