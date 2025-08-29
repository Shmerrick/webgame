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
    const rockProps = {
      Granite: {
        density: 2.75,
        tensileStrength: 4,
        yieldStrength: 200,
        elasticModulus: 50000,
        thermalConductivity: 2,
        specificHeat: 0.8,
        meltingPoint: 1500,
        electricalResistivity: 1e12,
        hardness: 600,
        toughness: 2,
      },
    };
    const furProps = {
      Beaver: {
        density: 0.96,
        tensileStrength: 19,
        yieldStrength: 14.6,
        elasticModulus: 400,
        thermalConductivity: 0.04,
        specificHeat: 1.3,
        meltingPoint: 240,
        electricalResistivity: 1e11,
        hardness: 32,
        toughness: 14.6,
      },
    };
    const db = buildMaterialDB(
      base,
      wood,
      elementals,
      alloys,
      rocks,
      {
        defaultDensities: { Wood: 0.5, 'Rocks': 2.7 },
        rockProperties: rockProps,
        furProperties: furProps,
      }
    );

    expect(db.Metals['Base Metals'][0]).toMatchObject({ id: 'iron', name: 'Iron' });
    expect(db.Metals['Elemental Metals'][0]).toMatchObject({ id: 'silver', name: 'Silver' });
    expect(db.Metals['Elemental Metals'][0].factors).toBeTruthy();
    expect(db.Metals['Metal Alloys'][0]).toMatchObject({ id: 'bronze', name: 'Bronze' });
    expect(db.Metals['Metal Alloys'][0].factors).toBeTruthy();
    expect(db.Wood.Soft[0]).toMatchObject({ id: 'pine', name: 'Pine', density: 0.5 });
    expect(db.Wood.Soft[0].factors).toBeTruthy();
    expect(db['Rocks'].Igneous[0]).toMatchObject({ id: 'granite', name: 'Granite', density: 2.75 });
    expect(db['Rocks'].Igneous[0].factors).toBeTruthy();
    expect(db.Fur[0]).toMatchObject({ id: 'beaver', name: 'Beaver' });
    expect(db.Fur[0].factors).toBeTruthy();
    expect(db.Fur[0].factors.slash).not.toBe(1);
  });

  it('extracts nested mechanical properties for alloys', () => {
    const base = {};
    const wood = {};
    const elementals = { elements: [] };
    const alloys = {
      elements: [
        {
          name: 'TestAlloy',
          mechanical_properties: {
            density: { value: 8 },
            yield_strength: { value: 150 },
            ultimate_tensile_strength: { value: 300 },
            youngs_modulus: { value: 100, units: 'GPa' },
            brinell_hardness: { value: 1000 },
            thermal_conductivity: { value: 50 },
            specific_heat: { value: 0.5 },
            melting_point: { value: 1200 },
            electrical_resistivity: { value: 10 }
          }
        }
      ]
    };
    const rocks = {};
    const db = buildMaterialDB(base, wood, elementals, alloys, rocks);
    const alloy = db.Metals['Metal Alloys'][0];
    expect(alloy).toMatchObject({
      density: 8,
      yieldStrength: 150,
      tensileStrength: 300,
      elasticModulus: 100000,
      brinellMPa: 1000,
      thermalConductivity: 50,
      specificHeat: 0.5,
      meltingPoint: 1200,
      electricalResistivity: 10
    });
    expect(alloy.factors).toBeTruthy();
  });
});
