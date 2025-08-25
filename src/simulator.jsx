import React, { useState, useMemo, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { WEAPONS, MATERIALS_FOR_HANDLE_CORE, MATERIALS_FOR_HANDLE_GRIP, MATERIALS_FOR_HANDLE_FITTING, MATERIALS_FOR_HEAD, BANNED_WEAPON_HEAD_MATERIALS } from "./constants/weapons.js";
import CharacterPanel from "./components/CharacterPanel.jsx";
import WeaponAttackPanel from "./components/WeaponAttackPanel.jsx";
import MaterialSelect from "./components/MaterialSelect.jsx";


function Tooltip({ text, children }) {
  return (
    <span className="relative group inline-block">
      {children}
      <span className="absolute hidden group-hover:block bottom-full mb-2 w-max px-2 py-1 bg-slate-900 text-white text-xs rounded-md border border-slate-700 shadow-lg">
        {text}
      </span>
    </span>
  );
}

const STAT_POOL = 270;
const SKILL_POOL = 500;
const HEALTH_FIXED = 200;
const MSF = 1.0;

const races = [
  { id: "human", name: "Human",  modifier: { STR: 2, DEX: 2, INT: 2, PSY: 2 }, magicProficiency: "Fire" },
  { id: "dwarf", name: "Dwarf",  modifier: { STR: 0, DEX: 4, INT: 0, PSY: 4 }, magicProficiency: "Earth" },
  { id: "elf",   name: "Elf",    modifier: { STR: 0, DEX: 4, INT: 4, PSY: 0 }, magicProficiency: "Water" },
  { id: "orc",   name: "Orc",    modifier: { STR: 4, DEX: 4, INT: 0, PSY: 0 }, magicProficiency: "Wind" },
  { id: "goliath", name: "Goliath", modifier: { STR: 8, DEX: -4, INT: -8, PSY: 0 }, magicProficiency: "Void" },
  { id: "fae",   name: "Fae",    modifier: { STR: -8, DEX: 0, INT: 8, PSY: -4 }, magicProficiency: "Radiance" },
];

const armorSlots = [
  { id: "helmet", name: "Helmet", factor: 1 },
  { id: "gloves", name: "Gloves", factor: 1 },
  { id: "boots",  name: "Boots",  factor: 2 },
  { id: "torso",  name: "Torso",  factor: 3 },
  { id: "legs",   name: "Legs",   factor: 3 },
  { id: "shield", name: "Shield", factor: 2 },
  { id: "ring1", name: "Ring 1", factor: 0, type: 'ring' },
  { id: "ring2", name: "Ring 2", factor: 0, type: 'ring' },
  { id: "earring1", name: "Earring 1", factor: 0, type: 'earring' },
  { id: "earring2", name: "Earring 2", factor: 0, type: 'earring' },
  { id: "amulet", name: "Amulet", factor: 0, type: 'amulet' },
];

// Armor class base reductions (heavy magic = 50% from doc)
const ARMOR_CLASS = {
  None:   { value: 0, physical: 0.00, magical: 0.00 },
  Light:  { value: 1, physical: 0.45, magical: 0.45 },
  Medium: { value: 2, physical: 0.65, magical: 0.65 },
  Heavy:  { value: 3, physical: 0.85, magical: 0.85 },
};

const OFFHAND_ITEMS = {
  None:  { class: "None",   strengthRequirement: 0, type: 'shield' },
  Buckler: { class: "Light", strengthRequirement: 25, type: 'shield' },
  Round: { class: "Light",  strengthRequirement: 50, type: 'shield' },
  Kite:  { class: "Medium", strengthRequirement: 75, type: 'shield' },
  Tower: { class: "Heavy",  strengthRequirement: 100, type: 'shield' },
  Sling: { class: "None", strengthRequirement: 0, type: 'weapon' }
};

const REGEN_MULT = { Naked: 1.0, Light: 0.75, Medium: 0.50, Heavy: 0.25 };
const BASE_TICK_PCT = 0.10;
// Floor for displaying extremely small defense values
const MIN_DEFENSE_FLOOR = 0.01;

// Allowed outer categories by armor class (kept aligned to your DB families)
const MATERIALS_FOR_CLASS = {
  None:   [],
  Light:  ["Leather","Scales","Cloth","Fur","Dev"],
  Medium: ["Leather","Scales","Carapace","Wood","Bone","Dev"],
  Heavy:  ["Metals","Dev"],
};
const MATERIALS_FOR_INNER = ["Linen", "Cloth", "Leather", "Fur", "Dev"];
const MATERIALS_FOR_BINDING = ["Leather", "Dev"];
const MATERIALS_FOR_JEWELRY_SETTING = ["Metals", "Dev"];
const MATERIALS_FOR_JEWELRY_GEM = ["Rock Types", "Dev"];

// Weapons
const BOW_TYPES = {
  Long:    { drawWeight: 60, massKilograms: 1.2 },
  Recurve: { drawWeight: 50, massKilograms: 1.0 },
  Yumi:    { drawWeight: 55, massKilograms: 1.1 },
  Horse:   { drawWeight: 45, massKilograms: 0.8 },
  Flat:    { drawWeight: 40, massKilograms: 0.9 },
};

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

function loadoutCategory(equipped, STR){
  let S=0,Smax=0, missingPieces=0;
  for (const slot of armorSlots){
    const entry = equipped[slot.id] || {};
    const factor = slot.factor;
    let className = entry.class || "None";
    if (slot.id==="shield"){
      const subtype = entry.shield || "None";
      const meta = OFFHAND_ITEMS[subtype];
      if (meta.type === 'shield') {
          className = (STR >= (meta?.strengthRequirement||0)) ? (meta?.class||"None") : "None";
      } else {
          className = "None";
      }
    }
    const metaC = ARMOR_CLASS[className] || { value:0 };
    S    += factor * (metaC.value||0);
    Smax += factor * ARMOR_CLASS.Heavy.value;
    if (slot.id!=="shield" && className==="None") missingPieces++;
  }
  const R = Smax ? S/Smax : 0;
  const category = R <= 0.4 ? "Light" : (R < 0.8 ? "Medium" : "Heavy");
  const noArmor = armorSlots.every(s=> s.id==="shield" || (equipped[s.id]?.class||"None")==="None");
  const shieldSubtype = equipped.shield?.shield || "None";
  const hasShield = (OFFHAND_ITEMS[shieldSubtype]?.class||"None")!=="None" && STR >= (OFFHAND_ITEMS[shieldSubtype]?.strengthRequirement||0);
  const nakedOverride = noArmor && !hasShield;
  return { S,Smax,R,category,missingPieces,nakedOverride };
}

function regenPerTick(pool, category, nakedOverride, armorTraining=0){
  const mult = nakedOverride ? REGEN_MULT.Naked : (REGEN_MULT[category]||1);
  const skillBonus = 1 + 0.10 * (armorTraining/100);
  return Math.ceil(BASE_TICK_PCT * pool * mult * skillBonus);
}

const chargeMultiplier = (t)=> t <= 0.5 ? 0 : (t >= 1.0 ? 1 : (t-0.5)/0.5);
const swingMultiplier  = (p)=> p < 0.6 ? 0 : Math.max(0, Math.min(1, p));
const floorInt = (x)=> Math.floor(x);
const clamp01 = (x)=> Math.max(0, Math.min(1, x));

function classBasePerType(cls){
  const c = ARMOR_CLASS[cls] || { physical:0, magical:0 };
  return { blunt: c.physical, slash: c.physical, pierce: c.physical, magic: c.magical };
}

function getMaterialsForCategory(DB, cat){
  return DB[cat] || {};
}
function subcategoriesFor(DB, cat){
  const obj = getMaterialsForCategory(DB, cat);
  if (Array.isArray(obj)) return [];
  const keys = Object.keys(obj || {}).sort();
  return (keys.length === 1 && keys[0] === 'A') ? [] : keys;
}
function itemsForCategory(DB, cat, subCat){
  const obj = getMaterialsForCategory(DB, cat);
  if (Array.isArray(obj)) return obj.slice().sort((a,b)=>a.name.localeCompare(b.name));
  if (subCat) {
    const list = obj[subCat];
    return Array.isArray(list) ? list.slice().sort((a,b)=>a.name.localeCompare(b.name)) : [];
  }
  let arr = [];
  for (const list of Object.values(obj || {})){
    if (Array.isArray(list)) arr = arr.concat(list);
  }
  return arr.sort((a,b)=>a.name.localeCompare(b.name));
}
function firstSub(DB, cat){
  return subcategoriesFor(DB, cat)[0] || "";
}
function firstMaterial(DB, cat, subCat){
  const items = itemsForCategory(DB, cat, subCat);
  return (items[0]?.name) || "";
}
function factorsFor(DB, cat, materialName){
  const items = itemsForCategory(DB, cat);
  for (const m of items){
    if (m.name === materialName){
      return m.factors || m;
    }
  }
  return null;
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
  const physMul = (f, type) => (f?.[type] || 0) * (f?.[`defense_${type}`] || 0);
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
  for (const key in defenses) {
      // If the defense is positive but extremely low, floor it to a small minimum
      // value so it doesn't display as 0%.
      if (defenses[key] > 0 && defenses[key] < MIN_DEFENSE_FLOOR) {
          defenses[key] = MIN_DEFENSE_FLOOR; // Fallback to 1%
          fallbackFlags[key] = true;
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
  const [raceId, setRaceId] = useState("human");
  const [stats, setStats]   = useState({ STR:0, DEX:0, INT:0, PSY:0 });

  // Skills with a pool
  const [skills, setSkills] = useState({
    ArmorTraining: 0,
    BlockingAndShields: 0,
    Sword: 0,
    Axe: 0,
    Hammer: 0,
    Spear: 0,
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
  });

  const [elementalSchool, setElementalSchool] = useState("Fire");
  const [entropySchool, setEntropySchool] = useState("Radiance");

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

  const totalSkill = Object.values(skills).reduce((a,b)=> a+(b||0), 0);
  function setSkillBound(name, val) {
    val = Math.max(0, Math.min(100, val));

    const nextSkills = { ...skills };

    if (name === 'MeleeAmbush' || name === 'RangedAmbush' || name === 'ElementalAmbush') {
      val = Math.min(val, skills.Stealth || 0);
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

  // Helpers for materials
  const firstMat = (cat, sub) => firstMaterial(DB, cat, sub);
  const firstSubCat = (cat) => firstSub(DB, cat);

  // Armor pieces (each piece has class, outer category/material + inner + binding)
  const [armor, setArmor] = useState({
    helmet: { class:"None", category:"Leather", subCategory:firstSubCat("Leather"), material:firstMat("Leather", firstSubCat("Leather")), innerCategory:"Cloth", innerSubCategory:firstSubCat("Cloth"), innerMaterial:firstMat("Cloth", firstSubCat("Cloth")), bindingCategory:"Leather", bindingSubCategory:firstSubCat("Leather"), bindingMaterial:firstMat("Leather", firstSubCat("Leather")) },
    gloves: { class:"None", category:"Leather", subCategory:firstSubCat("Leather"), material:firstMat("Leather", firstSubCat("Leather")), innerCategory:"Cloth", innerSubCategory:firstSubCat("Cloth"), innerMaterial:firstMat("Cloth", firstSubCat("Cloth")), bindingCategory:"Leather", bindingSubCategory:firstSubCat("Leather"), bindingMaterial:firstMat("Leather", firstSubCat("Leather")) },
    boots:  { class:"None", category:"Leather", subCategory:firstSubCat("Leather"), material:firstMat("Leather", firstSubCat("Leather")), innerCategory:"Cloth", innerSubCategory:firstSubCat("Cloth"), innerMaterial:firstMat("Cloth", firstSubCat("Cloth")), bindingCategory:"Leather", bindingSubCategory:firstSubCat("Leather"), bindingMaterial:firstMat("Leather", firstSubCat("Leather")) },
    torso:  { class:"None", category:"Leather", subCategory:firstSubCat("Leather"), material:firstMat("Leather", firstSubCat("Leather")), innerCategory:"Cloth", innerSubCategory:firstSubCat("Cloth"), innerMaterial:firstMat("Cloth", firstSubCat("Cloth")), bindingCategory:"Leather", bindingSubCategory:firstSubCat("Leather"), bindingMaterial:firstMat("Leather", firstSubCat("Leather")) },
    legs:   { class:"None", category:"Leather", subCategory:firstSubCat("Leather"), material:firstMat("Leather", firstSubCat("Leather")), innerCategory:"Cloth", innerSubCategory:firstSubCat("Cloth"), innerMaterial:firstMat("Cloth", firstSubCat("Cloth")), bindingCategory:"Leather", bindingSubCategory:firstSubCat("Leather"), bindingMaterial:firstMat("Leather", firstSubCat("Leather")) },
    shield: { shield:"None" },
    ring1: { isEquipped: true, settingCategory:"Metals", settingSubCategory:firstSubCat("Metals"), settingMaterial:firstMat("Metals", firstSubCat("Metals")), gemCategory:"Rock Types", gemSubCategory:firstSubCat("Rock Types"), gemMaterial:firstMat("Rock Types", firstSubCat("Rock Types")), bonus: 1, attribute: 'Strength' },
    ring2: { isEquipped: true, settingCategory:"Metals", settingSubCategory:firstSubCat("Metals"), settingMaterial:firstMat("Metals", firstSubCat("Metals")), gemCategory:"Rock Types", gemSubCategory:firstSubCat("Rock Types"), gemMaterial:firstMat("Rock Types", firstSubCat("Rock Types")), bonus: 1, attribute: 'Strength' },
    earring1: { isEquipped: true, settingCategory:"Metals", settingSubCategory:firstSubCat("Metals"), settingMaterial:firstMat("Metals", firstSubCat("Metals")), gemCategory:"Rock Types", gemSubCategory:firstSubCat("Rock Types"), gemMaterial:firstMat("Rock Types", firstSubCat("Rock Types")), bonus: 1, attribute: 'Dexterity' },
    earring2: { isEquipped: true, settingCategory:"Metals", settingSubCategory:firstSubCat("Metals"), settingMaterial:firstMat("Metals", firstSubCat("Metals")), gemCategory:"Rock Types", gemSubCategory:firstSubCat("Rock Types"), gemMaterial:firstMat("Rock Types", firstSubCat("Rock Types")), bonus: 1, attribute: 'Dexterity' },
    amulet: { isEquipped: true, settingCategory:"Metals", settingSubCategory:firstSubCat("Metals"), settingMaterial:firstMat("Metals", firstSubCat("Metals")), gemCategory:"Rock Types", gemSubCategory:firstSubCat("Rock Types"), gemMaterial:firstMat("Rock Types", firstSubCat("Rock Types")), bonus: 1 },
  });

  // Target armor (for “damage against armor”)
    const [targetArmor, setTargetArmor] = useState({
      class: "Heavy",
      category: "Metals",
      subCategory: firstSubCat("Metals"),
      material: firstMat("Metals", firstSubCat("Metals")),
      innerCategory:"Cloth",
      innerSubCategory:firstSubCat("Cloth"),
      innerMaterial:firstMat("Cloth", firstSubCat("Cloth")),
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

  // Effective stats with racial modifiers
  const race = races.find(r=> r.id===raceId) || races[0];
  const { effective, jewelryBonus } = useMemo(()=> {
      let statsWithJewelry = { ...stats };
      let bonus = { STR:0, DEX:0, INT:0, PSY:0 };
      ["ring1", "ring2", "earring1", "earring2"].forEach(slotId => {
          const item = armor[slotId];
          if (item && item.isEquipped && item.attribute && item.bonus) {
              bonus[item.attribute] += item.bonus;
              statsWithJewelry[item.attribute] += item.bonus;
          }
      });

      statsWithJewelry.STR = Math.min(100, statsWithJewelry.STR);
      statsWithJewelry.DEX = Math.min(100, statsWithJewelry.DEX);
      statsWithJewelry.INT = Math.min(100, statsWithJewelry.INT);
      statsWithJewelry.PSY = Math.min(100, statsWithJewelry.PSY);

      const eff = {
        STR: Math.min(100, Math.max(0, statsWithJewelry.STR + (race.modifier.STR||0))),
        DEX: Math.min(100, Math.max(0, statsWithJewelry.DEX + (race.modifier.DEX||0))),
        INT: Math.min(100, Math.max(0, statsWithJewelry.INT + (race.modifier.INT||0))),
        PSY: Math.min(100, Math.max(0, statsWithJewelry.PSY + (race.modifier.PSY||0))),
      };
      return { effective: eff, jewelryBonus: bonus };
  }, [stats, race, armor]);

  const spent  = sumCost(stats);
  const remain = STAT_POOL - spent;
  const stamPool = staminaPool(effective.DEX);
  const manaPoolV= manaPool(effective.PSY);

  const { S,Smax,R,category,missingPieces,nakedOverride } = useMemo(()=> loadoutCategory(armor, effective.STR), [armor, effective.STR]);
  const regenStam = regenPerTick(stamPool, category, nakedOverride, skills.ArmorTraining);
  const regenMana = regenPerTick(manaPoolV, category, nakedOverride, skills.ArmorTraining);

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
    const staminaCostFinal = Math.floor(staminaCost * (isHeavy ? 2 : 1));
    return { total, parts: finalParts, staminaCost: staminaCostFinal, isHeavy };
  }, [weapon, direction, charge, swing, effective.STR, mountedSpeed, missingPieces, nakedOverride, weaponComps, skillMult, DB, bowType, bowWood, isTwoHanded]);

  // Damage against target armor
  const dmgVsArmor = useMemo(()=>{
    const t = effectiveDRForTarget(DB, targetArmor.class, targetArmor.category, targetArmor.material, targetArmor.innerCategory, targetArmor.innerMaterial, targetArmor.bindingCategory, targetArmor.bindingMaterial);
    const mapKey = (k)=> k.toLowerCase();
    let acc = 0;
    for (const [k,v] of Object.entries(damage.parts)){
      const key = mapKey(k);
      const dr = key==='blunt'?t.blunt: key==='slash'?t.slash: key==='pierce'?t.pierce: 0;
      acc += Math.max(0, v * (1 - dr));
    }
    return Math.floor(acc);
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

  const setArmorOuter = (slotId, val)=> setArmor(p=> ({ ...p, [slotId]: { ...p[slotId], category: val.category, subCategory: val.subCategory, material: val.material } }));
  const setArmorInner = (slotId, val)=> setArmor(p=> ({ ...p, [slotId]: { ...p[slotId], innerCategory: val.category, innerSubCategory: val.subCategory, innerMaterial: val.material } }));
  const setArmorBinding = (slotId, val)=> setArmor(p=> ({ ...p, [slotId]: { ...p[slotId], bindingCategory: val.category, bindingSubCategory: val.subCategory, bindingMaterial: val.material } }));

  const setJewelrySetting = (slotId, val)=> setArmor(p=> ({ ...p, [slotId]: {...p[slotId], settingCategory: val.category, settingSubCategory: val.subCategory, settingMaterial: val.material } }));
  const setJewelryGem = (slotId, val)=> setArmor(p=> ({ ...p, [slotId]: {...p[slotId], gemCategory: val.category, gemSubCategory: val.subCategory, gemMaterial: val.material } }));

  const setWeaponComp = (comp, val)=> setWeaponComps(p=> ({ ...p, [comp]: val }));

  const setSkill = (name, val)=> setSkillBound(name, val);

  // MaterialSelect component now imported

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
                HEALTH_FIXED={HEALTH_FIXED}
              />

              <WeaponAttackPanel
                weaponKey={weaponKey}
                setWeaponKey={setWeaponKey}
                weapon={weapon}
                rangedWeaponKey={rangedWeaponKey}
                setRangedWeaponKey={setRangedWeaponKey}
                bowType={bowType}
                setBowType={setBowType}
                bowWood={bowWood}
                setBowWood={setBowWood}
                weaponComps={weaponComps}
                setWeaponComp={setWeaponComp}
                isTwoHanded={isTwoHanded}
                setTwoHanded={setTwoHanded}
                direction={direction}
                setDirection={setDirection}
                charge={charge}
                setCharge={setCharge}
                swing={swing}
                setSwing={setSwing}
                mountedSpeed={mountedSpeed}
                setMountedSpeed={setMountedSpeed}
                armor={armor}
                DB={DB}
                subcategoriesFor={subcategoriesFor}
                itemsForCategory={itemsForCategory}
                firstSubCat={firstSubCat}
                firstMat={firstMat}
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
                    ["Stealth", "Stealth"], ["MeleeAmbush", "Melee Ambush"],
                    ["RangedAmbush", "Ranged Ambush"], ["ElementalAmbush", "Elemental Ambush"],
                  ],
                  "Animal Handling": [
                    ["BeastControl", "Beast Control"], ["Taming", "Taming"],
                  ],
                }).map(([groupName, groupSkills]) => (
                  <details key={groupName} className="bg-slate-800/50 rounded-xl">
                    <summary className="text-lg font-semibold p-3 cursor-pointer select-none">{groupName}</summary>
                    <div className="p-3 border-t border-slate-700/50 space-y-3">
                      {groupSkills.map(([key, label]) => (
                        <div key={key} title={
                          (key === 'MeleeAmbush' || key === 'RangedAmbush' || key === 'ElementalAmbush')
                          ? 'This skill cannot be higher than your Stealth skill.'
                          : ''
                        }>
                          <div className="flex items-center justify-between text-sm"><span>{label}</span><span className="tabular-nums">{skills[key]}</span></div>
                          <input type="range" min={0} max={100} value={skills[key]} onChange={e => setSkillBound(key, parseInt(e.target.value))} className="w-full" />
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

            {/* Right column: Armor & Target */}
            <div className="flex flex-col gap-6">
              <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg">
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
                    <MaterialSelect DB={DB} subcategoriesFor={subcategoriesFor} itemsForCategory={itemsForCategory} firstSub={firstSubCat} firstMaterial={firstMat} allowed={MATERIALS_FOR_CLASS[targetArmor.class]||[]} value={{category:targetArmor.category, subCategory:targetArmor.subCategory, material:targetArmor.material}} onChange={val=> setTargetArmor(t=> ({...t, category:val.category, subCategory:val.subCategory, material:val.material}))} />
                  </div>
                  <div>
                    <label className="block text-sm mt-3">Inner Layer Material</label>
                    <MaterialSelect DB={DB} subcategoriesFor={subcategoriesFor} itemsForCategory={itemsForCategory} firstSub={firstSubCat} firstMaterial={firstMat} allowed={MATERIALS_FOR_INNER} value={{category:targetArmor.innerCategory, subCategory:targetArmor.innerSubCategory, material:targetArmor.innerMaterial}} onChange={val=> setTargetArmor(t=> ({...t, innerCategory:val.category, innerSubCategory:val.subCategory, innerMaterial:val.material}))} />
                  </div>
                  <div>
                    <label className="block text-sm mt-3">Binding</label>
                    <MaterialSelect DB={DB} subcategoriesFor={subcategoriesFor} itemsForCategory={itemsForCategory} firstSub={firstSubCat} firstMaterial={firstMat} allowed={MATERIALS_FOR_BINDING} value={{category:targetArmor.bindingCategory, subCategory:targetArmor.bindingSubCategory, material:targetArmor.bindingMaterial}} onChange={val=> setTargetArmor(t=> ({...t, bindingCategory:val.category, bindingSubCategory:val.subCategory, bindingMaterial:val.material}))} />
                  </div>
                </div>
              </section>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mt-6">
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
              <div className="text-2xl tabular-nums mt-1">{dmgVsArmor}</div>
              <div className="text-sm text-slate-300 mt-1">This number applies the target’s effective reductions for blunt, slash, and pierce types to your attack parts.</div>
            </div>
            <div className="bg-slate-800/70 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="text-slate-300 font-medium">Stamina Cost for the Attack</div>
                {damage.isHeavy && <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-400 text-amber-300">Heavy attack (double stamina)</span>}
              </div>
              <div className="text-2xl tabular-nums mt-1">{damage.staminaCost}</div>
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
                const cls = slotId.id==="shield" ? (OFFHAND_ITEMS[armor.shield?.shield]?.class||"None") : (entry.class||"None");
                const shieldType = slotId.id === "shield" ? (armor.shield?.shield || "None") : null;
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

          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg mt-6">
            <h2 className="text-lg font-semibold mb-3">Armor Loadout and Regeneration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {armorSlots.map(slot=>{
                const isShield = slot.id==="shield";
                const entry = armor[slot.id] || {};
                const cls = isShield ? (OFFHAND_ITEMS[armor.shield?.shield]?.class||"None") : (entry.class||"None");
                const category = entry.category || "Leather";
                const subCategory = entry.subCategory || firstSubCat(category);
                const material = entry.material || "";
                const innerCategory = entry.innerCategory || "Cloth";
                const innerSubCategory = entry.innerSubCategory || firstSubCat(innerCategory);
                const innerMaterial = entry.innerMaterial || "";
                const bindingCategory = entry.bindingCategory || "Leather";
                const bindingSubCategory = entry.bindingSubCategory || firstSubCat(bindingCategory);
                const bindingMaterial = entry.bindingMaterial || "";
                const isJewelry = ["ring1", "ring2", "earring1", "earring2", "amulet"].includes(slot.id);
                const eff = isJewelry ? { blunt: 0, slash: 0, pierce: 0, fire: 0, water: 0, wind: 0, earth: 0, fallbackFlags: {} } : effectiveDRForSlot(DB, cls, category, material, innerCategory, innerMaterial, bindingCategory, bindingMaterial, isShield);
                const allowedCats = MATERIALS_FOR_CLASS[entry.class||"None"] || [];
                const matObj = factorsFor(DB, category, material);

                return (
                  <div key={slot.id} className="bg-slate-800/60 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{slot.name}</div>
                      <div className="text-xs text-slate-400">Weight factor in loadout score: {slot.factor}</div>
                    </div>

                    {isJewelry ? (
                      entry.isEquipped ? (
                        <>
                          <label className="block text-sm mt-3">Setting Material</label>
                          <MaterialSelect DB={DB} subcategoriesFor={subcategoriesFor} itemsForCategory={itemsForCategory} firstSub={firstSubCat} firstMaterial={firstMat} allowed={MATERIALS_FOR_JEWELRY_SETTING} value={{category: entry.settingCategory, subCategory: entry.settingSubCategory, material: entry.settingMaterial}} onChange={val=> setJewelrySetting(slot.id, val)} />

                          <label className="block text-sm mt-3">Gem</label>
                          <MaterialSelect DB={DB} subcategoriesFor={subcategoriesFor} itemsForCategory={itemsForCategory} firstSub={firstSubCat} firstMaterial={firstMat} allowed={MATERIALS_FOR_JEWELRY_GEM} value={{category: entry.gemCategory, subCategory: entry.gemSubCategory, material: entry.gemMaterial}} onChange={val=> setJewelryGem(slot.id, val)} />
                          <div className="mt-3">
                            <label className="block text-sm">Bonus</label>
                            <input type="range" min="1" max="5" value={entry.bonus || 1} onChange={e => setArmor(p => ({...p, [slot.id]: {...p[slot.id], bonus: parseInt(e.target.value, 10)}}))} className="w-full" />
                            <div className="text-center text-sm">{entry.bonus || 1}</div>
                          </div>
                          {slot.type !== 'amulet' && (
                            <div className="mt-3">
                              <label className="block text-sm">Attribute Bonus</label>
                              <select
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2"
                                value={entry.attribute || (slot.type === 'ring' ? 'STR' : 'DEX')}
                                onChange={e => setArmor(p => ({...p, [slot.id]: {...p[slot.id], attribute: e.target.value}}))}
                              >
                                {slot.type === 'ring' && (
                                  <>
                                    <option value="STR">Strength</option>
                                    <option value="INT">Intelligence</option>
                                  </>
                                )}
                                {slot.type === 'earring' && (
                                  <>
                                    <option value="DEX">Dexterity</option>
                                    <option value="PSY">Psyche</option>
                                  </>
                                )}
                              </select>
                            </div>
                          )}
                          <button onClick={() => setArmor(p => ({...p, [slot.id]: {...p[slot.id], isEquipped: false}}))} className="mt-3 w-full bg-rose-500/20 text-rose-300 border border-rose-500 rounded-lg py-2 hover:bg-rose-500/40">Unequip</button>
                        </>
                      ) : (
                        <button onClick={() => setArmor(p => ({...p, [slot.id]: {...p[slot.id], isEquipped: true}}))} className="mt-3 w-full bg-emerald-500/20 text-emerald-300 border border-emerald-500 rounded-lg py-2 hover:bg-emerald-500/40">Equip</button>
                      )
                    ) : !isShield ? (
                      <>
                        <label className="block text-sm mt-2">Armor Class</label>
                        <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2" value={entry.class||"None"} onChange={e=>setArmorClassSafe(slot.id, e.target.value)}>
                          {Object.keys(ARMOR_CLASS).map(k=> <option key={k} value={k}>{k}</option>)}
                        </select>

                        <label className="block text-sm mt-3">Outer Material</label>
                        <MaterialSelect DB={DB} subcategoriesFor={subcategoriesFor} itemsForCategory={itemsForCategory} firstSub={firstSubCat} firstMaterial={firstMat} allowed={allowedCats} value={{category, subCategory: entry.subCategory, material}} onChange={val=> setArmorOuter(slot.id, val)} disabled={(entry.class||"None")==="None"} />

                        <label className="block text-sm mt-3">Inner Layer Material</label>
                        <MaterialSelect DB={DB} subcategoriesFor={subcategoriesFor} itemsForCategory={itemsForCategory} firstSub={firstSubCat} firstMaterial={firstMat} allowed={MATERIALS_FOR_INNER} value={{category: innerCategory, subCategory: entry.innerSubCategory, material: innerMaterial}} onChange={val=> setArmorInner(slot.id, val)} disabled={(entry.class||"None")==="None"} />

                        <label className="block text-sm mt-3">Binding</label>
                        <MaterialSelect DB={DB} subcategoriesFor={subcategoriesFor} itemsForCategory={itemsForCategory} firstSub={firstSubCat} firstMaterial={firstMat} allowed={MATERIALS_FOR_BINDING} value={{category: bindingCategory, subCategory: entry.bindingSubCategory, material: bindingMaterial}} onChange={val=> setArmorBinding(slot.id, val)} disabled={(entry.class||"None")==="None"} />

                        {(entry.class||"None")!=="None" && matObj && (
                          <div className="mt-3 bg-slate-900/60 rounded-lg p-3">
                            <div className="font-medium mb-1">Material and Armor Explanation</div>
                            <p className="text-sm text-slate-300">
                              {Object.keys(eff).filter(k => k !== 'fallbackFlags').map(key => {
                                  const value = eff[key];
                                  const isFallback = eff.fallbackFlags[key];
                                  const text = `${key.charAt(0).toUpperCase() + key.slice(1)}: ${(value * 100).toFixed(0)}%`;

                                  if (isFallback) {
                                      return (
                                          <React.Fragment key={key}>
                                              <Tooltip text="This value is a fallback for missing data.">
                                                  <span className="text-amber-400 cursor-help">{text}*</span>
                                              </Tooltip>
                                              {' '}
                                          </React.Fragment>
                                      );
                                  }
                                  return <span key={key}>{text} </span>;
                              })}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div>
                        <label className="block text-sm mt-2">Shield Type</label>
                        <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2" value={armor.shield?.shield||"None"} onChange={e=>setShieldSubtypeSafe(e.target.value)} disabled={isTwoHanded}>
                          {Object.keys(OFFHAND_ITEMS).map(k=> <option key={k} value={k}>{k}</option>)}
                        </select>
                        {armor.shield?.shield!=="None" && (
                          <div className="text-sm text-slate-300 mt-1">
                            Required Strength: <span className={`font-semibold ${(effective.STR >= (OFFHAND_ITEMS[armor.shield?.shield].strengthRequirement||0)) ? "text-emerald-300" : "text-rose-300"}`}>{OFFHAND_ITEMS[armor.shield?.shield].strengthRequirement}</span>.
                          </div>
                        )}
                        <div className="text-sm text-slate-300 mt-2">
                          Shield faces are treated similarly to wood planks for now so that the calculations stay consistent with your materials database. If you want a dedicated shield material list, tell me how you would like it organized, and I will add it.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-800/70 rounded-xl p-3">
                <div className="text-slate-300 font-medium">Loadout Score</div>
                <div className="text-sm">S equals the sum of each slot’s weight factor multiplied by the numeric value of its armor class. Smax is the same calculation as if every slot were Heavy. The ratio R equals S divided by Smax and determines your category.</div>
                <div className="text-lg tabular-nums mt-1">S = {S} / Smax = {Smax} (R = {(R*100).toFixed(1)} percent)</div>
                <div className="text-slate-300 mt-1">Category: <span className="font-semibold">{nakedOverride ? "Naked Override (no armor equipped)" : category}</span></div>
              </div>
              <div className="bg-slate-800/70 rounded-xl p-3">
                <div className="text-slate-300 font-medium">Missing Armor Penalty</div>
                <div className="text-sm">Each missing armor piece reduces your outgoing damage by fifteen percent. If you are completely naked and unshielded, there is a special rule that sets your regeneration to the naked rate and reduces your outgoing damage by seventy-five percent.</div>
                <div className="text-lg tabular-nums mt-1">Total outgoing damage penalty from missing pieces: -{missingPieces*15} percent</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-800/70 rounded-xl p-3">
                <div className="text-slate-300 font-medium">Stamina Regeneration</div>
                <div className="text-2xl tabular-nums">{regenStam}</div>
                <div className="text-sm text-slate-300 mt-1">Regeneration ticks occur every two seconds and are ten percent of the pool multiplied by your loadout multiplier and increased by up to ten percent from Armor Training.</div>
              </div>
              <div className="bg-slate-800/70 rounded-xl p-3">
                <div className="text-slate-300 font-medium">Mana Regeneration</div>
                <div className="text-2xl tabular-nums">{regenMana}</div>
                <div className="text-sm text-slate-300 mt-1">Armor class reduces both stamina and mana regeneration using the same multipliers.</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

async function loadMaterials() {
  try {
    const [db, wood, elementals, alloys, rocks] = await Promise.all([
      getDatabaseSection('materials'),
      getDatabaseSection('woodTypes'),
      getDatabaseSection('elementalMetals'),
      getDatabaseSection('metalAlloys'),
      getDatabaseSection('rockTypes'),
    ]);

    const slug = name => name.toLowerCase().replace(/\s+/g, '_');
    db['Wood'] = Object.fromEntries(
      Object.entries(wood).map(([type, list]) => [
        type,
        list.map(name => ({ id: slug(name), name }))
      ])
    );

    db['Rock Types'] = Object.fromEntries(
      Object.entries(rocks).map(([type, stones]) => [
        type,
        Object.keys(stones).map(name => ({ id: slug(name), name }))
      ])
    );

    const elementalMetals = (elementals.elements || []).map(m => ({ id: slug(m.name), name: m.name }));
    const alloyMetals = (alloys.elements || []).map(m => ({ id: slug(m.name), name: m.name }));

    db.Metals = db.Metals || {};
    db.Metals['Elemental Metals'] = elementalMetals;
    db.Metals['Metal Alloys'] = alloyMetals;

    const assignIds = obj => {
      for (const val of Object.values(obj)) {
        if (Array.isArray(val)) {
          val.forEach(m => { if (m.name && !m.id) m.id = slug(m.name); });
        } else if (val && typeof val === 'object') {
          assignIds(val);
        }
      }
    };
    assignIds(db);

    db.Dev = [
      {
        id: 'dev_material',
        name: 'Dev Material',
        Name: 'Dev Material',
        Density: 1,
        factors: {
          slash: 1,
          pierce: 1,
          blunt: 1,
          defense_slash: 1,
          defense_pierce: 1,
          defense_blunt: 1,
          fire: 1,
          water: 1,
          wind: 1,
          earth: 1,
        },
      },
    ];

    ReactDOM.createRoot(document.getElementById("root")).render(
      <React.StrictMode><App DB={db} /></React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to load materials data:', error);
    const root = document.getElementById('root');
    if (root) {
      root.textContent = 'Failed to load material data.';
    }
  }
}

loadMaterials();

