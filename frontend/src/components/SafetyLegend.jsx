import React from 'react';
import { Shield, Info } from 'lucide-react';

export function SafetyLegend() {
  const items = [
    { icon: '🚒', label: 'Fire Station', desc: 'Heavy foam & water tender depot' },
    { icon: '🏥', label: 'Hospital / ICU', desc: 'Critical burn & trauma care center' },
    { icon: '👮', label: 'Police Outpost', desc: 'Cordon & evacuation enforcement' },
    { icon: '🚑', label: 'Ambulance Unit', desc: 'ALS 108 rapid medical transit' },
    { icon: '🏠', label: 'Evacuation Shelter', desc: 'Designated disaster relief center' },
  ];

  return (
    <div className="bg-white/95 dark:bg-dark-850/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xl backdrop-blur-md min-w-[270px] transition-colors duration-200">
      <div className="flex justify-between items-center text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Safety Infrastructure</span>
        </div>
        <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
          DEMO DATA
        </span>
      </div>

      <div className="space-y-1.5 mb-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <span className="text-sm">{item.icon}</span>
            <div className="leading-tight">
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] block">{item.label}</span>
              <span className="text-[9.5px] text-slate-500 dark:text-slate-400">{item.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-[9px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <span>Source: State Disaster Plans</span>
        <span className="font-bold text-emerald-600 dark:text-emerald-400">Verified 2026</span>
      </div>
    </div>
  );
}
