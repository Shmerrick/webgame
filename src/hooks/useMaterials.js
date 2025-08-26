import { useState, useEffect } from 'react';
import buildMaterialDB from '../utils/buildMaterialDB.js';
import { normalizeDamageFactorsByCategory } from '../materialCalculations.js';
import { getDatabaseSection } from '../../public/database.js';

export default function useMaterials() {
  const [db, setDb] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [base, wood, elementals, alloys, rocks, gemstones] = await Promise.all([
          getDatabaseSection('materials'),
          getDatabaseSection('woodTypes'),
          getDatabaseSection('elementalMetals'),
          getDatabaseSection('metalAlloys'),
          getDatabaseSection('rockTypes'),
          getDatabaseSection('cutGemstones'),
        ]);

        const capitalizeWords = (s = '') => s.replace(/\b\w/g, c => c.toUpperCase());
        const capitalizeNode = (node) => {
          if (Array.isArray(node)) {
            return node.map(item => ({ ...item, name: capitalizeWords(item.name) }));
          }
          const out = {};
          for (const [key, value] of Object.entries(node)) {
            out[capitalizeWords(key)] = capitalizeNode(value);
          }
          return out;
        };

        const built = capitalizeNode(buildMaterialDB(base, wood, elementals, alloys, rocks));
        built['Cut Gemstones'] = (gemstones || []).map(name => ({ name: capitalizeWords(name) }));
        built.Dev = [
          {
            id: 'dev_material',
            name: 'Dev Material',
            density: 1,
            factors: {
              slash: 1,
              pierce: 1,
              blunt: 1,
              defense_slash: 1,
              defense_pierce: 1,
              defense_blunt: 1,
              fire: 1,
              water: 1,
              wind: 1,
              earth: 1,
            },
          },
        ];
        const normalized = normalizeDamageFactorsByCategory(built);
        if (!cancelled) setDb(normalized);
      } catch (e) {
        if (!cancelled) setError(e);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return [db, error];
}
