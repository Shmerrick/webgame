import fs from 'fs';

const filePath = 'public/materials.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const setFactors = obj => {
  if (Array.isArray(obj)) {
    obj.forEach(item => setFactors(item));
  } else if (obj && typeof obj === 'object') {
    if (obj.factors) {
      Object.keys(obj.factors).forEach(k => {
        obj.factors[k] = 1.0;
      });
    }
    Object.values(obj).forEach(val => setFactors(val));
  }
};

for (const [category, content] of Object.entries(data)) {
  if (category !== 'Metals') {
    setFactors(content);
  }
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
