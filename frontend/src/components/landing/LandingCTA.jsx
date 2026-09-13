import React from 'react';
import { ArrowRight, Flame, Satellite, ShieldCheck, Terminal, Sparkles } from 'lucide-react';

export function LandingCTA({ onLaunchDashboard }) {
  return (
    <section className="py-24 relative overflow-hidden bg-dark-950 border-t border-dark-700/60">
      {/* Intense Glowing Radial Backgrounds */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-orange-600/20 via-red-600/20 to-sky-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-space-dots opacity-20 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Glow Container Card */}
        <div className="relative rounded-3xl bg-gradient-to-b from-dark-850 via-dark-900 to-dark-950 border border-orange-500/30 p-8 sm:p-14 text-center shadow-[0_0_60px_rgba(239,68,68,0.15)] overflow-hidden">
          
          {/* Top ambient orbital glow line */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-orange-400 to-transparent" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-dark-900 border border-orange-500/40 text-xs font-mono text-orange-400 shadow-md mb-6">
            <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            <span>INSTANT ORBITAL ACCESS • NASA FIRMS V2.4</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-sans tracking-tight mb-5">
            Start Monitoring Now
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Deploy satellite-powered thermal intelligence for your operations center. Monitor critical wildfire frontlines, gas flares, and industrial heat anomalies in real time.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              type="button"
              onClick={onLaunchDashboard}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-orange-500 via-red-600 to-amber-500 hover:from-orange-400 hover:via-red-500 hover:to-amber-400 shadow-[0_0_35px_rgba(249,115,22,0.4)] transition-all duration-200 hover:scale-105 active:scale-95 border border-orange-300/40 cursor-pointer"
            >
              <span>Open Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="https://github.com/Krishna05571/Orbital-Thermal-Intelligence-Platform-OTIP-"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-semibold text-slate-300 bg-dark-900 hover:bg-dark-800 border border-dark-700 hover:border-slate-500 transition-all text-center"
            >
              <span>GitHub Repository</span>
            </a>
          </div>

          {/* Micro Telemetry Bar */}
          <div className="mt-10 pt-8 border-t border-dark-700/60 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero Configuration Required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Satellite className="w-4 h-4 text-sky-400" />
              <span>Multi-Sensor Swath Auto-Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-orange-400" />
              <span>Open Geospatial API</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
