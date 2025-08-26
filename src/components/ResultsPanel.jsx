import React from 'react';
import PropTypes from 'prop-types';

export default function ResultsPanel({ totalLoadoutWeight, maximumLoadoutWeight, loadoutWeightRatio, category, missingPieces, regenStam, regenMana, nakedOverride }) {
  const penalty = missingPieces * 15;
  const penaltyDisplay = penalty > 0 ? `-${penalty}%` : "0%";
  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg">
      <h2 className="text-lg font-semibold mb-3">Results</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-800/70 rounded-xl p-3">
          <div className="text-slate-300 font-medium">Loadout Score</div>
          <div className="text-sm">Total Loadout Weight equals the sum of each slot’s weight factor multiplied by the numeric value of its armor class. Maximum Loadout Weight is the same calculation as if every slot were Heavy. The Loadout Ratio equals Total divided by Maximum and determines your category.</div>
          <div className="text-lg tabular-nums mt-1">Total = {totalLoadoutWeight} / Maximum = {maximumLoadoutWeight} (Loadout Ratio = {(Math.abs(loadoutWeightRatio) * 100).toFixed(1)}%)</div>
          <div className="text-slate-300 mt-1">Category: <span className="font-semibold">{nakedOverride ? "Naked Override (no armor equipped)" : category}</span></div>
        </div>
        <div className="bg-slate-800/70 rounded-xl p-3">
          <div className="text-slate-300 font-medium">Missing Armor Penalty</div>
          <div className="text-sm">Each missing armor piece reduces your outgoing damage by fifteen percent. If you are completely naked and unshielded, there is a special rule that sets your regeneration to the naked rate and reduces your outgoing damage by seventy-five percent.</div>
          <div className="text-lg tabular-nums mt-1">Total outgoing damage penalty from missing pieces: {penaltyDisplay}</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-800/70 rounded-xl p-3">
          <div className="text-slate-300 font-medium">Stamina Regeneration</div>
          <div className="text-2xl tabular-nums">{regenStam}</div>
          <div className="text-sm text-slate-300 mt-1">Regeneration ticks occur every two seconds and are ten percent of the pool multiplied by your loadout multiplier and increased by up to ten percent from Armor Training.</div>
        </div>
        <div className="bg-slate-800/70 rounded-xl p-3">
          <div className="text-slate-300 font-medium">Mana Regeneration</div>
          <div className="text-2xl tabular-nums">{regenMana}</div>
          <div className="text-sm text-slate-300 mt-1">Armor class reduces both stamina and mana regeneration using the same multipliers.</div>
        </div>
      </div>
    </section>
  );
}

ResultsPanel.propTypes = {
  totalLoadoutWeight: PropTypes.number.isRequired,
  maximumLoadoutWeight: PropTypes.number.isRequired,
  loadoutWeightRatio: PropTypes.number.isRequired,
  category: PropTypes.string.isRequired,
  missingPieces: PropTypes.number.isRequired,
  regenStam: PropTypes.number.isRequired,
  regenMana: PropTypes.number.isRequired,
  nakedOverride: PropTypes.bool,
};

ResultsPanel.defaultProps = {
  nakedOverride: false,
};
