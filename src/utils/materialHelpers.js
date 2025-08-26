export function getMaterialsForCategory(DB, cat) {
  return DB[cat] || {};
}

/**
 * Sentinel key used in the materials database to indicate that a
 * category has no subcategories. When this key is present, the
 * category's items are stored directly under it.
 */
export const NO_SUBCATEGORY_KEY = 'A';

/**
 * Returns the list of subcategory keys for a category. Some categories
 * store their items under {@link NO_SUBCATEGORY_KEY} to indicate the
 * absence of real subcategories, in which case an empty array is returned.
 */
export function subcategoriesFor(DB, cat) {
  const obj = getMaterialsForCategory(DB, cat);
  if (Array.isArray(obj)) return [];
  const keys = Object.keys(obj || {}).sort();
  // Categories using the sentinel key have no actual subcategories.
  return (keys.length === 1 && keys[0] === NO_SUBCATEGORY_KEY) ? [] : keys;
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
