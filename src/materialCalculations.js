// Utility for computing defensive ratings for materials.
// Implements robust normalization and defense formulas.

// Calculate defensive ratings for a list of materials.
// Each material object may contain:
//  name, class, YS, UTS, E, density, brinellMPa, brinell, vickersMPa, vickers,
//  k (thermal conductivity), cp (specific heat), Tm (melting point), re (electrical resistivity)
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
  const props = ["YS", "UTS", "E", "density", "k", "cp", "Tm", "re"];
  const classValues = {};
  const globalValues = {};

  for (const mat of materials) {
    const cls = mat.class || "global";
    if (!classValues[cls]) classValues[cls] = {};
    for (const p of props) {
      const v = mat[p];
      if (v != null) {
        if (!classValues[cls][p]) classValues[cls][p] = [];
        classValues[cls][p].push(v);
        if (!globalValues[p]) globalValues[p] = [];
        globalValues[p].push(v);
      }
    }
  }

  const mediansGlobal = {};
  for (const p of props) {
    mediansGlobal[p] = median(globalValues[p] || []);
  }

  const mediansClass = {};
  for (const [cls, values] of Object.entries(classValues)) {
    mediansClass[cls] = {};
    for (const p of props) {
      mediansClass[cls][p] = median(values[p] || []);
    }
  }

  const classRatios = {};
  for (const cls of Object.keys(mediansClass)) {
    const ys = mediansClass[cls].YS;
    const uts = mediansClass[cls].UTS;
    classRatios[cls] = ys && uts ? uts / ys : 1.3;
  }
  const globalRatio = mediansGlobal.YS && mediansGlobal.UTS
    ? mediansGlobal.UTS / mediansGlobal.YS
    : 1.3;

  // Median specific stiffness for imputation when E or density missing
  const ssValues = [];
  for (const mat of materials) {
    if (mat.E != null && mat.density != null) {
      ssValues.push(mat.E / mat.density);
    }
  }
  const medianSS = median(ssValues);

  // Impute missing values and compute derived properties on copies
  const enriched = materials.map((mat) => {
    const cls = mat.class || "global";
    const cMed = mediansClass[cls] || {};
    const ratio = classRatios[cls] || globalRatio;

    let YS = mat.YS;
    let UTS = mat.UTS;
    if (YS == null && UTS != null) YS = UTS / ratio;
    if (UTS == null && YS != null) UTS = YS * ratio;
    if (YS == null) YS = cMed.YS ?? mediansGlobal.YS;
    if (UTS == null) UTS = cMed.UTS ?? mediansGlobal.UTS;

    let E = mat.E ?? cMed.E ?? mediansGlobal.E;
    let density = mat.density ?? cMed.density ?? mediansGlobal.density;
    let k = mat.k ?? cMed.k ?? mediansGlobal.k;
    let cp = mat.cp ?? cMed.cp ?? mediansGlobal.cp;
    let Tm = mat.Tm ?? cMed.Tm ?? mediansGlobal.Tm;
    let re = mat.re ?? cMed.re ?? mediansGlobal.re;

    // Hardness proxy in MPa
    let brinellMPa = mat.brinellMPa;
    if (brinellMPa == null && mat.brinell != null) brinellMPa = mat.brinell * 9.807;
    let vickersMPa = mat.vickersMPa;
    if (vickersMPa == null && mat.vickers != null) vickersMPa = mat.vickers * 9.807;
    const candidates = [];
    if (brinellMPa != null) candidates.push(brinellMPa);
    if (vickersMPa != null) candidates.push(vickersMPa);
    if (YS != null) candidates.push(YS * 3);
    if (UTS != null) candidates.push(UTS * 2);
    const H_MP = candidates.length ? Math.max(...candidates) : undefined;

    const SS = (E != null && density != null) ? E / density : medianSS;

    return { ...mat, YS, UTS, E, density, k, cp, Tm, re, H_MP, SS };
  });

  // Normalization bounds scoped by material class
  const normProps = ["H_MP", "YS", "UTS", "E", "density", "SS", "k", "cp", "Tm", "re"];
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
    for (const p of normProps) {
      const val = m[p];
      if (val != null) {
        (globalBuckets[p] ||= []).push(val);
        (classBuckets[cls][p] ||= []).push(val);
      }
    }
  }

  const globalBounds = {};
  for (const p of normProps) {
    globalBounds[p] = buildBounds(globalBuckets[p] || []);
  }

  const boundsByClass = {};
  for (const [cls, props] of Object.entries(classBuckets)) {
    boundsByClass[cls] = {};
    for (const p of normProps) {
      const arr = props[p] && props[p].length ? props[p] : globalBuckets[p] || [];
      boundsByClass[cls][p] = buildBounds(arr);
    }
  }

  // Compute defenses
  const withDefenses = enriched.map((mat) => {
    const cls = mat.class || "global";
    const b = boundsByClass[cls] || globalBounds;
    const n = (p) => normalize(mat[p], b[p].a, b[p].b);
    const Hn = n("H_MP");
    const YSn = n("YS");
    const UTSn = n("UTS");
    const En = n("E");
    const rhon = n("density");
    const SSn = n("SS");
    const kn = n("k");
    const cpn = n("cp");
    const Tmn = n("Tm");
    const ren = n("re");

    let slash = 0.50 * Hn + 0.30 * YSn + 0.20 * En;
    let pierce = 0.45 * Hn + 0.35 * YSn + 0.20 * UTSn;
    let blunt = 0.35 * En + 0.35 * YSn + 0.30 * rhon;

    let fire = 0.45 * Tmn + 0.35 * cpn + 0.20 * (1 - kn);
    let earth = 0.50 * Hn + 0.30 * En + 0.20 * rhon;
    let water = 0.45 * ren + 0.25 * Hn + 0.15 * (1 - kn) + 0.15 * cpn;
    let wind = 0.40 * SSn + 0.30 * Hn + 0.30 * ren;

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
  const a = arr.filter(v => v != null).sort((x, y) => x - y);
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

export default calculateMaterialDefenses;

