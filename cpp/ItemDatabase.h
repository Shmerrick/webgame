#ifndef ITEM_DATABASE_H
#define ITEM_DATABASE_H

#include "Items.h"
#include "json.hpp"
#include <string>
#include <vector>
#include <map>
#include <memory>

namespace Game {

class ItemDatabase {
public:
    ItemDatabase(const std::string& database_path);
    ~ItemDatabase();

    const Item* getItem(const std::string& itemId) const;
    const std::vector<const Item*>& getAllItems() const;

private:
    void load();
    void parseItem(const nlohmann::json& item_json, const std::string& category);

    std::string databasePath;
    std::map<std::string, std::unique_ptr<Item>> itemMap;
    std::vector<const Item*> allItemsVec;
};

} // namespace Game

#endif // ITEM_DATABASE_H
