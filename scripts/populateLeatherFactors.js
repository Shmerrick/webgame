import fs from 'fs';
import { calculateMaterialDefenses } from '../src/materialCalculations.js';

const props = JSON.parse(fs.readFileSync('public/leather_properties.json','utf8'));
const materials = Object.entries(props).map(([name, data])=> ({ name, class: 'Leather', ...data }));
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

const db = JSON.parse(fs.readFileSync('public/materials.json','utf8'));
for (const group of ['Reptiles','Mammals','Birds']) {
  for (const item of db.Leather[group]) {
    if (factorMap[item.name]) {
      item.factors = factorMap[item.name];
    }
  }
}

fs.writeFileSync('public/materials.json', JSON.stringify(db, null, 2) + '\n');
console.log('Leather factors populated');
