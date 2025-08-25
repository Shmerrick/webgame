import fs from 'fs';

const filePath = 'public/materials.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const template = {
  slash: 0,
  pierce: 0,
  blunt: 0,
  defense_slash: 0,
  defense_pierce: 0,
  defense_blunt: 0,
  fire: 0,
  water: 0,
  wind: 0,
  earth: 0
};

function addFactors(node) {
  if (Array.isArray(node)) {
    for (const item of node) {
      if (item && typeof item === 'object') {
        if ('name' in item && !('factors' in item)) {
          item.factors = { ...template };
        }
        addFactors(item);
      }
    }
  } else if (node && typeof node === 'object') {
    for (const value of Object.values(node)) {
      addFactors(value);
    }
  }
}

addFactors(data);
fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
