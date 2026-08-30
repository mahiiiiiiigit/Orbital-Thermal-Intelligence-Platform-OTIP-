import React, { useState, useEffect, useCallback } from 'react';
import { ConfidenceBadge, RiskBadge, DangerBadge } from './RiskBadge';
import { TAXONOMY_COLORS } from '../constants/taxonomy';
import {
  ShieldAlert,
  Navigation,
  Activity,
  AlertOctagon,
  X,
  Eye,
  EyeOff,
  PhoneCall,
  Truck,
  Gauge,
  Layers,
  FileText,
  HelpCircle,
  Clock,
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
}) {
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);

  // Smart Risk Breakdown dropdown state
  const [showRiskBreakdown, setShowRiskBreakdown] = useState(false);

  // Contextual Emergency Response Section State (CLOSED by default)
  const [isOpenRespond, setIsOpenRespond] = useState(false);
  const [triageData, setTriageData] = useState(null);
  const [loadingTriage, setLoadingTriage] = useState(false);

  // Reset states when selected hotspot changes
  useEffect(() => {
    setIsOpenRespond(false);
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
        event_type: hotspot.classification || 'GENERIC',
      });
      setTriageData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTriage(false);
    }
  }, [hotspot]);

  if (!hotspot) return null;

  const color = TAXONOMY_COLORS[hotspot.classification] || '#38bdf8';
  const isFsiDemo = Boolean(hotspot.source === 'FSI_DEMO' || hotspot.is_demo);
  const isCriticalSpike = hotspot.classification === 'INDUSTRIAL_FIRE' || (hotspot.frp && hotspot.frp >= 90);
  const isWildfire = hotspot.classification === 'WILDFIRE';
  const canRespond = isCriticalSpike || isWildfire || hotspot.risk_level === 'CRITICAL' || hotspot.risk_level === 'HIGH' || hotspot.fire_danger_level === 'Extreme' || hotspot.fire_danger_level === 'Very High';

  // Smart Risk Score metrics
  const riskScore = typeof hotspot.risk_score === 'number' ? hotspot.risk_score : 50.0;
  const riskLevel = hotspot.risk_level || 'MEDIUM';
  const riskBreakdown = hotspot.risk_breakdown || {};
  const riskExplanation = hotspot.risk_explanation || hotspot.explanation || 'Evaluated by OTIP multi-factor thermal intelligence model.';

  const nearest = triageData?.nearest || {};

  const getResourceList = () => {
    if (isWildfire || hotspot.context === 'forest') {
      return [
        { key: 'fire_station', label: 'Forest Fire Control Room' },
        { key: 'hospital', label: 'Nearest Emergency Medical' },
        { key: 'police', label: 'Local Police Assistance' },
        { key: 'shelter', label: 'Evacuation Shelter / Camp' },
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

  const handleToggleMapResources = () => {
    if (!onShowTemporaryResources) return;
    if (showingTemporaryResources) {
      onShowTemporaryResources([]);
    } else {
      const list = Object.values(nearest).filter(Boolean);
      onShowTemporaryResources(list);
    }
  };

  const getRiskColor = (score) => {
    if (score >= 75) return '#ef4444'; // red
    if (score >= 50) return '#f97316'; // orange
    if (score >= 25) return '#eab308'; // yellow
    return '#10b981'; // green
  };

  const facilityIdentifier = hotspot.facility_name || `${hotspot.latitude?.toFixed(2)},${hotspot.longitude?.toFixed(2)}`;
  const hasFacilityProfile = Boolean(hotspot.facility_name || ['GAS_FLARE', 'PERSISTENT_INDUSTRIAL', 'MINING_ACTIVITY', 'INDUSTRIAL_FIRE'].includes(hotspot.classification));

  return (
    <div className="bg-white/95 dark:bg-dark-850/95 border border-slate-300 dark:border-dark-700/90 rounded-xl p-3.5 space-y-3 shadow-2xl backdrop-blur-md transition-colors duration-200 max-h-[82vh] overflow-y-auto select-text">
      {/* 1. Header: Classification, Badges, Close Button */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-dark-700/80 pb-2.5">
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
              {hotspot.classification}
            </span>
            {isFsiDemo && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                DEMO FSI
              </span>
            )}
          </div>
          <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 mt-1 truncate">
            {hotspot.forest_name || hotspot.facility_name || hotspot.explanation || 'Thermal Hotspot'}
          </h3>
          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-1">
            <Compass className="w-3 h-3 text-slate-400" />
            <span>{hotspot.latitude?.toFixed(4)}°N, {hotspot.longitude?.toFixed(4)}°E</span>
            <span>•</span>
            <Clock className="w-3 h-3 text-slate-400 ml-0.5" />
            <span>{hotspot.timestamp?.slice(0, 16).replace('T', ' ')} UTC</span>
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
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-dark-750 transition-colors ml-0.5"
              title="Close popup"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Critical Thermal Spike Section (Appears only for genuinely critical events) */}
      {isCriticalSpike && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-red-500 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              <span>Critical Thermal Spike</span>
            </span>
            <span className="text-[10px] font-mono text-red-400 font-bold">
              Z-Score: +{hotspot.z_score || '4.5'}σ
            </span>
          </div>
          <div className="text-slate-300 font-mono text-[10.5px] flex justify-between">
            <span>Current FRP: <strong className="text-red-400">{hotspot.frp} MW</strong></span>
            <span>Baseline: {hotspot.baseline_mean_frp || '27.7'} MW</span>
          </div>
        </div>
      )}

      {/* 3. Telemetry Grouped 4-Cell Grid */}
      <div className="bg-slate-50 dark:bg-dark-900/80 border border-slate-200 dark:border-dark-700/80 rounded-lg p-2.5 text-xs space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-medium">Radiative Power</span>
            <span className="text-sm font-extrabold text-sky-600 dark:text-sky-300 font-mono">{hotspot.frp} MW</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-medium">Brightness Temp</span>
            <span className="text-sm font-extrabold text-amber-600 dark:text-amber-300 font-mono">
              {hotspot.brightness_temp ? `${hotspot.brightness_temp} K` : 'Nominal'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-medium">Persistence</span>
            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 font-mono truncate block">
              {hotspot.active_days ? `${hotspot.active_days} active day(s)` : (hotspot.fire_status || 'Single Pass')}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-medium">Telemetry Source</span>
            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 font-mono truncate block">
              {hotspot.source || 'NASA_FIRMS'}
            </span>
          </div>
        </div>

        {/* Eco-Zone / Location Subtext */}
        <div className="pt-1.5 border-t border-slate-200 dark:border-dark-700/60 flex justify-between items-center text-[10.5px]">
          <span className="text-slate-500 dark:text-slate-400">Context:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
            {hotspot.forest_type || hotspot.facility_category || hotspot.land_context || (hotspot.state ? `${hotspot.district || ''}, ${hotspot.state}` : 'Unassigned')}
          </span>
        </div>
      </div>

      {/* 4. WHY CLASSIFIED Section */}
      <div className="bg-slate-50 dark:bg-dark-900/80 border border-slate-200 dark:border-dark-700/80 rounded-lg p-2.5 text-xs space-y-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <HelpCircle className="w-3 h-3 text-sky-500" />
          <span>Why Classified ({hotspot.classification})</span>
        </div>
        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
          {hotspot.explanation || riskExplanation}
        </p>
        {hotspot.reasons && hotspot.reasons.length > 0 && (
          <ul className="space-y-0.5 pt-1 text-[10.5px] text-slate-600 dark:text-slate-400 font-mono list-disc list-inside">
            {hotspot.reasons.slice(0, 3).map((r, i) => (
              <li key={i} className="truncate">{r}</li>
            ))}
          </ul>
        )}
      </div>

      {/* 5. Smart Risk Score Section */}
      <div className="bg-slate-50 dark:bg-dark-900/80 border border-slate-200 dark:border-dark-700/80 rounded-lg p-2.5 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-sky-500" />
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Smart Risk Score
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-extrabold text-xs" style={{ color: getRiskColor(riskScore) }}>
              {riskScore} <span className="text-[9px] text-slate-400 font-normal">/ 100</span>
            </span>
            <RiskBadge level={riskLevel} />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-dark-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(5, riskScore))}%`,
              backgroundColor: getRiskColor(riskScore),
            }}
          />
        </div>

        {/* Contributing Factors Toggle */}
        {Object.keys(riskBreakdown).length > 0 && (
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setShowRiskBreakdown(!showRiskBreakdown)}
              className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-500 flex items-center justify-between w-full transition-colors"
            >
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-sky-500" />
                <span>Risk Breakdown</span>
              </span>
              <span className="font-mono text-[9px] text-sky-500">
                {showRiskBreakdown ? '▲ Hide' : '▼ View Points'}
              </span>
            </button>

            {showRiskBreakdown && (
              <div className="mt-1.5 bg-white dark:bg-dark-850 rounded p-1.5 border border-slate-200 dark:border-dark-700 space-y-0.5">
                {Object.entries(riskBreakdown).map(([factor, pts]) => (
                  <div key={factor} className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-600 dark:text-slate-400">{factor}:</span>
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400">+{pts}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Contextual Emergency Response Section (Expandable via [Respond] action) */}
      {isOpenRespond && (
        <div className="bg-slate-50 dark:bg-dark-900/90 border border-red-500/30 rounded-lg p-2.5 space-y-2 text-xs animate-fadeIn">
          <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 dark:border-dark-700 text-[10.5px]">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              National Emergency: <strong className="text-red-500 font-mono">112</strong>
            </span>
            <button
              type="button"
              onClick={handleToggleMapResources}
              className="px-2 py-0.5 rounded border border-slate-200 dark:border-dark-700 hover:bg-slate-200 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[9.5px] transition-colors"
            >
              {showingTemporaryResources ? (
                <>
                  <EyeOff className="w-3 h-3 text-amber-500" />
                  <span>Hide On Map</span>
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 text-sky-500" />
                  <span>Show On Map</span>
                </>
              )}
            </button>
          </div>

          {loadingTriage ? (
            <div className="py-3 text-center text-slate-400">
              <div className="w-3.5 h-3.5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-1" />
              <span className="text-[10px]">Locating safety infrastructure...</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {getResourceList().map(({ key, label }) => {
                const res = nearest[key];
                if (!res) return null;
                return (
                  <div key={key} className="bg-white dark:bg-dark-850 p-1.5 rounded border border-slate-200 dark:border-dark-700 flex justify-between items-center text-[10.5px]">
                    <div className="truncate pr-1">
                      <div className="text-[9.5px] font-bold text-slate-500 uppercase">{label}</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{res.name}</div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="font-mono text-[10px] text-amber-500 font-bold">{res.distance_km} km</span>
                      {res.contact && (
                        <a
                          href={`tel:${res.contact}`}
                          className="p-1 rounded bg-slate-100 dark:bg-dark-750 hover:text-sky-400 transition-colors"
                          title={`Call ${res.contact}`}
                        >
                          <PhoneCall className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Route Calculation Inside Respond */}
          <button
            type="button"
            onClick={handleCalculateRoute}
            disabled={loadingRoute}
            className={`w-full py-1.5 px-2 rounded-md text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeRoute
                ? 'bg-rose-600 text-white hover:bg-rose-500'
                : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 shadow-sm'
            }`}
          >
            {loadingRoute ? (
              <span>Calculating road route...</span>
            ) : activeRoute ? (
              <>
                <X className="w-3 h-3" />
                <span>Clear Route ({activeRoute.route?.distance_km} km)</span>
              </>
            ) : (
              <>
                <Navigation className="w-3 h-3" />
                <span>Calculate Dispatch Route</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 7. Action Footer Bar ([Investigate / Fingerprint], [Respond], [Dossier]) */}
      <div className="pt-2 border-t border-slate-200 dark:border-dark-700/80 flex items-center gap-1.5">
        {hasFacilityProfile && (
          <button
            type="button"
            onClick={() => onViewFingerprint && onViewFingerprint(facilityIdentifier)}
            className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 border border-slate-300 dark:border-dark-700 text-slate-800 dark:text-slate-200 rounded-lg font-bold text-[10.5px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Activity className="w-3 h-3 text-sky-500" />
            <span>Fingerprint</span>
          </button>
        )}

        {canRespond && (
          <button
            type="button"
            onClick={() => {
              const nextState = !isOpenRespond;
              setIsOpenRespond(nextState);
              if (nextState && !triageData && !loadingTriage) {
                loadTriageData();
              }
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[10.5px] flex items-center justify-center gap-1.5 transition-all shadow-sm ${
              isOpenRespond
                ? 'bg-dark-700 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            <span>{isOpenRespond ? 'Close' : 'Respond'}</span>
          </button>
        )}

        <a
          href={getDossierDownloadUrl('event', hotspot.id || `${hotspot.latitude},${hotspot.longitude}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 border border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-[10.5px] flex items-center gap-1 transition-colors"
          title="Download Intelligence Dossier (PDF/JSON)"
        >
          <FileText className="w-3 h-3 text-slate-400" />
          <span>Dossier</span>
        </a>
      </div>
    </div>
  );
}
