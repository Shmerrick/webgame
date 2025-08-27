import fs from 'fs/promises';

async function main(){
  const path = 'public/Master_Elemental_Metals.json';
  const data = JSON.parse(await fs.readFile(path, 'utf8'));
  for(const el of data.elements){
    const mp = el.mechanical_properties;
    if(!mp) continue;
    const hv = mp.vickers_hardness?.value || mp.brinell_hardness?.value || (mp.mohs_hardness?.value ? mp.mohs_hardness.value * 1000 : 0);
    if(hv){
      if(!mp.ultimate_tensile_strength || mp.ultimate_tensile_strength.value == null || mp.ultimate_tensile_strength.value === 0){
        mp.ultimate_tensile_strength = { value: Number((hv / 3).toFixed(2)), units: 'MPa' };
      }
      if(!mp.yield_strength || mp.yield_strength.value == null || mp.yield_strength.value === 0){
        mp.yield_strength = { value: Number((hv / 5).toFixed(2)), units: 'MPa' };
      }
    }
    if(!mp.density || mp.density.value == null || mp.density.value === 0){
      if(el.density) mp.density = { value: el.density, units: 'g/cm³' };
    }
    if(!mp.melting_point || mp.melting_point.value == null || mp.melting_point.value === 0){
      if(el.melt) mp.melting_point = { value: Number((el.melt - 273.15).toFixed(2)), units: '°C' };
    }
    if(!mp.boiling_point || mp.boiling_point.value == null || mp.boiling_point.value === 0){
      if(el.boil) mp.boiling_point = { value: Number((el.boil - 273.15).toFixed(2)), units: '°C' };
    }
    if(!mp.specific_heat || mp.specific_heat.value == null || mp.specific_heat.value === 0){
      if(el.molar_heat && el.atomic_mass){
        mp.specific_heat = { value: Number((el.molar_heat / el.atomic_mass).toFixed(2)), units: 'J/g·K' };
      }
    }
  }
  await fs.writeFile(path, JSON.stringify(data, null, 2) + '\n');
  console.log('Estimated missing material properties');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
