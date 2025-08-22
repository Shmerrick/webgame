#ifndef MATERIAL_H
#define MATERIAL_H

#include <string>
#include <vector>
#include <map>
#include "Formulas.h" // For Formulas::MaterialProperties

namespace Game {

class Material {
public:
    // Default constructor
    Material() = default;

    // --- Getters for identification ---
    const std::string& getID() const { return id; }
    const std::string& getName() const { return name; }
    const std::string& getFamily() const { return family; }
    int getTier() const { return tier; }

    // --- Getters for gameplay values ---
    double getOffenseSlash() const { return offense_slash; }
    double getOffensePierce() const { return offense_pierce; }
    double getOffenseBlunt() const { return offense_blunt; }
    double getDefenseSlash() const { return defense_slash; }
    double getDefensePierce() const { return defense_pierce; }
    double getDefenseBlunt() const { return defense_blunt; }
    double getElementFire() const { return element_fire; }
    double getElementWater() const { return element_water; }
    double getElementWind() const { return element_wind; }
    double getElementEarth() const { return element_earth; }
    double getHeatRetention() const { return heat_retention; }

private:
    // Allow MaterialDatabase to populate private members
    friend class MaterialDatabase;

    // Identification
    std::string id;
    std::string name;
    std::string family;
    int tier = 0;

    // Gameplay Values (pre-calculated and loaded)
    double offense_slash = 0;
    double offense_pierce = 0;
    double offense_blunt = 0;
    double defense_slash = 0;
    double defense_pierce = 0;
    double defense_blunt = 0;
    double element_fire = 0;
    double element_water = 0;
    double element_wind = 0;
    double element_earth = 0;
    double heat_retention = 0;
};

class MaterialDatabase {
public:
    // Singleton access
    static MaterialDatabase& getInstance() {
        static MaterialDatabase instance;
        return instance;
    }

    // Deleted copy constructor and assignment operator to enforce singleton pattern
    MaterialDatabase(MaterialDatabase const&) = delete;
    void operator=(MaterialDatabase const&)  = delete;

    // Method to load materials from a file (e.g., JSON).
    // The implementation would require a JSON parsing library.
    bool loadFromFile(const std::string& filepath) {
        // In a full implementation, this method would:
        // 1. Read the specified file.
        // 2. Parse the data (e.g., from JSON).
        // 3. Create Material objects and populate their members.
        // 4. Store the materials in the 'materials' map.

        // For now, this is a placeholder.
        return true;
    }

    const Material* getMaterialByID(const std::string& id) const {
        auto it = materials.find(id);
        if (it != materials.end()) {
            return &it->second;
        }
        return nullptr; // Return nullptr if not found
    }

private:
    // Private constructor for singleton
    MaterialDatabase() = default;

    std::map<std::string, Material> materials;
};

} // namespace Game

#endif // MATERIAL_H
