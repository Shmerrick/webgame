const dbIndexPromise = (async () => {
    try {
        const res = await fetch(new URL('database.json', import.meta.url), { cache: 'no-cache' });
        if (!res.ok) {
            throw new Error(`Failed to load database index: ${res.status} ${res.statusText}`);
        }
        return await res.json();
    } catch (err) {
        console.error(err);
        throw err;
    }
})();

const dbCache = {};

export async function getDatabaseSection(key) {
    const index = await dbIndexPromise;
    if (!dbCache[key]) {
        const entry = index[key];
        if (!entry) throw new Error(`Database key not found: ${key}`);
        if (typeof entry === 'string') {
            dbCache[key] = (async () => {
                try {
                    const url = new URL(entry, import.meta.url);
                    const res = await fetch(url, { cache: 'no-cache' });
                    if (!res.ok) {
                        throw new Error(`Failed to fetch ${entry}: ${res.status} ${res.statusText}`);
                    }
                    if (entry.endsWith('.txt')) {
                        return await res.text();
                    }
                    return await res.json();
                } catch (err) {
                    throw new Error(`Error loading ${entry}: ${err.message}`);
                }
            })();
        } else if (entry.source && entry.section) {
            dbCache[key] = getDatabaseSection(entry.source).then(data => data[entry.section]);
        } else {
            throw new Error(`Invalid database entry for ${key}`);
        }
    }
    return dbCache[key];
}

export function buildMaterialDB(base, wood, elementals, alloys, rocks, options = {}) {
    const { defaultDensities = {}, woodProperties = {} } = options;
    const slug = (name) => name.toLowerCase().replace(/\s+/g, '_');
    const db = { ...base };

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

if (typeof window !== 'undefined') {
    window.getDatabaseSection = getDatabaseSection;
    window.buildMaterialDB = buildMaterialDB;
}
