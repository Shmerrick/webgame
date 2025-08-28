const baseUrl = typeof document !== 'undefined'
    ? new URL('.', document.baseURI)
    : new URL('.', import.meta.url);

const dbIndexPromise = (async () => {
    try {
        const res = await fetch(new URL('database.json', baseUrl), { cache: 'no-cache' });
        if (!res.ok) {
            throw new Error(`Failed to load database index: ${res.status} ${res.statusText}`);
        }
        return await res.json();
    } catch (err) {
        console.error(err);
        throw err;
    }
})();

import { calculateMaterialDefenses } from './materialCalculations.js';

const dbCache = {};

export async function getDatabaseSection(key) {
    const index = await dbIndexPromise;
    if (!dbCache[key]) {
        const entry = index[key];
        if (!entry) throw new Error(`Database key not found: ${key}`);
        if (typeof entry === 'string') {
            dbCache[key] = (async () => {
                try {
                    const url = new URL(entry, baseUrl);
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
        const num = (obj, factor = 1) => obj && typeof obj.value === 'number' ? obj.value * factor : undefined;
        const pick = (primary, fallback) => primary != null ? primary : fallback;
        const dens = pick(m.density, num(mech.density));
        if (dens != null)
            out.density = dens;
        const ys = pick(m.yieldStrength, num(mech.yield_strength));
        if (ys != null)
            out.yieldStrength = ys;
        const uts = pick(m.tensileStrength, num(mech.ultimate_tensile_strength));
        if (uts != null)
            out.tensileStrength = uts;
        const ymFactor = mech.youngs_modulus && mech.youngs_modulus.units === 'GPa' ? 1000 : 1;
        const ym = pick(m.elasticModulus, num(mech.youngs_modulus, ymFactor));
        if (ym != null)
            out.elasticModulus = ym;
        const bh = pick(m.brinellHardness, num(mech.brinell_hardness));
        if (bh != null)
            out.brinellMPa = bh;
        const tc = pick(m.thermalConductivity, num(mech.thermal_conductivity));
        if (tc != null)
            out.thermalConductivity = tc;
        const sh = pick(m.specificHeat, num(mech.specific_heat));
        if (sh != null)
            out.specificHeat = sh;
        const mp = pick(m.meltingPoint, num(mech.melting_point));
        if (mp != null)
            out.meltingPoint = mp;
        const er = pick(m.electricalResistivity, num(mech.electrical_resistivity));
        if (er != null)
            out.electricalResistivity = er;
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

const DAMAGE_PROPS = ['slash', 'pierce', 'blunt', 'fire', 'water', 'wind', 'earth'];

function traverseForMax(node, maxes) {
    if (Array.isArray(node)) {
        for (const item of node) {
            const f = item.factors || {};
            for (const prop of DAMAGE_PROPS) {
                const val = f[prop];
                if (typeof val === 'number' && val > maxes[prop]) {
                    maxes[prop] = val;
                }
            }
        }
    } else if (node && typeof node === 'object') {
        for (const value of Object.values(node)) {
            traverseForMax(value, maxes);
        }
    }
}

export function scanDamageMax(db, categories = Object.keys(db || {})) {
    const maxes = Object.fromEntries(DAMAGE_PROPS.map(p => [p, 0]));
    for (const cat of categories) {
        if (cat === 'Dev') continue;
        const node = db[cat];
        if (!node) continue;
        traverseForMax(node, maxes);
    }
    return maxes;
}

if (typeof window !== 'undefined') {
    window.getDatabaseSection = getDatabaseSection;
    window.buildMaterialDB = buildMaterialDB;
    window.scanDamageMax = scanDamageMax;
}
