import { describe, it, expect } from 'vitest';
import buildMaterialDB from '../src/utils/buildMaterialDB.js';

describe('buildMaterialDB', () => {
  it('assigns ids, applies defaults, and merges categories', () => {
    const base = { Metals: { 'Base Metals': [{ name: 'Iron' }] } };
    const wood = { Soft: ['Pine'] };
    const elementals = {
      elements: [
        {
          name: 'Silver',
          density: 10,
          yieldStrength: 100,
          tensileStrength: 200,
          elasticModulus: 100000,
          thermalConductivity: 100,
          specificHeat: 1,
          meltingPoint: 1000,
          electricalResistivity: 1,
        },
      ],
    };
    const alloys = {
      elements: [
        {
          name: 'Bronze',
          density: 8,
          yieldStrength: 150,
          tensileStrength: 300,
          elasticModulus: 120000,
          thermalConductivity: 50,
          specificHeat: 0.4,
          meltingPoint: 950,
          electricalResistivity: 5,
        },
      ],
    };
    const rocks = { Igneous: { Granite: {} } };
    const db = buildMaterialDB(
      base,
      wood,
      elementals,
      alloys,
      rocks,
      { defaultDensities: { Wood: 0.5, 'Rock Types': 2.7 } }
    );

    expect(db.Metals['Base Metals'][0]).toMatchObject({ id: 'iron', name: 'Iron' });
    expect(db.Metals['Elemental Metals'][0]).toMatchObject({ id: 'silver', name: 'Silver' });
    expect(db.Metals['Elemental Metals'][0].factors).toBeTruthy();
    expect(db.Metals['Metal Alloys'][0]).toMatchObject({ id: 'bronze', name: 'Bronze' });
    expect(db.Metals['Metal Alloys'][0].factors).toBeTruthy();
    expect(db.Wood.Soft[0]).toMatchObject({ id: 'pine', name: 'Pine', density: 0.5 });
    expect(db.Wood.Soft[0].factors).toBeTruthy();
    expect(db['Rock Types'].Igneous[0]).toEqual({ id: 'granite', name: 'Granite', density: 2.7 });
  });
});
