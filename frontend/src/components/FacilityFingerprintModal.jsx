import React, { useState, useEffect } from 'react';
import {
  Factory,
  Activity,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Layers,
  FileText,
  X,
  Gauge,
  HelpCircle,
} from 'lucide-react';
import { fetchFacilityThermalProfile, getDossierDownloadUrl } from '../services/api';
import { RiskBadge } from './RiskBadge';
import { TAXONOMY_COLORS } from '../constants/taxonomy';

export function FacilityFingerprintModal({
  facilityIdentifier,
  mode = 'auto',
  onClose,
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ABNORMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>ABNORMAL</span>
          </span>
        );
      case 'ELEVATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40">
            <Activity className="w-3.5 h-3.5" />
            <span>ELEVATED</span>
          </span>
        );
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>NORMAL</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-500/40">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>INSUFFICIENT DATA</span>
          </span>
        );
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === 'RISING') return <TrendingUp className="w-3.5 h-3.5 text-rose-500" />;
    if (trend === 'DECLINING') return <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />;
    return <Minus className="w-3.5 h-3.5 text-slate-400" />;
  };

  // SVG Chart Calculations for 30-Day FRP Profile
  const renderTrendChart = () => {
    if (!profile || !profile.has_sufficient_history || !profile.time_series || profile.time_series.length < 3) {
      return (
        <div className="bg-slate-50 dark:bg-dark-900/60 rounded-xl p-6 text-center border border-slate-200 dark:border-slate-800">
          <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Insufficient Historical Data for Reliable Fingerprint
          </h4>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
            At least 3 orbital observation passes are required to construct an empirical statistical baseline envelope.
          </p>
        </div>
      );
    }

    const series = profile.time_series;
    const maxVal = Math.max(...series.map((s) => s.frp), (profile.normal_operating_range?.upper_3sigma_threshold_mw || 50)) * 1.15;
    const minVal = 0;

    const width = 580;
    const height = 180;
    const padding = { top: 20, right: 30, bottom: 30, left: 45 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const getX = (idx) => padding.left + (idx / (series.length - 1 || 1)) * chartW;
    const getY = (val) => padding.top + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;

    const meanY = getY(profile.metrics?.average_frp || 0);
    const normMinY = getY(profile.normal_operating_range?.min_mw || 0);
    const normMaxY = getY(profile.normal_operating_range?.max_mw || 0);

    const points = series.map((s, i) => `${getX(i)},${getY(s.frp)}`).join(' ');

    return (
      <div className="bg-slate-50 dark:bg-dark-900/80 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
            <Activity className="w-3.5 h-3.5 text-sky-500" />
            <span>30-DAY THERMAL RADIANCE PROFILE (FRP in MW)</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-emerald-500/20 border border-emerald-500/50 rounded-sm" />
              Normal Envelope
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 border-t border-dashed border-sky-400" />
              Baseline Mean
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Anomaly / Excursion
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 select-none">
            {/* Background Grid Lines */}
            <line x1={padding.left} y1={padding.top} x2={width - padding.right} y2={padding.top} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />
            <line x1={padding.left} y1={padding.top + chartH / 2} x2={width - padding.right} y2={padding.top + chartH / 2} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1" strokeDasharray="2,2" />
            <line x1={padding.left} y1={padding.top + chartH} x2={width - padding.right} y2={padding.top + chartH} stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="1" />

            {/* Shaded Normal Operating Range Corridor */}
            <rect
              x={padding.left}
              y={normMaxY}
              width={chartW}
              height={Math.max(2, normMinY - normMaxY)}
              fill="rgba(16, 185, 129, 0.08)"
              stroke="rgba(16, 185, 129, 0.25)"
              strokeWidth="1"
              strokeDasharray="3,3"
            />

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
                    stroke={isCurrent ? '#ffffff' : '#ffffff'}
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

            {/* Y-Axis Value Labels */}
            <text x={padding.left - 6} y={padding.top + 4} textAnchor="end" className="text-[9px] fill-slate-400 font-mono">
              {Math.round(maxVal)} MW
            </text>
            <text x={padding.left - 6} y={meanY + 3} textAnchor="end" className="text-[9px] fill-sky-400 font-mono font-bold">
              {profile.metrics?.average_frp}
            </text>
            <text x={padding.left - 6} y={padding.top + chartH + 3} textAnchor="end" className="text-[9px] fill-slate-400 font-mono">
              0 MW
            </text>

            {/* X-Axis Date Labels */}
            {series.length > 0 && (
              <>
                <text x={padding.left} y={height - 8} textAnchor="start" className="text-[9px] fill-slate-400 font-mono">
                  {series[0].date}
                </text>
                <text x={padding.left + chartW / 2} y={height - 8} textAnchor="middle" className="text-[9px] fill-slate-400 font-mono">
                  Observation Timeline
                </text>
                <text x={width - padding.right} y={height - 8} textAnchor="end" className="text-[9px] fill-slate-400 font-mono font-bold text-amber-500">
                  Latest: {series[series.length - 1].date}
                </text>
              </>
            )}
          </svg>

          {/* Point Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none bg-slate-900/95 text-white text-[10px] p-2 rounded-lg shadow-xl border border-slate-700 -translate-x-1/2 -translate-y-full mb-2 font-mono z-20 space-y-0.5"
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/80 dark:bg-dark-900/60">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ backgroundColor: `${color}25`, border: `1px solid ${color}60` }}
            >
              <Factory className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
                  {profile?.classification || 'FACILITY PROFILE'}
                </span>
                {profile?.is_demo && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40">
                    DEMO DATA
                  </span>
                )}
                {profile?.risk_level && <RiskBadge level={profile.risk_level} />}
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {profile?.facility_name || facilityIdentifier}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {profile?.category || 'Industrial Site'} • {profile?.state || 'India'}
                {profile?.latitude && ` • ${profile.latitude.toFixed(4)}°N, ${profile.longitude.toFixed(4)}°E`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 space-y-3.5 overflow-y-auto flex-1 text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Generating empirical thermal fingerprint...</span>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-500 dark:text-red-400">
              <p className="font-bold">Error loading profile</p>
              <p className="text-[11px] mt-1">{error}</p>
            </div>
          ) : profile ? (
            <>
              {/* Status & Explainable Reason Banner */}
              <div className="bg-slate-50 dark:bg-dark-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    THERMAL STATUS
                  </span>
                  {getStatusBadge(profile.status)}
                </div>
                <div className="pt-1 text-[11.5px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  <span className="font-bold text-sky-600 dark:text-sky-400">WHY? </span>
                  {profile.status_reason}
                </div>
              </div>

              {/* Key Metrics 8-Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-50 dark:bg-dark-900/70 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Average FRP</span>
                  <span className="text-sm font-bold text-sky-600 dark:text-sky-400 font-mono">
                    {profile.metrics?.average_frp ?? 'N/A'} MW
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-dark-900/70 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Current FRP</span>
                  <span className="text-sm font-bold text-amber-500 dark:text-amber-400 font-mono">
                    {profile.metrics?.current_frp ?? 'N/A'} MW
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-dark-900/70 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Maximum FRP</span>
                  <span className="text-sm font-bold text-rose-500 font-mono">
                    {profile.metrics?.maximum_frp ?? 'N/A'} MW
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-dark-900/70 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Active Days</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {profile.metrics?.active_days ?? 0} / {profile.metrics?.total_observations ?? 0}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-dark-900/70 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Current Z-Score</span>
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400 font-mono">
                    {profile.metrics?.z_score !== undefined ? `+${profile.metrics.z_score}σ` : 'N/A'}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-dark-900/70 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Anomalies Detected</span>
                  <span className="text-sm font-bold text-red-500 font-mono">
                    {profile.metrics?.anomaly_count ?? 0}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-dark-900/70 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Recent Trend</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono flex items-center gap-1 mt-0.5">
                    {getTrendIcon(profile.metrics?.trend_direction)}
                    <span>{profile.metrics?.trend_direction || 'STABLE'}</span>
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-dark-900/70 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Normal Range</span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {profile.normal_operating_range
                      ? `${profile.normal_operating_range.min_mw} – ${profile.normal_operating_range.max_mw} MW`
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {/* 30-Day FRP Trend Chart */}
              {renderTrendChart()}

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                <span className="text-slate-400 font-mono text-[10px]">
                  {profile.source_label}
                </span>
                <a
                  href={getDossierDownloadUrl(profile.facility_id || 'jamnagar-refinery', mode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download Full Compliance Dossier (PDF)</span>
                </a>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
