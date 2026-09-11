import React from 'react';
import { TAXONOMY_CLASSES } from '../constants/taxonomy';
import { FrpTrendChart } from './FrpTrendChart';
import { TimelineSlider } from './TimelineSlider';
import { AlertTriangle, Info, Truck, X, Navigation } from 'lucide-react';

export function Sidebar({
  hotspots = [],
  clusters = [],
  alerts = [],
  notice = '',
  filterClass = 'all',
  onSelectFilterClass,
  activeDate,
  stats = { totalHotspots: 0, totalClusters: 0, totalAlerts: 0, avgFrp: 0 },
  timelineDates = [],
  timelineIndex = 0,
  onChangeTimelineIndex,
  activeRoute = null,
  onSetRoute,
  onSelectHotspot,
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

        {/* ACTIVE EMERGENCY DISPATCH ROUTE STATUS */}
        {activeRoute && activeRoute.route && (
          <div className="bg-gradient-to-b from-amber-950/40 to-dark-850 border border-amber-500/50 rounded-lg p-3 space-y-2.5 shadow-lg animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>ACTIVE DISPATCH ROUTE</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                En Route
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="bg-dark-900/90 rounded-md p-2 border border-dark-750 space-y-1">
                <div className="flex justify-between items-start text-[11px]">
                  <span className="text-slate-400">Origin Depot:</span>
                  <span className="font-semibold text-slate-100 text-right truncate max-w-[150px]">
                    {activeRoute.origin_depot?.name || 'Emergency Base'}
                  </span>
                </div>
                <div className="flex justify-between items-start text-[11px]">
                  <span className="text-slate-400">Incident Target:</span>
                  <span className="font-semibold text-slate-100 text-right truncate max-w-[150px]">
                    {activeRoute.target_event?.forest_name || activeRoute.target_event?.facility_name || (activeRoute.target_coords ? `${activeRoute.target_coords.latitude?.toFixed(3)}°N, ${activeRoute.target_coords.longitude?.toFixed(3)}°E` : 'Incident Site')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                <div className="bg-dark-900/90 border border-dark-750 rounded p-1.5 text-center">
                  <span className="text-[9.5px] text-slate-400 block font-sans">Distance</span>
                  <span className="font-bold text-emerald-400 text-xs">
                    {activeRoute.route.distance_km} km
                  </span>
                </div>
                <div className="bg-dark-900/90 border border-dark-750 rounded p-1.5 text-center">
                  <span className="text-[9.5px] text-slate-400 block font-sans">Est. Duration</span>
                  <span className="font-bold text-sky-400 text-xs">
                    {activeRoute.route.duration_minutes} min
                  </span>
                </div>
              </div>
            </div>

            {/* Clear Route Button */}
            <button
              type="button"
              onClick={() => onSetRoute && onSetRoute(null)}
              className="w-full py-1.5 px-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-red-200 border border-red-500/40 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Route / Exit Response</span>
            </button>
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

        {/* 4. TIMELINE SCRUBBING SECTION */}
        {timelineDates && timelineDates.length > 0 && (
          <TimelineSlider
            dates={timelineDates}
            currentIndex={timelineIndex}
            onChangeIndex={onChangeTimelineIndex}
          />
        )}
      </div>
    </aside>
  );
}
