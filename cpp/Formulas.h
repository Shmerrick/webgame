#pragma once

#include "CoreMinimal.h"
#include "DataTypes.h"
#include "Formulas.generated.h"

USTRUCT(BlueprintType)
struct FMaterialProperties {
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Material Properties")
    float Hardness = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Material Properties")
    float Density = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Material Properties")
    float ElasticModulus = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Material Properties")
    float Toughness = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Material Properties")
    float ThermalConductivity = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Material Properties")
    float ChemicalResistance = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Material Properties")
    float WaterAbsorption = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Material Properties")
    float ElectricalConductivity = 0.0f;
};

UENUM(BlueprintType)
enum class ELoadoutCategory : uint8 {
    Naked UMETA(DisplayName = "Naked"),
    Light UMETA(DisplayName = "Light"),
    Medium UMETA(DisplayName = "Medium"),
    Heavy UMETA(DisplayName = "Heavy")
};

USTRUCT(BlueprintType)
struct FLoadoutResult {
    GENERATED_BODY()

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Loadout")
    float LoadoutScore = 0.0f;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Loadout")
    float MaxLoadoutScore = 0.0f;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Loadout")
    float LoadoutRatio = 0.0f;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Loadout")
    ELoadoutCategory Category = ELoadoutCategory::Naked;
};

USTRUCT(BlueprintType)
struct FArmorSlotInfo {
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Armor")
    EArmorClass ArmorClass = EArmorClass::None;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Armor")
    int32 Factor = 0;
};

USTRUCT(BlueprintType)
struct FDamageReduction {
    GENERATED_BODY()

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Damage")
    float Physical = 0.0f;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Damage")
    float Magical = 0.0f;
};

UCLASS()
class UFormulas : public UBlueprintFunctionLibrary
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintPure, Category = "Formulas|Offense")
    static float CalculateOffenseSlash(const FMaterialProperties& props);

    UFUNCTION(BlueprintPure, Category = "Formulas|Offense")
    static float CalculateOffensePierce(const FMaterialProperties& props);

    UFUNCTION(BlueprintPure, Category = "Formulas|Offense")
    static float CalculateOffenseBlunt(const FMaterialProperties& props);

    UFUNCTION(BlueprintPure, Category = "Formulas|Defense")
    static float CalculateDefenseSlash(const FMaterialProperties& props);

    UFUNCTION(BlueprintPure, Category = "Formulas|Defense")
    static float CalculateDefensePierce(const FMaterialProperties& props);

    UFUNCTION(BlueprintPure, Category = "Formulas|Defense")
    static float CalculateDefenseBlunt(const FMaterialProperties& props);

    UFUNCTION(BlueprintPure, Category = "Formulas|Elemental")
    static float CalculateElementFire(const FMaterialProperties& props);

    UFUNCTION(BlueprintPure, Category = "Formulas|Elemental")
    static float CalculateElementWater(const FMaterialProperties& props);

    UFUNCTION(BlueprintPure, Category = "Formulas|Elemental")
    static float CalculateElementWind(const FMaterialProperties& props);

    UFUNCTION(BlueprintPure, Category = "Formulas|Elemental")
    static float CalculateElementEarth(const FMaterialProperties& props);

    UFUNCTION(BlueprintPure, Category = "Formulas|Environmental")
    static float CalculateHeatRetention(const FMaterialProperties& props);

    UFUNCTION(BlueprintPure, Category = "Formulas|Regeneration")
    static int32 CalculateStamina(int32 Dexterity);

    UFUNCTION(BlueprintPure, Category = "Formulas|Regeneration")
    static int32 CalculateMana(int32 Psyche);

    UFUNCTION(BlueprintPure, Category = "Formulas|Regeneration")
    static int32 CalculateRegenPerTick(int32 pool, ELoadoutCategory category);

    UFUNCTION(BlueprintPure, Category = "Formulas|Loadout")
    static FLoadoutResult CalculateLoadout(const TArray<FArmorSlotInfo>& equippedArmor);

    UFUNCTION(BlueprintPure, Category = "Formulas|Shields")
    static bool IsShieldUsable(EShieldType shield, int32 Strength);

    UFUNCTION(BlueprintPure, Category = "Formulas|Damage")
    static FDamageReduction GetDamageReductionForClass(EArmorClass armorClass);

    UFUNCTION(BlueprintPure, Category = "Formulas|Damage")
    static float CalculateIncomingDamageMultiplier(int32 numEquippedPieces);

    UFUNCTION(BlueprintPure, Category = "Formulas|Crafting")
    static float CalculateMass(float totalMaterialMass, float slotFactor, float classFactor);

    UFUNCTION(BlueprintPure, Category = "Formulas|Crafting")
    static float CalculatePieceDefense(float materialDefense, float classScalar);

    UFUNCTION(BlueprintPure, Category = "Formulas|Magic")
    static int32 CalculateManaCost(int32 baseCost, float rangeMultiplier, float damageMultiplier, float aoeMultiplier);
};
