import React, { useState } from 'react';
import { TAXONOMY_CLASSES } from '../constants/taxonomy';
import { FrpTrendChart } from './FrpTrendChart';
import { TimelineSlider } from './TimelineSlider';
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
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  Filter,
  Gauge,
  Compass,
  Radar
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
  isCollapsed = false,
  onToggleCollapse,
  timelineDates = [],
  timelineIndex = 0,
  onChangeTimelineIndex,
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

  if (isCollapsed) {
    return (
      <aside className="w-14 bg-dark-950/95 border-r border-dark-800 flex flex-col items-center py-3 select-none z-20 backdrop-blur-xl transition-all duration-300">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-2 rounded-lg bg-dark-900 border border-dark-800 text-orange-400 hover:text-orange-300 hover:bg-dark-850 transition-colors mb-4 cursor-pointer"
          title="Expand Intelligence Panel"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-2 rounded-lg bg-dark-900 border border-dark-800 text-slate-300" title={`Total Hotspots: ${stats.totalHotspots}`}>
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-[10px] font-mono font-bold mt-1 block">{stats.totalHotspots}</span>
          </div>

          <div className="p-2 rounded-lg bg-dark-900 border border-dark-800 text-slate-300" title={`Clusters: ${stats.totalClusters}`}>
            <Radar className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono font-bold mt-1 block">{stats.totalClusters}</span>
          </div>

          <div className="p-2 rounded-lg bg-dark-900 border border-dark-800 text-slate-300" title={`Critical Alerts: ${stats.totalAlerts}`}>
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-[10px] font-mono font-bold mt-1 block text-red-400">{stats.totalAlerts}</span>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 md:w-80 bg-dark-950/95 border-r border-dark-800 flex flex-col h-full select-none overflow-hidden z-20 backdrop-blur-xl shadow-2xl transition-all duration-300">
      
      {/* Sidebar Header / Live Stream Status */}
      <div className="h-12 px-3.5 border-b border-dark-800 flex items-center justify-between bg-dark-900/80">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono">
            Spatial Intelligence
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
            STREAM ACTIVE
          </span>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-dark-800 transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        
        {/* Stream Notice */}
        {notice && (
          <div className="bg-sky-500/10 border border-sky-500/25 rounded-xl p-2.5 flex items-start gap-2 text-xs text-sky-300 shadow-sm">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-tight font-medium">{notice}</p>
          </div>
        )}

        {/* 1. OVERVIEW TELEMETRY KPIS */}
        <div className="bg-dark-900/90 border border-dark-800 rounded-xl p-3.5 space-y-2.5 shadow-md">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            <span>Mission Telemetry Summary</span>
            <Activity className="w-3.5 h-3.5 text-sky-400" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Total Hotspots */}
            <div className="p-2.5 rounded-lg bg-dark-950/80 border border-dark-800">
              <span className="text-xl font-black text-slate-100 font-mono tracking-tight block">
                {stats.totalHotspots}
              </span>
              <span className="text-[10px] text-slate-400 font-medium block">
                Active Hotspots
              </span>
            </div>

            {/* Active Clusters */}
            <div className="p-2.5 rounded-lg bg-dark-950/80 border border-dark-800">
              <span className="text-xl font-black text-cyan-400 font-mono tracking-tight block">
                {stats.totalClusters}
              </span>
              <span className="text-[10px] text-slate-400 font-medium block">
                Spatial Clusters
              </span>
            </div>

            {/* Critical Events */}
            <div className="p-2.5 rounded-lg bg-dark-950/80 border border-red-500/30">
              <div className="flex items-center gap-1">
                <span className="text-xl font-black text-red-500 font-mono tracking-tight">
                  {stats.totalAlerts}
                </span>
                {stats.totalAlerts > 0 && (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                )}
              </div>
              <span className="text-[10px] text-red-400 font-medium block leading-tight">
                Critical Spikes
              </span>
            </div>

            {/* Mean Radiance */}
            <div className="p-2.5 rounded-lg bg-dark-950/80 border border-orange-500/30">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-orange-400 font-mono tracking-tight">
                  {stats.avgFrp > 0 ? stats.avgFrp.toFixed(1) : '0.0'}
                </span>
                <span className="text-[10px] text-orange-400 font-mono font-bold">MW</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block">
                Mean Radiance
              </span>
            </div>
          </div>
        </div>

        {/* 2. TEMPORAL PLAYBACK CONTROL */}
        {timelineDates && timelineDates.length > 0 && (
          <TimelineSlider
            dates={timelineDates}
            currentIndex={timelineIndex}
            onChangeIndex={onChangeTimelineIndex}
          />
        )}

        {/* 3. DETECTION FILTERS (Category & 7-Class Taxonomy) */}
        <div className="bg-dark-900/90 border border-dark-800 rounded-xl p-3.5 space-y-2.5 shadow-md">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            <span>Taxonomy Classification</span>
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
                      ? 'bg-dark-800 text-white font-semibold border border-sky-500/40 shadow-sm'
                      : 'text-slate-300 hover:bg-dark-850 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}80` }}
                    />
                    <span className="truncate text-xs">{cls.label}</span>
                  </div>
                  <span
                    className={`font-mono text-[10.5px] font-bold px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'text-slate-400 bg-dark-950/80 border border-dark-800'
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
              Reset Category Filter
            </button>
          )}
        </div>

        {/* 4. 7-DAY RADIATIVE POWER TREND */}
        <div className="bg-dark-900/90 border border-dark-800 rounded-xl p-3.5 space-y-2 shadow-md">
          <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            <span>7-Day FRP Radiance Trend</span>
            <span className="text-[9px] font-mono text-orange-400 font-bold">MW Mean</span>
          </div>
          <FrpTrendChart hotspots={hotspots} activeDate={activeDate} />
        </div>

      </div>

      {/* Sidebar Footer / Orbital Telemetry Details */}
      <div className="h-10 px-3.5 border-t border-dark-800 bg-dark-900/90 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1 text-slate-300">
          <Compass className="w-3 h-3 text-sky-400" />
          <span>NASA FIRMS</span>
        </span>
        <span className="text-slate-400">NRT VIIRS/MODIS</span>
      </div>

    </aside>
  );
}

