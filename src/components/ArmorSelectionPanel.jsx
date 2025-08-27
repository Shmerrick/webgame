import React, { useState } from "react";
import MaterialSelect from "./MaterialSelect.jsx";
import Tooltip from "./Tooltip.jsx";
import {
  armorSlots,
  OFFHAND_ITEMS,
  ARMOR_CLASS,
  MATERIALS_FOR_CLASS,
  MATERIALS_FOR_INNER,
  MATERIALS_FOR_BINDING,
  MATERIALS_FOR_JEWELRY_SETTING,
  MATERIALS_FOR_JEWELRY_GEM,
} from "../../public/constants/armor.js";
import { firstSub, firstMaterial, factorsFor } from "../utils/materialHelpers.js";

export default function ArmorSelectionPanel({
  DB,
  armor,
  setArmor,
  effective,
  isTwoHanded,
  setArmorClassSafe,
  setShieldSubtypeSafe,
  setShieldEquipped,
  setArmorOuter,
  setArmorInner,
  setArmorBinding,
  setJewelrySetting,
  setJewelryGem,
  effectiveDRForSlot,
}) {
  const firstSubCat = (cat) => firstSub(DB, cat);
  const firstMat = (cat, subCat) => firstMaterial(DB, cat, subCat);
  const [collapsed, setCollapsed] = useState({});
  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg mt-6">
      <h2 className="text-lg font-semibold mb-3">Armor Loadout and Regeneration</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {armorSlots.map(slot=>{
          const isShield = slot.id==="shield";
          const entry = armor[slot.id] || {};
          const shieldEquipped = isShield ? entry.isEquipped : false;
          const cls = isShield ? (shieldEquipped ? (OFFHAND_ITEMS[entry.shield]?.class||"None") : "None") : (entry.class||"None");
          const category = entry.category || "Leather";
          const subCategory = entry.subCategory || firstSubCat(category);
          const material = entry.material || "";
          const innerCategory = entry.innerCategory || "Linen";
          const innerSubCategory = entry.innerSubCategory || firstSubCat(innerCategory);
          const innerMaterial = entry.innerMaterial || "";
          const bindingCategory = entry.bindingCategory || "Leather";
          const bindingSubCategory = entry.bindingSubCategory || firstSubCat(bindingCategory);
          const bindingMaterial = entry.bindingMaterial || "";
          const isJewelry = ["ring1", "ring2", "earring1", "earring2", "amulet"].includes(slot.id);
          const eff = isJewelry ? { blunt: 0, slash: 0, pierce: 0, fire: 0, water: 0, wind: 0, earth: 0, fallbackFlags: {} } : effectiveDRForSlot(DB, cls, category, material, innerCategory, innerMaterial, bindingCategory, bindingMaterial, isShield);
          const allowedCats = MATERIALS_FOR_CLASS[entry.class||"None"] || [];
          const matObj = factorsFor(DB, category, material);
          const isCollapsed = collapsed[slot.id];

          return (
            <div key={slot.id} className="bg-slate-800/60 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{slot.name}</div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-slate-400">Weight factor in loadout score: {slot.factor}</div>
                  <button
                    type="button"
                    className="text-xs text-slate-300 hover:text-emerald-400"
                    onClick={() => setCollapsed(c => ({ ...c, [slot.id]: !c[slot.id] }))}
                  >
                    {isCollapsed ? 'Expand' : 'Collapse'}
                  </button>
                </div>
              </div>

              { !isCollapsed && (isJewelry ? (
                entry.isEquipped ? (
                  <>
                    <label className="block text-sm mt-3">Setting Material</label>
                    <MaterialSelect DB={DB} allowed={MATERIALS_FOR_JEWELRY_SETTING} value={{category: entry.settingCategory, subCategory: entry.settingSubCategory, material: entry.settingMaterial}} onChange={val=> setJewelrySetting(slot.id, val)} />

                    <label className="block text-sm mt-3">Gem</label>
                    <MaterialSelect DB={DB} allowed={MATERIALS_FOR_JEWELRY_GEM} value={{category: entry.gemCategory, subCategory: entry.gemSubCategory, material: entry.gemMaterial}} onChange={val=> setJewelryGem(slot.id, val)} />
                    <div className="mt-3">
                      <label className="block text-sm">Bonus</label>
                      <input type="range" min="1" max="5" value={entry.bonus || 1} onChange={e => setArmor(p => ({...p, [slot.id]: {...p[slot.id], bonus: parseInt(e.target.value, 10)}}))} className="w-full" />
                      <div className="text-center text-sm">{entry.bonus || 1}</div>
                    </div>
                    {slot.type !== 'amulet' && (
                      <div className="mt-3">
                        <label className="block text-sm">Attribute Bonus</label>
                        <select
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2"
                          value={entry.attribute || (slot.type === 'ring' ? 'STR' : 'DEX')}
                          onChange={e => setArmor(p => ({...p, [slot.id]: {...p[slot.id], attribute: e.target.value}}))}
                        >
                          {slot.type === 'ring' && (
                            <>
                              <option value="STR">Strength</option>
                              <option value="INT">Intelligence</option>
                            </>
                          )}
                          {slot.type === 'earring' && (
                            <>
                              <option value="DEX">Dexterity</option>
                              <option value="PSY">Psyche</option>
                            </>
                          )}
                        </select>
                      </div>
                    )}
                    <button onClick={() => setArmor(p => ({...p, [slot.id]: {...p[slot.id], isEquipped: false}}))} className="mt-3 w-full bg-rose-500/20 text-rose-300 border border-rose-500 rounded-lg py-2 hover:bg-rose-500/40">Unequip</button>
                  </>
                ) : (
                  <button onClick={() => setArmor(p => ({...p, [slot.id]: {...p[slot.id], isEquipped: true}}))} className="mt-3 w-full bg-emerald-500/20 text-emerald-300 border border-emerald-500 rounded-lg py-2 hover:bg-emerald-500/40">Equip</button>
                )
              ) : isShield ? (
                shieldEquipped ? (
                  <>
                    <label className="block text-sm mt-2">Off-Hand Item</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2" value={entry.shield} onChange={e=>setShieldSubtypeSafe(e.target.value)} disabled={isTwoHanded}>
                      {Object.keys(OFFHAND_ITEMS).filter(k=> k!=="None").map(k=> <option key={k} value={k}>{k}</option>)}
                    </select>
                    {entry.shield!=="None" && (
                      <div className="text-sm text-slate-300 mt-1">
                        Required Strength: <span className={`font-semibold ${(effective.STR >= (OFFHAND_ITEMS[entry.shield].strengthRequirement||0)) ? "text-emerald-300" : "text-rose-300"}`}>{OFFHAND_ITEMS[entry.shield].strengthRequirement}</span>.
                      </div>
                    )}
                    <div className="text-sm text-slate-300 mt-2">
                      Shield faces are treated similarly to wood planks for now so that the calculations stay consistent with your materials database. If you want a dedicated shield material list, tell me how you would like it organized, and I will add it.
                    </div>
                    <button onClick={() => setShieldEquipped(false)} className="mt-3 w-full bg-rose-500/20 text-rose-300 border border-rose-500 rounded-lg py-2 hover:bg-rose-500/40" disabled={isTwoHanded}>Unequip</button>
                  </>
                ) : (
                  <button onClick={() => setShieldEquipped(true)} className="mt-2 w-full bg-emerald-500/20 text-emerald-300 border border-emerald-500 rounded-lg py-2 hover:bg-emerald-500/40" disabled={isTwoHanded}>Equip</button>
                )
              ) : (
                <>
                  <label className="block text-sm mt-2">Armor Class</label>
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2" value={entry.class||"None"} onChange={e=>setArmorClassSafe(slot.id, e.target.value)}>
                    {Object.keys(ARMOR_CLASS).map(k=> <option key={k} value={k}>{k}</option>)}
                  </select>

                  <label className="block text-sm mt-3">Outer Material</label>
                  <MaterialSelect DB={DB} allowed={allowedCats} value={{category, subCategory: entry.subCategory, material}} onChange={val=> setArmorOuter(slot.id, val)} disabled={(entry.class||"None")==="None"} />

                  <label className="block text-sm mt-3">Inner Layer Material</label>
                  <MaterialSelect DB={DB} allowed={MATERIALS_FOR_INNER} value={{category: innerCategory, subCategory: entry.innerSubCategory, material: innerMaterial}} onChange={val=> setArmorInner(slot.id, val)} disabled={(entry.class||"None")==="None"} />

                  <label className="block text-sm mt-3">Binding</label>
                  <MaterialSelect DB={DB} allowed={MATERIALS_FOR_BINDING} value={{category: bindingCategory, subCategory: entry.bindingSubCategory, material: bindingMaterial}} onChange={val=> setArmorBinding(slot.id, val)} disabled={(entry.class||"None")==="None"} />

                  {(entry.class||"None")!=="None" && matObj && (
                    <div className="mt-3 bg-slate-900/60 rounded-lg p-3">
                      <div className="font-medium mb-1">Material and Armor Explanation</div>
                      <p className="text-sm text-slate-300">
                        {Object.keys(eff).filter(k => k !== 'fallbackFlags').map(key => {
                            const value = eff[key];
                            const isFallback = eff.fallbackFlags[key];
                            const text = `${key.charAt(0).toUpperCase() + key.slice(1)}: ${(value * 100).toFixed(0)}%`;

                            if (isFallback) {
                                return (
                                    <React.Fragment key={key}>
                                        <Tooltip text="This value is a fallback for missing data.">
                                            <span className="text-amber-400 cursor-help">{text}*</span>
                                        </Tooltip>
                                        {' '}
                                    </React.Fragment>
                                );
                            }
                            return <span key={key}>{text} </span>;
                        })}
                      </p>
                    </div>
                  )}
                </>
                ))}
              </div>
            );
        })}
      </div>
    </section>
  );
}
