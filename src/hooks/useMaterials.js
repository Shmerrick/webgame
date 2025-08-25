import { useState, useEffect } from 'react';
import buildMaterialDB from '../utils/buildMaterialDB.js';

export default function useMaterials() {
  const [db, setDb] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [base, wood, elementals, alloys, rocks] = await Promise.all([
          getDatabaseSection('materials'),
          getDatabaseSection('woodTypes'),
          getDatabaseSection('elementalMetals'),
          getDatabaseSection('metalAlloys'),
          getDatabaseSection('rockTypes'),
        ]);
        const built = buildMaterialDB(base, wood, elementals, alloys, rocks);
        built.Dev = [
          {
            id: 'dev_material',
            name: 'Dev Material',
            Name: 'Dev Material',
            Density: 1,
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
        if (!cancelled) setDb(built);
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
