import { describe, it, expect } from 'vitest';
import {
  calculateMaterialDefenses,
  normalizeDamageFactorsByCategory,
  computeMaterialStats,
  imputeMaterialProperties,
  buildNormalizationBounds,
  scoreMaterialDefenses,
} from '../src/materialCalculations.js';

describe('calculateMaterialDefenses', () => {
  it('computes defense ratings within [0,1]', () => {
    const materials = [
      { name: 'TestIron', class: 'Metal', yieldStrength: 200, tensileStrength: 400, elasticModulus: 210000, density: 7.8 },
      { name: 'TestWood', class: 'Wood', yieldStrength: 40, tensileStrength: 80, elasticModulus: 10000, density: 0.6 },
    ];
    const result = calculateMaterialDefenses(materials);
    expect(result).toHaveLength(2);
    for (const mat of result) {
      ['D_slash','D_pierce','D_blunt','R_slash','R_pierce','R_blunt','R_fire','R_earth','R_water','R_wind'].forEach(key => {
        expect(mat[key]).toBeGreaterThanOrEqual(0);
        expect(mat[key]).toBeLessThanOrEqual(1);
      });
    }
  });

  it('applies feel transform when enabled', () => {
    const materials = [
      { name: 'Mat1', class: 'Metal', yieldStrength: 100, tensileStrength: 200, elasticModulus: 100, density: 10, thermalConductivity: 1, specificHeat: 1, meltingPoint: 1, electricalResistivity: 1 },
      { name: 'Mat2', class: 'Metal', yieldStrength: 200, tensileStrength: 400, elasticModulus: 200, density: 20, thermalConductivity: 2, specificHeat: 2, meltingPoint: 2, electricalResistivity: 2 },
      { name: 'Mat3', class: 'Metal', yieldStrength: 150, tensileStrength: 300, elasticModulus: 150, density: 15, thermalConductivity: 1.5, specificHeat: 1.5, meltingPoint: 1.5, electricalResistivity: 1.5 },
    ];
    const base = calculateMaterialDefenses(materials)[2];
    const feel = calculateMaterialDefenses(materials, { feel: true })[2];
    expect(feel.R_slash).toBeCloseTo(0.05 + 0.90 * base.R_slash);
    expect(feel.R_fire).toBeCloseTo(0.05 + 0.90 * base.R_fire);
  });

  it('adds armor bias and thickness correctly', () => {
    const materials = [
      { name: 'Mat1', class: 'Metal', yieldStrength: 100, tensileStrength: 200, elasticModulus: 100, density: 10, thermalConductivity: 1, specificHeat: 1, meltingPoint: 1, electricalResistivity: 1 },
      { name: 'Mat2', class: 'Metal', yieldStrength: 200, tensileStrength: 400, elasticModulus: 200, density: 20, thermalConductivity: 2, specificHeat: 2, meltingPoint: 2, electricalResistivity: 2 },
      { name: 'Mat3', class: 'Metal', yieldStrength: 150, tensileStrength: 300, elasticModulus: 150, density: 15, thermalConductivity: 1.5, specificHeat: 1.5, meltingPoint: 1.5, electricalResistivity: 1.5 },
    ];
    const base = calculateMaterialDefenses(materials)[2];
    const biased = calculateMaterialDefenses(materials, { armorBias: { slashing: 0.1 } })[2];
    expect(biased.R_slash).toBeCloseTo(Math.min(1, base.R_slash + 0.1));
    const thick = calculateMaterialDefenses(materials, { thickness: 1.5 })[2];
    expect(thick.R_slash).toBeCloseTo(Math.min(1, base.R_slash * 1.5));
  });

  it('applies attunement bonuses', () => {
    const materials = [
      { name: 'Mat1', class: 'Metal', yieldStrength: 100, tensileStrength: 200, elasticModulus: 100, density: 10, thermalConductivity: 1, specificHeat: 1, meltingPoint: 1, electricalResistivity: 1 },
      { name: 'Mat2', class: 'Metal', yieldStrength: 200, tensileStrength: 400, elasticModulus: 200, density: 20, thermalConductivity: 2, specificHeat: 2, meltingPoint: 2, electricalResistivity: 2 },
      { name: 'Mat3', class: 'Metal', yieldStrength: 150, tensileStrength: 300, elasticModulus: 150, density: 15, thermalConductivity: 1.5, specificHeat: 1.5, meltingPoint: 1.5, electricalResistivity: 1.5 },
    ];
    const base = calculateMaterialDefenses(materials)[2];
    const attuned = calculateMaterialDefenses(materials, { attunement: { fire: 0.2 } })[2];
    expect(attuned.R_fire).toBeCloseTo(Math.min(1, base.R_fire + 0.2));
  });

  it('normalizes damage factors per category', () => {
    const db = {
      Metals: {
        Stuff: [
          { name: 'Iron', factors: { slash: 10, pierce: 5, blunt: 2 } },
          { name: 'Steel', factors: { slash: 20, pierce: 10, blunt: 4 } }
        ]
      },
      Wood: {
        Any: [
          { name: 'Oak', factors: { slash: 3, pierce: 1, blunt: 1 } },
          { name: 'Pine', factors: { slash: 6, pierce: 2, blunt: 2 } }
        ]
      }
    };
    const normalized = normalizeDamageFactorsByCategory(db);
    const metals = normalized.Metals.Stuff;
    expect(Math.max(...metals.map(m=>m.factors.slash))).toBeCloseTo(1);
    expect(Math.max(...metals.map(m=>m.factors.pierce))).toBeCloseTo(1);
    expect(Math.max(...metals.map(m=>m.factors.blunt))).toBeCloseTo(1);
    const woods = normalized.Wood.Any;
    expect(Math.max(...woods.map(m=>m.factors.slash))).toBeCloseTo(1);
    expect(Math.max(...woods.map(m=>m.factors.pierce))).toBeCloseTo(1);
    expect(Math.max(...woods.map(m=>m.factors.blunt))).toBeCloseTo(1);
  });

  it('does not mutate the original database object', () => {
    const db = {
      Metals: {
        Stuff: [
          { name: 'Iron', factors: { slash: 10, pierce: 5, blunt: 2 } },
          { name: 'Steel', factors: { slash: 20, pierce: 10, blunt: 4 } }
        ]
      },
      Wood: {
        Any: [
          { name: 'Oak', factors: { slash: 3, pierce: 1, blunt: 1 } },
          { name: 'Pine', factors: { slash: 6, pierce: 2, blunt: 2 } }
        ]
      }
    };
    const original = structuredClone(db);
    const normalized = normalizeDamageFactorsByCategory(db);
    expect(db).toEqual(original);
    expect(normalized).not.toBe(db);
  });
});

