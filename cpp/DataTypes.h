#pragma once

#ifndef COREMINIMAL_H
#define COREMINIMAL_H

// Mock UE macros for standalone compilation
#define UENUM(...)
#define USTRUCT(...)
#define UCLASS(...)
#define UFUNCTION(...)
#define UPROPERTY(...)
#define GENERATED_BODY()
#define UMETA(...)

#endif


#include <cstdint>
using uint8 = std::uint8_t;
using int32 = std::int32_t;

enum class EArmorClass {
    None,
    Light,
    Medium,
    Heavy
};

enum class EDamageType {
    Slash,
    Pierce,
    Blunt
};

enum class EElementType {
    Fire,
    Earth,
    Wind,
    Water
};

enum class ERace {
    Human,
    Dwarf,
    Elf,
    Orc,
    Goliath,
    Fae
};

enum class EShieldType {
    None,
    Buckler,
    Round,
    Kite,
    Tower
};

enum class EWeaponType {
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

enum class ESiegeWeaponType {
    Catapult,
    BatteringRam,
    Trebuchet,
    Ballista
};

enum class EJewelryType {
    Ring,
    Earring,
    Amulet
};

namespace Game {
    using ArmorClass = EArmorClass;
    using DamageType = EDamageType;
    using ElementType = EElementType;
    using Race = ERace;
    using ShieldType = EShieldType;
    using WeaponType = EWeaponType;
    using SiegeWeaponType = ESiegeWeaponType;
    using JewelryType = EJewelryType;
}

enum class EMountSpeed {
    Walk,
    Trot,
    Canter,
    Gallop
};

struct FPlayerStats {
    int Strength = 0;
    int Dexterity = 0;
    int Intelligence = 0;
    int Psyche = 0;
};

enum class ECraftingProfession {
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

enum class EPlayerState {
    OutOfCombat,
    InCombat,
    Mounted,
    Swimming,
    Falling
};

enum class EPlayerPosture {
    Stand,
    Crouch,
    Crawl,
    Walk,
    Jog,
    Run,
    Sprint
};
