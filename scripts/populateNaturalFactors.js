import fs from 'fs';
import { calculateMaterialDefenses } from '../src/materialCalculations.js';

const dbPath = 'public/materials.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

function populate(category, className, propsFile) {
  const props = JSON.parse(fs.readFileSync(propsFile, 'utf8'));

  // Convert property map into an array with class info for defense scoring
  const materials = Object.entries(props).map(([name, data]) => ({
    name,
    class: className,
    ...data
  }));

  const scored = calculateMaterialDefenses(materials);

  // Build lookup table of full material data including defensive factors
  const enriched = Object.fromEntries(
    materials.map((mat, i) => {
      const s = scored[i];
      return [mat.name, {
        ...mat,
        factors: {
          slash: s.D_slash,
          pierce: s.D_pierce,
          blunt: s.D_blunt,
          defense_slash: s.R_slash,
          defense_pierce: s.R_pierce,
          defense_blunt: s.R_blunt,
          fire: s.R_fire,
          water: s.R_water,
          wind: s.R_wind,
          earth: s.R_earth
        }
      }];
    })
  );

  const section = db[category];

  if (Array.isArray(section)) {
    // Category is a flat array
    section.forEach(item => {
      const data = enriched[item.name];
      if (data) Object.assign(item, data);
    });
  } else {
    // Category has sub-groups
    for (const arr of Object.values(section)) {
      arr.forEach(item => {
        const data = enriched[item.name];
        if (data) Object.assign(item, data);
      });
    }
  }
}

populate('Rocks', 'Rock', 'public/rock_properties.json');
populate('Linen', 'Linen', 'public/linen_properties.json');
populate('Carapace', 'Carapace', 'public/carapace_properties.json');
populate('Bone', 'Bone', 'public/bone_properties.json');
populate('Scales', 'Scale', 'public/scale_properties.json');
populate('Fur', 'Fur', 'public/fur_properties.json');
populate('Leather', 'Leather', 'public/leather_properties.json');

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2) + '\n');
console.log('Natural material factors populated');
