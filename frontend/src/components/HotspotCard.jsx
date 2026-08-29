import React, { useState, useEffect, useCallback } from 'react';
import { ConfidenceBadge, RiskBadge, DangerBadge } from './RiskBadge';
import { TAXONOMY_COLORS } from '../constants/taxonomy';
import {
  ShieldAlert,
  CheckCircle2,
  Navigation,
  Activity,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  MapPin,
  FileText,
  Eye,
  EyeOff,
  PhoneCall,
  Truck,
  X,
  AlertTriangle,
  LifeBuoy,
} from 'lucide-react';
import { fetchEmergencyRoute, fetchNearestSafetyResources, getDossierDownloadUrl } from '../services/api';

export function HotspotCard({
  hotspot,
  activeRoute,
  onSetRoute,
  onShowTemporaryResources,
  showingTemporaryResources = false,
  onClose,
}) {
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);

  // Contextual Emergency Response Section State (CLOSED by default)
  const [isOpenRespond, setIsOpenRespond] = useState(false);
  const [showEvacSection, setShowEvacSection] = useState(false);
  const [triageData, setTriageData] = useState(null);
  const [loadingTriage, setLoadingTriage] = useState(false);

  // Reset respond state when selected hotspot changes
  useEffect(() => {
    setIsOpenRespond(false);
    setShowEvacSection(false);
    setTriageData(null);
  }, [hotspot?.id || hotspot?.latitude]);

  const loadTriageData = useCallback(async () => {
    if (!hotspot) return;
    setLoadingTriage(true);
    try {
      const data = await fetchNearestSafetyResources({
        lat: hotspot.latitude,
        lon: hotspot.longitude,
        classification: hotspot.classification,
        frp: hotspot.frp,
        riskScore: hotspot.risk_score || 50.0,
      });
      setTriageData(data);
    } catch (err) {
      console.error('Failed to load triage resources:', err);
    } finally {
      setLoadingTriage(false);
    }
  }, [hotspot]);

  if (!hotspot) {
    return null;
  }

  const isFsiDemo = hotspot.source === 'DEMO_FSI' || (hotspot.is_demo === true && hotspot.fire_danger_level);
  const color = TAXONOMY_COLORS[hotspot.classification] || '#94a3b8';
  const reasons = hotspot.reasons && hotspot.reasons.length > 0
    ? hotspot.reasons
    : [hotspot.explanation || 'Thermal signature evaluated by decision engine.'];

  // Identify Critical Thermal Spikes / Industrial Excursions
  const isCriticalSpike =
    hotspot.classification === 'INDUSTRIAL_FIRE' ||
    Boolean(hotspot.z_score && hotspot.z_score >= 3.0) ||
    Boolean(hotspot.severity === 'CRITICAL');

  // Identify Wildfires with high or critical risk
  const isWildfireHighRisk =
    hotspot.classification === 'WILDFIRE' &&
    (hotspot.risk_level === 'high' || hotspot.risk_level === 'critical' || hotspot.fire_danger_level === 'HIGH' || hotspot.fire_danger_level === 'EXTREME' || hotspot.large_forest_fire);

  // General dangerous event condition where [RESPOND] action is available
  const canRespond =
    isCriticalSpike ||
    isWildfireHighRisk ||
    (hotspot.classification === 'GAS_FLARE' && hotspot.frp >= 40) ||
    (hotspot.risk_score && hotspot.risk_score >= 55);

  const nearest = triageData?.nearest_resources || {};
  const sop = triageData?.recommended_response || {};

  // Event-specific resource ordering
  const getResourceList = () => {
    if (hotspot.classification === 'WILDFIRE') {
      return [
        { key: 'fire_station', label: 'Forest Fire Response Base' },
        { key: 'hospital', label: 'Nearest Hospital & Burn Care' },
        { key: 'police', label: 'Police & SDRF Outpost' },
        { key: 'shelter', label: 'Official Evacuation / Safe Location' },
      ];
    }
    return [
      { key: 'fire_station', label: 'Nearest Fire Station' },
      { key: 'hospital', label: 'Nearest Hospital & ICU' },
      { key: 'police', label: 'Nearest Police Station' },
      { key: 'shelter', label: 'Official Evacuation Point' },
    ];
  };

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

  const handleRouteToResource = async (res) => {
    if (!res) return;
    setLoadingRoute(true);
    setRouteError(null);
    try {
      const data = await fetchEmergencyRoute(hotspot.latitude, hotspot.longitude, res.latitude, res.longitude);
      if (data && data.origin_depot) {
        data.origin_depot.name = res.name;
      }
      onSetRoute(data);
    } catch (err) {
      console.error(err);
      setRouteError('Failed to calculate road route');
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

  return (
    <div className="bg-white/95 dark:bg-dark-850/95 border border-slate-300 dark:border-slate-700/80 rounded-2xl p-4 space-y-3 shadow-2xl backdrop-blur-xl transition-colors duration-200 max-h-[82vh] overflow-y-auto select-text">
      {/* 1. Header: Classification, Confidence, Facility, Lat/Lon, Date, and Close Button */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
        <div className="flex-1 pr-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
              {hotspot.classification}
            </span>
            {isFsiDemo && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40">
                DEMO FSI
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 leading-snug">
            {hotspot.forest_name || hotspot.facility_name || hotspot.explanation || 'Thermal Anomaly'}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            {hotspot.state ? `${hotspot.district || ''}, ${hotspot.state} • ` : ''}
            {hotspot.latitude?.toFixed(4)}°N, {hotspot.longitude?.toFixed(4)}°E • {hotspot.timestamp?.slice(0, 16).replace('T', ' ')} UTC
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex flex-col items-end gap-1">
            <ConfidenceBadge level={hotspot.confidence_level || 'HIGH'} />
            {hotspot.fire_danger_level && (
              <DangerBadge level={hotspot.fire_danger_level} />
            )}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ml-1"
              title="Close popup"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Critical Thermal Spike Section (Appears for genuinely critical events) */}
      {isCriticalSpike && (
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>Critical Thermal Spike</span>
            </span>
            <span className="text-[10px] font-mono text-red-300 font-bold">
              Z-Score: +{hotspot.z_score || '4.5'}σ
            </span>
          </div>
          <div className="text-slate-300 space-y-0.5 font-mono text-[11px]">
            <div><strong>Facility:</strong> {hotspot.facility_name || 'Registered Industrial Complex'}</div>
            <div><strong>Current FRP:</strong> <span className="text-red-400 font-bold">{hotspot.frp} MW</span></div>
            <div><strong>Normal Baseline:</strong> {hotspot.baseline_mean_frp || '27.7'} MW</div>
          </div>
        </div>
      )}

      {/* 3. Large Forest Fire Alert Banner */}
      {hotspot.large_forest_fire && (
        <div className="bg-rose-500/15 border border-rose-500/40 rounded-lg p-2 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-bold">
          <AlertOctagon className="w-4 h-4 text-rose-500 animate-pulse flex-shrink-0" />
          <span>LARGE FOREST FIRE EXCURSION (High Intensity Spatial Cluster)</span>
        </div>
      )}

      {/* 4. Telemetry Grid (Radiance FRP, Brightness Temp, Status, Data Source) */}
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
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Fire Status / Persistence</span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono truncate block">
            {hotspot.fire_status || (hotspot.active_days ? `${hotspot.active_days} observation day(s)` : 'Active Pass')}
          </span>
        </div>
        <div className="bg-slate-50 dark:bg-dark-900/80 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Data Source</span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
            {hotspot.source || 'NASA_FIRMS'}
          </span>
        </div>
      </div>

      {/* 5. Forest Context / Land Attribution Card */}
      <div className="bg-slate-50 dark:bg-dark-900/80 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2.5 text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">Context / Eco-Zone:</span>
          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[190px]">
            {hotspot.forest_type || hotspot.facility_category || hotspot.land_context || 'Unassigned'}
          </span>
        </div>
        {hotspot.district && (
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Forest Division:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">{hotspot.district} ({hotspot.state})</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800/60">
          <span className="text-slate-500 dark:text-slate-400">Wildfire Risk Index:</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-300">{hotspot.risk_score || 35.0} / 100</span>
            <RiskBadge level={hotspot.risk_level || 'medium'} />
          </div>
        </div>
      </div>

      {/* 6. Emergency Dispatch Route (Always available on all hotspots) */}
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

      {/* 7. [RESPOND] Action Button (Shown for High-Risk / Critical / Wildfire events) */}
      {canRespond && (
        <div className="border-t border-slate-200 dark:border-slate-800 pt-2.5 space-y-2">
          <button
            type="button"
            onClick={() => {
              const nextState = !isOpenRespond;
              setIsOpenRespond(nextState);
              if (nextState && !triageData && !loadingTriage) {
                loadTriageData();
              }
            }}
            className={`w-full py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
              isOpenRespond
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 dark:bg-slate-700 dark:text-white'
                : 'bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-red-600/30'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{isOpenRespond ? 'Close Emergency Response' : 'RESPOND (Nearby Safety Resources)'}</span>
            <span className="ml-1 text-[10px] opacity-75">
              {isOpenRespond ? '▲' : '▼'}
            </span>
          </button>

          {/* Emergency Response Expanded Section */}
          {isOpenRespond && (
            <div className="bg-slate-50 dark:bg-dark-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-3 text-xs animate-fadeIn">
              {loadingTriage ? (
                <div className="py-4 text-center text-slate-400">
                  <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
                  <span>Loading nearby emergency infrastructure...</span>
                </div>
              ) : (
                <>
                  {/* Event & Helpline Header */}
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800 text-[11px]">
                    <span className="text-slate-600 dark:text-slate-400">
                      Emergency Helpline: <strong className="text-red-500 font-mono">112</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleMapResources}
                      className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[10px] transition-colors"
                    >
                      {showingTemporaryResources ? (
                        <>
                          <EyeOff className="w-3 h-3 text-amber-500" />
                          <span>Hide on Map</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 text-sky-500" />
                          <span>Show on Map</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Resource Cards */}
                  <div className="space-y-2">
                    {getResourceList().map(({ key, label }) => {
                      const res = nearest[key];
                      return (
                        <div
                          key={key}
                          className="bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-800/80 rounded-lg p-2.5 space-y-1 shadow-sm"
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                              {label}
                            </span>
                            {res && (
                              <span className="font-mono text-sky-600 dark:text-sky-400 font-bold text-[11px]">
                                {res.distance_km} km
                              </span>
                            )}
                          </div>

                          {res ? (
                            <>
                              <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate">
                                {res.name}
                              </div>
                              <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-500">
                                <span>ETA: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{res.estimated_travel_time_mins} min</strong></span>
                                <button
                                  type="button"
                                  onClick={() => handleRouteToResource(res)}
                                  disabled={loadingRoute}
                                  className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-1 transition-colors"
                                >
                                  <Navigation className="w-2.5 h-2.5" />
                                  <span>Route</span>
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="text-[10px] text-slate-400 italic">
                              No verified nearby resource found
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Evacuation / Safe-Location Card */}
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-2 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setShowEvacSection(!showEvacSection)}
                      className="text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-sky-500 flex items-center justify-between w-full"
                    >
                      <span>Evacuation / Safe Locations</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {showEvacSection ? '▲' : '▼'}
                      </span>
                    </button>

                    {showEvacSection && (
                      <div className="bg-white dark:bg-dark-850 rounded-lg p-2.5 border border-slate-200 dark:border-slate-800/80 text-[11px]">
                        {nearest.shelter ? (
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {nearest.shelter.name}
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-[10px]">
                              {nearest.shelter.notes || 'Designated disaster relief center'} • Distance: {nearest.shelter.distance_km} km
                            </p>
                            <button
                              type="button"
                              onClick={() => handleRouteToResource(nearest.shelter)}
                              className="w-full mt-1 py-1 rounded bg-slate-100 dark:bg-dark-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-[10px] flex items-center justify-center gap-1"
                            >
                              <Navigation className="w-3 h-3 text-sky-500" />
                              <span>Route to Evacuation Point</span>
                            </button>
                          </div>
                        ) : (
                          <p className="text-slate-400 italic text-[10.5px]">
                            No verified evacuation point available for this location.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Official Safety Guidance (SOP) */}
                  {sop.title && (
                    <div className="bg-sky-50 dark:bg-dark-850 rounded-lg p-2.5 border border-sky-200 dark:border-sky-950 text-[10.5px] text-slate-700 dark:text-slate-300 space-y-1">
                      <strong className="text-sky-700 dark:text-sky-400 block font-semibold">
                        SOP: {sop.title}
                      </strong>
                      <p className="leading-snug text-slate-600 dark:text-slate-400">
                        {sop.actions && sop.actions[0]}
                      </p>
                    </div>
                  )}

                  {/* Dossier Action */}
                  <div className="pt-1 flex justify-between items-center border-t border-slate-200 dark:border-slate-800 text-[10px]">
                    <span className="text-slate-400">DEMO SAFETY DATA (NDMA / FSI)</span>
                    <a
                      href={getDossierDownloadUrl(hotspot.id || 'jamnagar-refinery', 'demo')}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 dark:bg-dark-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <FileText className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                      <span>Generate Dossier</span>
                    </a>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* 8. Why Classified? Decision Reasoning Card */}
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
