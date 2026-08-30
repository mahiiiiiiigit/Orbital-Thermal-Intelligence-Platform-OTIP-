import React, { useState, useEffect } from 'react';
import {
  Factory,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldAlert,
} from 'lucide-react';
import { fetchFacilityThermalProfile, getDossierDownloadUrl } from '../services/api';
import { TAXONOMY_COLORS } from '../constants/taxonomy';

export function FacilityFingerprintModal({
  facilityIdentifier,
  mode = 'auto',
  onClose,
  onInvestigateEvent,
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    if (!facilityIdentifier) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchFacilityThermalProfile(facilityIdentifier, { mode })
      .then((data) => {
        if (isMounted) {
          setProfile(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load facility thermal fingerprint');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [facilityIdentifier, mode]);

  if (!facilityIdentifier) return null;

  const color = profile?.classification
    ? TAXONOMY_COLORS[profile.classification] || '#8b5cf6'
    : '#8b5cf6';

  const metrics = profile?.metrics || {};
  const hasHistory = Boolean(profile?.has_sufficient_history);

  const isAbnormal = hasHistory && (profile?.status === 'ABNORMAL' || (metrics.z_score && metrics.z_score >= 3.0));
  const isElevated = hasHistory && (profile?.status === 'ELEVATED' || (metrics.z_score && metrics.z_score >= 1.5 && metrics.z_score < 3.0));

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ABNORMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>ABNORMAL</span>
          </span>
        );
      case 'ELEVATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-orange-400 border border-amber-500/40">
            <Activity className="w-3.5 h-3.5" />
            <span>ELEVATED</span>
          </span>
        );
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>NORMAL</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-dark-750 text-slate-400 border border-dark-700">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>INSUFFICIENT DATA</span>
          </span>
        );
    }
  };

  const getInterpretationText = () => {
    if (!profile) return '';
    if (!hasHistory) {
      return `Insufficient historical observations for this facility (${profile.total_observations || metrics.total_observations || 0} observations recorded; minimum 3 required for a statistically valid envelope).`;
    }
    if (isAbnormal) {
      return `Current FRP (${metrics.current_frp} MW) is significantly above the historical baseline (+${metrics.z_score}σ excursion).`;
    }
    if (isElevated) {
      return `Current FRP (${metrics.current_frp} MW) shows moderate elevation above normal operating envelope.`;
    }
    return `Current FRP (${metrics.current_frp} MW) is within the facility's expected historical baseline range (${profile.normal_operating_range?.min_mw || '1.0'} – ${profile.normal_operating_range?.max_mw || '3.5'} MW).`;
  };

  // SVG Chart Calculations for 30-Day FRP Profile
  const renderTrendChart = () => {
    if (!profile || !hasHistory || !profile.time_series || profile.time_series.length < 3) {
      return (
        <div className="bg-dark-900 border border-dark-700/80 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
          <HelpCircle className="w-8 h-8 text-slate-500 mb-2 opacity-60" />
          <h4 className="text-xs font-bold text-slate-300">
            Insufficient Historical Data for Reliable Thermal Fingerprint
          </h4>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
            {profile?.total_observations ?? metrics.total_observations ?? 0} observation(s) available in current window. Minimum 3 passes required to construct an empirical statistical envelope.
          </p>
        </div>
      );
    }

    const series = profile.time_series;
    const maxVal = Math.max(...series.map((s) => s.frp), (profile.normal_operating_range?.upper_3sigma_threshold_mw || 50)) * 1.15;
    const minVal = 0;

    const width = 560;
    const height = 210;
    const padding = { top: 20, right: 25, bottom: 30, left: 45 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const getX = (idx) => padding.left + (idx / (series.length - 1 || 1)) * chartW;
    const getY = (val) => padding.top + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;

    const meanY = getY(metrics.average_frp || 0);
    const normMinY = getY(profile.normal_operating_range?.min_mw || 0);
    const normMaxY = getY(profile.normal_operating_range?.max_mw || 0);

    const points = series.map((s, i) => `${getX(i)},${getY(s.frp)}`).join(' ');

    return (
      <div className="bg-dark-900 border border-dark-700/80 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs pb-1 border-b border-dark-750">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px] uppercase tracking-wider">30-DAY FRP THERMAL PROFILE</span>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>FRP</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 border-t border-dashed border-sky-400" />
              <span>Baseline</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Anomaly</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Current</span>
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 select-none">
            {/* Horizontal Grid lines */}
            <line x1={padding.left} y1={padding.top} x2={width - padding.right} y2={padding.top} stroke="#233148" strokeWidth="1" />
            <line x1={padding.left} y1={padding.top + chartH / 2} x2={width - padding.right} y2={padding.top + chartH / 2} stroke="#233148" strokeWidth="1" strokeDasharray="2,2" />
            <line x1={padding.left} y1={padding.top + chartH} x2={width - padding.right} y2={padding.top + chartH} stroke="#2a3b56" strokeWidth="1" />

            {/* Shaded Normal Operating Range Corridor */}
            {profile.normal_operating_range && (
              <rect
                x={padding.left}
                y={normMaxY}
                width={chartW}
                height={Math.max(2, normMinY - normMaxY)}
                fill="rgba(16, 185, 129, 0.08)"
                stroke="rgba(16, 185, 129, 0.3)"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
            )}

            {/* Baseline Mean Dotted Line */}
            <line
              x1={padding.left}
              y1={meanY}
              x2={width - padding.right}
              y2={meanY}
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />

            {/* FRP Time Series Polyline */}
            <polyline
              fill="none"
              stroke="#0284c7"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />

            {/* Data Scatter Points */}
            {series.map((s, idx) => {
              const cx = getX(idx);
              const cy = getY(s.frp);
              const isAnomaly = s.is_anomaly;
              const isCurrent = s.is_current;

              return (
                <g
                  key={idx}
                  className="cursor-pointer transition-transform duration-150 hover:scale-125"
                  onMouseEnter={() => setHoveredPoint({ ...s, cx, cy })}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isCurrent ? 5.5 : isAnomaly ? 5 : 3.5}
                    fill={isAnomaly ? '#ef4444' : isCurrent ? '#f59e0b' : '#0284c7'}
                    stroke="#ffffff"
                    strokeWidth={isCurrent ? 2 : 1}
                  />
                  {isCurrent && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="8"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      className="animate-ping opacity-75"
                    />
                  )}
                </g>
              );
            })}

            {/* Y-Axis Labels */}
            <text x={padding.left - 6} y={padding.top + 4} textAnchor="end" className="text-[9px] fill-slate-400 font-mono">
              {Math.round(maxVal)} MW
            </text>
            <text x={padding.left - 6} y={meanY + 3} textAnchor="end" className="text-[9px] fill-sky-400 font-mono font-bold">
              {metrics.average_frp}
            </text>
            <text x={padding.left - 6} y={padding.top + chartH + 3} textAnchor="end" className="text-[9px] fill-slate-400 font-mono">
              0 MW
            </text>

            {/* X-Axis Labels */}
            {series.length > 0 && (
              <>
                <text x={padding.left} y={height - 8} textAnchor="start" className="text-[9px] fill-slate-400 font-mono">
                  {series[0].date}
                </text>
                <text x={padding.left + chartW / 2} y={height - 8} textAnchor="middle" className="text-[9px] fill-slate-500 font-mono">
                  Observation Passes
                </text>
                <text x={width - padding.right} y={height - 8} textAnchor="end" className="text-[9px] fill-amber-400 font-mono font-bold">
                  Latest: {series[series.length - 1].date}
                </text>
              </>
            )}
          </svg>

          {/* Point Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none bg-dark-950/95 text-white text-[10px] p-2 rounded-lg shadow-xl border border-dark-700 -translate-x-1/2 -translate-y-full mb-2 font-mono z-20 space-y-0.5"
              style={{ left: `${(hoveredPoint.cx / width) * 100}%`, top: `${(hoveredPoint.cy / height) * 100}%` }}
            >
              <div className="font-bold text-sky-400">{hoveredPoint.date}</div>
              <div>FRP: <strong className="text-amber-400">{hoveredPoint.frp} MW</strong></div>
              {hoveredPoint.brightness_temp && (
                <div>Brightness: {hoveredPoint.brightness_temp} K</div>
              )}
              {hoveredPoint.is_anomaly && (
                <div className="text-red-400 font-bold uppercase">🚨 Anomaly Excursion</div>
              )}
              {hoveredPoint.is_current && (
                <div className="text-amber-400 font-bold uppercase">📍 Current Observation</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const dossierUrl = getDossierDownloadUrl(profile?.facility_id || facilityIdentifier || 'jamnagar-refinery', mode);

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
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner bg-dark-800 border border-dark-700"
            >
              <Factory className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-dark-750 text-slate-300 border border-dark-700">
                  FACILITY PROFILE
                </span>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
                  {profile?.category || 'Industrial Site'}
                </span>
                {profile?.is_demo && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    DEMO DATA
                  </span>
                )}
                {profile?.status && getStatusBadge(profile.status)}
              </div>
              <h2 className="text-lg font-extrabold text-white mt-1 leading-snug">
                {profile?.facility_name || facilityIdentifier}
              </h2>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {profile?.state || 'India'}
                {profile?.latitude && ` • ${profile.latitude.toFixed(4)}° N, ${profile.longitude.toFixed(4)}° E`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-750 border border-transparent hover:border-dark-700 transition-all"
            title="Close facility profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top 4 KPI Row: Current FRP | Avg FRP | Active Days | Anomalies */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 pb-4 bg-dark-900 border-b border-dark-700/80 flex-shrink-0">
          <div className="bg-dark-850 border border-dark-700/80 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Current FRP
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-mono text-amber-400 tracking-tight">
                {metrics.current_frp != null ? metrics.current_frp : 'N/A'}
              </span>
              <span className="text-xs text-slate-500 font-mono">MW</span>
            </div>
          </div>

          <div className="bg-dark-850 border border-dark-700/80 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Average FRP {hasHistory ? '' : '(uncalibrated)'}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-mono text-sky-400 tracking-tight">
                {metrics.average_frp != null ? metrics.average_frp : 'N/A'}
              </span>
              <span className="text-xs text-slate-500 font-mono">MW</span>
            </div>
          </div>

          <div className="bg-dark-850 border border-dark-700/80 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Active Days
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
                {metrics.active_days ?? 0}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                / {metrics.total_observations ?? 0} passes
              </span>
            </div>
          </div>

          <div className="bg-dark-850 border border-dark-700/80 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Anomalies
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-2xl font-black font-mono tracking-tight ${
                hasHistory && (metrics.anomaly_count || 0) > 0
                  ? 'text-red-400'
                  : 'text-slate-100'
              }`}>
                {hasHistory ? (metrics.anomaly_count ?? 0) : 'N/A'}
              </span>
              {hasHistory && (
                <span className="text-xs text-slate-500 font-mono">events</span>
              )}
            </div>
          </div>
        </div>

        {/* Split Console Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {loading ? (
            <div className="col-span-12 py-16 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs">Computing empirical 30-day thermal profile...</span>
            </div>
          ) : error ? (
            <div className="col-span-12 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-xs">
              <p className="font-bold">Error loading facility profile</p>
              <p className="mt-1">{error}</p>
            </div>
          ) : profile ? (
            <>
              {/* Left Column (65%): 30-Day FRP Trend Chart */}
              <div className="md:col-span-7 space-y-3">
                {renderTrendChart()}

                {/* Interpretation Note */}
                <div className="bg-dark-850 border border-dark-700/80 rounded-xl p-3 text-xs text-slate-300">
                  <span className="font-bold text-sky-400">THERMAL INTERPRETATION: </span>
                  <span>{getInterpretationText()}</span>
                </div>
              </div>

              {/* Right Column (35%): Thermal Summary & Anomaly Context */}
              <div className="md:col-span-5 space-y-3">
                <div className="bg-dark-850 border border-dark-700/80 rounded-xl p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-dark-700 pb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      THERMAL SUMMARY
                    </span>
                    {getStatusBadge(profile.status)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Baseline Mean</span>
                      <span className="font-mono font-bold text-slate-100">
                        {metrics.average_frp != null
                          ? `${metrics.average_frp} MW ${hasHistory ? '' : '(uncalibrated)'}`
                          : 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Current Z-Score</span>
                      <span className={`font-mono font-bold ${
                        hasHistory && isAbnormal ? 'text-red-400' : 'text-slate-100'
                      }`}>
                        {hasHistory && metrics.z_score != null ? `+${metrics.z_score}σ` : 'N/A'}
                      </span>
                    </div>

                    {/* Show explicit reason when Z-score is N/A */}
                    {!hasHistory && (
                      <div className="text-[10.5px] text-amber-400/90 font-mono bg-dark-900/90 border border-dark-750 rounded p-1.5 leading-snug">
                        Reason: Insufficient historical observations
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">FRP Deviation</span>
                      <span className={`font-mono font-bold ${
                        hasHistory && (metrics.pct_deviation || 0) > 0 ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {hasHistory && metrics.pct_deviation != null
                          ? `${metrics.pct_deviation > 0 ? '+' : ''}${metrics.pct_deviation}%`
                          : 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Maximum FRP</span>
                      <span className="font-mono font-bold text-amber-400">
                        {metrics.maximum_frp != null ? `${metrics.maximum_frp} MW` : 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Std Deviation</span>
                      <span className="font-mono text-slate-300">
                        {hasHistory && metrics.std_dev_frp != null ? `±${metrics.std_dev_frp} MW` : 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Latest Observation</span>
                      <span className="font-mono text-slate-300 text-[11px]">
                        {metrics.last_detected_timestamp?.slice(0, 16).replace('T', ' ') || 'N/A'} UTC
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Bottom Action Bar */}
        <div className="px-6 py-3 border-t border-dark-700 bg-dark-850 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="text-[10px] text-slate-400 font-mono">
            {profile?.source_label || 'Empirical Thermal Baseline Engine'}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-3 bg-dark-800 hover:bg-dark-750 border border-dark-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              View Events
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onInvestigateEvent && profile) {
                  onInvestigateEvent({
                    facility_name: profile.facility_name,
                    classification: profile.classification || 'PERSISTENT_INDUSTRIAL',
                    latitude: profile.latitude,
                    longitude: profile.longitude,
                    peak_frp: metrics.maximum_frp || metrics.current_frp,
                    frp: metrics.current_frp,
                    risk_score: profile.risk_score || 75,
                    risk_level: profile.risk_level || 'HIGH',
                    is_anomaly: isAbnormal,
                    active_days: metrics.active_days,
                    detection_count: metrics.total_observations,
                    reasons: [profile.status_reason || 'Facility observation profile evaluated by decision engine.'],
                  });
                }
              }}
              className="py-1.5 px-3 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Investigate</span>
            </button>

            <a
              href={dossierUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-3 bg-dark-800 hover:bg-dark-750 border border-dark-700 text-slate-200 hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Generate Dossier</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
