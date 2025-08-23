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
        if (materials.size() < 3) {
            throw std::runtime_error("Not enough materials for armor crafting. Requires outer, inner, and binding.");
        }

        const Material* outerMaterial = materials[0];
        const Material* innerMaterial = materials[1];
        const Material* bindingMaterial = materials[2];

        // In a real implementation, this data would be loaded from a file into a database.
        struct ArmorComponentVolumes {
            double outer;
            double inner;
            double binding;
            double total;
        };
        auto getArmorComponentVolumes = [](const std::string& s) -> ArmorComponentVolumes {
            if (s == "Helmet") return {2100, 1050, 350, 3500};
            if (s == "Chestplate") return {6000, 3000, 1000, 10000};
            if (s == "Greaves") return {1200, 600, 200, 2000};
            if (s == "Boots") return {1800, 900, 300, 3000};
            if (s == "Gauntlets") return {900, 450, 150, 1500};
            throw std::runtime_error("Unknown armor slot: " + s);
        };

        ArmorComponentVolumes volumes = getArmorComponentVolumes(slot);

        // Calculate required units of each material.
        // Formula: units = (volume_cm3 * density_g_cm3) / 100
        double requiredOuterUnits = (volumes.outer * outerMaterial->getDensity()) / 100;
        double requiredInnerUnits = (volumes.inner * innerMaterial->getDensity()) / 100;
        double requiredBindingUnits = (volumes.binding * bindingMaterial->getDensity()) / 100;

        // In a full implementation, you would check player inventory for these amounts.
        // For now, we assume the player has the required materials.

        Armor newArmor(slot, slotFactor, armorClass, outerMaterial, innerMaterial, bindingMaterial, volumes.total);

        // Calculate the total mass of the armor in kg.
        double totalMassGrams = (volumes.outer * outerMaterial->getDensity()) +
                                (volumes.inner * innerMaterial->getDensity()) +
                                (volumes.binding * bindingMaterial->getDensity());
        double totalMassKg = totalMassGrams / 1000.0;
        newArmor.setMass(totalMassKg);

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
