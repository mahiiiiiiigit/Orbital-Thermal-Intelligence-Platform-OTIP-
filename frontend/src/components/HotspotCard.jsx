import React from 'react';
import { ConfidenceBadge, RiskBadge } from './RiskBadge';
import { TAXONOMY_COLORS } from '../constants/taxonomy';
import { Flame, ShieldAlert, CheckCircle2, Navigation, Activity, Clock } from 'lucide-react';

export function HotspotCard({ hotspot }) {
  if (!hotspot) {
    return (
      <div className="bg-dark-850/80 border border-slate-800/80 rounded-xl p-4 text-center">
        <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
        <h3 className="text-sm font-semibold text-slate-400">No Hotspot Selected</h3>
        <p className="text-xs text-slate-500 mt-1">Click on any map marker or scrub timeline to inspect detection telemetry.</p>
      </div>
    );
  }

  const color = TAXONOMY_COLORS[hotspot.classification] || '#94a3b8';
  const reasons = hotspot.reasons && hotspot.reasons.length > 0
    ? hotspot.reasons
    : [hotspot.explanation || 'Thermal signature evaluated by decision engine.'];

  return (
    <div className="bg-dark-850/90 border border-slate-800 rounded-xl p-4 space-y-3.5 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
              {hotspot.classification}
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-100 mt-0.5 leading-snug">
            {hotspot.facility_name || hotspot.explanation || 'Thermal Anomaly'}
          </h3>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            {hotspot.timestamp?.slice(0, 16).replace('T', ' ')} UTC • {hotspot.latitude?.toFixed(4)}°N, {hotspot.longitude?.toFixed(4)}°E
          </p>
        </div>
        <ConfidenceBadge level={hotspot.confidence_level || 'HIGH'} />
      </div>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-dark-900/80 border border-slate-800/60 rounded-lg p-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Radiance (FRP)</span>
          <span className="text-sm font-bold text-sky-300 font-mono">{hotspot.frp} MW</span>
        </div>
        <div className="bg-dark-900/80 border border-slate-800/60 rounded-lg p-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Brightness Temp</span>
          <span className="text-sm font-bold text-amber-300 font-mono">
            {hotspot.brightness_temp ? `${hotspot.brightness_temp} K` : 'N/A'}
          </span>
        </div>
        <div className="bg-dark-900/80 border border-slate-800/60 rounded-lg p-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Persistence</span>
          <span className="text-xs font-semibold text-slate-200 font-mono">
            {hotspot.active_days || 1} observation day(s)
          </span>
        </div>
        <div className="bg-dark-900/80 border border-slate-800/60 rounded-lg p-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Pass Profile</span>
          <span className="text-xs font-semibold text-slate-200 font-mono">
            {hotspot.day_night === 'N' ? 'Night (24/7 Flaring)' : 'Daytime Pass'}
          </span>
        </div>
      </div>

      {/* Land / Asset Attribution */}
      <div className="bg-dark-900/80 border border-slate-800/60 rounded-lg p-2.5 text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-400">Context / Asset:</span>
          <span className="font-medium text-slate-200">{hotspot.facility_category || hotspot.land_context || 'Unassigned'}</span>
        </div>
        {hotspot.distance_to_facility_m !== undefined && hotspot.distance_to_facility_m !== null && (
          <div className="flex justify-between">
            <span className="text-slate-400">Distance to Facility:</span>
            <span className="font-mono text-sky-400">{Math.round(hotspot.distance_to_facility_m)} m</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
          <span className="text-slate-400">Risk Assessment:</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-xs text-amber-300">{hotspot.risk_score || 35.0} / 100</span>
            <RiskBadge level={hotspot.risk_level || 'medium'} />
          </div>
        </div>
      </div>

      {/* Why Classified? Decision Reasoning */}
      <div className="bg-slate-900/90 border border-sky-950/80 rounded-lg p-3 space-y-1.5">
        <div className="flex items-center gap-1 text-[11px] font-bold text-sky-400 uppercase tracking-wider">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Why Classified? (Decision Logic)</span>
        </div>
        <ul className="space-y-1 text-[11px] text-slate-300">
          {reasons.map((reason, index) => (
            <li key={index} className="flex items-start gap-1.5 leading-relaxed">
              <span className="text-sky-400 font-bold mt-0.5">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
