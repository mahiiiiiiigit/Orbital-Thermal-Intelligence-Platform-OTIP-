import React from 'react';
import { TAXONOMY_CLASSES } from '../constants/taxonomy';
import { FrpTrendChart } from './FrpTrendChart';
import { AlertTriangle, Info } from 'lucide-react';

export function Sidebar({
  hotspots = [],
  clusters = [],
  alerts = [],
  notice = '',
  filterClass = 'all',
  onSelectFilterClass,
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
    <aside className="w-72 md:w-80 bg-dark-900 border-r border-dark-700 flex flex-col h-[calc(100vh-3.5rem)] select-none overflow-hidden z-20 transition-colors duration-200">
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {/* Stream Telemetry Status Notice (if any) */}
        {notice && (
          <div className="bg-sky-500/10 border border-sky-500/25 rounded-lg p-2 flex items-start gap-1.5 text-xs text-sky-300">
            <Info className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] leading-tight font-medium">{notice}</p>
          </div>
        )}

        {/* 1. OVERVIEW SECTION */}
        <div className="bg-dark-850 border border-dark-700/80 rounded-lg p-3 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            OVERVIEW
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Total Hotspots */}
            <div>
              <span className="text-xl font-black text-slate-100 font-mono tracking-tight block">
                {stats.totalHotspots}
              </span>
              <span className="text-[10.5px] text-slate-400 font-medium block">
                Total Hotspots
              </span>
            </div>

            {/* Active Clusters */}
            <div>
              <span className="text-xl font-black text-slate-100 font-mono tracking-tight block">
                {stats.totalClusters}
              </span>
              <span className="text-[10.5px] text-slate-400 font-medium block">
                Active Clusters
              </span>
            </div>

            {/* Critical Events */}
            <div className="pt-0.5">
              <div className="flex items-center gap-1">
                <span className="text-xl font-black text-red-500 font-mono tracking-tight">
                  {stats.totalAlerts}
                </span>
                {stats.totalAlerts > 0 && (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                )}
              </div>
              <span className="text-[10.5px] text-red-400 font-medium block leading-tight">
                Critical Events
              </span>
              <span className="text-[9px] text-slate-500 block">
                Requires Attention
              </span>
            </div>

            {/* Mean Radiance */}
            <div className="pt-0.5">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-cyan-400 font-mono tracking-tight">
                  {stats.avgFrp > 0 ? stats.avgFrp.toFixed(1) : '0.0'}
                </span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold">MW</span>
              </div>
              <span className="text-[10.5px] text-slate-400 font-medium block">
                Mean Radiance
              </span>
            </div>
          </div>
        </div>

        {/* 2. TREND (7 DAYS) SECTION */}
        <div className="bg-dark-850 border border-dark-700/80 rounded-lg p-3 space-y-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>TREND (7 DAYS)</span>
            <span className="text-[9px] font-mono text-slate-500">MW Mean</span>
          </div>
          <FrpTrendChart hotspots={hotspots} activeDate={activeDate} />
        </div>

        {/* 3. DETECTION FILTERS SECTION */}
        <div className="bg-dark-850 border border-dark-700/80 rounded-lg p-3 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            DETECTION FILTERS
          </div>

          <div className="space-y-0.5">
            {TAXONOMY_CLASSES.map((cls) => {
              const isSelected = filterClass === cls.id;
              const count = classCounts[cls.id] || 0;
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => onSelectFilterClass(cls.id)}
                  className={`w-full py-1 px-2 rounded-md flex items-center justify-between text-xs transition-colors ${
                    isSelected
                      ? 'bg-dark-750 text-white font-semibold'
                      : 'text-slate-300 hover:bg-dark-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cls.color || '#38bdf8' }}
                    />
                    <span className="truncate text-[11px]">{cls.label}</span>
                  </div>
                  <span className="font-mono text-[10.5px] text-slate-400 font-bold ml-2">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Clear Filters Button */}
          {filterClass !== 'all' && (
            <div className="pt-1.5 border-t border-dark-700/60">
              <button
                type="button"
                onClick={() => onSelectFilterClass('all')}
                className="w-full py-1 text-center text-xs font-semibold text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-md transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
