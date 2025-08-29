import { calculateMaterialDefenses } from '../materialCalculations.js';

export default function buildMaterialDB(base, wood, elementals, alloys, rocks, options = {}) {
  const { defaultDensities = {}, woodProperties = {} } = options;
  const slug = (name) => name.toLowerCase().replace(/\s+/g, '_');
  const db = { ...base };
  const safe = (n) => Number.isFinite(n) ? n : 0;

  const hardnessTable = [
    { m: 1, hv: 14 },
    { m: 2, hv: 57 },
    { m: 3, hv: 137 },
    { m: 4, hv: 275 },
    { m: 5, hv: 500 },
    { m: 6, hv: 800 },
    { m: 7, hv: 1250 },
    { m: 8, hv: 2000 },
    { m: 9, hv: 3100 },
    { m: 10, hv: 4000 },
  ];

  function hvToMohs(hv) {
    if (!hv || !Number.isFinite(hv)) return undefined;
    for (let i = 1; i < hardnessTable.length; i++) {
      if (hv <= hardnessTable[i].hv) {
        const prev = hardnessTable[i - 1];
        const next = hardnessTable[i];
        const frac = (hv - prev.hv) / (next.hv - prev.hv);
        return Number((prev.m + frac * (next.m - prev.m)).toFixed(2));
      }
    }
    return 10;
  }

  db['Wood'] = Object.fromEntries(
    Object.entries(wood).map(([type, list]) => [
      type,
      list.map((name) => {
        const props = woodProperties[name] || {};
        const entry = { id: slug(name), name, ...props };
        if (entry.density == null && defaultDensities['Wood']) {
          entry.density = defaultDensities['Wood'];
        }
        return entry;
      }),
    ])
  );

  db['Rocks'] = Object.fromEntries(
    Object.entries(rocks).map(([type, stones]) => [
      type,
      Object.keys(stones).map((name) => ({
        id: slug(name),
        name,
        ...(defaultDensities['Rocks'] ? { density: defaultDensities['Rocks'] } : {}),
      })),
    ])
  );

  const procMetal = (m) => {
    const out = { id: slug(m.name), name: m.name, class: 'Metal' };
    const mech = m.mechanical_properties || {};
    const num = (obj, factor = 1) =>
      obj && typeof obj.value === 'number' ? obj.value * factor : undefined;
    const pick = (primary, fallback) => (primary != null ? primary : fallback);
    const dens = pick(m.density, num(mech.density));
    if (dens != null) out.density = dens;
    const ys = pick(m.yieldStrength, num(mech.yield_strength));
    if (ys != null) out.yieldStrength = ys;
    const uts = pick(m.tensileStrength, num(mech.ultimate_tensile_strength));
    if (uts != null) out.tensileStrength = uts;
    const ymFactor =
      mech.youngs_modulus && mech.youngs_modulus.units === 'GPa' ? 1000 : 1;
    const ym = pick(m.elasticModulus, num(mech.youngs_modulus, ymFactor));
    if (ym != null) out.elasticModulus = ym;
    const bh = pick(m.brinellMPa, pick(m.brinellHardness, num(mech.brinell_hardness)));
    if (bh != null) out.brinellMPa = bh;
    const vh = pick(m.vickersMPa, num(mech.vickers_hardness));
    if (vh != null) out.vickersMPa = vh;
    const hardness = pick(
      m.hardness,
      num(mech.mohs_hardness) ??
        (vh != null
          ? hvToMohs(vh / 9.807)
          : bh != null
          ? hvToMohs(bh / 9.807)
          : undefined)
    );
    if (hardness != null) out.hardness = hardness;
    const toughness = pick(
      m.toughness,
      uts != null ? Number((uts * 0.1).toFixed(2)) : undefined
    );
    if (toughness != null) out.toughness = toughness;
    const tec = pick(m.thermalExpansion, num(mech.thermal_expansion_coefficient));
    if (tec != null) out.thermalExpansion = tec;
    const tc = pick(m.thermalConductivity, num(mech.thermal_conductivity));
    if (tc != null) out.thermalConductivity = tc;
    const sh = pick(m.specificHeat, num(mech.specific_heat));
    if (sh != null) out.specificHeat = sh;
    const mp = pick(m.meltingPoint, num(mech.melting_point));
    if (mp != null) out.meltingPoint = mp;
    const er = pick(m.electricalResistivity, num(mech.electrical_resistivity));
    if (er != null) out.electricalResistivity = er;
    return out;
  };

  db.Metals = db.Metals || {};
  db.Metals['Elemental Metals'] = (elementals.elements || []).map(procMetal);
  db.Metals['Metal Alloys'] = (alloys.elements || []).map(procMetal);

  // Compute defensive factors for wood
  const woodMaterials = [];
  for (const arr of Object.values(db['Wood'])) woodMaterials.push(...arr);
  const woodScored = calculateMaterialDefenses(woodMaterials);
  const woodMap = Object.fromEntries(woodScored.map(m => [m.name, m]));
  for (const arr of Object.values(db['Wood'])) {
    arr.forEach(m => {
      const s = woodMap[m.name];
      if (s) {
        m.factors = {
          slash: safe(s.D_slash),
          pierce: safe(s.D_pierce),
          blunt: safe(s.D_blunt),
          defense_slash: safe(s.R_slash),
          defense_pierce: safe(s.R_pierce),
          defense_blunt: safe(s.R_blunt),
          fire: safe(s.R_fire),
          earth: safe(s.R_earth),
          water: safe(s.R_water),
          wind: safe(s.R_wind),
        };
      }
    });
  }

  // Compute defensive factors for metals
  const metalMaterials = [
    ...db.Metals['Elemental Metals'],
    ...db.Metals['Metal Alloys'],
  ];
  const metalScored = calculateMaterialDefenses(metalMaterials);
  metalMaterials.forEach((m, i) => {
    const s = metalScored[i];
    m.factors = {
      slash: safe(s.D_slash),
      pierce: safe(s.D_pierce),
      blunt: safe(s.D_blunt),
      defense_slash: safe(s.R_slash),
      defense_pierce: safe(s.R_pierce),
      defense_blunt: safe(s.R_blunt),
      fire: safe(s.R_fire),
      earth: safe(s.R_earth),
      water: safe(s.R_water),
      wind: safe(s.R_wind),
    };
  });

  const assignIds = (obj) => {
    for (const val of Object.values(obj)) {
      if (Array.isArray(val)) {
        val.forEach((m) => {
          if (m.name && !m.id) m.id = slug(m.name);
        });
      } else if (val && typeof val === 'object') {
        assignIds(val);
      }
    }
  };
  assignIds(db);

  return db;
}
