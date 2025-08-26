import React, { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import {
  WEAPONS,
  MATERIALS_FOR_HANDLE_CORE,
  MATERIALS_FOR_HANDLE_GRIP,
  MATERIALS_FOR_HANDLE_FITTING,
  MATERIALS_FOR_HEAD,
  BANNED_WEAPON_HEAD_MATERIALS,
  BOW_TYPES,
} from "../constants/weapons.js";
import {
  armorSlots,
  ARMOR_CLASS,
  OFFHAND_ITEMS,
  DEFAULT_OFFHAND_ITEM,
  MATERIALS_FOR_CLASS,
  MATERIALS_FOR_INNER,
  MATERIALS_FOR_BINDING,
  MATERIALS_FOR_JEWELRY_SETTING,
  MATERIALS_FOR_JEWELRY_GEM,
} from "../constants/armor.js";
import CharacterPanel from "./CharacterPanel.jsx";
import AttackDirectionPanel from "./AttackDirectionPanel.jsx";
import WeaponAttackPanel from "./WeaponAttackPanel.jsx";
import RangedWeaponPanel from "./RangedWeaponPanel.jsx";
import ResultsPanel from "./ResultsPanel.jsx";
import ArmorSelectionPanel from "./ArmorSelectionPanel.jsx";
import MaterialSelect from "./MaterialSelect.jsx";
import useMaterials from "../hooks/useMaterials.js";
import useLoadout, { useJewelryBonus } from "../hooks/useLoadout.js";
import { firstSub, firstMaterial } from "../utils/materialHelpers.js";
import { DIRECTIONS } from "../constants/attack.js";
import {
  statCost,
  sumCost,
  staminaPool,
  manaPool,
  chargeMultiplier,
  swingMultiplier,
  floorInt,
  effectiveDRForSlot,
  effectiveDRForTarget,
} from "../utils/simulatorHelpers.js";
import {
  STAT_POOL,
  SKILL_POOL,
  BASE_HEALTH,
  MSF,
  races,
} from "../constants/simulator.js";
function getIconUrl(slotId, cls, shieldType, jewelryType) {
  const basePath = 'Art/Icons/';
  const fallbackIcon = `${basePath}404.png`;

  if (jewelryType) {
      const jewelryIcons = {
          'ring1': `${basePath}Jewelery/ring1.png`,
          'ring2': `${basePath}Jewelery/ring2.png`,
          'earring1': `${basePath}Jewelery/earring1.png`,
          'earring2': `${basePath}Jewelery/earring2.png`,
          'amulet': `${basePath}Jewelery/amulet.png`,
      };
      return jewelryIcons[slotId] || fallbackIcon;
  }

  if (slotId === 'shield') {
    if (!shieldType || shieldType === 'None') return fallbackIcon;
    const shieldName = shieldType.toLowerCase();
    const shieldIcons = {
      'buckler': `${basePath}Shields/round.jpg`,
      'round': `${basePath}Shields/round.jpg`,
      'kite': `${basePath}Shields/kite.png`,
      'tower': `${basePath}Shields/tower.jpg`,
    };
    return shieldIcons[shieldName] || fallbackIcon;
  } else {
    if (!cls || cls === 'None') return fallbackIcon;
    const className = cls.toLowerCase();

    const heavy_slot_map = {
        'boots': 'heavy_boots.png', 'gloves': 'heavy_gloves.png',
        'helmet': 'heavy_helmet.png', 'legs': 'heavy_legs.png', 'torso': 'heavy_torso.png',
    }
    const medium_slot_map = {
        'boots': 'medium_boots.png', 'gloves': 'medium_gloves.png',
        'helmet': 'medium_helmet.png', 'legs': 'medium_legs.png', 'torso': 'medium_torso.png',
    }
    const light_slot_map = {
        'boots': 'boots.png', 'gloves': 'gloves.png',
        'helmet': 'helmet.png', 'legs': 'legs.png', 'torso': 'torso.png',
    }

    if (className === 'heavy' && heavy_slot_map[slotId]) {
        return `${basePath}Armor/Heavy/${heavy_slot_map[slotId]}`;
    }
    if (className === 'medium' && medium_slot_map[slotId]) {
        return `${basePath}Armor/Medium/${medium_slot_map[slotId]}`;
    }
    if (className === 'light' && light_slot_map[slotId]) {
        return `${basePath}Armor/Light/${light_slot_map[slotId]}`;
    }

    return fallbackIcon;
  }
}

function getRangedWeaponIcon(weaponKey) {
  const basePath = 'Art/Icons/';
  const fallbackIcon = `${basePath}404.png`;
  const icons = {
    Bow: `${basePath}404.png`,
    Crossbow: `${basePath}404.png`,
    Sling: `${basePath}404.png`,
    Throwing: `${basePath}404.png`,
  };
  return icons[weaponKey] || fallbackIcon;
}

function App({ DB }){
  // Character
  const [raceId, setRaceId] = useState(() => {
    const ids = races.map(r => r.id);
    return ids[Math.floor(Math.random() * ids.length)];
  });
  const [stats, setStats]   = useState({ STR:0, DEX:0, INT:0, PSY:0 });
  const resetStats = () => setStats({ STR:0, DEX:0, INT:0, PSY:0 });

  // Skills with a pool
  const initialSkills = {
    ArmorTraining: 0,
    BlockingAndShields: 0,
    Sword: 0,
    Axe: 0,
    Hammer: 0,
    Spear: 0,
    Lances: 0,
    Dagger: 0,
    Polesword: 0,
    Poleaxe: 0,
    Archery: 0,
    Crossbows: 0,
    Slings: 0,
    ThrowingWeapons: 0,
    MountedCombat: 0,
    MountedArchery: 0,
    MountedMagery: 0,
    Anatomy: 0,
    BeastControl: 0,
    Taming: 0,
    Stealth: 0,
    MeleeAmbush: 0,
    RangedAmbush: 0,
    ElementalAmbush: 0,
    ElementalMagic: 0,
    EntropyMagic: 0,
  };
  const [skills, setSkills] = useState(initialSkills);
  const resetSkills = () => setSkills({ ...initialSkills });

  const [elementalSchool, setElementalSchool] = useState("Fire");
  const [entropySchool, setEntropySchool] = useState("Radiance");

  const totalSkill = Object.values(skills).reduce((a,b)=> a+(b||0), 0);
  function setSkillBound(name, val) {
    val = Math.max(0, Math.min(100, val));

    const nextSkills = { ...skills };

    if (name === 'MeleeAmbush' || name === 'RangedAmbush' || name === 'ElementalAmbush') {
      val = Math.min(val, skills.Stealth || 0);
    }
    if (name === 'Lances') {
      val = Math.min(val, skills.Spear || 0);
    }

    const others = totalSkill - (skills[name] || 0);
    const maxAllowed = Math.max(0, SKILL_POOL - others);
    const finalVal = Math.min(val, maxAllowed);

    nextSkills[name] = finalVal;

    if (name === 'Stealth') {
      nextSkills.MeleeAmbush = Math.min(nextSkills.MeleeAmbush, finalVal);
      nextSkills.RangedAmbush = Math.min(nextSkills.RangedAmbush, finalVal);
      nextSkills.ElementalAmbush = Math.min(nextSkills.ElementalAmbush, finalVal);
    }
    if (name === 'Spear') {
      nextSkills.Lances = Math.min(nextSkills.Lances, finalVal);
    }

    setSkills(nextSkills);
  }

  // Helpers for materials
  const firstMat = (cat, sub) => firstMaterial(DB, cat, sub);
  const firstSubCat = (cat) => firstSub(DB, cat);

  // Armor pieces (each piece has class, outer category/material + inner + binding)
  const [armor, setArmor] = useState({
    helmet: { class:"None", category:"Leather", subCategory:firstSubCat("Leather"), material:firstMat("Leather", firstSubCat("Leather")), innerCategory:"Linen", innerSubCategory:firstSubCat("Linen"), innerMaterial:firstMat("Linen", firstSubCat("Linen")), bindingCategory:"Leather", bindingSubCategory:firstSubCat("Leather"), bindingMaterial:firstMat("Leather", firstSubCat("Leather")) },
    gloves: { class:"None", category:"Leather", subCategory:firstSubCat("Leather"), material:firstMat("Leather", firstSubCat("Leather")), innerCategory:"Linen", innerSubCategory:firstSubCat("Linen"), innerMaterial:firstMat("Linen", firstSubCat("Linen")), bindingCategory:"Leather", bindingSubCategory:firstSubCat("Leather"), bindingMaterial:firstMat("Leather", firstSubCat("Leather")) },
    boots:  { class:"None", category:"Leather", subCategory:firstSubCat("Leather"), material:firstMat("Leather", firstSubCat("Leather")), innerCategory:"Linen", innerSubCategory:firstSubCat("Linen"), innerMaterial:firstMat("Linen", firstSubCat("Linen")), bindingCategory:"Leather", bindingSubCategory:firstSubCat("Leather"), bindingMaterial:firstMat("Leather", firstSubCat("Leather")) },
    torso:  { class:"None", category:"Leather", subCategory:firstSubCat("Leather"), material:firstMat("Leather", firstSubCat("Leather")), innerCategory:"Linen", innerSubCategory:firstSubCat("Linen"), innerMaterial:firstMat("Linen", firstSubCat("Linen")), bindingCategory:"Leather", bindingSubCategory:firstSubCat("Leather"), bindingMaterial:firstMat("Leather", firstSubCat("Leather")) },
    legs:   { class:"None", category:"Leather", subCategory:firstSubCat("Leather"), material:firstMat("Leather", firstSubCat("Leather")), innerCategory:"Linen", innerSubCategory:firstSubCat("Linen"), innerMaterial:firstMat("Linen", firstSubCat("Linen")), bindingCategory:"Leather", bindingSubCategory:firstSubCat("Leather"), bindingMaterial:firstMat("Leather", firstSubCat("Leather")) },
    shield: { isEquipped: false, shield: DEFAULT_OFFHAND_ITEM },
    ring1: { isEquipped: false, settingCategory:"Metals", settingSubCategory:firstSubCat("Metals"), settingMaterial:firstMat("Metals", firstSubCat("Metals")), gemCategory:"Cut Gemstones", gemSubCategory:firstSubCat("Cut Gemstones"), gemMaterial:firstMat("Cut Gemstones", firstSubCat("Cut Gemstones")), bonus: 1, attribute: 'STR' },
    ring2: { isEquipped: false, settingCategory:"Metals", settingSubCategory:firstSubCat("Metals"), settingMaterial:firstMat("Metals", firstSubCat("Metals")), gemCategory:"Cut Gemstones", gemSubCategory:firstSubCat("Cut Gemstones"), gemMaterial:firstMat("Cut Gemstones", firstSubCat("Cut Gemstones")), bonus: 1, attribute: 'STR' },
    earring1: { isEquipped: false, settingCategory:"Metals", settingSubCategory:firstSubCat("Metals"), settingMaterial:firstMat("Metals", firstSubCat("Metals")), gemCategory:"Cut Gemstones", gemSubCategory:firstSubCat("Cut Gemstones"), gemMaterial:firstMat("Cut Gemstones", firstSubCat("Cut Gemstones")), bonus: 1, attribute: 'DEX' },
    earring2: { isEquipped: false, settingCategory:"Metals", settingSubCategory:firstSubCat("Metals"), settingMaterial:firstMat("Metals", firstSubCat("Metals")), gemCategory:"Cut Gemstones", gemSubCategory:firstSubCat("Cut Gemstones"), gemMaterial:firstMat("Cut Gemstones", firstSubCat("Cut Gemstones")), bonus: 1, attribute: 'DEX' },
    amulet: { isEquipped: false, settingCategory:"Metals", settingSubCategory:firstSubCat("Metals"), settingMaterial:firstMat("Metals", firstSubCat("Metals")), gemCategory:"Cut Gemstones", gemSubCategory:firstSubCat("Cut Gemstones"), gemMaterial:firstMat("Cut Gemstones", firstSubCat("Cut Gemstones")), bonus: 1 },
  });

  // Target armor (for “damage against armor”)
    const [targetArmor, setTargetArmor] = useState({
      class: "Heavy",
      category: "Metals",
      subCategory: firstSubCat("Metals"),
      material: firstMat("Metals", firstSubCat("Metals")),
      innerCategory:"Linen",
      innerSubCategory:firstSubCat("Linen"),
      innerMaterial:firstMat("Linen", firstSubCat("Linen")),
      bindingCategory:"Leather",
      bindingSubCategory:firstSubCat("Leather"),
      bindingMaterial:firstMat("Leather", firstSubCat("Leather"))
    });

  // Weapon & attack
  const [weaponKey, setWeaponKey] = useState("Sword");
  const [rangedWeaponKey, setRangedWeaponKey] = useState("None");
  const [direction, setDirection] = useState("Left");
  const [charge, setCharge]       = useState(1.0); // up to 1.5 (heavy at 1.5)
  const [swing, setSwing]         = useState(1.0);
  const [mountedSpeed, setMountedSpeed] = useState("Gallop");
  const [bowType, setBowType] = useState("Long");
  const [bowWood, setBowWood] = useState({ category: "Wood", subCategory:firstSubCat("Wood"), material: firstMat("Wood", firstSubCat("Wood")) });
  // Handle/hilt (3) + head
  const [weaponComps, setWeaponComps] = useState({
    core: { category: "Wood", subCategory:firstSubCat("Wood"), material: firstMat("Wood", firstSubCat("Wood")) },
    grip: { category: "Leather", subCategory:firstSubCat("Leather"), material: firstMat("Leather", firstSubCat("Leather")) },
    fitting: { category: "Metals", subCategory:firstSubCat("Metals"), material: firstMat("Metals", firstSubCat("Metals")) },
    head: { category: "Metals", subCategory:firstSubCat("Metals"), material: firstMat("Metals", firstSubCat("Metals")) },
  });
  const [isTwoHanded, setTwoHanded] = useState(false);

  useEffect(() => {
      if (["Polesword", "Poleaxe", "Lance"].includes(weaponKey)) {
          setTwoHanded(true);
      } else {
          setTwoHanded(false);
      }
  }, [weaponKey]);

  useEffect(() => {
    const race = races.find(r => r.id === raceId);
    if (race) {
      if (race.magicProficiency === "Void" || race.magicProficiency === "Radiance") {
        setEntropySchool(race.magicProficiency);
      } else {
        setElementalSchool(race.magicProficiency);
      }

      const raceArmorPreference = {
        human: 'Medium',
        dwarf: 'Heavy',
        elf: 'Light',
        orc: 'Medium',
        goliath: 'Heavy',
        fae: 'Light',
      };
      const preferredArmorClass = raceArmorPreference[raceId] || 'None';

      setArmor(currentArmor => {
        const newArmor = { ...currentArmor };
        for (const slot of armorSlots) {
          if (slot.id !== 'shield') {
            const prev = newArmor[slot.id] || {};
            const allowed = MATERIALS_FOR_CLASS[preferredArmorClass] || [];
            let category = prev.category || allowed[0] || "Leather";
            if (!allowed.includes(category)) category = allowed[0] || "Leather";
            const subCategory = firstSubCat(category);
            const material = firstMat(category, subCategory);
            newArmor[slot.id] = { ...prev, class: preferredArmorClass, category, subCategory, material };
          }
        }
        return newArmor;
      });
    }
  }, [raceId]);

  // Effective stats with racial modifiers and jewelry bonuses
  const race = races.find(r => r.id === raceId) || races[0];
  const jewelryBonus = useJewelryBonus(armor);

  useEffect(() => {
    setStats(prev => {
      const updated = { ...prev };
      let changed = false;
      ["STR","DEX","INT","PSY"].forEach(k => {
        const max = 100 - jewelryBonus[k];
        if (updated[k] > max) {
          updated[k] = max;
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [jewelryBonus]);

  const effective = useMemo(() => {
      const baseWithJewelry = {
          STR: Math.min(100, stats.STR + jewelryBonus.STR),
          DEX: Math.min(100, stats.DEX + jewelryBonus.DEX),
          INT: Math.min(100, stats.INT + jewelryBonus.INT),
          PSY: Math.min(100, stats.PSY + jewelryBonus.PSY)
      };

      return {
          STR: Math.max(0, baseWithJewelry.STR + (race.modifier.STR || 0)),
          DEX: Math.max(0, baseWithJewelry.DEX + (race.modifier.DEX || 0)),
          INT: Math.max(0, baseWithJewelry.INT + (race.modifier.INT || 0)),
          PSY: Math.max(0, baseWithJewelry.PSY + (race.modifier.PSY || 0))
      };
  }, [stats, raceId, jewelryBonus]);

  const spent  = sumCost(stats);
  const remain = STAT_POOL - spent;
  const stamPool = staminaPool(effective.DEX);
  const manaPoolV= manaPool(effective.PSY);
  const {
    totalLoadoutWeight,
    maximumLoadoutWeight,
    loadoutWeightRatio,
    category,
    missingPieces,
    nakedOverride,
    regenStam,
    regenMana,
  } = useLoadout(armor, effective.STR, skills, stamPool, manaPoolV);

  // Player health and regeneration tracking
  const [playerHealth, setPlayerHealth] = useState(BASE_HEALTH);
  const [lastDamageTime, setLastDamageTime] = useState(null);

  // Player stamina and regeneration tracking
  const [playerStamina, setPlayerStamina] = useState(stamPool);
  const [lastStaminaUse, setLastStaminaUse] = useState(null);
  useEffect(() => {
    setPlayerStamina(s => Math.min(stamPool, s));
  }, [stamPool]);

  const applyDamageToPlayer = (amount) => {
    if (amount > 0) {
      setPlayerHealth(h => Math.max(0, h - amount));
      setLastDamageTime(Date.now());
    }
  };

  const consumeStamina = (amount) => {
    if (amount > 0) {
      setPlayerStamina(s => Math.max(0, s - amount));
      setLastStaminaUse(Date.now());
    }
  };

  // Health regeneration: 1 HP every 2 seconds after 10 seconds without taking damage.
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      if (playerHealth < BASE_HEALTH && (!lastDamageTime || now - lastDamageTime >= 10000)) {
        setPlayerHealth(h => Math.min(BASE_HEALTH, h + 1));
      }
    }, 2000);
    return () => clearInterval(id);
  }, [playerHealth, lastDamageTime]);

  // Stamina regeneration: regenStam per second after 3 seconds without using stamina
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      if (playerStamina < stamPool && (!lastStaminaUse || now - lastStaminaUse >= 3000)) {
        setPlayerStamina(s => Math.min(stamPool, s + regenStam));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [playerStamina, lastStaminaUse, stamPool, regenStam]);

  const weapon = WEAPONS[weaponKey];

  // Options per weapon

  // Active weapon skill multiplier
  const activeWeaponSkillName = useMemo(()=>{
    if (weaponKey==='Bow') return 'Archery';
    if (weaponKey==='Crossbow') return 'Crossbows';
    if (weaponKey==='Sling') return 'Slings';
    if (weaponKey==='Throwing') return 'ThrowingWeapons';
    if (weaponKey==='Lance') return 'MountedCombat';
    return weaponKey;
  }, [weaponKey]);
  const skillMult = useMemo(()=> 1 + 0.50 * ((skills[activeWeaponSkillName]||0)/100), [skills, activeWeaponSkillName]);

  const formulaText = useMemo(()=>{
    if (!weapon) return "";
    if (weapon.type==='melee'){
      const directionType = weapon.direction[direction] || 'Slash';
      return `Melee damage equals Strength multiplied by the sum of Blunt and the selected direction type (here: ${directionType}), then multiplied by Charge, Swing, the Weapon Head modifier, and your relevant Skill.`;
    }
    if (weapon.type==='ranged') return 'Ranged damage equals Bow or Crossbow draw weight multiplied by Pierce, then multiplied by Charge, Swing, the Arrow or Bolt Head modifier, and your relevant Skill.';
    return 'Lance damage equals Strength multiplied by the sum of Blunt and Pierce, then multiplied by the Mount speed modifier, the Lance Head modifier, and your relevant Skill.';
  }, [weapon, direction]);

  // Damage & stamina
  const damage = useMemo(()=>{
    if (!weapon) return { total:0, parts:{}, staminaCost:0, isHeavy:false };
    let staminaCost = 0;
    let total = 0; let parts={};

    if (weaponKey === 'Bow') {
      const selectedBow = BOW_TYPES[bowType];
      const woodMat = factorsFor(DB, bowWood.category, bowWood.material) || {};
      const avgMagic = (mat) => (((mat.fire||0) + (mat.water||0) + (mat.wind||0) + (mat.earth||0)) / 4);
      const drawBonus = avgMagic(woodMat) / 10;
      const pierce = weapon.head.Pierce||0; const cMul = chargeMultiplier(charge); const sMul = swingMultiplier(swing);
      const effDraw = (selectedBow.drawWeight||0) * (1 + drawBonus);
      total = effDraw*pierce*cMul*sMul;
      parts = { Pierce: floorInt(total) };
      staminaCost = 0;
    } else {
      // --- New weapon material logic ---
      // Assumptions on how DB material properties translate to weapon stats:
      // massMult: Derived from blunt defense. Higher blunt defense -> denser material -> higher mass. Formula: 1 + (defense_blunt / 2)
      // damage mod: Derived from slash and pierce. Formula: (slash + pierce) / 4
      // draw bonus: Derived from magic stat for bows. Formula: magic / 10
      const coreMat = factorsFor(DB, weaponComps.core.category, weaponComps.core.material) || {};
      const gripMat = factorsFor(DB, weaponComps.grip.category, weaponComps.grip.material) || {};
      const fittingMat = factorsFor(DB, weaponComps.fitting.category, weaponComps.fitting.material) || {};
      const headMat = factorsFor(DB, weaponComps.head.category, weaponComps.head.material) || {};

      const massMult = (1 + (coreMat.defense_blunt || 0) / 2) * (1 + (gripMat.defense_blunt || 0) / 2) * (1 + (fittingMat.defense_blunt || 0) / 2) * (1 + (headMat.defense_blunt || 0) / 2);
      const damageMod = ((headMat.slash || 0) + (headMat.pierce || 0)) / 4;
      const avgMagic = (mat) => (((mat.fire||0) + (mat.water||0) + (mat.wind||0) + (mat.earth||0)) / 4);
      const drawBonus = avgMagic(coreMat) / 10 + avgMagic(fittingMat) / 10;
      // --- End new logic ---

      if (weapon.type==='mounted'){
        const m = weapon.head; const factor = weapon.speed[mountedSpeed] || 1.0;
        const mass = Math.ceil((weapon.massKilograms||0) * massMult * (isTwoHanded ? 1.5 : 1));
        staminaCost = (weapon.baseCost||0) + MSF*mass;
        const rawB = effective.STR*(m.Blunt||0)*factor;
        const rawP = effective.STR*(m.Pierce||0)*factor;
        total = (rawB+rawP) * (1 + damageMod);
        parts = { Blunt: floorInt(rawB), Pierce: floorInt(rawP) };
      } else if (weapon.type==='ranged'){
        const pierce = weapon.head.Pierce||0; const cMul = chargeMultiplier(charge); const sMul = swingMultiplier(swing);
        const effDraw = (weapon.drawWeight||0) * (1 + drawBonus);
        total = effDraw*pierce*cMul*sMul*(1 + damageMod);
        parts = { Pierce: floorInt(total) };
        staminaCost = 0;
      } else {
        const directionType = weapon.direction[direction] || 'Slash'; const head = weapon.head;
        const blunt = head.Blunt||0; const typed = head[directionType]||0; const cMul = chargeMultiplier(charge); const sMul = swingMultiplier(swing);
        const mass = Math.ceil((weapon.massKilograms||0) * massMult);
        staminaCost = (weapon.baseCost||0) + MSF*mass;
        const rawB = effective.STR*blunt*cMul*sMul;
        const rawT = effective.STR*typed*cMul*sMul;
        total = (rawB+rawT) * (1 + damageMod);
        parts = { Blunt: floorInt(rawB), [directionType]: floorInt(rawT) };
      }
    }

    total *= skillMult;
    const partsSum0 = Object.values(parts).reduce((a,b)=> a+(b||0), 0) || 1;
    const scaledWithSkill = {};
    for (const [k,v] of Object.entries(parts)) scaledWithSkill[k] = (v||0) * (total/partsSum0);

    const damageMult = isTwoHanded ? 2 : 1;
    const outMult = (nakedOverride ? 0.25 : 1) * Math.max(0, 1 - 0.15*missingPieces) * damageMult;
    total = Math.floor(total * outMult);

    const partsSum = Object.values(scaledWithSkill).reduce((a,b)=> a+(b||0), 0) || 1;
    const finalParts = {};
    for (const [k,v] of Object.entries(scaledWithSkill)) finalParts[k] = Math.floor(total * (v||0) / partsSum);
    const isHeavy = (weapon.type!=='mounted') && (charge >= 1.5 - 1e-6);
    const staminaCostFinal = Math.floor(staminaCost * (isHeavy ? 2 : 1) * (isTwoHanded ? 2 : 1));
    return { total, parts: finalParts, staminaCost: staminaCostFinal, isHeavy };
  }, [weapon, direction, charge, swing, effective.STR, mountedSpeed, missingPieces, nakedOverride, weaponComps, skillMult, DB, bowType, bowWood, isTwoHanded]);

  // Damage against target armor
  const dmgVsArmor = useMemo(()=>{
    const t = effectiveDRForTarget(DB, targetArmor.class, targetArmor.category, targetArmor.material, targetArmor.innerCategory, targetArmor.innerMaterial, targetArmor.bindingCategory, targetArmor.bindingMaterial);
    const parts = {};
    for (const [k,v] of Object.entries(damage.parts)){
      const key = k.toLowerCase();
      const dr = key==='blunt'?t.blunt: key==='slash'?t.slash: key==='pierce'?t.pierce: 0;
      parts[k] = Math.floor(Math.max(0, v * (1 - dr)));
    }
    const total = Object.values(parts).reduce((a,b)=> a + b, 0);
    return { total, parts };
  }, [damage.parts, targetArmor, DB]);

  // Attribute handlers
  const setStat = (key, val)=>{ const next = { ...stats, [key]: val }; if (sumCost(next) <= STAT_POOL) setStats(next); };

  // Armor handlers
  const setArmorClassSafe = (slotId, className)=> setArmor(p=>{
    const prev = p[slotId] || {};
    const allowed = MATERIALS_FOR_CLASS[className] || [];
    let category = prev.category || allowed[0] || "Leather";
    if (!allowed.includes(category)) category = allowed[0] || "Leather";
    const subCategory = firstSubCat(category);
    const material = firstMat(category, subCategory);
    return { ...p, [slotId]: { ...prev, class: className, category, subCategory, material } };
  });
  const setShieldSubtypeSafe = (sub)=> setArmor(p=> ({ ...p, shield: { ...p.shield, shield: sub } }));
  const setShieldEquipped = (eq)=> setArmor(p=> ({ ...p, shield: { ...p.shield, isEquipped: eq } }));

  const setArmorOuter = (slotId, val)=> setArmor(p=> ({ ...p, [slotId]: { ...p[slotId], category: val.category, subCategory: val.subCategory, material: val.material } }));
  const setArmorInner = (slotId, val)=> setArmor(p=> ({ ...p, [slotId]: { ...p[slotId], innerCategory: val.category, innerSubCategory: val.subCategory, innerMaterial: val.material } }));
  const setArmorBinding = (slotId, val)=> setArmor(p=> ({ ...p, [slotId]: { ...p[slotId], bindingCategory: val.category, bindingSubCategory: val.subCategory, bindingMaterial: val.material } }));

  const setJewelrySetting = (slotId, val)=> setArmor(p=> ({ ...p, [slotId]: {...p[slotId], settingCategory: val.category, settingSubCategory: val.subCategory, settingMaterial: val.material } }));
  const setJewelryGem = (slotId, val)=> setArmor(p=> ({ ...p, [slotId]: {...p[slotId], gemCategory: val.category, gemSubCategory: val.subCategory, gemMaterial: val.material } }));

  const setWeaponComp = (comp, val)=> setWeaponComps(p=> ({ ...p, [comp]: val }));

  const setSkill = (name, val)=> setSkillBound(name, val);


  /* ============================== UI ============================== */
  return (
    <>
      <div className="min-h-screen w-full bg-slate-950 text-slate-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Web Game Simulator</h1>
            <p className="text-slate-300" id="version-display"></p>
          </div>

          {/* 3 columns, skills centered */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 break-words">
            {/* Left */}
            <div className="flex flex-col gap-6">
              <CharacterPanel
                races={races}
                raceId={raceId}
                setRaceId={setRaceId}
                stats={stats}
                setStat={setStat}
                effective={effective}
                jewelryBonus={jewelryBonus}
                spent={spent}
                remain={remain}
                stamPool={stamPool}
                manaPoolV={manaPoolV}
                STAT_POOL={STAT_POOL}
                baseHealth={BASE_HEALTH}
                resetStats={resetStats}
              />
              <AttackDirectionPanel
                weapon={weapon}
                direction={direction}
                setDirection={setDirection}
                charge={charge}
                setCharge={setCharge}
                swing={swing}
                setSwing={setSwing}
              />
            </div>

            {/* Center column: Skills */}
            <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <h2 className="text-lg font-semibold mb-3">Skills and Specialization</h2>
              <div className="text-sm text-slate-300 mb-2">Use the sliders to distribute your skill points. The total number of points you can allocate is limited. The skill that corresponds to your current weapon contributes directly to damage.</div>
              <div className="flex items-center justify-between text-sm mb-3">
                <div>Skill points spent</div>
                <div className={`tabular-nums ${totalSkill>SKILL_POOL?"text-rose-400":""}`}>{totalSkill} / {SKILL_POOL} <span className="text-slate-500">(remaining {Math.max(0, SKILL_POOL-totalSkill)})</span></div>
              </div>
              <button className="mb-3 px-2 py-1 text-xs rounded bg-slate-700" onClick={resetSkills}>Reset Skills</button>
              <div className="space-y-3">
                {Object.entries({
                  "General": [
                    ["ArmorTraining", "Armor Training"],
                    ["BlockingAndShields", "Blocking & Shields"],
                    ["Anatomy", "Anatomy"],
                  ],
                  "Melee Combat": [
                    ["Sword", "Sword"], ["Axe", "Axe"], ["Dagger", "Dagger"], ["Hammer", "Hammer"],
                    ["Polesword", "Polesword"], ["Poleaxe", "Poleaxe"], ["Spear", "Spear"],
                  ],
                  "Ranged Combat": [
                    ["Archery", "Archery"],
                    ["Crossbows", "Crossbows"],
                    ["Slings", "Slings"],
                    ["ThrowingWeapons", "Throwing Weapons"],
                  ],
                  "Mounted": [
                    ["MountedCombat", "Mounted Combat"],
                    ["MountedArchery", "Mounted Archery"],
                    ["MountedMagery", "Mounted Magery"],
                  ],
                  "Stealth": [
                    ["Stealth", "Stealth"],
                  ],
                  "Animal Handling": [
                    ["BeastControl", "Beast Control"], ["Taming", "Taming"],
                  ],
                }).map(([groupName, groupSkills]) => (
                  <details key={groupName} className="bg-slate-800/50 rounded-xl">
                    <summary className="text-lg font-semibold p-3 cursor-pointer select-none">{groupName}</summary>
                    <div className="p-3 border-t border-slate-700/50 space-y-3">
                      {groupSkills.map(([key, label]) => (
                        <React.Fragment key={key}>
                          <div>
                            <div className="flex items-center justify-between text-sm"><span>{label}</span><span className="tabular-nums">{skills[key]}</span></div>
                            <input type="range" min={0} max={100} value={skills[key]} onChange={e => setSkillBound(key, parseInt(e.target.value))} className="w-full" />
                          </div>
                          {key === 'Spear' && (
                            <div className="ml-4" title="This skill cannot be higher than your Spear skill.">
                              <div className="flex items-center justify-between text-sm"><span>Lances</span><span className="tabular-nums">{skills.Lances}</span></div>
                              <input type="range" min={0} max={skills.Spear} value={skills.Lances} onChange={e => setSkillBound('Lances', parseInt(e.target.value))} className="w-full" />
                            </div>
                          )}
                          {groupName === 'Stealth' && key === 'Stealth' && (
                            <div className="ml-4 space-y-3">
                              {[
                                ['MeleeAmbush','Melee Ambush'],
                                ['RangedAmbush','Ranged Ambush'],
                                ['ElementalAmbush','Elemental Ambush'],
                              ].map(([subKey, subLabel]) => (
                                <div key={subKey} title="This skill cannot be higher than your Stealth skill.">
                                  <div className="flex items-center justify-between text-sm"><span>{subLabel}</span><span className="tabular-nums">{skills[subKey]}</span></div>
                                  <input type="range" min={0} max={skills.Stealth} value={skills[subKey]} onChange={e => setSkillBound(subKey, parseInt(e.target.value))} className="w-full" />
                                </div>
                              ))}
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </details>
                ))}

                <details className="bg-slate-800/50 rounded-xl">
                  <summary className="text-lg font-semibold p-3 cursor-pointer select-none">Magic</summary>
                  <div className="p-3 border-t border-slate-700/50 space-y-3">
                    <div>
                      <h4 className="text-md font-semibold">Elemental School</h4>
                      {["Fire", "Water", "Earth", "Wind"].map(school => (
                        <div key={school}>
                          <input type="radio" id={school} name="elemental" value={school} checked={elementalSchool === school} onChange={() => setElementalSchool(school)} />
                          <label htmlFor={school} className="ml-2">{school}</label>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-md font-semibold mt-2">Entropy School</h4>
                      {["Radiance", "Void"].map(school => (
                        <div key={school}>
                          <input type="radio" id={school} name="entropy" value={school} checked={entropySchool === school} onChange={() => setEntropySchool(school)} />
                          <label htmlFor={school} className="ml-2">{school}</label>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Elemental Magic</span>
                        <span className="tabular-nums">{skills.ElementalMagic}</span>
                      </div>
                      <input type="range" min={0} max={100} value={skills.ElementalMagic} onChange={e => setSkillBound('ElementalMagic', parseInt(e.target.value))} className="w-full" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Entropy Magic</span>
                        <span className="tabular-nums">{skills.EntropyMagic}</span>
                      </div>
                      <input type="range" min={0} max={100} value={skills.EntropyMagic} onChange={e => setSkillBound('EntropyMagic', parseInt(e.target.value))} className="w-full" />
                    </div>
                  </div>
                </details>
              </div>
            </section>

            {/* Right column: Weapons */}
            <div className="flex flex-col gap-6">
              <WeaponAttackPanel
                weaponKey={weaponKey}
                setWeaponKey={setWeaponKey}
                weapon={weapon}
                bowType={bowType}
                setBowType={setBowType}
                bowWood={bowWood}
                setBowWood={setBowWood}
                weaponComps={weaponComps}
                setWeaponComp={setWeaponComp}
                isTwoHanded={isTwoHanded}
                setTwoHanded={setTwoHanded}
                mountedSpeed={mountedSpeed}
                setMountedSpeed={setMountedSpeed}
                armor={armor}
                DB={DB}
              />

              <RangedWeaponPanel
                rangedWeaponKey={rangedWeaponKey}
                setRangedWeaponKey={setRangedWeaponKey}
              />

              <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <h2 className="text-lg font-semibold mb-3">Character Portrait</h2>
                <div className="flex justify-center">
                  <img
                    id="race-portrait"
                    src={`Art/Character Art/Portraits/${raceId}.png`}
                    alt={`${race.name} portrait`}
                    className="w-48 h-48 object-cover rounded-lg border-4 border-slate-700"
                  />
                </div>
              </section>
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm mt-6">
            <div className="bg-slate-800/70 rounded-xl p-4">
              <div className="text-slate-300 font-medium">Raw Damage</div>
              <div className="text-2xl tabular-nums mt-1">{damage.total}</div>
              <div className="text-sm text-slate-300 mt-1">Damage components: {Object.entries(damage.parts).map(([k,v])=>`${k} ${v}`).join(' • ') || 'None'}</div>
              <div className="text-sm text-slate-400 mt-1">Relevant skill multiplier × {skillMult.toFixed(2)}.</div>
              <div className="text-xs text-slate-400 mt-2 p-2 bg-slate-900/50 rounded-lg">
                <h4 className="font-semibold">Formula</h4>
                <p className="break-words">{formulaText}</p>
              </div>
            </div>
            <div className="bg-slate-800/70 rounded-xl p-4">
              <div className="text-slate-300 font-medium">Damage Against Target Armor</div>
              <div className="text-2xl tabular-nums mt-1">{dmgVsArmor.total}</div>
              <div className="text-sm text-slate-300 mt-1">Damage after reductions: {Object.entries(dmgVsArmor.parts).map(([k,v])=>`${k} ${v}`).join(' • ') || 'None'}</div>
            </div>
            <div className="bg-slate-800/70 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="text-slate-300 font-medium">Stamina Cost for the Attack</div>
                <div className="flex gap-2">
                  {isTwoHanded && <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-400 text-amber-300">Two-handed (double stamina)</span>}
                  {damage.isHeavy && <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-400 text-amber-300">Heavy attack (double stamina)</span>}
                </div>
              </div>
              <div className="text-2xl tabular-nums mt-1">{damage.staminaCost}</div>
            </div>
            <div className="bg-slate-800/70 rounded-xl p-4">
              <div className="text-slate-300 font-medium">Player Stamina</div>
              <div className="text-2xl tabular-nums mt-1">{Math.floor(playerStamina)}</div>
              <button className="mt-2 px-2 py-1 text-xs rounded bg-slate-700" onClick={()=>consumeStamina(damage.staminaCost)}>Use {damage.staminaCost} stamina</button>
              <div className="text-xs text-slate-300 mt-1">Regenerates {regenStam} stamina per second after 3s without use.</div>
            </div>
            <div className="bg-slate-800/70 rounded-xl p-4">
              <div className="text-slate-300 font-medium">Player Health</div>
              <div className="text-2xl tabular-nums mt-1">{playerHealth}</div>
              <button className="mt-2 px-2 py-1 text-xs rounded bg-slate-700" onClick={()=>applyDamageToPlayer(dmgVsArmor.total)}>Take {dmgVsArmor.total} damage</button>
              <div className="text-xs text-slate-300 mt-1">Regenerates 1 HP every 2s after 10s without taking damage.</div>
            </div>
          </div>

          {/* Equipment preview */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg mt-6">
            <h2 className="text-lg font-semibold mb-3">Equipment Preview</h2>
            <p className="text-sm text-slate-300 mb-3">Each slot shows the selected armor class and the chosen material. Where there is no image, the slot uses a simple fill color. This is a lightweight representation so you can see your loadout at a glance.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {armorSlots.map(slotId=>{
                  const entry = armor[slotId.id] || {};
                  const label = slotId.name;
                  const isShieldSlot = slotId.id === "shield";
                  const shieldType = isShieldSlot && entry.isEquipped ? entry.shield : "None";
                  const cls = isShieldSlot ? (entry.isEquipped ? (OFFHAND_ITEMS[shieldType]?.class||"None") : "None") : (entry.class||"None");
                  const jewelryType = slotId.type;

                  const iconUrl = getIconUrl(slotId.id, cls, shieldType, jewelryType);
                  const borderColor = cls==="None" ? "border-slate-700" : (cls==="Light" ? "border-emerald-500" : (cls==="Medium" ? "border-amber-500" : "border-rose-500"));

                return (
                  <div key={slotId.id} className="rounded-xl border border-slate-800 p-3 bg-slate-800/50">
                    <div className="text-sm font-medium">{label}</div>
                    <div className="slot-box mt-2 rounded-lg flex items-center justify-center">
                      <img src={iconUrl} alt={label} className={`w-20 h-20 object-contain rounded-lg border-4 ${borderColor}`} />
                    </div>
                  </div>
                );
              })}
              <div className="rounded-xl border border-slate-800 p-3 bg-slate-800/50">
                <div className="text-sm font-medium">Ranged Weapon</div>
                <div className="slot-box mt-2 rounded-lg flex items-center justify-center">
                  <img src={getRangedWeaponIcon(rangedWeaponKey)} alt="Ranged Weapon" className="w-20 h-20 object-contain rounded-lg border-4 border-slate-700" />
                </div>
                <div className="text-center text-sm mt-1">{rangedWeaponKey !== 'None' ? rangedWeaponKey : 'Not Equipped'}</div>
              </div>
            </div>
          </section>

        <ArmorSelectionPanel
          DB={DB}
          armor={armor}
          setArmor={setArmor}
          effective={effective}
          isTwoHanded={isTwoHanded}
          setArmorClassSafe={setArmorClassSafe}
          setShieldSubtypeSafe={setShieldSubtypeSafe}
          setShieldEquipped={setShieldEquipped}
          setArmorOuter={setArmorOuter}
          setArmorInner={setArmorInner}
          setArmorBinding={setArmorBinding}
          setJewelrySetting={setJewelrySetting}
          setJewelryGem={setJewelryGem}
          effectiveDRForSlot={effectiveDRForSlot}
        />
        <ResultsPanel
          totalLoadoutWeight={totalLoadoutWeight}
          maximumLoadoutWeight={maximumLoadoutWeight}
          loadoutWeightRatio={loadoutWeightRatio}
          category={category}
          missingPieces={missingPieces}
          regenStam={regenStam}
          regenMana={regenMana}
          nakedOverride={nakedOverride}
        />

        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg mt-6">
          <h2 className="text-lg font-semibold mb-3">Target Armor for Damage Against Armor</h2>
          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="block text-sm">Armor Class</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2"
                value={targetArmor.class}
                onChange={e=> {
                  const cls = e.target.value;
                  const allowed = MATERIALS_FOR_CLASS[cls] || [];
                  const cat = allowed[0] || "";
                  const sub = firstSubCat(cat);
                  const mat = firstMat(cat, sub);
                  setTargetArmor(t=> ({...t, class: cls, category: cat, subCategory: sub, material: mat}));
                }}
              >
                {Object.keys(ARMOR_CLASS).map(k=> <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm">Outer Material Category, which is eighty percent of the weighting</label>
              <MaterialSelect DB={DB} allowed={MATERIALS_FOR_CLASS[targetArmor.class]||[]} value={{category:targetArmor.category, subCategory:targetArmor.subCategory, material:targetArmor.material}} onChange={val=> setTargetArmor(t=> ({...t, category:val.category, subCategory:val.subCategory, material:val.material}))} />
            </div>
            <div>
              <label className="block text-sm mt-3">Inner Layer Material</label>
              <MaterialSelect DB={DB} allowed={MATERIALS_FOR_INNER} value={{category:targetArmor.innerCategory, subCategory:targetArmor.innerSubCategory, material:targetArmor.innerMaterial}} onChange={val=> setTargetArmor(t=> ({...t, innerCategory:val.category, innerSubCategory:val.subCategory, innerMaterial:val.material}))} />
            </div>
            <div>
              <label className="block text-sm mt-3">Binding</label>
              <MaterialSelect DB={DB} allowed={MATERIALS_FOR_BINDING} value={{category:targetArmor.bindingCategory, subCategory:targetArmor.bindingSubCategory, material:targetArmor.bindingMaterial}} onChange={val=> setTargetArmor(t=> ({...t, bindingCategory:val.category, bindingSubCategory:val.subCategory, bindingMaterial:val.material}))} />
            </div>
          </div>
        </section>
      </div>
    </div>
  </>
    );
  }

App.propTypes = {
  DB: PropTypes.object.isRequired,
};

export default function SimulatorContainer() {
  const [DB, error] = useMaterials();
  if (error) {
    return <div>Failed to load material data.</div>;
  }
  if (!DB) {
    return <div>Loading material data...</div>;
  }
  return <App DB={DB} />;
}

SimulatorContainer.propTypes = {};

