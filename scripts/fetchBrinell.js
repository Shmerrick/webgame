import fs from 'fs';
import { execSync } from 'child_process';

const elements = JSON.parse(fs.readFileSync('public/Master_Elemental_Metals.json', 'utf8')).elements;
let existing = {};
try {
  existing = JSON.parse(fs.readFileSync('public/metal_hardness.json', 'utf8'));
} catch {
  existing = {};
}

function fetchHardness(name) {
  const slug = name.toLowerCase().replace(/ /g, '-');
  const url = `https://www.material-properties.org/${slug}-properties/`;
  try {
    const html = execSync(`curl -L -s ${url}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const regex = new RegExp(`Brinell hardness of ${name} is approximately\s*([0-9.]+)`, 'i');
    const match = html.match(regex);
    return match ? parseFloat(match[1]) : 0;
  } catch {
    return 0;
  }
}

const hardness = {};
for (const el of elements) {
  let value = existing[el.name] || el.brinellHardness || 0;
  if (!value) value = fetchHardness(el.name);
  hardness[el.name] = value;
}

fs.writeFileSync('public/metal_hardness.json', JSON.stringify(hardness, null, 2) + '\n');
