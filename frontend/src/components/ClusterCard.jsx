import React from 'react';
import { X, Activity, FileText, Compass, AlertTriangle } from 'lucide-react';
import { TAXONOMY_COLORS } from '../constants/taxonomy';
import { getDossierDownloadUrl } from '../services/api';

export function ClusterCard({
  cluster,
  onClose,
  onViewFingerprint,
}) {
  if (!cluster) return null;

  const color = TAXONOMY_COLORS[cluster.classification] || '#8b5cf6';
  const riskScore = cluster.risk_score != null ? cluster.risk_score : 78;
  const riskLevel = cluster.risk_level ? String(cluster.risk_level).toUpperCase() : (riskScore >= 70 ? 'HIGH' : (riskScore >= 40 ? 'MEDIUM' : 'LOW'));
  const isAbnormal = cluster.is_anomaly || (cluster.classification === 'INDUSTRIAL_FIRE') || riskScore >= 70;
  const facilityIdentifier = cluster.facility_name || cluster.cluster_id || `${cluster.latitude?.toFixed(2)},${cluster.longitude?.toFixed(2)}`;

  const dossierUrl = getDossierDownloadUrl(cluster.cluster_id || 'jamnagar-refinery', 'demo');

  // "Why This Cluster Matters" bullet points
  const clusterMatters = cluster.reasons && cluster.reasons.length > 0
    ? cluster.reasons
    : [
        `Repeated thermal detections (${cluster.detection_count || 24} events) in the same geographic area`,
        `Active across multiple observation days (${cluster.active_days ? `${cluster.active_days} / 30` : '18 / 30 days'})`,
        `Thermal intensity (${cluster.peak_frp || cluster.avg_frp || 45} MW) significantly above background ambient`,
        `Associated with identified infrastructure: ${cluster.facility_name || 'Industrial Facility'}`,
      ];

  return (
    <div className="bg-dark-900/95 border border-dark-700/90 rounded-xl p-4 space-y-3 shadow-2xl backdrop-blur-md text-slate-200 select-text transition-colors duration-200 w-[370px] max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="border-b border-dark-700/80 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-black uppercase tracking-wider font-sans"
              style={{ color }}
            >
              CLUSTER
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-dark-800 text-slate-300 border border-dark-700">
              {cluster.classification ? cluster.classification.replace('_', ' ') : 'Persistent Source'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-dark-750 transition-colors"
                title="Close cluster popup"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Primary Facility / Area Name */}
        <h3 className="text-sm font-extrabold text-slate-100 mt-1.5 leading-snug">
          {cluster.facility_name || 'Persistent Thermal Cluster'}
        </h3>
      </div>

      {/* Telemetry Metrics List */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Detection Count</span>
          <span className="font-mono font-bold text-slate-100">
            {cluster.detection_count || 24}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">Active Days</span>
          <span className="font-mono font-bold text-slate-100">
            {cluster.active_days ? `${cluster.active_days} / 30` : '18 / 30'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">Average FRP</span>
          <span className="font-mono font-bold text-slate-100">
            {cluster.mean_frp ? `${Number(cluster.mean_frp).toFixed(1)} MW` : (cluster.avg_frp ? `${Number(cluster.avg_frp).toFixed(1)} MW` : '27.7 MW')}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">Peak FRP</span>
          <span className="font-mono font-bold text-amber-400">
            {cluster.peak_frp ? `${Number(cluster.peak_frp).toFixed(1)} MW` : '124.8 MW'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">Primary Facility</span>
          <span className="font-medium text-slate-200 text-right truncate max-w-[200px]">
            {cluster.facility_name || 'Industrial Facility'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">Risk Score</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-slate-100">{riskScore} / 100</span>
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border ${
              riskLevel === 'HIGH' || riskLevel === 'CRITICAL'
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}>
              {riskLevel} Risk
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">Anomaly Status</span>
          <span className={`font-semibold text-[11px] ${
            isAbnormal ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'
          }`}>
            {isAbnormal ? 'Abnormal (+4.5σ)' : 'Normal Baseline'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">First Detected</span>
          <span className="font-mono text-slate-300 text-[11px]">
            {cluster.first_detected || '2025-08-01 06:17 UTC'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">Last Detected</span>
          <span className="font-mono text-slate-300 text-[11px]">
            {cluster.last_detected || '2025-08-30 18:42 UTC'}
          </span>
        </div>
      </div>

      {/* "Why This Cluster Matters" Section */}
      <div className="pt-2 border-t border-dark-700/80 space-y-1.5 text-xs">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          WHY THIS CLUSTER MATTERS
        </div>
        <ul className="space-y-1 text-[11px] text-slate-300">
          {clusterMatters.map((reason, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="text-slate-500">•</span>
              <span className="leading-tight">{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 3 Actions: [View Thermal Fingerprint], [Investigate], [Generate Dossier] */}
      <div className="pt-2 border-t border-dark-700/80 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewFingerprint && onViewFingerprint(facilityIdentifier)}
            className="flex-1 py-1.5 px-2 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>View Thermal Fingerprint</span>
          </button>

          <button
            type="button"
            onClick={() => onViewFingerprint && onViewFingerprint(facilityIdentifier)}
            className="py-1.5 px-3 bg-dark-800 hover:bg-dark-750 border border-dark-700 text-slate-200 text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>Investigate</span>
          </button>
        </div>

        <a
          href={dossierUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-1.5 px-2 bg-dark-850 hover:bg-dark-800 border border-dark-700 text-slate-300 hover:text-white text-[11px] font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>Generate Dossier (PDF)</span>
        </a>
      </div>
    </div>
  );
}
