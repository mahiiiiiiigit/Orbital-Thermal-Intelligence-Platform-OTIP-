import React, { useState } from 'react';
import { Factory, FileText, Gauge, Layers, Activity, Compass, Clock, AlertTriangle } from 'lucide-react';
import { TAXONOMY_COLORS } from '../constants/taxonomy';
import { RiskBadge } from './RiskBadge';
import { getDossierDownloadUrl } from '../services/api';

export function ClusterCard({ cluster, mode = 'demo', onClose, onViewFingerprint }) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (!cluster) {
    return (
      <div className="bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700/80 rounded-xl p-4 text-center shadow-sm">
        <Factory className="w-6 h-6 text-slate-400 dark:text-slate-600 mx-auto mb-1.5 opacity-50" />
        <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400">No Cluster Selected</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">Select a cluster on the map or overview sidebar.</p>
      </div>
    );
  }

  const color = TAXONOMY_COLORS[cluster.classification] || '#8b5cf6';
  const dossierUrl = getDossierDownloadUrl(cluster.cluster_id || 'jamnagar-refinery', mode);

  const riskScore = cluster.risk_score != null ? cluster.risk_score : 45.0;
  const riskLevel = cluster.risk_level ? String(cluster.risk_level).toUpperCase() : (riskScore >= 75 ? 'CRITICAL' : (riskScore >= 50 ? 'HIGH' : (riskScore >= 25 ? 'MEDIUM' : 'LOW')));
  const riskBreakdown = cluster.risk_breakdown || {};
  const riskExplanation = cluster.risk_explanation || `${riskLevel} risk cluster evaluated by spatial intelligence engine.`;

  const getRiskColor = (score) => {
    if (score >= 75) return '#ef4444';
    if (score >= 50) return '#f97316';
    if (score >= 25) return '#eab308';
    return '#10b981';
  };

  return (
    <div className="bg-white/95 dark:bg-dark-850/95 border border-slate-300 dark:border-dark-700/90 rounded-xl p-3.5 space-y-3 shadow-2xl backdrop-blur-md transition-colors duration-200 select-text">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-dark-700/80 pb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color }}>
              {cluster.classification}
            </span>
          </div>
          <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
            {cluster.facility_name || 'Persistent Thermal Cluster'}
          </h3>
          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-1">
            <Compass className="w-3 h-3 text-slate-400" />
            <span>Center: {cluster.latitude?.toFixed(3)}°N, {cluster.longitude?.toFixed(3)}°E</span>
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <RiskBadge level={riskLevel} />
        </div>
      </div>

      {/* Grouped Telemetry 4-Cell Grid */}
      <div className="bg-slate-50 dark:bg-dark-900/80 border border-slate-200 dark:border-dark-700/80 rounded-lg p-2.5 text-xs space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-medium">Detection Count</span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-mono">{cluster.detection_count} passes</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-medium">Active Days</span>
            <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400 font-mono">{cluster.active_days || '3+'} days</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-medium">Peak Radiance</span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">{cluster.peak_frp} MW</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-medium">Mean Baseline</span>
            <span className="text-xs font-bold text-sky-600 dark:text-sky-300 font-mono">
              {cluster.baseline_mean_frp ? `${cluster.baseline_mean_frp} MW` : `${cluster.mean_frp?.toFixed(1) || cluster.peak_frp} MW`}
            </span>
          </div>
        </div>
      </div>

      {/* Smart Risk Score */}
      <div className="bg-slate-50 dark:bg-dark-900/80 border border-slate-200 dark:border-dark-700/80 rounded-lg p-2.5 space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-sky-500" />
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Cluster Risk Score
            </span>
          </div>
          <span className="font-mono font-extrabold text-xs" style={{ color: getRiskColor(riskScore) }}>
            {riskScore} <span className="text-[9px] text-slate-400 font-normal">/ 100</span>
          </span>
        </div>

        <div className="w-full bg-slate-200 dark:bg-dark-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, Math.max(5, riskScore))}%`,
              backgroundColor: getRiskColor(riskScore),
            }}
          />
        </div>

        <p className="text-[10.5px] text-slate-600 dark:text-slate-400 leading-snug">
          {riskExplanation}
        </p>

        {Object.keys(riskBreakdown).length > 0 && (
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="text-[10px] font-semibold text-slate-500 hover:text-sky-500 flex items-center justify-between w-full"
            >
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-sky-500" />
                <span>Risk Factors</span>
              </span>
              <span className="font-mono text-[9px] text-sky-500">{showBreakdown ? '▲ Hide' : '▼ View'}</span>
            </button>

            {showBreakdown && (
              <div className="mt-1 bg-white dark:bg-dark-850 rounded p-1.5 border border-slate-200 dark:border-dark-700 space-y-0.5 text-[10px]">
                {Object.entries(riskBreakdown).map(([factor, pts]) => (
                  <div key={factor} className="flex justify-between items-center">
                    <span className="text-slate-500">{factor}:</span>
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400">+{pts}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-1 border-t border-slate-200 dark:border-dark-700/80 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onViewFingerprint && onViewFingerprint(cluster.facility_name || cluster.cluster_id)}
          className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 border border-slate-300 dark:border-dark-700 text-slate-800 dark:text-slate-200 text-[10.5px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Activity className="w-3 h-3 text-sky-500" />
          <span>Thermal Fingerprint</span>
        </button>

        <a
          href={dossierUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-1.5 px-2.5 bg-sky-600 hover:bg-sky-500 text-white text-[10.5px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
        >
          <FileText className="w-3 h-3" />
          <span>Dossier</span>
        </a>
      </div>
    </div>
  );
}
