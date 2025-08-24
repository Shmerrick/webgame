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
#include <random>
#include <string>
#include "json.hpp"

// No SiegeSystem.h needed as SiegeWeapon is in Items.h now

using json = nlohmann::json;

namespace Game {

class CraftingSystem {
public:
    static void SetDataPath(const std::string& path) { dataPath = path; }

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

        // Load armor component volumes from JSON once and reuse
        loadArmorVolumes();

        if (armorVolumesCache.find(slot) == armorVolumesCache.end()) {
            throw std::runtime_error("Unknown armor slot: " + slot);
        }

        double outerVolume = armorVolumesCache[slot]["Outer"];
        double innerVolume = armorVolumesCache[slot]["Inner"];
        double bindingVolume = armorVolumesCache[slot]["Binding"];
        double totalVolume = outerVolume + innerVolume + bindingVolume;

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
        // Load weapon component volumes from JSON once and reuse
        loadWeaponVolumes();

        std::vector<Weapon::WeaponComponent> components;
        double totalMassGrams = 0;
        double totalVolume = 0;
        double totalWeightedToughness = 0;

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
            double volume = weaponVolumesCache[weaponTypeStr][componentName];

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
        // Load shield component volumes from JSON once and reuse
        loadShieldVolumes();

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
            double volume = shieldVolumesCache[shieldTypeStr][componentName];

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

    // Siege Weapon Crafting
    static SiegeWeapon CraftSiegeWeapon(
        SiegeWeaponType siegeWeaponType,
        const std::vector<std::pair<std::string, const Material*>>& componentMaterials
    ) {
        // Load siege weapon component volumes from JSON once and reuse
        loadSiegeVolumes();

        std::vector<SiegeWeapon::SiegeComponent> components;
        double totalMassGrams = 0;
        double totalVolume = 0;
        double totalWeightedToughness = 0;

        auto getSiegeWeaponTypeString = [](SiegeWeaponType type) -> std::string {
            switch (type) {
                case SiegeWeaponType::Catapult: return "Catapult";
                case SiegeWeaponType::BatteringRam: return "Battering Ram";
                case SiegeWeaponType::Trebuchet: return "Trebuchet";
                case SiegeWeaponType::Ballista: return "Ballista";
                default: throw std::runtime_error("Unknown siege weapon type");
            }
        };

        std::string siegeWeaponTypeStr = getSiegeWeaponTypeString(siegeWeaponType);

        for (const auto& compMat : componentMaterials) {
            std::string componentName = compMat.first;
            const Material* material = compMat.second;
            double volume = siegeVolumesCache[siegeWeaponTypeStr][componentName];

            components.push_back({componentName, material, volume});
            totalMassGrams += volume * material->getDensity();
            totalVolume += volume;
            totalWeightedToughness += volume * material->getToughness();
        }

        SiegeWeapon newSiegeWeapon(siegeWeaponType, components);

        double totalMassKg = totalMassGrams / 1000.0;
        newSiegeWeapon.setMass(totalMassKg);

        double maxDurability = (totalWeightedToughness / totalVolume) * (totalVolume / 100.0);
        newSiegeWeapon.setDurability(maxDurability, maxDurability);

        return newSiegeWeapon;
    }

