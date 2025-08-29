import fs from 'fs';

const file = 'public/Master_Metal_Alloys.json';
const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
const allowed = new Set(['name', 'category', 'mechanical_properties', 'factors']);

const cleaned = {
  elements: raw.elements.map((el) => {
    const out = {};
    for (const key of Object.keys(el)) {
      if (allowed.has(key)) {
        out[key] = el[key];
      }
    }
    const mp = out.mechanical_properties || {};
    for (const prop of Object.keys(mp)) {
      const val = mp[prop];
      if (val && (val.value === 'N/A' || val.value === 0 || val.value == null)) {
        delete mp[prop];
      }
    }
    return out;
  })
};

fs.writeFileSync(file, JSON.stringify(cleaned, null, 2) + '\n');
console.log('Alloy dataset cleaned');
