#ifndef DATATYPES_H
#define DATATYPES_H

#include <string>
#include <vector>

namespace Game {

enum class ArmorClass {
    None,
    Light,
    Medium,
    Heavy
};

enum class DamageType {
    Slash,
    Pierce,
    Blunt
};

enum class ElementType {
    Fire,
    Earth,
    Wind,
    Water
};

enum class Race {
    Human,
    Dwarf,
    Elf,
    Orc,
    Goliath,
    Fae
};

enum class ShieldType {
    None,
    Round,
    Kite,
    Tower
};

enum class WeaponType {
    Sword,
    Axe,
    Hammer,
    Spear,
    Dagger,
    Bow,
    Crossbow,
    Sling,
    Lance
};

enum class MountSpeed {
    Walk,
    Trot,
    Canter,
    Gallop
};

struct PlayerStats {
    int STR = 0;
    int DEX = 0;
    int INT = 0;
    int PSY = 0;
};

enum class CraftingProfession {
    ArmorSmithing,
    WeaponSmithing,
    Bowyer,
    ShieldCrafting,
    Alchemy,
    Cooking,
    Enchanting,
    Artificer,
    JewelryCrafting
};

enum class PlayerState {
    OutOfCombat,
    InCombat,
    Mounted,
    Swimming,
    Falling
};

enum class PlayerPosture {
    Stand,
    Crouch,
    Crawl,
    Walk,
    Jog,
    Run,
    Sprint
};

} // namespace Game

#endif // DATATYPES_H
