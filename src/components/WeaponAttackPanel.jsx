import React from "react";
import MaterialSelect from "./MaterialSelect.jsx";
import { WEAPONS, MATERIALS_FOR_HANDLE_CORE, MATERIALS_FOR_HANDLE_GRIP, MATERIALS_FOR_HANDLE_FITTING, MATERIALS_FOR_HEAD, BANNED_WEAPON_HEAD_MATERIALS } from "../constants/weapons.js";

const BOW_TYPES = {
  Long:    { drawWeight: 60, massKilograms: 1.2 },
  Recurve: { drawWeight: 50, massKilograms: 1.0 },
  Yumi:    { drawWeight: 55, massKilograms: 1.1 },
  Horse:   { drawWeight: 45, massKilograms: 0.8 },
  Flat:    { drawWeight: 40, massKilograms: 0.9 },
};

export default function WeaponAttackPanel({ weaponKey, setWeaponKey, weapon, bowType, setBowType, bowWood, setBowWood, weaponComps, setWeaponComp, isTwoHanded, setTwoHanded, mountedSpeed, setMountedSpeed, armor, DB, subcategoriesFor, itemsForCategory, firstSubCat, firstMat }) {
  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg">
      <h2 className="text-lg font-semibold mb-3">Melee</h2>
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-sm mb-1">Weapon</label>
          <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" value={weaponKey} onChange={e=>setWeaponKey(e.target.value)}>
            {Object.keys(WEAPONS).map(k=> <option key={k} value={k}>{k}</option>)}
          </select>
          {weapon?.type==='melee' && <div className="text-sm text-slate-300 mt-1">This weapon weighs approximately {weapon.massKilograms} kilograms. The stamina cost to swing is the base cost {weapon.baseCost} plus one times the rounded mass.</div>}
        </div>
        {weaponKey === 'Bow' ? (
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm mb-1">Bow Type</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" value={bowType} onChange={e=>setBowType(e.target.value)}>
                {Object.keys(BOW_TYPES).map(k=> <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Wood Material</label>
              <MaterialSelect DB={DB} allowed={["Wood"]} value={bowWood} onChange={setBowWood} subcategoriesFor={subcategoriesFor} itemsForCategory={itemsForCategory} firstSub={firstSubCat} firstMaterial={firstMat} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm mb-1">Handle or Core Material</label>
              <MaterialSelect DB={DB} allowed={MATERIALS_FOR_HANDLE_CORE} value={weaponComps.core} onChange={val=>setWeaponComp('core', val)} subcategoriesFor={subcategoriesFor} itemsForCategory={itemsForCategory} firstSub={firstSubCat} firstMaterial={firstMat} />
            </div>
            <div>
              <label className="block text-sm mb-1">Grip or Wrap Material</label>
              <MaterialSelect DB={DB} allowed={MATERIALS_FOR_HANDLE_GRIP} value={weaponComps.grip} onChange={val=>setWeaponComp('grip', val)} subcategoriesFor={subcategoriesFor} itemsForCategory={itemsForCategory} firstSub={firstSubCat} firstMaterial={firstMat} />
            </div>
            <div>
              <label className="block text-sm mb-1">Guard or Pommel Fittings</label>
              <MaterialSelect DB={DB} allowed={MATERIALS_FOR_HANDLE_FITTING} value={weaponComps.fitting} onChange={val=>setWeaponComp('fitting', val)} subcategoriesFor={subcategoriesFor} itemsForCategory={itemsForCategory} firstSub={firstSubCat} firstMaterial={firstMat} />
            </div>
            <div>
              <label className="block text-sm mb-1">Weapon Head Material</label>
              <MaterialSelect DB={DB} allowed={MATERIALS_FOR_HEAD} exclude={BANNED_WEAPON_HEAD_MATERIALS} value={weaponComps.head} onChange={val=>setWeaponComp('head', val)} subcategoriesFor={subcategoriesFor} itemsForCategory={itemsForCategory} firstSub={firstSubCat} firstMaterial={firstMat} />
            </div>
          </div>
        )}

        {["Sword", "Axe", "Hammer", "Spear"].includes(weaponKey) && (
          <div>
            <label className="block text-sm mb-1">
              <input type="checkbox" checked={isTwoHanded} onChange={e => setTwoHanded(e.target.checked)} disabled={armor.shield.shield !== 'None'} />
              Two-Handed
            </label>
          </div>
        )}

        {weapon?.type==='mounted' && (
          <div>
            <label className="block text-sm mb-1">Mount Speed</label>
            <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" value={mountedSpeed} onChange={e=>setMountedSpeed(e.target.value)}>
              {Object.keys(WEAPONS.Lance.speed).map(k=> <option key={k} value={k}>{k}</option>)}
            </select>
            <div className="text-sm text-slate-300 mt-1">Lance attacks do not use charge time or swing completion. Damage scales with the speed of the mount.</div>
          </div>
        )}

      </div>
    </section>
  );
}
