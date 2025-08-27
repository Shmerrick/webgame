import React, { useState } from "react";
import MaterialSelect from "./MaterialSelect.jsx";
import {
  WEAPONS,
  MATERIALS_FOR_HANDLE_CORE,
  MATERIALS_FOR_HANDLE_GRIP,
  MATERIALS_FOR_HANDLE_FITTING,
  MATERIALS_FOR_HEAD,
  BANNED_WEAPON_HEAD_MATERIALS,
  BOW_TYPES,
} from "../../public/constants/weapons.js";


export default function WeaponAttackPanel({ weaponKey, setWeaponKey, weapon, bowType, setBowType, bowWood, setBowWood, weaponComps, setWeaponComp, isTwoHanded, setTwoHanded, mountedSpeed, setMountedSpeed, armor, DB }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Melee</h2>
        <button type="button" className="text-xs text-slate-300 hover:text-emerald-400" onClick={() => setCollapsed(c=>!c)}>{collapsed ? 'Expand' : 'Collapse'}</button>
      </div>
      {!collapsed && (
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
              <MaterialSelect DB={DB} allowed={["Wood"]} value={bowWood} onChange={setBowWood} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm mb-1">Handle or Core Material</label>
              <MaterialSelect DB={DB} allowed={MATERIALS_FOR_HANDLE_CORE} value={weaponComps.core} onChange={val=>setWeaponComp('core', val)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Grip or Wrap Material</label>
              <MaterialSelect DB={DB} allowed={MATERIALS_FOR_HANDLE_GRIP} value={weaponComps.grip} onChange={val=>setWeaponComp('grip', val)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Guard or Pommel Fittings</label>
              <MaterialSelect
                DB={DB}
                allowed={
                  weaponKey === 'Sword'
                    ? MATERIALS_FOR_HANDLE_FITTING.filter(c => c !== 'Rock Types')
                    : MATERIALS_FOR_HANDLE_FITTING
                }
                value={weaponComps.fitting}
                onChange={val => setWeaponComp('fitting', val)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Weapon Head Material</label>
              <MaterialSelect DB={DB} allowed={MATERIALS_FOR_HEAD} exclude={BANNED_WEAPON_HEAD_MATERIALS} value={weaponComps.head} onChange={val=>setWeaponComp('head', val)} />
            </div>
          </div>
        )}

        {["Sword", "Axe", "Hammer", "Spear"].includes(weaponKey) && (
          <div>
            <span className="block text-sm mb-1">Handedness</span>
            <div className="flex gap-4 text-sm">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="handedness"
                  checked={!isTwoHanded}
                  onChange={() => setTwoHanded(false)}
                  disabled={armor.shield.isEquipped}
                />
                <span className="ml-2">One-Handed</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="handedness"
                  checked={isTwoHanded}
                  onChange={() => setTwoHanded(true)}
                  disabled={armor.shield.isEquipped}
                />
                <span className="ml-2">Two-Handed</span>
              </label>
            </div>
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
      )}
    </section>
  );
}
