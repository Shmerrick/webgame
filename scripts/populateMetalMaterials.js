import fs from 'fs';
import { calculateMaterialDefenses } from '../src/materialCalculations.js';

const materialsPath = 'public/materials.json';
const elemPath = 'public/Master_Elemental_Metals.json';
const alloyPath = 'public/Master_Metal_Alloys.json';

const db = JSON.parse(fs.readFileSync(materialsPath, 'utf8'));
const elemData = JSON.parse(fs.readFileSync(elemPath, 'utf8'));
const alloyData = JSON.parse(fs.readFileSync(alloyPath, 'utf8'));

const num = (obj, factor = 1) =>
  obj && typeof obj.value === 'number' ? obj.value * factor : undefined;
const slug = (name) => name.toLowerCase().replace(/\s+/g, '_');

const table = [
  { m: 1, hv: 14 },
  { m: 2, hv: 57 },
  { m: 3, hv: 137 },
  { m: 4, hv: 275 },
  { m: 5, hv: 500 },
  { m: 6, hv: 800 },
  { m: 7, hv: 1250 },
  { m: 8, hv: 2000 },
  { m: 9, hv: 3100 },
  { m: 10, hv: 4000 },
];

function hvToMohs(hv) {
  if (!hv || !Number.isFinite(hv)) return undefined;
  for (let i = 1; i < table.length; i++) {
    if (hv <= table[i].hv) {
      const prev = table[i - 1];
      const next = table[i];
      const frac = (hv - prev.hv) / (next.hv - prev.hv);
      return Number((prev.m + frac * (next.m - prev.m)).toFixed(2));
    }
  }
  return 10;
}

function extract(m) {
  const mp = m.mechanical_properties || {};
  const density = m.density ?? num(mp.density);
  const yieldStrength = m.yieldStrength ?? num(mp.yield_strength);
  const tensileStrength = m.tensileStrength ?? num(mp.ultimate_tensile_strength);
  const elasticModulus =
    m.elasticModulus ??
    num(mp.youngs_modulus, mp.youngs_modulus?.units === 'GPa' ? 1000 : 1);
  const brinellMPa =
    m.brinellHardness ?? num(mp.brinell_hardness) ?? num(mp.vickers_hardness);
  const vickersMPa = m.vickersMPa ?? num(mp.vickers_hardness);
  const hardness =
    m.hardness ??
    num(mp.mohs_hardness) ??
    (mp.brinell_hardness || mp.vickers_hardness
      ? hvToMohs(brinellMPa / 9.807)
      : brinellMPa);
  const toughness =
    m.toughness ??
    (tensileStrength ? Number((tensileStrength * 0.1).toFixed(2)) : undefined);
  const thermalExpansion =
    m.thermalExpansion ?? num(mp.thermal_expansion_coefficient);
  const out = {
    name: m.name,
    class: 'Metal',
    density,
    yieldStrength,
    tensileStrength,
    elasticModulus,
    brinellMPa,
    vickersMPa,
    hardness,
    toughness,
    thermalConductivity: m.thermalConductivity ?? num(mp.thermal_conductivity),
    thermalExpansion,
    specificHeat: m.specificHeat ?? num(mp.specific_heat),
    meltingPoint: m.meltingPoint ?? num(mp.melting_point),
    electricalResistivity:
      m.electricalResistivity ?? num(mp.electrical_resistivity),
  };
  return out;
}

const metals = {
  'Elemental Metals': elemData.elements.map(extract),
  'Metal Alloys': alloyData.elements.map(extract),
};

const all = [...metals['Elemental Metals'], ...metals['Metal Alloys']];
const scored = calculateMaterialDefenses(all);
all.forEach((m, i) => {
  const s = scored[i];
  m.factors = {
    slash: s.D_slash,
    pierce: s.D_pierce,
    blunt: s.D_blunt,
    defense_slash: s.R_slash,
    defense_pierce: s.R_pierce,
    defense_blunt: s.R_blunt,
    fire: s.R_fire,
    water: s.R_water,
    wind: s.R_wind,
    earth: s.R_earth,
  };
  m.id = slug(m.name);
});

db.Metals = metals;
fs.writeFileSync(materialsPath, JSON.stringify(db, null, 2) + '\n');
console.log('Metal materials populated');
