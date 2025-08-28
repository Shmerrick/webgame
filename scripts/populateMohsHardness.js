import fs from 'fs';

const filePath = 'public/Master_Metal_Alloys.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const table = [
  { m: 1, hv: 14 },
  { m: 2, hv: 57 },
  { m: 3, hv: 137 },
  { m: 4, hv: 275 },
  { m: 5, hv: 500 },
  { m: 6, hv: 800 },
  { m: 7, hv: 1250 },
  { m: 8, hv: 2000 },
  { m: 9, hv: 3100 },
  { m: 10, hv: 4000 }
];

function hvToMohs(hv) {
  if (!hv || !Number.isFinite(hv)) return null;
  for (let i = 1; i < table.length; i++) {
    if (hv <= table[i].hv) {
      const prev = table[i - 1];
      const next = table[i];
      const frac = (hv - prev.hv) / (next.hv - prev.hv);
      return Number((prev.m + frac * (next.m - prev.m)).toFixed(2));
    }
  }
  return 10;
}

for (const el of data.elements) {
  const mp = el.mechanical_properties || {};
  const hvMpa = mp.vickers_hardness?.value ?? mp.brinell_hardness?.value;
  if (hvMpa) {
    const hv = Number(hvMpa) / 9.807; // convert MPa to HV units
    const mohs = hvToMohs(hv);
    if (mohs != null) {
      mp.mohs_hardness = { value: mohs, units: 'Mohs' };
    }
  }
  el.mechanical_properties = mp;
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
console.log('Mohs hardness populated');
