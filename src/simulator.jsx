import React, { useState, useMemo, useEffect } from "react";
import ReactDOM from "react-dom/client";
import {
  WEAPONS,
  MATERIALS_FOR_HANDLE_CORE,
  MATERIALS_FOR_HANDLE_GRIP,
  MATERIALS_FOR_HANDLE_FITTING,
  MATERIALS_FOR_HEAD,
  BANNED_WEAPON_HEAD_MATERIALS,
  BOW_TYPES,
} from "../public/constants/weapons.js";
import { scanDamageMax } from "../public/database.js";
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
  METAL_DEFENSE_BIAS_TARGET,
  METAL_DEFENSE_BIAS_STRENGTH,
} from "../public/constants/armor.js";
import CharacterPanel from "./components/CharacterPanel.jsx";
import AttackDirectionPanel from "./components/AttackDirectionPanel.jsx";
import WeaponAttackPanel from "./components/WeaponAttackPanel.jsx";
import RangedWeaponPanel from "./components/RangedWeaponPanel.jsx";
import ResultsPanel from "./components/ResultsPanel.jsx";
import ArmorSelectionPanel from "./components/ArmorSelectionPanel.jsx";
import MaterialSelect from "./components/MaterialSelect.jsx";
import useMaterials from "./hooks/useMaterials.js";
import useLoadout, { useJewelryBonus } from "./hooks/useLoadout.js";
import {
  itemsForCategory,
  firstSub,
  firstMaterial,
  factorsFor,
} from "./utils/materialHelpers.js";

const STAT_POOL = 270;
const SKILL_POOL = 500;
// Base player health before any damage is taken. The value itself is kept
// constant, but actual health is stored in state so it can change over time.
const BASE_HEALTH = 200;
const MSF = 1.0;

const races = [
  { id: "human", name: "Human",  modifier: { STR: 2, DEX: 2, INT: 2, PSY: 2 }, magicProficiency: "Fire" },
  { id: "dwarf", name: "Dwarf",  modifier: { STR: 0, DEX: 4, INT: 0, PSY: 4 }, magicProficiency: "Earth" },
  { id: "elf",   name: "Elf",    modifier: { STR: 0, DEX: 4, INT: 4, PSY: 0 }, magicProficiency: "Water" },
  { id: "orc",   name: "Orc",    modifier: { STR: 4, DEX: 4, INT: 0, PSY: 0 }, magicProficiency: "Wind" },
  { id: "goliath", name: "Goliath", modifier: { STR: 8, DEX: -4, INT: -8, PSY: 0 }, magicProficiency: "Void" },
  { id: "fae",   name: "Fae",    modifier: { STR: -8, DEX: 0, INT: 8, PSY: -4 }, magicProficiency: "Radiance" },
];

const DIRECTIONS = ["Left","Right","Up","Down"];

function statCost(v){
  const clamp=(x)=> Math.max(0, Math.min(100, x));
  v = clamp(v);
  const s1 = Math.min(v,50);
  const s2 = Math.min(Math.max(v-50,0),30);
  const s3 = Math.min(Math.max(v-80,0),10);
  const s4 = Math.max(v-90,0);
  return Math.round(s1*1 + s2*2 + s3*3 + s4*4);
}
function sumCost(stats){
  return statCost(stats.STR)+statCost(stats.DEX)+statCost(stats.INT)+statCost(stats.PSY);
}
const staminaPool = (DEX)=> 100 + 2*DEX;
const manaPool    = (PSY)=> 100 + 2*PSY;


const chargeMultiplier = (t)=> t <= 0.5 ? 0 : (t >= 1.0 ? 1 : (t-0.5)/0.5);
const swingMultiplier  = (p)=> p < 0.6 ? 0 : Math.max(0, Math.min(1, p));
const floorInt = (x)=> Math.floor(x);
const clamp01 = (x)=> Math.max(0, Math.min(1, x));

function classBasePerType(cls){
  const c = ARMOR_CLASS[cls] || { physical:0, magical:0 };
  return { blunt: c.physical, slash: c.physical, pierce: c.physical, magic: c.magical };
}


