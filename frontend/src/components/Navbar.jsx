import React from 'react';
import { RefreshCw, MapPin, Satellite, Flame, Trees, Sun, Moon } from 'lucide-react';
import { REGIONS, SENSORS } from '../constants/taxonomy';

export function Navbar({
  mode = 'auto',
  onToggleMode,
  dataSource = 'firms', // 'firms' | 'fsi'
  onToggleDataSource,
  selectedRegion,
  onSelectRegion,
  selectedSensor,
  onSelectSensor,
  mapMode = 'hybrid',
  onSelectMapMode,
  theme = 'dark',
  onToggleTheme,
  onRefresh,
  loading = false,
  stats = { totalHotspots: 0, totalClusters: 0, totalAlerts: 0, avgFrp: 0 },
}) {
  return (
    <header className="h-14 bg-white dark:bg-dark-850 border-b border-slate-200 dark:border-dark-700/80 px-4 flex items-center justify-between gap-4 z-30 select-none shadow-sm transition-colors duration-200">
      {/* Brand & Ingestion Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-600 dark:bg-sky-600/90 flex items-center justify-center shadow-sm">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-xs font-black tracking-widest uppercase text-slate-900 dark:text-slate-100">
                OTIP
              </span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 font-semibold">
                SIH 26162
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Orbital Thermal Console</span>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-dark-700 mx-1 hidden sm:block" />

        {/* Ingestion Source Switcher: NASA FIRMS vs FSI Forest Fire */}
        <div className="flex items-center bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => onToggleDataSource('firms')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              dataSource === 'firms'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>NASA FIRMS</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleDataSource('fsi')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              dataSource === 'fsi'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Trees className="w-3.5 h-3.5" />
            <span>FSI Forest Fire</span>
          </button>
        </div>

        {/* FSI DEMO DATA Banner Indicator */}
        {dataSource === 'fsi' && (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
            DEMO DATA (FSI)
          </span>
        )}

        {/* Live vs Demo Pill Toggle (NASA FIRMS mode) */}
        {dataSource === 'firms' && (
          <div className="flex items-center bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => onToggleMode('demo')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                mode === 'demo'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Demo
            </button>
            <button
              type="button"
              onClick={() => onToggleMode('auto')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mode !== 'demo'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${mode !== 'demo' ? 'bg-white animate-pulse' : 'bg-slate-400 dark:bg-slate-500'}`} />
              Live
            </button>
          </div>
        )}
      </div>

      {/* Center Controls: Scope, Sensor, Refresh */}
      <div className="hidden lg:flex items-center gap-2">
        {/* Region Scope */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-sky-500" />
          <select
            value={selectedRegion}
            onChange={(e) => onSelectRegion(e.target.value)}
            className="bg-transparent border-none text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1 text-xs font-medium"
          >
            {Object.entries(REGIONS).map(([key, cfg]) => (
              <option key={key} value={key} className="bg-white dark:bg-dark-850 text-slate-800 dark:text-slate-200">
                {cfg.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sensor Select (for FIRMS) */}
        {dataSource === 'firms' && (
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300">
            <Satellite className="w-3.5 h-3.5 text-indigo-500" />
            <select
              value={selectedSensor}
              onChange={(e) => onSelectSensor(e.target.value)}
              className="bg-transparent border-none text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1 text-xs font-medium"
            >
              {SENSORS.map((s) => (
                <option key={s.id} value={s.id} className="bg-white dark:bg-dark-850 text-slate-800 dark:text-slate-200">
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Force Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-dark-900 dark:hover:bg-dark-750 border border-slate-200 dark:border-dark-700 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
          title="Refresh satellite telemetry"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-500' : ''}`} />
        </button>
      </div>

      {/* Map Mode Switcher & Dark/Light Theme Toggle */}
      <div className="flex items-center gap-2">
        {/* Map Mode Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => onSelectMapMode('standard')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              mapMode === 'standard'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Standard
          </button>
          <button
            type="button"
            onClick={() => onSelectMapMode('thermal')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              mapMode === 'thermal'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Thermal
          </button>
          <button
            type="button"
            onClick={() => onSelectMapMode('hybrid')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              mapMode === 'hybrid'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Hybrid
          </button>
          <button
            type="button"
            onClick={() => onSelectMapMode('forest_risk')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
              mapMode === 'forest_risk'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Trees className="w-3 h-3" />
            <span>Forest Risk</span>
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-dark-900 dark:hover:bg-dark-750 border border-slate-200 dark:border-dark-700 transition-all text-slate-600 dark:text-slate-300"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>
      </div>
    </header>
  );
}
