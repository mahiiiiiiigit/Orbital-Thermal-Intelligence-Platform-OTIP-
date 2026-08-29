import React from 'react';
import { TAXONOMY_CLASSES, TAXONOMY_COLORS } from '../constants/taxonomy';
import { HotspotCard } from './HotspotCard';
import { ClusterCard } from './ClusterCard';
import { AlertCard } from './AlertCard';
import { FrpTrendChart } from './FrpTrendChart';
import { Activity, Flame, Factory, ShieldAlert, Filter, TrendingUp, Info } from 'lucide-react';

export function Sidebar({
  hotspots = [],
  clusters = [],
  alerts = [],
  selectedHotspot,
  selectedCluster,
  activeRoute = null,
  onSetRoute,
  onOpenResponsePanel,
  mode = 'auto',
  notice = '',
  filterClass = 'all',
  onSelectFilterClass,
  activeDate,
  stats = { totalHotspots: 0, totalClusters: 0, totalAlerts: 0, avgFrp: 0 },
}) {
  // Count per taxonomy class
  const classCounts = React.useMemo(() => {
    const counts = { all: hotspots.length };
    hotspots.forEach((h) => {
      const cls = h.classification || 'UNCLASSIFIED';
      counts[cls] = (counts[cls] || 0) + 1;
    });
    return counts;
  }, [hotspots]);

  return (
    <aside className="w-96 bg-slate-50/95 dark:bg-dark-900/95 border-r border-slate-200 dark:border-slate-800/80 flex flex-col h-[calc(100vh-4rem)] select-none overflow-hidden z-20 transition-colors duration-200">
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stream Telemetry Status Notice */}
        {notice && (
          <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-sky-800 dark:text-sky-200">
            <Info className="w-4 h-4 text-sky-500 dark:text-sky-400 flex-shrink-0 mt-0.5" />
            <p className="leading-snug">{notice}</p>
          </div>
        )}

        {/* Top KPI Telemetry Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-dark-850/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Hotspots</span>
              <Flame className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            </div>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">{stats.totalHotspots}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Orbital Detections</span>
          </div>

          <div className="bg-white dark:bg-dark-850/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Clusters</span>
              <Factory className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
            </div>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">{stats.totalClusters}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Persistent Sources</span>
          </div>

          <div className="bg-white dark:bg-dark-850/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Spikes</span>
              <ShieldAlert className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
            </div>
            <span className="text-xl font-extrabold text-red-500 dark:text-red-400 font-mono">{stats.totalAlerts}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">&gt;3σ Critical Alerts</span>
          </div>

          <div className="bg-white dark:bg-dark-850/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Mean Radiance</span>
              <Activity className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            </div>
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-300 font-mono">{stats.avgFrp?.toFixed(1)}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Megawatts (MW)</span>
          </div>
        </div>

        {/* 7-Class Taxonomy Filter & Legend */}
        <div className="bg-white dark:bg-dark-850/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              <span>Taxonomy Filter</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">7 SIH Classes</span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {TAXONOMY_CLASSES.map((cls) => {
              const isActive = filterClass === cls.id;
              const count = classCounts[cls.id] || 0;
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => onSelectFilterClass(cls.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-sky-100 dark:bg-sky-600/30 text-sky-900 dark:text-white border border-sky-300 dark:border-sky-500/60 shadow-sm'
                      : 'bg-slate-100 dark:bg-dark-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {cls.id !== 'all' && (
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cls.color }} />
                  )}
                  <span>{cls.label}</span>
                  <span className="font-mono text-[10px] opacity-80 bg-slate-200 dark:bg-dark-900/80 px-1 py-0.2 rounded">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Hotspot Deep Dive Card */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            <Activity className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            <span>Inspection Telemetry</span>
          </div>
          <HotspotCard
            hotspot={selectedHotspot}
            activeRoute={activeRoute}
            onSetRoute={onSetRoute}
            onOpenResponsePanel={onOpenResponsePanel}
          />
        </div>

        {/* FRP Radiance Trend Chart */}
        <div className="bg-white dark:bg-dark-850/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              <span>Daily Radiance Trend</span>
            </div>
            <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono">MW Mean</span>
          </div>
          <FrpTrendChart hotspots={hotspots} activeDate={activeDate} />
        </div>

        {/* Anomaly Spike Card */}
        {alerts.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
              <span>Critical Anomaly</span>
            </div>
            <AlertCard alerts={alerts} />
          </div>
        )}

        {/* Focused Persistent Cluster Card */}
        {selectedCluster && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-300 uppercase tracking-wider mb-2">
              <Factory className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
              <span>Persistent Cluster</span>
            </div>
            <ClusterCard cluster={selectedCluster} mode={mode} />
          </div>
        )}
      </div>
    </aside>
  );
}
