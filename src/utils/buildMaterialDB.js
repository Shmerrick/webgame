export default function buildMaterialDB(base, wood, elementals, alloys, rocks, options = {}) {
  const { defaultDensities = {} } = options;
  const slug = (name) => name.toLowerCase().replace(/\s+/g, '_');
  const db = { ...base };

  db['Wood'] = Object.fromEntries(
    Object.entries(wood).map(([type, list]) => [
      type,
      list.map((name) => ({
        id: slug(name),
        name,
        ...(defaultDensities['Wood'] ? { density: defaultDensities['Wood'] } : {}),
      })),
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
