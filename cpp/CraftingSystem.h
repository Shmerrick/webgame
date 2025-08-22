#ifndef CRAFTINGSYSTEM_H
#define CRAFTINGSYSTEM_H

#include "DataTypes.h"
#include "Items.h"
#include "Material.h"
#include <vector>
#include <stdexcept>

namespace Game {

class CraftingSystem {
public:
    // Armor Smithing
    static Armor CraftArmor(
        const std::vector<const Material*>& materials,
        ArmorClass armorClass,
        const std::string& slot,
        int slotFactor
    ) {
        // This function would validate materials against a recipe and then construct the item.
        if (materials.size() < 3) {
            throw std::runtime_error("Not enough materials for armor crafting. Requires outer, inner, and binding.");
        }

        const Material* outer = materials[0];
        const Material* inner = materials[1];
        const Material* binding = materials[2];

        // The crafting rules mention mass calculation: (Σ material mass) × slot factor × class factor.
        // This would require a getMass() method on the Material class and a defined classFactor.
        // double totalMass = (outer->getMass() + inner->getMass() + binding->getMass()) * slotFactor * classFactor;

        Armor newArmor(slot, slotFactor, armorClass, outer, inner, binding);
        // newArmor.setMass(totalMass); // The Armor class would need a setMass method.

        return newArmor;
    }

    // Weapon Smithing
    static Weapon CraftWeapon(
        const std::vector<const Material*>& materials,
        WeaponType weaponType
    ) {
        // This function would validate materials and construct the weapon.
        if (materials.size() < 2) {
            throw std::runtime_error("Not enough materials for weapon crafting. Requires head and handle materials.");
        }

        const Material* head = materials[0];
        const Material* handle = materials[1];

        Weapon newWeapon(weaponType, head, handle);
        // Here you would calculate and set the weapon's final mass, damage values, etc.
        return newWeapon;
    }

    // Placeholders for other crafting professions
    // static Shield CraftShield(...);
    // static Potion CraftPotion(...);
    // static Enchantment CraftEnchantment(...);
};

} // namespace Game

#endif // CRAFTINGSYSTEM_H
