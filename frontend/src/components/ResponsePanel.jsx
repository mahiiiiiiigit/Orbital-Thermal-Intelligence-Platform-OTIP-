import React from 'react';
import { TAXONOMY_COLORS } from '../constants/taxonomy';
import {
  ShieldAlert,
  X,
  PhoneCall,
  Navigation,
  CheckCircle2,
  AlertOctagon,
  Clock,
  MapPin,
  Flame,
  Info,
  Truck,
  ExternalLink,
} from 'lucide-react';

export function ResponsePanel({
  isOpen,
  onClose,
  hotspot,
  nearestData,
  loading = false,
  onGetRoute,
}) {
  if (!isOpen || !hotspot) return null;

  const color = TAXONOMY_COLORS[hotspot.classification] || '#94a3b8';
  const nearest = nearestData?.nearest_resources || {};
  const sop = nearestData?.recommended_response || {};
  const contacts = nearestData?.emergency_contacts || {
    national_emergency: '112',
    fire_service: '101',
    ambulance_service: '108',
    police_control: '100',
    disaster_management_helpline: '1078',
  };

  const resourceCategories = [
    { key: 'fire_station', label: 'Nearest Fire Station', icon: '🚒', color: '#ef4444' },
    { key: 'hospital', label: 'Nearest Hospital & ICU', icon: '🏥', color: '#06b6d4' },
    { key: 'ambulance', label: 'Nearest Ambulance (108 EMS)', icon: '🚑', color: '#f59e0b' },
    { key: 'police', label: 'Nearest Police Outpost', icon: '👮', color: '#3b82f6' },
    { key: 'shelter', label: 'Designated Evacuation Shelter', icon: '🏠', color: '#8b5cf6' },
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden transition-colors duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50 dark:bg-dark-850">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 text-white"
              style={{ backgroundColor: color }}
            >
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
                  style={{ backgroundColor: color }}
                >
                  {hotspot.classification}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                  DEMO SAFETY DATA
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 leading-snug">
                Emergency Incident Triage: {hotspot.forest_name || hotspot.facility_name || 'Thermal Hotspot'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {hotspot.latitude?.toFixed(4)}°N, {hotspot.longitude?.toFixed(4)}°E • Radiance: <strong className="text-sky-600 dark:text-sky-400">{hotspot.frp} MW</strong> • Risk Score: <strong className="text-amber-600 dark:text-amber-400">{hotspot.risk_score || 50.0}/100</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* 1. National Emergency Quick Dial Banner */}
          <div className="bg-gradient-to-r from-red-600/10 via-amber-600/10 to-transparent border border-red-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-red-500 animate-pulse" />
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">National Emergency Helpline:</span>
                <span className="ml-2 font-mono text-sm font-extrabold text-red-600 dark:text-red-400">112</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="text-slate-600 dark:text-slate-300">🚒 Fire: <strong className="text-red-500">101</strong></span>
              <span className="text-slate-600 dark:text-slate-300">🚑 Ambulance: <strong className="text-amber-500">108</strong></span>
              <span className="text-slate-600 dark:text-slate-300">👮 Police: <strong className="text-blue-500">100</strong></span>
              <span className="text-slate-600 dark:text-slate-300">🌪️ Disaster: <strong className="text-purple-500">1078</strong></span>
            </div>
          </div>

          {/* 2. Nearest Safety Resources Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Nearest Safety Infrastructure</span>
              <span className="text-[10px] text-slate-400 font-normal font-mono">Radial & Driving Road Analysis</span>
            </h3>

            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>Locating nearest emergency facilities...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {resourceCategories.map((cat) => {
                  const res = nearest[cat.key];
                  return (
                    <div
                      key={cat.key}
                      className="bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </span>
                        {res && (
                          <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-xs">
                            {res.distance_km} km away
                          </span>
                        )}
                      </div>

                      {res ? (
                        <>
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate">
                            {res.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {res.district}, {res.state} • Est. Travel Time: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{res.estimated_travel_time_mins} mins</strong>
                          </p>
                          {res.notes && (
                            <p className="text-[10.5px] text-slate-600 dark:text-slate-400 bg-white dark:bg-dark-900 rounded p-1.5 border border-slate-200 dark:border-slate-800/80">
                              {res.notes}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800/80 text-[10px] text-slate-400">
                            <span className="truncate max-w-[170px]" title={res.source}>
                              Source: {res.source}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                onGetRoute(res.latitude, res.longitude, hotspot.latitude, hotspot.longitude, res.name);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-1 transition-colors shadow-sm"
                            >
                              <Navigation className="w-3 h-3" />
                              <span>Get Route</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="p-2.5 text-center text-slate-400 dark:text-slate-500 italic bg-white dark:bg-dark-900 rounded-lg">
                          No verified nearby resource found (&gt;120 km)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Standard Operating Procedures (SOP Guidance) */}
          <div className="bg-sky-50 dark:bg-dark-850 border border-sky-200 dark:border-sky-950 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between border-b border-sky-200 dark:border-sky-900 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900 dark:text-sky-300 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Recommended Response (Standard Operating Protocol)</span>
              </div>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-sky-200 dark:bg-sky-900 text-sky-800 dark:text-sky-300">
                {sop.protocol_code || 'SOP-EMERGENCY'}
              </span>
            </div>

            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
              {sop.title || 'Standard Incident Containment Protocol'}
            </h4>

            {sop.actions && (
              <ul className="space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                {sop.actions.map((act, index) => (
                  <li key={index} className="flex items-start gap-1.5 leading-relaxed">
                    <span className="text-sky-600 dark:text-sky-400 font-bold mt-0.5">✓</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            )}

            {sop.evacuation_guidance && (
              <div className="bg-white dark:bg-dark-900 border border-sky-200 dark:border-sky-800/60 rounded-lg p-2 text-[11px] text-slate-700 dark:text-slate-300">
                <strong className="text-amber-600 dark:text-amber-400">Evacuation Guidance: </strong>
                <span>{sop.evacuation_guidance}</span>
              </div>
            )}

            <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 flex justify-between">
              <span>Authority: {sop.source_authority || 'National Disaster Management Authority'}</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Verified Protocol</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-850 flex justify-between items-center text-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Clicking <strong>[ Get Route ]</strong> loads the turn-by-turn road route on the main GIS map.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-dark-700 dark:hover:bg-dark-600 text-slate-800 dark:text-white font-semibold transition-colors"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
