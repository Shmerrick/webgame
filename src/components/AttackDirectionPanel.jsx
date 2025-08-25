import React from "react";

const DIRECTIONS = ["Left", "Right", "Up", "Down"];

export default function AttackDirectionPanel({ weapon, direction, setDirection, charge, setCharge, swing, setSwing }) {
  if (!weapon || weapon.type === 'mounted') return null;

  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg">
      <h2 className="text-lg font-semibold mb-3">Attack Direction</h2>
      {weapon.type === 'melee' && (
        <div className="mb-3">
          <div className="grid grid-cols-1 gap-2">
            {DIRECTIONS.map(d => (
              <button
                key={d}
                onClick={() => setDirection(d)}
                className={`w-full px-3 py-2 text-sm rounded-lg border ${direction === d ? 'border-emerald-400 bg-emerald-400/10' : 'border-slate-700'}`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="text-sm text-slate-300 mt-1">
            Each direction selects a different type of damage for your weapon. For example, the downward direction with a sword is a piercing thrust.
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span>Charge Time</span>
            <span className="tabular-nums">{charge.toFixed(2)} seconds</span>
          </div>
          <input
            type="range"
            min={0}
            max={1.5}
            step={0.01}
            value={charge}
            onChange={e => setCharge(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="text-sm text-slate-300 mt-1">
            If your charge time is one and a half seconds, the attack is a heavy attack and costs twice as much stamina.
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-sm">
            <span>Swing Completion</span>
            <span className="tabular-nums">{(swing * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={swing}
            onChange={e => setSwing(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="text-sm text-slate-300 mt-1">
            If your swing completion is below sixty percent, your attack does no damage. Otherwise damage scales with completion.
          </div>
        </div>
      </div>
    </section>
  );
}

