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
        const out = { id: slug(m.name), name: m.name, class: 'Metal' };
        if (m.density != null)
            out.density = m.density;
        if (m.yieldStrength != null)
            out.yieldStrength = m.yieldStrength;
        if (m.tensileStrength != null)
            out.tensileStrength = m.tensileStrength;
        if (m.elasticModulus != null)
            out.elasticModulus = m.elasticModulus;
        if (m.brinellHardness != null)
            out.brinellMPa = m.brinellHardness;
        if (m.thermalConductivity != null)
            out.thermalConductivity = m.thermalConductivity;
        if (m.specificHeat != null)
            out.specificHeat = m.specificHeat;
        if (m.meltingPoint != null)
            out.meltingPoint = m.meltingPoint;
        if (m.electricalResistivity != null)
            out.electricalResistivity = m.electricalResistivity;
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

if (typeof window !== 'undefined') {
    window.getDatabaseSection = getDatabaseSection;
    window.buildMaterialDB = buildMaterialDB;
}
