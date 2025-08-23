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

        // Calculate durability
        double totalWeightedToughness = (volumes.outer * outerMaterial->getToughness()) +
                                        (volumes.inner * innerMaterial->getToughness()) +
                                        (volumes.binding * bindingMaterial->getToughness());
        double maxDurability = (totalWeightedToughness / volumes.total) * (volumes.total / 100.0);
        newArmor.setDurability(maxDurability, maxDurability);

        return newArmor;
    }

#include <fstream>
#include <sstream>
#include <map>

    // Weapon Smithing
    static Weapon CraftWeapon(
        WeaponType weaponType,
        const std::vector<std::pair<std::string, const Material*>>& componentMaterials,
        double hollowFactor = 0.0
    ) {
        // Load weapon component volumes from CSV
        std::map<std::string, std::map<std::string, double>> weaponVolumes;
        std::ifstream file("weapon_volumes.csv");
        std::string line;
        getline(file, line); // skip header
        while (getline(file, line)) {
            std::stringstream ss(line);
            std::string type, component, volume_str;
            getline(ss, type, ',');
            getline(ss, component, ',');
            getline(ss, volume_str, ',');
            weaponVolumes[type][component] = std::stod(volume_str);
        }

        std::vector<Weapon::WeaponComponent> components;
        double totalMassGrams = 0;
        double totalVolume = 0;
        double totalWeightedToughness = 0;

        // EWeaponType enum to string mapping
        auto getWeaponTypeString = [](WeaponType type) -> std::string {
            switch (type) {
                case WeaponType::Sword: return "Sword";
                case WeaponType::Axe: return "Axe";
                case WeaponType::Hammer: return "Hammer";
                case WeaponType::Spear: return "Spear";
                case WeaponType::Dagger: return "Dagger";
                case WeaponType::Bow: return "Bow";
                case WeaponType::Crossbow: return "Crossbow";
                case WeaponType::Sling: return "Sling";
                case WeaponType::Lance: return "Lance";
                default: throw std::runtime_error("Unknown weapon type");
            }
        };

        std::string weaponTypeStr = getWeaponTypeString(weaponType);

        for (const auto& compMat : componentMaterials) {
            std::string componentName = compMat.first;
            const Material* material = compMat.second;
            double volume = weaponVolumes[weaponTypeStr][componentName];

            if (componentName == "Handle" || componentName == "Shaft" || componentName == "Stave") {
                volume *= (1.0 - hollowFactor);
            }

            components.push_back({componentName, material, volume});
            totalMassGrams += volume * material->getDensity();
            totalVolume += volume;
            totalWeightedToughness += volume * material->getToughness();
        }

        Weapon newWeapon(weaponType, components);

        double totalMassKg = totalMassGrams / 1000.0;
        newWeapon.setMass(totalMassKg);

        double maxDurability = (totalWeightedToughness / totalVolume) * (totalVolume / 100.0);
        if (hollowFactor > 0.0) {
            maxDurability *= (1.0 - (hollowFactor * 0.5)); // Penalize hollowed weapons
        }
        newWeapon.setDurability(maxDurability, maxDurability);

        return newWeapon;
    }

    // Placeholders for other crafting professions
    // static Shield CraftShield(...);
    // static Potion CraftPotion(...);
    // static Enchantment CraftEnchantment(...);
};

} // namespace Game

#endif // CRAFTINGSYSTEM_H
