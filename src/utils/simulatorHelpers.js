import { ARMOR_CLASS, MIN_DEFENSE_FLOOR } from "../constants/armor.js";
import { itemsForCategory, factorsFor } from "./materialHelpers.js";

export function statCost(v) {
  const clamp = (x) => Math.max(0, Math.min(100, x));
  v = clamp(v);
  const s1 = Math.min(v, 50);
  const s2 = Math.min(Math.max(v - 50, 0), 30);
  const s3 = Math.min(Math.max(v - 80, 0), 10);
  const s4 = Math.max(v - 90, 0);
  return Math.round(s1 * 1 + s2 * 2 + s3 * 3 + s4 * 4);
}

export function sumCost(stats) {
  return statCost(stats.STR) + statCost(stats.DEX) + statCost(stats.INT) + statCost(stats.PSY);
}

export const staminaPool = (DEX) => 100 + 2 * DEX;
export const manaPool = (PSY) => 100 + 2 * PSY;

export const chargeMultiplier = (t) => (t <= 0.5 ? 0 : (t >= 1.0 ? 1 : (t - 0.5) / 0.5));
export const swingMultiplier = (p) => (p < 0.6 ? 0 : Math.max(0, Math.min(1, p)));
export const floorInt = (x) => Math.floor(x);
export const clamp01 = (x) => Math.max(0, Math.min(1, x));

function classBasePerType(cls) {
  const c = ARMOR_CLASS[cls] || { physical: 0, magical: 0 };
  return { blunt: c.physical, slash: c.physical, pierce: c.physical, magic: c.magical };
}

// Weighted 80% outer, 15% inner, 5% binding; multiplied by armor-class base DRs
export function effectiveDRForSlot(
  DB,
  cls,
  outerCategory,
  materialName,
  innerCategory,
  innerMaterialName,
  bindingCategory,
  bindingMaterialName,
  isShield = false
) {
  const base = classBasePerType(cls);
  const zero = { slash: 0, pierce: 0, blunt: 0, defense_slash: 0, defense_pierce: 0, defense_blunt: 0, fire: 0, water: 0, wind: 0, earth: 0 };
  let outerFac = null;
  if (isShield) {
    const anyWood = itemsForCategory(DB, "Wood")[0] || null;
    outerFac = anyWood?.factors || zero;
  } else {
    outerFac = factorsFor(DB, outerCategory, materialName) || zero;
  }
  const innerFac = factorsFor(DB, innerCategory, innerMaterialName) || zero;
  const bindFac = factorsFor(DB, bindingCategory, bindingMaterialName) || zero;
  const wOuter = 0.80, wInner = 0.15, wBind = 0.05;
  const physMul = (f, type) => (f?.[type] || 0) * (f?.[`defense_${type}`] || 0);
  const comb = {
    blunt: physMul(outerFac, 'blunt') * wOuter + physMul(innerFac, 'blunt') * wInner + physMul(bindFac, 'blunt') * wBind,
    slash: physMul(outerFac, 'slash') * wOuter + physMul(innerFac, 'slash') * wInner + physMul(bindFac, 'slash') * wBind,
    pierce: physMul(outerFac, 'pierce') * wOuter + physMul(innerFac, 'pierce') * wInner + physMul(bindFac, 'pierce') * wBind,
    fire: (outerFac.fire || 0) * wOuter + (innerFac.fire || 0) * wInner + (bindFac.fire || 0) * wBind,
    water: (outerFac.water || 0) * wOuter + (innerFac.water || 0) * wInner + (bindFac.water || 0) * wBind,
    wind: (outerFac.wind || 0) * wOuter + (innerFac.wind || 0) * wInner + (bindFac.wind || 0) * wBind,
    earth: (outerFac.earth || 0) * wOuter + (innerFac.earth || 0) * wInner + (bindFac.earth || 0) * wBind,
  };

  const defenses = {
    blunt: Math.min(0.95, clamp01(base.blunt * comb.blunt)),
    slash: Math.min(0.95, clamp01(base.slash * comb.slash)),
    pierce: Math.min(0.95, clamp01(base.pierce * comb.pierce)),
    fire: Math.min(0.95, clamp01(base.magic * comb.fire)),
    water: Math.min(0.95, clamp01(base.magic * comb.water)),
    wind: Math.min(0.95, clamp01(base.magic * comb.wind)),
    earth: Math.min(0.95, clamp01(base.magic * comb.earth)),
  };

  const fallbackFlags = {};
  for (const key in defenses) {
    if (defenses[key] > 0 && defenses[key] < MIN_DEFENSE_FLOOR) {
      defenses[key] = MIN_DEFENSE_FLOOR;
      fallbackFlags[key] = true;
    } else {
      fallbackFlags[key] = false;
    }
  }

  return { ...defenses, fallbackFlags };
}

export function effectiveDRForTarget(
  DB,
  cls,
  outerCategory,
  materialName,
  innerCategory,
  innerMaterialName,
  bindingCategory,
  bindingMaterialName
) {
  return effectiveDRForSlot(
    DB,
    cls,
    outerCategory,
    materialName,
    innerCategory,
    innerMaterialName,
    bindingCategory,
    bindingMaterialName,
    false
  );
}
