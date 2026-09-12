import React, { useState } from 'react';
import { Grid, Flame, Info, Eye } from 'lucide-react';

export function RegionIntensityHeatmap({ data = [] }) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [viewMode, setViewMode] = useState('temporal'); // 'temporal' (Day vs Hour) | 'regional' (Region vs Category)

  // Temporal Matrix: Days of Week (Mon-Sun) vs 6 Time Blocks (00-04, 04-08, 08-12, 12-16, 16-20, 20-24)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timeBlocks = ['00-04', '04-08', '08-12', '12-16', '16-20', '20-24'];

  // Regional Matrix: Regions vs Severity/Category
  const regionNames = ['Jamnagar Hub', 'NCR & Punjab', 'Steel Belt', 'Simlipal Forest', 'Singrauli Basin'];
  const severityLevels = ['Low (<20MW)', 'Moderate (20-50MW)', 'High (50-100MW)', 'Critical (>100MW)'];

  // Get intensity color based on value 0-100
  const getCellColor = (val) => {
    if (val === 0) return 'bg-slate-900/60 border-slate-800/40 text-slate-600';
    if (val < 25) return 'bg-sky-950/60 border-sky-800/40 text-sky-400 hover:border-sky-400';
    if (val < 50) return 'bg-emerald-950/70 border-emerald-700/50 text-emerald-300 hover:border-emerald-400';
    if (val < 75) return 'bg-amber-950/80 border-amber-600/60 text-amber-300 hover:border-amber-400';
    return 'bg-red-950/90 border-red-500/70 text-red-300 hover:border-red-400 shadow-lg shadow-red-950/50';
  };

  return (
    <div className="bg-[#111722]/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
            <Grid className="w-4 h-4 text-emerald-400" />
            <span>Thermal Radiance Intensity Matrix Heatmap</span>
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Cross-dimensional spatial and diurnal density concentration matrix
          </p>
        </div>

        {/* View Switcher Pill */}
        <div className="flex items-center gap-1 bg-dark-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => setViewMode('temporal')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              viewMode === 'temporal'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Diurnal vs Day
          </button>
          <button
            type="button"
            onClick={() => setViewMode('regional')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              viewMode === 'regional'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Region vs Severity
          </button>
        </div>
      </div>

      {/* Matrix Body */}
      <div className="flex-1 flex flex-col justify-center overflow-x-auto min-h-0 py-1">
        {viewMode === 'temporal' ? (
          <div className="space-y-1.5 min-w-[360px]">
            {/* 8-Column Header: Label (col 1) + 7 Days (cols 2-8) */}
            <div className="grid grid-cols-8 gap-1.5 text-center text-[10px] font-mono text-slate-400 pb-1 items-center">
              <div className="text-left pl-1 font-bold text-slate-400 truncate">UTC BLOCK</div>
              {days.map((d) => (
                <div key={d} className="font-bold text-slate-300">{d}</div>
              ))}
            </div>

            {/* 8-Column Data Rows */}
            {timeBlocks.map((block, rowIdx) => (
              <div key={block} className="grid grid-cols-8 gap-1.5 items-center">
                <span className="text-[10px] font-mono font-semibold text-slate-400 pl-1 truncate">{block}</span>
                {days.map((day, colIdx) => {
                  // Deterministic pseudo-dynamic heatmap values
                  const seed = (rowIdx * 7 + colIdx * 13) % 97;
                  const intensity = (rowIdx === 3 || rowIdx === 4) ? (seed % 60 + 35) : (seed % 50 + 10);
                  const isHovered = hoveredCell?.day === day && hoveredCell?.block === block;

                  return (
                    <div
                      key={day}
                      onMouseEnter={() => setHoveredCell({ day, block, val: intensity })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`h-7 sm:h-8 rounded-lg border flex items-center justify-center font-mono text-[11px] font-bold transition-all cursor-pointer select-none ${getCellColor(
                        intensity
                      )} ${isHovered ? 'scale-105 z-10' : ''}`}
                    >
                      <span>{intensity}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5 min-w-[360px]">
            {/* Regional vs Severity Table */}
            <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-mono text-slate-400 pb-1 items-center">
              <div className="text-left pl-1 font-bold text-slate-400 truncate">CLUSTER</div>
              {severityLevels.map((lvl) => (
                <div key={lvl} className="font-semibold text-slate-300 truncate text-[10px]">{lvl}</div>
              ))}
            </div>

            {regionNames.map((reg, rowIdx) => (
              <div key={reg} className="grid grid-cols-5 gap-1.5 items-center">
                <span className="text-[11px] font-semibold text-slate-200 truncate pl-1">{reg}</span>
                {severityLevels.map((lvl, colIdx) => {
                  const val = ((rowIdx + 1) * (4 - colIdx) * 14 + (colIdx === 3 ? 18 : 32)) % 95;
                  const isHovered = hoveredCell?.region === reg && hoveredCell?.level === lvl;

                  return (
                    <div
                      key={lvl}
                      onMouseEnter={() => setHoveredCell({ region: reg, level: lvl, val })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`h-7 sm:h-8 rounded-lg border flex items-center justify-center font-mono text-[11px] font-bold transition-all cursor-pointer ${getCellColor(
                        val
                      )} ${isHovered ? 'scale-105 z-10' : ''}`}
                    >
                      <span>{val}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Heatmap Legend Bar & Active Hover Tooltip Footer */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Radiance Scale:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-slate-900 border border-slate-700" title="0-10 MW" />
            <span className="w-3 h-3 rounded bg-sky-950 border border-sky-800" title="10-25 MW" />
            <span className="w-3 h-3 rounded bg-emerald-950 border border-emerald-700" title="25-50 MW" />
            <span className="w-3 h-3 rounded bg-amber-950 border border-amber-600" title="50-75 MW" />
            <span className="w-3 h-3 rounded bg-red-950 border border-red-500" title="75-100+ MW" />
          </div>
          <span className="text-slate-400">Low → Extreme</span>
        </div>

        {hoveredCell && (
          <div className="text-sky-300 font-semibold animate-in fade-in duration-100">
            {hoveredCell.day
              ? `${hoveredCell.day} @ ${hoveredCell.block} UTC: ${hoveredCell.val} Anomaly Events`
              : `${hoveredCell.region} [${hoveredCell.level}]: ${hoveredCell.val} Hotspots`}
          </div>
        )}
      </div>
    </div>
  );
}
