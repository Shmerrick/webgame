#ifndef ITEMS_H
#define ITEMS_H

#include "DataTypes.h"
#include "Formulas.h"
#include <string>
#include <vector>
#include <map>

namespace Game {

class PlayerCharacter;
class Material;

class Item {
public:
    virtual ~Item() = default;
    const std::string& getName() const { return name; }
    void setName(const std::string& name) { this->name = name; }
    double getDurability() const { return durability; }
    double getMaxDurability() const { return maxDurability; }
    void setDurability(double newDurability, double newMaxDurability) {
        this->durability = newDurability;
        this->maxDurability = newMaxDurability;
    }
    virtual void setMass(double mass) {}

protected:
    std::string name;
    double durability = 0;
    double maxDurability = 0;
};

class Armor : public Item {
public:
    Armor() : slot(""), slotFactor(0), armorClass(ArmorClass::None),
              outerLayer(nullptr), innerLayer(nullptr), binding(nullptr), volume(0) {}

    Armor(const std::string& slot, int slotFactor, ArmorClass armorClass,
          const Material* outer, const Material* inner, const Material* binding, double volume)
        : slot(slot), slotFactor(slotFactor), armorClass(armorClass),
          outerLayer(outer), innerLayer(inner), binding(binding), volume(volume) {}

    const std::string& getSlot() const { return slot; }
    int getSlotFactor() const { return slotFactor; }
    ArmorClass getArmorClass() const { return armorClass; }
    double getVolume() const { return volume; }
    double getMass() const { return massKg; }
    void setMass(double mass) { massKg = mass; }

    struct DefenseStats {
        double slash = 0; double pierce = 0; double blunt = 0; double magic = 0;
    };

    DefenseStats getDefenseStats() const {
        if (!outerLayer || !innerLayer || !binding) {
            return DefenseStats{};
        }
        // Placeholder logic
        return DefenseStats{0.5, 0.5, 0.5, 0.5};
    }

private:
    std::string slot;
    int slotFactor;
    ArmorClass armorClass;

    const Material* outerLayer;
    const Material* innerLayer;
    const Material* binding;
    double volume;
    double massKg = 0;
};

class Weapon : public Item {
public:
    struct WeaponComponent {
        std::string name;
        const Material* material;
        double volume;
    };

    Weapon(WeaponType type, std::vector<WeaponComponent> components)
        : weaponType(type), components(std::move(components)) {}

    void setMass(double mass) override { massKg = mass; }
    WeaponType getWeaponType() const { return weaponType; }

    struct DamageOutput {
        double totalDamage = 0;
        std::map<DamageType, double> physicalParts;
        std::map<std::string, double> elementalParts;
        int staminaCost = 0;
    };

private:
    WeaponType weaponType;
    double massKg = 0;
    int baseStaminaCost = 0;
    std::vector<WeaponComponent> components;
    double rawOffenseSlash = 0;
    double rawOffensePierce = 0;
    double rawOffenseBlunt = 0;
};

class Shield : public Item {
public:
    struct ShieldComponent {
        std::string name;
        const Material* material;
        double volume;
    };

    Shield(ShieldType type, std::vector<ShieldComponent> components)
        : shieldType(type), components(std::move(components)) {}

    void setMass(double mass) override { massKg = mass; }
    ShieldType getShieldType() const { return shieldType; }

private:
    ShieldType shieldType;
    double massKg = 0;
    std::vector<ShieldComponent> components;
};

class SiegeWeapon : public Item {
public:
    struct SiegeComponent {
        std::string name;
        const Material* material;
        double volume;
    };

    SiegeWeapon(SiegeWeaponType type, std::vector<SiegeComponent> components)
        : siegeWeaponType(type), components(std::move(components)) {}

    void setMass(double mass) override { massKg = mass; }
    SiegeWeaponType getSiegeWeaponType() const { return siegeWeaponType; }

private:
    SiegeWeaponType siegeWeaponType;
    double massKg = 0;
    std::vector<SiegeComponent> components;
};

class Ring : public Item {
public:
    Ring(const Material* metal, int tier) : metal(metal), tier(tier) {
        // Determine attribute and roll modifier
    }

    const Material* getMetal() const { return metal; }
    int getTier() const { return tier; }
    std::string getModifiedStat() const { return modifiedStat; }
    int getModifierValue() const { return modifierValue; }

    void setModifiedStat(const std::string& stat) { modifiedStat = stat; }
    void setModifierValue(int value) { modifierValue = value; }

private:
    const Material* metal;
    int tier;
    std::string modifiedStat; // "Intelligence" or "Strength"
    int modifierValue;
};

class Earring : public Item {
public:
    Earring(const Material* metal, int tier) : metal(metal), tier(tier) {
        // Determine attribute and roll modifier
    }

    const Material* getMetal() const { return metal; }
    int getTier() const { return tier; }
    std::string getModifiedStat() const { return modifiedStat; }
    int getModifierValue() const { return modifierValue; }

    void setModifiedStat(const std::string& stat) { modifiedStat = stat; }
    void setModifierValue(int value) { modifierValue = value; }

private:
    const Material* metal;
    int tier;
    std::string modifiedStat; // "Dexterity" or "Psyche"
    int modifierValue;
};

class Amulet : public Item {
public:
    Amulet(const Material* metal, int tier) : metal(metal), tier(tier) {
        // Determine skill and roll modifier
    }

    const Material* getMetal() const { return metal; }
    int getTier() const { return tier; }
    std::string getModifiedSkill() const { return modifiedSkill; }
    int getSkillIncrease() const { return skillIncrease; }

    void setModifiedSkill(const std::string& skill) { modifiedSkill = skill; }
    void setSkillIncrease(int value) { skillIncrease = value; }

private:
    const Material* metal;
    int tier;
    std::string modifiedSkill;
    int skillIncrease;
};

} // namespace Game

#endif // ITEMS_H
