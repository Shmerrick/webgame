import React from "react";

export default function RangedWeaponPanel({ rangedWeaponKey, setRangedWeaponKey }) {
  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg">
      <h2 className="text-lg font-semibold mb-3">Ranged Weapon</h2>
      <div>
        <label className="block text-sm mb-1">Ranged Weapon</label>
        <select
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
          value={rangedWeaponKey}
          onChange={e => setRangedWeaponKey(e.target.value)}
        >
          {['None','Bow','Crossbow','Sling','Throwing'].map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        {rangedWeaponKey === 'Sling' && (
          <div className="text-sm text-slate-300 mt-1">
            Slings may be used in your main hand or offhand alongside another weapon.
          </div>
        )}
      </div>
    </section>
  );
}
