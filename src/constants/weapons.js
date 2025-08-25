export const WEAPONS = {
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

export const MATERIALS_FOR_HANDLE_CORE = ["Wood", "Metals", "Dev"];
export const MATERIALS_FOR_HANDLE_GRIP = ["Cloth", "Leather", "Dev"];
export const MATERIALS_FOR_HANDLE_FITTING = ["Metals", "Rock Types", "Dev"];
export const MATERIALS_FOR_HEAD = ["Metals", "Rock Types", "Wood", "Dev"];
export const BANNED_WEAPON_HEAD_MATERIALS = ["Carapace", "Cloth", "Fur", "Herbs", "Leather", "Linen", "Scales"];
