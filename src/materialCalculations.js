// Utility for computing defensive ratings for materials.
// Implements robust normalization and defense formulas with clearer naming.

// Calculate defensive ratings for a list of materials.
// Each material object may contain the following engineering properties:
//   name, class,
//   yieldStrength, tensileStrength, elasticModulus, density,
//   brinellMPa, brinell, vickersMPa, vickers,
//   thermalConductivity, specificHeat, meltingPoint, electricalResistivity
// Values are expected in the units specified by the project specification.

export function calculateMaterialDefenses(materials, options = {}) {
  const {
    feel = false,
    armorBias = {},
    thickness = 1,
    attunement = {},
  } = options;

  const thicknessFactor = clamp(thickness, 0.5, 1.5);

  // Gather statistics for medians per class and globally
  // Property keys we care about for normalization
  const propertyKeys = [
    "yieldStrength",
    "tensileStrength",
    "elasticModulus",
    "density",
    "thermalConductivity",
    "specificHeat",
    "meltingPoint",
    "electricalResistivity",
  ];
  const valuesByClass = {};
  const globalValues = {};

  for (const mat of materials) {
    const cls = mat.class || "global";
    if (!valuesByClass[cls]) valuesByClass[cls] = {};
    for (const key of propertyKeys) {
      const val = mat[key];
      if (val != null) {
        (valuesByClass[cls][key] ||= []).push(val);
        (globalValues[key] ||= []).push(val);
      }
    }
  }

  const globalMedians = {};
  for (const key of propertyKeys) {
    globalMedians[key] = median(globalValues[key] || []);
  }

  const classMedians = {};
  for (const [cls, values] of Object.entries(valuesByClass)) {
    classMedians[cls] = {};
    for (const key of propertyKeys) {
      classMedians[cls][key] = median(values[key] || []);
    }
  }

  // Ratio of tensile to yield strength used for imputations
  const classRatios = {};
  for (const cls of Object.keys(classMedians)) {
    const ys = classMedians[cls].yieldStrength;
    const uts = classMedians[cls].tensileStrength;
    classRatios[cls] = ys && uts ? uts / ys : 1.3;
  }
  const globalRatio =
    globalMedians.yieldStrength && globalMedians.tensileStrength
      ? globalMedians.tensileStrength / globalMedians.yieldStrength
      : 1.3;

  // Median specific stiffness for imputation when elastic modulus or density missing
  const ssValues = [];
  for (const mat of materials) {
    if (mat.elasticModulus != null && mat.density != null) {
      ssValues.push(mat.elasticModulus / mat.density);
    }
  }
  const medianSpecificStiffness = median(ssValues);

  // Impute missing values and compute derived properties on copies
  const enriched = materials.map((mat) => {
    const cls = mat.class || "global";
    const classMedian = classMedians[cls] || {};
    const ratio = classRatios[cls] || globalRatio;

    // Core mechanical properties with fallbacks
    let yieldStrength = mat.yieldStrength;
    let tensileStrength = mat.tensileStrength;
    if (yieldStrength == null && tensileStrength != null)
      yieldStrength = tensileStrength / ratio;
    if (tensileStrength == null && yieldStrength != null)
      tensileStrength = yieldStrength * ratio;
    if (yieldStrength == null)
      yieldStrength = classMedian.yieldStrength ?? globalMedians.yieldStrength;
    if (tensileStrength == null)
      tensileStrength = classMedian.tensileStrength ?? globalMedians.tensileStrength;

    let elasticModulus =
      mat.elasticModulus ?? classMedian.elasticModulus ?? globalMedians.elasticModulus;
    let density = mat.density ?? classMedian.density ?? globalMedians.density;
    let thermalConductivity =
      mat.thermalConductivity ?? classMedian.thermalConductivity ?? globalMedians.thermalConductivity;
    let specificHeat =
      mat.specificHeat ?? classMedian.specificHeat ?? globalMedians.specificHeat;
    let meltingPoint =
      mat.meltingPoint ?? classMedian.meltingPoint ?? globalMedians.meltingPoint;
    let electricalResistivity =
      mat.electricalResistivity ?? classMedian.electricalResistivity ?? globalMedians.electricalResistivity;

    // Hardness proxy in MPa using best available source
    let brinellMPa = mat.brinellMPa;
    if (brinellMPa == null && mat.brinell != null) brinellMPa = mat.brinell * 9.807;
    let vickersMPa = mat.vickersMPa;
    if (vickersMPa == null && mat.vickers != null) vickersMPa = mat.vickers * 9.807;
    const hardnessCandidates = [];
    if (brinellMPa != null) hardnessCandidates.push(brinellMPa);
    if (vickersMPa != null) hardnessCandidates.push(vickersMPa);
    if (yieldStrength != null) hardnessCandidates.push(yieldStrength * 3);
    if (tensileStrength != null) hardnessCandidates.push(tensileStrength * 2);
    const estimatedHardnessMPa =
      hardnessCandidates.length ? Math.max(...hardnessCandidates) : undefined;

    // Specific stiffness = elastic modulus / density
    const specificStiffness =
      elasticModulus != null && density != null
        ? elasticModulus / density
        : medianSpecificStiffness;

    return {
      ...mat,
      yieldStrength,
      tensileStrength,
      elasticModulus,
      density,
      thermalConductivity,
      specificHeat,
      meltingPoint,
      electricalResistivity,
      estimatedHardnessMPa,
      specificStiffness,
    };
  });

  // Normalization bounds scoped by material class
  const normProps = [
    "estimatedHardnessMPa",
    "yieldStrength",
    "tensileStrength",
    "elasticModulus",
    "density",
    "specificStiffness",
    "thermalConductivity",
    "specificHeat",
    "meltingPoint",
    "electricalResistivity",
  ];
  const buildBounds = (values) => {
    const v = values.slice().sort((a, b) => a - b);
    if (!v.length) return { a: 0, b: 1 };
    if (v.length < 20) return { a: v[0], b: v[v.length - 1] };
    const idx5 = Math.floor(0.05 * (v.length - 1));
    const idx95 = Math.ceil(0.95 * (v.length - 1));
    return { a: v[idx5], b: v[idx95] };
  };

  const classBuckets = {};
  const globalBuckets = {};
  for (const m of enriched) {
    const cls = m.class || "global";
    if (!classBuckets[cls]) classBuckets[cls] = {};
    for (const prop of normProps) {
      const val = m[prop];
      if (val != null) {
        (globalBuckets[prop] ||= []).push(val);
        (classBuckets[cls][prop] ||= []).push(val);
      }
    }
  }

  const globalBounds = {};
  for (const prop of normProps) {
    globalBounds[prop] = buildBounds(globalBuckets[prop] || []);
  }

  const boundsByClass = {};
  for (const [cls, props] of Object.entries(classBuckets)) {
    boundsByClass[cls] = {};
    for (const prop of normProps) {
      const arr = props[prop] && props[prop].length ? props[prop] : globalBuckets[prop] || [];
      boundsByClass[cls][prop] = buildBounds(arr);
    }
  }

  // Compute defenses
  const withDefenses = enriched.map((mat) => {
    const cls = mat.class || "global";
    const bounds = boundsByClass[cls] || globalBounds;
    const normalizeProp = (prop) => normalize(mat[prop], bounds[prop].a, bounds[prop].b);

    const normalizedHardness = normalizeProp("estimatedHardnessMPa");
    const normalizedYieldStrength = normalizeProp("yieldStrength");
    const normalizedTensileStrength = normalizeProp("tensileStrength");
    const normalizedElasticModulus = normalizeProp("elasticModulus");
    const normalizedDensity = normalizeProp("density");
    const normalizedSpecificStiffness = normalizeProp("specificStiffness");
    const normalizedThermalConductivity = normalizeProp("thermalConductivity");
    const normalizedSpecificHeat = normalizeProp("specificHeat");
    const normalizedMeltingPoint = normalizeProp("meltingPoint");
    const normalizedResistivity = normalizeProp("electricalResistivity");

    // Normalized values above ensure all downstream formulas use inputs
    // that are already scoped to the material's class.  This keeps steel,
    // wood, bone, etc. from being compared directly.

    // Offensive damage factors draw directly from these normalized
    // mechanical properties.  They are returned so weapon components can
    // scale slash, pierce, and blunt damage consistently per category.
    const damage_slash = normalizedHardness;
    const damage_pierce = normalizedTensileStrength;
    const damage_blunt = normalizedDensity;

    // Physical damage resistances blend hardness and strength values
    let slash =
      0.50 * normalizedHardness +
      0.30 * normalizedYieldStrength +
      0.20 * normalizedElasticModulus;
    let pierce =
      0.45 * normalizedHardness +
      0.35 * normalizedYieldStrength +
      0.20 * normalizedTensileStrength;
    let blunt =
      0.35 * normalizedElasticModulus +
      0.35 * normalizedYieldStrength +
      0.30 * normalizedDensity;

    // Elemental resistances mix thermal and electrical properties
    let fire =
      0.45 * normalizedMeltingPoint +
      0.35 * normalizedSpecificHeat +
      0.20 * (1 - normalizedThermalConductivity);
    let earth =
      0.50 * normalizedHardness +
      0.30 * normalizedElasticModulus +
      0.20 * normalizedDensity;
    let water =
      0.45 * normalizedResistivity +
      0.25 * normalizedHardness +
      0.15 * (1 - normalizedThermalConductivity) +
      0.15 * normalizedSpecificHeat;
    let wind =
      0.40 * normalizedSpecificStiffness +
      0.30 * normalizedHardness +
      0.30 * normalizedResistivity;

    // Apply armor bias and thickness modifiers
    slash = clamp01(slash * thicknessFactor + (armorBias.slashing || 0));
    pierce = clamp01(pierce * thicknessFactor + (armorBias.piercing || 0));
    blunt = clamp01(blunt * thicknessFactor + (armorBias.blunt || 0));

    fire = clamp01(fire + (armorBias.fire || 0) + (attunement.fire || 0));
    earth = clamp01(earth + (armorBias.earth || 0) + (attunement.earth || 0));
    water = clamp01(water + (armorBias.water || 0) + (attunement.water || 0));
    wind = clamp01(wind + (armorBias.wind || 0) + (attunement.wind || 0));

    if (feel) {
      slash = feelTransform(slash);
      pierce = feelTransform(pierce);
      blunt = feelTransform(blunt);
      fire = feelTransform(fire);
      earth = feelTransform(earth);
      water = feelTransform(water);
      wind = feelTransform(wind);
    }

    return {
      ...mat,
      // Normalized offensive factors
      D_slash: damage_slash,
      D_pierce: damage_pierce,
      D_blunt: damage_blunt,
      R_slash: slash,
      R_pierce: pierce,
      R_blunt: blunt,
      R_fire: fire,
      R_earth: earth,
      R_water: water,
      R_wind: wind,
    };
  });

  return withDefenses;
}

