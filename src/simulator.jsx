import React, { useState, useMemo, useEffect } from "react";
import ReactDOM from "react-dom/client";


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
  Round: { class: "Light",  strengthRequirement: 50, type: 'shield' },
  Kite:  { class: "Medium", strengthRequirement: 75, type: 'shield' },
  Tower: { class: "Heavy",  strengthRequirement: 100, type: 'shield' },
  Sling: { class: "None", strengthRequirement: 0, type: 'weapon' }
};

const REGEN_MULT = { Naked: 1.0, Light: 0.75, Medium: 0.50, Heavy: 0.25 };
const BASE_TICK_PCT = 0.10;

// Allowed outer categories by armor class (kept aligned to your DB families)
const MATERIALS_FOR_CLASS = {
  None:   [],
  Light:  ["Leather","Scales","Cloth","Fur"],
  Medium: ["Leather","Scales","Carapace","Wood","Bone"],
  Heavy:  ["Metal"],
};
const MATERIALS_FOR_INNER = ["Linen", "Cloth", "Leather", "Silk", "Fur"];
const MATERIALS_FOR_BINDING = ["Leather", "Metals"];
const MATERIALS_FOR_JEWELRY_SETTING = ["Metals"];
const MATERIALS_FOR_JEWELRY_GEM = ["Minerals"];

// Weapons
const WEAPONS = {
  Sword:   { type: "melee",   massKilograms: 3, baseCost: 30, head: { Blunt: 0.10, Slash: 0.35, Pierce: 0.20 }, direction: { Left: "Slash", Right: "Slash", Up: "Slash", Down: "Pierce" } },
  Axe:     { type: "melee",   massKilograms: 4, baseCost: 40, head: { Blunt: 0.20, Slash: 0.45, Pierce: 0.10 }, direction: { Left: "Slash", Right: "Slash", Up: "Slash", Down: "Blunt" } },
  Hammer:  { type: "melee",   massKilograms: 6, baseCost: 40, head: { Blunt: 0.60, Slash: 0.10, Pierce: 0.10 }, direction: { Left: "Blunt", Right: "Blunt", Up: "Blunt", Down: "Blunt" } },
  Spear:   { type: "melee",   massKilograms: 3, baseCost: 30, head: { Blunt: 0.10, Slash: 0.15, Pierce: 0.45 }, direction: { Left: "Slash", Right: "Slash", Up: "Pierce", Down: "Pierce" } },
  Dagger:  { type: "melee",   massKilograms: 1, baseCost: 20, head: { Blunt: 0.05, Slash: 0.20, Pierce: 0.30 }, direction: { Left: "Slash", Right: "Slash", Up: "Slash", Down: "Pierce" } },
  Bow:     { type: "ranged",  drawWeight: 50, head: { Pierce: 0.40 } },
  Crossbow:{ type: "ranged",  drawWeight: 35, head: { Pierce: 0.30 } },
  Sling:   { type: "ranged",  drawWeight: 15, head: { Blunt: 0.20 } },
  Throwing:{ type: "ranged",  drawWeight: 20, head: { Pierce: 0.25 } },
  Lance:   { type: "mounted", massKilograms: 5, head: { Blunt: 0.20, Pierce: 0.50 }, speed: { Walk: 0.5, Trot: 0.9, Canter: 1.2, Gallop: 1.6 } },
  Polesword: { type: "melee", massKilograms: 5, baseCost: 35, head: { Blunt: 0.10, Slash: 0.35, Pierce: 0.25 }, direction: { Left: "Slash", Right: "Slash", Up: "Pierce", Down: "Slash" } },
  Poleaxe: { type: "melee", massKilograms: 6, baseCost: 40, head: { Blunt: 0.25, Slash: 0.30, Pierce: 0.15 }, direction: { Left: "Slash", Right: "Blunt", Up: "Pierce", Down: "Slash" } },
};

const BOW_TYPES = {
  Long:    { drawWeight: 60, massKilograms: 1.2 },
  Recurve: { drawWeight: 50, massKilograms: 1.0 },
  Yumi:    { drawWeight: 55, massKilograms: 1.1 },
  Horse:   { drawWeight: 45, massKilograms: 0.8 },
  Flat:    { drawWeight: 40, massKilograms: 0.9 },
};

