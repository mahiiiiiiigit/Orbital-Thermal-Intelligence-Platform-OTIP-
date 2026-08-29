import React, { useState } from 'react';
import { Factory, Flame, FileText, ChevronRight, Gauge, Layers, Activity } from 'lucide-react';
import { TAXONOMY_COLORS } from '../constants/taxonomy';
import { RiskBadge } from './RiskBadge';
import { getDossierDownloadUrl } from '../services/api';

export function ClusterCard({ cluster, mode = 'demo', onSelectCluster, onViewFingerprint }) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (!cluster) {
    return (
      <div className="bg-white dark:bg-dark-850/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 text-center shadow-sm">
        <Factory className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2 opacity-50" />
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">No Cluster Selected</h3>
        <p className="text-xs text-slate-500 mt-1">Spatial grouping will identify persistent industrial clusters.</p>
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
    <div className="bg-white dark:bg-dark-850/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-md dark:shadow-xl backdrop-blur-md transition-colors duration-200">
      <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color }}>
              {cluster.classification}
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 leading-snug">
            {cluster.facility_name || 'Persistent Thermal Cluster'}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            {cluster.detection_count} detections across window • Center: {cluster.latitude?.toFixed(3)}°N, {cluster.longitude?.toFixed(3)}°E
          </p>
        </div>
      </div>

      {/* Smart Risk Score Card */}
      <div className="bg-slate-50 dark:bg-dark-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-sky-500" />
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Smart Risk Score
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-extrabold text-sm" style={{ color: getRiskColor(riskScore) }}>
              {riskScore} <span className="text-[10px] text-slate-400 font-normal">/ 100</span>
            </span>
            <RiskBadge level={riskLevel} />
          </div>
        </div>

        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, Math.max(5, riskScore))}%`,
              backgroundColor: getRiskColor(riskScore),
            }}
          />
        </div>

        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
          {riskExplanation}
        </p>

        {Object.keys(riskBreakdown).length > 0 && (
          <div className="pt-1 border-t border-slate-200 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="text-[10px] font-semibold text-slate-500 hover:text-sky-500 flex items-center justify-between w-full"
            >
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-sky-500" />
                <span>Contributing Factors</span>
              </span>
              <span className="font-mono text-[9px]">{showBreakdown ? '▲' : '▼'}</span>
            </button>

            {showBreakdown && (
              <div className="mt-1.5 bg-white dark:bg-dark-850 rounded p-1.5 border border-slate-200 dark:border-slate-800 space-y-0.5 text-[10px]">
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

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-50 dark:bg-dark-900/80 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Peak Radiance</span>
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">{cluster.peak_frp} MW</span>
        </div>
        <div className="bg-slate-50 dark:bg-dark-900/80 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Baseline Mean</span>
          <span className="text-sm font-bold text-sky-600 dark:text-sky-300 font-mono">
            {cluster.baseline_mean_frp ? `${cluster.baseline_mean_frp} MW` : `${cluster.mean_frp || cluster.peak_frp} MW`}
          </span>
        </div>
      </div>

      {cluster.reasons && cluster.reasons.length > 0 && (
        <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-dark-900/60 rounded-lg p-2">
          <span className="font-semibold text-slate-800 dark:text-slate-300">Cluster Rationale: </span>
          {cluster.reasons[0]}
        </div>
      )}

      {/* Facility Thermal Fingerprint Button */}
      <button
        type="button"
        onClick={() => onViewFingerprint && onViewFingerprint(cluster.facility_name || cluster.cluster_id)}
        className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-dark-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg shadow-sm transition-all"
      >
        <Activity className="w-3.5 h-3.5 text-sky-500" />
        <span>View Thermal Fingerprint</span>
      </button>

      {/* Compliance Dossier Download */}
      <a
        href={dossierUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all duration-200"
      >
        <FileText className="w-3.5 h-3.5" />
        <span>Download Compliance Dossier (PDF)</span>
      </a>
    </div>
  );
}