    // Jewelry Crafting
    static Item* CraftJewelry(
        JewelryType jewelryType,
        const Material* metal,
        int tier
    ) {
        if (!metal) {
            throw std::runtime_error("Metal material is required for jewelry crafting.");
        }

        std::random_device rd;
        std::mt19937 gen(rd());

        double durability = metal->getToughness() * 10 * tier;

        if (jewelryType == JewelryType::Ring) {
            Ring* newRing = new Ring(metal, tier);
            newRing->setDurability(durability, durability);

            std::uniform_int_distribution<> attrib_dist(0, 1);
            std::string attribute = (attrib_dist(gen) == 0) ? "Intelligence" : "Strength";

            std::uniform_int_distribution<> roll_dist(1, tier);
            int roll = roll_dist(gen);

            newRing->setModifiedStat(attribute);
            newRing->setBonus(roll);

            return newRing;
        }
        else if (jewelryType == JewelryType::Earring) {
            Earring* newEarring = new Earring(metal, tier);
            newEarring->setDurability(durability, durability);

            std::uniform_int_distribution<> attrib_dist(0, 1);
            std::string attribute = (attrib_dist(gen) == 0) ? "Dexterity" : "Psyche";

            std::uniform_int_distribution<> roll_dist(1, tier);
            int roll = roll_dist(gen);

            newEarring->setModifiedStat(attribute);
            newEarring->setBonus(roll);

            return newEarring;
        }
        else if (jewelryType == JewelryType::Amulet) {
            Amulet* newAmulet = new Amulet(metal, tier);
            newAmulet->setDurability(durability, durability);

            static const std::vector<std::string> skills = {
                "ArmorTraining", "BlockingAndShields", "Sword", "Axe", "Dagger", "Hammer", "Polesword",
                "Poleaxe", "Spear", "MountedCombat", "MountedArchery", "MountedMagery", "Anatomy",
                "BeastControl", "Taming", "Fire", "Water", "Earth", "Wind", "Radiance", "Void",
                "Stealth", "MeleeAmbush", "RangedAmbush", "ElementalAmbush"
            };
            std::uniform_int_distribution<> skill_dist(0, skills.size() - 1);
            std::string skill = skills[skill_dist(gen)];

            std::uniform_int_distribution<> roll_dist(1, 10 * tier);
            int roll = roll_dist(gen);

            newAmulet->setModifiedSkill(skill);
            newAmulet->setBonus(roll);

            return newAmulet;
        }

        return nullptr;
    }

private:
    inline static std::map<std::string, std::map<std::string, double>> armorVolumesCache;
    inline static std::map<std::string, std::map<std::string, double>> weaponVolumesCache;
    inline static std::map<std::string, std::map<std::string, double>> shieldVolumesCache;
    inline static std::map<std::string, std::map<std::string, double>> siegeVolumesCache;
    inline static bool armorVolumesLoaded = false;
    inline static bool weaponVolumesLoaded = false;
    inline static bool shieldVolumesLoaded = false;
    inline static bool siegeVolumesLoaded = false;
    inline static std::string dataPath = "";

    static void loadArmorVolumes() {
        if (armorVolumesLoaded)
            return;
        std::ifstream file(dataPath + "armor_volumes.json");
        if (!file.is_open()) {
            throw std::runtime_error("Could not open armor_volumes.json");
        }
        json data = json::parse(file);
        for (const auto& item : data) {
            armorVolumesCache[item["ArmorPiece"]][item["Component"]] = item["Volume_cm3"];
        }
        armorVolumesLoaded = true;
    }

    static void loadWeaponVolumes() {
        if (weaponVolumesLoaded)
            return;
        std::ifstream file(dataPath + "weapon_volumes.json");
        if (!file.is_open()) {
            throw std::runtime_error("Could not open weapon_volumes.json");
        }
        json data = json::parse(file);
        for (const auto& item : data) {
            weaponVolumesCache[item["WeaponType"]][item["Component"]] = item["Volume_cm3"];
        }
        weaponVolumesLoaded = true;
    }

    static void loadShieldVolumes() {
        if (shieldVolumesLoaded)
            return;
        std::ifstream file(dataPath + "shield_volumes.json");
        if (!file.is_open()) {
            throw std::runtime_error("Could not open shield_volumes.json");
        }
        json data = json::parse(file);
        for (const auto& item : data) {
            shieldVolumesCache[item["ShieldType"]][item["Component"]] = item["Volume_cm3"];
        }
        shieldVolumesLoaded = true;
    }

    static void loadSiegeVolumes() {
        if (siegeVolumesLoaded)
            return;
        std::ifstream file(dataPath + "siege_volumes.json");
        if (!file.is_open()) {
            throw std::runtime_error("Could not open siege_volumes.json");
        }
        json data = json::parse(file);
        for (const auto& item : data) {
            siegeVolumesCache[item["SiegeWeaponType"]][item["Component"]] = item["Volume_cm3"];
        }
        siegeVolumesLoaded = true;
    }
};

} // namespace Game

#endif // CRAFTINGSYSTEM_H
