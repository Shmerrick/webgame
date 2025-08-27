export const armorSlots = [
  { id: "helmet", name: "Helmet", factor: 1 },
  { id: "gloves", name: "Gloves", factor: 1 },
  { id: "boots",  name: "Boots",  factor: 2 },
  { id: "torso",  name: "Torso",  factor: 3 },
  { id: "legs",   name: "Legs",   factor: 3 },
  { id: "shield", name: "Off-Hand", factor: 2 },
  { id: "ring1", name: "Ring 1", factor: 0, type: 'ring' },
  { id: "ring2", name: "Ring 2", factor: 0, type: 'ring' },
  { id: "earring1", name: "Earring 1", factor: 0, type: 'earring' },
  { id: "earring2", name: "Earring 2", factor: 0, type: 'earring' },
  { id: "amulet", name: "Amulet", factor: 0, type: 'amulet' },
];

export const ARMOR_CLASS = {
  None:   { value: 0, physical: 0.00, magical: 0.00 },
  Light:  { value: 1, physical: 0.45, magical: 0.45 },
  Medium: { value: 2, physical: 0.65, magical: 0.65 },
  Heavy:  { value: 3, physical: 0.85, magical: 0.85 },
};

export const OFFHAND_ITEMS = {
  None:  { class: "None",   strengthRequirement: 0, type: 'shield' },
  Buckler: { class: "Light", strengthRequirement: 25, type: 'shield' },
  Round: { class: "Light",  strengthRequirement: 50, type: 'shield' },
  Kite:  { class: "Medium", strengthRequirement: 75, type: 'shield' },
  Tower: { class: "Heavy",  strengthRequirement: 100, type: 'shield' },
  Sling: { class: "None", strengthRequirement: 0, type: 'weapon' }
};

export const DEFAULT_OFFHAND_ITEM = Object.keys(OFFHAND_ITEMS).find(k => k !== "None") || "None";

export const REGEN_MULT = { Naked: 1.0, Light: 0.75, Medium: 0.50, Heavy: 0.25 };
export const BASE_TICK_PCT = 0.10;
export const MIN_DEFENSE_FLOOR = 0.01;

export const MATERIALS_FOR_CLASS = {
  None:   [],
  Light:  ["Leather","Scales","Linen","Fur","Dev"],
  Medium: ["Leather","Scales","Carapace","Wood","Bone","Dev"],
  Heavy:  ["Metals","Dev"],
};
export const MATERIALS_FOR_INNER = ["Linen", "Leather", "Fur", "Dev"];
export const MATERIALS_FOR_BINDING = ["Leather", "Dev"];
export const MATERIALS_FOR_JEWELRY_SETTING = ["Metals", "Dev"];
export const MATERIALS_FOR_JEWELRY_GEM = ["Cut Gemstones", "Dev"];
