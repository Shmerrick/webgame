import React from "react";
import PropTypes from "prop-types";

export default function Tooltip({ text, children }) {
  return (
    <span className="relative group inline-block">
      {children}
      <span className="absolute hidden group-hover:block bottom-full mb-2 w-max px-2 py-1 bg-slate-900 text-white text-xs rounded-md border border-slate-700 shadow-lg">
        {text}
      </span>
    </span>
  );
}

Tooltip.propTypes = {
  text: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};