const MATERIALS_FOR_HANDLE_CORE = ["Wood", "Metals"];
const MATERIALS_FOR_HANDLE_GRIP = ["Cloth", "Leather"];
const MATERIALS_FOR_HANDLE_FITTING = ["Metals", "Minerals"];
const MATERIALS_FOR_HEAD = ["Metals", "Minerals", "Wood"];

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
  const hasShield = (OFFHAND_ITEMS[shieldSubtype]?.class||"None")!=="None" && STR >= (OFFHAND_ITEMS[shieldSubtype]?.strReq||0);
  const nakedOverride = noArmor && !hasShield;
  return { S,Smax,R,category,missingPieces,nakedOverride };
}

function regenPerTick(pool, category, nakedOverride, armorTraining=0){
  const REGEN_MULT = { Naked: 1.0, Light: 0.75, Medium: 0.50, Heavy: 0.25 };
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
  if (cat === "Metal") cat = "Metals";
  return DB[cat] || {};
}
function itemsForCategory(DB, cat){
  const obj = getMaterialsForCategory(DB, cat);
  if (Array.isArray(obj)) return obj;
  let arr = [];
  for (const list of Object.values(obj || {})){
    if (Array.isArray(list)) arr = arr.concat(list);
  }
  return arr;
}
function factorsFor(DB, cat, materialName){
  const items = itemsForCategory(DB, cat);
  for (const m of items){ if (m.name === materialName) return m; }
  return null;
}