describe('material calculation helpers', () => {
  it('computes medians and ratios', () => {
    const mats = [
      { class: 'A', yieldStrength: 100, tensileStrength: 200, elasticModulus: 100, density: 10 },
      { class: 'A', yieldStrength: 110, tensileStrength: 210, elasticModulus: 110, density: 11 },
      { class: 'B', yieldStrength: 50, tensileStrength: 100, elasticModulus: 50, density: 5 },
    ];
    const stats = computeMaterialStats(mats);
    expect(stats.globalMedians.yieldStrength).toBe(100);
    expect(stats.classMedians.A.yieldStrength).toBe(105);
    expect(stats.classRatios.A).toBeCloseTo(
      stats.classMedians.A.tensileStrength / stats.classMedians.A.yieldStrength
    );
    expect(stats.globalRatio).toBeCloseTo(
      stats.globalMedians.tensileStrength / stats.globalMedians.yieldStrength
    );
    expect(stats.medianSpecificStiffness).toBeCloseTo(10);
  });

  it('imputes missing properties and derives values', () => {
    const mats = [
      { class: 'Metal', tensileStrength: 200, elasticModulus: 100, density: 10 },
      { class: 'Metal', yieldStrength: 100, tensileStrength: 200, elasticModulus: 100, density: 10 },
    ];
    const stats = computeMaterialStats(mats);
    const enriched = imputeMaterialProperties(mats, stats);
    expect(enriched[0].yieldStrength).toBe(100);
    expect(enriched[0].estimatedHardnessMPa).toBe(400);
    expect(enriched[0].specificStiffness).toBeCloseTo(10);
  });

  it('builds normalization bounds', () => {
    const enriched = [
      {
        class: 'A',
        estimatedHardnessMPa: 100,
        yieldStrength: 200,
        tensileStrength: 300,
        elasticModulus: 1000,
        density: 1,
        specificStiffness: 10,
        thermalConductivity: 5,
        specificHeat: 2,
        meltingPoint: 1000,
        electricalResistivity: 0.1,
      },
      {
        class: 'A',
        estimatedHardnessMPa: 200,
        yieldStrength: 400,
        tensileStrength: 500,
        elasticModulus: 2000,
        density: 2,
        specificStiffness: 20,
        thermalConductivity: 6,
        specificHeat: 3,
        meltingPoint: 1100,
        electricalResistivity: 0.2,
      },
    ];
    const bounds = buildNormalizationBounds(enriched);
    expect(bounds.boundsByClass.A.estimatedHardnessMPa).toEqual({ a: 100, b: 200 });
    expect(bounds.globalBounds.estimatedHardnessMPa).toEqual({ a: 100, b: 200 });
  });

  it('scores defenses from normalized properties', () => {
    const enriched = [
      {
        class: 'A',
        estimatedHardnessMPa: 100,
        yieldStrength: 200,
        tensileStrength: 300,
        elasticModulus: 1000,
        density: 1,
        specificStiffness: 10,
        thermalConductivity: 5,
        specificHeat: 2,
        meltingPoint: 1000,
        electricalResistivity: 0.1,
      },
      {
        class: 'A',
        estimatedHardnessMPa: 200,
        yieldStrength: 400,
        tensileStrength: 500,
        elasticModulus: 2000,
        density: 2,
        specificStiffness: 20,
        thermalConductivity: 6,
        specificHeat: 3,
        meltingPoint: 1100,
        electricalResistivity: 0.2,
      },
    ];
    const bounds = buildNormalizationBounds(enriched);
    const scored = scoreMaterialDefenses(enriched, bounds);
    expect(scored[0].R_slash).toBeCloseTo(0);
    expect(scored[1].R_slash).toBeCloseTo(1);
  });
});
