#pragma once

#ifndef COREMINIMAL_H
#define COREMINIMAL_H

// Mock UE macros for standalone compilation
#define UENUM(BlueprintType)
#define USTRUCT(BlueprintType)
#define UPROPERTY(EditAnywhere, BlueprintReadWrite, Category)
#define GENERATED_BODY()
#define UMETA(DisplayName)

#endif


UENUM(BlueprintType)
enum class EArmorClass : uint8 {
    None UMETA(DisplayName = "None"),
    Light UMETA(DisplayName = "Light"),
    Medium UMETA(DisplayName = "Medium"),
    Heavy UMETA(DisplayName = "Heavy")
};

UENUM(BlueprintType)
enum class EDamageType : uint8 {
    Slash UMETA(DisplayName = "Slash"),
    Pierce UMETA(DisplayName = "Pierce"),
    Blunt UMETA(DisplayName = "Blunt")
};

UENUM(BlueprintType)
enum class EElementType : uint8 {
    Fire UMETA(DisplayName = "Fire"),
    Earth UMETA(DisplayName = "Earth"),
    Wind UMETA(DisplayName = "Wind"),
    Water UMETA(DisplayName = "Water")
};

UENUM(BlueprintType)
enum class ERace : uint8 {
    Human UMETA(DisplayName = "Human"),
    Dwarf UMETA(DisplayName = "Dwarf"),
    Elf UMETA(DisplayName = "Elf"),
    Orc UMETA(DisplayName = "Orc"),
    Goliath UMETA(DisplayName = "Goliath"),
    Fae UMETA(DisplayName = "Fae")
};

UENUM(BlueprintType)
enum class EShieldType : uint8 {
    None UMETA(DisplayName = "None"),
    Buckler UMETA(DisplayName = "Buckler"),
    Round UMETA(DisplayName = "Round"),
    Kite UMETA(DisplayName = "Kite"),
    Tower UMETA(DisplayName = "Tower")
};

UENUM(BlueprintType)
enum class EWeaponType : uint8 {
    Sword UMETA(DisplayName = "Sword"),
    Axe UMETA(DisplayName = "Axe"),
    Hammer UMETA(DisplayName = "Hammer"),
    Spear UMETA(DisplayName = "Spear"),
    Dagger UMETA(DisplayName = "Dagger"),
    Bow UMETA(DisplayName = "Bow"),
    Crossbow UMETA(DisplayName = "Crossbow"),
    Sling UMETA(DisplayName = "Sling"),
    Lance UMETA(DisplayName = "Lance")
};

UENUM(BlueprintType)
enum class ESiegeWeaponType : uint8 {
    Catapult UMETA(DisplayName = "Catapult"),
    BatteringRam UMETA(DisplayName = "Battering Ram"),
    Trebuchet UMETA(DisplayName = "Trebuchet"),
    Ballista UMETA(DisplayName = "Ballista")
};

namespace Game {
    using ArmorClass = EArmorClass;
    using DamageType = EDamageType;
    using ElementType = EElementType;
    using Race = ERace;
    using ShieldType = EShieldType;
    using WeaponType = EWeaponType;
    using SiegeWeaponType = ESiegeWeaponType;
}

UENUM(BlueprintType)
enum class EMountSpeed : uint8 {
    Walk UMETA(DisplayName = "Walk"),
    Trot UMETA(DisplayName = "Trot"),
    Canter UMETA(DisplayName = "Canter"),
    Gallop UMETA(DisplayName = "Gallop")
};

USTRUCT(BlueprintType)
struct FPlayerStats {
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats")
    int32 Strength = 0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats")
    int32 Dexterity = 0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats")
    int32 Intelligence = 0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats")
    int32 Psyche = 0;
};

UENUM(BlueprintType)
enum class ECraftingProfession : uint8 {
    ArmorSmithing UMETA(DisplayName = "Armor Smithing"),
    WeaponSmithing UMETA(DisplayName = "Weapon Smithing"),
    Bowyer UMETA(DisplayName = "Bowyer"),
    ShieldCrafting UMETA(DisplayName = "Shield Crafting"),
    Alchemy UMETA(DisplayName = "Alchemy"),
    Cooking UMETA(DisplayName = "Cooking"),
    Enchanting UMETA(DisplayName = "Enchanting"),
    Artificer UMETA(DisplayName = "Artificer"),
    JewelryCrafting UMETA(DisplayName = "Jewelry Crafting")
};

UENUM(BlueprintType)
enum class EPlayerState : uint8 {
    OutOfCombat UMETA(DisplayName = "Out of Combat"),
    InCombat UMETA(DisplayName = "In Combat"),
    Mounted UMETA(DisplayName = "Mounted"),
    Swimming UMETA(DisplayName = "Swimming"),
    Falling UMETA(DisplayName = "Falling")
};

UENUM(BlueprintType)
enum class EPlayerPosture : uint8 {
    Stand UMETA(DisplayName = "Stand"),
    Crouch UMETA(DisplayName = "Crouch"),
    Crawl UMETA(DisplayName = "Crawl"),
    Walk UMETA(DisplayName = "Walk"),
    Jog UMETA(DisplayName = "Jog"),
    Run UMETA(DisplayName = "Run"),
    Sprint UMETA(DisplayName = "Sprint")
};
