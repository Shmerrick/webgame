#include "ItemDatabase.h"
#include <fstream>
#include <iostream>

namespace Game {

ItemDatabase::ItemDatabase(const std::string& database_path) : databasePath(database_path) {
    load();
}

ItemDatabase::~ItemDatabase() {
    // smart pointers handle memory deallocation
}

void ItemDatabase::load() {
    std::ifstream db_file(databasePath);
    if (!db_file.is_open()) {
        std::cerr << "Error: Could not open item database file: " << databasePath << std::endl;
        return;
    }

    nlohmann::json db_json;
    db_file >> db_json;

    for (auto& [category, items] : db_json.items()) {
        if (items.is_array()) {
            for (const auto& item_json : items) {
                parseItem(item_json, category);
            }
        }
    }

    // Populate the vector for getAllItems()
    for(auto const& [id, item_ptr] : itemMap) {
        allItemsVec.push_back(item_ptr.get());
    }
}

void ItemDatabase::parseItem(const nlohmann::json& item_json, const std::string& category) {
    std::string itemType = item_json.value("item_type", "");
    std::unique_ptr<Item> newItem = nullptr;

    if (itemType == "Armor") {
        auto armor = std::make_unique<Armor>();
        if (item_json.contains("defense")) {
            const auto& defense_json = item_json["defense"];
            armor->defense.slash = defense_json.value("slash", 0.0);
            armor->defense.pierce = defense_json.value("pierce", 0.0);
            armor->defense.blunt = defense_json.value("blunt", 0.0);
            armor->defense.magic = defense_json.value("magic", 0.0);
        }
        newItem = std::move(armor);
    } else if (itemType == "Weapon") {
        auto weapon = std::make_unique<Weapon>();
         if (item_json.contains("offense")) {
            const auto& offense_json = item_json["offense"];
            weapon->offense.slash = offense_json.value("slash", 0.0);
            weapon->offense.pierce = offense_json.value("pierce", 0.0);
            weapon->offense.blunt = offense_json.value("blunt", 0.0);
        }
        newItem = std::move(weapon);
    } else if (itemType == "Shield") {
        auto shield = std::make_unique<Shield>();
        if (item_json.contains("defense")) {
            const auto& defense_json = item_json["defense"];
            shield->defense.slash = defense_json.value("slash", 0.0);
            shield->defense.pierce = defense_json.value("pierce", 0.0);
            shield->defense.blunt = defense_json.value("blunt", 0.0);
        }
        newItem = std::move(shield);
    } else if (itemType == "Potion") {
        auto potion = std::make_unique<Potion>();
        potion->effect = item_json.value("effect", "");
        if (item_json.contains("properties")) {
            for (auto& [key, val] : item_json["properties"].items()) {
                potion->properties[key] = val;
            }
        }
        newItem = std::move(potion);
    }
    // Add other item types here as needed

    if (newItem) {
        newItem->id = item_json.value("id", "");
        newItem->name = item_json.value("name", "");
        newItem->itemType = itemType;
        newItem->type = item_json.value("type", "");
        newItem->materialTier = item_json.value("material_tier", 0);
        newItem->qualityTier = item_json.value("quality_tier", 0);
        newItem->icon = item_json.value("icon", "");
        newItem->texture = item_json.value("texture", "");
        newItem->massKg = item_json.value("mass_kg", 0.0);

        itemMap[newItem->id] = std::move(newItem);
    }
}

const Item* ItemDatabase::getItem(const std::string& itemId) const {
    auto it = itemMap.find(itemId);
    if (it != itemMap.end()) {
        return it->second.get();
    }
    return nullptr;
}

const std::vector<const Item*>& ItemDatabase::getAllItems() const {
    return allItemsVec;
}

} // namespace Game
