import fs from 'fs/promises';
import { execSync } from 'child_process';

async function main(){
  const metalsPath = 'public/Master_Elemental_Metals.json';
  const data = JSON.parse(await fs.readFile(metalsPath, 'utf8'));
  const remote = JSON.parse(execSync('curl -s https://raw.githubusercontent.com/Bowserinator/Periodic-Table-JSON/master/PeriodicTableJSON.json', {encoding:'utf8'}));
  const lookup = Object.fromEntries(remote.elements.map(el => [el.name, el]));

  for(const el of data.elements){
    const ref = lookup[el.name];
    if(!ref) continue;
    const update = (prop, sourceProp = prop) => {
      if(el[prop] == null || el[prop] === 0){
        const val = ref[sourceProp];
        if(val != null) el[prop] = val;
      }
    };
    update('atomic_mass');
    update('boil');
    update('density');
    update('melt');
    update('molar_heat');
    update('electron_affinity');
    update('electronegativity_pauling');
  }

  await fs.writeFile(metalsPath, JSON.stringify(data, null, 2) + '\n');
  console.log('Metal properties populated');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
