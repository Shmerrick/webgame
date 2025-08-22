#ifndef MAGICSYSTEM_H
#define MAGICSYSTEM_H

#include "DataTypes.h"
#include <string>
#include <map>

namespace Game {

// Enum for Entropy Schools
enum class EntropySchool {
    Radiance,
    Void
};

// Enums for spell properties
enum class SpellRange { Touch, Short, Long, Siege };
enum class SpellDamage { Low, Medium, High, Extreme };
enum class SpellAoE { Single, Small, Medium, Large };

// A class to represent a spell's definition
class Spell {
public:
    Spell(const std::string& name, ElementType element, SpellRange range, SpellDamage damage, SpellAoE aoe)
        : name(name), element(element), range(range), damage(damage), aoe(aoe) {}

    const std::string& getName() const { return name; }
    ElementType getElement() const { return element; }
    SpellRange getRange() const { return range; }
    SpellDamage getDamage() const { return damage; }
    SpellAoE getAoE() const { return aoe; }

private:
    std::string name;
    ElementType element;
    SpellRange range;
    SpellDamage damage;
    SpellAoE aoe;
};

class MagicSystem {
public:
    // Mana Cost Calculation based on the formula from the document
    static int CalculateManaCost(const Spell& spell) {
        const int baseCost = 20;

        static const std::map<SpellRange, double> rangeMults = {
            {SpellRange::Touch, 1.0}, {SpellRange::Short, 1.2},
            {SpellRange::Long, 1.5}, {SpellRange::Siege, 2.0}
        };
        static const std::map<SpellDamage, double> damageMults = {
            {SpellDamage::Low, 0.8}, {SpellDamage::Medium, 1.0},
            {SpellDamage::High, 1.3}, {SpellDamage::Extreme, 1.6}
        };
        static const std::map<SpellAoE, double> aoeMults = {
            {SpellAoE::Single, 1.0}, {SpellAoE::Small, 1.15},
            {SpellAoE::Medium, 1.3}, {SpellAoE::Large, 1.5}
        };

        double r = rangeMults.count(spell.getRange()) ? rangeMults.at(spell.getRange()) : 1.0;
        double d = damageMults.count(spell.getDamage()) ? damageMults.at(spell.getDamage()) : 1.0;
        double a = aoeMults.count(spell.getAoE()) ? aoeMults.at(spell.getAoE()) : 1.0;

        return static_cast<int>(baseCost * r * d * a);
    }

    // Elemental Interaction Rules based on the table from the document
    static double GetElementalInteractionMultiplier(ElementType attacking, ElementType defending) {
        if (attacking == defending) {
            return 0.5; // "Nullify or Half"
        }

        static const std::map<ElementType, std::map<ElementType, double>> interactionTable = {
            { ElementType::Fire,  {{ ElementType::Earth, 2.0 }, { ElementType::Wind, 0.5 }, { ElementType::Water, 0.5 }}},
            { ElementType::Earth, {{ ElementType::Fire, 0.5 }, { ElementType::Wind, 2.0 }, { ElementType::Water, 0.5 }}},
            { ElementType::Wind,  {{ ElementType::Fire, 2.0 }, { ElementType::Earth, 2.0 }, { ElementType::Water, 0.5 }}},
            { ElementType::Water, {{ ElementType::Fire, 2.0 }, { ElementType::Earth, 2.0 }, { ElementType::Wind, 2.0 }}}
        };

        if (interactionTable.count(attacking) && interactionTable.at(attacking).count(defending)) {
            return interactionTable.at(attacking).at(defending);
        }

        return 1.0; // Default multiplier if no specific interaction is defined
    }
};

} // namespace Game

#endif // MAGICSYSTEM_H
