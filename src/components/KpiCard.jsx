import React from "react";

// Recommended baseline inside your KpiCard component
const KpiCard = ({ title, value, subtext, icon, color }) => {
  return (
    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {title}
        </p>
        <p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
        {subtext && (
          <p className="text-[11px] text-slate-400 mt-0.5">{subtext}</p>
        )}
      </div>
      <div
        className={`p-2.5 rounded-xl bg-${color}-50 text-${color}-600 shrink-0`}
      >
        {icon}
      </div>
    </div>
  );
};

export default KpiCard;
