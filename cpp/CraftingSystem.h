#ifndef CRAFTINGSYSTEM_H
#define CRAFTINGSYSTEM_H

#include "DataTypes.h"
#include "Items.h"
#include "Material.h"
#include <vector>
#include <stdexcept>
#include <fstream>
#include <sstream>
#include <map>

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

        // Load armor component volumes from CSV
        std::map<std::string, std::map<std::string, double>> armorVolumes;
        std::ifstream file("../armor_volumes.csv");
        std::string line;
        getline(file, line); // skip header
        while (getline(file, line)) {
            std::stringstream ss(line);
            std::string piece, component, volume_str;
            getline(ss, piece, ',');
            getline(ss, component, ',');
            getline(ss, volume_str, ',');
            armorVolumes[piece][component] = std::stod(volume_str);
        }

        if (armorVolumes.find(slot) == armorVolumes.end()) {
            throw std::runtime_error("Unknown armor slot: " + slot);
        }

        double outerVolume = armorVolumes[slot]["Outer"];
        double innerVolume = armorVolumes[slot]["Inner"];
        double bindingVolume = armorVolumes[slot]["Binding"];
        double totalVolume = outerVolume + innerVolume + bindingVolume;

        // Calculate required units of each material.
        // Formula: units = (volume_cm3 * density_g_cm3) / 100
        double requiredOuterUnits = (outerVolume * outerMaterial->getDensity()) / 100;
        double requiredInnerUnits = (innerVolume * innerMaterial->getDensity()) / 100;
        double requiredBindingUnits = (bindingVolume * bindingMaterial->getDensity()) / 100;

        // In a full implementation, you would check player inventory for these amounts.
        // For now, we assume the player has the required materials.

        Armor newArmor(slot, slotFactor, armorClass, outerMaterial, innerMaterial, bindingMaterial, totalVolume);

        // Calculate the total mass of the armor in kg.
        double totalMassGrams = (outerVolume * outerMaterial->getDensity()) +
                                (innerVolume * innerMaterial->getDensity()) +
                                (bindingVolume * bindingMaterial->getDensity());
        double totalMassKg = totalMassGrams / 1000.0;
        newArmor.setMass(totalMassKg);

        // Calculate durability
        double totalWeightedToughness = (outerVolume * outerMaterial->getToughness()) +
                                        (innerVolume * innerMaterial->getToughness()) +
                                        (bindingVolume * bindingMaterial->getToughness());
        double maxDurability = (totalWeightedToughness / totalVolume) * (totalVolume / 100.0);
        newArmor.setDurability(maxDurability, maxDurability);

        return newArmor;
    }

    // Weapon Smithing
    static Weapon CraftWeapon(
        WeaponType weaponType,
        const std::vector<std::pair<std::string, const Material*>>& componentMaterials,
        double hollowFactor = 0.0
    ) {
        // Load weapon component volumes from CSV
        std::map<std::string, std::map<std::string, double>> weaponVolumes;
        std::ifstream file("../weapon_volumes.csv");
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

    // Shield Crafting
    static Shield CraftShield(
        ShieldType shieldType,
        const std::vector<std::pair<std::string, const Material*>>& componentMaterials
    ) {
        // Load shield component volumes from CSV
        std::map<std::string, std::map<std::string, double>> shieldVolumes;
        std::ifstream file("../shield_volumes.csv");
        std::string line;
        getline(file, line); // skip header
        while (getline(file, line)) {
            std::stringstream ss(line);
            std::string type, component, volume_str;
            getline(ss, type, ',');
            getline(ss, component, ',');
            getline(ss, volume_str, ',');
            shieldVolumes[type][component] = std::stod(volume_str);
        }

        std::vector<Shield::ShieldComponent> components;
        double totalMassGrams = 0;
        double totalVolume = 0;
        double totalWeightedToughness = 0;

        auto getShieldTypeString = [](ShieldType type) -> std::string {
            switch (type) {
                case ShieldType::Buckler: return "Buckler";
                case ShieldType::Round: return "Round Shield";
                case ShieldType::Kite: return "Kite Shield";
                case ShieldType::Tower: return "Tower Shield";
                default: throw std::runtime_error("Unknown shield type");
            }
        };

        std::string shieldTypeStr = getShieldTypeString(shieldType);

        for (const auto& compMat : componentMaterials) {
            std::string componentName = compMat.first;
            const Material* material = compMat.second;
            double volume = shieldVolumes[shieldTypeStr][componentName];

            components.push_back({componentName, material, volume});
            totalMassGrams += volume * material->getDensity();
            totalVolume += volume;
            totalWeightedToughness += volume * material->getToughness();
        }

        Shield newShield(shieldType, components);

        double totalMassKg = totalMassGrams / 1000.0;
        newShield.setMass(totalMassKg);

        double maxDurability = (totalWeightedToughness / totalVolume) * (totalVolume / 100.0);
        newShield.setDurability(maxDurability, maxDurability);

        return newShield;
    }

    // Bowyer Crafting
    static Weapon CraftBow(
        WeaponType weaponType,
        const std::vector<std::pair<std::string, const Material*>>& componentMaterials
    ) {
        if (weaponType != WeaponType::Bow && weaponType != WeaponType::Crossbow && weaponType != WeaponType::Sling) {
            throw std::runtime_error("Invalid weapon type for Bowyer crafting.");
        }
        return CraftWeapon(weaponType, componentMaterials);
    }

    // Placeholders for other crafting professions
    // static Potion CraftPotion(...);
    // static Enchantment CraftEnchantment(...);
};

} // namespace Game

#endif // CRAFTINGSYSTEM_H
