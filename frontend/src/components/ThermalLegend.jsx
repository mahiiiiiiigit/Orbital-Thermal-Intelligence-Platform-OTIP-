import React, { useState } from 'react';
import { FFDR_CATEGORIES } from '../constants/taxonomy';
import { Trees, Flame, Activity, ChevronDown, ChevronUp } from 'lucide-react';

export function ThermalLegend({ mode = 'thermal' }) {
  const [collapsed, setCollapsed] = useState(false);

  if (mode === 'forest_risk') {
    if (collapsed) {
      return (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="bg-dark-950/95 border border-dark-800 rounded-xl px-3 py-1.5 shadow-2xl backdrop-blur-xl flex items-center gap-2 text-slate-200 select-none shadow-black/70 hover:border-emerald-500/40 transition-colors cursor-pointer"
          title="Expand FSI Legend"
        >
          <Trees className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-mono font-bold text-emerald-400">FSI Risk Grid</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
      );
    }

    return (
      <div className="bg-dark-950/90 border border-dark-800 rounded-xl p-3 shadow-2xl backdrop-blur-xl min-w-[280px] text-slate-200 select-none shadow-black/70">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider mb-2 font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Trees className="w-3.5 h-3.5" />
            <span>FSI Fire Danger Rating</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30 text-[9px]">5km FWI</span>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="text-slate-500 hover:text-slate-300 p-0.5 rounded cursor-pointer"
              title="Minimize Legend"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5-Category Color Segments */}
        <div className="grid grid-cols-5 gap-1 mb-2">
          {FFDR_CATEGORIES.map((cat) => (
            <div key={cat.id} className="text-center">
              <div
                className="h-2 rounded-sm mb-1 shadow-sm"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-[9px] font-bold text-slate-300 block truncate font-mono">
                {cat.label}
              </span>
            </div>
          ))}
        </div>

        <div className="text-[9px] font-mono text-slate-400 flex justify-between items-center pt-1 border-t border-dark-800">
          <span>Forest Survey of India</span>
          <span>Active Grid</span>
        </div>
      </div>
    );
  }

  // Default Thermal FRP Intensity Legend (Neon Yellow -> Orange -> Red -> Crimson)
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="bg-dark-950/95 border border-dark-800 rounded-xl px-3 py-1.5 shadow-2xl backdrop-blur-xl flex items-center gap-2 text-slate-200 select-none shadow-black/70 hover:border-orange-500/40 transition-colors cursor-pointer"
        title="Expand Thermal Legend"
      >
        <Flame className="w-3.5 h-3.5 text-orange-400" />
        <span className="text-[10px] font-mono font-bold text-orange-400">FRP Legend</span>
        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
      </button>
    );
  }

  return (
    <div className="bg-dark-950/90 border border-dark-800 rounded-xl p-3 shadow-2xl backdrop-blur-xl min-w-[270px] text-slate-200 select-none shadow-black/70">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider mb-2 font-mono">
        <div className="flex items-center gap-1 text-orange-400">
          <Flame className="w-3.5 h-3.5" />
          <span>Thermal Density (FRP)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-orange-400 bg-orange-500/10 px-1.5 py-0.2 rounded border border-orange-500/30 text-[9px]">MW Scale</span>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="text-slate-500 hover:text-slate-300 p-0.5 rounded cursor-pointer"
            title="Minimize Legend"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Neon Gradient Bar */}
      <div className="h-2 rounded-full bg-gradient-to-r from-[#fde047] via-[#fb923c] via-[#f97316] via-[#ef4444] to-[#b91c1c] shadow-inner mb-1.5 border border-dark-800" />

      {/* Labels */}
      <div className="flex justify-between text-[9px] font-mono text-slate-400 text-center leading-tight">
        <span>
          Low
          <small className="block text-slate-500">&lt;10 MW</small>
        </span>
        <span>
          Moderate
          <small className="block text-slate-500">30 MW</small>
        </span>
        <span>
          High
          <small className="block text-slate-500">60 MW</small>
        </span>
        <span>
          Severe
          <small className="block text-slate-500">90 MW</small>
        </span>
        <span>
          Extreme
          <small className="block text-orange-400 font-bold">&gt;120 MW</small>
        </span>
      </div>
    </div>
  );
}


