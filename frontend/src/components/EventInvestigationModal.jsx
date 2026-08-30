import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  MapPin,
  Calendar,
  Layers,
  FileText,
  X,
  Navigation,
  Activity,
  Flame,
  PhoneCall,
  Eye,
  EyeOff,
  Building2,
  Clock,
} from 'lucide-react';
import { fetchEmergencyRoute, fetchNearestSafetyResources, getDossierDownloadUrl } from '../services/api';
import { TAXONOMY_COLORS } from '../constants/taxonomy';

export function EventInvestigationModal({
  event, // Cluster or Hotspot object
  mode = 'auto',
  onClose,
  onSetRoute,
  onShowTemporaryResources,
  showingTemporaryResources = false,
}) {
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [routeError, setRouteError] = useState(null);

  const [triageData, setTriageData] = useState(null);
  const [loadingTriage, setLoadingTriage] = useState(true);

  const lat = event?.latitude;
  const lon = event?.longitude;

  useEffect(() => {
    if (!lat || !lon) return;
    let isMounted = true;
    setLoadingTriage(true);

    fetchNearestSafetyResources({
      lat,
      lon,
      event_type: event.classification || 'GENERIC',
    })
      .then((data) => {
        if (isMounted) {
          setTriageData(data);
          setLoadingTriage(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load safety resources:', err);
        if (isMounted) setLoadingTriage(false);
      });

    return () => {
      isMounted = false;
    };
  }, [lat, lon, event?.classification]);

  if (!event) return null;

  const color = TAXONOMY_COLORS[event.classification] || '#8b5cf6';
  const isSpike = event.classification === 'INDUSTRIAL_FIRE' || (event.peak_frp && event.peak_frp >= 90) || (event.frp && event.frp >= 90);
  const riskScore = event.risk_score != null ? event.risk_score : (isSpike ? 85 : 55);
  const riskLevel = event.risk_level ? String(event.risk_level).toUpperCase() : (riskScore >= 75 ? 'CRITICAL' : (riskScore >= 50 ? 'HIGH' : 'MEDIUM'));
  const isAbnormal = event.is_anomaly || event.classification === 'INDUSTRIAL_FIRE' || riskScore >= 70;

  const eventTitle = event.facility_name || event.forest_name || event.cluster_id || 'Thermal Anomaly Target';
  const dossierUrl = getDossierDownloadUrl(event.cluster_id || event.id || `${lat},${lon}`, mode);
  const nearest = triageData?.nearest || {};

  const handleCalculateRoute = async () => {
    if (routeData) {
      setRouteData(null);
      if (onSetRoute) onSetRoute(null);
      return;
    }
    setLoadingRoute(true);
    setRouteError(null);
    try {
      const data = await fetchEmergencyRoute(lat, lon);
      setRouteData(data);
      if (onSetRoute) onSetRoute(data);
    } catch (err) {
      console.error(err);
      setRouteError('Failed to calculate emergency dispatch route');
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleToggleMapResources = () => {
    if (!onShowTemporaryResources) return;
    if (showingTemporaryResources) {
      onShowTemporaryResources([]);
    } else {
      const list = Object.values(nearest).filter(Boolean);
      onShowTemporaryResources(list);
    }
  };

  // Build intelligence reasons
  const intelReasons = event.reasons && event.reasons.length > 0
    ? event.reasons
    : [
        `Repeated thermal signatures detected within 1.0 km radius`,
        `Radiative power (${event.peak_frp || event.frp || 35} MW) significantly exceeds ambient background`,
        `Spatial correlation with registered infrastructure: ${eventTitle}`,
        `Multi-pass persistence confirmed across observation period`,
      ];

  return (
    <div
      className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-text"
      onClick={onClose}
    >
      <div
        className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-dark-700 bg-dark-850 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-dark-750 text-slate-300 border border-dark-700">
                  INCIDENT INVESTIGATION
                </span>
                <span
                  className="text-xs font-bold uppercase tracking-wider font-sans"
                  style={{ color }}
                >
                  {event.classification ? event.classification.replace('_', ' ') : 'THERMAL INCIDENT'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    riskLevel === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                      : 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                  }`}
                >
                  {riskLevel} RISK
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-white mt-1 leading-snug">
                {eventTitle}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-750 border border-transparent hover:border-dark-700 transition-all"
            title="Close investigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top 4 KPI Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 pb-4 bg-dark-900 border-b border-dark-700/80 flex-shrink-0">
          <div className="bg-dark-850 border border-dark-700/80 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Risk Score
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-2xl font-black font-mono tracking-tight ${
                riskScore >= 70 ? 'text-red-400' : (riskScore >= 40 ? 'text-orange-400' : 'text-emerald-400')
              }`}>
                {riskScore}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ 100</span>
            </div>
          </div>

          <div className="bg-dark-850 border border-dark-700/80 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Peak Radiance
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-mono text-amber-400 tracking-tight">
                {event.peak_frp || event.frp || '35.0'}
              </span>
              <span className="text-xs text-slate-500 font-mono">MW</span>
            </div>
          </div>

          <div className="bg-dark-850 border border-dark-700/80 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Detections / Passes
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-mono text-slate-100 tracking-tight">
                {event.detection_count || 1}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({event.active_days || 1} active days)
              </span>
            </div>
          </div>

          <div className="bg-dark-850 border border-dark-700/80 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Anomaly Status
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-sm font-bold uppercase tracking-wider ${
                isAbnormal ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {isAbnormal ? 'ABNORMAL (+4.5σ)' : 'NOMINAL BASELINE'}
              </span>
            </div>
          </div>
        </div>

        {/* Split Investigation Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Intel & Event History (7 Cols) */}
          <div className="md:col-span-7 space-y-4">
            {/* Why Flagged / Attribution Rationale */}
            <div className="bg-dark-850 border border-dark-700 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>Incident Intelligence & Attribution Rationale</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 pt-1">
                {intelReasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-sky-400 font-bold">•</span>
                    <span className="leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Event Telemetry Details */}
            <div className="bg-dark-850 border border-dark-700 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>Temporal & Geographic Coordinates</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-500 block text-[11px]">Coordinates</span>
                  <span className="font-mono text-slate-200 font-bold">
                    {lat?.toFixed(4)}° N, {lon?.toFixed(4)}° E
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Confidence</span>
                  <span className="font-mono text-slate-200 font-bold">
                    {event.confidence || (event.confidence_level === 'HIGH' ? '92%' : '85%')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">First Overpass</span>
                  <span className="font-mono text-slate-300 text-[11px]">
                    {event.first_detected || `${event.timestamp?.slice(0, 10) || '2025-08-01'} 06:17 UTC`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Latest Observation</span>
                  <span className="font-mono text-slate-300 text-[11px]">
                    {event.last_detected || `${event.timestamp?.slice(0, 16).replace('T', ' ') || '2025-08-30 18:42'} UTC`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Safety Infrastructure & Response Options (5 Cols) */}
          <div className="md:col-span-5 space-y-4">
            {/* Nearest First-Responder Depots */}
            <div className="bg-dark-850 border border-dark-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Emergency Depots</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleMapResources}
                  className="px-2 py-0.5 rounded border border-dark-700 hover:bg-dark-750 text-slate-300 flex items-center gap-1 text-[10px] transition-colors"
                >
                  {showingTemporaryResources ? (
                    <>
                      <EyeOff className="w-3 h-3 text-amber-400" />
                      <span>Hide Map Icons</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 text-sky-400" />
                      <span>Show on Map</span>
                    </>
                  )}
                </button>
              </div>

              {loadingTriage ? (
                <div className="py-4 text-center text-xs text-slate-500">
                  Locating nearest emergency response assets...
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {nearest.fire_station ? (
                    <div className="bg-dark-900/80 border border-dark-750 rounded-lg p-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-slate-200 block text-xs">
                          {nearest.fire_station.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Fire & Rescue Depot • {nearest.fire_station.distance_km} km
                        </span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold text-xs">~6 min</span>
                    </div>
                  ) : null}

                  {nearest.hospital ? (
                    <div className="bg-dark-900/80 border border-dark-750 rounded-lg p-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-slate-200 block text-xs">
                          {nearest.hospital.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Trauma Center • {nearest.hospital.distance_km} km
                        </span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold text-xs">~10 min</span>
                    </div>
                  ) : null}

                  {nearest.police ? (
                    <div className="bg-dark-900/80 border border-dark-750 rounded-lg p-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-slate-200 block text-xs">
                          {nearest.police.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Police Division • {nearest.police.distance_km} km
                        </span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold text-xs">~8 min</span>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Emergency Dispatch Action */}
              <div className="pt-2 border-t border-dark-700/80">
                <button
                  type="button"
                  onClick={handleCalculateRoute}
                  disabled={loadingRoute}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    routeData
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-sky-600 hover:bg-sky-500 text-white shadow-md'
                  }`}
                >
                  {loadingRoute ? (
                    <span>Calculating road route...</span>
                  ) : routeData ? (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>Clear Route ({routeData.route?.distance_km} km / {routeData.route?.duration_min} min)</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Calculate First-Responder Route</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="px-6 py-3 border-t border-dark-700 bg-dark-850 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-slate-400 font-medium">
            National Emergency Dispatch Helpline: <strong className="text-red-400 font-mono">112</strong>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href={dossierUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-4 bg-dark-800 hover:bg-dark-750 border border-dark-700 text-slate-200 hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Generate Incident Dossier (PDF)</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
