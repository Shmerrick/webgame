#ifndef FORMULAS_H
#define FORMULAS_H

#include "DataTypes.h"
#include <cmath>
#include <numeric>
#include <map>
#include <vector>
#include <string>
#include <algorithm>

namespace Game {

class Formulas {
public:
    // Placeholder for material properties. This would be expanded in a Material class.
    struct MaterialProperties {
        double Hardness_norm = 0;
        double Density_norm = 0;
        double ElasticMod_norm = 0;
        double Toughness_norm = 0;
        double ThermalCond_norm = 0;
        double ChemRes_norm = 0;
        double WaterAbsorption_rel = 0;
        double ElectricalCond_norm = 0;
    };

    // 1. Offense Formulas
    static double CalculateOffenseSlash(const MaterialProperties& props) {
        return 0.6 * props.Hardness_norm + 0.4 * props.Density_norm;
    }

    static double CalculateOffensePierce(const MaterialProperties& props) {
        return 0.6 * props.Hardness_norm + 0.4 * props.ElasticMod_norm;
    }

    static double CalculateOffenseBlunt(const MaterialProperties& props) {
        return 0.6 * props.Density_norm + 0.4 * props.Toughness_norm;
    }

    // 2. Defense Formulas
    static double CalculateDefenseSlash(const MaterialProperties& props) {
        return 0.55 * props.Hardness_norm + 0.45 * props.Toughness_norm;
    }

    static double CalculateDefensePierce(const MaterialProperties& props) {
        return 0.55 * props.Hardness_norm + 0.45 * props.ElasticMod_norm;
    }

    static double CalculateDefenseBlunt(const MaterialProperties& props) {
        return 0.55 * (1.0 - props.ElasticMod_norm) + 0.45 * props.Toughness_norm;
    }

    // 3. Elemental Resistance Formulas
    static double CalculateElementFire(const MaterialProperties& props) {
        return 0.7 * (1.0 - props.ThermalCond_norm) + 0.3 * props.ChemRes_norm;
    }

    static double CalculateElementWater(const MaterialProperties& props) {
        return props.ChemRes_norm * (1.0 - 0.5 * props.WaterAbsorption_rel);
    }

    static double CalculateElementWind(const MaterialProperties& props) {
        return 1.0 - props.ElectricalCond_norm;
    }

    static double CalculateElementEarth(const MaterialProperties& props) {
        return 0.5 * props.Toughness_norm + 0.5 * props.Density_norm;
    }

    // 4. Environmental Formula
    static double CalculateHeatRetention(const MaterialProperties& props) {
        return 0.6 * (1.0 - props.ThermalCond_norm) + 0.4 * props.Density_norm;
    }

    // 5. Regeneration Formulas
    static int CalculateStamina(int DEX) {
        return 100 + (2 * DEX);
    }

    static int CalculateMana(int PSY) {
        return 100 + (2 * PSY);
    }

    enum class LoadoutCategory { Naked, Light, Medium, Heavy };

    static int CalculateRegenPerTick(int pool, LoadoutCategory category) {
        const double BASE_TICK_PCT = 0.10;
        std::map<LoadoutCategory, double> multipliers = {
            {LoadoutCategory::Naked, 1.00},
            {LoadoutCategory::Light, 0.75},
            {LoadoutCategory::Medium, 0.50},
            {LoadoutCategory::Heavy, 0.25}
        };
        double multiplier = multipliers.count(category) ? multipliers[category] : 1.0;
        return static_cast<int>(std::ceil(BASE_TICK_PCT * pool * multiplier));
    }

    // 6. Loadout Classification
    struct LoadoutResult {
        double S;
        double Smax;
        double R;
        LoadoutCategory category;
    };

    struct ArmorSlotInfo {
        ArmorClass armorClass;
        int factor;
    };

    static LoadoutResult CalculateLoadout(const std::vector<ArmorSlotInfo>& equippedArmor) {
        LoadoutResult result{};
        std::map<ArmorClass, int> class_values = {
            {ArmorClass::None, 0}, {ArmorClass::Light, 1}, {ArmorClass::Medium, 2}, {ArmorClass::Heavy, 3}
        };

        for (const auto& piece : equippedArmor) {
            result.S += piece.factor * class_values[piece.armorClass];
            result.Smax += piece.factor * class_values[ArmorClass::Heavy];
        }

        result.R = (result.Smax > 0) ? result.S / result.Smax : 0;

        if (result.R <= 0.40) {
            result.category = LoadoutCategory::Light;
        } else if (result.R <= 0.79) {
            result.category = LoadoutCategory::Medium;
        } else {
            result.category = LoadoutCategory::Heavy;
        }
        return result;
    }


    // 7. Strength Requirements for Shields
    static bool IsShieldUsable(ShieldType shield, int STR) {
        std::map<ShieldType, int> reqs = {
            {ShieldType::Round, 50}, {ShieldType::Kite, 75}, {ShieldType::Tower, 100}
        };
        if (reqs.count(shield)) {
            return STR >= reqs.at(shield);
        }
        return true; // For None shield
    }

    // 8. Damage Reduction by Armor Class
    struct DamageReduction {
        double physical;
        double magical;
    };
    static DamageReduction GetDamageReductionForClass(ArmorClass ac) {
        switch (ac) {
            case ArmorClass::Light:  return {0.25, 0.75};
            case ArmorClass::Medium: return {0.50, 0.50};
            case ArmorClass::Heavy:  return {0.75, 0.50}; // As per user request
            default:                 return {0.00, 0.00};
        }
    }

    // 9. Missing Armor Penalty
    static double CalculateIncomingDamageMultiplier(int numEquippedPieces) {
        const int TOTAL_ARMOR_SLOTS = 5; // Assuming helmet, torso, legs, gloves, boots
        int missingPieces = std::max(0, TOTAL_ARMOR_SLOTS - numEquippedPieces);
        return 1.0 + (static_cast<double>(missingPieces) * 0.15);
    }

    // 10. Crafting Rules
    static double CalculateMass(double totalMaterialMass, double slotFactor, double classFactor) {
        return totalMaterialMass * slotFactor * classFactor;
    }

    static double CalculatePieceDefense(double materialDefense, double classScalar) {
        const double PIECE_DEFENSE_CAP = 0.60;
        return std::min(materialDefense * classScalar, PIECE_DEFENSE_CAP);
    }
    // Global Defense Cap of 0.80 would be applied after summing all piece defenses.

    // 11. Magic System Formulas
    static int CalculateManaCost(int baseCost, double rangeMultiplier, double damageMultiplier, double aoeMultiplier) {
        return static_cast<int>(static_cast<double>(baseCost) * rangeMultiplier * damageMultiplier * aoeMultiplier);
    }
};

} // namespace Game

#endif // FORMULAS_H
