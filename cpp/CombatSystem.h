#ifndef COMBATSYSTEM_H
#define COMBATSYSTEM_H

#include "DataTypes.h"
#include "Items.h"
#include "Character.h"
#include <string>
#include <map>
#include <cmath>

namespace Game {

class CombatSystem {
public:
    // 1. Tunable Knobs from the design document
    static constexpr double MSF = 1.0; // Mass Stamina Factor
    static constexpr double BlockFailPenalty = 0.25;
    static constexpr double RangedBlockPenalty = 0.50;
    static constexpr double BlockArc = 180.0; // degrees
    static constexpr double ParryImmunityDuration = 0.5; // seconds
    static constexpr double RiposteStateDuration = 2.0; // seconds
    static constexpr double RiposteDamageReduction = 0.50;
    static constexpr double BlockLockoutDuration = 1.5; // seconds
    static constexpr double ReblockPenaltyDuration = 2.0; // seconds

    // Struct to hold the result of a damage calculation
    struct DamageResult {
        double totalDamage = 0;
        std::map<DamageType, double> physicalParts;
        std::map<std::string, double> elementalParts;
    };

    // Main damage calculation function. The implementation would be complex.
    static DamageResult CalculateDamage(
        const PlayerCharacter& attacker,
        const PlayerCharacter& defender,
        const Weapon& weapon,
        const std::string& attackDirection,
        double chargeTime,
        double swingCompletion,
        MountSpeed mountSpeed = MountSpeed::Walk
    ) {
        // This function would dispatch to specialized functions based on weapon type
        // and apply all relevant formulas from the combat summary.
        DamageResult result;
        // Example of dispatching logic:
        // switch(weapon.getWeaponType()) {
        //    case WeaponType::Sword:
        //        result = CalculateMeleeDamage(...);
        //        break;
        //    case WeaponType::Bow:
        //        result = CalculateRangedDamage(...);
        //        break;
        //    ...
        // }
        return result;
    }

    // Stamina cost calculation for attacks
    static int CalculateStaminaCost(const Weapon& weapon, const std::string& attackType) {
        std::map<std::string, int> baseCosts = {
            {"Light", 20}, {"Medium", 30}, {"Heavy", 40}
        };
        int baseCost = baseCosts.count(attackType) ? baseCosts.at(attackType) : 0;

        // This requires the weapon's mass, which would be a method on the Weapon class.
        // double weaponMass = weapon.getMass();
        double weaponMass = 5.0; // Placeholder value

        return static_cast<int>(baseCost + (MSF * std::ceil(weaponMass)));
    }

    // Struct to hold the result of a defensive action
    struct DefenseResult {
        bool wasBlocked = false;
        bool wasParried = false;
        double damageMultiplier = 1.0;
    };

    // Resolves defensive actions like blocking and parrying.
    static DefenseResult ResolveDefense(
        const PlayerCharacter& defender,
        const std::string& incomingAttackDirection,
        bool isRangedAttack
    ) {
        // This function would check the defender's current state (e.g., isBlocking,
        // blockDirection, isParrying) and apply the rules from the combat summary.
        DefenseResult result;
        // Example logic:
        // if (defender.isParrying() && !isRangedAttack) {
        //     result.wasParried = true;
        //     result.damageMultiplier = 0.0;
        // } else if (defender.isBlocking()) {
        //     result.wasBlocked = true;
        //     if (defender.getBlockDirection() == incomingAttackDirection) {
        //         result.damageMultiplier = 0.0;
        //     } else {
        //         result.damageMultiplier = BlockFailPenalty;
        //     }
        // }
        return result;
    }

private:
    // Private helper functions for timing multipliers
    static double GetChargeMultiplier(double chargeTime) {
        if (chargeTime <= 0.5) return 0.0;
        if (chargeTime >= 1.0) return 1.0;
        return (chargeTime - 0.5) / 0.5;
    }

    static double GetSwingMultiplier(double swingCompletion) {
        if (swingCompletion < 0.6) return 0.0;
        return swingCompletion; // Assumes swingCompletion is a value between 0.0 and 1.0
    }
};

} // namespace Game

#endif // COMBATSYSTEM_H
