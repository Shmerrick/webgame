import fs from 'fs';
import { execSync } from 'child_process';

const typeData = JSON.parse(fs.readFileSync('public/wood_types.json','utf8'));
const props = JSON.parse(fs.readFileSync('public/wood_properties.json','utf8'));

const slugMap = {
  Maple: 'hard-maple',
  Cherry: 'black-cherry',
  Mahogany: 'honduran-mahogany',
  Hickory: 'shagbark-hickory'
};

const names = [...typeData.Hardwood, ...typeData.Softwood];

for (const name of names) {
  const slug = slugMap[name] || name.toLowerCase().replace(/\s+/g,'-');
  const url = `https://www.wood-database.com/${slug}/`;
  try {
    const html = execSync(`curl -L ${url}`, { encoding: 'utf8', stdio: ['ignore','pipe','ignore'] });
    const hard = html.match(/Janka Hardness[^\d]*([0-9,]+) lb/i);
    const tough = html.match(/Crushing Strength[^\(]*\(([0-9.,]+) MPa\)/i);
    if (hard) props[name].hardness = parseInt(hard[1].replace(/,/g,''), 10);
    if (tough) props[name].toughness = parseFloat(tough[1]);
    console.log(`Fetched ${name}: hardness=${props[name].hardness}, toughness=${props[name].toughness}`);
  } catch (err) {
    console.error('Failed to fetch', name, url);
  }
}

fs.writeFileSync('public/wood_properties.json', JSON.stringify(props, null, 2));
