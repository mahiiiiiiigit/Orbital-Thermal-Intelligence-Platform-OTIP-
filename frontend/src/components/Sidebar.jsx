import React, { useState } from 'react';
import { TAXONOMY_CLASSES } from '../constants/taxonomy';
import { FrpTrendChart } from './FrpTrendChart';
import { 
  AlertTriangle, 
  Info, 
  Flame, 
  Radio, 
  Sliders, 
  Factory, 
  Trees, 
  Activity, 
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';

export function Sidebar({
  hotspots = [],
  clusters = [],
  alerts = [],
  notice = '',
  filterClass = 'all',
  onSelectFilterClass,
  minFrp = 0,
  onSelectMinFrp,
  activeDate,
  stats = { totalHotspots: 0, totalClusters: 0, totalAlerts: 0, avgFrp: 0 },
}) {
  // Compute counts per taxonomy class
  const classCounts = React.useMemo(() => {
    const counts = { all: hotspots.length };
    hotspots.forEach((h) => {
      const cls = h.classification || 'UNCLASSIFIED';
      counts[cls] = (counts[cls] || 0) + 1;
    });
    return counts;
  }, [hotspots]);

  return (
    <aside className="w-72 md:w-80 bg-dark-900 border-r border-dark-700 flex flex-col h-full select-none overflow-hidden z-20 transition-colors duration-200">
      
      {/* Sidebar Header / Live Stream Status */}
      <div className="h-12 px-3.5 border-b border-dark-700 flex items-center justify-between bg-dark-850">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
            Spatial Telemetry
          </span>
        </div>
        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
          STREAM ACTIVE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        
        {/* Stream Notice */}
        {notice && (
          <div className="bg-sky-500/10 border border-sky-500/25 rounded-xl p-2.5 flex items-start gap-2 text-xs text-sky-300">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-tight font-medium">{notice}</p>
          </div>
        )}

        {/* 1. OVERVIEW TELEMETRY KPIS */}
        <div className="bg-dark-850 border border-dark-700/80 rounded-xl p-3.5 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            <span>Operations Telemetry</span>
            <Activity className="w-3.5 h-3.5 text-sky-400" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Total Hotspots */}
            <div className="p-2.5 rounded-lg bg-dark-900 border border-dark-700/60">
              <span className="text-xl font-black text-slate-100 font-mono tracking-tight block">
                {stats.totalHotspots}
              </span>
              <span className="text-[10.5px] text-slate-400 font-medium block">
                Active Hotspots
              </span>
            </div>

            {/* Active Clusters */}
            <div className="p-2.5 rounded-lg bg-dark-900 border border-dark-700/60">
              <span className="text-xl font-black text-cyan-400 font-mono tracking-tight block">
                {stats.totalClusters}
              </span>
              <span className="text-[10.5px] text-slate-400 font-medium block">
                Spatial Clusters
              </span>
            </div>

            {/* Critical Events */}
            <div className="p-2.5 rounded-lg bg-dark-900 border border-red-500/30">
              <div className="flex items-center gap-1">
                <span className="text-xl font-black text-red-500 font-mono tracking-tight">
                  {stats.totalAlerts}
                </span>
                {stats.totalAlerts > 0 && (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                )}
              </div>
              <span className="text-[10.5px] text-red-400 font-medium block leading-tight">
                Critical Spikes
              </span>
            </div>

            {/* Mean Radiance */}
            <div className="p-2.5 rounded-lg bg-dark-900 border border-orange-500/30">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-orange-400 font-mono tracking-tight">
                  {stats.avgFrp > 0 ? stats.avgFrp.toFixed(1) : '0.0'}
                </span>
                <span className="text-[10px] text-orange-400 font-mono font-bold">MW</span>
              </div>
              <span className="text-[10.5px] text-slate-400 font-medium block">
                Mean Radiance
              </span>
            </div>
          </div>
        </div>

        {/* 2. DETECTION FILTERS (Category & Taxonomy) */}
        <div className="bg-dark-850 border border-dark-700/80 rounded-xl p-3.5 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            <span>Detection Taxonomy</span>
            <Layers className="w-3.5 h-3.5 text-orange-400" />
          </div>

          <div className="space-y-1">
            {TAXONOMY_CLASSES.map((cls) => {
              const isSelected = filterClass === cls.id;
              const count = classCounts[cls.id] || 0;
              const color = cls.color || '#38bdf8';

              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => onSelectFilterClass(cls.id)}
                  className={`w-full py-1.5 px-2.5 rounded-lg flex items-center justify-between text-xs transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-dark-750 text-white font-semibold border border-sky-500/40 shadow-sm'
                      : 'text-slate-300 hover:bg-dark-800 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate text-xs">{cls.label}</span>
                  </div>
                  <span
                    className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-sky-500/20 text-sky-300'
                        : 'text-slate-400 bg-dark-900/60'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Reset Filters */}
          {filterClass !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectFilterClass('all')}
              className="w-full py-1.5 text-center text-xs font-semibold text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg transition-colors cursor-pointer"
            >
              Reset Taxonomy Filter
            </button>
          )}
        </div>

        {/* 3. 7-DAY RADIATIVE POWER TREND */}
        <div className="bg-dark-850 border border-dark-700/80 rounded-xl p-3.5 space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            <span>7-Day FRP Radiance Trend</span>
            <span className="text-[9px] font-mono text-orange-400 font-bold">MW Mean</span>
          </div>
          <FrpTrendChart hotspots={hotspots} activeDate={activeDate} />
        </div>

      </div>

      {/* Sidebar Footer */}
      <div className="h-10 px-3.5 border-t border-dark-700 bg-dark-850 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>NASA FIRMS NRT</span>
        <span className="text-slate-300">MODIS & VIIRS</span>
      </div>

    </aside>
  );
}
