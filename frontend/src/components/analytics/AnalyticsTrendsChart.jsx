import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Sparkles, TrendingUp, AlertTriangle, Layers, Flame, Activity } from 'lucide-react';

export function AnalyticsTrendsChart({
  data = [],
  timeRange = '30D',
  isCompareMode = false,
  regionAName = 'Region A',
  regionBName = 'Region B',
}) {
  // Active metric toggle: 'all' | 'hotspots' | 'frp'
  const [activeMetric, setActiveMetric] = useState('all');

  // Custom Dark SaaS Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a]/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs font-mono min-w-[200px]">
          <div className="text-slate-400 font-semibold mb-2 pb-1.5 border-b border-slate-700/60 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/50">
              {timeRange} WINDOW
            </span>
          </div>

          <div className="space-y-1.5">
            {payload.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-slate-300 capitalize truncate max-w-[120px]">{entry.name}:</span>
                </div>
                <span className="font-bold text-white shrink-0">
                  {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                  {entry.dataKey?.toLowerCase().includes('frp') ? ' MW' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#111722]/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full overflow-hidden">
      
      {/* 1. Card Header with Mode Indicator & Interactive Metric Switchers */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <span>Thermal Anomaly Radiance Trends Over Time</span>
            </h3>
            {isCompareMode && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                DUAL-REGION COMPARISON
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {isCompareMode
              ? `Multi-swath comparative analytics between ${regionAName} and ${regionBName}`
              : `Continuous orbital telemetry aggregated across ${timeRange} observation horizon`}
          </p>
        </div>

        {/* Interactive Metric Filter Switcher */}
        <div className="flex items-center gap-1.5 bg-dark-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveMetric('all')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-semibold flex items-center gap-1.5 ${
              activeMetric === 'all'
                ? 'bg-slate-700 text-white shadow-sm border border-slate-600'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Combined</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMetric('hotspots')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-semibold flex items-center gap-1.5 ${
              activeMetric === 'hotspots'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-sky-400 hover:text-white hover:bg-sky-950/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>Hotspots</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMetric('frp')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-semibold flex items-center gap-1.5 ${
              activeMetric === 'frp'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-orange-400 hover:text-white hover:bg-orange-950/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>MW FRP</span>
          </button>
        </div>
      </div>

      {/* 2. Main Responsive Composed Line/Area Chart */}
      <div className="w-full h-[310px]">
        <ResponsiveContainer width="100%" height={310}>
          <ComposedChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientAnomalies" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="gradientFrpArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ea580c" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="gradientRegionB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              dy={6}
              interval={timeRange === '1Y' ? 4 : timeRange === '90D' ? 8 : timeRange === '30D' ? 2 : 0}
            />

            {/* Left Y-Axis for Hotspot Count / Region A */}
            {(activeMetric === 'all' || activeMetric === 'hotspots' || isCompareMode) && (
              <YAxis
                yAxisId="left"
                stroke="#38bdf8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
            )}

            {/* Right Y-Axis for Mean FRP (MW) */}
            {(activeMetric === 'all' || activeMetric === 'frp') && !isCompareMode && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#f97316"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                unit=" MW"
                domain={[0, 'auto']}
              />
            )}

            <Tooltip content={<CustomTooltip />} />

            {/* SINGLE REGION MODE VISUALIZATIONS */}
            {!isCompareMode && (
              <>
                {/* 1. Hotspots Area Curve (Rendered when 'all' or 'hotspots' is selected) */}
                {(activeMetric === 'all' || activeMetric === 'hotspots') && (
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    name="Hotspots Count"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradientAnomalies)"
                  />
                )}

                {/* 2. Mean FRP Line (Rendered when 'all' is selected) */}
                {activeMetric === 'all' && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgFrp"
                    name="Mean FRP (MW)"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#f97316', stroke: '#111722', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
                  />
                )}

                {/* 3. Dedicated Mean FRP Area Chart (Rendered when 'frp' is selected) */}
                {activeMetric === 'frp' && (
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgFrp"
                    name="Mean Radiative Power"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradientFrpArea)"
                  />
                )}

                {/* 4. 3-Sigma Anomaly Baseline Reference Line */}
                {(activeMetric === 'all' || activeMetric === 'frp') && (
                  <ReferenceLine
                    yAxisId="right"
                    y={45}
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    label={{
                      value: '3σ Threshold (45 MW)',
                      fill: '#ef4444',
                      fontSize: 10,
                      position: 'insideTopRight',
                    }}
                  />
                )}
              </>
            )}

            {/* DUAL-REGION COMPARISON MODE */}
            {isCompareMode && (
              <>
                {activeMetric !== 'frp' ? (
                  <>
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="regionACount"
                      name={`${regionAName} (Hotspots)`}
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#gradientAnomalies)"
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="regionBCount"
                      name={`${regionBName} (Hotspots)`}
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#gradientRegionB)"
                    />
                  </>
                ) : (
                  <>
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="regionAFrp"
                      name={`${regionAName} (FRP)`}
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#38bdf8' }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="regionBFrp"
                      name={`${regionBName} (FRP)`}
                      stroke="#f97316"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#f97316' }}
                    />
                    <ReferenceLine
                      yAxisId="left"
                      y={45}
                      stroke="#ef4444"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      label={{
                        value: '3σ Alert Baseline',
                        fill: '#ef4444',
                        fontSize: 10,
                        position: 'insideTopRight',
                      }}
                    />
                  </>
                )}
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 3. Metric Bottom Footer Strip */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Active View: <strong className="text-white uppercase">{activeMetric === 'all' ? 'Combined (Hotspots + FRP)' : activeMetric === 'hotspots' ? 'Hotspots Frequency' : 'Mean Radiative Power (MW)'}</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span>Statistical Drift: <strong className="text-emerald-400">-4.2% vs prior</strong></span>
          <span>Sensor Confidence: <strong className="text-sky-400">96.8%</strong></span>
        </div>
      </div>
    </div>
  );
}
