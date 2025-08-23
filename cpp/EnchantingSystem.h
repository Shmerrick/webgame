#ifndef ENCHANTING_SYSTEM_H
#define ENCHANTING_SYSTEM_H

#include "Items.h"
#include "Material.h"
#include <vector>
#include <string>

namespace Game {

class Enchantment : public Item {
public:
    Enchantment(const std::string& name, const std::string& effect) {
        this->name = name;
        this->effect = effect;
    }

    const std::string& getEffect() const { return effect; }

private:
    std::string effect;
};

class EnchantingSystem {
public:
    static Enchantment CraftEnchantment(const std::vector<const Material*>& runes) {
        // Basic implementation
        if (runes.empty()) {
            throw std::runtime_error("Cannot craft an enchantment with no runes.");
        }
        std::string enchantmentName = "Enchantment of " + runes[0]->getName();
        std::string effect = "A magical enchantment based on " + runes[0]->getName();
        return Enchantment(enchantmentName, effect);
    }
};

} // namespace Game

#endif // ENCHANTING_SYSTEM_H
