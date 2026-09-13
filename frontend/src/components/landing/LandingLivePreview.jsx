import React, { useState } from 'react';
import { 
  Flame, 
  Satellite, 
  Activity, 
  Layers, 
  Radio, 
  ShieldAlert, 
  Factory, 
  Trees, 
  Maximize2, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

const MOCK_HOTSPOTS = [
  {
    id: 'hs-1',
    name: 'Simlipal Firefront Alpha',
    category: 'wildfire',
    categoryLabel: 'Active Wildfire Front',
    coords: '21.84° N, 86.41° E',
    frp: 284.5,
    temp: 362.4,
    confidence: '98%',
    sensor: 'VIIRS_SNPP',
    clusterSize: 18,
    status: 'CRITICAL',
    x: 62, // % on mock map
    y: 44,
  },
  {
    id: 'hs-2',
    name: 'Jamnagar Flare Stack B',
    category: 'gas_flare',
    categoryLabel: 'Offshore Gas Flaring',
    coords: '22.47° N, 70.06° E',
    frp: 86.2,
    temp: 334.8,
    confidence: '95%',
    sensor: 'MODIS_AQUA',
    clusterSize: 4,
    status: 'STABLE BASELINE',
    x: 28,
    y: 52,
  },
  {
    id: 'hs-3',
    name: 'Jamshedpur Blast Furnace #4',
    category: 'industrial',
    categoryLabel: 'Industrial Metallurgical Heat',
    coords: '22.80° N, 86.20° E',
    frp: 142.0,
    temp: 348.1,
    confidence: '92%',
    sensor: 'VIIRS_NOAA20',
    clusterSize: 6,
    status: 'HIGH THERMAL',
    x: 66,
    y: 40,
  },
  {
    id: 'hs-4',
    name: 'Sangrur Agricultural Field',
    category: 'agriculture',
    categoryLabel: 'Biomass / Stubble Burn',
    coords: '30.24° N, 75.84° E',
    frp: 34.6,
    temp: 318.2,
    confidence: '89%',
    sensor: 'VIIRS_SNPP',
    clusterSize: 2,
    status: 'EPHEMERAL',
    x: 35,
    y: 25,
  },
];

export function LandingLivePreview({ onLaunchDashboard }) {
  const [selectedHotspot, setSelectedHotspot] = useState(MOCK_HOTSPOTS[0]);
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredHotspots = MOCK_HOTSPOTS.filter((h) => {
    if (activeFilter === 'all') return true;
    return h.category === activeFilter;
  });

  return (
    <section id="live-preview" className="scroll-mt-16 py-20 lg:py-24 relative overflow-hidden bg-dark-900 border-t border-dark-700/60">
      {/* Background Ambience */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dark-850 border border-red-500/30 text-xs font-mono text-red-400">
            <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>INTERACTIVE CONSOLE SIMULATION</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-sans tracking-tight">
            Live Telemetry{' '}
            <span className="bg-gradient-to-r from-orange-400 via-red-500 to-amber-300 bg-clip-text text-transparent">
              Operations Preview
            </span>
          </h2>

          <p className="text-base text-slate-300">
            Experience the real-time GIS situational dashboard. Click any active thermal hotspot node on the simulated satellite radar to inspect spectral radiative telemetry.
          </p>
        </div>

        {/* Mock Dashboard Window Frame */}
        <div className="rounded-2xl border border-dark-700/80 bg-dark-950 shadow-2xl overflow-hidden shadow-black/80">
          
          {/* Top Window Bar */}
          <div className="h-11 bg-dark-850 border-b border-dark-700 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 text-xs font-mono text-slate-400">OTIP Operations Console • Live Orbit Scan</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                STREAM ACTIVE
              </span>

              <button
                type="button"
                onClick={onLaunchDashboard}
                className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold bg-orange-500 hover:bg-orange-400 text-white shadow transition-all cursor-pointer"
              >
                <span>Launch Full App</span>
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Console Subheader Filters */}
          <div className="bg-dark-900 border-b border-dark-700/70 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono text-[11px]">CLASSIFICATION:</span>
              <div className="flex items-center gap-1.5 bg-dark-850 p-1 rounded-lg border border-dark-700">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    activeFilter === 'all' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({MOCK_HOTSPOTS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('wildfire')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    activeFilter === 'wildfire' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Wildfire
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('gas_flare')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    activeFilter === 'gas_flare' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Gas Flare
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('industrial')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    activeFilter === 'industrial' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Industrial
                </button>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
              SENSOR: <span className="text-sky-400 font-bold">VIIRS (375m) NRT</span>
            </div>
          </div>

          {/* Interactive Map & Telemetry Split Screen */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
            
            {/* Mock Satellite GIS Canvas */}
            <div className="lg:col-span-8 relative bg-[#090d14] overflow-hidden flex items-center justify-center p-4">
              
              {/* GIS Cartographic Grid Lines */}
              <div className="absolute inset-0 bg-space-grid opacity-30" />

              {/* Radar Sweep Effect */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[500px] h-[500px] rounded-full border border-sky-500/10 relative">
                  <div className="absolute inset-0 rounded-full border border-sky-500/15 animate-ping opacity-20" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full bg-gradient-to-tr from-sky-500/5 to-transparent animate-radar-sweep origin-center" />
                </div>
              </div>

              {/* Stylized Geo Landmass Outline Representation */}
              <svg
                viewBox="0 0 800 500"
                className="w-full h-full max-h-[400px] opacity-40 pointer-events-none"
                fill="none"
                stroke="rgba(56, 189, 248, 0.3)"
                strokeWidth="1.5"
              >
                {/* Stylized Subcontinent Coastline & Terrain Contours */}
                <path d="M 180 80 Q 240 70 320 80 T 450 110 T 560 140 T 640 220 T 680 320 T 580 420 T 420 460 T 300 420 T 220 340 T 170 240 Z" fill="rgba(15, 23, 42, 0.6)" />
                <path d="M 280 140 Q 380 180 480 160 T 580 260" strokeDasharray="4 4" stroke="rgba(249, 115, 22, 0.2)" />
                <path d="M 220 280 Q 340 320 440 300" strokeDasharray="3 3" stroke="rgba(56, 189, 248, 0.2)" />
              </svg>

              {/* Interactive Hotspot Nodes */}
              {filteredHotspots.map((hs) => {
                const isSelected = selectedHotspot?.id === hs.id;
                const isWildfire = hs.category === 'wildfire';

                return (
                  <div
                    key={hs.id}
                    style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                    onClick={() => setSelectedHotspot(hs)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                  >
                    {/* Pulsing Radiation Halo */}
                    <div
                      className={`absolute -inset-3 rounded-full animate-ping opacity-60 ${
                        isWildfire ? 'bg-red-500' : hs.category === 'gas_flare' ? 'bg-orange-500' : 'bg-cyan-500'
                      }`}
                    />

                    {/* Hotspot Center Dot */}
                    <div
                      className={`relative w-5 h-5 rounded-full flex items-center justify-center text-white border-2 shadow-lg transition-transform ${
                        isSelected ? 'scale-125 ring-4 ring-orange-500/40' : 'hover:scale-110'
                      } ${
                        isWildfire
                          ? 'bg-red-600 border-white'
                          : hs.category === 'gas_flare'
                          ? 'bg-orange-500 border-amber-200'
                          : 'bg-cyan-600 border-white'
                      }`}
                    >
                      <Flame className="w-3 h-3" />
                    </div>

                    {/* Hover Hotspot Badge */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-dark-900 border border-dark-700 px-2.5 py-1 rounded-md text-[10px] font-mono text-white shadow-xl z-30 pointer-events-none">
                      <div className="font-bold">{hs.name}</div>
                      <div className="text-orange-400">{hs.frp} MW • {hs.temp} K</div>
                    </div>
                  </div>
                );
              })}

              {/* Map Footer HUD Indicators */}
              <div className="absolute bottom-3 left-3 bg-dark-900/90 border border-dark-700/80 px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-slate-400 space-x-3 backdrop-blur-md">
                <span>LAT/LON: <strong className="text-slate-200">20.5937° N, 78.9629° E</strong></span>
                <span>SWATH: <strong className="text-sky-400">NRT L1B</strong></span>
              </div>

              <div className="absolute bottom-3 right-3 bg-dark-900/90 border border-dark-700/80 px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-slate-400 backdrop-blur-md">
                <span>CLICK HOTSPOTS TO INSPECT TELEMETRY</span>
              </div>
            </div>

            {/* Right Telemetry Telemetry Inspector Panel */}
            <div className="lg:col-span-4 bg-dark-850 border-t lg:border-t-0 lg:border-l border-dark-700 p-6 flex flex-col justify-between">
              
              <div className="space-y-5">
                
                {/* Selected Node Header */}
                <div className="pb-4 border-b border-dark-700">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                      {selectedHotspot.status}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: {selectedHotspot.id}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white leading-snug">
                    {selectedHotspot.name}
                  </h4>
                  <div className="text-xs text-sky-400 font-mono mt-0.5">
                    {selectedHotspot.categoryLabel}
                  </div>
                </div>

                {/* Telemetry Key Gauges */}
                <div className="grid grid-cols-2 gap-3">
                  
                  <div className="p-3 rounded-xl bg-dark-900 border border-dark-700/80">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Radiative Power (FRP)</div>
                    <div className="text-xl font-mono font-extrabold text-orange-400 mt-1">
                      {selectedHotspot.frp} <span className="text-xs font-normal text-slate-400">MW</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-dark-900 border border-dark-700/80">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Brightness Temp (T4)</div>
                    <div className="text-xl font-mono font-extrabold text-red-400 mt-1">
                      {selectedHotspot.temp} <span className="text-xs font-normal text-slate-400">K</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-dark-900 border border-dark-700/80">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">AI Confidence</div>
                    <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                      {selectedHotspot.confidence}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-dark-900 border border-dark-700/80">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Cluster Density</div>
                    <div className="text-lg font-mono font-bold text-cyan-400 mt-1">
                      {selectedHotspot.clusterSize} pixels
                    </div>
                  </div>

                </div>

                {/* Technical Coordinates & Sensor */}
                <div className="space-y-2 bg-dark-900/60 p-3.5 rounded-xl border border-dark-700/60 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">COORDINATES:</span>
                    <span className="text-slate-200">{selectedHotspot.coords}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">PRIMARY SENSOR:</span>
                    <span className="text-slate-200">{selectedHotspot.sensor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">PASS TYPE:</span>
                    <span className="text-emerald-400">NIGHT-TIME ORBIT</span>
                  </div>
                </div>

              </div>

              {/* Action Button */}
              <div className="pt-6">
                <button
                  type="button"
                  onClick={onLaunchDashboard}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-orange-500 via-red-600 to-amber-500 hover:from-orange-400 hover:via-red-500 hover:to-amber-400 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
                >
                  <span>Open Full Operations Console</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
