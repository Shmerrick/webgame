#ifndef ITEMS_H
#define ITEMS_H

#include "DataTypes.h"
#include "Material.h"
#include <string>
#include <vector>
#include <map>
#include <memory>

namespace Game {

// Forward declaration
class ItemDatabase;

class Item {
public:
    virtual ~Item() = default;

    // --- Getters ---
    const std::string& getId() const { return id; }
    const std::string& getName() const { return name; }
    const std::string& getItemType() const { return itemType; }
    const std::string& getType() const { return type; }
    int getMaterialTier() const { return materialTier; }
    int getQualityTier() const { return qualityTier; }
    const std::string& getIcon() const { return icon; }
    const std::string& getTexture() const { return texture; }
    double getMass() const { return massKg; }
    double getDurability() const { return durability; }
    double getMaxDurability() const { return maxDurability; }

    // --- Setters ---
    void setName(const std::string& newName) { name = newName; }
    void setMass(double newMass) { massKg = newMass; }
    void setDurability(double newDurability, double newMaxDurability) {
        durability = newDurability;
        maxDurability = newMaxDurability;
    }

protected:
    // --- Item Properties ---
    std::string id;
    std::string name;
    std::string itemType;
    std::string type;
    int materialTier = 0;
    int qualityTier = 0;
    std::string icon;
    std::string texture;
    double massKg = 0;
    double durability = 0;
    double maxDurability = 0;

    friend class ItemDatabase;
};

class Armor : public Item {
public:
    struct DefenseStats {
        double slash = 0;
        double pierce = 0;
        double blunt = 0;
        double magic = 0;
    };

    Armor() = default;
    Armor(const std::string& slot, int slotFactor, ArmorClass armorClass,
          const Material* outer, const Material* inner, const Material* binding, double volume) {
        this->name = slot;
        this->itemType = "Armor";
        this->type = "Heavy"; // This should be calculated based on ArmorClass
    }

    const DefenseStats& getDefenseStats() const { return defense; }

private:
    DefenseStats defense;
    friend class ItemDatabase;
};

class Weapon : public Item {
public:
    struct WeaponComponent {
        std::string name;
        const Material* material;
        double volume;
    };

    struct OffenseStats {
        double slash = 0;
        double pierce = 0;
        double blunt = 0;
    };

    Weapon() = default;
    Weapon(WeaponType weaponType, const std::vector<WeaponComponent>& components) {
        this->itemType = "Weapon";
        // name and type should be derived from weaponType and components
    }

    const OffenseStats& getOffenseStats() const { return offense; }
    bool isTwoHanded() const { return twoHanded; }
    void setTwoHanded(bool isTwoHanded) { twoHanded = isTwoHanded; }

private:
    OffenseStats offense;
    std::vector<WeaponComponent> components;
    bool twoHanded = false;
    friend class ItemDatabase;
};

class Shield : public Item {
public:
    struct ShieldComponent {
        std::string name;
        const Material* material;
        double volume;
    };

    struct DefenseStats {
        double slash = 0;
        double pierce = 0;
        double blunt = 0;
    };

    Shield() = default;
    Shield(ShieldType shieldType, const std::vector<ShieldComponent>& components) {
        this->itemType = "Shield";
        // name and type should be derived from shieldType and components
    }

    const DefenseStats& getDefenseStats() const { return defense; }

private:
    DefenseStats defense;
    std::vector<ShieldComponent> components;
    friend class ItemDatabase;
};

class SiegeWeapon : public Item {
public:
    struct SiegeComponent {
        std::string name;
        const Material* material;
        double volume;
    };