// Weighted 80% outer, 15% inner, 5% binding; multiplied by armor-class base DRs
function effectiveDRForSlot(DB, cls, outerCategory, materialName, innerCategory, innerMaterialName, bindingCategory, bindingMaterialName, isShield=false){
  const base = classBasePerType(cls);
  let outerFac = null;
  if (isShield){
    const anyWood = itemsForCategory(DB, "Wood")[0] || null;
    outerFac = anyWood ? anyWood : { slash:0, pierce:0, blunt:0, defense_slash:0, defense_pierce:0, defense_blunt:0, fire:0, water:0, wind:0, earth:0 };
  } else {
    outerFac = factorsFor(DB, outerCategory, materialName) || { slash:0, pierce:0, blunt:0, defense_slash:0, defense_pierce:0, defense_blunt:0, fire:0, water:0, wind:0, earth:0 };
  }
  const innerFac = factorsFor(DB, innerCategory, innerMaterialName) || { slash:0, pierce:0, blunt:0, defense_slash:0, defense_pierce:0, defense_blunt:0, fire:0, water:0, wind:0, earth:0 };
  const bindFac  = factorsFor(DB, bindingCategory, bindingMaterialName) || { slash:0, pierce:0, blunt:0, defense_slash:0, defense_pierce:0, defense_blunt:0, fire:0, water:0, wind:0, earth:0 };
  const wOuter=0.80, wInner=0.15, wBind=0.05;
  const comb = {
    blunt: outerFac.defense_blunt*wOuter + innerFac.defense_blunt*wInner + bindFac.defense_blunt*wBind,
    slash: outerFac.defense_slash*wOuter + innerFac.defense_slash*wInner + bindFac.defense_slash*wBind,
    pierce: outerFac.defense_pierce*wOuter + innerFac.defense_pierce*wInner + bindFac.defense_pierce*wBind,
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
      // If the calculated defense value is so low that it would display as 0%,
      // apply the fallback value to ensure a minimum level of defense is shown.
      if (defenses[key] < 0.005) {
          defenses[key] = 0.1; // Fallback to 10%
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
        'boots': 'medium_boots.png', 'gloves': 'medium_gauntlets.png',
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
            const material = firstName(category);
            newArmor[slot.id] = { ...prev, class: preferredArmorClass, category, material };
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
  function firstName(cat){
    const items = itemsForCategory(DB, cat);
    return (items[0]?.name) || "";
  }

  // Armor pieces (each piece has class, outer category/material + inner + binding)
  const [armor, setArmor] = useState({
    helmet: { class:"None", category:"Leather", material:firstName("Leather"), innerCategory:"Cloth", innerMaterial:firstName("Cloth"), bindingCategory:"Leather", bindingMaterial:firstName("Leather") },
    gloves: { class:"None", category:"Leather", material:firstName("Leather"), innerCategory:"Cloth", innerMaterial:firstName("Cloth"), bindingCategory:"Leather", bindingMaterial:firstName("Leather") },
    boots:  { class:"None", category:"Leather", material:firstName("Leather"), innerCategory:"Cloth", innerMaterial:firstName("Cloth"), bindingCategory:"Leather", bindingMaterial:firstName("Leather") },
    torso:  { class:"None", category:"Leather", material:firstName("Leather"), innerCategory:"Cloth", innerMaterial:firstName("Cloth"), bindingCategory:"Leather", bindingMaterial:firstName("Leather") },
    legs:   { class:"None", category:"Leather", material:firstName("Leather"), innerCategory:"Cloth", innerMaterial:firstName("Cloth"), bindingCategory:"Leather", bindingMaterial:firstName("Leather") },
    shield: { shield:"None" },
    ring1: { isEquipped: true, settingCategory:"Metals", settingMaterial:firstName("Metals"), gemCategory:"Minerals", gemMaterial:firstName("Minerals"), bonus: 1, attribute: 'Strength' },
    ring2: { isEquipped: true, settingCategory:"Metals", settingMaterial:firstName("Metals"), gemCategory:"Minerals", gemMaterial:firstName("Minerals"), bonus: 1, attribute: 'Strength' },
    earring1: { isEquipped: true, settingCategory:"Metals", settingMaterial:firstName("Metals"), gemCategory:"Minerals", gemMaterial:firstName("Minerals"), bonus: 1, attribute: 'Dexterity' },
    earring2: { isEquipped: true, settingCategory:"Metals", settingMaterial:firstName("Metals"), gemCategory:"Minerals", gemMaterial:firstName("Minerals"), bonus: 1, attribute: 'Dexterity' },
    amulet: { isEquipped: true, settingCategory:"Metals", settingMaterial:firstName("Metals"), gemCategory:"Minerals", gemMaterial:firstName("Minerals"), bonus: 1, attribute: 'Intelligence' },
  });

  // Target armor (for “damage against armor”)
    const [targetArmor, setTargetArmor] = useState({
      class: "Heavy", category: "Metal", material: firstName("Metal"), innerCategory:"Cloth", innerMaterial:firstName("Cloth"), bindingCategory:"Leather", bindingMaterial:firstName("Leather")
    });

  // Weapon & attack
  const [weaponKey, setWeaponKey] = useState("Sword");
  const [direction, setDirection] = useState("Left");
  const [charge, setCharge]       = useState(1.0); // up to 1.5 (heavy at 1.5)
  const [swing, setSwing]         = useState(1.0);
  const [mountedSpeed, setMountedSpeed] = useState("Gallop");
  const [bowType, setBowType] = useState("Long");
  const [bowWood, setBowWood] = useState({ category: "Wood", material: firstName("Wood") });
  // Handle/hilt (3) + head
  const [weaponComps, setWeaponComps] = useState({
    core: { category: "Wood", material: firstName("Wood") },
    grip: { category: "Leather", material: firstName("Leather") },
    fitting: { category: "Metals", material: firstName("Metals") },
    head: { category: "Metals", material: firstName("Metals") },
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
  const effective = useMemo(()=> {
      let statsWithJewelry = { ...stats };
      ["ring1", "ring2", "earring1", "earring2", "amulet"].forEach(slotId => {
          const item = armor[slotId];
          if (item && item.isEquipped && item.attribute && item.bonus) {
              statsWithJewelry[item.attribute] += item.bonus;
          }
      });

      statsWithJewelry.STR = Math.min(100, statsWithJewelry.STR);
      statsWithJewelry.DEX = Math.min(100, statsWithJewelry.DEX);
      statsWithJewelry.INT = Math.min(100, statsWithJewelry.INT);
      statsWithJewelry.PSY = Math.min(100, statsWithJewelry.PSY);

      return {
        STR: Math.max(0, statsWithJewelry.STR + (race.modifier.STR||0)),
        DEX: Math.max(0, statsWithJewelry.DEX + (race.modifier.DEX||0)),
        INT: Math.max(0, statsWithJewelry.INT + (race.modifier.INT||0)),
        PSY: Math.max(0, statsWithJewelry.PSY + (race.modifier.PSY||0)),
      };
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

    const outMult = (nakedOverride ? 0.25 : 1) * Math.max(0, 1 - 0.15*missingPieces);
    total = Math.floor(total * outMult);

    const partsSum = Object.values(scaledWithSkill).reduce((a,b)=> a+(b||0), 0) || 1;
    const finalParts = {};
    for (const [k,v] of Object.entries(scaledWithSkill)) finalParts[k] = Math.floor(total * (v||0) / partsSum);

    if (isTwoHanded) {
      total *= 2;
    }
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
    const material = firstName(category);
    return { ...p, [slotId]: { ...prev, class: className, category, material } };
  });
  const setShieldSubtypeSafe = (sub)=> setArmor(p=> ({ ...p, shield: { ...p.shield, shield: sub } }));
  const setArmorCategory = (slotId, category)=> setArmor(p=>{
    const prev = p[slotId] || {};
    const material = firstName(category);
    return { ...p, [slotId]: { ...prev, category, material } };
  });
  const setArmorMaterial = (slotId, material)=> setArmor(p=> ({ ...p, [slotId]: { ...p[slotId], material } }));
  const setArmorInnerCategory = (slotId, category)=> setArmor(p=>{
    const prev = p[slotId] || {};
    const material = firstName(category);
    return { ...p, [slotId]: { ...prev, innerCategory: category, innerMaterial: material } };
  });
  const setArmorInnerMaterial = (slotId, material)=> setArmor(p=> ({ ...p, [slotId]: { ...p[slotId], innerMaterial: material } }));

  const setArmorBindingCategory = (slotId, category)=> setArmor(p=>{
    const prev = p[slotId] || {};
    const material = firstName(category);
    return { ...p, [slotId]: { ...prev, bindingCategory: category, bindingMaterial: material } };
  });
  const setArmorBindingMaterial = (slotId, material)=> setArmor(p=> ({ ...p, [slotId]: { ...p[slotId], bindingMaterial: material } }));

  const setJewelrySettingCategory = (slotId, category)=> setArmor(p=>{
    const prev = p[slotId] || {};
    const material = firstName(category);
    return { ...p, [slotId]: { ...prev, settingCategory: category, settingMaterial: material } };
  });
  const setJewelrySettingMaterial = (slotId, material)=> setArmor(p=> ({ ...p, [slotId]: { ...p[slotId], settingMaterial: material } }));
  const setJewelryGemCategory = (slotId, category)=> setArmor(p=>{
    const prev = p[slotId] || {};
    const material = firstName(category);
    return { ...p, [slotId]: { ...prev, gemCategory: category, gemMaterial: material } };
  });
  const setJewelryGemMaterial = (slotId, material)=> setArmor(p=> ({ ...p, [slotId]: { ...p[slotId], gemMaterial: material } }));

  const setWeaponCompCategory = (comp, category)=> setWeaponComps(p=>{
    const prev = p[comp] || {};
    const material = firstName(category);
    return { ...p, [comp]: { ...prev, category, material } };
  });
  const setWeaponCompMaterial = (comp, material)=> setWeaponComps(p=> ({ ...p, [comp]: { ...p[comp], material } }));

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
              <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <h2 className="text-lg font-semibold mb-3">Character</h2>
                <div className="mb-4">
                  <label className="block text-sm mb-1">Race</label>
                  <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2" value={raceId} onChange={e=>setRaceId(e.target.value)}>
                    {races.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <div className="text-sm text-slate-300 mt-2">
                    The chosen race applies the following adjustments to your base attributes:
                    Strength {race.modifier.STR>=0?"+":""}{race.modifier.STR}, Dexterity {race.modifier.DEX>=0?"+":""}{race.modifier.DEX}, Intelligence {race.modifier.INT>=0?"+":""}{race.modifier.INT}, Psyche {race.modifier.PSY>=0?"+":""}{race.modifier.PSY}.
                  </div>
                </div>
                {["STR","DEX","INT","PSY"].map(k=> (
                  <div key={k} className="mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>{k}</span>
                      <span className="tabular-nums">{stats[k]} <span className="text-slate-500">(effective {effective[k]})</span></span>
                    </div>
                    <input type="range" min={0} max={100} value={stats[k]} onChange={e=>setStat(k, parseInt(e.target.value))} className="w-full" />
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm mt-2">
                  <div>Attribute points spent</div>
                  <div className={`tabular-nums ${remain<0?"text-rose-400":""}`}>{spent} / {STAT_POOL} <span className="text-slate-500">(remaining {Math.max(0, remain)})</span></div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
                  <div className="bg-slate-800/70 rounded-xl p-3"><div className="text-slate-400">Health</div><div className="text-xl tabular-nums">{HEALTH_FIXED}</div></div>
                  <div className="bg-slate-800/70 rounded-xl p-3"><div className="text-slate-400">Stamina</div><div className="text-xl tabular-nums">{stamPool}</div></div>
                  <div className="bg-slate-800/70 rounded-xl p-3"><div className="text-slate-400">Mana</div><div className="text-xl tabular-nums">{manaPoolV}</div></div>
                </div>
              </section>

              <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <h2 className="text-lg font-semibold mb-3">Weapons and Attack</h2>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm mb-1">Weapon</label>
                    <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" value={weaponKey} onChange={e=>setWeaponKey(e.target.value)}>
                      {Object.keys(WEAPONS).map(k=> <option key={k} value={k}>{k}</option>)}
                    </select>
                    {weapon?.type==='melee' && <div className="text-sm text-slate-300 mt-1">This weapon weighs approximately {weapon.massKilograms} kilograms. The stamina cost to swing is the base cost {weapon.baseCost} plus one times the rounded mass.</div>}
                  </div>

                  {weaponKey === 'Bow' ? (
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-sm mb-1">Bow Type</label>
                        <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" value={bowType} onChange={e=>setBowType(e.target.value)}>
                          {Object.keys(BOW_TYPES).map(k=> <option key={k} value={k}>{k}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Wood Material</label>
                        <div className="grid grid-cols-1 gap-2 mt-1">
                          <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" value={bowWood.material} onChange={e=> {
                              const material = e.target.value;
                              setBowWood(w => ({...w, material}));
                          }}>
                            {itemsForCategory(DB, "Wood").map(m=> <option key={m.name} value={m.name}>{m.name}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-sm mb-1">Handle or Core Material</label>
                        <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" value={weaponComps.core.category} onChange={e=>setWeaponCompCategory('core', e.target.value)}>
                          {MATERIALS_FOR_HANDLE_CORE.map(k=> <option key={k} value={k}>{k}</option>)}
                        </select>
                        <div className="grid grid-cols-1 gap-2 mt-1">
                          <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" value={weaponComps.core.material} onChange={e=>setWeaponCompMaterial('core', e.target.value)}>
                            {itemsForCategory(DB, weaponComps.core.category).map(m=> <option key={m.name} value={m.name}>{m.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Grip or Wrap Material</label>
                        <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" value={weaponComps.grip.category} onChange={e=>setWeaponCompCategory('grip', e.target.value)}>
                          {MATERIALS_FOR_HANDLE_GRIP.map(k=> <option key={k} value={k}>{k}</option>)}
                        </select>
                        <div className="grid grid-cols-1 gap-2 mt-1">
                          <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" value={weaponComps.grip.material} onChange={e=>setWeaponCompMaterial('grip', e.target.value)}>
                            {itemsForCategory(DB, weaponComps.grip.category).map(m=> <option key={m.name} value={m.name}>{m.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Guard or Pommel Fittings</label>
                        <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" value={weaponComps.fitting.category} onChange={e=>setWeaponCompCategory('fitting', e.target.value)}>
                          {MATERIALS_FOR_HANDLE_FITTING.map(k=> <option key={k} value={k}>{k}</option>)}
                        </select>
                        <div className="grid grid-cols-1 gap-2 mt-1">
                          <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" value={weaponComps.fitting.material} onChange={e=>setWeaponCompMaterial('fitting', e.target.value)}>
                            {itemsForCategory(DB, weaponComps.fitting.category).map(m=> <option key={m.name} value={m.name}>{m.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Weapon Head Material</label>
                        <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" value={weaponComps.head.category} onChange={e=>setWeaponCompCategory('head', e.target.value)}>
                          {MATERIALS_FOR_HEAD.map(k=> <option key={k} value={k}>{k}</option>)}
                        </select>
                        <div className="grid grid-cols-1 gap-2 mt-1">
                          <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" value={weaponComps.head.material} onChange={e=>setWeaponCompMaterial('head', e.target.value)}>
                            {itemsForCategory(DB, weaponComps.head.category).map(m=> <option key={m.name} value={m.name}>{m.name}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {["Sword", "Axe", "Hammer", "Spear"].includes(weaponKey) && (
                      <div>
                          <label className="block text-sm mb-1">
                          <input type="checkbox" checked={isTwoHanded} onChange={e => setTwoHanded(e.target.checked)} disabled={armor.shield.shield !== 'None'} />
                          Two-Handed
                          </label>
                      </div>
                  )}
                  {weapon?.type==='melee' && (
                    <div>
                      <label className="block text-sm mb-1">Attack Direction</label>
                      <div className="grid grid-cols-1 gap-2">
                        {DIRECTIONS.map(d=> (
                          <button key={d} onClick={() => setDirection(d)} className={`w-full px-3 py-2 text-sm rounded-lg border ${direction===d ? "border-emerald-400 bg-emerald-400/10" : "border-slate-700"}`}>
                            {d}
                          </button>
                        ))}
                      </div>
                      <div className="text-sm text-slate-300 mt-1">Each direction selects a different type of damage for your weapon. For example, the downward direction with a sword is a piercing thrust.</div>
                    </div>
                  )}

                  {weapon?.type==='mounted' && (
                    <div>
                      <label className="block text-sm mb-1">Mount Speed</label>
                      <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" value={mountedSpeed} onChange={e=>setMountedSpeed(e.target.value)}>
                        {Object.keys(WEAPONS.Lance.speed).map(k=> <option key={k} value={k}>{k}</option>)}
                      </select>
                      <div className="text-sm text-slate-300 mt-1">Lance attacks do not use charge time or swing completion. Damage scales with the speed of the mount.</div>
                    </div>
                  )}

                  {weapon && weapon.type!=='mounted' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Charge Time</span>
                          <span className="tabular-nums">{charge.toFixed(2)} seconds</span>
                        </div>
                        <input type="range" min={0} max={1.5} step={0.01} value={charge} onChange={e=>setCharge(parseFloat(e.target.value))} className="w-full" />
                        <div className="text-sm text-slate-300 mt-1">If your charge time is one and a half seconds, the attack is a heavy attack and costs twice as much stamina.</div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Swing Completion</span>
                          <span className="tabular-nums">{(swing*100).toFixed(0)}%</span>
                        </div>
                        <input type="range" min={0} max={1} step={0.01} value={swing} onChange={e=>setSwing(parseFloat(e.target.value))} className="w-full" />
                        <div className="text-sm text-slate-300 mt-1">If your swing completion is below sixty percent, your attack does no damage. Otherwise damage scales with completion.</div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
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
                        const mat = (itemsForCategory(DB, cat)[0]?.name) || "";
                        setTargetArmor(t=> ({...t, class: cls, category: cat, material: mat}));
                      }}
                    >
                      {Object.keys(ARMOR_CLASS).map(k=> <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm">Outer Material Category, which is eighty percent of the weighting</label>
                    <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2" value={targetArmor.category} onChange={e=> {
                      const cat = e.target.value;
                      const firstNameInCat = (itemsForCategory(DB, cat)[0]?.name) || "";
                      setTargetArmor(t=> ({...t, category: cat, material:firstNameInCat}));
                    }}>
                      {(MATERIALS_FOR_CLASS[targetArmor.class]||[]).map(k=> <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="block text-sm">Specific Material</label>
                      <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2" value={targetArmor.material} onChange={e=> setTargetArmor(t=> ({...t, material: e.target.value}))}>
                        {itemsForCategory(DB, targetArmor.category).map(m=> <option key={m.name} value={m.name}>{m.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mt-3">Inner Layer Material</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2" value={targetArmor.innerCategory} onChange={e=> {
                        const cat = e.target.value;
                        const material = firstName(cat);
                        setTargetArmor(t=> ({...t, innerCategory: cat, innerMaterial: material}));
                    }}>
                      {MATERIALS_FOR_INNER.map(k=> <option key={k} value={k}>{k}</option>)}
                    </select>
                    <div className="grid grid-cols-1 gap-2 mt-3">
                      <div>
                        <label className="block text-sm">Specific Material</label>
                        <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2" value={targetArmor.innerMaterial} onChange={e=> setTargetArmor(t=> ({...t, innerMaterial: e.target.value}))}>
                          {itemsForCategory(DB, targetArmor.innerCategory).map(m=> <option key={m.name} value={m.name}>{m.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mt-3">Thread and Binding</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2" value={targetArmor.bindingCategory} onChange={e=> {
                        const cat = e.target.value;
                        const material = firstName(cat);
                        setTargetArmor(t=> ({...t, bindingCategory: cat, bindingMaterial: material}));
                    }}>
                      {MATERIALS_FOR_BINDING.map(k=> <option key={k} value={k}>{k}</option>)}
                    </select>
                    <div className="grid grid-cols-1 gap-2 mt-3">
                      <div>
                        <label className="block text-sm">Specific Material</label>
                        <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2" value={targetArmor.bindingMaterial} onChange={e=> setTargetArmor(t=> ({...t, bindingMaterial: e.target.value}))}>
                          {itemsForCategory(DB, targetArmor.bindingCategory).map(m=> <option key={m.name} value={m.name}>{m.name}</option>)}
                        </select>
                      </div>
                    </div>
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
                  <div key={slotId} className="rounded-xl border border-slate-800 p-3 bg-slate-800/50">
                    <div className="text-sm font-medium">{label}</div>
                    <div className="slot-box mt-2 rounded-lg flex items-center justify-center">
                      <img src={iconUrl} alt={label} className={`w-20 h-20 object-contain rounded-lg border-4 ${borderColor}`} />
                    </div>
                  </div>
                );
              })}
              <div className="rounded-xl border border-slate-800 p-3 bg-slate-800/50">
                <div className="text-sm font-medium">Ranged Weapon</div>
                <div className="slot-box mt-2 rounded-lg border border-slate-700 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-sm">{weaponKey==='Bow'||weaponKey==='Crossbow'||weaponKey==='Sling'||weaponKey==='Throwing'? weaponKey : 'Not Equipped'}</div>
                    <div className="text-xs text-slate-400">{weaponKey==='Bow'||weaponKey==='Crossbow'||weaponKey==='Sling'||weaponKey==='Throwing'? (weaponComps.head.material+' head') : ''}</div>
                  </div>
                </div>
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
                const material = entry.material || "";
                const innerCategory = entry.innerCategory || "Cloth";
                const innerMaterial = entry.innerMaterial || "";
                const bindingCategory = entry.bindingCategory || "Leather";
                const bindingMaterial = entry.bindingMaterial || "";
                const isJewelry = ["ring1", "ring2", "earring1", "earring2", "amulet"].includes(slot.id);
                const eff = isJewelry ? { blunt: 0, slash: 0, pierce: 0, fire: 0, water: 0, wind: 0, earth: 0, fallbackFlags: {} } : effectiveDRForSlot(DB, cls, category, material, innerCategory, innerMaterial, bindingCategory, bindingMaterial, isShield);
                const allowedCats = MATERIALS_FOR_CLASS[entry.class||"None"] || [];
                const items = itemsForCategory(DB, category);
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
                          <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2" value={entry.settingCategory} onChange={e=>setJewelrySettingCategory(slot.id, e.target.value)}>
                            {MATERIALS_FOR_JEWELRY_SETTING.map(k=> <option key={k} value={k}>{k}</option>)}
                          </select>
                          <div className="grid grid-cols-1 gap-2 mt-3">
                            <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2" value={entry.settingMaterial} onChange={e=>setJewelrySettingMaterial(slot.id, e.target.value)}>
                              {itemsForCategory(DB, entry.settingCategory).map(m=> <option key={m.name} value={m.name}>{m.name}</option>)}
                            </select>
                          </div>

                          <label className="block text-sm mt-3">Gem</label>
                          <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2" value={entry.gemCategory} onChange={e=>setJewelryGemCategory(slot.id, e.target.value)}>
                            {MATERIALS_FOR_JEWELRY_GEM.map(k=> <option key={k} value={k}>{k}</option>)}
                          </select>
                          <div className="grid grid-cols-1 gap-2 mt-3">
                            <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2" value={entry.gemMaterial} onChange={e=>setJewelryGemMaterial(slot.id, e.target.value)}>
                              {itemsForCategory(DB, entry.gemCategory).map(m=> <option key={m.name} value={m.name}>{m.name}</option>)}
                            </select>
                          </div>
                          <div className="mt-3">
                            <label className="block text-sm">Bonus</label>
                            <input type="range" min="1" max="5" value={entry.bonus || 1} onChange={e => setArmor(p => ({...p, [slot.id]: {...p[slot.id], bonus: parseInt(e.target.value, 10)}}))} className="w-full" />
                            <div className="text-center text-sm">{entry.bonus || 1}</div>
                          </div>
                          <div className="mt-3">
                            <label className="block text-sm">Attribute Bonus</label>
                            <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2" value={entry.attribute || 'Strength'} onChange={e => setArmor(p => ({...p, [slot.id]: {...p[slot.id], attribute: e.target.value}}))}>
                              <option value="STR">Strength</option>
                              <option value="DEX">Dexterity</option>
                              <option value="INT">Intelligence</option>
                              <option value="PSY">Psyche</option>
                            </select>
                          </div>
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

                        <label className="block text-sm mt-3">Outer Material Category</label>
                        <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2" value={category} onChange={e=>setArmorCategory(slot.id, e.target.value)} disabled={(entry.class||"None")==="None"}>
                          {allowedCats.map(k=> <option key={k} value={k}>{k}</option>)}
                        </select>

                        <div className="grid grid-cols-1 gap-2 mt-3">
                          <div>
                            <label className="block text-sm">Specific Material</label>
                            <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2" value={material} onChange={e=>setArmorMaterial(slot.id, e.target.value)} disabled={(entry.class||"None")==="None"}>
                              {items.map(m=> <option key={m.name} value={m.name}>{m.name}</option>)}
                            </select>
                          </div>
                        </div>

                        <label className="block text-sm mt-3">Inner Layer Material</label>
                        <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2" value={entry.innerCategory} onChange={e=>setArmorInnerCategory(slot.id, e.target.value)} disabled={(entry.class||"None")==="None"}>
                          {MATERIALS_FOR_INNER.map(k=> <option key={k} value={k}>{k}</option>)}
                        </select>
                        <div className="grid grid-cols-1 gap-2 mt-3">
                          <div>
                            <label className="block text-sm">Specific Material</label>
                            <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2" value={entry.innerMaterial} onChange={e=>setArmorInnerMaterial(slot.id, e.target.value)} disabled={(entry.class||"None")==="None"}>
                              {itemsForCategory(DB, entry.innerCategory).map(m=> <option key={m.name} value={m.name}>{m.name}</option>)}
                            </select>
                          </div>
                        </div>

                        <label className="block text-sm mt-3">Thread and Binding</label>
                        <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2" value={entry.bindingCategory} onChange={e=>setArmorBindingCategory(slot.id, e.target.value)} disabled={(entry.class||"None")==="None"}>
                          {MATERIALS_FOR_BINDING.map(k=> <option key={k} value={k}>{k}</option>)}
                        </select>
                        <div className="grid grid-cols-1 gap-2 mt-3">
                          <div>
                            <label className="block text-sm">Specific Material</label>
                            <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2" value={entry.bindingMaterial} onChange={e=>setArmorBindingMaterial(slot.id, e.target.value)} disabled={(entry.class||"None")==="None"}>
                              {itemsForCategory(DB, entry.bindingCategory).map(m=> <option key={m.name} value={m.name}>{m.name}</option>)}
                            </select>
                          </div>
                        </div>

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

          <div className="mt-6 text-xs text-slate-500">v16.0: Database-backed materials (T1–T5), inner and binding options per armor piece, centered skill specification with points, equipment preview restored at the bottom, and clear plain-English explanations. Heavy armor reduces magic by twenty-five percent, and Carapace is not available for weapon heads.</div>
        </div>
      </div>
    </>
  );
}

async function loadMaterials() {
  try {
    const response = await fetch('materials.json', { cache: 'no-cache' });
    const db = await response.json();

    const [elementals, alloys] = await Promise.all([
      fetch('Master_Elemental_Metals.json', { cache: 'no-cache' }).then(r => r.json()),
      fetch('Master_Metal_Alloys.json', { cache: 'no-cache' }).then(r => r.json()),
    ]);

    const elementalMetals = (elementals.elements || []).map(m => ({ name: m.name }));
    const alloyMetals = (alloys.elements || []).map(m => ({ name: m.name }));

    db['Elemental Metals'] = elementalMetals;
    db['Metal Alloys'] = alloyMetals;

    if (!db.Metals) db.Metals = { T1: [], T2: [], T3: [], T4: [], T5: [] };
    const existing = new Set((db.Metals.T1 || []).map(m => m.name));
    for (const m of [...elementalMetals, ...alloyMetals]) {
      if (!existing.has(m.name)) {
        db.Metals.T1.push(m);
        existing.add(m.name);
      }
    }

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

const versionDisplay = document.getElementById('version-display');
if (versionDisplay) {
  versionDisplay.textContent = 'Version: 16.0';
}
