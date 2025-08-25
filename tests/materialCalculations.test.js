import { describe, it, expect } from 'vitest';
import { calculateMaterialDefenses } from '../src/materialCalculations.js';

describe('calculateMaterialDefenses', () => {
  it('computes defense ratings within [0,1]', () => {
    const materials = [
      { name: 'TestIron', class: 'Metal', YS: 200, UTS: 400, E: 210000, density: 7.8 },
      { name: 'TestWood', class: 'Wood', YS: 40, UTS: 80, E: 10000, density: 0.6 },
    ];
    const result = calculateMaterialDefenses(materials);
    expect(result).toHaveLength(2);
    for (const mat of result) {
      ['R_slash','R_pierce','R_blunt','R_fire','R_earth','R_water','R_wind'].forEach(key => {
        expect(mat[key]).toBeGreaterThanOrEqual(0);
        expect(mat[key]).toBeLessThanOrEqual(1);
      });
    }
  });
});
