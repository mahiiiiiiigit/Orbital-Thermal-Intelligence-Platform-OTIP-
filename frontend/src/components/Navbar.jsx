import React from 'react';
import { Radio, RefreshCw, Layers, MapPin, Satellite, Flame, ShieldAlert, Activity } from 'lucide-react';
import { REGIONS, SENSORS } from '../constants/taxonomy';

export function Navbar({
  mode = 'auto',
  onToggleMode,
  selectedRegion,
  onSelectRegion,
  selectedSensor,
  onSelectSensor,
  mapMode = 'hybrid',
  onSelectMapMode,
  onRefresh,
  loading = false,
  stats = { totalHotspots: 0, totalClusters: 0, totalAlerts: 0, avgFrp: 0 },
}) {
  return (
    <header className="h-16 bg-dark-850/95 border-b border-slate-800/80 px-4 flex items-center justify-between gap-4 z-30 select-none shadow-md backdrop-blur-md">
      {/* Brand & Live Stream Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-600/30">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent">
                OTIP
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800/50">
                SIH 26162
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Orbital Thermal Intelligence</p>
          </div>
        </div>

        {/* Live vs Demo Pill Toggle */}
        <div className="flex items-center bg-dark-900/90 border border-slate-800 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => onToggleMode('demo')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              mode === 'demo'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Demo Data
          </button>
          <button
            type="button"
            onClick={() => onToggleMode('auto')}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode !== 'demo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${mode !== 'demo' ? 'bg-white animate-ping' : 'bg-slate-500'}`} />
            Live NASA Feed
          </button>
        </div>
      </div>

      {/* Center Controls: Scope, Sensor, Refresh */}
      <div className="hidden lg:flex items-center gap-2.5">
        {/* Region Scope */}
        <div className="flex items-center gap-1 bg-dark-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-sky-400" />
          <select
            value={selectedRegion}
            onChange={(e) => onSelectRegion(e.target.value)}
            className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer pr-2 text-xs font-medium"
          >
            {Object.entries(REGIONS).map(([key, cfg]) => (
              <option key={key} value={key} className="bg-dark-850 text-slate-200">
                {cfg.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sensor Select */}
        <div className="flex items-center gap-1 bg-dark-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300">
          <Satellite className="w-3.5 h-3.5 text-indigo-400" />
          <select
            value={selectedSensor}
            onChange={(e) => onSelectSensor(e.target.value)}
            className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer pr-2 text-xs font-medium"
          >
            {SENSORS.map((s) => (
              <option key={s.id} value={s.id} className="bg-dark-850 text-slate-200">
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Force Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 bg-dark-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors disabled:opacity-50"
          title="Force refresh NASA satellite feed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
        </button>
      </div>

      {/* Map Mode Switcher */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-dark-900/90 border border-slate-800 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => onSelectMapMode('standard')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              mapMode === 'standard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Standard
          </button>
          <button
            type="button"
            onClick={() => onSelectMapMode('thermal')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              mapMode === 'thermal'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Thermal
          </button>
          <button
            type="button"
            onClick={() => onSelectMapMode('hybrid')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              mapMode === 'hybrid'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hybrid
          </button>
        </div>
      </div>
    </header>
  );
}
