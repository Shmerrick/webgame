#ifndef ITEMS_H
#define ITEMS_H

#include "DataTypes.h"
#include "Material.h" // Include the missing header
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

    // Allow the database to populate private fields
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

    const DefenseStats& getDefenseStats() const { return defense; }

private:
    DefenseStats defense;
    friend class ItemDatabase;
};

class Weapon : public Item {
public:
    struct OffenseStats {
        double slash = 0;
        double pierce = 0;
        double blunt = 0;
    };

    const OffenseStats& getOffenseStats() const { return offense; }

private:
    OffenseStats offense;
    friend class ItemDatabase;
};

class Shield : public Item {
public:
    struct DefenseStats {
        double slash = 0;
        double pierce = 0;
        double blunt = 0;
    };

    const DefenseStats& getDefenseStats() const { return defense; }

private:
    DefenseStats defense;
    friend class ItemDatabase;
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

} // namespace Game

#endif // ITEMS_H
