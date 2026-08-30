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
  FileText,
  Eye,
  EyeOff,
  PhoneCall,
  Truck,
  X,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import { fetchEmergencyRoute, fetchNearestSafetyResources, getDossierDownloadUrl } from '../services/api';

export function HotspotCard({
  hotspot,
  activeRoute,
  onSetRoute,
  onShowTemporaryResources,
  showingTemporaryResources = false,
  onClose,
  onViewFingerprint,
  onInvestigateEvent,
}) {
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);

  // Smart Risk Breakdown dropdown state
  const [showRiskBreakdown, setShowRiskBreakdown] = useState(false);

  // Contextual Emergency Response Section State (CLOSED by default)
  const [isOpenRespond, setIsOpenRespond] = useState(false);
  const [showEvacSection, setShowEvacSection] = useState(false);
  const [triageData, setTriageData] = useState(null);
  const [loadingTriage, setLoadingTriage] = useState(false);

  // Reset states when selected hotspot changes
  useEffect(() => {
    setIsOpenRespond(false);
    setShowEvacSection(false);
    setShowRiskBreakdown(false);
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

  // Smart Risk Score fields
  const riskScore = hotspot.risk_score != null ? hotspot.risk_score : 25.0;
  const riskLevel = hotspot.risk_level ? String(hotspot.risk_level).toUpperCase() : (riskScore >= 75 ? 'CRITICAL' : (riskScore >= 50 ? 'HIGH' : (riskScore >= 25 ? 'MEDIUM' : 'LOW')));
  const riskBreakdown = hotspot.risk_breakdown || {};
  const riskExplanation = hotspot.risk_explanation || `${riskLevel} risk event evaluated by multi-factor thermal intelligence model.`;

  // Identify Critical Thermal Spikes / Industrial Excursions
  const isCriticalSpike =
    hotspot.classification === 'INDUSTRIAL_FIRE' ||
    Boolean(hotspot.z_score && hotspot.z_score >= 3.0) ||
    riskLevel === 'CRITICAL';

  // Identify Wildfires with high or critical risk
  const isWildfireHighRisk =
    hotspot.classification === 'WILDFIRE' &&
    (riskLevel === 'HIGH' || riskLevel === 'CRITICAL' || hotspot.fire_danger_level === 'HIGH' || hotspot.fire_danger_level === 'EXTREME' || hotspot.large_forest_fire);

  // General dangerous event condition where [RESPOND] action is available
  const canRespond =
    isCriticalSpike ||
    isWildfireHighRisk ||
    (hotspot.classification === 'GAS_FLARE' && (hotspot.frp >= 40 || hotspot.is_anomaly)) ||
    riskScore >= 50;

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
      { key: 'hospital', label: 'Nearest Hospital & Trauma Center' },
      { key: 'police', label: 'Nearest Police Station' },
      { key: 'shelter', label: 'Official Evacuation Point' },
    ];
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
      setRouteError('Failed to calculate road route via OpenRouteService');
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

  // Color gradient for risk score progress bar
  const getRiskColor = (score) => {
    if (score >= 75) return '#ef4444'; // red
    if (score >= 50) return '#f97316'; // orange
    if (score >= 25) return '#eab308'; // yellow
    return '#10b981'; // green
  };

  const hasFacilityAttribution = Boolean(
    hotspot.facility_name &&
    !hotspot.facility_name.toLowerCase().includes('unknown') &&
    !hotspot.facility_name.toLowerCase().includes('unregistered')
  );

  return (
    <div className="bg-dark-900/95 border border-dark-700/90 rounded-xl p-4 space-y-3 shadow-2xl backdrop-blur-md text-slate-200 select-text transition-colors duration-200 w-[370px] max-h-[85vh] overflow-y-auto">
      {/* 1. Header: Classification, Confidence, Facility, Lat/Lon, Date, and Close Button */}
      <div className="flex items-start justify-between gap-2 border-b border-dark-700/80 pb-2.5">
        <div className="flex-1 pr-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
              {hotspot.classification ? hotspot.classification.replace('_', ' ') : 'HOTSPOT'}
            </span>
            {isFsiDemo && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                DEMO FSI
              </span>
            )}
          </div>
          <h3 className="text-sm font-extrabold text-slate-100 mt-1 leading-snug">
            {hotspot.forest_name || hotspot.facility_name || hotspot.explanation || 'Thermal Anomaly Event'}
          </h3>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
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
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-dark-750 transition-colors ml-1"
              title="Close hotspot popup"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Critical Thermal Spike Section (Appears for critical events) */}
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

      {/* 3. Smart Risk Assessment Section */}
      <div className="bg-dark-850 border border-dark-700/80 rounded-xl p-3 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
            <span>Multi-Factor Risk Score</span>
          </span>
          <RiskBadge level={riskLevel} />
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono font-bold">
            <span className="text-slate-400">Threat Level:</span>
            <span style={{ color: getRiskColor(riskScore) }}>{riskScore.toFixed(1)} / 100</span>
          </div>
          <div className="w-full h-2 bg-dark-900 rounded-full overflow-hidden border border-dark-750">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(5, riskScore))}%`,
                backgroundColor: getRiskColor(riskScore),
              }}
            />
          </div>
        </div>

        {/* Explainable Rationale */}
        <p className="text-[11px] text-slate-300 leading-snug">
          {riskExplanation}
        </p>

        {/* Breakdown Dropdown */}
        {Object.keys(riskBreakdown).length > 0 && (
          <div className="pt-1 border-t border-dark-750">
            <button
              type="button"
              onClick={() => setShowRiskBreakdown(!showRiskBreakdown)}
              className="w-full flex items-center justify-between text-[10.5px] font-bold text-slate-400 hover:text-slate-200 transition-colors"
            >
              <span>View Score Breakdown Factors</span>
              {showRiskBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showRiskBreakdown && (
              <div className="mt-2 space-y-1.5 bg-dark-900 rounded-lg p-2 border border-dark-750 text-[10.5px] font-mono">
                {riskBreakdown.frp_intensity_score !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Thermal Radiance (FRP):</span>
                    <span className="font-bold text-amber-400">+{riskBreakdown.frp_intensity_score} pts</span>
                  </div>
                )}
                {riskBreakdown.persistence_score !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Persistence Excursion:</span>
                    <span className="font-bold text-sky-400">+{riskBreakdown.persistence_score} pts</span>
                  </div>
                )}
                {riskBreakdown.proximity_penalty !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Proximity Factor:</span>
                    <span className="font-bold text-rose-400">+{riskBreakdown.proximity_penalty} pts</span>
                  </div>
                )}
                {riskBreakdown.nighttime_bonus !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Night Detection Penalty:</span>
                    <span className="font-bold text-purple-400">+{riskBreakdown.nighttime_bonus} pts</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Telemetry Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-dark-850 border border-dark-700/80 rounded-lg p-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Radiance (FRP)</span>
          <span className="text-sm font-bold text-sky-400 font-mono">{hotspot.frp} MW</span>
        </div>
        <div className="bg-dark-850 border border-dark-700/80 rounded-lg p-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Brightness Temp</span>
          <span className="text-sm font-bold text-amber-400 font-mono">
            {hotspot.brightness_temp ? `${hotspot.brightness_temp} K` : 'N/A'}
          </span>
        </div>
        <div className="bg-dark-850 border border-dark-700/80 rounded-lg p-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Fire Persistence</span>
          <span className="text-xs font-semibold text-slate-200 font-mono truncate block">
            {hotspot.fire_status || (hotspot.active_days ? `${hotspot.active_days} observation day(s)` : 'Active Pass')}
          </span>
        </div>
        <div className="bg-dark-850 border border-dark-700/80 rounded-lg p-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Data Source</span>
          <span className="text-xs font-semibold text-slate-200 font-mono">
            {hotspot.source || 'NASA_FIRMS'}
          </span>
        </div>
      </div>

      {/* 5. Facility Thermal Fingerprint shortcut (if attributed) */}
      {hasFacilityAttribution && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => onViewFingerprint && onViewFingerprint(hotspot.facility_name || `${hotspot.latitude?.toFixed(2)},${hotspot.longitude?.toFixed(2)}`)}
            className="w-full py-1.5 px-2 bg-dark-850 hover:bg-dark-800 border border-dark-700 text-slate-200 rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>View Facility Thermal Fingerprint</span>
          </button>
        </div>
      )}

      {/* 6. Contextual Emergency Response Accordion (Appears for elevated/critical events) */}
      {canRespond && (
        <div className="border-t border-dark-700/80 pt-2 space-y-2">
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
                ? 'bg-dark-800 text-slate-200 hover:bg-dark-750 border border-dark-700'
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
            <div className="bg-dark-850 border border-dark-700 rounded-xl p-3 space-y-3 text-xs animate-fadeIn">
              {loadingTriage ? (
                <div className="py-4 text-center text-slate-400">
                  <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
                  <span>Loading nearby emergency infrastructure...</span>
                </div>
              ) : (
                <>
                  {/* Event & Helpline Header */}
                  <div className="flex justify-between items-center pb-2 border-b border-dark-750 text-[11px]">
                    <span className="text-slate-300">
                      Emergency Helpline: <strong className="text-red-400 font-mono">112</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleMapResources}
                      className="px-2 py-0.5 rounded border border-dark-700 hover:bg-dark-750 text-slate-300 flex items-center gap-1 text-[10px] transition-colors"
                    >
                      {showingTemporaryResources ? (
                        <>
                          <EyeOff className="w-3 h-3 text-amber-400" />
                          <span>Hide on Map</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 text-sky-400" />
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
                          className="bg-dark-900 border border-dark-750 rounded-lg p-2.5 space-y-1 shadow-sm"
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-slate-300 text-[11px]">
                              {label}
                            </span>
                            {res && (
                              <span className="font-mono text-sky-400 font-bold text-[11px]">
                                {res.distance_km} km
                              </span>
                            )}
                          </div>

                          {res ? (
                            <>
                              <div className="font-semibold text-slate-100 text-xs truncate">
                                {res.name}
                              </div>
                              <div className="flex justify-between items-center pt-1 border-t border-dark-750 text-[10px] text-slate-400">
                                <span>ETA: <strong className="text-emerald-400 font-mono">{res.estimated_travel_time_mins} min</strong></span>
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
                            <div className="text-[10px] text-slate-500 italic">
                              No verified nearby resource found for this category.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Official Safety Guidance (SOP) */}
                  {sop.title && (
                    <div className="bg-dark-900 rounded-lg p-2.5 border border-dark-750 text-[10.5px] text-slate-300 space-y-1">
                      <strong className="text-sky-400 block font-semibold">
                        SOP: {sop.title}
                      </strong>
                      <p className="leading-snug text-slate-400">
                        {sop.actions && sop.actions[0]}
                      </p>
                    </div>
                  )}

                  {/* Demo safety label & Notice */}
                  <div className="pt-1 flex justify-between items-center border-t border-dark-750 text-[10px] text-slate-500">
                    <span>DEMO SAFETY DATA (NDMA / FSI)</span>
                    <span className="italic">Decision support only</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* 7. Active Route Card if route is computed */}
      {activeRoute && activeRoute.route && (
        <div className="bg-dark-850 border border-amber-500/40 rounded-xl p-2.5 space-y-1.5 text-xs animate-fadeIn">
          <div className="flex justify-between items-center">
            <span className="font-bold text-amber-400 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" />
              <span>Active Dispatch Route</span>
            </span>
            <button
              type="button"
              onClick={() => onSetRoute && onSetRoute(null)}
              className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-dark-900 border border-dark-700"
            >
              Clear
            </button>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">From:</span>
            <span className="font-semibold text-slate-200 truncate max-w-[190px]">
              {activeRoute.origin_depot?.name}
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Distance & Duration:</span>
            <span className="font-mono text-emerald-400 font-bold">
              {activeRoute.route.distance_km} km ({activeRoute.route.duration_minutes} min)
            </span>
          </div>
        </div>
      )}

      {/* 8. Why Classified? Decision Reasoning Card */}
      <div className="bg-dark-850 border border-dark-700/80 rounded-xl p-3 space-y-1.5 text-xs">
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

      {/* 9. Action Bar: [Investigate], [Generate Dossier] */}
      <div className="pt-2 border-t border-dark-700/80 flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => onInvestigateEvent && onInvestigateEvent(hotspot)}
          className="flex-1 py-1.5 px-3 bg-dark-800 hover:bg-dark-750 border border-dark-700 text-slate-200 hover:text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>Investigate</span>
        </button>

        <a
          href={getDossierDownloadUrl(hotspot.id || 'jamnagar-refinery', 'demo')}
          target="_blank"
          rel="noreferrer"
          className="flex-1 py-1.5 px-3 bg-dark-850 hover:bg-dark-800 border border-dark-700 text-slate-300 hover:text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 text-center"
        >
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>Generate Dossier</span>
        </a>
      </div>
    </div>
  );
}
