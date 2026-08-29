import React, { useState } from 'react';
import { ConfidenceBadge, RiskBadge } from './RiskBadge';
import { TAXONOMY_COLORS } from '../constants/taxonomy';
import { Flame, ShieldAlert, CheckCircle2, Navigation, Activity, Clock, Truck, X } from 'lucide-react';
import { fetchEmergencyRoute } from '../services/api';

export function HotspotCard({ hotspot, activeRoute, onSetRoute }) {
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);

  if (!hotspot) {
    return (
      <div className="bg-white dark:bg-dark-850/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 text-center shadow-sm">
        <Activity className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2 opacity-50" />
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">No Hotspot Selected</h3>
        <p className="text-xs text-slate-500 mt-1">Click on any map marker or scrub timeline to inspect detection telemetry.</p>
      </div>
    );
  }

  const color = TAXONOMY_COLORS[hotspot.classification] || '#94a3b8';
  const reasons = hotspot.reasons && hotspot.reasons.length > 0
    ? hotspot.reasons
    : [hotspot.explanation || 'Thermal signature evaluated by decision engine.'];

  const handleCalculateRoute = async () => {
    if (activeRoute) {
      onSetRoute(null);
      return;
    }

    setLoadingRoute(true);
    setRouteError(null);
    try {
      const data = await fetchEmergencyRoute(hotspot.latitude, hotspot.longitude);
      onSetRoute(data);
    } catch (err) {
      console.error(err);
      setRouteError('Failed to calculate road route');
    } finally {
      setLoadingRoute(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-850/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3.5 shadow-md dark:shadow-xl backdrop-blur-md transition-colors duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
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
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 leading-snug">
            {hotspot.facility_name || hotspot.explanation || 'Thermal Anomaly'}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            {hotspot.timestamp?.slice(0, 16).replace('T', ' ')} UTC • {hotspot.latitude?.toFixed(4)}°N, {hotspot.longitude?.toFixed(4)}°E
          </p>
        </div>
        <ConfidenceBadge level={hotspot.confidence_level || 'HIGH'} />
      </div>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-50 dark:bg-dark-900/80 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Radiance (FRP)</span>
          <span className="text-sm font-bold text-sky-600 dark:text-sky-300 font-mono">{hotspot.frp} MW</span>
        </div>
        <div className="bg-slate-50 dark:bg-dark-900/80 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Brightness Temp</span>
          <span className="text-sm font-bold text-amber-600 dark:text-amber-300 font-mono">
            {hotspot.brightness_temp ? `${hotspot.brightness_temp} K` : 'N/A'}
          </span>
        </div>
        <div className="bg-slate-50 dark:bg-dark-900/80 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Persistence</span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
            {hotspot.active_days || 1} observation day(s)
          </span>
        </div>
        <div className="bg-slate-50 dark:bg-dark-900/80 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Pass Profile</span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
            {hotspot.day_night === 'N' ? 'Night (24/7 Flaring)' : 'Daytime Pass'}
          </span>
        </div>
      </div>

      {/* Land / Asset Attribution */}
      <div className="bg-slate-50 dark:bg-dark-900/80 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2.5 text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">Context / Asset:</span>
          <span className="font-medium text-slate-800 dark:text-slate-200">{hotspot.facility_category || hotspot.land_context || 'Unassigned'}</span>
        </div>
        {hotspot.distance_to_facility_m !== undefined && hotspot.distance_to_facility_m !== null && (
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Distance to Facility:</span>
            <span className="font-mono text-sky-600 dark:text-sky-400">{Math.round(hotspot.distance_to_facility_m)} m</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800/60">
          <span className="text-slate-500 dark:text-slate-400">Risk Assessment:</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-300">{hotspot.risk_score || 35.0} / 100</span>
            <RiskBadge level={hotspot.risk_level || 'medium'} />
          </div>
        </div>
      </div>

      {/* Emergency First Responder Route Dispatch Button & Info */}
      <div className="bg-slate-100 dark:bg-dark-900/90 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Emergency Dispatch Route</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">OpenRouteService</span>
        </div>

        <button
          type="button"
          onClick={handleCalculateRoute}
          disabled={loadingRoute}
          className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeRoute
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-md'
          }`}
        >
          {loadingRoute ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Calculating road route...
            </span>
          ) : activeRoute ? (
            <>
              <X className="w-3.5 h-3.5" />
              <span>Clear Emergency Route</span>
            </>
          ) : (
            <>
              <Navigation className="w-3.5 h-3.5" />
              <span>Calculate First-Responder Route</span>
            </>
          )}
        </button>

        {activeRoute && activeRoute.route && (
          <div className="bg-white dark:bg-dark-950/80 border border-amber-300 dark:border-amber-500/30 rounded-lg p-2.5 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Nearest Base:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right truncate max-w-[170px]">
                {activeRoute.origin_depot?.name}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Road Distance:</span>
              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{activeRoute.route.distance_km} km</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Estimated Response Time:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{activeRoute.route.duration_minutes} mins</span>
            </div>
          </div>
        )}

        {routeError && <p className="text-[11px] text-red-500 dark:text-red-400">{routeError}</p>}
      </div>

      {/* Why Classified? Decision Reasoning */}
      <div className="bg-sky-50 dark:bg-slate-900/90 border border-sky-200 dark:border-sky-950/80 rounded-lg p-3 space-y-1.5">
        <div className="flex items-center gap-1 text-[11px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Why Classified? (Decision Logic)</span>
        </div>
        <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
          {reasons.map((reason, index) => (
            <li key={index} className="flex items-start gap-1.5 leading-relaxed">
              <span className="text-sky-600 dark:text-sky-400 font-bold mt-0.5">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
