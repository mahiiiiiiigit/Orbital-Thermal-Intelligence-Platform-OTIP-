import React from 'react';
import { FFDR_CATEGORIES } from '../constants/taxonomy';
import { Trees, Flame } from 'lucide-react';

export function ThermalLegend({ mode = 'thermal' }) {
  if (mode === 'forest_risk') {
    return (
      <div className="bg-white/95 dark:bg-dark-850/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xl backdrop-blur-md min-w-[280px] transition-colors duration-200">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
          <div className="flex items-center gap-1.5">
            <Trees className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Forest Fire Danger Rating (FSI)</span>
          </div>
          <span className="text-emerald-700 dark:text-emerald-400 font-mono font-normal text-[9px]">5km FWI</span>
        </div>

        {/* 5-Category Color Segments */}
        <div className="grid grid-cols-5 gap-1 mb-2">
          {FFDR_CATEGORIES.map((cat) => (
            <div key={cat.id} className="text-center">
              <div
                className="h-2 rounded-sm mb-1 shadow-sm"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 block truncate">
                {cat.label}
              </span>
            </div>
          ))}
        </div>

        <div className="text-[9px] text-slate-500 dark:text-slate-400 flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800">
          <span>Source: Forest Survey of India</span>
          <span className="font-mono">Weekly Bulletin</span>
        </div>
      </div>
    );
  }

  // Default Thermal FRP Intensity Legend
  return (
    <div className="bg-white/95 dark:bg-dark-850/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md min-w-[260px] transition-colors duration-200">
      <div className="flex justify-between items-center text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
        <div className="flex items-center gap-1">
          <Flame className="w-3 h-3 text-sky-500 dark:text-sky-400" />
          <span>Thermal Intensity (FRP)</span>
        </div>
        <span className="text-sky-600 dark:text-sky-400 font-mono font-normal">MW Scale</span>
      </div>

      {/* Gradient Bar */}
      <div className="h-2 rounded-full bg-gradient-to-r from-[#3b82f6] via-[#22c55e] via-[#facc15] via-[#f97316] to-[#ef4444] shadow-inner mb-1.5" />

      {/* Labels */}
      <div className="flex justify-between text-[9px] text-slate-500 dark:text-slate-400 text-center leading-tight">
        <span>
          Very Low
          <small className="block text-slate-400 dark:text-slate-500">&lt;10 MW</small>
        </span>
        <span>
          Low
          <small className="block text-slate-400 dark:text-slate-500">25 MW</small>
        </span>
        <span>
          Moderate
          <small className="block text-slate-400 dark:text-slate-500">50 MW</small>
        </span>
        <span>
          High
          <small className="block text-slate-400 dark:text-slate-500">80 MW</small>
        </span>
        <span>
          Extreme
          <small className="block text-slate-400 dark:text-slate-500">&gt;100 MW</small>
        </span>
      </div>
    </div>
  );
}
