import React from "react";

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
