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
    const dens = m.density ?? m.mechanical_properties?.density?.value;
    if (dens != null) out.density = parseFloat(dens);
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
