export const STAT_POOL = 270;
export const SKILL_POOL = 500;
// Base player health before any damage is taken. The value itself is kept
// constant, but actual health is stored in state so it can change over time.
export const BASE_HEALTH = 200;
export const MSF = 1.0;

export const races = [
  { id: "human", name: "Human",  modifier: { STR: 2, DEX: 2, INT: 2, PSY: 2 }, magicProficiency: "Fire" },
  { id: "dwarf", name: "Dwarf",  modifier: { STR: 0, DEX: 4, INT: 0, PSY: 4 }, magicProficiency: "Earth" },
  { id: "elf",   name: "Elf",    modifier: { STR: 0, DEX: 4, INT: 4, PSY: 0 }, magicProficiency: "Water" },
  { id: "orc",   name: "Orc",    modifier: { STR: 4, DEX: 4, INT: 0, PSY: 0 }, magicProficiency: "Wind" },
  { id: "goliath", name: "Goliath", modifier: { STR: 8, DEX: -4, INT: -8, PSY: 0 }, magicProficiency: "Void" },
  { id: "fae",   name: "Fae",    modifier: { STR: -8, DEX: 0, INT: 8, PSY: -4 }, magicProficiency: "Radiance" },
];
