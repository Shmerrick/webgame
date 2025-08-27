import { useMemo } from 'react';
import { armorSlots, ARMOR_CLASS, OFFHAND_ITEMS, REGEN_MULT, BASE_TICK_PCT } from '../../public/constants/armor.js';

function loadoutCategory(equipped, STR){
  let totalLoadoutWeight=0, maximumLoadoutWeight=0, missingPieces=0;
  for (const slot of armorSlots){
    const entry = equipped[slot.id] || {};
    const factor = slot.factor;
    let className = entry.class || "None";
    if (slot.id==="shield"){
      const subtype = entry.shield || "None";
      const meta = OFFHAND_ITEMS[subtype];
      const equippedShield = entry.isEquipped;
      if (equippedShield && meta?.type === 'shield') {
          className = (STR >= (meta?.strengthRequirement||0)) ? (meta?.class||"None") : "None";
      } else {
          className = "None";
      }
    }
    const metaC = ARMOR_CLASS[className] || { value:0 };
    totalLoadoutWeight    += factor * (metaC.value||0);
    maximumLoadoutWeight += factor * ARMOR_CLASS.Heavy.value;
    if (slot.id!=="shield" && className==="None") missingPieces++;
  }
  const loadoutWeightRatio = maximumLoadoutWeight ? totalLoadoutWeight/maximumLoadoutWeight : 0;
  const category = loadoutWeightRatio <= 0.4 ? "Light" : (loadoutWeightRatio < 0.8 ? "Medium" : "Heavy");
  const noArmor = armorSlots.every(s=> s.id==="shield" || (equipped[s.id]?.class||"None")==="None");
  const shieldSubtype = equipped.shield?.shield || "None";
  const shieldEquipped = equipped.shield?.isEquipped;
  const hasShield = shieldEquipped && (OFFHAND_ITEMS[shieldSubtype]?.class||"None")!=="None" && STR >= (OFFHAND_ITEMS[shieldSubtype]?.strengthRequirement||0);
  const nakedOverride = noArmor && !hasShield;
  return { totalLoadoutWeight,maximumLoadoutWeight,loadoutWeightRatio,category,missingPieces,nakedOverride };
}

function regenPerTick(pool, category, nakedOverride, armorTraining=0){
  const mult = nakedOverride ? REGEN_MULT.Naked : (REGEN_MULT[category]||1);
  const skillBonus = 1 + 0.10 * (armorTraining/100);
  return Math.ceil(BASE_TICK_PCT * pool * mult * skillBonus);
}

export function useJewelryBonus(armor){
  return useMemo(() => {
    const bonus = { STR: 0, DEX: 0, INT: 0, PSY: 0 };
    ["ring1","ring2","earring1","earring2","amulet"].forEach(slot => {
      const item = armor[slot];
      if (item && item.isEquipped && item.attribute && item.bonus) {
        if (bonus[item.attribute] !== undefined) {
          bonus[item.attribute] += item.bonus;
        }
      }
    });
    return bonus;
  }, [armor]);
}

export default function useLoadout(armor, STR, skills, stamPool, manaPoolV){
  const { totalLoadoutWeight, maximumLoadoutWeight, loadoutWeightRatio, category, missingPieces, nakedOverride } = useMemo(()=>loadoutCategory(armor, STR), [armor, STR]);
  const regenStam = useMemo(()=>regenPerTick(stamPool, category, nakedOverride, skills.ArmorTraining), [stamPool, category, nakedOverride, skills.ArmorTraining]);
  const regenMana = useMemo(()=>regenPerTick(manaPoolV, category, nakedOverride, skills.ArmorTraining), [manaPoolV, category, nakedOverride, skills.ArmorTraining]);
  return { totalLoadoutWeight, maximumLoadoutWeight, loadoutWeightRatio, category, missingPieces, nakedOverride, regenStam, regenMana };
}
