#include "Formulas.h"

float UFormulas::CalculateOffenseSlash(const FMaterialProperties& props) {
    return 0.6f * props.Hardness + 0.4f * props.Density;
}

float UFormulas::CalculateOffensePierce(const FMaterialProperties& props) {
    return 0.6f * props.Hardness + 0.4f * props.ElasticModulus;
}

float UFormulas::CalculateOffenseBlunt(const FMaterialProperties& props) {
    return 0.6f * props.Density + 0.4f * props.Toughness;
}

float UFormulas::CalculateDefenseSlash(const FMaterialProperties& props) {
    return 0.55f * props.Hardness + 0.45f * props.Toughness;
}

float UFormulas::CalculateDefensePierce(const FMaterialProperties& props) {
    return 0.55f * props.Hardness + 0.45f * props.ElasticModulus;
}

float UFormulas::CalculateDefenseBlunt(const FMaterialProperties& props) {
    return 0.55f * (1.0f - props.ElasticModulus) + 0.45f * props.Toughness;
}

float UFormulas::CalculateElementFire(const FMaterialProperties& props) {
    return 0.7f * (1.0f - props.ThermalConductivity) + 0.3f * props.ChemicalResistance;
}

float UFormulas::CalculateElementWater(const FMaterialProperties& props) {
    return props.ChemicalResistance * (1.0f - 0.5f * props.WaterAbsorption);
}

float UFormulas::CalculateElementWind(const FMaterialProperties& props) {
    return 1.0f - props.ElectricalConductivity;
}

float UFormulas::CalculateElementEarth(const FMaterialProperties& props) {
    return 0.5f * props.Toughness + 0.5f * props.Density;
}

float UFormulas::CalculateHeatRetention(const FMaterialProperties& props) {
    return 0.6f * (1.0f - props.ThermalConductivity) + 0.4f * props.Density;
}

int32 UFormulas::CalculateStamina(int32 Dexterity) {
    return 100 + (2 * Dexterity);
}

int32 UFormulas::CalculateMana(int32 Psyche) {
    return 100 + (2 * Psyche);
}

int32 UFormulas::CalculateRegenPerTick(int32 pool, ELoadoutCategory category) {
    const float BASE_TICK_PCT = 0.10f;
    TMap<ELoadoutCategory, float> multipliers;
    multipliers.Add(ELoadoutCategory::Naked, 1.00f);
    multipliers.Add(ELoadoutCategory::Light, 0.75f);
    multipliers.Add(ELoadoutCategory::Medium, 0.50f);
    multipliers.Add(ELoadoutCategory::Heavy, 0.25f);
    float multiplier = multipliers.Contains(category) ? multipliers[category] : 1.0f;
    return FMath::CeilToInt(BASE_TICK_PCT * pool * multiplier);
}

FLoadoutResult UFormulas::CalculateLoadout(const TArray<FArmorSlotInfo>& equippedArmor) {
    FLoadoutResult result;
    TMap<EArmorClass, int32> class_values;
    class_values.Add(EArmorClass::None, 0);
    class_values.Add(EArmorClass::Light, 1);
    class_values.Add(EArmorClass::Medium, 2);
    class_values.Add(EArmorClass::Heavy, 3);

    for (const auto& piece : equippedArmor) {
        result.LoadoutScore += piece.Factor * class_values[piece.ArmorClass];
        result.MaxLoadoutScore += piece.Factor * class_values[EArmorClass::Heavy];
    }

    result.LoadoutRatio = (result.MaxLoadoutScore > 0) ? result.LoadoutScore / result.MaxLoadoutScore : 0;

    if (result.LoadoutRatio <= 0.40f) {
        result.Category = ELoadoutCategory::Light;
    } else if (result.LoadoutRatio <= 0.79f) {
        result.Category = ELoadoutCategory::Medium;
    } else {
        result.Category = ELoadoutCategory::Heavy;
    }
    return result;
}

bool UFormulas::IsShieldUsable(EShieldType shield, int32 Strength) {
    TMap<EShieldType, int32> reqs;
    reqs.Add(EShieldType::Round, 50);
    reqs.Add(EShieldType::Kite, 75);
    reqs.Add(EShieldType::Tower, 100);
    if (reqs.Contains(shield)) {
        return Strength >= reqs[shield];
    }
    return true; // For None shield
}

FDamageReduction UFormulas::GetDamageReductionForClass(EArmorClass armorClass) {
    FDamageReduction reduction;
    switch (armorClass) {
        case EArmorClass::Light:
            reduction.Physical = 0.45f;
            reduction.Magical = 0.45f;
            break;
        case EArmorClass::Medium:
            reduction.Physical = 0.65f;
            reduction.Magical = 0.65f;
            break;
        case EArmorClass::Heavy:
            reduction.Physical = 0.85f;
            reduction.Magical = 0.85f;
            break;
        default:
            reduction.Physical = 0.0f;
            reduction.Magical = 0.0f;
            break;
    }
    return reduction;
}

float UFormulas::CalculateIncomingDamageMultiplier(int32 numEquippedPieces) {
    const int32 TOTAL_ARMOR_SLOTS = 5; // Assuming helmet, torso, legs, gloves, boots
    int32 missingPieces = FMath::Max(0, TOTAL_ARMOR_SLOTS - numEquippedPieces);
    return 1.0f + (static_cast<float>(missingPieces) * 0.15f);
}

float UFormulas::CalculateMass(float totalMaterialMass, float slotFactor, float classFactor) {
    return totalMaterialMass * slotFactor * classFactor;
}

float UFormulas::CalculatePieceDefense(float materialDefense, float classScalar) {
    const float PIECE_DEFENSE_CAP = 0.95f;
    return FMath::Min(materialDefense * classScalar, PIECE_DEFENSE_CAP);
}

int32 UFormulas::CalculateManaCost(int32 baseCost, float rangeMultiplier, float damageMultiplier, float aoeMultiplier) {
    return static_cast<int32>(static_cast<float>(baseCost) * rangeMultiplier * damageMultiplier * aoeMultiplier);
}

float UFormulas::GetItemPriceModifier(int32 reputation) {
    if (reputation <= 0) {
        return 1.0f;
    }
    // 1% discount for every 100 reputation points.
    int32 discountTiers = reputation / 100;
    float discountPercentage = static_cast<float>(discountTiers) * 1.0f;
    // Clamp discount to a max of 100%
    if (discountPercentage > 100.0f) {
        discountPercentage = 100.0f;
    }
    return 1.0f - (discountPercentage / 100.0f);
}

float UFormulas::GetTaxModifier(int32 reputation) {
    if (reputation <= 0) {
        return 1.0f;
    }
    // 5% discount for every 100 reputation points.
    int32 discountTiers = reputation / 100;
    float discountPercentage = static_cast<float>(discountTiers) * 5.0f;
    // Clamp discount to a max of 100%
    if (discountPercentage > 100.0f) {
        discountPercentage = 100.0f;
    }
    return 1.0f - (discountPercentage / 100.0f);
}
