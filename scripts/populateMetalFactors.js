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
const maxEA = gatherMax(el=>num(el.electron_affinity));

for(const el of elements){
  const mp = el.mechanical_properties;
  const hard = num(mp.vickers_hardness.value);
  const tensile = num(mp.ultimate_tensile_strength?.value);
  const yieldStrength = num(mp.yield_strength.value);
  const dens = num(mp.density?.value ?? el.density);
  const melt = num(el.melt);
  const ea = num(el.electron_affinity);

  el.factors = {
    slash: maxHard ? hard / maxHard : 0,
    pierce: maxTensile ? tensile / maxTensile : 0,
    blunt: maxDensity ? dens / maxDensity : 0,
    defense_slash: maxYield ? yieldStrength / maxYield : 0,
    defense_pierce: maxHard ? hard / maxHard : 0,
    defense_blunt: maxDensity ? dens / maxDensity : 0,
    fire: maxMelt ? melt / maxMelt : 0,
    water: maxDensity ? 1 - dens / maxDensity : 0,
    wind: maxEA ? ea / maxEA : 0,
    earth: maxDensity ? dens / maxDensity : 0
  };
}

const limits = {
  hardness: { max: maxHard, units: 'MPa' },
  elasticModulus: { max: maxElastic, units: 'GPa' },
  yieldStrength: { max: maxYield, units: 'MPa' }
};

fs.writeFileSync('public/mechanical_limits.json', JSON.stringify(limits, null, 2) + '\n');

datasets.forEach((data,i)=>{
  fs.writeFileSync(files[i], JSON.stringify(data, null, 2)+"\n");
});
