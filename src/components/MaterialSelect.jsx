import React from "react";
import {
  subcategoriesFor,
  itemsForCategory,
  firstSub,
  firstMaterial,
} from "../utils/materialHelpers.js";

export default function MaterialSelect({ DB, allowed, value, onChange, disabled = false, exclude = [] }) {
  const categories = allowed.slice().sort();
  const subCats = subcategoriesFor(DB, value.category);
  const materials = itemsForCategory(DB, value.category, value.subCategory).filter(m => !exclude.includes(m.name));
  return (
    <div className="grid grid-cols-1 gap-2">
      <select
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2"
        value={value.category}
        onChange={e => {
          const category = e.target.value;
          const subCategory = firstSub(category);
          const material = firstMaterial(category, subCategory);
          onChange({ category, subCategory, material });
        }}
        disabled={disabled}
      >
        {categories.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      {subCats.length > 0 && (
        <select
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2"
          value={value.subCategory}
          onChange={e => {
            const subCategory = e.target.value;
            const material = firstMaterial(value.category, subCategory);
            onChange({ ...value, subCategory, material });
          }}
          disabled={disabled}
        >
          {subCats.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}
      <select
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2"
        value={value.material}
        onChange={e => onChange({ ...value, material: e.target.value })}
        disabled={disabled}
      >
        {materials.map(m => (
          <option key={m.name} value={m.name}>{m.name}</option>
        ))}
      </select>
    </div>
  );
}
