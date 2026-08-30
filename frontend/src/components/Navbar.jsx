import React from 'react';
import { RefreshCw, MapPin, Satellite, Flame, Trees, Sun, Moon, Bell } from 'lucide-react';
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
    <header className="h-14 bg-dark-900 border-b border-dark-700 px-4 flex items-center justify-between gap-4 z-30 select-none shadow-sm transition-colors duration-200">
      {/* Left: Brand & Ingestion Toggle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md shadow-orange-600/20">
            <Flame className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-sm font-black tracking-wider uppercase text-slate-100 font-sans">
                OTIP
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Orbital Thermal Intelligence Platform</span>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-dark-700 mx-1 hidden sm:block" />

        {/* Live Feed Status Pill */}
        <div className="flex items-center bg-dark-850 border border-dark-700 p-0.5 rounded-lg">
          {dataSource === 'firms' ? (
            <button
              type="button"
              onClick={() => onToggleMode(mode === 'demo' ? 'auto' : 'demo')}
              className="px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all text-slate-300 hover:text-white"
              title="Toggle Live / Demo feed"
            >
              <span className={`w-2 h-2 rounded-full ${mode !== 'demo' ? 'bg-emerald-400 animate-pulse' : 'bg-purple-400'}`} />
              <span className="text-xs font-medium text-slate-200">
                {mode !== 'demo' ? 'Live Feed' : 'Demo Feed'}
              </span>
            </button>
          ) : (
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>FSI Forest Fire</span>
            </span>
          )}
        </div>

        {/* Ingestion Source Switcher */}
        <div className="hidden md:flex items-center bg-dark-850 border border-dark-700 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => onToggleDataSource('firms')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              dataSource === 'firms'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
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
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trees className="w-3.5 h-3.5" />
            <span>FSI</span>
          </button>
        </div>
      </div>

      {/* Center Controls: Scope, Sensor, Refresh */}
      <div className="flex items-center gap-2.5">
        {/* Region Scope Select */}
        <div className="flex items-center gap-1.5 bg-dark-850 border border-dark-700 rounded-lg px-2.5 py-1 text-xs text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-sky-400" />
          <select
            value={selectedRegion}
            onChange={(e) => onSelectRegion(e.target.value)}
            className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer pr-1 text-xs font-medium"
          >
            {Object.entries(REGIONS).map(([key, cfg]) => (
              <option key={key} value={key} className="bg-dark-850 text-slate-200">
                {cfg.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sensor Select (for FIRMS) */}
        {dataSource === 'firms' && (
          <div className="flex items-center gap-1.5 bg-dark-850 border border-dark-700 rounded-lg px-2.5 py-1 text-xs text-slate-300">
            <Satellite className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedSensor}
              onChange={(e) => onSelectSensor(e.target.value)}
              className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer pr-1 text-xs font-medium"
            >
              {SENSORS.map((s) => (
                <option key={s.id} value={s.id} className="bg-dark-850 text-slate-200">
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
          className="p-1.5 bg-dark-850 hover:bg-dark-750 border border-dark-700 rounded-lg text-slate-300 hover:text-white transition-colors disabled:opacity-50"
          title="Refresh satellite feed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
        </button>
      </div>

      {/* Right Controls: Notifications & Theme Toggle */}
      <div className="flex items-center gap-2">
        {/* Notifications Icon with Badge */}
        <button
          type="button"
          className="relative p-1.5 rounded-lg bg-dark-850 hover:bg-dark-750 border border-dark-700 transition-all text-slate-300 hover:text-white"
          title={`${stats.totalAlerts} Critical Events Detected`}
        >
          <Bell className="w-4 h-4" />
          {stats.totalAlerts > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center font-mono">
              {stats.totalAlerts}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg bg-dark-850 hover:bg-dark-750 border border-dark-700 transition-all text-slate-300 hover:text-white"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-300" />
          )}
        </button>
      </div>
    </header>
  );
}
