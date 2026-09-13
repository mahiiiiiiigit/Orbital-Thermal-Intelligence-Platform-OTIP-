import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Layers, ArrowUpRight, ShieldAlert, Building2, Flame } from 'lucide-react';

export function ClusterGrowthTracker({
  clusters = [],
  onViewFingerprint,
}) {
  // Synthesize cluster expansion trends data if raw list is small
  const clusterData = [
    {
      name: 'Jamnagar Flare Stack',
      state: 'Gujarat',
      detections: 48,
      areaKm2: 8.4,
      growthPct: '+18.2%',
      growthRate: 18.2,
      status: 'ACCELERATING',
      frp: 210.4,
      classification: 'GAS_FLARE',
    },
    {
      name: 'Simlipal Forest Core',
      state: 'Odisha',
      detections: 36,
      areaKm2: 14.2,
      growthPct: '+42.5%',
      growthRate: 42.5,
      status: 'CRITICAL_SPREAD',
      frp: 340.8,
      classification: 'WILDFIRE',
    },
    {
      name: 'Jamshedpur Smelter Hub',
      state: 'Jharkhand',
      detections: 30,
      areaKm2: 5.6,
      growthPct: '+4.1%',
      growthRate: 4.1,
      status: 'STABLE',
      frp: 135.2,
      classification: 'PERSISTENT_INDUSTRIAL',
    },
    {
      name: 'Singrauli Thermal Power',
      state: 'Madhya Pradesh',
      detections: 24,
      areaKm2: 6.8,
      growthPct: '+8.9%',
      growthRate: 8.9,
      status: 'MODERATE',
      frp: 168.0,
      classification: 'PERSISTENT_INDUSTRIAL',
    },
    {
      name: 'Sangrur Biomass Cluster',
      state: 'Punjab',
      detections: 18,
      areaKm2: 12.0,
      growthPct: '-12.4%',
      growthRate: -12.4,
      status: 'COOLING',
      frp: 62.5,
      classification: 'AGRICULTURE',
    },
  ];

  // Timeline growth series for the top clusters
  const growthTimeline = [
    { week: 'Wk 1', Jamnagar: 22, Simlipal: 8, Jamshedpur: 28, Singrauli: 19 },
    { week: 'Wk 2', Jamnagar: 28, Simlipal: 14, Jamshedpur: 29, Singrauli: 20 },
    { week: 'Wk 3', Jamnagar: 36, Simlipal: 24, Jamshedpur: 27, Singrauli: 22 },
    { week: 'Wk 4', Jamnagar: 48, Simlipal: 36, Jamshedpur: 30, Singrauli: 24 },
  ];

  const CustomGrowthTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a]/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-mono min-w-[180px]">
          <div className="text-slate-400 font-semibold mb-2 pb-1 border-b border-slate-700/60">
            {label} Detection Count
          </div>
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 text-slate-300 py-0.5">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-bold text-white">{entry.value} detections</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#111722]/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Industrial Cluster Expansion & Growth Velocity</span>
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Tracking spatial footprint dilation and detection velocity across persistent high-heat facilities
          </p>
        </div>

        <div className="text-xs font-mono text-purple-300 bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-800/40">
          5 Monitored Persistent Zones
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        
        {/* Left: Progression Chart (7 cols) */}
        <div className="lg:col-span-7 flex flex-col min-h-[220px]">
          <span className="text-[10px] font-mono text-slate-400 uppercase mb-2">
            4-Week Detection Trajectory (Hotspot Frequency)
          </span>
          <div className="w-full h-[210px]">
            <ResponsiveContainer width="100%" height={210}>
              <ComposedChart data={growthTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="week" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomGrowthTooltip />} />
                <Line type="monotone" dataKey="Jamnagar" name="Jamnagar" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Simlipal" name="Simlipal" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Jamshedpur" name="Jamshedpur" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="Singrauli" name="Singrauli" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Leaderboard & Expansion Status Table (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase">
            Cluster Expansion Velocity
          </span>

          <div className="space-y-2">
            {clusterData.map((cluster) => {
              const isCritical = cluster.status === 'CRITICAL_SPREAD';
              const isAccelerating = cluster.status === 'ACCELERATING';

              return (
                <div
                  key={cluster.name}
                  onClick={() => onViewFingerprint && onViewFingerprint(cluster.name)}
                  className="bg-dark-900/90 hover:bg-dark-850 p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">{cluster.name}</span>
                      <span className="text-[10px] text-slate-400">({cluster.state})</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span>Area: <strong className="text-slate-200">{cluster.areaKm2} km²</strong></span>
                      <span>•</span>
                      <span>Detections: <strong className="text-orange-400">{cluster.detections}</strong></span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isCritical
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                          : isAccelerating
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {cluster.growthPct}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
