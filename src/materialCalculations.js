// Utility for computing defensive ratings for materials.
// Implements robust normalization and defense formulas with clearer naming.

// Calculate defensive ratings for a list of materials.
// Each material object may contain the following engineering properties:
//   name, class,
//   yieldStrength, tensileStrength, elasticModulus, density,
//   brinellMPa, brinell,
//   thermalConductivity, specificHeat, meltingPoint, electricalResistivity
// Values are expected in the units specified by the project specification.

const PROPERTY_KEYS = [
  "yieldStrength",
  "tensileStrength",
  "elasticModulus",
  "density",
  "thermalConductivity",
  "specificHeat",
  "meltingPoint",
  "electricalResistivity",
];

const NORM_PROPS = [
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

// Raw resistance metrics that are later normalized per material class.
const RESISTANCE_PROPS = [
  "rawSlashingResistance",
  "rawPiercingResistance",
  "rawBluntResistance",
  "rawFireResistance",
  "rawEarthResistance",
  "rawWaterResistance",
  "rawWindResistance",
];

/**
 * Derive medians and ratios used for normalization and imputation.
 */
export function computeMaterialStats(materials, propertyKeys = PROPERTY_KEYS) {
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

  const ssValues = [];
  for (const mat of materials) {
    if (mat.elasticModulus != null && mat.density != null) {
      ssValues.push(mat.elasticModulus / mat.density);
    }
  }
  const medianSpecificStiffness = median(ssValues);

  return {
    globalMedians,
    classMedians,
    classRatios,
    globalRatio,
    medianSpecificStiffness,
  };
}

/**
 * Fill in missing properties and compute derived values for materials.
 */
export function imputeMaterialProperties(materials, stats) {
  const { globalMedians, classMedians, classRatios, globalRatio, medianSpecificStiffness } =
    stats;

  return materials.map((mat) => {
    const cls = mat.class || "global";
    const classMedian = classMedians[cls] || {};
    const ratio = classRatios[cls] || globalRatio;

    let yieldStrength = mat.yieldStrength;
    let tensileStrength = mat.tensileStrength;
    if (yieldStrength == null && tensileStrength != null)
      yieldStrength = tensileStrength / ratio; // derive yield from tensile using class ratio
    if (tensileStrength == null && yieldStrength != null)
      tensileStrength = yieldStrength * ratio; // derive tensile from yield using class ratio
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

    let brinellMPa = mat.brinellMPa;
    if (brinellMPa == null && mat.brinell != null)
      brinellMPa = mat.brinell * 9.807; // convert Brinell hardness to MPa
    const hardnessCandidates = [];
    if (brinellMPa != null) hardnessCandidates.push(brinellMPa);
    if (yieldStrength != null) hardnessCandidates.push(yieldStrength * 3); // empirical yield→hardness
    if (tensileStrength != null) hardnessCandidates.push(tensileStrength * 2); // empirical tensile→hardness
    const estimatedHardnessMPa =
      hardnessCandidates.length ? Math.max(...hardnessCandidates) : undefined; // pick hardest source

    const specificStiffness =
      elasticModulus != null && density != null
        ? elasticModulus / density // stiffness per unit mass
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
}

/**
 * Build normalization bounds for each class and globally.
 */
export function buildNormalizationBounds(enriched, normProps = NORM_PROPS) {
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
      // Only bucket finite numbers so NaN or infinities do not pollute
      // normalization bounds.
      if (Number.isFinite(val)) {
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

  return { boundsByClass, globalBounds };
}

/**
 * Use normalized properties to generate final defense scores.
 */
export function scoreMaterialDefenses(enriched, propBounds, options = {}) {
  const { feel = false, armorBias = {}, thickness = 1, attunement = {}, minDefense } = options;
  const thicknessFactor = clamp(thickness, 0.5, 1.5);
  const biasDefense = (v) =>
    minDefense != null && v < minDefense
      ? minDefense - (minDefense - v) * 0.5
      : v;

  // First compute raw resistance metrics based on physical properties.
  const withRaw = enriched.map((mat) => {
    // Slash resistance uses the average of hardness and yield strength.
    const rawSlashingResistance =
      ((mat.estimatedHardnessMPa || 0) + (mat.yieldStrength || 0)) / 2;
    // Pierce resistance uses the average of yield and tensile strengths.
    const rawPiercingResistance =
      ((mat.tensileStrength || 0) + (mat.yieldStrength || 0)) / 2;
    // Blunt resistance comes from the square root of stiffness × density.
    const rawBluntResistance = Math.sqrt(
      (mat.elasticModulus || 0) * (mat.density || 0)
    );

    // Fire resistance grows with heat capacity and melting point but falls with conductivity.
    const rawFireResistance =
      ((mat.meltingPoint || 0) * (mat.specificHeat || 0)) /
      (mat.thermalConductivity || 1);
    // Earth resistance is stiffness multiplied by density.
    const rawEarthResistance = (mat.elasticModulus || 0) * (mat.density || 0);
    // Water resistance is electrical resistivity times specific heat.
    const rawWaterResistance =
      (mat.electricalResistivity || 0) * (mat.specificHeat || 0);
    // Wind resistance uses specific stiffness and electrical resistivity.
    const rawWindResistance =
      (mat.specificStiffness || 0) * (mat.electricalResistivity || 0);

    return {
      ...mat,
      rawSlashingResistance,
      rawPiercingResistance,
      rawBluntResistance,
      rawFireResistance,
      rawEarthResistance,
      rawWaterResistance,
      rawWindResistance,
    };
  });

  // Build normalization bounds for the raw resistance metrics.
  const resistanceBounds = buildNormalizationBounds(withRaw, RESISTANCE_PROPS);

  return withRaw.map((mat) => {
    const cls = mat.class || "global";
    // Normalize using bounds for this material class so categories aren't mixed.
    const classBoundsForResistance =
      resistanceBounds.boundsByClass[cls] || resistanceBounds.globalBounds;
    const normRaw = (prop) =>
      normalize(mat[prop], classBoundsForResistance[prop].a, classBoundsForResistance[prop].b);

    let slashingResistance = normRaw("rawSlashingResistance");
    let piercingResistance = normRaw("rawPiercingResistance");
    let bluntResistance = normRaw("rawBluntResistance");
    let fireResistance = normRaw("rawFireResistance");
    let earthResistance = normRaw("rawEarthResistance");
    let waterResistance = normRaw("rawWaterResistance");
    let windResistance = normRaw("rawWindResistance");

    // Apply thickness scaling and armor bias after normalization.
    slashingResistance = clamp01(
      slashingResistance * thicknessFactor + (armorBias.slashing || 0)
    );
    piercingResistance = clamp01(
      piercingResistance * thicknessFactor + (armorBias.piercing || 0)
    );
    bluntResistance = clamp01(
      bluntResistance * thicknessFactor + (armorBias.blunt || 0)
    );

    fireResistance = clamp01(
      fireResistance + (armorBias.fire || 0) + (attunement.fire || 0)
    );
    earthResistance = clamp01(
      earthResistance + (armorBias.earth || 0) + (attunement.earth || 0)
    );
    waterResistance = clamp01(
      waterResistance + (armorBias.water || 0) + (attunement.water || 0)
    );
    windResistance = clamp01(
      windResistance + (armorBias.wind || 0) + (attunement.wind || 0)
    );

    // Nudge extremely low defenses toward a minimum useful value.
    slashingResistance = biasDefense(slashingResistance);
    piercingResistance = biasDefense(piercingResistance);
    bluntResistance = biasDefense(bluntResistance);
    fireResistance = biasDefense(fireResistance);
    earthResistance = biasDefense(earthResistance);
    waterResistance = biasDefense(waterResistance);
    windResistance = biasDefense(windResistance);

    // Damage metrics are also normalized per material class.
    const clsBounds = propBounds.boundsByClass[cls] || propBounds.globalBounds;
    const normProp = (prop) =>
      normalize(mat[prop], clsBounds[prop].a, clsBounds[prop].b);
    const slashDamage = normProp("estimatedHardnessMPa"); // Hardness -> slash damage
    const pierceDamage = normProp("tensileStrength"); // Tensile strength -> pierce damage
    const bluntDamage = normProp("density"); // Density -> blunt damage

    if (feel) {
      slashingResistance = feelTransform(slashingResistance);
      piercingResistance = feelTransform(piercingResistance);
      bluntResistance = feelTransform(bluntResistance);
      fireResistance = feelTransform(fireResistance);
      earthResistance = feelTransform(earthResistance);
      waterResistance = feelTransform(waterResistance);
      windResistance = feelTransform(windResistance);
    }

    return {
      ...mat,
      D_slash: round5(slashDamage),
      D_pierce: round5(pierceDamage),
      D_blunt: round5(bluntDamage),
      R_slash: round5(slashingResistance),
      R_pierce: round5(piercingResistance),
      R_blunt: round5(bluntResistance),
      R_fire: round5(fireResistance),
      R_earth: round5(earthResistance),
      R_water: round5(waterResistance),
      R_wind: round5(windResistance),
    };
  });
}

export function calculateMaterialDefenses(materials, options = {}) {
  const stats = computeMaterialStats(materials, PROPERTY_KEYS);
  const enriched = imputeMaterialProperties(materials, stats);
  const bounds = buildNormalizationBounds(enriched, NORM_PROPS);
  return scoreMaterialDefenses(enriched, bounds, options);
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

function round5(v) {
  return Math.round(v * 1e5) / 1e5;
}

function feelTransform(r) {
  return 0.05 + 0.90 * r;
}

// Normalize existing slash/pierce/blunt factors so that each top-level
// material category (e.g., Metals vs. Wood) is scaled independently. This
// prevents cross-category comparisons such as bone vs. steel.
export function normalizeDamageFactorsByCategory(db) {
  // Work on a deep clone so the original database remains untouched.
  const out = structuredClone(db);
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
        const nextTop = top === "Metals" ? k : (top || k);
        gather(v, nextTop);
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
        const nextTop = top === "Metals" ? k : (top || k);
        apply(v, nextTop);
      }
    }
  };

  gather(out, null);
  apply(out, null);

  return out;
}

export default calculateMaterialDefenses;