// Weighted 80% outer, 15% inner, 5% binding; multiplied by armor-class base DRs
function effectiveDRForSlot(DB, cls, outerCategory, materialName, innerCategory, innerMaterialName, bindingCategory, bindingMaterialName, isShield=false){
  const base = classBasePerType(cls);
  const zero = { slash:0, pierce:0, blunt:0, defense_slash:0, defense_pierce:0, defense_blunt:0, fire:0, water:0, wind:0, earth:0 };
  let outerFac = null;
  if (isShield){
    const anyWood = itemsForCategory(DB, "Wood")[0] || null;
    outerFac = anyWood?.factors || zero;
  } else {
    outerFac = factorsFor(DB, outerCategory, materialName) || zero;
  }
  const innerFac = factorsFor(DB, innerCategory, innerMaterialName) || zero;
  const bindFac  = factorsFor(DB, bindingCategory, bindingMaterialName) || zero;
  const wOuter=0.80, wInner=0.15, wBind=0.05;
  const physMul = (f, type) => {
    const defVal = f?.[`defense_${type}`];
    const def = defVal > 0 ? defVal : 1;
    const atk = f?.[type];
    return def * (atk > 0 ? atk : 1);
  };
  const comb = {
    blunt: physMul(outerFac,'blunt')*wOuter + physMul(innerFac,'blunt')*wInner + physMul(bindFac,'blunt')*wBind,
    slash: physMul(outerFac,'slash')*wOuter + physMul(innerFac,'slash')*wInner + physMul(bindFac,'slash')*wBind,
    pierce: physMul(outerFac,'pierce')*wOuter + physMul(innerFac,'pierce')*wInner + physMul(bindFac,'pierce')*wBind,
    fire: (outerFac.fire||0)*wOuter + (innerFac.fire||0)*wInner + (bindFac.fire||0)*wBind,
    water: (outerFac.water||0)*wOuter + (innerFac.water||0)*wInner + (bindFac.water||0)*wBind,
    wind: (outerFac.wind||0)*wOuter + (innerFac.wind||0)*wInner + (bindFac.wind||0)*wBind,
    earth: (outerFac.earth||0)*wOuter + (innerFac.earth||0)*wInner + (bindFac.earth||0)*wBind,
  };

  const defenses = {
    blunt: Math.min(0.95, clamp01(base.blunt * comb.blunt)),
    slash: Math.min(0.95, clamp01(base.slash * comb.slash)),
    pierce: Math.min(0.95, clamp01(base.pierce* comb.pierce)),
    fire: Math.min(0.95, clamp01(base.magic * comb.fire)),
    water: Math.min(0.95, clamp01(base.magic * comb.water)),
    wind: Math.min(0.95, clamp01(base.magic * comb.wind)),
    earth: Math.min(0.95, clamp01(base.magic * comb.earth)),
  };

  const fallbackFlags = {};
  const bias = (v) =>
    METAL_DEFENSE_BIAS_TARGET -
    (METAL_DEFENSE_BIAS_TARGET - v) * METAL_DEFENSE_BIAS_STRENGTH;
  const isMetal =
    outerCategory === "Metals" ||
    innerCategory === "Metals" ||
    bindingCategory === "Metals";

  for (const key in defenses) {
    if (defenses[key] <= 0) {
      // No data – flag it and bias if the material is metal.
      fallbackFlags[key] = true;
      if (isMetal) defenses[key] = bias(0);
    } else if (isMetal && defenses[key] < METAL_DEFENSE_BIAS_TARGET) {
      // Bias very low metal defenses upward instead of marking them as fallback.
      defenses[key] = bias(defenses[key]);
      fallbackFlags[key] = false;
    } else {
      fallbackFlags[key] = false;
    }
  }

  return { ...defenses, fallbackFlags };
}
function effectiveDRForTarget(DB, cls, outerCategory, materialName, innerCategory, innerMaterialName, bindingCategory, bindingMaterialName){
  return effectiveDRForSlot(DB, cls, outerCategory, materialName, innerCategory, innerMaterialName, bindingCategory, bindingMaterialName, false);
}

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
  const initialStats = { STR:0, DEX:0, INT:0, PSY:0 };
  const [stats, setStats]   = useState(initialStats);

  // Skills with a pool
  const initialSkills = {
    ArmorTraining: 0,
    BlockingAndShields: 0,
    Sword: 0,
    Axe: 0,
    Hammer: 0,
    Spear: 0,
    Lance: 0,
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

  const [elementalSchool, setElementalSchool] = useState("Fire");
  const [entropySchool, setEntropySchool] = useState("Radiance");
  // Player health and regeneration tracking
  const [playerHealth, setPlayerHealth] = useState(BASE_HEALTH);
  const [lastDamageTime, setLastDamageTime] = useState(null);
const weaponDamageMax = useMemo(() => {
  if (!DB) return null;
  return {
    head: scanDamageMax(DB, MATERIALS_FOR_HEAD),
    core: scanDamageMax(DB, MATERIALS_FOR_HANDLE_CORE),
    grip: scanDamageMax(DB, MATERIALS_FOR_HANDLE_GRIP),
    fitting: scanDamageMax(DB, MATERIALS_FOR_HANDLE_FITTING),
  };
}, [DB]);

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

  // Health regeneration: 1 HP every 2 seconds after 10 seconds without
  // taking damage.
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      if (playerHealth < BASE_HEALTH && (!lastDamageTime || now - lastDamageTime >= 10000)) {
        setPlayerHealth(h => Math.min(BASE_HEALTH, h + 1));
      }
    }, 2000);
    return () => clearInterval(id);
  }, [playerHealth, lastDamageTime]);

  const totalSkill = Object.entries(skills).reduce((a, [k, v]) => k === 'Lance' ? a : a + (v || 0), 0);
  function setSkillBound(name, val) {
    val = Math.max(0, Math.min(100, val));

    const nextSkills = { ...skills };

    if (name === 'MeleeAmbush' || name === 'RangedAmbush' || name === 'ElementalAmbush') {
      val = Math.min(val, skills.Stealth || 0);
    }

    if (name === 'Lance') {
      nextSkills[name] = val;
      setSkills(nextSkills);
      return;
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

    setSkills(nextSkills);
  }

  const resetStats = () => setStats(initialStats);
  const resetSkills = () => setSkills(initialSkills);

  const skillGroups = {
    "General": [
      ["ArmorTraining", "Armor Training"],
      ["BlockingAndShields", "Blocking & Shields"],
      ["Anatomy", "Anatomy"],
    ],
    "Melee Combat": [
      ["Axe", "Axe"],
      ["Dagger", "Dagger"],
      ["Hammer", "Hammer"],
      ["Poleaxe", "Poleaxe"],
      ["Polesword", "Polesword"],
      ["Spear", "Spear", [["Lance", "Lance"]]],
      ["Sword", "Sword"],
    ],
    "Ranged Combat": [
      ["Archery", "Archery"],
      ["Crossbows", "Crossbows"],
      ["Slings", "Slings"],
      ["ThrowingWeapons", "Throwing Weapons"],
    ],
    "Mounted": [
      ["MountedArchery", "Mounted Archery"],
      ["MountedCombat", "Mounted Combat"],
      ["MountedMagery", "Mounted Magery"],
    ],
    "Stealth": [
      ["ElementalAmbush", "Elemental Ambush"],
      ["MeleeAmbush", "Melee Ambush"],
      ["RangedAmbush", "Ranged Ambush"],
      ["Stealth", "Stealth"],
    ],
    "Animal Handling": [
      ["BeastControl", "Beast Control"],
      ["Taming", "Taming"],
    ],
  };

  const applyDamageToPlayer = (amount) => {
    if (amount > 0) {
      setPlayerHealth((h) => Math.max(0, h - amount));
      setLastDamageTime(Date.now());
    }
  };

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

  useEffect(() => {
    if (!DB) return;
    setTargetArmor(t => {
      const fix = (allowed, cat, mat) => {
        let category = allowed.includes(cat) ? cat : allowed[0];
        const subCategory = firstSubCat(category);
        const material = factorsFor(DB, category, mat) ? mat : firstMat(category, subCategory);
        return { category, subCategory, material };
      };
      const outer = fix(MATERIALS_FOR_CLASS[t.class] || [], t.category, t.material);
      const inner = fix(MATERIALS_FOR_INNER, t.innerCategory, t.innerMaterial);
      const bind = fix(MATERIALS_FOR_BINDING, t.bindingCategory, t.bindingMaterial);
      return {
        ...t,
        category: outer.category,
        subCategory: outer.subCategory,
        material: outer.material,
        innerCategory: inner.category,
        innerSubCategory: inner.subCategory,
        innerMaterial: inner.material,
        bindingCategory: bind.category,
        bindingSubCategory: bind.subCategory,
        bindingMaterial: bind.material,
      };
    });
  }, [DB]);
  const [isTwoHanded, setTwoHanded] = useState(false);

  useEffect(() => {
      if (["Polesword", "Poleaxe", "Lance"].includes(weaponKey)) {
          setTwoHanded(true);
      } else {
          setTwoHanded(false);
      }
  }, [weaponKey]);

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


  const weapon = WEAPONS[weaponKey];

  // Options per weapon

  // Active weapon skill multiplier
  const activeWeaponSkillName = useMemo(()=>{
    if (weaponKey==='Bow') return 'Archery';
    if (weaponKey==='Crossbow') return 'Crossbows';
    if (weaponKey==='Sling') return 'Slings';
    if (weaponKey==='Throwing') return 'ThrowingWeapons';
    if (weaponKey==='Lance') return 'Lance';
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
      const headMax = weaponDamageMax?.head || {};
      const sMax = headMax.slash || 1;
      const pMax = headMax.pierce || 1;
      const damageMod = ((headMat.slash || 0) / sMax + (headMat.pierce || 0) / pMax) / 4;
      const avgMagic = (mat) => (((mat.fire||0) + (mat.water||0) + (mat.wind||0) + (mat.earth||0)) / 4);
      const drawBonus = avgMagic(coreMat) / 10 + avgMagic(fittingMat) / 10;
      // --- End new logic ---

      if (weapon.type==='mounted'){
        const m = weapon.head; const factor = weapon.speed[mountedSpeed] || 1.0;
        const mass = Math.ceil((weapon.massKilograms||0) * massMult);
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

    const damageMult = isTwoHanded ? 1.25 : 1;
    const outMult = (nakedOverride ? 0.25 : 1) * Math.max(0, 1 - 0.15*missingPieces) * damageMult;
    total = Math.floor(total * outMult);

    const partsSum = Object.values(scaledWithSkill).reduce((a,b)=> a+(b||0), 0) || 1;
    const finalParts = {};
    for (const [k,v] of Object.entries(scaledWithSkill)) finalParts[k] = Math.floor(total * (v||0) / partsSum);
    const isHeavy = (weapon.type!=='mounted') && (charge >= 1.5 - 1e-6);
    const staminaCostFinal = Math.floor(staminaCost * (isHeavy ? 2 : 1));
    return { total, parts: finalParts, staminaCost: staminaCostFinal, isHeavy };
  }, [weapon, direction, charge, swing, effective.STR, mountedSpeed, missingPieces, nakedOverride, weaponComps, skillMult, DB, bowType, bowWood, isTwoHanded, weaponDamageMax]);

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
                resetStats={resetStats}
                effective={effective}
                jewelryBonus={jewelryBonus}
                spent={spent}
                remain={remain}
                stamPool={stamPool}
                manaPoolV={manaPoolV}
                STAT_POOL={STAT_POOL}
                baseHealth={BASE_HEALTH}
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
                <div>
                  <div>Skill points spent</div>
                  <div className={`tabular-nums ${totalSkill>SKILL_POOL?"text-rose-400":""}`}>{totalSkill} / {SKILL_POOL} <span className="text-slate-500">(remaining {Math.max(0, SKILL_POOL-totalSkill)})</span></div>
                </div>
                <button type="button" onClick={resetSkills} className="ml-2 px-2 py-1 text-xs border border-slate-700 rounded hover:text-red-400">Reset</button>
              </div>
              <div className="space-y-3">
                {Object.entries(skillGroups)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([groupName, groupSkills]) => (
                    <details key={groupName} className="bg-slate-800/50 rounded-xl">
                      <summary className="text-lg font-semibold p-3 cursor-pointer select-none">{groupName}</summary>
                      <div className="p-3 border-t border-slate-700/50 space-y-3">
                        {groupSkills
                          .slice()
                          .sort((a, b) => a[1].localeCompare(b[1]))
                          .map(([key, label, subs]) => (
                            <div key={key} title={
                              (key === 'MeleeAmbush' || key === 'RangedAmbush' || key === 'ElementalAmbush')
                                ? 'This skill cannot be higher than your Stealth skill.'
                                : ''
                            }>
                              <div className="flex items-center justify-between text-sm"><span>{label}</span><span className="tabular-nums">{skills[key]}</span></div>
                              <input type="range" min={0} max={100} value={skills[key]} onChange={e => setSkillBound(key, parseInt(e.target.value))} className="w-full" />
                              {subs && (
                                <div className="ml-4 mt-2 space-y-2">
                                  {subs
                                    .slice()
                                    .sort((a, b) => a[1].localeCompare(b[1]))
                                    .map(([subKey, subLabel]) => (
                                      <div key={subKey}>
                                        <div className="flex items-center justify-between text-sm"><span>{subLabel}</span><span className="tabular-nums">{skills[subKey]}</span></div>
                                        <input type="range" min={0} max={100} value={skills[subKey]} onChange={e => setSkillBound(subKey, parseInt(e.target.value))} className="w-full" />
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
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
                  {damage.isHeavy && <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-400 text-amber-300">Heavy attack (double stamina)</span>}
                </div>
              </div>
              <div className="text-2xl tabular-nums mt-1">{damage.staminaCost}</div>
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

        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg mt-6 max-w-lg mx-auto">
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

function Root() {
  const [DB, error] = useMaterials();
  if (error) {
    return <div>Failed to load material data.</div>;
  }
  if (!DB) {
    return <div>Loading material data...</div>;
  }
  return <App DB={DB} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><Root /></React.StrictMode>
);