    SiegeWeapon() = default;
    SiegeWeapon(SiegeWeaponType siegeWeaponType, const std::vector<SiegeComponent>& components) {
        this->itemType = "SiegeWeapon";
        // name and type should be derived from siegeWeaponType and components
    }

private:
    std::vector<SiegeComponent> components;
};


class Ring : public Item {
public:
    Ring(const Material* metal, int tier) {
        this->itemType = "Jewelry";
        this->type = "Ring";
        this->name = metal->getName() + " Ring";
        this->materialTier = tier;
    }
    const std::string& getModifiedStat() const { return modifiedStat; }
    void setModifiedStat(const std::string& stat) { modifiedStat = stat; }
    int getBonus() const { return bonus; }
    void setBonus(int value) { bonus = value; }
private:
    std::string modifiedStat;
    int bonus = 0;
};

class Earring : public Item {
public:
    Earring(const Material* metal, int tier) {
        this->itemType = "Jewelry";
        this->type = "Earring";
        this->name = metal->getName() + " Earring";
        this->materialTier = tier;
    }
    const std::string& getModifiedStat() const { return modifiedStat; }
    void setModifiedStat(const std::string& stat) { modifiedStat = stat; }
    int getBonus() const { return bonus; }
    void setBonus(int value) { bonus = value; }
private:
    std::string modifiedStat;
    int bonus = 0;
};

class Amulet : public Item {
public:
    Amulet(const Material* metal, int tier) {
        this->itemType = "Jewelry";
        this->type = "Amulet";
        this->name = metal->getName() + " Amulet";
        this->materialTier = tier;
    }
    const std::string& getModifiedSkill() const { return modifiedSkill; }
    void setModifiedSkill(const std::string& skill) { modifiedSkill = skill; }
    int getBonus() const { return bonus; }
    void setBonus(int value) { bonus = value; }
private:
    std::string modifiedSkill;
    int bonus = 0;
};


class Potion : public Item {
public:
    const std::string& getEffect() const { return effect; }
    const std::map<std::string, double>& getProperties() const { return properties; }

private:
    std::string effect;
    std::map<std::string, double> properties;
    friend class ItemDatabase;
};

class HealthPotion : public Item {
public:
    HealthPotion(const std::string& name, double healthRestored)
        : health(healthRestored) {
        this->itemType = "Potion";
        this->name = name;
    }

    double getHealth() const { return health; }

private:
    double health;
};

class ManaPotion : public Item {
public:
    ManaPotion(const std::string& name, double manaRestored)
        : mana(manaRestored) {
        this->itemType = "Potion";
        this->name = name;
    }

    double getMana() const { return mana; }

private:
    double mana;
};

class StaminaPotion : public Item {
public:
    StaminaPotion(const std::string& name, double staminaRestored)
        : stamina(staminaRestored) {
        this->itemType = "Potion";
        this->name = name;
    }

    double getStamina() const { return stamina; }

private:
    double stamina;
};

class Explosive : public Item {
public:
    Explosive(const std::string& name, double damage, double radius)
        : damage(damage), radius(radius) {
        this->itemType = "Explosive";
        this->name = name;
    }

    double getDamage() const { return damage; }
    double getRadius() const { return radius; }

private:
    double damage;
    double radius;
};

class Poison : public Item {
public:
    Poison(const std::string& name, double damagePerSecond, double duration)
        : dps(damagePerSecond), duration(duration) {
        this->itemType = "Poison";
        this->name = name;
    }

    double getDamagePerSecond() const { return dps; }
    double getDuration() const { return duration; }

private:
    double dps;
    double duration;
};

class AOEHealingEffect : public Item {
public:
    AOEHealingEffect(const std::string& name, double healthRestored, double radius)
        : health(healthRestored), radius(radius) {
        this->itemType = "AOEEffect";
        this->name = name;
    }

    double getHealth() const { return health; }
    double getRadius() const { return radius; }

private:
    double health;
    double radius;
};

class FlammableLiquid : public Item {
public:
    FlammableLiquid(const std::string& name, double damagePerSecond, double duration)
        : dps(damagePerSecond), duration(duration) {
        this->itemType = "FlammableLiquid";
        this->name = name;
    }

    double getDamagePerSecond() const { return dps; }
    double getDuration() const { return duration; }

private:
    double dps;
    double duration;
};

} // namespace Game

#endif // ITEMS_H
