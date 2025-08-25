import fs from 'fs';

const files = [
  'public/Master_Elemental_Metals.json',
  'public/Master_Metal_Alloys.json'
];

function readJSON(path){
  return JSON.parse(fs.readFileSync(path,'utf8'));
}

function num(val){
  if(val===null || val===undefined || val==='N/A') return 0;
  return Number(val);
}

function ensureMechanicalProps(mp){
  // Standardize hardness to MPa using vickers, brinell or mohs values
  let hv = num(mp.vickers_hardness?.value);
  if(!hv){
    const bh = num(mp.brinell_hardness?.value);
    if(bh) hv = bh; else {
      const mh = num(mp.mohs_hardness?.value);
      hv = mh ? mh * 1000 : 0;
    }
  }
  mp.vickers_hardness = { value: hv, units: 'MPa' };

  const ys = num(mp.yield_strength?.value);
  mp.yield_strength = { value: ys, units: 'MPa' };

  const ym = num(mp.youngs_modulus?.value);
  mp.youngs_modulus = { value: ym, units: 'GPa' };

  const uts = num(mp.ultimate_tensile_strength?.value);
  mp.ultimate_tensile_strength = { value: uts, units: 'MPa' };

  const dens = num(mp.density?.value);
  mp.density = { value: dens, units: mp.density?.units || 'g/cm³' };

  const sh = num(mp.specific_heat?.value);
  mp.specific_heat = { value: sh, units: mp.specific_heat?.units || 'J/g·K' };

  const tc = num(mp.thermal_conductivity?.value);
  mp.thermal_conductivity = { value: tc, units: mp.thermal_conductivity?.units || 'W/m·K' };

  const er = num(mp.electrical_resistivity?.value);
  mp.electrical_resistivity = { value: er, units: mp.electrical_resistivity?.units || 'nΩ·m' };

  return mp;
}

const datasets = files.map(readJSON);
const elements = datasets.flatMap(d => d.elements);

for(const el of elements){
  el.mechanical_properties = ensureMechanicalProps(el.mechanical_properties || {});
}

function gatherMax(fn){
  return elements.reduce((m,el)=>Math.max(m,fn(el)),0);
}

const maxHard = gatherMax(el=>num(el.mechanical_properties?.vickers_hardness?.value));
const maxElastic = gatherMax(el=>num(el.mechanical_properties?.youngs_modulus?.value));
const maxYield = gatherMax(el=>num(el.mechanical_properties?.yield_strength?.value));
const maxTensile = gatherMax(el=>num(el.mechanical_properties?.ultimate_tensile_strength?.value));
const maxDensity = gatherMax(el=>num(el.mechanical_properties?.density?.value ?? el.density));
const maxMelt = gatherMax(el=>num(el.melt));
const maxSpecificHeat = gatherMax(el=>num(el.mechanical_properties?.specific_heat?.value));
const maxThermalConductivity = gatherMax(el=>num(el.mechanical_properties?.thermal_conductivity?.value));
const maxResistivity = gatherMax(el=>num(el.mechanical_properties?.electrical_resistivity?.value));
const maxSpecificStiffness = gatherMax(el=>{
  const mp = el.mechanical_properties;
  const elastic = num(mp.youngs_modulus?.value);
  const density = num(mp.density?.value ?? el.density);
  return density ? elastic / density : 0;
});

for(const el of elements){
  const mp = el.mechanical_properties;
  const hard = num(mp.vickers_hardness.value);
  const tensile = num(mp.ultimate_tensile_strength.value);
  const yieldStrength = num(mp.yield_strength.value);
  const elastic = num(mp.youngs_modulus.value);
  const dens = num(mp.density?.value ?? el.density);
  const melt = num(el.melt);
  const specificHeat = num(mp.specific_heat.value);
  const thermalCond = num(mp.thermal_conductivity.value);
  const resistivity = num(mp.electrical_resistivity.value);
  const specificStiffness = dens ? elastic / dens : 0;

  const hardRatio = maxHard ? hard / maxHard : 0;
  const yieldRatio = maxYield ? yieldStrength / maxYield : 0;
  const elasticRatio = maxElastic ? elastic / maxElastic : 0;
  const tensileRatio = maxTensile ? tensile / maxTensile : 0;
  const densityRatio = maxDensity ? dens / maxDensity : 0;
  const meltRatio = maxMelt ? melt / maxMelt : 0;
  const shRatio = maxSpecificHeat ? specificHeat / maxSpecificHeat : 0;
  const tcRatio = maxThermalConductivity ? thermalCond / maxThermalConductivity : 0;
  const resistivityRatio = maxResistivity ? resistivity / maxResistivity : 0;
  const stiffnessRatio = maxSpecificStiffness ? specificStiffness / maxSpecificStiffness : 0;

  const defenseSlash = Number(
    (hardRatio * 0.5 + yieldRatio * 0.3 + elasticRatio * 2).toFixed(5)
  );
  const defensePierce = Number(
    (hardRatio * 0.45 + yieldRatio * 0.35 + tensileRatio * 0.2).toFixed(5)
  );
  const defenseBlunt = Number(
    (elasticRatio * 0.35 + yieldRatio * 0.35 + densityRatio * 0.3).toFixed(5)
  );
  const fireRes = Number(
    (meltRatio * 0.45 + shRatio * 0.35 + (1 - tcRatio) * 0.2).toFixed(5)
  );
  const earthRes = Number(
    (hardRatio * 0.5 + elasticRatio * 0.3 + densityRatio * 0.2).toFixed(5)
  );
  const waterRes = Number(
    (resistivityRatio * 0.45 + hardRatio * 0.25 + (1 - tcRatio) * 0.15 + shRatio * 0.15).toFixed(5)
  );
  const windRes = Number(
    (stiffnessRatio * 0.4 + hardRatio * 0.3 + resistivityRatio * 0.3).toFixed(5)
  );

  el.factors = {
    slash: hardRatio,
    pierce: tensileRatio,
    blunt: densityRatio,
    defense_slash: defenseSlash,
    defense_pierce: defensePierce,
    defense_blunt: defenseBlunt,
    fire: fireRes,
    water: waterRes,
    wind: windRes,
    earth: earthRes
  };
}

const limits = {
  hardness: { max: maxHard, units: 'MPa' },
  elasticModulus: { max: maxElastic, units: 'GPa' },
  yieldStrength: { max: maxYield, units: 'MPa' },
  tensileStrength: { max: maxTensile, units: 'MPa' },
  density: { max: maxDensity, units: 'g/cm³' },
  meltingPoint: { max: maxMelt, units: 'K' },
  specificHeat: { max: maxSpecificHeat, units: 'J/g·K' },
  thermalConductivity: { max: maxThermalConductivity, units: 'W/m·K' },
  electricalResistivity: { max: maxResistivity, units: 'nΩ·m' },
  specificStiffness: { max: maxSpecificStiffness, units: 'GPa·cm³/g' }
};

fs.writeFileSync('public/mechanical_limits.json', JSON.stringify(limits, null, 2) + '\n');

datasets.forEach((data,i)=>{
  fs.writeFileSync(files[i], JSON.stringify(data, null, 2)+"\n");
});
