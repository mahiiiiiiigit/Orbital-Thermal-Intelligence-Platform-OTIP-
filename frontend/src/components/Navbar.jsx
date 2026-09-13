import React from 'react';
import { RefreshCw, MapPin, Satellite, Flame, Trees, Bell, TrendingUp, Layers, PanelLeftClose, PanelLeft, Radio, FlameKindling, ShieldAlert, Sun, Moon } from 'lucide-react';
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
  viewMode = 'dark',
  onToggleViewMode,
  onRefresh,
  loading = false,
  stats = { totalHotspots: 0, totalClusters: 0, totalAlerts: 0, avgFrp: 0 },
  sidebarCollapsed = false,
  onToggleSidebar,
  onNavigateLanding,
  onNavigateAlerts,
  onNavigateAnalytics,
  currentView = 'dashboard',
}) {
  const isFirms = dataSource === 'firms';
  const isMODIS = isFirms && selectedSensor === 'MODIS_NRT';
  const isVIIRS = isFirms && selectedSensor !== 'MODIS_NRT';

  const handleSetSource = (sourceType) => {
    if (sourceType === 'fsi') {
      onToggleDataSource('fsi');
    } else if (sourceType === 'modis') {
      onToggleDataSource('firms');
      onSelectSensor('MODIS_NRT');
    } else if (sourceType === 'viirs') {
      onToggleDataSource('firms');
      onSelectSensor('VIIRS_SNPP_NRT');
    }
  };

  return (
    <header className="h-14 bg-dark-950/95 border-b border-dark-800/80 px-3.5 flex items-center justify-between gap-3 z-30 select-none backdrop-blur-xl shadow-lg transition-colors duration-200">
      
      {/* Left: Brand & Sidebar Collapse Toggle */}
      <div className="flex items-center gap-2.5">
        {onToggleSidebar && currentView === 'dashboard' && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              sidebarCollapsed
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
                : 'bg-dark-900 border-dark-750 text-slate-400 hover:text-white hover:bg-dark-850'
            }`}
            title={sidebarCollapsed ? 'Expand Telemetry Panel' : 'Collapse Telemetry Panel'}
          >
            {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        )}

        <button
          type="button"
          onClick={onNavigateLanding}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity text-left cursor-pointer"
          title="Return to Overview / Landing Page"
        >
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-orange-500/30 shadow-md shadow-orange-600/20 bg-dark-950 flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="OTIP Logo" className="w-full h-full object-cover" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-sm font-black tracking-wider uppercase text-slate-100 font-sans">
                OTIP
              </span>
              <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                GEO-SAT
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-tight">Orbital Thermal Intelligence</span>
          </div>
        </button>

        <div className="h-5 w-[1px] bg-dark-800 mx-1 hidden md:block" />

        {/* Constellation Data Source Switcher: VIIRS | MODIS | FSI */}
        <div className="flex items-center bg-dark-900 border border-dark-800 p-0.5 rounded-lg shadow-inner">
          <button
            type="button"
            onClick={() => handleSetSource('viirs')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isVIIRS
                ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md shadow-sky-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="VIIRS (375m high-resolution active fire sensor)"
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>VIIRS</span>
          </button>

          <button
            type="button"
            onClick={() => handleSetSource('modis')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isMODIS
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="MODIS (1km global thermal sensor)"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>MODIS</span>
          </button>

          <button
            type="button"
            onClick={() => handleSetSource('fsi')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              dataSource === 'fsi'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Forest Survey of India (FSI FFDR Wildfire Layer)"
          >
            <Trees className="w-3.5 h-3.5" />
            <span>FSI</span>
          </button>
        </div>

        {/* Live Feed Status Pill */}
        <div className="hidden lg:flex items-center bg-dark-900 border border-dark-800 p-0.5 rounded-lg">
          {dataSource === 'firms' ? (
            <button
              type="button"
              onClick={() => onToggleMode(mode === 'demo' ? 'auto' : 'demo')}
              className="px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all text-slate-300 hover:text-white cursor-pointer"
              title="Click to toggle Live NASA Stream vs. Deterministic Demo Feed"
            >
              <span className={`w-2 h-2 rounded-full ${mode !== 'demo' ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50' : 'bg-purple-400'}`} />
              <span className="text-[11px] font-mono font-medium text-slate-200">
                {mode !== 'demo' ? 'LIVE SAT' : 'DEMO'}
              </span>
            </button>
          ) : (
            <span className="px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[11px] font-mono">FSI ACTIVE</span>
            </span>
          )}
        </div>
      </div>

      {/* Center Controls: Region Scope & Map Layer Mode */}
      <div className="flex items-center gap-2">
        {/* Region Scope Select */}
        <div className="flex items-center gap-1.5 bg-dark-900 border border-dark-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 shadow-inner">
          <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <select
            value={selectedRegion}
            onChange={(e) => onSelectRegion(e.target.value)}
            className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer pr-1 text-xs font-medium font-sans"
          >
            {Object.entries(REGIONS).map(([key, cfg]) => (
              <option key={key} value={key} className="bg-dark-900 text-slate-200">
                {cfg.name}
              </option>
            ))}
          </select>
        </div>

        {/* Map Layers Mode Selector (Hybrid, Heatmap, Standard, Forest) */}
        {onSelectMapMode && (
          <div className="hidden xl:flex items-center bg-dark-900 border border-dark-800 p-0.5 rounded-lg shadow-inner">
            <button
              type="button"
              onClick={() => onSelectMapMode('hybrid')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                mapMode === 'hybrid'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Hybrid: Hotspot points with underlying thermal density heatmap"
            >
              Hybrid
            </button>
            <button
              type="button"
              onClick={() => onSelectMapMode('thermal')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                mapMode === 'thermal'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Thermal: Radiative power density heatmap"
            >
              Heatmap
            </button>
            <button
              type="button"
              onClick={() => onSelectMapMode('forest_risk')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                mapMode === 'forest_risk'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Forest Risk: FSI 5km Forest Fire Danger Grid overlay"
            >
              FSI Grid
            </button>
          </div>
        )}

        {/* Force Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 bg-dark-900 hover:bg-dark-850 border border-dark-800 rounded-lg text-slate-300 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
          title="Refresh satellite telemetry feed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
        </button>
      </div>

      {/* Right Controls: View Mode, Analytics & Alerts Navigation */}
      <div className="flex items-center gap-2">
        {/* Dark & Light View Mode Switcher */}
        {onToggleViewMode && (
          <div className="flex items-center bg-dark-900 border border-dark-800 p-0.5 rounded-lg shadow-inner">
            <button
              type="button"
              onClick={() => onToggleViewMode('dark')}
              className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'dark'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Dark View Mode"
            >
              <Moon className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline text-[11px]">Dark</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleViewMode('light')}
              className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'light'
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Light View Mode"
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline text-[11px]">Light</span>
            </button>
          </div>
        )}

        {/* Analytics Trends Dashboard Navigation Button */}
        {onNavigateAnalytics && (
          <button
            type="button"
            onClick={onNavigateAnalytics}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-semibold cursor-pointer ${
              currentView === 'analytics'
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 shadow-md shadow-sky-500/20'
                : 'bg-dark-900 hover:bg-dark-850 border-dark-800 text-slate-300 hover:text-white'
            }`}
            title="Open Thermal Trends Analytics Dashboard"
          >
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Analytics</span>
          </button>
        )}

        {/* Alerts & Critical Events Navigation Button */}
        {onNavigateAlerts && (
          <button
            type="button"
            onClick={onNavigateAlerts}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-semibold cursor-pointer ${
              currentView === 'alerts'
                ? 'bg-red-500/20 border-red-500/50 text-red-300 shadow-md shadow-red-500/20'
                : 'bg-dark-900 hover:bg-dark-850 border-dark-800 text-slate-300 hover:text-white'
            }`}
            title="Open Alerts & Emergency SOPs"
          >
            <Bell className={`w-3.5 h-3.5 ${stats.totalAlerts > 0 ? 'text-red-400 animate-pulse' : ''}`} />
            <span className="hidden md:inline">Alerts</span>
            {stats.totalAlerts > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-bold font-mono">
                {stats.totalAlerts}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}

