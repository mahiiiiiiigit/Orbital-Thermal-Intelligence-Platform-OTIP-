import React from 'react';

export function ThermalLegend() {
  return (
    <div className="bg-dark-850/90 border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md min-w-[260px]">
      <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2">
        <span>Thermal Intensity (FRP)</span>
        <span className="text-sky-400 font-mono font-normal">MW Scale</span>
      </div>

      {/* Gradient Bar */}
      <div className="h-2 rounded-full bg-gradient-to-r from-[#3b82f6] via-[#22c55e] via-[#facc15] via-[#f97316] to-[#ef4444] shadow-inner mb-1.5" />

      {/* Labels */}
      <div className="flex justify-between text-[9px] text-slate-400 text-center leading-tight">
        <span>
          Very Low
          <small className="block text-slate-500">&lt;10 MW</small>
        </span>
        <span>
          Low
          <small className="block text-slate-500">25 MW</small>
        </span>
        <span>
          Moderate
          <small className="block text-slate-500">50 MW</small>
        </span>
        <span>
          High
          <small className="block text-slate-500">80 MW</small>
        </span>
        <span>
          Extreme
          <small className="block text-slate-500">&gt;100 MW</small>
        </span>
      </div>
    </div>
  );
}
