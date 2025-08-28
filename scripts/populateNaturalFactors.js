import fs from 'fs';
import { calculateMaterialDefenses } from '../src/materialCalculations.js';

const dbPath = 'public/materials.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

function populate(category, groups, className, propsFile) {
  const props = JSON.parse(fs.readFileSync(propsFile, 'utf8'));
  const materials = Object.entries(props).map(([name, data]) => ({ name, class: className, ...data }));
  const scored = calculateMaterialDefenses(materials);
  const factorMap = Object.fromEntries(scored.map(m => [m.name, {
    slash: m.D_slash,
    pierce: m.D_pierce,
    blunt: m.D_blunt,
    defense_slash: m.R_slash,
    defense_pierce: m.R_pierce,
    defense_blunt: m.R_blunt,
    fire: m.R_fire,
    water: m.R_water,
    wind: m.R_wind,
    earth: m.R_earth
  }]));
  for (const group of groups) {
    for (const item of db[category][group]) {
      if (factorMap[item.name]) {
        item.factors = factorMap[item.name];
      }
    }
  }
}

populate('Rocks', ['Igneous', 'Sedimentary', 'Metamorphic'], 'Rock', 'public/rock_properties.json');
populate('Linen', ['Plant'], 'Linen', 'public/linen_properties.json');
populate('Carapace', ['Arthropod', 'Reptiles', 'Mollusk', 'Echinoderm', 'Mammals', 'Fish'], 'Carapace', 'public/carapace_properties.json');

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2) + '\n');
console.log('Natural material factors populated');
