import React from "react";
import PropTypes from "prop-types";

export default function CharacterPanel({ races, raceId, setRaceId, stats, setStat, effective, jewelryBonus, spent, remain, stamPool, manaPoolV, STAT_POOL, baseHealth, resetStats }) {
  const race = races.find(r => r.id === raceId) || races[0];
  const modList = Object.entries(race.modifier)
    .filter(([_, v]) => v !== 0)
    .map(([k, v]) => `${k} ${v > 0 ? "+" : ""}${v}`);
  const modText = modList.length ? modList.join(', ') : 'none';
  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg">
      <h2 className="text-lg font-semibold mb-3">Character</h2>
      <div className="mb-4">
        <label className="block text-sm mb-1">Race</label>
        <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2" value={raceId} onChange={e=>setRaceId(e.target.value)}>
          {races.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <div className="text-sm text-slate-300 mt-2">
          The chosen race applies the following adjustments to your base attributes: {modText}.
        </div>
      </div>
      {["STR","DEX","INT","PSY"].map(k=> (
        <div key={k} className="mb-3">
          <div className="flex items-center justify-between text-sm">
            <span>{k}</span>
            <span className="tabular-nums">
              {stats[k]}
              <span className="text-green-400">(effective {effective[k]})</span>
              {jewelryBonus[k] > 0 && <span className="text-yellow-400"> (+{jewelryBonus[k]})</span>}
            </span>
          </div>
          <input type="range" min={0} max={100} value={stats[k]} onChange={e=>setStat(k, parseInt(e.target.value))} className="w-full" />
        </div>
      ))}
      <div className="flex items-center justify-between text-sm mt-2">
        <div>Attribute points spent</div>
        <div className={`tabular-nums ${remain<0?"text-rose-400":""}`}>{spent} / {STAT_POOL} <span className="text-slate-500">(remaining {Math.max(0, remain)})</span></div>
      </div>
      <button className="mt-2 px-2 py-1 text-xs rounded bg-slate-700" onClick={resetStats}>Reset Attributes</button>
      <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
        <div className="bg-slate-800/70 rounded-xl p-3"><div className="text-slate-400">Health</div><div className="text-xl tabular-nums">{baseHealth}</div></div>
        <div className="bg-slate-800/70 rounded-xl p-3"><div className="text-slate-400">Stamina</div><div className="text-xl tabular-nums">{stamPool}</div></div>
        <div className="bg-slate-800/70 rounded-xl p-3"><div className="text-slate-400">Mana</div><div className="text-xl tabular-nums">{manaPoolV}</div></div>
      </div>
    </section>
  );
}

const statShape = PropTypes.shape({
  STR: PropTypes.number.isRequired,
  DEX: PropTypes.number.isRequired,
  INT: PropTypes.number.isRequired,
  PSY: PropTypes.number.isRequired,
});

CharacterPanel.propTypes = {
  races: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      modifier: PropTypes.object.isRequired,
    })
  ).isRequired,
  raceId: PropTypes.string.isRequired,
  setRaceId: PropTypes.func.isRequired,
  stats: statShape.isRequired,
  setStat: PropTypes.func.isRequired,
  effective: statShape.isRequired,
  jewelryBonus: statShape.isRequired,
  spent: PropTypes.number.isRequired,
  remain: PropTypes.number.isRequired,
  stamPool: PropTypes.number.isRequired,
  manaPoolV: PropTypes.number.isRequired,
  STAT_POOL: PropTypes.number.isRequired,
  baseHealth: PropTypes.number.isRequired,
  resetStats: PropTypes.func.isRequired,
};
