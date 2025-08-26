import { describe, it, expect } from 'vitest';
import buildMaterialDB from '../src/utils/buildMaterialDB.js';

describe('buildMaterialDB', () => {
  it('assigns ids, applies defaults, and merges categories', () => {
    const base = { Metals: { 'Base Metals': [{ name: 'Iron' }] } };
    const wood = { Soft: ['Pine'] };
    const elementals = { elements: [{ name: 'Silver' }] };
    const alloys = { elements: [{ name: 'Bronze' }] };
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
    expect(db.Metals['Metal Alloys'][0]).toMatchObject({ id: 'bronze', name: 'Bronze' });
    expect(db.Wood.Soft[0]).toEqual({ id: 'pine', name: 'Pine', density: 0.5 });
    expect(db['Rock Types'].Igneous[0]).toEqual({ id: 'granite', name: 'Granite', density: 2.7 });
  });
});
