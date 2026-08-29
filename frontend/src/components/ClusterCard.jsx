import React from 'react';
import { Factory, Flame, FileText, ChevronRight } from 'lucide-react';
import { TAXONOMY_COLORS } from '../constants/taxonomy';
import { getDossierDownloadUrl } from '../services/api';

export function ClusterCard({ cluster, mode = 'demo', onSelectCluster }) {
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

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-50 dark:bg-dark-900/80 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Peak Radiance</span>
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">{cluster.peak_frp} MW</span>
        </div>
        <div className="bg-slate-50 dark:bg-dark-900/80 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Baseline Mean</span>
          <span className="text-sm font-bold text-sky-600 dark:text-sky-300 font-mono">
            {cluster.baseline_mean_frp ? `${cluster.baseline_mean_frp} MW` : `${cluster.peak_frp} MW`}
          </span>
        </div>
      </div>

      {cluster.reasons && cluster.reasons.length > 0 && (
        <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-dark-900/60 rounded-lg p-2">
          <span className="font-semibold text-slate-800 dark:text-slate-300">Cluster Rationale: </span>
          {cluster.reasons[0]}
        </div>
      )}

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
