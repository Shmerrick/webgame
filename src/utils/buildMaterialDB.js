import { calculateMaterialDefenses } from '../materialCalculations.js';

export default function buildMaterialDB(base, wood, elementals, alloys, rocks, options = {}) {
  const { defaultDensities = {}, woodProperties = {} } = options;
  const slug = (name) => name.toLowerCase().replace(/\s+/g, '_');
  const db = { ...base };
  const safe = (n) => Number.isFinite(n) ? n : 0;

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

  db['Rock Types'] = Object.fromEntries(
    Object.entries(rocks).map(([type, stones]) => [
      type,
      Object.keys(stones).map((name) => ({
        id: slug(name),
        name,
        ...(defaultDensities['Rock Types'] ? { density: defaultDensities['Rock Types'] } : {}),
      })),
    ])
  );

  const procMetal = (m) => {
    const out = { id: slug(m.name), name: m.name };
    if (m.factors) out.factors = m.factors;

    const mech = m.mechanical_properties || {};
    const val = (k) => {
      const v = mech[k]?.value;
      return v != null ? parseFloat(v) : undefined;
    };

    const dens = m.density ?? val('density');
    if (dens != null) out.density = parseFloat(dens);

    const ys = val('yield_strength');
    if (ys != null) out.yieldStrength = ys;

    const uts = val('ultimate_tensile_strength');
    if (uts != null) out.tensileStrength = uts;

    const ym = val('youngs_modulus');
    if (ym != null) {
      const units = mech.youngs_modulus?.units;
      out.elasticModulus = units === 'GPa' ? ym * 1000 : ym;
    }

    const br = val('brinell_hardness');
    if (br != null) out.brinellMPa = br;

    const vk = val('vickers_hardness');
    if (vk != null) out.vickersMPa = vk;

    const tc = val('thermal_conductivity');
    if (tc != null) out.thermalConductivity = tc;

    const sh = val('specific_heat');
    if (sh != null) out.specificHeat = sh;

    const mp = val('melting_point');
    if (mp != null) out.meltingPoint = mp;

    const er = val('electrical_resistivity');
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
