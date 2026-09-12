import React, { useState } from 'react';
import { Flame, Satellite, Menu, X, ArrowRight, Activity, ShieldCheck } from 'lucide-react';

export function LandingNavbar({ onLaunchDashboard, onNavigateAnalytics }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const navOffset = 70;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      window.history.pushState(null, '', `#${id}`);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-dark-950/80 border-b border-dark-700/60 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 via-red-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/25 border border-orange-400/30">
              <Flame className="w-5 h-5 text-white animate-pulse" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 border-2 border-dark-950"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider uppercase text-white font-sans">
                OTIP
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                v2.4
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-tight hidden sm:block">
              Orbital Thermal Intelligence Platform
            </p>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            type="button"
            onClick={(e) => scrollToSection(e, 'features')}
            className="text-sm font-medium text-slate-300 hover:text-sky-400 transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            type="button"
            onClick={(e) => scrollToSection(e, 'how-it-works')}
            className="text-sm font-medium text-slate-300 hover:text-sky-400 transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={(e) => scrollToSection(e, 'use-cases')}
            className="text-sm font-medium text-slate-300 hover:text-sky-400 transition-colors cursor-pointer"
          >
            Use Cases
          </button>
          <button
            type="button"
            onClick={(e) => scrollToSection(e, 'live-preview')}
            className="text-sm font-medium text-slate-300 hover:text-sky-400 transition-colors cursor-pointer"
          >
            Live Preview
          </button>
        </nav>

        {/* Right Action & Telemetry Beacon */}
        <div className="hidden lg:flex items-center gap-3">
          {onNavigateAnalytics && (
            <button
              type="button"
              onClick={onNavigateAnalytics}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-dark-850 hover:bg-dark-800 border border-dark-700 transition-all cursor-pointer"
            >
              Analytics
            </button>
          )}

          <button
            type="button"
            onClick={onLaunchDashboard}
            className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 hover:from-orange-400 hover:via-red-400 hover:to-amber-400 shadow-lg shadow-orange-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-orange-400/40 cursor-pointer"
          >
            <span>Live Dashboard</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={onLaunchDashboard}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-red-600 shadow-md shadow-orange-500/20"
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white bg-dark-850 border border-dark-700"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 bg-dark-900/95 border-b border-dark-700/80 backdrop-blur-2xl space-y-3 animate-in fade-in slide-in-from-top-4 duration-150">
          <button
            type="button"
            onClick={(e) => scrollToSection(e, 'features')}
            className="w-full text-left block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-dark-800 hover:text-sky-400"
          >
            Features
          </button>
          <button
            type="button"
            onClick={(e) => scrollToSection(e, 'how-it-works')}
            className="w-full text-left block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-dark-800 hover:text-sky-400"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={(e) => scrollToSection(e, 'use-cases')}
            className="w-full text-left block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-dark-800 hover:text-sky-400"
          >
            Use Cases
          </button>
          <button
            type="button"
            onClick={(e) => scrollToSection(e, 'live-preview')}
            className="w-full text-left block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-dark-800 hover:text-sky-400"
          >
            Live Preview
          </button>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLaunchDashboard();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-orange-500 to-red-600 shadow-lg shadow-orange-500/25"
            >
              <span>Launch Live Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
