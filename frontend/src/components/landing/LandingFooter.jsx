import React from 'react';
import { Flame, Github, Heart, Radio, ExternalLink } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="w-full bg-dark-950 border-t border-dark-700/60 py-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-dark-800">
          
          {/* Brand & Mission */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 to-red-600 flex items-center justify-center shadow-md shadow-orange-500/20">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-wider uppercase text-white">
                  OTIP
                </span>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs text-slate-300 font-medium">
                  Orbital Thermal Intelligence Platform
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Real-Time Earth Observation & Thermal Anomaly Detection
              </p>
            </div>
          </div>

          {/* Telemetry Status Beacon */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-900 border border-dark-800 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">All Orbital Feeds Nominal</span>
            <span className="text-slate-600">|</span>
            <span className="text-sky-400">SIH 26162</span>
          </div>

          {/* Social Links & GitHub */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Krishna05571/Orbital-Thermal-Intelligence-Platform-OTIP-"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-dark-700 transition-colors text-xs font-medium"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          </div>

        </div>

        {/* Bottom Credits & Disclaimers */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            Developed for <span className="text-slate-300 font-medium">Smart India Hackathon (SIH)</span> • Problem Statement 26162.
          </p>

          <p className="flex items-center gap-1 font-mono text-[11px]">
            Data Sources: NASA FIRMS (VIIRS & MODIS) & Forest Survey of India (FSI)
          </p>
        </div>

      </div>
    </footer>
  );
}
