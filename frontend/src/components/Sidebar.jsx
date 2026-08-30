import React from 'react';
import { TAXONOMY_CLASSES } from '../constants/taxonomy';
import { FrpTrendChart } from './FrpTrendChart';
import { Activity, Flame, Factory, ShieldAlert, Filter, TrendingUp, Info, ChevronRight } from 'lucide-react';
import { RiskBadge } from './RiskBadge';

export function Sidebar({
  hotspots = [],
  clusters = [],
  alerts = [],
  selectedCluster,
  onSelectCluster,
  onSelectHotspot,
  notice = '',
  filterClass = 'all',
  onSelectFilterClass,
  activeDate,
  stats = { totalHotspots: 0, totalClusters: 0, totalAlerts: 0, avgFrp: 0 },
  onViewFingerprint,
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
    <aside className="w-80 bg-slate-50 dark:bg-dark-900 border-r border-slate-200 dark:border-dark-700/80 flex flex-col h-[calc(100vh-3.5rem)] select-none overflow-hidden z-20 transition-colors duration-200">
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Stream Telemetry Status Notice */}
        {notice && (
          <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-2.5 flex items-start gap-2 text-xs text-sky-800 dark:text-sky-200">
            <Info className="w-3.5 h-3.5 text-sky-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-tight font-medium">{notice}</p>
          </div>
        )}

        {/* Top 4 KPI Metrics Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Hotspots */}
          <div className="bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700/80 rounded-xl p-2.5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider">Hotspots</span>
              <Flame className="w-3.5 h-3.5 text-sky-500" />
            </div>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">{stats.totalHotspots}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Detections</span>
          </div>

          {/* Clusters */}
          <div className="bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700/80 rounded-xl p-2.5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider">Clusters</span>
              <Factory className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">{stats.totalClusters}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Persistent Sites</span>
          </div>

          {/* Critical Spikes */}
          <div className="bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700/80 rounded-xl p-2.5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider">Spikes</span>
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
            </div>
            <span className="text-lg font-extrabold text-red-500 dark:text-red-400 font-mono">{stats.totalAlerts}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">&gt;3σ Alerts</span>
          </div>

          {/* Mean Radiance */}
          <div className="bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700/80 rounded-xl p-2.5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider">Mean FRP</span>
              <Activity className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <span className="text-lg font-extrabold text-amber-600 dark:text-amber-300 font-mono">
              {stats.avgFrp > 0 ? stats.avgFrp.toFixed(1) : '0.0'}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Megawatts</span>
          </div>
        </div>

        {/* 7-Class Taxonomy Filter Section */}
        <div className="bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700/80 rounded-xl p-3 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <Filter className="w-3 h-3 text-sky-500" />
              <span>Taxonomy Filter</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">7 Classes</span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {TAXONOMY_CLASSES.map((cls) => {
              const isActive = filterClass === cls.id;
              const count = classCounts[cls.id] || 0;
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => onSelectFilterClass(cls.id)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/50 shadow-sm font-semibold'
                      : 'bg-slate-100 dark:bg-dark-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-dark-700/60'
                  }`}
                >
                  {cls.id !== 'all' && (
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cls.color }} />
                  )}
                  <span>{cls.label}</span>
                  <span className="font-mono text-[9px] opacity-75 bg-slate-200 dark:bg-dark-800 px-1 py-0.2 rounded font-bold">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FRP Radiance Trend Sparkline */}
        <div className="bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700/80 rounded-xl p-3 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-sky-500" />
              <span>Daily Radiance Trend</span>
            </div>
            <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono">MW</span>
          </div>
          <FrpTrendChart hotspots={hotspots} activeDate={activeDate} />
        </div>

        {/* Critical Alerts Section */}
        {alerts.length > 0 && (
          <div className="bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700/80 rounded-xl p-3 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-[11px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3 h-3 text-red-500" />
                <span>Critical Anomalies</span>
              </div>
              <span className="text-[10px] font-mono bg-red-500/20 text-red-400 px-1.5 py-0.2 rounded font-bold">
                {alerts.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {alerts.slice(0, 3).map((alt, idx) => (
                <div
                  key={alt.id || idx}
                  onClick={() => onSelectHotspot && onSelectHotspot(alt)}
                  className="p-2 rounded-lg bg-red-500/10 border border-red-500/25 hover:border-red-500/50 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="truncate pr-2">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {alt.facility_name || 'Industrial Facility'}
                    </div>
                    <div className="text-[10px] text-red-600 dark:text-red-300 font-mono">
                      {alt.current_frp} MW • +{alt.z_score?.toFixed(1)}σ
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Persistent Clusters Section */}
        {clusters.length > 0 && (
          <div className="bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700/80 rounded-xl p-3 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <Factory className="w-3 h-3 text-purple-500" />
                <span>Persistent Clusters</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                {clusters.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {clusters.map((c) => {
                const isSelected = selectedCluster?.cluster_id === c.cluster_id;
                return (
                  <div
                    key={c.cluster_id}
                    onClick={() => onSelectCluster && onSelectCluster(c)}
                    className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-500/15 border-purple-500/50 shadow-sm'
                        : 'bg-slate-100/70 dark:bg-dark-900/60 border-slate-200 dark:border-dark-700/50 hover:border-purple-500/40'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {c.facility_name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono">{c.detection_count} detections</span>
                        <span>•</span>
                        <span className="font-mono font-medium text-amber-600 dark:text-amber-400">{c.mean_frp?.toFixed(1)} MW</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {c.risk_level && <RiskBadge level={c.risk_level} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
