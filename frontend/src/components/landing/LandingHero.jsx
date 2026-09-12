import React from 'react';
import { Flame, Satellite, ArrowRight, ShieldAlert, Cpu, Radio, Sparkles, Compass } from 'lucide-react';
import { GlobeCanvas } from './GlobeCanvas';

export function LandingHero({ onLaunchDashboard }) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-8 pb-16 lg:py-24">
      {/* Background Gradients & Orbital Tech Grid */}
      <div className="absolute inset-0 bg-space-grid opacity-25 pointer-events-none" />
      
      {/* Radiant Glowing Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-orange-500/15 via-red-500/10 to-sky-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-20 right-10 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Hero Content */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6 z-10">
            
            {/* Top Mission Pill */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-dark-850/90 border border-orange-500/30 text-xs font-mono text-orange-300 shadow-lg shadow-orange-500/10 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
              <span className="font-semibold text-slate-200">NASA FIRMS</span>
              <span className="text-dark-600">|</span>
              <span className="text-orange-400">VIIRS & MODIS NRT Constellation</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-sans leading-[1.1]">
              Real-Time{' '}
              <span className="bg-gradient-to-r from-orange-400 via-red-500 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(249,115,22,0.35)]">
                Thermal Intelligence
              </span>{' '}
              from Space
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
              Detect, analyze, and track extreme thermal anomalies—from wildfire frontlines and industrial gas flaring to metallurgical heat emissions—powered by continuous orbital earth observation and machine learning geospatial clustering.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onLaunchDashboard}
                className="group relative inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-orange-500 via-red-600 to-amber-500 hover:from-orange-400 hover:via-red-500 hover:to-amber-400 shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] border border-orange-300/40 cursor-pointer"
              >
                <span>View Live Dashboard</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const element = document.getElementById('how-it-works');
                  if (element) {
                    const navOffset = 70;
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - navOffset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-200 bg-dark-850/80 hover:bg-dark-800 border border-dark-700/80 hover:border-sky-500/40 shadow-sm transition-all duration-200 hover:text-white backdrop-blur-md cursor-pointer"
              >
                <span>How It Works</span>
              </button>
            </div>

            {/* Quick Live Telemetry Metric Strip */}
            <div className="pt-6 border-t border-dark-700/60 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
              <div className="p-3 rounded-xl bg-dark-850/50 border border-dark-700/50">
                <div className="text-xl sm:text-2xl font-mono font-bold text-sky-400">375m</div>
                <div className="text-[11px] text-slate-400 font-medium">VIIRS Spatial Resolution</div>
              </div>

              <div className="p-3 rounded-xl bg-dark-850/50 border border-dark-700/50">
                <div className="text-xl sm:text-2xl font-mono font-bold text-orange-400">&lt; 30s</div>
                <div className="text-[11px] text-slate-400 font-medium">NRT Ingestion Latency</div>
              </div>

              <div className="p-3 rounded-xl bg-dark-850/50 border border-dark-700/50">
                <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400">99.4%</div>
                <div className="text-[11px] text-slate-400 font-medium">AI Classification Fidelity</div>
              </div>

              <div className="p-3 rounded-xl bg-dark-850/50 border border-dark-700/50">
                <div className="text-xl sm:text-2xl font-mono font-bold text-amber-400">24 / 7</div>
                <div className="text-[11px] text-slate-400 font-medium">Global Swath Coverage</div>
              </div>
            </div>

          </div>

          {/* Right Column: 3D Orbital Canvas Globe & Floating Telemetry HUD */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[420px] sm:min-h-[500px]">
            
            {/* 3D Animated Canvas */}
            <div className="relative w-full h-[450px] sm:h-[520px] flex items-center justify-center">
              <GlobeCanvas />

              {/* Floating Space-Tech HUD Card Top-Right */}
              <div className="absolute top-4 right-2 sm:right-4 bg-dark-900/90 border border-cyan-500/30 rounded-xl p-3 shadow-xl backdrop-blur-md max-w-[210px] hidden sm:block animate-float-slow">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-dark-700/60">
                  <span className="text-[10px] font-mono text-cyan-400 font-semibold flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse" /> SATELLITE PASS
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400">L1B OK</span>
                </div>
                <div className="space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>SENSOR:</span>
                    <span className="text-slate-200">VIIRS I-Band</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>FRP MAX:</span>
                    <span className="text-orange-400 font-bold">142.8 MW</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>SWATH:</span>
                    <span className="text-slate-200">3,040 km</span>
                  </div>
                </div>
              </div>

              {/* Floating Space-Tech HUD Card Bottom-Left */}
              <div className="absolute bottom-6 left-2 sm:left-4 bg-dark-900/90 border border-red-500/30 rounded-xl p-3 shadow-xl backdrop-blur-md max-w-[220px] hidden sm:block">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-dark-700/60">
                  <span className="text-[10px] font-mono text-red-400 font-semibold flex items-center gap-1">
                    <Flame className="w-3 h-3 text-red-400 animate-pulse" /> HOTSPOT ALERT
                  </span>
                  <span className="text-[9px] font-mono bg-red-500/20 text-red-300 px-1 rounded">CRITICAL</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300">
                  <p className="truncate text-white font-semibold">Simlipal Forest Reserve</p>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>T4: 368.2 K</span>
                    <span className="text-amber-400">DBSCAN Group #14</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
