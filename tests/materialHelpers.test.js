import { describe, it, expect } from 'vitest';
import {
  getMaterialsForCategory,
  subcategoriesFor,
  itemsForCategory,
  firstSub,
  firstMaterial,
  factorsFor,
} from '../src/utils/materialHelpers.js';

describe('materialHelpers', () => {
  const DB = {
    Wood: {
      Soft: [
        { name: 'Pine', factors: { slash: 1 } },
        { name: 'Cedar', factors: { slash: 2 } },
      ],
      Hard: [
        { name: 'Oak', factors: { slash: 3 } },
      ],
    },
    Metals: {
      A: [ { name: 'Iron', factors: { slash: 10 } } ],
    },
    Leather: [
      { name: 'Deerhide', factors: { slash: 0.4 } },
      { name: 'Cowhide', factors: { slash: 0.5 } },
    ],
  };

  it('gets materials for a category', () => {
    expect(getMaterialsForCategory(DB, 'Wood')).toBe(DB.Wood);
    expect(getMaterialsForCategory(DB, 'Unknown')).toEqual({});
  });

  it('lists subcategories correctly', () => {
    expect(subcategoriesFor(DB, 'Wood')).toEqual(['Hard', 'Soft']);
    expect(subcategoriesFor(DB, 'Leather')).toEqual([]);
    expect(subcategoriesFor(DB, 'Metals')).toEqual([]);
  });

  it('lists items for a category and subcategory', () => {
    expect(itemsForCategory(DB, 'Leather').map(m => m.name)).toEqual(['Cowhide', 'Deerhide']);
    expect(itemsForCategory(DB, 'Wood', 'Soft').map(m => m.name)).toEqual(['Cedar', 'Pine']);
  });

  it('selects the first subcategory and material', () => {
    expect(firstSub(DB, 'Wood')).toBe('Hard');
    expect(firstSub(DB, 'Leather')).toBe('');
    expect(firstMaterial(DB, 'Wood', 'Soft')).toBe('Cedar');
    expect(firstMaterial(DB, 'Leather')).toBe('Cowhide');
  });

  it('finds factors for a material', () => {
    expect(factorsFor(DB, 'Wood', 'Oak')).toEqual({ slash: 3 });
    expect(factorsFor(DB, 'Leather', 'Cowhide')).toEqual({ slash: 0.5 });
  });
});
