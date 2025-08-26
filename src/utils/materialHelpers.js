export function getMaterialsForCategory(DB, cat) {
  return DB[cat] || {};
}

export function subcategoriesFor(DB, cat) {
  const obj = getMaterialsForCategory(DB, cat);
  if (Array.isArray(obj)) return [];
  const keys = Object.keys(obj || {}).sort();
  return (keys.length === 1 && keys[0] === 'A') ? [] : keys;
}

export function itemsForCategory(DB, cat, subCat) {
  const obj = getMaterialsForCategory(DB, cat);
  if (Array.isArray(obj)) return obj.slice().sort((a, b) => a.name.localeCompare(b.name));
  if (subCat) {
    const list = obj[subCat];
    return Array.isArray(list) ? list.slice().sort((a, b) => a.name.localeCompare(b.name)) : [];
  }
  let arr = [];
  for (const list of Object.values(obj || {})) {
    if (Array.isArray(list)) arr = arr.concat(list);
  }
  return arr.sort((a, b) => a.name.localeCompare(b.name));
}

export function firstSub(DB, cat) {
  return subcategoriesFor(DB, cat)[0] || "";
}

export function firstMaterial(DB, cat, subCat) {
  const items = itemsForCategory(DB, cat, subCat);
  return (items[0]?.name) || "";
}

export function factorsFor(DB, cat, materialName) {
  const items = itemsForCategory(DB, cat);
  for (const m of items) {
    if (m.name === materialName) {
      return m.factors || m;
    }
  }
  return null;
}