function median(arr) {
  const a = arr.filter((v) => v != null).sort((x, y) => x - y);
  if (!a.length) return undefined;
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function normalize(x, a, b) {
  if (x == null || a == null || b == null || a === b) return 0;
  return clamp01((x - a) / (b - a));
}

function clamp01(v) {
  return clamp(v, 0, 1);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function feelTransform(r) {
  return 0.05 + 0.90 * r;
}

// Normalize existing slash/pierce/blunt factors so that each top-level
// material category (e.g., Metals vs. Wood) is scaled independently. This
// prevents cross-category comparisons such as bone vs. steel.
export function normalizeDamageFactorsByCategory(db) {
  const maxes = {};

  const gather = (node, top) => {
    if (Array.isArray(node)) {
      const m = (maxes[top] ||= { slash: 0, pierce: 0, blunt: 0 });
      for (const item of node) {
        const f = item.factors || {};
        if (f.slash != null) m.slash = Math.max(m.slash, f.slash);
        if (f.pierce != null) m.pierce = Math.max(m.pierce, f.pierce);
        if (f.blunt != null) m.blunt = Math.max(m.blunt, f.blunt);
      }
    } else if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) {
        gather(v, top || k);
      }
    }
  };

  const apply = (node, top) => {
    if (Array.isArray(node)) {
      const m = maxes[top] || { slash: 1, pierce: 1, blunt: 1 };
      for (const item of node) {
        const f = item.factors || (item.factors = {});
        f.slash = m.slash ? (f.slash || 0) / m.slash : 0;
        f.pierce = m.pierce ? (f.pierce || 0) / m.pierce : 0;
        f.blunt = m.blunt ? (f.blunt || 0) / m.blunt : 0;
      }
    } else if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) {
        apply(v, top || k);
      }
    }
  };

  gather(db, null);
  apply(db, null);

  return db;
}

export default calculateMaterialDefenses;

